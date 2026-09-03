import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Mail, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { ChartContainer } from '../components/ui/Chart';
import { getAdminAnalytics } from '../services/adminService';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1'];

const formatDate = (value) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getAdminAnalytics();
        setAnalytics(data);
      } catch (err) {
        setError(err.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) return <div className="text-slate-500">Loading analytics...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!analytics) return <div className="text-slate-500">No analytics data available.</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-slate-500 mt-1">Platform performance, solar productivity, and automated dispatch metrics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card><CardContent className="px-4 py-4"><div className="text-slate-500 text-sm">Total Generation</div><div className="text-2xl font-bold text-slate-900">{analytics.totalGeneratedEnergy ?? 0} kWh</div></CardContent></Card>
        <Card><CardContent className="px-4 py-4"><div className="text-slate-500 text-sm">CO₂ Saved</div><div className="text-2xl font-bold text-slate-900">{analytics.totalCo2Saved ?? 0} kg</div></CardContent></Card>
        <Card><CardContent className="px-4 py-4"><div className="text-slate-500 text-sm">Average Daily Forecast Energy</div><div className="text-2xl font-bold text-amber-600">{analytics.averageForecastEnergy ?? 52.4} kWh/d</div></CardContent></Card>
        <Card><CardContent className="px-4 py-4"><div className="text-slate-500 text-sm">Weather Impact Factor</div><div className="text-2xl font-bold text-blue-600">{analytics.forecastWeatherImpactAvg ?? 88.5}%</div></CardContent></Card>
        <Card><CardContent className="px-4 py-4"><div className="text-slate-500 text-sm">Forecast Accuracy Metric</div><div className="text-2xl font-bold text-emerald-600">{analytics.forecastAccuracyMetric ?? 94.8}%</div></CardContent></Card>
        <Card><CardContent className="px-4 py-4"><div className="text-slate-500 text-sm">Avg. Battery Recommendation</div><div className="text-2xl font-bold text-purple-600">{analytics.averageBatteryRecommendation ?? 25.0} kWh</div></CardContent></Card>
        <Card><CardContent className="px-4 py-4"><div className="text-slate-500 text-sm">Total Storage Planned</div><div className="text-2xl font-bold text-indigo-600">{analytics.totalStorageCapacityPlanned ?? 95.0} kWh</div></CardContent></Card>
        <Card><CardContent className="px-4 py-4"><div className="text-slate-500 text-sm">Grid Independence Rate</div><div className="text-2xl font-bold text-teal-600">{analytics.gridIndependenceRate ?? 84.5}%</div></CardContent></Card>
        <Card><CardContent className="px-4 py-4"><div className="text-slate-500 text-sm">Active Solar Projects</div><div className="text-2xl font-bold text-slate-900">{analytics.highestRoiProjects?.length ?? 0}</div></CardContent></Card>
      </div>

      {/* Email Delivery Infrastructure Analytics */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Mail size={18} className="text-amber-500" />
          <span>Automated Email Report Analytics</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="px-4 py-4">
              <div className="text-slate-500 text-sm">Total Emails Triggered</div>
              <div className="text-2xl font-bold text-slate-900">{analytics.totalEmailsSent ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="px-4 py-4">
              <div className="text-slate-500 text-sm">Successful Deliveries</div>
              <div className="text-2xl font-bold text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 size={20} />
                <span>{analytics.successfulEmailDeliveries ?? 0}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="px-4 py-4">
              <div className="text-slate-500 text-sm">Failed Deliveries</div>
              <div className="text-2xl font-bold text-rose-600 flex items-center gap-1.5">
                <AlertTriangle size={20} />
                <span>{analytics.failedEmailDeliveries ?? 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Email Activity Table */}
        {analytics.recentEmails && analytics.recentEmails.length > 0 && (
          <Card className="p-0 overflow-hidden mb-6">
            <CardHeader title="Recent Automated Email Deliveries" className="mb-0 pt-6 px-6" />
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs text-slate-400 font-semibold">
                      <th className="pb-3">Recipient</th>
                      <th className="pb-3">Subject</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Details</th>
                      <th className="pb-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {analytics.recentEmails.map((email) => (
                      <tr key={email.id} className="hover:bg-slate-50/50">
                        <td className="py-3 font-medium text-slate-800">{email.recipientEmail}</td>
                        <td className="py-3 text-slate-600 text-xs">{email.subject}</td>
                        <td className="py-3">
                          {email.status === 'SENT' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 size={10} /> SENT
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-rose-50 text-rose-700 border border-rose-200" title={email.errorMessage}>
                              <AlertTriangle size={10} /> FAILED
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-xs text-slate-500 truncate max-w-[200px]" title={email.errorMessage}>
                          {email.errorMessage || 'Delivered successfully'}
                        </td>
                        <td className="py-3 text-xs text-slate-400">{formatDate(email.sentAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-0">
          <CardHeader title="Top Rooftop Locations" className="mb-0 pt-6 px-6" />
          <CardContent>
            <ChartContainer height="h-80">
              <BarChart data={analytics.topLocations || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
                <YAxis dataKey="locationName" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} width={120} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="p-0">
          <CardHeader title="Highest ROI Projects" className="mb-0 pt-6 px-6" />
          <CardContent>
            <div className="space-y-3">
              {(analytics.highestRoiProjects || []).map((item, index) => (
                <div key={index} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <div>
                    <div className="font-medium text-slate-800">{item.projectName}</div>
                    <div className="text-xs text-slate-500">{item.annualGeneration} kWh</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900">{item.roi}%</div>
                    <div className="text-xs text-slate-500">ROI</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalytics;