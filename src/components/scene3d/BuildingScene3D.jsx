import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';

/**
 * BuildingMesh
 * Extrudes a localised XZ-plane polygon footprint into a 3D building solid.
 * Uses flat shading with a clean industrial material (concrete grey).
 */
const BuildingMesh = ({ footprint, height }) => {
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
      bevelEnabled: false,
    };

    // ExtrudeGeometry extrudes along Z, we rotate to align with Y-up
    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.computeVertexNormals();
    return geo;
  }, [footprint, height]);

  if (!geometry) return null;

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      {/* Solid fill */}
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial
          color="#c8c9cb"
          roughness={0.88}
          metalness={0.05}
          side={THREE.FrontSide}
        />
      </mesh>
      {/* Wireframe edges overlay for industrial aesthetic */}
      <lineSegments>
        <edgesGeometry args={[geometry]} />
        <lineBasicMaterial color="#6b7280" linewidth={1} />
      </lineSegments>
    </group>
  );
};

/**
 * RoofPlane
 * Renders the rooftop surface as a distinct slightly brighter flat plane.
 */
const RoofPlane = ({ footprint, height }) => {
  const geometry = useMemo(() => {
    if (!footprint || footprint.length < 3) return null;

    const shape = new THREE.Shape();
    shape.moveTo(footprint[0].x, footprint[0].z);
    for (let i = 1; i < footprint.length; i++) {
      shape.lineTo(footprint[i].x, footprint[i].z);
    }
    shape.closePath();

    const geo = new THREE.ShapeGeometry(shape);
    geo.computeVertexNormals();
    return geo;
  }, [footprint]);

  if (!geometry) return null;

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, height, 0]}>
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial
          color="#9ca3af"
          roughness={0.7}
          metalness={0.04}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Roof perimeter outline */}
      <lineLoop>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(footprint.flatMap((p) => [p.x, p.z, 0])), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#f59e0b" linewidth={2} />
      </lineLoop>
    </group>
  );
};

/**
 * SolarPanelMesh
 * Renders a single thin rectangular solar panel as a flat mesh plane.
 * Positioned in local 3D space from the backend/client projection output.
 */
const SolarPanelMesh = ({ panel, isHovered, onHover }) => {
  const geometry = useMemo(() => {
    // If corners are provided, use them directly
    if (panel.corners && panel.corners.length >= 4) {
      const positions = new Float32Array([
        panel.corners[0].x, panel.corners[0].y, panel.corners[0].z,
        panel.corners[1].x, panel.corners[1].y, panel.corners[1].z,
        panel.corners[2].x, panel.corners[2].y, panel.corners[2].z,
        panel.corners[3].x, panel.corners[3].y, panel.corners[3].z,
      ]);
      const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setIndex(new THREE.BufferAttribute(indices, 1));
      geo.computeVertexNormals();
      return geo;
    }

    // Fallback: PlaneGeometry centered at panel center
    return new THREE.PlaneGeometry(panel.widthMeters || 1.1, panel.lengthMeters || 2.1);
  }, [panel]);

  const ref = useRef();
  const center = panel.center || { x: 0, y: 0, z: 0 };

  // For fallback plane geometry with no corners, place at center
  const hasCornersGeo = panel.corners && panel.corners.length >= 4;

  if (hasCornersGeo) {
    return (
      <group>
        <mesh
          geometry={geometry}
          ref={ref}
          onPointerEnter={() => onHover?.(panel)}
          onPointerLeave={() => onHover?.(null)}
        >
          <meshStandardMaterial
            color={isHovered ? '#60a5fa' : '#1e40af'}
            roughness={0.18}
            metalness={0.82}
            emissive={isHovered ? '#1d4ed8' : '#0f172a'}
            emissiveIntensity={isHovered ? 0.25 : 0.05}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Panel frame wire */}
        <lineSegments>
          <edgesGeometry args={[geometry]} />
          <lineBasicMaterial color={isHovered ? '#93c5fd' : '#3b82f6'} linewidth={1} />
        </lineSegments>
      </group>
    );
  }

  // Fallback: PlaneGeometry at center
  const azRad = ((panel.azimuthDegrees || 180) - 180) * (Math.PI / 180);
  return (
    <group position={[center.x, center.y, center.z]} rotation={[0, azRad, 0]}>
      <mesh
        ref={ref}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerEnter={() => onHover?.(panel)}
        onPointerLeave={() => onHover?.(null)}
      >
        <planeGeometry args={[panel.widthMeters || 1.1, panel.lengthMeters || 2.1]} />
        <meshStandardMaterial
          color={isHovered ? '#60a5fa' : '#1e40af'}
          roughness={0.18}
          metalness={0.82}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};

export { BuildingMesh, RoofPlane, SolarPanelMesh };
