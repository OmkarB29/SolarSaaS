import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Cpu,
  Sun,
  Layers,
  Zap,
  Banknote,
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Clock,
  History,
  Trash2,
  FileDown,
  ArrowRight,
  RefreshCw,
  Check,
  ShieldCheck,
  Gauge,
  HelpCircle,
  X,
  ChevronRight,
  TrendingUp,
  MapPin,
  Compass,
  Square
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import PanelMapViewer from '../components/map/PanelMapViewer';
import { panelOptimizerService } from '../services/panelOptimizerService';
import { downloadSolarPotentialReport, downloadPanelOptimizationReport } from '../services/reportService';

const DEFAULT_DIMENSIONS = {
  lengthMeters: 2.1,
  widthMeters: 1.1,
  powerWatts: 550,
};

const formatNumber = (value, digits = 0) =>
  value === null || value === undefined
    ? '-'
    : new Intl.NumberFormat('en-IN', { maximumFractionDigits: digits }).format(value);

const formatCurrency = (value) =>
  value === null || value === undefined
    ? '₹0'
    : `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value)}`;

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

const normalizePolygon = (poly) => {
  if (!poly || !Array.isArray(poly)) return null;
  return poly
    .map((pt) => {
      if (Array.isArray(pt)) return [Number(pt[0]), Number(pt[1])];
      if (pt && typeof pt === 'object') return [Number(pt.lat ?? pt.latitude), Number(pt.lng ?? pt.longitude)];
      return [0, 0];
    })
    .filter((pt) => !isNaN(pt[0]) && !isNaN(pt[1]) && (pt[0] !== 0 || pt[1] !== 0));
};

