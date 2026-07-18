import React from 'react';
import { ResponsiveContainer } from 'recharts';

export const ChartContainer = ({ children, height = 'h-72', className = '' }) => (
  <div className={`${height} w-full ${className}`}>
    <ResponsiveContainer width="100%" height="100%">
      {children}
    </ResponsiveContainer>
  </div>
);
