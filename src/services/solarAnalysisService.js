import { area as turfArea, polygon as turfPolygon } from '@turf/turf';

const PANEL_AREA = 2.5;
const SUNLIGHT_FACTOR = 4.8;
const SYSTEM_EFFICIENCY = 0.18;
const PERFORMANCE_RATIO = 0.78;
const COST_PER_PANEL = 21500;
const ELECTRICITY_RATE = 8.5;
const CO2_FACTOR = 0.82;

export const calculateRooftopArea = (coordinates) => {
  if (!coordinates || coordinates.length < 3) return 0;

  const ring = coordinates.map(([lat, lng]) => [lng, lat]);
  const firstPoint = ring[0];
  const lastPoint = ring[ring.length - 1];
  const closedRing =
    firstPoint[0] === lastPoint[0] && firstPoint[1] === lastPoint[1] ? ring : [...ring, firstPoint];

  return Math.round(turfArea(turfPolygon([closedRing])));
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
