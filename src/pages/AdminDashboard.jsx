import React, { useEffect, useState } from 'react';
import {
  Users,
  BarChart3,
  FileText,
  TrendingUp,
  Zap,
  TreePine,
  Sun,
  Award,
  Banknote,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Bot,
  Cpu,
  Layers,
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
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Analyses"
              value={formatNumber(dashboard.totalAnalyses)}
              icon={BarChart3}
              trend="+8.2%"
              trendUp={true}
              colorClass="bg-purple-100 text-purple-600"
            />
            <StatCard
              title="Total Proposals"
              value={formatNumber(dashboard.totalProposals || 0)}
              icon={FileText}
              trend="Workspace proposals"
              trendUp={true}
              colorClass="bg-blue-100 text-blue-600"
            />
            <StatCard
              title="Approval Statistics"
              value={`${formatNumber(dashboard.proposalsApproved || 0)} (${dashboard.approvalRate || 0}%)`}
              icon={TrendingUp}
              trend="Approved proposals"
              trendUp={true}
              colorClass="bg-emerald-100 text-emerald-600"
            />
            <StatCard
              title="Installation Statistics"
              value={`${formatNumber(dashboard.proposalsInstalled || 0)} (${dashboard.installationRate || 0}%)`}
              icon={Zap}
              trend="Commissioned installs"
              trendUp={true}
              colorClass="bg-amber-100 text-amber-600"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <StatCard
              title="Total Users"
              value={formatNumber(dashboard.totalUsers)}
              icon={Users}
              trend="+2.5%"
              trendUp={true}
              colorClass="bg-slate-100 text-slate-700"
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

          {/* Solar Potential Module Platform KPIs */}
          <div className="pt-2">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Solar Potential Platform Analytics (PVGIS & Weather Integration)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
              <StatCard
                title="Solar Analyses"
                value={formatNumber(dashboard.totalSolarAnalyses || 0)}
                icon={Sun}
                trend="Rooftop scans"
                trendUp={true}
                colorClass="bg-amber-100 text-amber-600"
              />
              <StatCard
                title="Avg Solar Score"
                value={formatNumber(dashboard.averageSolarScore || 0, 1)}
                unit="/ 100"
                icon={Award}
                trend="Quality index"
                trendUp={true}
                colorClass="bg-emerald-100 text-emerald-600"
              />
              <StatCard
                title="Annual Generation"
                value={formatNumber((dashboard.totalSolarAnnualEnergy || 0) / 1000, 1)}
                unit="k kWh"
                icon={Zap}
                trend="PVGIS output"
                trendUp={true}
                colorClass="bg-blue-100 text-blue-600"
              />
              <StatCard
                title="Carbon Offset"
                value={formatNumber((dashboard.totalSolarCarbonOffset || 0) / 1000, 1)}
                unit="k kg"
                icon={TreePine}
                trend="CO₂ avoided"
                trendUp={true}
                colorClass="bg-teal-100 text-teal-600"
              />
              <StatCard
                title="Savings Potential"
                value={`₹${formatNumber((dashboard.totalSavingsPotential || 0) / 1000, 1)}k`}
                icon={Banknote}
                trend="Estimated yield"
                trendUp={true}
                colorClass="bg-green-100 text-green-600"
              />
              <StatCard
                title="Highest Rooftop"
                value={formatNumber(dashboard.highestRatedRooftop || 0, 0)}
                unit="/ 100"
                icon={Award}
                trend="Top rated score"
                trendUp={true}
                colorClass="bg-orange-100 text-orange-600"
              />
            </div>
          </div>

          {/* AI Solar Advisor Platform Analytics */}
          <div className="pt-2">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Bot size={16} className="text-indigo-600" />
              <span>AI Solar Advisor Platform Analytics (OpenAI GPT & Engineering Heuristics)</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
              <StatCard
                title="AI Recommendations"
                value={formatNumber(dashboard.totalAIRecommendations || 0)}
                icon={Sparkles}
                trend="Advisor reports"
                trendUp={true}
                colorClass="bg-indigo-100 text-indigo-600"
              />
              <StatCard
                title="Avg AI Solar Score"
                value={formatNumber(dashboard.averageAISolarScore || 0, 1)}
                unit="/ 100"
                icon={Award}
                trend="Quality benchmark"
                trendUp={true}
                colorClass="bg-purple-100 text-purple-600"
              />
              <StatCard
                title="Low Risk Projects"
                value={formatNumber(dashboard.lowRiskProjectsCount ?? dashboard.aiLowRiskCount ?? 0)}
                icon={ShieldCheck}
                trend="Viable installations"
                trendUp={true}
                colorClass="bg-emerald-100 text-emerald-600"
              />
              <StatCard
                title="Med Risk Projects"
                value={formatNumber(dashboard.mediumRiskProjectsCount ?? dashboard.aiMediumRiskCount ?? 0)}
                icon={ShieldAlert}
                trend="Further review"
                trendUp={false}
                colorClass="bg-amber-100 text-amber-600"
              />
              <StatCard
                title="High Risk Projects"
                value={formatNumber(dashboard.highRiskProjectsCount ?? dashboard.aiHighRiskCount ?? 0)}
                icon={ShieldAlert}
                trend="Requires mitigation"
                trendUp={false}
                colorClass="bg-rose-100 text-rose-600"
              />
              <StatCard
                title="Top Recommendation"
                value={dashboard.mostCommonRecommendation || 'Grid-Tied Monocrystalline'}
                icon={Bot}
                trend="Most advised"
                trendUp={true}
                colorClass="bg-sky-100 text-sky-600"
              />
            </div>
          </div>

          {/* AI Panel Placement Optimization Platform Analytics */}
          <div className="pt-2">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Cpu size={16} className="text-emerald-600" />
              <span>AI Panel Placement Platform Analytics (Phase 3 Vector Geometry Engine)</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <StatCard
                title="Optimized Layouts"
                value={formatNumber(dashboard.totalOptimizedLayouts || 0)}
                icon={Layers}
                trend="Generated layouts"
                trendUp={true}
                colorClass="bg-emerald-100 text-emerald-600"
              />
              <StatCard
                title="Avg Optimization Score"
                value={formatNumber(dashboard.averageOptimizationScore || 0, 1)}
                unit="/ 100"
                icon={Award}
                trend="Placement quality"
                trendUp={true}
                colorClass="bg-amber-100 text-amber-600"
              />
              <StatCard
                title="Avg Roof Utilization"
                value={formatNumber(dashboard.averageRoofUtilization || 0, 1)}
                unit="%"
                icon={TrendingUp}
                trend="Packing factor"
                trendUp={true}
                colorClass="bg-blue-100 text-blue-600"
              />
              <StatCard
                title="Total Capacity Planned"
                value={formatNumber(dashboard.totalCapacityPlanned || 0, 1)}
                unit="kWp"
                icon={Zap}
                trend="Array potential"
                trendUp={true}
                colorClass="bg-indigo-100 text-indigo-600"
              />
              <StatCard
                title="Most Selected Mode"
                value={dashboard.mostSelectedLayoutMode ? dashboard.mostSelectedLayoutMode.replace('_', ' ') : 'BALANCED'}
                icon={Cpu}
                trend="Top user preference"
                trendUp={true}
                colorClass="bg-purple-100 text-purple-600"
              />
            </div>
          </div>
        </>
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

      {/* Recent Solar Potential Assessments Table */}
      {dashboard?.recentSolarAnalyses && dashboard.recentSolarAnalyses.length > 0 && (
        <Card className="p-0">
          <CardHeader 
            title={`Recent Rooftop Solar Assessments (${dashboard.recentSolarAnalyses.length})`} 
            className="mb-0 pt-6 px-6" 
          />
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-600">Location / Address</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-600">Solar Score</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-600">Quality</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-600">Max Panels</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-600">Roof Area</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-600">Annual Energy</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-600">Carbon Offset</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-600">Assessed At</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.recentSolarAnalyses.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                      <td className="py-3 px-4 text-slate-900 max-w-xs truncate">
                        <div className="font-medium text-slate-900 truncate" title={item.address || item.formattedAddress || `${item.latitude}, ${item.longitude}`}>
                          {item.address || item.formattedAddress || 'Rooftop Location'}
                        </div>
                        <div className="font-mono text-2xs text-slate-400">
                          {Number(item.latitude).toFixed(4)}, {Number(item.longitude).toFixed(4)}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-slate-800">{Math.round(item.solarScore || 0)}</span>
                        <span className="text-2xs text-slate-400">/100</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-2xs font-semibold ${
                          (item.solarQualityBadge === 'EXCELLENT' || item.solarQuality === 'EXCELLENT') ? 'bg-emerald-100 text-emerald-800' :
                          (item.solarQualityBadge === 'GOOD' || item.solarQuality === 'GOOD') ? 'bg-blue-100 text-blue-800' :
                          (item.solarQualityBadge === 'MODERATE' || item.solarQuality === 'MODERATE') ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {item.solarQualityBadge || item.solarQuality || 'GOOD'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-700">
                        {formatNumber(item.estimatedPanelCount || item.maxArrayPanels || item.maxArrayPanelsCount || 0)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600">
                        {formatNumber(item.roofAreaM2 || item.maxArrayArea || item.maxArrayAreaMeters2 || 0, 1)} m²
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-amber-600">
                        {formatNumber(item.annualGenerationKwh || item.annualEnergyKwh || item.yearlyEnergyDcKwh || 0)} kWh
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-teal-600">
                        {item.carbonOffsetKg ? `${formatNumber(item.carbonOffsetKg)} kg` : (item.carbonOffsetTons ? `${formatNumber(item.carbonOffsetTons, 1)} t` : '-')}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Panel Placement Optimizations Table */}
      {dashboard?.recentOptimizations && dashboard.recentOptimizations.length > 0 && (
        <Card className="p-0">
          <CardHeader 
            title={`Recent Panel Placement Optimizations (${dashboard.recentOptimizations.length})`} 
            className="mb-0 pt-6 px-6" 
          />
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-600">Layout ID / Ref</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-600">Mode</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-600">Modules</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-600">Capacity</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-600">Roof Area</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-600">Utilization</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-600">Score</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-600">Annual Gen</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-600">Optimized At</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.recentOptimizations.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-medium text-slate-900">
                        Layout #{item.id}
                        {item.analysisId && (
                          <span className="text-xs text-slate-400 block font-normal">Analysis #{item.analysisId}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-2xs font-bold ${
                          item.layoutMode === 'MAXIMUM_CAPACITY' ? 'bg-amber-100 text-amber-800' :
                          item.layoutMode === 'HIGH_EFFICIENCY' ? 'bg-indigo-100 text-indigo-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {item.layoutMode?.replace('_', ' ') || 'BALANCED'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-700">
                        {formatNumber(item.panelCount || 0)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-indigo-600">
                        {(item.systemCapacityKw || 0).toFixed(2)} kWp
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600">
                        {formatNumber(item.roofArea || 0, 1)} m²
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-blue-600">
                        {(item.roofUtilizationPercent || 0).toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-slate-800">{Math.round(item.optimizationScore || 0)}</span>
                        <span className="text-2xs text-slate-400">/100</span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-amber-600">
                        {formatNumber(item.annualGenerationKwh || 0)} kWh
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}
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
