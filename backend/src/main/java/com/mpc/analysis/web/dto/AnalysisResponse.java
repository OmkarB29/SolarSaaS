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
}
