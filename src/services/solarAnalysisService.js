import { area as turfArea, polygon as turfPolygon } from '@turf/turf';

const PANEL_AREA = 2.5; // Average space footprint per 400W module (including maintenance gaps)
const PANEL_WATTAGE_KW = 0.40; // 400W standard commercial tier-1 module
const SUNLIGHT_FACTOR = 4.8;
const SYSTEM_EFFICIENCY = 0.18;
const PERFORMANCE_RATIO = 0.78;
const ELECTRICITY_RATE = 8.5; // Indian commercial/institutional grid tariff (₹/kWh)
const CO2_FACTOR = 0.82; // CEA India grid emission factor (kg CO2 / kWh)

/**
 * Real-world Indian Solar EPC Benchmark Pricing (Turnkey: Modules + Inverters + MMS + BOS + Installation)
 * Reflects MNRE benchmarks and Indian commercial rooftop economies of scale:
 * - Micro / Residential (≤ 3 kW): ~₹52,000 / kW
 * - Small Residential (3 - 10 kW): ~₹46,000 - ₹52,000 / kW
 * - Small Commercial (10 - 50 kW): ~₹38,000 - ₹46,000 / kW
 * - Medium Commercial (50 - 100 kW): ~₹32,000 - ₹38,000 / kW
 * - Large C&I / Institutional (100 - 250 kW): ~₹28,000 - ₹32,000 / kW (e.g., 175.2 kW is ~₹30,000/kW)
 * - Industrial / Campus Scale (> 250 kW): ~₹26,000 - ₹28,000 / kW
 */
export const getCostPerKw = (capacityKw) => {
  if (capacityKw <= 0) return 52000;
  if (capacityKw <= 3) return 52000;
  if (capacityKw <= 10) return Math.round(52000 - ((capacityKw - 3) / 7) * 6000);
  if (capacityKw <= 50) return Math.round(46000 - ((capacityKw - 10) / 40) * 8000);
  if (capacityKw <= 100) return Math.round(38000 - ((capacityKw - 50) / 50) * 6000);
  if (capacityKw <= 250) return Math.round(32000 - ((capacityKw - 100) / 150) * 4000);
  return 27500;
};

export const getPricingTierName = (capacityKw) => {
  if (capacityKw <= 10) return 'Residential Scale';
  if (capacityKw <= 50) return 'Small Commercial';
  if (capacityKw <= 100) return 'Medium Commercial';
  if (capacityKw <= 250) return 'C&I Institutional';
  return 'Industrial / Campus';
};

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
  const capacityKw = Number((panels * PANEL_WATTAGE_KW).toFixed(1));
  const costPerKw = getCostPerKw(capacityKw);
  const pricingTier = getPricingTierName(capacityKw);

  // Economies of scale: total turnkey capital expenditure
  const installationCost = Math.round(capacityKw * costPerKw);
  const costPerPanel = panels > 0 ? Math.round(installationCost / panels) : 0;

  const monthlyGeneration = Math.round(usableArea * SUNLIGHT_FACTOR * SYSTEM_EFFICIENCY * PERFORMANCE_RATIO * 30);
  const yearlyGeneration = monthlyGeneration * 12;
  const yearlySavings = Math.round(yearlyGeneration * ELECTRICITY_RATE);
  const paybackPeriod = yearlySavings > 0 ? Number((installationCost / yearlySavings).toFixed(1)) : 0;
  const roi = installationCost > 0 ? Number(((yearlySavings / installationCost) * 100).toFixed(1)) : 0;
  const co2Reduction = Math.round(yearlyGeneration * CO2_FACTOR);

  return {
    panels,
    capacityKw,
    costPerKw,
    costPerPanel,
    pricingTier,
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

  const yearlySavings = Math.round(weatherAdjustedYearlyGeneration * ELECTRICITY_RATE);
  const paybackPeriod = yearlySavings > 0 ? Number((analysis.installationCost / yearlySavings).toFixed(1)) : 0;
  const roi = analysis.installationCost > 0 ? Number(((yearlySavings / analysis.installationCost) * 100).toFixed(1)) : 0;
  const co2Reduction = Math.round(weatherAdjustedYearlyGeneration * CO2_FACTOR);

  return {
    ...analysis,
    weather,
    monthlyGeneration: weatherAdjustedMonthlyGeneration,
    yearlyGeneration: weatherAdjustedYearlyGeneration,
    yearlySavings,
    paybackPeriod,
    roi,
    co2Reduction,
    weatherAdjustedMonthlyGeneration,
    weatherAdjustedYearlyGeneration,
    weatherAdjustmentPercent,
  };
};
