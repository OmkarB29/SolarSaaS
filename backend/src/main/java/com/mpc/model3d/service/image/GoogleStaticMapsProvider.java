package com.mpc.model3d.service.image;

import com.mpc.model3d.config.RooftopProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.util.List;
import java.util.Locale;

@Component("googleStaticMapsProvider")
public class GoogleStaticMapsProvider implements RooftopImageProvider {

    private static final Logger log = LoggerFactory.getLogger(GoogleStaticMapsProvider.class);

    private final RooftopProperties rooftopProperties;
    private final MercatorMaskingService mercatorMaskingService;
    private final RestTemplate restTemplate;

    @org.springframework.beans.factory.annotation.Autowired
    public GoogleStaticMapsProvider(RooftopProperties rooftopProperties,
                                    MercatorMaskingService mercatorMaskingService) {
        this.rooftopProperties = rooftopProperties;
        this.mercatorMaskingService = mercatorMaskingService;
        this.restTemplate = new RestTemplate();
    }

    public GoogleStaticMapsProvider(RooftopProperties rooftopProperties,
                                    MercatorMaskingService mercatorMaskingService,
                                    RestTemplate restTemplate) {
        this.rooftopProperties = rooftopProperties;
        this.mercatorMaskingService = mercatorMaskingService;
        this.restTemplate = restTemplate;
    }

    @Override
    public String getProviderName() {
        return "GOOGLE_STATIC";
    }

    @Override
    public byte[] captureRooftopImage(List<List<Double>> polygonCoordinates, String uploadedImageBase64) {
        if (!rooftopProperties.getImagery().getGoogleStatic().isEnabled()) {
            throw new IllegalStateException(
                "Google Static Maps automated image capture is disabled per Terms of Service compliance. " +
                "To enable, set rooftop.imagery.google-static.enabled=true with an authorized license key, " +
                "or upload your own drone/aerial rooftop photo using UploadedImageProvider."
            );
        }

        if (polygonCoordinates == null || polygonCoordinates.size() < 3) {
            throw new IllegalArgumentException("Rooftop polygon must have at least 3 vertices.");
        }

        String apiKey = rooftopProperties.getImagery().getGoogleStatic().getKey();
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("Google Maps server key is not configured (rooftop.imagery.google-static.key).");
        }

        // 1. Calculate bounding box & centroid
        double minLat = Double.MAX_VALUE, maxLat = -Double.MAX_VALUE;
        double minLng = Double.MAX_VALUE, maxLng = -Double.MAX_VALUE;
        double sumLat = 0, sumLng = 0;

        for (List<Double> pt : polygonCoordinates) {
            double lat = pt.get(0);
            double lng = pt.get(1);
            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
            minLng = Math.min(minLng, lng);
            maxLng = Math.max(maxLng, lng);
            sumLat += lat;
            sumLng += lng;
        }

        double centerLat = sumLat / polygonCoordinates.size();
        double centerLng = sumLng / polygonCoordinates.size();

        // Add ~15% bounding box padding
        double latSpan = Math.max(0.0001, (maxLat - minLat) * 1.30);
        double lngSpan = Math.max(0.0001, (maxLng - minLng) * 1.30);

        // 2. Select highest zoom level that fits within 640x640 base size
        int zoom = calculateFittingZoom(centerLat, latSpan, lngSpan, 640, 640);
        int baseSize = 640;
        int scale = 2; // Produces 1280x1280

        String staticMapUrl = String.format(
                Locale.US,
                "https://maps.googleapis.com/maps/api/staticmap?center=%.6f,%.6f&zoom=%d&size=%dx%d&scale=%d&maptype=satellite&key=%s",
                centerLat, centerLng, zoom, baseSize, baseSize, scale, apiKey
        );

        log.info("Fetching Google Static Map for polygon at center ({}, {}), zoom {}", centerLat, centerLng, zoom);
        byte[] rawBytes = restTemplate.getForObject(staticMapUrl, byte[].class);
        if (rawBytes == null || rawBytes.length == 0) {
            throw new IllegalStateException("Failed to download satellite imagery from Google Static Maps API.");
        }

        // 3. Mask pixels outside the rooftop polygon
        try {
            return mercatorMaskingService.maskOutsidePolygon(
                    rawBytes,
                    polygonCoordinates,
                    centerLat,
                    centerLng,
                    zoom,
                    baseSize,
                    baseSize,
                    scale
            );
        } catch (IOException e) {
            log.warn("Masking failed; returning raw satellite image: {}", e.getMessage());
            return rawBytes;
        }
    }

    /**
     * Calculates the optimal Google Maps zoom level (0 to 21) so the bounding box fits inside the image.
     */
    public int calculateFittingZoom(double lat, double latSpan, double lngSpan, int widthPx, int heightPx) {
        for (int z = 21; z >= 10; z--) {
            double worldPixels = 256.0 * Math.pow(2.0, z);

            // Longitude degrees covered in widthPx
            double lngDegCovered = (widthPx / worldPixels) * 360.0;

            // Latitude degrees covered near current lat
            double latRad = Math.toRadians(lat);
            double metersPerPixel = (156543.03392 * Math.cos(latRad)) / Math.pow(2.0, z);
            double latMetersCovered = heightPx * metersPerPixel;
            double latDegCovered = latMetersCovered / 111139.0;

            if (lngSpan <= lngDegCovered && latSpan <= latDegCovered) {
                return z;
            }
        }
        return 19;
    }
}
