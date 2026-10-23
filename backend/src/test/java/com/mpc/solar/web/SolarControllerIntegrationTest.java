package com.mpc.solar.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mpc.MpcApplication;
import com.mpc.solar.repository.SolarPotentialRepository;
import com.mpc.solar.service.SolarPotentialService;
import com.mpc.solar.web.dto.SolarPotentialDTO;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.setup.MockMvcBuilders.webAppContextSetup;

@SpringBootTest(classes = MpcApplication.class)
class SolarControllerIntegrationTest {

    @Autowired
    private SolarPotentialRepository solarPotentialRepository;

    @Autowired
    private com.mpc.proposal.repository.ProposalRepository proposalRepository;

    @Autowired
    private com.mpc.report.repository.ReportRepository reportRepository;

    @Autowired
    private com.mpc.analysis.repository.AnalysisRepository analysisRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SolarPotentialService solarPotentialService;

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private Filter springSecurityFilterChain;

    @Autowired
    private com.mpc.ai.repository.AIRecommendationRepository aiRecommendationRepository;

    @Autowired
    private com.mpc.paneloptimizer.repository.PanelLayoutRepository panelLayoutRepository;

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
    void testCalculationsAndParsing() throws Exception {
        SolarPotentialDTO dto = solarPotentialService.assessSolarPotential(18.5204, 73.8567, 150.0, "Pune Rooftop Site");

        assertThat(dto.getRoofAreaM2()).isEqualTo(150.0);
        assertThat(dto.getEstimatedPanelCount()).isGreaterThan(0);
        assertThat(dto.getAnnualGenerationKwh()).isGreaterThan(0.0);
        assertThat(dto.getRoofUtilizationPercent()).isGreaterThan(0.0);
        assertThat(dto.getSolarScore()).isGreaterThan(0.0);
        assertThat(dto.getCarbonOffsetKg()).isGreaterThan(0.0);
        assertThat(dto.getHomesPowered()).isGreaterThan(0.0);
        assertThat(dto.getAnnualSavings()).isGreaterThan(0.0);
        assertThat(dto.getMonthlyGeneration()).hasSize(12);
        assertThat(dto.getRecommendations()).isNotEmpty();
    }

    @Test
    void testSaveListAndRestrictsSolarPotentialToOwner() throws Exception {
        String userAToken = registerAndLogin("Solar User A", "solar.a@example.com");
        String userBToken = registerAndLogin("Solar User B", "solar.b@example.com");

        String savePayload = """
                {
                  "latitude": 18.5204,
                  "longitude": 73.8567,
                  "address": "MG Road, Pune",
                  "roofAreaM2": 140.0,
                  "maxArrayPanels": 36,
                  "maxArrayArea": 72.0,
                  "annualEnergyKwh": 21000.0,
                  "yearlySunshineHours": 1800.0,
                  "roofSegmentsCount": 2,
                  "solarScore": 84.5,
                  "roofUtilizationPercent": 51.4,
                  "carbonOffsetKg": 17220.0,
                  "homesPowered": 6.0,
                  "annualSavings": 178500.0,
                  "paybackPeriod": 3.8
                }
                """;

        // User A saves solar potential assessment
        String response = mockMvc.perform(post("/api/solar/potential")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(savePayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.solarScore").value(84.5))
                .andExpect(jsonPath("$.address").value("MG Road, Pune"))
                .andReturn().getResponse().getContentAsString();

        Long solarId = objectMapper.readTree(response).get("id").asLong();

        // User A can fetch in history
        mockMvc.perform(get("/api/solar/history")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(solarId));

        // User B cannot see User A's assessment in history
        mockMvc.perform(get("/api/solar/history")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userBToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        // User B cannot fetch User A's assessment by ID (404 for isolation)
        mockMvc.perform(get("/api/solar/" + solarId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userBToken))
                .andExpect(status().isNotFound());

        // User A can delete
        mockMvc.perform(delete("/api/solar/" + solarId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userAToken))
                .andExpect(status().isNoContent());

        // Now history is empty
        mockMvc.perform(get("/api/solar/history")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
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
