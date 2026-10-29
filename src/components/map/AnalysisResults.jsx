import React from 'react';
import { AlertCircle, Banknote, CloudSun, Leaf, PanelsTopLeft, TrendingUp, Zap } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useLanguage } from '../../context/LanguageContext';

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

const AnalysisResults = ({ results }) => {
  const { t } = useLanguage();

  if (!results) return null;

  const metricCards = [
    { key: 'monthlyGeneration', label: t('monthlyGeneration'), unit: 'kWh', icon: Zap, tone: 'bg-yellow-100 text-yellow-600' },
    { key: 'installationCost', label: t('installationCost'), unit: '', icon: Banknote, tone: 'bg-blue-100 text-blue-600' },
    { key: 'roi', label: t('projectedRoi'), unit: '%', icon: TrendingUp, tone: 'bg-green-100 text-green-600' },
    { key: 'co2Reduction', label: t('co2Reduction'), unit: 'kg/yr', icon: Leaf, tone: 'bg-emerald-100 text-emerald-600' },
  ];

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
                  {t('liveEstimate')}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-500">{item.label}</p>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-900">{formatValue(item.key, results[item.key])}</span>
                {item.unit && <span className="text-sm font-semibold text-slate-500">{item.unit}</span>}
              </div>

              {item.key === 'installationCost' && (
                <p className="mt-1.5 text-[11px] font-semibold text-blue-700 bg-blue-50/70 border border-blue-200/50 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                  <span>₹{results.costPerKw ? results.costPerKw.toLocaleString('en-IN') : '30,000'}/kW</span>
                  <span>•</span>
                  <span>{results.pricingTier || 'C&I Commercial'}</span>
                </p>
              )}

              {item.key === 'roi' && results.paybackPeriod && (
                <p className="mt-1.5 text-[11px] font-semibold text-green-700 bg-green-50/70 border border-green-200/50 px-2 py-0.5 rounded-md inline-block">
                  {t('paybackPeriod')}: ~{results.paybackPeriod} {t('paybackPeriod')?.includes('वर्ष') ? 'वर्षे' : (t('paybackPeriod')?.includes('ವರ್ಷ') ? 'ವರ್ಷಗಳು' : 'years')}
                </p>
              )}
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
              <h3 className="text-lg font-bold text-slate-900">{t('liveWeatherAdj')}</h3>
              <p className="text-sm text-slate-500">{t('openMeteoConditions')}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-5">
            <div>
              <p className="text-sm text-slate-500">{t('temperature')}</p>
              <p className="text-xl font-bold text-slate-900">
                {formatNumber(weather.temperature, 1)} <span className="text-sm font-semibold text-slate-500">°C</span>
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">{t('cloudCover')}</p>
              <p className="text-xl font-bold text-slate-900">
                {formatNumber(weather.cloudCover)} <span className="text-sm font-semibold text-slate-500">%</span>
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">{t('sunshineHours')}</p>
              <p className="text-xl font-bold text-slate-900">{formatNumber(weather.sunshineHours, 1)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">{t('details')}</p>
              <p className="text-base font-bold text-slate-900">{weather.weatherSummary}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">{t('weatherImpact')}</p>
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
            <h3 className="text-lg font-bold text-slate-900">{t('monthlyEnergyGeneration')}</h3>
            <p className="text-sm text-slate-500">{t('systemAnalysisSubtitle')}</p>
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
              <h3 className="font-bold">{t('dynamicSystemDesign')}</h3>
              <p className="text-sm text-slate-400">{t('usableArea')}</p>
            </div>
          </div>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between border-b border-white/10 pb-3">
              <span className="text-slate-400">{t('estPanelCount')}</span>
              <span className="font-semibold">{formatNumber(results.panels)}</span>
            </div>
            <div className="flex justify-between border-b border-white/10 pb-3">
              <span className="text-slate-400">{t('annualGeneration')}</span>
              <span className="font-semibold">{formatNumber(results.yearlyGeneration)} kWh</span>
            </div>
            {'weatherAdjustedYearlyGeneration' in results && (
              <div className="flex justify-between border-b border-white/10 pb-3">
                <span className="text-slate-400">{t('liveWeatherAdj')}</span>
                <span className="font-semibold">{formatNumber(results.weatherAdjustedYearlyGeneration)} kWh</span>
              </div>
            )}
            <div className="flex justify-between border-b border-white/10 pb-3">
              <span className="text-slate-400">{t('annualSavings')}</span>
              <span className="font-semibold">{formatCurrency(results.yearlySavings)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">{t('paybackPeriod')}</span>
              <span className="font-semibold">{results.paybackPeriod} {t('paybackPeriod')?.includes('वर्ष') ? 'वर्ष' : 'years'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResults;
