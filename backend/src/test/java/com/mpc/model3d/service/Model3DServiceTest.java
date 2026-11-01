package com.mpc.model3d.service;

import com.mpc.model3d.config.MeshyModel3DProperties;
import com.mpc.model3d.domain.Model3DJob;
import com.mpc.model3d.domain.Model3DStatus;
import com.mpc.model3d.repository.Model3DJobRepository;
import com.mpc.model3d.service.image.RooftopImageProvider;
import com.mpc.model3d.service.storage.GlbStorageService;
import com.mpc.model3d.web.dto.Model3DJobRequestDTO;
import com.mpc.user.domain.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class Model3DServiceTest {

    private Model3DJobRepository jobRepository;
    private MeshyClient meshyClient;
    private MeshyModel3DProperties meshyProperties;
    private GlbStorageService glbStorageService;
    private RooftopImageProvider googleStaticMapsProvider;
    private RooftopImageProvider uploadedImageProvider;
    private Model3DService model3DService;

    private User testUser;

    @BeforeEach
    void setUp() {
        jobRepository = mock(Model3DJobRepository.class);
        meshyClient = mock(MeshyClient.class);
        glbStorageService = mock(GlbStorageService.class);
        googleStaticMapsProvider = mock(RooftopImageProvider.class);
        uploadedImageProvider = mock(RooftopImageProvider.class);

        meshyProperties = new MeshyModel3DProperties();
        meshyProperties.setMockEnabled(true);
        meshyProperties.setMaxJobsPerUserPerDay(10);
        meshyProperties.setMaxGlobalJobsPerDay(50);
        meshyProperties.setAiModel("meshy-7.1");
        meshyProperties.setTargetPolycount(60000);

        model3DService = new Model3DService(
                jobRepository,
                meshyClient,
                meshyProperties,
                glbStorageService,
                googleStaticMapsProvider,
                uploadedImageProvider
        );

        testUser = new User();
        testUser.setId(101L);
        testUser.setEmail("solartech@solarsaas.com");
    }

    @Test
    void testComputePolygonHashDeterministic() {
        List<List<Double>> coords1 = List.of(
                List.of(12.97160012, 77.59460034),
                List.of(12.97180056, 77.59460012),
                List.of(12.97180078, 77.59490045)
        );

        List<List<Double>> coords2 = List.of(
                List.of(12.97160049, 77.59460021), // same rounded to 6 decimals
                List.of(12.97180051, 77.59460019),
                List.of(12.97180081, 77.59490041)
        );

        String hash1 = model3DService.computePolygonHash(coords1, "meshy-7.1", 60000, "GOOGLE_STATIC");
        String hash2 = model3DService.computePolygonHash(coords2, "meshy-7.1", 60000, "GOOGLE_STATIC");

        assertThat(hash1).isNotEmpty();
        assertThat(hash1).hasSize(64); // SHA-256 hex string length
        assertThat(hash1).isEqualTo(hash2);
    }

    @Test
    void testCacheHitReturnsExistingJobWithoutCallingMeshy() throws Exception {
        List<List<Double>> coords = List.of(
                List.of(12.9716, 77.5946),
                List.of(12.9718, 77.5946),
                List.of(12.9718, 77.5949)
        );

        String hash = model3DService.computePolygonHash(coords, "meshy-7.1", 60000, "GOOGLE_STATIC");

        // Create temporary real file to satisfy Files.exists
        Path tempGlb = Files.createTempFile("cached_model", ".glb");
        tempGlb.toFile().deleteOnExit();

        Model3DJob cachedJob = new Model3DJob();
        cachedJob.setId(55L);
        cachedJob.setUser(testUser);
        cachedJob.setPolygonHash(hash);
        cachedJob.setStatus(Model3DStatus.SUCCEEDED);
        cachedJob.setGlbPath(tempGlb.toString());

        when(jobRepository.findFirstByPolygonHashAndStatusOrderByCreatedAtDesc(eq(hash), eq(Model3DStatus.SUCCEEDED)))
                .thenReturn(Optional.of(cachedJob));

        Model3DJobRequestDTO request = new Model3DJobRequestDTO();
        request.setPolygonCoordinates(coords);
        request.setImageSource("GOOGLE_STATIC");

        Model3DJob result = model3DService.createJob(testUser, request);

        assertThat(result.getId()).isEqualTo(55L);
        assertThat(result.getStatus()).isEqualTo(Model3DStatus.SUCCEEDED);

        // Verify meshy client was NEVER called
        verify(meshyClient, never()).createImageTo3DTask(anyString());
        verify(jobRepository, never()).save(any(Model3DJob.class));
    }

    @Test
    void testDailyQuotaExceededThrowsIllegalStateException() {
        List<List<Double>> coords = List.of(
                List.of(12.9716, 77.5946),
                List.of(12.9718, 77.5946),
                List.of(12.9718, 77.5949)
        );

        when(jobRepository.countByUserIdAndCreatedAtAfter(eq(101L), any(Instant.class)))
                .thenReturn(10L); // Limit is 10

        Model3DJobRequestDTO request = new Model3DJobRequestDTO();
        request.setPolygonCoordinates(coords);

        assertThatThrownBy(() -> model3DService.createJob(testUser, request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Daily 3D model generation quota reached");
    }
}
