import { apiUrl } from './apiConfig';

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
 * POST /api/scene3d/build
 * Converts a GPS polygon + optimized panel array into a fully localized Three.js-ready scene.
 * Falls back to client-side projection if the backend is unavailable.
 */
export const buildScene3D = async (payload) => {
  const token = getStoredAuth()?.token;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  try {
    const response = await fetch(apiUrl('/api/scene3d/build'), {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.buildingFootprint) return data;
    }
  } catch (err) {
    console.warn('[scene3DService] Backend unavailable, using client projection:', err);
  }

  // Client-side fallback: project GPS → local Three.js XZ plane
  return projectSceneLocally(payload);
};

const EARTH_R = 6371000.0;

const gpsToLocal = (lat, lng, originLat, originLng) => {
  const dLat = ((lat - originLat) * Math.PI) / 180;
  const dLng = ((lng - originLng) * Math.PI) / 180;
  const meanLat = ((lat + originLat) / 2) * (Math.PI / 180);
  const x = dLng * EARTH_R * Math.cos(meanLat);
  const y = dLat * EARTH_R;
  return { x, y };
};

export const projectSceneLocally = (request) => {
  const polyGps = request.polygonCoordinates || [];
  if (polyGps.length < 3) return null;

  const n = polyGps.length;
  let sumLat = 0, sumLng = 0;
  for (const pt of polyGps) {
    sumLat += pt[0]; sumLng += pt[1];
  }
  const originLat = sumLat / n;
  const originLng = sumLng / n;
  const height = request.buildingHeightMeters || 4.0;

  let maxR = 0;
  const footprint = [];
  const roofOutline = [];
  for (const pt of polyGps) {
    const { x, y } = gpsToLocal(pt[0], pt[1], originLat, originLng);
    footprint.push({ x, y: 0, z: y });
    roofOutline.push({ x, y: height, z: y });
    const r = Math.sqrt(x * x + y * y);
    if (r > maxR) maxR = r;
  }

  const panels = (request.panels || []).map((p, idx) => {
    const center = p.center
      ? (() => {
          const { x, y } = gpsToLocal(p.center.lat, p.center.lng, originLat, originLng);
          return { x, y: height + 0.05, z: y };
        })()
      : { x: 0, y: height + 0.05, z: 0 };

    const corners = (p.corners || []).map((c) => {
      const { x, y } = gpsToLocal(c[0], c[1], originLat, originLng);
      return { x, y: height + 0.05, z: y };
    });

    return {
      panelNumber: p.panelNumber || idx + 1,
      center,
      corners,
      widthMeters: p.widthMeters || 1.1,
      lengthMeters: p.lengthMeters || 2.1,
      powerWatts: p.powerWatts || 400,
      orientation: p.orientation || 'PORTRAIT',
      azimuthDegrees: p.azimuthDegrees || 180,
      tiltDegrees: p.tiltDegrees || 15,
    };
  });

  return {
    buildingFootprint: footprint,
    roofOutline,
    buildingHeightMeters: height,
    roofAreaM2: request.roofAreaM2 || 0,
    originLat,
    originLng,
    panels,
    panelCount: panels.length,
    layoutMode: request.layoutMode || 'BALANCED',
    address: request.address || 'Solar Installation Site',
    systemCapacityKw: request.systemCapacityKw || panels.length * 0.4,
    sceneBoundingRadiusMeters: Math.round(maxR * 1.5 * 10) / 10,
  };
};
