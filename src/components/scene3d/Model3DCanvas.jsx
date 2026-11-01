import React, { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Center } from '@react-three/drei';
import * as THREE from 'three';
import * as turf from '@turf/turf';
import {
  AlertCircle,
  Eye,
  EyeOff,
  Info,
  Loader2
} from 'lucide-react';
import { model3dService } from '../../services/model3dService';

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

const EARTH_RADIUS = 6371000.0;

function gpsToLocalMeters(lat, lng, centerLat, centerLng) {
  const y = (lat - centerLat) * (Math.PI / 180.0) * EARTH_RADIUS;
  const x = (lng - centerLng) * (Math.PI / 180.0) * EARTH_RADIUS * Math.cos((centerLat * Math.PI) / 180.0);
  return { x, z: -y };
}

/**
 * Catches errors inside React Three Fiber 3D scene (must return Three elements)
 */
class SceneErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('3D Model component failed to load inside Canvas scene:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <group />;
    }
    return this.props.children;
  }
}

/**
 * Outer Error Boundary around Canvas (returns standard HTML)
 */
class CanvasErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('Canvas Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center w-full h-80 bg-slate-950 p-4 text-center">
            <AlertCircle size={28} className="text-amber-400 mb-2" />
            <span className="text-xs font-semibold text-white">3D Viewport Encountered an Issue</span>
            <span className="text-2xs text-slate-400 mt-1 max-w-sm">
              The 3D model could not be displayed, but your measured CAD geometry and panel optimization calculations remain completely intact.
            </span>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

/**
 * Loads and renders the GLB Model with user adjustment controls
 * Aligns roof surface to buildingHeight + elevation
 */
function GlbMeshModel({ url, scale, rotationDeg, elevation, buildingHeight = 3.5 }) {
  const { scene } = useGLTF(url);
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  return (
    <group
      position={[0, buildingHeight + elevation, 0]}
      rotation={[0, (rotationDeg * Math.PI) / 180, 0]}
      scale={[scale, scale, scale]}
    >
      <Center top>
        <primitive object={clonedScene} />
      </Center>
    </group>
  );
}

/**
 * Measured Rooftop Geometry & Extrusion Layer
 */
function MeasuredRooftopLayer({ localVertices, obstaclesLocal, buildingHeight = 3.5, elevation = 0 }) {
  // Construct 2D Three.Shape for the roof boundary
  // Note: Three.js ExtrudeGeometry rotated by [-Math.PI / 2, 0, 0] maps (u, v) -> (u, depth, -v).
  // Using v = -z ensures 3D Z = -(-z) = +z.
  const shape = useMemo(() => {
    if (localVertices.length < 3) return null;
    const s = new THREE.Shape();
    s.moveTo(localVertices[0].x, -localVertices[0].z);
    for (let i = 1; i < localVertices.length; i++) {
      s.lineTo(localVertices[i].x, -localVertices[i].z);
    }
    s.closePath();

    // Cut out obstacles as holes
    obstaclesLocal.forEach((obs) => {
      if (obs.length >= 3) {
        const hole = new THREE.Path();
        hole.moveTo(obs[0].x, -obs[0].z);
        for (let j = 1; j < obs.length; j++) {
          hole.lineTo(obs[j].x, -obs[j].z);
        }
        hole.closePath();
        s.holes.push(hole);
      }
    });

    return s;
  }, [localVertices, obstaclesLocal]);

  // Extrude settings for building envelope
  const extrudeSettings = useMemo(
    () => ({
      depth: buildingHeight,
      bevelEnabled: false,
    }),
    [buildingHeight]
  );

  if (!shape) return null;

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, elevation, 0]}>
      {/* Extruded building structure */}
      <mesh receiveShadow castShadow>
        <extrudeGeometry args={[shape, extrudeSettings]} />
        <meshStandardMaterial
          color="#334155"
          transparent
          opacity={0.65}
          roughness={0.4}
          metalness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Roof perimeter line directly on roof surface */}
      <lineLoop>
        <bufferGeometry
          attach="geometry"
          onUpdate={(geo) => {
            const points = [...localVertices, localVertices[0]].map(
              (p) => new THREE.Vector3(p.x, -p.z, buildingHeight + 0.02)
            );
            geo.setFromPoints(points);
          }}
        />
        <lineBasicMaterial color="#38BDF8" linewidth={3} />
      </lineLoop>

      {/* Obstacle boundaries */}
      {obstaclesLocal.map((obs, idx) => (
        <group key={idx}>
          <lineLoop>
            <bufferGeometry
              attach="geometry"
              onUpdate={(geo) => {
                const points = [...obs, obs[0]].map(
                  (p) => new THREE.Vector3(p.x, -p.z, buildingHeight + 0.03)
                );
                geo.setFromPoints(points);
              }}
            />
            <lineBasicMaterial color="#EF4444" linewidth={3} />
          </lineLoop>
        </group>
      ))}
    </group>
  );
}

