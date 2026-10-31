package com.mpc.scene3d.meshy.dto;

public class MeshyGenerateRequest {

    private String imageUrl;
    private Double latitude;
    private Double longitude;
    private Integer zoom;
    private String apiKey;
    private String aiModel = "meshy-7.1";
    private String mode = "high_detail";
    private boolean enablePbr = true;
    private boolean shouldRemesh = true;
    private boolean waitForResult = false;

    public MeshyGenerateRequest() {}

    public MeshyGenerateRequest(String imageUrl) {
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

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public String getAiModel() {
        return aiModel != null && !aiModel.isBlank() ? aiModel : "meshy-7.1";
    }

    public void setAiModel(String aiModel) {
        this.aiModel = aiModel;
    }

    public String getMode() {
        return mode != null ? mode : "high_detail";
    }

    public void setMode(String mode) {
        this.mode = mode;
    }

    public boolean isEnablePbr() {
        return enablePbr;
    }

    public void setEnablePbr(boolean enablePbr) {
        this.enablePbr = enablePbr;
    }

    public boolean isShouldRemesh() {
        return shouldRemesh;
    }

    public void setShouldRemesh(boolean shouldRemesh) {
        this.shouldRemesh = shouldRemesh;
    }

    public boolean isWaitForResult() {
        return waitForResult;
    }

    public void setWaitForResult(boolean waitForResult) {
        this.waitForResult = waitForResult;
    }
}
