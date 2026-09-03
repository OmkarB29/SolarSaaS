package com.mpc.battery.web;

import com.mpc.battery.service.BatteryService;
import com.mpc.battery.web.dto.BatteryPlanResponseDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/battery")
public class BatteryController {

    private final BatteryService batteryService;

    public BatteryController(BatteryService batteryService) {
        this.batteryService = batteryService;
    }

    @GetMapping("/plan")
    public ResponseEntity<BatteryPlanResponseDTO> getBatteryPlan(
            @RequestParam("lat") double latitude,
            @RequestParam("lon") double longitude,
            @RequestParam(value = "analysisId", required = false) Long analysisId,
            @RequestParam(value = "capacity", required = false) Double customCapacity,
            @RequestParam(value = "consumption", required = false) Double customConsumption,
            Authentication authentication) {

        String userEmail = authentication != null ? authentication.getName() : null;
        BatteryPlanResponseDTO plan = batteryService.calculateBatteryPlan(
                latitude, longitude, analysisId, customCapacity, customConsumption, userEmail);

        return ResponseEntity.ok(plan);
    }
}