import React from 'react';

export const Table = ({ columns, data, className = '' }) => {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200">
            {columns.map((col, idx) => (
              <th 
                key={idx} 
                className="py-3 px-4 text-sm font-medium text-slate-500 uppercase tracking-wider"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((row, rowIdx) => (
            <tr key={rowIdx} className="hover:bg-slate-50/50 transition-colors">
              {columns.map((col, colIdx) => (
                <td key={colIdx} className="py-4 px-4 text-sm text-slate-700">
                  {col.cell ? col.cell(row) : row[col.accessorKey]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
