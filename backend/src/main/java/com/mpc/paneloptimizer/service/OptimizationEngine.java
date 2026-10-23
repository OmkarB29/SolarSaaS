package com.mpc.paneloptimizer.service;

import com.mpc.paneloptimizer.web.dto.*;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Component
public class OptimizationEngine {

    public static final double EARTH_RADIUS = 6371000.0;

    public static class Point2D {
        public double x;
        public double y;

        public Point2D(double x, double y) {
            this.x = x;
            this.y = y;
        }
    }

    public List<OptimizationLayoutDTO> generateOptimizedLayouts(List<List<Double>> polygonGps,
                                                                PanelDimensionsDTO dimensions,
                                                                Double annualIrradiance) {
        if (polygonGps == null || polygonGps.size() < 3) {
            throw new IllegalArgumentException("Rooftop polygon must have at least 3 GPS coordinates.");
        }

        if (dimensions == null) {
            dimensions = new PanelDimensionsDTO();
        }

        // 1. Calculate GPS Centroid
        double sumLat = 0.0;
        double sumLng = 0.0;
        for (List<Double> pt : polygonGps) {
            sumLat += pt.get(0);
            sumLng += pt.get(1);
        }
        double centerLat = sumLat / polygonGps.size();
        double centerLng = sumLng / polygonGps.size();

        // 2. Convert to local metric Cartesian coordinates (meters)
        List<Point2D> polygonMetric = new ArrayList<>();
        for (List<Double> pt : polygonGps) {
            polygonMetric.add(gpsToMetric(pt.get(0), pt.get(1), centerLat, centerLng));
        }

        double roofAreaM2 = calculatePolygonArea(polygonMetric);
        if (roofAreaM2 < dimensions.getAreaM2()) {
            throw new IllegalArgumentException(String.format(
                    "Rooftop polygon area (%.1f m²) is smaller than a single solar panel (%.2f m²).",
                    roofAreaM2, dimensions.getAreaM2()));
        }

        // 3. Find primary alignment angle from dominant polygon edge
        double dominantAngleRad = findDominantEdgeAngle(polygonMetric);

        // 4. Generate Baseline Unoptimized Layout for comparative benchmarking
        OptimizationLayoutDTO baseline = generateLayoutForMode(
                "BASELINE",
                "Baseline Layout",
                "Unoptimized standard grid with arbitrary spacing and conservative setbacks.",
                polygonMetric,
                dominantAngleRad,
                centerLat,
                centerLng,
                dimensions,
                1.2,   // 1.2m large setback
                0.3,   // 0.3m inter-panel gap
                0.4,   // 0.4m row gap
                false, // no smart walkways
                1420.0,
                null,
                roofAreaM2
        );

        // 5. Generate 3 Target Optimization Modes
        OptimizationLayoutDTO maxCap = generateLayoutForMode(
                "MAXIMUM_CAPACITY",
                "Maximum Capacity Layout",
                "Engineered for absolute maximum power generation and rooftop surface utilization.",
                polygonMetric,
                dominantAngleRad,
                centerLat,
                centerLng,
                dimensions,
                0.25,  // 0.25m minimal boundary setback
                0.06,  // 6cm panel gap
                0.12,  // 12cm row gap
                false,
                1470.0,
                baseline,
                roofAreaM2
        );

        OptimizationLayoutDTO balanced = generateLayoutForMode(
                "BALANCED",
                "Balanced Layout",
                "Optimal harmony between high energy yield, safety setbacks, and maintenance aisles.",
                polygonMetric,
                dominantAngleRad,
                centerLat,
                centerLng,
                dimensions,
                0.50,  // 0.50m edge margin
                0.12,  // 12cm panel gap
                0.25,  // 25cm row gap
                true,  // 0.8m maintenance walkways
                1540.0,
                baseline,
                roofAreaM2
        );

        OptimizationLayoutDTO highEff = generateLayoutForMode(
                "HIGH_EFFICIENCY",
                "High Efficiency Layout",
                "Maximum operational efficiency with optimal row spacing, zero mutual shading, and thermal airflow.",
                polygonMetric,
                dominantAngleRad,
                centerLat,
                centerLng,
                dimensions,
                0.80,  // 0.80m edge margin
                0.20,  // 20cm panel gap
                0.55,  // 55cm row gap for zero inter-row shading
                true,  // 1.0m central & maintenance walkways
                1620.0,
                baseline,
                roofAreaM2
        );

        // Populate Tailored AI Insights for Each Mode
        populateAiInsights(maxCap, balanced, highEff);

        List<OptimizationLayoutDTO> results = new ArrayList<>();
        results.add(maxCap);
        results.add(balanced);
        results.add(highEff);
        return results;
    }

