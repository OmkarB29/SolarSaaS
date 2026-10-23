package com.mpc.ai.web.dto;

public class AIRecommendationRequest {
    private Long analysisId;
    private String address;
    private Double solarScore;
    private Double annualIrradianceKwhM2;
    private Double annualGeneration;
    private Double annualSavings;
    private Double paybackPeriod;
    private Double roofArea;
    private Double usableArea;
    private Double systemSize;
    private Integer panelCount;
    private Double carbonOffset;
    private Double homesPowered;
    private Double peakSunHours;
    private String weatherSummary;
    private Double cloudCoverPercent;
    private Double temperatureAvg;

    public AIRecommendationRequest() {
    }

    public Long getAnalysisId() {
        return analysisId;
    }

    public void setAnalysisId(Long analysisId) {
        this.analysisId = analysisId;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public Double getSolarScore() {
        return solarScore;
    }

    public void setSolarScore(Double solarScore) {
        this.solarScore = solarScore;
    }

    public Double getAnnualIrradianceKwhM2() {
        return annualIrradianceKwhM2;
    }

    public void setAnnualIrradianceKwhM2(Double annualIrradianceKwhM2) {
        this.annualIrradianceKwhM2 = annualIrradianceKwhM2;
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

    public Double getSystemSize() {
        return systemSize;
    }

    public void setSystemSize(Double systemSize) {
        this.systemSize = systemSize;
    }

    public Integer getPanelCount() {
        return panelCount;
    }

    public void setPanelCount(Integer panelCount) {
        this.panelCount = panelCount;
    }

    public Double getCarbonOffset() {
        return carbonOffset;
    }

    public void setCarbonOffset(Double carbonOffset) {
        this.carbonOffset = carbonOffset;
    }

    public Double getHomesPowered() {
        return homesPowered;
    }

    public void setHomesPowered(Double homesPowered) {
        this.homesPowered = homesPowered;
    }

    public Double getPeakSunHours() {
        return peakSunHours;
    }

    public void setPeakSunHours(Double peakSunHours) {
        this.peakSunHours = peakSunHours;
    }

    public String getWeatherSummary() {
        return weatherSummary;
    }

    public void setWeatherSummary(String weatherSummary) {
        this.weatherSummary = weatherSummary;
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
}
