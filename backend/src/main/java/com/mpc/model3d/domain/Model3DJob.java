package com.mpc.model3d.domain;

import com.mpc.user.domain.User;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "model3d_jobs", indexes = {
    @Index(name = "idx_model3d_jobs_user", columnList = "user_id"),
    @Index(name = "idx_model3d_jobs_hash", columnList = "polygon_hash")
})
public class Model3DJob {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.CASCADE)
    private User user;

    @Column(name = "polygon_hash", nullable = false, length = 64)
    private String polygonHash;

    @Column(name = "polygon_json", columnDefinition = "TEXT", nullable = false)
    private String polygonJson;

    @Column(name = "obstacles_json", columnDefinition = "TEXT")
    private String obstaclesJson;

    @Column(name = "address", length = 500)
    private String address;

    @Column(name = "image_source", nullable = false, length = 50)
    private String imageSource;

    @Column(name = "meshy_task_id", length = 100)
    private String meshyTaskId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private Model3DStatus status = Model3DStatus.PENDING;

    @Column(name = "progress", nullable = false)
    private int progress = 0;

    @Column(name = "glb_path", length = 500)
    private String glbPath;

    @Column(name = "consumed_credits")
    private int consumedCredits = 0;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "finished_at")
    private Instant finishedAt;

    public Model3DJob() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getPolygonHash() {
        return polygonHash;
    }

    public void setPolygonHash(String polygonHash) {
        this.polygonHash = polygonHash;
    }

    public String getPolygonJson() {
        return polygonJson;
    }

    public void setPolygonJson(String polygonJson) {
        this.polygonJson = polygonJson;
    }

    public String getObstaclesJson() {
        return obstaclesJson;
    }

    public void setObstaclesJson(String obstaclesJson) {
        this.obstaclesJson = obstaclesJson;
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

    public String getGlbPath() {
        return glbPath;
    }

    public void setGlbPath(String glbPath) {
        this.glbPath = glbPath;
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
