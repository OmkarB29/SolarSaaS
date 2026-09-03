import React, { useEffect, useState } from 'react';
import { Eye, MapPin, FileDown } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { analysisApiService } from '../services/analysisApiService';
import { reportApiService } from '../services/reportApiService';
import { downloadAnalysisReport } from '../services/reportService';
import ForecastSection from '../components/forecast/ForecastSection';

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
  const [generatingReportId, setGeneratingReportId] = useState(null);
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

  const [successMsg, setSuccessMsg] = useState('');

  const handleGenerateReport = async (analysis) => {
    setGeneratingReportId(analysis.id);
    setError('');
    setSuccessMsg('');

    try {
      // Trigger PDF download
      downloadAnalysisReport(analysis);

      // Save report record to backend
      const reportRes = await reportApiService.saveReport({
        reportName: `Solar Feasibility - ${analysis.locationName || 'Rooftop'}`,
        reportType: 'PDF',
        analysisId: analysis.id,
        filePath: `/reports/solar_feasibility_${analysis.id}.pdf`,
      });

      let notice = 'Report saved to database successfully!';
      if (reportRes?.emailStatus === 'SENT') {
        notice = 'Report saved & dispatched to your email!';
      } else if (reportRes?.emailStatus === 'FAILED') {
        notice = 'Report saved (Auto-email notice: SMTP credentials not configured)';
      }
      setSuccessMsg(notice);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (reportError) {
      setError(reportError.message || 'Failed to save report to backend');
    } finally {
      setGeneratingReportId(null);
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
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleViewAnalysis(row.id)}
            disabled={viewingId === row.id}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Eye size={14} />
            {viewingId === row.id ? 'Loading' : 'View'}
          </button>
          <button
            type="button"
            onClick={() => handleGenerateReport(row)}
            disabled={generatingReportId === row.id}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-70"
            title="Download PDF and save to Reports"
          >
            <FileDown size={14} />
            {generatingReportId === row.id ? 'Generating' : 'Report'}
          </button>
        </div>
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

      {successMsg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {successMsg}
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
          <div className="mb-5 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
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
            <button
              type="button"
              onClick={() => handleGenerateReport(selectedAnalysis)}
              disabled={generatingReportId === selectedAnalysis.id}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-70 transition-all"
            >
              <FileDown size={16} />
              <span>{generatingReportId === selectedAnalysis.id ? 'Generating...' : 'Download PDF & Save Report'}</span>
            </button>
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

          {/* 10-Day Forecast Snapshot */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <ForecastSection analysis={selectedAnalysis} />
          </div>
        </Card>
      )}
    </div>
  );
};

export default AnalysisHistory;
