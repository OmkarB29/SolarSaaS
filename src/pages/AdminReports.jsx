import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { getAdminReports } from '../services/adminService';

const AdminReports = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getAdminReports({ page: 0, size: 20 });
        setItems(Array.isArray(data) ? data : data.content || []);
      } catch (err) {
        setError(err.message || 'Failed to load reports');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) return <div className="text-slate-500">Loading reports...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        <p className="text-slate-500 mt-1">Report generation activity across the platform</p>
      </div>

      <Card className="p-0">
        <CardHeader title={`Reports (${items.length})`} className="mb-0 pt-6 px-6" />
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">User ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Analysis ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Generated</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="py-3 px-4 text-slate-900">{item.reportName}</td>
                    <td className="py-3 px-4 text-slate-600">{item.reportType}</td>
                    <td className="py-3 px-4 text-slate-600">{item.userId ?? '—'}</td>
                    <td className="py-3 px-4 text-slate-600">{item.analysisId ?? '—'}</td>
                    <td className="py-3 px-4 text-slate-600">{new Date(item.generatedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminReports;
