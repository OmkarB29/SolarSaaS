package com.mpc.forecast.web;

import com.mpc.forecast.service.ForecastService;
import com.mpc.forecast.web.dto.ForecastResponseDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/forecast")
public class ForecastController {

    private final ForecastService forecastService;

    public ForecastController(ForecastService forecastService) {
        this.forecastService = forecastService;
    }

    @GetMapping
    public ResponseEntity<ForecastResponseDTO> getForecast(
            @RequestParam("lat") double latitude,
            @RequestParam("lon") double longitude,
            @RequestParam(value = "analysisId", required = false) Long analysisId,
            Authentication authentication) {

        String userEmail = authentication != null ? authentication.getName() : null;
        ForecastResponseDTO response = forecastService.generateForecast(latitude, longitude, analysisId, userEmail);
        return ResponseEntity.ok(response);
    }
}