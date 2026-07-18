import React from 'react';

export const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl p-6 shadow-sm border border-slate-100 ${className}`}>
    {children}
  </div>
);

export const CardHeader = ({ title, subtitle, action, className = '' }) => (
  <div className={`flex justify-between items-center mb-6 ${className}`}>
    <div>
      <h3 className="text-lg font-bold text-slate-800">{title}</h3>
      {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={`px-6 pb-6 ${className}`}>
    {children}
  </div>
);
