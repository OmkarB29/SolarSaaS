import { isPointInPolygon } from './geoUtils';

const EARTH_RADIUS = 6371000.0;

const gpsToMetric = (lat, lng, centerLat, centerLng) => {
  const dLat = ((lat - centerLat) * Math.PI) / 180.0;
  const dLng = ((lng - centerLng) * Math.PI) / 180.0;
  const meanLat = ((lat + centerLat) / 2.0) * (Math.PI / 180.0);
  const x = dLng * EARTH_RADIUS * Math.cos(meanLat);
  const y = dLat * EARTH_RADIUS;
  return { x, y };
};

const metricToGps = (x, y, centerLat, centerLng) => {
  const dLat = (y / EARTH_RADIUS) * (180.0 / Math.PI);
  const lat = centerLat + dLat;
  const meanLat = ((lat + centerLat) / 2.0) * (Math.PI / 180.0);
  const dLng = (x / (EARTH_RADIUS * Math.cos(meanLat))) * (180.0 / Math.PI);
  const lng = centerLng + dLng;
  return [lat, lng];
};

const calculatePolygonArea = (poly) => {
  let area = 0.0;
  const n = poly.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += poly[i].x * poly[j].y;
    area -= poly[j].x * poly[i].y;
  }
  return Math.abs(area) / 2.0;
};

const findDominantEdgeAngle = (poly) => {
  let maxLenSq = 0.0;
  let dominantAngle = 0.0;
  const n = poly.length;
  for (let i = 0; i < n; i++) {
    const p1 = poly[i];
    const p2 = poly[(i + 1) % n];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq > maxLenSq) {
      maxLenSq = lenSq;
      dominantAngle = Math.atan2(dy, dx);
    }
  }
  return dominantAngle;
};

