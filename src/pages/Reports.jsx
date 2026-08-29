import React, { useEffect, useState } from 'react';
import { FileDown, Trash2, MapPin, CalendarDays } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { reportApiService } from '../services/reportApiService';
import { analysisApiService } from '../services/analysisApiService';
import { downloadAnalysisReport } from '../services/reportService';

const formatDate = (value) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadReports = async () => {
      try {
        const data = await reportApiService.getReports();
        if (isMounted) {
          setReports(data);
        }
      } catch (loadError) {
        if (isMounted) setError(loadError.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadReports();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleDeleteReport = async (id) => {
    setDeletingId(id);
    setError('');

    try {
      await reportApiService.deleteReport(id);
      setReports(reports.filter((report) => report.id !== id));
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownloadReport = async (report) => {
    setDownloadingId(report.id);
    setError('');

    try {
      const analysis = await analysisApiService.getAnalysisById(report.analysisId);
      downloadAnalysisReport(analysis);
    } catch (downloadError) {
      setError(downloadError.message);
    } finally {
      setDownloadingId(null);
    }
  };

  const columns = [
    {
      header: 'Report Name',
      accessorKey: 'reportName',
      cell: (row) => <span className="font-medium text-slate-900">{row.reportName}</span>,
    },
    {
      header: 'Type',
      accessorKey: 'reportType',
      cell: (row) => (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
          {row.reportType}
        </span>
      ),
    },
    {
      header: 'Generated',
      cell: (row) => formatDate(row.generatedAt),
    },
    {
      header: 'Created',
      cell: (row) => formatDate(row.createdAt),
    },
    {
      header: '',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleDownloadReport(row)}
            disabled={downloadingId === row.id}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <FileDown size={16} />
            {downloadingId === row.id ? 'Loading' : 'Download'}
          </button>
          <button
            type="button"
            onClick={() => handleDeleteReport(row.id)}
            disabled={deletingId === row.id}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Trash2 size={16} />
            {deletingId === row.id ? 'Deleting' : 'Delete'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Saved Reports</h1>
        <p className="mt-1 text-slate-500">Manage your generated solar analysis reports</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <Card className="p-0">
        <CardHeader title="Report History" className="mb-0 p-6" />
        {isLoading ? (
          <div className="px-6 pb-6 text-sm text-slate-500">Loading reports...</div>
        ) : reports.length ? (
          <Table columns={columns} data={reports} />
        ) : (
          <div className="px-6 pb-6 text-sm text-slate-500">No saved reports yet.</div>
        )}
      </Card>
    </div>
  );
};

export default Reports;
