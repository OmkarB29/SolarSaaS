import React, { useEffect, useState } from 'react';
import { Eye, MapPin } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { analysisApiService } from '../services/analysisApiService';

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

const AnalysisHistory = () => {
  const [analyses, setAnalyses] = useState([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingId, setViewingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadAnalyses = async () => {
      try {
        const data = await analysisApiService.getAnalyses();
        if (isMounted) {
          setAnalyses(data);
          setSelectedAnalysis(data[0] || null);
        }
      } catch (loadError) {
        if (isMounted) setError(loadError.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadAnalyses();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleViewAnalysis = async (id) => {
    setViewingId(id);
    setError('');

    try {
      setSelectedAnalysis(await analysisApiService.getAnalysisById(id));
    } catch (viewError) {
      setError(viewError.message);
    } finally {
      setViewingId(null);
    }
  };

  const columns = [
    {
      header: 'Location',
      accessorKey: 'locationName',
      cell: (row) => <span className="font-medium text-slate-900">{row.locationName}</span>,
    },
    {
      header: 'Area',
      cell: (row) => `${formatNumber(row.roofArea)} m2`,
    },
    {
      header: 'Panels',
      cell: (row) => formatNumber(row.estimatedPanels),
    },
    {
      header: 'Generation',
      cell: (row) => `${formatNumber(row.monthlyGeneration)} kWh/mo`,
    },
    {
      header: 'ROI',
      cell: (row) => `${formatNumber(row.roi, 1)}%`,
    },
    {
      header: 'Date',
      cell: (row) => formatDate(row.createdAt),
    },
    {
      header: '',
      cell: (row) => (
        <button
          type="button"
          onClick={() => handleViewAnalysis(row.id)}
          disabled={viewingId === row.id}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <Eye size={16} />
          {viewingId === row.id ? 'Loading' : 'View'}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analysis History</h1>
        <p className="mt-1 text-slate-500">Saved rooftop solar analyses for your account</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <Card className="p-0">
        <CardHeader title="Saved Analyses" className="mb-0 p-6" />
        {isLoading ? (
          <div className="px-6 pb-6 text-sm text-slate-500">Loading analysis history...</div>
        ) : analyses.length ? (
          <Table columns={columns} data={analyses} />
        ) : (
          <div className="px-6 pb-6 text-sm text-slate-500">No saved analyses yet.</div>
        )}
      </Card>

      {selectedAnalysis && (
        <Card>
          <div className="mb-5 flex items-start gap-3">
            <div className="rounded-xl bg-primary-50 p-3 text-primary-600">
              <MapPin size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{selectedAnalysis.locationName}</h2>
              <p className="text-sm text-slate-500">
                {selectedAnalysis.latitude.toFixed(5)}, {selectedAnalysis.longitude.toFixed(5)}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-slate-500">Roof Area</p>
              <p className="text-xl font-bold text-slate-900">{formatNumber(selectedAnalysis.roofArea)} m2</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Estimated Panels</p>
              <p className="text-xl font-bold text-slate-900">{formatNumber(selectedAnalysis.estimatedPanels)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Monthly Generation</p>
              <p className="text-xl font-bold text-slate-900">
                {formatNumber(selectedAnalysis.monthlyGeneration)} kWh
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AnalysisHistory;
