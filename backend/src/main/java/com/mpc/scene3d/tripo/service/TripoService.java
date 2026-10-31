package com.mpc.scene3d.tripo.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mpc.scene3d.tripo.config.TripoProperties;
import com.mpc.scene3d.tripo.dto.TripoGenerateRequest;
import com.mpc.scene3d.tripo.dto.TripoTaskResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.concurrent.CompletableFuture;

@Service
public class TripoService {

    private static final Logger log = LoggerFactory.getLogger(TripoService.class);

    private final TripoProperties properties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    @Value("${google.maps.api.key:}")
    private String googleMapsApiKey;

    public TripoService(TripoProperties properties) {
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

    /**
     * Constructs the creation endpoint URI based on configured base URL.
     */
    private URI getTaskCreationUri() {
        String base = properties.getBaseUrl().replaceAll("/+$", "");
        if (base.endsWith("/generation/image-to-model")) {
            return URI.create(base);
        }
        if (base.endsWith("/v3")) {
            return URI.create(base + "/generation/image-to-model");
        }
        if (base.contains("/v2")) {
            return URI.create(base + "/task");
        }
        return URI.create(base + "/generation/image-to-model");
    }

    /**
     * Constructs the status polling endpoint URI for a given task ID.
     */
    private URI getTaskStatusUri(String taskId) {
        String base = properties.getBaseUrl().replaceAll("/+$", "");
        if (base.contains("/v2")) {
            return URI.create(base + "/task/" + taskId);
        }
        if (base.endsWith("/generation/image-to-model")) {
            String root = base.substring(0, base.indexOf("/generation"));
            return URI.create(root + "/tasks/" + taskId);
        }
        if (base.endsWith("/v3")) {
            return URI.create(base + "/tasks/" + taskId);
        }
        return URI.create(base + "/tasks/" + taskId);
    }

    /**
     * Submits an asynchronous Image-to-Model task to Tripo AI V3.
     */
    public String submitTask(String imageUrl, String modelVersion, String overrideApiKey) {
        String apiKey = resolveApiKey(overrideApiKey);
        if (apiKey == null || apiKey.trim().isEmpty()) {
            throw new IllegalArgumentException("Tripo API Secret Key is not configured. Please supply a valid secret key starting with 'tsk_' in the UI or set TRIPO_API_KEY on the server.");
        }
        if (apiKey.startsWith("tcli_")) {
            throw new IllegalArgumentException("Invalid API Key: You provided a Tripo Client ID ('tcli_...'). The Tripo API requires a Secret Key starting with 'tsk_'. Please copy the Secret Key from https://platform.tripo3d.ai.");
        }
        if (!apiKey.startsWith("tsk_")) {
            throw new IllegalArgumentException("Invalid API Key: Tripo Secret Keys must start with 'tsk_'. Please verify your key at https://platform.tripo3d.ai.");
        }

        try {
            ObjectNode root = objectMapper.createObjectNode();
            root.put("type", "image_to_model");
            String resolvedModel = (modelVersion != null && !modelVersion.isBlank() && !"v3-geometry".equalsIgnoreCase(modelVersion))
                    ? modelVersion.trim()
                    : "v3.1-20260211";
            root.put("model_version", resolvedModel);
            root.put("model", resolvedModel);

            ObjectNode fileNode = root.putObject("file");
            fileNode.put("type", "jpg");
            fileNode.put("url", imageUrl);

            String requestBody = objectMapper.writeValueAsString(root);
            URI creationUri = getTaskCreationUri();

            log.info("[TripoService] Submitting task to {} for image: {}", creationUri, imageUrl);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(creationUri)
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .timeout(Duration.ofSeconds(30))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 400) {
                log.error("[TripoService] Error response from Tripo {}: {}", response.statusCode(), response.body());
                if (response.statusCode() == 401) {
                    throw new RuntimeException("Tripo API Authentication Failed (HTTP 401). Please verify your Tripo Secret Key ('tsk_...'). Note: Client IDs ('tcli_...') cannot authenticate. Full response: " + response.body());
                }
                throw new RuntimeException("Tripo API rejected request with HTTP " + response.statusCode() + ": " + response.body());
            }

            JsonNode respNode = objectMapper.readTree(response.body());
            String taskId = null;
            if (respNode.has("data") && respNode.get("data").has("task_id")) {
                taskId = respNode.get("data").get("task_id").asText();
            } else if (respNode.has("task_id")) {
                taskId = respNode.get("task_id").asText();
            } else if (respNode.has("id")) {
                taskId = respNode.get("id").asText();
            }

            if (taskId == null || taskId.isEmpty()) {
                throw new RuntimeException("No taskId returned in Tripo response: " + response.body());
            }

            log.info("[TripoService] Task successfully created with ID: {}", taskId);
            return taskId;
        } catch (Exception e) {
            log.error("[TripoService] Failed to create Tripo 3D task", e);
            throw new RuntimeException("Failed to initiate Tripo 3D task: " + e.getMessage(), e);
        }
    }

