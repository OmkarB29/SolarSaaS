import React, { useEffect, useRef, useState, useCallback } from 'react';
import { loadGoogleMapsSdk, resetGoogleMapsLoader } from '../../services/googleMapsLoader';
import { useSolarFluxOverlay } from './useSolarFluxOverlay';
import LeafletSatelliteFallback from './LeafletSatelliteFallback';
import { Layers, Eye, EyeOff, RotateCcw, AlertTriangle, X, HelpCircle, CheckCircle2, Check, Undo2 } from 'lucide-react';

const DEFAULT_CENTER = { lat: 12.9716, lng: 77.5946 }; // Bengaluru Default

// Fast Ray-casting point-in-polygon algorithm to clip panels strictly to rooftop perimeter
const isPointInPolygon = (pt, vs) => {
  if (!vs || vs.length < 3) return true;
  const x = pt[0];
  const y = pt[1];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0];
    const yi = vs[i][1];
    const xj = vs[j][0];
    const yj = vs[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

export const GoogleSolarMap = ({
  apiKey,
  mapId = 'SOLAR_MAP_CANVAS',
  center = DEFAULT_CENTER,
  zoom = 19,
  bounds = null,
  markerPosition = null,
  markerLabel = 'Selected Rooftop Site',
  polygonCoordinates = [],
  onPolygonChange,
  onMapClick,
  onBoundsChange,
  isDrawingEnabled = false,
  onCancelDrawing,
  solarPanels = [],
  roofSegmentStats = [],
  panelHeightMeters = 1.879,
  panelWidthMeters = 1.045,
  showSolarPanels = true,
  panelLimit = 100,
  showFluxOverlay: initialFlux = false,
  fluxBounds = null,
  className = 'h-full w-full',
}) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const polygonRef = useRef(null);
  const drawingPolylineRef = useRef(null);
  const drawingMarkersRef = useRef([]);
  const solarPanelPolygonsRef = useRef([]);

  const [isSdkReady, setIsSdkReady] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [authBlockedError, setAuthBlockedError] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [mapType, setMapType] = useState('hybrid');
  const [fluxEnabled, setFluxEnabled] = useState(initialFlux);
  const [runtimeApiKey, setRuntimeApiKey] = useState(
    apiKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  );
  const [tempApiKeyInput, setTempApiKeyInput] = useState('');

  // Interactive Rooftop Drawing State (Corner-by-corner)
  const [activeDrawingPoints, setActiveDrawingPoints] = useState([]);

  // Intercept Google Maps auth failure (ApiTargetBlockedMapError, BillingNotEnabledMapError, etc.)
  useEffect(() => {
    const handleAuthFailure = () => {
      console.warn('[GoogleSolarMap] gm_authFailure fired: Switching to high-res satellite backup.');
      setAuthBlockedError(true);
      setIsSdkReady(false);
    };

    window.gm_authFailure = handleAuthFailure;

    // Intercept console.error to catch BillingNotEnabledMapError & ApiNotActivatedMapError
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const msg = args.map((a) => (typeof a === 'string' ? a : (a?.message || ''))).join(' ');
      if (
        msg.includes('BillingNotEnabledMapError') ||
        msg.includes('ApiNotActivatedMapError') ||
        msg.includes('ApiTargetBlockedMapError') ||
        msg.includes('DeletedKeyMapError') ||
        msg.includes('InvalidKeyMapError')
      ) {
        console.warn('[GoogleSolarMap] Google Maps restriction/billing error intercepted in console:', msg);
        setAuthBlockedError(true);
        setIsSdkReady(false);
      }
      originalConsoleError.apply(console, args);
    };

    return () => {
      if (window.gm_authFailure === handleAuthFailure) {
        window.gm_authFailure = null;
      }
      console.error = originalConsoleError;
    };
  }, []);

  // 1. Asynchronously load Google Maps JavaScript SDK
  useEffect(() => {
    if (!runtimeApiKey) {
      setLoadError('MISSING_KEY');
      return;
    }

    setLoadError(null);
    setAuthBlockedError(false);
    let active = true;

    loadGoogleMapsSdk({ apiKey: runtimeApiKey, mapId })
      .then(() => {
        if (active) {
          setIsSdkReady(true);
        }
      })
      .catch((err) => {
        if (active) {
          console.error('[GoogleSolarMap] Loader failed:', err);
          setLoadError(err.message || 'Failed to initialize Google Maps SDK.');
        }
      });

    return () => {
      active = false;
    };
  }, [runtimeApiKey, mapId, retryCount]);

  // 2. Initialize Google Map Instance
  useEffect(() => {
    if (!isSdkReady || authBlockedError || !containerRef.current || mapRef.current) return;

    try {
      const initialCenter = Array.isArray(center)
        ? { lat: center[0], lng: center[1] }
        : center || DEFAULT_CENTER;

      const map = new window.google.maps.Map(containerRef.current, {
        center: initialCenter,
        zoom,
        mapId,
        mapTypeId: window.google.maps.MapTypeId.HYBRID,
        tilt: 0,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
        zoomControl: true,
        zoomControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_BOTTOM,
        },
        scaleControl: true,
        scaleControlOptions: {
          position: window.google.maps.ControlPosition.LEFT_BOTTOM,
        },
      });

      mapRef.current = map;

      // Coordinate state handler: Idle
      const idleListener = map.addListener('idle', () => {
        if (onBoundsChange) {
          const b = map.getBounds();
          if (b) {
            const ne = b.getNorthEast();
            const sw = b.getSouthWest();
            onBoundsChange({
              north: ne.lat(),
              east: ne.lng(),
              south: sw.lat(),
              west: sw.lng(),
              zoom: map.getZoom(),
              center: { lat: map.getCenter().lat(), lng: map.getCenter().lng() },
            });
          }
        }
      });

      return () => {
        window.google.maps.event.removeListener(idleListener);
        window.google.maps.event.clearInstanceListeners(map);
        mapRef.current = null;
      };
    } catch (initErr) {
      console.warn('[GoogleSolarMap] Map constructor failed:', initErr);
      setAuthBlockedError(true);
    }
  }, [isSdkReady, authBlockedError, mapId]);

  // 3. Map Click Handler (Dispatches between Drawing Mode vs Site Pin Selection)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || authBlockedError) return;

    map.setOptions({
      draggableCursor: isDrawingEnabled ? 'crosshair' : null,
    });

    const clickListener = map.addListener('click', (e) => {
      if (!e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();

      if (isDrawingEnabled) {
        setActiveDrawingPoints((prev) => [...prev, [lat, lng]]);
      } else {
        if (onMapClick) {
          onMapClick({ lat, lng, latLngBounds: map.getBounds() });
        }
      }
    });

    return () => {
      window.google.maps.event.removeListener(clickListener);
    };
  }, [isDrawingEnabled, onMapClick, authBlockedError]);

  // 4. Live Polyline & Vertex Badges during Drawing Mode
  useEffect(() => {
    const map = mapRef.current;
    if (!map || authBlockedError || !window.google?.maps) return;

    if (drawingPolylineRef.current) {
      drawingPolylineRef.current.setMap(null);
      drawingPolylineRef.current = null;
    }
    drawingMarkersRef.current.forEach((m) => {
      try { m.setMap(null); } catch {}
    });
    drawingMarkersRef.current = [];

    if (!isDrawingEnabled || activeDrawingPoints.length === 0) return;

    const path = activeDrawingPoints.map(([lat, lng]) => ({ lat, lng }));

    const polyline = new window.google.maps.Polyline({
      path,
      strokeColor: '#3b82f6',
      strokeOpacity: 0.95,
      strokeWeight: 3,
      map,
      zIndex: 100,
    });
    drawingPolylineRef.current = polyline;

    activeDrawingPoints.forEach(([lat, lng], idx) => {
      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        map,
        label: {
          text: String(idx + 1),
          color: '#ffffff',
          fontSize: '11px',
          fontWeight: 'bold',
        },
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#2563eb',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        zIndex: 101,
      });
      drawingMarkersRef.current.push(marker);
    });

    return () => {
      if (drawingPolylineRef.current) {
        drawingPolylineRef.current.setMap(null);
        drawingPolylineRef.current = null;
      }
      drawingMarkersRef.current.forEach((m) => {
        try { m.setMap(null); } catch {}
      });
      drawingMarkersRef.current = [];
    };
  }, [isDrawingEnabled, activeDrawingPoints, authBlockedError]);

  const handleFinishRooftopOutline = useCallback(() => {
    if (activeDrawingPoints.length < 3) return;
    if (onPolygonChange) {
      onPolygonChange(activeDrawingPoints);
    }
    setActiveDrawingPoints([]);
  }, [activeDrawingPoints, onPolygonChange]);

  const handleUndoPoint = () => {
    setActiveDrawingPoints((prev) => prev.slice(0, -1));
  };

  const handleCancelDrawing = () => {
    setActiveDrawingPoints([]);
    if (onCancelDrawing) onCancelDrawing();
  };

  // 5. Camera Sync: Bounds & Center
  useEffect(() => {
    const map = mapRef.current;
    if (!map || authBlockedError) return;

    try {
      if (bounds && Array.isArray(bounds) && bounds.length === 4) {
        const [south, north, west, east] = bounds;
        const gBounds = new window.google.maps.LatLngBounds(
          new window.google.maps.LatLng(south, west),
          new window.google.maps.LatLng(north, east)
        );
        map.fitBounds(gBounds, 32);
      } else if (center) {
        const targetCenter = Array.isArray(center) ? { lat: center[0], lng: center[1] } : center;
        map.panTo(targetCenter);
      }
    } catch {}
  }, [center, bounds, authBlockedError]);

  // 6. Marker Overlay (Target Installation Pin)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || authBlockedError || !markerPosition) {
      if (markerRef.current) {
        try {
          if (markerRef.current.map !== undefined) markerRef.current.map = null;
          if (typeof markerRef.current.setMap === 'function') markerRef.current.setMap(null);
        } catch {}
        markerRef.current = null;
      }
      return;
    }

    const pos = Array.isArray(markerPosition)
      ? { lat: markerPosition[0], lng: markerPosition[1] }
      : markerPosition;

    if (markerRef.current) {
      try {
        if (markerRef.current.map !== undefined) markerRef.current.map = null;
        if (typeof markerRef.current.setMap === 'function') markerRef.current.setMap(null);
      } catch {}
      markerRef.current = null;
    }

    try {
      if (window.google?.maps?.marker?.AdvancedMarkerElement) {
        const markerDom = document.createElement('div');
        markerDom.className = 'flex flex-col items-center group cursor-pointer -translate-y-1/2';
        markerDom.innerHTML = `
          <div class="px-2.5 py-1 mb-1 text-[11px] font-bold text-slate-900 bg-white/95 rounded-md shadow-lg border border-amber-400 whitespace-nowrap flex items-center gap-1.5 backdrop-blur-sm">
            <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            ${markerLabel || 'Site'}
          </div>
          <div class="relative flex items-center justify-center">
            <span class="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-amber-400 opacity-60"></span>
            <div class="relative inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-500 text-slate-950 shadow-md ring-2 ring-white">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="4"/>
                <path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
              </svg>
            </div>
          </div>
        `;

        const advancedMarker = new window.google.maps.marker.AdvancedMarkerElement({
          map,
          position: pos,
          title: markerLabel,
          content: markerDom,
        });

        markerRef.current = advancedMarker;
        return;
      }
    } catch (advancedMarkerErr) {
      console.warn('[GoogleSolarMap] AdvancedMarkerElement caught:', advancedMarkerErr);
    }

    try {
      if (window.google?.maps?.Marker) {
        const classicMarker = new window.google.maps.Marker({
          map,
          position: pos,
          title: markerLabel,
        });
        markerRef.current = classicMarker;
      }
    } catch {}

    return () => {
      if (markerRef.current) {
        try {
          if (markerRef.current.map !== undefined) markerRef.current.map = null;
          if (typeof markerRef.current.setMap === 'function') markerRef.current.setMap(null);
        } catch {}
        markerRef.current = null;
      }
    };
  }, [markerPosition, markerLabel, authBlockedError]);

  // 7. Render Committed Rooftop Boundary Polygon (Google Blue / Solar Amber)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || authBlockedError || !window.google?.maps) return;

    if (polygonRef.current) {
      try { polygonRef.current.setMap(null); } catch {}
      polygonRef.current = null;
    }

    if (!polygonCoordinates || polygonCoordinates.length < 3) return;

    try {
      const path = polygonCoordinates.map((pt) =>
        Array.isArray(pt) ? { lat: pt[0], lng: pt[1] } : pt
      );

      const polygon = new window.google.maps.Polygon({
        paths: path,
        strokeColor: '#2563eb', // Google Solar Blue
        strokeOpacity: 0.95,
        strokeWeight: 3.5,
        fillColor: '#3b82f6',
        fillOpacity: 0.22,
        editable: false,
        draggable: false,
        zIndex: 50,
      });

      polygon.setMap(map);
      polygonRef.current = polygon;

      const polyBounds = new window.google.maps.LatLngBounds();
      path.forEach((coord) => polyBounds.extend(coord));
      map.fitBounds(polyBounds, 40);
    } catch (err) {
      console.warn('[GoogleSolarMap] Polygon draw error:', err);
    }

    return () => {
      if (polygonRef.current) {
        try { polygonRef.current.setMap(null); } catch {}
        polygonRef.current = null;
      }
    };
  }, [polygonCoordinates, authBlockedError]);

  // 8. RENDER ACCURATELY ROTATED & RADIANCE-SORTED SOLAR PANELS ON THE ROOFTOP
  useEffect(() => {
    const map = mapRef.current;
    if (!map || authBlockedError || !window.google?.maps) return;

    // Clear previous panel overlays
    solarPanelPolygonsRef.current.forEach((poly) => {
      try { poly.setMap(null); } catch {}
    });
    solarPanelPolygonsRef.current = [];

    if (!showSolarPanels || !solarPanels || solarPanels.length === 0) return;

    // 1. If user defined a rooftop boundary polygon, clip panels strictly inside that boundary!
    let eligiblePanels = [];
    if (polygonCoordinates && polygonCoordinates.length >= 3) {
      eligiblePanels = solarPanels.filter((panel) => {
        if (!panel.center) return false;
        return isPointInPolygon([panel.center.latitude, panel.center.longitude], polygonCoordinates);
      });
    } else {
      // If no polygon is drawn, keep canvas clean until user outlines the target rooftop
      eligiblePanels = [];
    }

    // 2. Sort by solar radiance / yearly energy output descending to guarantee MAXIMUM THROUGHPUT first
    eligiblePanels.sort((a, b) => (b.yearlyEnergyDcKwh || 0) - (a.yearlyEnergyDcKwh || 0));

    // 3. Slice to selected panel limit
    const panelsToRender = eligiblePanels.slice(0, panelLimit || eligiblePanels.length);

    if (panelsToRender.length === 0) return;

    const maxEnergy = panelsToRender[0]?.yearlyEnergyDcKwh || 720;
    const minEnergy = panelsToRender[panelsToRender.length - 1]?.yearlyEnergyDcKwh || 650;
    const energyRange = Math.max(1, maxEnergy - minEnergy);

    const DEG_TO_RAD = Math.PI / 180;
    const metersPerLat = 111132;
    const pHeight = panelHeightMeters || 1.879;
    const pWidth = panelWidthMeters || 1.045;

    // 4. Render physically accurate rotated panel rectangles
    panelsToRender.forEach((panel) => {
      if (!panel.center) return;
      const centerLat = panel.center.latitude;
      const centerLng = panel.center.longitude;

      // Extract azimuth rotation from roof segment
      const segment = roofSegmentStats?.[panel.segmentIndex] || null;
      const azimuthRad = (segment?.azimuthDegrees || 0) * DEG_TO_RAD;

      const isLandscape = panel.orientation === 'LANDSCAPE';
      const halfLength = (isLandscape ? pHeight : pWidth) / 2;
      const halfBreadth = (isLandscape ? pWidth : pHeight) / 2;

      // Local 4 corners (along ridge u, along azimuth pitch v)
      const localCorners = [
        [-halfLength, -halfBreadth],
        [ halfLength, -halfBreadth],
        [ halfLength,  halfBreadth],
        [-halfLength,  halfBreadth],
      ];

      const metersPerLng = 111132 * Math.cos(centerLat * DEG_TO_RAD);

      // Rotate corners by roof azimuth so panels match building geometry
      const panelPath = localCorners.map(([u, v]) => {
        const dEast = u * Math.cos(azimuthRad) + v * Math.sin(azimuthRad);
        const dNorth = -u * Math.sin(azimuthRad) + v * Math.cos(azimuthRad);
        return {
          lat: centerLat + (dNorth / metersPerLat),
          lng: centerLng + (dEast / metersPerLng),
        };
      });

      // Solar Radiance color-coding: top radiance gets deep cobalt with gold border
      const energy = panel.yearlyEnergyDcKwh || minEnergy;
      const ratio = Math.max(0, Math.min(1, (energy - minEnergy) / energyRange));

      const fillColor = ratio > 0.65 ? '#1d4ed8' : ratio > 0.35 ? '#2563eb' : '#3b82f6';
      const strokeColor = ratio > 0.65 ? '#f59e0b' : '#1e3a8a';
      const strokeWeight = ratio > 0.65 ? 1.2 : 0.8;

      try {
        const panelPoly = new window.google.maps.Polygon({
          paths: panelPath,
          strokeColor,
          strokeWeight,
          fillColor,
          fillOpacity: 0.90,
          map,
          zIndex: 80,
        });

        solarPanelPolygonsRef.current.push(panelPoly);
      } catch {}
    });

    return () => {
      solarPanelPolygonsRef.current.forEach((poly) => {
        try { poly.setMap(null); } catch {}
      });
      solarPanelPolygonsRef.current = [];
    };
  }, [
    solarPanels, 
    roofSegmentStats, 
    panelHeightMeters, 
    panelWidthMeters, 
    polygonCoordinates, 
    showSolarPanels, 
    panelLimit, 
    authBlockedError
  ]);

  // 9. Solar Flux Heatmap Overlay
  const effectiveFluxBounds = React.useMemo(() => {
    if (fluxBounds) return fluxBounds;
    if (polygonCoordinates && polygonCoordinates.length >= 3) {
      let south = 90;
      let north = -90;
      let west = 180;
      let east = -180;
      polygonCoordinates.forEach(([lat, lng]) => {
        if (lat < south) south = lat;
        if (lat > north) north = lat;
        if (lng < west) west = lng;
        if (lng > east) east = lng;
      });
      return { south, north, west, east };
    }
    if (bounds && Array.isArray(bounds) && bounds.length === 4) {
      return { south: bounds[0], north: bounds[1], west: bounds[2], east: bounds[3] };
    }
    return null;
  }, [fluxBounds, polygonCoordinates, bounds]);

  useSolarFluxOverlay(
    authBlockedError ? null : mapRef.current,
    effectiveFluxBounds,
    fluxEnabled
  );

  const handleMapTypeSwitch = (type) => {
    setMapType(type);
    if (mapRef.current && window.google?.maps) {
      mapRef.current.setMapTypeId(
        type === 'satellite'
          ? window.google.maps.MapTypeId.SATELLITE
          : type === 'roadmap'
          ? window.google.maps.MapTypeId.ROADMAP
          : window.google.maps.MapTypeId.HYBRID
      );
    }
  };

  const handleRetryGoogleMaps = () => {
    setAuthBlockedError(false);
    setLoadError(null);
    resetGoogleMapsLoader();
    setIsSdkReady(false);
    setRetryCount((c) => c + 1);
  };

  if (loadError === 'MISSING_KEY') {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-slate-900 p-8 text-white">
        <div className="max-w-md w-full rounded-2xl bg-slate-800/90 border border-slate-700 p-6 shadow-2xl backdrop-blur-md text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 mb-4 ring-1 ring-amber-500/30">
            <Layers className="h-7 w-7" />
          </div>
          <h3 className="text-xl font-bold tracking-tight text-white mb-2">
            Google Maps API Key Required
          </h3>
          <p className="text-xs text-slate-400 mb-5 leading-relaxed">
            Enter your Google Cloud API key below or set <code className="px-1.5 py-0.5 rounded bg-slate-950 text-amber-300 font-mono text-2xs">VITE_GOOGLE_MAPS_API_KEY</code> in <code className="text-slate-300">.env</code>.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (tempApiKeyInput.trim()) {
                setRuntimeApiKey(tempApiKeyInput.trim());
              }
            }}
            className="flex flex-col gap-3"
          >
            <input
              type="text"
              value={tempApiKeyInput}
              onChange={(e) => setTempApiKeyInput(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full rounded-xl bg-slate-950 px-4 py-2.5 text-xs text-white border border-slate-700 placeholder:text-slate-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
            <button
              type="submit"
              disabled={!tempApiKeyInput.trim()}
              className="w-full rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 py-2.5 font-bold text-xs text-slate-950 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
            >
              Initialize Google Satellite Map
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (authBlockedError) {
    return (
      <div className={`relative ${className} overflow-hidden`}>
        <div className="absolute top-3 left-3 right-3 z-[400] flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-900/90 border border-amber-500/50 px-3.5 py-2 text-xs text-white shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-semibold text-amber-300">Satellite Backup Active:</span>
            <span className="text-slate-300 hidden sm:inline">Google key is restricted to Solar API. Rooftop drawing & calculations working.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowInstructionsModal(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold text-2xs border border-amber-400/40 transition-colors cursor-pointer"
            >
              <HelpCircle size={13} />
              <span>How to Enable Google Maps</span>
            </button>
            <button
              type="button"
              onClick={handleRetryGoogleMaps}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-2xs transition-colors cursor-pointer shadow-sm"
            >
              <RotateCcw size={12} />
              <span>Retry Google Maps</span>
            </button>
          </div>
        </div>

        {showInstructionsModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div className="max-w-md w-full rounded-2xl bg-slate-900 border border-slate-700 p-6 text-white shadow-2xl relative">
              <button
                type="button"
                onClick={() => setShowInstructionsModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-2 text-amber-400 font-bold text-base mb-2">
                <AlertTriangle size={20} />
                <span>Enable Maps JavaScript API in Google Cloud</span>
              </div>

              <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                Your key currently only has <strong>Solar API</strong> checked. To enable the native Google Maps canvas, check <strong>Maps JavaScript API</strong>:
              </p>

              <div className="rounded-xl bg-slate-950 p-3.5 space-y-2.5 text-xs border border-slate-800 text-slate-300">
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <span><strong>1. Link Billing Account (Required):</strong> Google Maps JS API requires an active billing account on your Google Cloud project (even with the $200 free monthly credit). Go to <a href="https://console.cloud.google.com/billing" target="_blank" rel="noreferrer" className="text-amber-400 underline font-semibold">Google Cloud Billing</a> and link an account.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <span><strong>2. Enable Maps JavaScript API:</strong> Go to <strong>APIs & Services &rarr; Library</strong> and ensure <strong>Maps JavaScript API</strong> is Enabled.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <span><strong>3. Check API Restrictions:</strong> Under <strong>APIs & Services &rarr; Credentials</strong>, edit your key and select both <strong>Maps JavaScript API</strong> and <strong>Solar API</strong> (or choose <em>Don't restrict key</em>).</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowInstructionsModal(false);
                  handleRetryGoogleMaps();
                }}
                className="mt-5 w-full rounded-xl bg-amber-500 hover:bg-amber-600 py-2.5 text-xs font-bold text-slate-950 transition-all cursor-pointer shadow-md shadow-amber-500/20"
              >
                I Updated It — Reload Google Maps
              </button>
            </div>
          </div>
        )}

        <LeafletSatelliteFallback
          center={center}
          bounds={bounds}
          markerPosition={markerPosition}
          markerLabel={markerLabel}
          polygonCoordinates={polygonCoordinates}
          onPolygonChange={onPolygonChange}
          isDrawingEnabled={isDrawingEnabled}
        />
      </div>
    );
  }

  // Normal Google Maps Canvas Render
  return (
    <div className={`relative ${className} overflow-hidden`}>
      {!isSdkReady && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm">
          <div className="flex flex-col items-center space-y-3 text-amber-400">
            <span className="relative flex h-8 w-8">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-8 w-8 bg-amber-500 text-slate-950 items-center justify-center">
                <Layers size={16} />
              </span>
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Loading Google Satellite Imagery...
            </span>
          </div>
        </div>
      )}

      {/* Interactive Rooftop Drawing Toolbar Overlay */}
      {isDrawingEnabled && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-40 flex items-center gap-2 bg-slate-950/90 border border-blue-500/70 text-white px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2 pr-2 border-r border-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
            <span className="font-bold text-blue-400">Rooftop Outline Mode:</span>
            <span className="text-slate-300">
              {activeDrawingPoints.length === 0
                ? 'Click on the map to place corner 1'
                : `${activeDrawingPoints.length} corner${activeDrawingPoints.length > 1 ? 's' : ''} placed`}
            </span>
          </div>

          <button
            type="button"
            onClick={handleUndoPoint}
            disabled={activeDrawingPoints.length === 0}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-medium transition-colors cursor-pointer"
          >
            <Undo2 size={13} />
            <span>Undo</span>
          </button>

          <button
            type="button"
            onClick={handleFinishRooftopOutline}
            disabled={activeDrawingPoints.length < 3}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-white transition-all shadow-md shadow-blue-500/30 cursor-pointer"
          >
            <Check size={14} />
            <span>Complete Rooftop ({activeDrawingPoints.length >= 3 ? 'Ready' : 'Need 3+ pts'})</span>
          </button>

          <button
            type="button"
            onClick={handleCancelDrawing}
            className="flex items-center px-2 py-1.5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Cancel Drawing"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Floating Basemap & Solar Layer Controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setFluxEnabled(!fluxEnabled)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md backdrop-blur-md transition-all ${
            fluxEnabled
              ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300 shadow-amber-500/30'
              : 'bg-slate-900/85 hover:bg-slate-900 text-white border border-slate-700'
          }`}
          title="Toggle Google Solar Flux Overlays"
        >
          {fluxEnabled ? <Eye size={14} /> : <EyeOff size={14} />}
          <span>Solar Flux Overlay</span>
        </button>

        <button
          type="button"
          onClick={() => setAuthBlockedError(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md backdrop-blur-md bg-slate-900/85 hover:bg-slate-900 text-slate-200 border border-slate-700 hover:text-amber-400 transition-colors cursor-pointer"
          title="Switch to Free High-Resolution Satellite Map (No Google Billing Required)"
        >
          <span>Free Satellite (Leaflet)</span>
        </button>

        <div className="flex rounded-lg overflow-hidden border border-slate-700 bg-slate-900/85 shadow-md backdrop-blur-md text-2xs font-semibold">
          <button
            type="button"
            onClick={() => handleMapTypeSwitch('hybrid')}
            className={`px-2.5 py-1.5 transition-colors ${
              mapType === 'hybrid' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
            }`}
          >
            Hybrid
          </button>
          <button
            type="button"
            onClick={() => handleMapTypeSwitch('satellite')}
            className={`px-2.5 py-1.5 transition-colors ${
              mapType === 'satellite' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
            }`}
          >
            Satellite
          </button>
          <button
            type="button"
            onClick={() => handleMapTypeSwitch('roadmap')}
            className={`px-2.5 py-1.5 transition-colors ${
              mapType === 'roadmap' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
            }`}
          >
            Roads
          </button>
        </div>
      </div>

      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
};

export default GoogleSolarMap;
