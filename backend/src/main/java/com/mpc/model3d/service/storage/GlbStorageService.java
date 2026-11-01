package com.mpc.model3d.service.storage;

import com.mpc.model3d.config.RooftopProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
public class GlbStorageService {

    private static final Logger log = LoggerFactory.getLogger(GlbStorageService.class);

    private final RooftopProperties rooftopProperties;

    public GlbStorageService(RooftopProperties rooftopProperties) {
        this.rooftopProperties = rooftopProperties;
    }

    public String saveGlb(Long jobId, byte[] glbBytes) throws IOException {
        String dirPath = rooftopProperties.getStorage().getGlbDir();
        Path storageDir = Paths.get(dirPath);
        if (!Files.exists(storageDir)) {
            Files.createDirectories(storageDir);
        }

        Path targetFile = storageDir.resolve("job_" + jobId + ".glb");
        Files.write(targetFile, glbBytes);
        log.info("Persisted GLB model for Job #{} at {} ({} bytes)", jobId, targetFile.toAbsolutePath(), glbBytes.length);
        return targetFile.toString();
    }

    public byte[] loadGlb(String glbPath) throws IOException {
        if (glbPath != null) {
            Path file = Paths.get(glbPath);
            if (Files.exists(file)) {
                return Files.readAllBytes(file);
            }
        }

        // Support placeholder / bundled fallback for mock mode or unit tests
        if (glbPath != null && (glbPath.contains("placeholder") || glbPath.contains("mock"))) {
            return getBundledMockGlb();
        }

        throw new IOException("GLB model file not found on disk at " + glbPath);
    }

    public byte[] getBundledMockGlb() throws IOException {
        ClassPathResource resource = new ClassPathResource("models/mock-building.glb");
        if (resource.exists()) {
            try (InputStream is = resource.getInputStream()) {
                return is.readAllBytes();
            }
        }
        return new byte[0];
    }
}
