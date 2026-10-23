package com.mpc.proposal.web.dto;

import com.mpc.proposal.domain.ProposalStatus;
import jakarta.validation.constraints.NotNull;

public class ProposalStatusUpdateRequest {

    @NotNull(message = "Status is required")
    private ProposalStatus status;

    public ProposalStatusUpdateRequest() {
    }

    public ProposalStatusUpdateRequest(ProposalStatus status) {
        this.status = status;
    }

    public ProposalStatus getStatus() {
        return status;
    }

    public void setStatus(ProposalStatus status) {
        this.status = status;
    }
}
