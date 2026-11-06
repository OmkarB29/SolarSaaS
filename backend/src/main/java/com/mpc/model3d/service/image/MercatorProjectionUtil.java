package com.mpc.model3d.service.image;

import java.awt.image.BufferedImage;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.List;

public final class MercatorProjectionUtil {

    private MercatorProjectionUtil() {
    }

    public static class BoundingBox {
        public final double minLat;
        public final double maxLat;
        public final double minLng;
        public final double maxLng;
        public final double centerLat;
        public final double centerLng;
        public final double paddedLatSpan;
        public final double paddedLngSpan;

        public BoundingBox(double minLat, double maxLat, double minLng, double maxLng) {
            this.minLat = minLat;
            this.maxLat = maxLat;
            this.minLng = minLng;
            this.maxLng = maxLng;
            this.centerLat = (minLat + maxLat) / 2.0;
            this.centerLng = (minLng + maxLng) / 2.0;
            double latDiff = Math.max(0.00005, maxLat - minLat);
            double lngDiff = Math.max(0.00005, maxLng - minLng);
            this.paddedLatSpan = latDiff * 1.05;
            this.paddedLngSpan = lngDiff * 1.05;
        }
    }

    public static BoundingBox computeBoundingBox(List<List<Double>> polygonCoordinates) {
        if (polygonCoordinates == null || polygonCoordinates.size() < 3) {
            throw new IllegalArgumentException("Polygon must have at least 3 vertices.");
        }

        double minLat = Double.MAX_VALUE;
        double maxLat = -Double.MAX_VALUE;
        double minLng = Double.MAX_VALUE;
        double maxLng = -Double.MAX_VALUE;

        for (List<Double> pt : polygonCoordinates) {
            double lat = pt.get(0);
            double lng = pt.get(1);
            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
            minLng = Math.min(minLng, lng);
            maxLng = Math.max(maxLng, lng);
        }

        return new BoundingBox(minLat, maxLat, minLng, maxLng);
    }

    /**
     * Finds the highest zoom level (0 to 21) at which the bounding box plus ~5% padding
     * fits completely within the base 640x640 Google Static Maps frame.
     */
    public static int calculateOptimalZoom(BoundingBox bbox, int baseWidthPx, int baseHeightPx) {
        for (int z = 21; z >= 0; z--) {
            double worldPixels = 256.0 * Math.pow(2.0, z);

            // Longitude coverage for width
            double lngCoveredDeg = (baseWidthPx / worldPixels) * 360.0;
            if (bbox.paddedLngSpan > lngCoveredDeg) {
                continue;
            }

            // Latitude coverage for height using Web Mercator Projection
            double yMin = latToMercatorY(bbox.minLat);
            double yMax = latToMercatorY(bbox.maxLat);
            double deltaYWorldPixels = Math.abs(yMax - yMin) * worldPixels;
            double paddedPixelHeight = deltaYWorldPixels * 1.05;

            if (paddedPixelHeight <= baseHeightPx) {
                return z;
            }
        }
        return 0;
    }

    /**
     * Converts latitude in degrees to normalized Web Mercator Y in [0, 1].
     */
    public static double latToMercatorY(double latDeg) {
        double latRad = Math.toRadians(Math.max(-85.05112878, Math.min(85.05112878, latDeg)));
        double sinLat = Math.sin(latRad);
        return 0.5 - Math.log((1.0 + sinLat) / (1.0 - sinLat)) / (4.0 * Math.PI);
    }

    /**
     * Converts GPS coordinates to pixel coordinates on the scaled Static Map.
     */
    public static double[] gpsToPixel(double lat, double lng,
                                      double centerLat, double centerLng,
                                      int zoom, int baseWidth, int baseHeight, int scale) {
        double worldPixels = 256.0 * Math.pow(2.0, zoom);

        double ptWorldX = ((lng + 180.0) / 360.0) * worldPixels;
        double centerWorldX = ((centerLng + 180.0) / 360.0) * worldPixels;

        double ptWorldY = latToMercatorY(lat) * worldPixels;
        double centerWorldY = latToMercatorY(centerLat) * worldPixels;

        double effectiveWidth = (double) baseWidth * scale;
        double effectiveHeight = (double) baseHeight * scale;

        double pixelX = (ptWorldX - centerWorldX) * scale + (effectiveWidth / 2.0);
        double pixelY = (ptWorldY - centerWorldY) * scale + (effectiveHeight / 2.0);

        return new double[]{pixelX, pixelY};
    }

    /**
     * Calculates color variance across RGB channels of an image.
     * Uniform/flat placeholder tiles return variance < 100.0 (std dev < 10.0).
     */
    public static double calculateColorVariance(BufferedImage image) {
        if (image == null) return 0.0;
        int w = image.getWidth();
        int h = image.getHeight();
        long totalPixels = (long) w * h;
        if (totalPixels == 0) return 0.0;

        double sumR = 0, sumG = 0, sumB = 0;
        double sumSqR = 0, sumSqG = 0, sumSqB = 0;

        int[] rgbArray = new int[w * h];
        image.getRGB(0, 0, w, h, rgbArray, 0, w);

        for (int rgb : rgbArray) {
            int r = (rgb >> 16) & 0xFF;
            int g = (rgb >> 8) & 0xFF;
            int b = rgb & 0xFF;
            sumR += r;
            sumSqR += (double) r * r;
            sumG += g;
            sumSqG += (double) g * g;
            sumB += b;
            sumSqB += (double) b * b;
        }

        double meanR = sumR / totalPixels;
        double meanG = sumG / totalPixels;
        double meanB = sumB / totalPixels;

        double varR = (sumSqR / totalPixels) - (meanR * meanR);
        double varG = (sumSqG / totalPixels) - (meanG * meanG);
        double varB = (sumSqB / totalPixels) - (meanB * meanB);

        return (varR + varG + varB) / 3.0;
    }

    /**
     * Computes hex-encoded SHA-256 hash for byte auditing.
     */
    public static String computeSha256(byte[] bytes) {
        if (bytes == null || bytes.length == 0) return "";
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(bytes);
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }
}
