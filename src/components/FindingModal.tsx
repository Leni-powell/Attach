import React, { useState, useRef } from 'react';
import { X, Camera, Upload, Trash2, AlertTriangle, Check } from 'lucide-react';
import { Finding, Severity } from '../types';
import { generateId } from '../utils/storage';

interface FindingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (finding: Finding) => void;
}

export const FindingModal: React.FC<FindingModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<Severity>('Media');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const severities: { value: Severity; label: string; color: string; bg: string }[] = [
    { value: 'Baja', label: 'Baja', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300' },
    { value: 'Media', label: 'Media', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-100 dark:bg-amber-950/60 border-amber-300' },
    { value: 'Alta', label: 'Alta', color: 'text-orange-700 dark:text-orange-300', bg: 'bg-orange-100 dark:bg-orange-950/60 border-orange-300' },
    { value: 'Crítica', label: 'Crítica', color: 'text-rose-700 dark:text-rose-300', bg: 'bg-rose-100 dark:bg-rose-950/60 border-rose-300' }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoUrl(undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newFinding: Finding = {
      id: generateId('fnd'),
      title: title.trim(),
      description: description.trim(),
      severity,
      photoUrl,
      createdAt: new Date().toISOString()
    };

    onSave(newFinding);
    // Reset
    setTitle('');
    setDescription('');
    setSeverity('Media');
    setPhotoUrl(undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        id="modal-new-finding"
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
              Registrar Nuevo Hallazgo
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:text-slate-400"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Título del Hallazgo *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Falla en cuerda de vida o bloqueo deficiente"
              className="w-full min-h-[50px] px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#0057B8]"
            />
          </div>

          {/* Severity Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Nivel de Severidad
            </label>
            <div className="grid grid-cols-4 gap-2">
              {severities.map((item) => (
                <button
                  type="button"
                  key={item.value}
                  onClick={() => setSeverity(item.value)}
                  className={`min-h-[44px] py-2 px-1 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center ${
                    severity === item.value
                      ? `${item.bg} ${item.color} ring-2 ring-offset-1 ring-current font-black`
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 opacity-70 hover:opacity-100'
                  }`}
                >
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Descripción y Medida Correctiva
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalle la condición subestándar observada, personas involucradas y acción recomendada..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#0057B8]"
            />
          </div>

          {/* Photo attachment */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Registro Fotográfico del Hallazgo
            </label>

            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />

            {photoUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950">
                <img
                  src={photoUrl}
                  alt="Foto de hallazgo"
                  className="w-full h-44 object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute top-2 right-2 p-2 bg-rose-600/90 text-white rounded-lg hover:bg-rose-700 shadow-md backdrop-blur-xs flex items-center gap-1 text-xs font-bold"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar foto</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="min-h-[52px] flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-[#0057B8]/40 dark:border-blue-500/40 bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-50 text-[#0057B8] dark:text-blue-400 text-xs sm:text-sm font-bold active:scale-95 transition-all"
                >
                  <Camera className="w-5 h-5 text-[#FF6B00]" />
                  <span>Tomar Foto</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="min-h-[52px] flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold active:scale-95 transition-all"
                >
                  <Upload className="w-5 h-5 text-slate-500" />
                  <span>Galería</span>
                </button>
              </div>
            )}
          </div>

          {/* Action buttons (min 56px height) */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[52px] px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 min-h-[52px] px-4 py-3 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white text-sm font-bold shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              <span>Guardar Hallazgo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
