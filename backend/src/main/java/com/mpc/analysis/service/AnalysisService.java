package com.mpc.analysis.service;

import com.mpc.analysis.domain.Analysis;
import com.mpc.analysis.repository.AnalysisRepository;
import com.mpc.analysis.web.dto.AnalysisRequest;
import com.mpc.analysis.web.dto.AnalysisResponse;
import com.mpc.user.domain.User;
import com.mpc.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class AnalysisService {

    private final AnalysisRepository analysisRepository;
    private final UserRepository userRepository;

    public AnalysisService(AnalysisRepository analysisRepository, UserRepository userRepository) {
        this.analysisRepository = analysisRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public AnalysisResponse saveAnalysis(String email, AnalysisRequest request) {
        User user = getUser(email);
        Analysis analysis = new Analysis();
        analysis.setUser(user);
        analysis.setLocationName(request.getLocationName());
        analysis.setLatitude(request.getLatitude());
        analysis.setLongitude(request.getLongitude());
        analysis.setRoofArea(request.getRoofArea());
        analysis.setEstimatedPanels(request.getEstimatedPanels());
        analysis.setMonthlyGeneration(request.getMonthlyGeneration());
        analysis.setInstallationCost(request.getInstallationCost());
        analysis.setRoi(request.getRoi());
        analysis.setCo2Reduction(request.getCo2Reduction());
        analysis.setUsableArea(defaultNumber(request.getUsableArea()));
        analysis.setSystemSize(defaultNumber(request.getSystemSize()));
        analysis.setAnnualGeneration(defaultNumber(request.getYearlyGeneration()));
        analysis.setAnnualSavings(defaultNumber(request.getYearlySavings()));
        analysis.setPaybackPeriod(defaultNumber(request.getPaybackPeriod()));

        return toResponse(analysisRepository.save(analysis));
    }

    @Transactional(readOnly = true)
    public List<AnalysisResponse> getUserAnalyses(String email) {
        User user = getUser(email);
        return analysisRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public AnalysisResponse getAnalysisById(String email, Long id) {
        User user = getUser(email);
        return analysisRepository.findByIdAndUserId(id, user.getId())
                .map(this::toResponse)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Analysis not found"));
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user not found"));
    }

    private Double defaultNumber(Double value) {
        return value == null ? 0 : value;
    }

    private AnalysisResponse toResponse(Analysis analysis) {
        return new AnalysisResponse(
                analysis.getId(),
                analysis.getUser().getId(),
                analysis.getLocationName(),
                analysis.getLatitude(),
                analysis.getLongitude(),
                analysis.getRoofArea(),
                analysis.getEstimatedPanels(),
                analysis.getMonthlyGeneration(),
                analysis.getInstallationCost(),
                analysis.getRoi(),
                analysis.getCo2Reduction(),
                analysis.getCreatedAt());
    }
}