const PanelOptimizer = () => {
  const routerLocation = useLocation();
  const navigate = useNavigate();

  // Retrieve rooftop polygon from navigation state or localStorage
  const rooftop = routerLocation.state?.rooftop || getStoredRooftop() || getStoredAnalysis();

  const rawCoords = rooftop?.polygonCoordinates || rooftop?.polygonCoordinatesJson;
  const initialPoly = normalizePolygon(
    typeof rawCoords === 'string' ? JSON.parse(rawCoords) : rawCoords
  );

  const [polygonCoordinates, setPolygonCoordinates] = useState(initialPoly);
  const [address, setAddress] = useState(
    rooftop?.address || rooftop?.location || rooftop?.locationName || 'Rooftop Solar Site'
  );
  const [latitude, setLatitude] = useState(rooftop?.latitude || 18.5204);
  const [longitude, setLongitude] = useState(rooftop?.longitude || 73.8567);
  const [roofArea, setRoofArea] = useState(rooftop?.roofArea || rooftop?.area || rooftop?.roofAreaM2 || 0);

  // Configurable Panel Dimensions
  const [dimensions, setDimensions] = useState(DEFAULT_DIMENSIONS);
  const [tempDimensions, setTempDimensions] = useState(DEFAULT_DIMENSIONS);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Optimization Layout States
  const [layouts, setLayouts] = useState([]);
  const [activeMode, setActiveMode] = useState('BALANCED');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Save / Persistence States
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');
  const [savedLayoutId, setSavedLayoutId] = useState(null);

  // History Drawer / Modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Active Layout Object
  const activeLayout = useMemo(() => {
    if (!layouts || layouts.length === 0) return null;
    return layouts.find(l => l.mode === activeMode) || layouts[0];
  }, [layouts, activeMode]);

  // Request Layout Optimization from Backend Engine
  const fetchOptimizedLayouts = async (poly, dims) => {
    if (!poly || poly.length < 3) {
      setError('A valid rooftop polygon with at least 3 points is required. Please draw on the map first.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSaveSuccess('');

    try {
      const payload = {
        polygonCoordinates: poly,
        address,
        latitude,
        longitude,
        roofArea,
        analysisId: rooftop?.id || null,
        panelDimensions: dims,
      };

      const results = await panelOptimizerService.optimizeLayouts(payload);
      setLayouts(results || []);
      if (results && results.length > 0) {
        // Default to BALANCED mode if present
        const hasBalanced = results.some(l => l.mode === 'BALANCED');
        setActiveMode(hasBalanced ? 'BALANCED' : results[0].mode);
      }
    } catch (err) {
      console.error('Optimization error:', err);
      setError(err.message || 'Failed to optimize panel placement.');
    } finally {
      setIsLoading(false);
    }
  };

  // Run initial optimization when polygon is available
  useEffect(() => {
    const handleUpdate = () => {
      const updated = getStoredRooftop() || getStoredAnalysis();
      if (updated) {
        const rawCoords = updated.polygonCoordinates || updated.polygonCoordinatesJson;
        const poly = normalizePolygon(typeof rawCoords === 'string' ? JSON.parse(rawCoords) : rawCoords);
        if (poly && poly.length >= 3) {
          setPolygonCoordinates(poly);
        }
        if (updated.address || updated.location || updated.locationName) {
          setAddress(updated.address || updated.location || updated.locationName);
        }
        if (updated.latitude) setLatitude(updated.latitude);
        if (updated.longitude) setLongitude(updated.longitude);
        if (updated.roofArea || updated.area) setRoofArea(updated.roofArea || updated.area);
      }
    };
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('solarscope:analysis-updated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('solarscope:analysis-updated', handleUpdate);
    };
  }, []);

  useEffect(() => {
    if (polygonCoordinates && polygonCoordinates.length >= 3) {
      fetchOptimizedLayouts(polygonCoordinates, dimensions);
    }
  }, [polygonCoordinates]);

  // Save Layout to PostgreSQL and update Analysis & Proposals
  const handleSaveLayout = async () => {
    if (!activeLayout) return;
    setIsSaving(true);
    setSaveSuccess('');
    setSaveError('');

    try {
      const payload = {
        analysisId: rooftop?.id || null,
        roofArea: activeLayout.roofArea,
        usableArea: activeLayout.usableArea,
        panelCount: activeLayout.panelCount,
        systemCapacityKw: activeLayout.systemCapacityKw,
        annualGenerationKwh: activeLayout.annualGenerationKwh,
        roofUtilizationPercent: activeLayout.roofUtilizationPercent,
        optimizationScore: activeLayout.optimizationScore,
        layoutMode: activeLayout.mode,
        layoutJson: JSON.stringify({
          mode: activeLayout.mode,
          title: activeLayout.title,
          dimensions,
          panels: activeLayout.panels,
          comparison: activeLayout.comparison,
          aiInsights: activeLayout.aiInsights,
        }),
      };

      const saved = await panelOptimizerService.saveLayout(payload);
      setSavedLayoutId(saved.id);
      setSaveSuccess(`Layout saved successfully! Saved layout #${saved.id} and synchronized Analysis and Proposals.`);
      setTimeout(() => setSaveSuccess(''), 6000);
    } catch (err) {
      setSaveError(err.message || 'Failed to persist layout.');
    } finally {
      setIsSaving(false);
    }
  };

  // Open History Modal
  const handleOpenHistory = async () => {
    setShowHistoryModal(true);
    setIsLoadingHistory(true);
    try {
      const hist = await panelOptimizerService.getHistory();
      setHistoryList(hist || []);
    } catch (err) {
      console.warn('Failed to load history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Apply Configurable Dimensions
  const handleApplyDimensions = (e) => {
    e.preventDefault();
    setDimensions(tempDimensions);
    setShowSettingsModal(false);
    fetchOptimizedLayouts(polygonCoordinates, tempDimensions);
  };

  // Load a historical layout
  const handleLoadHistoricalLayout = (item) => {
    try {
      if (item.layoutJson) {
        const parsed = JSON.parse(item.layoutJson);
        if (parsed.dimensions) setDimensions(parsed.dimensions);
      }
      setActiveMode(item.layoutMode);
      setShowHistoryModal(false);
      fetchOptimizedLayouts(polygonCoordinates, dimensions);
    } catch (err) {
      console.warn('Error loading historical layout:', err);
    }
  };

  // Delete saved layout
  const handleDeleteLayout = async (id, e) => {
    e.stopPropagation();
    try {
      await panelOptimizerService.deleteLayout(id);
      setHistoryList(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.warn('Failed to delete layout:', err);
    }
  };

  // Export PDF Report
  const handleExportReport = () => {
    if (!activeLayout) return;
    try {
      downloadPanelOptimizationReport(activeLayout, rooftop, dimensions, layouts);
    } catch (err) {
      console.error('Failed to generate layout report PDF:', err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Navigation Info */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900">AI Panel Placement Optimizer</h1>
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-indigo-500/10 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-500/20">
              <Cpu size={13} className="text-indigo-600" />
              Phase 3 • Vector Geometry Engine
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
            <span className="flex items-center gap-1 font-medium text-slate-700">
              <MapPin size={13} className="text-slate-400" />
              {address}
            </span>
            <span>•</span>
            <span className="font-mono text-slate-500">
              {latitude.toFixed(4)}° N, {longitude.toFixed(4)}° E
            </span>
            {roofArea > 0 && (
              <>
                <span>•</span>
                <span className="text-slate-700 font-medium">Roof Area: {formatNumber(roofArea, 1)} m²</span>
              </>
            )}
            <span>•</span>
            <span className="text-indigo-600 font-medium">
              Modules: {dimensions.lengthMeters}m × {dimensions.widthMeters}m ({dimensions.powerWatts}W)
            </span>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setTempDimensions(dimensions);
              setShowSettingsModal(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
          >
            <Sliders size={14} className="text-slate-500" />
            <span>Panel Dimensions</span>
          </button>

          <button
            type="button"
            onClick={handleOpenHistory}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
          >
            <History size={14} className="text-slate-500" />
            <span>Layout History</span>
          </button>

          <button
            type="button"
            onClick={handleExportReport}
            disabled={!activeLayout}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            title="Export AI Panel Placement Optimization Report PDF"
          >
            <FileDown size={14} className="text-slate-500" />
            <span>Export Report</span>
          </button>

          <button
            type="button"
            onClick={handleSaveLayout}
            disabled={!activeLayout || isSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white px-5 py-2 text-xs font-semibold shadow-xs shadow-indigo-500/30 transition-all cursor-pointer"
          >
            {isSaving ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Saving Layout...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={14} />
                <span>Save Selected Layout</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Alert Banners */}
      {saveSuccess && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}
      {saveError && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium">
          <AlertCircle size={18} className="text-rose-600 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-amber-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Link
            to="/map"
            className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 hover:underline shrink-0"
          >
            <span>Draw on Map</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      )}

      {/* Empty State if no polygon */}
      {(!polygonCoordinates || polygonCoordinates.length < 3) && !isLoading && (
        <Card className="p-12 text-center space-y-4 border-dashed border-2 border-slate-200">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Compass size={28} />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-900">No Rooftop Polygon Detected</h3>
            <p className="text-xs text-slate-500">
              Draw a rooftop polygon on the interactive map to automatically generate and compare optimized panel placement layouts.
            </p>
          </div>
          <Link
            to="/map"
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 text-xs font-semibold shadow-xs"
          >
            <span>Go to Map Selection</span>
            <ArrowRight size={14} />
          </Link>
        </Card>
      )}

      {/* Main Optimizer Experience */}
      {polygonCoordinates && polygonCoordinates.length >= 3 && (
        <>
          {/* Layout Mode Selector Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {layouts.map((l) => {
              const isActive = l.mode === activeMode;
              return (
                <button
                  key={l.mode}
                  type="button"
                  onClick={() => setActiveMode(l.mode)}
                  className={`text-left p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                    isActive
                      ? 'border-indigo-600 bg-white ring-2 ring-indigo-500/20 shadow-md'
                      : 'border-slate-200 bg-white/70 hover:bg-white hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  {isActive && (
                    <div className="absolute top-0 right-0 w-8 h-8 bg-indigo-600 text-white flex items-center justify-center rounded-bl-xl shadow-xs">
                      <Check size={14} strokeWidth={3} />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        l.mode === 'MAXIMUM_CAPACITY' ? 'bg-amber-500' : (l.mode === 'BALANCED' ? 'bg-emerald-500' : 'bg-indigo-500')
                      }`} />
                      <h4 className="text-sm font-bold text-slate-900">{l.title}</h4>
                    </div>

                    <p className="text-2xs text-slate-500 line-clamp-2 leading-relaxed">
                      {l.description}
                    </p>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-2xs">
                      <div>
                        <span className="text-slate-400 font-medium">Panels: </span>
                        <strong className="text-slate-900 text-xs">{l.panelCount}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Capacity: </span>
                        <strong className="text-indigo-600 text-xs">{l.systemCapacityKw} kW</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Score: </span>
                        <strong className="text-emerald-600 text-xs">{l.optimizationScore}/100</strong>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Comparison Dashboard (Side-by-Side Metrics & Improvements) */}
          <Card className="p-5 border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp size={18} className="text-indigo-600" />
                  <span>Layout Comparison & Performance Metrics</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Compare density, power generation, and surface utilization against basic unaligned placement.
                </p>
              </div>

              {activeLayout?.comparison && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-2xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                    +{activeLayout.comparison.capacityIncreasePercent}% Capacity vs Baseline
                  </span>
                  <span className="text-2xs font-semibold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                    +{activeLayout.comparison.generationIncreasePercent}% Generation
                  </span>
                </div>
              )}
            </div>

            {/* Comparison Grid Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 text-3xs uppercase tracking-wider font-bold">
                    <th className="py-2.5 px-3">Layout Mode</th>
                    <th className="py-2.5 px-3">Panel Count</th>
                    <th className="py-2.5 px-3">System Capacity</th>
                    <th className="py-2.5 px-3">Annual Generation</th>
                    <th className="py-2.5 px-3">Roof Utilization</th>
                    <th className="py-2.5 px-3">Optimization Score</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {layouts.map((l) => {
                    const isCurrent = l.mode === activeMode;
                    return (
                      <tr
                        key={l.mode}
                        onClick={() => setActiveMode(l.mode)}
                        className={`cursor-pointer transition-colors ${
                          isCurrent ? 'bg-indigo-50/50 text-indigo-950 font-bold' : 'hover:bg-slate-50/70 text-slate-700'
                        }`}
                      >
                        <td className="py-3 px-3 flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            l.mode === 'MAXIMUM_CAPACITY' ? 'bg-amber-500' : (l.mode === 'BALANCED' ? 'bg-emerald-500' : 'bg-indigo-500')
                          }`} />
                          <span>{l.title}</span>
                          {isCurrent && (
                            <span className="text-3xs uppercase font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded-sm">
                              Viewing
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">{l.panelCount} modules</td>
                        <td className="py-3 px-3 font-bold text-slate-900">{l.systemCapacityKw} kWp</td>
                        <td className="py-3 px-3 text-indigo-700 font-bold">{formatNumber(l.annualGenerationKwh)} kWh/yr</td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span>{l.roofUtilizationPercent}%</span>
                            <div className="w-16 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                              <div
                                className="h-full bg-indigo-600 rounded-full"
                                style={{ width: `${Math.min(100, l.roofUtilizationPercent)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-2xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {l.optimizationScore} / 100
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMode(l.mode);
                            }}
                            className={`px-3 py-1 rounded-lg text-2xs font-semibold cursor-pointer ${
                              isCurrent
                                ? 'bg-indigo-600 text-white shadow-2xs'
                                : 'border border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {isCurrent ? 'Active' : 'Select'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Middle Section: Leaflet Interactive Vector Map & Usable Area Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Leaflet Vector Placement Map */}
            <div className="lg:col-span-2 h-[480px] w-full">
              <PanelMapViewer
                center={[latitude, longitude]}
                polygonCoordinates={polygonCoordinates}
                panels={activeLayout?.panels || []}
                activeMode={activeMode}
                panelDimensions={dimensions}
              />
            </div>

            {/* Right Column: Usable Area Breakdown & Active Metrics */}
            <div className="lg:col-span-1 space-y-4">
              {/* Usable Area Analysis Card */}
              <Card className="p-5 border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Square size={15} className="text-indigo-600" />
                    <span>Usable Area Analysis</span>
                  </h4>
                  <span className="text-2xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    {activeLayout?.mode || 'BALANCED'}
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Total Rooftop Area</span>
                    <strong className="text-slate-900">{formatNumber(activeLayout?.roofArea, 1)} m²</strong>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Active Panel Surface</span>
                    <strong className="text-blue-700">{formatNumber(activeLayout?.usedArea, 1)} m²</strong>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Unused Area & Aisles</span>
                    <strong className="text-amber-700">{formatNumber(activeLayout?.unusedArea, 1)} m²</strong>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Roof Surface Utilization</span>
                    <strong className="text-emerald-700 font-bold text-sm">{activeLayout?.roofUtilizationPercent}%</strong>
                  </div>
                </div>

                {/* Progress bar visual */}
                <div className="pt-2 space-y-1">
                  <div className="flex justify-between text-3xs text-slate-400 font-medium">
                    <span>Panel Coverage ({activeLayout?.roofUtilizationPercent}%)</span>
                    <span>Aisles & Setbacks ({(100 - (activeLayout?.roofUtilizationPercent || 0)).toFixed(1)}%)</span>
                  </div>
                  <div className="h-2.5 w-full bg-amber-100 rounded-full overflow-hidden flex">
                    <div
                      className="bg-blue-600 h-full transition-all duration-500"
                      style={{ width: `${activeLayout?.roofUtilizationPercent || 0}%` }}
                    />
                    <div
                      className="bg-amber-400 h-full transition-all duration-500"
                      style={{ width: `${100 - (activeLayout?.roofUtilizationPercent || 0)}%` }}
                    />
                  </div>
                </div>
              </Card>

              {/* Optimization Score Card */}
              <Card className="p-5 border-slate-200 bg-linear-to-br from-white to-indigo-50/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Optimization Score</span>
                  <Gauge size={18} className="text-indigo-600" />
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-indigo-700">
                    {activeLayout?.optimizationScore || 90}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">/ 100</span>
                </div>

                <p className="text-2xs text-slate-500 leading-relaxed">
                  Composite score factoring roof utilization density, maintenance aisle clearance, winter solstice spacing, and panel ventilation.
                </p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-2xs text-slate-600">
                  <span>Specific Yield:</span>
                  <strong className="text-slate-900">{activeLayout?.specificYieldKwhPerKwp || 1540} kWh/kWp</strong>
                </div>
              </Card>
            </div>
          </div>

          {/* AI Solar Advisor Layout Insights Section */}
          <Card className="p-5 border-indigo-200/70 bg-linear-to-r from-indigo-50/30 via-white to-sky-50/20">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">AI Solar Advisor Layout Insights</h3>
                <p className="text-xs text-slate-500">
                  Strategic trade-offs and operational engineering recommendations for {activeLayout?.title}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              {activeLayout?.aiInsights?.map((insight, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs"
                >
                  <div className="p-1 rounded-full bg-emerald-100 text-emerald-600 shrink-0 mt-0.5">
                    <Check size={13} strokeWidth={3} />
                  </div>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">
                    {insight}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* Panel Dimensions Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                <Sliders size={18} className="text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Configurable Panel Dimensions</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleApplyDimensions} className="p-5 space-y-4">
              <p className="text-xs text-slate-500">
                Adjust module geometry and wattage. All 3 optimization modes will recalculate dynamically to fit the new panel size.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Panel Length (meters)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.5"
                    max="4.0"
                    value={tempDimensions.lengthMeters}
                    onChange={(e) => setTempDimensions({ ...tempDimensions, lengthMeters: parseFloat(e.target.value) || 2.1 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <span className="text-3xs text-slate-400 mt-0.5 block">Standard: 2.1 m</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Panel Width (meters)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.5"
                    max="3.0"
                    value={tempDimensions.widthMeters}
                    onChange={(e) => setTempDimensions({ ...tempDimensions, widthMeters: parseFloat(e.target.value) || 1.1 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <span className="text-3xs text-slate-400 mt-0.5 block">Standard: 1.1 m</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Module Power Rating (Watts)
                  </label>
                  <input
                    type="number"
                    step="10"
                    min="100"
                    max="900"
                    value={tempDimensions.powerWatts}
                    onChange={(e) => setTempDimensions({ ...tempDimensions, powerWatts: parseFloat(e.target.value) || 550 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <span className="text-3xs text-slate-400 mt-0.5 block">Standard: 550 W (Monocrystalline)</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-2xs text-slate-600 flex justify-between">
                <span>Calculated Panel Surface:</span>
                <strong className="text-indigo-700 font-bold">
                  {(tempDimensions.lengthMeters * tempDimensions.widthMeters).toFixed(2)} m²
                </strong>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Apply & Recalculate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Saved Layouts History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in fade-in duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                  <History size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Optimization History</h3>
                  <p className="text-xs text-slate-500">Previously saved panel placement layouts and configurations</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              {isLoadingHistory ? (
                <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
                  <RefreshCw size={20} className="animate-spin text-indigo-600" />
                  <span className="text-xs">Loading saved layout history...</span>
                </div>
              ) : historyList.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Cpu size={28} className="mx-auto text-slate-300" />
                  <p className="text-xs">No saved optimization layouts found for this account.</p>
                </div>
              ) : (
                historyList.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleLoadHistoricalLayout(item)}
                    className="rounded-xl border border-slate-200 hover:border-indigo-300 p-4 space-y-3 transition-colors bg-white shadow-2xs cursor-pointer group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          Layout #{item.id}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-2xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {item.layoutMode}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-2xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {item.optimizationScore}/100
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-2xs text-slate-400 font-medium">
                          {new Date(item.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteLayout(item.id, e)}
                          className="p-1 rounded-md text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete saved layout"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-2xs text-slate-500 pt-1 border-t border-slate-100">
                      <span>Panels: <strong className="text-slate-900">{item.panelCount}</strong></span>
                      <span>Capacity: <strong className="text-indigo-700">{item.systemCapacityKw} kW</strong></span>
                      <span>Generation: <strong className="text-emerald-700">{formatNumber(item.annualGenerationKwh)} kWh</strong></span>
                      <span>Utilization: <strong className="text-slate-900">{item.roofUtilizationPercent}%</strong></span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PanelOptimizer;
