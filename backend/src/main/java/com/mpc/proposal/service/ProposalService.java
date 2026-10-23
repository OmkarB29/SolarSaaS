package com.mpc.proposal.service;

import com.mpc.analysis.domain.Analysis;
import com.mpc.analysis.repository.AnalysisRepository;
import com.mpc.proposal.domain.Proposal;
import com.mpc.proposal.domain.ProposalStatus;
import com.mpc.proposal.repository.ProposalRepository;
import com.mpc.proposal.web.dto.ProposalRequest;
import com.mpc.proposal.web.dto.ProposalResponse;
import com.mpc.user.domain.User;
import com.mpc.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ProposalService {

    private final ProposalRepository proposalRepository;
    private final AnalysisRepository analysisRepository;
    private final UserRepository userRepository;

    public ProposalService(ProposalRepository proposalRepository,
                           AnalysisRepository analysisRepository,
                           UserRepository userRepository) {
        this.proposalRepository = proposalRepository;
        this.analysisRepository = analysisRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public ProposalResponse createProposal(String email, ProposalRequest request) {
        User user = getUser(email);
        Analysis analysis = getAnalysisAndValidateOwnership(request.getAnalysisId(), user.getId());

        double systemSize = request.getSystemSize() != null && request.getSystemSize() > 0
                ? request.getSystemSize()
                : (analysis.getSystemSize() != null && analysis.getSystemSize() > 0 ? analysis.getSystemSize() : (analysis.getEstimatedPanels() != null ? analysis.getEstimatedPanels() * 0.4 : 5.0));

        double cost = request.getCost() != null && request.getCost() > 0
                ? request.getCost()
                : (analysis.getInstallationCost() != null ? analysis.getInstallationCost() : 0.0);

        double roi = request.getRoi() != null
                ? request.getRoi()
                : (analysis.getRoi() != null ? analysis.getRoi() : 0.0);

        ProposalStatus status = request.getStatus() != null ? request.getStatus() : ProposalStatus.DRAFT;

        Proposal proposal = new Proposal(user, analysis, request.getProposalName(), systemSize, cost, roi, status);
        Proposal saved = proposalRepository.save(proposal);

        return toResponse(saved);
    }

    @Transactional
    public ProposalResponse createProposalFromAnalysis(String email, Long analysisId, String customName) {
        User user = getUser(email);
        Analysis analysis = getAnalysisAndValidateOwnership(analysisId, user.getId());

        String name = customName != null && !customName.trim().isEmpty()
                ? customName.trim()
                : "Proposal - " + (analysis.getLocationName() != null ? analysis.getLocationName() : "Rooftop");

        double systemSize = analysis.getSystemSize() != null && analysis.getSystemSize() > 0
                ? analysis.getSystemSize()
                : (analysis.getEstimatedPanels() != null ? analysis.getEstimatedPanels() * 0.4 : 5.0);

        double cost = analysis.getInstallationCost() != null ? analysis.getInstallationCost() : 0.0;
        double roi = analysis.getRoi() != null ? analysis.getRoi() : 0.0;

        Proposal proposal = new Proposal(user, analysis, name, systemSize, cost, roi, ProposalStatus.DRAFT);
        Proposal saved = proposalRepository.save(proposal);

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ProposalResponse> getUserProposals(String email) {
        User user = getUser(email);
        return proposalRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProposalResponse getProposalById(String email, Long id) {
        User user = getUser(email);
        return proposalRepository.findByIdAndUserId(id, user.getId())
                .map(this::toResponse)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Proposal not found"));
    }

    @Transactional
    public ProposalResponse updateProposalStatus(String email, Long id, ProposalStatus newStatus) {
        User user = getUser(email);
        Proposal proposal = proposalRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Proposal not found"));

        proposal.setStatus(newStatus);
        Proposal updated = proposalRepository.save(proposal);
        return toResponse(updated);
    }

    @Transactional
    public void deleteProposal(String email, Long id) {
        User user = getUser(email);
        Proposal proposal = proposalRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Proposal not found"));

        proposalRepository.delete(proposal);
    }

    @Transactional(readOnly = true)
    public long getUserProposalCount(String email) {
        User user = getUser(email);
        return proposalRepository.countByUserId(user.getId());
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user not found"));
    }

    private Analysis getAnalysisAndValidateOwnership(Long analysisId, Long userId) {
        return analysisRepository.findByIdAndUserId(analysisId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Analysis not found or does not belong to user"));
    }

    private ProposalResponse toResponse(Proposal proposal) {
        return new ProposalResponse(
                proposal.getId(),
                proposal.getUser().getId(),
                proposal.getAnalysis().getId(),
                proposal.getAnalysis().getLocationName(),
                proposal.getProposalName(),
                proposal.getSystemSize(),
                proposal.getCost(),
                proposal.getRoi(),
                proposal.getStatus(),
                proposal.getCreatedAt(),
                proposal.getUpdatedAt()
        );
    }
}
