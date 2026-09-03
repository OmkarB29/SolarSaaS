package com.mpc.weather.web.dto;

public class WeatherResponseDTO {

    private final Double temperature;
    private final Double cloudCover;
    private final Double sunshineHours;
    private final String weatherSummary;
    private final Double weatherAdjustmentFactor;

    public WeatherResponseDTO(Double temperature,
                              Double cloudCover,
                              Double sunshineHours,
                              String weatherSummary,
                              Double weatherAdjustmentFactor) {
        this.temperature = temperature;
        this.cloudCover = cloudCover;
        this.sunshineHours = sunshineHours;
        this.weatherSummary = weatherSummary;
        this.weatherAdjustmentFactor = weatherAdjustmentFactor;
    }

    public Double getTemperature() {
        return temperature;
    }

    public Double getCloudCover() {
        return cloudCover;
    }

    public Double getSunshineHours() {
        return sunshineHours;
    }

    public String getWeatherSummary() {
        return weatherSummary;
    }

    public Double getWeatherAdjustmentFactor() {
        return weatherAdjustmentFactor;
    }
}
