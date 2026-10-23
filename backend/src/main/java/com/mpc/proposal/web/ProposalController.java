package com.mpc.proposal.web;

import com.mpc.proposal.service.ProposalService;
import com.mpc.proposal.web.dto.ProposalRequest;
import com.mpc.proposal.web.dto.ProposalResponse;
import com.mpc.proposal.web.dto.ProposalStatusUpdateRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/proposals")
public class ProposalController {

    private final ProposalService proposalService;

    public ProposalController(ProposalService proposalService) {
        this.proposalService = proposalService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProposalResponse create(@Valid @RequestBody ProposalRequest request, Authentication authentication) {
        return proposalService.createProposal(authentication.getName(), request);
    }

    @PostMapping("/from-analysis/{analysisId}")
    @ResponseStatus(HttpStatus.CREATED)
    public ProposalResponse createFromAnalysis(@PathVariable Long analysisId,
                                               @RequestParam(required = false) String name,
                                               Authentication authentication) {
        return proposalService.createProposalFromAnalysis(authentication.getName(), analysisId, name);
    }

    @GetMapping
    public List<ProposalResponse> list(Authentication authentication) {
        return proposalService.getUserProposals(authentication.getName());
    }

    @GetMapping("/{id}")
    public ProposalResponse get(@PathVariable Long id, Authentication authentication) {
        return proposalService.getProposalById(authentication.getName(), id);
    }

    @PatchMapping("/{id}/status")
    public ProposalResponse updateStatus(@PathVariable Long id,
                                         @Valid @RequestBody ProposalStatusUpdateRequest request,
                                         Authentication authentication) {
        return proposalService.updateProposalStatus(authentication.getName(), id, request.getStatus());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, Authentication authentication) {
        proposalService.deleteProposal(authentication.getName(), id);
    }
}
