package com.mpc.model3d.service.image;

import java.util.Base64;

public class CapturedImageResult {

    private final byte[] imageBytes;
    private final int width;
    private final int height;
    private final long sizeBytes;
    private final String sha256;
    private final int zoom;
    private final String source;
    private final double variance;
    private final String dataUri;

    public CapturedImageResult(byte[] imageBytes,
                               int width,
                               int height,
                               long sizeBytes,
                               String sha256,
                               int zoom,
                               String source,
                               double variance) {
        this.imageBytes = imageBytes;
        this.width = width;
        this.height = height;
        this.sizeBytes = sizeBytes;
        this.sha256 = sha256;
        this.zoom = zoom;
        this.source = source;
        this.variance = variance;
        this.dataUri = "data:image/png;base64," + Base64.getEncoder().encodeToString(imageBytes);
    }

    public byte[] getImageBytes() {
        return imageBytes;
    }

    public int getWidth() {
        return width;
    }

    public int getHeight() {
        return height;
    }

    public long getSizeBytes() {
        return sizeBytes;
    }

    public String getSha256() {
        return sha256;
    }

    public int getZoom() {
        return zoom;
    }

    public String getSource() {
        return source;
    }

    public double getVariance() {
        return variance;
    }

    public String getDataUri() {
        return dataUri;
    }
}
