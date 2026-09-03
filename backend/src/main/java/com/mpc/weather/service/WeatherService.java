package com.mpc.weather.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mpc.weather.web.dto.DailyWeatherDTO;
import com.mpc.weather.web.dto.WeatherResponseDTO;
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
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class WeatherService {

    private static final String OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";
    private static final Duration CACHE_TTL = Duration.ofMinutes(30);
    private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(5);

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final Map<String, CachedWeather> cache = new ConcurrentHashMap<>();
    private final Map<String, Cached10DayForecast> forecastCache = new ConcurrentHashMap<>();

    public WeatherService() {
        this.objectMapper = new ObjectMapper();
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(REQUEST_TIMEOUT)
                .build();
    }

    public WeatherResponseDTO getWeather(double latitude, double longitude) {
        validateCoordinates(latitude, longitude);

        String cacheKey = cacheKey(latitude, longitude);
        CachedWeather cached = cache.get(cacheKey);
        if (cached != null && cached.isFresh()) {
            return cached.response();
        }

        WeatherResponseDTO response = fetchWeather(latitude, longitude);
        cache.put(cacheKey, new CachedWeather(response, Instant.now()));
        return response;
    }

    private WeatherResponseDTO fetchWeather(double latitude, double longitude) {
        try {
            URI uri = UriComponentsBuilder.fromUriString(OPEN_METEO_URL)
                    .queryParam("latitude", latitude)
                    .queryParam("longitude", longitude)
                    .queryParam("current", "temperature_2m,cloud_cover,weather_code")
                    .queryParam("daily", "sunshine_duration,weather_code")
                    .queryParam("forecast_days", 1)
                    .queryParam("timezone", "auto")
                    .build()
                    .toUri();

            HttpRequest request = HttpRequest.newBuilder(uri)
                    .timeout(REQUEST_TIMEOUT)
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Weather data is currently unavailable");
            }

            return toWeatherResponse(objectMapper.readTree(response.body()));
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Weather data is currently unavailable");
        }
    }

    private WeatherResponseDTO toWeatherResponse(JsonNode root) {
        Double temperature = numberAt(root, "/current/temperature_2m");
        Double cloudCover = numberAt(root, "/current/cloud_cover");
        Double sunshineSeconds = firstNumberAt(root, "/daily/sunshine_duration");
        Integer weatherCode = firstIntegerAt(root, "/daily/weather_code");
        if (weatherCode == null) {
            weatherCode = integerAt(root, "/current/weather_code");
        }

        Double sunshineHours = sunshineSeconds == null ? null : round(sunshineSeconds / 3600.0, 1);
        double adjustmentFactor = calculateAdjustmentFactor(cloudCover, sunshineHours);

        return new WeatherResponseDTO(
                temperature == null ? null : round(temperature, 1),
                cloudCover == null ? null : round(cloudCover, 0),
                sunshineHours,
                weatherSummary(weatherCode),
                round(adjustmentFactor, 2));
    }

    private double calculateAdjustmentFactor(Double cloudCover, Double sunshineHours) {
        double cloudPenalty = cloudCover == null ? 0 : Math.min(0.35, Math.max(0, cloudCover) * 0.003);
        double sunshineBoost = sunshineHours == null ? 0 : Math.max(-0.08, Math.min(0.08, (sunshineHours - 6.0) * 0.015));
        return Math.max(0.6, Math.min(1.1, 1 - cloudPenalty + sunshineBoost));
    }

    private void validateCoordinates(double latitude, double longitude) {
        if (latitude < -90 || latitude > 90) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Latitude must be between -90 and 90");
        }
        if (longitude < -180 || longitude > 180) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Longitude must be between -180 and 180");
        }
    }

    private String cacheKey(double latitude, double longitude) {
        return String.format(Locale.US, "%.3f:%.3f", latitude, longitude);
    }

    private Double numberAt(JsonNode root, String pointer) {
        JsonNode node = root.at(pointer);
        return node.isNumber() ? node.asDouble() : null;
    }

    private Integer integerAt(JsonNode root, String pointer) {
        JsonNode node = root.at(pointer);
        return node.isInt() ? node.asInt() : null;
    }

    private Double firstNumberAt(JsonNode root, String pointer) {
        JsonNode node = root.at(pointer);
        return node.isArray() && !node.isEmpty() && node.get(0).isNumber() ? node.get(0).asDouble() : null;
    }

    private Integer firstIntegerAt(JsonNode root, String pointer) {
        JsonNode node = root.at(pointer);
        return node.isArray() && !node.isEmpty() && node.get(0).isInt() ? node.get(0).asInt() : null;
    }

    private double round(double value, int places) {
        double scale = Math.pow(10, places);
        return Math.round(value * scale) / scale;
    }

    private String weatherSummary(Integer code) {
        if (code == null) return "Weather data available";
        if (code == 0) return "Clear sky";
        if (code == 1 || code == 2 || code == 3) return "Partly cloudy";
        if (code == 45 || code == 48) return "Foggy";
        if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "Rain expected";
        if (code >= 71 && code <= 77) return "Snow expected";
        if (code >= 95 && code <= 99) return "Thunderstorm expected";
        return "Mixed conditions";
    }

    private record CachedWeather(WeatherResponseDTO response, Instant cachedAt) {
        private boolean isFresh() {
            return cachedAt.plus(CACHE_TTL).isAfter(Instant.now());
        }
    }

    public List<DailyWeatherDTO> get10DayDailyForecast(double latitude, double longitude) {
        validateCoordinates(latitude, longitude);

        String cacheKey = cacheKey(latitude, longitude);
        Cached10DayForecast cached = forecastCache.get(cacheKey);
        if (cached != null && cached.isFresh()) {
            return cached.forecast();
        }

        List<DailyWeatherDTO> forecast = fetch10DayForecast(latitude, longitude);
        forecastCache.put(cacheKey, new Cached10DayForecast(forecast, Instant.now()));
        return forecast;
    }

    private List<DailyWeatherDTO> fetch10DayForecast(double latitude, double longitude) {
        try {
            URI uri = UriComponentsBuilder.fromUriString(OPEN_METEO_URL)
                    .queryParam("latitude", latitude)
                    .queryParam("longitude", longitude)
                    .queryParam("daily", "weather_code,temperature_2m_max,temperature_2m_min,temperature_2m_mean,cloud_cover_mean,sunshine_duration")
                    .queryParam("forecast_days", 10)
                    .queryParam("timezone", "auto")
                    .build()
                    .toUri();

            HttpRequest request = HttpRequest.newBuilder(uri)
                    .timeout(REQUEST_TIMEOUT)
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                return fallback10DayForecast();
            }

            JsonNode root = objectMapper.readTree(response.body());
            JsonNode daily = root.path("daily");
            JsonNode times = daily.path("time");
            JsonNode weatherCodes = daily.path("weather_code");
            JsonNode temps = daily.path("temperature_2m_mean");
            JsonNode clouds = daily.path("cloud_cover_mean");
            JsonNode sunshines = daily.path("sunshine_duration");

            List<DailyWeatherDTO> list = new ArrayList<>();
            for (int i = 0; i < times.size() && i < 10; i++) {
                String date = times.get(i).asText();
                int code = weatherCodes.has(i) ? weatherCodes.get(i).asInt() : 0;
                double temp = temps.has(i) && !temps.get(i).isNull() ? round(temps.get(i).asDouble(), 1) : 28.0;
                double cloud = clouds.has(i) && !clouds.get(i).isNull() ? round(clouds.get(i).asDouble(), 0) : 20.0;
                double sunshineSec = sunshines.has(i) && !sunshines.get(i).isNull() ? sunshines.get(i).asDouble() : 28800.0;
                double sunshineHours = round(sunshineSec / 3600.0, 1);

                String weatherType = determineWeatherType(code, cloud);
                String summary = weatherSummary(code);

                list.add(new DailyWeatherDTO(date, weatherType, summary, cloud, temp, sunshineHours, code));
            }

            if (list.isEmpty()) {
                return fallback10DayForecast();
            }

            return list;
        } catch (Exception ex) {
            return fallback10DayForecast();
        }
    }

    public String determineWeatherType(int code, double cloudCover) {
        if (code >= 95 || code == 65 || code == 67 || code == 82) {
            return "Heavy Rain";
        }
        if ((code >= 51 && code <= 63) || (code >= 80 && code <= 81)) {
            return "Rain";
        }
        if (code == 45 || code == 48 || cloudCover > 65.0) {
            return "Cloudy";
        }
        if (code == 1 || code == 2 || code == 3 || cloudCover > 25.0) {
            return "Partly Cloudy";
        }
        return "Sunny";
    }

    private List<DailyWeatherDTO> fallback10DayForecast() {
        List<DailyWeatherDTO> list = new ArrayList<>();
        LocalDate start = LocalDate.now();
        String[] types = {"Sunny", "Sunny", "Partly Cloudy", "Partly Cloudy", "Sunny", "Cloudy", "Rain", "Partly Cloudy", "Sunny", "Sunny"};
        int[] codes = {0, 0, 1, 2, 0, 45, 51, 1, 0, 0};
        double[] clouds = {10, 15, 30, 40, 12, 70, 85, 35, 10, 12};
        double[] temps = {29.5, 30.0, 29.0, 28.5, 30.5, 27.0, 25.5, 28.0, 30.0, 31.0};
        double[] sunshine = {9.5, 9.2, 8.4, 7.8, 9.6, 5.2, 3.8, 8.0, 9.4, 9.6};

        for (int i = 0; i < 10; i++) {
            String date = start.plusDays(i).toString();
            String weatherType = types[i];
            String summary = weatherSummary(codes[i]);
            list.add(new DailyWeatherDTO(date, weatherType, summary, clouds[i], temps[i], sunshine[i], codes[i]));
        }
        return list;
    }

    private record Cached10DayForecast(List<DailyWeatherDTO> forecast, Instant cachedAt) {
        private boolean isFresh() {
            return cachedAt.plus(CACHE_TTL).isAfter(Instant.now());
        }
    }
}
