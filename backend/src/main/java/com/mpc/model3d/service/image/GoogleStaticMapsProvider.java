package com.mpc.model3d.service.image;

import com.mpc.model3d.config.RooftopProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import java.util.Locale;

@Component("googleStaticMapsProvider")
public class GoogleStaticMapsProvider implements RooftopImageProvider {

    private static final Logger log = LoggerFactory.getLogger(GoogleStaticMapsProvider.class);

    private static final int BASE_SIZE = 640;
    private static final int SCALE = 2; // Produces 1280x1280 output
    private static final int MIN_ZOOM = 12;
    private static final double MIN_VARIANCE_THRESHOLD = 100.0; // Flat gray placeholders typically have variance < 10.0
    private static final int MIN_RESOLUTION_PX = 512;

    private final RooftopProperties rooftopProperties;
    private final RestTemplate restTemplate;

    @Autowired
    public GoogleStaticMapsProvider(RooftopProperties rooftopProperties) {
        this(rooftopProperties, new RestTemplate());
    }

    public GoogleStaticMapsProvider(RooftopProperties rooftopProperties, RestTemplate restTemplate) {
        this.rooftopProperties = rooftopProperties;
        this.restTemplate = restTemplate;
    }

    @Override
    public String getProviderName() {
        return "GOOGLE_STATIC";
    }

    @Override
    public CapturedImageResult captureRooftopImage(List<List<Double>> polygonCoordinates, String uploadedImageBase64) {
        if (polygonCoordinates == null || polygonCoordinates.size() < 3) {
            throw new IllegalArgumentException("Rooftop polygon must have at least 3 GPS vertices.");
        }

        String apiKey = rooftopProperties.getImagery().getGoogleStatic().getKey();
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("Google Static Maps API server key is not configured. Configure GOOGLE_MAPS_SERVER_KEY to enable satellite capture.");
        }

        boolean enabled = rooftopProperties.getImagery().getGoogleStatic().isEnabled();
        if (!enabled) {
            throw new IllegalStateException("Google Static Maps imagery provider is disabled in configuration.");
        }

        // 1. Calculate bounding box & bounding-box center (plus ~5% padding)
        MercatorProjectionUtil.BoundingBox bbox = MercatorProjectionUtil.computeBoundingBox(polygonCoordinates);

        // 2. Select highest zoom level at which bounding box plus ~5% padding fits in 640x640 frame
        int optimalZoom = MercatorProjectionUtil.calculateOptimalZoom(bbox, BASE_SIZE, BASE_SIZE);
        log.info("Selected optimal zoom level {} for bounding box center ({}, {})", optimalZoom, bbox.centerLat, bbox.centerLng);

        // 3. Capture with zoom step-down on placeholder tile detection
        int currentZoom = optimalZoom;
        byte[] validRawBytes = null;
        BufferedImage validImage = null;
        double validVariance = 0.0;

        while (currentZoom >= MIN_ZOOM) {
            String staticMapUrl = buildStaticMapUrl(bbox.centerLat, bbox.centerLng, currentZoom, apiKey);
            log.info("Requesting top-down satellite imagery: center=({}, {}), zoom={}", bbox.centerLat, bbox.centerLng, currentZoom);

            byte[] rawBytes;
            try {
                rawBytes = restTemplate.getForObject(staticMapUrl, byte[].class);
            } catch (HttpStatusCodeException httpEx) {
                log.error("Google Static Maps API returned HTTP {}: {}", httpEx.getStatusCode(), httpEx.getResponseBodyAsString());
                throw new IllegalStateException("Google Static Maps request failed with HTTP " + httpEx.getStatusCode() + ": " + httpEx.getStatusText());
            } catch (Exception ex) {
                log.error("Google Static Maps network communication failure: {}", ex.getMessage());
                throw new IllegalStateException("Failed to communicate with Google Static Maps: " + ex.getMessage(), ex);
            }

            if (rawBytes == null || rawBytes.length == 0) {
                throw new IllegalStateException("Google Static Maps returned an empty response body.");
            }

            BufferedImage decoded;
            try {
                decoded = ImageIO.read(new ByteArrayInputStream(rawBytes));
            } catch (IOException e) {
                throw new IllegalStateException("Failed to decode image from Google Static Maps response.", e);
            }

            if (decoded == null) {
                throw new IllegalStateException("Google Static Maps response could not be decoded as an image.");
            }

            double variance = MercatorProjectionUtil.calculateColorVariance(decoded);
            log.info("Google Static Map at zoom {} received: {}x{} px, color variance: {:.2f}",
                    currentZoom, decoded.getWidth(), decoded.getHeight(), variance);

            if (variance < MIN_VARIANCE_THRESHOLD) {
                log.warn("Detected placeholder tile (flat grey/no imagery, variance={:.2f} < {:.1f}) at zoom {}. Stepping zoom down...",
                        variance, MIN_VARIANCE_THRESHOLD, currentZoom);
                currentZoom--;
                continue;
            }

            // Real satellite imagery found!
            validRawBytes = rawBytes;
            validImage = decoded;
            validVariance = variance;
            break;
        }

        if (validRawBytes == null || validImage == null) {
            throw new IllegalStateException(String.format(
                    "Google Static Maps returned placeholder / no-imagery tiles down to zoom %d for location (%.6f, %.6f). Real satellite imagery is not available for this area.",
                    MIN_ZOOM, bbox.centerLat, bbox.centerLng
            ));
        }