export const generateLocalOptimizedLayouts = (polygonGps, dimensions = {}, annualIrradiance = 1500) => {
  if (!polygonGps || polygonGps.length < 3) {
    return [];
  }

  const pWidth = dimensions.widthMeters || 1.1;
  const pLength = dimensions.lengthMeters || 2.1;
  const pWatts = dimensions.powerWatts || 550;
  const pArea = pWidth * pLength;

  let sumLat = 0;
  let sumLng = 0;
  for (const pt of polygonGps) {
    sumLat += pt[0];
    sumLng += pt[1];
  }
  const centerLat = sumLat / polygonGps.length;
  const centerLng = sumLng / polygonGps.length;

  const polygonMetric = polygonGps.map((pt) => gpsToMetric(pt[0], pt[1], centerLat, centerLng));
  const roofAreaM2 = calculatePolygonArea(polygonMetric);
  const dominantAngle = findDominantEdgeAngle(polygonMetric);

  const placePanels = (w, l, margin, gapX, gapY, walkways) => {
    const cosA = Math.cos(-dominantAngle);
    const sinA = Math.sin(-dominantAngle);

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    polygonMetric.forEach((p) => {
      const rx = p.x * cosA - p.y * sinA;
      const ry = p.x * sinA + p.y * cosA;
      minX = Math.min(minX, rx);
      maxX = Math.max(maxX, rx);
      minY = Math.min(minY, ry);
      maxY = Math.max(maxY, ry);
    });

    const placements = [];
    const stepX = w + gapX;
    const stepY = l + gapY;
    const cosBack = Math.cos(dominantAngle);
    const sinBack = Math.sin(dominantAngle);

    let rowIndex = 0;
    for (let y = minY + margin; y + l <= maxY - margin; y += stepY) {
      rowIndex++;
      if (walkways && rowIndex % 3 === 0) {
        y += 0.8;
        if (y + l > maxY - margin) break;
      }
      let colIndex = 0;
      for (let x = minX + margin; x + w <= maxX - margin; x += stepX) {
        colIndex++;
        if (walkways && colIndex % 5 === 0) {
          x += 0.6;
          if (x + w > maxX - margin) break;
        }

        const rotCorners = [
          { x, y },
          { x: x + w, y },
          { x: x + w, y: y + l },
          { x, y: y + l },
        ];
        const rotCenter = { x: x + w / 2, y: y + l / 2 };

        const unrot = (pt) => ({
          x: pt.x * cosBack - pt.y * sinBack,
          y: pt.x * sinBack + pt.y * cosBack,
        });

        const worldCorners = rotCorners.map(unrot);
        const worldCenter = unrot(rotCenter);

        const gpsCorners = worldCorners.map((c) => metricToGps(c.x, c.y, centerLat, centerLng));
        const gpsCenter = metricToGps(worldCenter.x, worldCenter.y, centerLat, centerLng);

        const allInside =
          isPointInPolygon(gpsCenter, polygonGps) &&
          gpsCorners.every((c) => isPointInPolygon(c, polygonGps));

        if (allInside) {
          placements.push({
            centerGps: gpsCenter,
            polygon: gpsCorners,
          });
        }
      }
    }
    return placements;
  };

  const createMode = (modeCode, title, description, margin, gapX, gapY, walkways, baseYield, baseline) => {
    // Try portrait vs landscape
    const portrait = placePanels(pWidth, pLength, margin, gapX, gapY, walkways);
    const landscape = placePanels(pLength, pWidth, margin, gapX, gapY, walkways);
    const useLandscape = landscape.length > portrait.length;
    const bestPlacements = useLandscape ? landscape : portrait;
    const orientation = useLandscape ? 'LANDSCAPE' : 'PORTRAIT';
    const finalW = useLandscape ? pLength : pWidth;
    const finalL = useLandscape ? pWidth : pLength;

    const panels = bestPlacements.map((pl, idx) => ({
      panelNumber: idx + 1,
      widthMeters: finalW,
      lengthMeters: finalL,
      areaM2: pArea,
      powerWatts: pWatts,
      orientation,
      centerLat: pl.centerGps[0],
      centerLng: pl.centerGps[1],
      polygon: pl.polygon,
    }));

    const panelCount = panels.length;
    const usedAreaM2 = Math.round(panelCount * pArea * 100) / 100;
    const usableAreaM2 = Math.round(roofAreaM2 * 0.85 * 100) / 100;
    const unusedAreaM2 = Math.max(0, Math.round((roofAreaM2 - usedAreaM2) * 100) / 100);
    const utilizationPercent = roofAreaM2 > 0 ? Math.round((usedAreaM2 / roofAreaM2) * 1000) / 10 : 0;
    const systemCapacityKw = Math.round(((panelCount * pWatts) / 1000) * 100) / 100;
    const annualGenerationKwh = Math.round(systemCapacityKw * baseYield);

    let score = Math.min(99, Math.max(60, Math.round(utilizationPercent * 0.7 + (walkways ? 25 : 15))));

    const layout = {
      mode: modeCode,
      title,
      description,
      panelCount,
      systemCapacityKw,
      annualGenerationKwh,
      roofArea: Math.round(roofAreaM2 * 10) / 10,
      usableArea: usableAreaM2,
      usedArea: usedAreaM2,
      unusedArea: unusedAreaM2,
      roofUtilizationPercent: utilizationPercent,
      optimizationScore: score,
      specificYieldKwhPerKwp: baseYield,
      panels,
      aiInsights: [
        {
          id: '1',
          type: 'OPTIMIZATION',
          title: `${title} Configured`,
          message: `Generated ${panelCount} modules (${systemCapacityKw} kWp) aligned with the dominant rooftop angle.`,
          impact: `+${Math.round(annualGenerationKwh).toLocaleString('en-IN')} kWh/yr`,
        },
      ],
    };

    if (baseline) {
      layout.comparison = {
        baselineCapacityKw: baseline.systemCapacityKw,
        baselineAnnualKwh: baseline.annualGenerationKwh,
        baselineUtilizationPercent: baseline.roofUtilizationPercent,
        optimizedCapacityKw: systemCapacityKw,
        optimizedAnnualKwh: annualGenerationKwh,
        optimizedUtilizationPercent: utilizationPercent,
      };
    }

    return layout;
  };

  const baseline = createMode('BASELINE', 'Baseline', '', 1.2, 0.3, 0.4, false, 1420, null);
  const maxCap = createMode('MAXIMUM_CAPACITY', 'Maximum Capacity Layout', 'Engineered for absolute maximum power generation and rooftop surface utilization.', 0.25, 0.06, 0.12, false, 1470, baseline);
  const balanced = createMode('BALANCED', 'Balanced Layout', 'Optimal harmony between high energy yield, safety setbacks, and maintenance aisles.', 0.50, 0.12, 0.25, true, 1540, baseline);
  const highEff = createMode('HIGH_EFFICIENCY', 'High Efficiency Layout', 'Maximum operational efficiency with optimal row spacing and zero mutual shading.', 0.80, 0.20, 0.55, true, 1620, baseline);

  return [maxCap, balanced, highEff];
};
