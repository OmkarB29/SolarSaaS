package com.mpc.model3d.web.dto;

import com.mpc.model3d.service.image.CapturedImageResult;

public class RooftopCapturePreviewDTO {

    private String imageBase64;
    private int width;
    private int height;
    private long sizeBytes;
    private String sizeFormatted;
    private String sha256;
    private int zoom;
    private String source;
    private boolean valid;
    private String message;

    public RooftopCapturePreviewDTO() {
    }

    public static RooftopCapturePreviewDTO fromCapturedResult(CapturedImageResult result, String message) {
        RooftopCapturePreviewDTO dto = new RooftopCapturePreviewDTO();
        dto.setImageBase64(result.getDataUri());
        dto.setWidth(result.getWidth());
        dto.setHeight(result.getHeight());
        dto.setSizeBytes(result.getSizeBytes());
        dto.setSizeFormatted(formatFileSize(result.getSizeBytes()));
        dto.setSha256(result.getSha256());
        dto.setZoom(result.getZoom());
        dto.setSource(result.getSource());
        dto.setValid(true);
        dto.setMessage(message != null ? message : "Real satellite imagery verified.");
        return dto;
    }

    private static String formatFileSize(long bytes) {
        if (bytes < 1024) return bytes + " B";
        int exp = (int) (Math.log(bytes) / Math.log(1024));
        char pre = "KMGTPE".charAt(exp - 1);
        return String.format(java.util.Locale.US, "%.1f %cB", bytes / Math.pow(1024, exp), pre);
    }

    public String getImageBase64() {
        return imageBase64;
    }

    public void setImageBase64(String imageBase64) {
        this.imageBase64 = imageBase64;
    }

    public int getWidth() {
        return width;
    }

    public void setWidth(int width) {
        this.width = width;
    }

    public int getHeight() {
        return height;
    }

    public void setHeight(int height) {
        this.height = height;
    }

    public long getSizeBytes() {
        return sizeBytes;
    }

    public void setSizeBytes(long sizeBytes) {
        this.sizeBytes = sizeBytes;
    }

    public String getSizeFormatted() {
        return sizeFormatted;
    }

    public void setSizeFormatted(String sizeFormatted) {
        this.sizeFormatted = sizeFormatted;
    }

    public String getSha256() {
        return sha256;
    }

    public void setSha256(String sha256) {
        this.sha256 = sha256;
    }

    public int getZoom() {
        return zoom;
    }

    public void setZoom(int zoom) {
        this.zoom = zoom;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public boolean isValid() {
        return valid;
    }

    public void setValid(boolean valid) {
        this.valid = valid;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
