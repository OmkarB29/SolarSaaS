package com.mpc.paneloptimizer.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mpc.MpcApplication;
import com.mpc.ai.repository.AIRecommendationRepository;
import com.mpc.analysis.domain.Analysis;
import com.mpc.analysis.repository.AnalysisRepository;
import com.mpc.paneloptimizer.domain.PanelLayout;
import com.mpc.paneloptimizer.repository.PanelLayoutRepository;
import com.mpc.paneloptimizer.web.dto.OptimizationRequestDTO;
import com.mpc.paneloptimizer.web.dto.PanelDimensionsDTO;
import com.mpc.paneloptimizer.web.dto.PanelLayoutDTO;
import com.mpc.proposal.repository.ProposalRepository;
import com.mpc.report.repository.ReportRepository;
import com.mpc.solar.repository.SolarPotentialRepository;
import com.mpc.user.domain.User;
import com.mpc.user.repository.UserRepository;
import jakarta.servlet.Filter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.context.WebApplicationContext;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.setup.MockMvcBuilders.webAppContextSetup;

@SpringBootTest(classes = MpcApplication.class)
class PanelOptimizerControllerIntegrationTest {

    @Autowired
    private PanelLayoutRepository panelLayoutRepository;

    @Autowired
    private AIRecommendationRepository aiRecommendationRepository;

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
    private PasswordEncoder passwordEncoder;

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private Filter springSecurityFilterChain;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private User testUser;
    private User otherUser;
    private String jwtToken;
    private String otherJwtToken;

    @BeforeEach
    void setup() throws Exception {
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

        testUser = new User();
        testUser.setUsername("Optimizer User");
        testUser.setEmail("optuser@solarsaas.com");
        testUser.setPasswordHash(passwordEncoder.encode("Password@123"));
        testUser.setRole("ROLE_USER");
        testUser = userRepository.save(testUser);

        otherUser = new User();
        otherUser.setUsername("Other User");
        otherUser.setEmail("other@solarsaas.com");
        otherUser.setPasswordHash(passwordEncoder.encode("Password@123"));
        otherUser.setRole("ROLE_USER");
        otherUser = userRepository.save(otherUser);

        jwtToken = authenticateAndGetToken("optuser@solarsaas.com", "Password@123");
        otherJwtToken = authenticateAndGetToken("other@solarsaas.com", "Password@123");
    }

    private String authenticateAndGetToken(String email, String password) throws Exception {
        String body = String.format("{\"email\":\"%s\",\"password\":\"%s\"}", email, password);
        String response = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return objectMapper.readTree(response).get("token").asText();
    }

    @Test
    void shouldGenerateAllThreeOptimizedLayouts() throws Exception {
        OptimizationRequestDTO req = new OptimizationRequestDTO();
        // A rectangular rooftop in Pune (~25m x 15m = ~375 m²)
        req.setPolygonCoordinates(List.of(
                List.of(18.5200, 73.8560),
                List.of(18.5202, 73.8560),
                List.of(18.5202, 73.8563),
                List.of(18.5200, 73.8563)
        ));
        req.setAddress("Shivaji Nagar, Pune");
        req.setLatitude(18.5201);
        req.setLongitude(73.85615);
        req.setPanelDimensions(new PanelDimensionsDTO(2.1, 1.1, 550.0));

        mockMvc.perform(post("/api/panel-optimizer/optimize")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].mode").value("MAXIMUM_CAPACITY"))
                .andExpect(jsonPath("$[0].panelCount").isNumber())
                .andExpect(jsonPath("$[0].systemCapacityKw").isNumber())
                .andExpect(jsonPath("$[0].optimizationScore").isNumber())
                .andExpect(jsonPath("$[0].panels").isArray())
                .andExpect(jsonPath("$[1].mode").value("BALANCED"))
                .andExpect(jsonPath("$[1].panels").isArray())
                .andExpect(jsonPath("$[2].mode").value("HIGH_EFFICIENCY"))
                .andExpect(jsonPath("$[2].panels").isArray());
    }

    @Test
    void shouldRejectInvalidPolygonCoordinates() throws Exception {
        OptimizationRequestDTO req = new OptimizationRequestDTO();
        req.setPolygonCoordinates(List.of(
                List.of(18.5200, 73.8560),
                List.of(18.5202, 73.8560) // Only 2 coordinates
        ));

        mockMvc.perform(post("/api/panel-optimizer/optimize")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldSaveLayoutAndSynchronizeWithAnalysis() throws Exception {
        // Create an Analysis record first
        Analysis analysis = new Analysis();
        analysis.setUser(testUser);
        analysis.setLocationName("Test Site Pune");
        analysis.setLatitude(18.5204);
        analysis.setLongitude(73.8567);
        analysis.setRoofArea(400.0);
        analysis.setUsableArea(300.0);
        analysis.setEstimatedPanels(50);
        analysis.setMonthlyGeneration(2000.0);
        analysis.setSystemSize(20.0);
        analysis.setAnnualGeneration(24000.0);
        analysis.setInstallationCost(900000.0);
        analysis.setAnnualSavings(192000.0);
        analysis.setRoi(18.0);
        analysis.setPaybackPeriod(4.7);
        analysis.setCo2Reduction(19680.0);
        analysis = analysisRepository.save(analysis);

        PanelLayoutDTO dto = new PanelLayoutDTO();
        dto.setAnalysisId(analysis.getId());
        dto.setRoofArea(400.0);
        dto.setUsableArea(320.0);
        dto.setPanelCount(120);
        dto.setSystemCapacityKw(66.0);
        dto.setAnnualGenerationKwh(101640.0);
        dto.setRoofUtilizationPercent(69.3);
        dto.setOptimizationScore(95.5);
        dto.setLayoutMode("BALANCED");
        dto.setLayoutJson("{\"panels\":[{\"panelNumber\":1}]}");

        String response = mockMvc.perform(post("/api/panel-optimizer/save")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.panelCount").value(120))
                .andExpect(jsonPath("$.layoutMode").value("BALANCED"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        Long savedId = objectMapper.readTree(response).get("id").asLong();
        assertThat(savedId).isNotNull();

        // Verify Analysis was atomically updated!
        Analysis updatedAnalysis = analysisRepository.findById(analysis.getId()).orElseThrow();
        assertThat(updatedAnalysis.getEstimatedPanels()).isEqualTo(120);
        assertThat(updatedAnalysis.getSystemSize()).isEqualTo(66.0);
        assertThat(updatedAnalysis.getAnnualGeneration()).isEqualTo(101640.0);

        // Verify get latest
        mockMvc.perform(get("/api/panel-optimizer/latest")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(savedId));

        // Verify get history
        mockMvc.perform(get("/api/panel-optimizer/history")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(savedId));

        // Verify user data isolation: otherUser cannot access this layout
        mockMvc.perform(get("/api/panel-optimizer/" + savedId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + otherJwtToken))
                .andExpect(status().isNotFound());
    }
}
