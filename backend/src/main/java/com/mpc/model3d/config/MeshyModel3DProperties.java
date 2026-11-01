package com.mpc.model3d.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "meshy")
public class MeshyModel3DProperties {

    private String apiKey = "";
    private String baseUrl = "https://api.meshy.ai/openapi/v1";
    private String aiModel = "meshy-7.1";
    private String topology = "triangle";
    private int targetPolycount = 60000;
    private boolean shouldRemesh = true;
    private boolean shouldTexture = true;
    private boolean enablePbr = false;
    private boolean imageEnhancement = false;
    private boolean mockEnabled = true;
    private int pollingIntervalSeconds = 5;
    private int maxJobsPerUserPerDay = 10;
    private int maxGlobalJobsPerDay = 50;
    private int minBalanceCredits = 5;

    public MeshyModel3DProperties() {
    }

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

    public String getAiModel() {
        return aiModel;
    }

    public void setAiModel(String aiModel) {
        this.aiModel = aiModel;
    }

    public String getTopology() {
        return topology;
    }

    public void setTopology(String topology) {
        this.topology = topology;
    }

    public int getTargetPolycount() {
        return targetPolycount;
    }

    public void setTargetPolycount(int targetPolycount) {
        this.targetPolycount = targetPolycount;
    }

    public boolean isShouldRemesh() {
        return shouldRemesh;
    }

    public void setShouldRemesh(boolean shouldRemesh) {
        this.shouldRemesh = shouldRemesh;
    }

    public boolean isShouldTexture() {
        return shouldTexture;
    }

    public void setShouldTexture(boolean shouldTexture) {
        this.shouldTexture = shouldTexture;
    }

    public boolean isEnablePbr() {
        return enablePbr;
    }

    public void setEnablePbr(boolean enablePbr) {
        this.enablePbr = enablePbr;
    }

    public boolean isImageEnhancement() {
        return imageEnhancement;
    }

    public void setImageEnhancement(boolean imageEnhancement) {
        this.imageEnhancement = imageEnhancement;
    }

    public boolean isMockEnabled() {
        return mockEnabled;
    }

    public void setMockEnabled(boolean mockEnabled) {
        this.mockEnabled = mockEnabled;
    }

    public int getPollingIntervalSeconds() {
        return pollingIntervalSeconds;
    }

    public void setPollingIntervalSeconds(int pollingIntervalSeconds) {
        this.pollingIntervalSeconds = pollingIntervalSeconds;
    }

    public int getMaxJobsPerUserPerDay() {
        return maxJobsPerUserPerDay;
    }

    public void setMaxJobsPerUserPerDay(int maxJobsPerUserPerDay) {
        this.maxJobsPerUserPerDay = maxJobsPerUserPerDay;
    }

    public int getMaxGlobalJobsPerDay() {
        return maxGlobalJobsPerDay;
    }

    public void setMaxGlobalJobsPerDay(int maxGlobalJobsPerDay) {
        this.maxGlobalJobsPerDay = maxGlobalJobsPerDay;
    }

    public int getMinBalanceCredits() {
        return minBalanceCredits;
    }

    public void setMinBalanceCredits(int minBalanceCredits) {
        this.minBalanceCredits = minBalanceCredits;
    }
}
