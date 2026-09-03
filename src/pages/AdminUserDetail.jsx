import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { getAdminUserDetail, getAdminUserAnalyses, getAdminUserReports } from '../services/adminService';

const formatDate = (value) => value ? new Date(value).toLocaleString() : '—';

const AdminUserDetail = () => {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [analyses, setAnalyses] = useState([]);
  const [reports, setReports] = useState([]);
  const [tab, setTab] = useState('analyses');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [detail, analysisData, reportData] = await Promise.all([
          getAdminUserDetail(userId),
          getAdminUserAnalyses(userId),
          getAdminUserReports(userId),
        ]);
        setUser(detail);
        setAnalyses(Array.isArray(analysisData) ? analysisData : []);
        setReports(Array.isArray(reportData) ? reportData : []);
      } catch (err) {
        setError(err.message || 'Failed to load user detail');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userId]);

  if (loading) return <div className="text-slate-500">Loading user details...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!user) return <div className="text-slate-500">User not found.</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">User Details</h1>
        <p className="text-slate-500 mt-1">Activity and profile overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="px-4 py-4"><div className="text-slate-500 text-sm">Username</div><div className="text-lg font-bold text-slate-900">{user.username}</div></CardContent></Card>
        <Card><CardContent className="px-4 py-4"><div className="text-slate-500 text-sm">Email</div><div className="text-lg font-bold text-slate-900">{user.email}</div></CardContent></Card>
        <Card><CardContent className="px-4 py-4"><div className="text-slate-500 text-sm">Role</div><div className="text-lg font-bold text-slate-900">{user.role}</div></CardContent></Card>
        <Card><CardContent className="px-4 py-4"><div className="text-slate-500 text-sm">Registered</div><div className="text-lg font-bold text-slate-900">{formatDate(user.createdAt)}</div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="px-4 py-4"><div className="text-slate-500 text-sm">Analyses</div><div className="text-2xl font-bold text-slate-900">{user.analysisCount}</div></CardContent></Card>
        <Card><CardContent className="px-4 py-4"><div className="text-slate-500 text-sm">Reports</div><div className="text-2xl font-bold text-slate-900">{user.reportCount}</div></CardContent></Card>
        <Card><CardContent className="px-4 py-4"><div className="text-slate-500 text-sm">Last Activity</div><div className="text-xl font-bold text-slate-900">{formatDate(user.lastActivityAt)}</div></CardContent></Card>
      </div>

      <Card className="p-0">
        <CardHeader title="Activity" className="mb-0 pt-6 px-6" />
        <CardContent className="px-0 pb-0">
          <div className="flex border-b border-slate-200 px-6 space-x-4">
            <button className={`py-3 px-2 text-sm font-medium ${tab === 'analyses' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-500'}`} onClick={() => setTab('analyses')}>Analyses</button>
            <button className={`py-3 px-2 text-sm font-medium ${tab === 'reports' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-500'}`} onClick={() => setTab('reports')}>Reports</button>
          </div>

          {tab === 'analyses' && (
            <div className="p-6">
              {analyses.length === 0 ? <div className="text-slate-500">No analyses found.</div> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 font-semibold text-slate-600">Location</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-600">ROI</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-600">Annual Generation</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-600">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyses.map((analysis) => (
                        <tr key={analysis.id} className="border-b border-slate-100">
                          <td className="py-3 px-4 text-slate-900">{analysis.locationName}</td>
                          <td className="py-3 px-4 text-slate-600">{analysis.roi ?? 0}%</td>
                          <td className="py-3 px-4 text-slate-600">{analysis.annualGeneration ?? 0}</td>
                          <td className="py-3 px-4 text-slate-600">{formatDate(analysis.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === 'reports' && (
            <div className="p-6">
              {reports.length === 0 ? <div className="text-slate-500">No reports found.</div> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 font-semibold text-slate-600">Name</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-600">Type</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-600">Generated</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-600">Analysis ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map((report) => (
                        <tr key={report.id} className="border-b border-slate-100">
                          <td className="py-3 px-4 text-slate-900">{report.reportName}</td>
                          <td className="py-3 px-4 text-slate-600">{report.reportType}</td>
                          <td className="py-3 px-4 text-slate-600">{formatDate(report.generatedAt)}</td>
                          <td className="py-3 px-4 text-slate-600">{report.analysisId}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUserDetail;
