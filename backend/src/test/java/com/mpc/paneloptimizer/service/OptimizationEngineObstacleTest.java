package com.mpc.paneloptimizer.service;

import com.mpc.paneloptimizer.service.OptimizationEngine.Point2D;
import com.mpc.paneloptimizer.web.dto.OptimizationLayoutDTO;
import com.mpc.paneloptimizer.web.dto.PanelDimensionsDTO;
import com.mpc.paneloptimizer.web.dto.PanelDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class OptimizationEngineObstacleTest {

    private OptimizationEngine engine;
    private PanelDimensionsDTO dimensions;

    // A ~30m x ~30m square rooftop in Bengaluru (~900 m2)
    // Centered around 12.9716, 77.5946
    // 0.0001 deg lat ~ 11.1 meters, 0.0001 deg lng ~ 10.8 meters
    private final List<List<Double>> roofGps = List.of(
            List.of(12.97140, 77.59440),
            List.of(12.97180, 77.59440),
            List.of(12.97180, 77.59480),
            List.of(12.97140, 77.59480)
    );

    @BeforeEach
    void setUp() {
        engine = new OptimizationEngine();
        dimensions = new PanelDimensionsDTO();
        dimensions.setWidthMeters(1.134);
        dimensions.setLengthMeters(2.278);
        dimensions.setPowerWatts(550.0);
    }

    @Test
    @DisplayName("Backward Compatibility: null or empty obstacles produce full layout")
    void testNoObstacles_ProducesFullLayout() {
        List<OptimizationLayoutDTO> withoutObstacles = engine.generateOptimizedLayouts(roofGps, dimensions, 1500.0);
        List<OptimizationLayoutDTO> withNullObstacles = engine.generateOptimizedLayouts(roofGps, dimensions, 1500.0, null, 0.5);
        List<OptimizationLayoutDTO> withEmptyObstacles = engine.generateOptimizedLayouts(roofGps, dimensions, 1500.0, List.of(), 0.5);

        assertThat(withoutObstacles).hasSize(3);
        assertThat(withNullObstacles).hasSize(3);
        assertThat(withEmptyObstacles).hasSize(3);

        // Maximum capacity mode count should be identical
        int countOrig = withoutObstacles.get(0).getPanelCount();
        int countNull = withNullObstacles.get(0).getPanelCount();
        int countEmpty = withEmptyObstacles.get(0).getPanelCount();

        assertThat(countOrig).isGreaterThan(50);
        assertThat(countNull).isEqualTo(countOrig);
        assertThat(countEmpty).isEqualTo(countOrig);
    }

    @Test
    @DisplayName("Obstacle in the middle: panels in center are rejected and none intersect obstacle")
    void testObstacleInTheMiddle_PanelsAvoidCenter() {
        List<OptimizationLayoutDTO> unconstrained = engine.generateOptimizedLayouts(roofGps, dimensions, 1500.0);
        int unconstrainedCount = unconstrained.get(0).getPanelCount();

        // Obstacle in the center: ~10m x ~10m stair room
        List<List<Double>> centerObstacle = List.of(
                List.of(12.97155, 77.59455),
                List.of(12.97165, 77.59455),
                List.of(12.97165, 77.59465),
                List.of(12.97155, 77.59465)
        );

        List<OptimizationLayoutDTO> constrained = engine.generateOptimizedLayouts(
                roofGps, dimensions, 1500.0, List.of(centerObstacle), 0.5);

        int constrainedCount = constrained.get(0).getPanelCount();
        assertThat(constrainedCount).isLessThan(unconstrainedCount);

        // Verify none of the placed panels collide with the center obstacle
        // Convert obstacle GPS to metric using same centroid
        double centerLat = (12.97140 + 12.97180) / 2.0;
        double centerLng = (77.59440 + 77.59480) / 2.0;

        List<Point2D> obsMetric = centerObstacle.stream()
                .map(pt -> engine.gpsToMetric(pt.get(0), pt.get(1), centerLat, centerLng))
                .toList();

        for (PanelDTO panel : constrained.get(0).getPanels()) {
            Point2D panelCenter = engine.gpsToMetric(panel.getCenterLat(), panel.getCenterLng(), centerLat, centerLng);
            Point2D[] panelCorners = panel.getPolygon().stream()
                    .map(pt -> engine.gpsToMetric(pt.get(0), pt.get(1), centerLat, centerLng))
                    .toArray(Point2D[]::new);

            boolean collides = engine.isPanelCollidingWithObstacles(panelCorners, panelCenter, List.of(obsMetric), 0.5);
            assertThat(collides).isFalse();
        }
    }

    @Test
    @DisplayName("Obstacle on an edge: panels near that edge are excluded")
    void testObstacleOnEdge_PanelsRejectedNearEdge() {
        List<OptimizationLayoutDTO> unconstrained = engine.generateOptimizedLayouts(roofGps, dimensions, 1500.0);
        int unconstrainedCount = unconstrained.get(0).getPanelCount();

        // Obstacle along the northern edge: AC / chiller line
        List<List<Double>> edgeObstacle = List.of(
                List.of(12.97170, 77.59445),
                List.of(12.97178, 77.59445),
                List.of(12.97178, 77.59475),
                List.of(12.97170, 77.59475)
        );

        List<OptimizationLayoutDTO> constrained = engine.generateOptimizedLayouts(
                roofGps, dimensions, 1500.0, List.of(edgeObstacle), 0.5);

        int constrainedCount = constrained.get(0).getPanelCount();
        assertThat(constrainedCount).isLessThan(unconstrainedCount);

        double centerLat = (12.97140 + 12.97180) / 2.0;
        double centerLng = (77.59440 + 77.59480) / 2.0;

        List<Point2D> obsMetric = edgeObstacle.stream()
                .map(pt -> engine.gpsToMetric(pt.get(0), pt.get(1), centerLat, centerLng))
                .toList();

        for (PanelDTO panel : constrained.get(0).getPanels()) {
            Point2D panelCenter = engine.gpsToMetric(panel.getCenterLat(), panel.getCenterLng(), centerLat, centerLng);
            Point2D[] panelCorners = panel.getPolygon().stream()
                    .map(pt -> engine.gpsToMetric(pt.get(0), pt.get(1), centerLat, centerLng))
                    .toArray(Point2D[]::new);

            boolean collides = engine.isPanelCollidingWithObstacles(panelCorners, panelCenter, List.of(obsMetric), 0.5);
            assertThat(collides).isFalse();
        }
    }

    @Test
    @DisplayName("Overlapping obstacles: handled cleanly without errors or panel collisions")
    void testOverlappingObstacles_HandlesCleanlyWithoutError() {
        // Obstacle 1: Water tanks
        List<List<Double>> obs1 = List.of(
                List.of(12.97150, 77.59450),
                List.of(12.97162, 77.59450),
                List.of(12.97162, 77.59462),
                List.of(12.97150, 77.59462)
        );

        // Obstacle 2: Elevator headroom partially overlapping with Obstacle 1
        List<List<Double>> obs2 = List.of(
                List.of(12.97158, 77.59458),
                List.of(12.97170, 77.59458),
                List.of(12.97170, 77.59470),
                List.of(12.97158, 77.59470)
        );

        List<OptimizationLayoutDTO> constrained = engine.generateOptimizedLayouts(
                roofGps, dimensions, 1500.0, List.of(obs1, obs2), 0.5);

        assertThat(constrained).hasSize(3);
        assertThat(constrained.get(0).getPanelCount()).isGreaterThan(0);

        double centerLat = (12.97140 + 12.97180) / 2.0;
        double centerLng = (77.59440 + 77.59480) / 2.0;

        List<Point2D> obs1Metric = obs1.stream()
                .map(pt -> engine.gpsToMetric(pt.get(0), pt.get(1), centerLat, centerLng))
                .toList();
        List<Point2D> obs2Metric = obs2.stream()
                .map(pt -> engine.gpsToMetric(pt.get(0), pt.get(1), centerLat, centerLng))
                .toList();

        for (PanelDTO panel : constrained.get(0).getPanels()) {
            Point2D panelCenter = engine.gpsToMetric(panel.getCenterLat(), panel.getCenterLng(), centerLat, centerLng);
            Point2D[] panelCorners = panel.getPolygon().stream()
                    .map(pt -> engine.gpsToMetric(pt.get(0), pt.get(1), centerLat, centerLng))
                    .toArray(Point2D[]::new);

            assertThat(engine.isPanelCollidingWithObstacles(panelCorners, panelCenter, List.of(obs1Metric, obs2Metric), 0.5))
                    .isFalse();
        }
    }

    @Test
    @DisplayName("Obstacle outside the roof: has zero impact on panel placement count")
    void testObstacleOutsideTheRoof_HasNoEffectOnPanels() {
        List<OptimizationLayoutDTO> unconstrained = engine.generateOptimizedLayouts(roofGps, dimensions, 1500.0);
        int unconstrainedCount = unconstrained.get(0).getPanelCount();

        // Obstacle situated 100 meters away outside the rooftop polygon
        List<List<Double>> outsideObstacle = List.of(
                List.of(12.97250, 77.59550),
                List.of(12.97260, 77.59550),
                List.of(12.97260, 77.59560),
                List.of(12.97250, 77.59560)
        );

        List<OptimizationLayoutDTO> constrained = engine.generateOptimizedLayouts(
                roofGps, dimensions, 1500.0, List.of(outsideObstacle), 0.5);

        int constrainedCount = constrained.get(0).getPanelCount();
        assertThat(constrainedCount).isEqualTo(unconstrainedCount);
    }

    @Test
    @DisplayName("Geometry: line segment intersection helper handles crossing, parallel, and touching cases")
    void testSegmentIntersection_HelperDirectTests() {
        // Crossing segments: (0,0)-(4,4) and (0,4)-(4,0)
        Point2D a1 = new Point2D(0, 0);
        Point2D a2 = new Point2D(4, 4);
        Point2D b1 = new Point2D(0, 4);
        Point2D b2 = new Point2D(4, 0);
        assertThat(OptimizationEngine.segmentsIntersect(a1, a2, b1, b2)).isTrue();

        // Parallel non-intersecting segments: (0,0)-(4,0) and (0,2)-(4,2)
        Point2D c1 = new Point2D(0, 0);
        Point2D c2 = new Point2D(4, 0);
        Point2D d1 = new Point2D(0, 2);
        Point2D d2 = new Point2D(4, 2);
        assertThat(OptimizationEngine.segmentsIntersect(c1, c2, d1, d2)).isFalse();

        // T-junction (endpoint touching): (0,0)-(4,0) and (2,0)-(2,3)
        Point2D e1 = new Point2D(0, 0);
        Point2D e2 = new Point2D(4, 0);
        Point2D f1 = new Point2D(2, 0);
        Point2D f2 = new Point2D(2, 3);
        assertThat(OptimizationEngine.segmentsIntersect(e1, e2, f1, f2)).isTrue();
    }
}
