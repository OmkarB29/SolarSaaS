import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { getAdminAnalyses } from '../services/adminService';

const AdminAnalyses = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getAdminAnalyses({ page: 0, size: 20 });
        setItems(Array.isArray(data) ? data : data.content || []);
      } catch (err) {
        setError(err.message || 'Failed to load analyses');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) return <div className="text-slate-500">Loading analyses...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analyses</h1>
        <p className="text-slate-500 mt-1">Recent solar analysis runs across the platform</p>
      </div>

      <Card className="p-0">
        <CardHeader title={`Analyses (${items.length})`} className="mb-0 pt-6 px-6" />
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Location</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">User ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">ROI</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Annual Gen.</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Created</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="py-3 px-4 text-slate-900">{item.locationName}</td>
                    <td className="py-3 px-4 text-slate-600">{item.userId}</td>
                    <td className="py-3 px-4 text-slate-600">{item.roi ?? 0}%</td>
                    <td className="py-3 px-4 text-slate-600">{item.monthlyGeneration ?? 0}</td>
                    <td className="py-3 px-4 text-slate-600">{new Date(item.createdAt).toLocaleDateString()}</td>
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

export default AdminAnalyses;
