package com.mpc.solar.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mpc.analysis.domain.Analysis;
import com.mpc.analysis.repository.AnalysisRepository;
import com.mpc.proposal.domain.Proposal;
import com.mpc.proposal.domain.ProposalStatus;
import com.mpc.proposal.repository.ProposalRepository;
import com.mpc.report.domain.Report;
import com.mpc.report.repository.ReportRepository;
import com.mpc.solar.domain.SolarPotential;
import com.mpc.solar.mapper.SolarPotentialMapper;
import com.mpc.solar.repository.SolarPotentialRepository;
import com.mpc.solar.service.PvgisSolarApiService.PvgisMonthlyData;
import com.mpc.solar.service.PvgisSolarApiService.PvgisSolarResult;
import com.mpc.solar.web.dto.MonthlyGenerationDTO;
import com.mpc.solar.web.dto.RoofSegmentDTO;
import com.mpc.solar.web.dto.SolarPotentialDTO;
import com.mpc.solar.web.dto.SolarPotentialSaveRequest;
import com.mpc.solar.web.dto.SolarRecommendationDTO;
import com.mpc.user.domain.User;
import com.mpc.user.repository.UserRepository;
import com.mpc.weather.service.WeatherService;
import com.mpc.weather.web.dto.WeatherResponseDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
public class SolarPotentialService {

    private static final Logger log = LoggerFactory.getLogger(SolarPotentialService.class);

    private final PvgisSolarApiService pvgisSolarApiService;
    private final WeatherService weatherService;
    private final SolarPotentialRepository solarPotentialRepository;
    private final UserRepository userRepository;
    private final AnalysisRepository analysisRepository;
    private final ProposalRepository proposalRepository;
    private final ReportRepository reportRepository;
    private final SolarPotentialMapper solarPotentialMapper;
    private final ObjectMapper objectMapper;

    private static final String[] MONTH_NAMES = {
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    };

