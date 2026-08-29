package com.mpc.analysis.web.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public class AnalysisRequest {

    @NotBlank
    @Size(max = 255)
    private String locationName;

    @NotNull
    @DecimalMin("-90.0")
    @DecimalMax("90.0")
    private Double latitude;

    @NotNull
    @DecimalMin("-180.0")
    @DecimalMax("180.0")
    private Double longitude;

    @NotNull
    @Positive
    private Double roofArea;

    @NotNull
    @PositiveOrZero
    private Integer estimatedPanels;

    @NotNull
    @PositiveOrZero
    private Double monthlyGeneration;

    @NotNull
    @PositiveOrZero
    private Double installationCost;

    @NotNull
    @PositiveOrZero
    private Double roi;

    @NotNull
    @PositiveOrZero
    private Double co2Reduction;

    @PositiveOrZero
    private Double usableArea;

    @PositiveOrZero
    private Double systemSize;

    @PositiveOrZero
    private Double yearlyGeneration;

    @PositiveOrZero
    private Double yearlySavings;

    @PositiveOrZero
    private Double paybackPeriod;

    public String getLocationName() {
        return locationName;
    }

    public void setLocationName(String locationName) {
        this.locationName = locationName;
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

    public Integer getEstimatedPanels() {
        return estimatedPanels;
    }

    public void setEstimatedPanels(Integer estimatedPanels) {
        this.estimatedPanels = estimatedPanels;
    }

    public Double getMonthlyGeneration() {
        return monthlyGeneration;
    }

    public void setMonthlyGeneration(Double monthlyGeneration) {
        this.monthlyGeneration = monthlyGeneration;
    }

    public Double getInstallationCost() {
        return installationCost;
    }

    public void setInstallationCost(Double installationCost) {
        this.installationCost = installationCost;
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

    public Double getUsableArea() {
        return usableArea;
    }

    public void setUsableArea(Double usableArea) {
        this.usableArea = usableArea;
    }

    public Double getSystemSize() {
        return systemSize;
    }

    public void setSystemSize(Double systemSize) {
        this.systemSize = systemSize;
    }

    public Double getYearlyGeneration() {
        return yearlyGeneration;
    }

    public void setYearlyGeneration(Double yearlyGeneration) {
        this.yearlyGeneration = yearlyGeneration;
    }

    public Double getYearlySavings() {
        return yearlySavings;
    }

    public void setYearlySavings(Double yearlySavings) {
        this.yearlySavings = yearlySavings;
    }

    public Double getPaybackPeriod() {
        return paybackPeriod;
    }

    public void setPaybackPeriod(Double paybackPeriod) {
        this.paybackPeriod = paybackPeriod;
    }
}
