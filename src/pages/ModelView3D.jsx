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
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { useLanguage } from '../context/LanguageContext';
import {
  BuildingMesh,
  RoofPlane,
  SolarPanelMesh,
} from '../components/scene3d/BuildingScene3D';
import { TripoModelViewer } from '../components/scene3d/TripoModelViewer';
import { buildScene3D } from '../services/scene3DService';
import {
  generateTripo3DModel,
  checkTripoHealth,
} from '../services/tripo3DService';
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

/* ─── Storage Retrieval Helpers ─── */
const getStoredRooftop = () => {
  try {
    return JSON.parse(localStorage.getItem('solarscope.rooftop'));
  } catch {
    return null;
  }
};

const getStoredAnalysis = () => {
  try {
    return JSON.parse(localStorage.getItem('latestAnalysis'));
  } catch {
    return null;
  }
};

const getStoredTripoModel = () => {
  try {
    return JSON.parse(localStorage.getItem('solarscope.tripo.latestModel'));
  } catch {
    return null;
  }
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
    return new THREE.Vector3(cx, buildingHeight * 0.5, cz);
  }, [sceneData, buildingHeight]);

  const boundingRadius = useMemo(() => {
    return Math.max(25, (sceneData?.sceneBoundingRadiusMeters || 35) * 1.5);
  }, [sceneData]);

  const cameraPos = useMemo(() => {
    const r = boundingRadius;
    const cx = centroid.x;
    const cz = centroid.z;

    if (cameraPreset === 'top') {
      return new THREE.Vector3(cx, r * 1.5, cz + 0.01);
    }
    if (cameraPreset === 'south') {
      return new THREE.Vector3(cx, r * 0.65, cz + r * 1.1);
    }
    return new THREE.Vector3(cx + r * 0.85, r * 0.95, cz + r * 0.85);
  }, [boundingRadius, centroid, cameraPreset]);

  const finalPanels = useMemo(() => {
    if (!sceneData?.buildingFootprint || sceneData.buildingFootprint.length < 3) {
      return [];
    }

    const footprint = sceneData.buildingFootprint;
    const targetCount = sceneData.targetPanelCount || 418;

    if (Array.isArray(sceneData.panels) && sceneData.panels.length > 0) {
      const strictlyBounded = sceneData.panels
        .filter((panel) => {
          const cx = panel.center?.x ?? 0;
          const cz = panel.center?.z ?? 0;
          const w = panel.widthMeters || 1.13;
          const l = panel.lengthMeters || 2.27;
          const azRad = THREE.MathUtils.degToRad((panel.azimuthDegrees || 180) - 180);
          return isPanelWithinBoundary(cx, cz, w, l, azRad, footprint, 0.2);
        })
        .map((panel, idx) => ({
          ...panel,
          panelNumber: idx + 1,
          center: {
            ...panel.center,
            y: buildingHeight + 0.05,
          },
        }));

      if (strictlyBounded.length >= 15) {
        return strictlyBounded.slice(0, targetCount);
      }
    }

    return generateStrictBoundedPanels(
      footprint,
      buildingHeight,
      targetCount,
      {
        panelWidth: 1.13,
        panelLength: 2.27,
        gapX: 0.22,
        gapZ: 0.45,
        margin: 0.25,
        azimuthDegrees: 180,
        tiltDegrees: 14,
        powerWatts: 400,
      }
    );
  }, [sceneData, buildingHeight]);

  return (
    <>
      <PerspectiveCamera makeDefault position={cameraPos} fov={45} near={0.1} far={2000} />
      <OrbitControls
        ref={controlsRef}
        target={centroid}
        enableDamping
        dampingFactor={0.06}
        maxPolarAngle={Math.PI / 2 - 0.02}
        minDistance={5}
        maxDistance={650}
      />

      <ambientLight intensity={0.65} color="#e6effa" />
      <directionalLight
        position={[65, 110, 50]}
        intensity={2.6}
        color="#fffbeb"
        castShadow={showShadows}
        shadow-bias={-0.0003}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={350}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
      />
      <directionalLight position={[-45, 30, -35]} intensity={0.4} color="#94a3b8" />
      <hemisphereLight skyColor="#dbeafe" groundColor="#78716c" intensity={0.5} />

      {showShadows && (
        <ContactShadows
          position={[0, 0, 0]}
          opacity={0.65}
          scale={220}
          blur={1.8}
          far={50}
          resolution={1024}
          color="#0f172a"
        />
      )}

      {showGrid && (
        <Grid
          args={[400, 400]}
          position={[0, -0.01, 0]}
          cellSize={1}
          cellThickness={0.4}
          cellColor="#94a3b8"
          sectionSize={10}
          sectionThickness={1.0}
          sectionColor="#64748b"
          fadeDistance={220}
          fadeStrength={1.2}
          followCamera={false}
          infiniteGrid
        />
      )}

      {sceneData?.buildingFootprint && (
        <>
          <BuildingMesh
            footprint={sceneData.buildingFootprint}
            height={buildingHeight}
            showWireframe={showWireframe}
          />
          <RoofPlane
            footprint={sceneData.buildingFootprint}
            height={buildingHeight}
            showParapet={showParapet}
          />
        </>
      )}

      {showPanels &&
        finalPanels.map((panel) => (
          <SolarPanelMesh
            key={panel.panelNumber}
            panel={panel}
            onHover={onPanelHover}
          />
        ))}

      <Suspense fallback={null}>
        <Environment preset="city" />
      </Suspense>

      <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
        <GizmoViewport
          axisColors={['#ef4444', '#22c55e', '#3b82f6']}
          labelColor="white"
        />
      </GizmoHelper>
    </>
  );
};