    public SolarPotentialService(PvgisSolarApiService pvgisSolarApiService,
                                 WeatherService weatherService,
                                 SolarPotentialRepository solarPotentialRepository,
                                 UserRepository userRepository,
                                 AnalysisRepository analysisRepository,
                                 ProposalRepository proposalRepository,
                                 ReportRepository reportRepository,
                                 SolarPotentialMapper solarPotentialMapper) {
        this.pvgisSolarApiService = pvgisSolarApiService;
        this.weatherService = weatherService;
        this.solarPotentialRepository = solarPotentialRepository;
        this.userRepository = userRepository;
        this.analysisRepository = analysisRepository;
        this.proposalRepository = proposalRepository;
        this.reportRepository = reportRepository;
        this.solarPotentialMapper = solarPotentialMapper;
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Complete engineering assessment combining live PVGIS solar radiation and Open-Meteo Weather data.
     */
    public SolarPotentialDTO assessSolarPotential(double latitude, double longitude, Double roofArea, String address) {
        validateCoordinates(latitude, longitude);

        double actualRoofArea = (roofArea != null && roofArea > 0.0) ? roofArea : 120.0;
        String resolvedAddress = (address != null && !address.trim().isEmpty())
                ? address.trim()
                : "Rooftop Site (" + String.format("%.4f", latitude) + ", " + String.format("%.4f", longitude) + ")";

        // 1. Fetch live PVGIS solar irradiation
        PvgisSolarResult pvgisResult = pvgisSolarApiService.fetchSolarIrradiation(latitude, longitude);

        // 2. Fetch live Open-Meteo weather data
        WeatherResponseDTO weather = null;
        try {
            weather = weatherService.getWeather(latitude, longitude);
        } catch (Exception e) {
            log.warn("Weather API call failed: {}. Using regional standard weather profile.", e.getMessage());
        }

        double cloudCover = (weather != null && weather.getCloudCover() != null) ? weather.getCloudCover() : 25.0;
        double temperature = (weather != null && weather.getTemperature() != null) ? weather.getTemperature() : 28.0;
        double sunshineHours = (weather != null && weather.getSunshineHours() != null)
                ? weather.getSunshineHours()
                : pvgisResult.getPeakSunHours();

        // 3. System Size: systemSizeKWp = roofArea * 0.75 * 0.20 (75% usable, 20% panel efficiency)
        double usableArea = actualRoofArea * 0.75;
        double systemSizeKWp = round(usableArea * 0.20, 2);

        // 4. Panel Count: panelCount = usableArea / 2.0 (assuming 2m2 per panel)
        int panelCount = (int) Math.floor(usableArea / 2.0);

        // 5. Weather Adjustment: weatherFactor = 1 - (cloudCover / 100 * 0.25)
        double weatherAdjustmentFactor = round(1.0 - ((cloudCover / 100.0) * 0.25), 4);

        // 6. Annual Generation: annualGeneration = irradiance * usableArea * panelEfficiency * weatherAdjustment
        double annualIrradiance = pvgisResult.getAnnualIrradianceKwhM2();
        double annualGeneration = round(annualIrradiance * usableArea * 0.20 * weatherAdjustmentFactor, 1);

        // 7. Annual Savings: annualSavings = annualGeneration * tariff (default tariff = ₹8.0/kWh)
        double tariff = 8.0;
        double annualSavings = round(annualGeneration * tariff, 0);

        // 8. Payback Period: payback = installationCost / annualSavings (installationCost = systemSizeKWp * 45000)
        double installationCost = systemSizeKWp * 45000.0;
        double payback = annualSavings > 0 ? round(installationCost / annualSavings, 1) : 0.0;

        // 9. Carbon Offset: carbonOffset = annualGeneration * 0.82 kg
        double carbonOffset = round(annualGeneration * 0.82, 1);

        // 10. Homes Powered: homesPowered = annualGeneration / 3500
        double homesPowered = round(annualGeneration / 3500.0, 1);

        // 11. Solar Score: Normalized 0-100 score
        // Benchmark: 2200 kWh/m2 is considered exceptional 100% irradiance
        double rawScore = Math.min(100.0, (annualIrradiance / 2200.0) * 100.0) * weatherAdjustmentFactor;
        double solarScore = round(Math.max(10.0, Math.min(100.0, rawScore)), 1);

        String qualityBadge;
        String qualityLabel;
        if (solarScore >= 90.0) {
            qualityBadge = "EXCELLENT";
            qualityLabel = "Excellent Solar Potential";
        } else if (solarScore >= 75.0) {
            qualityBadge = "GOOD";
            qualityLabel = "Good Solar Potential";
        } else if (solarScore >= 60.0) {
            qualityBadge = "MODERATE";
            qualityLabel = "Moderate Solar Potential";
        } else {
            qualityBadge = "LOW";
            qualityLabel = "Low Solar Potential";
        }

        // 12. Monthly Generation Projection from PVGIS monthly irradiance
        List<MonthlyGenerationDTO> monthlyList = new ArrayList<>();
        List<PvgisMonthlyData> pvgisMonthly = pvgisResult.getMonthlyData();
        for (int i = 0; i < 12; i++) {
            double monthIrradiance = (pvgisMonthly != null && i < pvgisMonthly.size())
                    ? pvgisMonthly.get(i).getMonthlyIrradianceKwhM2()
                    : (annualIrradiance / 12.0);
            double monthGen = round(monthIrradiance * usableArea * 0.20 * weatherAdjustmentFactor, 0);
            double monthPct = annualGeneration > 0 ? round((monthGen / annualGeneration) * 100.0, 1) : 8.3;
            monthlyList.add(new MonthlyGenerationDTO(MONTH_NAMES[i], i + 1, monthGen, monthPct));
        }

        // 13. Deterministic Solar Recommendations Engine
        double roofUtilization = round((usableArea / actualRoofArea) * 100.0, 1);
        double annualConsumptionEstimate = 3500.0;
        List<SolarRecommendationDTO> recs = evaluateDeterministicRules(
                solarScore, roofUtilization, annualGeneration, annualConsumptionEstimate,
                cloudCover, payback
        );

        // Construct DTO
        SolarPotentialDTO dto = new SolarPotentialDTO();
        dto.setLatitude(latitude);
        dto.setLongitude(longitude);
        dto.setAddress(resolvedAddress);
        dto.setRoofAreaM2(actualRoofArea);
        dto.setAnnualIrradianceKwhM2(annualIrradiance);
        dto.setAnnualGenerationKwh(annualGeneration);
        dto.setPeakSunHours(pvgisResult.getPeakSunHours());
        dto.setCloudCoverPercent(cloudCover);
        dto.setTemperatureAvg(temperature);
        dto.setSystemSizeKWp(systemSizeKWp);
        dto.setEstimatedPanelCount(panelCount);
        dto.setWeatherAdjustmentFactor(weatherAdjustmentFactor);
        dto.setRoofUtilizationPercent(roofUtilization);
        dto.setAnnualSavings(annualSavings);
        dto.setPaybackYears(payback);
        dto.setPaybackPeriod(payback);
        dto.setCarbonOffsetKg(carbonOffset);
        dto.setHomesPowered(homesPowered);
        dto.setSolarScore(solarScore);
        dto.setSolarQualityBadge(qualityBadge);
        dto.setSolarQualityLabel(qualityLabel);
        dto.setRecommendationLevel(qualityBadge);
        dto.setMonthlyGeneration(monthlyList);
        dto.setRecommendations(recs);

        // Backward compatibility mappings
        dto.setMaxArrayPanels(panelCount);
        dto.setMaxArrayArea(usableArea);
        dto.setAnnualEnergyKwh(annualGeneration);
        dto.setYearlySunshineHours(pvgisResult.getPeakSunHours() * 365.0);
        dto.setRoofSegmentsCount(4);

        return dto;
    }

    /**
     * Evaluates the 5 required deterministic rules:
     * 1. If solar score > 90 -> Excellent rooftop for solar installation
     * 2. If roof utilization < 60% -> Increase panel placement density
     * 3. If annual generation > annual consumption -> Recommend battery storage
     * 4. If cloud cover > 60% -> Highlight weather-related generation losses
     * 5. If payback < 5 years -> Mark as financially attractive
     */
    private List<SolarRecommendationDTO> evaluateDeterministicRules(double solarScore,
                                                                   double roofUtilization,
                                                                   double annualGeneration,
                                                                   double annualConsumption,
                                                                   double cloudCover,
                                                                   double payback) {
        List<SolarRecommendationDTO> recs = new ArrayList<>();

        if (solarScore > 90.0) {
            recs.add(new SolarRecommendationDTO(
                    "Excellent Rooftop for Solar Installation",
                    "RATING",
                    "Solar score is " + solarScore + "/100 with optimal annual solar insolation.",
                    "High irradiance and clear skies deliver maximum energy harvesting with rapid financial returns.",
                    "System generates top-tier yield across all 12 calendar months.",
                    "HIGH"
            ));
        }

        if (roofUtilization < 60.0) {
            recs.add(new SolarRecommendationDTO(
                    "Increase Panel Placement Density",
                    "UTILIZATION",
                    "Roof utilization is currently " + roofUtilization + "%, leaving substantial area unutilized.",
                    "Unutilized rooftop surface represents unused photovoltaic energy harvesting potential.",
                    "Reconfiguring panel layout or using 550W+ Tier-1 mono-PERC modules will increase capacity by 20-30%.",
                    "MEDIUM"
            ));
        }

        if (annualGeneration > annualConsumption) {
            recs.add(new SolarRecommendationDTO(
                    "Recommend Battery Storage",
                    "STORAGE",
                    "Annual rooftop generation (" + Math.round(annualGeneration) + " kWh) exceeds typical consumption (" + Math.round(annualConsumption) + " kWh).",
                    "Surplus daytime solar energy can be stored locally to eliminate costly evening grid peak tariffs.",
                    "Install a 10-15 kWh LFP lithium battery bank for 100% self-sufficiency and uninterrupted power backup.",
                    "HIGH"
            ));
        }

        if (cloudCover > 60.0) {
            recs.add(new SolarRecommendationDTO(
                    "Highlight Weather-Related Generation Losses",
                    "WEATHER",
                    "Local cloud cover average is elevated at " + Math.round(cloudCover) + "%.",
                    "Frequent cloud cover causes diffuse irradiance conditions and intermittent shading.",
                    "Deploy microinverters or DC power optimizers with bifacial modules to recover up to 15% diffuse light.",
                    "MEDIUM"
            ));
        }

        if (payback < 5.0 && payback > 0) {
            recs.add(new SolarRecommendationDTO(
                    "Financially Attractive Project",
                    "FINANCIAL",
                    "Estimated payback period is just " + payback + " years.",
                    "Rapid capital recovery provides 20+ years of virtually free clean electricity.",
                    "Exemplary return on investment with IRR exceeding 22% over a 25-year module lifetime.",
                    "HIGH"
            ));
        }

        return recs;
    }
    @Transactional
    public SolarPotentialDTO saveSolarPotential(String email, SolarPotentialSaveRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        double roofArea = (request.getRoofAreaM2() != null && request.getRoofAreaM2() > 0) ? request.getRoofAreaM2() : 120.0;
        double usableArea = roofArea * 0.75;
        double systemSize = (request.getSystemSizeKWp() != null && request.getSystemSizeKWp() > 0)
                ? request.getSystemSizeKWp()
                : round(usableArea * 0.20, 2);
        int panels = (request.getEstimatedPanelCount() != null && request.getEstimatedPanelCount() > 0)
                ? request.getEstimatedPanelCount()
                : (int) Math.floor(usableArea / 2.0);
        double annualGen = (request.getAnnualGenerationKwh() != null && request.getAnnualGenerationKwh() > 0)
                ? request.getAnnualGenerationKwh()
                : (request.getAnnualEnergyKwh() != null ? request.getAnnualEnergyKwh() : 5000.0);
        double savings = (request.getAnnualSavings() != null && request.getAnnualSavings() > 0)
                ? request.getAnnualSavings()
                : round(annualGen * 8.0, 0);
        double cost = systemSize * 45000.0;
        double payback = (request.getPaybackYears() != null && request.getPaybackYears() > 0)
                ? request.getPaybackYears()
                : (request.getPaybackPeriod() != null ? request.getPaybackPeriod() : (savings > 0 ? round(cost / savings, 1) : 4.5));
        double co2 = (request.getCarbonOffsetKg() != null && request.getCarbonOffsetKg() > 0)
                ? request.getCarbonOffsetKg()
                : round(annualGen * 0.82, 1);
        double roi = savings > 0 && cost > 0 ? round((savings / cost) * 100.0, 1) : 15.0;

        String siteLocation = (request.getAddress() != null && !request.getAddress().isBlank())
                ? request.getAddress().trim()
                : "Rooftop Site (" + String.format("%.4f", request.getLatitude()) + ", " + String.format("%.4f", request.getLongitude()) + ")";

        // 1. Atomically create Analysis entry (for History tracking)
        Analysis analysis = new Analysis();
        analysis.setUser(user);
        analysis.setLocationName(siteLocation);
        analysis.setLatitude(request.getLatitude());
        analysis.setLongitude(request.getLongitude());
        analysis.setRoofArea(roofArea);
        analysis.setUsableArea(usableArea);
        analysis.setEstimatedPanels(panels);
        analysis.setSystemSize(systemSize);
        analysis.setMonthlyGeneration(round(annualGen / 12.0, 0));
        analysis.setAnnualGeneration(annualGen);
        analysis.setInstallationCost(cost);
        analysis.setAnnualSavings(savings);
        analysis.setRoi(roi);
        analysis.setPaybackPeriod(payback);
        analysis.setCo2Reduction(co2);
        analysis.setWeatherAdjustment(1.0);
        Analysis savedAnalysis = analysisRepository.save(analysis);

        // 2. Atomically create Proposal entry
        Proposal proposal = new Proposal();
        proposal.setUser(user);
        proposal.setAnalysis(savedAnalysis);
        proposal.setProposalName("Commercial Solar Proposal - " + siteLocation);
        proposal.setSystemSize(systemSize);
        proposal.setCost(cost);
        proposal.setRoi(roi);
        proposal.setStatus(ProposalStatus.DRAFT);
        proposalRepository.save(proposal);

        // 3. Atomically create Report entry
        Report report = new Report();
        report.setUser(user);
        report.setAnalysis(savedAnalysis);
        report.setReportName("Solar Potential Assessment - " + siteLocation);
        report.setReportType("PDF");
        report.setFilePath("/reports/solar_assessment_" + savedAnalysis.getId() + ".pdf");
        report.setReportPath("/reports/solar_assessment_" + savedAnalysis.getId() + ".pdf");
        report.setGeneratedAt(Instant.now());
        reportRepository.save(report);

        // 4. Create SolarPotential entry
        SolarPotential sp = new SolarPotential();
        sp.setUser(user);
        sp.setAnalysis(savedAnalysis);
        sp.setLatitude(request.getLatitude());
        sp.setLongitude(request.getLongitude());
        sp.setAddress(siteLocation);
        sp.setRoofAreaM2(roofArea);
        sp.setAnnualIrradianceKwhM2(request.getAnnualIrradianceKwhM2() != null ? request.getAnnualIrradianceKwhM2() : 1900.0);
        sp.setAnnualGenerationKwh(annualGen);
        sp.setMonthlyGenerationJson(request.getMonthlyGenerationJson());
        sp.setPeakSunHours(request.getPeakSunHours() != null ? request.getPeakSunHours() : 5.2);
        sp.setCloudCoverPercent(request.getCloudCoverPercent() != null ? request.getCloudCoverPercent() : 25.0);
        sp.setTemperatureAvg(request.getTemperatureAvg() != null ? request.getTemperatureAvg() : 28.0);
        sp.setSystemSizeKWp(systemSize);
        sp.setEstimatedPanelCount(panels);
        sp.setRoofUtilizationPercent(request.getRoofUtilizationPercent() != null ? request.getRoofUtilizationPercent() : 75.0);
        sp.setAnnualSavings(savings);
        sp.setPaybackYears(payback);
        sp.setCarbonOffsetKg(co2);
        sp.setHomesPowered(request.getHomesPowered() != null ? request.getHomesPowered() : round(annualGen / 3500.0, 1));
        sp.setSolarScore(request.getSolarScore() != null ? request.getSolarScore() : 85.0);
        sp.setRecommendationLevel(request.getRecommendationLevel() != null ? request.getRecommendationLevel() : "GOOD");
        sp.setPolygonCoordinatesJson(request.getPolygonCoordinatesJson());

        SolarPotential saved = solarPotentialRepository.save(sp);

        SolarPotentialDTO dto = solarPotentialMapper.toDTO(saved);
        dto.setAnalysisId(savedAnalysis.getId());
        return dto;
    }

    @Transactional(readOnly = true)
    public List<SolarPotentialDTO> getUserSolarHistory(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        return solarPotentialRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(solarPotentialMapper::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SolarPotentialDTO> getAllSolarAnalyses() {
        return solarPotentialRepository.findAll()
                .stream()
                .map(solarPotentialMapper::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public SolarPotentialDTO getSolarPotentialById(String email, Long id, boolean isAdmin) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        SolarPotential sp;
        if (isAdmin) {
            sp = solarPotentialRepository.findById(id)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Solar potential assessment not found"));
        } else {
            sp = solarPotentialRepository.findByIdAndUserId(id, user.getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Solar potential assessment not found"));
        }

        return solarPotentialMapper.toDTO(sp);
    }

    @Transactional
    public void deleteSolarPotential(String email, Long id, boolean isAdmin) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        SolarPotential sp;
        if (isAdmin) {
            sp = solarPotentialRepository.findById(id)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Solar potential assessment not found"));
        } else {
            sp = solarPotentialRepository.findByIdAndUserId(id, user.getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Solar potential assessment not found"));
        }

        solarPotentialRepository.delete(sp);
    }

    private void validateCoordinates(double latitude, double longitude) {
        if (latitude < -90.0 || latitude > 90.0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid latitude. Must be between -90 and 90.");
        }
        if (longitude < -180.0 || longitude > 180.0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid longitude. Must be between -180 and 180.");
        }
    }

    private double round(double value, int decimals) {
        double factor = Math.pow(10, decimals);
        return Math.round(value * factor) / factor;
    }
}
