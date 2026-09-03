package com.mpc.forecast.web.dto;

public class DailyForecastItemDTO {

    private final String date;
    private final String weather;
    private final Double cloudCover;
    private final Double temperature;
    private final Double sunshineHours;
    private final Double predictedGeneration;
    private final Double predictedSavings;

    public DailyForecastItemDTO(String date,
                                String weather,
                                Double cloudCover,
                                Double temperature,
                                Double sunshineHours,
                                Double predictedGeneration,
                                Double predictedSavings) {
        this.date = date;
        this.weather = weather;
        this.cloudCover = cloudCover;
        this.temperature = temperature;
        this.sunshineHours = sunshineHours;
        this.predictedGeneration = predictedGeneration;
        this.predictedSavings = predictedSavings;
    }

    public String getDate() {
        return date;
    }

    public String getWeather() {
        return weather;
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

    public Double getPredictedGeneration() {
        return predictedGeneration;
    }

    public Double getPredictedSavings() {
        return predictedSavings;
    }
}