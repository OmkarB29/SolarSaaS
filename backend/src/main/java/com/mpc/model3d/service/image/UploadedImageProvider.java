package com.mpc.model3d.service.image;

import org.springframework.stereotype.Component;

import java.util.Base64;
import java.util.List;

@Component("uploadedImageProvider")
public class UploadedImageProvider implements RooftopImageProvider {

    @Override
    public String getProviderName() {
        return "UPLOADED";
    }

    @Override
    public byte[] captureRooftopImage(List<List<Double>> polygonCoordinates, String uploadedImageBase64) {
        if (uploadedImageBase64 == null || uploadedImageBase64.isBlank()) {
            throw new IllegalArgumentException("No uploaded image data provided.");
        }

        String rawBase64 = uploadedImageBase64;
        if (rawBase64.contains(",")) {
            rawBase64 = rawBase64.substring(rawBase64.indexOf(",") + 1);
        }

        return Base64.getDecoder().decode(rawBase64.trim());
    }
}
