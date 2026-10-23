package com.mpc.proposal.web.dto;

import com.mpc.proposal.domain.ProposalStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class ProposalRequest {

    @NotBlank(message = "Proposal name is required")
    private String proposalName;

    @NotNull(message = "Analysis reference is required")
    private Long analysisId;

    private Double systemSize;
    private Double cost;
    private Double roi;
    private ProposalStatus status;

    public ProposalRequest() {
    }

    public ProposalRequest(String proposalName, Long analysisId, Double systemSize, Double cost, Double roi, ProposalStatus status) {
        this.proposalName = proposalName;
        this.analysisId = analysisId;
        this.systemSize = systemSize;
        this.cost = cost;
        this.roi = roi;
        this.status = status;
    }

    public String getProposalName() {
        return proposalName;
    }

    public void setProposalName(String proposalName) {
        this.proposalName = proposalName;
    }

    public Long getAnalysisId() {
        return analysisId;
    }

    public void setAnalysisId(Long analysisId) {
        this.analysisId = analysisId;
    }

    public Double getSystemSize() {
        return systemSize;
    }

    public void setSystemSize(Double systemSize) {
        this.systemSize = systemSize;
    }

    public Double getCost() {
        return cost;
    }

    public void setCost(Double cost) {
        this.cost = cost;
    }

    public Double getRoi() {
        return roi;
    }

    public void setRoi(Double roi) {
        this.roi = roi;
    }

    public ProposalStatus getStatus() {
        return status;
    }

    public void setStatus(ProposalStatus status) {
        this.status = status;
    }
}
