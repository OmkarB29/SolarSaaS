import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Canvas } from '@react-three/fiber';
import {
  OrbitControls,
  Environment,
  Grid,
  PerspectiveCamera,
  Html,
  GizmoHelper,
  GizmoViewport,
  Stats,
} from '@react-three/drei';
import { Vector3 } from 'three';
import {
  Sun,
  RefreshCw,
  AlertCircle,
  Cpu,
  Layers,
  Box,
  Maximize2,
  Info,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { BuildingMesh, RoofPlane, SolarPanelMesh } from '../components/scene3d/BuildingScene3D';
import { buildScene3D } from '../services/scene3DService';

/* ─── helpers ─── */
const getStoredRooftop = () => {
  try { return JSON.parse(localStorage.getItem('solarscope.rooftop')); } catch { return null; }
};
const getStoredAnalysis = () => {
  try { return JSON.parse(localStorage.getItem('latestAnalysis')); } catch { return null; }
};
const normalizePolygon = (poly) => {
  if (!poly || !Array.isArray(poly)) return null;
  if (typeof poly === 'string') { try { poly = JSON.parse(poly); } catch { return null; } }
  return poly.map((pt) => {
    if (Array.isArray(pt)) return [Number(pt[0]), Number(pt[1])];
    if (pt && typeof pt === 'object') return [Number(pt.lat ?? pt.latitude ?? 0), Number(pt.lng ?? pt.longitude ?? 0)];
    return [0, 0];
  }).filter((pt) => !isNaN(pt[0]) && !isNaN(pt[1]) && (pt[0] !== 0 || pt[1] !== 0));
};

const normalizePanels = (panels) => {
  if (!panels || !Array.isArray(panels)) return [];
  return panels.map((p, i) => {
    const pNumber = p.panelNumber || i + 1;
    const center = p.centerLat && p.centerLng
      ? { lat: p.centerLat, lng: p.centerLng }
      : (p.center || null);
    const corners = (p.polygon || p.corners || []).map((c) => {
      if (Array.isArray(c)) return { lat: c[0], lng: c[1] };
      if (c && typeof c === 'object' && 'lat' in c) return c;
      if (c && typeof c === 'object') return { lat: c[0] ?? 0, lng: c[1] ?? 0 };
      return { lat: 0, lng: 0 };
    });
    return {
      panelNumber: pNumber,
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
};

/* ─── Scene inner with R3F context ─── */
const SceneContent = ({ sceneData, showPanels, buildingHeight, onPanelHover }) => {
  const cameraRef = useRef();

  const cameraTarget = useMemo(() => {
    if (!sceneData?.buildingFootprint?.length) return new Vector3(0, 0, 0);
    const cx = sceneData.buildingFootprint.reduce((s, p) => s + p.x, 0) / sceneData.buildingFootprint.length;
    const cz = sceneData.buildingFootprint.reduce((s, p) => s + p.z, 0) / sceneData.buildingFootprint.length;
    return new Vector3(cx, 0, cz);
  }, [sceneData]);

  const cameraPos = useMemo(() => {
    const r = (sceneData?.sceneBoundingRadiusMeters || 40) * 1.6;
    return new Vector3(r * 0.9, r * 1.1, r * 0.9);
  }, [sceneData]);

  return (
    <>
      <PerspectiveCamera ref={cameraRef} makeDefault position={cameraPos} fov={45} near={0.1} far={5000} />
      <OrbitControls
        target={cameraTarget}
        enableDamping
        dampingFactor={0.08}
        maxPolarAngle={Math.PI / 2 - 0.05}
        minDistance={5}
        maxDistance={1000}
      />

      {/* Lighting */}
      <ambientLight intensity={0.55} color="#e0e8ff" />
      <directionalLight
        position={[80, 120, 60]}
        intensity={2.2}
        color="#fff8e8"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={500}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
      />
      <directionalLight position={[-60, 40, -40]} intensity={0.4} color="#c8d8ff" />
      <hemisphereLight skyColor="#dbe9ff" groundColor="#c8b88a" intensity={0.5} />

      {/* Ground Grid */}
      <Grid
        args={[500, 500]}
        position={[0, -0.01, 0]}
        cellSize={1}
        cellThickness={0.3}
        cellColor="#94a3b8"
        sectionSize={10}
        sectionThickness={0.8}
        sectionColor="#64748b"
        fadeDistance={250}
        fadeStrength={1.0}
        followCamera={false}
        infiniteGrid
      />

      {/* Building */}
      {sceneData?.buildingFootprint && (
        <>
          <BuildingMesh footprint={sceneData.buildingFootprint} height={buildingHeight} />
          <RoofPlane footprint={sceneData.buildingFootprint} height={buildingHeight} />
        </>
      )}

      {/* Solar Panel Array */}
      {showPanels && sceneData?.panels?.map((panel) => (
        <SolarPanelMesh
          key={panel.panelNumber}
          panel={panel}
          onHover={onPanelHover}
        />
      ))}

      {/* Environment for realistic PBR reflections */}
      <Suspense fallback={null}>
        <Environment preset="city" />
      </Suspense>

      {/* Orientation gizmo */}
      <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
        <GizmoViewport axisColors={['#ef4444', '#22c55e', '#3b82f6']} labelColor="white" />
      </GizmoHelper>
    </>
  );
};

/* ─── Hover tooltip rendered inside canvas via Html ─── */
const PanelTooltip = ({ panel }) => {
  if (!panel) return null;
  return (
    <Html
      position={[
        panel.center?.x ?? 0,
        (panel.center?.y ?? 0) + 1.5,
        panel.center?.z ?? 0,
      ]}
      center
      occlude
    >
      <div className="pointer-events-none bg-slate-900/95 text-white text-xs rounded-xl px-3 py-2 shadow-xl border border-blue-500/30 min-w-[130px]">
        <p className="font-bold text-blue-400 mb-1">Panel #{panel.panelNumber}</p>
        <p className="text-slate-300">{panel.powerWatts}W • {panel.orientation}</p>
        <p className="text-slate-400">{panel.widthMeters}m × {panel.lengthMeters}m</p>
        <p className="text-slate-400">Az: {panel.azimuthDegrees}°</p>
      </div>
    </Html>
  );
};

/* ─── Main Page Component ─── */
const ModelView3D = () => {
  const [sceneData, setSceneData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPanels, setShowPanels] = useState(true);
  const [buildingHeight, setBuildingHeight] = useState(4.0);
  const [showStats, setShowStats] = useState(false);
  const [hoveredPanel, setHoveredPanel] = useState(null);
  const [sourceRooftop, setSourceRooftop] = useState(null);

  const rooftop = getStoredRooftop() || getStoredAnalysis();

  const loadScene = useCallback(async () => {
    const rooftopData = getStoredRooftop() || getStoredAnalysis();
    if (!rooftopData) {
      setError('No rooftop boundary detected. Please draw your rooftop on the Map Selection page first.');
      return;
    }

    setSourceRooftop(rooftopData);

    const rawCoords = rooftopData.polygonCoordinates || rooftopData.polygonCoordinatesJson;
    const polygon = normalizePolygon(typeof rawCoords === 'string' ? JSON.parse(rawCoords) : rawCoords);

    if (!polygon || polygon.length < 3) {
      setError('Invalid rooftop coordinates. Please re-draw your rooftop boundary on the Map page.');
      return;
    }

    // Collect panels from optimized layouts if present
    const analysisData = getStoredAnalysis();
    const solarPanels = rooftopData.googleSolarData?.panels
      || analysisData?.panels
      || [];

    setIsLoading(true);
    setError('');

    try {
      const payload = {
        polygonCoordinates: polygon,
        panels: normalizePanels(solarPanels),
        buildingHeightMeters: buildingHeight,
        layoutMode: analysisData?.layoutMode || 'BALANCED',
        address: rooftopData.address || rooftopData.location || 'Solar Installation Site',
        roofAreaM2: rooftopData.roofArea || rooftopData.area || 0,
        systemCapacityKw: analysisData?.systemCapacityKw || analysisData?.systemSize || 0,
      };

      const scene = await buildScene3D(payload);
      setSceneData(scene);
    } catch (err) {
      setError(err.message || 'Failed to build 3D scene.');
    } finally {
      setIsLoading(false);
    }
  }, [buildingHeight]);

  // Auto-load on mount; reload when storage changes
  useEffect(() => {
    loadScene();
    const handleUpdate = () => loadScene();
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('solarscope:analysis-updated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('solarscope:analysis-updated', handleUpdate);
    };
  }, [loadScene]);

  // Rebuild when height slider changes
  useEffect(() => {
    if (sceneData) loadScene();
  }, [buildingHeight]);

  return (
    <div className="flex flex-col h-full space-y-4 pb-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900">3D Model View</h1>
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-purple-500/10 text-purple-700 px-2.5 py-1 rounded-full border border-purple-500/20">
              <Box size={13} className="text-purple-600" />
              React Three Fiber · WebGL 2.0
            </span>
          </div>
          <p className="text-slate-500 mt-1 text-sm">
            Interactive 3D extrusion of your rooftop with the active solar panel array overlay.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <button
            type="button"
            onClick={() => setShowStats((s) => !s)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Info size={14} />
            {showStats ? 'Hide Stats' : 'FPS Stats'}
          </button>

          <button
            type="button"
            onClick={loadScene}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            {isLoading ? 'Building...' : 'Rebuild Scene'}
          </button>
        </div>
      </div>

      {/* Alert banners */}
      {error && (
        <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-amber-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Link to="/map" className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 hover:underline shrink-0">
            <span>Go to Map</span>
            <ChevronRight size={13} />
          </Link>
        </div>
      )}

      {/* Main Grid: Sidebar + Canvas */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5 flex-1 min-h-0">
        {/* Controls sidebar */}
        <div className="xl:col-span-1 flex flex-col gap-4">
          {/* Scene status */}
          {sceneData && (
            <Card className="p-4 space-y-3">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Scene Info</p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Address</span>
                  <span className="font-semibold text-slate-800 text-right max-w-[120px] truncate">{sceneData.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Roof Area</span>
                  <span className="font-semibold text-slate-800">{sceneData.roofAreaM2?.toLocaleString('en-IN')} m²</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Panels</span>
                  <span className="font-bold text-blue-700">{sceneData.panelCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Capacity</span>
                  <span className="font-semibold text-slate-800">{sceneData.systemCapacityKw?.toFixed(1)} kW</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Layout</span>
                  <span className="font-semibold text-purple-700">{sceneData.layoutMode}</span>
                </div>
              </div>
            </Card>
          )}

          {/* Building Height Slider */}
          <Card className="p-4 space-y-3">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Building Height</p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Extrusion</span>
                <span className="font-bold text-slate-900 font-mono">{buildingHeight.toFixed(1)} m</span>
              </div>
              <input
                type="range"
                min="2" max="20" step="0.5"
                value={buildingHeight}
                onChange={(e) => setBuildingHeight(Number(e.target.value))}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-purple-600 bg-slate-200"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>2m (single)</span>
                <span>20m (multi)</span>
              </div>
            </div>
          </Card>

          {/* Layer visibility */}
          <Card className="p-4 space-y-3">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Layers</p>
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Layers size={14} className="text-blue-500" />
                <span className="text-xs font-semibold text-slate-700">Solar Panels</span>
              </div>
              <input
                type="checkbox"
                checked={showPanels}
                onChange={(e) => setShowPanels(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
              />
            </label>
          </Card>

          {/* Controls reference */}
          <Card className="p-4 space-y-2">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Controls</p>
            <div className="space-y-1.5 text-[11px] text-slate-500">
              <p>🖱️ <strong>Left drag</strong> — Orbit / Rotate</p>
              <p>🖱️ <strong>Right drag</strong> — Pan view</p>
              <p>🖱️ <strong>Scroll</strong> — Zoom in / out</p>
              <p>👆 <strong>Hover panel</strong> — Panel details</p>
              <p>📱 <strong>Two fingers</strong> — Pinch zoom</p>
            </div>
          </Card>

          {/* Empty state CTA */}
          {!sceneData && !isLoading && !error && (
            <Link to="/map" className="group flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-3 text-sm font-bold text-white shadow-md transition-all">
              <Cpu size={16} />
              Draw Rooftop First
              <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </div>

        {/* Three.js Canvas */}
        <Card className="xl:col-span-4 p-0 overflow-hidden relative" style={{ minHeight: '560px' }}>
          {isLoading && (
            <div className="absolute inset-0 bg-slate-900/60 z-10 flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center animate-pulse">
                <Box size={24} className="text-purple-400" />
              </div>
              <p className="text-white font-semibold text-sm">Building 3D scene…</p>
              <p className="text-slate-400 text-xs">Projecting GPS coordinates to Three.js local space</p>
            </div>
          )}

          {!sceneData && !isLoading ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-center p-12 bg-slate-950" style={{ minHeight: '560px' }}>
              <div className="w-16 h-16 rounded-2xl bg-purple-500/15 flex items-center justify-center">
                <Box size={32} className="text-purple-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">No 3D Scene Available</h3>
                <p className="text-slate-400 text-xs mt-1 max-w-xs">
                  Draw your rooftop on the Map Selection page to auto-generate the 3D model.
                </p>
              </div>
              <Link to="/map" className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all">
                <Cpu size={13} />
                Go to Map Selection
              </Link>
            </div>
          ) : sceneData ? (
            <Canvas
              shadows
              dpr={[1, 2]}
              className="w-full h-full"
              style={{ minHeight: '560px', background: 'linear-gradient(to bottom, #0f172a, #1e293b)' }}
              onCreated={({ gl }) => {
                gl.shadowMap.enabled = true;
              }}
            >
              {showStats && <Stats />}

              <Suspense fallback={null}>
                <SceneContent
                  sceneData={sceneData}
                  showPanels={showPanels}
                  buildingHeight={sceneData.buildingHeightMeters || buildingHeight}
                  onPanelHover={setHoveredPanel}
                />
                {hoveredPanel && <PanelTooltip panel={hoveredPanel} />}
              </Suspense>
            </Canvas>
          ) : null}

          {/* Corner watermark */}
          <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-lg backdrop-blur-sm border border-slate-700">
            <Sun size={12} className="text-amber-400" />
            <span className="text-[10px] font-bold text-slate-300 tracking-wide">SolarScope 3D</span>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ModelView3D;
