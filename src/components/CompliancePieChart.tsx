import React, { useState } from 'react';
import { CheckCircle2, Clock, AlertTriangle, PieChart as PieIcon } from 'lucide-react';

interface CompliancePieChartProps {
  completed: number;
  pending: number;
  overdue: number;
  complianceRate: number;
}

export const CompliancePieChart: React.FC<CompliancePieChartProps> = ({
  completed,
  pending,
  overdue,
  complianceRate
}) => {
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'donut' | 'solid'>('donut');

  const total = completed + pending + overdue;

  // Slices definitions
  const segments = [
    {
      id: 'conformes',
      label: 'Conformes',
      count: completed,
      color: '#5E5365', // App primary brand slate
      darkColor: '#B2A2B7',
      hoverColor: '#4E4454',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
    },
    {
      id: 'pendientes',
      label: 'En Proceso / Pendientes',
      count: pending,
      color: '#CC8B79', // App accent terracotta
      darkColor: '#E5BEA6',
      hoverColor: '#B87A69',
      icon: <Clock className="w-3.5 h-3.5 text-[#CC8B79] shrink-0" />
    },
    {
      id: 'vencidas',
      label: 'Vencidas / Observaciones',
      count: overdue,
      color: '#965868', // Plum warning
      darkColor: '#D4A2B0',
      hoverColor: '#804856',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-[#965868] dark:text-[#D4A2B0] shrink-0" />
    }
  ].filter((s) => s.count > 0 || total === 0);

  // Helper to generate SVG pie slices paths
  const renderPiePaths = () => {
    if (total === 0) {
      return (
        <circle
          cx="100"
          cy="100"
          r={chartType === 'donut' ? 70 : 85}
          fill={chartType === 'donut' ? 'none' : '#EAE4E0'}
          stroke="#EAE4E0"
          strokeWidth={chartType === 'donut' ? 24 : 0}
          className="dark:stroke-slate-800 dark:fill-slate-800"
        />
      );
    }

    // If only one segment has 100%
    const activeSegments = segments.filter((s) => s.count > 0);
    if (activeSegments.length === 1) {
      const seg = activeSegments[0];
      if (chartType === 'donut') {
        return (
          <circle
            cx="100"
            cy="100"
            r="68"
            fill="none"
            stroke={seg.color}
            strokeWidth="24"
            className="transition-all duration-300 cursor-pointer"
            onMouseEnter={() => setHoveredSlice(seg.id)}
            onMouseLeave={() => setHoveredSlice(null)}
          />
        );
      } else {
        return (
          <circle
            cx="100"
            cy="100"
            r="85"
            fill={seg.color}
            className="transition-all duration-300 cursor-pointer"
            onMouseEnter={() => setHoveredSlice(seg.id)}
            onMouseLeave={() => setHoveredSlice(null)}
          />
        );
      }
    }

    let cumulativeAngle = -90; // Start at 12 o'clock
    const radius = chartType === 'donut' ? 85 : 85;
    const innerRadius = chartType === 'donut' ? 56 : 0;
    const center = 100;

    return segments
      .filter((s) => s.count > 0)
      .map((seg) => {
        const sliceAngle = (seg.count / total) * 360;
        const startAngle = cumulativeAngle;
        const endAngle = cumulativeAngle + sliceAngle;
        cumulativeAngle += sliceAngle;

        const isHovered = hoveredSlice === seg.id;
        const currentRadius = isHovered ? radius + 4 : radius;
        const currentInnerRadius = chartType === 'donut' ? (isHovered ? innerRadius - 2 : innerRadius) : 0;

        const startRad = (startAngle * Math.PI) / 180;
        const endRad = (endAngle * Math.PI) / 180;

        const x1 = center + currentRadius * Math.cos(startRad);
        const y1 = center + currentRadius * Math.sin(startRad);
        const x2 = center + currentRadius * Math.cos(endRad);
        const y2 = center + currentRadius * Math.sin(endRad);

        const largeArcFlag = sliceAngle > 180 ? 1 : 0;

        let pathData = '';
        if (chartType === 'donut') {
          const x3 = center + currentInnerRadius * Math.cos(endRad);
          const y3 = center + currentInnerRadius * Math.sin(endRad);
          const x4 = center + currentInnerRadius * Math.cos(startRad);
          const y4 = center + currentInnerRadius * Math.sin(startRad);

          pathData = `
            M ${x1} ${y1}
            A ${currentRadius} ${currentRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}
            L ${x3} ${y3}
            A ${currentInnerRadius} ${currentInnerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}
            Z
          `;
        } else {
          pathData = `
            M ${center} ${center}
            L ${x1} ${y1}
            A ${currentRadius} ${currentRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}
            Z
          `;
        }

        return (
          <path
            key={seg.id}
            d={pathData}
            fill={isHovered ? seg.hoverColor : seg.color}
            stroke="#FAF8F7"
            strokeWidth="2"
            className="dark:stroke-slate-900 transition-all duration-200 cursor-pointer drop-shadow-xs"
            onMouseEnter={() => setHoveredSlice(seg.id)}
            onMouseLeave={() => setHoveredSlice(null)}
          />
        );
      });
  };

  const getComplianceStatus = (rate: number) => {
    if (rate >= 80) return { label: 'Nivel Óptimo', badgeClass: 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300' };
    if (rate >= 60) return { label: 'Aceptable', badgeClass: 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300' };
    return { label: 'Atención Requerida', badgeClass: 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300' };
  };

  const status = getComplianceStatus(complianceRate);

  return (
    <div
      id="compliance-pie-chart-container"
      className="p-5 sm:p-6 rounded-2xl bg-[#FAF8F7] dark:bg-slate-950/60 border border-[#E5DFDC] dark:border-slate-800 space-y-4"
    >
      {/* Header & Mode Switch */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EAE4E0] dark:border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-[#5E5365] dark:text-[#B2A2B7] uppercase tracking-wider">
              Índice General de Cumplimiento
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${status.badgeClass}`}>
              {status.label}
            </span>
          </div>
          <p className="text-[11px] text-[#87778C] dark:text-slate-400 mt-0.5">
            Distribución proporcional del estado de inspecciones
          </p>
        </div>

        {/* Chart View Toggle (Donut vs Solid Pie) */}
        <div className="flex items-center bg-[#EAE4E0] dark:bg-slate-800 p-0.5 rounded-lg text-xs font-semibold">
          <button
            type="button"
            onClick={() => setChartType('donut')}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              chartType === 'donut'
                ? 'bg-white dark:bg-slate-900 text-[#5E5365] dark:text-slate-100 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Anillo
          </button>
          <button
            type="button"
            onClick={() => setChartType('solid')}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              chartType === 'solid'
                ? 'bg-white dark:bg-slate-900 text-[#5E5365] dark:text-slate-100 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Torta
          </button>
        </div>
      </div>

      {/* Main Chart Body: Responsive Side-by-Side on Tablet/Desktop, Stacked on Mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
        {/* Pie Graphic Stage */}
        <div className="sm:col-span-5 flex flex-col items-center justify-center relative">
          <div className="relative w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center">
            <svg
              viewBox="0 0 200 200"
              className="w-full h-full transform -rotate-90 origin-center filter drop-shadow-xs"
              style={{ overflow: 'visible' }}
            >
              {renderPiePaths()}
            </svg>

            {/* Central KPI Label (inside Donut or badge overlay for solid pie) */}
            {chartType === 'donut' ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-3xl sm:text-4xl font-black text-[#5E5365] dark:text-slate-100 tracking-tight leading-none">
                  {complianceRate}%
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#87778C] dark:text-slate-400 mt-1">
                  Conforme
                </span>
              </div>
            ) : (
              <div className="absolute bottom-0 right-0 bg-white/95 dark:bg-slate-900/95 border border-[#E5DFDC] dark:border-slate-700 px-2 py-1 rounded-xl shadow-md pointer-events-none text-center">
                <span className="text-xs font-black text-[#5E5365] dark:text-slate-100">
                  {complianceRate}%
                </span>
              </div>
            )}
          </div>

          {hoveredSlice && (
            <div className="mt-2 text-[11px] font-bold text-[#5E5365] dark:text-[#B2A2B7] animate-fade-in">
              {segments.find((s) => s.id === hoveredSlice)?.label}:{' '}
              {segments.find((s) => s.id === hoveredSlice)?.count} ({total > 0 ? Math.round(((segments.find((s) => s.id === hoveredSlice)?.count || 0) / total) * 100) : 0}%)
            </div>
          )}
        </div>

        {/* Legend and Detailed Metric Cards */}
        <div className="sm:col-span-7 space-y-2.5">
          {/* Segment: Conformes */}
          <div
            onMouseEnter={() => setHoveredSlice('conformes')}
            onMouseLeave={() => setHoveredSlice(null)}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              hoveredSlice === 'conformes'
                ? 'bg-white dark:bg-slate-900 border-[#5E5365] shadow-xs scale-[1.01]'
                : 'bg-white/80 dark:bg-slate-900/80 border-[#E5DFDC] dark:border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: '#5E5365' }}
                />
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    Inspecciones Conformes
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Auditorías cerradas y aprobadas
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-base font-black text-[#5E5365] dark:text-[#B2A2B7]">
                  {completed}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  {total > 0 ? Math.round((completed / total) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Segment: Con Observaciones / Pendientes */}
          <div
            onMouseEnter={() => setHoveredSlice('pendientes')}
            onMouseLeave={() => setHoveredSlice(null)}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              hoveredSlice === 'pendientes'
                ? 'bg-white dark:bg-slate-900 border-[#CC8B79] shadow-xs scale-[1.01]'
                : 'bg-white/80 dark:bg-slate-900/80 border-[#E5DFDC] dark:border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: '#CC8B79' }}
                />
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    En Proceso / Pendientes
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    En revisión o firma pendiente
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-base font-black text-[#CC8B79]">
                  {pending}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  {total > 0 ? Math.round((pending / total) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Segment: Vencidas */}
          {overdue > 0 && (
            <div
              onMouseEnter={() => setHoveredSlice('vencidas')}
              onMouseLeave={() => setHoveredSlice(null)}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                hoveredSlice === 'vencidas'
                  ? 'bg-white dark:bg-slate-900 border-[#965868] shadow-xs scale-[1.01]'
                  : 'bg-white/80 dark:bg-slate-900/80 border-[#E5DFDC] dark:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: '#965868' }}
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      Vencidas con Observaciones
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Plazo expirado sin regularizar
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-[#965868] dark:text-[#D4A2B0]">
                    {overdue}
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    {total > 0 ? Math.round((overdue / total) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Summary Footer */}
          <div className="pt-1 flex items-center justify-between text-[11px] text-[#87778C] dark:text-slate-400 px-1">
            <span>Total inspecciones: <strong>{total}</strong></span>
            <span>Con observaciones: <strong>{pending + overdue}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
