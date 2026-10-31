package com.mpc.scene3d.service;

import com.mpc.scene3d.dto.*;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class Scene3DService {

    private static final double EARTH_RADIUS = 6371000.0;

    /**
     * Converts a GPS [lat, lng] point to local metric coordinates relative to a centroid origin.
     * Uses equirectangular projection valid for small areas (< 50 km).
     * Returns [x=East, y=North] in meters.
     */
    private double[] gpsToLocal(double lat, double lng, double originLat, double originLng) {
        double dLat = Math.toRadians(lat - originLat);
        double dLng = Math.toRadians(lng - originLng);
        double meanLat = Math.toRadians((lat + originLat) / 2.0);
        double x = dLng * EARTH_RADIUS * Math.cos(meanLat);
        double y = dLat * EARTH_RADIUS;
        return new double[]{x, y};
    }

    private double calculatePolygonAreaMetric(List<double[]> pts) {
        double area = 0.0;
        int n = pts.size();
        for (int i = 0; i < n; i++) {
            double[] p1 = pts.get(i);
            double[] p2 = pts.get((i + 1) % n);
            area += p1[0] * p2[1];
            area -= p2[0] * p1[1];
        }
        return Math.abs(area) / 2.0;
    }

    public Scene3DResponse buildScene(Scene3DRequest request) {
        List<List<Double>> polyGps = request.getPolygonCoordinates();
        if (polyGps == null || polyGps.size() < 3) {
            throw new IllegalArgumentException("A polygon with at least 3 GPS coordinates is required.");
        }

        // 1. Calculate centroid of polygon as local origin
        double sumLat = 0.0, sumLng = 0.0;
        for (List<Double> pt : polyGps) {
            sumLat += pt.get(0);
            sumLng += pt.get(1);
        }
        double originLat = sumLat / polyGps.size();
        double originLng = sumLng / polyGps.size();

        double buildingHeight = request.getBuildingHeightMeters() != null ? request.getBuildingHeightMeters() : 4.0;

        // 2. Project polygon to local metric coords
        List<double[]> localPts = new ArrayList<>();
        for (List<Double> pt : polyGps) {
            localPts.add(gpsToLocal(pt.get(0), pt.get(1), originLat, originLng));
        }

        double roofArea = request.getRoofAreaM2() != null ? request.getRoofAreaM2() : calculatePolygonAreaMetric(localPts);

        // 3. Build footprint points at Z=0
        List<Scene3DLocalPoint> footprint = new ArrayList<>();
        List<Scene3DLocalPoint> roofOutline = new ArrayList<>();
        double maxR = 0.0;
        for (double[] pt : localPts) {
            footprint.add(new Scene3DLocalPoint(pt[0], 0.0, pt[1]));   // Three.js: Y=up, X=east, Z=south
            roofOutline.add(new Scene3DLocalPoint(pt[0], buildingHeight, pt[1]));
            double r = Math.sqrt(pt[0] * pt[0] + pt[1] * pt[1]);
            if (r > maxR) maxR = r;
        }

        // 4. Convert panel array to local 3D
        List<Panel3DLocalDTO> localPanels = new ArrayList<>();
        List<Panel3DDTO> rawPanels = request.getPanels();
        if (rawPanels != null) {
            for (Panel3DDTO panel : rawPanels) {
                Panel3DLocalDTO lp = new Panel3DLocalDTO();
                lp.setPanelNumber(panel.getPanelNumber());
                lp.setWidthMeters(panel.getWidthMeters());
                lp.setLengthMeters(panel.getLengthMeters());
                lp.setPowerWatts(panel.getPowerWatts());
                lp.setOrientation(panel.getOrientation());
                lp.setAzimuthDegrees(panel.getAzimuthDegrees());
                lp.setTiltDegrees(panel.getTiltDegrees() > 0 ? panel.getTiltDegrees() : 15.0);

                // Panel center
                if (panel.getCenter() != null) {
                    double[] cLocal = gpsToLocal(panel.getCenter().getLat(), panel.getCenter().getLng(), originLat, originLng);
                    lp.setCenter(new Scene3DLocalPoint(cLocal[0], buildingHeight + 0.05, cLocal[1]));
                }

                // Panel corners
                if (panel.getCorners() != null && !panel.getCorners().isEmpty()) {
                    List<Scene3DLocalPoint> corners = new ArrayList<>();
                    for (GeoPointDTO c : panel.getCorners()) {
                        double[] cLocal = gpsToLocal(c.getLat(), c.getLng(), originLat, originLng);
                        corners.add(new Scene3DLocalPoint(cLocal[0], buildingHeight + 0.05, cLocal[1]));
                    }
                    lp.setCorners(corners);
                }

                localPanels.add(lp);
            }
        }

        // 5. Assemble response
        Scene3DResponse resp = new Scene3DResponse();
        resp.setBuildingFootprint(footprint);
        resp.setRoofOutline(roofOutline);
        resp.setBuildingHeightMeters(buildingHeight);
        resp.setRoofAreaM2(Math.round(roofArea * 10.0) / 10.0);
        resp.setOriginLat(originLat);
        resp.setOriginLng(originLng);
        resp.setPanels(localPanels);
        resp.setPanelCount(localPanels.size());
        resp.setLayoutMode(request.getLayoutMode() != null ? request.getLayoutMode() : "BALANCED");
        resp.setAddress(request.getAddress() != null ? request.getAddress() : "Solar Installation Site");
        resp.setSystemCapacityKw(request.getSystemCapacityKw() != null ? request.getSystemCapacityKw() : localPanels.size() * 0.4);
        resp.setSceneBoundingRadiusMeters(Math.round(maxR * 1.5 * 10.0) / 10.0);
        return resp;
    }
}
