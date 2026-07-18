import React, { useMemo, useState } from 'react';
import { 
  Zap, 
  Banknote, 
  TrendingUp, 
  Clock, 
  TreePine
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
  AreaChart,
  Area
} from 'recharts';
import StatCard from '../components/ui/StatCard';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { ChartContainer } from '../components/ui/Chart';
import { downloadAnalysisReport, getLatestAnalysis } from '../services/reportService';

const monthlyEnergyData = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 300 },
  { name: 'Mar', value: 550 },
  { name: 'Apr', value: 700 },
  { name: 'May', value: 850 },
  { name: 'Jun', value: 900 },
  { name: 'Jul', value: 950 },
  { name: 'Aug', value: 920 },
  { name: 'Sep', value: 800 },
  { name: 'Oct', value: 650 },
  { name: 'Nov', value: 450 },
  { name: 'Dec', value: 350 },
];

const roiGrowthData = [
  { year: 'Y1', return: 5, target: 8 },
  { year: 'Y2', return: 12, target: 15 },
  { year: 'Y3', return: 22, target: 24 },
  { year: 'Y4', return: 35, target: 36 },
  { year: 'Y5', return: 48, target: 50 },
  { year: 'Y6', return: 65, target: 65 },
];

const savingsData = [
  { month: 'Jan', savings: 1200 },
  { month: 'Feb', savings: 1350 },
  { month: 'Mar', savings: 1600 },
  { month: 'Apr', savings: 2100 },
  { month: 'May', savings: 2800 },
  { month: 'Jun', savings: 3200 },
];

const formatNumber = (value, maximumFractionDigits = 0) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits }).format(value);

const Dashboard = () => {
  const [latestAnalysis] = useState(() => getLatestAnalysis());

  const dashboardMonthlyEnergyData = useMemo(
    () =>
      latestAnalysis?.monthlySeries?.length
        ? latestAnalysis.monthlySeries.map(({ month, generation }) => ({
            name: month,
            value: generation,
          }))
        : monthlyEnergyData,
    [latestAnalysis]
  );

  const dashboardSavingsData = useMemo(
    () => latestAnalysis?.monthlySeries?.length ? latestAnalysis.monthlySeries : savingsData,
    [latestAnalysis]
  );

  const handleGenerateReport = () => {
    const latestAnalysis = getLatestAnalysis();

    if (!latestAnalysis) {
      window.alert('Please run an analysis first.');
      return;
    }

    downloadAnalysisReport(latestAnalysis);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Project Overview</h1>
          <p className="text-slate-500 mt-1">Acme Corp Logistics Hub • Austin, TX</p>
        </div>
        <button onClick={handleGenerateReport} className="bg-primary-500 hover:bg-primary-600 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm shadow-primary-500/30">
          Generate Report
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard 
          title="Est. Monthly Energy" 
          value={latestAnalysis ? formatNumber(latestAnalysis.monthlyGeneration) : '850'}
          unit="kWh" 
          icon={Zap} 
          trend="+5%" 
          trendUp={true}
          colorClass="bg-yellow-100 text-yellow-600" 
        />
        <StatCard 
          title="Installation Cost" 
          value={latestAnalysis ? formatNumber(latestAnalysis.installationCost) : '450k'}
          unit="₹" 
          icon={Banknote} 
          trend="-2%" 
          trendUp={false}
          colorClass="bg-blue-100 text-blue-600" 
        />
        <StatCard 
          title="Projected ROI" 
          value={latestAnalysis ? formatNumber(latestAnalysis.roi, 1) : '24.5'}
          unit="%" 
          icon={TrendingUp} 
          trend="+1.2%" 
          trendUp={true}
          colorClass="bg-green-100 text-green-600" 
        />
        <StatCard 
          title="Payback Period" 
          value={latestAnalysis ? formatNumber(latestAnalysis.paybackPeriod, 1) : '4.2'}
          unit="Yrs" 
          icon={Clock} 
          trend="Fast" 
          trendUp={true}
          colorClass="bg-purple-100 text-purple-600" 
        />
        <StatCard 
          title="CO₂ Reduction" 
          value={latestAnalysis ? formatNumber(latestAnalysis.co2Reduction) : '1,240'}
          unit="kg/yr" 
          icon={TreePine} 
          trend="+12%" 
          trendUp={true}
          colorClass="bg-emerald-100 text-emerald-600" 
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <Card className="col-span-1 lg:col-span-2 p-0">
          <CardHeader title="Monthly Energy Generation" className="mb-0 pt-6 px-6" />
          <CardContent>
            <ChartContainer height="h-72">
              <BarChart data={dashboardMonthlyEnergyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
                <Tooltip cursor={{fill: '#F1F5F9'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Secondary Chart 1 */}
        <Card className="p-0">
          <CardHeader title="Savings Over Time" className="mb-0 pt-6 px-6" />
          <CardContent>
            <ChartContainer height="h-72">
              <AreaChart data={dashboardSavingsData}>
                <defs>
                  <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
                <YAxis hide />
                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Area type="monotone" dataKey="savings" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSavings)" />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Secondary Chart 2 */}
        <Card className="col-span-1 lg:col-span-3 p-0">
          <CardHeader title="ROI Growth Trajectory" className="mb-0 pt-6 px-6" />
          <CardContent>
            <ChartContainer height="h-80">
              <LineChart data={roiGrowthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Line type="monotone" dataKey="return" stroke="#f59e0b" strokeWidth={3} dot={{ strokeWidth: 2, r: 4 }} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="target" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
