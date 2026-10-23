/**
 * Google Solar API Client Service
 * Interacts with Google Solar API via the Java backend proxy first,
 * with direct client-side fallback if the backend is unreachable.
 */

import { apiUrl } from './apiConfig';

const DIRECT_GOOGLE_SOLAR_URL = 'https://solar.googleapis.com/v1/buildingInsights:findClosest';

const normalizeInsights = (data, quality = 'HIGH') => ({
  source: 'GOOGLE_SOLAR_API',
  quality: data.imageryQuality || quality,
  buildingName: data.name,
  center: data.center,
  imageryDate: data.imageryDate,
  boundingBox: data.boundingBox,
  maxArrayPanelsCount: data.solarPotential?.maxArrayPanelsCount || 0,
  maxArrayAreaMeters2: data.solarPotential?.maxArrayAreaMeters2 || 0,
  maxSunshineHoursPerYear: data.solarPotential?.maxSunshineHoursPerYear || 0,
  carbonOffsetFactorKgPerMwh: data.solarPotential?.carbonOffsetFactorKgPerMwh || 0,
  panelCapacityWatts: data.solarPotential?.panelCapacityWatts || 400,
  panelHeightMeters: data.solarPotential?.panelHeightMeters || 1.88,
  panelWidthMeters: data.solarPotential?.panelWidthMeters || 1.05,
  panelLifetimeYears: data.solarPotential?.panelLifetimeYears || 20,
  wholeRoofStats: data.solarPotential?.wholeRoofStats || null,
  buildingStats: data.solarPotential?.buildingStats || null,
  roofSegmentStats: data.solarPotential?.roofSegmentStats || [],
  solarPanels: data.solarPotential?.solarPanels || [],
  solarPanelConfigs: data.solarPotential?.solarPanelConfigs || [],
  financialAnalyses: data.solarPotential?.financialAnalyses || [],
  raw: data,
});

export const googleSolarService = {
  /**
   * Fetches Building Insights for a given lat/lng.
   * 1. Attempts the secure Java backend proxy endpoint: /api/solar/building-insights
   * 2. Falls back to direct Google Solar API call if backend proxy is offline.
   *
   * @param {number} latitude
   * @param {number} longitude
   * @param {string} [apiKey]
   * @returns {Promise<Object|null>}
   */
  async getBuildingInsights(latitude, longitude, apiKey = null) {
    // 1. Try Java Backend Proxy Endpoint
    try {
      const backendUrl = apiUrl(`/api/solar/building-insights?latitude=${latitude}&longitude=${longitude}`);
      const proxyRes = await fetch(backendUrl, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      if (proxyRes.ok) {
        const data = await proxyRes.json();
        if (data && data.solarPotential) {
          return normalizeInsights(data);
        }
      }
    } catch {
      // Backend proxy unavailable; proceeding to direct client fallback
    }

    // 2. Direct Client-side Fallback
    const key = apiKey || import.meta.env.VITE_GOOGLE_SOLAR_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!key) {
      console.warn('[GoogleSolarService] No Solar API key configured.');
      return null;
    }

    const qualityTiers = ['HIGH', 'MEDIUM', 'BASE'];

    for (const quality of qualityTiers) {
      try {
        const url = new URL(DIRECT_GOOGLE_SOLAR_URL);
        url.searchParams.set('location.latitude', String(latitude));
        url.searchParams.set('location.longitude', String(longitude));
        url.searchParams.set('requiredQuality', quality);
        url.searchParams.set('key', key);

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: { Accept: 'application/json' },
        });

        if (response.ok) {
          const data = await response.json();
          return normalizeInsights(data, quality);
        }

        if (response.status === 404) {
          continue;
        }

        break;
      } catch (err) {
        console.error('[GoogleSolarService] Direct request failed:', err);
      }
    }

    return null;
  },
};

export default googleSolarService;
