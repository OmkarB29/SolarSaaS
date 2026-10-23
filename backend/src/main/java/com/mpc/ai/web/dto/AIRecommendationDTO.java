package com.mpc.ai.web.dto;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class AIRecommendationDTO {
    private Long id;
    private Long analysisId;
    private Double solarScore;
    private Double annualGeneration;
    private Double annualSavings;
    private Double paybackPeriod;
    private String installationAssessment;
    private String financialAssessment;
    private String batteryRecommendation;
    private String riskAssessment;
    private String executiveSummary;
    private List<String> recommendations = new ArrayList<>();
    private List<ActionPlanStepDTO> actionPlan = new ArrayList<>();
    private Instant generatedAt;
    private Instant createdAt;

    public AIRecommendationDTO() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getAnalysisId() {
        return analysisId;
    }

    public void setAnalysisId(Long analysisId) {
        this.analysisId = analysisId;
    }

    public Double getSolarScore() {
        return solarScore;
    }

    public void setSolarScore(Double solarScore) {
        this.solarScore = solarScore;
    }

    public Double getAnnualGeneration() {
        return annualGeneration;
    }

    public void setAnnualGeneration(Double annualGeneration) {
        this.annualGeneration = annualGeneration;
    }

    public Double getAnnualSavings() {
        return annualSavings;
    }

    public void setAnnualSavings(Double annualSavings) {
        this.annualSavings = annualSavings;
    }

    public Double getPaybackPeriod() {
        return paybackPeriod;
    }

    public void setPaybackPeriod(Double paybackPeriod) {
        this.paybackPeriod = paybackPeriod;
    }

    public String getInstallationAssessment() {
        return installationAssessment;
    }

    public void setInstallationAssessment(String installationAssessment) {
        this.installationAssessment = installationAssessment;
    }

    public String getFinancialAssessment() {
        return financialAssessment;
    }

    public void setFinancialAssessment(String financialAssessment) {
        this.financialAssessment = financialAssessment;
    }

    public String getBatteryRecommendation() {
        return batteryRecommendation;
    }

    public void setBatteryRecommendation(String batteryRecommendation) {
        this.batteryRecommendation = batteryRecommendation;
    }

    public String getRiskAssessment() {
        return riskAssessment;
    }

    public void setRiskAssessment(String riskAssessment) {
        this.riskAssessment = riskAssessment;
    }

    public String getExecutiveSummary() {
        return executiveSummary;
    }

    public void setExecutiveSummary(String executiveSummary) {
        this.executiveSummary = executiveSummary;
    }

    public List<String> getRecommendations() {
        return recommendations;
    }

    public void setRecommendations(List<String> recommendations) {
        this.recommendations = recommendations;
    }

    public List<ActionPlanStepDTO> getActionPlan() {
        return actionPlan;
    }

    public void setActionPlan(List<ActionPlanStepDTO> actionPlan) {
        this.actionPlan = actionPlan;
    }

    public Instant getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(Instant generatedAt) {
        this.generatedAt = generatedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
