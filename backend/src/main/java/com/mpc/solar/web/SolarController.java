package com.mpc.solar.web;

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

    public SolarController(SolarPotentialService solarPotentialService) {
        this.solarPotentialService = solarPotentialService;
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
}
