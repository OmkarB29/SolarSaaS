import React from 'react';
import { 
  Sun,
  Layers,
  Zap,
  Banknote,
  PiggyBank,
  CheckCircle2,
  AlertCircle
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
} from 'recharts';

const profitData = Array.from({ length: 20 }, (_, i) => ({
  year: `Year ${i + 1}`,
  profit: (i < 4 ? -450000 + (120000 * i) : 120000 * (i - 4) + 30000),
}));

const Analysis = () => {
  const panelGrid = Array.from({ length: 48 }, (_, i) => i); // mock 48 panels

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Analysis & Financials</h1>
          <p className="text-slate-500 mt-1">Detailed performance and economic projections</p>
        </div>
        <button className="bg-primary-500 hover:bg-primary-600 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm shadow-primary-500/30">
          Save Proposal
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - System Design */}
        <div className="col-span-1 space-y-6">
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="absolute -top-10 -right-10 text-primary-500/20 blur-2xl">
              <Sun size={120} />
            </div>
            <h3 className="text-lg font-bold mb-6 flex items-center space-x-2 relative z-10">
              <Layers size={20} className="text-primary-400" />
              <span>System Design</span>
            </h3>
            
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-end border-b border-white/10 pb-4">
                <span className="text-slate-400 text-sm">Usable Area</span>
                <div className="text-right">
                  <span className="text-xl font-bold">1,450</span>
                  <span className="text-slate-400 ml-1 text-sm">m²</span>
                </div>
              </div>
              <div className="flex justify-between items-end border-b border-white/10 pb-4">
                <span className="text-slate-400 text-sm">System Size</span>
                <div className="text-right">
                  <span className="text-xl font-bold text-primary-400">240</span>
                  <span className="text-slate-400 ml-1 text-sm">kWp</span>
                </div>
              </div>
              <div className="flex justify-between items-end pb-2">
                <span className="text-slate-400 text-sm">Est. Panel Count</span>
                <div className="text-right">
                  <span className="text-xl font-bold">580</span>
                  <span className="text-slate-400 ml-1 text-sm">modules</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-md font-bold text-slate-800 mb-4">Panel Layout Visualization</h3>
            <div className="aspect-square bg-slate-50 rounded-xl border border-slate-200 p-4 grid grid-cols-6 gap-1.5 align-content-center justify-content-center relative">
              {/* Roof styling */}
              <div className="absolute inset-2 border-2 border-dashed border-primary-300 rounded-lg opacity-50 z-0"></div>
              {panelGrid.map(i => (
                <div key={i} className="bg-slate-800 rounded-[2px] shadow-sm transform hover:scale-105 transition-transform z-10 border border-slate-700/50 flex flex-col justify-between p-[1px]">
                  <div className="w-full h-[1px] bg-slate-700/50"></div>
                  <div className="w-full h-[1px] bg-slate-700/50"></div>
                </div>
              ))}
            </div>
            <div className="flex items-center space-x-2 mt-4 text-sm text-slate-500">
              <CheckCircle2 size={16} className="text-green-500" />
              <span>Optimal South-Facing orientation detected</span>
            </div>
          </div>
        </div>

        {/* Right Column - Financials */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
                <Banknote size={24} />
              </div>
              <p className="text-sm font-medium text-slate-500 mb-1">Total Installation</p>
              <p className="text-2xl font-bold text-slate-900 border-b-2 border-primary-500/30 pb-1">₹4,500,000</p>
              <p className="text-xs text-slate-400 mt-2">Includes incentives</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
               <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-4">
                <Zap size={24} />
              </div>
              <p className="text-sm font-medium text-slate-500 mb-1">Annual Yield</p>
              <p className="text-2xl font-bold text-slate-900 border-b-2 border-primary-500/30 pb-1">380,000 <span className="text-base text-slate-500">kWh</span></p>
              <p className="text-xs text-green-500 font-medium mt-2">Covers 85% of usage</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
               <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-4">
                <PiggyBank size={24} />
              </div>
              <p className="text-sm font-medium text-slate-500 mb-1">Year 1 Savings</p>
              <p className="text-2xl font-bold text-slate-900 border-b-2 border-primary-500/30 pb-1">₹1,150,000</p>
              <p className="text-xs text-slate-400 mt-2">Payback ~3.9 Years</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">20-Year Profitability Projection</h3>
              <div className="flex items-center space-x-2 text-sm text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                <AlertCircle size={14} className="text-primary-500" />
                <span>Assumes 3% annual tariff hike</span>
              </div>
            </div>
            
            <div className="h-80 w-full">
              <ResponsiveContainer>
                <LineChart data={profitData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} interval="preserveStartEnd" minTickGap={30} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} tickFormatter={(value) => `₹${value/1000}k`} />
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                    formatter={(value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value)}
                  />
                  {/* Reference line for zer-profit (break-even point) */}
                  <line x1="0" y1="y" x2="100%" y2="y" stroke="gray" strokeWidth={1} strokeDasharray="5 5" />
                  
                  <Line 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#0f172a" 
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
                    fill="url(#colorProfit)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analysis;
