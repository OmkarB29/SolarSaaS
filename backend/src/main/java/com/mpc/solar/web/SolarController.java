package com.mpc.solar.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.mpc.solar.service.SolarApiService;
import com.mpc.solar.service.SolarPotentialService;
import com.mpc.solar.web.dto.SolarPotentialDTO;
import com.mpc.solar.web.dto.SolarPotentialSaveRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/solar")
public class SolarController {

    private final SolarPotentialService solarPotentialService;
    private final SolarApiService solarApiService;

    public SolarController(SolarPotentialService solarPotentialService,
                           SolarApiService solarApiService) {
        this.solarPotentialService = solarPotentialService;
        this.solarApiService = solarApiService;
    }

    /**
     * Proxies Google Solar API Building Insights using backend-secured API key.
     */
    @GetMapping("/building-insights")
    public JsonNode getBuildingInsights(@RequestParam double latitude,
                                        @RequestParam double longitude) {
        return solarApiService.fetchBuildingInsights(latitude, longitude);
    }

    /**
     * Assesses technical rooftop solar potential using PVGIS API & Open-Meteo Weather API
     */
    @GetMapping("/potential")
    public SolarPotentialDTO getPotential(@RequestParam double latitude,
                                          @RequestParam double longitude,
                                          @RequestParam(required = false) Double roofArea,
                                          @RequestParam(required = false) String address) {
        return solarPotentialService.assessSolarPotential(latitude, longitude, roofArea, address);
    }

    /**
     * Saves a solar potential assessment to the database (and creates History, Proposal, and Report entries)
     */
    @PostMapping("/potential")
    @ResponseStatus(HttpStatus.CREATED)
    public SolarPotentialDTO savePotential(@Valid @RequestBody SolarPotentialSaveRequest request,
                                           Authentication authentication) {
        return solarPotentialService.saveSolarPotential(authentication.getName(), request);
    }

    /**
     * Retrieves saved solar potential assessments (User views own, Admin views all)
     */
    @GetMapping("/history")
    public List<SolarPotentialDTO> getUserHistory(Authentication authentication) {
        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (isAdmin) {
            return solarPotentialService.getAllSolarAnalyses();
        }
        return solarPotentialService.getUserSolarHistory(authentication.getName());
    }

    /**
     * Retrieves a single solar potential assessment by ID
     */
    @GetMapping("/{id}")
    public SolarPotentialDTO getById(@PathVariable Long id, Authentication authentication) {
        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        return solarPotentialService.getSolarPotentialById(authentication.getName(), id, isAdmin);
    }

    /**
     * Deletes a saved solar potential assessment
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, Authentication authentication) {
        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        solarPotentialService.deleteSolarPotential(authentication.getName(), id, isAdmin);
    }

    /**
     * Proxies Google Solar API Data Layers (DSM, RGB, Mask) with server-managed security.
     */
    @GetMapping("/data-layers")
    public JsonNode getDataLayers(@RequestParam double latitude,
                                  @RequestParam double longitude,
                                  @RequestParam(defaultValue = "50.0") double radiusMeters,
                                  @RequestParam(required = false) String requiredQuality) {
        return solarApiService.fetchDataLayers(latitude, longitude, radiusMeters, requiredQuality);
    }

    /**
     * Proxies and caches GeoTIFF raster bytes, keeping Google API keys secret from client.
     */
    @GetMapping(value = "/geotiff", produces = "image/tiff")
    public org.springframework.http.ResponseEntity<byte[]> getGeoTiff(@RequestParam String url) {
        byte[] data = solarApiService.fetchGeoTiffBytes(url);
        return org.springframework.http.ResponseEntity.ok()
                .contentType(org.springframework.http.MediaType.parseMediaType("image/tiff"))
                .header(org.springframework.http.HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                .body(data);
    }
}