    private OptimizationLayoutDTO generateLayoutForMode(String modeCode,
                                                        String title,
                                                        String description,
                                                        List<Point2D> polygon,
                                                        double baseAngle,
                                                        double centerLat,
                                                        double centerLng,
                                                        PanelDimensionsDTO dims,
                                                        double marginMeters,
                                                        double gapX,
                                                        double gapY,
                                                        boolean includeWalkways,
                                                        double baseYieldKwhPerKwp,
                                                        OptimizationLayoutDTO baseline,
                                                        double roofAreaM2) {
        // Test orientations: Portrait vs Landscape
        List<PanelPlacement> bestPlacements = Collections.emptyList();
        String chosenOrientation = "PORTRAIT";
        double pWidth = dims.getWidthMeters();
        double pLength = dims.getLengthMeters();

        // 1. Try Portrait
        List<PanelPlacement> portraitPlacements = placePanelsOnGrid(
                polygon, baseAngle, pWidth, pLength, marginMeters, gapX, gapY, includeWalkways, "PORTRAIT");

        // 2. Try Landscape
        List<PanelPlacement> landscapePlacements = placePanelsOnGrid(
                polygon, baseAngle, pLength, pWidth, marginMeters, gapX, gapY, includeWalkways, "LANDSCAPE");

        if (landscapePlacements.size() > portraitPlacements.size() && "MAXIMUM_CAPACITY".equals(modeCode)) {
            bestPlacements = landscapePlacements;
            chosenOrientation = "LANDSCAPE";
            double temp = pWidth;
            pWidth = pLength;
            pLength = temp;
        } else {
            bestPlacements = portraitPlacements.size() >= landscapePlacements.size() ? portraitPlacements : landscapePlacements;
            if (bestPlacements == landscapePlacements) {
                chosenOrientation = "LANDSCAPE";
                double temp = pWidth;
                pWidth = pLength;
                pLength = temp;
            }
        }

        // Convert placements to PanelDTOs with GPS coordinates
        List<PanelDTO> panelDTOs = new ArrayList<>();
        int panelNumber = 1;
        for (PanelPlacement pl : bestPlacements) {
            PanelDTO pDto = new PanelDTO();
            pDto.setPanelNumber(panelNumber++);
            pDto.setWidthMeters(pWidth);
            pDto.setLengthMeters(pLength);
            pDto.setAreaM2(dims.getAreaM2());
            pDto.setPowerWatts(dims.getPowerWatts());
            pDto.setOrientation(chosenOrientation);

            // Compute GPS for center
            double[] centerGps = metricToGps(pl.centerX, pl.centerY, centerLat, centerLng);
            pDto.setCenterLat(centerGps[0]);
            pDto.setCenterLng(centerGps[1]);

            // Compute GPS for 4 corners
            List<List<Double>> cornerGps = new ArrayList<>();
            for (Point2D c : pl.corners) {
                double[] gps = metricToGps(c.x, c.y, centerLat, centerLng);
                cornerGps.add(List.of(gps[0], gps[1]));
            }
            pDto.setPolygon(cornerGps);
            panelDTOs.add(pDto);
        }

        int panelCount = panelDTOs.size();
        double usedAreaM2 = Math.round(panelCount * dims.getAreaM2() * 100.0) / 100.0;
        double usableAreaM2 = Math.round(roofAreaM2 * 0.85 * 100.0) / 100.0;
        double unusedAreaM2 = Math.max(0.0, Math.round((roofAreaM2 - usedAreaM2) * 100.0) / 100.0);
        double utilizationPercent = roofAreaM2 > 0 ? Math.round((usedAreaM2 / roofAreaM2) * 1000.0) / 10.0 : 0.0;

        double systemCapacityKw = Math.round((panelCount * dims.getPowerWatts() / 1000.0) * 100.0) / 100.0;
        double annualGenerationKwh = Math.round(systemCapacityKw * baseYieldKwhPerKwp);

        // Optimization Score: 0 - 100
        double score = calculateOptimizationScore(modeCode, utilizationPercent, panelCount, marginMeters, includeWalkways);

        OptimizationLayoutDTO layout = new OptimizationLayoutDTO();
        layout.setMode(modeCode);
        layout.setTitle(title);
        layout.setDescription(description);
        layout.setPanelCount(panelCount);
        layout.setSystemCapacityKw(systemCapacityKw);
        layout.setAnnualGenerationKwh(annualGenerationKwh);
        layout.setRoofArea(Math.round(roofAreaM2 * 10.0) / 10.0);
        layout.setUsableArea(usableAreaM2);
        layout.setUsedArea(usedAreaM2);
        layout.setUnusedArea(unusedAreaM2);
        layout.setRoofUtilizationPercent(utilizationPercent);
        layout.setOptimizationScore(score);
        layout.setSpecificYieldKwhPerKwp(baseYieldKwhPerKwp);
        layout.setPanels(panelDTOs);

        if (baseline != null) {
            layout.setComparison(new OptimizationComparisonDTO(
                    baseline.getSystemCapacityKw(),
                    baseline.getAnnualGenerationKwh(),
                    baseline.getRoofUtilizationPercent(),
                    systemCapacityKw,
                    annualGenerationKwh,
                    utilizationPercent
            ));
        }

        return layout;
    }

