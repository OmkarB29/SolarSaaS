import React, { Suspense, useMemo, useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  OrbitControls,
  useGLTF,
  Environment,
  Grid,
  PerspectiveCamera,
  ContactShadows,
  GizmoHelper,
  GizmoViewport,
  Html,
} from '@react-three/drei';
import * as THREE from 'three';
import {
  Download,
  RotateCw,
  Box,
  Eye,
  Sparkles,
  Layers,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Maximize2,
  Palette,
  Sun,
} from 'lucide-react';

/**
 * Normalizes, centers, and applies material shaders (Textured, Architectural Clay, Wireframe)
 */
function MeshyGlbMesh({ url, showWireframe, renderMode, onStatsReady }) {
  const { scene } = useGLTF(url);
  const modelRef = useRef();

  // Clone scene and auto-center / scale
  const { clonedScene, boundingInfo } = useMemo(() => {
    const cloned = scene.clone(true);

    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    // Normalize scale so largest dimension is ~24 units
    const maxDim = Math.max(size.x, size.y, size.z);
    const targetDim = 24.0;
    const scale = maxDim > 0 ? targetDim / maxDim : 1.0;

    cloned.scale.set(scale, scale, scale);

    const scaledBox = new THREE.Box3().setFromObject(cloned);
    const scaledCenter = new THREE.Vector3();
    scaledBox.getCenter(scaledCenter);

    // Center X & Z, place lowest point at Y = 0
    cloned.position.x = -scaledCenter.x;
    cloned.position.z = -scaledCenter.z;
    cloned.position.y = -scaledBox.min.y;

    let vertexCount = 0;
    let faceCount = 0;
    let meshCount = 0;

    // Architectural Studio Clay Material (Meshy's default look)
    const clayMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4d8df,
      roughness: 0.65,
      metalness: 0.12,
      wireframe: showWireframe,
    });

    cloned.traverse((child) => {
      if (child.isMesh) {
        meshCount++;
        child.castShadow = true;
        child.receiveShadow = true;

        if (child.geometry?.attributes?.position) {
          const count = child.geometry.attributes.position.count;
          vertexCount += count;
          if (child.geometry.index) {
            faceCount += child.geometry.index.count / 3;
          } else {
            faceCount += count / 3;
          }
        }

        if (renderMode === 'clay') {
          child.material = clayMaterial;
        } else if (child.material) {
          child.material.wireframe = showWireframe;
          child.material.roughness = Math.min(0.85, child.material.roughness || 0.6);
          child.material.metalness = Math.max(0.08, child.material.metalness || 0.2);
          child.material.needsUpdate = true;
        }
      }
    });

    return {
      clonedScene: cloned,
      boundingInfo: {
        widthM: Math.round(size.x * 10) / 10,
        heightM: Math.round(size.y * 10) / 10,
        lengthM: Math.round(size.z * 10) / 10,
        vertexCount,
        faceCount: Math.round(faceCount),
        meshCount,
      },
    };
  }, [scene, showWireframe, renderMode]);

  useEffect(() => {
    onStatsReady?.(boundingInfo);
  }, [boundingInfo, onStatsReady]);

  return <primitive ref={modelRef} object={clonedScene} />;
}

/**
 * Meshy AI Workspace 3D Viewport
 * Displays the architectural mesh, live HUD face/vertex counters, clay/textured toggles, and .GLB export
 */
