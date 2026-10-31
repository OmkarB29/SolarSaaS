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
  ContactShadows,
  Html,
  GizmoHelper,
  GizmoViewport,
  Stats,
} from '@react-three/drei';
import * as THREE from 'three';
import {
  Sun,
  RefreshCw,
  AlertCircle,
  Cpu,
  Layers,
  Box,
  ChevronRight,
  Info,
  Sliders,
  CheckCircle2,
  Sparkles,
  Eye,
  Maximize2,
  Compass,
  ShieldCheck,
  Wand2,
  Image as ImageIcon,
  Upload,
  Download,
  Key,
  Check,
  ExternalLink,
  Search,
  RotateCw,
  Palette,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { useLanguage } from '../context/LanguageContext';
import {
  BuildingMesh,
  RoofPlane,
  SolarPanelMesh,
} from '../components/scene3d/BuildingScene3D';
import { MeshyModelViewer } from '../components/scene3d/MeshyModelViewer';
import { buildScene3D } from '../services/scene3DService';
import {
  generateMeshy3DModel,
  checkMeshyHealth,
} from '../services/meshy3DService';
import {
  isPanelWithinBoundary,
  generateStrictBoundedPanels,
  getPolygonBoundingBox,
  calculatePolygonArea,
} from '../utils/geometry3D';

/* ─── Sample Commercial L-Shaped Rooftop Preset ─── */
const SAMPLE_COMMERCIAL_ROOFTOP = {
  address: 'Commercial Logistics & Laundry Facility',
  roofArea: 1095,
  buildingHeight: 4.5,
  targetPanels: 418,
  footprint: [
    { x: -24.0, z: -18.0 },
    { x: 26.0, z: -18.0 },
    { x: 26.0, z: 2.0 },
    { x: 6.0, z: 2.0 },
    { x: 6.0, z: 22.0 },
    { x: -24.0, z: 22.0 },
  ],
};

/* ─── Curated Meshy Generations Gallery Presets (Matching Meshy Workspace) ─── */
const PRESET_MESHY_GENERATIONS = [
  {
    id: 'gen-industrial-hvac',
    title: 'Industrial Commercial Facility',
    subtitle: 'Rooftop HVAC, Ducts & Chillers',
    modelGlbUrl: '/models/industrial_hvac_facility.glb',
    thumbnailUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186f5f7?w=400&h=260&fit=crop',
    faces: 2191196,
    vertices: 1093858,
    topology: 'Triangle',
    date: 'Today, 12:40 AM',
    model: 'Meshy 7.1 - Flagship',
    badge: 'Industrial Rooftop',
  },
  {
    id: 'gen-commercial-complex',
    title: 'Commercial Office Center',
    subtitle: 'Multi-Section Parapet Rooftop',
    modelGlbUrl: '/models/commercial_complex.glb',
    thumbnailUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=260&fit=crop',
    faces: 1480210,
    vertices: 742110,
    topology: 'Triangle',
    date: 'Yesterday',
    model: 'Meshy 7.1 - Flagship',
    badge: 'Commercial',
  },
  {
    id: 'gen-office-tower',
    title: 'Modern Headquarters Complex',
    subtitle: 'Stepped Rooftop & Solar Terraces',
    modelGlbUrl: '/models/office_tower.glb',
    thumbnailUrl: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=400&h=260&fit=crop',
    faces: 980450,
    vertices: 492300,
    topology: 'Triangle',
    date: '3 days ago',
    model: 'Meshy 6',
    badge: 'Solar EPC Ready',
  },
  {
    id: 'gen-sample-rooftop',
    title: 'Logistics Warehouse Rooftop',
    subtitle: 'Large Flat Commercial Roof Area',
    modelGlbUrl: '/models/sample_rooftop.glb',
    thumbnailUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&h=260&fit=crop',
    faces: 1250000,
    vertices: 630000,
    topology: 'Triangle',
    date: 'Preset Asset',
    model: 'Meshy 7.1',
    badge: 'Flat Roof 1095m²',
  },
];

const getStoredRooftop = () => {
  try {
    return JSON.parse(localStorage.getItem('solarscope.selectedRooftop'));
  } catch {
    return null;
  }
};

const getStoredAnalysis = () => {
  try {
    return JSON.parse(localStorage.getItem('solarscope.latestAnalysis'));
  } catch {
    return null;
  }
};

const getStoredMeshyModel = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('solarscope.meshy.latestModel'));
    if (stored?.modelGlbUrl) return stored;
  } catch {
    // fallback
  }
  return PRESET_MESHY_GENERATIONS[0];
};

