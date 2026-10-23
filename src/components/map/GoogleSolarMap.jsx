import React, { useEffect, useRef, useState, useCallback } from 'react';
import { loadGoogleMapsSdk, resetGoogleMapsLoader } from '../../services/googleMapsLoader';
import { useSolarFluxOverlay } from './useSolarFluxOverlay';
import { Layers, MapPin, Eye, EyeOff, RotateCcw, AlertTriangle, ExternalLink } from 'lucide-react';

const DEFAULT_CENTER = { lat: 12.9716, lng: 77.5946 }; // Bengaluru Default

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
  showFluxOverlay: initialFlux = false,
  fluxBounds = null,
  className = 'h-full w-full',
}) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const polygonRef = useRef(null);
  const drawingManagerRef = useRef(null);

  const [isSdkReady, setIsSdkReady] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [authBlockedError, setAuthBlockedError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [mapType, setMapType] = useState('hybrid');
  const [fluxEnabled, setFluxEnabled] = useState(initialFlux);
  const [runtimeApiKey, setRuntimeApiKey] = useState(
    apiKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  );
  const [tempApiKeyInput, setTempApiKeyInput] = useState('');

  // Catch Google Maps authentication / restriction errors (ApiTargetBlockedMapError, etc.)
  useEffect(() => {
    const originalAuthFailure = window.gm_authFailure;
    window.gm_authFailure = () => {
      console.warn('[GoogleSolarMap] gm_authFailure fired: API key restriction blocking Maps JavaScript API.');
      setAuthBlockedError(true);
      if (typeof originalAuthFailure === 'function') {
        originalAuthFailure();
      }
    };

    return () => {
      window.gm_authFailure = originalAuthFailure;
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
    if (!isSdkReady || !containerRef.current || mapRef.current) return;

    const initialCenter = Array.isArray(center)
      ? { lat: center[0], lng: center[1] }
      : center || DEFAULT_CENTER;

    const map = new window.google.maps.Map(containerRef.current, {
      center: initialCenter,
      zoom,
      mapId,
      mapTypeId: window.google.maps.MapTypeId.HYBRID, // Satellite with vector street/building overlays
      tilt: 0, // Top-down Nadir view for accurate rooftop geometry
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
      zoomControl: true,
      zoomControlOptions: {
        position: window.google.maps.ControlPosition.RIGHT_BOTTOM,
      },
    });

    mapRef.current = map;

    // Coordinate state handler: Map Click
    const clickListener = map.addListener('click', (e) => {
      if (!e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      if (onMapClick) {
        onMapClick({
          lat,
          lng,
          latLngBounds: map.getBounds(),
        });
      }
    });

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
      window.google.maps.event.removeListener(clickListener);
      window.google.maps.event.removeListener(idleListener);
      window.google.maps.event.clearInstanceListeners(map);
      mapRef.current = null;
    };
  }, [isSdkReady, mapId]);

  // 3. Camera Sync: Bounds & Center
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

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
  }, [center, bounds]);

  // 4. AdvancedMarkerElement (with fallback to classic google.maps.Marker)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !markerPosition) {
      if (markerRef.current) {
        if (markerRef.current.map !== undefined) markerRef.current.map = null;
        if (typeof markerRef.current.setMap === 'function') markerRef.current.setMap(null);
        markerRef.current = null;
      }
      return;
    }

    const pos = Array.isArray(markerPosition)
      ? { lat: markerPosition[0], lng: markerPosition[1] }
      : markerPosition;

    if (markerRef.current) {
      if (markerRef.current.map !== undefined) markerRef.current.map = null;
      if (typeof markerRef.current.setMap === 'function') markerRef.current.setMap(null);
      markerRef.current = null;
    }

    // Try AdvancedMarkerElement first
    if (window.google?.maps?.marker?.AdvancedMarkerElement) {
      try {
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
      } catch (advancedMarkerErr) {
        console.warn('[GoogleSolarMap] AdvancedMarkerElement fallback:', advancedMarkerErr);
      }
    }

    // Classic Marker Fallback
    if (window.google?.maps?.Marker) {
      const classicMarker = new window.google.maps.Marker({
        map,
        position: pos,
        title: markerLabel,
        animation: window.google.maps.Animation.DROP,
      });
      markerRef.current = classicMarker;
    }

    return () => {
      if (markerRef.current) {
        if (markerRef.current.map !== undefined) markerRef.current.map = null;
        if (typeof markerRef.current.setMap === 'function') markerRef.current.setMap(null);
        markerRef.current = null;
      }
    };
  }, [markerPosition, markerLabel]);

  // 5. Render Rooftop Polygon Overlay
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.google?.maps) return;

    if (polygonRef.current) {
      polygonRef.current.setMap(null);
      polygonRef.current = null;
    }

    if (!polygonCoordinates || polygonCoordinates.length < 3) return;

    const path = polygonCoordinates.map((pt) =>
      Array.isArray(pt) ? { lat: pt[0], lng: pt[1] } : pt
    );

    const polygon = new window.google.maps.Polygon({
      paths: path,
      strokeColor: '#f59e0b',
      strokeOpacity: 0.95,
      strokeWeight: 3,
      fillColor: '#f59e0b',
      fillOpacity: 0.32,
      editable: false,
      draggable: false,
      zIndex: 50,
    });

    polygon.setMap(map);
    polygonRef.current = polygon;

    return () => {
      if (polygonRef.current) {
        polygonRef.current.setMap(null);
        polygonRef.current = null;
      }
    };
  }, [polygonCoordinates]);

  // 6. Drawing Manager: Rooftop Polygons
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.google?.maps?.drawing) return;

    if (!isDrawingEnabled) {
      if (drawingManagerRef.current) {
        drawingManagerRef.current.setMap(null);
        drawingManagerRef.current = null;
      }
      return;
    }

    const dm = new window.google.maps.drawing.DrawingManager({
      drawingMode: window.google.maps.drawing.OverlayType.POLYGON,
      drawingControl: true,
      drawingControlOptions: {
        position: window.google.maps.ControlPosition.TOP_RIGHT,
        drawingModes: [window.google.maps.drawing.OverlayType.POLYGON],
      },
      polygonOptions: {
        fillColor: '#f59e0b',
        fillOpacity: 0.35,
        strokeColor: '#f59e0b',
        strokeWeight: 3,
        clickable: true,
        editable: true,
        zIndex: 60,
      },
    });

    dm.setMap(map);
    drawingManagerRef.current = dm;

    const completeListener = window.google.maps.event.addListener(
      dm,
      'overlaycomplete',
      (event) => {
        if (event.type === window.google.maps.drawing.OverlayType.POLYGON) {
          const drawnPoly = event.overlay;
          const vertices = drawnPoly.getPath();
          const coords = [];
          for (let i = 0; i < vertices.getLength(); i++) {
            const pt = vertices.getAt(i);
            coords.push([pt.lat(), pt.lng()]);
          }

          if (onPolygonChange) {
            onPolygonChange(coords);
          }

          drawnPoly.setMap(null);
          dm.setDrawingMode(null);
        }
      }
    );

    return () => {
      window.google.maps.event.removeListener(completeListener);
      if (drawingManagerRef.current) {
        drawingManagerRef.current.setMap(null);
        drawingManagerRef.current = null;
      }
    };
  }, [isDrawingEnabled, onPolygonChange]);

  // 7. Calculate or use fluxBounds for Solar Flux Overlay Hook
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

  useSolarFluxOverlay(mapRef.current, effectiveFluxBounds, fluxEnabled);

  // Basemap switcher
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

  // If Key is Blocked by API Restrictions (ApiTargetBlockedMapError)
  if (authBlockedError) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-slate-900/95 p-6 text-white text-center">
        <div className="max-w-md w-full rounded-2xl bg-slate-800 border border-amber-500/40 p-6 shadow-2xl backdrop-blur-md">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 mb-3">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">
            Enable Maps JavaScript API
          </h3>
          <p className="text-xs text-slate-300 mb-4 leading-relaxed">
            Your Google Cloud API key works for the <strong>Solar API</strong> (live data is active!), but needs <strong>Maps JavaScript API</strong> checked under its API restrictions to display the satellite map canvas.
          </p>

          <div className="rounded-xl bg-slate-950/90 p-3.5 text-left text-xs space-y-2 mb-4 border border-slate-700">
            <div className="font-semibold text-amber-300 flex items-center justify-between">
              <span>Quick 30-Second Fix in Google Cloud:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-[11px]">
              <li>Switch to your open <strong>Keys & Credentials</strong> tab in Google Cloud Console</li>
              <li>Click on your key name: <strong>Maps Platform API Key</strong></li>
              <li>Scroll down to <strong>API restrictions</strong></li>
              <li>In the dropdown list, check <strong className="text-amber-300">Maps JavaScript API</strong></li>
              <li>Click <strong>Save</strong> at the bottom</li>
            </ol>
          </div>

          <button
            type="button"
            onClick={() => {
              setAuthBlockedError(false);
              setLoadError(null);
              resetGoogleMapsLoader();
              setIsSdkReady(false);
              setRetryCount((c) => c + 1);
            }}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 py-3 font-bold text-xs text-slate-950 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>I Saved It — Reload Satellite Map</span>
          </button>
        </div>
      </div>
    );
  }

  // If Key is Missing
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

  // If other load error occurred
  if (loadError && loadError !== 'MISSING_KEY') {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-slate-900 p-6 text-center text-slate-300">
        <div className="rounded-xl bg-red-950/40 border border-red-800/50 p-6 max-w-md">
          <p className="text-red-400 font-bold mb-1">Google Maps Initialization Error</p>
          <p className="text-xs text-slate-400 mb-4">{loadError}</p>
          <button
            onClick={() => {
              resetGoogleMapsLoader();
              setLoadError(null);
              setIsSdkReady(false);
              setRetryCount((prev) => prev + 1);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-900/60 hover:bg-red-800 text-xs font-semibold text-white transition-all cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className} overflow-hidden`}>
      {/* Loading state indicator */}
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

      {/* Floating Basemap & Solar Layer Controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {/* Solar Flux Irradiance Toggle */}
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

        {/* Map Type Switcher */}
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

      {/* Actual Google Maps Canvas Element */}
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
};

export default GoogleSolarMap;
