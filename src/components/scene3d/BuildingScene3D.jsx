import React, { useMemo } from 'react';
import * as THREE from 'three';

/**
 * Generate procedurally textured concrete canvas for building facade
 */
function createConcreteTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Base industrial plaster tone
  ctx.fillStyle = '#b4b7ba';
  ctx.fillRect(0, 0, 512, 512);

  // High-frequency surface grain
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 28;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  // Subtle architectural horizontal concrete panel joints
  ctx.strokeStyle = 'rgba(70, 75, 80, 0.22)';
  ctx.lineWidth = 2;
  for (let y = 64; y < 512; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  // Subtle vertical panel seams
  for (let x = 128; x < 512; x += 128) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

/**
 * Generate procedural rooftop membrane / gravel texture
 */
function createRoofTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Darker flat industrial rooftop membrane
  ctx.fillStyle = '#6e747b';
  ctx.fillRect(0, 0, 256, 256);

  const imgData = ctx.getImageData(0, 0, 256, 256);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const grain = (Math.random() - 0.5) * 35;
    data[i] = Math.min(255, Math.max(0, data[i] + grain));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + grain));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + grain));
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  return texture;
}

/**
 * Realistic Extruded Building Mesh with Concrete Texture & Shadow casting
 */
export const BuildingMesh = ({ footprint, height = 4.0 }) => {
  const concreteTexture = useMemo(() => createConcreteTexture(), []);

  const geometry = useMemo(() => {
    if (!footprint || footprint.length < 3) return null;

    const shape = new THREE.Shape();
    shape.moveTo(footprint[0].x, footprint[0].z);
    for (let i = 1; i < footprint.length; i++) {
      shape.lineTo(footprint[i].x, footprint[i].z);
    }
    shape.closePath();

    const extrudeSettings = {
      steps: 1,
      depth: height,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.08,
      bevelSegments: 2,
    };

    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.computeVertexNormals();
    return geo;
  }, [footprint, height]);

  if (!geometry) return null;

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      {/* Concrete Facade with shadows */}
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial
          map={concreteTexture}
          roughness={0.85}
          metalness={0.12}
          color="#cfd2d6"
          side={THREE.FrontSide}
        />
      </mesh>

      {/* Structural architectural edge accent */}
      <lineSegments>
        <edgesGeometry args={[geometry]} />
        <lineBasicMaterial color="#475569" linewidth={1.2} />
      </lineSegments>
    </group>
  );
};

/**
 * Roof Surface Deck with Safety Parapet & Texture
 */
export const RoofPlane = ({ footprint, height = 4.0 }) => {
  const roofTexture = useMemo(() => createRoofTexture(), []);

  const { surfaceGeo, parapetPoints } = useMemo(() => {
    if (!footprint || footprint.length < 3) return { surfaceGeo: null, parapetPoints: [] };

    const shape = new THREE.Shape();
    shape.moveTo(footprint[0].x, footprint[0].z);
    for (let i = 1; i < footprint.length; i++) {
      shape.lineTo(footprint[i].x, footprint[i].z);
    }
    shape.closePath();

    const surfaceGeo = new THREE.ShapeGeometry(shape);
    surfaceGeo.computeVertexNormals();

    const parapetPoints = footprint.map((p) => new THREE.Vector3(p.x, height + 0.35, p.z));
    if (footprint.length > 0) {
      parapetPoints.push(new THREE.Vector3(footprint[0].x, height + 0.35, footprint[0].z));
    }

    return { surfaceGeo, parapetPoints };
  }, [footprint, height]);

  if (!surfaceGeo) return null;

  return (
    <>
      {/* Textured Roof Top Surface */}
      <group rotation={[-Math.PI / 2, 0, 0]} position={[0, height + 0.02, 0]}>
        <mesh geometry={surfaceGeo} receiveShadow>
          <meshStandardMaterial
            map={roofTexture}
            roughness={0.92}
            metalness={0.06}
            color="#8c939b"
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* Parapet / Roof Safety Border */}
      {parapetPoints.length > 0 && (
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[
                new Float32Array(parapetPoints.flatMap((p) => [p.x, p.y, p.z])),
                3,
              ]}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#f59e0b" linewidth={2} />
        </line>
      )}
    </>
  );
};

/**
 * Individual High-Fidelity Solar Panel Mesh
 * Features:
 * - Real extruded 3D box profile
 * - Dark high-gloss navy-blue photovoltaic glass (metalness 0.9, roughness 0.1)
 * - Anodized silver-gray aluminum frame border
 * - Galvanized steel mounting bracket / rack lift
 * - 12° realistic southern tilt
 */
export const SolarPanelMesh = ({ panel, isHovered, onHover }) => {
  const width = panel.widthMeters || 1.1;
  const length = panel.lengthMeters || 2.1;
  const azDeg = panel.azimuthDegrees || 180;
  const tiltDeg = panel.tiltDegrees || 12;

  // Convert azimuth to radian rotation around Y
  const azRad = THREE.MathUtils.degToRad(azDeg - 180);
  const tiltRad = THREE.MathUtils.degToRad(tiltDeg);

  const cx = panel.center?.x ?? 0;
  const cy = panel.center?.y ?? 4.0;
  const cz = panel.center?.z ?? 0;

  return (
    <group
      position={[cx, cy, cz]}
      rotation={[0, azRad, 0]}
      onPointerEnter={(e) => {
        e.stopPropagation();
        onHover?.(panel);
      }}
      onPointerLeave={(e) => {
        e.stopPropagation();
        onHover?.(null);
      }}
    >
      {/* Mounting Stanchions / Rack Brackets */}
      <mesh position={[0, -0.06, 0]} castShadow receiveShadow>
        <boxGeometry args={[width * 0.85, 0.08, length * 0.7]} />
        <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.4} />
      </mesh>

      {/* Tilted Solar Module Assembly */}
      <group rotation={[tiltRad, 0, 0]} position={[0, 0.08, 0]}>
        {/* Aluminum Perimeter Frame */}
        <mesh castShadow receiveShadow position={[0, 0, 0]}>
          <boxGeometry args={[width, 0.045, length]} />
          <meshStandardMaterial
            color={isHovered ? '#93c5fd' : '#94a3b8'}
            metalness={0.88}
            roughness={0.25}
          />
        </mesh>

        {/* Photovoltaic Glass Surface (Top Face) */}
        <mesh position={[0, 0.024, 0]} receiveShadow>
          <boxGeometry args={[width - 0.06, 0.005, length - 0.06]} />
          <meshStandardMaterial
            color={isHovered ? '#38bdf8' : '#0a192f'}
            metalness={0.92}
            roughness={0.08}
            emissive={isHovered ? '#0284c7' : '#03172e'}
            emissiveIntensity={isHovered ? 0.45 : 0.12}
          />
        </mesh>

        {/* Silicon Wafer Sub-grid Lines */}
        <mesh position={[0, 0.028, 0]}>
          <planeGeometry args={[width - 0.08, length - 0.08]} />
          <meshBasicMaterial
            color="#1e3a8a"
            transparent
            opacity={0.45}
            wireframe
          />
        </mesh>
      </group>
    </group>
  );
};
