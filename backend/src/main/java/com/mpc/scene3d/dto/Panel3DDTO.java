package com.mpc.scene3d.dto;

import java.util.List;

public class Panel3DDTO {
    private int panelNumber;
    private GeoPointDTO center;
    private List<GeoPointDTO> corners; // 4 corners in lat/lng
    private double widthMeters;
    private double lengthMeters;
    private double powerWatts;
    private String orientation; // PORTRAIT or LANDSCAPE
    private double azimuthDegrees;
    private double tiltDegrees;

    public Panel3DDTO() {}
    // Getters/setters for all fields:
    public int getPanelNumber() { return panelNumber; }
    public void setPanelNumber(int panelNumber) { this.panelNumber = panelNumber; }
    public GeoPointDTO getCenter() { return center; }
    public void setCenter(GeoPointDTO center) { this.center = center; }
    public List<GeoPointDTO> getCorners() { return corners; }
    public void setCorners(List<GeoPointDTO> corners) { this.corners = corners; }
    public double getWidthMeters() { return widthMeters; }
    public void setWidthMeters(double widthMeters) { this.widthMeters = widthMeters; }
    public double getLengthMeters() { return lengthMeters; }
    public void setLengthMeters(double lengthMeters) { this.lengthMeters = lengthMeters; }
    public double getPowerWatts() { return powerWatts; }
    public void setPowerWatts(double powerWatts) { this.powerWatts = powerWatts; }
    public String getOrientation() { return orientation; }
    public void setOrientation(String orientation) { this.orientation = orientation; }
    public double getAzimuthDegrees() { return azimuthDegrees; }
    public void setAzimuthDegrees(double azimuthDegrees) { this.azimuthDegrees = azimuthDegrees; }
    public double getTiltDegrees() { return tiltDegrees; }
    public void setTiltDegrees(double tiltDegrees) { this.tiltDegrees = tiltDegrees; }
}
