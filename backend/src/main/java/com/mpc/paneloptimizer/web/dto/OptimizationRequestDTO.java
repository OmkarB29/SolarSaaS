package com.mpc.paneloptimizer.web.dto;

import java.util.List;

public class OptimizationRequestDTO {

    private List<List<Double>> polygonCoordinates;
    private String address;
    private Double latitude;
    private Double longitude;
    private Double roofArea;
    private Long analysisId;
    private Double annualIrradiance;
    private Double solarScore;
    private PanelDimensionsDTO panelDimensions;

    public OptimizationRequestDTO() {
    }

    public List<List<Double>> getPolygonCoordinates() {
        return polygonCoordinates;
    }

    @SuppressWarnings("unchecked")
    public void setPolygonCoordinates(List<?> coordinates) {
        if (coordinates == null) {
            this.polygonCoordinates = null;
            return;
        }
        List<List<Double>> parsed = new java.util.ArrayList<>();
        for (Object item : coordinates) {
            if (item instanceof List<?> l && l.size() >= 2) {
                double lat = ((Number) l.get(0)).doubleValue();
                double lng = ((Number) l.get(1)).doubleValue();
                parsed.add(List.of(lat, lng));
            } else if (item instanceof java.util.Map<?, ?> m) {
                Object latObj = m.get("lat") != null ? m.get("lat") : m.get("latitude");
                Object lngObj = m.get("lng") != null ? m.get("lng") : m.get("longitude");
                if (latObj instanceof Number nLat && lngObj instanceof Number nLng) {
                    parsed.add(List.of(nLat.doubleValue(), nLng.doubleValue()));
                }
            }
        }
        this.polygonCoordinates = parsed;
    }

    public void setDimensions(PanelDimensionsDTO dimensions) {
        this.panelDimensions = dimensions;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public Double getRoofArea() {
        return roofArea;
    }

    public void setRoofArea(Double roofArea) {
        this.roofArea = roofArea;
    }

    public Long getAnalysisId() {
        return analysisId;
    }

    public void setAnalysisId(Long analysisId) {
        this.analysisId = analysisId;
    }

    public Double getAnnualIrradiance() {
        return annualIrradiance;
    }

    public void setAnnualIrradiance(Double annualIrradiance) {
        this.annualIrradiance = annualIrradiance;
    }

    public Double getSolarScore() {
        return solarScore;
    }

    public void setSolarScore(Double solarScore) {
        this.solarScore = solarScore;
    }

    public PanelDimensionsDTO getPanelDimensions() {
        return panelDimensions;
    }

    public void setPanelDimensions(PanelDimensionsDTO panelDimensions) {
        this.panelDimensions = panelDimensions;
    }
}
