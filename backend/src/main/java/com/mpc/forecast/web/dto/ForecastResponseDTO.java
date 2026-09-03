package com.mpc.forecast.web.dto;

import java.util.List;

public class ForecastResponseDTO {

    private final Long analysisId;
    private final Double baseGeneration;
    private final List<DailyForecastItemDTO> forecast;

    public ForecastResponseDTO(Long analysisId, Double baseGeneration, List<DailyForecastItemDTO> forecast) {
        this.analysisId = analysisId;
        this.baseGeneration = baseGeneration;
        this.forecast = forecast;
    }

    public Long getAnalysisId() {
        return analysisId;
    }

    public Double getBaseGeneration() {
        return baseGeneration;
    }

    public List<DailyForecastItemDTO> getForecast() {
        return forecast;
    }
}