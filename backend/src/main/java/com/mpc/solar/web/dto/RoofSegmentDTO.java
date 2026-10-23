package com.mpc.solar.web.dto;

public class RoofSegmentDTO {
    private int segmentIndex;
    private double areaM2;
    private double pitchDegrees;
    private double azimuthDegrees;
    private String orientation;
    private double sunlightExposureHours;
    private double generationKwh;
    private double suitabilityScore;
    private String suitabilityLabel;

    public RoofSegmentDTO() {
    }

    public RoofSegmentDTO(int segmentIndex, double areaM2, double pitchDegrees, double azimuthDegrees,
                          String orientation, double sunlightExposureHours, double generationKwh,
                          double suitabilityScore, String suitabilityLabel) {
        this.segmentIndex = segmentIndex;
        this.areaM2 = areaM2;
        this.pitchDegrees = pitchDegrees;
        this.azimuthDegrees = azimuthDegrees;
        this.orientation = orientation;
        this.sunlightExposureHours = sunlightExposureHours;
        this.generationKwh = generationKwh;
        this.suitabilityScore = suitabilityScore;
        this.suitabilityLabel = suitabilityLabel;
    }

    public int getSegmentIndex() {
        return segmentIndex;
    }

    public void setSegmentIndex(int segmentIndex) {
        this.segmentIndex = segmentIndex;
    }

    public double getAreaM2() {
        return areaM2;
    }

    public void setAreaM2(double areaM2) {
        this.areaM2 = areaM2;
    }

    public double getPitchDegrees() {
        return pitchDegrees;
    }

    public void setPitchDegrees(double pitchDegrees) {
        this.pitchDegrees = pitchDegrees;
    }

    public double getAzimuthDegrees() {
        return azimuthDegrees;
    }

    public void setAzimuthDegrees(double azimuthDegrees) {
        this.azimuthDegrees = azimuthDegrees;
    }

    public String getOrientation() {
        return orientation;
    }

    public void setOrientation(String orientation) {
        this.orientation = orientation;
    }

    public double getSunlightExposureHours() {
        return sunlightExposureHours;
    }

    public void setSunlightExposureHours(double sunlightExposureHours) {
        this.sunlightExposureHours = sunlightExposureHours;
    }

    public double getGenerationKwh() {
        return generationKwh;
    }

    public void setGenerationKwh(double generationKwh) {
        this.generationKwh = generationKwh;
    }

    public double getSuitabilityScore() {
        return suitabilityScore;
    }

    public void setSuitabilityScore(double suitabilityScore) {
        this.suitabilityScore = suitabilityScore;
    }

    public String getSuitabilityLabel() {
        return suitabilityLabel;
    }

    public void setSuitabilityLabel(String suitabilityLabel) {
        this.suitabilityLabel = suitabilityLabel;
    }
}
