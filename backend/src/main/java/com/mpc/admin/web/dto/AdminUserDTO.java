package com.mpc.admin.web.dto;

import java.time.Instant;

public class AdminUserDTO {
    private Long id;
    private String username;
    private String email;
    private String role;
    private long analysisCount;
    private long reportCount;
    private Instant createdAt;

    public AdminUserDTO(Long id, String username, String email, String role, 
                        long analysisCount, long reportCount, Instant createdAt) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.role = role;
        this.analysisCount = analysisCount;
        this.reportCount = reportCount;
        this.createdAt = createdAt;
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

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
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

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
