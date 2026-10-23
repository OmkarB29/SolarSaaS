package com.mpc.solar.web.dto;

public class MonthlyGenerationDTO {
    private String month;
    private int monthIndex;
    private double generationKwh;
    private double percentage;

    public MonthlyGenerationDTO() {
    }

    public MonthlyGenerationDTO(String month, int monthIndex, double generationKwh, double percentage) {
        this.month = month;
        this.monthIndex = monthIndex;
        this.generationKwh = generationKwh;
        this.percentage = percentage;
    }

    public String getMonth() {
        return month;
    }

    public void setMonth(String month) {
        this.month = month;
    }

    public int getMonthIndex() {
        return monthIndex;
    }

    public void setMonthIndex(int monthIndex) {
        this.monthIndex = monthIndex;
    }

    public double getGenerationKwh() {
        return generationKwh;
    }

    public void setGenerationKwh(double generationKwh) {
        this.generationKwh = generationKwh;
    }

    public double getPercentage() {
        return percentage;
    }

    public void setPercentage(double percentage) {
        this.percentage = percentage;
    }
}
