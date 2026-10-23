package com.mpc.solar.mapper;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mpc.solar.domain.SolarPotential;
import com.mpc.solar.web.dto.MonthlyGenerationDTO;
import com.mpc.solar.web.dto.SolarPotentialDTO;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class SolarPotentialMapper {

    private final ObjectMapper objectMapper = new ObjectMapper();

    public SolarPotentialDTO toDTO(SolarPotential entity) {
        if (entity == null) return null;

        SolarPotentialDTO dto = new SolarPotentialDTO();
        dto.setId(entity.getId());
        dto.setLatitude(entity.getLatitude() != null ? entity.getLatitude() : 0.0);
        dto.setLongitude(entity.getLongitude() != null ? entity.getLongitude() : 0.0);
        dto.setAddress(entity.getAddress());
        dto.setRoofAreaM2(entity.getRoofAreaM2() != null ? entity.getRoofAreaM2() : 0.0);
        dto.setAnnualIrradianceKwhM2(entity.getAnnualIrradianceKwhM2() != null ? entity.getAnnualIrradianceKwhM2() : 0.0);
        dto.setAnnualGenerationKwh(entity.getAnnualGenerationKwh() != null ? entity.getAnnualGenerationKwh() : 0.0);
        dto.setPeakSunHours(entity.getPeakSunHours() != null ? entity.getPeakSunHours() : 0.0);
        dto.setCloudCoverPercent(entity.getCloudCoverPercent() != null ? entity.getCloudCoverPercent() : 0.0);
        dto.setTemperatureAvg(entity.getTemperatureAvg() != null ? entity.getTemperatureAvg() : 0.0);
        dto.setSystemSizeKWp(entity.getSystemSizeKWp() != null ? entity.getSystemSizeKWp() : 0.0);
        dto.setEstimatedPanelCount(entity.getEstimatedPanelCount() != null ? entity.getEstimatedPanelCount() : 0);
        dto.setRoofUtilizationPercent(entity.getRoofUtilizationPercent() != null ? entity.getRoofUtilizationPercent() : 75.0);
        dto.setAnnualSavings(entity.getAnnualSavings() != null ? entity.getAnnualSavings() : 0.0);
        dto.setPaybackYears(entity.getPaybackYears() != null ? entity.getPaybackYears() : 0.0);
        dto.setPaybackPeriod(dto.getPaybackYears());
        dto.setCarbonOffsetKg(entity.getCarbonOffsetKg() != null ? entity.getCarbonOffsetKg() : 0.0);
        dto.setHomesPowered(entity.getHomesPowered() != null ? entity.getHomesPowered() : 0.0);
        dto.setSolarScore(entity.getSolarScore() != null ? entity.getSolarScore() : 0.0);
        dto.setRecommendationLevel(entity.getRecommendationLevel());
        dto.setPolygonCoordinatesJson(entity.getPolygonCoordinatesJson());
        dto.setCreatedAt(entity.getCreatedAt());

        // Backward compatibility mappings
        dto.setMaxArrayPanels(dto.getEstimatedPanelCount());
        dto.setMaxArrayArea(dto.getRoofAreaM2() * 0.75);
        dto.setAnnualEnergyKwh(dto.getAnnualGenerationKwh());
        dto.setYearlySunshineHours(dto.getPeakSunHours() * 365.0);
        dto.setRoofSegmentsCount(4);

        // Quality badges
        double score = dto.getSolarScore();
        if (score >= 90.0) {
            dto.setSolarQualityBadge("EXCELLENT");
            dto.setSolarQualityLabel("Excellent Solar Potential");
        } else if (score >= 75.0) {
            dto.setSolarQualityBadge("GOOD");
            dto.setSolarQualityLabel("Good Solar Potential");
        } else if (score >= 60.0) {
            dto.setSolarQualityBadge("MODERATE");
            dto.setSolarQualityLabel("Moderate Solar Potential");
        } else {
            dto.setSolarQualityBadge("LOW");
            dto.setSolarQualityLabel("Low Solar Potential");
        }

        // Deserialize monthly generation JSON if present
        if (entity.getMonthlyGenerationJson() != null && !entity.getMonthlyGenerationJson().isBlank()) {
            try {
                List<MonthlyGenerationDTO> months = objectMapper.readValue(
                        entity.getMonthlyGenerationJson(),
                        new TypeReference<List<MonthlyGenerationDTO>>() {}
                );
                dto.setMonthlyGeneration(months);
            } catch (Exception e) {
                dto.setMonthlyGeneration(new ArrayList<>());
            }
        }

        return dto;
    }
}
