package com.mpc.weather.web.dto;

public class DailyWeatherDTO {

    private final String date;
    private final String weatherType;
    private final String weatherSummary;
    private final Double cloudCover;
    private final Double temperature;
    private final Double sunshineHours;
    private final Integer weatherCode;

    public DailyWeatherDTO(String date,
                           String weatherType,
                           String weatherSummary,
                           Double cloudCover,
                           Double temperature,
                           Double sunshineHours,
                           Integer weatherCode) {
        this.date = date;
        this.weatherType = weatherType;
        this.weatherSummary = weatherSummary;
        this.cloudCover = cloudCover;
        this.temperature = temperature;
        this.sunshineHours = sunshineHours;
        this.weatherCode = weatherCode;
    }

    public String getDate() {
        return date;
    }

    public String getWeatherType() {
        return weatherType;
    }

    public String getWeatherSummary() {
        return weatherSummary;
    }

    public Double getCloudCover() {
        return cloudCover;
    }

    public Double getTemperature() {
        return temperature;
    }

    public Double getSunshineHours() {
        return sunshineHours;
    }

    public Integer getWeatherCode() {
        return weatherCode;
    }
}