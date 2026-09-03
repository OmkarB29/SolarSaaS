import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileDown, Trash2, MapPin, CalendarDays, FileText, ArrowRight, Mail, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { reportApiService } from '../services/reportApiService';
import { analysisApiService } from '../services/analysisApiService';
import { downloadAnalysisReport } from '../services/reportService';
import { userSettingsService } from '../services/userSettingsService';

const formatDate = (value) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [emailHistory, setEmailHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [reportsData, historyData] = await Promise.all([
          reportApiService.getReports().catch(() => []),
          userSettingsService.getEmailHistory().catch(() => []),
        ]);
        if (isMounted) {
          setReports(reportsData || []);
          setEmailHistory(historyData || []);
        }
      } catch (loadError) {
        if (isMounted) setError(loadError.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();

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
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => handleDownloadReport(row)}
            disabled={downloadingId === row.id}
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50 cursor-pointer"
          >
            <FileDown size={14} />
            <span>{downloadingId === row.id ? 'Downloading...' : 'Download'}</span>
          </button>
          <button
            type="button"
            onClick={() => handleDeleteReport(row.id)}
            disabled={deletingId === row.id}
            className="text-slate-400 hover:text-rose-600 disabled:opacity-50 cursor-pointer"
            title="Delete report"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  const emailColumns = [
    {
      header: 'Recipient',
      accessorKey: 'recipientEmail',
      cell: (row) => <span className="font-medium text-slate-800">{row.recipientEmail}</span>,
    },
    {
      header: 'Subject / Report',
      cell: (row) => (
        <div>
          <p className="font-medium text-slate-900 text-xs">{row.subject}</p>
          <p className="text-2xs text-slate-500">{row.reportName}</p>
        </div>
      ),
    },
    {
      header: 'Delivery Status',
      cell: (row) => {
        if (row.status === 'SENT') {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 size={12} />
              SENT
            </span>
          );
        }
        if (row.status === 'FAILED') {
          return (
            <span 
              title={row.errorMessage || 'Failed'}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 cursor-help"
            >
              <AlertTriangle size={12} />
              FAILED
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock size={12} />
            PENDING
          </span>
        );
      },
    },
    {
      header: 'Details',
      cell: (row) => (
        <span className="text-xs text-slate-500 truncate max-w-[200px] block" title={row.errorMessage || 'Delivered successfully'}>
          {row.errorMessage ? row.errorMessage : 'PDF attached & delivered'}
        </span>
      ),
    },
    {
      header: 'Date',
      cell: (row) => formatDate(row.sentAt),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports & Dispatch History</h1>
        <p className="mt-1 text-slate-500">Manage your generated solar analysis reports and automated email deliveries</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Report History Card */}
      <Card className="p-0">
        <CardHeader title="Saved Reports in Database" className="mb-0 p-6" />
        {isLoading ? (
          <div className="px-6 pb-6 text-sm text-slate-500">Loading reports...</div>
        ) : reports.length ? (
          <Table columns={columns} data={reports} />
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <FileText size={24} />
            </div>
            <h3 className="text-base font-semibold text-slate-800 mb-1">No Saved Reports Found</h3>
            <p className="text-sm text-slate-500 max-w-md mb-6">
              Reports are generated automatically when you complete rooftop analyses or click "Save Proposal" on an analysis.
            </p>
            <div className="flex gap-3">
              <Link
                to="/map"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-all"
              >
                <span>Run Analysis on Map</span>
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/analysis"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
              >
                <span>View System Analysis</span>
              </Link>
            </div>
          </div>
        )}
      </Card>

      {/* Auto Email Delivery History Card */}
      <Card className="p-0">
        <CardHeader 
          title="Automated Email Delivery Logs" 
          className="mb-0 p-6"
          action={
            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <Mail size={14} className="text-amber-500" />
              <span>{emailHistory.length} Logged Deliveries</span>
            </div>
          }
        />
        {isLoading ? (
          <div className="px-6 pb-6 text-sm text-slate-500">Loading email logs...</div>
        ) : emailHistory.length ? (
          <Table columns={emailColumns} data={emailHistory} />
        ) : (
          <div className="p-8 text-center text-sm text-slate-500">
            <Mail size={24} className="mx-auto mb-2 text-slate-300" />
            <p>No automated email dispatches recorded yet.</p>
            <p className="text-xs text-slate-400 mt-1">Enable "Auto-Email Reports" in Settings to automatically receive PDF proposals via email.</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Reports;