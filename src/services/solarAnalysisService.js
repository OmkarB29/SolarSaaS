import { area as turfArea, polygon as turfPolygon } from '@turf/turf';

const PANEL_AREA = 2.5;
const SUNLIGHT_FACTOR = 4.8;
const SYSTEM_EFFICIENCY = 0.18;
const PERFORMANCE_RATIO = 0.78;
const COST_PER_PANEL = 21500;
const ELECTRICITY_RATE = 8.5;
const CO2_FACTOR = 0.82;

/**
 * Calculates high-precision geodesic metrics for a rooftop polygon:
 * - Area in square meters (m²) and square feet (sq ft)
 * - Exact side lengths for each edge (meters)
 * - Total perimeter (meters)
 * - Estimated physical length × width dimensions
 */
export const calculatePolygonMetrics = (coordinates) => {
  if (!coordinates || coordinates.length < 3) {
    return {
      areaM2: 0,
      areaSqFt: 0,
      perimeterMeters: 0,
      sideLengths: [],
      dimensionsSummary: '-',
    };
  }

  // 1. Calculate Geodesic Area (Google Maps spherical if ready, or Turf WGS84)
  let areaM2 = 0;
  if (typeof window !== 'undefined' && window.google?.maps?.geometry?.spherical?.computeArea) {
    try {
      const path = coordinates.map((pt) =>
        Array.isArray(pt) ? new window.google.maps.LatLng(pt[0], pt[1]) : new window.google.maps.LatLng(pt.lat, pt.lng)
      );
      areaM2 = Math.round(window.google.maps.geometry.spherical.computeArea(path));
    } catch {}
  }

  if (!areaM2) {
    const ring = coordinates.map((pt) => (Array.isArray(pt) ? [pt[1], pt[0]] : [pt.lng, pt.lat]));
    const firstPoint = ring[0];
    const lastPoint = ring[ring.length - 1];
    const closedRing =
      firstPoint[0] === lastPoint[0] && firstPoint[1] === lastPoint[1] ? ring : [...ring, firstPoint];
    areaM2 = Math.round(turfArea(turfPolygon([closedRing])));
  }

  // 2. Calculate physical length of each drawn edge in meters
  const sideLengths = [];
  let perimeterMeters = 0;
  const n = coordinates.length;
  for (let i = 0; i < n; i++) {
    const p1 = coordinates[i];
    const p2 = coordinates[(i + 1) % n];
    const lat1 = Array.isArray(p1) ? p1[0] : p1.lat;
    const lng1 = Array.isArray(p1) ? p1[1] : p1.lng;
    const lat2 = Array.isArray(p2) ? p2[0] : p2.lat;
    const lng2 = Array.isArray(p2) ? p2[1] : p2.lng;

    let len = 0;
    if (typeof window !== 'undefined' && window.google?.maps?.geometry?.spherical?.computeDistanceBetween) {
      try {
        len = window.google.maps.geometry.spherical.computeDistanceBetween(
          new window.google.maps.LatLng(lat1, lng1),
          new window.google.maps.LatLng(lat2, lng2)
        );
      } catch {}
    }
    if (!len) {
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLng = ((lng2 - lng1) * Math.PI) / 180;
      const meanLat = ((lat1 + lat2) / 2) * (Math.PI / 180);
      const dy = dLat * 6371000;
      const dx = dLng * 6371000 * Math.cos(meanLat);
      len = Math.sqrt(dx * dx + dy * dy);
    }
    const roundedLen = Math.round(len * 10) / 10;
    sideLengths.push(roundedLen);
    perimeterMeters += roundedLen;
  }

  perimeterMeters = Math.round(perimeterMeters * 10) / 10;
  const areaSqFt = Math.round(areaM2 * 10.7639);

  // 3. Extract bounding dimensions (~Length × ~Width)
  const sortedSides = [...sideLengths].sort((a, b) => b - a);
  const approxLength = sortedSides[0] || 0;
  const approxWidth = sortedSides[Math.floor(sortedSides.length / 2)] || 0;
  const dimensionsSummary = `~${approxLength}m × ~${approxWidth}m`;

  return {
    areaM2,
    areaSqFt,
    perimeterMeters,
    sideLengths,
    dimensionsSummary,
  };
};

export const calculateRooftopArea = (coordinates) => {
  return calculatePolygonMetrics(coordinates).areaM2;
};

export const estimateSolarAnalysis = (areaSqm) => {
  const panels = Math.max(0, Math.floor(areaSqm / PANEL_AREA));
  const usableArea = panels * PANEL_AREA;
  const monthlyGeneration = Math.round(usableArea * SUNLIGHT_FACTOR * SYSTEM_EFFICIENCY * PERFORMANCE_RATIO * 30);
  const yearlyGeneration = monthlyGeneration * 12;
  const installationCost = Math.round(panels * COST_PER_PANEL);
  const yearlySavings = Math.round(yearlyGeneration * ELECTRICITY_RATE);
  const paybackPeriod = yearlySavings > 0 ? Number((installationCost / yearlySavings).toFixed(1)) : 0;
  const roi = installationCost > 0 ? Number(((yearlySavings / installationCost) * 100).toFixed(1)) : 0;
  const co2Reduction = Math.round(yearlyGeneration * CO2_FACTOR);

  return {
    panels,
    monthlyGeneration,
    yearlyGeneration,
    installationCost,
    yearlySavings,
    roi,
    paybackPeriod,
    co2Reduction,
    monthlySeries: [
      { month: 'Jan', generation: Math.round(monthlyGeneration * 0.78), savings: Math.round(yearlySavings / 12 * 0.78) },
      { month: 'Feb', generation: Math.round(monthlyGeneration * 0.86), savings: Math.round(yearlySavings / 12 * 0.86) },
      { month: 'Mar', generation: Math.round(monthlyGeneration * 1.02), savings: Math.round(yearlySavings / 12 * 1.02) },
      { month: 'Apr', generation: Math.round(monthlyGeneration * 1.1), savings: Math.round(yearlySavings / 12 * 1.1) },
      { month: 'May', generation: Math.round(monthlyGeneration * 1.15), savings: Math.round(yearlySavings / 12 * 1.15) },
      { month: 'Jun', generation: Math.round(monthlyGeneration * 1.08), savings: Math.round(yearlySavings / 12 * 1.08) },
    ],
  };
};

export const applyWeatherAdjustment = (analysis, weather) => {
  const adjustmentFactor = weather?.weatherAdjustmentFactor ?? 1;
  const weatherAdjustedMonthlyGeneration = Math.round(analysis.monthlyGeneration * adjustmentFactor);
  const weatherAdjustedYearlyGeneration = weatherAdjustedMonthlyGeneration * 12;
  const weatherAdjustmentPercent = Math.round((adjustmentFactor - 1) * 100);

  return {
    ...analysis,
    weather,
    weatherAdjustedMonthlyGeneration,
    weatherAdjustedYearlyGeneration,
    weatherAdjustmentPercent,
  };
};
