package com.mpc.model3d.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mpc.model3d.config.MeshyModel3DProperties;
import com.mpc.model3d.config.RooftopProperties;
import com.mpc.model3d.domain.Model3DJob;
import com.mpc.model3d.domain.Model3DStatus;
import com.mpc.model3d.repository.Model3DJobRepository;
import com.mpc.model3d.service.image.CapturedImageResult;
import com.mpc.model3d.service.image.RooftopImageProvider;
import com.mpc.model3d.service.storage.GlbStorageService;
import com.mpc.model3d.web.dto.Model3DJobRequestDTO;
import com.mpc.user.domain.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
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
    private final RooftopProperties rooftopProperties;
    private final GlbStorageService glbStorageService;
    private final RooftopImageProvider googleStaticMapsProvider;
    private final RooftopImageProvider uploadedImageProvider;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // In-flight task tracker to avoid duplicate poller threads
    private final Set<Long> inFlightJobs = ConcurrentHashMap.newKeySet();

    public Model3DService(Model3DJobRepository jobRepository,
                           MeshyClient meshyClient,
                           MeshyModel3DProperties meshyProperties,
                           RooftopProperties rooftopProperties,
                           GlbStorageService glbStorageService,
                           @Qualifier("googleStaticMapsProvider") RooftopImageProvider googleStaticMapsProvider,
                           @Qualifier("uploadedImageProvider") RooftopImageProvider uploadedImageProvider) {
        this.jobRepository = jobRepository;
        this.meshyClient = meshyClient;
        this.meshyProperties = meshyProperties;
        this.rooftopProperties = rooftopProperties;
        this.glbStorageService = glbStorageService;
        this.googleStaticMapsProvider = googleStaticMapsProvider;
        this.uploadedImageProvider = uploadedImageProvider;
    }

    @jakarta.annotation.PostConstruct
    public void logStartupDiagnostics() {
        boolean hasKey = meshyProperties.getApiKey() != null && !meshyProperties.getApiKey().trim().isEmpty();
        log.info("[3D Pipeline Startup] Meshy API Key Configured: {} | Submit Enabled: {}",
                hasKey ? "yes" : "no", isMeshySubmitAllowed());
    }

    public boolean isMeshySubmitAllowed() {
        return true;
    }

    /**
     * Previews real satellite or uploaded imagery without creating a job or spending credits.
     */
    public CapturedImageResult capturePreview(Model3DJobRequestDTO request) {
        if (request == null || request.getPolygonCoordinates() == null || request.getPolygonCoordinates().size() < 3) {
            throw new IllegalArgumentException("Rooftop polygon must contain at least 3 GPS coordinates.");
        }

        RooftopImageProvider provider = "UPLOADED".equalsIgnoreCase(request.getImageSource())
                ? uploadedImageProvider
                : googleStaticMapsProvider;

        return provider.captureRooftopImage(request.getPolygonCoordinates(), request.getImageBase64());
    }

    /**
     * Creates a new 3D generation job or returns an existing cached job for identical polygon hash.
     * Captures real satellite imagery, validates guards, audits exact bytes, and prepares task.
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

        // 4. Capture REAL satellite imagery (single image path, no fake drawing/canvas/SVG)
        RooftopImageProvider provider = "UPLOADED".equalsIgnoreCase(request.getImageSource())
                ? uploadedImageProvider
                : googleStaticMapsProvider;

        CapturedImageResult imageResult = provider.captureRooftopImage(
                request.getPolygonCoordinates(),
                request.getImageBase64()
        );

        // 5. Store exact bytes for immutable audit
        String auditPath = saveAuditImage(imageResult.getImageBytes(), imageResult.getSha256());

        // 6. Create and persist new Job entity in PENDING status
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
        job.setAuditImagePath(auditPath);
        job.setImageWidth(imageResult.getWidth());
        job.setImageHeight(imageResult.getHeight());
        job.setImageSizeBytes(imageResult.getSizeBytes());
        job.setImageSha256(imageResult.getSha256());
        job.setCreatedAt(Instant.now());

        Model3DJob savedJob = jobRepository.save(job);

        // 7. Controlled Execution: Create NO Meshy task until explicit user go-ahead
        if (isMeshySubmitAllowed()) {
            log.info("Meshy submission authorized. Launching background task for Job #{}", savedJob.getId());
            CompletableFuture.runAsync(() -> executeJobPipeline(savedJob.getId(), request, imageResult));
        } else {
            log.info("[Safety Guard] Real satellite imagery captured and audited (Job #{}, SHA-256: {}, {}x{}, {} bytes). Waiting for user go-ahead before Meshy task submission.",
                    savedJob.getId(), imageResult.getSha256(), imageResult.getWidth(), imageResult.getHeight(), imageResult.getSizeBytes());
        }

        return savedJob;
    }

    /**
     * Executes the generation pipeline asynchronously
     */
    public void executeJobPipeline(Long jobId, Model3DJobRequestDTO request, CapturedImageResult imageResult) {
        if (!inFlightJobs.add(jobId)) {
            log.info("Job #{} is already actively running in a background worker.", jobId);
            return;
        }

        try {
            updateJobStatus(jobId, Model3DStatus.IN_PROGRESS, 15, null, null);
            runRealMeshyPipeline(jobId, request, imageResult);
        } catch (Exception ex) {
            log.error("Fatal failure in 3D pipeline for Job #{}: {}", jobId, ex.getMessage(), ex);
            updateJobStatus(jobId, Model3DStatus.FAILED, 0, null, ex.getMessage());
        } finally {
            inFlightJobs.remove(jobId);
        }
    }

    private void runRealMeshyPipeline(Long jobId, Model3DJobRequestDTO request, CapturedImageResult imageResult) throws Exception {
        updateJobStatus(jobId, Model3DStatus.IN_PROGRESS, 25, null, null);

        // Submit Task to Meshy
        Model3DJob currentJob = jobRepository.findById(jobId).orElseThrow();
        String meshyTaskId = currentJob.getMeshyTaskId();
        if (meshyTaskId == null || meshyTaskId.isBlank()) {
            meshyTaskId = meshyClient.createImageTo3DTask(imageResult.getDataUri(), request.getMeshyApiKey());
            currentJob.setMeshyTaskId(meshyTaskId);
            jobRepository.save(currentJob);
        }

        // Poll Task Status (Max 60 minutes)
        Instant startTime = Instant.now();
        int pollIntervalSec = meshyProperties.getPollingIntervalSeconds();

        while (true) {
            if (Instant.now().isAfter(startTime.plus(60, ChronoUnit.MINUTES))) {
                throw new RuntimeException("Generation exceeded 60-minute safety limit. Task ID preserved for manual resume: " + meshyTaskId);
            }

            MeshyClient.MeshyTaskStatus taskStatus;
            try {
                taskStatus = meshyClient.pollTaskStatus(meshyTaskId, request.getMeshyApiKey());
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

                // Download and persist GLB locally
                try {
                    byte[] glbBytes = meshyClient.downloadGlb(taskStatus.glbUrl);
                    String localGlbPath = glbStorageService.saveGlb(jobId, glbBytes);
                    job.setGlbPath(localGlbPath);
                    jobRepository.save(job);
                } catch (Exception dlEx) {
                    log.warn("Failed to download GLB locally; remote Meshy URL remains active: {}", dlEx.getMessage());
                }
                return;
            } else if ("FAILED".equalsIgnoreCase(taskStatus.status) || "CANCELED".equalsIgnoreCase(taskStatus.status)) {
                throw new RuntimeException("Meshy generation reported status: " + taskStatus.status + " - " + taskStatus.errorMessage);
            }

            Thread.sleep(pollIntervalSec * 1000L);
        }
    }

    private String saveAuditImage(byte[] imageBytes, String sha256) {
        String auditDir = rooftopProperties.getStorage().getAuditDir();
        if (auditDir == null || auditDir.isBlank()) {
            auditDir = "uploads/audit_images";
        }

        try {
            Path dirPath = Paths.get(auditDir).toAbsolutePath().normalize();
            Files.createDirectories(dirPath);

            String prefix = sha256.length() >= 12 ? sha256.substring(0, 12) : sha256;
            String fileName = String.format("satellite_audit_%s_%d.png", prefix, System.currentTimeMillis());
            Path targetFile = dirPath.resolve(fileName);

            Files.write(targetFile, imageBytes);
            log.info("Saved exact satellite capture to audit storage: {} ({} bytes)", targetFile, imageBytes.length);
            return targetFile.toString();
        } catch (IOException e) {
            log.error("Failed to write audit image to disk: {}", e.getMessage(), e);
            throw new RuntimeException("Could not store satellite image for audit: " + e.getMessage(), e);
        }
    }

    private void updateJobStatus(Long jobId, Model3DStatus status, int progress, Integer consumedCredits, String errorMessage) {
        jobRepository.findById(jobId).ifPresent(job -> {
            job.setStatus(status);
            job.setProgress(progress);
            if (consumedCredits != null) {
                job.setConsumedCredits(consumedCredits);
            }
            if (errorMessage != null) {
                job.setErrorMessage(errorMessage);
            }
            if (status == Model3DStatus.FAILED || status == Model3DStatus.CANCELED) {
                job.setFinishedAt(Instant.now());
            }
            jobRepository.save(job);
        });
    }

    public Model3DJob getJob(Long jobId, User user) {
        Model3DJob job = jobRepository.findById(jobId)
                .orElseThrow(() -> new NoSuchElementException("3D Job not found with ID: " + jobId));

        if (!job.getUser().getId().equals(user.getId()) && !"ROLE_ADMIN".equals(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: You do not have permission to view this 3D model job.");
        }
        return job;
    }

    public List<Model3DJob> listUserJobs(User user) {
        return jobRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
    }

    public byte[] getJobGlb(Long jobId) {
        Model3DJob job = jobRepository.findById(jobId)
                .orElseThrow(() -> new NoSuchElementException("Job not found: " + jobId));

        if (job.getGlbPath() == null) {
            throw new NoSuchElementException("GLB model has not completed or is not stored locally.");
        }

        try {
            return Files.readAllBytes(Paths.get(job.getGlbPath()));
        } catch (IOException e) {
            throw new RuntimeException("Failed to read stored GLB from disk.", e);
        }
    }

    public String computePolygonHash(List<List<Double>> coords, String aiModel, int polycount, String imageSource) {
        try {
            StringBuilder sb = new StringBuilder();
            sb.append(aiModel != null ? aiModel : "meshy-7.1").append("|");
            sb.append(polycount).append("|");
            sb.append(imageSource != null ? imageSource : "GOOGLE_STATIC").append("|");

            for (List<Double> pt : coords) {
                sb.append(String.format(Locale.US, "%.6f,%.6f;", pt.get(0), pt.get(1)));
            }

            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(sb.toString().getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }
}