/* ─── Interactive Panel Telemetry Tooltip ─── */
const PanelTooltip = ({ panel }) => {
  if (!panel) return null;
  return (
    <Html
      position={[
        panel.center?.x ?? 0,
        (panel.center?.y ?? 4.5) + 1.8,
        panel.center?.z ?? 0,
      ]}
      center
      occlude
    >
      <div className="pointer-events-none bg-slate-950/95 text-white text-xs rounded-xl px-3 py-2 shadow-2xl border border-blue-500/40 min-w-[150px] backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1 mb-1.5">
          <span className="font-bold text-blue-400">PV Module #{panel.panelNumber}</span>
          <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded font-mono">
            {panel.powerWatts || 400}W
          </span>
        </div>
        <div className="space-y-1 text-[11px] text-slate-300">
          <div className="flex justify-between">
            <span className="text-slate-400">Orientation:</span>
            <span className="font-semibold text-white">{panel.orientation || 'PORTRAIT'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Azimuth / Tilt:</span>
            <span className="font-mono text-emerald-400">
              {panel.azimuthDegrees || 180}° / {panel.tiltDegrees || 14}°
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Status:</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <ShieldCheck size={11} /> Bounded
            </span>
          </div>
        </div>
      </div>
    </Html>
  );
};

/* ─── WebGL Canvas Error Boundary ─── */
class CanvasErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[CanvasErrorBoundary] 3D Canvas error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[620px] flex flex-col items-center justify-center p-8 bg-slate-950 text-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
            <AlertCircle size={28} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">3D Rendering Encountered an Issue</h3>
            <p className="text-xs text-slate-400 max-w-md font-mono bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              {this.state.error?.message || 'WebGL Context / Geometry Error'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              this.props.onRetry?.();
            }}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-md"
          >
            <RefreshCw size={14} />
            <span>Reload 3D Canvas</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ─── Main View Component ─── */
