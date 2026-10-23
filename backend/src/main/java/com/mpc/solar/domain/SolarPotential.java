package com.mpc.solar.domain;

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
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "solar_potential")
public class SolarPotential {

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

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(length = 512)
    private String address;

    @Column(name = "roof_area_m2")
    private Double roofAreaM2;

    @Column(name = "annual_irradiance_kwh_m2")
    private Double annualIrradianceKwhM2;

    @Column(name = "annual_generation_kwh")
    private Double annualGenerationKwh;

    @Column(name = "monthly_generation_json", columnDefinition = "TEXT")
    private String monthlyGenerationJson;

    @Column(name = "peak_sun_hours")
    private Double peakSunHours;

    @Column(name = "cloud_cover_percent")
    private Double cloudCoverPercent;

    @Column(name = "temperature_avg")
    private Double temperatureAvg;

    @Column(name = "system_size_kwp")
    private Double systemSizeKWp;

    @Column(name = "estimated_panel_count")
    private Integer estimatedPanelCount;

    @Column(name = "roof_utilization_percent")
    private Double roofUtilizationPercent;

    @Column(name = "annual_savings")
    private Double annualSavings;

    @Column(name = "payback_years")
    private Double paybackYears;

    @Column(name = "carbon_offset_kg")
    private Double carbonOffsetKg;

    @Column(name = "homes_powered")
    private Double homesPowered;

    @Column(name = "solar_score")
    private Double solarScore;

    @Column(name = "recommendation_level", length = 64)
    private String recommendationLevel;

    @Column(name = "polygon_coordinates_json", columnDefinition = "TEXT")
    private String polygonCoordinatesJson;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public SolarPotential() {
    }

    @PrePersist
    public void prePersist() {
        Instant now = Instant.now();
        if (this.createdAt == null) {
            this.createdAt = now;
        }
        if (this.updatedAt == null) {
            this.updatedAt = now;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
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

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public Double getRoofAreaM2() {
        return roofAreaM2;
    }

    public void setRoofAreaM2(Double roofAreaM2) {
        this.roofAreaM2 = roofAreaM2;
    }

    public Double getAnnualIrradianceKwhM2() {
        return annualIrradianceKwhM2;
    }

    public void setAnnualIrradianceKwhM2(Double annualIrradianceKwhM2) {
        this.annualIrradianceKwhM2 = annualIrradianceKwhM2;
    }

    public Double getAnnualGenerationKwh() {
        return annualGenerationKwh;
    }

    public void setAnnualGenerationKwh(Double annualGenerationKwh) {
        this.annualGenerationKwh = annualGenerationKwh;
    }

    public String getMonthlyGenerationJson() {
        return monthlyGenerationJson;
    }

    public void setMonthlyGenerationJson(String monthlyGenerationJson) {
        this.monthlyGenerationJson = monthlyGenerationJson;
    }

    public Double getPeakSunHours() {
        return peakSunHours;
    }

    public void setPeakSunHours(Double peakSunHours) {
        this.peakSunHours = peakSunHours;
    }

    public Double getCloudCoverPercent() {
        return cloudCoverPercent;
    }

    public void setCloudCoverPercent(Double cloudCoverPercent) {
        this.cloudCoverPercent = cloudCoverPercent;
    }

    public Double getTemperatureAvg() {
        return temperatureAvg;
    }

    public void setTemperatureAvg(Double temperatureAvg) {
        this.temperatureAvg = temperatureAvg;
    }

    public Double getSystemSizeKWp() {
        return systemSizeKWp;
    }

    public void setSystemSizeKWp(Double systemSizeKWp) {
        this.systemSizeKWp = systemSizeKWp;
    }

    public Integer getEstimatedPanelCount() {
        return estimatedPanelCount;
    }

    public void setEstimatedPanelCount(Integer estimatedPanelCount) {
        this.estimatedPanelCount = estimatedPanelCount;
    }

    public Double getRoofUtilizationPercent() {
        return roofUtilizationPercent;
    }

    public void setRoofUtilizationPercent(Double roofUtilizationPercent) {
        this.roofUtilizationPercent = roofUtilizationPercent;
    }

    public Double getAnnualSavings() {
        return annualSavings;
    }

    public void setAnnualSavings(Double annualSavings) {
        this.annualSavings = annualSavings;
    }

    public Double getPaybackYears() {
        return paybackYears;
    }

    public void setPaybackYears(Double paybackYears) {
        this.paybackYears = paybackYears;
    }

    public Double getCarbonOffsetKg() {
        return carbonOffsetKg;
    }

    public void setCarbonOffsetKg(Double carbonOffsetKg) {
        this.carbonOffsetKg = carbonOffsetKg;
    }

    public Double getHomesPowered() {
        return homesPowered;
    }

    public void setHomesPowered(Double homesPowered) {
        this.homesPowered = homesPowered;
    }

    public Double getSolarScore() {
        return solarScore;
    }

    public void setSolarScore(Double solarScore) {
        this.solarScore = solarScore;
    }

    public String getRecommendationLevel() {
        return recommendationLevel;
    }

    public void setRecommendationLevel(String recommendationLevel) {
        this.recommendationLevel = recommendationLevel;
    }

    public String getPolygonCoordinatesJson() {
        return polygonCoordinatesJson;
    }

    public void setPolygonCoordinatesJson(String polygonCoordinatesJson) {
        this.polygonCoordinatesJson = polygonCoordinatesJson;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
