package com.mpc.battery.web.dto;

import java.util.List;

public class BatteryPlanResponseDTO {

    private final Long analysisId;
    private final Double recommendedCapacity;
    private final Double dailyConsumption;
    private final Double expectedBackupDays;
    private final Double total10DaySurplus;
    private final Double total10DayDeficit;
    private final Double selfSufficiencyScore;
    private final Double estimatedCost;
    private final String batteryType;
    private final List<DailyBatterySimulationDTO> dailySimulation;

    public BatteryPlanResponseDTO(Long analysisId,
                                  Double recommendedCapacity,
                                  Double dailyConsumption,
                                  Double expectedBackupDays,
                                  Double total10DaySurplus,
                                  Double total10DayDeficit,
                                  Double selfSufficiencyScore,
                                  Double estimatedCost,
                                  String batteryType,
                                  List<DailyBatterySimulationDTO> dailySimulation) {
        this.analysisId = analysisId;
        this.recommendedCapacity = recommendedCapacity;
        this.dailyConsumption = dailyConsumption;
        this.expectedBackupDays = expectedBackupDays;
        this.total10DaySurplus = total10DaySurplus;
        this.total10DayDeficit = total10DayDeficit;
        this.selfSufficiencyScore = selfSufficiencyScore;
        this.estimatedCost = estimatedCost;
        this.batteryType = batteryType;
        this.dailySimulation = dailySimulation;
    }

    public Long getAnalysisId() {
        return analysisId;
    }

    public Double getRecommendedCapacity() {
        return recommendedCapacity;
    }

    public Double getDailyConsumption() {
        return dailyConsumption;
    }

    public Double getExpectedBackupDays() {
        return expectedBackupDays;
    }

    public Double getTotal10DaySurplus() {
        return total10DaySurplus;
    }

    public Double getTotal10DayDeficit() {
        return total10DayDeficit;
    }

    public Double getSelfSufficiencyScore() {
        return selfSufficiencyScore;
    }

    public Double getEstimatedCost() {
        return estimatedCost;
    }

    public String getBatteryType() {
        return batteryType;
    }

    public List<DailyBatterySimulationDTO> getDailySimulation() {
        return dailySimulation;
    }
}