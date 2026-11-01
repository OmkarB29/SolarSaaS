package com.mpc.model3d.web.dto;

import java.util.List;

public class Model3DJobRequestDTO {

    private Double latitude;
    private Double longitude;
    private String address;
    private List<List<Double>> polygonCoordinates;
    private List<List<List<Double>>> obstacles;
    private Double roofArea;
    private String imageSource = "GOOGLE_STATIC"; // "GOOGLE_STATIC" | "UPLOADED"
    private String imageBase64;

    public Model3DJobRequestDTO() {
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

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public List<List<Double>> getPolygonCoordinates() {
        return polygonCoordinates;
    }

    public void setPolygonCoordinates(List<List<Double>> polygonCoordinates) {
        this.polygonCoordinates = polygonCoordinates;
    }

    public List<List<List<Double>>> getObstacles() {
        return obstacles;
    }

    public void setObstacles(List<List<List<Double>>> obstacles) {
        this.obstacles = obstacles;
    }

    public Double getRoofArea() {
        return roofArea;
    }

    public void setRoofArea(Double roofArea) {
        this.roofArea = roofArea;
    }

    public String getImageSource() {
        return imageSource;
    }

    public void setImageSource(String imageSource) {
        this.imageSource = imageSource;
    }

    public String getImageBase64() {
        return imageBase64;
    }

    public void setImageBase64(String imageBase64) {
        this.imageBase64 = imageBase64;
    }
}