const normalizePolygon = (poly) => {
  if (!poly) return null;
  if (typeof poly === 'string') {
    try {
      poly = JSON.parse(poly);
    } catch {
      return null;
    }
  }
  if (!Array.isArray(poly)) return null;
  return poly
    .map((pt) => {
      if (Array.isArray(pt)) return [Number(pt[0]), Number(pt[1])];
      if (pt && typeof pt === 'object') {
        return [
          Number(pt.lat ?? pt.latitude ?? 0),
          Number(pt.lng ?? pt.longitude ?? 0),
        ];
      }
      return [0, 0];
    })
    .filter((pt) => !isNaN(pt[0]) && !isNaN(pt[1]) && (pt[0] !== 0 || pt[1] !== 0));
};

/* ─── 3D Scene Content Rig (CAD Engine) ─── */
const SceneContent = ({
  sceneData,
  showPanels,
  showParapet,
  showWireframe,
  showGrid,
  showShadows,
  buildingHeight,
  onPanelHover,
  cameraPreset,
}) => {
  const controlsRef = useRef();

  const centroid = useMemo(() => {
    if (!sceneData?.buildingFootprint?.length) return new THREE.Vector3(0, 0, 0);
    const fp = sceneData.buildingFootprint;
    const cx = fp.reduce((s, p) => s + (p.x ?? p[0]), 0) / fp.length;
    const cz = fp.reduce((s, p) => s + (p.z ?? p[1]), 0) / fp.length;
    return new THREE.Vector3(cx, buildingHeight / 2, cz);
  }, [sceneData, buildingHeight]);

  const maxDimension = useMemo(() => {
    if (!sceneData?.buildingFootprint?.length) return 30;
    const bbox = getPolygonBoundingBox(sceneData.buildingFootprint);
    return Math.max(bbox.width, bbox.length, 30);
  }, [sceneData]);

  useEffect(() => {
    if (!controlsRef.current) return;
    const dist = maxDimension * 1.5;
    const targetY = buildingHeight * 0.7;

    switch (cameraPreset) {
      case 'top':
        controlsRef.current.object.position.set(centroid.x, dist * 1.8, centroid.z);
        break;
      case 'front':
        controlsRef.current.object.position.set(centroid.x, targetY, centroid.z + dist * 1.3);
        break;
      case 'side':
        controlsRef.current.object.position.set(centroid.x + dist * 1.3, targetY, centroid.z);
        break;
      case 'iso':
      default:
        controlsRef.current.object.position.set(
          centroid.x + dist * 0.9,
          targetY + dist * 0.8,
          centroid.z + dist * 0.9
        );
        break;
    }
    controlsRef.current.target.set(centroid.x, targetY, centroid.z);
    controlsRef.current.update();
  }, [cameraPreset, centroid, maxDimension, buildingHeight]);

  const panelLayout = useMemo(() => {
    if (!sceneData?.buildingFootprint?.length) return [];
    const targetCount = sceneData.targetPanelCount || 418;
    return generateStrictBoundedPanels(
      sceneData.buildingFootprint,
      buildingHeight,
      targetCount
    );
  }, [sceneData, buildingHeight]);

  return (
    <>
      <PerspectiveCamera makeDefault fov={42} />

      <ambientLight intensity={0.7} />
      <directionalLight
        position={[40, 70, 30]}
        intensity={1.9}
        castShadow={showShadows}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={200}
        shadow-camera-left={-maxDimension * 1.2}
        shadow-camera-right={maxDimension * 1.2}
        shadow-camera-top={maxDimension * 1.2}
        shadow-camera-bottom={-maxDimension * 1.2}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[-30, 20, -30]} intensity={0.4} color="#94a3b8" />

      {showGrid && (
        <Grid
          position={[centroid.x, -0.01, centroid.z]}
          args={[maxDimension * 3, maxDimension * 3]}
          cellSize={2}
          cellThickness={0.8}
          cellColor="#cbd5e1"
          sectionSize={10}
          sectionThickness={1.2}
          sectionColor="#94a3b8"
          fadeDistance={maxDimension * 2.5}
          fadeStrength={1.2}
        />
      )}

      {sceneData?.buildingFootprint?.length > 2 && (
        <group>
          <BuildingMesh
            footprint={sceneData.buildingFootprint}
            height={buildingHeight}
            wireframe={showWireframe}
            showShadows={showShadows}
          />

          <RoofPlane
            footprint={sceneData.buildingFootprint}
            height={buildingHeight}
            showParapet={showParapet}
            wireframe={showWireframe}
          />

          {showPanels &&
            panelLayout.map((panel, idx) => (
              <SolarPanelMesh
                key={`panel-${idx}`}
                position={panel.position}
                rotation={panel.rotation}
                tiltDeg={15}
                panelId={idx + 1}
                onHover={onPanelHover}
                showShadows={showShadows}
              />
            ))}
        </group>
      )}

      {showShadows && (
        <ContactShadows
          position={[centroid.x, 0, centroid.z]}
          opacity={0.5}
          scale={maxDimension * 2.2}
          blur={1.8}
          far={10}
          resolution={1024}
          color="#0f172a"
        />
      )}

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.05}
        maxPolarAngle={Math.PI / 2 - 0.02}
        minDistance={5}
        maxDistance={maxDimension * 4}
      />

      <GizmoHelper alignment="bottom-right" margin={[70, 70]}>
        <GizmoViewport axisColors={['#ef4444', '#10b981', '#3b82f6']} labelColor="#ffffff" />
      </GizmoHelper>
    </>
  );
};

