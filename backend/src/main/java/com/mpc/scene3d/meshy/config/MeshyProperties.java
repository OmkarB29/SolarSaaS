package com.mpc.scene3d.meshy.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class MeshyProperties {

    @Value("${meshy.api.key:}")
    private String apiKey;

    @Value("${meshy.api.base-url:https://api.meshy.ai/openapi/v1}")
    private String baseUrl;

    @Value("${meshy.api.polling-interval-ms:2500}")
    private long pollingIntervalMs;

    @Value("${meshy.api.max-polling-seconds:180}")
    private int maxPollingSeconds;

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public long getPollingIntervalMs() {
        return pollingIntervalMs;
    }

    public void setPollingIntervalMs(long pollingIntervalMs) {
        this.pollingIntervalMs = pollingIntervalMs;
    }

    public int getMaxPollingSeconds() {
        return maxPollingSeconds;
    }

    public void setMaxPollingSeconds(int maxPollingSeconds) {
        this.maxPollingSeconds = maxPollingSeconds;
    }

    public boolean isConfigured() {
        return apiKey != null && apiKey.trim().startsWith("msy_");
    }
}
