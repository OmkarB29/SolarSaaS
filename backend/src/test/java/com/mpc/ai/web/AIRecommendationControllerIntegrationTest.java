package com.mpc.ai.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mpc.MpcApplication;
import com.mpc.ai.repository.AIRecommendationRepository;
import com.mpc.analysis.repository.AnalysisRepository;
import com.mpc.proposal.repository.ProposalRepository;
import com.mpc.report.repository.ReportRepository;
import com.mpc.solar.repository.SolarPotentialRepository;
import com.mpc.user.repository.UserRepository;
import jakarta.servlet.Filter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.context.WebApplicationContext;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.setup.MockMvcBuilders.webAppContextSetup;

@SpringBootTest(classes = MpcApplication.class)
class AIRecommendationControllerIntegrationTest {

    @Autowired
    private AIRecommendationRepository aiRecommendationRepository;

    @Autowired
    private com.mpc.paneloptimizer.repository.PanelLayoutRepository panelLayoutRepository;

    @Autowired
    private ProposalRepository proposalRepository;

    @Autowired
    private SolarPotentialRepository solarPotentialRepository;

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private AnalysisRepository analysisRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private Filter springSecurityFilterChain;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setup() {
        mockMvc = webAppContextSetup(webApplicationContext)
                .addFilters(springSecurityFilterChain)
                .build();
        panelLayoutRepository.deleteAll();
        aiRecommendationRepository.deleteAll();
        proposalRepository.deleteAll();
        solarPotentialRepository.deleteAll();
        reportRepository.deleteAll();
        analysisRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void testGenerateLatestAndHistoryWithUserIsolation() throws Exception {
        String userAToken = registerAndLogin("Solar Advisor User A", "advisor.a@example.com");
        String userBToken = registerAndLogin("Solar Advisor User B", "advisor.b@example.com");

        String requestBody = """
                {
                  "address": "Baner Road, Pune",
                  "solarScore": 82.5,
                  "annualIrradianceKwhM2": 1920.0,
                  "annualGeneration": 28500.0,
                  "annualSavings": 228000.0,
                  "paybackPeriod": 3.9,
                  "roofArea": 145.0,
                  "usableArea": 108.7,
                  "systemSize": 21.7,
                  "panelCount": 39,
                  "carbonOffset": 23370.0,
                  "homesPowered": 8.1,
                  "peakSunHours": 5.3,
                  "cloudCoverPercent": 24.0,
                  "temperatureAvg": 27.2
                }
                """;

        // 1. User A generates recommendation
        String postResponse = mockMvc.perform(post("/api/ai/recommendation/generate")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.installationAssessment").value("Good"))
                .andExpect(jsonPath("$.financialAssessment").value("Excellent"))
                .andExpect(jsonPath("$.riskAssessment").value("Low"))
                .andExpect(jsonPath("$.executiveSummary").isNotEmpty())
                .andExpect(jsonPath("$.recommendations").isArray())
                .andExpect(jsonPath("$.actionPlan").isArray())
                .andReturn().getResponse().getContentAsString();

        Long recommendationId = objectMapper.readTree(postResponse).get("id").asLong();
        assertThat(recommendationId).isNotNull();

        // 2. User A retrieves latest recommendation
        mockMvc.perform(get("/api/ai/recommendation/latest")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(recommendationId))
                .andExpect(jsonPath("$.solarScore").value(82.5));

        // 3. User A retrieves recommendation by ID
        mockMvc.perform(get("/api/ai/recommendation/" + recommendationId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(recommendationId));

        // 4. User A history contains 1 record
        mockMvc.perform(get("/api/ai/recommendation/history")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(recommendationId));

        // 5. User B history is completely isolated and empty
        mockMvc.perform(get("/api/ai/recommendation/history")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userBToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        // 6. User B cannot access User A's recommendation by ID (404)
        mockMvc.perform(get("/api/ai/recommendation/" + recommendationId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userBToken))
                .andExpect(status().isNotFound());
    }

    private String registerAndLogin(String name, String email) throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "%s",
                                  "email": "%s",
                                  "password": "password123"
                                }
                                """.formatted(name, email)))
                .andExpect(status().isCreated());

        String loginResponse = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "password": "password123"
                                }
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        return objectMapper.readTree(loginResponse).get("token").asText();
    }
}