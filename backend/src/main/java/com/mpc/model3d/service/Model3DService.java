package com.mpc.model3d.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mpc.model3d.config.MeshyModel3DProperties;
import com.mpc.model3d.domain.Model3DJob;
import com.mpc.model3d.domain.Model3DStatus;
import com.mpc.model3d.repository.Model3DJobRepository;
import com.mpc.model3d.service.image.GoogleStaticMapsProvider;
import com.mpc.model3d.service.image.RooftopImageProvider;
import com.mpc.model3d.service.image.UploadedImageProvider;
import com.mpc.model3d.service.storage.GlbStorageService;
import com.mpc.model3d.web.dto.Model3DJobRequestDTO;
import com.mpc.user.domain.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class Model3DService {

    private static final Logger log = LoggerFactory.getLogger(Model3DService.class);

    private final Model3DJobRepository jobRepository;
    private final MeshyClient meshyClient;
    private final MeshyModel3DProperties meshyProperties;
    private final GlbStorageService glbStorageService;
    private final RooftopImageProvider googleStaticMapsProvider;
    private final RooftopImageProvider uploadedImageProvider;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // In-flight task tracker to avoid duplicate poller threads
    private final Set<Long> inFlightJobs = ConcurrentHashMap.newKeySet();

    public Model3DService(Model3DJobRepository jobRepository,
                           MeshyClient meshyClient,
                           MeshyModel3DProperties meshyProperties,
                           GlbStorageService glbStorageService,
                           @Qualifier("googleStaticMapsProvider") RooftopImageProvider googleStaticMapsProvider,
                           @Qualifier("uploadedImageProvider") RooftopImageProvider uploadedImageProvider) {
        this.jobRepository = jobRepository;
        this.meshyClient = meshyClient;
        this.meshyProperties = meshyProperties;
        this.glbStorageService = glbStorageService;
        this.googleStaticMapsProvider = googleStaticMapsProvider;
        this.uploadedImageProvider = uploadedImageProvider;
    }

    @jakarta.annotation.PostConstruct
    public void logStartupDiagnostics() {
        boolean hasKey = meshyProperties.getApiKey() != null && !meshyProperties.getApiKey().trim().isEmpty();
        boolean mock = meshyProperties.isMockEnabled();
        String mode = (!hasKey || mock) ? "MOCK" : "REAL";
        log.info("[3D Pipeline Startup] Meshy Mode: {} | API Key Configured: {} | Effective Mock-Enabled: {}",
                mode, (hasKey ? "yes" : "no"), mock);
    }

    /**
     * Creates a new 3D generation job or returns an existing cached job for identical polygon hash.
     */
    @Transactional
    public Model3DJob createJob(User user, Model3DJobRequestDTO request) {
        if (request == null || request.getPolygonCoordinates() == null || request.getPolygonCoordinates().size() < 3) {
            throw new IllegalArgumentException("Rooftop polygon must contain at least 3 GPS coordinates.");
        }

        // 1. Compute deterministic SHA-256 hash of coordinates and generation parameters
        String polygonHash = computePolygonHash(
                request.getPolygonCoordinates(),
                meshyProperties.getAiModel(),
                meshyProperties.getTargetPolycount(),
                request.getImageSource()
        );

        // 2. Cache Hit Check: If a SUCCEEDED job with stored GLB exists, return immediately with NO Meshy API call
        Optional<Model3DJob> cachedJob = jobRepository.findFirstByPolygonHashAndStatusOrderByCreatedAtDesc(
                polygonHash, Model3DStatus.SUCCEEDED
        );
        if (cachedJob.isPresent()) {
            Model3DJob existing = cachedJob.get();
            if (existing.getGlbPath() != null && Files.exists(Paths.get(existing.getGlbPath()))) {
                log.info("Cache hit for polygon hash {}: Returning existing Job #{} with stored GLB.", polygonHash, existing.getId());
                return existing;
            }
        }

        // 3. Cost Guards: Check daily quotas
        Instant oneDayAgo = Instant.now().minus(1, ChronoUnit.DAYS);
        long userDailyCount = jobRepository.countByUserIdAndCreatedAtAfter(user.getId(), oneDayAgo);
        if (userDailyCount >= meshyProperties.getMaxJobsPerUserPerDay()) {
            throw new IllegalStateException(String.format(
                    "Daily 3D model generation quota reached (%d/%d jobs). Quota refreshes in 24 hours.",
                    userDailyCount, meshyProperties.getMaxJobsPerUserPerDay()
            ));
        }

        long globalDailyCount = jobRepository.countByCreatedAtAfter(oneDayAgo);
        if (globalDailyCount >= meshyProperties.getMaxGlobalJobsPerDay()) {
            throw new IllegalStateException("Global daily 3D generation capacity reached. Please try again tomorrow.");
        }

        // 4. Create and persist new Job entity in PENDING status
        Model3DJob job = new Model3DJob();
        job.setUser(user);
        job.setPolygonHash(polygonHash);
        try {
            job.setPolygonJson(objectMapper.writeValueAsString(request.getPolygonCoordinates()));
            job.setObstaclesJson(request.getObstacles() != null ? objectMapper.writeValueAsString(request.getObstacles()) : null);
        } catch (Exception e) {
            throw new IllegalArgumentException("Failed to serialize polygon geometries.", e);
        }
        job.setAddress(request.getAddress());
        job.setImageSource(request.getImageSource() != null ? request.getImageSource() : "GOOGLE_STATIC");
        job.setStatus(Model3DStatus.PENDING);
        job.setProgress(5);
        job.setCreatedAt(Instant.now());

        Model3DJob savedJob = jobRepository.save(job);

        // 5. Asynchronously trigger background generation pipeline (non-blocking request thread)
        CompletableFuture.runAsync(() -> executeJobPipeline(savedJob.getId(), request));

        return savedJob;
    }

    /**
     * Executes the generation pipeline asynchronously
     */
    public void executeJobPipeline(Long jobId, Model3DJobRequestDTO request) {
        if (!inFlightJobs.add(jobId)) {
            log.info("Job #{} is already actively running in a background worker.", jobId);
            return;
        }

        try {
            updateJobStatus(jobId, Model3DStatus.IN_PROGRESS, 15, null, null);

            // ─── MOCK MODE EVALUATION ───
            boolean hasApiKey = meshyProperties.getApiKey() != null && !meshyProperties.getApiKey().trim().isEmpty();
            // Real Meshy AI is enabled whenever API key is present unless explicitly set to mock via env
            boolean isMock = !hasApiKey || "true".equalsIgnoreCase(System.getenv("MESHY_MOCK_ENABLED"));

            if (isMock) {
                log.info("Executing Job #{} in MOCK MODE (zero credits consumed)", jobId);
                runMockPipeline(jobId);
                return;
            }

            // ─── REAL MESHY AI PIPELINE ───
            runRealMeshyPipeline(jobId, request);
        } catch (Exception ex) {
            log.error("Fatal failure in 3D pipeline for Job #{}: {}", jobId, ex.getMessage(), ex);
            updateJobStatus(jobId, Model3DStatus.FAILED, 0, null, ex.getMessage());
        } finally {
            inFlightJobs.remove(jobId);
        }
    }

    private void runMockPipeline(Long jobId) throws Exception {
        Thread.sleep(1200);
        updateJobStatus(jobId, Model3DStatus.IN_PROGRESS, 45, null, null);
        Thread.sleep(1500);
        updateJobStatus(jobId, Model3DStatus.IN_PROGRESS, 80, null, null);
        Thread.sleep(1000);

        byte[] mockGlbBytes = glbStorageService.getBundledMockGlb();
        String storedPath = glbStorageService.saveGlb(jobId, mockGlbBytes);

        Model3DJob job = jobRepository.findById(jobId).orElse(null);
        if (job != null) {
            job.setStatus(Model3DStatus.SUCCEEDED);
            job.setProgress(100);
            job.setGlbPath(storedPath);
            job.setConsumedCredits(0);
            job.setFinishedAt(Instant.now());
            jobRepository.save(job);
            log.info("Mock Job #{} completed successfully with placeholder GLB.", jobId);
        }
    }

    private void runRealMeshyPipeline(Long jobId, Model3DJobRequestDTO request) throws Exception {
        // 1. Acquire Image
        RooftopImageProvider provider = "UPLOADED".equalsIgnoreCase(request.getImageSource())
                ? uploadedImageProvider
                : googleStaticMapsProvider;

        byte[] imageBytes = provider.captureRooftopImage(request.getPolygonCoordinates(), request.getImageBase64());
        String base64Image = "data:image/png;base64," + Base64.getEncoder().encodeToString(imageBytes);

        updateJobStatus(jobId, Model3DStatus.IN_PROGRESS, 25, null, null);

        // 2. Submit Task to Meshy
        Model3DJob currentJob = jobRepository.findById(jobId).orElseThrow();
        String meshyTaskId = currentJob.getMeshyTaskId();
        if (meshyTaskId == null || meshyTaskId.isBlank()) {
            meshyTaskId = meshyClient.createImageTo3DTask(base64Image);
            currentJob.setMeshyTaskId(meshyTaskId);
            jobRepository.save(currentJob);
        }

        // 3. Poll Task Status (Max 60 minutes)
        Instant startTime = Instant.now();
        int pollIntervalSec = meshyProperties.getPollingIntervalSeconds();

        while (true) {
            if (Instant.now().isAfter(startTime.plus(60, ChronoUnit.MINUTES))) {
                throw new RuntimeException("Generation exceeded 60-minute safety limit. Task ID preserved for manual resume: " + meshyTaskId);
            }

            MeshyClient.MeshyTaskStatus taskStatus;
            try {
                taskStatus = meshyClient.pollTaskStatus(meshyTaskId);
            } catch (MeshyClient.MeshyRateLimitException rle) {
                log.warn("Rate limited on Meshy poll. Sleeping for {}s", rle.getRetryAfterSeconds());
                Thread.sleep(rle.getRetryAfterSeconds() * 1000L);
                continue;
            }

            int mappedProgress = 25 + (int) (taskStatus.progress * 0.70);
            updateJobStatus(jobId, Model3DStatus.IN_PROGRESS, mappedProgress, taskStatus.consumedCredits, null);

            if ("SUCCEEDED".equalsIgnoreCase(taskStatus.status)) {
                if (taskStatus.glbUrl == null || taskStatus.glbUrl.isBlank()) {
                    throw new IllegalStateException("Meshy task succeeded but returned no GLB model URL.");
                }

                Model3DJob job = jobRepository.findById(jobId).orElseThrow();
                job.setStatus(Model3DStatus.SUCCEEDED);
                job.setProgress(100);
                job.setModelUrl(taskStatus.glbUrl);
                job.setConsumedCredits(taskStatus.consumedCredits);
                job.setFinishedAt(Instant.now());
                jobRepository.save(job);

                // Download and persist GLB locally (to defend against 3-day Meshy expiration)
                try {
                    byte[] glbBytes = meshyClient.downloadGlb(taskStatus.glbUrl);
                    String localGlbPath = glbStorageService.saveGlb(jobId, glbBytes);
                    job.setGlbPath(localGlbPath);
                    jobRepository.save(job);
                    log.info("Meshy Job #{} succeeded! Local GLB stored at {}", jobId, localGlbPath);
                } catch (Exception ex) {
                    log.warn("Local caching of GLB failed ({}), modelUrl preserved for direct streaming.", ex.getMessage());
                }
                return;
            } else if ("FAILED".equalsIgnoreCase(taskStatus.status)) {
                String error = taskStatus.errorMessage != null ? taskStatus.errorMessage : "Meshy 3D generation task failed.";
                throw new RuntimeException(error);
            } else if ("CANCELED".equalsIgnoreCase(taskStatus.status)) {
                throw new RuntimeException("Meshy generation task was canceled.");
            }

            int waitSec = Math.max(2, taskStatus.retryAfterSeconds > 0 ? taskStatus.retryAfterSeconds : pollIntervalSec);
            Thread.sleep(waitSec * 1000L);
        }
    }

    @Transactional
    public void updateJobStatus(Long jobId, Model3DStatus status, int progress, Integer credits, String errorMessage) {
        jobRepository.findById(jobId).ifPresent(job -> {
            job.setStatus(status);
            if (progress >= 0) job.setProgress(progress);
            if (credits != null) job.setConsumedCredits(credits);
            if (errorMessage != null) job.setErrorMessage(errorMessage);
            if (status == Model3DStatus.FAILED || status == Model3DStatus.CANCELED) {
                job.setFinishedAt(Instant.now());
            }
            jobRepository.save(job);
        });
    }

    public Model3DJob getJob(Long jobId, User user) {
        Model3DJob job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job #" + jobId + " not found."));

        if (!job.getUser().getId().equals(user.getId()) && !"ROLE_ADMIN".equals(user.getRole())) {
            throw new org.springframework.security.access.AccessDeniedException("Access denied to Job #" + jobId);
        }

        // Active Meshy sync: If job has meshyTaskId and is pending or missing modelUrl, query Meshy status
        if (job.getMeshyTaskId() != null && !job.getMeshyTaskId().isBlank() && (job.getStatus() != Model3DStatus.SUCCEEDED || job.getModelUrl() == null)) {
            try {
                MeshyClient.MeshyTaskStatus status = meshyClient.pollTaskStatus(job.getMeshyTaskId());
                if ("SUCCEEDED".equalsIgnoreCase(status.status) && status.glbUrl != null) {
                    job.setStatus(Model3DStatus.SUCCEEDED);
                    job.setProgress(100);
                    job.setModelUrl(status.glbUrl);
                    job.setConsumedCredits(status.consumedCredits);
                    job.setFinishedAt(Instant.now());
                    job = jobRepository.save(job);
                } else if ("FAILED".equalsIgnoreCase(status.status)) {
                    job.setStatus(Model3DStatus.FAILED);
                    job.setErrorMessage(status.errorMessage);
                    job = jobRepository.save(job);
                }
            } catch (Exception ex) {
                log.warn("Passive sync for Job #{} failed: {}", jobId, ex.getMessage());
            }
        }
        return job;
    }

    public List<Model3DJob> listUserJobs(User user) {
        return jobRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
    }

    public byte[] getJobGlb(Long jobId) throws Exception {
        Model3DJob job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job #" + jobId + " not found."));
        if (job.getStatus() != Model3DStatus.SUCCEEDED) {
            throw new IllegalStateException("3D Model is not ready yet. Status: " + job.getStatus());
        }

        // 1. Try local cached GLB on disk
        if (job.getGlbPath() != null) {
            java.nio.file.Path file = java.nio.file.Paths.get(job.getGlbPath());
            if (java.nio.file.Files.exists(file)) {
                return java.nio.file.Files.readAllBytes(file);
            }
        }

        // 2. If ephemeral storage wiped the file on Render restart, stream from Meshy model_url
        if (job.getModelUrl() != null && !job.getModelUrl().isBlank()) {
            try {
                byte[] glbBytes = meshyClient.downloadGlb(job.getModelUrl());
                String localGlbPath = glbStorageService.saveGlb(jobId, glbBytes);
                job.setGlbPath(localGlbPath);
                jobRepository.save(job);
                return glbBytes;
            } catch (Exception ex) {
                log.warn("Failed to download from saved modelUrl for Job #{}: {}", jobId, ex.getMessage());
            }
        }

        // 3. If meshyTaskId is present, poll Meshy to get fresh signed GLB URL
        if (job.getMeshyTaskId() != null && !job.getMeshyTaskId().isBlank()) {
            try {
                MeshyClient.MeshyTaskStatus status = meshyClient.pollTaskStatus(job.getMeshyTaskId());
                if (status.glbUrl != null && !status.glbUrl.isBlank()) {
                    byte[] glbBytes = meshyClient.downloadGlb(status.glbUrl);
                    String localGlbPath = glbStorageService.saveGlb(jobId, glbBytes);
                    job.setGlbPath(localGlbPath);
                    job.setModelUrl(status.glbUrl);
                    jobRepository.save(job);
                    return glbBytes;
                }
            } catch (Exception ex) {
                log.warn("Failed to retrieve GLB via meshyTaskId for Job #{}: {}", jobId, ex.getMessage());
            }
        }

        return glbStorageService.loadGlb(job.getGlbPath());
    }

    public byte[] getJobGlb(Long jobId, User user) throws Exception {
        getJob(jobId, user); // verifies ownership and syncs
        return getJobGlb(jobId);
    }

    /**
     * Deterministic SHA-256 hash of coordinates rounded to 6 decimal places and generation parameters
     */
    public String computePolygonHash(List<List<Double>> polygonCoordinates, String aiModel, int polycount, String imageSource) {
        StringBuilder sb = new StringBuilder();
        for (List<Double> pt : polygonCoordinates) {
            double lat = Math.round(pt.get(0) * 1_000_000.0) / 1_000_000.0;
            double lng = Math.round(pt.get(1) * 1_000_000.0) / 1_000_000.0;
            sb.append(String.format(Locale.US, "%.6f,%.6f;", lat, lng));
        }
        sb.append("|").append(aiModel != null ? aiModel : "meshy-7.1");
        sb.append("|").append(polycount);
        sb.append("|").append(imageSource != null ? imageSource : "GOOGLE_STATIC");

        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(sb.toString().getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm unavailable", e);
        }
    }
}
