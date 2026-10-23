package com.mpc.ai.domain;

import com.mpc.user.domain.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "ai_recommendations")
public class AIRecommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "analysis_id")
    private Long analysisId;

    @Column(name = "solar_score")
    private Double solarScore;

    @Column(name = "annual_generation")
    private Double annualGeneration;

    @Column(name = "annual_savings")
    private Double annualSavings;

    @Column(name = "payback_period")
    private Double paybackPeriod;

    @Column(name = "installation_assessment", length = 50)
    private String installationAssessment;

    @Column(name = "financial_assessment", length = 50)
    private String financialAssessment;

    @Column(name = "battery_recommendation", length = 50)
    private String batteryRecommendation;

    @Column(name = "risk_assessment", length = 50)
    private String riskAssessment;

    @Column(name = "executive_summary", columnDefinition = "TEXT")
    private String executiveSummary;

    @Column(name = "recommendations", columnDefinition = "TEXT")
    private String recommendations;

    @Column(name = "action_plan", columnDefinition = "TEXT")
    private String actionPlan;

    @Column(name = "generated_at", nullable = false)
    private Instant generatedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public AIRecommendation() {
    }

    @PrePersist
    protected void onCreate() {
        if (this.generatedAt == null) {
            this.generatedAt = Instant.now();
        }
        this.createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
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

    public String getRecommendations() {
        return recommendations;
    }

    public void setRecommendations(String recommendations) {
        this.recommendations = recommendations;
    }

    public String getActionPlan() {
        return actionPlan;
    }

    public void setActionPlan(String actionPlan) {
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
