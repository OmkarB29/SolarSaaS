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
    private String auditImagePath;
    private Integer imageWidth;
    private Integer imageHeight;
    private Long imageSizeBytes;
    private String imageSha256;
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
        dto.setAuditImagePath(entity.getAuditImagePath());
        dto.setImageWidth(entity.getImageWidth());
        dto.setImageHeight(entity.getImageHeight());
        dto.setImageSizeBytes(entity.getImageSizeBytes());
        dto.setImageSha256(entity.getImageSha256());
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

    public boolean isHasModel() {
        return hasModel;
    }

    public void setHasModel(boolean hasModel) {
        this.hasModel = hasModel;
    }

    public String getModelUrl() {
        return modelUrl;
    }

    public void setModelUrl(String modelUrl) {
        this.modelUrl = modelUrl;
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

    public String getAuditImagePath() {
        return auditImagePath;
    }

    public void setAuditImagePath(String auditImagePath) {
        this.auditImagePath = auditImagePath;
    }

    public Integer getImageWidth() {
        return imageWidth;
    }

    public void setImageWidth(Integer imageWidth) {
        this.imageWidth = imageWidth;
    }

    public Integer getImageHeight() {
        return imageHeight;
    }

    public void setImageHeight(Integer imageHeight) {
        this.imageHeight = imageHeight;
    }

    public Long getImageSizeBytes() {
        return imageSizeBytes;
    }

    public void setImageSizeBytes(Long imageSizeBytes) {
        this.imageSizeBytes = imageSizeBytes;
    }

    public String getImageSha256() {
        return imageSha256;
    }

    public void setImageSha256(String imageSha256) {
        this.imageSha256 = imageSha256;
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
