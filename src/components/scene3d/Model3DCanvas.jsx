import React, { useState, useMemo, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Center } from '@react-three/drei';
import * as THREE from 'three';
import {
  Layers,
  RotateCw,
  Maximize2,
  MoveUp,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Info,
  Loader2
} from 'lucide-react';
import { model3dService } from '../../services/model3dService';

const EARTH_RADIUS = 6371000.0;

function gpsToLocalMeters(lat, lng, centerLat, centerLng) {
  const y = (lat - centerLat) * (Math.PI / 180.0) * EARTH_RADIUS;
  const x = (lng - centerLng) * (Math.PI / 180.0) * EARTH_RADIUS * Math.cos((centerLat * Math.PI) / 180.0);
  return { x, z: -y };
}

/**
 * Loads and renders the GLB Model with user adjustment controls
 */
function GlbMeshModel({ url, scale, rotationDeg, elevation }) {
  const { scene } = useGLTF(url);
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  return (
    <group
      position={[0, elevation, 0]}
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
function MeasuredRooftopLayer({ localVertices, obstaclesLocal, buildingHeight = 3.5 }) {
  // Construct 2D Three.Shape for the roof boundary
  const shape = useMemo(() => {
    if (localVertices.length < 3) return null;
    const s = new THREE.Shape();
    s.moveTo(localVertices[0].x, localVertices[0].z);
    for (let i = 1; i < localVertices.length; i++) {
      s.lineTo(localVertices[i].x, localVertices[i].z);
    }
    s.closePath();

    // Cut out obstacles as holes
    obstaclesLocal.forEach((obs) => {
      if (obs.length >= 3) {
        const hole = new THREE.Path();
        hole.moveTo(obs[0].x, obs[0].z);
        for (let j = 1; j < obs.length; j++) {
          hole.lineTo(obs[j].x, obs[j].z);
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
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      {/* Extruded building structure */}
      <mesh receiveShadow castShadow>
        <extrudeGeometry args={[shape, extrudeSettings]} />
        <meshStandardMaterial
          color="#334155"
          transparent
          opacity={0.7}
          roughness={0.4}
          metalness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Roof perimeter line */}
      <lineLoop>
        <bufferGeometry
          attach="geometry"
          onUpdate={(geo) => {
            const points = [...localVertices, localVertices[0]].map((p) => new THREE.Vector3(p.x, p.z, buildingHeight + 0.05));
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
                const points = [...obs, obs[0]].map((p) => new THREE.Vector3(p.x, p.z, buildingHeight + 0.06));
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
 */
function SolarPanelsLayer({ localVertices, obstaclesLocal, buildingHeight = 3.5 }) {
  // Generate a realistic grid of solar panels inside the boundary
  const panelPlacements = useMemo(() => {
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

    // Check point in polygon
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
        // Test corners
        const corners = [
          { x: x - panelWidth / 2, z: z - panelHeight / 2 },
          { x: x + panelWidth / 2, z: z - panelHeight / 2 },
          { x: x + panelWidth / 2, z: z + panelHeight / 2 },
          { x: x - panelWidth / 2, z: z + panelHeight / 2 },
        ];

        const allInside = corners.every((c) => isInsidePoly(c.x, c.z, localVertices));
        if (!allInside) continue;

        // Check if intersects any obstacle
        let hitsObstacle = false;
        for (const obs of obstaclesLocal) {
          if (corners.some((c) => isInsidePoly(c.x, c.z, obs))) {
            hitsObstacle = true;
            break;
          }
        }

        if (!hitsObstacle) {
          panels.push({ x, z });
        }
      }
    }

    return panels;
  }, [localVertices, obstaclesLocal]);

  return (
    <group position={[0, buildingHeight + 0.1, 0]}>
      {panelPlacements.map((panel, idx) => (
        <mesh key={idx} position={[panel.x, 0, panel.z]} rotation={[-Math.PI / 12, 0, 0]} castShadow>
          <boxGeometry args={[1.9, 0.05, 0.95]} />
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

export default function Model3DCanvas({ job, polygonCoordinates, obstacles = [], minRotatedRect = null }) {
  // Layer Toggles
  const [showAiModel, setShowAiModel] = useState(true);
  const [showMeasuredBoundary, setShowMeasuredBoundary] = useState(true);
  const [showPanelLayout, setShowPanelLayout] = useState(true);

  // Alignment Controls
  const [rotationDeg, setRotationDeg] = useState(0);
  const [scaleFactor, setScaleFactor] = useState(1.0);
  const [elevation, setElevation] = useState(0.0);

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

  // Model URL
  const modelGlbUrl = useMemo(() => {
    if (job?.status === 'SUCCEEDED' && job.id) {
      return model3dService.getModelUrl(job.id);
    }
    // Fallback bundled placeholder
    return '/models/mock-building.glb';
  }, [job]);

  return (
    <div className="flex flex-col bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
      {/* ─── MANDATORY AI DISCLAIMER BANNER ─── */}
      <div className="bg-blue-950/80 border-b border-blue-800/80 px-3.5 py-2 flex items-start gap-2 text-2xs text-blue-200">
        <Info size={14} className="text-blue-400 shrink-0 mt-0.5" />
        <span className="leading-snug">
          <strong>AI-generated visual model.</strong> Panel counts and layout placement come strictly from measured roof geometry.
        </span>
      </div>

      {/* ─── 3D VIEWPORT CANVAS ─── */}
      <div className="relative w-full h-80 bg-gradient-to-b from-slate-900 to-slate-950">
        <Canvas
          camera={{ position: [0, 25, 35], fov: 45 }}
          shadows
          className="w-full h-full"
        >
          <ambientLight intensity={0.8} />
          <directionalLight
            position={[20, 40, 20]}
            intensity={1.5}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <gridHelper args={[80, 80, '#334155', '#1e293b']} position={[0, -0.01, 0]} />

          <OrbitControls makeDefault enableDamping dampingFactor={0.05} />

          {/* Layer 1: AI Generated Model */}
          {showAiModel && (
            <Suspense fallback={null}>
              <GlbMeshModel
                url={modelGlbUrl}
                scale={scaleFactor}
                rotationDeg={rotationDeg}
                elevation={elevation}
              />
            </Suspense>
          )}

          {/* Layer 2: Measured Roof Boundary & Obstacles */}
          {showMeasuredBoundary && (
            <MeasuredRooftopLayer
              localVertices={localVertices}
              obstaclesLocal={obstaclesLocal}
            />
          )}

          {/* Layer 3: Measured Solar Panel Layout */}
          {showPanelLayout && (
            <SolarPanelsLayer
              localVertices={localVertices}
              obstaclesLocal={obstaclesLocal}
            />
          )}
        </Canvas>

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
              min="0.4"
              max="2.5"
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
