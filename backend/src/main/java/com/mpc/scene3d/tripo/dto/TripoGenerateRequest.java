package com.mpc.scene3d.tripo.dto;

public class TripoGenerateRequest {

    private String imageUrl;
    private Double latitude;
    private Double longitude;
    private Integer zoom;
    private String modelVersion = "v3.1-20260211";
    private boolean waitForResult = false;
    private String apiKey;

    public TripoGenerateRequest() {}

    public TripoGenerateRequest(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
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

    public Integer getZoom() {
        return zoom != null ? zoom : 19;
    }

    public void setZoom(Integer zoom) {
        this.zoom = zoom;
    }

    public String getModelVersion() {
        return (modelVersion != null && !modelVersion.isBlank() && !"v3-geometry".equalsIgnoreCase(modelVersion))
                ? modelVersion
                : "v3.1-20260211";
    }

    public void setModelVersion(String modelVersion) {
        this.modelVersion = modelVersion;
    }

    public boolean isWaitForResult() {
        return waitForResult;
    }

    public void setWaitForResult(boolean waitForResult) {
        this.waitForResult = waitForResult;
    }

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }
}
