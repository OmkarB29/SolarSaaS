package com.mpc.model3d.service.image;

import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.geom.Path2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

@Service
public class MercatorMaskingService {

    public static class PixelPoint {
        public final double x;
        public final double y;

        public PixelPoint(double x, double y) {
            this.x = x;
            this.y = y;
        }
    }

    /**
     * Converts GPS coordinate to pixel position on a Google Static Map image.
     *
     * @param lat        Target point latitude
     * @param lng        Target point longitude
     * @param centerLat  Center latitude of static map
     * @param centerLng  Center longitude of static map
     * @param zoom       Map zoom level (typically 18-20)
     * @param widthPx    Base width parameter (e.g. 640)
     * @param heightPx   Base height parameter (e.g. 640)
     * @param scale      Static map scale multiplier (e.g. 2 for 1280x1280)
     * @return PixelPoint in rendered image coordinate space (0,0 at top-left)
     */
    public PixelPoint gpsToPixel(double lat, double lng,
                                double centerLat, double centerLng,
                                int zoom, int widthPx, int heightPx, int scale) {
        double worldTiles = Math.pow(2.0, zoom);
        double worldPixels = 256.0 * worldTiles;

        // Longitude to world X (0..worldPixels)
        double ptWorldX = ((lng + 180.0) / 360.0) * worldPixels;
        double centerWorldX = ((centerLng + 180.0) / 360.0) * worldPixels;

        // Latitude to world Y using Web Mercator Projection
        double ptSinLat = Math.sin(Math.toRadians(lat));
        double ptWorldY = (0.5 - Math.log((1.0 + ptSinLat) / (1.0 - ptSinLat)) / (4.0 * Math.PI)) * worldPixels;

        double centerSinLat = Math.sin(Math.toRadians(centerLat));
        double centerWorldY = (0.5 - Math.log((1.0 + centerSinLat) / (1.0 - centerSinLat)) / (4.0 * Math.PI)) * worldPixels;

        // Pixel offset relative to image center
        double effectiveWidth = widthPx * scale;
        double effectiveHeight = heightPx * scale;

        double pixelX = (ptWorldX - centerWorldX) * scale + (effectiveWidth / 2.0);
        double pixelY = (ptWorldY - centerWorldY) * scale + (effectiveHeight / 2.0);

        return new PixelPoint(pixelX, pixelY);
    }

    /**
     * Masks pixels outside the specified rooftop polygon to a neutral background.
     *
     * @param imageBytes         Raw satellite image bytes (PNG/JPG)
     * @param polygonCoordinates List of [latitude, longitude] vertices
     * @param centerLat          Center latitude of image
     * @param centerLng          Center longitude of image
     * @param zoom               Zoom level
     * @param widthPx            Base width
     * @param heightPx           Base height
     * @param scale              Scale multiplier
     * @return Masked image bytes in PNG format
     */
    public byte[] maskOutsidePolygon(byte[] imageBytes,
                                     List<List<Double>> polygonCoordinates,
                                     double centerLat, double centerLng,
                                     int zoom, int widthPx, int heightPx, int scale) throws IOException {
        if (imageBytes == null || imageBytes.length == 0) {
            throw new IllegalArgumentException("Image bytes cannot be empty.");
        }

        BufferedImage srcImage = ImageIO.read(new ByteArrayInputStream(imageBytes));
        if (srcImage == null) {
            throw new IOException("Could not decode source image for polygon masking.");
        }

        int imgW = srcImage.getWidth();
        int imgH = srcImage.getHeight();

        BufferedImage maskedImage = new BufferedImage(imgW, imgH, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = maskedImage.createGraphics();

        try {
            g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);

            // 1. Fill entire canvas with neutral architectural matte background (light gray #ECEFF1)
            g2d.setColor(new Color(236, 239, 241));
            g2d.fillRect(0, 0, imgW, imgH);

            if (polygonCoordinates != null && polygonCoordinates.size() >= 3) {
                // 2. Build 2D polygon path in pixel coordinates
                Path2D.Double path = new Path2D.Double();
                boolean first = true;
                for (List<Double> pt : polygonCoordinates) {
                    PixelPoint px = gpsToPixel(pt.get(0), pt.get(1), centerLat, centerLng, zoom, widthPx, heightPx, scale);
                    if (first) {
                        path.moveTo(px.x, px.y);
                        first = false;
                    } else {
                        path.lineTo(px.x, px.y);
                    }
                }
                path.closePath();

                // 3. Clip and draw original satellite image inside rooftop boundary
                g2d.setClip(path);
                g2d.drawImage(srcImage, 0, 0, null);
            } else {
                g2d.drawImage(srcImage, 0, 0, null);
            }
        } finally {
            g2d.dispose();
        }

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(maskedImage, "PNG", baos);
        return baos.toByteArray();
    }
}
