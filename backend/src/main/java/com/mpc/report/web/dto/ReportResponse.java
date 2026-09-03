package com.mpc.report.web.dto;

import java.time.Instant;

public class ReportResponse {

    private final Long id;
    private final String reportName;
    private final String reportType;
    private final Instant generatedAt;
    private final String filePath;
    private final Long analysisId;
    private final Instant createdAt;

    public ReportResponse(Long id,
                          String reportName,
                          String reportType,
                          Instant generatedAt,
                          String filePath,
                          Long analysisId,
                          Instant createdAt) {
        this.id = id;
        this.reportName = reportName;
        this.reportType = reportType;
        this.generatedAt = generatedAt;
        this.filePath = filePath;
        this.analysisId = analysisId;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public String getReportName() {
        return reportName;
    }

    public String getReportType() {
        return reportType;
    }

    public Instant getGeneratedAt() {
        return generatedAt;
    }

    public String getFilePath() {
        return filePath;
    }

    public Long getAnalysisId() {
        return analysisId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}