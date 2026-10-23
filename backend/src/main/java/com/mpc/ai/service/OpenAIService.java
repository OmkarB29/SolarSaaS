package com.mpc.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mpc.ai.web.dto.AIRecommendationDTO;
import com.mpc.ai.web.dto.AIRecommendationRequest;
import com.mpc.ai.web.dto.ActionPlanStepDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class OpenAIService {

    private static final Logger log = LoggerFactory.getLogger(OpenAIService.class);

    @Value("${openai.api.key:}")
    private String apiKey;

    @Value("${openai.model:gpt-4o-mini}")
    private String model;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(6))
            .build();

    /**
     * Generate advisor response via OpenAI GPT API with fallback to deterministic heuristic advisor.
     */
    public AIRecommendationDTO generateAdvisorResponse(AIRecommendationRequest request) {
        if (apiKey != null && !apiKey.trim().isEmpty() && !apiKey.startsWith("${")) {
            try {
                return callOpenAiWithRetry(request);
            } catch (Exception e) {
                log.warn("OpenAI API call failed or timed out. Falling back to deterministic Solar Advisor heuristics: {}", e.getMessage());
            }
        } else {
            log.info("OpenAI API key not configured. Generating AI Solar Advisor recommendations via deterministic heuristics.");
        }

        return generateFallbackResponse(request);
    }

    private AIRecommendationDTO callOpenAiWithRetry(AIRecommendationRequest request) throws Exception {
        int maxRetries = 2;
        Exception lastException = null;

        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return executeOpenAiCall(request);
            } catch (Exception ex) {
                lastException = ex;
                log.warn("OpenAI call attempt {} failed: {}", attempt, ex.getMessage());
                if (attempt < maxRetries) {
                    Thread.sleep(800L * attempt);
                }
            }
        }

        throw lastException != null ? lastException : new RuntimeException("OpenAI invocation failed after retries.");
    }

    private AIRecommendationDTO executeOpenAiCall(AIRecommendationRequest request) throws Exception {
        String systemPrompt = """
                You are a senior Solar Technical & Financial Advisor for SolarSaaS.
                Your role is to interpret the user's technical solar analysis and produce natural-language recommendations, insights, risk assessments, and a step-by-step action plan.
                
                CRITICAL INSTRUCTIONS:
                1. You must NOT perform, calculate, or alter any numerical energy, irradiance, sizing, savings, or payback values. Use the provided numbers strictly as facts.
                2. Return valid JSON matching the exact schema below without markdown formatting or surrounding text.
                
                JSON Schema:
                {
                  "executiveSummary": "2-3 concise sentences summarizing solar viability, financial attractiveness, and environmental benefits.",
                  "installationAssessment": "Excellent" | "Good" | "Moderate" | "Poor",
                  "financialAssessment": "Excellent" | "Good" | "Moderate" | "Poor",
                  "batteryRecommendation": "Recommended" | "Optional" | "Not Required",
                  "riskAssessment": "Low" | "Medium" | "High",
                  "recommendations": [
                    "Actionable recommendation 1",
                    "Actionable recommendation 2",
                    "Actionable recommendation 3",
                    "Actionable recommendation 4",
                    "Actionable recommendation 5"
                  ],
                  "actionPlan": [
                    {"step": 1, "title": "Site Validation & Structural Assessment", "description": "Details..."},
                    {"step": 2, "title": "System Sizing & Net Metering Application", "description": "Details..."},
                    {"step": 3, "title": "Component Procurement", "description": "Details..."},
                    {"step": 4, "title": "Installation & Electrical Wiring", "description": "Details..."},
                    {"step": 5, "title": "Grid Synchronization & Commissioning", "description": "Details..."}
                  ]
                }
                """;

        String userPrompt = String.format("""
                Technical Solar Assessment Data:
                - Location / Address: %s
                - Solar Score: %.1f / 100
                - Annual Irradiance: %.1f kWh/m²
                - Estimated Annual Generation: %.0f kWh/year
                - Estimated Annual Financial Savings: ₹%.0f/year
                - Estimated Payback Period: %.1f years
                - Rooftop Area: %.1f m²
                - Usable Area: %.1f m²
                - System Capacity: %.1f kWp
                - Panel Count: %d modules (550W Tier-1 Monocrystalline)
                - Carbon Offset: %.0f kg CO₂/year
                - Equivalent Homes Powered: %.1f homes
                - Peak Sun Hours: %.1f hrs/day
                - Cloud Cover: %.1f%%
                - Ambient Temperature: %.1f °C
                
                Please generate the complete Solar Advisor evaluation.
                """,
                request.getAddress() != null ? request.getAddress() : "Client Rooftop Site",
                request.getSolarScore() != null ? request.getSolarScore() : 75.0,
                request.getAnnualIrradianceKwhM2() != null ? request.getAnnualIrradianceKwhM2() : 1850.0,
                request.getAnnualGeneration() != null ? request.getAnnualGeneration() : 25000.0,
                request.getAnnualSavings() != null ? request.getAnnualSavings() : 200000.0,
                request.getPaybackPeriod() != null ? request.getPaybackPeriod() : 4.5,
                request.getRoofArea() != null ? request.getRoofArea() : 120.0,
                request.getUsableArea() != null ? request.getUsableArea() : 90.0,
                request.getSystemSize() != null ? request.getSystemSize() : 18.0,
                request.getPanelCount() != null ? request.getPanelCount() : 32,
                request.getCarbonOffset() != null ? request.getCarbonOffset() : 20500.0,
                request.getHomesPowered() != null ? request.getHomesPowered() : 7.0,
                request.getPeakSunHours() != null ? request.getPeakSunHours() : 5.2,
                request.getCloudCoverPercent() != null ? request.getCloudCoverPercent() : 28.0,
                request.getTemperatureAvg() != null ? request.getTemperatureAvg() : 26.5
        );

        Map<String, Object> requestBodyMap = Map.of(
                "model", model,
                "response_format", Map.of("type", "json_object"),
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userPrompt)
                ),
                "temperature", 0.3,
                "max_tokens", 1200
        );

        String jsonPayload = objectMapper.writeValueAsString(requestBodyMap);

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create("https://api.openai.com/v1/chat/completions"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey.trim())
                .timeout(Duration.ofSeconds(8))
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                .build();

        HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new RuntimeException("OpenAI returned status " + response.statusCode() + ": " + response.body());
        }

        JsonNode rootNode = objectMapper.readTree(response.body());
        String contentJson = rootNode.path("choices").get(0).path("message").path("content").asText();

        return parseAdvisorJson(contentJson, request);
    }

    private AIRecommendationDTO parseAdvisorJson(String contentJson, AIRecommendationRequest request) {
        try {
            JsonNode parsed = objectMapper.readTree(contentJson);
            AIRecommendationDTO dto = new AIRecommendationDTO();

            dto.setAnalysisId(request.getAnalysisId());
            dto.setSolarScore(request.getSolarScore());
            dto.setAnnualGeneration(request.getAnnualGeneration());
            dto.setAnnualSavings(request.getAnnualSavings());
            dto.setPaybackPeriod(request.getPaybackPeriod());
            dto.setGeneratedAt(Instant.now());

            dto.setExecutiveSummary(parsed.path("executiveSummary").asText(""));
            dto.setInstallationAssessment(normalizeAssessment(parsed.path("installationAssessment").asText("Good")));
            dto.setFinancialAssessment(normalizeAssessment(parsed.path("financialAssessment").asText("Good")));
            dto.setBatteryRecommendation(normalizeBattery(parsed.path("batteryRecommendation").asText("Optional")));
            dto.setRiskAssessment(normalizeRisk(parsed.path("riskAssessment").asText("Low")));

            List<String> recs = new ArrayList<>();
            if (parsed.has("recommendations") && parsed.get("recommendations").isArray()) {
                for (JsonNode recNode : parsed.get("recommendations")) {
                    recs.add(recNode.asText());
                }
            }
            if (recs.isEmpty()) {
                recs.add("Proceed with turnkey rooftop solar installation.");
                recs.add("Install high-efficiency Tier-1 monocrystalline PV modules.");
                recs.add("Apply for DISCOM net metering grid interconnection.");
            }
            dto.setRecommendations(recs);

            List<ActionPlanStepDTO> steps = new ArrayList<>();
            if (parsed.has("actionPlan") && parsed.get("actionPlan").isArray()) {
                int stepNum = 1;
                for (JsonNode stepNode : parsed.get("actionPlan")) {
                    int s = stepNode.has("step") ? stepNode.get("step").asInt(stepNum) : stepNum;
                    String title = stepNode.path("title").asText("Implementation Step " + s);
                    String desc = stepNode.path("description").asText("");
                    steps.add(new ActionPlanStepDTO(s, title, desc));
                    stepNum++;
                }
            }
            if (steps.isEmpty()) {
                steps = getDefaultActionPlan(request);
            }
            dto.setActionPlan(steps);

            return dto;
        } catch (Exception e) {
            log.warn("Failed to parse OpenAI JSON output: {}. Falling back.", e.getMessage());
            return generateFallbackResponse(request);
        }
    }

    /**
     * Deterministic Solar Advisor heuristic fallback engine.
     */
    public AIRecommendationDTO generateFallbackResponse(AIRecommendationRequest request) {
        AIRecommendationDTO dto = new AIRecommendationDTO();

        double score = request.getSolarScore() != null ? request.getSolarScore() : 75.0;
        double payback = request.getPaybackPeriod() != null ? request.getPaybackPeriod() : 5.0;
        double cloud = request.getCloudCoverPercent() != null ? request.getCloudCoverPercent() : 30.0;
        double annualGen = request.getAnnualGeneration() != null ? request.getAnnualGeneration() : 20000.0;
        double savings = request.getAnnualSavings() != null ? request.getAnnualSavings() : 160000.0;
        double systemSize = request.getSystemSize() != null ? request.getSystemSize() : 15.0;
        int panels = request.getPanelCount() != null ? request.getPanelCount() : 28;
        String address = request.getAddress() != null && !request.getAddress().isBlank() ? request.getAddress() : "Rooftop Site";

        dto.setAnalysisId(request.getAnalysisId());
        dto.setSolarScore(score);
        dto.setAnnualGeneration(annualGen);
        dto.setAnnualSavings(savings);
        dto.setPaybackPeriod(payback);
        dto.setGeneratedAt(Instant.now());

        // 1. Installation Assessment
        if (score >= 85.0) {
            dto.setInstallationAssessment("Excellent");
        } else if (score >= 70.0) {
            dto.setInstallationAssessment("Good");
        } else if (score >= 55.0) {
            dto.setInstallationAssessment("Moderate");
        } else {
            dto.setInstallationAssessment("Poor");
        }

        // 2. Financial Assessment
        if (payback <= 4.2) {
            dto.setFinancialAssessment("Excellent");
        } else if (payback <= 6.5) {
            dto.setFinancialAssessment("Good");
        } else if (payback <= 9.0) {
            dto.setFinancialAssessment("Moderate");
        } else {
            dto.setFinancialAssessment("Poor");
        }

        // 3. Battery Recommendation
        if (cloud >= 45.0 || payback <= 4.0 || systemSize >= 25.0) {
            dto.setBatteryRecommendation("Recommended");
        } else if (cloud >= 25.0 || systemSize >= 10.0) {
            dto.setBatteryRecommendation("Optional");
        } else {
            dto.setBatteryRecommendation("Not Required");
        }

        // 4. Risk Assessment
        if (payback <= 5.5 && score >= 70.0) {
            dto.setRiskAssessment("Low");
        } else if (payback <= 8.0 || score >= 50.0) {
            dto.setRiskAssessment("Medium");
        } else {
            dto.setRiskAssessment("High");
        }

        // 5. Executive Summary
        String financialSummary = payback <= 5.0
                ? "highly attractive financial metrics and rapid amortization"
                : "solid long-term utility bill hedge and dependable return on investment";

        dto.setExecutiveSummary(String.format(
                "Your rooftop at %s demonstrates a Solar Score of %.1f/100 with an annual yield potential of %,.0f kWh. With an estimated payback period of %.1f years and annual savings of ₹%,.0f, the project exhibits %s, reducing approximately %,.0f kg of carbon emissions annually.",
                address, score, annualGen, payback, savings, financialSummary, request.getCarbonOffset() != null ? request.getCarbonOffset() : annualGen * 0.82
        ));

        // 6. Contextual Recommendations
        List<String> recs = new ArrayList<>();
        if (score >= 70.0) {
            recs.add("Proceed with installation to capitalize on high solar exposure and short payback timeframe.");
        } else {
            recs.add("Proceed with installation while positioning panels to mitigate seasonal shading.");
        }

        recs.add(String.format("Deploy Tier-1 %d-panel monocrystalline array (%.1f kWp) with an efficiency rating of 21%% or higher.", panels, systemSize));

        if ("Recommended".equals(dto.getBatteryRecommendation())) {
            recs.add("Integrate a dedicated LiFePO4 battery energy storage system to provide peak shaving and grid outage protection.");
        } else {
            recs.add("Opt for a hybrid grid-tie inverter to allow plug-and-play battery storage expansion in the future.");
        }

        recs.add("Apply for DISCOM net metering to export excess daytime solar generation at regulated feed-in tariffs.");
        recs.add("Utilize an automated module cleaning sprinkler system to sustain peak energy harvest throughout dusty dry seasons.");
        recs.add("Incorporate IoT-enabled string monitoring to immediately detect any panel-level shading or inverter clipping.");
        dto.setRecommendations(recs);

        // 7. Action Plan
        dto.setActionPlan(getDefaultActionPlan(request));

        return dto;
    }

    private List<ActionPlanStepDTO> getDefaultActionPlan(AIRecommendationRequest request) {
        List<ActionPlanStepDTO> steps = new ArrayList<>();
        double size = request.getSystemSize() != null ? request.getSystemSize() : 15.0;

        steps.add(new ActionPlanStepDTO(1, "Site Validation & Structural Survey",
                "Engage a certified solar EPC structural engineer to inspect rooftop load integrity, wind load resistance, and cable pathways."));
        steps.add(new ActionPlanStepDTO(2, "Engineering Design & DISCOM Approval",
                String.format("Finalize electrical single-line diagrams (SLD) for the %.1f kWp array and submit the net metering grid-tie application.", size)));
        steps.add(new ActionPlanStepDTO(3, "Equipment Procurement & Quality Check",
                "Source Tier-1 monocrystalline half-cut modules, string inverters with dual MPPTs, and pre-galvanized mounting structures."));
        steps.add(new ActionPlanStepDTO(4, "Mechanical & Electrical Installation",
                "Install rooftop railing mounts, secure panels, run fire-retardant DC cabling, and install lightning protection earthing pits."));
        steps.add(new ActionPlanStepDTO(5, "DISCOM Inspection & Grid Synchronization",
                "Install the bidirectional generation meter, complete joint utility inspection, and commission live clean solar generation."));
        return steps;
    }

    private String normalizeAssessment(String val) {
        if (val == null) return "Good";
        String s = val.trim().toLowerCase();
        if (s.contains("excel")) return "Excellent";
        if (s.contains("good")) return "Good";
        if (s.contains("mod")) return "Moderate";
        if (s.contains("poor") || s.contains("low")) return "Poor";
        return "Good";
    }

    private String normalizeBattery(String val) {
        if (val == null) return "Optional";
        String s = val.trim().toLowerCase();
        if (s.contains("rec")) return "Recommended";
        if (s.contains("opt")) return "Optional";
        if (s.contains("not") || s.contains("no")) return "Not Required";
        return "Optional";
    }

    private String normalizeRisk(String val) {
        if (val == null) return "Low";
        String s = val.trim().toLowerCase();
        if (s.contains("low")) return "Low";
        if (s.contains("med")) return "Medium";
        if (s.contains("high")) return "High";
        return "Low";
    }
}
