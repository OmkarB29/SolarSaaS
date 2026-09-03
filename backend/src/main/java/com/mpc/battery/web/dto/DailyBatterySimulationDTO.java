package com.mpc.battery.web.dto;

public class DailyBatterySimulationDTO {

    private final String date;
    private final Double generation;
    private final Double consumption;
    private final Double surplus;
    private final Double deficit;
    private final Double batteryLevel;
    private final Double batterySoc;
    private final String status; // "Charging", "Discharging", "Full", "Discharged", "Balanced"

    public DailyBatterySimulationDTO(String date,
                                     Double generation,
                                     Double consumption,
                                     Double surplus,
                                     Double deficit,
                                     Double batteryLevel,
                                     Double batterySoc,
                                     String status) {
        this.date = date;
        this.generation = generation;
        this.consumption = consumption;
        this.surplus = surplus;
        this.deficit = deficit;
        this.batteryLevel = batteryLevel;
        this.batterySoc = batterySoc;
        this.status = status;
    }

    public String getDate() {
        return date;
    }

    public Double getGeneration() {
        return generation;
    }

    public Double getConsumption() {
        return consumption;
    }

    public Double getSurplus() {
        return surplus;
    }

    public Double getDeficit() {
        return deficit;
    }

    public Double getBatteryLevel() {
        return batteryLevel;
    }

    public Double getBatterySoc() {
        return batterySoc;
    }

    public String getStatus() {
        return status;
    }
}