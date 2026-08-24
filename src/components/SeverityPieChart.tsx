import React, { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Clock,
  CheckCircle2,
  PieChart as PieIcon,
  ShieldAlert,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Finding } from '../types';

interface SeverityPieChartProps {
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

export interface SeverityLevelData {
  id: 'Crítica' | 'Alta' | 'Media' | 'Baja';
  label: string;
  count: number;
  percentage: number;
  color: string;
  darkColor: string;
  hoverColor: string;
  bgLight: string;
  bgDark: string;
  borderLight: string;
  borderDark: string;
  actionTitle: string;
  actionMessage: string;
  subMessage: string;
  icon: React.ReactNode;
  sla: string;
}

export const SeverityPieChart: React.FC<SeverityPieChartProps> = ({
  critical,
  high,
  medium,
  low,
  total
}) => {
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState<string | null>(null);
  const [chartMode, setChartMode] = useState<'donut' | 'solid'>('donut');

  const severityItems: SeverityLevelData[] = [
    {
      id: 'Crítica',
      label: 'Crítica',
      count: critical,
      percentage: total > 0 ? Math.round((critical / total) * 100) : 0,
      color: '#965868', // Deep plum rose
      darkColor: '#D4A2B0',
      hoverColor: '#7A3F4E',
      bgLight: 'bg-[#FAF2F4]',
      bgDark: 'dark:bg-[#2B1E23]',
      borderLight: 'border-[#F1DDE1]',
      borderDark: 'dark:border-[#523842]',
      actionTitle: 'Acción Inmediata',
      actionMessage: 'Realizar acciones correctivas de inmediato',
      subMessage: 'Intervención urgente y detención preventiva de condiciones de alto riesgo.',
      icon: <AlertOctagon className="w-4 h-4 text-[#965868] dark:text-[#D4A2B0]" />,
      sla: 'Inmediato (< 12 hrs)'
    },
    {
      id: 'Alta',
      label: 'Alta',
      count: high,
      percentage: total > 0 ? Math.round((high / total) * 100) : 0,
      color: '#CC8B79', // Terracotta accent
      darkColor: '#E5BEA6',
      hoverColor: '#B57463',
      bgLight: 'bg-[#FAF0EC]',
      bgDark: 'dark:bg-[#2C211E]',
      borderLight: 'border-[#ECCFBE]',
      borderDark: 'dark:border-[#54433B]',
      actionTitle: 'Corto Plazo',
      actionMessage: 'Evaluar acciones correctivas en corto plazo',
      subMessage: 'Planificar e implementar medidas de mitigación en plazo prioritario (< 48 hrs).',
      icon: <AlertTriangle className="w-4 h-4 text-[#CC8B79] dark:text-[#E5BEA6]" />,
      sla: 'Corto Plazo (< 48 hrs)'
    },
    {
      id: 'Media',
      label: 'Media',
      count: medium,
      percentage: total > 0 ? Math.round((medium / total) * 100) : 0,
      color: '#BD9F8D', // Warm Ochre
      darkColor: '#D9C4B8',
      hoverColor: '#A58573',
      bgLight: 'bg-[#FAF5F0]',
      bgDark: 'dark:bg-[#2B231F]',
      borderLight: 'border-[#ECCFBE]',
      borderDark: 'dark:border-[#54433B]',
      actionTitle: 'Mediano Plazo',
      actionMessage: 'Evaluar acciones correctivas en mediano plazo',
      subMessage: 'Programar corrección y control operativo en el siguiente ciclo de mantenimiento.',
      icon: <Clock className="w-4 h-4 text-[#BD9F8D] dark:text-[#D9C4B8]" />,
      sla: 'Mediano Plazo (< 7 días)'
    },
    {
      id: 'Baja',
      label: 'Baja',
      count: low,
      percentage: total > 0 ? Math.round((low / total) * 100) : 0,
      color: '#5C788A', // Slate blue
      darkColor: '#9EB0BE',
      hoverColor: '#4A6272',
      bgLight: 'bg-[#F0F4F8]',
      bgDark: 'dark:bg-[#1E262C]',
      borderLight: 'border-[#BCD1DE]',
      borderDark: 'dark:border-[#3E4D59]',
      actionTitle: 'Seguimiento Periódico',
      actionMessage: 'Incorporar un monitoreo periódico',
      subMessage: 'Mantener seguimiento continuo, orden y verificación preventiva regular.',
      icon: <CheckCircle2 className="w-4 h-4 text-[#5C788A] dark:text-[#9EB0BE]" />,
      sla: 'Monitoreo Periódico'
    }
  ];

  const activeFocus = hoveredSlice || selectedSeverity;
  const activeItem = severityItems.find((s) => s.id === activeFocus);

  // SVG Pie Generator
  const renderPiePaths = () => {
    if (total === 0) {
      return (
        <circle
          cx="100"
          cy="100"
          r={chartMode === 'donut' ? 70 : 82}
          fill={chartMode === 'donut' ? 'none' : '#F0ECE9'}
          stroke="#E5DFDC"
          strokeWidth={chartMode === 'donut' ? 24 : 0}
          className="dark:stroke-slate-800 dark:fill-slate-800"
        />
      );
    }

    const nonZeroItems = severityItems.filter((s) => s.count > 0);

    // If all findings belong to a single severity
    if (nonZeroItems.length === 1) {
      const seg = nonZeroItems[0];
      const isFocused = activeFocus === seg.id;
      if (chartMode === 'donut') {
        return (
          <circle
            cx="100"
            cy="100"
            r={isFocused ? 72 : 68}
            fill="none"
            stroke={isFocused ? seg.hoverColor : seg.color}
            strokeWidth={isFocused ? 28 : 24}
            className="transition-all duration-300 cursor-pointer"
            onMouseEnter={() => setHoveredSlice(seg.id)}
            onMouseLeave={() => setHoveredSlice(null)}
            onClick={() => setSelectedSeverity(selectedSeverity === seg.id ? null : seg.id)}
          />
        );
      } else {
        return (
          <circle
            cx="100"
            cy="100"
            r={isFocused ? 85 : 82}
            fill={isFocused ? seg.hoverColor : seg.color}
            className="transition-all duration-300 cursor-pointer"
            onMouseEnter={() => setHoveredSlice(seg.id)}
            onMouseLeave={() => setHoveredSlice(null)}
            onClick={() => setSelectedSeverity(selectedSeverity === seg.id ? null : seg.id)}
          />
        );
      }
    }

    let cumulativeAngle = -90; // Start at 12 o'clock
    const radius = chartMode === 'donut' ? 84 : 84;
    const innerRadius = chartMode === 'donut' ? 54 : 0;
    const center = 100;

    return nonZeroItems.map((seg) => {
      const sliceAngle = (seg.count / total) * 360;
      const startAngle = cumulativeAngle;
      const endAngle = cumulativeAngle + sliceAngle;
      cumulativeAngle += sliceAngle;

      const isFocused = activeFocus === seg.id;
      const currentRadius = isFocused ? radius + 5 : radius;
      const currentInnerRadius =
        chartMode === 'donut' ? (isFocused ? innerRadius - 3 : innerRadius) : 0;

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const x1 = center + currentRadius * Math.cos(startRad);
      const y1 = center + currentRadius * Math.sin(startRad);
      const x2 = center + currentRadius * Math.cos(endRad);
      const y2 = center + currentRadius * Math.sin(endRad);

      const largeArcFlag = sliceAngle > 180 ? 1 : 0;

      let pathData = '';
      if (chartMode === 'donut') {
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
          fill={isFocused ? seg.hoverColor : seg.color}
          stroke="#FFFFFF"
          strokeWidth={isFocused ? 2.5 : 1.5}
          className="transition-all duration-200 cursor-pointer dark:stroke-slate-900"
          onMouseEnter={() => setHoveredSlice(seg.id)}
          onMouseLeave={() => setHoveredSlice(null)}
          onClick={() => setSelectedSeverity(selectedSeverity === seg.id ? null : seg.id)}
        />
      );
    });
  };

  const highPriorityCount = critical + high;

  return (
    <div
      id="matriz-severidad-torta-container"
      className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-[#E5DFDC] dark:border-slate-800 shadow-xs space-y-5 transition-all"
    >
      {/* Header with Title & Summary Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#FAF2F4] dark:bg-[#2B1E23] text-[#965868] dark:text-[#D4A2B0] flex items-center justify-center">
              <PieIcon className="w-4 h-4" />
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-[#38303B] dark:text-slate-100 uppercase tracking-wide">
              Matriz de Severidad de Hallazgos ({total})
            </h3>
          </div>
          <p className="text-xs text-[#87778C] dark:text-slate-400 mt-0.5 ml-9">
            Distribución porcentual por nivel de criticidad y protocolo de acción correctiva.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Chart mode toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-[11px] font-bold text-slate-600 dark:text-slate-300">
            <button
              type="button"
              onClick={() => setChartMode('donut')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                chartMode === 'donut'
                  ? 'bg-white dark:bg-slate-900 text-[#5E5365] dark:text-slate-100 shadow-xs'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Anillo
            </button>
            <button
              type="button"
              onClick={() => setChartMode('solid')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                chartMode === 'solid'
                  ? 'bg-white dark:bg-slate-900 text-[#5E5365] dark:text-slate-100 shadow-xs'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Torta
            </button>
          </div>

          <span className="px-3 py-1 rounded-full bg-[#FAF2F4] dark:bg-[#2B1E23] text-[#965868] dark:text-[#D4A2B0] text-xs font-black border border-[#F1DDE1] dark:border-[#523842]">
            {highPriorityCount} prioridad alta
          </span>
        </div>
      </div>

      {/* Main Grid: Pie Chart (Left) + Action Messages & Severities (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: SVG Pie Graphic with Center Info */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-3 bg-slate-50/70 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800/80">
          <div className="relative w-52 h-52 sm:w-56 sm:h-56">
            <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
              {renderPiePaths()}
            </svg>

            {/* Center Hole Info in Donut Mode */}
            {chartMode === 'donut' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                {activeItem ? (
                  <div className="animate-fade-in">
                    <span
                      className="text-[11px] font-black uppercase tracking-wider block"
                      style={{ color: activeItem.color }}
                    >
                      {activeItem.label}
                    </span>
                    <span className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-tight block">
                      {activeItem.count}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      {activeItem.percentage}% del total
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="text-2xl sm:text-3xl font-black text-[#38303B] dark:text-slate-100 leading-tight block">
                      {total}
                    </span>
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#87778C] dark:text-slate-400 block">
                      Hallazgos
                    </span>
                    {total > 0 && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-0.5">
                        {critical === 0 ? 'Sin riesgos críticos' : `${critical} crítico(s)`}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Micro legend under the pie */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-3 text-[11px] font-bold text-slate-600 dark:text-slate-400">
            {severityItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onMouseEnter={() => setHoveredSlice(item.id)}
                onMouseLeave={() => setHoveredSlice(null)}
                onClick={() => setSelectedSeverity(selectedSeverity === item.id ? null : item.id)}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                  activeFocus === item.id
                    ? 'bg-white dark:bg-slate-800 shadow-xs ring-1 ring-slate-300 dark:ring-slate-600'
                    : 'opacity-85 hover:opacity-100'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span>{item.label}</span>
                <span className="text-slate-400 dark:text-slate-500 font-normal">
                  ({item.count})
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Severity Cards with Explicit Action Directives */}
        <div className="lg:col-span-7 space-y-2.5">
          {severityItems.map((item) => {
            const isFocused = activeFocus === item.id;
            return (
              <div
                key={item.id}
                id={`severity-card-${item.id.toLowerCase()}`}
                onMouseEnter={() => setHoveredSlice(item.id)}
                onMouseLeave={() => setHoveredSlice(null)}
                onClick={() => setSelectedSeverity(selectedSeverity === item.id ? null : item.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  item.bgLight
                } ${item.bgDark} ${item.borderLight} ${item.borderDark} ${
                  isFocused
                    ? 'ring-2 ring-offset-1 shadow-md scale-[1.01]'
                    : 'hover:shadow-xs'
                }`}
                style={
                  isFocused
                    ? { outlineColor: item.color, ringColor: item.color }
                    : undefined
                }
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left info */}
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wide">
                        {item.icon}
                        <span style={{ color: item.color }}>{item.label}</span>
                      </div>

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800 shadow-xs">
                        {item.sla}
                      </span>
                    </div>

                    {/* Primary Action Message requested by user */}
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <ArrowRight
                        className="w-3.5 h-3.5 shrink-0"
                        style={{ color: item.color }}
                      />
                      <p className="text-xs sm:text-sm font-extrabold text-[#38303B] dark:text-slate-100 leading-snug">
                        {item.actionMessage}
                      </p>
                    </div>

                    {/* Subtitle / Professional Recommendation */}
                    <p className="text-[11px] text-[#6B5F70] dark:text-slate-400 pl-5 leading-tight">
                      {item.subMessage}
                    </p>
                  </div>

                  {/* Right: Big Metric & Percentage */}
                  <div className="text-right shrink-0 pl-2">
                    <div className="flex items-baseline justify-end gap-1">
                      <span
                        className="text-2xl font-black leading-none"
                        style={{ color: item.color }}
                      >
                        {item.count}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {total > 0 ? `${item.percentage}%` : '0%'}
                      </span>
                    </div>
                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block mt-0.5">
                      {item.count === 1 ? 'hallazgo' : 'hallazgos'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