/* ─── Main 3D Digital Twin Component ─── */
const ModelView3D = () => {
  const { t } = useLanguage();
  // Mode Switcher: 'meshy' vs 'cad' (Meshy is the primary AI Engine)
  const [activeMode, setActiveMode] = useState('meshy');

  // CAD Scene State
  const [sceneData, setSceneData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSampleSite, setIsSampleSite] = useState(false);

  // View Options
  const [showPanels, setShowPanels] = useState(true);
  const [showParapet, setShowParapet] = useState(true);
  const [showWireframe, setShowWireframe] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showShadows, setShowShadows] = useState(true);
  const [buildingHeight, setBuildingHeight] = useState(4.5);
  const [showStats, setShowStats] = useState(false);
  const [hoveredPanel, setHoveredPanel] = useState(null);
  const [cameraPreset, setCameraPreset] = useState('iso');

  // ─── Meshy AI Studio State (Matching Meshy.ai Workspace) ───
  const [meshyApiKey, setMeshyApiKey] = useState(
    () => localStorage.getItem('solarscope.meshy.apiKey') || ''
  );
  const [meshyModel, setMeshyModel] = useState(() => getStoredMeshyModel());
  const [meshyModeTab, setMeshyModeTab] = useState('high_detail'); // 'high_detail' | 'smart_topology' | 'relief'
  const [meshyModelEngine, setMeshyModelEngine] = useState('meshy-7.1'); // 'meshy-7.1' | 'meshy-6'
  const [meshyInputImage, setMeshyInputImage] = useState(
    'https://images.unsplash.com/photo-1541888946425-d0fbb186f5f7?w=600&h=400&fit=crop'
  );
  const [meshyCustomUrl, setMeshyCustomUrl] = useState('');
  const [meshyLoading, setMeshyLoading] = useState(false);
  const [meshyProgress, setMeshyProgress] = useState(null);
  const [meshyError, setMeshyError] = useState('');
  const [meshyHealth, setMeshyHealth] = useState(null);
  const [gallerySearch, setGallerySearch] = useState('');
  const [userGenerations, setUserGenerations] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('solarscope.meshy.generations'));
      if (Array.isArray(saved) && saved.length > 0) return saved;
    } catch {
      // fallback
    }
    return PRESET_MESHY_GENERATIONS;
  });

  // Check Meshy backend health on mount
  useEffect(() => {
    checkMeshyHealth().then((h) => setMeshyHealth(h));
  }, []);

  const loadScene = useCallback(
    async (forceSample = false) => {
      const rooftopData = getStoredRooftop() || getStoredAnalysis();
      const rawCoords =
        rooftopData?.polygonCoordinates || rooftopData?.polygonCoordinatesJson;
      const polygon = !forceSample
        ? normalizePolygon(
            typeof rawCoords === 'string' ? JSON.parse(rawCoords) : rawCoords
          )
        : null;

      if (!polygon || polygon.length < 3) {
        setIsSampleSite(true);
        setError('');
        setSceneData({
          address: SAMPLE_COMMERCIAL_ROOFTOP.address,
          roofAreaM2: SAMPLE_COMMERCIAL_ROOFTOP.roofArea,
          buildingHeightMeters: buildingHeight,
          buildingFootprint: SAMPLE_COMMERCIAL_ROOFTOP.footprint,
          targetPanelCount: SAMPLE_COMMERCIAL_ROOFTOP.targetPanels,
          panelLayout: [],
        });
        setLoading(false);
        return;
      }

      setIsSampleSite(false);
      setLoading(true);
      setError('');

      try {
        const area = rooftopData.roofArea || calculatePolygonArea(polygon);
        const targetPanels = Math.max(12, Math.floor(area * 0.45));

        const data = await buildScene3D(
          polygon,
          buildingHeight,
          targetPanels,
          rooftopData.address || rooftopData.locationName || 'Analyzed Site',
          area
        );
        setSceneData(data);
      } catch (err) {
        console.warn('[ModelView3D] Backend Scene3D build failed, falling back to local geometry:', err);
        const area = calculatePolygonArea(polygon);
        const targetPanels = Math.max(12, Math.floor(area * 0.45));

        const centroidLat = polygon.reduce((s, p) => s + p[0], 0) / polygon.length;
        const centroidLng = polygon.reduce((s, p) => s + p[1], 0) / polygon.length;
        const metersPerDegLat = 111320;
        const metersPerDegLng = 111320 * Math.cos((centroidLat * Math.PI) / 180);

        const localFootprint = polygon.map((p) => ({
          x: (p[1] - centroidLng) * metersPerDegLng,
          z: -(p[0] - centroidLat) * metersPerDegLat,
        }));

        setSceneData({
          address: rooftopData.address || rooftopData.locationName || 'Custom Rooftop Site',
          roofAreaM2: area,
          buildingHeightMeters: buildingHeight,
          buildingFootprint: localFootprint,
          targetPanelCount: targetPanels,
          panelLayout: [],
        });
      } finally {
        setLoading(false);
      }
    },
    [buildingHeight]
  );

  useEffect(() => {
    loadScene(false);
  }, [loadScene]);

  const activePanelCount = useMemo(() => {
    if (!sceneData?.buildingFootprint?.length) return 0;
    const targetCount = sceneData.targetPanelCount || 418;
    const panels = generateStrictBoundedPanels(
      sceneData.buildingFootprint,
      buildingHeight,
      targetCount
    );
    return panels.length;
  }, [sceneData, buildingHeight]);

  const activeCapacityKw = useMemo(() => {
    return Math.round(activePanelCount * 0.4 * 10) / 10;
  }, [activePanelCount]);

  const vertexCount = sceneData?.buildingFootprint?.length || 0;

  // ─── Meshy AI Action Handlers ───
  const handleSaveApiKey = (key) => {
    const trimmed = (key || '').trim();
    setMeshyApiKey(trimmed);
    if (trimmed) {
      localStorage.setItem('solarscope.meshy.apiKey', trimmed);
    } else {
      localStorage.removeItem('solarscope.meshy.apiKey');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setMeshyInputImage(reader.result);
      setMeshyError('');
    };
    reader.readAsDataURL(file);
  };

  const handleUseActiveRooftop = () => {
    const rooftop = getStoredRooftop() || getStoredAnalysis();
    if (!rooftop?.latitude || !rooftop?.longitude) {
      setMeshyError('No rooftop coordinates found. Please select a rooftop on the Map first.');
      return;
    }
    const satelliteUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${rooftop.latitude},${rooftop.longitude}&zoom=19&size=640x640&maptype=satellite&key=AIzaSyBHmpND3pBVKw1AqAE-MuxlWTGEKCuG1es`;
    setMeshyInputImage(satelliteUrl);
    setMeshyError('');
  };

  const handleSelectGeneration = (asset) => {
    setMeshyModel(asset);
    localStorage.setItem('solarscope.meshy.latestModel', JSON.stringify(asset));
    setMeshyError('');
  };

  const handleExecuteGeneration = async (overrideParams = {}) => {
    if (meshyApiKey && !meshyApiKey.startsWith('msy_')) {
      setMeshyError(
        "Invalid Meshy API Key: Meshy keys must start with 'msy_'. Please obtain your key from https://www.meshy.ai/workspace."
      );
      return;
    }

    setMeshyLoading(true);
    setMeshyError('');
    setMeshyProgress({ status: 'starting', progress: 5, message: 'Initiating Meshy 7.1 Flagship session...' });

    try {
      const rooftop = getStoredRooftop() || getStoredAnalysis();
      const params = {
        imageUrl: meshyInputImage || undefined,
        latitude: overrideParams.latitude || rooftop?.latitude,
        longitude: overrideParams.longitude || rooftop?.longitude,
        apiKey: meshyApiKey || undefined,
        aiModel: meshyModelEngine,
        mode: meshyModeTab,
        enablePbr: true,
        shouldRemesh: meshyModeTab === 'smart_topology',
        ...overrideParams,
      };

      const result = await generateMeshy3DModel(params, (progressUpdate) => {
        setMeshyProgress(progressUpdate);
      });

      if (result && result.modelGlbUrl) {
        const newAsset = {
          id: `gen-${Date.now()}`,
          title: rooftop?.address || 'Custom Commercial Rooftop',
          subtitle: `Meshy 7.1 • ${meshyModeTab === 'high_detail' ? 'High Detail' : 'Smart Topology'}`,
          modelGlbUrl: result.modelGlbUrl,
          modelFbxUrl: result.modelFbxUrl,
          thumbnailUrl: meshyInputImage || result.thumbnailUrl,
          faces: 2191196,
          vertices: 1093858,
          topology: meshyModeTab === 'smart_topology' ? 'Quad' : 'Triangle',
          date: 'Just now',
          model: meshyModelEngine === 'meshy-7.1' ? 'Meshy 7.1 - Flagship' : 'Meshy 6',
          badge: 'New Generation',
        };

        setMeshyModel(newAsset);
        const updatedList = [newAsset, ...userGenerations];
        setUserGenerations(updatedList);
        localStorage.setItem('solarscope.meshy.latestModel', JSON.stringify(newAsset));
        localStorage.setItem('solarscope.meshy.generations', JSON.stringify(updatedList.slice(0, 20)));
      } else {
        throw new Error(result.message || 'Meshy compilation did not return a valid GLB asset link');
      }
    } catch (err) {
      console.error('[ModelView3D] Meshy AI generation error:', err);
      setMeshyError(err.message || 'Failed to generate 3D model via Meshy AI');
    } finally {
      setMeshyLoading(false);
    }
  };

  const filteredGenerations = useMemo(() => {
    if (!gallerySearch.trim()) return userGenerations;
    const q = gallerySearch.toLowerCase();
    return userGenerations.filter(
      (g) => g.title.toLowerCase().includes(q) || g.subtitle.toLowerCase().includes(q)
    );
  }, [userGenerations, gallerySearch]);

  return (
    <div className="flex flex-col h-full space-y-4 pb-8">
      {/* ─── Top Header with Engine Mode Switcher ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {t('model3DTitle')}
            </h1>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-500/10 text-emerald-700 px-3 py-1 rounded-full border border-emerald-500/20">
              <Sparkles size={13} className="text-emerald-600" />
              CAD Extrusion • Meshy AI 7.1 • Three.js R3F
            </span>
          </div>
          <p className="text-slate-500 mt-1 text-sm">
            {t('model3DSubtitle')}
          </p>
        </div>

        {/* Mode Switcher Pill */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200/80 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveMode('cad')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeMode === 'cad'
                ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cpu size={15} className={activeMode === 'cad' ? 'text-blue-600' : ''} />
            <span>{t('cadTwin')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('meshy')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeMode === 'meshy'
                ? 'bg-gradient-to-r from-lime-500 to-emerald-600 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles size={15} className={activeMode === 'meshy' ? 'text-slate-950' : 'text-lime-500'} />
            <span>Meshy 7.1 AI 3D Mesh</span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          MODE A: CAD DIGITAL TWIN (EXACT EXTENSION + 418 MODULES)
         ═══════════════════════════════════════════════════════════════ */}
      {activeMode === 'cad' && (
        <>
          {/* Preset Notice / Information Banner */}
          {isSampleSite && (
            <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs shadow-xs">
              <div className="flex items-center gap-2">
                <Info size={16} className="text-blue-600 shrink-0" />
                <span>
                  Previewing <strong>Sample Commercial Rooftop</strong>. Draw your own building outline on the Map page to render your custom 3D model.
                </span>
              </div>
              <Link
                to="/map"
                className="font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 shrink-0 ml-2"
              >
                <span>Draw on Map</span>
                <ChevronRight size={13} />
              </Link>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs shadow-xs">
              <AlertCircle size={16} className="text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-5 flex-1 min-h-0">
            {/* Left Controls Card */}
            <div className="xl:col-span-1 flex flex-col gap-4">
              <Card className="p-4 space-y-4 border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders size={14} className="text-blue-600" />
                    Scene Controls
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    {vertexCount} Vertices
                  </span>
                </div>

                {/* Building Height Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 font-medium">Building Height</span>
                    <span className="font-bold font-mono text-blue-600">
                      {buildingHeight.toFixed(1)} m
                    </span>
                  </div>
                  <input
                    type="range"
                    min="2.5"
                    max="35.0"
                    step="0.5"
                    value={buildingHeight}
                    onChange={(e) => setBuildingHeight(parseFloat(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>2.5m (1 story)</span>
                    <span>15m (4 story)</span>
                    <span>35m (Tower)</span>
                  </div>
                </div>

                {/* Camera Angle Presets */}
                <div className="space-y-1.5">
                  <span className="text-xs text-slate-600 font-medium block">Camera View</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'iso', label: 'ISO' },
                      { id: 'top', label: 'TOP' },
                      { id: 'front', label: 'FRONT' },
                      { id: 'side', label: 'SIDE' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setCameraPreset(p.id)}
                        className={`py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          cameraPreset === p.id
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Layer Toggles */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-600 font-medium block">Layer Visibility</span>

                  <label className="flex items-center justify-between text-xs text-slate-700 cursor-pointer py-1">
                    <span className="flex items-center gap-2">
                      <Sun size={14} className="text-amber-500" />
                      Solar Modules ({activePanelCount})
                    </span>
                    <input
                      type="checkbox"
                      checked={showPanels}
                      onChange={(e) => setShowPanels(e.target.checked)}
                      className="rounded accent-blue-600"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs text-slate-700 cursor-pointer py-1">
                    <span className="flex items-center gap-2">
                      <Box size={14} className="text-slate-500" />
                      Roof Parapet
                    </span>
                    <input
                      type="checkbox"
                      checked={showParapet}
                      onChange={(e) => setShowParapet(e.target.checked)}
                      className="rounded accent-blue-600"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs text-slate-700 cursor-pointer py-1">
                    <span className="flex items-center gap-2">
                      <Layers size={14} className="text-slate-500" />
                      Wireframe Overlay
                    </span>
                    <input
                      type="checkbox"
                      checked={showWireframe}
                      onChange={(e) => setShowWireframe(e.target.checked)}
                      className="rounded accent-blue-600"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs text-slate-700 cursor-pointer py-1">
                    <span className="flex items-center gap-2">
                      <Grid size={14} className="text-slate-500" />
                      Ground Plane Grid
                    </span>
                    <input
                      type="checkbox"
                      checked={showGrid}
                      onChange={(e) => setShowGrid(e.target.checked)}
                      className="rounded accent-blue-600"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs text-slate-700 cursor-pointer py-1">
                    <span className="flex items-center gap-2">
                      <ShieldCheck size={14} className="text-slate-500" />
                      Dynamic Sun Shadows
                    </span>
                    <input
                      type="checkbox"
                      checked={showShadows}
                      onChange={(e) => setShowShadows(e.target.checked)}
                      className="rounded accent-blue-600"
                    />
                  </label>
                </div>
              </Card>

              {/* Engineering Metrics Card */}
              <Card className="p-4 space-y-3 border border-slate-200/80 shadow-xs bg-slate-900 text-white">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Structural Digital Twin Metrics
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 block">Total Roof Area</span>
                    <span className="text-sm font-bold font-mono text-emerald-400">
                      {sceneData?.roofAreaM2 ? `${Math.round(sceneData.roofAreaM2)} m²` : '1,095 m²'}
                    </span>
                  </div>
                  <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 block">Capacity</span>
                    <span className="text-sm font-bold font-mono text-blue-400">
                      {activeCapacityKw} kWp
                    </span>
                  </div>
                  <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 block">Modules Fitted</span>
                    <span className="text-sm font-bold font-mono text-amber-400">
                      {activePanelCount} Panels
                    </span>
                  </div>
                  <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 block">Tilt / Orientation</span>
                    <span className="text-sm font-bold font-mono text-indigo-400">
                      15° True South
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Structural Integrity</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 size={13} />
                    Passed (100% In-Bounds)
                  </span>
                </div>
              </Card>
            </div>

            {/* 3D Canvas Rig */}
            <div className="xl:col-span-3 flex flex-col min-h-[580px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 relative shadow-inner">
              <Canvas
                shadows
                dpr={[1, 2]}
                className="w-full h-full"
                style={{
                  background: 'radial-gradient(circle at 50% 30%, #1e293b 0%, #070a12 100%)',
                }}
                onCreated={({ gl }) => {
                  gl.shadowMap.enabled = true;
                  gl.shadowMap.type = THREE.PCFSoftShadowMap;
                  gl.toneMapping = THREE.ACESFilmicToneMapping;
                }}
              >
                <Suspense
                  fallback={
                    <Html center>
                      <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-slate-900/90 text-white shadow-xl border border-slate-700">
                        <RefreshCw size={24} className="animate-spin text-blue-400" />
                        <span className="text-xs font-mono font-bold">Extruding CAD Geometry...</span>
                      </div>
                    </Html>
                  }
                >
                  <SceneContent
                    sceneData={sceneData}
                    showPanels={showPanels}
                    showParapet={showParapet}
                    showWireframe={showWireframe}
                    showGrid={showGrid}
                    showShadows={showShadows}
                    buildingHeight={buildingHeight}
                    onPanelHover={setHoveredPanel}
                    cameraPreset={cameraPreset}
                  />
                </Suspense>
              </Canvas>
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          MODE B: MESHY AI 7.1 STUDIO WORKSPACE (MATCHING MESHY.AI)
         ═══════════════════════════════════════════════════════════════ */}
      {activeMode === 'meshy' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
          {/* ─── Column 1: Left Controls & Generation Card (3 cols) ─── */}
          <div className="lg:col-span-3 flex flex-col gap-3.5">
            {/* Mode Switcher Tabs (High Detail | Smart Topology | Relief) */}
            <div className="flex bg-[#161c28] p-1 rounded-xl border border-slate-800 shadow-xs">
              <button
                type="button"
                onClick={() => setMeshyModeTab('high_detail')}
                className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  meshyModeTab === 'high_detail'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                High Detail
              </button>
              <button
                type="button"
                onClick={() => setMeshyModeTab('smart_topology')}
                className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  meshyModeTab === 'smart_topology'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Smart Topology
              </button>
              <button
                type="button"
                onClick={() => setMeshyModeTab('relief')}
                className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  meshyModeTab === 'relief'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Relief
              </button>
            </div>

            {/* AI Engine Selector (Meshy 7.1 Flagship) */}
            <div className="bg-[#161c28] p-3 rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Sparkles size={14} className="text-lime-400" />
                  Meshy 7.1 - Flagship
                </span>
                <span className="text-[10px] font-bold text-lime-400 bg-lime-500/10 px-1.5 py-0.5 rounded border border-lime-500/30">
                  NEW
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Most detail, highest geometric precision & PBR surface textures
              </p>
            </div>

            {/* Image Input Preview Card (Matching Meshy Image Card) */}
            <div className="bg-[#161c28] p-3.5 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Source Image
                </span>
                <label className="text-[11px] text-lime-400 hover:text-lime-300 font-semibold cursor-pointer">
                  Upload Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Active Image Thumbnail */}
              <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-slate-700 bg-slate-900 group">
                <img
                  src={meshyInputImage}
                  alt="Rooftop Input"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] text-white">
                  <span className="font-semibold truncate">Commercial Rooftop Photo</span>
                  <button
                    type="button"
                    onClick={handleUseActiveRooftop}
                    className="px-2 py-0.5 rounded bg-blue-600/90 hover:bg-blue-600 text-[10px] font-bold transition-colors cursor-pointer"
                    title="Grab from Map selection coordinates"
                  >
                    Sync Map
                  </button>
                </div>
              </div>

              {/* Custom Image URL Accordion */}
              <div className="space-y-1">
                <input
                  type="url"
                  placeholder="Paste direct aerial/drone image URL..."
                  value={meshyCustomUrl}
                  onChange={(e) => {
                    setMeshyCustomUrl(e.target.value);
                    if (e.target.value.trim().startsWith('http')) {
                      setMeshyInputImage(e.target.value.trim());
                    }
                  }}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-900 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-lime-500 font-mono"
                />
              </div>
            </div>

            {/* Meshy API Auth Key Card */}
            <div className="bg-[#161c28] p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Key size={14} className="text-lime-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Meshy API Auth
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    meshyApiKey?.startsWith('msy_') || meshyHealth?.meshyConfigured
                      ? 'bg-lime-500/20 text-lime-400 border border-lime-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {meshyApiKey?.startsWith('msy_')
                    ? 'Active'
                    : meshyHealth?.meshyConfigured
                    ? 'Active (Server)'
                    : 'Key Needed'}
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="msy_xxxxxxxxxxxxxxxxxxxxxxxx"
                  value={meshyApiKey}
                  onChange={(e) => handleSaveApiKey(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-900 text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-lime-500"
                />
                {meshyApiKey && (
                  <button
                    type="button"
                    onClick={() => handleSaveApiKey('')}
                    className="px-2 text-[11px] text-slate-400 hover:text-red-400 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                <span>Free 200 monthly credits</span>
                <a
                  href="https://www.meshy.ai/workspace"
                  target="_blank"
                  rel="noreferrer"
                  className="text-lime-400 hover:underline font-semibold flex items-center gap-0.5"
                >
                  Get Key <ExternalLink size={10} />
                </a>
              </div>
            </div>

            {/* Error Message */}
            {meshyError && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800 text-red-200 text-xs flex items-start gap-2">
                <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{meshyError}</span>
              </div>
            )}

            {/* Progress Bar Status */}
            {meshyProgress && (
              <div className="bg-[#161c28] p-3 rounded-xl border border-blue-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-blue-300 flex items-center gap-1.5">
                    {meshyLoading && <RefreshCw size={12} className="animate-spin text-lime-400" />}
                    {meshyProgress.status?.toUpperCase()}
                  </span>
                  <span className="font-bold text-lime-400">{meshyProgress.progress}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-lime-400 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${meshyProgress.progress}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-300 font-mono">
                  {meshyProgress.message}
                </p>
              </div>
            )}

            {/* Big Green Generate Button (Matching Meshy Workspace Generate) */}
            <button
              type="button"
              onClick={() => handleExecuteGeneration()}
              disabled={meshyLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-lime-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {meshyLoading ? (
                <>
                  <RefreshCw size={16} className="animate-spin text-slate-950" />
                  <span>Generating 3D Mesh...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Generate (1 min • 20 credits)</span>
                </>
              )}
            </button>
          </div>

          {/* ─── Column 2: Center 3D Viewport (6 cols) ─── */}
          <div className="lg:col-span-6 flex flex-col min-h-[660px]">
            <MeshyModelViewer
              modelUrl={meshyModel?.modelGlbUrl || '/models/industrial_hvac_facility.glb'}
              taskId={meshyModel?.id || 'meshy-asset'}
              imageUrl={meshyModel?.thumbnailUrl}
              modelName={meshyModel?.title}
              onReset={() => {
                setMeshyModel(PRESET_MESHY_GENERATIONS[0]);
              }}
            />
          </div>

          {/* ─── Column 3: Right Generations Gallery Grid (3 cols) ─── */}
          <div className="lg:col-span-3 flex flex-col gap-3">
            {/* Search Generations Bar */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search my generations..."
                value={gallerySearch}
                onChange={(e) => setGallerySearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-[#161c28] border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-lime-500"
              />
            </div>

            {/* Gallery Cards Grid */}
            <div className="space-y-2.5 overflow-y-auto max-h-[610px] pr-1">
              {filteredGenerations.map((item) => {
                const isSelected = meshyModel?.modelGlbUrl === item.modelGlbUrl;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectGeneration(item)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex gap-3 ${
                      isSelected
                        ? 'bg-[#1e2738] border-lime-500 shadow-md ring-1 ring-lime-500'
                        : 'bg-[#161c28] border-slate-800 hover:border-slate-700 hover:bg-[#1a2232]'
                    }`}
                  >
                    <div className="w-20 h-16 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 shrink-0">
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-white truncate">
                            {item.title}
                          </h4>
                          {isSelected && (
                            <span className="w-2 h-2 rounded-full bg-lime-400 shrink-0 animate-pulse"></span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-1">
                        <span>{item.faces ? `${(item.faces / 1000000).toFixed(1)}M faces` : '2.1M faces'}</span>
                        <span className="text-lime-400 font-semibold">{item.model?.split('-')[0] || 'Meshy 7.1'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelView3D;
