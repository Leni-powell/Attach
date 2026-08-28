import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, CheckCircle2, ShieldCheck, HardHat, Leaf, Cog, Calendar, Building2, MapPin, Clock } from 'lucide-react';
import { ChecklistItem, Inspection, InspectionType } from '../types';
import { CHECKLIST_TEMPLATES, SAMPLE_COMPANIES, SAMPLE_FAENAS } from '../data/templates';
import { generateId } from '../utils/storage';

interface NewInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (inspection: Inspection) => void;
}

export const NewInspectionModal: React.FC<NewInspectionModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [type, setType] = useState<InspectionType>('Seguridad');
  const [company, setCompany] = useState(SAMPLE_COMPANIES[0]);
  const [faena, setFaena] = useState(SAMPLE_FAENAS[0]);
  const [location, setLocation] = useState('Sector Principal');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [notes, setNotes] = useState('');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [customItemText, setCustomItemText] = useState('');

  // Load checklist template whenever inspection type changes
  useEffect(() => {
    const templateItems = CHECKLIST_TEMPLATES[type] || [];
    const items: ChecklistItem[] = templateItems.map((text, idx) => ({
      id: generateId(`chk-${idx}`),
      text,
      completed: false
    }));
    setChecklist(items);
  }, [type]);

  if (!isOpen) return null;

  const typeOptions: { type: InspectionType; icon: React.ReactNode; color: string }[] = [
    { type: 'Seguridad', icon: <ShieldCheck className="w-4 h-4" />, color: 'bg-[#5C788A]' },
    { type: 'Calidad', icon: <HardHat className="w-4 h-4" />, color: 'bg-[#6F5F75]' },
    { type: 'Medio Ambiente', icon: <Leaf className="w-4 h-4" />, color: 'bg-[#946755]' },
    { type: 'Operacional', icon: <Cog className="w-4 h-4" />, color: 'bg-[#965868]' }
  ];

  const handleToggleItem = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const handleRemoveItem = (id: string) => {
    setChecklist((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddCustomItem = () => {
    if (!customItemText.trim()) return;
    const newItem: ChecklistItem = {
      id: generateId('chk-custom'),
      text: customItemText.trim(),
      completed: false
    };
    setChecklist((prev) => [...prev, newItem]);
    setCustomItemText('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !faena.trim() || !location.trim()) return;

    const newInspection: Inspection = {
      id: generateId('insp'),
      type,
      company: company.trim(),
      faena: faena.trim(),
      location: location.trim(),
      date,
      time: time.trim() || new Date().toTimeString().slice(0, 5),
      status: 'pendiente', // Created with estado "pendiente" as required
      checklist,
      findings: [],
      evidences: [],
      signature: null,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(newInspection);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        id="modal-new-inspection"
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl max-h-[92vh] flex flex-col border border-slate-200 dark:border-slate-800"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-slate-100">
              Nueva Inspección en Terreno
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Complete los datos técnicos y la pauta de control dinámico.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:text-slate-400 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 py-4 space-y-4">
          {/* Tipo de Inspección */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Tipo de Inspección *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {typeOptions.map((opt) => (
                <button
                  type="button"
                  key={opt.type}
                  onClick={() => setType(opt.type)}
                  className={`min-h-[52px] p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    type === opt.type
                      ? 'border-[#5E5365] bg-[#FAF8F9] dark:bg-[#251E28] text-[#5E5365] dark:text-[#CC8B79] ring-2 ring-[#5E5365]/30 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-lg ${opt.color} text-white flex items-center justify-center shrink-0`}
                  >
                    {opt.icon}
                  </div>
                  <span className="truncate">{opt.type}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Empresa & Faena */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Empresa Contratista / Mandante *
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  list="companies-list"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Nombre de la empresa"
                  className="w-full min-h-[50px] pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#5E5365]"
                />
                <datalist id="companies-list">
                  {SAMPLE_COMPANIES.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Faena / Centro de Trabajo *
              </label>
              <div className="relative">
                <HardHat className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  list="faenas-list"
                  value={faena}
                  onChange={(e) => setFaena(e.target.value)}
                  placeholder="Ej: Faena Norte, Edificio B..."
                  className="w-full min-h-[50px] pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#5E5365]"
                />
                <datalist id="faenas-list">
                  {SAMPLE_FAENAS.map((f) => (
                    <option key={f} value={f} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          {/* Ubicación, Fecha & Hora */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Ubicación / Sector Específico *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ej: Piso 3, Sector A, Galpón 4..."
                  className="w-full min-h-[50px] pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#5E5365]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Fecha Programada *
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full min-h-[50px] pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#5E5365]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Hora de Inspección *
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full min-h-[50px] pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#5E5365]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Checklist Dinámica */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Checklist Sugerida ({type}) - {checklist.length} ítems
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {checklist.filter((i) => i.completed).length} marcados
              </span>
            </div>

            {/* List of items */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border transition-colors ${
                    item.completed
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/60'
                      : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleItem(item.id)}
                    className="mt-0.5 min-w-[24px] min-h-[24px] rounded-lg border flex items-center justify-center transition-all shrink-0"
                  >
                    {item.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <div className="w-4 h-4 rounded border-2 border-slate-400 dark:border-slate-600" />
                    )}
                  </button>

                  <p
                    onClick={() => handleToggleItem(item.id)}
                    className={`flex-1 text-xs sm:text-sm leading-snug cursor-pointer select-none ${
                      item.completed
                        ? 'line-through text-slate-400 dark:text-slate-500'
                        : 'text-slate-700 dark:text-slate-200 font-medium'
                    }`}
                  >
                    {item.text}
                  </p>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors shrink-0"
                    title="Eliminar ítem"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Custom Checklist Item */}
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                value={customItemText}
                onChange={(e) => setCustomItemText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomItem();
                  }
                }}
                placeholder="Añadir ítem personalizado al checklist..."
                className="flex-1 min-h-[48px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5E5365]"
              />
              <button
                type="button"
                onClick={handleAddCustomItem}
                className="min-h-[48px] px-4 bg-[#5E5365] hover:bg-[#4E4454] text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Agregar</span>
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Observaciones Iniciales (Opcional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instrucciones o requerimientos especiales para la cuadrilla..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#5E5365]"
            />
          </div>

          {/* Footer Submit Buttons (min 56px height) */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[56px] px-5 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 min-h-[56px] px-5 py-3 rounded-xl bg-[#5E5365] hover:bg-[#4E4454] text-white text-sm font-bold shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5 text-[#CC8B79]" />
              <span>Crear Inspección</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
