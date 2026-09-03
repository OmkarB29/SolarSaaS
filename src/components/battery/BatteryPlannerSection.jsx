import React, { useState, useEffect, useMemo } from 'react';
import { 
  BatteryCharging, 
  BatteryMedium, 
  BatteryWarning, 
  Clock, 
  Zap, 
  TrendingDown, 
  ShieldCheck, 
  Layers,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Card } from '../ui/Card';
import { getBatteryPlan } from '../../services/batteryService';

const getStatusBadge = (status) => {
  switch (status) {
    case 'Charging':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Full / Export':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Discharging':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Empty / Import':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const BatteryPlannerSection = ({ analysis, lat = 18.5204, lon = 73.8567 }) => {
  const [selectedCapacity, setSelectedCapacity] = useState(null); // null = use recommended
  const [planData, setPlanData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('level'); // 'level' or 'surplusDeficit'

  const effectiveLat = analysis?.latitude || lat;
  const effectiveLon = analysis?.longitude || lon;
  const effectiveId = analysis?.id || null;

  useEffect(() => {
    let isMounted = true;
    const fetchPlan = async () => {
      setLoading(true);
      try {
        const data = await getBatteryPlan(effectiveLat, effectiveLon, effectiveId, selectedCapacity);
        if (isMounted) {
          setPlanData(data);
        }
      } catch (err) {
        console.error('Failed to load battery plan:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPlan();
    return () => {
      isMounted = false;
    };
  }, [effectiveLat, effectiveLon, effectiveId, selectedCapacity]);

  const simulation = planData?.dailySimulation || [];

  const chartData = useMemo(() => {
    return simulation.map((item) => {
      const parts = item.date.split('-');
      const shortDate = parts.length === 3 ? `${parts[1]}/${parts[2]}` : item.date;
      return {
        date: shortDate,
        fullDate: item.date,
        batteryLevel: item.batteryLevel,
        batterySoc: item.batterySoc,
        generation: item.generation,
        consumption: item.consumption,
        surplus: item.surplus,
        deficit: item.deficit,
        status: item.status,
      };
    });
  }, [simulation]);

  if (loading && !planData) {
    return (
      <Card className="p-8">
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Simulating Battery Storage & Deficit Dynamics...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <BatteryCharging className="text-emerald-500" size={24} />
            <h2 className="text-xl font-bold text-slate-900">Battery Storage Planner & Energy Deficit Prediction</h2>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Simulate 10-day rooftop solar storage cycles, eliminate grid deficits, and optimize battery pack sizing
          </p>
        </div>

        {/* Capacity Selector Buttons */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl shrink-0">
          <span className="text-xs font-semibold text-slate-500 px-2 hidden sm:inline">Size:</span>
          <button
            type="button"
            onClick={() => setSelectedCapacity(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedCapacity === null ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Auto Recommended
          </button>
          {[15, 30, 50].map((cap) => (
            <button
              key={cap}
              type="button"
              onClick={() => setSelectedCapacity(cap)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedCapacity === cap ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cap} kWh
            </button>
          ))}
        </div>
      </div>

      {/* 4 Storage Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Recommended Battery Size</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
              <Layers size={20} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">{planData?.recommendedCapacity || 30}</span>
            <span className="text-xs font-medium text-slate-500 ml-1.5">kWh LFP</span>
          </div>
          <p className="text-xs text-emerald-700/80 mt-1">
            Est. Cost: ₹{(planData?.estimatedCost || 450000).toLocaleString('en-IN')}
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Expected Backup Days</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
              <Clock size={20} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">{planData?.expectedBackupDays || 1.8}</span>
            <span className="text-xs font-medium text-slate-500 ml-1.5">Days of autonomy</span>
          </div>
          <p className="text-xs text-blue-700/80 mt-1">
            Under 100% zero solar grid blackout
          </p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Forecast Energy Surplus</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <ArrowUpRight size={20} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">{planData?.total10DaySurplus || 0}</span>
            <span className="text-xs font-medium text-slate-500 ml-1.5">kWh (10 days)</span>
          </div>
          <p className="text-xs text-amber-700/80 mt-1">Available for storage or export</p>
        </div>

        <div className="bg-gradient-to-br from-rose-50 to-pink-50/50 border border-rose-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Forecast Energy Deficit</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600">
              <ArrowDownRight size={20} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">{planData?.total10DayDeficit || 0}</span>
            <span className="text-xs font-medium text-slate-500 ml-1.5">kWh (10 days)</span>
          </div>
          <p className="text-xs text-rose-700/80 mt-1">Self-Sufficiency: {planData?.selfSufficiencyScore || 80}%</p>
        </div>
      </div>

      {/* Chart Card */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="font-bold text-slate-900">
              {activeTab === 'level' 
                ? 'Battery State of Charge & Energy Level Forecast (kWh)' 
                : '10-Day Energy Balance: Surplus vs Deficit (kWh)'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeTab === 'level' 
                ? 'Shows projected stored kilowatt-hours at the end of each daily solar cycle' 
                : 'Daily rooftop generation minus baseline facility consumption'}
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('level')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'level' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Battery Level (kWh)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('surplusDeficit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'surplusDeficit' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Surplus vs Deficit
            </button>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {activeTab === 'level' ? (
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="batteryGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <Tooltip 
                  formatter={(value, name) => [
                    `${value} kWh`, 
                    name === 'batteryLevel' ? 'Stored Energy' : name
                  ]} 
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                />
                <Area type="monotone" dataKey="batteryLevel" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#batteryGrad)" />
              </AreaChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <Tooltip 
                  formatter={(value, name) => [
                    `${value} kWh`, 
                    name === 'surplus' ? 'Energy Surplus' : 'Energy Deficit'
                  ]} 
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                />
                <Legend />
                <Bar dataKey="surplus" fill="#10b981" name="Surplus (+)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="deficit" fill="#f43f5e" name="Deficit (-)" radius={[6, 6, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </Card>

      {/* 10-Day Simulation Table */}
      <Card className="p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">10-Day Battery Dispatch & Deficit Schedule</h3>
          <span className="text-xs text-slate-500">Facility Base Load: {planData?.dailyConsumption || 32} kWh/day</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3 text-right">Generation</th>
                <th className="px-5 py-3 text-right">Consumption</th>
                <th className="px-5 py-3 text-right text-emerald-600 font-semibold">Surplus</th>
                <th className="px-5 py-3 text-right text-rose-600 font-semibold">Deficit</th>
                <th className="px-5 py-3 text-right font-bold text-slate-800">Stored Level</th>
                <th className="px-5 py-3 text-right">SOC %</th>
                <th className="px-5 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {simulation.map((day, idx) => (
                <tr key={day.date || idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-slate-900 whitespace-nowrap">
                    {day.date}
                  </td>
                  <td className="px-5 py-3.5 text-right font-medium text-amber-600">
                    {day.generation != null ? `${day.generation} kWh` : '--'}
                  </td>
                  <td className="px-5 py-3.5 text-right text-slate-600">
                    {day.consumption != null ? `${day.consumption} kWh` : '--'}
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold text-emerald-600">
                    {day.surplus > 0 ? `+${day.surplus} kWh` : '0'}
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold text-rose-600">
                    {day.deficit > 0 ? `-${day.deficit} kWh` : '0'}
                  </td>
                  <td className="px-5 py-3.5 text-right font-bold text-slate-900">
                    {day.batteryLevel != null ? `${day.batteryLevel} kWh` : '--'}
                  </td>
                  <td className="px-5 py-3.5 text-right font-medium">
                    {day.batterySoc != null ? `${day.batterySoc}%` : '--'}
                  </td>
                  <td className="px-5 py-3.5 text-center whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(day.status)}`}>
                      {day.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default BatteryPlannerSection;