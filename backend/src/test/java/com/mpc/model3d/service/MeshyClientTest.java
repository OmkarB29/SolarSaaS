package com.mpc.model3d.service;

import com.mpc.model3d.config.MeshyModel3DProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class MeshyClientTest {

    private MeshyModel3DProperties properties;
    private RestTemplate restTemplate;
    private MockRestServiceServer mockServer;
    private MeshyClient meshyClient;

    @BeforeEach
    void setUp() {
        properties = new MeshyModel3DProperties();
        properties.setApiKey("test-meshy-key-12345");
        properties.setBaseUrl("https://api.meshy.ai/openapi/v1");
        properties.setAiModel("meshy-7.1");
        properties.setTargetPolycount(60000);

        restTemplate = new RestTemplate();
        mockServer = MockRestServiceServer.createServer(restTemplate);
        meshyClient = new MeshyClient(properties, restTemplate);
    }

    @Test
    void testCreateTaskSuccess200() {
        mockServer.expect(requestTo("https://api.meshy.ai/openapi/v1/image-to-3d"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header(HttpHeaders.AUTHORIZATION, "Bearer test-meshy-key-12345"))
                .andRespond(withSuccess("{\"result\":\"task_abc_123\"}", MediaType.APPLICATION_JSON));

        String taskId = meshyClient.createImageTo3DTask("data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==");
        assertThat(taskId).isEqualTo("task_abc_123");
        mockServer.verify();
    }

    @Test
    void testCreateTaskBadRequest400() {
        mockServer.expect(requestTo("https://api.meshy.ai/openapi/v1/image-to-3d"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withBadRequest().body("{\"message\":\"Invalid image format or dimensions\"}"));

        assertThatThrownBy(() -> meshyClient.createImageTo3DTask("data:image/png;base64,invalid"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid image format or dimensions");
        mockServer.verify();
    }

    @Test
    void testCreateTaskUnauthorized401() {
        mockServer.expect(requestTo("https://api.meshy.ai/openapi/v1/image-to-3d"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withStatus(HttpStatus.UNAUTHORIZED).body("{\"message\":\"Invalid API Key\"}"));

        assertThatThrownBy(() -> meshyClient.createImageTo3DTask("data:image/png;base64,test"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Meshy API authentication failed");
        mockServer.verify();
    }

    @Test
    void testCreateTaskPaymentRequired402() {
        mockServer.expect(requestTo("https://api.meshy.ai/openapi/v1/image-to-3d"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withStatus(HttpStatus.PAYMENT_REQUIRED).body("{\"message\":\"Insufficient credits\"}"));

        assertThatThrownBy(() -> meshyClient.createImageTo3DTask("data:image/png;base64,test"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("credits exhausted");
        mockServer.verify();
    }

    @Test
    void testCreateTaskRateLimited429WithRetryAfter() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Retry-After", "8");

        mockServer.expect(requestTo("https://api.meshy.ai/openapi/v1/image-to-3d"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS).headers(headers).body("{\"message\":\"Rate limit exceeded\"}"));

        assertThatThrownBy(() -> meshyClient.createImageTo3DTask("data:image/png;base64,test"))
                .isInstanceOf(MeshyClient.MeshyRateLimitException.class)
                .satisfies(ex -> {
                    MeshyClient.MeshyRateLimitException rle = (MeshyClient.MeshyRateLimitException) ex;
                    assertThat(rle.getRetryAfterSeconds()).isEqualTo(8);
                });
        mockServer.verify();
    }

    @Test
    void testPollTaskSucceededWithGlb() {
        String responseBody = "{\n" +
                "  \"id\": \"task_abc_123\",\n" +
                "  \"status\": \"SUCCEEDED\",\n" +
                "  \"progress\": 100,\n" +
                "  \"consumed_credits\": 5,\n" +
                "  \"model_urls\": {\n" +
                "    \"glb\": \"https://assets.meshy.ai/models/model_123.glb?Expires=1700000000\"\n" +
                "  }\n" +
                "}";

        mockServer.expect(requestTo("https://api.meshy.ai/openapi/v1/image-to-3d/task_abc_123"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess(responseBody, MediaType.APPLICATION_JSON));

        MeshyClient.MeshyTaskStatus status = meshyClient.pollTaskStatus("task_abc_123");
        assertThat(status.status).isEqualTo("SUCCEEDED");
        assertThat(status.progress).isEqualTo(100);
        assertThat(status.consumedCredits).isEqualTo(5);
        assertThat(status.glbUrl).isEqualTo("https://assets.meshy.ai/models/model_123.glb?Expires=1700000000");
        mockServer.verify();
    }

    @Test
    void testPollTaskFailed() {
        String responseBody = "{\n" +
                "  \"id\": \"task_abc_123\",\n" +
                "  \"status\": \"FAILED\",\n" +
                "  \"progress\": 0,\n" +
                "  \"task_error\": {\n" +
                "    \"message\": \"Input image resolution too low\"\n" +
                "  }\n" +
                "}";

        mockServer.expect(requestTo("https://api.meshy.ai/openapi/v1/image-to-3d/task_abc_123"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess(responseBody, MediaType.APPLICATION_JSON));

        MeshyClient.MeshyTaskStatus status = meshyClient.pollTaskStatus("task_abc_123");
        assertThat(status.status).isEqualTo("FAILED");
        assertThat(status.errorMessage).isEqualTo("Input image resolution too low");
        mockServer.verify();
    }

    @Test
    void testGetBalanceSuccess() {
        String responseBody = "{\n" +
                "  \"balance\": 120,\n" +
                "  \"monthly_credits\": 100,\n" +
                "  \"permanent_credits\": 20\n" +
                "}";

        mockServer.expect(requestTo("https://api.meshy.ai/openapi/v1/balance"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess(responseBody, MediaType.APPLICATION_JSON));

        int balance = meshyClient.getAccountBalance();
        assertThat(balance).isEqualTo(120);
        mockServer.verify();
    }
}