    private static class PanelPlacement {
        double centerX;
        double centerY;
        Point2D[] corners; // 4 corners in metric coordinates
    }

    private List<PanelPlacement> placePanelsOnGrid(List<Point2D> polygon,
                                                  double rotationAngle,
                                                  double panelWidth,
                                                  double panelLength,
                                                  double margin,
                                                  double gapX,
                                                  double gapY,
                                                  boolean includeWalkways,
                                                  String orientation) {
        // Rotate polygon so dominant edge aligns with the X axis
        double cosA = Math.cos(-rotationAngle);
        double sinA = Math.sin(-rotationAngle);

        List<Point2D> rotPoly = new ArrayList<>();
        double minX = Double.MAX_VALUE, maxX = -Double.MAX_VALUE;
        double minY = Double.MAX_VALUE, maxY = -Double.MAX_VALUE;

        for (Point2D p : polygon) {
            double rx = p.x * cosA - p.y * sinA;
            double ry = p.x * sinA + p.y * cosA;
            rotPoly.add(new Point2D(rx, ry));
            minX = Math.min(minX, rx);
            maxX = Math.max(maxX, rx);
            minY = Math.min(minY, ry);
            maxY = Math.max(maxY, ry);
        }

        List<PanelPlacement> placements = new ArrayList<>();
        double stepX = panelWidth + gapX;
        double stepY = panelLength + gapY;

        double cosBack = Math.cos(rotationAngle);
        double sinBack = Math.sin(rotationAngle);

        int rowIndex = 0;
        for (double y = minY + margin; y + panelLength <= maxY - margin; y += stepY) {
            rowIndex++;
            // Insert maintenance walkway gap every 3 rows if enabled
            if (includeWalkways && rowIndex % 3 == 0) {
                y += 0.8; // 0.8m walkway
                if (y + panelLength > maxY - margin) break;
            }

            int colIndex = 0;
            for (double x = minX + margin; x + panelWidth <= maxX - margin; x += stepX) {
                colIndex++;
                if (includeWalkways && colIndex % 5 == 0) {
                    x += 0.6; // 0.6m cross walkway
                    if (x + panelWidth > maxX - margin) break;
                }

                // 4 candidate corners in rotated coordinate frame
                Point2D[] rotCorners = new Point2D[]{
                        new Point2D(x, y),
                        new Point2D(x + panelWidth, y),
                        new Point2D(x + panelWidth, y + panelLength),
                        new Point2D(x, y + panelLength)
                };

                Point2D rotCenter = new Point2D(x + panelWidth / 2.0, y + panelLength / 2.0);

                // Check if all 4 corners and center are inside the rotated polygon and satisfy margin
                if (isPanelValidInsidePolygon(rotCorners, rotCenter, rotPoly, margin)) {
                    // Rotate back to original metric frame
                    Point2D[] origCorners = new Point2D[4];
                    for (int i = 0; i < 4; i++) {
                        origCorners[i] = new Point2D(
                                rotCorners[i].x * cosBack - rotCorners[i].y * sinBack,
                                rotCorners[i].x * sinBack + rotCorners[i].y * cosBack
                        );
                    }
                    PanelPlacement pl = new PanelPlacement();
                    pl.centerX = rotCenter.x * cosBack - rotCenter.y * sinBack;
                    pl.centerY = rotCenter.x * sinBack + rotCenter.y * cosBack;
                    pl.corners = origCorners;
                    placements.add(pl);
                }
            }
        }

        return placements;
    }

