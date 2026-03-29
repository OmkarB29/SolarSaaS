import React from 'react';
import { 
  Zap, 
  Banknote, 
  TrendingUp, 
  Clock, 
  TreePine,
  ArrowUpRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

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

const StatCard = ({ title, value, unit, icon: Icon, trend, colorClass }) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${colorClass}`}>
        <Icon size={24} />
      </div>
      <div className="flex items-center space-x-1 text-green-500 text-sm font-medium bg-green-50 px-2 py-1 rounded-full">
        <ArrowUpRight size={16} />
        <span>{trend}</span>
      </div>
    </div>
    <div className="space-y-1">
      <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
      <div className="flex items-baseline space-x-1">
        <span className="text-2xl font-bold text-slate-800">{value}</span>
        <span className="text-slate-500 font-medium">{unit}</span>
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Project Overview</h1>
          <p className="text-slate-500 mt-1">Acme Corp Logistics Hub • Austin, TX</p>
        </div>
        <button className="bg-primary-500 hover:bg-primary-600 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm shadow-primary-500/30">
          Generate Report
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard 
          title="Est. Monthly Energy" 
          value="850" 
          unit="kWh" 
          icon={Zap} 
          trend="+5%" 
          colorClass="bg-yellow-100 text-yellow-600" 
        />
        <StatCard 
          title="Installation Cost" 
          value="450k" 
          unit="₹" 
          icon={Banknote} 
          trend="-2%" 
          colorClass="bg-blue-100 text-blue-600" 
        />
        <StatCard 
          title="Projected ROI" 
          value="24.5" 
          unit="%" 
          icon={TrendingUp} 
          trend="+1.2%" 
          colorClass="bg-green-100 text-green-600" 
        />
        <StatCard 
          title="Payback Period" 
          value="4.2" 
          unit="Yrs" 
          icon={Clock} 
          trend="Fast" 
          colorClass="bg-purple-100 text-purple-600" 
        />
        <StatCard 
          title="CO₂ Reduction" 
          value="1,240" 
          unit="kg/yr" 
          icon={TreePine} 
          trend="+12%" 
          colorClass="bg-emerald-100 text-emerald-600" 
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="col-span-1 lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Monthly Energy Generation</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyEnergyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
                <Tooltip cursor={{fill: '#F1F5F9'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Secondary Chart 1 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Savings Over Time</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={savingsData}>
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
            </ResponsiveContainer>
          </div>
        </div>

        {/* Secondary Chart 2 */}
        <div className="col-span-1 lg:col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">ROI Growth Trajectory</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={roiGrowthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Line type="monotone" dataKey="return" stroke="#f59e0b" strokeWidth={3} dot={{ strokeWidth: 2, r: 4 }} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="target" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
