package com.mpc.solar.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PvgisSolarApiService {

    private static final Logger log = LoggerFactory.getLogger(PvgisSolarApiService.class);
    private static final String PVGIS_URL = "https://re.jrc.ec.europa.eu/api/v5_3/PVcalc";
    private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(10);
    private static final Duration CACHE_TTL = Duration.ofHours(24);

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final Map<String, CachedPvgisData> cache = new ConcurrentHashMap<>();

    public PvgisSolarApiService() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(REQUEST_TIMEOUT)
                .build();
        this.objectMapper = new ObjectMapper();
    }

    public static class PvgisMonthlyData {
        private final int month;
        private final double dailyIrradianceKwhM2; // H(i)_d
        private final double monthlyIrradianceKwhM2; // H(i)_m
        private final double dailyEnergyKwh; // E_d
        private final double monthlyEnergyKwh; // E_m

        public PvgisMonthlyData(int month, double dailyIrradianceKwhM2, double monthlyIrradianceKwhM2,
                                double dailyEnergyKwh, double monthlyEnergyKwh) {
            this.month = month;
            this.dailyIrradianceKwhM2 = dailyIrradianceKwhM2;
            this.monthlyIrradianceKwhM2 = monthlyIrradianceKwhM2;
            this.dailyEnergyKwh = dailyEnergyKwh;
            this.monthlyEnergyKwh = monthlyEnergyKwh;
        }

        public int getMonth() {
            return month;
        }

        public double getDailyIrradianceKwhM2() {
            return dailyIrradianceKwhM2;
        }

        public double getMonthlyIrradianceKwhM2() {
            return monthlyIrradianceKwhM2;
        }

        public double getDailyEnergyKwh() {
            return dailyEnergyKwh;
        }

        public double getMonthlyEnergyKwh() {
            return monthlyEnergyKwh;
        }
    }

    public static class PvgisSolarResult {
        private final double annualIrradianceKwhM2; // H(i)_y (e.g., 1939 kWh/m2)
        private final double dailyIrradianceAvgKwhM2; // H(i)_d
        private final double peakSunHours; // Equivalent to peak sun hours/day
        private final double annualEnergyPerKwp; // E_y
        private final List<PvgisMonthlyData> monthlyData;

        public PvgisSolarResult(double annualIrradianceKwhM2, double dailyIrradianceAvgKwhM2,
                                double peakSunHours, double annualEnergyPerKwp,
                                List<PvgisMonthlyData> monthlyData) {
            this.annualIrradianceKwhM2 = annualIrradianceKwhM2;
            this.dailyIrradianceAvgKwhM2 = dailyIrradianceAvgKwhM2;
            this.peakSunHours = peakSunHours;
            this.annualEnergyPerKwp = annualEnergyPerKwp;
            this.monthlyData = monthlyData;
        }

        public double getAnnualIrradianceKwhM2() {
            return annualIrradianceKwhM2;
        }

        public double getDailyIrradianceAvgKwhM2() {
            return dailyIrradianceAvgKwhM2;
        }

        public double getPeakSunHours() {
            return peakSunHours;
        }

        public double getAnnualEnergyPerKwp() {
            return annualEnergyPerKwp;
        }

        public List<PvgisMonthlyData> getMonthlyData() {
            return monthlyData;
        }
    }

    private record CachedPvgisData(PvgisSolarResult result, Instant cachedAt) {
        public boolean isFresh() {
            return Instant.now().isBefore(cachedAt.plus(CACHE_TTL));
        }
    }

    /**
     * Retrieves solar irradiation metrics from PVGIS for the given coordinates.
     */
    public PvgisSolarResult fetchSolarIrradiation(double latitude, double longitude) {
        String cacheKey = String.format("%.3f,%.3f", latitude, longitude);
        CachedPvgisData cached = cache.get(cacheKey);
        if (cached != null && cached.isFresh()) {
            log.info("Returning cached PVGIS solar irradiation for ({}, {})", latitude, longitude);
            return cached.result();
        }

        try {
            URI uri = UriComponentsBuilder.fromUriString(PVGIS_URL)
                    .queryParam("lat", latitude)
                    .queryParam("lon", longitude)
                    .queryParam("peakpower", 1)
                    .queryParam("loss", 14)
                    .queryParam("outputformat", "json")
                    .build()
                    .toUri();

            log.info("Calling PVGIS API at URL: {}", uri);
            HttpRequest request = HttpRequest.newBuilder(uri)
                    .timeout(REQUEST_TIMEOUT)
                    .GET()
                    .header("Accept", "application/json")
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                JsonNode root = objectMapper.readTree(response.body());
                PvgisSolarResult result = parsePvgisResponse(root);
                cache.put(cacheKey, new CachedPvgisData(result, Instant.now()));
                return result;
            } else {
                log.warn("PVGIS returned status {}: {}. Using solar insolation fallback model.",
                        response.statusCode(), response.body());
                return calculateGeographicalFallback(latitude, longitude);
            }
        } catch (Exception ex) {
            log.warn("Failed to contact PVGIS ({}). Using geographical solar model fallback.", ex.getMessage());
            return calculateGeographicalFallback(latitude, longitude);
        }
    }

    private PvgisSolarResult parsePvgisResponse(JsonNode root) {
        JsonNode outputs = root.path("outputs");
        JsonNode totalsFixed = outputs.path("totals").path("fixed");

        double annualIrradiance = totalsFixed.path("H(i)_y").asDouble(1900.0);
        double dailyIrradiance = totalsFixed.path("H(i)_d").asDouble(5.2);
        double peakSunHours = totalsFixed.path("H(i)_d").asDouble(5.2);
        double annualEnergyPerKwp = totalsFixed.path("E_y").asDouble(1450.0);

        List<PvgisMonthlyData> monthly = new ArrayList<>();
        JsonNode monthlyArray = outputs.path("monthly").path("fixed");
        if (monthlyArray.isArray()) {
            for (JsonNode m : monthlyArray) {
                int month = m.path("month").asInt();
                double hd = m.path("H(i)_d").asDouble(5.0);
                double hm = m.path("H(i)_m").asDouble(hd * 30.0);
                double ed = m.path("E_d").asDouble(4.0);
                double em = m.path("E_m").asDouble(ed * 30.0);
                monthly.add(new PvgisMonthlyData(month, hd, hm, ed, em));
            }
        }

        if (monthly.isEmpty()) {
            monthly = generateDefaultMonthlyProfile(annualIrradiance);
        }

        return new PvgisSolarResult(annualIrradiance, dailyIrradiance, peakSunHours, annualEnergyPerKwp, monthly);
    }

    /**
     * Accurate geographical insolation model if PVGIS service is momentarily unreachable.
     */
    public PvgisSolarResult calculateGeographicalFallback(double latitude, double longitude) {
        // Closer to equator (lat between -25 and +25) has higher irradiance (~1900-2200 kWh/m2)
        double absLat = Math.abs(latitude);
        double baseIrradiance = 2150.0 - (absLat * 18.0);
        baseIrradiance = Math.max(1050.0, Math.min(2350.0, baseIrradiance));

        double dailyIrradiance = baseIrradiance / 365.0;
        double peakSunHours = dailyIrradiance;
        double energyPerKwp = baseIrradiance * 0.76;

        List<PvgisMonthlyData> monthly = generateDefaultMonthlyProfile(baseIrradiance);
        return new PvgisSolarResult(baseIrradiance, dailyIrradiance, peakSunHours, energyPerKwp, monthly);
    }

    private List<PvgisMonthlyData> generateDefaultMonthlyProfile(double annualIrradiance) {
        double[] weights = {
                0.078, 0.086, 0.104, 0.108, 0.112, 0.072,
                0.063, 0.067, 0.077, 0.084, 0.079, 0.070
        };
        List<PvgisMonthlyData> list = new ArrayList<>();
        for (int i = 0; i < 12; i++) {
            double hm = annualIrradiance * weights[i];
            double hd = hm / 30.4;
            double ed = hd * 0.78;
            double em = hm * 0.78;
            list.add(new PvgisMonthlyData(i + 1, hd, hm, ed, em));
        }
        return list;
    }
}
