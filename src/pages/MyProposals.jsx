import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Filter, 
  MapPin, 
  Layers, 
  ChevronDown,
  ShieldCheck,
  Zap,
  Banknote,
  TrendingUp,
  X
} from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { proposalApiService } from '../services/proposalApiService';
import { analysisApiService } from '../services/analysisApiService';

const STATUS_CONFIG = {
  DRAFT: {
    label: 'DRAFT',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-400',
  },
  REVIEWED: {
    label: 'REVIEWED',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    dotClass: 'bg-blue-500',
  },
  APPROVED: {
    label: 'APPROVED',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  INSTALLED: {
    label: 'INSTALLED',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    dotClass: 'bg-purple-500',
  },
};

const ALL_STATUSES = ['DRAFT', 'REVIEWED', 'APPROVED', 'INSTALLED'];

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

const MyProposals = () => {
  const [proposals, setProposals] = useState([]);
  const [userAnalyses, setUserAnalyses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // New Proposal Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    proposalName: '',
    analysisId: '',
    systemSize: '',
    cost: '',
    roi: '',
    status: 'DRAFT',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError('');
      const [proposalsRes, analysesRes] = await Promise.allSettled([
        proposalApiService.getProposals(),
        analysisApiService.getAnalyses(),
      ]);

      if (proposalsRes.status === 'fulfilled') {
        setProposals(proposalsRes.value || []);
      } else {
        setError(proposalsRes.reason?.message || 'Failed to load proposals');
      }

      if (analysesRes.status === 'fulfilled') {
        setUserAnalyses(analysesRes.value || []);
      } else {
        console.warn('Could not load user analyses for proposal form:', analysesRes.reason);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (proposalId, newStatus) => {
    setUpdatingId(proposalId);
    setError('');
    setSuccessMsg('');

    try {
      const updated = await proposalApiService.updateProposalStatus(proposalId, newStatus);
      setProposals((prev) =>
        prev.map((p) => (p.id === proposalId ? { ...p, status: updated.status, updatedAt: updated.updatedAt } : p))
      );
      setSuccessMsg(`Proposal #${proposalId} status updated to ${newStatus}`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to update proposal status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (proposalId) => {
    if (!window.confirm(`Are you sure you want to delete proposal #${proposalId}?`)) return;

    setDeletingId(proposalId);
    setError('');
    setSuccessMsg('');

    try {
      await proposalApiService.deleteProposal(proposalId);
      setProposals((prev) => prev.filter((p) => p.id !== proposalId));
      setSuccessMsg(`Proposal #${proposalId} deleted successfully`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to delete proposal');
    } finally {
      setDeletingId(null);
    }
  };

  const handleAnalysisSelect = (analysisIdStr) => {
    const selected = userAnalyses.find((a) => String(a.id) === String(analysisIdStr));
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        analysisId: selected.id,
        proposalName: prev.proposalName || `Proposal - ${selected.locationName}`,
        systemSize: selected.systemSize || (selected.estimatedPanels ? (selected.estimatedPanels * 0.4).toFixed(1) : '10.0'),
        cost: selected.installationCost || '350000',
        roi: selected.roi || '22.5',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        analysisId: analysisIdStr,
      }));
    }
  };

  const handleCreateProposal = async (e) => {
    e.preventDefault();
    if (!formData.analysisId) {
      setError('Please select an analysis reference');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      const payload = {
        proposalName: formData.proposalName,
        analysisId: Number(formData.analysisId),
        systemSize: formData.systemSize ? Number(formData.systemSize) : null,
        cost: formData.cost ? Number(formData.cost) : null,
        roi: formData.roi ? Number(formData.roi) : null,
        status: formData.status,
      };

      const created = await proposalApiService.createProposal(payload);
      setProposals((prev) => [created, ...prev]);
      setSuccessMsg(`Proposal "${created.proposalName}" created successfully!`);
      setIsModalOpen(false);
      setFormData({
        proposalName: '',
        analysisId: '',
        systemSize: '',
        cost: '',
        roi: '',
        status: 'DRAFT',
      });
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setError(err.message || 'Failed to create proposal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProposals = proposals.filter((p) => {
    if (filterStatus === 'ALL') return true;
    return p.status === filterStatus;
  });

  const counts = {
    ALL: proposals.length,
    DRAFT: proposals.filter((p) => p.status === 'DRAFT').length,
    REVIEWED: proposals.filter((p) => p.status === 'REVIEWED').length,
    APPROVED: proposals.filter((p) => p.status === 'APPROVED').length,
    INSTALLED: proposals.filter((p) => p.status === 'INSTALLED').length,
  };

  const columns = [
    {
      header: 'Proposal Name',
      accessorKey: 'proposalName',
      cell: (row) => (
        <div>
          <p className="font-semibold text-slate-900 text-sm">{row.proposalName}</p>
          <span className="font-mono text-2xs text-slate-400">ID #{row.id}</span>
        </div>
      ),
    },
    {
      header: 'Analysis Reference',
      cell: (row) => (
        <div className="flex items-center gap-1.5 max-w-[200px]">
          <span className="font-mono text-xs text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded shrink-0 border border-primary-100">
            #{row.analysisId}
          </span>
          <span className="text-xs text-slate-600 truncate" title={row.locationName}>
            {row.locationName || 'Rooftop Site'}
          </span>
        </div>
      ),
    },
    {
      header: 'System Size',
      cell: (row) => (
        <span className="text-slate-800 font-semibold text-xs">
          {formatNumber(row.systemSize, 1)} <span className="text-slate-400 font-normal">kWp</span>
        </span>
      ),
    },
    {
      header: 'Cost',
      cell: (row) => (
        <span className="text-slate-900 font-medium text-xs">
          ₹{formatNumber(row.cost)}
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
      header: 'Status',
      cell: (row) => {
        const config = STATUS_CONFIG[row.status] || STATUS_CONFIG.DRAFT;
        return (
          <div className="relative inline-block text-left">
            <select
              value={row.status}
              disabled={updatingId === row.id}
              onChange={(e) => handleStatusChange(row.id, e.target.value)}
              className={`text-xs font-semibold rounded-full px-3 py-1 border cursor-pointer appearance-none pr-6 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all ${config.badgeClass}`}
            >
              {ALL_STATUSES.map((st) => (
                <option key={st} value={st} className="bg-white text-slate-800 font-normal">
                  {st}
                </option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-2 pointer-events-none opacity-60" />
          </div>
        );
      },
    },
    {
      header: 'Created Date',
      cell: (row) => <span className="text-xs text-slate-500">{formatDate(row.createdAt)}</span>,
    },
    {
      header: '',
      cell: (row) => (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => handleDelete(row.id)}
            disabled={deletingId === row.id}
            className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors disabled:opacity-50"
            title="Delete proposal"
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
          <h1 className="text-2xl font-bold text-slate-900">My Proposals</h1>
          <p className="mt-1 text-slate-500">
            Dedicated workspace for commercial proposals, lifecycle tracking, and status management
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white px-4 py-2.5 text-sm font-semibold shadow-sm transition-all"
        >
          <Plus size={16} />
          <span>New Proposal</span>
        </button>
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

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {['ALL', ...ALL_STATUSES].map((st) => {
          const isActive = filterStatus === st;
          return (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{st === 'ALL' ? 'All Proposals' : st}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-2xs ${
                  isActive ? 'bg-slate-700 text-slate-200' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {counts[st]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Proposals Table Card */}
      <Card className="p-0 overflow-hidden">
        <CardHeader
          title={`Proposals (${filteredProposals.length})`}
          className="mb-0 p-6"
          action={
            <div className="text-xs text-slate-400">
              Change status directly using the dropdown
            </div>
          }
        />
        {isLoading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading proposals...</div>
        ) : filteredProposals.length ? (
          <Table columns={columns} data={filteredProposals} />
        ) : (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-4">
              <FileText size={24} />
            </div>
            <h3 className="text-base font-semibold text-slate-800 mb-1">No Proposals Found</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
              {filterStatus !== 'ALL'
                ? `No proposals with status "${filterStatus}".`
                : 'Create your first commercial proposal linked to an existing rooftop analysis.'}
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-all"
            >
              <Plus size={16} />
              <span>Create Proposal</span>
            </button>
          </div>
        )}
      </Card>

      {/* Create Proposal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Create New Proposal</h3>
                <p className="text-xs text-slate-500">Stored separately from analysis history</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateProposal} className="space-y-4">
              {/* Analysis Reference */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Analysis Reference <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.analysisId}
                  onChange={(e) => handleAnalysisSelect(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none"
                >
                  <option value="">-- Select an Analysis --</option>
                  {userAnalyses.map((a) => (
                    <option key={a.id} value={a.id}>
                      #{a.id} - {a.locationName} ({a.systemSize || (a.estimatedPanels * 0.4).toFixed(1)} kWp)
                    </option>
                  ))}
                </select>
                {userAnalyses.length === 0 && (
                  <p className="text-2xs text-amber-600 mt-1">
                    No analyses found.{' '}
                    <Link to="/map" className="underline font-semibold">
                      Run an analysis on map first.
                    </Link>
                  </p>
                )}
              </div>

              {/* Proposal Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Proposal Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Industrial Rooftop Solar Phase 1"
                  value={formData.proposalName}
                  onChange={(e) => setFormData({ ...formData, proposalName: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none"
                />
              </div>

              {/* System Size & Cost */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">System Size (kWp)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="10.0"
                    value={formData.systemSize}
                    onChange={(e) => setFormData({ ...formData, systemSize: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Total Cost (INR)</label>
                  <input
                    type="number"
                    placeholder="350000"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* ROI & Initial Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ROI (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="25.0"
                    value={formData.roi}
                    onChange={(e) => setFormData({ ...formData, roi: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none"
                  >
                    {ALL_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Proposal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProposals;