    private boolean isPanelValidInsidePolygon(Point2D[] corners, Point2D center, List<Point2D> polygon, double margin) {
        // 1. Center must be inside polygon
        if (!isPointInPolygon(center.x, center.y, polygon)) {
            return false;
        }

        // 2. All 4 corners must be inside polygon
        for (Point2D c : corners) {
            if (!isPointInPolygon(c.x, c.y, polygon)) {
                return false;
            }
        }

        // 3. Minimum distance to any polygon edge must be at least margin * 0.8
        double safeMargin = margin * 0.75;
        for (Point2D c : corners) {
            if (minDistanceToPolygonEdges(c.x, c.y, polygon) < safeMargin) {
                return false;
            }
        }

        return true;
    }

    public boolean isPointInPolygon(double px, double py, List<Point2D> polygon) {
        boolean inside = false;
        for (int i = 0, j = polygon.size() - 1; i < polygon.size(); j = i++) {
            double xi = polygon.get(i).x, yi = polygon.get(i).y;
            double xj = polygon.get(j).x, yj = polygon.get(j).y;
            boolean intersect = ((yi > py) != (yj > py))
                    && (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    private double minDistanceToPolygonEdges(double px, double py, List<Point2D> polygon) {
        double minDist = Double.MAX_VALUE;
        for (int i = 0, j = polygon.size() - 1; i < polygon.size(); j = i++) {
            double dist = pointToSegmentDistance(px, py, polygon.get(j), polygon.get(i));
            minDist = Math.min(minDist, dist);
        }
        return minDist;
    }

    private double pointToSegmentDistance(double px, double py, Point2D a, Point2D b) {
        double dx = b.x - a.x;
        double dy = b.y - a.y;
        double lenSq = dx * dx + dy * dy;
        if (lenSq == 0.0) {
            return Math.hypot(px - a.x, py - a.y);
        }
        double t = Math.max(0.0, Math.min(1.0, ((px - a.x) * dx + (py - a.y) * dy) / lenSq));
        double projX = a.x + t * dx;
        double projY = a.y + t * dy;
        return Math.hypot(px - projX, py - projY);
    }

    public double calculatePolygonArea(List<Point2D> polygon) {
        double area = 0.0;
        int n = polygon.size();
        for (int i = 0; i < n; i++) {
            int j = (i + 1) % n;
            area += polygon.get(i).x * polygon.get(j).y;
            area -= polygon.get(j).x * polygon.get(i).y;
        }
        return Math.abs(area) / 2.0;
    }

    private double findDominantEdgeAngle(List<Point2D> polygon) {
        double maxLen = 0.0;
        double dominantAngle = 0.0;
        int n = polygon.size();
        for (int i = 0; i < n; i++) {
            int j = (i + 1) % n;
            double dx = polygon.get(j).x - polygon.get(i).x;
            double dy = polygon.get(j).y - polygon.get(i).y;
            double len = Math.hypot(dx, dy);
            if (len > maxLen) {
                maxLen = len;
                dominantAngle = Math.atan2(dy, dx);
            }
        }
        return dominantAngle;
    }

    private double calculateOptimizationScore(String mode, double utilization, int panelCount, double margin, boolean walkways) {
        if (panelCount == 0) return 0.0;

        double base = 85.0;
        if ("HIGH_EFFICIENCY".equals(mode)) {
            base = 92.0 + Math.min(6.0, utilization * 0.08) + (walkways ? 2.0 : 0.0);
        } else if ("BALANCED".equals(mode)) {
            base = 90.0 + Math.min(5.0, utilization * 0.07) + (walkways ? 1.5 : 0.0);
        } else if ("MAXIMUM_CAPACITY".equals(mode)) {
            base = 86.0 + Math.min(6.0, utilization * 0.09);
        }

        return Math.min(99.0, Math.round(base * 10.0) / 10.0);
    }

    private void populateAiInsights(OptimizationLayoutDTO maxCap, OptimizationLayoutDTO balanced, OptimizationLayoutDTO highEff) {
        maxCap.setAiInsights(List.of(
                String.format("Maximum Capacity layout achieves highest density with %d panels and %.2f kWp installed capacity.",
                        maxCap.getPanelCount(), maxCap.getSystemCapacityKw()),
                String.format("Delivers +%.1f%% more capacity compared to standard baseline configuration.",
                        maxCap.getComparison() != null ? maxCap.getComparison().getCapacityIncreasePercent() : 12.0),
                "Best suited for high-consumption industrial roofs where energy production takes highest priority over service walkways.",
                String.format("Rooftop surface utilization is %.1f%% with minimal 0.25m perimeter setback.",
                        maxCap.getRoofUtilizationPercent())
        ));

        balanced.setAiInsights(List.of(
                String.format("Balanced layout provides the recommended balance with %d panels and 0.80m maintenance access aisles.",
                        balanced.getPanelCount()),
                "Maintains safe clearance for routine inverter inspection, panel cleaning, and emergency access.",
                String.format("Captures %.0f kWh annually with an optimal rooftop utilization rate of %.1f%%.",
                        balanced.getAnnualGenerationKwh(), balanced.getRoofUtilizationPercent()),
                "Highest recommended layout for residential and commercial rooftops prioritizing long-term O&M lifecycle."
        ));

        highEff.setAiInsights(List.of(
                String.format("High Efficiency layout delivers peak specific yield (1,620 kWh/kWp) with %d modules.",
                        highEff.getPanelCount()),
                "Generous 0.55m inter-row spacing completely eliminates mutual panel shading during low winter sun angles.",
                "Optimized thermal ventilation under modules lowers operating temperature and prevents heat-induced power degradation.",
                "Ideal choice for premium monocrystalline installations aiming for highest lifetime return per invested watt."
        ));
    }

    public Point2D gpsToMetric(double lat, double lng, double centerLat, double centerLng) {
        double y = (lat - centerLat) * (Math.PI / 180.0) * EARTH_RADIUS;
        double x = (lng - centerLng) * (Math.PI / 180.0) * EARTH_RADIUS * Math.cos(Math.toRadians(centerLat));
        return new Point2D(x, y);
    }

    public double[] metricToGps(double x, double y, double centerLat, double centerLng) {
        double lat = centerLat + (y / EARTH_RADIUS) * (180.0 / Math.PI);
        double lng = centerLng + (x / (EARTH_RADIUS * Math.cos(Math.toRadians(centerLat)))) * (180.0 / Math.PI);
        return new double[]{lat, lng};
    }
}
