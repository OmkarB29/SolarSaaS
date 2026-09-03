import React, { useMemo } from 'react';
import { Layers, CheckCircle2, Maximize2, Shield, Info } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/Card';

const DynamicPanelLayout = ({
  roofArea = 100,
  panelCount = 40,
  panelDimensions = { width: 2.0, height: 1.0, area: 2.0, power: 400 }
}) => {
  const count = Math.max(1, Math.round(panelCount || 0));

  // Determine auto-scaling grid dimensions based on panel count
  const { cols, rows, gapClass, cellHeightClass } = useMemo(() => {
    let calculatedCols;
    if (count <= 24) calculatedCols = Math.max(4, Math.ceil(Math.sqrt(count * 1.5)));
    else if (count <= 60) calculatedCols = 8;
    else if (count <= 120) calculatedCols = 12;
    else if (count <= 200) calculatedCols = 16;
    else calculatedCols = Math.min(24, Math.max(16, Math.ceil(Math.sqrt(count * 1.6))));

    const calculatedRows = Math.ceil(count / calculatedCols);

    let gap = 'gap-1';
    let cellH = 'h-5';
    if (count <= 30) {
      gap = 'gap-1.5';
      cellH = 'h-8';
    } else if (count <= 80) {
      gap = 'gap-1';
      cellH = 'h-6';
    } else if (count <= 180) {
      gap = 'gap-0.5';
      cellH = 'h-4';
    } else {
      gap = 'gap-0.5';
      cellH = 'h-3';
    }

    return {
      cols: calculatedCols,
      rows: calculatedRows,
      gapClass: gap,
      cellHeightClass: cellH,
    };
  }, [count]);

  const panels = useMemo(() => Array.from({ length: count }, (_, i) => i + 1), [count]);
  const usableRoofArea = Math.round(count * (panelDimensions.area || 2.0) * 10) / 10;
  const coveragePercent = roofArea > 0 ? Math.min(95, Math.round((usableRoofArea / roofArea) * 100)) : 80;

  return (
    <Card className="p-0 overflow-hidden">
      <CardHeader 
        title="Dynamic Panel Layout Visualization" 
        className="mb-0 pt-6 px-6"
        action={
          <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">
            {count} Modules Active
          </span>
        }
      />
      <CardContent className="p-6">
        {/* Roof Envelope / Visual Canvas */}
        <div className="relative bg-slate-900/95 rounded-2xl border border-slate-800 p-5 shadow-inner overflow-hidden">
          {/* Subtle Roof Pitch / Guideline Texture */}
          <div className="absolute inset-2 border-2 border-dashed border-amber-500/20 rounded-xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-center justify-center min-h-[220px] max-h-[360px] overflow-y-auto overflow-x-hidden p-2">
            <div 
              className={`grid w-full ${gapClass} justify-center transition-all`}
              style={{
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              }}
            >
              {panels.map((num) => (
                <div
                  key={num}
                  title={`Module #${num} (400W Monocrystalline PERC)`}
                  className={`relative ${cellHeightClass} bg-gradient-to-b from-blue-900 to-slate-900 border border-sky-500/30 rounded-[2px] shadow-2xs hover:border-amber-400 hover:scale-110 transition-all flex flex-col justify-between p-[1px] cursor-pointer group`}
                >
                  {/* PV Busbar Simulation Lines */}
                  <div className="w-full h-[1px] bg-sky-400/20 group-hover:bg-amber-400/50" />
                  <div className="w-full h-[1px] bg-sky-400/20 group-hover:bg-amber-400/50" />
                </div>
              ))}
            </div>
          </div>

          {/* Roof Overlay Badge */}
          <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700/80 text-2xs text-slate-300 font-medium">
            <Layers size={12} className="text-amber-400" />
            <span>{cols} Col × {rows} Row Layout</span>
          </div>
        </div>

        {/* Layout Specifications Footer */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block">Module Dimensions:</span>
            <span className="font-semibold text-slate-700">
              {panelDimensions.width}m × {panelDimensions.height}m ({(panelDimensions.area || 2).toFixed(1)} m²)
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Rooftop Utilization:</span>
            <span className="font-semibold text-slate-700">
              {coveragePercent}% ({usableRoofArea} m²)
            </span>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <span className="text-slate-400 block">Array Azimuth:</span>
            <span className="font-semibold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 size={12} />
              180° Optimal South
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DynamicPanelLayout;