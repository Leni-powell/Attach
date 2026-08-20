import React from 'react';
import {
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Printer,
  TrendingUp,
  ShieldCheck,
  HardHat,
  Leaf,
  Cog,
  Download
} from 'lucide-react';
import { Inspection } from '../types';
import { CompliancePieChart } from './CompliancePieChart';

interface ReportsViewProps {
  inspections: Inspection[];
  onOpenReportModal: () => void;
  onDownloadCsv: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  inspections,
  onOpenReportModal,
  onDownloadCsv
}) => {
  const total = inspections.length;
  const completed = inspections.filter((i) => i.status === 'completada').length;
  const pending = inspections.filter((i) => i.status === 'pendiente').length;
  const overdue = inspections.filter((i) => i.status === 'vencida').length;

  const complianceRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Aggregate findings
  const allFindings = inspections.flatMap((i) => i.findings);
  const criticalFindings = allFindings.filter((f) => f.severity === 'Crítica').length;
  const highFindings = allFindings.filter((f) => f.severity === 'Alta').length;
  const mediumFindings = allFindings.filter((f) => f.severity === 'Media').length;
  const lowFindings = allFindings.filter((f) => f.severity === 'Baja').length;

  // Breakdown by type
  const typeCounts = {
    Seguridad: inspections.filter((i) => i.type === 'Seguridad').length,
    Calidad: inspections.filter((i) => i.type === 'Calidad').length,
    'Medio Ambiente': inspections.filter((i) => i.type === 'Medio Ambiente').length,
    Operacional: inspections.filter((i) => i.type === 'Operacional').length
  };

  return (
    <div className="space-y-5 pb-24 animate-fade-in">
      {/* Header Banner */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 p-5 sm:p-6 border border-[#E5DFDC] dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#38303B] dark:text-slate-100">
              Métricas & Cumplimiento Técnico
            </h2>
            <p className="text-xs sm:text-sm text-[#87778C] dark:text-slate-400">
              Estadísticas consolidadas de inspecciones y gestión de hallazgos.
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-[#F0F4F8] dark:bg-[#1E262C] text-[#5C788A] dark:text-[#9EB0BE] flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
        </div>

        {/* Global Compliance Pie Chart */}
        <CompliancePieChart
          completed={completed}
          pending={pending}
          overdue={overdue}
          complianceRate={complianceRate}
        />
      </div>

      {/* Breakdown by Type Grid */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#6B5F70] dark:text-slate-400">
          Distribución por Especialidad
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-[#BCD1DE] dark:border-[#3E4D59] shadow-xs">
            <div className="flex items-center gap-1.5 text-[#5C788A] dark:text-[#9EB0BE] mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-xs font-bold">Seguridad</span>
            </div>
            <span className="text-xl font-black text-[#38303B] dark:text-slate-100">{typeCounts.Seguridad}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-[#C2B3C7] dark:border-[#4B3E52] shadow-xs">
            <div className="flex items-center gap-1.5 text-[#6F5F75] dark:text-[#B2A2B7] mb-1">
              <HardHat className="w-4 h-4" />
              <span className="text-xs font-bold">Calidad</span>
            </div>
            <span className="text-xl font-black text-[#38303B] dark:text-slate-100">{typeCounts.Calidad}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-[#ECCFBE] dark:border-[#54433B] shadow-xs">
            <div className="flex items-center gap-1.5 text-[#946755] dark:text-[#E5BEA6] mb-1">
              <Leaf className="w-4 h-4" />
              <span className="text-xs font-bold">Ambiente</span>
            </div>
            <span className="text-xl font-black text-[#38303B] dark:text-slate-100">{typeCounts['Medio Ambiente']}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-[#F1DDE1] dark:border-[#523842] shadow-xs">
            <div className="flex items-center gap-1.5 text-[#965868] dark:text-[#D4A2B0] mb-1">
              <Cog className="w-4 h-4" />
              <span className="text-xs font-bold">Operacional</span>
            </div>
            <span className="text-xl font-black text-[#38303B] dark:text-slate-100">{typeCounts.Operacional}</span>
          </div>
        </div>
      </div>

      {/* Severity Matrix of Findings */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-[#E5DFDC] dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#38303B] dark:text-slate-300">
            Matriz de Severidad de Hallazgos ({allFindings.length})
          </h3>
          <span className="text-xs text-[#965868] font-bold">
            {criticalFindings + highFindings} prioridad alta
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="p-3 rounded-xl bg-[#FAF2F4] dark:bg-[#2B1E23] border border-[#F1DDE1] dark:border-[#523842]">
            <span className="text-[10px] font-bold uppercase text-[#965868] dark:text-[#D4A2B0] block">Crítica</span>
            <span className="text-xl font-black text-[#965868] dark:text-[#D4A2B0]">{criticalFindings}</span>
          </div>

          <div className="p-3 rounded-xl bg-[#FAF0EC] dark:bg-[#2C211E] border border-[#ECCFBE] dark:border-[#54433B]">
            <span className="text-[10px] font-bold uppercase text-[#CC8B79] dark:text-[#E5BEA6] block">Alta</span>
            <span className="text-xl font-black text-[#CC8B79] dark:text-[#E5BEA6]">{highFindings}</span>
          </div>

          <div className="p-3 rounded-xl bg-[#FAF5F0] dark:bg-[#2B231F] border border-[#ECCFBE] dark:border-[#54433B]">
            <span className="text-[10px] font-bold uppercase text-[#BD9F8D] dark:text-[#D9C4B8] block">Media</span>
            <span className="text-xl font-black text-[#BD9F8D] dark:text-[#D9C4B8]">{mediumFindings}</span>
          </div>

          <div className="p-3 rounded-xl bg-[#F0F4F8] dark:bg-[#1E262C] border border-[#BCD1DE] dark:border-[#3E4D59]">
            <span className="text-[10px] font-bold uppercase text-[#5C788A] dark:text-[#9EB0BE] block">Baja</span>
            <span className="text-xl font-black text-[#5C788A] dark:text-[#9EB0BE]">{lowFindings}</span>
          </div>
        </div>
      </div>

      {/* Export Action Card (min 56px touch height) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#38303B] text-white shadow-xl space-y-4 border border-[#4E4352]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-[#CC8B79] text-white text-[10px] font-black uppercase tracking-wider">
              Consolidado Multi-Área
            </span>
            <span className="text-xs text-[#C5BDC7] font-medium">4 Especialidades</span>
          </div>
          <h3 className="text-base font-bold text-white">Informe Consolidado Oficial (Seguridad, Calidad, Ambiental, Operacional)</h3>
          <p className="text-xs text-[#DDD6DE] mt-0.5">
            Genera y descarga el informe unificado con todas las auditorías en terreno, métricas de cumplimiento, desglose por especialidad y matriz de hallazgos.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={onDownloadCsv}
            className="min-h-[56px] px-4 py-3 bg-[#5C788A] hover:bg-[#4D6778] text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md cursor-pointer"
          >
            <FileSpreadsheet className="w-5 h-5" />
            <span>Descargar CSV (Excel)</span>
          </button>

          <button
            id="btn-generate-consolidated-pdf"
            onClick={onOpenReportModal}
            className="min-h-[56px] px-4 py-3 bg-[#CC8B79] hover:bg-[#B87A69] text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md cursor-pointer"
          >
            <Printer className="w-5 h-5" />
            <span>Generar Informe Consolidado PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
