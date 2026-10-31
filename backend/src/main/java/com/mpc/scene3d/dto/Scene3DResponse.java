package com.mpc.scene3d.dto;

import java.util.List;

public class Scene3DResponse {
    // Building footprint as local 2D (x, y) outline
    private List<Scene3DLocalPoint> buildingFootprint;
    // Roof-level points (same as footprint but at roofHeight Z)
    private List<Scene3DLocalPoint> roofOutline;
    private double buildingHeightMeters;
    private double roofAreaM2;

    // Centroid origin in GPS (for reference)
    private double originLat;
    private double originLng;

    // Panel array in local 3D coordinates
    private List<Panel3DLocalDTO> panels;
    private int panelCount;

    // System metadata
    private String layoutMode;
    private String address;
    private double systemCapacityKw;

    // Scale bounds (for Three.js camera framing)
    private double sceneBoundingRadiusMeters;

    public Scene3DResponse() {}

    public List<Scene3DLocalPoint> getBuildingFootprint() { return buildingFootprint; }
    public void setBuildingFootprint(List<Scene3DLocalPoint> buildingFootprint) { this.buildingFootprint = buildingFootprint; }
    public List<Scene3DLocalPoint> getRoofOutline() { return roofOutline; }
    public void setRoofOutline(List<Scene3DLocalPoint> roofOutline) { this.roofOutline = roofOutline; }
    public double getBuildingHeightMeters() { return buildingHeightMeters; }
    public void setBuildingHeightMeters(double buildingHeightMeters) { this.buildingHeightMeters = buildingHeightMeters; }
    public double getRoofAreaM2() { return roofAreaM2; }
    public void setRoofAreaM2(double roofAreaM2) { this.roofAreaM2 = roofAreaM2; }
    public double getOriginLat() { return originLat; }
    public void setOriginLat(double originLat) { this.originLat = originLat; }
    public double getOriginLng() { return originLng; }
    public void setOriginLng(double originLng) { this.originLng = originLng; }
    public List<Panel3DLocalDTO> getPanels() { return panels; }
    public void setPanels(List<Panel3DLocalDTO> panels) { this.panels = panels; }
    public int getPanelCount() { return panelCount; }
    public void setPanelCount(int panelCount) { this.panelCount = panelCount; }
    public String getLayoutMode() { return layoutMode; }
    public void setLayoutMode(String layoutMode) { this.layoutMode = layoutMode; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public double getSystemCapacityKw() { return systemCapacityKw; }
    public void setSystemCapacityKw(double systemCapacityKw) { this.systemCapacityKw = systemCapacityKw; }
    public double getSceneBoundingRadiusMeters() { return sceneBoundingRadiusMeters; }
    public void setSceneBoundingRadiusMeters(double sceneBoundingRadiusMeters) { this.sceneBoundingRadiusMeters = sceneBoundingRadiusMeters; }
}