    /**
     * Polls the status of an ongoing Tripo 3D generation task.
     */
    public TripoTaskResponse checkStatus(String taskId, String overrideApiKey) {
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
                log.warn("[TripoService] Status check returned HTTP {}: {}", response.statusCode(), response.body());
                return TripoTaskResponse.failed(taskId, "HTTP " + response.statusCode() + ": " + response.body());
            }

            JsonNode root = objectMapper.readTree(response.body());
            JsonNode dataNode = root.has("data") ? root.get("data") : root;

            String status = dataNode.has("status") ? dataNode.get("status").asText() : "unknown";
            int progress = dataNode.has("progress") ? dataNode.get("progress").asInt() : 0;

            TripoTaskResponse resp = new TripoTaskResponse(taskId, status.toLowerCase());
            resp.setProgress(progress);

            if ("success".equalsIgnoreCase(status)) {
                String modelUrl = extractModelUrl(dataNode);
                resp.setModelGlbUrl(modelUrl);
                resp.setProgress(100);
                resp.setMessage("3D model mesh compiled and ready for R3F rendering");
            } else if ("failed".equalsIgnoreCase(status) || "banned".equalsIgnoreCase(status)) {
                String errorMsg = dataNode.has("error") ? dataNode.get("error").asText() : "Task processing failed";
                resp.setMessage(errorMsg);
            } else {
                resp.setMessage("Task in progress: " + status + " (" + progress + "%)");
            }

            return resp;
        } catch (Exception e) {
            log.error("[TripoService] Error checking status for task {}", taskId, e);
            return TripoTaskResponse.failed(taskId, "Error polling task status: " + e.getMessage());
        }
    }

    private String extractModelUrl(JsonNode node) {
        if (node.has("output")) {
            JsonNode output = node.get("output");
            if (output.has("model")) return output.get("model").asText();
            if (output.has("pbr_model")) return output.get("pbr_model").asText();
            if (output.has("model_url")) return output.get("model_url").asText();
            if (output.isTextual()) return output.asText();
        }
        if (node.has("model")) return node.get("model").asText();
        if (node.has("model_url")) return node.get("model_url").asText();
        return null;
    }

    /**
     * Synchronously polls task until success or timeout.
     */
    public TripoTaskResponse pollUntilComplete(String taskId, String originalImageUrl, String overrideApiKey) {
        long start = System.currentTimeMillis();
        int maxSeconds = properties.getMaxPollingSeconds();
        long interval = properties.getPollingIntervalMs();

        log.info("[TripoService] Starting polling loop for task {} (timeout: {}s)", taskId, maxSeconds);

        while ((System.currentTimeMillis() - start) < (maxSeconds * 1000L)) {
            TripoTaskResponse statusResp = checkStatus(taskId, overrideApiKey);
            statusResp.setOriginalImageUrl(originalImageUrl);
            statusResp.setElapsedMs(System.currentTimeMillis() - start);

            if ("success".equalsIgnoreCase(statusResp.getStatus())) {
                log.info("[TripoService] Task {} succeeded in {}ms. Model: {}",
                        taskId, statusResp.getElapsedMs(), statusResp.getModelGlbUrl());
                return statusResp;
            }

            if ("failed".equalsIgnoreCase(statusResp.getStatus()) || "banned".equalsIgnoreCase(statusResp.getStatus())) {
                log.warn("[TripoService] Task {} failed with message: {}", taskId, statusResp.getMessage());
                return statusResp;
            }

            try {
                Thread.sleep(interval);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return TripoTaskResponse.failed(taskId, "Polling interrupted");
            }
        }

        return TripoTaskResponse.failed(taskId, "Polling timed out after " + maxSeconds + " seconds");
    }

    /**
     * Builds a high-resolution Google Maps Static Satellite Image URL from coordinates.
     */
    public String buildSatelliteImageUrl(double lat, double lng, int zoom) {
        int effectiveZoom = zoom > 0 ? zoom : 19;
        return String.format(
                "https://maps.googleapis.com/maps/api/staticmap?center=%f,%f&zoom=%d&size=640x640&maptype=satellite&key=%s",
                lat, lng, effectiveZoom, googleMapsApiKey
        );
    }

    /**
     * High-level entrypoint: handles URL resolution, async dispatch, and optional polling.
     */
    public TripoTaskResponse generate(TripoGenerateRequest req) {
        String targetUrl = req.getImageUrl();
        if ((targetUrl == null || targetUrl.trim().isEmpty())
                && req.getLatitude() != null && req.getLongitude() != null) {
            targetUrl = buildSatelliteImageUrl(req.getLatitude(), req.getLongitude(), req.getZoom());
        }

        if (targetUrl == null || targetUrl.trim().isEmpty()) {
            throw new IllegalArgumentException("Either 'imageUrl' or 'latitude' + 'longitude' must be provided.");
        }

        String taskId = submitTask(targetUrl, req.getModelVersion(), req.getApiKey());

        if (req.isWaitForResult()) {
            return pollUntilComplete(taskId, targetUrl, req.getApiKey());
        }

        TripoTaskResponse initial = TripoTaskResponse.queued(taskId, targetUrl);
        initial.setMessage("Task submitted. Poll /api/rooftops/generate-3d/status/" + taskId + " for updates.");
        return initial;
    }
}
