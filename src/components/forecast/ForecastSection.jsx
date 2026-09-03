import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sun, 
  CloudSun, 
  Cloud, 
  CloudRain, 
  CloudLightning, 
  Zap, 
  Banknote, 
  TrendingUp, 
  Gauge, 
  CalendarDays,
  Sparkles
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { getForecast } from '../../services/forecastService';

const getWeatherIcon = (type) => {
  switch (type?.toLowerCase()) {
    case 'sunny':
      return <Sun size={18} className="text-amber-500" />;
    case 'partly cloudy':
      return <CloudSun size={18} className="text-amber-400" />;
    case 'cloudy':
      return <Cloud size={18} className="text-slate-400" />;
    case 'rain':
      return <CloudRain size={18} className="text-blue-500" />;
    case 'heavy rain':
      return <CloudLightning size={18} className="text-purple-500" />;
    default:
      return <Sun size={18} className="text-amber-500" />;
  }
};

const getWeatherBadgeClass = (type) => {
  switch (type?.toLowerCase()) {
    case 'sunny':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'partly cloudy':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'cloudy':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'rain':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'heavy rain':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    default:
      return 'bg-amber-50 text-amber-700 border-amber-200';
  }
};

const ForecastSection = ({ analysis, lat = 18.5204, lon = 73.8567 }) => {
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = useState('energy'); // 'energy', 'impact', 'savings'

  const effectiveLat = analysis?.latitude || lat;
  const effectiveLon = analysis?.longitude || lon;
  const effectiveId = analysis?.id || null;

  useEffect(() => {
    let isMounted = true;
    const loadForecast = async () => {
      setLoading(true);
      try {
        const data = await getForecast(effectiveLat, effectiveLon, effectiveId);
        if (isMounted) {
          setForecastData(data);
        }
      } catch (err) {
        console.error('Failed to load 10-day forecast:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadForecast();
    return () => {
      isMounted = false;
    };
  }, [effectiveLat, effectiveLon, effectiveId]);

  const items = forecastData?.forecast || [];

  // Summary Metrics
  const summary = useMemo(() => {
    if (!items.length) {
      return { totalEnergy: 0, avgDaily: 0, totalSavings: 0, avgImpact: 100 };
    }
    const totalGen = items.reduce((sum, d) => sum + (d.predictedGeneration || 0), 0);
    const totalSav = items.reduce((sum, d) => sum + (d.predictedSavings || 0), 0);
    const avgGen = totalGen / items.length;
    
    // Theoretical max if 100% sunny
    const baseDailyGen = (forecastData?.baseGeneration || totalGen * 36.5) / 365.0;
    const impact = baseDailyGen > 0 ? (avgGen / baseDailyGen) * 100 : 92.5;

    return {
      totalEnergy: Math.round(totalGen * 10) / 10,
      avgDaily: Math.round(avgGen * 10) / 10,
      totalSavings: Math.round(totalSav),
      avgImpact: Math.min(100, Math.round(impact * 10) / 10),
    };
  }, [items, forecastData]);

  // Chart preparation
  const chartData = useMemo(() => {
    const baseDailyGen = (forecastData?.baseGeneration || 1000) / 365.0;
    return items.map((item) => {
      const parts = item.date.split('-');
      const shortDate = parts.length === 3 ? `${parts[1]}/${parts[2]}` : item.date;
      const efficiency = baseDailyGen > 0 
        ? Math.min(100, Math.round((item.predictedGeneration / baseDailyGen) * 100))
        : Math.round(100 - (item.cloudCover || 0) * 0.4);

      return {
        date: shortDate,
        fullDate: item.date,
        energy: item.predictedGeneration,
        savings: item.predictedSavings,
        weather: item.weather,
        impact: efficiency,
        temperature: item.temperature,
      };
    });
  }, [items, forecastData]);

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Querying NASA POWER & Open-Meteo 10-Day Solar Forecast...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="text-amber-500" size={22} />
            <h2 className="text-xl font-bold text-slate-900">10-Day Solar Energy & Weather Forecast</h2>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Dynamic solar yield projection based on live satellite weather forecasts & rooftop solar specs
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveChart('energy')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeChart === 'energy' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Energy Output
          </button>
          <button
            type="button"
            onClick={() => setActiveChart('impact')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeChart === 'impact' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Weather Impact %
          </button>
          <button
            type="button"
            onClick={() => setActiveChart('savings')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeChart === 'savings' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Projected Savings
          </button>
        </div>
      </div>

      {/* 4 Forecast Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Total Forecast Energy</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <Zap size={20} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">{summary.totalEnergy.toLocaleString('en-IN')}</span>
            <span className="text-xs font-medium text-slate-500 ml-1.5">kWh (10 days)</span>
          </div>
          <p className="text-xs text-amber-700/80 mt-1">Sum of projected generation</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Average Daily Energy</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">{summary.avgDaily.toLocaleString('en-IN')}</span>
            <span className="text-xs font-medium text-slate-500 ml-1.5">kWh / day</span>
          </div>
          <p className="text-xs text-blue-700/80 mt-1">Average daily rooftop yield</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Expected Savings</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
              <Banknote size={20} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">₹{summary.totalSavings.toLocaleString('en-IN')}</span>
            <span className="text-xs font-medium text-slate-500 ml-1.5">estimated</span>
          </div>
          <p className="text-xs text-emerald-700/80 mt-1">Based on benchmark ₹8.5/kWh</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50/50 border border-purple-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700">Weather Efficiency</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600">
              <Gauge size={20} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">{summary.avgImpact}%</span>
            <span className="text-xs font-medium text-slate-500 ml-1.5">of peak potential</span>
          </div>
          <p className="text-xs text-purple-700/80 mt-1">Adjusted for cloud & precipitation</p>
        </div>
      </div>

      {/* Forecast Chart Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-800">
              {activeChart === 'energy' && '10-Day Solar Energy Yield Trend (kWh)'}
              {activeChart === 'impact' && 'Weather Efficiency & Cloud Impact Factor (%)'}
              {activeChart === 'savings' && 'Projected Daily Monetary Savings (₹)'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Daily breakdown across the 10-day forecast window</p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {activeChart === 'energy' ? (
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <Tooltip 
                  formatter={(value) => [`${value} kWh`, 'Predicted Energy']} 
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                />
                <Area type="monotone" dataKey="energy" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#energyGrad)" />
              </AreaChart>
            ) : activeChart === 'impact' ? (
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <Tooltip 
                  formatter={(value) => [`${value}%`, 'Solar Efficiency']} 
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                />
                <Bar dataKey="impact" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <Tooltip 
                  formatter={(value) => [`₹${value}`, 'Projected Savings']} 
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                />
                <Bar dataKey="savings" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Forecast Data Table */}
      <Card className="p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Detailed 10-Day Solar Projection Table</h3>
          <span className="text-xs text-slate-500">Source: Open-Meteo & NASA POWER</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Weather</th>
                <th className="px-5 py-3 text-right">Temp (°C)</th>
                <th className="px-5 py-3 text-right">Cloud Cover</th>
                <th className="px-5 py-3 text-right">Sunshine Hours</th>
                <th className="px-5 py-3 text-right font-bold text-amber-600">Predicted Energy</th>
                <th className="px-5 py-3 text-right font-bold text-emerald-600">Predicted Savings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {items.map((day, idx) => (
                <tr key={day.date || idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-slate-900 whitespace-nowrap">
                    {day.date}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getWeatherBadgeClass(day.weather)}`}>
                      {getWeatherIcon(day.weather)}
                      <span>{day.weather}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-medium">
                    {day.temperature != null ? `${day.temperature}°` : '--'}
                  </td>
                  <td className="px-5 py-3.5 text-right text-slate-600">
                    {day.cloudCover != null ? `${Math.round(day.cloudCover)}%` : '--'}
                  </td>
                  <td className="px-5 py-3.5 text-right font-medium text-slate-800">
                    {day.sunshineHours != null ? `${day.sunshineHours} hrs` : '--'}
                  </td>
                  <td className="px-5 py-3.5 text-right font-bold text-amber-600">
                    {day.predictedGeneration != null ? `${day.predictedGeneration.toFixed(1)} kWh` : '--'}
                  </td>
                  <td className="px-5 py-3.5 text-right font-bold text-emerald-600">
                    {day.predictedSavings != null ? `₹${day.predictedSavings.toFixed(1)}` : '--'}
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

export default ForecastSection;