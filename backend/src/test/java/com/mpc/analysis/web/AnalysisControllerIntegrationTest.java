package com.mpc.analysis.web;

import com.mpc.MpcApplication;
import com.mpc.analysis.repository.AnalysisRepository;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.setup.MockMvcBuilders.webAppContextSetup;

@SpringBootTest(classes = MpcApplication.class)
class AnalysisControllerIntegrationTest {

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
        analysisRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void savesListsAndRestrictsAnalysisToOwner() throws Exception {
        String userAToken = registerAndLogin("User A", "user.a@example.com");
        String userBToken = registerAndLogin("User B", "user.b@example.com");

        String analysisResponse = mockMvc.perform(post("/api/analysis")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "locationName": "Taj Mahal",
                                  "latitude": 27.1751,
                                  "longitude": 78.0421,
                                  "roofArea": 120.0,
                                  "estimatedPanels": 48,
                                  "monthlyGeneration": 404,
                                  "installationCost": 1032000,
                                  "roi": 18.4,
                                  "co2Reduction": 3975
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.locationName").value("Taj Mahal"))
                .andExpect(jsonPath("$.estimatedPanels").value(48))
                .andReturn()
                .getResponse()
                .getContentAsString();

        Long analysisId = extractLong(analysisResponse, "id");

        mockMvc.perform(get("/api/analysis")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(analysisId));

        mockMvc.perform(get("/api/analysis/" + analysisId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.locationName").value("Taj Mahal"));

        mockMvc.perform(get("/api/analysis")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userBToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());

        mockMvc.perform(get("/api/analysis/" + analysisId)
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
