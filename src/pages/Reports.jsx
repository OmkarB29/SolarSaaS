import React from 'react';
import { 
  FileDown, 
  MapPin, 
  CalendarDays, 
  CheckCircle2 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip
} from 'recharts';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { ChartContainer } from '../components/ui/Chart';
import { Table } from '../components/ui/Table';

const generationData = [
  { month: 'January', expected: 400 },
  { month: 'February', expected: 300 },
  { month: 'March', expected: 550 },
  { month: 'April', expected: 700 },
  { month: 'May', expected: 850 },
  { month: 'June', expected: 900 },
];

const tableColumns = [
  { header: 'Month', accessorKey: 'month' },
  { 
    header: 'Expected Output (kWh)', 
    accessorKey: 'expected',
    cell: (row) => <span className="font-medium text-slate-900">{row.expected}</span>
  },
  { 
    header: 'Performance Rating', 
    cell: (row) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        row.expected >= 700 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
      }`}>
        {row.expected >= 700 ? 'Optimal' : 'Standard'}
      </span>
    )
  }
];

const Reports = () => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-end print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Project Reports</h1>
          <p className="text-slate-500 mt-1">Generate and export official proposals</p>
        </div>
        <button 
          onClick={handlePrint}
          className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm flex items-center space-x-2"
        >
          <FileDown size={18} />
          <span>Download PDF</span>
        </button>
      </div>

      {/* A4 Document Preview styling using Card */}
      <Card className="rounded-sm shadow-2xl p-0 print:shadow-none print:border-none print:m-0 mx-auto">
        
        {/* Report Header */}
        <div className="bg-slate-900 text-white p-8 rounded-t-sm print:rounded-none">
          <div className="flex justify-between items-start border-b border-slate-700 pb-6 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-primary-500 mb-2">SolarScope Analysis Report</h1>
              <p className="text-slate-300 text-lg">Acme Corp Logistics Hub</p>
            </div>
            <div className="text-right text-sm text-slate-400 space-y-1">
              <div className="flex items-center justify-end space-x-1">
                <MapPin size={14} />
                <span>100 Logistics Way, Austin, TX</span>
              </div>
              <div className="flex items-center justify-end space-x-1">
                <CalendarDays size={14} />
                <span>Generated: Nov 12, 2024</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-slate-400 text-sm">System Size</p>
              <p className="text-2xl font-bold">240 <span className="text-sm">kWp</span></p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Est. Annual Output</p>
              <p className="text-2xl font-bold text-green-400">380k <span className="text-sm">kWh</span></p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Gross Cost</p>
              <p className="text-2xl font-bold">₹4.5M</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Payback Period</p>
              <p className="text-2xl font-bold text-primary-400">3.9 <span className="text-sm">Yrs</span></p>
            </div>
          </div>
        </div>

        {/* Report Body */}
        <CardContent className="p-8 space-y-8">
          
          <div className="grid grid-cols-2 gap-8 items-start">
            <div>
              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">Rooftop Snapshot</h3>
              <div className="bg-slate-100 h-64 rounded-xl border border-slate-200 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1596425944111-968603681d4a?auto=format&fit=crop&q=80')] bg-cover bg-center"></div>
                <div className="relative text-xs font-mono text-slate-500 flex flex-col items-center">
                  <div className="w-32 h-24 border-2 border-primary-500/50 bg-primary-500/10 mb-2"></div>
                  1,450 m² Polygon Output
                </div>
              </div>
            </div>

            <div className="space-y-4">
               <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">Executive Summary</h3>
               <p className="text-slate-600 leading-relaxed text-sm">
                 Based on the geospatial analysis of the Acme Corp Logistics Hub, an area of 1,450 m² is determined as suitable for solar array installation. Using standard 400W commercial-grade modules, a 240 kWp system can be deployed.
               </p>
               <ul className="space-y-3 text-sm text-slate-700">
                 <li className="flex items-start space-x-2">
                   <CheckCircle2 size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                   <span>Covers approximately 85% of baseload daytime consumption.</span>
                 </li>
                 <li className="flex items-start space-x-2">
                   <CheckCircle2 size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                   <span>Positive cash flow beginning Year 4.</span>
                 </li>
                 <li className="flex items-start space-x-2">
                   <CheckCircle2 size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                   <span>Eligible for 30% federal investment tax credit (subject to specific regional allocations).</span>
                 </li>
               </ul>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-6">Energy Generation Profile (First 6 Mos)</h3>
            <ChartContainer height="h-56">
              <BarChart data={generationData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
                <Tooltip cursor={{fill: '#F1F5F9'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="expected" fill="#0f172a" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ChartContainer>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">Detailed Breakdown</h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <Table columns={tableColumns} data={generationData} />
            </div>
          </div>

        </CardContent>

      </Card>
    </div>
  );
};

export default Reports;
