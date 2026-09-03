package com.mpc.battery.service;

import com.mpc.analysis.domain.Analysis;
import com.mpc.analysis.repository.AnalysisRepository;
import com.mpc.battery.domain.BatteryPlan;
import com.mpc.battery.repository.BatteryPlanRepository;
import com.mpc.battery.web.dto.BatteryPlanResponseDTO;
import com.mpc.battery.web.dto.DailyBatterySimulationDTO;
import com.mpc.forecast.service.ForecastService;
import com.mpc.forecast.web.dto.DailyForecastItemDTO;
import com.mpc.forecast.web.dto.ForecastResponseDTO;
import com.mpc.user.domain.User;
import com.mpc.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class BatteryService {

    private static final double DEFAULT_COST_PER_KWH = 15000.0; // INR per kWh for LFP battery storage
    private static final double DEFAULT_CONSUMPTION = 32.0;     // kWh/day benchmark

    private final ForecastService forecastService;
    private final BatteryPlanRepository batteryPlanRepository;
    private final AnalysisRepository analysisRepository;
    private final UserRepository userRepository;

    public BatteryService(ForecastService forecastService,
                          BatteryPlanRepository batteryPlanRepository,
                          AnalysisRepository analysisRepository,
                          UserRepository userRepository) {
        this.forecastService = forecastService;
        this.batteryPlanRepository = batteryPlanRepository;
        this.analysisRepository = analysisRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public BatteryPlanResponseDTO calculateBatteryPlan(double latitude,
                                                      double longitude,
                                                      Long analysisId,
                                                      Double customCapacity,
                                                      Double customConsumption,
                                                      String userEmail) {
        // 1. Resolve analysis and user
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

        // 2. Fetch 10-day solar forecast
        ForecastResponseDTO forecastResponse = forecastService.generateForecast(latitude, longitude, analysisId, userEmail);
        List<DailyForecastItemDTO> forecastItems = forecastResponse.getForecast();

        // 3. Determine expected daily consumption
        double baseDailyGen = (forecastResponse.getBaseGeneration() != null && forecastResponse.getBaseGeneration() > 0)
                ? forecastResponse.getBaseGeneration() / 365.0
                : 40.0;

        double dailyConsumption;
        if (customConsumption != null && customConsumption > 0) {
            dailyConsumption = customConsumption;
        } else if (analysis != null && analysis.getRoofArea() != null && analysis.getRoofArea() > 0) {
            // Rooftop scaled consumption: ~80% of average generation
            dailyConsumption = Math.round(baseDailyGen * 0.82 * 10.0) / 10.0;
        } else {
            dailyConsumption = DEFAULT_CONSUMPTION;
        }

        // 4. Calculate recommended battery capacity
        double recommendedCapacity;
        if (customCapacity != null && customCapacity > 0) {
            recommendedCapacity = customCapacity;
        } else {
            // Recommend sizing to cover 1.5 - 2 days of consumption and capture daytime surplus
            double targetCapacity = dailyConsumption * 1.5;
            recommendedCapacity = snapToStandardPack(targetCapacity);
        }

        // 5. Simulate 10-day battery behavior
        double currentBatteryKwh = recommendedCapacity * 0.50; // Initial 50% SOC
        double totalSurplus = 0.0;
        double totalDeficit = 0.0;
        double totalGeneration = 0.0;
        double totalConsumed = dailyConsumption * forecastItems.size();

        List<DailyBatterySimulationDTO> simulationList = new ArrayList<>();

        for (DailyForecastItemDTO day : forecastItems) {
            double gen = day.getPredictedGeneration() != null ? day.getPredictedGeneration() : 0.0;
            totalGeneration += gen;

            double netEnergy = gen - dailyConsumption;
            double daySurplus = 0.0;
            double dayDeficit = 0.0;

            if (netEnergy > 0) {
                daySurplus = Math.round(netEnergy * 10.0) / 10.0;
            } else {
                dayDeficit = Math.round(Math.abs(netEnergy) * 10.0) / 10.0;
            }

            totalSurplus += daySurplus;
            totalDeficit += dayDeficit;

            // Battery state transition
            double nextBatteryKwh = Math.min(recommendedCapacity, Math.max(0.0, currentBatteryKwh + netEnergy));
            double soc = Math.round((nextBatteryKwh / recommendedCapacity) * 1000.0) / 10.0;

            String status;
            if (netEnergy > 0 && nextBatteryKwh >= recommendedCapacity) {
                status = "Full / Export";
            } else if (netEnergy > 0) {
                status = "Charging";
            } else if (netEnergy < 0 && nextBatteryKwh <= 0.0) {
                status = "Empty / Import";
            } else if (netEnergy < 0) {
                status = "Discharging";
            } else {
                status = "Balanced";
            }

            simulationList.add(new DailyBatterySimulationDTO(
                    day.getDate(),
                    Math.round(gen * 10.0) / 10.0,
                    Math.round(dailyConsumption * 10.0) / 10.0,
                    daySurplus,
                    dayDeficit,
                    Math.round(nextBatteryKwh * 10.0) / 10.0,
                    soc,
                    status
            ));

            currentBatteryKwh = nextBatteryKwh;
        }

        double expectedBackupDays = Math.round((recommendedCapacity * 0.90 / dailyConsumption) * 10.0) / 10.0;
        double estimatedCost = recommendedCapacity * DEFAULT_COST_PER_KWH;
        double selfSufficiency = totalConsumed > 0
                ? Math.min(100.0, Math.round(((totalConsumed - totalDeficit) / totalConsumed) * 1000.0) / 10.0)
                : 85.0;

        // 6. Persist battery recommendation to database
        if (analysis != null || user != null) {
            try {
                BatteryPlan plan = new BatteryPlan();
                plan.setUser(user);
                plan.setAnalysis(analysis);
                plan.setRecommendedCapacity(recommendedCapacity);
                plan.setDailyConsumption(dailyConsumption);
                plan.setExpectedBackupDays(expectedBackupDays);
                plan.setTotalSurplus(Math.round(totalSurplus * 10.0) / 10.0);
                plan.setTotalDeficit(Math.round(totalDeficit * 10.0) / 10.0);
                plan.setEstimatedCost(estimatedCost);
                batteryPlanRepository.save(plan);
            } catch (Exception ignored) {
                // Non-blocking
            }
        }

        return new BatteryPlanResponseDTO(
                analysis != null ? analysis.getId() : analysisId,
                recommendedCapacity,
                Math.round(dailyConsumption * 10.0) / 10.0,
                expectedBackupDays,
                Math.round(totalSurplus * 10.0) / 10.0,
                Math.round(totalDeficit * 10.0) / 10.0,
                selfSufficiency,
                estimatedCost,
                "Lithium Iron Phosphate (LFP)",
                simulationList
        );
    }

    private double snapToStandardPack(double targetKwh) {
        if (targetKwh <= 12.5) return 10.0;
        if (targetKwh <= 17.5) return 15.0;
        if (targetKwh <= 25.0) return 20.0;
        if (targetKwh <= 35.0) return 30.0;
        if (targetKwh <= 45.0) return 40.0;
        if (targetKwh <= 55.0) return 50.0;
        if (targetKwh <= 70.0) return 60.0;
        if (targetKwh <= 90.0) return 80.0;
        return 100.0;
    }
}