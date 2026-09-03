package com.mpc.battery.domain;

import com.mpc.analysis.domain.Analysis;
import com.mpc.user.domain.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "battery_plans")
public class BatteryPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = true)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "analysis_id", nullable = true)
    private Analysis analysis;

    @Column(name = "recommended_capacity", nullable = false)
    private Double recommendedCapacity;

    @Column(name = "daily_consumption", nullable = false)
    private Double dailyConsumption;

    @Column(name = "expected_backup_days", nullable = false)
    private Double expectedBackupDays;

    @Column(name = "total_surplus", nullable = false)
    private Double totalSurplus;

    @Column(name = "total_deficit", nullable = false)
    private Double totalDeficit;

    @Column(name = "battery_type", nullable = false, length = 100)
    private String batteryType = "Lithium Iron Phosphate (LFP)";

    @Column(name = "estimated_cost", nullable = false)
    private Double estimatedCost;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public BatteryPlan() {
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
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

    public Analysis getAnalysis() {
        return analysis;
    }

    public void setAnalysis(Analysis analysis) {
        this.analysis = analysis;
    }

    public Double getRecommendedCapacity() {
        return recommendedCapacity;
    }

    public void setRecommendedCapacity(Double recommendedCapacity) {
        this.recommendedCapacity = recommendedCapacity;
    }

    public Double getDailyConsumption() {
        return dailyConsumption;
    }

    public void setDailyConsumption(Double dailyConsumption) {
        this.dailyConsumption = dailyConsumption;
    }

    public Double getExpectedBackupDays() {
        return expectedBackupDays;
    }

    public void setExpectedBackupDays(Double expectedBackupDays) {
        this.expectedBackupDays = expectedBackupDays;
    }

    public Double getTotalSurplus() {
        return totalSurplus;
    }

    public void setTotalSurplus(Double totalSurplus) {
        this.totalSurplus = totalSurplus;
    }

    public Double getTotalDeficit() {
        return totalDeficit;
    }

    public void setTotalDeficit(Double totalDeficit) {
        this.totalDeficit = totalDeficit;
    }

    public String getBatteryType() {
        return batteryType;
    }

    public void setBatteryType(String batteryType) {
        this.batteryType = batteryType;
    }

    public Double getEstimatedCost() {
        return estimatedCost;
    }

    public void setEstimatedCost(Double estimatedCost) {
        this.estimatedCost = estimatedCost;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}