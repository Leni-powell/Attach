import React, { useState } from 'react';
import {
  X,
  Calendar,
  Building2,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit2,
  Share2,
  Printer,
  ShieldCheck,
  HardHat,
  Leaf,
  Cog,
  Eye
} from 'lucide-react';
import { ChecklistItem, Evidence, Finding, Inspection, InspectionStatus, UserSession } from '../types';
import { SignatureCanvas } from './SignatureCanvas';
import { FindingModal } from './FindingModal';
import { EvidenceModal } from './EvidenceModal';
import { generateId } from '../utils/storage';

interface InspectionDetailModalProps {
  inspection: Inspection;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updated: Inspection) => void;
  onDelete?: (id: string) => void;
  onExportReport: (inspection: Inspection) => void;
  currentUser?: UserSession;
}

export const InspectionDetailModal: React.FC<InspectionDetailModalProps> = ({
  inspection,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onExportReport,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<'checklist' | 'findings' | 'evidences' | 'signature'>('checklist');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [newItemText, setNewItemText] = useState('');
  
  // Submodals
  const [isFindingModalOpen, setIsFindingModalOpen] = useState(false);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculate checklist progress
  const totalItems = inspection.checklist.length;
  const completedItems = inspection.checklist.filter((i) => i.completed).length;
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Helper to mark inspection completely as done / realizada (moves to completadas)
  const handleMarkAsCompleted = () => {
    const updatedChecklist = inspection.checklist.map((item) => ({
      ...item,
      completed: true
    }));
    onUpdate({
      ...inspection,
      checklist: updatedChecklist,
      status: 'completada',
      updatedAt: new Date().toISOString()
    });
  };

  // Helper to change status directly (completada, pendiente, vencida)
  const handleChangeStatus = (newStatus: InspectionStatus) => {
    let updatedChecklist = inspection.checklist;
    if (newStatus === 'completada' && inspection.checklist.some((i) => !i.completed)) {
      updatedChecklist = inspection.checklist.map((i) => ({ ...i, completed: true }));
    }
    onUpdate({
      ...inspection,
      checklist: updatedChecklist,
      status: newStatus,
      updatedAt: new Date().toISOString()
    });
  };

  // Helper to toggle all items at once
  const handleToggleAllChecklist = (allDone: boolean) => {
    const updatedChecklist = inspection.checklist.map((item) => ({
      ...item,
      completed: allDone
    }));
    onUpdate({
      ...inspection,
      checklist: updatedChecklist,
      status: allDone ? 'completada' : 'pendiente',
      updatedAt: new Date().toISOString()
    });
  };

  // Helper to update inspection and auto-adjust status if all items are completed
  const handleToggleChecklist = (id: string) => {
    const updatedChecklist = inspection.checklist.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    const allChecked =
      updatedChecklist.length > 0 && updatedChecklist.every((i) => i.completed);
    
    const newStatus: InspectionStatus = allChecked
      ? 'completada'
      : inspection.status === 'completada'
      ? 'pendiente'
      : inspection.status;

    onUpdate({
      ...inspection,
      checklist: updatedChecklist,
      status: newStatus,
      updatedAt: new Date().toISOString()
    });
  };

  const handleStartEditItem = (item: ChecklistItem) => {
    setEditingItemId(item.id);
    setEditingText(item.text);
  };

  const handleSaveEditItem = () => {
    if (!editingItemId || !editingText.trim()) return;
    const updatedChecklist = inspection.checklist.map((item) =>
      item.id === editingItemId ? { ...item, text: editingText.trim() } : item
    );
    onUpdate({
      ...inspection,
      checklist: updatedChecklist,
      updatedAt: new Date().toISOString()
    });
    setEditingItemId(null);
    setEditingText('');
  };

  const handleDeleteItem = (id: string) => {
    const updatedChecklist = inspection.checklist.filter((item) => item.id !== id);
    onUpdate({
      ...inspection,
      checklist: updatedChecklist,
      updatedAt: new Date().toISOString()
    });
  };

  const handleAddChecklistItem = () => {
    if (!newItemText.trim()) return;
    const newItem: ChecklistItem = {
      id: generateId('chk'),
      text: newItemText.trim(),
      completed: false
    };
    onUpdate({
      ...inspection,
      checklist: [...inspection.checklist, newItem],
      updatedAt: new Date().toISOString()
    });
    setNewItemText('');
  };

  // Finding Handlers
  const handleAddFinding = (newFinding: Finding) => {
    onUpdate({
      ...inspection,
      findings: [...inspection.findings, newFinding],
      updatedAt: new Date().toISOString()
    });
  };

  const handleDeleteFinding = (findingId: string) => {
    onUpdate({
      ...inspection,
      findings: inspection.findings.filter((f) => f.id !== findingId),
      updatedAt: new Date().toISOString()
    });
  };

  // Evidence Handlers
  const handleAddEvidence = (newEvidence: Evidence) => {
    onUpdate({
      ...inspection,
      evidences: [...inspection.evidences, newEvidence],
      updatedAt: new Date().toISOString()
    });
  };

  const handleDeleteEvidence = (evidenceId: string) => {
    onUpdate({
      ...inspection,
      evidences: inspection.evidences.filter((e) => e.id !== evidenceId),
      updatedAt: new Date().toISOString()
    });
  };

  // Signature Handler - Completes the inspection when signed
  const handleSaveSignature = (dataUrl: string) => {
    // Complete checklist points and finalize status as completada upon signing
    const updatedChecklist = inspection.checklist.map((i) => ({ ...i, completed: true }));
    const signerName = currentUser?.name || 'Supervisor Attach';

    onUpdate({
      ...inspection,
      checklist: updatedChecklist,
      status: 'completada',
      signature: {
        dataUrl,
        supervisorName: signerName,
        date: new Date().toLocaleString('es-CL', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      },
      updatedAt: new Date().toISOString()
    });
  };

  const handleClearSignature = () => {
    onUpdate({
      ...inspection,
      signature: null,
      updatedAt: new Date().toISOString()
    });
  };

  // Severity color lookup
  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'Crítica':
        return 'bg-[#FAF2F4] dark:bg-[#2B1E23] text-[#965868] dark:text-[#D4A2B0] border-[#F1DDE1] dark:border-[#523842]';
      case 'Alta':
        return 'bg-[#FAF0EC] dark:bg-[#2C211E] text-[#CC8B79] dark:text-[#E5BEA6] border-[#ECCFBE] dark:border-[#54433B]';
      case 'Media':
        return 'bg-[#FAF5F0] dark:bg-[#2B231F] text-[#BD9F8D] dark:text-[#D9C4B8] border-[#ECCFBE] dark:border-[#54433B]';
      default:
        return 'bg-[#F0F4F8] dark:bg-[#1E262C] text-[#5C788A] dark:text-[#9EB0BE] border-[#BCD1DE] dark:border-[#3E4D59]';
    }
  };

  const statusBadge = {
    completada: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    pendiente: 'bg-[#FAF0EC] dark:bg-[#2C211E] text-[#CC8B79] dark:text-[#E5BEA6] border-[#ECCFBE] dark:border-[#54433B]',
    vencida: 'bg-rose-50 dark:bg-rose-950/60 text-[#965868] dark:text-[#D4A2B0] border-[#F1DDE1] dark:border-[#523842]'
  }[inspection.status];

  const typeIcon = {
    Seguridad: <ShieldCheck className="w-4 h-4 text-[#5C788A]" />,
    Calidad: <HardHat className="w-4 h-4 text-[#6F5F75]" />,
    'Medio Ambiente': <Leaf className="w-4 h-4 text-[#946755]" />,
    Operacional: <Cog className="w-4 h-4 text-[#965868]" />
  }[inspection.type];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        id="modal-inspection-detail"
        className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl p-4 sm:p-6 shadow-2xl max-h-[94vh] flex flex-col border border-slate-200 dark:border-slate-800"
      >
        {/* Top Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0 gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                {typeIcon}
                <span>{inspection.type}</span>
              </span>

              {/* Interactive Status Selector */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleChangeStatus(inspection.status === 'completada' ? 'pendiente' : 'completada')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 active:scale-95 ${statusBadge}`}
                  title="Cambiar estado de inspección"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  <span>{inspection.status}</span>
                </button>
              </div>

              <span className="text-xs text-slate-400 font-medium ml-auto sm:ml-0">
                ID: {inspection.id}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 truncate">
              {inspection.company}
            </h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span className="flex items-center gap-1">
                <HardHat className="w-3.5 h-3.5 text-slate-400" /> {inspection.faena}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> {inspection.location}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> {inspection.date}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onExportReport(inspection)}
              className="p-2 rounded-xl bg-[#F0F4F8] dark:bg-[#1E262C] hover:bg-[#E2EAF0] text-[#5C788A] dark:text-[#9EB0BE] transition-colors"
              title="Generar Ficha / PDF"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 transition-colors"
              aria-label="Cerrar detalle"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="py-2.5 shrink-0">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            <span>Progreso de Checklist</span>
            <span className="text-[#5E5365] dark:text-[#CC8B79] font-extrabold">{progressPercent}% ({completedItems}/{totalItems})</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                progressPercent === 100 ? 'bg-emerald-500' : 'bg-[#5E5365]'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Sub-Tabs Selector */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl shrink-0 text-xs font-bold">
          <button
            onClick={() => setActiveTab('checklist')}
            className={`flex-1 min-h-[38px] py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'checklist'
                ? 'bg-white dark:bg-slate-900 text-[#5E5365] dark:text-[#CC8B79] shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Checklist</span>
            <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.2 rounded-full">
              {completedItems}/{totalItems}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('findings')}
            className={`flex-1 min-h-[38px] py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'findings'
                ? 'bg-white dark:bg-slate-900 text-[#965868] dark:text-[#D4A2B0] shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Hallazgos</span>
            {inspection.findings.length > 0 && (
              <span className="text-[10px] bg-[#965868] text-white px-1.5 py-0.2 rounded-full font-bold">
                {inspection.findings.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('evidences')}
            className={`flex-1 min-h-[38px] py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'evidences'
                ? 'bg-white dark:bg-slate-900 text-[#5E5365] dark:text-[#CC8B79] shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Evidencias</span>
            {inspection.evidences.length > 0 && (
              <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.2 rounded-full">
                {inspection.evidences.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('signature')}
            className={`flex-1 min-h-[38px] py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'signature'
                ? 'bg-white dark:bg-slate-900 text-[#5E5365] dark:text-[#CC8B79] shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span>Firma</span>
            {inspection.signature && (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            )}
          </button>
        </div>

        {/* Tab Content Areas */}
        <div className="flex-1 overflow-y-auto pr-1 py-3">
          {/* TAB 1: CHECKLIST */}
          {activeTab === 'checklist' && (
            <div className="space-y-2.5">
              {/* Quick actions for all checklist items */}
              <div className="flex items-center justify-between pb-1 text-xs">
                <span className="font-bold text-slate-600 dark:text-slate-400">
                  Puntos de Verificación ({completedItems}/{totalItems})
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleToggleAllChecklist(true)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800/60 active:scale-95 transition-all"
                  >
                    ✓ Completar todos
                  </button>
                  {completedItems > 0 && (
                    <button
                      type="button"
                      onClick={() => handleToggleAllChecklist(false)}
                      className="px-2 py-1 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium"
                    >
                      Desmarcar
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {inspection.checklist.map((item) => {
                  const isEditing = editingItemId === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border transition-all ${
                        item.completed
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/50'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEditItem();
                            }}
                            className="flex-1 min-h-[44px] px-3 py-2 rounded-lg border border-[#5E5365] bg-white dark:bg-slate-900 text-xs sm:text-sm"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={handleSaveEditItem}
                            className="min-h-[44px] px-3 bg-[#5E5365] hover:bg-[#4E4454] text-white rounded-lg text-xs font-bold"
                          >
                            Guardar
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingItemId(null)}
                            className="min-h-[44px] px-2 text-slate-500 text-xs"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => handleToggleChecklist(item.id)}
                            className="mt-0.5 min-w-[26px] min-h-[26px] rounded-lg flex items-center justify-center shrink-0 cursor-pointer active:scale-95"
                          >
                            {item.completed ? (
                              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <div className="w-5 h-5 rounded-md border-2 border-slate-400 dark:border-slate-600 bg-white dark:bg-slate-900" />
                            )}
                          </button>

                          <div
                            onClick={() => handleToggleChecklist(item.id)}
                            className="flex-1 cursor-pointer select-none"
                          >
                            <p
                              className={`text-xs sm:text-sm leading-relaxed ${
                                item.completed
                                  ? 'line-through text-slate-400 dark:text-slate-500'
                                  : 'text-slate-800 dark:text-slate-100 font-medium'
                              }`}
                            >
                              {item.text}
                            </p>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStartEditItem(item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Editar texto"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                              title="Eliminar ítem"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add checklist item */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddChecklistItem();
                    }
                  }}
                  placeholder="Agregar nuevo punto de inspección..."
                  className="flex-1 min-h-[48px] px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5E5365]"
                />
                <button
                  type="button"
                  onClick={handleAddChecklistItem}
                  className="min-h-[48px] px-4 bg-[#5E5365] hover:bg-[#4E4454] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Añadir</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: FINDINGS (HALLAZGOS) */}
          {activeTab === 'findings' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Hallazgos y Desviaciones ({inspection.findings.length})
                </span>
                <button
                  type="button"
                  onClick={() => setIsFindingModalOpen(true)}
                  className="min-h-[42px] px-3.5 py-2 bg-[#CC8B79] hover:bg-[#B87A69] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nuevo Hallazgo</span>
                </button>
              </div>

              {inspection.findings.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-6">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    No se registran hallazgos negativos
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    Si detecta alguna condición o acción insegura durante la inspección, regístrela aquí con fotografía y nivel de severidad.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {inspection.findings.map((fnd) => (
                    <div
                      key={fnd.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/70 shadow-xs space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span
                            className={`inline-block text-[11px] font-black uppercase px-2 py-0.5 rounded-md border ${getSeverityBadge(
                              fnd.severity
                            )}`}
                          >
                            Severidad: {fnd.severity}
                          </span>
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">
                            {fnd.title}
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteFinding(fnd.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                          title="Eliminar hallazgo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {fnd.description && (
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                          {fnd.description}
                        </p>
                      )}

                      {fnd.photoUrl && (
                        <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 max-w-xs group">
                          <img
                            src={fnd.photoUrl}
                            alt={fnd.title}
                            className="w-full h-36 object-cover cursor-pointer"
                            onClick={() => setPreviewImageUrl(fnd.photoUrl!)}
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none text-white text-xs font-bold gap-1">
                            <Eye className="w-4 h-4" /> Ver foto
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EVIDENCES (FOTOGRAFÍAS GENERALES) */}
          {activeTab === 'evidences' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Evidencias Fotográficas ({inspection.evidences.length})
                </span>
                <button
                  type="button"
                  onClick={() => setIsEvidenceModalOpen(true)}
                  className="min-h-[42px] px-3.5 py-2 bg-[#5E5365] hover:bg-[#4E4454] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Añadir Foto</span>
                </button>
              </div>

              {inspection.evidences.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-6">
                  <ImageIcon className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    No hay fotografías adjuntas
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                    Capture imágenes de terreno o suba fotos desde la galería para respaldar la inspección.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {inspection.evidences.map((evi) => (
                    <div
                      key={evi.id}
                      className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 aspect-square shadow-xs"
                    >
                      <img
                        src={evi.photoUrl}
                        alt="Evidencia"
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setPreviewImageUrl(evi.photoUrl)}
                      />
                      {evi.caption && (
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-white text-[11px] font-medium truncate">
                          {evi.caption}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteEvidence(evi.id)}
                        className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-lg opacity-90 hover:opacity-100 shadow-md active:scale-90 transition-all"
                        title="Eliminar foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SIGNATURE (FIRMA DIGITAL) */}
          {activeTab === 'signature' && (
            <div className="space-y-4">
              <SignatureCanvas
                initialDataUrl={inspection.signature?.dataUrl}
                onSave={handleSaveSignature}
                onClear={handleClearSignature}
                supervisorName={
                  inspection.signature?.supervisorName
                    ? inspection.signature.supervisorName.replace(/iaptidud/gi, 'Attach')
                    : 'Supervisor Attach'
                }
              />

              {inspection.signature && (
                <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-slate-900/80 border border-purple-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                  <div className="font-bold text-[#5E5365] dark:text-[#CC8B79] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#CC8B79]" />
                    <span>Firma Digital Certificada por Attach</span>
                  </div>
                  <p>
                    <span className="font-medium">Firmante:</span>{' '}
                    {inspection.signature.supervisorName
                      ? inspection.signature.supervisorName.replace(/iaptidud/gi, 'Attach')
                      : 'Supervisor Attach'}
                  </p>
                  <p>
                    <span className="font-medium">Fecha y hora de estampilla:</span> {inspection.signature.date}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions (min 56px touch height) */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          {onDelete && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('¿Estás seguro de eliminar esta inspección permanentemente?')) {
                  onDelete(inspection.id);
                  onClose();
                }
              }}
              className="min-h-[52px] px-3.5 py-2.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden xs:inline">Eliminar</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {/* Direct action to mark as completed / realizada if not yet completed */}
            {inspection.status !== 'completada' ? (
              <button
                type="button"
                id="btn-mark-inspection-completed"
                onClick={handleMarkAsCompleted}
                className="min-h-[52px] px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                title="Completar todos los ítems y mover a Completadas"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Marcar Realizada</span>
              </button>
            ) : (
              <button
                type="button"
                id="btn-inspection-already-completed"
                onClick={() => handleChangeStatus('pendiente')}
                className="min-h-[52px] px-3.5 py-2.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                title="Inspección realizada al 100%. Clic para reabrir."
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Realizada (Completada)</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onExportReport(inspection)}
              className="min-h-[52px] px-3.5 sm:px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-bold flex items-center gap-1.5 hover:bg-slate-50 transition-all shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#5E5365] dark:text-[#CC8B79]" />
              <span className="hidden sm:inline">Ver Informe</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="min-h-[52px] px-5 sm:px-6 py-2.5 bg-[#5E5365] hover:bg-[#4E4454] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md active:scale-95 transition-all cursor-pointer"
            >
              Listo
            </button>
          </div>
        </div>
      </div>

      {/* Sub-modals */}
      <FindingModal
        isOpen={isFindingModalOpen}
        onClose={() => setIsFindingModalOpen(false)}
        onSave={handleAddFinding}
      />

      <EvidenceModal
        isOpen={isEvidenceModalOpen}
        onClose={() => setIsEvidenceModalOpen(false)}
        onSave={handleAddEvidence}
      />

      {/* Fullscreen Photo Lightbox Preview */}
      {previewImageUrl && (
        <div
          className="fixed inset-0 z-60 bg-black/90 flex flex-col items-center justify-center p-4"
          onClick={() => setPreviewImageUrl(null)}
        >
          <button
            onClick={() => setPreviewImageUrl(null)}
            className="absolute top-4 right-4 p-2 bg-white/20 text-white rounded-full hover:bg-white/40"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={previewImageUrl}
            alt="Ampliación evidencia"
            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
