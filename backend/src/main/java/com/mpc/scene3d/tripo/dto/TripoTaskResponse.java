package com.mpc.scene3d.tripo.dto;

public class TripoTaskResponse {

    private String taskId;
    private String status; // queued, running, processing, success, failed, banned
    private Integer progress; // 0 to 100
    private String modelGlbUrl;
    private String originalImageUrl;
    private String message;
    private Long elapsedMs;

    public TripoTaskResponse() {}

    public TripoTaskResponse(String taskId, String status) {
        this.taskId = taskId;
        this.status = status;
    }

    public static TripoTaskResponse queued(String taskId, String imageUrl) {
        TripoTaskResponse resp = new TripoTaskResponse(taskId, "queued");
        resp.setProgress(0);
        resp.setOriginalImageUrl(imageUrl);
        resp.setMessage("Task submitted to Tripo AI queue");
        return resp;
    }

    public static TripoTaskResponse success(String taskId, String modelGlbUrl, String imageUrl) {
        TripoTaskResponse resp = new TripoTaskResponse(taskId, "success");
        resp.setProgress(100);
        resp.setModelGlbUrl(modelGlbUrl);
        resp.setOriginalImageUrl(imageUrl);
        resp.setMessage("3D model mesh successfully compiled");
        return resp;
    }

    public static TripoTaskResponse failed(String taskId, String message) {
        TripoTaskResponse resp = new TripoTaskResponse(taskId, "failed");
        resp.setProgress(0);
        resp.setMessage(message);
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

    public Integer getProgress() {
        return progress;
    }

    public void setProgress(Integer progress) {
        this.progress = progress;
    }

    public String getModelGlbUrl() {
        return modelGlbUrl;
    }

    public void setModelGlbUrl(String modelGlbUrl) {
        this.modelGlbUrl = modelGlbUrl;
    }

    public String getOriginalImageUrl() {
        return originalImageUrl;
    }

    public void setOriginalImageUrl(String originalImageUrl) {
        this.originalImageUrl = originalImageUrl;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Long getElapsedMs() {
        return elapsedMs;
    }

    public void setElapsedMs(Long elapsedMs) {
        this.elapsedMs = elapsedMs;
    }
}
