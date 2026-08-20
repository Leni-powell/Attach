import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Download,
  Shield,
  CheckSquare,
  Leaf,
  Cog,
  Layers,
  FileText
} from 'lucide-react';
import { Inspection, InspectionType } from '../types';
import { AttachEmblem } from './AttachLogo';
import {
  generateInspectionPdf,
  generateConsolidatedInspectionPdf,
  openReportInNewTab,
  printInspectionReport
} from '../utils/pdfExport';

interface ReportExportModalProps {
  inspection: Inspection | null;
  inspectionsList?: Inspection[];
  isOpen: boolean;
  onClose: () => void;
  onDownloadCsv: (inspections: Inspection[]) => void;
}

export const ReportExportModal: React.FC<ReportExportModalProps> = ({
  inspection,
  inspectionsList = [],
  isOpen,
  onClose,
  onDownloadCsv
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [downloadInfo, setDownloadInfo] = useState<{
    fileName: string;
    blobUrl: string;
    dataUrl: string;
  } | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  
  // Selection mode: default to 'consolidated' or inspection if single was explicitly clicked
  const [selectedMode, setSelectedMode] = useState<'consolidated' | string>('consolidated');

  // Sync mode when modal opens or inspection prop changes
  useEffect(() => {
    if (isOpen) {
      if (inspection && inspection.id) {
        setSelectedMode(inspection.id);
      } else {
        setSelectedMode('consolidated');
      }
      setDownloadInfo(null);
      setStatusMessage(null);
    }
  }, [inspection, isOpen]);

  // Clean up created blob URL when closing modal
  useEffect(() => {
    return () => {
      if (downloadInfo?.blobUrl) {
        window.URL.revokeObjectURL(downloadInfo.blobUrl);
      }
    };
  }, [downloadInfo]);

  if (!isOpen) return null;

  const currentIndividual =
    selectedMode === 'consolidated'
      ? null
      : inspectionsList.find((i) => i.id === selectedMode) || inspection;

  const isConsolidated = selectedMode === 'consolidated' || (!inspection && !currentIndividual);

  // Global KPIs calculation for consolidated preview
  const totalInspections = inspectionsList.length;
  const completedInspections = inspectionsList.filter((i) => i.status === 'completada').length;
  const pendingInspections = inspectionsList.filter((i) => i.status === 'pendiente').length;
  const expiredInspections = inspectionsList.filter((i) => i.status === 'vencida').length;

  let totalChecks = 0;
  let completedChecks = 0;
  let allFindingsCount = 0;
  let criticalHighFindings = 0;

  inspectionsList.forEach((insp) => {
    totalChecks += insp.checklist.length;
    completedChecks += insp.checklist.filter((c) => c.completed).length;
    allFindingsCount += insp.findings.length;
    insp.findings.forEach((f) => {
      if (f.severity === 'Crítica' || f.severity === 'Alta') {
        criticalHighFindings++;
      }
    });
  });

  const globalCompliancePct =
    totalChecks > 0 ? Math.round((completedChecks / totalChecks) * 100) : 100;

  const categories: { key: InspectionType; label: string; icon: React.ComponentType<{ className?: string }>; colorClass: string; bgClass: string; badgeClass: string }[] = [
    {
      key: 'Seguridad',
      label: 'Seguridad Ocupacional',
      icon: Shield,
      colorClass: 'text-[#5C788A] dark:text-[#9EB0BE]',
      bgClass: 'bg-[#F0F4F8] dark:bg-[#1E262C] border-[#BCD1DE] dark:border-[#3E4D59]',
      badgeClass: 'bg-[#7C92A0] text-white'
    },
    {
      key: 'Calidad',
      label: 'Aseguramiento de Calidad',
      icon: CheckSquare,
      colorClass: 'text-[#6F5F75] dark:text-[#B2A2B7]',
      bgClass: 'bg-[#F5F2F7] dark:bg-[#251F29] border-[#C2B3C7] dark:border-[#4B3E52]',
      badgeClass: 'bg-[#87778C] text-white'
    },
    {
      key: 'Medio Ambiente',
      label: 'Medio Ambiente / Ambiental',
      icon: Leaf,
      colorClass: 'text-[#946755] dark:text-[#E5BEA6]',
      bgClass: 'bg-[#FAF5F0] dark:bg-[#2B231F] border-[#ECCFBE] dark:border-[#54433B]',
      badgeClass: 'bg-[#BD9F8D] text-white'
    },
    {
      key: 'Operacional',
      label: 'Control Operacional',
      icon: Cog,
      colorClass: 'text-[#965868] dark:text-[#D4A2B0]',
      bgClass: 'bg-[#FAF2F4] dark:bg-[#2B1E23] border-[#F1DDE1] dark:border-[#523842]',
      badgeClass: 'bg-[#B08694] text-white'
    }
  ];

  // Unified automatic PDF generator and downloader
  const handleGenerateAndDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      setStatusMessage('Generando PDF oficial...');

      let result;
      if (isConsolidated) {
        result = await generateConsolidatedInspectionPdf(inspectionsList);
      } else if (currentIndividual) {
        result = await generateInspectionPdf(currentIndividual);
      } else {
        result = await generateConsolidatedInspectionPdf(inspectionsList);
      }

      const blobUrl = window.URL.createObjectURL(result.blob);

      setDownloadInfo({
        fileName: result.fileName,
        blobUrl,
        dataUrl: result.dataUrl
      });

      setStatusMessage('¡Descarga iniciada! Si tu navegador la bloqueó, usa el botón de guardar.');
    } catch (err) {
      console.error('Error generating PDF:', err);
      setStatusMessage('Error generando PDF. Puedes abrirlo en una nueva pestaña.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Open clean report in new tab for native printing
  const handleOpenInNewTab = () => {
    if (isConsolidated) {
      openReportInNewTab(inspectionsList);
    } else if (currentIndividual) {
      openReportInNewTab(currentIndividual);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in print:p-0 print:bg-white">
      <div
        id="modal-report-export"
        className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 shadow-2xl max-h-[92vh] flex flex-col border border-slate-200 dark:border-slate-800 print:max-h-none print:shadow-none print:border-none print:p-0 print:bg-white"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E5DFDC] dark:border-slate-800 print:hidden shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#F0F4F8] dark:bg-[#1E262C] text-[#5C788A] dark:text-[#9EB0BE] flex items-center justify-center shadow-xs">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#38303B] dark:text-slate-100">
                {isConsolidated
                  ? 'Informe Consolidado Oficial (4 Especialidades)'
                  : `Ficha Técnica: ${currentIndividual?.type} - Folio ${currentIndividual?.id}`}
              </h3>
              <p className="text-xs text-[#87778C] dark:text-slate-400">Attach • Reportabilidad inteligente • Documento Certificado</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Quick direct download button right in the header for instant access */}
            <button
              type="button"
              id="btn-header-quick-pdf"
              onClick={handleGenerateAndDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-3 sm:px-4 py-2 bg-[#CC8B79] hover:bg-[#B87A69] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer disabled:opacity-75"
              title="Descargar archivo PDF"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">{isGeneratingPdf ? 'Generando...' : 'Descargar PDF'}</span>
              <span className="sm:hidden">{isGeneratingPdf ? '...' : 'PDF'}</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-[#F5F2F0] dark:hover:bg-slate-800 flex items-center justify-center text-[#87778C] hover:text-[#38303B] cursor-pointer"
              aria-label="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mode Selector Tabs (Consolidated vs Individual) */}
        {inspectionsList.length > 1 && (
          <div className="flex items-center gap-2 pt-3 pb-1 border-b border-[#E5DFDC] dark:border-slate-800/80 overflow-x-auto print:hidden shrink-0">
            <button
              type="button"
              onClick={() => setSelectedMode('consolidated')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                isConsolidated
                  ? 'bg-[#5E5365] text-white shadow-xs'
                  : 'bg-[#F2EDEA] dark:bg-slate-800 text-[#6B5F70] dark:text-slate-300 hover:bg-[#EAE4E0]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Consolidado Global ({inspectionsList.length} Auditorías)</span>
            </button>

            {inspectionsList.map((insp) => (
              <button
                key={insp.id}
                type="button"
                onClick={() => setSelectedMode(insp.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all whitespace-nowrap cursor-pointer ${
                  selectedMode === insp.id
                    ? 'bg-[#CC8B79] text-white font-bold shadow-xs'
                    : 'bg-[#F2EDEA] dark:bg-slate-800 text-[#6B5F70] dark:text-slate-300 hover:bg-[#EAE4E0]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{insp.id} ({insp.type})</span>
              </button>
            ))}
          </div>
        )}

        {/* Status Notification Banner if download ready */}
        {downloadInfo && (
          <div className="mt-3 p-3 rounded-xl bg-[#FAF5F0] dark:bg-[#2B231F] border border-[#ECCFBE] dark:border-[#54433B] flex flex-wrap items-center justify-between gap-2 text-xs text-[#6B5F70] dark:text-[#E5BEA6] shrink-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#CC8B79] shrink-0" />
              <span>
                <strong>PDF Listo:</strong> {downloadInfo.fileName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={downloadInfo.blobUrl}
                download={downloadInfo.fileName}
                className="px-3 py-1.5 rounded-lg bg-[#CC8B79] hover:bg-[#B87A69] text-white font-bold inline-flex items-center gap-1.5 transition-all shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Clic para Guardar</span>
              </a>
              <button
                type="button"
                onClick={handleOpenInNewTab}
                className="px-2.5 py-1.5 rounded-lg border border-[#ECCFBE] dark:border-[#54433B] hover:bg-[#F2E5D8] dark:hover:bg-[#3D302A] font-bold inline-flex items-center gap-1 text-[#6B5F70] dark:text-slate-200"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Abrir</span>
              </button>
            </div>
          </div>
        )}

        {/* Printable Report Document Area */}
        <div className="flex-1 overflow-y-auto pr-1 py-3.5 text-slate-900 dark:text-slate-100 print:overflow-visible print:p-0 print:text-black">
          {isConsolidated ? (
            /* CONSOLIDATED VIEW PREVIEW */
            <div
              id="printable-consolidated-document"
              className="space-y-4 bg-[#FAF8F7] dark:bg-slate-950/50 p-4 sm:p-5 rounded-2xl border border-[#E5DFDC] dark:border-slate-800 print:bg-white print:border-none print:p-0"
            >
              {/* Document Header */}
              <div className="flex items-start justify-between border-b-2 border-[#5E5365] pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center p-1 border border-slate-200 dark:border-slate-800 shadow-xs">
                    <AttachEmblem size={30} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black text-[#5E5365] dark:text-[#B2A2B7] tracking-tight">ATTACH</span>
                      <span className="text-[10px] font-bold uppercase bg-[#CC8B79] text-white px-2 py-0.5 rounded">
                        REPORTABILIDAD INTELIGENTE
                      </span>
                    </div>
                    <h1 className="text-sm sm:text-base font-extrabold mt-0.5 text-[#38303B] dark:text-slate-100">
                      INFORME CONSOLIDADO: SEGURIDAD, CALIDAD, AMBIENTAL Y OPERACIONES
                    </h1>
                  </div>
                </div>
                <div className="text-right text-xs text-[#87778C]">
                  <p className="font-mono font-bold text-[#5E5365] dark:text-[#B2A2B7]">TOTAL: {totalInspections} AUDITORÍAS</p>
                  <p>Fecha Emisión: {new Date().toLocaleDateString('es-CL')}</p>
                </div>
              </div>

              {/* KPI Summary Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-white dark:bg-slate-900 p-3 rounded-xl border border-[#E5DFDC] dark:border-slate-800 text-xs">
                <div>
                  <span className="text-[#87778C] font-semibold block">Total Auditorías</span>
                  <span className="text-base font-black text-[#38303B] dark:text-slate-100">{totalInspections}</span>
                </div>
                <div>
                  <span className="text-[#87778C] font-semibold block">Completadas</span>
                  <span className="text-base font-black text-[#5C788A] dark:text-[#9EB0BE]">{completedInspections}</span>
                </div>
                <div>
                  <span className="text-[#87778C] font-semibold block">Cumplimiento Global</span>
                  <span className="text-base font-black text-[#5E5365] dark:text-[#B2A2B7]">{globalCompliancePct}%</span>
                </div>
                <div>
                  <span className="text-[#87778C] font-semibold block">Total Hallazgos</span>
                  <span className="text-base font-black text-[#B08694] dark:text-[#D4A2B0]">{allFindingsCount}</span>
                </div>
              </div>

              {/* Detailed Breakdown for each of the 4 categories */}
              <div className="space-y-4">
                {categories.map((cat, idx) => {
                  const catList = inspectionsList.filter((i) => i.type === cat.key);
                  const Icon = cat.icon;

                  let catTotalChecks = 0;
                  let catDoneChecks = 0;
                  let catFindings = 0;

                  catList.forEach((i) => {
                    catTotalChecks += i.checklist.length;
                    catDoneChecks += i.checklist.filter((c) => c.completed).length;
                    catFindings += i.findings.length;
                  });

                  const catPct =
                    catTotalChecks > 0 ? Math.round((catDoneChecks / catTotalChecks) * 100) : 100;

                  return (
                    <div
                      key={cat.key}
                      className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-[#E5DFDC] dark:border-slate-800 space-y-2.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between pb-1.5 border-b border-[#EFEBE8] dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${cat.colorClass}`} />
                          <h4 className={`text-xs font-black uppercase tracking-wider ${cat.colorClass}`}>
                            {idx + 1}. {cat.label} ({catList.length})
                          </h4>
                        </div>
                        <span className="text-[11px] font-bold text-[#87778C]">
                          Cumplimiento: <strong className="text-[#38303B] dark:text-slate-200">{catPct}%</strong> • Hallazgos: <strong className="text-[#B08694]">{catFindings}</strong>
                        </span>
                      </div>

                      {catList.length === 0 ? (
                        <p className="text-xs text-[#87778C] italic py-1">
                          No se registran auditorías en esta categoría.
                        </p>
                      ) : (
                        <div className="space-y-2 text-xs">
                          {catList.map((insp) => {
                            const done = insp.checklist.filter((c) => c.completed).length;
                            const total = insp.checklist.length;
                            const pct = total > 0 ? Math.round((done / total) * 100) : 100;

                            return (
                              <div
                                key={insp.id}
                                className="p-2.5 rounded-lg bg-[#FAF8F7] dark:bg-slate-950/60 border border-[#E5DFDC] dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-[#5E5365] dark:text-[#B2A2B7]">
                                      {insp.id}
                                    </span>
                                    <span className="font-bold text-[#38303B] dark:text-slate-200">
                                      {insp.company}
                                    </span>
                                    <span className="text-[#ABA5A9]">•</span>
                                    <span className="text-[#6B5F70] dark:text-slate-400">{insp.faena}</span>
                                  </div>
                                  <div className="text-[11px] text-[#87778C]">
                                    Ubicación: {insp.location} • Fecha: {insp.date} • {insp.findings.length} hallazgos
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 self-start sm:self-center">
                                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#EFEAE6] dark:bg-slate-800 text-[#5E5365] dark:text-slate-300">
                                    {done}/{total} ({pct}%)
                                  </span>
                                  <span
                                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                      insp.status === 'completada'
                                        ? 'bg-[#E3E5F3] text-[#5E5365] dark:bg-slate-800 dark:text-[#B2A2B7]'
                                        : 'bg-[#FAF5F0] text-[#946755] dark:bg-[#2B231F] dark:text-[#E5BEA6]'
                                    }`}
                                  >
                                    {insp.status}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Master Findings Section */}
              <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-[#E5DFDC] dark:border-slate-800 space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#B08694] flex items-center justify-between border-b border-[#EFEBE8] pb-1">
                  <span>Matriz Consolidada de Hallazgos y Acciones Correctivas</span>
                  <span className="text-[11px] font-bold text-[#87778C]">{allFindingsCount} hallazgos totales</span>
                </h4>
                {allFindingsCount === 0 ? (
                  <p className="text-xs text-[#87778C] italic">No existen hallazgos críticos registrados.</p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {inspectionsList.flatMap((insp) =>
                      insp.findings.map((f) => (
                        <div
                          key={`${insp.id}-${f.id}`}
                          className="p-2 rounded bg-[#FAF8F7] dark:bg-slate-950/60 border border-[#E5DFDC] dark:border-slate-800 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-[#38303B] dark:text-slate-200 mr-2">{f.title}</span>
                            <span className="text-[10px] text-[#87778C] font-mono">[{insp.id} - {insp.type} - {insp.company}]</span>
                            {f.description && <p className="text-[11px] text-[#6B5F70] dark:text-slate-400 mt-0.5">{f.description}</p>}
                          </div>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                              f.severity === 'Crítica' || f.severity === 'Alta'
                                ? 'bg-[#F1DDE1] text-[#965868] dark:bg-[#3B222A] dark:text-[#F2C4C5]'
                                : 'bg-[#FAF5F0] text-[#946755] dark:bg-[#3B2E25] dark:text-[#ECCFBE]'
                            }`}
                          >
                            {f.severity}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Signatures & Certification Section */}
              <div className="pt-2 border-t border-[#E5DFDC] dark:border-slate-800 flex items-end justify-between text-xs text-[#87778C]">
                <div className="max-w-xs">
                  <p className="font-bold text-[#5E5365] dark:text-slate-300">Certificación y Validación Consolidada</p>
                  <p>Documento oficial emitido conforme a protocolos Attach • Reportabilidad inteligente de Seguridad, Calidad, Medio Ambiente y Operaciones.</p>
                </div>
                <div className="text-center">
                  <div className="w-44 border-b border-[#ABA5A9] h-8 flex items-center justify-center">
                    <span className="text-[11px] text-[#87778C] font-medium">Firma de Supervisión</span>
                  </div>
                  <p className="font-bold mt-1 text-[#38303B] dark:text-slate-200">Jefatura de Supervisión Attach</p>
                  <p className="text-[10px]">RUT: 15.489.321-K</p>
                </div>
              </div>
            </div>
          ) : (
            /* SINGLE INSPECTION PREVIEW */
            currentIndividual && (
              <div
                id="printable-inspection-document"
                className="space-y-4 bg-[#FAF8F7] dark:bg-slate-950/50 p-4 sm:p-5 rounded-2xl border border-[#E5DFDC] dark:border-slate-800 print:bg-white print:border-none print:p-0"
              >
                <div className="flex items-start justify-between border-b-2 border-[#5E5365] pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center p-1 border border-slate-200 dark:border-slate-800 shadow-xs">
                      <AttachEmblem size={30} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-[#5E5365] dark:text-[#B2A2B7] tracking-tight">ATTACH</span>
                        <span className="text-[10px] font-bold uppercase bg-[#CC8B79] text-white px-2 py-0.5 rounded">
                          REPORTABILIDAD INTELIGENTE
                        </span>
                      </div>
                      <h1 className="text-sm sm:text-base font-extrabold mt-0.5 text-[#38303B] dark:text-slate-100">
                        INFORME TÉCNICO DE INSPECCIÓN: {currentIndividual.type.toUpperCase()}
                      </h1>
                    </div>
                  </div>
                  <div className="text-right text-xs text-[#87778C]">
                    <p className="font-mono font-bold text-[#5E5365] dark:text-[#B2A2B7]">FOLIO: {currentIndividual.id}</p>
                    <p>Fecha: {currentIndividual.date}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-white dark:bg-slate-900 p-3 rounded-xl border border-[#E5DFDC] dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-[#87778C] font-semibold block">Empresa</span>
                    <span className="font-bold text-[#38303B] dark:text-white">{currentIndividual.company}</span>
                  </div>
                  <div>
                    <span className="text-[#87778C] font-semibold block">Faena / Obra</span>
                    <span className="font-bold text-[#38303B] dark:text-white">{currentIndividual.faena}</span>
                  </div>
                  <div>
                    <span className="text-[#87778C] font-semibold block">Ubicación</span>
                    <span className="font-bold text-[#38303B] dark:text-white">{currentIndividual.location}</span>
                  </div>
                  <div>
                    <span className="text-[#87778C] font-semibold block">Estado</span>
                    <span className="font-bold uppercase text-[#5E5365] dark:text-[#B2A2B7]">{currentIndividual.status}</span>
                  </div>
                </div>

                {/* Checklist Section */}
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#5E5365] dark:text-slate-300 mb-2 border-b border-[#EFEBE8] pb-1">
                    1. Pauta de Verificación y Checklist
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    {currentIndividual.checklist.map((item, idx) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-[#E5DFDC] dark:border-slate-800"
                      >
                        <span className="font-medium flex-1 text-[#38303B] dark:text-slate-200">
                          {idx + 1}. {item.text}
                        </span>
                        <span
                          className={`font-bold ml-2 px-2 py-0.5 rounded text-[11px] ${
                            item.completed
                              ? 'bg-[#E3E5F3] text-[#5E5365] dark:bg-slate-800 dark:text-[#B2A2B7]'
                              : 'bg-[#F1DDE1] text-[#965868] dark:bg-[#3B222A] dark:text-[#F2C4C5]'
                          }`}
                        >
                          {item.completed ? 'CUMPLE' : 'NO CUMPLE'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Findings */}
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#B08694] mb-2 border-b border-[#EFEBE8] pb-1">
                    2. Hallazgos y Medidas Correctivas ({currentIndividual.findings.length})
                  </h4>
                  {currentIndividual.findings.length === 0 ? (
                    <p className="text-xs text-[#87778C] italic">No se registraron hallazgos críticos.</p>
                  ) : (
                    <div className="space-y-2 text-xs">
                      {currentIndividual.findings.map((fnd) => (
                        <div
                          key={fnd.id}
                          className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-[#E5DFDC] dark:border-slate-800 space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#38303B] dark:text-white">{fnd.title}</span>
                            <span className="font-bold text-[#965868] bg-[#F1DDE1] dark:bg-rose-950/60 px-2 py-0.5 rounded text-[11px]">
                              {fnd.severity}
                            </span>
                          </div>
                          {fnd.description && <p className="text-[#6B5F70] dark:text-slate-300">{fnd.description}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Signature */}
                <div className="pt-2 border-t border-[#E5DFDC] dark:border-slate-800 flex items-end justify-between text-xs">
                  <div className="text-[#87778C] max-w-xs">
                    <p className="font-bold text-[#5E5365] dark:text-slate-300">Validación Técnica</p>
                    <p>Documento registrado en plataforma móvil Attach con trazabilidad criptográfica.</p>
                  </div>
                  <div className="text-center">
                    {currentIndividual.signature ? (
                      <div className="inline-block border-b-2 border-[#5E5365] dark:border-slate-300 pb-1">
                        <img
                          src={currentIndividual.signature.dataUrl}
                          alt="Firma supervisor"
                          className="h-14 w-40 object-contain mx-auto"
                        />
                      </div>
                    ) : (
                      <div className="w-40 h-14 border-b-2 border-dashed border-[#ABA5A9] flex items-center justify-center text-[#87778C]">
                        Pendiente de firma
                      </div>
                    )}
                    <p className="font-bold mt-1 text-[#38303B] dark:text-white">
                      {currentIndividual.signature?.supervisorName
                        ? currentIndividual.signature.supervisorName.replace(/iaptidud/gi, 'Attach')
                        : 'Supervisor Attach'}
                    </p>
                    <p className="text-[10px] text-[#87778C]">RUT: {currentIndividual.signature?.rut || '15.489.321-K'}</p>
                  </div>
                </div>
              </div>
            )
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-[#E5DFDC] dark:border-slate-800 print:hidden flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onDownloadCsv(inspectionsList.length ? inspectionsList : currentIndividual ? [currentIndividual] : [])}
              className="min-h-[48px] px-3.5 sm:px-4 py-2.5 rounded-xl border border-[#E5DFDC] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-[#FAF8F7] dark:hover:bg-slate-700 text-[#5E5365] dark:text-slate-200 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#5C788A]" />
              <span>Exportar CSV (Excel)</span>
            </button>

            <button
              type="button"
              onClick={handleOpenInNewTab}
              className="min-h-[48px] px-3.5 py-2.5 rounded-xl border border-[#E5DFDC] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-[#FAF8F7] dark:hover:bg-slate-700 text-[#6B5F70] dark:text-slate-200 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              title="Abrir reporte completo en nueva pestaña para imprimir o guardar"
            >
              <ExternalLink className="w-4 h-4 text-[#87778C]" />
              <span className="hidden sm:inline">Nueva Pestaña</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Imprimir / Guardar PDF Button */}
            <button
              type="button"
              id="btn-print-save-pdf"
              onClick={handleGenerateAndDownloadPdf}
              disabled={isGeneratingPdf}
              className="min-h-[48px] px-4 sm:px-5 py-2.5 rounded-xl bg-[#CC8B79] hover:bg-[#B87A69] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-75"
              title="Generar y descargar archivo PDF consolidado"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Printer className="w-4 h-4" />
              )}
              <span>
                {isGeneratingPdf
                  ? 'Generando PDF...'
                  : isConsolidated
                  ? 'Descargar PDF Consolidado'
                  : 'Imprimir / Guardar PDF'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
