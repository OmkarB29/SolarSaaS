package com.mpc.model3d.service.image;

import java.util.List;

public interface RooftopImageProvider {

    String getProviderName();

    byte[] captureRooftopImage(List<List<Double>> polygonCoordinates, String uploadedImageBase64);
}
