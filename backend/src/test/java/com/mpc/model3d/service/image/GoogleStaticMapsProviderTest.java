package com.mpc.model3d.service.image;

import com.mpc.model3d.config.RooftopProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.web.client.RestTemplate;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import java.util.Random;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class GoogleStaticMapsProviderTest {

    private RooftopProperties rooftopProperties;
    private RestTemplate restTemplate;
    private GoogleStaticMapsProvider provider;

    private static final List<List<Double>> TEST_POLYGON = List.of(
            List.of(12.9716, 77.5946),
            List.of(12.9718, 77.5946),
            List.of(12.9718, 77.5949),
            List.of(12.9716, 77.5949)
    );

    @BeforeEach
    void setUp() {
        rooftopProperties = new RooftopProperties();
        rooftopProperties.getImagery().getGoogleStatic().setEnabled(true);
        rooftopProperties.getImagery().getGoogleStatic().setKey("TEST_SERVER_KEY_12345");

        restTemplate = mock(RestTemplate.class);
        provider = new GoogleStaticMapsProvider(rooftopProperties, restTemplate);
    }

    /**
     * Requirement 2 & 8: Verify Static Maps URL contains NO overlay parameters
     * (no markers, paths, labels, polygon outlines, styles).
     */
    @Test
    void testNoOverlayParametersInStaticMapsUrl() throws Exception {
        byte[] validImageBytes = createTexturedImageBytes(1280, 1280);
        when(restTemplate.getForObject(anyString(), eq(byte[].class))).thenReturn(validImageBytes);

        provider.captureRooftopImage(TEST_POLYGON, null);

        ArgumentCaptor<String> urlCaptor = ArgumentCaptor.forClass(String.class);
        verify(restTemplate).getForObject(urlCaptor.capture(), eq(byte[].class));

        String capturedUrl = urlCaptor.getValue();
        assertThat(capturedUrl).contains("maptype=satellite");
        assertThat(capturedUrl).contains("scale=2");
        assertThat(capturedUrl).contains("size=640x640");
        assertThat(capturedUrl).contains("format=png");
        assertThat(capturedUrl).contains("center=");
        assertThat(capturedUrl).contains("zoom=");
        assertThat(capturedUrl).contains("key=TEST_SERVER_KEY_12345");

        // Strictly verify NO overlays
        assertThat(capturedUrl).doesNotContain("markers=");
        assertThat(capturedUrl).doesNotContain("path=");
        assertThat(capturedUrl).doesNotContain("labels=");
        assertThat(capturedUrl).doesNotContain("style=");
        assertThat(capturedUrl).doesNotContain("visible=");
    }

    /**
     * Requirement 4, 5 & 8: Bytes sent equal bytes captured (lossless pass-through and audit).
     */
    @Test
    void testBytesSentEqualBytesCapturedAndAudited() throws Exception {
        byte[] validImageBytes = createTexturedImageBytes(1280, 1280);
        when(restTemplate.getForObject(anyString(), eq(byte[].class))).thenReturn(validImageBytes);

        CapturedImageResult result = provider.captureRooftopImage(TEST_POLYGON, null);

        assertThat(result).isNotNull();
        assertThat(result.getWidth()).isGreaterThanOrEqualTo(512);
        assertThat(result.getHeight()).isGreaterThanOrEqualTo(512);
        assertThat(result.getSource()).isEqualTo("GOOGLE_STATIC");
        assertThat(result.getSha256()).isEqualTo(MercatorProjectionUtil.computeSha256(result.getImageBytes()));
        assertThat(result.getSizeBytes()).isEqualTo(result.getImageBytes().length);
    }

    /**
     * Requirement 3 & 8: Placeholder tile triggers zoom step-down until real imagery appears.
     */
    @Test
    void testPlaceholderTileTriggersZoomStepDown() throws Exception {
        // First tile is flat grey placeholder (variance = 0)
        byte[] flatGreyPlaceholder = createFlatColorImageBytes(1280, 1280, new Color(230, 230, 230));
        // Second tile at lower zoom has real texture (variance >= 100)
        byte[] realTexturedTile = createTexturedImageBytes(1280, 1280);

        ArgumentCaptor<String> urlCaptor = ArgumentCaptor.forClass(String.class);
        when(restTemplate.getForObject(anyString(), eq(byte[].class)))
                .thenReturn(flatGreyPlaceholder)
                .thenReturn(realTexturedTile);

        CapturedImageResult result = provider.captureRooftopImage(TEST_POLYGON, null);

        // Verify two requests were made (zoom step-down occurred)
        verify(restTemplate, times(2)).getForObject(urlCaptor.capture(), eq(byte[].class));
        List<String> requestedUrls = urlCaptor.getAllValues();

        assertThat(requestedUrls).hasSize(2);
        // Extract zoom from URLs
        int zoom1 = extractZoomFromUrl(requestedUrls.get(0));
        int zoom2 = extractZoomFromUrl(requestedUrls.get(1));

        assertThat(zoom2).isEqualTo(zoom1 - 1);
        assertThat(result.getVariance()).isGreaterThanOrEqualTo(100.0);
    }

    /**
     * Requirement 3 & 8: If all zoom levels return placeholder tiles, fail loudly with reason.
     */
    @Test
    void testPlaceholderTileFailsLoudlyWhenNoImageryAtAnyZoom() throws Exception {
        byte[] flatGreyPlaceholder = createFlatColorImageBytes(1280, 1280, new Color(230, 230, 230));
        when(restTemplate.getForObject(anyString(), eq(byte[].class))).thenReturn(flatGreyPlaceholder);

        assertThatThrownBy(() -> provider.captureRooftopImage(TEST_POLYGON, null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("placeholder / no-imagery tiles");
    }

    /**
     * Requirement 8: Reject any image under 512 px on short side.
     */
    @Test
    void testRejectImageUnder512PxOnShortSide() throws Exception {
        byte[] smallImage = createTexturedImageBytes(400, 400);
        when(restTemplate.getForObject(anyString(), eq(byte[].class))).thenReturn(smallImage);

        assertThatThrownBy(() -> provider.captureRooftopImage(TEST_POLYGON, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("below the mandatory 512 px minimum resolution");
    }

    /**
     * Requirement 8: Reject any image with flat colour (synthetic-looking).
     */
    @Test
    void testRejectFlatSyntheticColorImage() throws Exception {
        byte[] solidBlue = createFlatColorImageBytes(1280, 1280, Color.BLUE);
        when(restTemplate.getForObject(anyString(), eq(byte[].class))).thenReturn(solidBlue);

        assertThatThrownBy(() -> provider.captureRooftopImage(TEST_POLYGON, null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("placeholder / no-imagery tiles");
    }

    /**
     * Requirement 8: Nothing is sent when capture fails.
     */
    @Test
    void testNothingSentWhenCaptureFails() {
        when(restTemplate.getForObject(anyString(), eq(byte[].class)))
                .thenThrow(new RuntimeException("Google Static Maps connection timeout"));

        assertThatThrownBy(() -> provider.captureRooftopImage(TEST_POLYGON, null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Failed to communicate with Google Static Maps");
    }

    // Helper methods to generate test images without external dependencies
    private byte[] createTexturedImageBytes(int w, int h) throws IOException {
        BufferedImage img = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
        Random rng = new Random(42);
        for (int y = 0; y < h; y++) {
            for (int x = 0; x < w; x++) {
                int r = 50 + rng.nextInt(150);
                int g = 60 + rng.nextInt(140);
                int b = 40 + rng.nextInt(160);
                int rgb = (r << 16) | (g << 8) | b;
                img.setRGB(x, y, rgb);
            }
        }
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, "PNG", baos);
        return baos.toByteArray();
    }

    private byte[] createFlatColorImageBytes(int w, int h, Color color) throws IOException {
        BufferedImage img = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
        int rgb = color.getRGB();
        for (int y = 0; y < h; y++) {
            for (int x = 0; x < w; x++) {
                img.setRGB(x, y, rgb);
            }
        }
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, "PNG", baos);
        return baos.toByteArray();
    }

    private int extractZoomFromUrl(String url) {
        int idx = url.indexOf("zoom=");
        if (idx == -1) return -1;
        int end = url.indexOf("&", idx);
        String zoomStr = end != -1 ? url.substring(idx + 5, end) : url.substring(idx + 5);
        return Integer.parseInt(zoomStr);
    }
}