/**
 * Measured Solar Panels Layout Layer
 * Places panels flat on the rooftop, rotated in the exact direction of the layout
 */
function SolarPanelsLayer({
  localVertices,
  obstaclesLocal,
  buildingHeight = 3.5,
  elevation = 0,
  customPanels = null,
  centerLat = 12.9716,
  centerLng = 77.5946,
  roofBearingDeg = 0
}) {
  const panelPlacements = useMemo(() => {
    // 1. If custom panels calculated by the AI Optimizer are provided, render exact coordinates and yaw angle
    if (customPanels && customPanels.length > 0) {
      return customPanels
        .map((p) => {
          if (!p.polygon || p.polygon.length < 4) return null;
          const corners3D = p.polygon.map(([lat, lng]) =>
            gpsToLocalMeters(lat, lng, centerLat, centerLng)
          );
          const cx = (corners3D[0].x + corners3D[1].x + corners3D[2].x + corners3D[3].x) / 4;
          const cz = (corners3D[0].z + corners3D[1].z + corners3D[2].z + corners3D[3].z) / 4;

          const dx = corners3D[1].x - corners3D[0].x;
          const dz = corners3D[1].z - corners3D[0].z;
          const angle = Math.atan2(dz, dx);
          const dimX = Math.hypot(dx, dz);

          const dx2 = corners3D[3].x - corners3D[0].x;
          const dz2 = corners3D[3].z - corners3D[0].z;
          const dimZ = Math.hypot(dx2, dz2);

          return {
            cx,
            cz,
            angle,
            dimX: dimX || 1.1,
            dimZ: dimZ || 2.1,
          };
        })
        .filter(Boolean);
    }

    // 2. Procedural grid fallback inside polygon aligned with roof angle
    if (localVertices.length < 3) return [];

    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    localVertices.forEach((p) => {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minZ = Math.min(minZ, p.z);
      maxZ = Math.max(maxZ, p.z);
    });

    const panels = [];
    const panelWidth = 2.0;
    const panelHeight = 1.0;
    const gap = 0.25;

    const isInsidePoly = (px, pz, poly) => {
      let inside = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const xi = poly[i].x, zi = poly[i].z;
        const xj = poly[j].x, zj = poly[j].z;
        const intersect = ((zi > pz) !== (zj > pz)) && (px < ((xj - xi) * (pz - zi)) / (zj - zi) + xi);
        if (intersect) inside = !inside;
      }
      return inside;
    };

    for (let x = minX + 1.0; x < maxX - 1.0; x += panelWidth + gap) {
      for (let z = minZ + 1.0; z < maxZ - 1.0; z += panelHeight + gap) {
        const corners = [
          { x: x - panelWidth / 2, z: z - panelHeight / 2 },
          { x: x + panelWidth / 2, z: z - panelHeight / 2 },
          { x: x + panelWidth / 2, z: z + panelHeight / 2 },
          { x: x - panelWidth / 2, z: z + panelHeight / 2 },
        ];

        const allInside = corners.every((c) => isInsidePoly(c.x, c.z, localVertices));
        if (!allInside) continue;

        let hitsObstacle = false;
        for (const obs of obstaclesLocal) {
          if (corners.some((c) => isInsidePoly(c.x, c.z, obs))) {
            hitsObstacle = true;
            break;
          }
        }

        if (!hitsObstacle) {
          panels.push({
            cx: x,
            cz: z,
            angle: -(roofBearingDeg * Math.PI) / 180,
            dimX: panelWidth,
            dimZ: panelHeight,
          });
        }
      }
    }

    return panels;
  }, [localVertices, obstaclesLocal, customPanels, centerLat, centerLng, roofBearingDeg]);

  return (
    <group position={[0, buildingHeight + elevation + 0.05, 0]}>
      {panelPlacements.map((panel, idx) => (
        <mesh
          key={idx}
          position={[panel.cx, 0, panel.cz]}
          rotation={[0, -panel.angle, 0]}
          castShadow
        >
          <boxGeometry args={[panel.dimX * 0.95, 0.04, panel.dimZ * 0.95]} />
          <meshStandardMaterial
            color="#1E3A8A"
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function Model3DCanvas({
  job,
  polygonCoordinates,
  obstacles = [],
  minRotatedRect = null,
  customPanels = null,
  buildingHeight = 3.5,
  canvasHeight = 'h-80',
  className = ''
}) {
  // Layer Toggles
  const [showAiModel, setShowAiModel] = useState(true);
  const [showMeasuredBoundary, setShowMeasuredBoundary] = useState(true);
  const [showPanelLayout, setShowPanelLayout] = useState(true);

  // Alignment Controls
  const [rotationDeg, setRotationDeg] = useState(0);
  const [scaleFactor, setScaleFactor] = useState(1.0);
  const [elevation, setElevation] = useState(0.0);

  // Model loading states & diagnostic tracking
  const [modelGlbUrl, setModelGlbUrl] = useState(null);
  const [modelStatus, setModelStatus] = useState('idle'); // 'idle' | 'generating' | 'downloading' | 'parsing' | 'ready' | 'error'
  const [modelError, setModelError] = useState(null);
  const [meshSizeMb, setMeshSizeMb] = useState(null);

  // Active geometry source badge resolution
  const activeGeometrySource = useMemo(() => {
    if (job?.status === 'SUCCEEDED' || modelStatus === 'ready') {
      const isMeshy = job?.consumedCredits > 0 || job?.meshyTaskId || (job?.modelUrl && job.modelUrl.includes('meshy'));
      if (isMeshy) {
        return {
          name: 'Meshy AI',
          badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          dotClass: 'bg-emerald-400',
          jobId: job?.id,
          credits: job?.consumedCredits || 30,
        };
      }
      return {
        name: 'Mock',
        badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        dotClass: 'bg-amber-400',
        jobId: job?.id,
        credits: 0,
      };
    }
    if (job?.status === 'IN_PROGRESS' || job?.status === 'PENDING') {
      return {
        name: 'Meshy AI (Generating)',
        badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
        dotClass: 'bg-blue-400 animate-ping',
        jobId: job?.id,
        credits: job?.consumedCredits || 0,
      };
    }
    return {
      name: 'Parametric',
      badgeClass: 'bg-slate-800/80 text-slate-300 border-slate-700',
      dotClass: 'bg-slate-400',
      jobId: null,
      credits: 0,
    };
  }, [job, modelStatus]);

  // Robust Authenticated GLB Download & Blob URL Generation
  const loadGlbModel = useCallback(async (jobToLoad) => {
    if (!jobToLoad || (!jobToLoad.id && !jobToLoad.modelUrl)) return null;
    setModelError(null);
    setModelStatus('downloading');

    try {
      const targetUrl = jobToLoad.modelUrl || model3dService.getModelUrl(jobToLoad.id);
      const token = getStoredAuth()?.token;

      console.info(`[Model3DCanvas] Requesting GLB for Job #${jobToLoad.id || 'direct'} from: ${targetUrl}`);
      const res = await fetch(targetUrl, {
        headers: (!jobToLoad.modelUrl && token) ? { Authorization: `Bearer ${token}` } : {},
      });

      console.info(`[Model3DCanvas] GLB Response: HTTP ${res.status} ${res.statusText}, Content-Type: ${res.headers.get('content-type')}`);
      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        throw new Error(`Server returned HTTP ${res.status} (${res.statusText}): ${errorText || 'Failed to download model'}`);
      }

      const cl = res.headers.get('content-length');
      if (cl) {
        setMeshSizeMb((parseInt(cl, 10) / (1024 * 1024)).toFixed(1));
      }

      const blob = await res.blob();
      console.info(`[Model3DCanvas] Downloaded GLB Blob: ${blob.size} bytes (${(blob.size / 1024 / 1024).toFixed(2)} MB)`);
      const blobUrl = URL.createObjectURL(blob);
      setModelGlbUrl(blobUrl);
      setModelStatus('ready');
      return blobUrl;
    } catch (err) {
      console.error('[Model3DCanvas] Failed to download or process GLB model:', err);
      setModelError(err.message || 'Network error while retrieving GLB model.');
      setModelStatus('error');
      setModelGlbUrl(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let active = true;
    let blobUrlToRevoke = null;

    if (job?.status === 'SUCCEEDED') {
      loadGlbModel(job).then((url) => {
        if (active && url) {
          blobUrlToRevoke = url;
        } else if (url) {
          URL.revokeObjectURL(url);
        }
      });
    } else if (job?.status === 'IN_PROGRESS' || job?.status === 'PENDING') {
      setModelStatus('generating');
      setModelGlbUrl(null);
    } else if (job?.status === 'FAILED') {
      setModelStatus('error');
      setModelError(job.errorMessage || 'Meshy 3D generation failed on backend.');
      setModelGlbUrl(null);
    } else {
      setModelStatus('idle');
      setModelGlbUrl(null);
    }

    return () => {
      active = false;
      if (blobUrlToRevoke) {
        URL.revokeObjectURL(blobUrlToRevoke);
      }
    };
  }, [job, loadGlbModel]);

  // Dynamically calculate minimum rotated rectangle if not passed in props
  const effectiveMinRotatedRect = useMemo(() => {
    if (minRotatedRect && minRotatedRect.widthMeters > 0) {
      return minRotatedRect;
    }
    if (!polygonCoordinates || polygonCoordinates.length < 3) return null;

    try {
      const closed = [...polygonCoordinates, polygonCoordinates[0]].map(([lat, lng]) => [lng, lat]);
      const polyFeature = turf.polygon([closed]);

      let minArea = Infinity;
      let bestWidth = 0;
      let bestHeight = 0;
      let bestBearing = 0;

      for (let angle = 0; angle < 90; angle += 5) {
        const rotated = turf.transformRotate(polyFeature, angle);
        const bbox = turf.bbox(rotated);
        const w = turf.distance([bbox[0], bbox[1]], [bbox[2], bbox[1]], { units: 'meters' });
        const h = turf.distance([bbox[0], bbox[1]], [bbox[0], bbox[3]], { units: 'meters' });
        const area = w * h;
        if (area < minArea) {
          minArea = area;
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
    } catch {
      return null;
    }
  }, [minRotatedRect, polygonCoordinates]);

  // Auto-align default footprint to match minimum rotated rectangle
  useEffect(() => {
    if (effectiveMinRotatedRect && effectiveMinRotatedRect.widthMeters > 0) {
      const dominantDimension = Math.max(effectiveMinRotatedRect.widthMeters, effectiveMinRotatedRect.heightMeters);
      // Mock building placeholder has width = 50m; scale so it matches the roof dominant dimension
      const computedScale = Math.max(0.2, Math.min(10.0, dominantDimension / 50.0));
      setScaleFactor(parseFloat(computedScale.toFixed(2)));
      if (effectiveMinRotatedRect.bearingDeg != null) {
        setRotationDeg(Math.round(effectiveMinRotatedRect.bearingDeg));
      }
    }
  }, [effectiveMinRotatedRect]);

  // Centroid reference
  const centerLat = useMemo(() => {
    if (!polygonCoordinates || polygonCoordinates.length === 0) return 12.9716;
    return polygonCoordinates.reduce((s, p) => s + p[0], 0) / polygonCoordinates.length;
  }, [polygonCoordinates]);

  const centerLng = useMemo(() => {
    if (!polygonCoordinates || polygonCoordinates.length === 0) return 77.5946;
    return polygonCoordinates.reduce((s, p) => s + p[1], 0) / polygonCoordinates.length;
  }, [polygonCoordinates]);

  // Convert polygon vertices to local metric coordinates
  const localVertices = useMemo(() => {
    if (!polygonCoordinates || polygonCoordinates.length < 3) return [];
    return polygonCoordinates.map(([lat, lng]) => gpsToLocalMeters(lat, lng, centerLat, centerLng));
  }, [polygonCoordinates, centerLat, centerLng]);

  // Convert obstacles to local metric coordinates
  const obstaclesLocal = useMemo(() => {
    if (!obstacles || obstacles.length === 0) return [];
    return obstacles.map((obs) =>
      obs.map(([lat, lng]) => gpsToLocalMeters(lat, lng, centerLat, centerLng))
    );
  }, [obstacles, centerLat, centerLng]);

  return (
    <div className={`flex flex-col bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl ${className}`}>
      {/* ─── MANDATORY AI DISCLAIMER BANNER ─── */}
      <div className="bg-blue-950/80 border-b border-blue-800/80 px-3.5 py-2 flex items-start gap-2 text-2xs text-blue-200">
        <Info size={14} className="text-blue-400 shrink-0 mt-0.5" />
        <span className="leading-snug">
          <strong>AI-generated visual model.</strong> Panel counts and layout placement come strictly from measured roof geometry.
        </span>
      </div>

      {/* ─── 3D VIEWPORT CANVAS ─── */}
      <div className={`relative w-full ${canvasHeight} bg-gradient-to-b from-slate-900 to-slate-950`}>
        <CanvasErrorBoundary>
          <Canvas
            camera={{ position: [0, 35, 45], fov: 45 }}
            shadows
            className="w-full h-full"
          >
            <ambientLight intensity={0.9} />
            <directionalLight
              position={[25, 45, 25]}
              intensity={1.5}
              castShadow
              shadow-mapSize-width={1024}
              shadow-mapSize-height={1024}
            />
            <gridHelper args={[100, 100, '#334155', '#1e293b']} position={[0, -0.01, 0]} />

            <OrbitControls makeDefault enableDamping dampingFactor={0.05} />

            {/* Layer 1: AI Generated Model (Protected with SceneErrorBoundary) */}
            {showAiModel && modelGlbUrl && (
              <SceneErrorBoundary fallback={<group />}>
                <Suspense fallback={null}>
                  <GlbMeshModel
                    url={modelGlbUrl}
                    scale={scaleFactor}
                    rotationDeg={rotationDeg}
                    elevation={elevation}
                    buildingHeight={buildingHeight}
                  />
                </Suspense>
              </SceneErrorBoundary>
            )}

            {/* Layer 2: Measured Roof Boundary & Obstacles */}
            {showMeasuredBoundary && (
              <MeasuredRooftopLayer
                localVertices={localVertices}
                obstaclesLocal={obstaclesLocal}
                buildingHeight={buildingHeight}
                elevation={elevation}
              />
            )}

            {/* Layer 3: Measured Solar Panel Layout (Synchronized with AI Panel Optimizer) */}
            {showPanelLayout && (
              <SolarPanelsLayer
                localVertices={localVertices}
                obstaclesLocal={obstaclesLocal}
                buildingHeight={buildingHeight}
                elevation={elevation}
                customPanels={customPanels}
                centerLat={centerLat}
                centerLng={centerLng}
                roofBearingDeg={effectiveMinRotatedRect?.bearingDeg || 0}
              />
            )}
          </Canvas>
        </CanvasErrorBoundary>

        {/* Active Geometry Source Badge (Master Prompt Phase 7 Requirement 5) */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-auto">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border backdrop-blur-md shadow-xl text-xs font-semibold ${activeGeometrySource.badgeClass}`}>
            <span className={`w-2 h-2 rounded-full ${activeGeometrySource.dotClass}`} />
            <span>Source: <strong>{activeGeometrySource.name}</strong></span>
            {activeGeometrySource.jobId && (
              <span className="opacity-90 text-2xs bg-black/40 px-1.5 py-0.5 rounded font-mono">
                Job #{activeGeometrySource.jobId}
              </span>
            )}
            <span className="opacity-90 text-2xs bg-black/40 px-1.5 py-0.5 rounded font-mono">
              {activeGeometrySource.credits} cr
            </span>
            {meshSizeMb && modelStatus === 'ready' && (
              <span className="opacity-90 text-2xs bg-black/40 px-1.5 py-0.5 rounded font-mono">
                {meshSizeMb} MB
              </span>
            )}
          </div>

          {modelStatus === 'downloading' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-950/80 border border-blue-800 text-blue-300 text-2xs backdrop-blur-md">
              <Loader2 size={12} className="animate-spin text-blue-400" />
              <span>Streaming GLB mesh from CDN...</span>
            </div>
          )}

          {modelStatus === 'error' && (
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-red-950/90 border border-red-800 text-red-200 text-2xs shadow-lg backdrop-blur-md max-w-sm">
              <AlertCircle size={14} className="text-red-400 shrink-0" />
              <span className="truncate">{modelError}</span>
              <button
                type="button"
                onClick={() => loadGlbModel(job)}
                className="ml-auto underline text-red-300 hover:text-white font-bold cursor-pointer shrink-0"
              >
                Retry
              </button>
            </div>
          )}
        </div>

        {/* Loading Progress Overlay */}
        {job && job.status === 'IN_PROGRESS' && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center p-4">
            <Loader2 size={32} className="animate-spin text-blue-500 mb-2" />
            <span className="text-xs font-semibold text-white">Generating 3D Mesh with Meshy 7.1...</span>
            <div className="w-48 bg-slate-800 rounded-full h-2 mt-3 overflow-hidden border border-slate-700">
              <div
                className="bg-blue-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${job.progress || 10}%` }}
              />
            </div>
            <span className="text-2xs text-slate-400 mt-1">{job.progress || 10}% complete</span>
          </div>
        )}

        {/* Layer Toggles Floating HUD */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-2 rounded-xl text-2xs shadow-xl">
          <span className="text-slate-400 font-semibold px-1">Layers</span>
          <button
            type="button"
            onClick={() => setShowAiModel((p) => !p)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded transition cursor-pointer ${
              showAiModel ? 'bg-blue-600/30 text-blue-300 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            {showAiModel ? <Eye size={12} /> : <EyeOff size={12} />}
            <span>Realistic Model (AI)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowMeasuredBoundary((p) => !p)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded transition cursor-pointer ${
              showMeasuredBoundary ? 'bg-blue-600/30 text-blue-300 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            {showMeasuredBoundary ? <Eye size={12} /> : <EyeOff size={12} />}
            <span>Roof Boundary (Measured)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPanelLayout((p) => !p)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded transition cursor-pointer ${
              showPanelLayout ? 'bg-blue-600/30 text-blue-300 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            {showPanelLayout ? <Eye size={12} /> : <EyeOff size={12} />}
            <span>Panel Layout (Measured)</span>
          </button>
        </div>
      </div>

      {/* ─── FINE-TUNING ALIGNMENT CONTROLS ─── */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 text-2xs space-y-2">
        <span className="text-slate-400 font-semibold uppercase tracking-wider block">
          Visual Alignment Tuning
        </span>

        <div className="grid grid-cols-3 gap-2">
          {/* Rotation Control */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-slate-300">
              <span>Rotation</span>
              <span>{rotationDeg}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              value={rotationDeg}
              onChange={(e) => setRotationDeg(Number(e.target.value))}
              className="accent-blue-500 h-1 bg-slate-800 rounded cursor-pointer"
            />
          </div>

          {/* Scale Control */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-slate-300">
              <span>Scale</span>
              <span>{scaleFactor.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="4.0"
              step="0.05"
              value={scaleFactor}
              onChange={(e) => setScaleFactor(Number(e.target.value))}
              className="accent-blue-500 h-1 bg-slate-800 rounded cursor-pointer"
            />
          </div>

          {/* Elevation Control */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-slate-300">
              <span>Elevation</span>
              <span>{elevation.toFixed(1)}m</span>
            </div>
            <input
              type="range"
              min="-5"
              max="15"
              step="0.2"
              value={elevation}
              onChange={(e) => setElevation(Number(e.target.value))}
              className="accent-blue-500 h-1 bg-slate-800 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
