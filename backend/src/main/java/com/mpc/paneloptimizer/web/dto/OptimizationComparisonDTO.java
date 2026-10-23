package com.mpc.paneloptimizer.web.dto;

public class OptimizationComparisonDTO {

    private double baselineCapacityKw;
    private double baselineAnnualGenerationKwh;
    private double baselineRoofUtilizationPercent;

    private double capacityIncreasePercent;
    private double generationIncreasePercent;
    private double utilizationIncreasePercent;

    public OptimizationComparisonDTO() {
    }

    public OptimizationComparisonDTO(double baselineCapacityKw, double baselineAnnualGenerationKwh, double baselineRoofUtilizationPercent,
                                     double optimizedCapacityKw, double optimizedAnnualGenerationKwh, double optimizedRoofUtilizationPercent) {
        this.baselineCapacityKw = baselineCapacityKw;
        this.baselineAnnualGenerationKwh = baselineAnnualGenerationKwh;
        this.baselineRoofUtilizationPercent = baselineRoofUtilizationPercent;

        this.capacityIncreasePercent = baselineCapacityKw > 0 
                ? Math.round(((optimizedCapacityKw - baselineCapacityKw) / baselineCapacityKw) * 1000.0) / 10.0 
                : 0.0;
        this.generationIncreasePercent = baselineAnnualGenerationKwh > 0 
                ? Math.round(((optimizedAnnualGenerationKwh - baselineAnnualGenerationKwh) / baselineAnnualGenerationKwh) * 1000.0) / 10.0 
                : 0.0;
        this.utilizationIncreasePercent = Math.round((optimizedRoofUtilizationPercent - baselineRoofUtilizationPercent) * 10.0) / 10.0;
    }

    public double getBaselineCapacityKw() {
        return baselineCapacityKw;
    }

    public void setBaselineCapacityKw(double baselineCapacityKw) {
        this.baselineCapacityKw = baselineCapacityKw;
    }

    public double getBaselineAnnualGenerationKwh() {
        return baselineAnnualGenerationKwh;
    }

    public void setBaselineAnnualGenerationKwh(double baselineAnnualGenerationKwh) {
        this.baselineAnnualGenerationKwh = baselineAnnualGenerationKwh;
    }

    public double getBaselineRoofUtilizationPercent() {
        return baselineRoofUtilizationPercent;
    }

    public void setBaselineRoofUtilizationPercent(double baselineRoofUtilizationPercent) {
        this.baselineRoofUtilizationPercent = baselineRoofUtilizationPercent;
    }

    public double getCapacityIncreasePercent() {
        return capacityIncreasePercent;
    }

    public void setCapacityIncreasePercent(double capacityIncreasePercent) {
        this.capacityIncreasePercent = capacityIncreasePercent;
    }

    public double getGenerationIncreasePercent() {
        return generationIncreasePercent;
    }

    public void setGenerationIncreasePercent(double generationIncreasePercent) {
        this.generationIncreasePercent = generationIncreasePercent;
    }

    public double getUtilizationIncreasePercent() {
        return utilizationIncreasePercent;
    }

    public void setUtilizationIncreasePercent(double utilizationIncreasePercent) {
        this.utilizationIncreasePercent = utilizationIncreasePercent;
    }
}
