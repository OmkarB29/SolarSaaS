import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const StatCard = ({ title, value, unit, icon, trend, trendUp = true, colorClass }) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${colorClass}`}>
        {React.createElement(icon, { size: 24 })}
      </div>
      {trend && (
        <div className={`flex items-center space-x-1 text-sm font-medium px-2 py-1 rounded-full ${
          trendUp ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'
        }`}>
          {trendUp ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
          <span>{trend}</span>
        </div>
      )}
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

export default StatCard;
