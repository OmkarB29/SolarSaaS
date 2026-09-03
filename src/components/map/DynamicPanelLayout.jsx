import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Layers, CheckCircle2, Zap } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/Card';

const DynamicPanelLayout = ({
  roofArea = 100,
  panelCount = 40,
  panelDimensions = { width: 2.0, height: 1.0, area: 2.0, power: 400 }
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const count = Math.max(1, Math.round(panelCount || 0));

  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 340, height: 260 });

  // Determine optimal columns & rows based on panel count
  const { cols, rows } = useMemo(() => {
    let calculatedCols;
    if (count <= 12) calculatedCols = Math.max(3, count);
    else if (count <= 30) calculatedCols = 6;
    else if (count <= 80) calculatedCols = 8;
    else if (count <= 180) calculatedCols = 12;
    else if (count <= 400) calculatedCols = 16;
    else if (count <= 1000) calculatedCols = 24;
    else if (count <= 2500) calculatedCols = 36;
    else calculatedCols = Math.min(60, Math.ceil(Math.sqrt(count * 1.8)));

    const calculatedRows = Math.ceil(count / calculatedCols);
    return { cols: calculatedCols, rows: calculatedRows };
  }, [count]);

  // Responsive resize observer for container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0) {
        setDimensions({
          width: Math.floor(rect.width),
          height: 280,
        });
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // High-performance Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = dimensions.width;
    const height = dimensions.height;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear background
    ctx.fillStyle = '#0f172a'; // slate-900
    ctx.fillRect(0, 0, width, height);

    // Draw dashed roof perimeter guide
    ctx.save();
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)'; // amber-500
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(10, 10, width - 20, height - 20);
    ctx.restore();

    // Compute cell dimensions
    const paddingX = 18;
    const paddingY = 18;
    const availW = width - paddingX * 2;
    const availH = height - paddingY * 2;

    const gap = count > 300 ? 1 : count > 80 ? 1.5 : 2;
    const cellW = (availW - (cols - 1) * gap) / cols;
    const cellH = Math.min(cellW * 1.6, (availH - (rows - 1) * gap) / rows);

    // Center layout vertically if extra space
    const totalContentH = rows * cellH + (rows - 1) * gap;
    const offsetY = paddingY + Math.max(0, (availH - totalContentH) / 2);

    // Draw all solar panel modules efficiently
    for (let i = 0; i < count; i++) {
      const c = i % cols;
      const r = Math.floor(i / cols);
      const x = paddingX + c * (cellW + gap);
      const y = offsetY + r * (cellH + gap);

      const isHovered = hoveredIndex === i;

      // Module Cell Background
      if (isHovered) {
        ctx.fillStyle = '#38bdf8'; // sky-400 highlight
        ctx.strokeStyle = '#f59e0b'; // amber-500 border
        ctx.lineWidth = 1.5;
      } else {
        ctx.fillStyle = '#1e293b'; // slate-800
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.lineWidth = 0.75;
      }

      ctx.fillRect(x, y, cellW, cellH);
      ctx.strokeRect(x, y, cellW, cellH);

      // Draw PV Busbar lines if cell is large enough to see
      if (cellH >= 6 && cellW >= 4) {
        ctx.fillStyle = isHovered ? 'rgba(255, 255, 255, 0.7)' : 'rgba(148, 163, 184, 0.3)';
        const line1Y = y + cellH * 0.33;
        const line2Y = y + cellH * 0.66;
        ctx.fillRect(x + 1, line1Y, Math.max(1, cellW - 2), 0.75);
        ctx.fillRect(x + 1, line2Y, Math.max(1, cellW - 2), 0.75);
      }
    }
  }, [count, cols, rows, dimensions, hoveredIndex]);

  // Handle mouse move for interactive inspection
  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const paddingX = 18;
    const paddingY = 18;
    const availW = dimensions.width - paddingX * 2;
    const availH = dimensions.height - paddingY * 2;
    const gap = count > 300 ? 1 : count > 80 ? 1.5 : 2;
    const cellW = (availW - (cols - 1) * gap) / cols;
    const cellH = Math.min(cellW * 1.6, (availH - (rows - 1) * gap) / rows);
    const totalContentH = rows * cellH + (rows - 1) * gap;
    const offsetY = paddingY + Math.max(0, (availH - totalContentH) / 2);

    const c = Math.floor((mx - paddingX) / (cellW + gap));
    const r = Math.floor((my - offsetY) / (cellH + gap));

    if (c >= 0 && c < cols && r >= 0 && r < rows) {
      const idx = r * cols + c;
      if (idx < count) {
        setHoveredIndex(idx);
        return;
      }
    }
    setHoveredIndex(null);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  const usableRoofArea = Math.round(count * (panelDimensions.area || 2.0) * 10) / 10;
  const coveragePercent = roofArea > 0 ? Math.min(95, Math.round((usableRoofArea / roofArea) * 100)) : 80;

  return (
    <Card className="p-0 overflow-hidden">
      <CardHeader 
        title="Dynamic Panel Layout Visualization" 
        className="mb-0 pt-6 px-6"
        action={
          <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">
            {count.toLocaleString('en-IN')} Modules Active
          </span>
        }
      />
      <CardContent className="p-6">
        <div 
          ref={containerRef}
          className="relative bg-slate-900 rounded-2xl border border-slate-800 p-2 shadow-inner overflow-hidden"
        >
          <canvas
            ref={canvasRef}
            style={{ width: dimensions.width, height: dimensions.height }}
            className="block mx-auto rounded-xl cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          />

          {/* Dynamic Grid Layout Badge */}
          <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700 text-2xs text-slate-300 font-medium pointer-events-none">
            <Layers size={12} className="text-amber-400" />
            <span>{cols} Col × {rows} Row Layout</span>
          </div>

          {/* Hover Module Tooltip */}
          {hoveredIndex !== null && (
            <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-slate-900/95 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-sky-500/50 text-2xs text-sky-300 font-medium shadow-lg pointer-events-none">
              <Zap size={12} className="text-amber-400" />
              <span>Module #{hoveredIndex + 1} (400W Mono PERC)</span>
            </div>
          )}
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
              {coveragePercent}% ({usableRoofArea.toLocaleString('en-IN')} m²)
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