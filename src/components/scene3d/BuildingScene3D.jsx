import React, { useMemo } from 'react';
import * as THREE from 'three';

/**
 * Procedural concrete facade canvas texture
 */
function createConcreteTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Base industrial tone
  ctx.fillStyle = '#b8bec5';
  ctx.fillRect(0, 0, 512, 512);

  // High-frequency surface grain
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const grain = (Math.random() - 0.5) * 26;
    data[i] = Math.min(255, Math.max(0, data[i] + grain));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + grain));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + grain));
  }
  ctx.putImageData(imgData, 0, 0);

  // Horizontal architectural panel seams
  ctx.strokeStyle = 'rgba(75, 85, 99, 0.25)';
  ctx.lineWidth = 2;
  for (let y = 64; y < 512; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  // Vertical panel seams
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
 * Procedural roof membrane / gravel canvas texture
 */
function createRoofTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Dark industrial rooftop bituminous membrane
  ctx.fillStyle = '#64748b';
  ctx.fillRect(0, 0, 256, 256);

  const imgData = ctx.getImageData(0, 0, 256, 256);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const grain = (Math.random() - 0.5) * 36;
    data[i] = Math.min(255, Math.max(0, data[i] + grain));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + grain));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + grain));
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

/**
 * Computes polygon winding order via Shoelace formula.
 * Returns true if vertices are arranged clockwise.
 */
function isClockwise(points) {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    const p1 = points[i];
    const p2 = points[j];
    const x1 = p1.x ?? p1[0];
    const y1 = p1.y ?? p1[1];
    const x2 = p2.x ?? p2[0];
    const y2 = p2.y ?? p2[1];
    area += (x2 - x1) * (y2 + y1);
  }
  return area > 0;
}

/**
 * Builds a THREE.Shape from an array of 2D coordinates in local (x, z) space.
 * Formats points as THREE.Vector2(x, -z) to preserve geographical orientation
 * when rotated into Three.js Y-up world space.
 */
export function buildShapeFromFootprint(footprint) {
  if (!footprint || footprint.length < 3) return null;

  // Map to THREE.Vector2 in 2D shape coordinates
  // Shape coordinates: X_shape = x, Y_shape = -z
  const points = footprint.map((p) => {
    const px = p.x ?? p[0];
    const pz = p.z ?? p[1];
    return new THREE.Vector2(px, -pz);
  });

  // Ensure counter-clockwise winding order for positive normal extrusion
  if (isClockwise(points)) {
    points.reverse();
  }

  const shape = new THREE.Shape();
  shape.setFromPoints(points);
  return shape;
}

/**
 * Dynamic Polygon Extrusion Building Mesh
 * Replaces simple boxGeometry with custom extruded geometry matching the exact 2D map polygon.
 */
export const BuildingMesh = ({
  footprint,
  height = 4.5,
  showWireframe = false,
}) => {
  const concreteTexture = useMemo(() => createConcreteTexture(), []);

  const { geometry, edgesGeo } = useMemo(() => {
    const shape = buildShapeFromFootprint(footprint);
    if (!shape) return { geometry: null, edgesGeo: null };

    const extrudeSettings = {
      steps: 1,
      depth: height,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.08,
      bevelSegments: 2,
    };

    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    // Rotate -90° around X so extrusion depth maps along world +Y (height)
    // and Y_shape (-z) maps to world +Z
    geo.rotateX(-Math.PI / 2);
    geo.computeVertexNormals();

    const edges = new THREE.EdgesGeometry(geo, 25);
    return { geometry: geo, edgesGeo: edges };
  }, [footprint, height]);

  if (!geometry) return null;

  return (
    <group position={[0, 0, 0]}>
      {/* Extruded Solid Facade */}
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial
          map={concreteTexture}
          roughness={0.88}
          metalness={0.12}
          color="#cfd5dc"
          wireframe={showWireframe}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Crisp Architectural Wireframe Outlines */}
      {edgesGeo && !showWireframe && (
        <lineSegments geometry={edgesGeo}>
          <lineBasicMaterial color="#475569" linewidth={1.5} />
        </lineSegments>
      )}
    </group>
  );
};

/**
 * Top Roof Deck Surface with Parapet Edge Perimeter
 */
