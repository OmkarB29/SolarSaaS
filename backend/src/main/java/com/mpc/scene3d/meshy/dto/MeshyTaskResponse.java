package com.mpc.scene3d.meshy.dto;

public class MeshyTaskResponse {

    private String taskId;
    private String status; // queued, in_progress, success, failed
    private int progress;
    private String modelGlbUrl;
    private String modelFbxUrl;
    private String thumbnailUrl;
    private String originalImageUrl;
    private long elapsedMs;
    private String message;
    private int faces = 2191196;
    private int vertices = 1093858;

    public MeshyTaskResponse() {}

    public MeshyTaskResponse(String taskId, String status) {
        this.taskId = taskId;
        this.status = status;
    }

    public static MeshyTaskResponse queued(String taskId, String originalImageUrl) {
        MeshyTaskResponse resp = new MeshyTaskResponse(taskId, "queued");
        resp.setProgress(10);
        resp.setOriginalImageUrl(originalImageUrl);
        resp.setMessage("Task queued on Meshy 7.1 AI cluster");
        return resp;
    }

    public static MeshyTaskResponse failed(String taskId, String errorMsg) {
        MeshyTaskResponse resp = new MeshyTaskResponse(taskId, "failed");
        resp.setProgress(100);
        resp.setMessage(errorMsg);
        return resp;
    }

    public String getTaskId() {
        return taskId;
    }

    public void setTaskId(String taskId) {
        this.taskId = taskId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public int getProgress() {
        return progress;
    }

    public void setProgress(int progress) {
        this.progress = progress;
    }

    public String getModelGlbUrl() {
        return modelGlbUrl;
    }

    public void setModelGlbUrl(String modelGlbUrl) {
        this.modelGlbUrl = modelGlbUrl;
    }

    public String getModelFbxUrl() {
        return modelFbxUrl;
    }

    public void setModelFbxUrl(String modelFbxUrl) {
        this.modelFbxUrl = modelFbxUrl;
    }

    public String getThumbnailUrl() {
        return thumbnailUrl;
    }

    public void setThumbnailUrl(String thumbnailUrl) {
        this.thumbnailUrl = thumbnailUrl;
    }

    public String getOriginalImageUrl() {
        return originalImageUrl;
    }

    public void setOriginalImageUrl(String originalImageUrl) {
        this.originalImageUrl = originalImageUrl;
    }

    public long getElapsedMs() {
        return elapsedMs;
    }

    public void setElapsedMs(long elapsedMs) {
        this.elapsedMs = elapsedMs;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public int getFaces() {
        return faces;
    }

    public void setFaces(int faces) {
        this.faces = faces;
    }

    public int getVertices() {
        return vertices;
    }

    public void setVertices(int vertices) {
        this.vertices = vertices;
    }
}
