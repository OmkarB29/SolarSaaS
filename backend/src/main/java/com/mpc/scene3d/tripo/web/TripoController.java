package com.mpc.scene3d.tripo.web;

import com.mpc.scene3d.tripo.config.TripoProperties;
import com.mpc.scene3d.tripo.dto.TripoGenerateRequest;
import com.mpc.scene3d.tripo.dto.TripoTaskResponse;
import com.mpc.scene3d.tripo.service.TripoService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/rooftops")
@CrossOrigin(origins = "*", maxAge = 3600)
public class TripoController {

    private static final Logger log = LoggerFactory.getLogger(TripoController.class);

    private final TripoService tripoService;
    private final TripoProperties tripoProperties;

    public TripoController(TripoService tripoService, TripoProperties tripoProperties) {
        this.tripoService = tripoService;
        this.tripoProperties = tripoProperties;
    }

    /**
     * POST /api/rooftops/generate-3d
     * Submits an image URL or coordinates to Tripo AI V3 to compile a 3D .GLB model.
     */
    @PostMapping("/generate-3d")
    public ResponseEntity<?> generate3D(@RequestBody TripoGenerateRequest request) {
        try {
            log.info("[TripoController] Received generate-3d request: imageUrl={}, lat={}, lng={}, waitForResult={}",
                    request.getImageUrl(), request.getLatitude(), request.getLongitude(), request.isWaitForResult());

            TripoTaskResponse response = tripoService.generate(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("[TripoController] Bad request: {}", e.getMessage());
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(err);
        } catch (Exception e) {
            log.error("[TripoController] Internal error during 3D generation", e);
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(err);
        }
    }

    /**
     * GET /api/rooftops/generate-3d/status/{taskId}
     * Polls the live status and retrieval progress of an in-flight Tripo 3D task.
     */
    @GetMapping("/generate-3d/status/{taskId}")
    public ResponseEntity<TripoTaskResponse> getStatus(
            @PathVariable("taskId") String taskId,
            @RequestParam(value = "apiKey", required = false) String apiKey) {
        TripoTaskResponse response = tripoService.checkStatus(taskId, apiKey);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/rooftops/generate-3d/satellite
     * Generates a 3D model automatically from geocoded coordinates using Google Maps satellite view.
     */
    @PostMapping("/generate-3d/satellite")
    public ResponseEntity<?> generateFromSatellite(
            @RequestParam("latitude") double latitude,
            @RequestParam("longitude") double longitude,
            @RequestParam(value = "zoom", defaultValue = "19") int zoom,
            @RequestParam(value = "waitForResult", defaultValue = "false") boolean waitForResult,
            @RequestParam(value = "apiKey", required = false) String apiKey) {
        TripoGenerateRequest req = new TripoGenerateRequest();
        req.setLatitude(latitude);
        req.setLongitude(longitude);
        req.setZoom(zoom);
        req.setWaitForResult(waitForResult);
        req.setApiKey(apiKey);
        return generate3D(req);
    }

    /**
     * GET /api/rooftops/generate-3d/health
     * Returns Tripo service health and whether an API key is currently active.
     */
    @GetMapping("/generate-3d/health")
    public ResponseEntity<?> getHealth() {
        Map<String, Object> status = new HashMap<>();
        status.put("service", "Tripo AI 3D Mesh Generator");
        status.put("configured", tripoProperties.isConfigured());
        status.put("baseUrl", tripoProperties.getBaseUrl());
        status.put("version", "v3");
        return ResponseEntity.ok(status);
    }
}
