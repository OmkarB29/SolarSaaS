package com.mpc.forecast.domain;

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
import java.time.LocalDate;

@Entity
@Table(name = "forecasts")
public class Forecast {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = true)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "analysis_id", nullable = true)
    private Analysis analysis;

    @Column(name = "forecast_date", nullable = false)
    private LocalDate forecastDate;

    @Column(name = "weather_type", nullable = false, length = 50)
    private String weatherType;

    @Column(name = "cloud_cover")
    private Double cloudCover;

    @Column(name = "temperature")
    private Double temperature;

    @Column(name = "sunshine_hours")
    private Double sunshineHours;

    @Column(name = "predicted_generation", nullable = false)
    private Double predictedGeneration;

    @Column(name = "predicted_savings", nullable = false)
    private Double predictedSavings;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public Forecast() {
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

    public LocalDate getForecastDate() {
        return forecastDate;
    }

    public void setForecastDate(LocalDate forecastDate) {
        this.forecastDate = forecastDate;
    }

    public String getWeatherType() {
        return weatherType;
    }

    public void setWeatherType(String weatherType) {
        this.weatherType = weatherType;
    }

    public Double getCloudCover() {
        return cloudCover;
    }

    public void setCloudCover(Double cloudCover) {
        this.cloudCover = cloudCover;
    }

    public Double getTemperature() {
        return temperature;
    }

    public void setTemperature(Double temperature) {
        this.temperature = temperature;
    }

    public Double getSunshineHours() {
        return sunshineHours;
    }

    public void setSunshineHours(Double sunshineHours) {
        this.sunshineHours = sunshineHours;
    }

    public Double getPredictedGeneration() {
        return predictedGeneration;
    }

    public void setPredictedGeneration(Double predictedGeneration) {
        this.predictedGeneration = predictedGeneration;
    }

    public Double getPredictedSavings() {
        return predictedSavings;
    }

    public void setPredictedSavings(Double predictedSavings) {
        this.predictedSavings = predictedSavings;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}