package com.mpc.analysis.web.dto;

import java.time.Instant;

public class AnalysisResponse {

    private final Long id;
    private final Long userId;
    private final String locationName;
    private final Double latitude;
    private final Double longitude;
    private final Double roofArea;
    private final Integer estimatedPanels;
    private final Double monthlyGeneration;
    private final Double installationCost;
    private final Double roi;
    private final Double co2Reduction;
    private final Instant createdAt;

    private final Double usableArea;
    private final Double systemSize;
    private final Double annualGeneration;
    private final Double annualSavings;
    private final Double paybackPeriod;
    private final Double weatherAdjustment;
    private final Double batteryRecommendation;

    public AnalysisResponse(Long id,
                            Long userId,
                            String locationName,
                            Double latitude,
                            Double longitude,
                            Double roofArea,
                            Integer estimatedPanels,
                            Double monthlyGeneration,
                            Double installationCost,
                            Double roi,
                            Double co2Reduction,
                            Instant createdAt) {
        this(id, userId, locationName, latitude, longitude, roofArea, estimatedPanels,
             monthlyGeneration, installationCost, roi, co2Reduction, createdAt,
             estimatedPanels != null ? estimatedPanels * 2.5 : 0.0,
             estimatedPanels != null ? estimatedPanels * 0.4 : 0.0,
             monthlyGeneration != null ? monthlyGeneration * 12 : 0.0,
             monthlyGeneration != null ? monthlyGeneration * 12 * 8.5 : 0.0,
             4.0, 0.0, 30.0);
    }

    public AnalysisResponse(Long id,
                            Long userId,
                            String locationName,
                            Double latitude,
                            Double longitude,
                            Double roofArea,
                            Integer estimatedPanels,
                            Double monthlyGeneration,
                            Double installationCost,
                            Double roi,
                            Double co2Reduction,
                            Instant createdAt,
                            Double usableArea,
                            Double systemSize,
                            Double annualGeneration,
                            Double annualSavings,
                            Double paybackPeriod,
                            Double weatherAdjustment,
                            Double batteryRecommendation) {
        this.id = id;
        this.userId = userId;
        this.locationName = locationName;
        this.latitude = latitude;
        this.longitude = longitude;
        this.roofArea = roofArea;
        this.estimatedPanels = estimatedPanels;
        this.monthlyGeneration = monthlyGeneration;
        this.installationCost = installationCost;
        this.roi = roi;
        this.co2Reduction = co2Reduction;
        this.createdAt = createdAt;
        this.usableArea = usableArea;
        this.systemSize = systemSize;
        this.annualGeneration = annualGeneration;
        this.annualSavings = annualSavings;
        this.paybackPeriod = paybackPeriod;
        this.weatherAdjustment = weatherAdjustment;
        this.batteryRecommendation = batteryRecommendation;
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public String getLocationName() {
        return locationName;
    }

    public Double getLatitude() {
        return latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public Double getRoofArea() {
        return roofArea;
    }

    public Integer getEstimatedPanels() {
        return estimatedPanels;
    }

    public Double getMonthlyGeneration() {
        return monthlyGeneration;
    }

    public Double getInstallationCost() {
        return installationCost;
    }

    public Double getRoi() {
        return roi;
    }

    public Double getCo2Reduction() {
        return co2Reduction;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Double getUsableArea() {
        return usableArea;
    }

    public Double getSystemSize() {
        return systemSize;
    }

    public Double getAnnualGeneration() {
        return annualGeneration;
    }

    public Double getAnnualSavings() {
        return annualSavings;
    }

    public Double getPaybackPeriod() {
        return paybackPeriod;
    }

    public Double getWeatherAdjustment() {
        return weatherAdjustment;
    }

    public Double getBatteryRecommendation() {
        return batteryRecommendation;
    }
}