export const MeshyModelViewer = ({
  modelUrl,
  taskId,
  imageUrl,
  modelName = 'Rooftop Digital Asset',
  onReset,
}) => {
  const [showWireframe, setShowWireframe] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [renderMode, setRenderMode] = useState('clay'); // 'clay' (Meshy signature look) or 'textured'
  const [modelStats, setModelStats] = useState(null);

  return (
    <div className="relative w-full h-full flex flex-col min-h-[660px] bg-[#0c1017] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* ─── Top-Left HUD Overlay (Meshy Workspace Style) ─── */}
      <div className="absolute top-4 left-4 z-20 pointer-events-auto flex flex-col gap-2.5">
        <div className="bg-[#161c28]/90 backdrop-blur-md px-3.5 py-3 rounded-xl border border-slate-700/80 text-white shadow-xl min-w-[190px]">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700/60">
            <span className="text-[11px] font-bold tracking-wider text-slate-300 uppercase flex items-center gap-1.5">
              <Sparkles size={13} className="text-lime-400" />
              Meshy 7.1 Mesh
            </span>
            <span className="text-[10px] font-mono text-lime-400 bg-lime-500/10 px-1.5 py-0.5 rounded border border-lime-500/30">
              PBR Ready
            </span>
          </div>

          <div className="space-y-1.5 text-[11px] font-mono">
            <div className="flex justify-between items-center text-slate-400">
              <span>Topology</span>
              <span className="text-white font-semibold">Triangle</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Faces</span>
              <span className="text-white font-semibold">
                {modelStats?.faceCount ? modelStats.faceCount.toLocaleString() : '2,191,196'}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Vertices</span>
              <span className="text-white font-semibold">
                {modelStats?.vertexCount ? modelStats.vertexCount.toLocaleString() : '1,093,858'}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-400 pt-1 border-t border-slate-800">
              <span>Solar Feasibility</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 size={12} /> Ready
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Top-Right View Controls ─── */}
      <div className="absolute top-4 right-4 z-20 pointer-events-auto flex items-center gap-2">
        {/* Render Mode Switcher: Clay Studio vs Textured */}
        <div className="flex items-center bg-[#161c28]/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 text-xs shadow-lg">
          <button
            type="button"
            onClick={() => setRenderMode('clay')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              renderMode === 'clay'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Clay Studio
          </button>
          <button
            type="button"
            onClick={() => setRenderMode('textured')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              renderMode === 'textured'
                ? 'bg-lime-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            PBR Textured
          </button>
        </div>

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="p-2.5 bg-[#161c28]/90 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-700/80 transition-colors cursor-pointer shadow-lg"
            title="Generate New 3D Asset"
          >
            <RefreshCw size={15} />
          </button>
        )}
      </div>

      {/* ─── Center 3D WebGL Canvas ─── */}
      <div className="w-full h-full flex-1 min-h-[580px]">
        <Canvas
          shadows
          dpr={[1, 2]}
          className="w-full h-full"
          style={{
            background: 'radial-gradient(circle at 50% 35%, #182030 0%, #090d15 100%)',
          }}
          onCreated={({ gl }) => {
            gl.shadowMap.enabled = true;
            gl.shadowMap.type = THREE.PCFSoftShadowMap;
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.15;
          }}
        >
          <PerspectiveCamera makeDefault position={[22, 16, 26]} fov={42} />

          {/* Studio Lighting tailored for architectural building depth */}
          <ambientLight intensity={0.8} />
          <directionalLight
            position={[30, 45, 20]}
            intensity={1.8}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-near={0.5}
            shadow-camera-far={120}
            shadow-camera-left={-25}
            shadow-camera-right={25}
            shadow-camera-top={25}
            shadow-camera-bottom={-25}
            shadow-bias={-0.0005}
          />
          <directionalLight position={[-20, 20, -20]} intensity={0.6} color="#94a3b8" />
          <directionalLight position={[0, -10, 0]} intensity={0.2} color="#475569" />

          <Suspense
            fallback={
              <Html center>
                <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-slate-900/90 border border-slate-700 text-white shadow-2xl backdrop-blur-md">
                  <RefreshCw size={24} className="animate-spin text-lime-400" />
                  <span className="text-xs font-mono font-bold tracking-wide">
                    Loading Meshy 7.1 Geometry Mesh...
                  </span>
                </div>
              </Html>
            }
          >
            <MeshyGlbMesh
              url={modelUrl}
              showWireframe={showWireframe}
              renderMode={renderMode}
              onStatsReady={setModelStats}
            />

            <ContactShadows
              position={[0, 0, 0]}
              opacity={0.65}
              scale={60}
              blur={2.0}
              far={15}
              resolution={1024}
              color="#020617"
            />
          </Suspense>

          {/* Studio Infinite Floor Grid */}
          <Grid
            position={[0, -0.01, 0]}
            args={[80, 80]}
            cellSize={2}
            cellThickness={0.8}
            cellColor="#1e293b"
            sectionSize={10}
            sectionThickness={1.2}
            sectionColor="#334155"
            fadeDistance={55}
            fadeStrength={1.5}
          />

          <OrbitControls
            makeDefault
            autoRotate={autoRotate}
            autoRotateSpeed={1.8}
            enableDamping
            dampingFactor={0.05}
            maxPolarAngle={Math.PI / 2 - 0.04}
            minDistance={8}
            maxDistance={80}
          />

          <GizmoHelper alignment="bottom-right" margin={[70, 70]}>
            <GizmoViewport
              axisColors={['#ef4444', '#10b981', '#3b82f6']}
              labelColor="#ffffff"
            />
          </GizmoHelper>
        </Canvas>
      </div>

      {/* ─── Bottom Floating Toolbar (Meshy Signature Studio Dock) ─── */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex items-center gap-2 bg-[#161c28]/95 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700/80 text-white shadow-2xl">
        {/* Wireframe Button */}
        <button
          type="button"
          onClick={() => setShowWireframe((w) => !w)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
            showWireframe
              ? 'bg-blue-600 border-blue-500 text-white'
              : 'border-slate-700 text-slate-300 hover:bg-slate-800'
          }`}
          title="Toggle Wireframe Overlay"
        >
          <Layers size={14} />
          <span>Wireframe</span>
        </button>

        {/* Turntable Auto-Rotate Button */}
        <button
          type="button"
          onClick={() => setAutoRotate((r) => !r)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
            autoRotate
              ? 'bg-blue-600 border-blue-500 text-white'
              : 'border-slate-700 text-slate-300 hover:bg-slate-800'
          }`}
          title="Auto-rotate 360° orbit"
        >
          <RotateCw size={14} className={autoRotate ? 'animate-spin' : ''} />
          <span>Turntable</span>
        </button>

        <div className="h-4 w-px bg-slate-700 mx-1"></div>

        {/* Prominent Lime Download .GLB Button (Matching Meshy Workspace Download) */}
        <a
          href={modelUrl}
          download={`solarscope_meshy_${taskId || 'asset'}.glb`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-4 py-1.5 bg-lime-400 hover:bg-lime-300 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md shadow-lime-500/20 cursor-pointer"
          title="Download 3D Model in Binary GLTF (.GLB) format"
        >
          <Download size={14} />
          <span>Download .GLB</span>
        </a>
      </div>
    </div>
  );
};
export default MeshyModelViewer;
