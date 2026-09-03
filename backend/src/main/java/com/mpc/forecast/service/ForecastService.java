package com.mpc.forecast.service;

import com.mpc.analysis.domain.Analysis;
import com.mpc.analysis.repository.AnalysisRepository;
import com.mpc.forecast.domain.Forecast;
import com.mpc.forecast.repository.ForecastRepository;
import com.mpc.forecast.web.dto.DailyForecastItemDTO;
import com.mpc.forecast.web.dto.ForecastResponseDTO;
import com.mpc.user.domain.User;
import com.mpc.user.repository.UserRepository;
import com.mpc.weather.service.WeatherService;
import com.mpc.weather.web.dto.DailyWeatherDTO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class ForecastService {

    private static final double DEFAULT_ELECTRICITY_RATE = 8.5; // INR per kWh
    private static final double DEFAULT_DAILY_GENERATION = 45.0; // kWh/day benchmark

    private final WeatherService weatherService;
    private final AnalysisRepository analysisRepository;
    private final ForecastRepository forecastRepository;
    private final UserRepository userRepository;

    public ForecastService(WeatherService weatherService,
                           AnalysisRepository analysisRepository,
                           ForecastRepository forecastRepository,
                           UserRepository userRepository) {
        this.weatherService = weatherService;
        this.analysisRepository = analysisRepository;
        this.forecastRepository = forecastRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public ForecastResponseDTO generateForecast(double latitude,
                                                double longitude,
                                                Long analysisId,
                                                String userEmail) {
        // 1. Resolve analysis and user if present
        Analysis analysis = null;
        if (analysisId != null) {
            analysis = analysisRepository.findById(analysisId).orElse(null);
        }

        User user = null;
        if (userEmail != null) {
            user = userRepository.findByEmail(userEmail).orElse(null);
        }
        if (user == null && analysis != null) {
            user = analysis.getUser();
        }

        // 2. Determine base generation
        double baseAnnualGeneration;
        double baseDailyGeneration;
        if (analysis != null) {
            if (analysis.getAnnualGeneration() != null && analysis.getAnnualGeneration() > 0) {
                baseAnnualGeneration = analysis.getAnnualGeneration();
            } else if (analysis.getMonthlyGeneration() != null && analysis.getMonthlyGeneration() > 0) {
                baseAnnualGeneration = analysis.getMonthlyGeneration() * 12.0;
            } else {
                double usable = analysis.getUsableArea() != null ? analysis.getUsableArea() : 100.0;
                baseAnnualGeneration = usable * 4.8 * 0.18 * 0.78 * 365.0;
            }
            baseDailyGeneration = baseAnnualGeneration / 365.0;
        } else {
            baseDailyGeneration = DEFAULT_DAILY_GENERATION;
            baseAnnualGeneration = baseDailyGeneration * 365.0;
        }

        // 3. Fetch 10-day weather forecast
        List<DailyWeatherDTO> dailyWeatherList = weatherService.get10DayDailyForecast(latitude, longitude);

        // 4. Compute daily solar forecasts
        List<DailyForecastItemDTO> items = new ArrayList<>();
        for (DailyWeatherDTO weather : dailyWeatherList) {
            double factor = calculateWeatherAdjustmentFactor(weather.getWeatherType(), weather.getCloudCover());
            double predictedGen = Math.round(baseDailyGeneration * factor * 10.0) / 10.0;
            double predictedSav = Math.round(predictedGen * DEFAULT_ELECTRICITY_RATE * 10.0) / 10.0;

            DailyForecastItemDTO item = new DailyForecastItemDTO(
                    weather.getDate(),
                    weather.getWeatherType(),
                    weather.getCloudCover(),
                    weather.getTemperature(),
                    weather.getSunshineHours(),
                    predictedGen,
                    predictedSav
            );
            items.add(item);

            // 5. Persist forecast to database if user or analysis is present
            if (analysis != null || user != null) {
                try {
                    Forecast entity = new Forecast();
                    entity.setUser(user);
                    entity.setAnalysis(analysis);
                    entity.setForecastDate(LocalDate.parse(weather.getDate()));
                    entity.setWeatherType(weather.getWeatherType());
                    entity.setCloudCover(weather.getCloudCover());
                    entity.setTemperature(weather.getTemperature());
                    entity.setSunshineHours(weather.getSunshineHours());
                    entity.setPredictedGeneration(predictedGen);
                    entity.setPredictedSavings(predictedSav);
                    forecastRepository.save(entity);
                } catch (Exception ignored) {
                    // Do not fail forecast request on persistence exceptions
                }
            }
        }

        return new ForecastResponseDTO(
                analysis != null ? analysis.getId() : analysisId,
                Math.round(baseAnnualGeneration * 10.0) / 10.0,
                items
        );
    }

    /**
     * Configurable weather adjustment factors:
     * Sunny: 95–100%
     * Partly Cloudy: 80–95%
     * Cloudy: 60–80%
     * Rain: 40–60%
     * Heavy Rain: 20–40%
     */
    public double calculateWeatherAdjustmentFactor(String weatherType, Double cloudCover) {
        double cloud = cloudCover != null ? cloudCover : 20.0;
        if ("Heavy Rain".equalsIgnoreCase(weatherType)) {
            return 0.30;
        } else if ("Rain".equalsIgnoreCase(weatherType)) {
            return 0.50;
        } else if ("Cloudy".equalsIgnoreCase(weatherType)) {
            double normalized = Math.min(1.0, Math.max(0.0, (cloud - 50.0) / 30.0));
            return 0.80 - (normalized * 0.20); // 0.60 to 0.80
        } else if ("Partly Cloudy".equalsIgnoreCase(weatherType)) {
            double normalized = Math.min(1.0, Math.max(0.0, (cloud - 20.0) / 30.0));
            return 0.95 - (normalized * 0.15); // 0.80 to 0.95
        } else {
            // Sunny
            double normalized = Math.min(1.0, Math.max(0.0, cloud / 20.0));
            return 1.00 - (normalized * 0.05); // 0.95 to 1.00
        }
    }
}