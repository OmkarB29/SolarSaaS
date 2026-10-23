package com.mpc.paneloptimizer.web.dto;

import java.util.ArrayList;
import java.util.List;

public class OptimizationLayoutDTO {

    private String mode; // MAXIMUM_CAPACITY, BALANCED, HIGH_EFFICIENCY
    private String title;
    private String description;
    private int panelCount;
    private double systemCapacityKw;
    private double annualGenerationKwh;
    private double roofArea;
    private double usableArea;
    private double usedArea;
    private double unusedArea;
    private double roofUtilizationPercent;
    private double optimizationScore;
    private double specificYieldKwhPerKwp;

    private List<PanelDTO> panels = new ArrayList<>();
    private OptimizationComparisonDTO comparison;
    private List<String> aiInsights = new ArrayList<>();

    public OptimizationLayoutDTO() {
    }

    public String getMode() {
        return mode;
    }

    public void setLayoutMode(String mode) {
        this.mode = mode;
    }

    public void setMode(String mode) {
        this.mode = mode;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public int getPanelCount() {
        return panelCount;
    }

    public void setPanelCount(int panelCount) {
        this.panelCount = panelCount;
    }

    public double getSystemCapacityKw() {
        return systemCapacityKw;
    }

    public void setSystemCapacityKw(double systemCapacityKw) {
        this.systemCapacityKw = systemCapacityKw;
    }

    public double getAnnualGenerationKwh() {
        return annualGenerationKwh;
    }

    public void setAnnualGenerationKwh(double annualGenerationKwh) {
        this.annualGenerationKwh = annualGenerationKwh;
    }

    public double getRoofArea() {
        return roofArea;
    }

    public void setRoofArea(double roofArea) {
        this.roofArea = roofArea;
    }

    public double getUsableArea() {
        return usableArea;
    }

    public void setUsableArea(double usableArea) {
        this.usableArea = usableArea;
    }

    public double getUsedArea() {
        return usedArea;
    }

    public void setUsedArea(double usedArea) {
        this.usedArea = usedArea;
    }

    public double getUnusedArea() {
        return unusedArea;
    }

    public void setUnusedArea(double unusedArea) {
        this.unusedArea = unusedArea;
    }

    public double getRoofUtilizationPercent() {
        return roofUtilizationPercent;
    }

    public void setRoofUtilizationPercent(double roofUtilizationPercent) {
        this.roofUtilizationPercent = roofUtilizationPercent;
    }

    public double getOptimizationScore() {
        return optimizationScore;
    }

    public void setOptimizationScore(double optimizationScore) {
        this.optimizationScore = optimizationScore;
    }

    public double getSpecificYieldKwhPerKwp() {
        return specificYieldKwhPerKwp;
    }

    public void setSpecificYieldKwhPerKwp(double specificYieldKwhPerKwp) {
        this.specificYieldKwhPerKwp = specificYieldKwhPerKwp;
    }

    public List<PanelDTO> getPanels() {
        return panels;
    }

    public void setPanels(List<PanelDTO> panels) {
        this.panels = panels;
    }

    public OptimizationComparisonDTO getComparison() {
        return comparison;
    }

    public void setComparison(OptimizationComparisonDTO comparison) {
        this.comparison = comparison;
    }

    public List<String> getAiInsights() {
        return aiInsights;
    }

    public void setAiInsights(List<String> aiInsights) {
        this.aiInsights = aiInsights;
    }
}
