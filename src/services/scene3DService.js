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
 * Normalizes input panels into a safe array format.
 * Prevents non-iterable values (e.g. numbers, objects) from crashing .map().
 */
export const normalizePanelsList = (panels) => {
  if (!panels) return [];
  if (Array.isArray(panels)) return panels;
  if (typeof panels === 'object') {
    // If it's an object with panels or solarPanels array property
    if (Array.isArray(panels.panels)) return panels.panels;
    if (Array.isArray(panels.solarPanels)) return panels.solarPanels;
  }
  return [];
};

/**
 * POST /api/scene3d/build
 * Converts a GPS polygon + optimized panel array into a fully localized Three.js-ready scene.
 * Falls back to client-side projection if the backend is unavailable or offline.
 */
export const buildScene3D = async (payload) => {
  const token = getStoredAuth()?.token;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const safePayload = {
    ...payload,
    panels: normalizePanelsList(payload?.panels),
  };

  try {
    const response = await fetch(apiUrl('/api/scene3d/build'), {
      method: 'POST',
      headers,
      body: JSON.stringify(safePayload),
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.buildingFootprint && data.buildingFootprint.length >= 3) {
        return data;
      }
    }
  } catch (err) {
    console.warn('[scene3DService] Backend unavailable, using client projection:', err);
  }

  // Client-side fallback: project GPS → local Three.js XZ plane
  return projectSceneLocally(safePayload);
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
  if (!request) return null;
  const polyGps = request.polygonCoordinates || [];
  if (!Array.isArray(polyGps) || polyGps.length < 3) return null;

  const n = polyGps.length;
  let sumLat = 0, sumLng = 0;
  for (const pt of polyGps) {
    sumLat += Number(pt[0]);
    sumLng += Number(pt[1]);
  }
  const originLat = sumLat / n;
  const originLng = sumLng / n;
  const height = request.buildingHeightMeters || 4.5;

  let maxR = 0;
  const footprint = [];
  const roofOutline = [];
  for (const pt of polyGps) {
    const { x, y } = gpsToLocal(Number(pt[0]), Number(pt[1]), originLat, originLng);
    footprint.push({ x, y: 0, z: y });
    roofOutline.push({ x, y: height, z: y });
    const r = Math.sqrt(x * x + y * y);
    if (r > maxR) maxR = r;
  }

  const rawPanels = normalizePanelsList(request.panels);
  const panels = rawPanels.map((p, idx) => {
    let pCenter = null;
    if (p.center) {
      const lat = p.center.latitude ?? p.center.lat;
      const lng = p.center.longitude ?? p.center.lng;
      if (lat != null && lng != null) {
        const { x, y } = gpsToLocal(lat, lng, originLat, originLng);
        pCenter = { x, y: height + 0.05, z: y };
      }
    } else if (p.centerLat != null && p.centerLng != null) {
      const { x, y } = gpsToLocal(p.centerLat, p.centerLng, originLat, originLng);
      pCenter = { x, y: height + 0.05, z: y };
    }

    const cornersList = Array.isArray(p.polygon) ? p.polygon : (Array.isArray(p.corners) ? p.corners : []);
    const corners = cornersList.map((c) => {
      const lat = Array.isArray(c) ? c[0] : (c.lat ?? c.latitude);
      const lng = Array.isArray(c) ? c[1] : (c.lng ?? c.longitude);
      const { x, y } = gpsToLocal(Number(lat), Number(lng), originLat, originLng);
      return { x, y: height + 0.05, z: y };
    });

    return {
      panelNumber: p.panelNumber || idx + 1,
      center: pCenter || { x: 0, y: height + 0.05, z: 0 },
      corners,
      widthMeters: p.widthMeters || 1.1,
      lengthMeters: p.lengthMeters || 2.1,
      powerWatts: p.powerWatts || 400,
      orientation: p.orientation || 'PORTRAIT',
      azimuthDegrees: p.azimuthDegrees || 180,
      tiltDegrees: p.tiltDegrees || 14,
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
    systemCapacityKw: request.systemCapacityKw || Math.round(panels.length * 0.4 * 10) / 10,
    sceneBoundingRadiusMeters: Math.round(maxR * 1.5 * 10) / 10,
  };
};