const ModelView3D = () => {
  const { t } = useLanguage();
  // Mode Switcher: 'cad' vs 'tripo'
  const [activeMode, setActiveMode] = useState('cad');

  // CAD Scene State
  const [sceneData, setSceneData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSampleSite, setIsSampleSite] = useState(false);

  // Viewport toggles
  const [showPanels, setShowPanels] = useState(true);
  const [showParapet, setShowParapet] = useState(true);
  const [showWireframe, setShowWireframe] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showShadows, setShowShadows] = useState(true);
  const [buildingHeight, setBuildingHeight] = useState(4.5);
  const [showStats, setShowStats] = useState(false);
  const [hoveredPanel, setHoveredPanel] = useState(null);
  const [cameraPreset, setCameraPreset] = useState('iso');

  // Tripo AI State
  const [tripoApiKey, setTripoApiKey] = useState(
    () => localStorage.getItem('solarscope.tripo.apiKey') || ''
  );
  const [tripoCustomUrl, setTripoCustomUrl] = useState('');
  const [tripoLoading, setTripoLoading] = useState(false);
  const [tripoProgress, setTripoProgress] = useState(null);
  const [tripoModel, setTripoModel] = useState(() => getStoredTripoModel());
  const [tripoError, setTripoError] = useState('');
  const [tripoHealth, setTripoHealth] = useState(null);

  // Check Tripo health on mount
  useEffect(() => {
    checkTripoHealth().then((h) => setTripoHealth(h));
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
        const bbox = getPolygonBoundingBox(SAMPLE_COMMERCIAL_ROOFTOP.footprint);
        const maxR = Math.max(bbox.width, bbox.length) * 0.7;

        setSceneData({
          address: SAMPLE_COMMERCIAL_ROOFTOP.address,
          roofAreaM2: SAMPLE_COMMERCIAL_ROOFTOP.roofArea,
          buildingHeightMeters: buildingHeight,
          buildingFootprint: SAMPLE_COMMERCIAL_ROOFTOP.footprint,
          targetPanelCount: SAMPLE_COMMERCIAL_ROOFTOP.targetPanels,
          panels: [],
          sceneBoundingRadiusMeters: maxR,
        });
        return;
      }

      setIsSampleSite(false);
      setIsLoading(true);
      setError('');

      try {
        const analysisData = getStoredAnalysis();
        let candidatePanels = [];
        if (Array.isArray(rooftopData.panels)) {
          candidatePanels = rooftopData.panels;
        } else if (Array.isArray(rooftopData.googleSolarData?.solarPanels)) {
          candidatePanels = rooftopData.googleSolarData.solarPanels;
        } else if (Array.isArray(analysisData?.panels)) {
          candidatePanels = analysisData.panels;
        }

        const targetPanelCount =
          analysisData?.estimatedPanels ||
          analysisData?.panels ||
          rooftopData?.estimatedPanels ||
          418;

        const payload = {
          polygonCoordinates: polygon,
          panels: candidatePanels,
          buildingHeightMeters: buildingHeight,
          layoutMode: analysisData?.layoutMode || 'BALANCED',
          address:
            rooftopData.address ||
            rooftopData.location ||
            rooftopData.locationName ||
            'Custom Traced Commercial Rooftop',
          roofAreaM2: rooftopData.roofArea || rooftopData.area || 0,
          targetPanelCount: typeof targetPanelCount === 'number' ? targetPanelCount : 418,
        };

        const scene = await buildScene3D(payload);
        if (scene) {
          scene.targetPanelCount = payload.targetPanelCount;
        }
        setSceneData(scene);
      } catch (err) {
        console.error('[ModelView3D] Scene build error:', err);
        setError(err.message || 'Failed to render 3D scene.');
      } finally {
        setIsLoading(false);
      }
    },
    [buildingHeight]
  );

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

  // Derived CAD telemetry metrics
  const activePanelCount = useMemo(() => {
    if (!sceneData?.buildingFootprint) return 0;
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

  // Tripo AI Action Handlers
  const handleSaveApiKey = (key) => {
    setTripoApiKey(key);
    localStorage.setItem('solarscope.tripo.apiKey', key);
  };

  const executeTripoGeneration = async (genParams) => {
    setTripoLoading(true);
    setTripoError('');
    setTripoProgress({ status: 'starting', progress: 5, message: 'Initiating Tripo AI V3 session...' });

    try {
      const result = await generateTripo3DModel(
        {
          ...genParams,
          apiKey: tripoApiKey || undefined,
        },
        (progressUpdate) => {
          setTripoProgress(progressUpdate);
        }
      );

      if (result && result.modelGlbUrl) {
        setTripoModel(result);
        localStorage.setItem('solarscope.tripo.latestModel', JSON.stringify(result));
      } else {
        throw new Error(result.message || 'Model compilation did not return a valid GLB asset link');
      }
    } catch (err) {
      console.error('[ModelView3D] Tripo AI generation error:', err);
      setTripoError(err.message || 'Failed to generate 3D model via Tripo AI');
    } finally {
      setTripoLoading(false);
    }
  };

  const handleGenerateFromActiveRooftop = () => {
    const rooftop = getStoredRooftop() || getStoredAnalysis();
    if (!rooftop?.latitude || !rooftop?.longitude) {
      setTripoError('No rooftop coordinates found. Please select a rooftop on the Map first.');
      return;
    }

    executeTripoGeneration({
      latitude: rooftop.latitude,
      longitude: rooftop.longitude,
      zoom: 19,
    });
  };

  const handleGenerateFromUrl = () => {
    if (!tripoCustomUrl.trim()) {
      setTripoError('Please enter a valid image URL');
      return;
    }
    executeTripoGeneration({ imageUrl: tripoCustomUrl.trim() });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      // For large images, direct data URLs can be submitted or uploaded
      executeTripoGeneration({ imageUrl: reader.result });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col h-full space-y-4 pb-8">
      {/* ─── Top Header with Mode Switcher ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900">
              {t('model3DTitle')}
            </h1>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-500/10 text-blue-700 px-3 py-1 rounded-full border border-blue-500/20">
              <Sparkles size={13} className="text-blue-600" />
              CAD Extrusion • Tripo AI V3 • Three.js R3F
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
            onClick={() => setActiveMode('tripo')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeMode === 'tripo'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wand2 size={15} />
            <span>{t('tripoMesh')}</span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          MODE A: CAD DIGITAL TWIN (EXACT EXTENSION + 418 MODULES)
         ══════════════════════════════════════════════════════════ */}
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
                className="inline-flex items-center gap-1 font-bold text-blue-700 hover:underline shrink-0"
              >
                <span>Trace on Map</span>
                <ChevronRight size={13} />
              </Link>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm shadow-sm">
              <div className="flex items-center gap-2">
                <AlertCircle size={18} className="text-amber-600 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => loadScene(true)}
                className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 hover:underline cursor-pointer"
              >
                <span>Load Sample Complex</span>
                <ChevronRight size={13} />
              </button>
            </div>
          )}

          {/* ─── Main Viewport Grid ─── */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-5 flex-1 min-h-0">
            {/* Left Side Controls & Telemetry */}
            <div className="xl:col-span-1 flex flex-col gap-4">
              {/* Active 3D Telemetry */}
              {sceneData && (
                <Card className="p-4 space-y-3 border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Site Telemetry
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <ShieldCheck size={11} /> 100% Bounded
                    </span>
                  </div>
                  <div className="space-y-2 text-xs divide-y divide-slate-100">
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-500">Site</span>
                      <span className="font-semibold text-slate-800 text-right truncate max-w-[130px]">
                        {sceneData.address}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1.5">
                      <span className="text-slate-500">Boundary Nodes</span>
                      <span className="font-semibold text-slate-800">
                        {vertexCount} Vertices
                      </span>
                    </div>
                    <div className="flex justify-between pt-1.5">
                      <span className="text-slate-500">Roof Area</span>
                      <span className="font-semibold text-slate-800">
                        {sceneData.roofAreaM2?.toLocaleString('en-IN')} m²
                      </span>
                    </div>
                    <div className="flex justify-between pt-1.5">
                      <span className="text-slate-500">PV Modules</span>
                      <strong className="text-blue-700 font-bold">
                        {activePanelCount} panels
                      </strong>
                    </div>
                    <div className="flex justify-between pt-1.5">
                      <span className="text-slate-500">Total Capacity</span>
                      <strong className="text-emerald-700 font-bold">
                        {activeCapacityKw} kWp
                      </strong>
                    </div>
                    <div className="flex justify-between pt-1.5">
                      <span className="text-slate-500">Hardware Mount</span>
                      <span className="font-semibold text-slate-800">14° Southern Tilt</span>
                    </div>
                  </div>
                </Card>
              )}

              {/* Building Height Extrusion Slider */}
              <Card className="p-4 space-y-3 border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Extrusion Height
                  </span>
                  <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/60">
                    {buildingHeight.toFixed(1)} m
                  </span>
                </div>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="2.5"
                    max="25.0"
                    step="0.5"
                    value={buildingHeight}
                    onChange={(e) => setBuildingHeight(Number(e.target.value))}
                    className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-indigo-600 bg-slate-200"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                    <span>1 Floor (3m)</span>
                    <span>Commercial (8m)</span>
                    <span>High (25m)</span>
                  </div>
                </div>
              </Card>

              {/* Camera View Angle Presets */}
              <Card className="p-4 space-y-2.5 border border-slate-200/80 shadow-xs">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Camera Angles
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCameraPreset('iso')}
                    className={`px-2 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer text-center ${
                      cameraPreset === 'iso'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    3D Iso
                  </button>
                  <button
                    type="button"
                    onClick={() => setCameraPreset('top')}
                    className={`px-2 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer text-center ${
                      cameraPreset === 'top'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Top Plan
                  </button>
                  <button
                    type="button"
                    onClick={() => setCameraPreset('south')}
                    className={`px-2 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer text-center ${
                      cameraPreset === 'south'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    South Sun
                  </button>
                </div>
              </Card>

              {/* Viewport Layer Toggles */}
              <Card className="p-4 space-y-3 border border-slate-200/80 shadow-xs">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Viewport Layers
                </span>
                <div className="space-y-1.5">
                  <label className="flex items-center justify-between cursor-pointer p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Layers size={14} className="text-blue-600" />
                      <span className="text-xs font-medium text-slate-700">
                        Solar Panel Array
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={showPanels}
                      onChange={(e) => setShowPanels(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={14} className="text-amber-500" />
                      <span className="text-xs font-medium text-slate-700">
                        Parapet Border Wall
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={showParapet}
                      onChange={(e) => setShowParapet(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500 h-4 w-4 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Box size={14} className="text-slate-600" />
                      <span className="text-xs font-medium text-slate-700">
                        Facade Wireframe
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={showWireframe}
                      onChange={(e) => setShowWireframe(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Sparkles size={14} className="text-amber-500" />
                      <span className="text-xs font-medium text-slate-700">
                        PCF Soft Shadows
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={showShadows}
                      onChange={(e) => setShowShadows(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Compass size={14} className="text-slate-500" />
                      <span className="text-xs font-medium text-slate-700">
                        Ground Metric Grid
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={showGrid}
                      onChange={(e) => setShowGrid(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                    />
                  </label>
                </div>
              </Card>

              {/* Action Buttons */}
              <button
                type="button"
                onClick={() => loadScene()}
                disabled={isLoading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 py-3 text-xs font-bold transition-all cursor-pointer shadow-sm disabled:opacity-50"
              >
                <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                <span>{isLoading ? 'Extruding 3D...' : 'Rebuild CAD Scene'}</span>
              </button>
            </div>

            {/* ─── 3D WebGL Canvas ─── */}
            <Card
              className="xl:col-span-4 p-0 overflow-hidden relative shadow-md border border-slate-200"
              style={{ minHeight: '620px' }}
            >
              {isLoading && (
                <div className="absolute inset-0 bg-slate-950/70 z-20 flex flex-col items-center justify-center gap-3 backdrop-blur-xs">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center animate-pulse">
                    <Box size={24} className="text-blue-400" />
                  </div>
                  <p className="text-white font-semibold text-sm">
                    Projecting Custom Polygon & Filtering PV Matrix...
                  </p>
                  <p className="text-slate-400 text-xs">
                    Executing 2D ray-casting Point-in-Polygon containment pass
                  </p>
                </div>
              )}

              {sceneData ? (
                <CanvasErrorBoundary onRetry={loadScene}>
                  <Canvas
                    shadows
                    dpr={[1, 2]}
                    className="w-full h-full"
                    style={{
                      minHeight: '620px',
                      background: 'radial-gradient(circle at 50% 30%, #1e293b 0%, #090d16 100%)',
                    }}
                    onCreated={({ gl }) => {
                      gl.shadowMap.enabled = true;
                      gl.shadowMap.type = THREE.PCFSoftShadowMap;
                      gl.toneMapping = THREE.ACESFilmicToneMapping;
                      gl.toneMappingExposure = 1.15;
                    }}
                  >
                    {showStats && <Stats />}

                    <Suspense fallback={null}>
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
                      {hoveredPanel && <PanelTooltip panel={hoveredPanel} />}
                    </Suspense>
                  </Canvas>
                </CanvasErrorBoundary>
              ) : null}

              {/* Watermark Overlay */}
              <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 bg-slate-950/85 px-3 py-1.5 rounded-xl backdrop-blur-md border border-slate-800 shadow-md">
                <Sun size={13} className="text-amber-400 animate-pulse" />
                <span className="text-[11px] font-bold text-slate-200 tracking-wide">
                  SolarScope CAD Twin
                </span>
                <span className="text-[10px] text-emerald-400 border-l border-slate-700 pl-2 font-medium">
                  Strictly Bounded • {activePanelCount} Modules
                </span>
              </div>
            </Card>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════
          MODE B: TRIPO AI GENERATIVE 3D MESH (V3 PIPELINE)
         ══════════════════════════════════════════════════════════ */}
      {activeMode === 'tripo' && (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-5 flex-1 min-h-0">
          {/* Left Side Tripo Controls */}
          <div className="xl:col-span-2 flex flex-col gap-4">
            {/* Tripo API Key Card */}
            <Card className="p-4 space-y-3 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key size={16} className="text-blue-600" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Tripo API V3 Auth
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    tripoHealth?.configured || tripoApiKey
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {tripoHealth?.configured || tripoApiKey ? 'Active' : 'Key Needed'}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 font-medium block">
                  Client Secret / API Key
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="Enter Tripo secret key (or uses backend default)"
                    value={tripoApiKey}
                    onChange={(e) => handleSaveApiKey(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                  />
                  {tripoApiKey && (
                    <button
                      type="button"
                      onClick={() => handleSaveApiKey('')}
                      className="px-2 py-1 text-[11px] text-slate-400 hover:text-red-500"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">
                  {tripoHealth?.configured
                    ? 'Default server key configured in application.properties'
                    : 'Paste the Tripo API Key created from platform.tripo3d.ai'}
                </p>
              </div>
            </Card>

            {/* Generation Methods Card */}
            <Card className="p-4 space-y-3.5 border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                3D Generation Trigger
              </span>

              {/* Option 1: 1-Click from Active Map Rooftop */}
              <button
                type="button"
                onClick={handleGenerateFromActiveRooftop}
                disabled={tripoLoading}
                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center gap-2.5">
                  <Wand2 size={16} />
                  <span>Generate from Active Rooftop Satellite</span>
                </div>
                <ChevronRight size={14} />
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-[10px] uppercase font-bold text-slate-400">
                  Or Custom Image
                </span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Option 2: Image URL */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-600 font-medium block">
                  Image URL (Satellite / Aerial Drone Photo)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://example.com/rooftop.jpg"
                    value={tripoCustomUrl}
                    onChange={(e) => setTripoCustomUrl(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateFromUrl}
                    disabled={tripoLoading || !tripoCustomUrl.trim()}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Go
                  </button>
                </div>
              </div>

              {/* Option 3: Local File Upload */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-600 font-medium block">
                  Upload Photo from Computer
                </label>
                <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/20">
                  <Upload size={18} className="text-slate-400 mb-1" />
                  <span className="text-xs text-slate-600 font-medium">
                    Choose local JPG / PNG image
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Satellite top-down or 45° aerial view works best
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={tripoLoading}
                  />
                </label>
              </div>
            </Card>

            {/* Generation Progress Status */}
            {tripoProgress && (
              <Card className="p-4 space-y-2.5 border border-blue-200 bg-blue-50/50 shadow-xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-blue-900 flex items-center gap-1.5">
                    {tripoLoading && <RefreshCw size={13} className="animate-spin text-blue-600" />}
                    <span>Tripo V3 Engine: {tripoProgress.status?.toUpperCase()}</span>
                  </span>
                  <span className="font-mono font-bold text-blue-700">
                    {tripoProgress.progress || 0}%
                  </span>
                </div>

                <div className="w-full bg-blue-200/60 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(5, tripoProgress.progress || 0)}%` }}
                  />
                </div>

                <p className="text-[11px] text-blue-800 font-medium">
                  {tripoProgress.message || 'Processing 3D geometry...'}
                </p>
              </Card>
            )}

            {/* Error Message */}
            {tripoError && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs shadow-xs">
                <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <strong className="block font-bold">Tripo AI Error</strong>
                  <span>{tripoError}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Side 3D Canvas / Model Display */}
          <div className="xl:col-span-3">
            {tripoModel?.modelGlbUrl ? (
              <TripoModelViewer
                modelUrl={tripoModel.modelGlbUrl}
                taskId={tripoModel.taskId}
                imageUrl={tripoModel.originalImageUrl}
                onReset={() => {
                  setTripoModel(null);
                  localStorage.removeItem('solarscope.tripo.latestModel');
                }}
              />
            ) : (
              <Card
                className="w-full h-full min-h-[620px] flex flex-col items-center justify-center p-8 text-center bg-slate-950 border border-slate-800"
              >
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mb-4">
                  <Wand2 size={28} className="text-blue-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">
                  Tripo AI V3 Generative 3D Mesh
                </h3>
                <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
                  Programmatically convert 2D aerial rooftop imagery into an interactive, photorealistic 3D building mesh powered by Tripo AI’s V3 geometry and PBR engine.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg w-full text-left">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-blue-400 font-bold uppercase block mb-0.5">
                      Step 1
                    </span>
                    <strong className="text-xs text-white block">Input Photo</strong>
                    <span className="text-[11px] text-slate-400">
                      Use map satellite crop or upload image
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-blue-400 font-bold uppercase block mb-0.5">
                      Step 2
                    </span>
                    <strong className="text-xs text-white block">AI V3 Mesh</strong>
                    <span className="text-[11px] text-slate-400">
                      Tripo compiles geometry in ~15-20s
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-blue-400 font-bold uppercase block mb-0.5">
                      Step 3
                    </span>
                    <strong className="text-xs text-white block">3D & Export</strong>
                    <span className="text-[11px] text-slate-400">
                      360° R3F orbit & download .GLB
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateFromActiveRooftop}
                  disabled={tripoLoading}
                  className="mt-6 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-5 py-3 rounded-xl shadow-lg shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Wand2 size={15} />
                  <span>Start 3D Generation with Active Rooftop</span>
                </button>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelView3D;
