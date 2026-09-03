import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sun,
  Layers,
  Zap,
  Banknote,
  PiggyBank,
  CloudSun,
  CheckCircle2,
  AlertCircle,
  BatteryCharging,
  TrendingUp,
  MapPin,
  ArrowRight,
  FileText
} from 'lucide-react';
import { 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { ChartContainer } from '../components/ui/Chart';
import DynamicPanelLayout from '../components/map/DynamicPanelLayout';
import { reportApiService } from '../services/reportApiService';
import { analysisApiService } from '../services/analysisApiService';
import { getLatestAnalysis } from '../services/reportService';

const formatNumber = (value, digits = 0) =>
  value === null || value === undefined
    ? '-'
    : new Intl.NumberFormat('en-IN', { maximumFractionDigits: digits }).format(value);

const formatCurrency = (value) =>
  value === null || value === undefined
    ? '₹0'
    : `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value)}`;

const Analysis = () => {
  const [analysis, setAnalysis] = useState(() => getLatestAnalysis());
  const [isLoading, setIsLoading] = useState(!analysis);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // PART 4 - Load user's latest saved analysis on mount
  useEffect(() => {
    let isMounted = true;
    const fetchLatest = async () => {
      try {
        const backendLatest = await analysisApiService.getLatestAnalysis();
        if (isMounted && backendLatest) {
          setAnalysis(prev => {
            // Merge backend analysis with previous local data if available
            return {
              ...prev,
              ...backendLatest,
              panels: backendLatest.estimatedPanels || prev?.panels || 20,
              yearlyGeneration: backendLatest.annualGeneration || backendLatest.yearlyGeneration || prev?.yearlyGeneration,
              yearlySavings: backendLatest.annualSavings || backendLatest.yearlySavings || prev?.yearlySavings,
            };
          });
        }
      } catch (err) {
        console.warn('Could not fetch latest analysis from backend, relying on local state:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchLatest();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute dynamic 20-Year Profitability curve from actual metrics
  const profitData = useMemo(() => {
    if (!analysis) return [];
    const cost = analysis.installationCost || 150000;
    const firstYearSavings = analysis.yearlySavings || analysis.annualSavings || (cost * 0.20);
    const tariffEscalation = 0.03; // 3% annual electricity tariff hike

    let cumulativeCashflow = -cost;
    return Array.from({ length: 20 }, (_, i) => {
      const year = i + 1;
      const annualSavings = firstYearSavings * Math.pow(1 + tariffEscalation, i);
      cumulativeCashflow += annualSavings;
      return {
        year: `Year ${year}`,
        profit: Math.round(cumulativeCashflow),
        annualSavings: Math.round(annualSavings),
      };
    });
  }, [analysis]);

  // Derived dynamic metrics
  const usableArea = analysis?.usableArea || (analysis?.panels ? analysis.panels * 2.5 : (analysis?.estimatedPanels ? analysis.estimatedPanels * 2.5 : 0));
  const systemSize = analysis?.systemSize || (analysis?.panels ? Number((analysis.panels * 0.4).toFixed(1)) : (analysis?.estimatedPanels ? Number((analysis.estimatedPanels * 0.4).toFixed(1)) : 0));
  const panelCount = analysis?.panels || analysis?.estimatedPanels || analysis?.panelCount || 0;
  const installationCost = analysis?.installationCost || 0;
  const annualYield = analysis?.yearlyGeneration || analysis?.annualGeneration || (analysis?.monthlyGeneration ? analysis.monthlyGeneration * 12 : 0);
  const year1Savings = analysis?.yearlySavings || analysis?.annualSavings || (annualYield * 8.5);
  const roi = analysis?.roi || (installationCost > 0 ? Number(((year1Savings / installationCost) * 100).toFixed(1)) : 0);
  const paybackPeriod = analysis?.paybackPeriod || (year1Savings > 0 ? Number((installationCost / year1Savings).toFixed(1)) : 0);

  // Recommended Battery Sizing (kWh)
  const batteryRecommendation = analysis?.batteryRecommendation || analysis?.recommendedBatteryCapacity || (
    annualYield > 0 ? Math.max(10, Math.round((annualYield / 365 * 0.82 * 1.5) / 5) * 5) : 30
  );

  const weather = analysis?.weather;

  // PART 3 - Persist Proposal to PostgreSQL
  const handleSaveProposal = async () => {
    if (!analysis) {
      setSaveError('No analysis data available. Please complete a solar analysis first.');
      return;
    }

    setIsSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    try {
      const locationName = analysis.location || analysis.locationName || 'Rooftop Site';
      const weatherAdjustment = analysis.weatherAdjustmentPercent ?? 0;

      // 1. Save or update analysis entity in PostgreSQL
      const payload = {
        locationName: locationName,
        latitude: analysis.latitude || 18.5204,
        longitude: analysis.longitude || 73.8567,
        roofArea: analysis.roofArea || (panelCount * 3.0),
        estimatedPanels: panelCount,
        monthlyGeneration: Math.round(annualYield / 12),
        installationCost: installationCost,
        roi: roi,
        co2Reduction: analysis.co2Reduction || Math.round(annualYield * 0.82),
        usableArea: usableArea,
        systemSize: systemSize,
        yearlyGeneration: annualYield,
        yearlySavings: year1Savings,
        paybackPeriod: paybackPeriod,
        weatherAdjustment: weatherAdjustment,
        batteryRecommendation: batteryRecommendation,
      };

      const savedAnalysis = await analysisApiService.saveAnalysis(payload);
      const analysisId = savedAnalysis.id;

      // Update local copy
      const updatedAnalysis = {
        ...analysis,
        id: analysisId,
        usableArea,
        systemSize,
        panels: panelCount,
        yearlyGeneration: annualYield,
        yearlySavings: year1Savings,
        recommendedBatteryCapacity: batteryRecommendation,
      };
      setAnalysis(updatedAnalysis);
      localStorage.setItem('latestAnalysis', JSON.stringify(updatedAnalysis));

      // 2. Generate PDF and persist report record to PostgreSQL
      const { downloadAnalysisReport } = await import('../services/reportService');
      downloadAnalysisReport(updatedAnalysis);

      const reportName = `Proposal - ${locationName} (${systemSize} kWp)`;
      const reportData = {
        reportName: reportName,
        reportType: 'PDF',
        analysisId: analysisId,
        filePath: `/reports/${reportName.replace(/\s+/g, '_')}.pdf`,
      };

      await reportApiService.saveReport(reportData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (error) {
      setSaveError(error.message || 'Failed to save proposal. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 text-sm font-medium">Loading Rooftop System Analysis...</p>
      </div>
    );
  }

  // PART 1 - Empty State: If no analysis exists
  if (!analysis || (!usableArea && !panelCount && !installationCost)) {
    return (
      <div className="max-w-2xl mx-auto my-12 text-center">
        <Card className="p-10 border-dashed border-2 border-slate-300 bg-slate-50/60 shadow-none">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sun size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Run rooftop analysis to view results.</h2>
          <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
            Select or draw a rooftop polygon on the satellite map to compute real-time panel estimates, yield projections, and battery storage sizing.
          </p>
          <Link
            to="/map"
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-sm shadow-amber-500/30 cursor-pointer"
          >
            <span>Draw Rooftop Polygon</span>
            <ArrowRight size={18} />
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">System Analysis & Financials</h1>
            {analysis.location && (
              <span className="inline-flex items-center gap-1 text-xs font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                <MapPin size={12} className="text-amber-500" />
                {analysis.location}
              </span>
            )}
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Dynamic performance calculations and 20-year economic projections
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <div className="text-emerald-600 text-sm font-semibold flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              <CheckCircle2 size={16} />
              Proposal saved to PostgreSQL!
            </div>
          )}
          {saveError && (
            <div className="text-rose-600 text-sm font-medium flex items-center gap-1.5 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200">
              <AlertCircle size={16} />
              {saveError}
            </div>
          )}
          <button 
            type="button"
            onClick={handleSaveProposal}
            disabled={isSaving}
            className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm shadow-primary-500/30 disabled:cursor-not-allowed cursor-pointer"
          >
            <FileText size={18} />
            <span>{isSaving ? 'Saving Proposal...' : 'Save Proposal'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Dynamic System Design & Dynamic Panel Layout */}
        <div className="col-span-1 space-y-6">
          {/* Dynamic System Design Card */}
          <Card className="bg-slate-900 text-white p-0 relative overflow-hidden shadow-md">
            <div className="absolute -top-10 -right-10 text-primary-500/20 blur-2xl pointer-events-none">
              <Sun size={140} />
            </div>
            <CardContent className="relative z-10 p-6">
              <h3 className="text-lg font-bold mb-6 flex items-center space-x-2">
                <Layers size={20} className="text-primary-400" />
                <span>Dynamic System Design</span>
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-end border-b border-white/10 pb-3">
                  <span className="text-slate-400 text-sm">Usable Area</span>
                  <div className="text-right">
                    <span className="text-xl font-bold">{formatNumber(usableArea, 1)}</span>
                    <span className="text-slate-400 ml-1 text-sm">m²</span>
                  </div>
                </div>

                <div className="flex justify-between items-end border-b border-white/10 pb-3">
                  <span className="text-slate-400 text-sm">System Size</span>
                  <div className="text-right">
                    <span className="text-xl font-bold text-primary-400">{formatNumber(systemSize, 1)}</span>
                    <span className="text-slate-400 ml-1 text-sm">kWp</span>
                  </div>
                </div>

                <div className="flex justify-between items-end border-b border-white/10 pb-3">
                  <span className="text-slate-400 text-sm">Est. Panel Count</span>
                  <div className="text-right">
                    <span className="text-xl font-bold">{formatNumber(panelCount)}</span>
                    <span className="text-slate-400 ml-1 text-sm">modules</span>
                  </div>
                </div>

                <div className="flex justify-between items-end pb-1">
                  <span className="text-slate-400 text-sm">Battery Recommendation</span>
                  <div className="text-right">
                    <span className="text-xl font-bold text-emerald-400">{formatNumber(batteryRecommendation)}</span>
                    <span className="text-slate-400 ml-1 text-sm">kWh LFP</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PART 2 - Dynamic Panel Layout Component */}
          <DynamicPanelLayout 
            roofArea={analysis.roofArea || usableArea}
            panelCount={panelCount}
          />
        </div>

        {/* Right Column - Dynamic Financials & Charts */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          {/* 3 Financial Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="flex flex-col items-center text-center p-5 shadow-xs">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-3">
                <Banknote size={24} />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Total Installation</p>
              <p className="text-2xl font-bold text-slate-900 border-b-2 border-primary-500/30 pb-1">
                {formatCurrency(installationCost)}
              </p>
              <p className="text-xs text-slate-400 mt-2">Capital investment</p>
            </Card>

            <Card className="flex flex-col items-center text-center p-5 shadow-xs">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-3">
                <Zap size={24} />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Annual Yield</p>
              <p className="text-2xl font-bold text-slate-900 border-b-2 border-primary-500/30 pb-1">
                {formatNumber(annualYield)} <span className="text-sm font-normal text-slate-500">kWh</span>
              </p>
              <p className="text-xs text-emerald-600 font-medium mt-2">
                ~{formatNumber(annualYield / 365, 1)} kWh/day
              </p>
            </Card>

            <Card className="flex flex-col items-center text-center p-5 shadow-xs">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-3">
                <PiggyBank size={24} />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Year 1 Savings</p>
              <p className="text-2xl font-bold text-slate-900 border-b-2 border-primary-500/30 pb-1">
                {formatCurrency(year1Savings)}
              </p>
              <p className="text-xs text-purple-600 font-medium mt-2">
                Payback ~{paybackPeriod} Years (ROI: {roi}%)
              </p>
            </Card>
          </div>

          {/* Weather Integration Summary (if available) */}
          {weather && (
            <Card className="p-0 overflow-hidden">
              <CardHeader title="Live Weather Adjustment" className="mb-0 pt-6 px-6" />
              <CardContent className="p-6">
                <div className="mb-5 flex items-center gap-3">
                  <div className="rounded-xl bg-sky-50 p-3 text-sky-600">
                    <CloudSun size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{weather.weatherSummary}</h3>
                    <p className="text-xs text-slate-500">Open-Meteo microclimate conditions</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                  <div>
                    <p className="text-slate-500 text-xs">Temperature</p>
                    <p className="font-bold text-slate-900">{formatNumber(weather.temperature, 1)} °C</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs">Cloud Cover</p>
                    <p className="font-bold text-slate-900">{formatNumber(weather.cloudCover)}%</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs">Sunshine Hours</p>
                    <p className="font-bold text-slate-900">{formatNumber(weather.sunshineHours, 1)} h/d</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs">Weather Impact</p>
                    <p className="font-bold text-emerald-600">
                      {analysis.weatherAdjustmentPercent > 0 ? '+' : ''}{analysis.weatherAdjustmentPercent ?? 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dynamic 20-Year Profitability Projection */}
          <Card className="p-0 overflow-hidden">
            <CardHeader 
              title="20-Year Cumulative Cashflow & Profitability Projection" 
              className="mb-0 pt-6 px-6"
              action={
                <div className="flex items-center space-x-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                  <TrendingUp size={14} className="text-primary-500" />
                  <span>Includes 3% annual tariff hike</span>
                </div>
              }
            />
            <CardContent className="p-6">
              <ChartContainer height="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={profitData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis 
                      dataKey="year" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748B', fontSize: 12 }} 
                      interval="preserveStartEnd" 
                      minTickGap={25} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748B', fontSize: 12 }} 
                      tickFormatter={(value) => `₹${Math.round(value / 1000)}k`} 
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                      formatter={(value, name) => [
                        formatCurrency(value), 
                        name === 'profit' ? 'Cumulative Net Profit' : 'Annual Savings'
                      ]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="profit" 
                      stroke="#0f172a" 
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Analysis;