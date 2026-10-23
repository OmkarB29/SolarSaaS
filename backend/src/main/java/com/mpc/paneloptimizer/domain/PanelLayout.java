package com.mpc.paneloptimizer.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.mpc.analysis.domain.Analysis;
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
@Table(name = "panel_layouts")
public class PanelLayout {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "analysis_id", nullable = true)
    @JsonIgnore
    private Analysis analysis;

    @Column(name = "roof_area", nullable = false)
    private Double roofArea;

    @Column(name = "usable_area", nullable = false)
    private Double usableArea;

    @Column(name = "panel_count", nullable = false)
    private Integer panelCount;

    @Column(name = "system_capacity_kw", nullable = false)
    private Double systemCapacityKw;

    @Column(name = "annual_generation_kwh", nullable = false)
    private Double annualGenerationKwh;

    @Column(name = "roof_utilization_percent", nullable = false)
    private Double roofUtilizationPercent;

    @Column(name = "optimization_score", nullable = false)
    private Double optimizationScore;

    @Column(name = "layout_mode", nullable = false, length = 64)
    private String layoutMode;

    @Column(name = "layout_json", nullable = false, columnDefinition = "TEXT")
    private String layoutJson;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    public void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
    }

    public PanelLayout() {
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

    public Analysis getAnalysis() {
        return analysis;
    }

    public void setAnalysis(Analysis analysis) {
        this.analysis = analysis;
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
