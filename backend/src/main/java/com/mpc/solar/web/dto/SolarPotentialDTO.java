package com.mpc.solar.web.dto;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class SolarPotentialDTO {
    private Long id;
    private Long analysisId;
    private double latitude;
    private double longitude;
    private String address;
    private String imageryDate;
    private String imageryQuality;

    // Technical rooftop & solar metrics
    private double roofAreaM2;
    private double annualIrradianceKwhM2;
    private double annualGenerationKwh;
    private double peakSunHours;
    private double cloudCoverPercent;
    private double temperatureAvg;
    private double systemSizeKWp;
    private int estimatedPanelCount;
    private double weatherAdjustmentFactor;

    // Backward compatible fields for views
    private int maxArrayPanels;
    private double maxArrayArea;
    private double annualEnergyKwh;
    private double yearlySunshineHours;
    private int roofSegmentsCount;
    private double panelCapacityWatts;
    private double carbonOffsetFactor;

    // Computed scores & financial assessments
    private double solarScore;
    private String solarQualityBadge;
    private String solarQualityLabel;
    private String recommendationLevel;
    private double roofUtilizationPercent;
    private double carbonOffsetKg;
    private double homesPowered;
    private double annualSavings;
    private double paybackPeriod;
    private double paybackYears;
    private double recommendedBatteryKwh;

    // Polygon coordinates
    private String polygonCoordinatesJson;

    // Detailed collections
    private List<RoofSegmentDTO> roofSegments = new ArrayList<>();
    private List<MonthlyGenerationDTO> monthlyGeneration = new ArrayList<>();
    private List<SolarRecommendationDTO> recommendations = new ArrayList<>();

    // Raw/Audit JSON
    private String googleResponseJson;
    private Instant createdAt;

    public SolarPotentialDTO() {
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

    public double getLatitude() {
        return latitude;
    }

    public void setLatitude(double latitude) {
        this.latitude = latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    public void setLongitude(double longitude) {
        this.longitude = longitude;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getImageryDate() {
        return imageryDate;
    }

    public void setImageryDate(String imageryDate) {
        this.imageryDate = imageryDate;
    }

    public String getImageryQuality() {
        return imageryQuality;
    }

    public void setImageryQuality(String imageryQuality) {
        this.imageryQuality = imageryQuality;
    }

    public double getRoofAreaM2() {
        return roofAreaM2;
    }

    public void setRoofAreaM2(double roofAreaM2) {
        this.roofAreaM2 = roofAreaM2;
    }

    public int getMaxArrayPanels() {
        return maxArrayPanels;
    }

    public void setMaxArrayPanels(int maxArrayPanels) {
        this.maxArrayPanels = maxArrayPanels;
    }

    public double getMaxArrayArea() {
        return maxArrayArea;
    }

    public void setMaxArrayArea(double maxArrayArea) {
        this.maxArrayArea = maxArrayArea;
    }

    public double getPanelCapacityWatts() {
        return panelCapacityWatts;
    }

    public void setPanelCapacityWatts(double panelCapacityWatts) {
        this.panelCapacityWatts = panelCapacityWatts;
    }

    public double getAnnualEnergyKwh() {
        return annualEnergyKwh;
    }

    public void setAnnualEnergyKwh(double annualEnergyKwh) {
        this.annualEnergyKwh = annualEnergyKwh;
    }

    public double getYearlySunshineHours() {
        return yearlySunshineHours;
    }

    public void setYearlySunshineHours(double yearlySunshineHours) {
        this.yearlySunshineHours = yearlySunshineHours;
    }

    public double getCarbonOffsetFactor() {
        return carbonOffsetFactor;
    }

    public void setCarbonOffsetFactor(double carbonOffsetFactor) {
        this.carbonOffsetFactor = carbonOffsetFactor;
    }

    public int getRoofSegmentsCount() {
        return roofSegmentsCount;
    }

    public void setRoofSegmentsCount(int roofSegmentsCount) {
        this.roofSegmentsCount = roofSegmentsCount;
    }

    public double getSolarScore() {
        return solarScore;
    }

    public void setSolarScore(double solarScore) {
        this.solarScore = solarScore;
    }

    public String getSolarQualityBadge() {
        return solarQualityBadge;
    }

    public void setSolarQualityBadge(String solarQualityBadge) {
        this.solarQualityBadge = solarQualityBadge;
    }

    public String getSolarQualityLabel() {
        return solarQualityLabel;
    }

    public void setSolarQualityLabel(String solarQualityLabel) {
        this.solarQualityLabel = solarQualityLabel;
    }

    public double getRoofUtilizationPercent() {
        return roofUtilizationPercent;
    }

    public void setRoofUtilizationPercent(double roofUtilizationPercent) {
        this.roofUtilizationPercent = roofUtilizationPercent;
    }

    public double getCarbonOffsetKg() {
        return carbonOffsetKg;
    }

    public void setCarbonOffsetKg(double carbonOffsetKg) {
        this.carbonOffsetKg = carbonOffsetKg;
    }

    public double getHomesPowered() {
        return homesPowered;
    }

    public void setHomesPowered(double homesPowered) {
        this.homesPowered = homesPowered;
    }

    public double getAnnualSavings() {
        return annualSavings;
    }

    public void setAnnualSavings(double annualSavings) {
        this.annualSavings = annualSavings;
    }

    public double getPaybackPeriod() {
        return paybackPeriod;
    }

    public void setPaybackPeriod(double paybackPeriod) {
        this.paybackPeriod = paybackPeriod;
    }

    public double getRecommendedBatteryKwh() {
        return recommendedBatteryKwh;
    }

    public void setRecommendedBatteryKwh(double recommendedBatteryKwh) {
        this.recommendedBatteryKwh = recommendedBatteryKwh;
    }

    public List<RoofSegmentDTO> getRoofSegments() {
        return roofSegments;
    }

    public void setRoofSegments(List<RoofSegmentDTO> roofSegments) {
        this.roofSegments = roofSegments;
    }

    public List<MonthlyGenerationDTO> getMonthlyGeneration() {
        return monthlyGeneration;
    }

    public void setMonthlyGeneration(List<MonthlyGenerationDTO> monthlyGeneration) {
        this.monthlyGeneration = monthlyGeneration;
    }

    public List<SolarRecommendationDTO> getRecommendations() {
        return recommendations;
    }

    public void setRecommendations(List<SolarRecommendationDTO> recommendations) {
        this.recommendations = recommendations;
    }

    public String getGoogleResponseJson() {
        return googleResponseJson;
    }

    public void setGoogleResponseJson(String googleResponseJson) {
        this.googleResponseJson = googleResponseJson;
    }

    public double getAnnualIrradianceKwhM2() {
        return annualIrradianceKwhM2;
    }

    public void setAnnualIrradianceKwhM2(double annualIrradianceKwhM2) {
        this.annualIrradianceKwhM2 = annualIrradianceKwhM2;
    }

    public double getAnnualGenerationKwh() {
        return annualGenerationKwh;
    }

    public void setAnnualGenerationKwh(double annualGenerationKwh) {
        this.annualGenerationKwh = annualGenerationKwh;
    }

    public double getPeakSunHours() {
        return peakSunHours;
    }

    public void setPeakSunHours(double peakSunHours) {
        this.peakSunHours = peakSunHours;
    }

    public double getCloudCoverPercent() {
        return cloudCoverPercent;
    }

    public void setCloudCoverPercent(double cloudCoverPercent) {
        this.cloudCoverPercent = cloudCoverPercent;
    }

    public double getTemperatureAvg() {
        return temperatureAvg;
    }

    public void setTemperatureAvg(double temperatureAvg) {
        this.temperatureAvg = temperatureAvg;
    }

    public double getSystemSizeKWp() {
        return systemSizeKWp;
    }

    public void setSystemSizeKWp(double systemSizeKWp) {
        this.systemSizeKWp = systemSizeKWp;
    }

    public int getEstimatedPanelCount() {
        return estimatedPanelCount;
    }

    public void setEstimatedPanelCount(int estimatedPanelCount) {
        this.estimatedPanelCount = estimatedPanelCount;
    }

    public double getWeatherAdjustmentFactor() {
        return weatherAdjustmentFactor;
    }

    public void setWeatherAdjustmentFactor(double weatherAdjustmentFactor) {
        this.weatherAdjustmentFactor = weatherAdjustmentFactor;
    }

    public String getRecommendationLevel() {
        return recommendationLevel;
    }

    public void setRecommendationLevel(String recommendationLevel) {
        this.recommendationLevel = recommendationLevel;
    }

    public double getPaybackYears() {
        return paybackYears;
    }

    public void setPaybackYears(double paybackYears) {
        this.paybackYears = paybackYears;
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
}