        // 4. Lossless pixel crop to the polygon's bounding box (only if capture extends beyond it)
        byte[] finalBytes = validRawBytes;
        BufferedImage finalImage = validImage;

        int imgW = validImage.getWidth();
        int imgH = validImage.getHeight();

        // Calculate pixel coordinates of bounding box with 5% padding
        double latPad = (bbox.maxLat - bbox.minLat) * 0.025;
        double lngPad = (bbox.maxLng - bbox.minLng) * 0.025;

        double[] topLeft = MercatorProjectionUtil.gpsToPixel(
                bbox.maxLat + latPad, bbox.minLng - lngPad,
                bbox.centerLat, bbox.centerLng,
                currentZoom, BASE_SIZE, BASE_SIZE, SCALE
        );

        double[] bottomRight = MercatorProjectionUtil.gpsToPixel(
                bbox.minLat - latPad, bbox.maxLng + lngPad,
                bbox.centerLat, bbox.centerLng,
                currentZoom, BASE_SIZE, BASE_SIZE, SCALE
        );

        int minPixelX = (int) Math.floor(Math.min(topLeft[0], bottomRight[0]));
        int maxPixelX = (int) Math.ceil(Math.max(topLeft[0], bottomRight[0]));
        int minPixelY = (int) Math.floor(Math.min(topLeft[1], bottomRight[1]));
        int maxPixelY = (int) Math.ceil(Math.max(topLeft[1], bottomRight[1]));

        int cropW = maxPixelX - minPixelX;
        int cropH = maxPixelY - minPixelY;

        // Guard: ensure cropped dimensions are at least MIN_RESOLUTION_PX (512) on short side
        if (cropW < MIN_RESOLUTION_PX) {
            int centerX = (minPixelX + maxPixelX) / 2;
            minPixelX = Math.max(0, centerX - (MIN_RESOLUTION_PX / 2));
            cropW = Math.min(imgW - minPixelX, MIN_RESOLUTION_PX);
        }
        if (cropH < MIN_RESOLUTION_PX) {
            int centerY = (minPixelY + maxPixelY) / 2;
            minPixelY = Math.max(0, centerY - (MIN_RESOLUTION_PX / 2));
            cropH = Math.min(imgH - minPixelY, MIN_RESOLUTION_PX);
        }

        // Clamp to image boundaries
        minPixelX = Math.max(0, Math.min(imgW - cropW, minPixelX));
        minPixelY = Math.max(0, Math.min(imgH - cropH, minPixelY));
        cropW = Math.min(imgW - minPixelX, cropW);
        cropH = Math.min(imgH - minPixelY, cropH);

        // Perform lossless pixel crop only if the capture extends beyond the bounding box
        boolean requiresCrop = (minPixelX > 0 || minPixelY > 0 || cropW < imgW || cropH < imgH);

        if (requiresCrop && cropW >= MIN_RESOLUTION_PX && cropH >= MIN_RESOLUTION_PX) {
            log.info("Losslessly cropping satellite capture to bounding box: [x={}, y={}, w={}, h={}]",
                    minPixelX, minPixelY, cropW, cropH);
            BufferedImage cropped = validImage.getSubimage(minPixelX, minPixelY, cropW, cropH);
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            try {
                ImageIO.write(cropped, "PNG", baos);
                finalBytes = baos.toByteArray();
                finalImage = cropped;
            } catch (IOException e) {
                log.warn("Lossless crop write failed; proceeding with unmodified capture: {}", e.getMessage());
            }
        } else {
            log.info("Passing full 1280x1280 satellite capture unmodified (no crop required).");
        }

        // 5. Mandatory Guards: Short side >= 512px and not flat colour
        int shortSide = Math.min(finalImage.getWidth(), finalImage.getHeight());
        if (shortSide < MIN_RESOLUTION_PX) {
            throw new IllegalArgumentException(String.format(
                    "Image short side is %d px, which is below the mandatory %d px minimum resolution for 3D reconstruction.",
                    shortSide, MIN_RESOLUTION_PX
            ));
        }

        double finalVariance = MercatorProjectionUtil.calculateColorVariance(finalImage);
        if (finalVariance < MIN_VARIANCE_THRESHOLD) {
            throw new IllegalArgumentException(String.format(
                    "Image has flat/synthetic colour (variance %.2f < %.1f). Only real satellite imagery is permitted.",
                    finalVariance, MIN_VARIANCE_THRESHOLD
            ));
        }

        String sha256 = MercatorProjectionUtil.computeSha256(finalBytes);
        log.info("Satellite imagery verified successfully: {}x{} px, {} bytes, SHA-256: {}",
                finalImage.getWidth(), finalImage.getHeight(), finalBytes.length, sha256);

        return new CapturedImageResult(
                finalBytes,
                finalImage.getWidth(),
                finalImage.getHeight(),
                finalBytes.length,
                sha256,
                currentZoom,
                "GOOGLE_STATIC",
                finalVariance
        );
    }

    /**
     * Builds strict Google Static Maps URL with NO markers, paths, labels, or overlay parameters.
     */
    public String buildStaticMapUrl(double centerLat, double centerLng, int zoom, String apiKey) {
        return String.format(
                Locale.US,
                "https://maps.googleapis.com/maps/api/staticmap?center=%.6f,%.6f&zoom=%d&size=%dx%d&scale=%d&format=png&maptype=satellite&key=%s",
                centerLat, centerLng, zoom, BASE_SIZE, BASE_SIZE, SCALE, apiKey
        );
    }
}
