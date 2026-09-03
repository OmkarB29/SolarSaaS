import React, { useState } from 'react';
import { 
  Sun,
  Layers,
  Zap,
  Banknote,
  PiggyBank,
  CloudSun,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip
} from 'recharts';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { ChartContainer } from '../components/ui/Chart';
import { reportApiService } from '../services/reportApiService';
import { getLatestAnalysis } from '../services/reportService';

const profitData = Array.from({ length: 20 }, (_, i) => ({
  year: `Year ${i + 1}`,
  profit: (i < 4 ? -450000 + (120000 * i) : 120000 * (i - 4) + 30000),
}));

const formatNumber = (value, digits = 0) =>
  value === null || value === undefined
    ? '-'
    : new Intl.NumberFormat('en-IN', { maximumFractionDigits: digits }).format(value);

const Analysis = () => {
  const panelGrid = Array.from({ length: 48 }, (_, i) => i); // mock 48 panels
  const [latestAnalysis] = useState(() => getLatestAnalysis());
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const weather = latestAnalysis?.weather;

  const handleSaveProposal = async () => {
    setIsSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    try {
      const analysis = latestAnalysis || getLatestAnalysis();
      if (!analysis) {
        setSaveError('No analysis data available. Please complete a solar analysis first.');
        return;
      }

      // Generate a unique report name
      const reportName = `Solar Analysis - ${analysis.locationName || 'Unknown Location'} - ${new Date().toLocaleDateString()}`;
      
      // Generate the PDF (this will download it)
      const { downloadAnalysisReport } = await import('../services/reportService');
      downloadAnalysisReport(analysis);

      // Save report metadata to backend
      const reportData = {
        reportName: reportName,
        reportType: 'PDF',
        analysisId: analysis.id,
        filePath: `/reports/${reportName.replace(/\s+/g, '_')}.pdf`
      };

      await reportApiService.saveReport(reportData);
      setSaveSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      setSaveError(error.message || 'Failed to save report. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Analysis & Financials</h1>
          <p className="text-slate-500 mt-1">Detailed performance and economic projections</p>
        </div>
        <div className="flex items-center gap-3">
          {saveSuccess && (
            <div className="text-green-600 text-sm font-medium flex items-center gap-1">
              <CheckCircle2 size={16} />
              Report saved successfully!
            </div>
          )}
          {saveError && (
            <div className="text-red-600 text-sm font-medium flex items-center gap-1">
              <AlertCircle size={16} />
              {saveError}
            </div>
          )}
          <button 
            onClick={handleSaveProposal}
            disabled={isSaving}
            className="bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm shadow-primary-500/30 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Proposal'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - System Design */}
        <div className="col-span-1 space-y-6">
          <Card className="bg-slate-900 text-white p-0 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 text-primary-500/20 blur-2xl">
              <Sun size={120} />
            </div>
            <CardContent className="relative z-10 p-6">
              <h3 className="text-lg font-bold mb-6 flex items-center space-x-2">
                <Layers size={20} className="text-primary-400" />
                <span>System Design</span>
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-end border-b border-white/10 pb-4">
                  <span className="text-slate-400 text-sm">Usable Area</span>
                  <div className="text-right">
                    <span className="text-xl font-bold">1,450</span>
                    <span className="text-slate-400 ml-1 text-sm">m²</span>
                  </div>
                </div>
                <div className="flex justify-between items-end border-b border-white/10 pb-4">
                  <span className="text-slate-400 text-sm">System Size</span>
                  <div className="text-right">
                    <span className="text-xl font-bold text-primary-400">240</span>
                    <span className="text-slate-400 ml-1 text-sm">kWp</span>
                  </div>
                </div>
                <div className="flex justify-between items-end pb-2">
                  <span className="text-slate-400 text-sm">Est. Panel Count</span>
                  <div className="text-right">
                    <span className="text-xl font-bold">580</span>
                    <span className="text-slate-400 ml-1 text-sm">modules</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="p-0">
            <CardHeader title="Panel Layout Visualization" className="mb-0 pt-6 px-6" />
            <CardContent>
              <div className="aspect-square bg-slate-50 rounded-xl border border-slate-200 p-4 grid grid-cols-6 gap-1.5 align-content-center justify-content-center relative">
                {/* Roof styling */}
                <div className="absolute inset-2 border-2 border-dashed border-primary-300 rounded-lg opacity-50 z-0"></div>
                {panelGrid.map(i => (
                  <div key={i} className="bg-slate-800 rounded-[2px] shadow-sm transform hover:scale-105 transition-transform z-10 border border-slate-700/50 flex flex-col justify-between p-[1px]">
                    <div className="w-full h-[1px] bg-slate-700/50"></div>
                    <div className="w-full h-[1px] bg-slate-700/50"></div>
                  </div>
                ))}
              </div>
              <div className="flex items-center space-x-2 mt-4 text-sm text-slate-500">
                <CheckCircle2 size={16} className="text-green-500" />
                <span>Optimal South-Facing orientation detected</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Financials */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
                <Banknote size={24} />
              </div>
              <p className="text-sm font-medium text-slate-500 mb-1">Total Installation</p>
              <p className="text-2xl font-bold text-slate-900 border-b-2 border-primary-500/30 pb-1">₹4,500,000</p>
              <p className="text-xs text-slate-400 mt-2">Includes incentives</p>
            </Card>
            <Card className="flex flex-col items-center text-center">
               <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-4">
                <Zap size={24} />
              </div>
              <p className="text-sm font-medium text-slate-500 mb-1">Annual Yield</p>
              <p className="text-2xl font-bold text-slate-900 border-b-2 border-primary-500/30 pb-1">380,000 <span className="text-base text-slate-500">kWh</span></p>
              <p className="text-xs text-green-500 font-medium mt-2">Covers 85% of usage</p>
            </Card>
            <Card className="flex flex-col items-center text-center">
               <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-4">
                <PiggyBank size={24} />
              </div>
              <p className="text-sm font-medium text-slate-500 mb-1">Year 1 Savings</p>
              <p className="text-2xl font-bold text-slate-900 border-b-2 border-primary-500/30 pb-1">₹1,150,000</p>
              <p className="text-xs text-slate-400 mt-2">Payback ~3.9 Years</p>
            </Card>
          </div>

          {weather && (
            <Card className="p-0">
              <CardHeader title="Weather Adjustment" className="mb-0 pt-6 px-6" />
              <CardContent>
                <div className="mb-5 flex items-center gap-3">
                  <div className="rounded-xl bg-sky-50 p-3 text-sky-600">
                    <CloudSun size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{weather.weatherSummary}</h3>
                    <p className="text-sm text-slate-500">Open-Meteo conditions</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-5">
                  <div>
                    <p className="text-slate-500">Temperature</p>
                    <p className="font-bold text-slate-900">{formatNumber(weather.temperature, 1)} C</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Cloud Cover</p>
                    <p className="font-bold text-slate-900">{formatNumber(weather.cloudCover)}%</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Sunshine Hours</p>
                    <p className="font-bold text-slate-900">{formatNumber(weather.sunshineHours, 1)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Base Generation</p>
                    <p className="font-bold text-slate-900">{formatNumber(latestAnalysis.monthlyGeneration)} kWh/mo</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Weather Adjusted</p>
                    <p className="font-bold text-slate-900">{formatNumber(latestAnalysis.weatherAdjustedMonthlyGeneration)} kWh/mo</p>
                    <p className="text-xs font-medium text-slate-500">
                      {latestAnalysis.weatherAdjustmentPercent > 0 ? '+' : ''}{latestAnalysis.weatherAdjustmentPercent}% vs base
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="p-0">
            <CardHeader 
              title="20-Year Profitability Projection" 
              className="mb-0 pt-6 px-6"
              action={
                <div className="flex items-center space-x-2 text-sm text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                  <AlertCircle size={14} className="text-primary-500" />
                  <span>Assumes 3% annual tariff hike</span>
                </div>
              }
            />
            <CardContent>
              <ChartContainer height="h-80">
                <LineChart data={profitData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} interval="preserveStartEnd" minTickGap={30} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} tickFormatter={(value) => `₹${value/1000}k`} />
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                    formatter={(value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value)}
                  />
                  {/* Reference line for zer-profit (break-even point) */}
                  <line x1="0" y1="y" x2="100%" y2="y" stroke="gray" strokeWidth={1} strokeDasharray="5 5" />
                  
                  <Line 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#0f172a" 
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
                    fill="url(#colorProfit)"
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Analysis;
