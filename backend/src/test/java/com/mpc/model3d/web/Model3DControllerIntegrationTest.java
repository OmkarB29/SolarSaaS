package com.mpc.model3d.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mpc.MpcApplication;
import com.mpc.model3d.domain.Model3DJob;
import com.mpc.model3d.domain.Model3DStatus;
import com.mpc.model3d.repository.Model3DJobRepository;
import com.mpc.model3d.web.dto.Model3DJobRequestDTO;
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
class Model3DControllerIntegrationTest {

    @Autowired
    private Model3DJobRepository jobRepository;

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

        jobRepository.deleteAll();

        testUser = userRepository.findByEmail("modeluser@solarsaas.com").orElseGet(() -> {
            User u = new User();
            u.setUsername("Model3D User");
            u.setEmail("modeluser@solarsaas.com");
            u.setPasswordHash(passwordEncoder.encode("Password@123"));
            u.setRole("ROLE_USER");
            return userRepository.save(u);
        });

        otherUser = userRepository.findByEmail("other3d@solarsaas.com").orElseGet(() -> {
            User u = new User();
            u.setUsername("Model3D Other User");
            u.setEmail("other3d@solarsaas.com");
            u.setPasswordHash(passwordEncoder.encode("Password@123"));
            u.setRole("ROLE_USER");
            return userRepository.save(u);
        });

        jwtToken = authenticateAndGetToken("modeluser@solarsaas.com", "Password@123");
        otherJwtToken = authenticateAndGetToken("other3d@solarsaas.com", "Password@123");
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
    void unauthenticatedRequestToCreateJobReturns401() throws Exception {
        Model3DJobRequestDTO req = new Model3DJobRequestDTO();
        req.setPolygonCoordinates(List.of(
                List.of(12.9716, 77.5946),
                List.of(12.9718, 77.5946),
                List.of(12.9718, 77.5949)
        ));

        mockMvc.perform(post("/api/model3d/jobs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void authenticatedUserCanCreateAndGet3DJob() throws Exception {
        Model3DJobRequestDTO req = new Model3DJobRequestDTO();
        req.setLatitude(12.9717);
        req.setLongitude(77.5947);
        req.setAddress("MG Road, Bengaluru");
        req.setPolygonCoordinates(List.of(
                List.of(12.9716, 77.5946),
                List.of(12.9718, 77.5946),
                List.of(12.9718, 77.5949),
                List.of(12.9716, 77.5949)
        ));
        req.setRoofArea(150.0);
        req.setImageSource("GOOGLE_STATIC");

        String postResponse = mockMvc.perform(post("/api/model3d/jobs")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.polygonHash").isNotEmpty())
                .andExpect(jsonPath("$.address").value("MG Road, Bengaluru"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        Long jobId = objectMapper.readTree(postResponse).get("id").asLong();

        // Get Job
        mockMvc.perform(get("/api/model3d/jobs/" + jobId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(jobId));

        // List User Jobs
        mockMvc.perform(get("/api/model3d/jobs")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].id").value(jobId));
    }

    @Test
    void userScopingPreventsOtherUserAccessToJob() throws Exception {
        Model3DJob job = new Model3DJob();
        job.setUser(testUser);
        job.setPolygonHash("hash_secret_user1");
        job.setPolygonJson("[[12.97, 77.59]]");
        job.setStatus(Model3DStatus.SUCCEEDED);
        job.setProgress(100);
        job.setImageSource("GOOGLE_STATIC");
        job.setCreatedAt(Instant.now());
        job = jobRepository.save(job);

        // Other user attempts to read testUser's job
        mockMvc.perform(get("/api/model3d/jobs/" + job.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + otherJwtToken))
                .andExpect(status().isForbidden());
    }
}
