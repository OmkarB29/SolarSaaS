package com.mpc.user.web.dto;

public class UserDashboardSummaryDTO {

    private long totalAnalyses;
    private long totalProposals;
    private long reportsGenerated;
    private long emailsSent;

    public UserDashboardSummaryDTO() {
    }

    public UserDashboardSummaryDTO(long totalAnalyses, long totalProposals, long reportsGenerated, long emailsSent) {
        this.totalAnalyses = totalAnalyses;
        this.totalProposals = totalProposals;
        this.reportsGenerated = reportsGenerated;
        this.emailsSent = emailsSent;
    }

    public long getTotalAnalyses() {
        return totalAnalyses;
    }

    public void setTotalAnalyses(long totalAnalyses) {
        this.totalAnalyses = totalAnalyses;
    }

    public long getTotalProposals() {
        return totalProposals;
    }

    public void setTotalProposals(long totalProposals) {
        this.totalProposals = totalProposals;
    }

    public long getReportsGenerated() {
        return reportsGenerated;
    }

    public void setReportsGenerated(long reportsGenerated) {
        this.reportsGenerated = reportsGenerated;
    }

    public long getEmailsSent() {
        return emailsSent;
    }

    public void setEmailsSent(long emailsSent) {
        this.emailsSent = emailsSent;
    }
}
