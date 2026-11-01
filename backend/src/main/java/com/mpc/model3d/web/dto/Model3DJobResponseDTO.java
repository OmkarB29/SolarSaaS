package com.mpc.model3d.web.dto;

import com.mpc.model3d.domain.Model3DJob;
import com.mpc.model3d.domain.Model3DStatus;

import java.time.Instant;

public class Model3DJobResponseDTO {

    private Long id;
    private String polygonHash;
    private String address;
    private String imageSource;
    private String meshyTaskId;
    private Model3DStatus status;
    private int progress;
    private boolean hasModel;
    private String modelUrl;
    private int consumedCredits;
    private String errorMessage;
    private Instant createdAt;
    private Instant finishedAt;

    public Model3DJobResponseDTO() {
    }

    public static Model3DJobResponseDTO fromEntity(Model3DJob entity) {
        if (entity == null) return null;
        Model3DJobResponseDTO dto = new Model3DJobResponseDTO();
        dto.setId(entity.getId());
        dto.setPolygonHash(entity.getPolygonHash());
        dto.setAddress(entity.getAddress());
        dto.setImageSource(entity.getImageSource());
        dto.setMeshyTaskId(entity.getMeshyTaskId());
        dto.setStatus(entity.getStatus());
        dto.setProgress(entity.getProgress());
        dto.setHasModel(entity.getGlbPath() != null && !entity.getGlbPath().isBlank());
        dto.setModelUrl(entity.getModelUrl());
        dto.setConsumedCredits(entity.getConsumedCredits());
        dto.setErrorMessage(entity.getErrorMessage());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setFinishedAt(entity.getFinishedAt());
        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getPolygonHash() {
        return polygonHash;
    }

    public void setPolygonHash(String polygonHash) {
        this.polygonHash = polygonHash;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getImageSource() {
        return imageSource;
    }

    public void setImageSource(String imageSource) {
        this.imageSource = imageSource;
    }

    public String getMeshyTaskId() {
        return meshyTaskId;
    }

    public void setMeshyTaskId(String meshyTaskId) {
        this.meshyTaskId = meshyTaskId;
    }

    public Model3DStatus getStatus() {
        return status;
    }

    public void setStatus(Model3DStatus status) {
        this.status = status;
    }

    public int getProgress() {
        return progress;
    }

    public void setProgress(int progress) {
        this.progress = progress;
    }

    public String getModelUrl() {
        return modelUrl;
    }

    public void setModelUrl(String modelUrl) {
        this.modelUrl = modelUrl;
    }

    public boolean isHasModel() {
        return hasModel;
    }

    public void setHasModel(boolean hasModel) {
        this.hasModel = hasModel;
    }

    public int getConsumedCredits() {
        return consumedCredits;
    }

    public void setConsumedCredits(int consumedCredits) {
        this.consumedCredits = consumedCredits;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getFinishedAt() {
        return finishedAt;
    }

    public void setFinishedAt(Instant finishedAt) {
        this.finishedAt = finishedAt;
    }
}
