import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  Calendar,
  MapPin,
  AlertTriangle,
  Image as ImageIcon,
  ChevronRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { Inspection, InspectionStatus, InspectionType } from '../types';

interface InspectionsListViewProps {
  inspections: Inspection[];
  onSelectInspection: (inspection: Inspection) => void;
  onNewInspection: () => void;
  onUpdateInspection?: (inspection: Inspection) => void;
  initialSearchQuery?: string;
}

export const InspectionsListView: React.FC<InspectionsListViewProps> = ({
  inspections,
  onSelectInspection,
  onNewInspection,
  onUpdateInspection,
  initialSearchQuery = ''
}) => {
  const [searchTerm, setSearchTerm] = useState(initialSearchQuery);
  const [statusFilter, setStatusFilter] = useState<'todas' | InspectionStatus>('todas');
  const [typeFilter, setTypeFilter] = useState<'todos' | InspectionType>('todos');

  // Sync when initialSearchQuery changes
  React.useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchTerm(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  const filteredInspections = useMemo(() => {
    return inspections.filter((insp) => {
      // Status filter
      if (statusFilter !== 'todas' && insp.status !== statusFilter) {
        return false;
      }
      // Type filter
      if (typeFilter !== 'todos' && insp.type !== typeFilter) {
        return false;
      }
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesCompany = insp.company.toLowerCase().includes(query);
        const matchesFaena = insp.faena.toLowerCase().includes(query);
        const matchesLocation = insp.location.toLowerCase().includes(query);
        const matchesType = insp.type.toLowerCase().includes(query);
        if (!matchesCompany && !matchesFaena && !matchesLocation && !matchesType) {
          return false;
        }
      }
      return true;
    });
  }, [inspections, statusFilter, typeFilter, searchTerm]);

  const getSpecialtyBadge = (type: InspectionType) => {
    switch (type) {
      case 'Seguridad':
        return {
          code: 'SEG',
          className: 'bg-[#F0F4F8] dark:bg-[#1E262C] text-[#5C788A] dark:text-[#9EB0BE] border border-[#BCD1DE] dark:border-[#3E4D59]'
        };
      case 'Calidad':
        return {
          code: 'CAL',
          className: 'bg-[#FAF8F9] dark:bg-[#251E28] text-[#6F5F75] dark:text-[#B2A2B7] border border-[#C2B3C7] dark:border-[#4B3E52]'
        };
      case 'Medio Ambiente':
        return {
          code: 'AMB',
          className: 'bg-[#FAF5F0] dark:bg-[#2B231F] text-[#946755] dark:text-[#E5BEA6] border border-[#ECCFBE] dark:border-[#54433B]'
        };
      case 'Operacional':
      default:
        return {
          code: 'OPE',
          className: 'bg-[#FAF2F4] dark:bg-[#2B1E23] text-[#965868] dark:text-[#D4A2B0] border border-[#F1DDE1] dark:border-[#523842]'
        };
    }
  };

  const getStatusPill = (status: string) => {
    switch (status) {
      case 'completada':
        return {
          label: 'Completada',
          pillClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
          barClass: 'bg-[#5E5365]'
        };
      case 'vencida':
        return {
          label: 'Vencida',
          pillClass: 'bg-rose-50 dark:bg-rose-950/60 text-[#965868] dark:text-[#D4A2B0] border border-[#F1DDE1] dark:border-[#523842]',
          barClass: 'bg-[#965868]'
        };
      case 'pendiente':
      default:
        return {
          label: 'En Proceso',
          pillClass: 'bg-[#FAF0EC] dark:bg-[#2C211E] text-[#CC8B79] dark:text-[#E5BEA6] border border-[#ECCFBE] dark:border-[#54433B]',
          barClass: 'bg-[#CC8B79]'
        };
    }
  };

  return (
    <div className="space-y-4 pb-24 animate-fade-in">
      {/* Search and Filter Bar */}
      <div className="space-y-2.5">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por empresa, faena, sector o tipo..."
            className="w-full min-h-[48px] pl-11 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#5E5365] shadow-xs"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-3 text-xs font-bold text-slate-400 hover:text-slate-600 p-1"
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Status Filter Tabs (Todas, Pendientes, Completadas, Vencidas) */}
        <div className="grid grid-cols-4 gap-1.5 bg-slate-200/80 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-bold">
          {(
            [
              { id: 'todas', label: 'Todas' },
              { id: 'pendiente', label: 'Pendientes' },
              { id: 'completada', label: 'Completas' },
              { id: 'vencida', label: 'Vencidas' }
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`min-h-[38px] py-1.5 rounded-lg transition-all text-center truncate cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-white dark:bg-slate-900 text-[#5E5365] dark:text-[#CC8B79] shadow-xs font-extrabold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Type Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            onClick={() => setTypeFilter('todos')}
            className={`min-h-[34px] px-3 py-1 rounded-full whitespace-nowrap font-bold transition-all cursor-pointer ${
              typeFilter === 'todos'
                ? 'bg-[#5E5365] text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
            }`}
          >
            Todos los Tipos
          </button>
          {(['Seguridad', 'Calidad', 'Medio Ambiente', 'Operacional'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`min-h-[34px] px-3 py-1 rounded-full whitespace-nowrap font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                typeFilter === t
                  ? 'bg-[#5E5365] text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
              }`}
            >
              <span>{t}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium px-1">
        <span>Mostrando {filteredInspections.length} de {inspections.length} inspecciones</span>
        {(statusFilter !== 'todas' || typeFilter !== 'todos' || searchTerm) && (
          <button
            onClick={() => {
              setStatusFilter('todas');
              setTypeFilter('todos');
              setSearchTerm('');
            }}
            className="text-[#5E5365] dark:text-[#CC8B79] font-bold hover:underline cursor-pointer"
          >
            Restablecer filtros
          </button>
        )}
      </div>

      {/* Inspections List */}
      {filteredInspections.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Filter className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">
              No se encontraron inspecciones
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Pruebe cambiando los filtros de búsqueda o registre una nueva inspección en terreno.
            </p>
          </div>
          <button
            onClick={onNewInspection}
            className="min-h-[48px] px-4 py-2 bg-[#CC8B79] hover:bg-[#B87A69] text-white rounded-xl text-xs font-bold shadow-md inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Inspección</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInspections.map((insp) => {
            const spec = getSpecialtyBadge(insp.type);
            const statusMeta = getStatusPill(insp.status);
            const chk = Array.isArray(insp.checklist) ? insp.checklist : [];
            const findings = Array.isArray(insp.findings) ? insp.findings : [];
            const evidences = Array.isArray(insp.evidences) ? insp.evidences : [];
            const total = chk.length;
            const done = chk.filter((i) => i.completed).length;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;

            return (
              <div
                key={insp.id}
                id={`inspection-item-${insp.id}`}
                onClick={() => onSelectInspection(insp)}
                className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#5E5365] dark:hover:border-[#CC8B79] shadow-sm transition-all cursor-pointer active:scale-99"
              >
                {/* Header info matching the Professional Polish item style */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 shadow-xs ${spec.className}`}
                    >
                      {spec.code}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-tight truncate">
                        {insp.company}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {insp.faena} · {insp.location}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        if (onUpdateInspection) {
                          e.stopPropagation();
                          const newStatus: InspectionStatus = insp.status === 'completada' ? 'pendiente' : 'completada';
                          const updatedChecklist = newStatus === 'completada'
                            ? insp.checklist.map((i) => ({ ...i, completed: true }))
                            : insp.checklist;
                          onUpdateInspection({
                            ...insp,
                            checklist: updatedChecklist,
                            status: newStatus,
                            updatedAt: new Date().toISOString()
                          });
                        }
                      }}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all hover:opacity-85 active:scale-95 cursor-pointer flex items-center gap-1 ${statusMeta.pillClass}`}
                      title={insp.status === 'completada' ? 'Completada (Clic para reabrir)' : 'Clic para marcar como Realizada / Completada'}
                    >
                      {insp.status === 'completada' && <CheckCircle2 className="w-3 h-3" />}
                      <span>{statusMeta.label}</span>
                    </button>
                    <div className="w-24 sm:w-28 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${statusMeta.barClass}`}
                        style={{ width: `${Math.max(pct, 8)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Badges footer: findings, evidences count, date, detail link */}
                <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                  <div className="flex items-center gap-2">
                    {/* Findings count */}
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                        findings.length > 0
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold'
                          : 'text-slate-400'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>
                        {findings.length} {findings.length === 1 ? 'hallazgo' : 'hallazgos'}
                      </span>
                    </span>

                    {/* Evidences count */}
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold text-[11px] text-slate-500 dark:text-slate-400">
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>{evidences.length} fotos</span>
                    </span>

                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-400">
                      <Calendar className="w-3 h-3" />
                      <span>{insp.date}</span>
                    </span>

                    {(insp.createdByName || insp.createdByEmail) && (
                      <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium truncate max-w-[120px]">
                        {insp.createdByName || insp.createdByEmail}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-[#5E5365] dark:text-[#CC8B79] text-xs font-bold">
                    <span>Ver detalle</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
