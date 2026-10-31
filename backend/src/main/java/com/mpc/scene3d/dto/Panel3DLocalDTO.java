package com.mpc.scene3d.dto;

import java.util.List;

public class Panel3DLocalDTO {
    private int panelNumber;
    private Scene3DLocalPoint center;
    private List<Scene3DLocalPoint> corners;
    private double widthMeters;
    private double lengthMeters;
    private double powerWatts;
    private String orientation;
    private double azimuthDegrees;
    private double tiltDegrees;

    public Panel3DLocalDTO() {}
    public int getPanelNumber() { return panelNumber; }
    public void setPanelNumber(int panelNumber) { this.panelNumber = panelNumber; }
    public Scene3DLocalPoint getCenter() { return center; }
    public void setCenter(Scene3DLocalPoint center) { this.center = center; }
    public List<Scene3DLocalPoint> getCorners() { return corners; }
    public void setCorners(List<Scene3DLocalPoint> corners) { this.corners = corners; }
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
