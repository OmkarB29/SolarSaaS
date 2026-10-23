package com.mpc.solar.web.dto;

public class SolarRecommendationDTO {
    private String title;
    private String category;
    private String recommendation;
    private String reason;
    private String expectedBenefit;
    private String impactLevel;

    public SolarRecommendationDTO() {
    }

    public SolarRecommendationDTO(String title, String category, String recommendation,
                                  String reason, String expectedBenefit, String impactLevel) {
        this.title = title;
        this.category = category;
        this.recommendation = recommendation;
        this.reason = reason;
        this.expectedBenefit = expectedBenefit;
        this.impactLevel = impactLevel;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getRecommendation() {
        return recommendation;
    }

    public void setRecommendation(String recommendation) {
        this.recommendation = recommendation;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getExpectedBenefit() {
        return expectedBenefit;
    }

    public void setExpectedBenefit(String expectedBenefit) {
        this.expectedBenefit = expectedBenefit;
    }

    public String getImpactLevel() {
        return impactLevel;
    }

    public void setImpactLevel(String impactLevel) {
        this.impactLevel = impactLevel;
    }
}
