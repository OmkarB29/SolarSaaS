package com.mpc.model3d.service;

import com.mpc.model3d.service.image.MercatorMaskingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

class MercatorMaskingServiceTest {

    private MercatorMaskingService maskingService;

    @BeforeEach
    void setUp() {
        maskingService = new MercatorMaskingService();
    }

    @Test
    void testCenterCoordinatesMapToExactImageCenter() {
        double centerLat = 12.9716;
        double centerLng = 77.5946;
        int zoom = 19;
        int widthPx = 640;
        int heightPx = 640;
        int scale = 2; // Effective width & height = 1280

        MercatorMaskingService.PixelPoint centerPt = maskingService.gpsToPixel(
                centerLat, centerLng,
                centerLat, centerLng,
                zoom, widthPx, heightPx, scale
        );

        // Center pixel on 1280x1280 image is (640.0, 640.0)
        assertThat(centerPt.x).isCloseTo(640.0, within(0.001));
        assertThat(centerPt.y).isCloseTo(640.0, within(0.001));
    }

    @Test
    void testCardinalOffsetsOrientation() {
        double centerLat = 12.9716;
        double centerLng = 77.5946;
        int zoom = 19;
        int widthPx = 640;
        int heightPx = 640;
        int scale = 2;

        // North point (+latitude) should have smaller Y (higher on screen)
        MercatorMaskingService.PixelPoint northPt = maskingService.gpsToPixel(
                centerLat + 0.001, centerLng,
                centerLat, centerLng,
                zoom, widthPx, heightPx, scale
        );
        assertThat(northPt.y).isLessThan(640.0);
        assertThat(northPt.x).isCloseTo(640.0, within(0.001));

        // East point (+longitude) should have larger X (further right)
        MercatorMaskingService.PixelPoint eastPt = maskingService.gpsToPixel(
                centerLat, centerLng + 0.001,
                centerLat, centerLng,
                zoom, widthPx, heightPx, scale
        );
        assertThat(eastPt.x).isGreaterThan(640.0);
        assertThat(eastPt.y).isCloseTo(640.0, within(0.001));
    }

    @Test
    void testMaskOutsidePolygonGeneratesValidMaskedImage() throws Exception {
        // Create 200x200 solid blue source image
        BufferedImage src = new BufferedImage(200, 200, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = src.createGraphics();
        g.setColor(Color.BLUE);
        g.fillRect(0, 0, 200, 200);
        g.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(src, "PNG", baos);
        byte[] srcBytes = baos.toByteArray();

        // Polygon covering center
        double centerLat = 12.9716;
        double centerLng = 77.5946;
        List<List<Double>> polygon = List.of(
                List.of(centerLat + 0.0001, centerLng - 0.0001),
                List.of(centerLat + 0.0001, centerLng + 0.0001),
                List.of(centerLat - 0.0001, centerLng + 0.0001),
                List.of(centerLat - 0.0001, centerLng - 0.0001)
        );

        byte[] maskedBytes = maskingService.maskOutsidePolygon(
                srcBytes, polygon, centerLat, centerLng, 19, 100, 100, 2
        );

        assertThat(maskedBytes).isNotEmpty();
        BufferedImage result = ImageIO.read(new ByteArrayInputStream(maskedBytes));
        assertThat(result.getWidth()).isEqualTo(200);
        assertThat(result.getHeight()).isEqualTo(200);

        // Center pixel should be Blue (inside polygon)
        int centerColor = result.getRGB(100, 100);
        int blueComponent = centerColor & 0xFF;
        assertThat(blueComponent).isGreaterThan(150);

        // Corner pixel (0,0) should be neutral background (#ECEFF1, ~236,239,241), not Blue
        int cornerColor = result.getRGB(0, 0);
        int cornerRed = (cornerColor >> 16) & 0xFF;
        int cornerGreen = (cornerColor >> 8) & 0xFF;
        assertThat(cornerRed).isGreaterThan(200);
        assertThat(cornerGreen).isGreaterThan(200);
    }
}
