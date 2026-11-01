import { fromArrayBuffer } from 'geotiff';
import { apiUrl } from '../services/apiConfig';

const EARTH_RADIUS = 6371000.0;

const getStoredAuth = () => {
  try {
    return (
      JSON.parse(localStorage.getItem('solarscope.auth')) ||
      JSON.parse(sessionStorage.getItem('solarscope.session'))
    );
  } catch {
    return null;
  }
};

/**
 * Fetch Google Solar API Data Layers via backend secured proxy
 */
export async function fetchSolarDataLayers(lat, lng, radiusMeters = 50.0) {
  try {
    const token = getStoredAuth()?.token;
    const url = apiUrl(
      `/api/solar/data-layers?latitude=${lat}&longitude=${lng}&radiusMeters=${Math.max(10, Math.min(100, radiusMeters))}`
    );
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (res.status === 404) {
      return {
        isCovered: false,
        reason: 'Google Solar DSM not covered in this geographic region.',
      };
    }

    if (!res.ok) {
      const msg = await res.text().catch(() => '');
      return {
        isCovered: false,
        reason: `Solar API unavailable (HTTP ${res.status}): ${msg}`,
      };
    }

    const data = await res.json();
    return {
      isCovered: true,
      data,
    };
  } catch (err) {
    return {
      isCovered: false,
      reason: err.message || 'Network error querying Solar data layers.',
    };
  }
}

/**
 * Download raw GeoTIFF bytes via backend authenticated proxy
 */
export async function fetchGeoTiffArrayBuffer(googleUrl) {
  const token = getStoredAuth()?.token;
  const proxyUrl = apiUrl(`/api/solar/geotiff?url=${encodeURIComponent(googleUrl)}`);
  const res = await fetch(proxyUrl, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    throw new Error(`Failed to download GeoTIFF raster: HTTP ${res.status}`);
  }

  return res.arrayBuffer();
}

/**
 * Parses Google Solar DSM GeoTIFF and builds a local metric height grid
 */
export async function parseSolarDsm({
  dsmBuffer,
  maskBuffer = null,
  centerLat,
  centerLng,
  imageryQuality = 'HIGH',
  imageryDate = null,
}) {
  const tiff = await fromArrayBuffer(dsmBuffer);
  const image = await tiff.getImage(0);

  const width = image.getWidth();
  const height = image.getHeight();
  const bbox = image.getBoundingBox(); // [minX, minY, maxX, maxY]
  const rasters = await image.readRasters();
  const dsmData = rasters[0]; // Float32Array elevations

  let maskData = null;
  if (maskBuffer) {
    try {
      const maskTiff = await fromArrayBuffer(maskBuffer);
      const maskImage = await maskTiff.getImage(0);
      const maskRasters = await maskImage.readRasters();
      maskData = maskRasters[0];
    } catch (e) {
      console.warn('[SolarDSM] Mask GeoTIFF could not be decoded, proceeding with pure DSM:', e);
    }
  }

  // Calculate statistics & Ground Elevation reference
  const validElevations = [];
  const groundElevations = [];
  let validCount = 0;

  for (let i = 0; i < dsmData.length; i++) {
    const val = dsmData[i];
    // Filter NoData values (commonly -9999 or out of realistic range)
    if (val > -100 && val < 9000 && !isNaN(val)) {
      validCount++;
      validElevations.push(val);
      if (maskData) {
        if (maskData[i] === 0) {
          groundElevations.push(val);
        }
      } else {
        groundElevations.push(val);
      }
    }
  }

  validElevations.sort((a, b) => a - b);
  groundElevations.sort((a, b) => a - b);

  // Ground reference: 5th percentile of ground/surrounding pixels
  const groundIndex = Math.floor(groundElevations.length * 0.05);
  const groundElevation = groundElevations.length > 0 ? groundElevations[groundIndex] : 0.0;
  const maxElev = validElevations.length > 0 ? validElevations[validElevations.length - 1] : 0.0;
  const buildingHeightEst = Math.max(2.5, maxElev - groundElevation);
  const validPercent = ((validCount / (width * height)) * 100).toFixed(1);

  const resX = (bbox[2] - bbox[0]) / width;
  const resY = (bbox[3] - bbox[1]) / height;

  /**
   * Sample DSM height at local meters (x east, z south) from centroid
   */
  const sampleHeight = (localX, localZ) => {
    // Convert local metric coordinates back to GPS
    // localZ is south (+z) / north (-z)
    const lat = centerLat - (localZ / EARTH_RADIUS) * (180.0 / Math.PI);
    const meanLatRad = (centerLat * Math.PI) / 180.0;
    const lng = centerLng + (localX / (EARTH_RADIUS * Math.cos(meanLatRad))) * (180.0 / Math.PI);

    // If bbox is in geographic degrees (WGS84)
    let px = Math.floor((lng - bbox[0]) / resX);
    let py = Math.floor((bbox[3] - lat) / resY);

    if (px < 0 || px >= width || py < 0 || py >= height) {
      return buildingHeightEst;
    }

    const idx = py * width + px;
    const rawVal = dsmData[idx];
    if (rawVal < -100 || isNaN(rawVal)) {
      return buildingHeightEst;
    }

    const h = rawVal - groundElevation;
    return Math.max(1.0, Math.min(60.0, h));
  };

  return {
    hasCoverage: true,
    metadata: {
      imageryQuality,
      pixelSizeMeters: Math.round(resX * 111320 * 100) / 100 || 0.1,
      imageryDate: imageryDate || 'Available',
      validPixelPercent: validPercent,
      groundElevation: groundElevation.toFixed(1),
      buildingHeightEst: buildingHeightEst.toFixed(1),
    },
    sampleHeight,
  };
}
