package com.mpc.paneloptimizer.web.dto;

import java.time.Instant;

public class PanelLayoutDTO {

    private Long id;
    private Long userId;
    private Long analysisId;
    private Double roofArea;
    private Double usableArea;
    private Integer panelCount;
    private Double systemCapacityKw;
    private Double annualGenerationKwh;
    private Double roofUtilizationPercent;
    private Double optimizationScore;
    private String layoutMode;
    private String layoutJson;
    private Instant createdAt;

    public PanelLayoutDTO() {
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

    public Double getRoofArea() {
        return roofArea;
    }

    public void setRoofArea(Double roofArea) {
        this.roofArea = roofArea;
    }

    public Double getUsableArea() {
        return usableArea;
    }

    public void setUsableArea(Double usableArea) {
        this.usableArea = usableArea;
    }

    public Integer getPanelCount() {
        return panelCount;
    }

    public void setPanelCount(Integer panelCount) {
        this.panelCount = panelCount;
    }

    public Double getSystemCapacityKw() {
        return systemCapacityKw;
    }

    public void setSystemCapacityKw(Double systemCapacityKw) {
        this.systemCapacityKw = systemCapacityKw;
    }

    public Double getAnnualGenerationKwh() {
        return annualGenerationKwh;
    }

    public void setAnnualGenerationKwh(Double annualGenerationKwh) {
        this.annualGenerationKwh = annualGenerationKwh;
    }

    public Double getRoofUtilizationPercent() {
        return roofUtilizationPercent;
    }

    public void setRoofUtilizationPercent(Double roofUtilizationPercent) {
        this.roofUtilizationPercent = roofUtilizationPercent;
    }

    public Double getOptimizationScore() {
        return optimizationScore;
    }

    public void setOptimizationScore(Double optimizationScore) {
        this.optimizationScore = optimizationScore;
    }

    public String getLayoutMode() {
        return layoutMode;
    }

    public void setLayoutMode(String layoutMode) {
        this.layoutMode = layoutMode;
    }

    public String getLayoutJson() {
        return layoutJson;
    }

    public void setLayoutJson(String layoutJson) {
        this.layoutJson = layoutJson;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
