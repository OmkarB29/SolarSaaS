import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sun,
  Eye, 
  Copy, 
  Trash2, 
  FileDown, 
  MapPin, 
  Layers, 
  Zap, 
  Banknote, 
  TrendingUp, 
  X, 
  Clock, 
  BatteryCharging, 
  CloudSun, 
  CheckCircle2, 
  Plus, 
  FileText 
} from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { analysisApiService } from '../services/analysisApiService';
import { reportApiService } from '../services/reportApiService';
import { proposalApiService } from '../services/proposalApiService';
import { downloadAnalysisReport } from '../services/reportService';

const formatNumber = (value, digits = 0) =>
  new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: digits,
  }).format(value ?? 0);

const formatDate = (value) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const MyAnalyses = () => {
  const [analyses, setAnalyses] = useState([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [deletingAnalysis, setDeletingAnalysis] = useState(null);
  const [creatingProposalFor, setCreatingProposalFor] = useState(null);
  const [proposalNameInput, setProposalNameInput] = useState('');
  const navigate = useNavigate();

  const handleOpenInAnalysisTab = (row) => {
    const formatted = {
      ...row,
      location: row.locationName || row.location || 'Rooftop Site',
      locationName: row.locationName || row.location || 'Rooftop Site',
      panels: row.estimatedPanels || row.panels || 20,
      estimatedPanels: row.estimatedPanels || row.panels || 20,
      yearlyGeneration: row.annualGeneration || row.yearlyGeneration || (row.monthlyGeneration ? row.monthlyGeneration * 12 : 0),
      annualGeneration: row.annualGeneration || row.yearlyGeneration || (row.monthlyGeneration ? row.monthlyGeneration * 12 : 0),
      yearlySavings: row.annualSavings || row.yearlySavings || (row.monthlyGeneration ? row.monthlyGeneration * 12 * 8.5 : 0),
      annualSavings: row.annualSavings || row.yearlySavings || (row.monthlyGeneration ? row.monthlyGeneration * 12 * 8.5 : 0),
      usableArea: row.usableArea || (row.estimatedPanels ? row.estimatedPanels * 2.5 : 0),
      systemSize: row.systemSize || (row.estimatedPanels ? Number((row.estimatedPanels * 0.4).toFixed(1)) : 0),
      installationCost: row.installationCost || 0,
    };
    try {
      localStorage.setItem('latestAnalysis', JSON.stringify(formatted));
    } catch {
      // ignore
    }
    navigate('/analysis', { state: { analysis: formatted } });
  };

  const loadAnalyses = async () => {
    try {
      setIsLoading(true);
      const data = await analysisApiService.getAnalyses();
      setAnalyses(data || []);
    } catch (loadError) {
      setError(loadError.message || 'Failed to load analyses');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyses();
  }, []);

  const handleDuplicate = async (id) => {
    setActionLoadingId(`dup-${id}`);
    setError('');
    setSuccessMsg('');

    try {
      const duplicated = await analysisApiService.duplicateAnalysis(id);
      setAnalyses((prev) => [duplicated, ...prev]);
      setSuccessMsg(`Duplicated analysis #${id} successfully! New copy: #${duplicated.id}`);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setError(err.message || 'Failed to duplicate analysis');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id) => {
    setActionLoadingId(`del-${id}`);
    setError('');
    setSuccessMsg('');

    try {
      await analysisApiService.deleteAnalysis(id);
      setAnalyses((prev) => prev.filter((a) => a.id !== id));
      if (selectedAnalysis?.id === id) {
        setSelectedAnalysis(null);
      }
      setSuccessMsg(`Analysis #${id} deleted successfully`);
      setDeletingAnalysis(null);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setError(err.message || 'Failed to delete analysis');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleGenerateReport = async (analysis) => {
    setActionLoadingId(`rep-${analysis.id}`);
    setError('');
    setSuccessMsg('');

    try {
      // 1. Download PDF report
      downloadAnalysisReport(analysis);

      // 2. Persist report record in backend
      const reportRes = await reportApiService.saveReport({
        reportName: `Solar Feasibility - ${analysis.locationName || 'Rooftop'}`,
        reportType: 'PDF',
        analysisId: analysis.id,
        filePath: `/reports/solar_feasibility_${analysis.id}.pdf`,
      });

      let notice = `Report generated and saved for Analysis #${analysis.id}!`;
      if (reportRes?.emailStatus === 'SENT') {
        notice = `Report generated, saved, & emailed to your inbox!`;
      } else if (reportRes?.emailStatus === 'FAILED') {
        notice = `Report generated & saved (Auto-email notice: SMTP credentials not configured).`;
      }
      setSuccessMsg(notice);
      setTimeout(() => setSuccessMsg(''), 6000);
    } catch (err) {
      setError(err.message || 'Failed to generate report');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreateProposal = async (e) => {
    e.preventDefault();
    if (!creatingProposalFor) return;

    setActionLoadingId('create-prop');
    setError('');
    setSuccessMsg('');

    try {
      const name = proposalNameInput.trim() || `Proposal - ${creatingProposalFor.locationName || 'Site'}`;
      await proposalApiService.createProposalFromAnalysis(creatingProposalFor.id, name);
      setSuccessMsg(`Proposal "${name}" created successfully from Analysis #${creatingProposalFor.id}!`);
      setCreatingProposalFor(null);
      setProposalNameInput('');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setError(err.message || 'Failed to create proposal');
    } finally {
      setActionLoadingId(null);
    }
  };

  const columns = [
    {
      header: 'Analysis ID',
      cell: (row) => (
        <span className="font-mono font-bold text-xs text-primary-600 bg-primary-50 px-2.5 py-1 rounded-md border border-primary-100">
          #{row.id}
        </span>
      ),
    },
    {
      header: 'Date',
      cell: (row) => <span className="text-xs text-slate-600">{formatDate(row.createdAt)}</span>,
    },
    {
      header: 'Location',
      cell: (row) => (
        <div className="flex items-center gap-1.5 max-w-[220px]">
          <MapPin size={14} className="text-amber-500 shrink-0" />
          <span className="font-medium text-slate-900 truncate" title={row.locationName}>
            {row.locationName}
          </span>
        </div>
      ),
    },
    {
      header: 'Area',
      cell: (row) => (
        <span className="text-slate-700 font-medium">
          {formatNumber(row.roofArea)} <span className="text-xs text-slate-400">m²</span>
        </span>
      ),
    },
    {
      header: 'Panel Count',
      cell: (row) => (
        <span className="text-slate-800 font-semibold">
          {formatNumber(row.estimatedPanels)} <span className="text-xs text-slate-400 font-normal">mods</span>
        </span>
      ),
    },
    {
      header: 'Generation',
      cell: (row) => (
        <span className="text-amber-600 font-semibold text-xs">
          {formatNumber(row.monthlyGeneration)} kWh/mo
        </span>
      ),
    },
    {
      header: 'ROI',
      cell: (row) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          {formatNumber(row.roi, 1)}%
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          {/* View Action */}
          <button
            type="button"
            onClick={() => setSelectedAnalysis(row)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="View full analysis metrics"
          >
            <Eye size={13} />
            <span>View</span>
          </button>

          {/* Open in Analysis Tab */}
          <button
            type="button"
            onClick={() => handleOpenInAnalysisTab(row)}
            className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
            title="Open in Analysis Tab with full charts & layout"
          >
            <Sun size={13} />
            <span>Analysis</span>
          </button>

          {/* Duplicate Action */}
          <button
            type="button"
            onClick={() => handleDuplicate(row.id)}
            disabled={actionLoadingId === `dup-${row.id}`}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 transition-colors"
            title="Duplicate this analysis"
          >
            <Copy size={13} />
            <span>{actionLoadingId === `dup-${row.id}` ? '...' : 'Duplicate'}</span>
          </button>

          {/* Generate Report Action */}
          <button
            type="button"
            onClick={() => handleGenerateReport(row)}
            disabled={actionLoadingId === `rep-${row.id}`}
            className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition-colors"
            title="Download PDF & Save Report"
          >
            <FileDown size={13} />
            <span>{actionLoadingId === `rep-${row.id}` ? '...' : 'Report'}</span>
          </button>

          {/* Delete Action */}
          <button
            type="button"
            onClick={() => setDeletingAnalysis(row)}
            className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors"
            title="Delete analysis"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Analyses</h1>
          <p className="mt-1 text-slate-500">
            View, duplicate, delete, and generate formal feasibility reports from your rooftop solar analyses
          </p>
        </div>
        <Link
          to="/map"
          className="inline-flex items-center gap-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white px-4 py-2.5 text-sm font-semibold shadow-sm transition-all"
        >
          <Plus size={16} />
          <span>New Analysis</span>
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Analyses Table */}
      <Card className="p-0 overflow-hidden">
        <CardHeader 
          title="All Saved Analyses" 
          className="mb-0 p-6"
          action={
            <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
              {analyses.length} Total Records
            </div>
          }
        />
        {isLoading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading your solar analyses...</div>
        ) : analyses.length ? (
          <Table columns={columns} data={analyses} />
        ) : (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <Layers size={24} />
            </div>
            <h3 className="text-base font-semibold text-slate-800 mb-1">No Analyses Created Yet</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
              Launch the map tool to outline a rooftop polygon and calculate solar potential.
            </p>
            <Link
              to="/map"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-all"
            >
              <span>Run Analysis on Map</span>
            </Link>
          </div>
        )}
      </Card>

      {/* View Analysis Modal */}
      {selectedAnalysis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-primary-50 p-2.5 text-primary-600">
                  <MapPin size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">{selectedAnalysis.locationName}</h3>
                    <span className="font-mono text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      #{selectedAnalysis.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Coordinates: {selectedAnalysis.latitude?.toFixed(4)}, {selectedAnalysis.longitude?.toFixed(4)} • Created: {formatDate(selectedAnalysis.createdAt)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAnalysis(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-6">
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <span className="text-xs text-slate-500 font-medium">Rooftop Area</span>
                <p className="text-lg font-bold text-slate-900 mt-1">{formatNumber(selectedAnalysis.roofArea)} m²</p>
                <p className="text-2xs text-slate-400 mt-0.5">Usable: {formatNumber(selectedAnalysis.usableArea || selectedAnalysis.roofArea * 0.8, 1)} m²</p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <span className="text-xs text-slate-500 font-medium">System Sizing</span>
                <p className="text-lg font-bold text-primary-600 mt-1">{formatNumber(selectedAnalysis.systemSize, 1)} kWp</p>
                <p className="text-2xs text-slate-400 mt-0.5">{selectedAnalysis.estimatedPanels} solar modules</p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <span className="text-xs text-slate-500 font-medium">Annual Generation</span>
                <p className="text-lg font-bold text-amber-600 mt-1">{formatNumber(selectedAnalysis.annualGeneration || selectedAnalysis.monthlyGeneration * 12)} kWh</p>
                <p className="text-2xs text-slate-400 mt-0.5">{formatNumber(selectedAnalysis.monthlyGeneration)} kWh/mo</p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <span className="text-xs text-slate-500 font-medium">Projected ROI</span>
                <p className="text-lg font-bold text-emerald-600 mt-1">{formatNumber(selectedAnalysis.roi, 1)}%</p>
                <p className="text-2xs text-slate-400 mt-0.5">Payback: ~{selectedAnalysis.paybackPeriod || 4} yrs</p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <span className="text-xs text-slate-500 font-medium">Total Cost</span>
                <p className="text-lg font-bold text-slate-900 mt-1">₹{formatNumber(selectedAnalysis.installationCost)}</p>
                <p className="text-2xs text-slate-400 mt-0.5">Annual Savings: ₹{formatNumber(selectedAnalysis.annualSavings)}</p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <span className="text-xs text-slate-500 font-medium">Battery Sizing</span>
                <p className="text-lg font-bold text-emerald-600 mt-1">{formatNumber(selectedAnalysis.batteryRecommendation || 30)} kWh</p>
                <p className="text-2xs text-slate-400 mt-0.5">LiFePO4 Chemistry</p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <span className="text-xs text-slate-500 font-medium">CO₂ Reduction</span>
                <p className="text-lg font-bold text-slate-900 mt-1">{formatNumber(selectedAnalysis.co2Reduction)} kg/yr</p>
                <p className="text-2xs text-slate-400 mt-0.5">Carbon offset</p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <span className="text-xs text-slate-500 font-medium">Weather Impact</span>
                <p className="text-lg font-bold text-sky-600 mt-1">
                  {selectedAnalysis.weatherAdjustment > 0 ? '+' : ''}{selectedAnalysis.weatherAdjustment || 0}%
                </p>
                <p className="text-2xs text-slate-400 mt-0.5">Microclimate irradiance</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleOpenInAnalysisTab(selectedAnalysis)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all"
              >
                <Sun size={14} />
                <span>Open in Analysis Tab</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCreatingProposalFor(selectedAnalysis);
                  setSelectedAnalysis(null);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-primary-200 bg-primary-50 px-4 py-2 text-xs font-semibold text-primary-700 hover:bg-primary-100 transition-colors"
              >
                <FileText size={14} />
                <span>Create Proposal</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleGenerateReport(selectedAnalysis);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition-all"
              >
                <FileDown size={14} />
                <span>Generate & Download PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedAnalysis(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingAnalysis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Analysis #{deletingAnalysis.id}?</h3>
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to delete the analysis for <strong>{deletingAnalysis.locationName}</strong>? This will also remove any linked reports and proposals. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingAnalysis(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deletingAnalysis.id)}
                disabled={actionLoadingId === `del-${deletingAnalysis.id}`}
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {actionLoadingId === `del-${deletingAnalysis.id}` ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Proposal Creation Modal */}
      {creatingProposalFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <form onSubmit={handleCreateProposal} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Create Proposal</h3>
            <p className="text-xs text-slate-500 mb-4">
              Linking to Analysis #{creatingProposalFor.id} ({creatingProposalFor.locationName})
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Proposal Name</label>
                <input
                  type="text"
                  required
                  placeholder={`Proposal - ${creatingProposalFor.locationName}`}
                  value={proposalNameInput}
                  onChange={(e) => setProposalNameInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400">System Size:</span>
                  <p className="font-semibold text-slate-800">{creatingProposalFor.systemSize} kWp</p>
                </div>
                <div>
                  <span className="text-slate-400">Estimated Cost:</span>
                  <p className="font-semibold text-slate-800">₹{formatNumber(creatingProposalFor.installationCost)}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setCreatingProposalFor(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoadingId === 'create-prop'}
                className="rounded-xl bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-50"
              >
                {actionLoadingId === 'create-prop' ? 'Saving...' : 'Create Proposal'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default MyAnalyses;
