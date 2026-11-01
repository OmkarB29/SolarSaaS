import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import * as turf from '@turf/turf';
import {
  MapPin,
  Crosshair,
  Undo2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Box,
  Layers,
  Sparkles,
  ArrowRight,
  Maximize2,
  Shield,
  Search,
  Loader2,
  Building2,
  HelpCircle,
  UploadCloud,
  X
} from 'lucide-react';
import { loadGoogleMapsSdk } from '../services/googleMapsLoader';
import { geocodingService } from '../services/geocodingService';
import { apiUrl } from '../services/apiConfig';
import Model3DCanvas from '../components/scene3d/Model3DCanvas';
import { model3dService } from '../services/model3dService';

// Default initial coordinates: Vidhana Soudha, Bengaluru
const DEFAULT_CENTER = { lat: 12.9797, lng: 77.5907 };

/**
 * Calculates the minimum rotated bounding rectangle for a GeoJSON Polygon using Turf.js
 */
function calculateMinRotatedRectangle(polygonFeature) {
  try {
    let minArea = Infinity;
    let bestWidth = 0;
    let bestHeight = 0;
    let bestBearing = 0;

    // Test orientation angles at 5-degree increments
    for (let angle = 0; angle < 90; angle += 5) {
      const rotated = turf.transformRotate(polygonFeature, angle);
      const bbox = turf.bbox(rotated);
      const w = turf.distance([bbox[0], bbox[1]], [bbox[2], bbox[1]], { units: 'meters' });
      const h = turf.distance([bbox[0], bbox[1]], [bbox[0], bbox[3]], { units: 'meters' });
      const currentArea = w * h;

      if (currentArea < minArea) {
        minArea = currentArea;
        bestWidth = w;
        bestHeight = h;
        bestBearing = angle;
      }
    }

    return {
      widthMeters: Math.round(bestWidth * 10) / 10,
      heightMeters: Math.round(bestHeight * 10) / 10,
      areaM2: Math.round(minArea * 10) / 10,
      bearingDeg: bestBearing,
    };
  } catch (err) {
    console.warn('[Model3DView] Error calculating min rotated rect:', err);
    return { widthMeters: 0, heightMeters: 0, areaM2: 0, bearingDeg: 0 };
  }
}

