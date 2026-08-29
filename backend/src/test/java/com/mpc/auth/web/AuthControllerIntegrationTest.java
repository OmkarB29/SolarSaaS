package com.mpc.auth.web;

import com.mpc.MpcApplication;
import com.mpc.analysis.repository.AnalysisRepository;
import com.mpc.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import jakarta.servlet.Filter;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = MpcApplication.class)
@Import(AuthControllerIntegrationTest.ProtectedApiController.class)
class AuthControllerIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AnalysisRepository analysisRepository;

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private Filter springSecurityFilterChain;

    private MockMvc mockMvc;

    @BeforeEach
    void clean() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .addFilters(springSecurityFilterChain)
                .build();
        analysisRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void registerLoginAndUseJwtOnProtectedEndpoint() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "User",
                                  "email": "user@example.com",
                                  "password": "password123"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("User registered successfully"));

        assertThat(userRepository.findByEmail("user@example.com")).isPresent();

        String loginResponse = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "user@example.com",
                                  "password": "password123"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.type").value("Bearer"))
                .andReturn()
                .getResponse()
                .getContentAsString();

            String token = extractToken(loginResponse);

        mockMvc.perform(get("/api/analysis/ping"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/analysis/ping")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(content().string("analysis-ok"));

        mockMvc.perform(get("/api/users"))
                .andExpect(status().isOk());
    }

    private static String extractToken(String json) {
        String marker = "\"token\":\"";
        int start = json.indexOf(marker);
        if (start < 0) {
            throw new IllegalStateException("Token not found in login response: " + json);
        }
        start += marker.length();
        int end = json.indexOf('"', start);
        if (end < 0) {
            throw new IllegalStateException("Token value not terminated in login response: " + json);
        }
        return json.substring(start, end);
    }

    @RestController
    static class ProtectedApiController {

        @GetMapping("/api/analysis/ping")
        String ping() {
            return "analysis-ok";
        }
    }
}