export const RoofPlane = ({
  footprint,
  height = 4.5,
  showParapet = true,
}) => {
  const roofTexture = useMemo(() => createRoofTexture(), []);

  const { surfaceGeo, parapetPoints } = useMemo(() => {
    const shape = buildShapeFromFootprint(footprint);
    if (!shape) return { surfaceGeo: null, parapetPoints: [] };

    const surfaceGeo = new THREE.ShapeGeometry(shape);
    surfaceGeo.rotateX(-Math.PI / 2);
    surfaceGeo.computeVertexNormals();

    // Trace parapet perimeter points around the custom polygon
    const parapetPoints = footprint.map(
      (p) => new THREE.Vector3(p.x ?? p[0], height + 0.35, p.z ?? p[1])
    );
    if (footprint.length > 0) {
      parapetPoints.push(
        new THREE.Vector3(
          footprint[0].x ?? footprint[0][0],
          height + 0.35,
          footprint[0].z ?? footprint[0][1]
        )
      );
    }

    return { surfaceGeo, parapetPoints };
  }, [footprint, height]);

  if (!surfaceGeo) return null;

  return (
    <group position={[0, height + 0.015, 0]}>
      {/* Flat Industrial Roof Deck Membrane */}
      <mesh geometry={surfaceGeo} receiveShadow>
        <meshStandardMaterial
          map={roofTexture}
          roughness={0.94}
          metalness={0.06}
          color="#717a84"
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Safety Parapet Wall Contour */}
      {showParapet && parapetPoints.length > 0 && (
        <group position={[0, -0.015, 0]}>
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
            <lineBasicMaterial color="#f59e0b" linewidth={2.5} />
          </line>
        </group>
      )}
    </group>
  );
};

/**
 * High-Fidelity Solar Panel Mesh Instance
 * Renders an extruded 3D module with dark gloss glass, aluminum perimeter frame,
 * galvanized rack mounts, and authentic tilt angle.
 */
export const SolarPanelMesh = ({
  panel,
  isHovered = false,
  onHover,
}) => {
  const width = panel.widthMeters || 1.13;
  const length = panel.lengthMeters || 2.27;
  const azDeg = panel.azimuthDegrees ?? 180;
  const tiltDeg = panel.tiltDegrees ?? 14;

  const azRad = THREE.MathUtils.degToRad(azDeg - 180);
  const tiltRad = THREE.MathUtils.degToRad(tiltDeg);

  const cx = panel.center?.x ?? 0;
  const cy = panel.center?.y ?? 4.5;
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
      {/* Structural Galvanized Steel Mounting Rack / Legs */}
      <mesh position={[0, -0.06, 0]} castShadow receiveShadow>
        <boxGeometry args={[width * 0.85, 0.08, length * 0.72]} />
        <meshStandardMaterial color="#64748b" metalness={0.75} roughness={0.35} />
      </mesh>

      {/* Tilted Solar Panel Assembly */}
      <group rotation={[tiltRad, 0, 0]} position={[0, 0.08, 0]}>
        {/* Silver-Anodized Aluminum Perimeter Frame */}
        <mesh castShadow receiveShadow position={[0, 0, 0]}>
          <boxGeometry args={[width, 0.045, length]} />
          <meshStandardMaterial
            color={isHovered ? '#60a5fa' : '#94a3b8'}
            metalness={0.88}
            roughness={0.25}
          />
        </mesh>

        {/* High-Gloss Photovoltaic Glass Surface (Top Face) */}
        <mesh position={[0, 0.024, 0]} receiveShadow>
          <boxGeometry args={[width - 0.05, 0.006, length - 0.05]} />
          <meshStandardMaterial
            color={isHovered ? '#38bdf8' : '#081726'}
            metalness={0.94}
            roughness={0.08}
            emissive={isHovered ? '#0284c7' : '#03172e'}
            emissiveIntensity={isHovered ? 0.5 : 0.15}
          />
        </mesh>

        {/* Silicon Wafer Sub-grid Lines */}
        <mesh position={[0, 0.028, 0]}>
          <planeGeometry args={[width - 0.07, length - 0.07]} />
          <meshBasicMaterial
            color="#1e3a8a"
            transparent
            opacity={0.4}
            wireframe
          />
        </mesh>
      </group>
    </group>
  );
};