export default function Model3DView() {
  const navigate = useNavigate();

  // Location & Map Mode State
  const [center, setCenter] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('solarscope.rooftop'));
      if (saved?.latitude && saved?.longitude) {
        return { lat: saved.latitude, lng: saved.longitude };
      }
    } catch {
      // ignore
    }
    return DEFAULT_CENTER;
  });

  const [addressQuery, setAddressQuery] = useState('');
  const [addressLabel, setAddressLabel] = useState('Bengaluru, Karnataka');
  const [isLocating, setIsLocating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // 3D vs 2D Fallback state
  const [use3DMode, setUse3DMode] = useState(true);
  const [map3DError, setMap3DError] = useState(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);

  // Polygon & Obstacle Drawing State
  // Mode: 'roof' | 'obstacle' | 'view'
  const [drawMode, setDrawMode] = useState('roof');
  const [roofVertices, setRoofVertices] = useState([]);
  const [isRoofClosed, setIsRoofClosed] = useState(false);

  // Array of closed obstacle polygons: Array<Array<[lat, lng]>>
  const [obstacles, setObstacles] = useState([]);
  const [activeObstacleVertices, setActiveObstacleVertices] = useState([]);

  // Google Solar building outline stretch recommendation
  const [solarBuildingBounds, setSolarBuildingBounds] = useState(null);
  const [isFetchingSolar, setIsFetchingSolar] = useState(false);

  // Meshy AI Generation Modal & Job State
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [activeJob, setActiveJob] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedPhotoFile, setUploadedPhotoFile] = useState(null);
  const [uploadedPhotoBase64, setUploadedPhotoBase64] = useState(null);
  const [photoSourceMode, setPhotoSourceMode] = useState('google'); // 'google' | 'upload'
  const [jobError, setJobError] = useState('');

  // DOM Refs
  const map3dContainerRef = useRef(null);
  const map3dInstanceRef = useRef(null);
  const map2dContainerRef = useRef(null);
  const map2dInstanceRef = useRef(null);
  const map2dPolygonRef = useRef(null);
  const map2dObstaclePolygonsRef = useRef([]);
  const map2dActivePolylineRef = useRef(null);

  // Load Maps SDK (including 3D library)
  useEffect(() => {
    let active = true;
    const initSdk = async () => {
      try {
        const browserKey = import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
        await loadGoogleMapsSdk({ apiKey: browserKey });
        if (active) setMapsLoaded(true);
      } catch (err) {
        console.warn('[Model3DView] Google Maps SDK load error:', err);
        if (active) {
          setMap3DError(err.message || 'Google Maps SDK failed to load.');
          setUse3DMode(false);
        }
      }
    };
    initSdk();
    return () => {
      active = false;
    };
  }, []);

  // Fetch Google Solar building bounding box near coordinates (stretch feature)
  const fetchGoogleSolarOutline = useCallback(async (lat, lng) => {
    setIsFetchingSolar(true);
    try {
      const res = await fetch(apiUrl(`/api/solar/building-insights?latitude=${lat}&longitude=${lng}`));
      if (res.ok) {
        const data = await res.json();
        if (data?.boundingBox?.sw && data?.boundingBox?.ne) {
          const sw = data.boundingBox.sw;
          const ne = data.boundingBox.ne;
          const boxCoords = [
            [sw.latitude, sw.longitude],
            [sw.latitude, ne.longitude],
            [ne.latitude, ne.longitude],
            [ne.latitude, sw.longitude],
          ];
          setSolarBuildingBounds({
            coords: boxCoords,
            panelCapacity: data.maxArrayPanelsCount || 0,
            carbonOffset: data.carbonOffsetFactorKgPerMwh || 0,
          });
        }
      }
    } catch (err) {
      console.warn('[Model3DView] Google Solar lookup note:', err.message);
    } finally {
      setIsFetchingSolar(false);
    }
  }, []);

  // Restore initial stored rooftop if available
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('solarscope.rooftop'));
      if (saved?.polygonCoordinates?.length >= 3) {
        setRoofVertices(saved.polygonCoordinates);
        setIsRoofClosed(true);
        if (saved.obstacles && Array.isArray(saved.obstacles)) {
          setObstacles(saved.obstacles);
        }
        if (saved.address) setAddressLabel(saved.address);
        if (saved.latitude && saved.longitude) {
          setCenter({ lat: saved.latitude, lng: saved.longitude });
          fetchGoogleSolarOutline(saved.latitude, saved.longitude);
        }
      }
    } catch {
      // ignore
    }
  }, [fetchGoogleSolarOutline]);

  // Handle address geocoding search
  const handleSearchAddress = async (e) => {
    e?.preventDefault();
    if (!addressQuery.trim()) return;

    setIsSearching(true);
    setSearchError('');
    try {
      const result = await geocodingService.searchLocation(addressQuery);
      if (result?.position) {
        const newCenter = { lat: result.position[0], lng: result.position[1] };
        setCenter(newCenter);
        setAddressLabel(result.label || addressQuery);

        // Fly 3D map if mounted
        if (map3dInstanceRef.current) {
          map3dInstanceRef.current.center = { ...newCenter, altitude: 120 };
          map3dInstanceRef.current.range = 250;
        }
        if (map2dInstanceRef.current) {
          map2dInstanceRef.current.panTo(newCenter);
        }

        fetchGoogleSolarOutline(newCenter.lat, newCenter.lng);
      }
    } catch (err) {
      setSearchError(err.message || 'Location not found. Please try another address.');
    } finally {
      setIsSearching(false);
    }
  };

  // Browser Geolocation
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setSearchError('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    setSearchError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newCenter = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCenter(newCenter);
        setAddressLabel('Current location');
        if (map3dInstanceRef.current) {
          map3dInstanceRef.current.center = { ...newCenter, altitude: 120 };
          map3dInstanceRef.current.range = 250;
        }
        if (map2dInstanceRef.current) {
          map2dInstanceRef.current.panTo(newCenter);
        }
        setIsLocating(false);
        fetchGoogleSolarOutline(newCenter.lat, newCenter.lng);
      },
      (err) => {
        setIsLocating(false);
        setSearchError('Unable to retrieve location: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // MAP CLICK LOGIC (Handles vertex addition for Roof vs Obstacles)
  // ─────────────────────────────────────────────────────────────────────────────
  const handleMapVertexClick = useCallback((lat, lng) => {
    if (drawMode === 'roof') {
      if (isRoofClosed) return;
      setRoofVertices((prev) => [...prev, [lat, lng]]);
    } else if (drawMode === 'obstacle') {
      if (roofVertices.length < 3) {
        setSearchError('Define the outer rooftop boundary first before placing obstacles.');
        return;
      }
      setActiveObstacleVertices((prev) => [...prev, [lat, lng]]);
    }
  }, [drawMode, isRoofClosed, roofVertices.length]);

  // Undo last vertex
  const handleUndoVertex = () => {
    if (drawMode === 'roof') {
      if (isRoofClosed) {
        setIsRoofClosed(false);
      } else {
        setRoofVertices((prev) => prev.slice(0, -1));
      }
    } else if (drawMode === 'obstacle') {
      setActiveObstacleVertices((prev) => prev.slice(0, -1));
    }
  };

  // Clear current drawing
  const handleClear = () => {
    if (drawMode === 'roof') {
      setRoofVertices([]);
      setIsRoofClosed(false);
      setObstacles([]);
      setActiveObstacleVertices([]);
    } else if (drawMode === 'obstacle') {
      setActiveObstacleVertices([]);
    }
  };

  // Close polygon
  const handleClosePolygon = () => {
    if (drawMode === 'roof') {
      if (roofVertices.length >= 3) {
        setIsRoofClosed(true);
      }
    } else if (drawMode === 'obstacle') {
      if (activeObstacleVertices.length >= 3) {
        // Validate that obstacle polygon lies inside the rooftop polygon
        try {
          const roofCoords = [...roofVertices, roofVertices[0]].map(([lat, lng]) => [lng, lat]);
          const obsCoords = [...activeObstacleVertices, activeObstacleVertices[0]].map(([lat, lng]) => [lng, lat]);

          const roofPoly = turf.polygon([roofCoords]);
          const obsPoly = turf.polygon([obsCoords]);

          const isInside = turf.booleanContains(roofPoly, obsPoly);
          if (!isInside) {
            setSearchError('Obstacle exclusion zone must lie completely inside the rooftop polygon.');
            return;
          }

          setObstacles((prev) => [...prev, activeObstacleVertices]);
          setActiveObstacleVertices([]);
          setSearchError('');
        } catch (err) {
          console.warn('[Model3DView] Obstacle validation check error:', err);
          // If self-intersecting or complex, accept but notify
          setObstacles((prev) => [...prev, activeObstacleVertices]);
          setActiveObstacleVertices([]);
        }
      }
    }
  };

  // Apply Google Solar bounding box directly
  const handleApplySolarBounds = () => {
    if (solarBuildingBounds?.coords) {
      setRoofVertices(solarBuildingBounds.coords);
      setIsRoofClosed(true);
      setSearchError('');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // METRICS COMPUTATION (Live Turf.js area, perimeter, min rotated rectangle)
  // ─────────────────────────────────────────────────────────────────────────────
  const liveMetrics = useMemo(() => {
    if (roofVertices.length < 3) {
      return {
        grossAreaM2: 0,
        netUsableAreaM2: 0,
        perimeterMeters: 0,
        minRotatedRect: null,
        estimatedPanels: 0,
      };
    }

    try {
      const closedRoof = [...roofVertices, roofVertices[0]].map(([lat, lng]) => [lng, lat]);
      const roofPoly = turf.polygon([closedRoof]);
      const grossArea = turf.area(roofPoly);

      // Subtract obstacle areas
      let totalObstacleArea = 0;
      for (const obs of obstacles) {
        if (obs.length >= 3) {
          const closedObs = [...obs, obs[0]].map(([lat, lng]) => [lng, lat]);
          const obsPoly = turf.polygon([closedObs]);
          totalObstacleArea += turf.area(obsPoly);
        }
      }

      const netUsableArea = Math.max(0, grossArea - totalObstacleArea);
      const line = turf.polygonToLine(roofPoly);
      const perimeter = turf.length(line, { units: 'meters' });
      const rect = calculateMinRotatedRectangle(roofPoly);

      // Estimated panels (~2.0 m² per commercial/residential tier 1 panel)
      const estPanels = Math.floor(netUsableArea / 2.0);

      return {
        grossAreaM2: Math.round(grossArea * 10) / 10,
        netUsableAreaM2: Math.round(netUsableArea * 10) / 10,
        perimeterMeters: Math.round(perimeter * 10) / 10,
        minRotatedRect: rect,
        estimatedPanels: estPanels,
      };
    } catch (err) {
      console.warn('[Model3DView] Metrics calculation error:', err);
      return {
        grossAreaM2: 0,
        netUsableAreaM2: 0,
        perimeterMeters: 0,
        minRotatedRect: null,
        estimatedPanels: 0,
      };
    }
  }, [roofVertices, obstacles]);

  // Persist rooftop and open AI Panel Optimizer
  const handleOpenPanelOptimizer = () => {
    if (roofVertices.length < 3) {
      setSearchError('Please select at least 3 points to define the rooftop polygon.');
      return;
    }

    // Centroid
    const sumLat = roofVertices.reduce((s, p) => s + p[0], 0) / roofVertices.length;
    const sumLng = roofVertices.reduce((s, p) => s + p[1], 0) / roofVertices.length;

    const rooftopData = {
      latitude: sumLat,
      longitude: sumLng,
      address: addressLabel,
      location: addressLabel,
      polygonCoordinates: roofVertices,
      roofArea: liveMetrics.netUsableAreaM2 || liveMetrics.grossAreaM2,
      grossArea: liveMetrics.grossAreaM2,
      obstacles: obstacles,
      obstacleBufferMeters: 0.5,
      minRotatedRect: liveMetrics.minRotatedRect,
    };

    localStorage.setItem('solarscope.rooftop', JSON.stringify(rooftopData));
    localStorage.setItem('solarscope.selectedRooftop', JSON.stringify(rooftopData));
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('solarscope:rooftop-updated', { detail: rooftopData }));

    navigate('/panel-optimizer', { state: { rooftop: rooftopData } });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 3D GOOGLE MAP INITIALIZATION (Photorealistic 3D Maps / maps3d)
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapsLoaded || !use3DMode || !map3dContainerRef.current) return;

    let mapElement = null;

    const init3DMap = async () => {
      try {
        const { Map3DElement, Polygon3DElement, Marker3DInteractiveElement, AltitudeMode } =
          await window.google.maps.importLibrary('maps3d');

        if (!map3dContainerRef.current) return;
        map3dContainerRef.current.innerHTML = '';

        mapElement = new Map3DElement({
          center: { lat: center.lat, lng: center.lng, altitude: 120 },
          tilt: 62,
          heading: 10,
          range: 220,
        });

        // Click handler for 3D map
        mapElement.addEventListener('gmp-click', (event) => {
          const pos = event.position || event.detail?.latLng || event.latLng;
          if (pos) {
            const lat = typeof pos.lat === 'function' ? pos.lat() : pos.lat;
            const lng = typeof pos.lng === 'function' ? pos.lng() : pos.lng;
            handleMapVertexClick(lat, lng);
          }
        });

        map3dContainerRef.current.appendChild(mapElement);
        map3dInstanceRef.current = mapElement;

        // Render roof polygon if vertices exist
        if (roofVertices.length >= 2) {
          const polyCoords = isRoofClosed ? [...roofVertices, roofVertices[0]] : roofVertices;
          const poly3d = new Polygon3DElement({
            altitudeMode: AltitudeMode.CLAMP_TO_GROUND,
            fillColor: isRoofClosed ? 'rgba(59, 130, 246, 0.45)' : 'rgba(59, 130, 246, 0.15)',
            strokeColor: 'rgba(37, 99, 235, 1.0)',
            strokeWidth: 3,
            extruded: false,
          });
          poly3d.outerCoordinates = polyCoords.map(([lat, lng]) => ({ lat, lng }));
          mapElement.appendChild(poly3d);

          // Add interactive vertex markers
          roofVertices.forEach(([vLat, vLng]) => {
            const marker = new Marker3DInteractiveElement({
              position: { lat: vLat, lng: vLng, altitude: 0 },
              altitudeMode: AltitudeMode.CLAMP_TO_GROUND,
            });
            mapElement.appendChild(marker);
          });
        }

        // Render obstacles
        obstacles.forEach((obs) => {
          if (obs.length >= 3) {
            const obsPoly3d = new Polygon3DElement({
              altitudeMode: AltitudeMode.CLAMP_TO_GROUND,
              fillColor: 'rgba(239, 68, 68, 0.55)',
              strokeColor: 'rgba(220, 38, 38, 1.0)',
              strokeWidth: 3,
              extruded: false,
            });
            obsPoly3d.outerCoordinates = [...obs, obs[0]].map(([lat, lng]) => ({ lat, lng }));
            mapElement.appendChild(obsPoly3d);
          }
        });

        // Render active obstacle in progress
        if (activeObstacleVertices.length >= 2) {
          const activeObsPoly3d = new Polygon3DElement({
            altitudeMode: AltitudeMode.CLAMP_TO_GROUND,
            fillColor: 'rgba(249, 115, 22, 0.35)',
            strokeColor: 'rgba(234, 88, 12, 1.0)',
            strokeWidth: 2,
            extruded: false,
          });
          activeObsPoly3d.outerCoordinates = activeObstacleVertices.map(([lat, lng]) => ({ lat, lng }));
          mapElement.appendChild(activeObsPoly3d);
        }
      } catch (err) {
        console.warn('[Model3DView] 3D Maps failed or unsupported on this device:', err);
        setMap3DError(err.message || '3D WebGL Map could not be loaded.');
        setUse3DMode(false); // Automatically activate 2D satellite fallback
      }
    };

    init3DMap();

    return () => {
      if (mapElement && map3dContainerRef.current) {
        map3dContainerRef.current.innerHTML = '';
      }
    };
  }, [mapsLoaded, use3DMode, center, roofVertices, isRoofClosed, obstacles, activeObstacleVertices, handleMapVertexClick]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 2D GOOGLE SATELLITE FALLBACK INITIALIZATION
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapsLoaded || use3DMode || !map2dContainerRef.current || !window.google?.maps) return;

    if (!map2dInstanceRef.current) {
      const map = new window.google.maps.Map(map2dContainerRef.current, {
        center: { lat: center.lat, lng: center.lng },
        zoom: 19,
        mapTypeId: 'hybrid',
        tilt: 0,
        disableDefaultUI: false,
        zoomControl: true,
      });

      map.addListener('click', (e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        handleMapVertexClick(lat, lng);
      });

      map2dInstanceRef.current = map;
    } else {
      map2dInstanceRef.current.panTo({ lat: center.lat, lng: center.lng });
    }

    // Draw Roof Polygon in 2D
    if (map2dPolygonRef.current) {
      map2dPolygonRef.current.setMap(null);
      map2dPolygonRef.current = null;
    }
    if (map2dActivePolylineRef.current) {
      map2dActivePolylineRef.current.setMap(null);
      map2dActivePolylineRef.current = null;
    }

    if (roofVertices.length >= 3 && isRoofClosed) {
      const gCoords = roofVertices.map(([lat, lng]) => ({ lat, lng }));
      map2dPolygonRef.current = new window.google.maps.Polygon({
        paths: gCoords,
        strokeColor: '#2563EB',
        strokeOpacity: 0.9,
        strokeWeight: 3,
        fillColor: '#3B82F6',
        fillOpacity: 0.4,
        editable: true,
        map: map2dInstanceRef.current,
      });

      // Synchronize polygon vertex edits
      map2dPolygonRef.current.getPath().addListener('set_at', () => {
        const updated = map2dPolygonRef.current
          .getPath()
          .getArray()
          .map((pt) => [pt.lat(), pt.lng()]);
        setRoofVertices(updated);
      });
    } else if (roofVertices.length >= 2) {
      const gCoords = roofVertices.map(([lat, lng]) => ({ lat, lng }));
      map2dActivePolylineRef.current = new window.google.maps.Polyline({
        path: gCoords,
        strokeColor: '#3B82F6',
        strokeOpacity: 1.0,
        strokeWeight: 3,
        map: map2dInstanceRef.current,
      });
    }

    // Draw Obstacles in 2D
    map2dObstaclePolygonsRef.current.forEach((p) => p.setMap(null));
    map2dObstaclePolygonsRef.current = [];

    obstacles.forEach((obs) => {
      if (obs.length >= 3) {
        const obsPoly = new window.google.maps.Polygon({
          paths: obs.map(([lat, lng]) => ({ lat, lng })),
          strokeColor: '#DC2626',
          strokeOpacity: 0.9,
          strokeWeight: 3,
          fillColor: '#EF4444',
          fillOpacity: 0.5,
          map: map2dInstanceRef.current,
        });
        map2dObstaclePolygonsRef.current.push(obsPoly);
      }
    });
  }, [mapsLoaded, use3DMode, center, roofVertices, isRoofClosed, obstacles, handleMapVertexClick]);

  // Handle Local Photo Upload for Meshy
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setSearchError('Photo exceeds 20MB limit for Meshy AI.');
      return;
    }

    setUploadedPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedPhotoBase64(event.target.result);
      setPhotoSourceMode('upload');
    };
    reader.readAsDataURL(file);
  };

  // Trigger Meshy AI Generation Task
  const handleStartMeshyGeneration = async () => {
    if (roofVertices.length < 3) {
      setSearchError('Delineate your rooftop polygon with at least 3 vertices first.');
      return;
    }

    setIsGenerating(true);
    setJobError('');

    try {
      const sumLat = roofVertices.reduce((s, p) => s + p[0], 0) / roofVertices.length;
      const sumLng = roofVertices.reduce((s, p) => s + p[1], 0) / roofVertices.length;

      const jobPayload = {
        latitude: sumLat,
        longitude: sumLng,
        address: addressLabel,
        polygonCoordinates: roofVertices,
        obstacles: obstacles,
        roofArea: liveMetrics.netUsableAreaM2 || liveMetrics.grossAreaM2,
        imageSource: photoSourceMode === 'upload' && uploadedPhotoBase64 ? 'UPLOADED' : 'GOOGLE_STATIC',
        imageBase64: photoSourceMode === 'upload' ? uploadedPhotoBase64 : null,
      };

      const job = await model3dService.createJob(jobPayload);
      setActiveJob(job);
      setIsConfirmModalOpen(false);

      // Start polling for job completion
      model3dService.pollJob(job.id, (updatedJob) => {
        setActiveJob(updatedJob);
      }).catch((err) => {
        setJobError(err.message || 'Model generation polling failed.');
      });
    } catch (err) {
      setJobError(err.message || 'Failed to trigger 3D model generation job.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 overflow-hidden">
      {/* ─── TOP ACTION BAR & ADDRESS SEARCH ─── */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1.5 rounded-lg text-white font-bold text-xs shadow-md">
            <Box size={16} />
            <span>3D Rooftop CAD Studio</span>
          </div>

          <span className="text-xs text-slate-400 hidden sm:inline truncate max-w-xs" title={addressLabel}>
            {addressLabel}
          </span>
        </div>

        {/* Address Search & Geolocation */}
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <form onSubmit={handleSearchAddress} className="relative flex-1">
            <input
              type="text"
              placeholder="Search address or GPS (e.g. 12.9797, 77.5907)..."
              value={addressQuery}
              onChange={(e) => setAddressQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <Search size={14} className="absolute left-2.5 top-2 text-slate-500" />
          </form>

          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={isLocating}
            title="Use current GPS location"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
          >
            {isLocating ? <Loader2 size={14} className="animate-spin text-blue-400" /> : <Crosshair size={14} />}
          </button>
        </div>

        {/* Mode Switch: 3D vs 2D Fallback */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-2xs font-semibold">
          <button
            type="button"
            onClick={() => setUse3DMode(true)}
            className={`px-2.5 py-1 rounded cursor-pointer transition ${
              use3DMode ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Photorealistic 3D
          </button>
          <button
            type="button"
            onClick={() => setUse3DMode(false)}
            className={`px-2.5 py-1 rounded cursor-pointer transition ${
              !use3DMode ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            2D Satellite Fallback
          </button>
        </div>
      </div>

      {/* ─── FALLBACK BANNER (WHEN 3D FAILS OR 2D MODE SELECTED) ─── */}
      {!use3DMode && (
        <div className="bg-amber-950/80 border-b border-amber-800/80 px-4 py-1.5 flex items-center justify-between text-xs text-amber-200 z-10">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} className="text-amber-400 shrink-0" />
            <span>
              {map3DError
                ? `3D Map unavailable (${map3DError}). Running in 2D Satellite Mode.`
                : 'Active in 2D Satellite Mode. Rooftop selection, obstacles, and Meshy 3D generation work identically.'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setUse3DMode(true)}
            className="underline text-amber-300 hover:text-white text-2xs cursor-pointer ml-3"
          >
            Try 3D View Again
          </button>
        </div>
      )}

      {/* ─── MAIN WORKSPACE: MAP CANVAS + CAD SIDEBAR ─── */}
      <div className="flex-1 flex flex-col lg:flex-row relative overflow-hidden">
        {/* Left Map Viewport */}
        <div className="flex-1 relative bg-slate-950">
          {/* 3D Map Container */}
          <div
            ref={map3dContainerRef}
            className={`w-full h-full ${use3DMode ? 'block' : 'hidden'}`}
          />

          {/* 2D Satellite Fallback Container */}
          <div
            ref={map2dContainerRef}
            className={`w-full h-full ${!use3DMode ? 'block' : 'hidden'}`}
          />

          {/* Floating Map Controls HUD */}
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
            {/* Tool Selector Bar */}
            <div className="flex rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-1 shadow-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setDrawMode('roof')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  drawMode === 'roof'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Layers size={14} />
                <span>Rooftop Area ({roofVertices.length} pts)</span>
              </button>

              <button
                type="button"
                onClick={() => setDrawMode('obstacle')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  drawMode === 'obstacle'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Shield size={14} />
                <span>Mark Obstacles ({obstacles.length} placed)</span>
              </button>
            </div>

            {/* Drawing Actions: Undo, Close, Clear */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-1 rounded-xl shadow-xl text-xs">
              <button
                type="button"
                onClick={handleUndoVertex}
                disabled={drawMode === 'roof' ? roofVertices.length === 0 : activeObstacleVertices.length === 0}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                title="Undo last placed vertex"
              >
                <Undo2 size={13} />
                <span>Undo</span>
              </button>

              <button
                type="button"
                onClick={handleClosePolygon}
                disabled={
                  drawMode === 'roof'
                    ? roofVertices.length < 3 || isRoofClosed
                    : activeObstacleVertices.length < 3
                }
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 disabled:cursor-not-allowed font-medium transition cursor-pointer shadow-sm"
                title="Close polygon outline"
              >
                <CheckCircle2 size={13} />
                <span>Close {drawMode === 'roof' ? 'Roof' : 'Obstacle'}</span>
              </button>

              <button
                type="button"
                onClick={handleClear}
                disabled={drawMode === 'roof' ? roofVertices.length === 0 : activeObstacleVertices.length === 0}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-rose-400 hover:bg-rose-950/50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                title="Clear vertices"
              >
                <Trash2 size={13} />
              </button>
            </div>

            {/* Google Solar AI Building Detected Notification */}
            {solarBuildingBounds && (
              <div className="rounded-xl bg-slate-900/90 backdrop-blur-md border border-indigo-500/40 p-2.5 shadow-xl max-w-xs text-xs">
                <div className="flex items-center gap-1.5 text-indigo-400 font-bold mb-1">
                  <Sparkles size={14} />
                  <span>Google Solar Building Detected</span>
                </div>
                <p className="text-2xs text-slate-300 mb-2 leading-relaxed">
                  Potential for {solarBuildingBounds.panelCapacity} panels. Use official building bounding box as outline?
                </p>
                <button
                  type="button"
                  onClick={handleApplySolarBounds}
                  className="w-full py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-2xs font-semibold transition cursor-pointer"
                >
                  Apply Building Outline
                </button>
              </div>
            )}
          </div>

          {/* Sane Area Warning Overlay */}
          {liveMetrics.grossAreaM2 > 50000 && (
            <div className="absolute bottom-4 left-4 z-10 bg-amber-950/90 border border-amber-600 rounded-xl p-3 text-xs text-amber-200 max-w-sm flex items-start gap-2 shadow-xl">
              <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <span>
                Selected area ({liveMetrics.grossAreaM2} m²) is very large. Large commercial campuses may experience degraded 3D model fidelity with Meshy AI.
              </span>
            </div>
          )}

          {searchError && (
            <div className="absolute top-16 right-4 z-10 bg-rose-950/90 border border-rose-600 rounded-xl p-3 text-xs text-rose-200 max-w-xs flex items-center justify-between shadow-xl">
              <span>{searchError}</span>
              <button type="button" onClick={() => setSearchError('')} className="ml-2 text-rose-400 hover:text-white">
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        {/* ─── RIGHT CAD PANEL / METRICS & 3D VIEWER ─── */}
        <div className="w-full lg:w-96 bg-slate-900 border-l border-slate-800 flex flex-col h-auto lg:h-full overflow-y-auto">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Building2 size={16} className="text-blue-400" />
              <span>Measured Geometry</span>
            </h2>
            <span className="text-2xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full font-semibold border border-blue-500/30">
              Turf.js Verified
            </span>
          </div>

          {/* Metrics Grid */}
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-2xs font-medium">Gross Roof Area</span>
                <p className="text-lg font-bold text-white mt-0.5">
                  {liveMetrics.grossAreaM2} <span className="text-xs text-slate-400 font-normal">m²</span>
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-2xs font-medium">Usable Area</span>
                <p className="text-lg font-bold text-emerald-400 mt-0.5">
                  {liveMetrics.netUsableAreaM2} <span className="text-xs text-slate-400 font-normal">m²</span>
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-2xs font-medium">Perimeter</span>
                <p className="text-sm font-semibold text-white mt-0.5">
                  {liveMetrics.perimeterMeters} <span className="text-xs text-slate-400 font-normal">m</span>
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-2xs font-medium">Estimated Panels</span>
                <p className="text-sm font-semibold text-blue-400 mt-0.5">
                  ~{liveMetrics.estimatedPanels} <span className="text-xs text-slate-400 font-normal">modules</span>
                </p>
              </div>
            </div>

            {/* Minimum Rotated Rectangle Metrics */}
            {liveMetrics.minRotatedRect && liveMetrics.minRotatedRect.widthMeters > 0 && (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-400 text-2xs font-medium uppercase tracking-wider">
                  Minimum Rotated Rectangle
                </span>
                <div className="flex items-center justify-between mt-1 text-slate-200">
                  <span>Width × Depth:</span>
                  <span className="font-semibold text-white">
                    {liveMetrics.minRotatedRect.widthMeters}m × {liveMetrics.minRotatedRect.heightMeters}m
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1 text-slate-400 text-2xs">
                  <span>Dominant Bearing:</span>
                  <span>{liveMetrics.minRotatedRect.bearingDeg}°</span>
                </div>
              </div>
            )}

            {/* Obstacles List */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-2xs font-medium uppercase tracking-wider">
                  Obstacles / Exclusion Zones ({obstacles.length})
                </span>
                <span className="text-2xs text-rose-400 font-medium">0.5m setback applied</span>
              </div>
              {obstacles.length === 0 ? (
                <p className="text-2xs text-slate-500 italic">
                  No obstacles marked. Use &apos;Mark Obstacles&apos; tool to outline AC units, tanks, or stairwells.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {obstacles.map((obs, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-1.5 bg-slate-900 rounded border border-slate-800 text-2xs"
                    >
                      <span className="text-slate-300 font-medium">Obstacle #{idx + 1} ({obs.length} vertices)</span>
                      <button
                        type="button"
                        onClick={() => setObstacles((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-rose-400 hover:text-rose-300 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(true)}
                disabled={roofVertices.length < 3}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Sparkles size={16} className="text-amber-300" />
                <span>Generate 3D Model (Meshy AI)</span>
              </button>

              <button
                type="button"
                onClick={handleOpenPanelOptimizer}
                disabled={roofVertices.length < 3}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>Open AI Panel Optimizer</span>
                <ArrowRight size={15} />
              </button>
            </div>

            {/* Interactive 3D Viewer Container (Phase 3 Integration) */}
            <div className="mt-4 pt-4 border-t border-slate-800">
              <Model3DCanvas
                job={activeJob}
                polygonCoordinates={roofVertices}
                obstacles={obstacles}
                minRotatedRect={liveMetrics.minRotatedRect}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── MESHY AI GENERATION CONFIRMATION MODAL ─── */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsConfirmModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2.5 text-blue-400 font-bold text-base mb-2">
              <Sparkles size={20} className="text-amber-400" />
              <span>Generate 3D Rooftop Mesh</span>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Meshy AI will convert your top-down rooftop satellite perspective into an interactive 3D mesh model.
            </p>

            {/* Credit Cost Box */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 mb-4 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Estimated Credit Cost:</span>
                <span className="font-bold text-amber-400">~5–10 credits</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Target Polycount:</span>
                <span className="text-slate-200">60,000 triangles</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Engine:</span>
                <span className="text-slate-200">Meshy 7.1 Flagship</span>
              </div>
            </div>

            {/* Imagery Source Choice (Google Static vs Uploaded Aerial) */}
            <div className="space-y-2 mb-5 text-xs">
              <span className="text-slate-400 font-medium">Imagery Source:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPhotoSourceMode('google')}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${
                    photoSourceMode === 'google'
                      ? 'border-blue-500 bg-blue-950/30 text-white'
                      : 'border-slate-800 bg-slate-950 text-slate-400'
                  }`}
                >
                  <p className="font-semibold text-2xs">Top-Down Satellite</p>
                  <p className="text-3xs text-slate-400 mt-0.5">Automated map capture</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPhotoSourceMode('upload')}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${
                    photoSourceMode === 'upload'
                      ? 'border-blue-500 bg-blue-950/30 text-white'
                      : 'border-slate-800 bg-slate-950 text-slate-400'
                  }`}
                >
                  <p className="font-semibold text-2xs">Custom Drone / Photo</p>
                  <p className="text-3xs text-slate-400 mt-0.5">Upload personal file</p>
                </button>
              </div>

              {photoSourceMode === 'upload' && (
                <div className="mt-2 p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-slate-500 transition">
                    <UploadCloud size={20} className="text-slate-400 mb-1" />
                    <span className="text-2xs text-slate-300 font-medium">
                      {uploadedPhotoFile ? uploadedPhotoFile.name : 'Select aerial photo (max 20MB)'}
                    </span>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                </div>
              )}
            </div>

            {jobError && (
              <div className="mb-4 p-2.5 bg-rose-950/80 border border-rose-700 rounded-lg text-rose-200 text-xs">
                {jobError}
              </div>
            )}

            <button
              type="button"
              onClick={handleStartMeshyGeneration}
              disabled={isGenerating}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              <span>{isGenerating ? 'Initiating Task...' : 'Confirm & Generate Model'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
