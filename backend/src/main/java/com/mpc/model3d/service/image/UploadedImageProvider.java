package com.mpc.model3d.service.image;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Base64;
import java.util.List;

@Component("uploadedImageProvider")
public class UploadedImageProvider implements RooftopImageProvider {

    private static final Logger log = LoggerFactory.getLogger(UploadedImageProvider.class);
    private static final int MIN_RESOLUTION_PX = 512;
    private static final double MIN_VARIANCE_THRESHOLD = 100.0;

    @Override
    public String getProviderName() {
        return "UPLOADED";
    }

    @Override
    public CapturedImageResult captureRooftopImage(List<List<Double>> polygonCoordinates, String uploadedImageBase64) {
        if (uploadedImageBase64 == null || uploadedImageBase64.isBlank()) {
            throw new IllegalArgumentException("No uploaded image data provided.");
        }

        String rawBase64 = uploadedImageBase64;
        if (rawBase64.contains(",")) {
            rawBase64 = rawBase64.substring(rawBase64.indexOf(",") + 1);
        }

        byte[] imageBytes = Base64.getDecoder().decode(rawBase64.trim());
        if (imageBytes.length == 0) {
            throw new IllegalArgumentException("Decoded uploaded image is empty.");
        }

        BufferedImage decoded;
        try {
            decoded = ImageIO.read(new ByteArrayInputStream(imageBytes));
        } catch (IOException e) {
            throw new IllegalArgumentException("Could not decode uploaded file as an image.", e);
        }

        if (decoded == null) {
            throw new IllegalArgumentException("Could not decode uploaded file as an image (unsupported image format).");
        }

        int width = decoded.getWidth();
        int height = decoded.getHeight();
        int shortSide = Math.min(width, height);

        // Guard 1: Resolution check
        if (shortSide < MIN_RESOLUTION_PX) {
            throw new IllegalArgumentException(String.format(
                    "Uploaded image short side is %d px, which is below the mandatory %d px minimum resolution for 3D reconstruction.",
                    shortSide, MIN_RESOLUTION_PX
            ));
        }

        // Guard 2: Flat / synthetic color check
        double variance = MercatorProjectionUtil.calculateColorVariance(decoded);
        if (variance < MIN_VARIANCE_THRESHOLD) {
            throw new IllegalArgumentException(String.format(
                    "Uploaded image has flat/synthetic colour (variance %.2f < %.1f). Only real aerial/drone photography is permitted.",
                    variance, MIN_VARIANCE_THRESHOLD
            ));
        }

        String sha256 = MercatorProjectionUtil.computeSha256(imageBytes);
        log.info("Uploaded rooftop image verified: {}x{} px, {} bytes, SHA-256: {}",
                width, height, imageBytes.length, sha256);

        return new CapturedImageResult(
                imageBytes,
                width,
                height,
                imageBytes.length,
                sha256,
                0,
                "UPLOADED",
                variance
        );
    }
}
