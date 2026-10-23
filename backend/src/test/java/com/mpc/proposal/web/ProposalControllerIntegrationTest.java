package com.mpc.proposal.web;

import com.mpc.MpcApplication;
import com.mpc.analysis.domain.Analysis;
import com.mpc.analysis.repository.AnalysisRepository;
import com.mpc.proposal.domain.Proposal;
import com.mpc.proposal.domain.ProposalStatus;
import com.mpc.proposal.repository.ProposalRepository;
import com.mpc.user.domain.User;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.setup.MockMvcBuilders.webAppContextSetup;

@SpringBootTest(classes = MpcApplication.class)
class ProposalControllerIntegrationTest {

    @Autowired
    private ProposalRepository proposalRepository;

    @Autowired
    private com.mpc.paneloptimizer.repository.PanelLayoutRepository panelLayoutRepository;

    @Autowired
    private com.mpc.solar.repository.SolarPotentialRepository solarPotentialRepository;

    @Autowired
    private AnalysisRepository analysisRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private Filter springSecurityFilterChain;

    private MockMvc mockMvc;

    @BeforeEach
    void setup() {
        mockMvc = webAppContextSetup(webApplicationContext)
                .addFilters(springSecurityFilterChain)
                .build();
        panelLayoutRepository.deleteAll();
        proposalRepository.deleteAll();
        solarPotentialRepository.deleteAll();
        analysisRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void testProposalLifecycleAndUserIsolation() throws Exception {
        String userAToken = registerAndLogin("User One", "user1@example.com");
        String userBToken = registerAndLogin("User Two", "user2@example.com");

        User userA = userRepository.findByEmail("user1@example.com").orElseThrow();

        // Create Analysis for User A
        Analysis analysisA = new Analysis();
        analysisA.setUser(userA);
        analysisA.setLocationName("Solar Park Pune");
        analysisA.setLatitude(18.52);
        analysisA.setLongitude(73.85);
        analysisA.setRoofArea(200.0);
        analysisA.setUsableArea(160.0);
        analysisA.setEstimatedPanels(50);
        analysisA.setMonthlyGeneration(1500.0);
        analysisA.setSystemSize(20.0);
        analysisA.setAnnualGeneration(18000.0);
        analysisA.setInstallationCost(500000.0);
        analysisA.setAnnualSavings(125000.0);
        analysisA.setRoi(25.0);
        analysisA.setPaybackPeriod(4.0);
        analysisA.setCo2Reduction(12000.0);
        analysisA = analysisRepository.save(analysisA);

        // User A creates a proposal
        String proposalJson = """
                {
                    "proposalName": "Pune Factory Solar Array",
                    "analysisId": %d,
                    "systemSize": 20.0,
                    "cost": 500000.0,
                    "roi": 25.0,
                    "status": "DRAFT"
                }
                """.formatted(analysisA.getId());

        String createResponse = mockMvc.perform(post("/api/proposals")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(proposalJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.proposalName").value("Pune Factory Solar Array"))
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andExpect(jsonPath("$.systemSize").value(20.0))
                .andReturn()
                .getResponse()
                .getContentAsString();

        Long proposalId = extractLong(createResponse, "id");

        // User A lists proposals - should contain the proposal
        mockMvc.perform(get("/api/proposals")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(proposalId))
                .andExpect(jsonPath("$[0].status").value("DRAFT"));

        // User B lists proposals - should be EMPTY (isolation)
        mockMvc.perform(get("/api/proposals")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userBToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());

        // User B cannot access User A's proposal
        mockMvc.perform(get("/api/proposals/" + proposalId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userBToken))
                .andExpect(status().isNotFound());

        // User A updates status to REVIEWED, then APPROVED, then INSTALLED
        mockMvc.perform(patch("/api/proposals/" + proposalId + "/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\": \"REVIEWED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REVIEWED"));

        mockMvc.perform(patch("/api/proposals/" + proposalId + "/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\": \"APPROVED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));

        mockMvc.perform(patch("/api/proposals/" + proposalId + "/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\": \"INSTALLED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("INSTALLED"));

        // User B cannot update User A's proposal status
        mockMvc.perform(patch("/api/proposals/" + proposalId + "/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userBToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\": \"DRAFT\"}"))
                .andExpect(status().isNotFound());

        // User Dashboard Summary check
        mockMvc.perform(get("/api/user/dashboard-summary")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalAnalyses").value(1))
                .andExpect(jsonPath("$.totalProposals").value(1));

        // Duplicate analysis check
        mockMvc.perform(post("/api/analysis/" + analysisA.getId() + "/duplicate")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userAToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.locationName").value("Solar Park Pune (Copy)"));

        // User A deletes proposal
        mockMvc.perform(delete("/api/proposals/" + proposalId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userAToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/proposals/" + proposalId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userAToken))
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
                .andReturn()
                .getResponse()
                .getContentAsString();

        return extractString(loginResponse, "token");
    }

    private static String extractString(String json, String fieldName) {
        String marker = "\"" + fieldName + "\":\"";
        int start = json.indexOf(marker);
        if (start < 0) {
            throw new IllegalStateException("Field not found in response: " + fieldName);
        }
        start += marker.length();
        int end = json.indexOf('"', start);
        return json.substring(start, end);
    }

    private static Long extractLong(String json, String fieldName) {
        String marker = "\"" + fieldName + "\":";
        int start = json.indexOf(marker);
        if (start < 0) {
            throw new IllegalStateException("Field not found in response: " + fieldName);
        }
        start += marker.length();
        int end = json.indexOf(',', start);
        if (end < 0) {
            end = json.indexOf('}', start);
        }
        return Long.valueOf(json.substring(start, end));
    }
}
