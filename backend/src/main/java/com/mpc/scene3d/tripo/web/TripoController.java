package com.mpc.scene3d.tripo.web;

import com.mpc.scene3d.meshy.config.MeshyProperties;
import com.mpc.scene3d.meshy.dto.MeshyGenerateRequest;
import com.mpc.scene3d.meshy.dto.MeshyTaskResponse;
import com.mpc.scene3d.meshy.service.MeshyService;
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
    private final MeshyService meshyService;
    private final MeshyProperties meshyProperties;

    public TripoController(TripoService tripoService,
                           TripoProperties tripoProperties,
                           MeshyService meshyService,
                           MeshyProperties meshyProperties) {
        this.tripoService = tripoService;
        this.tripoProperties = tripoProperties;
        this.meshyService = meshyService;
        this.meshyProperties = meshyProperties;
    }

    /**
     * POST /api/rooftops/generate-3d
     * Automatically routes to Meshy 7.1 Flagship (or Tripo if tsk_ key is passed).
     */
    @PostMapping("/generate-3d")
    public ResponseEntity<?> generate3D(@RequestBody TripoGenerateRequest request) {
        try {
            String apiKey = request.getApiKey();
            boolean isMeshy = (apiKey != null && apiKey.startsWith("msy_"))
                    || meshyProperties.isConfigured()
                    || (apiKey == null && !tripoProperties.isConfigured());

            log.info("[Rooftop3DController] Processing generate-3d: engine={}, imageUrl={}, lat={}, lng={}",
                    isMeshy ? "Meshy 7.1" : "Tripo V3", request.getImageUrl(), request.getLatitude(), request.getLongitude());

            if (isMeshy) {
                MeshyGenerateRequest meshyReq = new MeshyGenerateRequest();
                meshyReq.setImageUrl(request.getImageUrl());
                meshyReq.setLatitude(request.getLatitude());
                meshyReq.setLongitude(request.getLongitude());
                meshyReq.setZoom(request.getZoom());
                meshyReq.setApiKey(request.getApiKey());
                meshyReq.setAiModel("meshy-7.1");
                meshyReq.setEnablePbr(true);
                meshyReq.setShouldRemesh(true);
                meshyReq.setWaitForResult(request.isWaitForResult());

                MeshyTaskResponse meshyResp = meshyService.generate(meshyReq);
                return ResponseEntity.ok(meshyResp);
            }

            TripoTaskResponse response = tripoService.generate(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("[Rooftop3DController] Bad request: {}", e.getMessage());
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(err);
        } catch (Exception e) {
            log.error("[Rooftop3DController] Internal error during 3D generation", e);
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(err);
        }
    }

    /**
     * GET /api/rooftops/generate-3d/status/{taskId}
     * Polls the live status of an in-flight Meshy or Tripo task.
     */
    @GetMapping("/generate-3d/status/{taskId}")
    public ResponseEntity<?> getStatus(
            @PathVariable("taskId") String taskId,
            @RequestParam(value = "apiKey", required = false) String apiKey) {

        boolean isMeshy = (apiKey != null && apiKey.startsWith("msy_"))
                || meshyProperties.isConfigured()
                || taskId.length() > 30; // Meshy uses UUID / long hex IDs

        if (isMeshy) {
            MeshyTaskResponse meshyResp = meshyService.checkStatus(taskId, apiKey);
            return ResponseEntity.ok(meshyResp);
        }

        TripoTaskResponse response = tripoService.checkStatus(taskId, apiKey);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/rooftops/generate-3d/health
     * Returns 3D generation service health and whether an API key is active.
     */
    @GetMapping("/generate-3d/health")
    public ResponseEntity<?> getHealth() {
        Map<String, Object> status = new HashMap<>();
        status.put("service", "Meshy AI 7.1 Flagship Mesh Generator");
        status.put("engine", "meshy-7.1");
        status.put("configured", meshyProperties.isConfigured() || tripoProperties.isConfigured());
        status.put("meshyConfigured", meshyProperties.isConfigured());
        status.put("tripoConfigured", tripoProperties.isConfigured());
        status.put("baseUrl", meshyProperties.getBaseUrl());
        status.put("version", "7.1");
        return ResponseEntity.ok(status);
    }
}
