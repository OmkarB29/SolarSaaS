package com.mpc.scene3d.dto;

import java.util.ArrayList;
import java.util.List;

public class Scene3DRequest {
    private List<List<Double>> polygonCoordinates; // [[lat, lng], ...]
    private List<Panel3DDTO> panels;
    private Double buildingHeightMeters;
    private String layoutMode;
    private String address;
    private Double roofAreaM2;
    private Double systemCapacityKw;

    public Scene3DRequest() {
        this.panels = new ArrayList<>();
        this.buildingHeightMeters = 4.0;
        this.layoutMode = "BALANCED";
    }

    @SuppressWarnings("unchecked")
    public void setPolygonCoordinates(List<?> coordinates) {
        if (coordinates == null) { this.polygonCoordinates = null; return; }
        List<List<Double>> parsed = new java.util.ArrayList<>();
        for (Object item : coordinates) {
            if (item instanceof List<?> l && l.size() >= 2) {
                double lat = ((Number) l.get(0)).doubleValue();
                double lng = ((Number) l.get(1)).doubleValue();
                parsed.add(List.of(lat, lng));
            }
        }
        this.polygonCoordinates = parsed;
    }
    public List<List<Double>> getPolygonCoordinates() { return polygonCoordinates; }
    public List<Panel3DDTO> getPanels() { return panels; }
    public void setPanels(List<Panel3DDTO> panels) { this.panels = panels; }
    public Double getBuildingHeightMeters() { return buildingHeightMeters; }
    public void setBuildingHeightMeters(Double buildingHeightMeters) { this.buildingHeightMeters = buildingHeightMeters; }
    public String getLayoutMode() { return layoutMode; }
    public void setLayoutMode(String layoutMode) { this.layoutMode = layoutMode; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public Double getRoofAreaM2() { return roofAreaM2; }
    public void setRoofAreaM2(Double roofAreaM2) { this.roofAreaM2 = roofAreaM2; }
    public Double getSystemCapacityKw() { return systemCapacityKw; }
    public void setSystemCapacityKw(Double systemCapacityKw) { this.systemCapacityKw = systemCapacityKw; }
}
