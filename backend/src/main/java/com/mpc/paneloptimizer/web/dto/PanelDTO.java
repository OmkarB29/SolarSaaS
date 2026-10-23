package com.mpc.paneloptimizer.web.dto;

import java.util.List;

public class PanelDTO {

    private int panelNumber;
    private double centerLat;
    private double centerLng;
    private List<List<Double>> polygon; // 4 corners: [[lat, lng], [lat, lng], [lat, lng], [lat, lng]]
    private double widthMeters;
    private double lengthMeters;
    private double areaM2;
    private double powerWatts;
    private String orientation; // PORTRAIT or LANDSCAPE
    private double tiltAngleDegrees = 15.0;
    private double azimuthDegrees = 180.0;

    public PanelDTO() {
    }

    public int getPanelNumber() {
        return panelNumber;
    }

    public void setPanelNumber(int panelNumber) {
        this.panelNumber = panelNumber;
    }

    public double getCenterLat() {
        return centerLat;
    }

    public void setCenterLat(double centerLat) {
        this.centerLat = centerLat;
    }

    public double getCenterLng() {
        return centerLng;
    }

    public void setCenterLng(double centerLng) {
        this.centerLng = centerLng;
    }

    public List<List<Double>> getPolygon() {
        return polygon;
    }

    public void setPolygon(List<List<Double>> polygon) {
        this.polygon = polygon;
    }

    public double getWidthMeters() {
        return widthMeters;
    }

    public void setWidthMeters(double widthMeters) {
        this.widthMeters = widthMeters;
    }

    public double getLengthMeters() {
        return lengthMeters;
    }

    public void setLengthMeters(double lengthMeters) {
        this.lengthMeters = lengthMeters;
    }

    public double getAreaM2() {
        return areaM2;
    }

    public void setAreaM2(double areaM2) {
        this.areaM2 = areaM2;
    }

    public double getPowerWatts() {
        return powerWatts;
    }

    public void setPowerWatts(double powerWatts) {
        this.powerWatts = powerWatts;
    }

    public String getOrientation() {
        return orientation;
    }

    public void setOrientation(String orientation) {
        this.orientation = orientation;
    }

    public double getTiltAngleDegrees() {
        return tiltAngleDegrees;
    }

    public void setTiltAngleDegrees(double tiltAngleDegrees) {
        this.tiltAngleDegrees = tiltAngleDegrees;
    }

    public double getAzimuthDegrees() {
        return azimuthDegrees;
    }

    public void setAzimuthDegrees(double azimuthDegrees) {
        this.azimuthDegrees = azimuthDegrees;
    }
}
