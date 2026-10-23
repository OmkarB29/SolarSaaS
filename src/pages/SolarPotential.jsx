import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { 
  Sun, 
  Layers, 
  Zap, 
  Banknote, 
  PiggyBank, 
  Compass, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  FileDown, 
  ArrowRight, 
  RefreshCw, 
  Check, 
  ShieldCheck, 
  Home, 
  TreePine, 
  Gauge, 
  Calendar,
  Sparkles,
  Info,
  CloudSun,
  Thermometer,
  Bot,
  History,
  Clock,
  ShieldAlert,
  X,
  ChevronRight
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { solarApiService } from '../services/solarApiService';
import { aiRecommendationService } from '../services/aiRecommendationService';
import { downloadSolarPotentialReport } from '../services/reportService';
import InteractiveMap from '../components/map/InteractiveMap';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

const formatNumber = (value, digits = 0) =>
  value === null || value === undefined
    ? '-'
    : new Intl.NumberFormat('en-IN', { maximumFractionDigits: digits }).format(value);

const formatCurrency = (value) =>
  value === null || value === undefined
    ? '₹0'
    : `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value)}`;

const BADGE_CONFIG = {
  EXCELLENT: {
    label: 'Excellent Solar Potential',
    bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    dot: 'bg-emerald-500',
    description: 'High annual irradiance and optimal solar window ideal for maximum generation.'
  },
  GOOD: {
    label: 'Good Solar Potential',
    bg: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    dot: 'bg-blue-500',
    description: 'Favorable solar exposure with strong, consistent generation capacity across all seasons.'
  },
  MODERATE: {
    label: 'Moderate Solar Potential',
    bg: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    dot: 'bg-amber-500',
    description: 'Viable solar capture with minor seasonal weather or cloud cover variances.'
  },
  LOW: {
    label: 'Low Solar Potential',
    bg: 'bg-rose-500/10 text-rose-600 border-rose-500/30',
    dot: 'bg-rose-500',
    description: 'Limited solar irradiance or high cloud cover factors.'
  }
};

const getAssessmentBadgeStyle = (assessment, type = 'standard') => {
  const clean = (assessment || '').toUpperCase();
  if (type === 'risk') {
    if (clean.includes('LOW')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (clean.includes('MED')) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (clean.includes('HIGH')) return 'bg-rose-50 text-rose-700 border-rose-200';
    return 'bg-slate-50 text-slate-700 border-slate-200';
  }
  if (type === 'battery') {
    if (clean.includes('RECOMMENDED') && !clean.includes('NOT')) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    if (clean.includes('OPTIONAL')) return 'bg-sky-50 text-sky-700 border-sky-200';
    return 'bg-slate-50 text-slate-700 border-slate-200';
  }
  if (clean.includes('EXCELLENT')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (clean.includes('GOOD')) return 'bg-blue-50 text-blue-700 border-blue-200';
  if (clean.includes('MODERATE')) return 'bg-amber-50 text-amber-700 border-amber-200';
  if (clean.includes('POOR')) return 'bg-rose-50 text-rose-700 border-rose-200';
  return 'bg-slate-50 text-slate-700 border-slate-200';
};

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

const SolarPotential = () => {
  const routerLocation = useLocation();
  const navigate = useNavigate();

  // Retrieve coordinates from navigation state, stored rooftop, or recent analysis
  const rooftop = routerLocation.state?.rooftop || getStoredRooftop() || getStoredAnalysis();

  const [latitude, setLatitude] = useState(rooftop?.latitude || 18.5204);
  const [longitude, setLongitude] = useState(rooftop?.longitude || 73.8567);
  const [address, setAddress] = useState(rooftop?.address || rooftop?.location || rooftop?.locationName || 'Selected Rooftop Site');
  const [polygonCoordinates, setPolygonCoordinates] = useState(rooftop?.polygonCoordinates || null);
  const [roofArea, setRoofArea] = useState(rooftop?.roofArea || rooftop?.area || 0);

  const [solarData, setSolarData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');

  // AI Recommendation Engine state
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiSuccess, setAiSuccess] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [aiHistory, setAiHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Fetch technical solar potential assessment from backend (PVGIS + Weather API)
  const fetchSolarPotential = async (lat, lng, area, addr) => {
    setIsLoading(true);
    setError('');
    setSaveSuccess('');
    setSaveError('');

    try {
      const data = await solarApiService.getSolarPotential(lat, lng, area, addr);
      setSolarData(data);
    } catch (err) {
      console.warn('Solar potential assessment notice:', err.message);
      setError(err.message || 'Solar data unavailable for this rooftop.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleUpdate = () => {
      const updated = getStoredRooftop() || getStoredAnalysis();
      if (updated) {
        if (updated.latitude) setLatitude(updated.latitude);
        if (updated.longitude) setLongitude(updated.longitude);
        if (updated.address || updated.location || updated.locationName) {
          setAddress(updated.address || updated.location || updated.locationName);
        }
        if (updated.polygonCoordinates) setPolygonCoordinates(updated.polygonCoordinates);
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
    if (latitude && longitude) {
      fetchSolarPotential(latitude, longitude, roofArea, address);
    } else {
      setIsLoading(false);
    }
  }, [latitude, longitude, roofArea]);

  // Load latest AI recommendation on component mount
  useEffect(() => {
    const fetchLatestAI = async () => {
      try {
        const latest = await aiRecommendationService.getLatestRecommendation();
        if (latest) {
          setAiRecommendation(latest);
        }
      } catch (err) {
        console.warn('Could not load latest AI recommendation:', err);
      }
    };
    fetchLatestAI();
  }, []);

  // Handle saving solar analysis to PostgreSQL (atomically populates solar_potential, analysis, proposals, reports)
  const handleSaveAnalysis = async () => {
    if (!solarData) return;
    setIsSaving(true);
    setSaveError('');
    setSaveSuccess('');

    try {
      const payload = {
        analysisId: rooftop?.id || null,
        latitude: solarData.latitude,
        longitude: solarData.longitude,
        address: solarData.address,
        roofAreaM2: solarData.roofAreaM2,
        annualIrradianceKwhM2: solarData.annualIrradianceKwhM2,
        annualGenerationKwh: solarData.annualGenerationKwh,
        peakSunHours: solarData.peakSunHours,
        cloudCoverPercent: solarData.cloudCoverPercent,
        temperatureAvg: solarData.temperatureAvg,
        systemSizeKWp: solarData.systemSizeKWp,
        estimatedPanelCount: solarData.estimatedPanelCount,
        weatherAdjustmentFactor: solarData.weatherAdjustmentFactor,
        roofUtilizationPercent: solarData.roofUtilizationPercent,
        annualSavings: solarData.annualSavings,
        paybackPeriod: solarData.paybackYears || solarData.paybackPeriod,
        paybackYears: solarData.paybackYears || solarData.paybackPeriod,
        carbonOffsetKg: solarData.carbonOffsetKg,
        homesPowered: solarData.homesPowered,
        solarScore: solarData.solarScore,
        recommendationLevel: solarData.recommendationLevel,
        polygonCoordinatesJson: polygonCoordinates ? JSON.stringify(polygonCoordinates) : solarData.polygonCoordinatesJson,
      };

      const saved = await solarApiService.saveSolarPotential(payload);
      setSolarData(prev => ({ ...prev, id: saved.id }));
      setSaveSuccess(`Assessment saved! Records created in Solar Potential (#${saved.id}), History, My Proposals, and Reports.`);
      setTimeout(() => setSaveSuccess(''), 6000);
    } catch (err) {
      setSaveError(err.message || 'Failed to save solar assessment.');
    } finally {
      setIsSaving(false);
    }
  };

  // Generate AI Recommendation
  const handleGenerateAIRecommendation = async () => {
    if (!solarData) return;
    setIsGeneratingAI(true);
    setAiError('');
    setAiSuccess('');

    try {
      const payload = {
        analysisId: solarData.id || rooftop?.id || null,
        solarScore: solarData.solarScore || 80,
        systemSizeKWp: solarData.systemSizeKWp || 0,
        annualGeneration: solarData.annualGenerationKwh || solarData.annualEnergyKwh || 0,
        annualSavings: solarData.annualSavings || 0,
        paybackPeriod: solarData.paybackYears || solarData.paybackPeriod || 0,
        estimatedPanelCount: solarData.estimatedPanelCount || solarData.maxArrayPanels || 0,
        roofAreaM2: solarData.roofAreaM2 || roofArea || 0,
        address: solarData.address || address || 'Rooftop Site',
        latitude: solarData.latitude || latitude,
        longitude: solarData.longitude || longitude,
        peakSunHours: solarData.peakSunHours || 5.0,
        cloudCoverPercent: solarData.cloudCoverPercent || 20.0,
        temperatureAvg: solarData.temperatureAvg || 25.0
      };

      const result = await aiRecommendationService.generateRecommendation(payload);
      setAiRecommendation(result);
      setAiSuccess('AI Solar Advisor analysis generated successfully!');
      setTimeout(() => setAiSuccess(''), 5000);
    } catch (err) {
      setAiError(err.message || 'Failed to generate AI recommendation.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Open history modal and fetch past AI recommendations
  const handleOpenHistory = async () => {
    setShowHistoryModal(true);
    setIsLoadingHistory(true);
    try {
      const history = await aiRecommendationService.getRecommendationHistory();
      setAiHistory(history || []);
    } catch (err) {
      console.warn('Failed to load recommendation history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Download PDF Report (includes AI Advisor section if available)
  const handleDownloadPDF = () => {
    if (!solarData) return;
    downloadSolarPotentialReport(solarData, null, aiRecommendation);
  };

  // Chart.js Configuration for Monthly Solar Generation
  const chartData = useMemo(() => {
    if (!solarData?.monthlyGeneration) {
      return { labels: [], datasets: [] };
    }

    const labels = solarData.monthlyGeneration.map(m => m.month);
    const dataPoints = solarData.monthlyGeneration.map(m => m.generationKwh);

    return {
      labels,
      datasets: [
        {
          type: 'bar',
          label: 'Monthly Solar Yield (kWh)',
          data: dataPoints,
          backgroundColor: 'rgba(245, 158, 11, 0.85)',
          borderColor: 'rgb(245, 158, 11)',
          borderWidth: 1.5,
          borderRadius: 8,
          order: 2,
        },
        {
          type: 'line',
          label: 'Irradiance Generation Trend',
          data: dataPoints,
          borderColor: 'rgb(14, 165, 233)',
          backgroundColor: 'rgba(14, 165, 233, 0.1)',
          borderWidth: 2.5,
          pointBackgroundColor: 'rgb(14, 165, 233)',
          pointRadius: 4,
          tension: 0.35,
          fill: true,
          order: 1,
        }
      ],
    };
  }, [solarData]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 12,
          font: { size: 12, family: 'sans-serif' },
          color: '#475569'
        }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        padding: 12,
        cornerRadius: 8,
        titleFont: { size: 13, weight: 'bold' },
        bodyFont: { size: 12 },
        callbacks: {
          label: (context) => {
            const val = context.parsed.y;
            return ` ${context.dataset.label}: ${new Intl.NumberFormat('en-IN').format(val)} kWh`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 11, weight: '500' } }
      },
      y: {
        grid: { color: 'rgba(226, 232, 240, 0.8)' },
        ticks: {
          color: '#64748b',
          callback: (value) => `${value} kWh`,
          font: { size: 11 }
        }
      }
    }
  }), []);

  const badgeInfo = solarData?.solarQualityBadge ? BADGE_CONFIG[solarData.solarQualityBadge] : BADGE_CONFIG.GOOD;

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900">Solar Potential Technical Assessment</h1>
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-500/10 text-amber-700 px-2.5 py-1 rounded-full border border-amber-500/20">
              <Sun size={12} className="text-amber-500" />
              PVGIS + Weather Integration
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
            {solarData?.peakSunHours && (
              <>
                <span>•</span>
                <span className="text-slate-500">Peak Sun: {formatNumber(solarData.peakSunHours, 1)} hrs/day</span>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={!solarData || isLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            <FileDown size={15} />
            <span>Download PDF Assessment</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAnalysis}
            disabled={!solarData || isSaving || isLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white px-5 py-2.5 text-xs font-semibold shadow-xs shadow-primary-500/30 transition-colors cursor-pointer"
          >
            <Sparkles size={15} />
            <span>{isSaving ? 'Saving...' : 'Save Solar Analysis'}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
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
      {aiSuccess && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-sm font-medium">
          <Sparkles size={18} className="text-indigo-600 shrink-0" />
          <span>{aiSuccess}</span>
        </div>
      )}
      {aiError && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium">
          <AlertCircle size={18} className="text-rose-600 shrink-0" />
          <span>{aiError}</span>
        </div>
      )}

      {/* Loading Experience with Skeletons */}
      {isLoading && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center animate-pulse">
              <Sun size={32} className="animate-spin" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-lg font-bold text-slate-900">Analyzing rooftop using PVGIS & Weather APIs...</h3>
              <p className="text-xs text-slate-500">
                Retrieving European Commission PVGIS irradiance models, local cloud cover, temperature data, and seasonal generation projections.
              </p>
            </div>
            <div className="w-48 h-2 bg-slate-100 rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full animate-indeterminate" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        </div>
      )}

      {/* No Coverage Fallback / Error Handling */}
      {!isLoading && error && (
        <div className="max-w-2xl mx-auto my-8 text-center">
          <Card className="p-8 border-2 border-dashed border-slate-300 bg-slate-50/70 shadow-none">
            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Info size={28} />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">Solar data unavailable for this rooftop</h2>
            <p className="text-slate-600 text-xs mb-4 max-w-md mx-auto">
              {error}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => fetchSolarPotential(latitude, longitude, roofArea, address)}
                className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors"
              >
                <RefreshCw size={14} />
                <span>Retry Assessment</span>
              </button>

              <Link
                to="/map"
                className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-xs"
              >
                <span>Select Rooftop on Map</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </Card>
        </div>
      )}

      {/* Technical Dashboard Content */}
      {!isLoading && solarData && (
        <>
          {/* Solar Quality Index & Hero Summary */}
          <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 shadow-md relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 text-amber-500/10 blur-xl pointer-events-none">
              <Sun size={200} />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badgeInfo.bg}`}>
                    <span className={`w-2 h-2 rounded-full ${badgeInfo.dot}`} />
                    {solarData.solarQualityLabel || badgeInfo.label}
                  </span>
                  <span className="text-xs text-slate-400">Technical Quality Index</span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-black tracking-tight text-white">{solarData.solarScore}</span>
                  <span className="text-slate-400 text-sm font-medium">/ 100 Solar Score</span>
                </div>
                <p className="text-xs text-slate-300 max-w-xl">
                  {badgeInfo.description} Derived from European Commission PVGIS radiation models and live Open-Meteo weather factors.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
                <div>
                  <span className="text-2xs text-slate-400 font-medium">Annual Generation</span>
                  <p className="text-xl font-bold text-amber-400 mt-0.5">{formatNumber(solarData.annualGenerationKwh || solarData.annualEnergyKwh)} <span className="text-xs text-slate-400 font-normal">kWh</span></p>
                </div>
                <div>
                  <span className="text-2xs text-slate-400 font-medium">Peak Sun Hours</span>
                  <p className="text-xl font-bold text-sky-400 mt-0.5">{formatNumber(solarData.peakSunHours, 1)} <span className="text-xs text-slate-400 font-normal">hrs/day</span></p>
                </div>
                <div>
                  <span className="text-2xs text-slate-400 font-medium">Carbon Reduction</span>
                  <p className="text-xl font-bold text-emerald-400 mt-0.5">{formatNumber(solarData.carbonOffsetKg)} <span className="text-xs text-slate-400 font-normal">kg CO₂</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* 10 Technical Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Card 1: Solar Score */}
            <Card className="p-4 border-slate-200">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">Solar Score</span>
                <Gauge size={16} className="text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{solarData.solarScore}</p>
              <p className="text-2xs text-slate-500 mt-1">{solarData.solarQualityLabel}</p>
            </Card>

            {/* Card 2: Annual Irradiance */}
            <Card className="p-4 border-slate-200">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">Annual Irradiance</span>
                <Sun size={16} className="text-amber-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{formatNumber(solarData.annualIrradianceKwhM2, 1)} <span className="text-xs font-normal text-slate-500">kWh/m²</span></p>
              <p className="text-2xs text-slate-500 mt-1">PVGIS GHI solar insolation</p>
            </Card>

            {/* Card 3: Annual Generation */}
            <Card className="p-4 border-slate-200">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">Annual Generation</span>
                <Zap size={16} className="text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{formatNumber(solarData.annualGenerationKwh || solarData.annualEnergyKwh)} <span className="text-xs font-normal text-slate-500">kWh</span></p>
              <p className="text-2xs text-slate-500 mt-1">~{formatNumber((solarData.annualGenerationKwh || solarData.annualEnergyKwh) / 12)} kWh / mo</p>
            </Card>

            {/* Card 4: Roof Area */}
            <Card className="p-4 border-slate-200">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">Rooftop Area</span>
                <Layers size={16} className="text-indigo-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{formatNumber(solarData.roofAreaM2, 1)} <span className="text-xs font-normal text-slate-500">m²</span></p>
              <p className="text-2xs text-slate-500 mt-1">Usable: {formatNumber(solarData.roofAreaM2 * 0.75, 1)} m²</p>
            </Card>

            {/* Card 5: System Size */}
            <Card className="p-4 border-slate-200">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">System Size</span>
                <Gauge size={16} className="text-sky-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{formatNumber(solarData.systemSizeKWp, 1)} <span className="text-xs font-normal text-slate-500">kWp</span></p>
              <p className="text-2xs text-slate-500 mt-1">Optimal peak rating</p>
            </Card>

            {/* Card 6: Panel Count */}
            <Card className="p-4 border-slate-200">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">Panel Count</span>
                <Sun size={16} className="text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{solarData.estimatedPanelCount || solarData.maxArrayPanels} <span className="text-xs font-normal text-slate-500">mods</span></p>
              <p className="text-2xs text-slate-500 mt-1">550W Monocrystalline</p>
            </Card>

            {/* Card 7: Annual Savings */}
            <Card className="p-4 border-slate-200">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">Annual Savings</span>
                <Banknote size={16} className="text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(solarData.annualSavings)}</p>
              <p className="text-2xs text-slate-500 mt-1">At standard ₹8.0/kWh tariff</p>
            </Card>

            {/* Card 8: Payback Period */}
            <Card className="p-4 border-slate-200">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">Payback Period</span>
                <PiggyBank size={16} className="text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">~{formatNumber(solarData.paybackYears || solarData.paybackPeriod, 1)} <span className="text-xs font-normal text-slate-500">years</span></p>
              <p className="text-2xs text-slate-500 mt-1">ROI amortization period</p>
            </Card>

            {/* Card 9: Carbon Offset */}
            <Card className="p-4 border-slate-200">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">Carbon Offset</span>
                <TreePine size={16} className="text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-emerald-700">{formatNumber(solarData.carbonOffsetKg)} <span className="text-xs font-normal text-slate-500">kg/yr</span></p>
              <p className="text-2xs text-slate-500 mt-1">Avoided grid emissions</p>
            </Card>

            {/* Card 10: Homes Powered */}
            <Card className="p-4 border-slate-200">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">Homes Powered</span>
                <Home size={16} className="text-teal-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{formatNumber(solarData.homesPowered, 1)} <span className="text-xs font-normal text-slate-500">homes</span></p>
              <p className="text-2xs text-slate-500 mt-1">@ 3,500 kWh/yr per home</p>
            </Card>
          </div>

          {/* Middle Section: Chart.js Monthly Curve & Rooftop Satellite Map */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart.js Monthly Solar Generation */}
            <Card className="lg:col-span-2 p-5 border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Monthly Solar Generation Curve (Chart.js)</h3>
                  <p className="text-xs text-slate-500">12-Month technical yield simulation and seasonal irradiance trends</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 font-medium">Annual Total:</span>
                  <span className="text-sm font-bold text-amber-600 ml-1.5">{formatNumber(solarData.annualGenerationKwh || solarData.annualEnergyKwh)} kWh</span>
                </div>
              </div>

              <div className="h-72 w-full">
                <Bar data={chartData} options={chartOptions} />
              </div>
            </Card>

            {/* Google Map / Satellite Rooftop View */}
            <Card className="lg:col-span-1 p-0 overflow-hidden border-slate-200 flex flex-col">
              <div className="p-4 border-b border-slate-100 bg-slate-50/60">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <MapPin size={15} className="text-amber-500" />
                    <span>Rooftop Satellite View</span>
                  </h3>
                  <span className="text-2xs font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    High-Res Satellite
                  </span>
                </div>
                <p className="text-2xs text-slate-500 truncate mt-0.5">{address}</p>
              </div>

              <div className="h-72 w-full relative">
                <InteractiveMap
                  center={[latitude, longitude]}
                  markerPosition={[latitude, longitude]}
                  markerLabel={address}
                  polygonCoordinates={polygonCoordinates}
                  isDrawingEnabled={false}
                />
              </div>

              <div className="p-3 bg-white text-2xs text-slate-500 flex items-center justify-between border-t border-slate-100">
                <span>Coordinates: {latitude.toFixed(4)}, {longitude.toFixed(4)}</span>
                <Link to="/map" className="text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-0.5">
                  <span>Edit on Map</span>
                  <ArrowRight size={11} />
                </Link>
              </div>
            </Card>
          </div>

          {/* Weather Impact & Meteorological Integration Section */}
          <Card className="p-5 border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CloudSun size={18} className="text-sky-500" />
                  <span>Weather Impact & Meteorological Integration</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Real-time meteorological indicators from Open-Meteo applied to the PVGIS thermodynamic radiation model
                </p>
              </div>
              <span className="text-2xs font-medium px-2.5 py-1 rounded-md bg-sky-50 text-sky-700 border border-sky-200">
                Live Atmospheric Data
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-1">
                <span className="text-2xs text-slate-500 font-medium">Cloud Cover Factor</span>
                <p className="text-xl font-bold text-slate-900">{formatNumber(solarData.cloudCoverPercent, 1)}%</p>
                <p className="text-2xs text-slate-500">Atmospheric cloud attenuation</p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-1">
                <span className="text-2xs text-slate-500 font-medium">Average Temperature</span>
                <p className="text-xl font-bold text-slate-900">{formatNumber(solarData.temperatureAvg, 1)} °C</p>
                <p className="text-2xs text-slate-500">Panel temperature coefficient</p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-1">
                <span className="text-2xs text-slate-500 font-medium">Peak Sun Hours</span>
                <p className="text-xl font-bold text-amber-600">{formatNumber(solarData.peakSunHours, 1)} hrs/day</p>
                <p className="text-2xs text-slate-500">Daily average solar window</p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-1">
                <span className="text-2xs text-slate-500 font-medium">Weather Adjustment</span>
                <p className="text-xl font-bold text-emerald-600">{formatNumber(solarData.weatherAdjustmentFactor, 3)}</p>
                <p className="text-2xs text-slate-500">Applied to theoretical yield</p>
              </div>
            </div>
          </Card>

          {/* Deterministic Solar Recommendations Engine */}
          <Card className="p-5 border-slate-200">
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-primary-500" />
                <h3 className="text-base font-bold text-slate-900">Deterministic Solar Engineering Recommendations</h3>
              </div>
              <p className="text-xs text-slate-500">
                Rule-based engineering heuristics derived from irradiance levels, roof utilization, cloud cover factors, and financial payback.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {solarData.recommendations?.map((rec, i) => (
                <div key={i} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2 hover:border-slate-300 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{rec.title}</span>
                    <span className={`px-2 py-0.5 rounded-full text-2xs font-semibold ${
                      rec.impactLevel === 'HIGH' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {rec.impactLevel} IMPACT
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 font-medium leading-relaxed">
                    {rec.recommendation}
                  </p>

                  <div className="pt-2 border-t border-slate-200/80 text-2xs text-slate-500 space-y-1">
                    <p><strong className="text-slate-600">Reason:</strong> {rec.reason}</p>
                    <p className="text-emerald-700 font-medium">
                      <strong>Expected Benefit:</strong> {rec.expectedBenefit}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* AI Solar Advisor & Strategic Insights Section */}
          <Card className="p-6 border-indigo-200/70 bg-linear-to-b from-white via-indigo-50/10 to-slate-50/30 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600">
                    <Bot size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <span>AI Solar Advisor & Strategic Insights</span>
                      <span className="text-2xs font-semibold uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                        OpenAI GPT-4o
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Intelligent, natural-language executive advisory, risk mitigation, and actionable deployment roadmap.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={handleOpenHistory}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                >
                  <History size={14} className="text-slate-500" />
                  <span>Advisor History</span>
                </button>

                <button
                  type="button"
                  onClick={handleGenerateAIRecommendation}
                  disabled={isGeneratingAI || !solarData}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white px-4 py-2 text-xs font-semibold shadow-xs shadow-indigo-500/30 transition-all cursor-pointer"
                >
                  {isGeneratingAI ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Analyzing Rooftop...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>{aiRecommendation ? 'Regenerate AI Analysis' : 'Generate AI Recommendation'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {aiRecommendation ? (
              <div className="mt-6 space-y-6">
                {/* 4 Assessment Badges */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Core Technical & Commercial Assessments
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Badge 1: Installation Assessment */}
                    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">Installation Feasibility</span>
                        <Sun size={15} className="text-amber-500" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getAssessmentBadgeStyle(aiRecommendation.installationAssessment, 'standard')}`}>
                          {aiRecommendation.installationAssessment || 'Good'}
                        </span>
                      </div>
                      <p className="text-2xs text-slate-500">
                        Physical roof viability, structural roof pitch, and panel density suitability.
                      </p>
                    </div>

                    {/* Badge 2: Financial Assessment */}
                    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">Financial Viability</span>
                        <Banknote size={15} className="text-emerald-500" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getAssessmentBadgeStyle(aiRecommendation.financialAssessment, 'standard')}`}>
                          {aiRecommendation.financialAssessment || 'Good'}
                        </span>
                      </div>
                      <p className="text-2xs text-slate-500">
                        Capital expenditure return trajectory, annual utility savings, and payback period.
                      </p>
                    </div>

                    {/* Badge 3: Battery Recommendation */}
                    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">Battery Storage</span>
                        <Zap size={15} className="text-indigo-500" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getAssessmentBadgeStyle(aiRecommendation.batteryRecommendation, 'battery')}`}>
                          {aiRecommendation.batteryRecommendation || 'Optional'}
                        </span>
                      </div>
                      <p className="text-2xs text-slate-500">
                        Peak load shifting, evening self-consumption, and critical backup requirement.
                      </p>
                    </div>

                    {/* Badge 4: Risk Assessment */}
                    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">Risk Assessment</span>
                        <ShieldAlert size={15} className="text-slate-400" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getAssessmentBadgeStyle(aiRecommendation.riskAssessment, 'risk')}`}>
                          {aiRecommendation.riskAssessment || 'Low'} Risk
                        </span>
                      </div>
                      <p className="text-2xs text-slate-500">
                        Environmental variance, shading sensitivity, and grid interconnection complexity.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Executive Summary Card */}
                <div className="rounded-2xl border border-indigo-200/80 bg-linear-to-r from-indigo-500/5 via-sky-500/5 to-white p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-indigo-600" />
                      <h4 className="text-sm font-bold text-slate-900">Executive Advisory Summary</h4>
                    </div>
                    {aiRecommendation.generatedAt && (
                      <span className="text-2xs text-slate-400 font-medium">
                        Generated {new Date(aiRecommendation.generatedAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {aiRecommendation.executiveSummary}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-indigo-100/70 text-2xs">
                    <div>
                      <span className="text-slate-400 font-medium">Solar Score:</span>
                      <p className="font-bold text-slate-800">{aiRecommendation.solarScore || solarData.solarScore}/100</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Annual Generation:</span>
                      <p className="font-bold text-indigo-700">{formatNumber(aiRecommendation.annualGeneration || solarData.annualGenerationKwh)} kWh</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Annual Savings:</span>
                      <p className="font-bold text-emerald-700">{formatCurrency(aiRecommendation.annualSavings || solarData.annualSavings)}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Payback Period:</span>
                      <p className="font-bold text-amber-700">{formatNumber(aiRecommendation.paybackPeriod || solarData.paybackYears, 1)} yrs</p>
                    </div>
                  </div>
                </div>

                {/* Strategic Recommendations (Checkmarks) */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    <span>Actionable Strategic Recommendations</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {aiRecommendation.recommendations?.map((rec, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 hover:border-indigo-300 transition-colors shadow-2xs"
                      >
                        <div className="p-1 rounded-full bg-emerald-100 text-emerald-600 shrink-0 mt-0.5">
                          <Check size={13} strokeWidth={3} />
                        </div>
                        <p className="text-xs text-slate-700 font-medium leading-relaxed">
                          {rec}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5-Step Strategic Action Plan */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Clock size={14} className="text-indigo-500" />
                    <span>5-Step Implementation Roadmap</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    {aiRecommendation.actionPlan?.map((step, sIdx) => (
                      <div
                        key={sIdx}
                        className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 shadow-2xs hover:border-indigo-300 transition-all flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                              {step.stepNumber || sIdx + 1}
                            </span>
                            {step.timeline && (
                              <span className="text-2xs font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                                {step.timeline}
                              </span>
                            )}
                          </div>
                          <h5 className="text-xs font-bold text-slate-900 leading-tight">
                            {step.title}
                          </h5>
                          <p className="text-2xs text-slate-600 leading-relaxed font-normal">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Empty state before generating AI recommendation */
              <div className="mt-8 py-10 text-center space-y-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
                  <Sparkles size={24} />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h4 className="text-sm font-bold text-slate-900">No AI Recommendation Generated Yet</h4>
                  <p className="text-xs text-slate-500">
                    Generate an intelligent, AI-powered rooftop assessment to receive executive insights, risk evaluations, and a 5-step engineering deployment roadmap.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateAIRecommendation}
                  disabled={isGeneratingAI || !solarData}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white px-5 py-2.5 text-xs font-semibold shadow-xs shadow-indigo-500/30 transition-all cursor-pointer"
                >
                  <Sparkles size={15} />
                  <span>{isGeneratingAI ? 'Generating Analysis...' : 'Generate AI Recommendation Now'}</span>
                </button>
              </div>
            )}
          </Card>

          {/* AI Recommendation History Modal */}
          {showHistoryModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in fade-in duration-200">
                {/* Modal Header */}
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                      <History size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">AI Solar Advisor History</h3>
                      <p className="text-xs text-slate-500">Previous AI evaluations and strategic recommendations</p>
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

                {/* Modal Content */}
                <div className="p-5 overflow-y-auto space-y-3 flex-1">
                  {isLoadingHistory ? (
                    <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
                      <RefreshCw size={20} className="animate-spin text-indigo-600" />
                      <span className="text-xs">Loading recommendation history...</span>
                    </div>
                  ) : aiHistory.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 space-y-2">
                      <Bot size={28} className="mx-auto text-slate-300" />
                      <p className="text-xs">No previous AI recommendations found for your account.</p>
                    </div>
                  ) : (
                    aiHistory.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-slate-200 hover:border-indigo-300 p-4 space-y-3 transition-colors bg-white shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-900">
                              Assessment #{item.id}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-2xs font-bold border ${getAssessmentBadgeStyle(item.riskAssessment, 'risk')}`}>
                              {item.riskAssessment || 'Low'} Risk
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-2xs font-bold border ${getAssessmentBadgeStyle(item.financialAssessment, 'standard')}`}>
                              {item.financialAssessment || 'Good'}
                            </span>
                          </div>
                          <span className="text-2xs text-slate-400 font-medium">
                            {new Date(item.generatedAt || item.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {item.executiveSummary}
                        </p>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <div className="flex items-center gap-4 text-2xs text-slate-500">
                            <span>Score: <strong className="text-slate-800">{item.solarScore || '-'}/100</strong></span>
                            <span>Savings: <strong className="text-emerald-700">{formatCurrency(item.annualSavings)}</strong></span>
                            <span>Payback: <strong className="text-amber-700">{formatNumber(item.paybackPeriod, 1)} yrs</strong></span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setAiRecommendation(item);
                              setShowHistoryModal(false);
                            }}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                          >
                            <span>View Report</span>
                            <ChevronRight size={13} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Modal Footer */}
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
        </>
      )}
    </div>
  );
};

export default SolarPotential;

