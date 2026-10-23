package com.mpc.solar.web.dto;

import jakarta.validation.constraints.NotNull;

public class SolarPotentialSaveRequest {

    private Long analysisId;

    @NotNull(message = "Latitude is required")
    private Double latitude;

    @NotNull(message = "Longitude is required")
    private Double longitude;

    private String address;
    private Double roofAreaM2;
    private Double annualIrradianceKwhM2;
    private Double annualGenerationKwh;
    private String monthlyGenerationJson;
    private Double peakSunHours;
    private Double cloudCoverPercent;
    private Double temperatureAvg;
    private Double systemSizeKWp;
    private Integer estimatedPanelCount;
    private Double roofUtilizationPercent;
    private Double annualSavings;
    private Double paybackYears;
    private Double carbonOffsetKg;
    private Double homesPowered;
    private Double solarScore;
    private String recommendationLevel;
    private String polygonCoordinatesJson;

    // Backward compatible fields
    private Integer maxArrayPanels;
    private Double maxArrayArea;
    private Double annualEnergyKwh;
    private Double yearlySunshineHours;
    private Integer roofSegmentsCount;
    private Double paybackPeriod;
    private String googleResponseJson;

    public SolarPotentialSaveRequest() {
    }

    public Long getAnalysisId() {
        return analysisId;
    }

    public void setAnalysisId(Long analysisId) {
        this.analysisId = analysisId;
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

    public Integer getMaxArrayPanels() {
        return maxArrayPanels;
    }

    public void setMaxArrayPanels(Integer maxArrayPanels) {
        this.maxArrayPanels = maxArrayPanels;
    }

    public Double getMaxArrayArea() {
        return maxArrayArea;
    }

    public void setMaxArrayArea(Double maxArrayArea) {
        this.maxArrayArea = maxArrayArea;
    }

    public Double getAnnualEnergyKwh() {
        return annualEnergyKwh;
    }

    public void setAnnualEnergyKwh(Double annualEnergyKwh) {
        this.annualEnergyKwh = annualEnergyKwh;
    }

    public Double getYearlySunshineHours() {
        return yearlySunshineHours;
    }

    public void setYearlySunshineHours(Double yearlySunshineHours) {
        this.yearlySunshineHours = yearlySunshineHours;
    }

    public Integer getRoofSegmentsCount() {
        return roofSegmentsCount;
    }

    public void setRoofSegmentsCount(Integer roofSegmentsCount) {
        this.roofSegmentsCount = roofSegmentsCount;
    }

    public Double getSolarScore() {
        return solarScore;
    }

    public void setSolarScore(Double solarScore) {
        this.solarScore = solarScore;
    }

    public Double getRoofUtilizationPercent() {
        return roofUtilizationPercent;
    }

    public void setRoofUtilizationPercent(Double roofUtilizationPercent) {
        this.roofUtilizationPercent = roofUtilizationPercent;
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

    public Double getPaybackYears() {
        return paybackYears;
    }

    public void setPaybackYears(Double paybackYears) {
        this.paybackYears = paybackYears;
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

    public String getGoogleResponseJson() {
        return googleResponseJson;
    }

    public void setGoogleResponseJson(String googleResponseJson) {
        this.googleResponseJson = googleResponseJson;
    }
}
