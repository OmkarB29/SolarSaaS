import React from 'react';
import { AlertCircle, Banknote, CloudSun, Leaf, PanelsTopLeft, TrendingUp, Zap } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const formatNumber = (value, digits = 0) =>
  value === null || value === undefined
    ? '-'
    : new Intl.NumberFormat('en-IN', { maximumFractionDigits: digits }).format(value);
const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);

const metricCards = [
  { key: 'monthlyGeneration', label: 'Monthly Generation', unit: 'kWh', icon: Zap, tone: 'bg-yellow-100 text-yellow-600' },
  { key: 'installationCost', label: 'Installation Cost', unit: '', icon: Banknote, tone: 'bg-blue-100 text-blue-600' },
  { key: 'roi', label: 'Projected ROI', unit: '%', icon: TrendingUp, tone: 'bg-green-100 text-green-600' },
  { key: 'co2Reduction', label: 'CO2 Reduction', unit: 'kg/yr', icon: Leaf, tone: 'bg-emerald-100 text-emerald-600' },
];

const AnalysisResults = ({ results }) => {
  if (!results) return null;

  const formatValue = (key, value) => {
    if (key === 'installationCost') return formatCurrency(value);
    return formatNumber(value);
  };

  const weather = results.weather;

  return (
    <div className="space-y-6">
      {results.weatherWarning && (
        <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{results.weatherWarning}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.key} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-5 flex items-center justify-between">
                <div className={`rounded-xl p-3 ${item.tone}`}>
                  <Icon size={22} />
                </div>
                <span className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-500">
                  Live estimate
                </span>
              </div>
              <p className="text-sm font-medium text-slate-500">{item.label}</p>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-900">{formatValue(item.key, results[item.key])}</span>
                {item.unit && <span className="text-sm font-semibold text-slate-500">{item.unit}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {weather && (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-sky-50 p-3 text-sky-600">
              <CloudSun size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Weather Adjustment</h3>
              <p className="text-sm text-slate-500">Open-Meteo conditions applied without changing the base estimate.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-5">
            <div>
              <p className="text-sm text-slate-500">Temperature</p>
              <p className="text-xl font-bold text-slate-900">
                {formatNumber(weather.temperature, 1)} <span className="text-sm font-semibold text-slate-500">C</span>
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Cloud Cover</p>
              <p className="text-xl font-bold text-slate-900">
                {formatNumber(weather.cloudCover)} <span className="text-sm font-semibold text-slate-500">%</span>
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Sunshine Hours</p>
              <p className="text-xl font-bold text-slate-900">{formatNumber(weather.sunshineHours, 1)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Summary</p>
              <p className="text-base font-bold text-slate-900">{weather.weatherSummary}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Adjusted Generation</p>
              <p className="text-xl font-bold text-slate-900">
                {formatNumber(results.weatherAdjustedMonthlyGeneration)} <span className="text-sm font-semibold text-slate-500">kWh/mo</span>
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500">
                {results.weatherAdjustmentPercent > 0 ? '+' : ''}{results.weatherAdjustmentPercent}% vs base
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_0.8fr]">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h3 className="text-lg font-bold text-slate-900">Generation and Savings Forecast</h3>
            <p className="text-sm text-slate-500">Six-month projection from selected rooftop geometry.</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={results.monthlySeries}>
                <defs>
                  <linearGradient id="generationGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 16px 30px rgb(15 23 42 / 0.12)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="generation"
                  name="Generation kWh"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  fill="url(#generationGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-900 p-6 text-white shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-primary-500/15 p-3 text-primary-300">
              <PanelsTopLeft size={22} />
            </div>
            <div>
              <h3 className="font-bold">System Snapshot</h3>
              <p className="text-sm text-slate-400">Based on selected polygon area</p>
            </div>
          </div>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between border-b border-white/10 pb-3">
              <span className="text-slate-400">Estimated panels</span>
              <span className="font-semibold">{formatNumber(results.panels)}</span>
            </div>
            <div className="flex justify-between border-b border-white/10 pb-3">
              <span className="text-slate-400">Base yearly generation</span>
              <span className="font-semibold">{formatNumber(results.yearlyGeneration)} kWh</span>
            </div>
            {'weatherAdjustedYearlyGeneration' in results && (
              <div className="flex justify-between border-b border-white/10 pb-3">
                <span className="text-slate-400">Weather adjusted</span>
                <span className="font-semibold">{formatNumber(results.weatherAdjustedYearlyGeneration)} kWh</span>
              </div>
            )}
            <div className="flex justify-between border-b border-white/10 pb-3">
              <span className="text-slate-400">Yearly savings</span>
              <span className="font-semibold">{formatCurrency(results.yearlySavings)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Payback period</span>
              <span className="font-semibold">{results.paybackPeriod} years</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResults;
