package com.mpc.scene3d.meshy.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mpc.scene3d.meshy.config.MeshyProperties;
import com.mpc.scene3d.meshy.dto.MeshyGenerateRequest;
import com.mpc.scene3d.meshy.dto.MeshyTaskResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.UUID;

@Service
public class MeshyService {

    private static final Logger log = LoggerFactory.getLogger(MeshyService.class);

    private final MeshyProperties properties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    @Value("${google.maps.api.key:}")
    private String googleMapsApiKey;

    public MeshyService(MeshyProperties properties) {
        this.properties = properties;
        this.objectMapper = new ObjectMapper();
        this.httpClient = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_2)
                .connectTimeout(Duration.ofSeconds(20))
                .build();
    }

    private String resolveApiKey(String overrideApiKey) {
        if (overrideApiKey != null && !overrideApiKey.trim().isEmpty()) {
            return overrideApiKey.trim();
        }
        return properties.getApiKey();
    }

    private URI getTaskCreationUri() {
        String base = properties.getBaseUrl().replaceAll("/+$", "");
        return URI.create(base + "/image-to-3d");
    }

    private URI getTaskStatusUri(String taskId) {
        String base = properties.getBaseUrl().replaceAll("/+$", "");
        return URI.create(base + "/image-to-3d/" + taskId);
    }

    /**
     * Submits an Image-to-3D task to Meshy 7.1 Flagship.
     */
    public String submitTask(String imageUrl, String aiModel, String mode, boolean enablePbr, boolean shouldRemesh, String overrideApiKey) {
        String apiKey = resolveApiKey(overrideApiKey);
        if (apiKey == null || apiKey.trim().isEmpty()) {
            log.info("[MeshyService] No Meshy API Key provided. Returning instant demo simulation asset.");
            return "demo-" + UUID.randomUUID().toString().substring(0, 8);
        }
        if (!apiKey.startsWith("msy_")) {
            throw new IllegalArgumentException("Invalid Meshy API Key: Meshy keys must start with 'msy_'. Please copy the key from https://www.meshy.ai/workspace.");
        }

        try {
            ObjectNode root = objectMapper.createObjectNode();
            root.put("image_url", imageUrl);
            root.put("ai_model", (aiModel != null && !aiModel.isBlank()) ? aiModel : "meshy-7.1");
            root.put("should_texture", true);
            root.put("enable_pbr", enablePbr);
            root.put("should_remesh", shouldRemesh);
            root.put("geometry_resolution", "high_detail".equalsIgnoreCase(mode) ? "4k" : "standard");

            String requestBody = objectMapper.writeValueAsString(root);
            URI creationUri = getTaskCreationUri();

            log.info("[MeshyService] Submitting task to {}", creationUri);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(creationUri)
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .timeout(Duration.ofSeconds(30))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 400) {
                log.error("[MeshyService] Error response from Meshy {}: {}", response.statusCode(), response.body());
                if (response.statusCode() == 401) {
                    throw new RuntimeException("Meshy Authentication Failed (HTTP 401): Invalid API Key. Ensure your key starts with 'msy_'.");
                }
                throw new RuntimeException("Meshy API rejected request (HTTP " + response.statusCode() + "): " + response.body());
            }

            JsonNode respNode = objectMapper.readTree(response.body());
            String taskId = null;
            if (respNode.has("result")) {
                taskId = respNode.get("result").asText();
            } else if (respNode.has("id")) {
                taskId = respNode.get("id").asText();
            }

            if (taskId == null || taskId.isEmpty()) {
                throw new RuntimeException("No taskId returned in Meshy response: " + response.body());
            }

            log.info("[MeshyService] Task successfully created with ID: {}", taskId);
            return taskId;
        } catch (Exception e) {
            log.error("[MeshyService] Failed to create Meshy 3D task", e);
            throw new RuntimeException("Failed to initiate Meshy 3D task: " + e.getMessage(), e);
        }
    }

    /**
     * Polls the status of an ongoing Meshy 3D task.
     */
    public MeshyTaskResponse checkStatus(String taskId, String overrideApiKey) {
        if (taskId != null && taskId.startsWith("demo-")) {
            MeshyTaskResponse demoResp = new MeshyTaskResponse(taskId, "success");
            demoResp.setProgress(100);
            demoResp.setModelGlbUrl("/models/industrial_hvac_facility.glb");
            demoResp.setMessage("Meshy 7.1 Flagship 3D mesh compiled successfully (Demo Mode)");
            return demoResp;
        }
        String apiKey = resolveApiKey(overrideApiKey);
        try {
            URI statusUri = getTaskStatusUri(taskId);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(statusUri)
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .GET()
                    .timeout(Duration.ofSeconds(15))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 400) {
                log.warn("[MeshyService] Status check HTTP {}: {}", response.statusCode(), response.body());
                return MeshyTaskResponse.failed(taskId, "HTTP " + response.statusCode() + ": " + response.body());
            }

            JsonNode root = objectMapper.readTree(response.body());
            String status = root.has("status") ? root.get("status").asText() : "unknown";
            int progress = root.has("progress") ? root.get("progress").asInt() : 0;

            MeshyTaskResponse resp = new MeshyTaskResponse(taskId, status.toLowerCase());
            resp.setProgress(progress);

            if ("SUCCEEDED".equalsIgnoreCase(status)) {
                if (root.has("model_urls")) {
                    JsonNode urls = root.get("model_urls");
                    if (urls.has("glb")) resp.setModelGlbUrl(urls.get("glb").asText());
                    if (urls.has("fbx")) resp.setModelFbxUrl(urls.get("fbx").asText());
                }
                if (root.has("thumbnail_url")) {
                    resp.setThumbnailUrl(root.get("thumbnail_url").asText());
                }
                resp.setStatus("success");
                resp.setProgress(100);
                resp.setMessage("Meshy 7.1 Flagship 3D mesh compiled successfully");
            } else if ("FAILED".equalsIgnoreCase(status)) {
                String errorMsg = root.has("task_error") ? root.get("task_error").asText() : "Meshy task failed";
                resp.setMessage(errorMsg);
            } else {
                resp.setMessage("Processing 3D geometry & PBR materials (" + progress + "%)...");
            }

            return resp;
        } catch (Exception e) {
            log.error("[MeshyService] Error polling status for {}", taskId, e);
            return MeshyTaskResponse.failed(taskId, "Error polling Meshy task status: " + e.getMessage());
        }
    }

    public String buildSatelliteImageUrl(double lat, double lng, int zoom) {
        int effectiveZoom = zoom > 0 ? zoom : 19;
        return String.format(
                "https://maps.googleapis.com/maps/api/staticmap?center=%f,%f&zoom=%d&size=640x640&maptype=satellite&key=%s",
                lat, lng, effectiveZoom, googleMapsApiKey
        );
    }

    public MeshyTaskResponse generate(MeshyGenerateRequest req) {
        String targetUrl = req.getImageUrl();
        if ((targetUrl == null || targetUrl.trim().isEmpty())
                && req.getLatitude() != null && req.getLongitude() != null) {
            targetUrl = buildSatelliteImageUrl(req.getLatitude(), req.getLongitude(), req.getZoom());
        }

        if (targetUrl == null || targetUrl.trim().isEmpty()) {
            throw new IllegalArgumentException("Either 'imageUrl' or 'latitude' + 'longitude' must be provided.");
        }

        String taskId = submitTask(
                targetUrl,
                req.getAiModel(),
                req.getMode(),
                req.isEnablePbr(),
                req.isShouldRemesh(),
                req.getApiKey()
        );

        if (taskId != null && taskId.startsWith("demo-")) {
            MeshyTaskResponse demoResp = new MeshyTaskResponse(taskId, "success");
            demoResp.setProgress(100);
            demoResp.setModelGlbUrl("/models/industrial_hvac_facility.glb");
            demoResp.setThumbnailUrl(targetUrl);
            demoResp.setMessage("Meshy 7.1 Flagship 3D mesh compiled successfully (Demo Mode)");
            return demoResp;
        }

        MeshyTaskResponse initial = MeshyTaskResponse.queued(taskId, targetUrl);
        initial.setMessage("Task submitted to Meshy 7.1. Polling for completion...");
        return initial;
    }
}
