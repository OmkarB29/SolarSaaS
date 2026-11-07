package com.mpc.solar.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.time.Duration;

@Service
public class SolarApiService {

    private static final Logger log = LoggerFactory.getLogger(SolarApiService.class);
    private static final String GOOGLE_SOLAR_BASE_URL = "https://solar.googleapis.com/v1/buildingInsights:findClosest";
    private static final String GOOGLE_SOLAR_DATALAYERS_URL = "https://solar.googleapis.com/v1/dataLayers:get";

    private final java.util.Map<String, JsonNode> dataLayersCache = new java.util.concurrent.ConcurrentHashMap<>();
    private final java.util.Map<String, byte[]> geoTiffCache = new java.util.concurrent.ConcurrentHashMap<>();

    @Value("${google.solar.api.key:}")
    private String googleSolarApiKey;

    @Value("${google.maps.api.key:}")
    private String googleMapsApiKey;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public SolarApiService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    public String getEffectiveApiKey() {
        if (googleSolarApiKey != null && !googleSolarApiKey.trim().isEmpty()) {
            return googleSolarApiKey.trim();
        }
        if (googleMapsApiKey != null && !googleMapsApiKey.trim().isEmpty()) {
            return googleMapsApiKey.trim();
        }
        return null;
    }

    /**
     * Calls Google Solar API Building Insights endpoint for the specified coordinates.
     * Returns the raw JsonNode from Google.
     */
    public JsonNode fetchBuildingInsights(double latitude, double longitude) {
        String apiKey = getEffectiveApiKey();
        if (apiKey == null || apiKey.isEmpty()) {
            log.warn("Google Solar API key is not configured. (Set GOOGLE_SOLAR_API_KEY or GOOGLE_MAPS_API_KEY)");
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Google Solar API key is not configured on the server. Please set GOOGLE_SOLAR_API_KEY.");
        }

        // Try with requiredQuality=HIGH first, then fallback to MEDIUM/BASE if HIGH quality is unavailable
        String[] qualityLevels = {"HIGH", "MEDIUM", "BASE"};

        for (String quality : qualityLevels) {
            try {
                URI uri = UriComponentsBuilder.fromUriString(GOOGLE_SOLAR_BASE_URL)
                        .queryParam("location.latitude", latitude)
                        .queryParam("location.longitude", longitude)
                        .queryParam("requiredQuality", quality)
                        .queryParam("key", apiKey)
                        .build()
                        .toUri();

                log.info("Calling Google Solar API buildingInsights at ({}, {}) with quality={}", latitude, longitude, quality);
                String rawJson = restTemplate.getForObject(uri, String.class);

                if (rawJson != null && !rawJson.isEmpty()) {
                    JsonNode root = objectMapper.readTree(rawJson);
                    if (root.has("solarPotential")) {
                        return root;
                    }
                }
            } catch (HttpClientErrorException.NotFound e) {
                log.warn("Google Solar API returned 404 (Not Found) with quality={}", quality);
                // Continue to next lower quality if available
            } catch (HttpClientErrorException.Forbidden | HttpClientErrorException.Unauthorized e) {
                log.error("Google Solar API authorization failed: {}", e.getMessage());
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                        "Google Solar API authentication failed or key does not have Solar API enabled.");
            } catch (HttpClientErrorException.TooManyRequests e) {
                log.error("Google Solar API quota exceeded: {}", e.getMessage());
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                        "Google Solar API quota exceeded. Please try again later.");
            } catch (ResourceAccessException e) {
                log.error("Google Solar API network failure: {}", e.getMessage());
                throw new ResponseStatusException(HttpStatus.GATEWAY_TIMEOUT,
                        "Connection to Google Solar API timed out.");
            } catch (Exception e) {
                log.error("Google Solar API request failed: {}", e.getMessage());
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                        "Google Solar API request failed: " + e.getMessage());
            }
        }

        // If none of the quality levels yielded data:
        throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                "Solar data unavailable for this rooftop. Google Solar API has no building insights for this location.");
    }

    /**
     * Fetches Google Solar API Data Layers (DSM, RGB, Mask) for a given centroid and radius.
     * Caches response by coordinate and radius to avoid metered billing on repeat queries.
     */
    public JsonNode fetchDataLayers(double latitude, double longitude, double radiusMeters, String requestedQuality) {
        String apiKey = getEffectiveApiKey();
        if (apiKey == null || apiKey.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Google Solar API key is not configured on the server.");
        }

        double clampedRadius = Math.max(10.0, Math.min(100.0, radiusMeters > 0 ? radiusMeters : 50.0));
        String cacheKey = String.format(java.util.Locale.US, "%.5f_%.5f_%.1f_%s", latitude, longitude, clampedRadius, requestedQuality != null ? requestedQuality : "AUTO");

        if (dataLayersCache.containsKey(cacheKey)) {
            log.info("Returning cached Google Solar dataLayers for key: {}", cacheKey);
            return dataLayersCache.get(cacheKey);
        }

        String[] qualities = (requestedQuality != null && !requestedQuality.trim().isEmpty())
                ? new String[]{requestedQuality.trim().toUpperCase()}
                : new String[]{"HIGH", "MEDIUM", "BASE"};

        for (String quality : qualities) {
            try {
                URI uri = UriComponentsBuilder.fromUriString(GOOGLE_SOLAR_DATALAYERS_URL)
                        .queryParam("location.latitude", latitude)
                        .queryParam("location.longitude", longitude)
                        .queryParam("radiusMeters", clampedRadius)
                        .queryParam("view", "FULL_LAYERS")
                        .queryParam("requiredQuality", quality)
                        .queryParam("key", apiKey)
                        .build()
                        .toUri();

                log.info("Calling Google Solar API dataLayers:get at ({}, {}) radius={}m quality={}", latitude, longitude, clampedRadius, quality);
                String rawJson = restTemplate.getForObject(uri, String.class);

                if (rawJson != null && !rawJson.isEmpty()) {
                    JsonNode root = objectMapper.readTree(rawJson);
                    if (root.has("dsmUrl") || root.has("imageryQuality")) {
                        dataLayersCache.put(cacheKey, root);
                        return root;
                    }
                }
            } catch (HttpClientErrorException.NotFound e) {
                log.warn("Google Solar API dataLayers returned 404 (Not Covered) for quality={}", quality);
            } catch (HttpClientErrorException.Forbidden | HttpClientErrorException.Unauthorized e) {
                log.error("Google Solar API authorization failed: {}", e.getMessage());
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                        "Google Solar API authorization failed: " + e.getMessage());
            } catch (HttpClientErrorException.TooManyRequests e) {
                log.error("Google Solar API quota exceeded: {}", e.getMessage());
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                        "Google Solar API quota exceeded.");
            } catch (ResourceAccessException e) {
                log.error("Google Solar API network failure: {}", e.getMessage());
                throw new ResponseStatusException(HttpStatus.GATEWAY_TIMEOUT,
                        "Connection to Google Solar API timed out.");
            } catch (Exception e) {
                log.error("Google Solar API dataLayers request failed: {}", e.getMessage());
            }
        }

        throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                "Solar DSM data unavailable for this location. Google Solar API coverage is not active here.");
    }

    /**
     * Downloads and caches GeoTIFF raster bytes through backend proxy.
     * Keeps server API key secret from browser and protects against SSRF.
     */
    public byte[] fetchGeoTiffBytes(String googleUrl) {
        if (googleUrl == null || !googleUrl.startsWith("https://solar.googleapis.com/")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid GeoTIFF URL: Must originate from https://solar.googleapis.com/");
        }

        if (geoTiffCache.containsKey(googleUrl)) {
            log.info("Serving GeoTIFF from memory cache ({} bytes)", geoTiffCache.get(googleUrl).length);
            return geoTiffCache.get(googleUrl);
        }

        String finalUrl = googleUrl;
        if (!finalUrl.contains("key=")) {
            String apiKey = getEffectiveApiKey();
            if (apiKey != null && !apiKey.isEmpty()) {
                finalUrl = finalUrl + (finalUrl.contains("?") ? "&" : "?") + "key=" + apiKey;
            }
        }

        try {
            log.info("Fetching GeoTIFF binary from Google Solar API...");
            byte[] bytes = restTemplate.getForObject(finalUrl, byte[].class);
            if (bytes != null && bytes.length > 0) {
                geoTiffCache.put(googleUrl, bytes);
                log.info("Downloaded and cached GeoTIFF: {} bytes", bytes.length);
                return bytes;
            }
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "GeoTIFF raster returned empty content");
        } catch (HttpClientErrorException.NotFound e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "GeoTIFF raster not found or expired.");
        } catch (Exception e) {
            log.error("Failed to download GeoTIFF: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Failed to download GeoTIFF from Google: " + e.getMessage());
        }
    }
}
