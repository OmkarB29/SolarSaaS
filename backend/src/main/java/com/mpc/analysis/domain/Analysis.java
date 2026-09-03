package com.mpc.analysis.domain;

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
@Table(name = "analysis")
public class Analysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @jakarta.persistence.OneToMany(mappedBy = "analysis", cascade = jakarta.persistence.CascadeType.ALL, orphanRemoval = true)
    private java.util.List<com.mpc.report.domain.Report> reports = new java.util.ArrayList<>();

    @Column(name = "location_name", nullable = false, length = 255)
    private String locationName;

    @Column(name = "location", nullable = false, length = 255)
    private String location;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(name = "roof_area", nullable = false)
    private Double roofArea;

    @Column(name = "usable_area", nullable = false)
    private Double usableArea;

    @Column(name = "estimated_panels", nullable = false)
    private Integer estimatedPanels;

    @Column(name = "panel_count", nullable = false)
    private Integer panelCount;

    @Column(name = "monthly_generation", nullable = false)
    private Double monthlyGeneration;

    @Column(name = "system_size", nullable = false)
    private Double systemSize;

    @Column(name = "annual_generation", nullable = false)
    private Double annualGeneration;

    @Column(name = "installation_cost", nullable = false)
    private Double installationCost;

    @Column(name = "annual_savings", nullable = false)
    private Double annualSavings;

    @Column(name = "roi", nullable = false)
    private Double roi;

    @Column(name = "co2_reduction", nullable = false)
    private Double co2Reduction;

    @Column(name = "payback_period", nullable = false)
    private Double paybackPeriod;

    @Column(name = "weather_adjustment", nullable = true)
    private Double weatherAdjustment;

    @Column(name = "battery_recommendation", nullable = true)
    private Double batteryRecommendation;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public Analysis() {
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

    public String getLocationName() {
        return locationName;
    }

    public void setLocationName(String locationName) {
        this.locationName = locationName;
        this.location = locationName;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
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

    public Integer getEstimatedPanels() {
        return estimatedPanels;
    }

    public void setEstimatedPanels(Integer estimatedPanels) {
        this.estimatedPanels = estimatedPanels;
        this.panelCount = estimatedPanels;
    }

    public Double getMonthlyGeneration() {
        return monthlyGeneration;
    }

    public void setMonthlyGeneration(Double monthlyGeneration) {
        this.monthlyGeneration = monthlyGeneration;
    }

    public Double getSystemSize() {
        return systemSize;
    }

    public void setSystemSize(Double systemSize) {
        this.systemSize = systemSize;
    }

    public Double getAnnualGeneration() {
        return annualGeneration;
    }

    public void setAnnualGeneration(Double annualGeneration) {
        this.annualGeneration = annualGeneration;
    }

    public Double getInstallationCost() {
        return installationCost;
    }

    public void setInstallationCost(Double installationCost) {
        this.installationCost = installationCost;
    }

    public Double getAnnualSavings() {
        return annualSavings;
    }

    public void setAnnualSavings(Double annualSavings) {
        this.annualSavings = annualSavings;
    }

    public Double getRoi() {
        return roi;
    }

    public void setRoi(Double roi) {
        this.roi = roi;
    }

    public Double getCo2Reduction() {
        return co2Reduction;
    }

    public void setCo2Reduction(Double co2Reduction) {
        this.co2Reduction = co2Reduction;
    }

    public Double getPaybackPeriod() {
        return paybackPeriod;
    }

    public void setPaybackPeriod(Double paybackPeriod) {
        this.paybackPeriod = paybackPeriod;
    }

    public Double getWeatherAdjustment() {
        return weatherAdjustment;
    }

    public void setWeatherAdjustment(Double weatherAdjustment) {
        this.weatherAdjustment = weatherAdjustment;
    }

    public Double getBatteryRecommendation() {
        return batteryRecommendation;
    }

    public void setBatteryRecommendation(Double batteryRecommendation) {
        this.batteryRecommendation = batteryRecommendation;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }
}
