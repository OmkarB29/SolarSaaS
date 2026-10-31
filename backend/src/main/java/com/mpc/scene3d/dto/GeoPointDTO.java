package com.mpc.scene3d.dto;

public class GeoPointDTO {
    private double lat;
    private double lng;
    public GeoPointDTO() {}
    public GeoPointDTO(double lat, double lng) { this.lat = lat; this.lng = lng; }
    public double getLat() { return lat; }
    public void setLat(double lat) { this.lat = lat; }
    public double getLng() { return lng; }
    public void setLng(double lng) { this.lng = lng; }
}
