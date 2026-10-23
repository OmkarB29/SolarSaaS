import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileDown, Trash2, MapPin, CalendarDays, FileText, ArrowRight, Mail, CheckCircle2, AlertTriangle, Clock, Sun, ExternalLink } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { reportApiService } from '../services/reportApiService';
import { analysisApiService } from '../services/analysisApiService';
import { downloadAnalysisReport, downloadSolarPotentialReport } from '../services/reportService';
import { solarApiService } from '../services/solarApiService';
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
  const [solarHistory, setSolarHistory] = useState([]);
  const [emailHistory, setEmailHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [resendingId, setResendingId] = useState(null);
  const [successNotice, setSuccessNotice] = useState('');

  const refreshHistory = async () => {
    try {
      const historyData = await userSettingsService.getEmailHistory();
      setEmailHistory(historyData || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [reportsData, historyData, solarData] = await Promise.all([
          reportApiService.getReports().catch(() => []),
          userSettingsService.getEmailHistory().catch(() => []),
          solarApiService.getSolarHistory().catch(() => []),
        ]);
        if (isMounted) {
          setReports(reportsData || []);
          setEmailHistory(historyData || []);
          setSolarHistory(solarData || []);
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
    setSuccessNotice('');

    try {
      await reportApiService.deleteReport(id);
      setReports(reports.filter((report) => report.id !== id));
      setSuccessNotice('Report deleted successfully.');
      setTimeout(() => setSuccessNotice(''), 4000);
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownloadReport = async (report) => {
    setDownloadingId(report.id);
    setError('');
    setSuccessNotice('');

    try {
      const analysis = await analysisApiService.getAnalysisById(report.analysisId);
      downloadAnalysisReport(analysis);
      setSuccessNotice(`PDF for "${report.reportName}" downloaded successfully.`);
      setTimeout(() => setSuccessNotice(''), 4000);
    } catch (downloadError) {
      setError(downloadError.message);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadSolarReport = (solarItem) => {
    setDownloadingId(`solar-${solarItem.id}`);
    setError('');
    setSuccessNotice('');

    try {
      downloadSolarPotentialReport(solarItem);
      setSuccessNotice(`Solar potential report downloaded successfully.`);
      setTimeout(() => setSuccessNotice(''), 4000);
    } catch (downloadError) {
      setError(downloadError.message || 'Failed to generate solar report PDF');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDeleteSolarReport = async (id) => {
    setDeletingId(`solar-${id}`);
    setError('');
    setSuccessNotice('');

    try {
      await solarApiService.deleteSolarPotential(id);
      setSolarHistory((prev) => prev.filter((item) => item.id !== id));
      setSuccessNotice('Solar assessment deleted successfully.');
      setTimeout(() => setSuccessNotice(''), 4000);
    } catch (deleteError) {
      setError(deleteError.message || 'Failed to delete solar assessment');
    } finally {
      setDeletingId(null);
    }
  };

  const handleResendEmail = async (report) => {
    setResendingId(report.id);
    setError('');
    setSuccessNotice('');

    try {
      const res = await reportApiService.resendEmail(report.id);
      await refreshHistory();
      if (res?.emailStatus === 'SENT') {
        setSuccessNotice(`Report "${report.reportName}" re-sent to your email successfully!`);
      } else if (res?.emailStatus === 'FAILED') {
        setSuccessNotice(`Re-send logged: ${res.emailMessage || 'SMTP credentials not configured'}`);
      } else {
        setSuccessNotice(`Report re-sent successfully.`);
      }
      setTimeout(() => setSuccessNotice(''), 5000);
    } catch (err) {
      setError(err.message || 'Failed to re-send email');
    } finally {
      setResendingId(null);
    }
  };

  const columns = [
    {
      header: 'Report Name',
      accessorKey: 'reportName',
      cell: (row) => (
        <div>
          <span className="font-semibold text-slate-900 block">{row.reportName}</span>
          <span className="font-mono text-2xs text-slate-400">Linked to Analysis #{row.analysisId}</span>
        </div>
      ),
    },
    {
      header: 'Type',
      accessorKey: 'reportType',
      cell: (row) => (
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
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
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center justify-end gap-2">
          {/* Re-download PDF */}
          <button
            type="button"
            onClick={() => handleDownloadReport(row)}
            disabled={downloadingId === row.id}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1.5 rounded-lg disabled:opacity-50 cursor-pointer transition-all"
            title="Re-download PDF"
          >
            <FileDown size={14} />
            <span>{downloadingId === row.id ? 'Downloading...' : 'Re-download PDF'}</span>
          </button>

          {/* Re-send Email */}
          <button
            type="button"
            onClick={() => handleResendEmail(row)}
            disabled={resendingId === row.id}
            className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1.5 rounded-lg disabled:opacity-50 cursor-pointer transition-all"
            title="Re-send report via email"
          >
            <Mail size={14} />
            <span>{resendingId === row.id ? 'Sending...' : 'Re-send Email'}</span>
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={() => handleDeleteReport(row.id)}
            disabled={deletingId === row.id}
            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 disabled:opacity-50 cursor-pointer transition-all"
            title="Delete report"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  const solarColumns = [
    {
      header: 'Rooftop Location',
      accessorKey: 'formattedAddress',
      cell: (row) => (
        <div>
          <span className="font-semibold text-slate-900 block truncate max-w-xs" title={row.formattedAddress}>
            {row.formattedAddress || 'Rooftop Assessment'}
          </span>
          <span className="font-mono text-2xs text-slate-400">
            {Number(row.latitude).toFixed(4)}, {Number(row.longitude).toFixed(4)}
          </span>
        </div>
      ),
    },
    {
      header: 'Score & Quality',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800">{Math.round(row.solarScore || 0)}</span>
          <span className={`px-2 py-0.5 rounded-full text-2xs font-semibold ${
            row.solarQuality === 'EXCELLENT' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
            row.solarQuality === 'GOOD' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
            row.solarQuality === 'MODERATE' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
            'bg-slate-50 text-slate-700 border border-slate-200'
          }`}>
            {row.solarQuality || 'ASSESSED'}
          </span>
        </div>
      ),
    },
    {
      header: 'Specs (Panels / Energy)',
      cell: (row) => (
        <div className="text-xs">
          <div className="font-medium text-slate-800">{row.maxArrayPanelsCount} panels • {Math.round(row.maxArrayAreaMeters2 || 0)} m²</div>
          <div className="text-amber-600 font-semibold">{new Intl.NumberFormat('en-IN').format(Math.round(row.yearlyEnergyDcKwh || 0))} kWh/yr</div>
        </div>
      ),
    },
    {
      header: 'Assessed On',
      cell: (row) => formatDate(row.createdAt),
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center justify-end gap-2">
          {/* Download Technical Assessment PDF */}
          <button
            type="button"
            onClick={() => handleDownloadSolarReport(row)}
            disabled={downloadingId === `solar-${row.id}`}
            className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1.5 rounded-lg disabled:opacity-50 cursor-pointer transition-all"
            title="Download Google Solar Technical PDF"
          >
            <FileDown size={14} />
            <span>{downloadingId === `solar-${row.id}` ? 'Generating...' : 'Solar PDF'}</span>
          </button>

          {/* View in Solar Potential Module */}
          <Link
            to="/solar-potential"
            state={{
              latitude: row.latitude,
              longitude: row.longitude,
              address: row.formattedAddress,
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-lg transition-all"
            title="Open Rooftop in Solar Potential Module"
          >
            <ExternalLink size={14} />
            <span>Open</span>
          </Link>

          {/* Delete */}
          <button
            type="button"
            onClick={() => handleDeleteSolarReport(row.id)}
            disabled={deletingId === `solar-${row.id}`}
            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 disabled:opacity-50 cursor-pointer transition-all"
            title="Delete solar assessment"
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

      {successNotice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{successNotice}</span>
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

      {/* Google Solar API Technical Assessments Card */}
      <Card className="p-0">
        <CardHeader 
          title="Google Solar Technical Assessment Reports" 
          className="mb-0 p-6"
          action={
            <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
              <Sun size={14} className="text-amber-500" />
              <span>{solarHistory.length} Assessed Rooftops</span>
            </div>
          }
        />
        {isLoading ? (
          <div className="px-6 pb-6 text-sm text-slate-500">Loading solar assessments...</div>
        ) : solarHistory.length ? (
          <Table columns={solarColumns} data={solarHistory} />
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <Sun size={24} />
            </div>
            <h3 className="text-base font-semibold text-slate-800 mb-1">No Solar Potential Assessments Saved</h3>
            <p className="text-sm text-slate-500 max-w-md mb-6">
              Assess any building rooftop with the Google Solar API module to inspect solar potential, seasonal generation, and download technical assessment PDFs.
            </p>
            <Link
              to="/solar-potential"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all"
            >
              <span>Assess Solar Potential</span>
              <ArrowRight size={16} />
            </Link>
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