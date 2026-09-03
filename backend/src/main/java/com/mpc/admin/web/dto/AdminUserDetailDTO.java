package com.mpc.admin.web.dto;

import java.time.Instant;

public class AdminUserDetailDTO {
    private Long id;
    private String username;
    private String email;
    private String role;
    private Instant createdAt;
    private long analysisCount;
    private long reportCount;
    private double totalAnnualGeneration;
    private double averageROI;
    private Instant lastActivityAt;

    public AdminUserDetailDTO() {
    }

    public AdminUserDetailDTO(Long id, String username, String email, String role, Instant createdAt,
                              long analysisCount, long reportCount, double totalAnnualGeneration,
                              double averageROI, Instant lastActivityAt) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.role = role;
        this.createdAt = createdAt;
        this.analysisCount = analysisCount;
        this.reportCount = reportCount;
        this.totalAnnualGeneration = totalAnnualGeneration;
        this.averageROI = averageROI;
        this.lastActivityAt = lastActivityAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public long getAnalysisCount() {
        return analysisCount;
    }

    public void setAnalysisCount(long analysisCount) {
        this.analysisCount = analysisCount;
    }

    public long getReportCount() {
        return reportCount;
    }

    public void setReportCount(long reportCount) {
        this.reportCount = reportCount;
    }

    public double getTotalAnnualGeneration() {
        return totalAnnualGeneration;
    }

    public void setTotalAnnualGeneration(double totalAnnualGeneration) {
        this.totalAnnualGeneration = totalAnnualGeneration;
    }

    public double getAverageROI() {
        return averageROI;
    }

    public void setAverageROI(double averageROI) {
        this.averageROI = averageROI;
    }

    public Instant getLastActivityAt() {
        return lastActivityAt;
    }

    public void setLastActivityAt(Instant lastActivityAt) {
        this.lastActivityAt = lastActivityAt;
    }
}
