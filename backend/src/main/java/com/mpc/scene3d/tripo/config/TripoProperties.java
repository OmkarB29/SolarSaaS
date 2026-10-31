package com.mpc.scene3d.tripo.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class TripoProperties {

    @Value("${tripo.api.key:}")
    private String apiKey;

    @Value("${tripo.api.base-url:https://openapi.tripo3d.ai/v3}")
    private String baseUrl;

    @Value("${tripo.api.polling-interval-ms:2500}")
    private long pollingIntervalMs;

    @Value("${tripo.api.max-polling-seconds:120}")
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
        return apiKey != null && apiKey.trim().startsWith("tsk_");
    }
}
