package com.mpc.proposal.web.dto;

import com.mpc.proposal.domain.ProposalStatus;

import java.time.Instant;

public class ProposalResponse {

    private Long id;
    private Long userId;
    private Long analysisId;
    private String locationName;
    private String proposalName;
    private Double systemSize;
    private Double cost;
    private Double roi;
    private ProposalStatus status;
    private Instant createdAt;
    private Instant updatedAt;

    public ProposalResponse() {
    }

    public ProposalResponse(Long id, Long userId, Long analysisId, String locationName, String proposalName,
                            Double systemSize, Double cost, Double roi, ProposalStatus status,
                            Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.userId = userId;
        this.analysisId = analysisId;
        this.locationName = locationName;
        this.proposalName = proposalName;
        this.systemSize = systemSize;
        this.cost = cost;
        this.roi = roi;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getAnalysisId() {
        return analysisId;
    }

    public void setAnalysisId(Long analysisId) {
        this.analysisId = analysisId;
    }

    public String getLocationName() {
        return locationName;
    }

    public void setLocationName(String locationName) {
        this.locationName = locationName;
    }

    public String getProposalName() {
        return proposalName;
    }

    public void setProposalName(String proposalName) {
        this.proposalName = proposalName;
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

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
