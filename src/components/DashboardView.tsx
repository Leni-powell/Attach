import React from 'react';
import {
  Clock,
  ClipboardCheck,
  AlertOctagon,
  TrendingUp,
  Plus,
  ArrowRight,
  ShieldCheck,
  HardHat,
  Leaf,
  Cog,
  Calendar,
  MapPin,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Inspection, InspectionType } from '../types';
import { CompliancePieChart } from './CompliancePieChart';

interface DashboardViewProps {
  inspections: Inspection[];
  onSelectInspection: (inspection: Inspection) => void;
  onNewInspection: () => void;
  onNavigateToInspections: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  inspections,
  onSelectInspection,
  onNewInspection,
  onNavigateToInspections
}) => {
  // Compute summary stats
  const pending = inspections.filter((i) => i.status === 'pendiente');
  const completed = inspections.filter((i) => i.status === 'completada');
  const overdue = inspections.filter((i) => i.status === 'vencida');

  const total = inspections.length;
  const complianceRate = total > 0 ? ((completed.length / total) * 100).toFixed(1) : '100.0';

  // Acronym helper for specialty badges
  const getSpecialtyBadge = (type: InspectionType) => {
    switch (type) {
      case 'Seguridad':
        return {
          code: 'SEG',
          className: 'bg-blue-100 dark:bg-blue-950/70 text-[#0057B8] dark:text-blue-400'
        };
      case 'Calidad':
        return {
          code: 'CAL',
          className: 'bg-orange-100 dark:bg-orange-950/70 text-[#FF6B00]'
        };
      case 'Medio Ambiente':
        return {
          code: 'AMB',
          className: 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
        };
      case 'Operacional':
      default:
        return {
          code: 'OPE',
          className: 'bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300'
        };
    }
  };

  const getStatusPill = (status: string) => {
    switch (status) {
      case 'completada':
        return {
          label: 'Completada',
          pillClass: 'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300',
          barClass: 'bg-green-500'
        };
      case 'vencida':
        return {
          label: 'Vencida',
          pillClass: 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300',
          barClass: 'bg-red-500'
        };
      case 'pendiente':
      default:
        return {
          label: 'En Proceso',
          pillClass: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300',
          barClass: 'bg-[#0057B8]'
        };
    }
  };

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      {/* 4-Column Professional Polish Metric KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6">
        {/* 1. Pendientes */}
        <div
          id="kpi-card-pendientes"
          className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
        >
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium mb-1">
            Pendientes
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
              {String(pending.length).padStart(2, '0')}
            </span>
            <span className="text-xs text-orange-600 dark:text-orange-400 font-bold">
              ↑ {pending.length} hoy
            </span>
          </div>
        </div>

        {/* 2. Completadas */}
        <div
          id="kpi-card-completadas"
          className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
        >
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium mb-1">
            Completadas
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
              {completed.length}
            </span>
            <span className="text-xs text-green-600 dark:text-green-400 font-bold">
              +{completed.length} semana
            </span>
          </div>
        </div>

        {/* 3. Vencidas */}
        <div
          id="kpi-card-vencidas"
          className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
        >
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium mb-1">
            Vencidas
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-400">
              {String(overdue.length).padStart(2, '0')}
            </span>
            <span className="text-xs text-red-400 dark:text-red-400 font-medium">
              Revisión req.
            </span>
          </div>
        </div>

        {/* 4. Cumplimiento (Corporate Gradient Card) */}
        <div
          id="kpi-card-cumplimiento"
          className="bg-gradient-to-br from-[#5E5365] to-[#423947] dark:from-slate-900 dark:to-slate-950 text-white p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
        >
          <p className="text-purple-100 dark:text-slate-400 text-xs sm:text-sm font-medium mb-1">
            Cumplimiento
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold">
              {complianceRate}%
            </span>
            <span className="text-xs text-[#CC8B79] font-bold">
              {completed.length}/{total} listas
            </span>
          </div>
        </div>
      </div>

      {/* Global Compliance Pie / Donut Chart */}
      <CompliancePieChart
        completed={completed.length}
        pending={pending.length}
        overdue={overdue.length}
        complianceRate={parseFloat(complianceRate)}
      />

      {/* Action Banner / Quick Inspection Launch */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          Inspecciones en Terreno
        </h3>
        <button
          onClick={onNavigateToInspections}
          className="text-[#0057B8] dark:text-blue-400 font-bold text-sm cursor-pointer hover:underline flex items-center gap-1"
        >
          <span>Ver todas →</span>
        </button>
      </div>

      {/* Inspections in field list */}
      <div className="space-y-3">
        {inspections.map((insp) => {
          const spec = getSpecialtyBadge(insp.type);
          const statusMeta = getStatusPill(insp.status);
          const totalChk = insp.checklist.length;
          const doneChk = insp.checklist.filter((i) => i.completed).length;
          const pct = totalChk > 0 ? Math.round((doneChk / totalChk) * 100) : 0;

          return (
            <div
              key={insp.id}
              id={`inspection-card-${insp.id}`}
              onClick={() => onSelectInspection(insp)}
              className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm hover:border-[#0057B8] dark:hover:border-blue-500 transition-colors cursor-pointer active:scale-99"
            >
              {/* Left side: Specialty badge + Info */}
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 pr-2">
                <div
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 shadow-xs ${spec.className}`}
                >
                  {spec.code}
                </div>

                <div className="min-w-0">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base leading-tight truncate">
                    {insp.company}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {insp.faena} · {insp.location}
                  </p>
                </div>
              </div>

              {/* Right side: Status pill badge & slim progress bar */}
              <div className="flex flex-col items-end gap-2 shrink-0">
                <div
                  className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${statusMeta.pillClass}`}
                >
                  {statusMeta.label}
                </div>

                <div className="w-24 sm:w-32 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${statusMeta.barClass}`}
                    style={{ width: `${Math.max(pct, 8)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
