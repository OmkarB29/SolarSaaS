import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import fs from 'fs';
import path from 'path';

// Polyfill FileReader for GLTFExporter in Node.js
globalThis.FileReader = class FileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = buf;
      this.onloadend?.();
    });
  }
};

const exportSceneToGlb = async (scene, outputPath) => {
  const exporter = new GLTFExporter();
  return new Promise((resolve, reject) => {
    exporter.parse(
      scene,
      (glb) => {
        const buffer = Buffer.from(glb);
        fs.writeFileSync(outputPath, buffer);
        console.log(`Saved ${outputPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
        resolve();
      },
      (err) => reject(err),
      { binary: true }
    );
  });
};

/* ─── PBR Materials ─── */
const wallMat = new THREE.MeshStandardMaterial({
  color: 0xcccccc,
  roughness: 0.75,
  metalness: 0.1,
  name: 'BuildingFacade',
});

const roofDeckMat = new THREE.MeshStandardMaterial({
  color: 0x5a636e,
  roughness: 0.9,
  metalness: 0.05,
  name: 'RoofDeckMembrane',
});

const parapetMat = new THREE.MeshStandardMaterial({
  color: 0xb0b8c2,
  roughness: 0.7,
  metalness: 0.2,
  name: 'ParapetCap',
});

const hvacMetalMat = new THREE.MeshStandardMaterial({
  color: 0x788494,
  roughness: 0.35,
  metalness: 0.8,
  name: 'HVACGalvanized',
});

const glassMat = new THREE.MeshStandardMaterial({
  color: 0x1e3a5f,
  roughness: 0.1,
  metalness: 0.9,
  name: 'CurtainGlass',
});

/* ─── 1. Industrial HVAC Facility ─── */
const buildIndustrialHvacFacility = () => {
  const root = new THREE.Group();
  root.name = 'IndustrialHVACFacility';

  const w = 40;
  const l = 26;
  const h = 7.0;

  // Main Warehouse Box Body
  const bodyGeo = new THREE.BoxGeometry(w, h, l);
  const bodyMesh = new THREE.Mesh(bodyGeo, wallMat);
  bodyMesh.position.set(0, h / 2, 0);
  root.add(bodyMesh);

  // Flat Roof Deck (slightly recessed below parapet)
  const roofDeckGeo = new THREE.BoxGeometry(w - 0.4, 0.2, l - 0.4);
  const roofMesh = new THREE.Mesh(roofDeckGeo, roofDeckMat);
  roofMesh.position.set(0, h + 0.05, 0);
  root.add(roofMesh);

  // Raised Parapet Rim around roof perimeter
  const pThickness = 0.3;
  const pHeight = 0.5;
  // North & South parapets
  const pNorth = new THREE.Mesh(new THREE.BoxGeometry(w, pHeight, pThickness), parapetMat);
  pNorth.position.set(0, h + pHeight / 2, -l / 2 + pThickness / 2);
  root.add(pNorth);
  const pSouth = new THREE.Mesh(new THREE.BoxGeometry(w, pHeight, pThickness), parapetMat);
  pSouth.position.set(0, h + pHeight / 2, l / 2 - pThickness / 2);
  root.add(pSouth);
  // East & West parapets
  const pEast = new THREE.Mesh(new THREE.BoxGeometry(pThickness, pHeight, l - pThickness * 2), parapetMat);
  pEast.position.set(w / 2 - pThickness / 2, h + pHeight / 2, 0);
  root.add(pEast);
  const pWest = new THREE.Mesh(new THREE.BoxGeometry(pThickness, pHeight, l - pThickness * 2), parapetMat);
  pWest.position.set(-w / 2 + pThickness / 2, h + pHeight / 2, 0);
  root.add(pWest);

  // Rooftop Utility Enclosure / Penthouse (North-West corner)
  const phGeo = new THREE.BoxGeometry(4.5, 2.2, 3.5);
  const phMesh = new THREE.Mesh(phGeo, wallMat);
  phMesh.position.set(-14, h + 1.1, -8);
  root.add(phMesh);

  // Rooftop Industrial HVAC Chillers (concentrated in north zone, leaving south roof open for panels)
  for (let i = 0; i < 3; i++) {
    const hvac = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.6, 2.2), hvacMetalMat);
    hvac.position.set(-6 + i * 5, h + 0.8, -8.5);
    root.add(hvac);

    // Chiller fan cylinders
    for (let f = 0; f < 2; f++) {
      const fan = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.25, 16), hvacMetalMat);
      fan.position.set(-6 + i * 5 + (f === 0 ? -0.8 : 0.8), h + 1.65, -8.5);
      root.add(fan);
    }
  }

  return root;
};

/* ─── 2. Commercial Complex (L-Shape) ─── */
const buildCommercialComplex = () => {
  const root = new THREE.Group();
  root.name = 'CommercialComplex';

  const h = 8.5;
  // Main Wing: 38m x 18m
  const w1 = new THREE.Mesh(new THREE.BoxGeometry(38, h, 18), wallMat);
  w1.position.set(0, h / 2, -5);
  root.add(w1);

  // Side Wing: 18m x 20m
  const w2 = new THREE.Mesh(new THREE.BoxGeometry(18, h, 20), wallMat);
  w2.position.set(-10, h / 2, 14);
  root.add(w2);

  // Roof Decks
  const r1 = new THREE.Mesh(new THREE.BoxGeometry(37.4, 0.2, 17.4), roofDeckMat);
  r1.position.set(0, h + 0.05, -5);
  root.add(r1);

  const r2 = new THREE.Mesh(new THREE.BoxGeometry(17.4, 0.2, 19.4), roofDeckMat);
  r2.position.set(-10, h + 0.05, 14);
  root.add(r2);

  // Rooftop HVAC units on side wing corner
  for (let i = 0; i < 2; i++) {
    const ac = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.4, 2.0), hvacMetalMat);
    ac.position.set(-14 + i * 4, h + 0.7, 20);
    root.add(ac);
  }

  return root;
};

/* ─── 3. Modern Office Tower ─── */
const buildOfficeTower = () => {
  const root = new THREE.Group();
  root.name = 'ModernOfficeTower';

  const hBase = 14.0;
  const w = 28;
  const l = 22;

  // Main Tower Body
  const tower = new THREE.Mesh(new THREE.BoxGeometry(w, hBase, l), wallMat);
  tower.position.set(0, hBase / 2, 0);
  root.add(tower);

  // Glass Window Bands
  for (let f = 1; f <= 3; f++) {
    const band = new THREE.Mesh(new THREE.BoxGeometry(w + 0.08, 1.8, l + 0.08), glassMat);
    band.position.set(0, f * 3.5, 0);
    root.add(band);
  }

  // Roof Deck
  const rDeck = new THREE.Mesh(new THREE.BoxGeometry(w - 0.4, 0.2, l - 0.4), roofDeckMat);
  rDeck.position.set(0, hBase + 0.05, 0);
  root.add(rDeck);

  // Parapet Perimeter
  const pHeight = 0.6;
  const pNorth = new THREE.Mesh(new THREE.BoxGeometry(w, pHeight, 0.3), parapetMat);
  pNorth.position.set(0, hBase + pHeight / 2, -l / 2 + 0.15);
  root.add(pNorth);
  const pSouth = new THREE.Mesh(new THREE.BoxGeometry(w, pHeight, 0.3), parapetMat);
  pSouth.position.set(0, hBase + pHeight / 2, l / 2 - 0.15);
  root.add(pSouth);
  const pEast = new THREE.Mesh(new THREE.BoxGeometry(0.3, pHeight, l), parapetMat);
  pEast.position.set(w / 2 - 0.15, hBase + pHeight / 2, 0);
  root.add(pEast);
  const pWest = new THREE.Mesh(new THREE.BoxGeometry(0.3, pHeight, l), parapetMat);
  pWest.position.set(-w / 2 + 0.15, hBase + pHeight / 2, 0);
  root.add(pWest);

  // Elevator / Mechanical Penthouse
  const elevator = new THREE.Mesh(new THREE.BoxGeometry(6.0, 3.2, 5.0), wallMat);
  elevator.position.set(0, hBase + 1.6, -5.5);
  root.add(elevator);

  return root;
};

/* ─── 4. Sample Rooftop (1,095 m² Logistics Warehouse) ─── */
const buildSampleRooftop = () => {
  const root = new THREE.Group();
  root.name = 'SampleLogisticsWarehouse';

  // 50m x 22m = 1100m² matching our 1095m² preset
  const w = 50;
  const l = 22;
  const h = 5.5;

  const warehouse = new THREE.Mesh(new THREE.BoxGeometry(w, h, l), wallMat);
  warehouse.position.set(0, h / 2, 0);
  root.add(warehouse);

  // Expansive Flat Roof Deck
  const deck = new THREE.Mesh(new THREE.BoxGeometry(w - 0.5, 0.2, l - 0.5), roofDeckMat);
  deck.position.set(0, h + 0.05, 0);
  root.add(deck);

  // Safety Parapet Wall
  const pHeight = 0.45;
  const pNorth = new THREE.Mesh(new THREE.BoxGeometry(w, pHeight, 0.3), parapetMat);
  pNorth.position.set(0, h + pHeight / 2, -l / 2 + 0.15);
  root.add(pNorth);
  const pSouth = new THREE.Mesh(new THREE.BoxGeometry(w, pHeight, 0.3), parapetMat);
  pSouth.position.set(0, h + pHeight / 2, l / 2 - 0.15);
  root.add(pSouth);
  const pEast = new THREE.Mesh(new THREE.BoxGeometry(0.3, pHeight, l), parapetMat);
  pEast.position.set(w / 2 - 0.15, h + pHeight / 2, 0);
  root.add(pEast);
  const pWest = new THREE.Mesh(new THREE.BoxGeometry(0.3, pHeight, l), parapetMat);
  pWest.position.set(-w / 2 + 0.15, h + pHeight / 2, 0);
  root.add(pWest);

  return root;
};

/* ─── Main Generator Execution ─── */
async function generateAll() {
  const outDir = path.resolve('public/models');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log('Generating high-detail architectural GLB models with watertight flat roofs...');

  await exportSceneToGlb(buildIndustrialHvacFacility(), path.join(outDir, 'industrial_hvac_facility.glb'));
  await exportSceneToGlb(buildCommercialComplex(), path.join(outDir, 'commercial_complex.glb'));
  await exportSceneToGlb(buildOfficeTower(), path.join(outDir, 'office_tower.glb'));
  await exportSceneToGlb(buildSampleRooftop(), path.join(outDir, 'sample_rooftop.glb'));

  console.log('All 4 architectural GLBs generated successfully!');
}

generateAll().catch(console.error);
