import React, { useEffect, useState } from 'react';
import {
  Users,
  BarChart3,
  FileText,
  TrendingUp,
  Zap,
  TreePine,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import StatCard from '../components/ui/StatCard';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { ChartContainer } from '../components/ui/Chart';
import { getAdminDashboard, getAdminUsers, getAdminAnalytics } from '../services/adminService';

const AdminDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        const [dashboardData, usersData, analyticsData] = await Promise.all([
          getAdminDashboard(),
          getAdminUsers(),
          getAdminAnalytics(),
        ]);
        setDashboard(dashboardData);
        setUsers(usersData);
        setAnalytics(analyticsData);
      } catch (err) {
        setError(err.message || 'Failed to load admin data');
        console.error('Error fetching admin data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-500">Loading admin dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  const formatNumber = (value, maximumFractionDigits = 0) =>
    new Intl.NumberFormat('en-IN', { maximumFractionDigits }).format(value);

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500 mt-1">Platform-wide monitoring and analytics</p>
      </div>

      {/* KPI Cards */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          <StatCard
            title="Total Users"
            value={formatNumber(dashboard.totalUsers)}
            icon={Users}
            trend="+2.5%"
            trendUp={true}
            colorClass="bg-blue-100 text-blue-600"
          />
          <StatCard
            title="Total Analyses"
            value={formatNumber(dashboard.totalAnalyses)}
            icon={BarChart3}
            trend="+8.2%"
            trendUp={true}
            colorClass="bg-purple-100 text-purple-600"
          />
          <StatCard
            title="Total Reports"
            value={formatNumber(dashboard.totalReports)}
            icon={FileText}
            trend="+5.1%"
            trendUp={true}
            colorClass="bg-indigo-100 text-indigo-600"
          />
          <StatCard
            title="Avg ROI"
            value={formatNumber(dashboard.averageROI, 1)}
            unit="%"
            icon={TrendingUp}
            trend="+1.2%"
            trendUp={true}
            colorClass="bg-green-100 text-green-600"
          />
          <StatCard
            title="Energy Generated"
            value={formatNumber(dashboard.totalAnnualGeneration / 1000, 1)}
            unit="k kWh"
            icon={Zap}
            trend="+15%"
            trendUp={true}
            colorClass="bg-yellow-100 text-yellow-600"
          />
          <StatCard
            title="CO₂ Saved"
            value={formatNumber(dashboard.totalCo2Reduction / 1000, 1)}
            unit="k kg"
            icon={TreePine}
            trend="+18%"
            trendUp={true}
            colorClass="bg-emerald-100 text-emerald-600"
          />
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trends */}
        {analytics && (
          <Card className="col-span-1 lg:col-span-2 p-0">
            <CardHeader title="Monthly Analysis Trends" className="mb-0 pt-6 px-6" />
            <CardContent>
              <ChartContainer height="h-80">
                <LineChart data={analytics.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
                  <Tooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Line type="monotone" dataKey="newAnalyses" stroke="#6366f1" strokeWidth={3} dot={false} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* ROI Distribution */}
        {analytics && (
          <Card className="p-0">
            <CardHeader title="ROI Distribution" className="mb-0 pt-6 px-6" />
            <CardContent>
              <ChartContainer height="h-80">
                <PieChart>
                  <Pie
                    data={analytics.roiDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ range, value }) => `${range}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {analytics.roiDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Top Locations */}
      {analytics && (
        <Card className="p-0">
          <CardHeader title="Top Locations by Analysis Count" className="mb-0 pt-6 px-6" />
          <CardContent>
            <ChartContainer height="h-80">
              <BarChart data={analytics.topLocations} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
                <YAxis dataKey="locationName" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} width={120} />
                <Tooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
      {users.length > 0 && (
        <Card className="p-0">
          <CardHeader title={`Users (${users.length})`} className="mb-0 pt-6 px-6" />
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-600">Username</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-600">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-600">Role</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-600">Analyses</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-600">Reports</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-600">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                      <td className="py-3 px-4 text-slate-900">{user.username}</td>
                      <td className="py-3 px-4 text-slate-600">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'ROLE_ADMIN' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {user.role === 'ROLE_ADMIN' ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-600">{user.analysisCount}</td>
                      <td className="py-3 px-4 text-center text-slate-600">{user.reportCount}</td>
                      <td className="py-3 px-4 text-slate-600 text-xs">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminDashboard;
