import React, { useState, useRef } from 'react';
import { X, Camera, Upload, Check } from 'lucide-react';
import { Evidence } from '../types';
import { generateId } from '../utils/storage';

interface EvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (evidence: Evidence) => void;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoUrl) return;

    const newEvidence: Evidence = {
      id: generateId('evi'),
      photoUrl,
      caption: caption.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    onSave(newEvidence);
    setPhotoUrl(null);
    setCaption('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        id="modal-new-evidence"
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
            Añadir Evidencia Fotográfica
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />

          {photoUrl ? (
            <div className="space-y-2">
              <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950">
                <img
                  src={photoUrl}
                  alt="Vista previa evidencia"
                  className="w-full h-52 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setPhotoUrl(null)}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-lg hover:bg-black/80 backdrop-blur-xs text-xs font-semibold flex items-center gap-1"
                >
                  <X className="w-4 h-4" /> Cambiar
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 py-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="min-h-[70px] flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl border-2 border-dashed border-[#0057B8]/40 dark:border-blue-500/40 bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-50 text-[#0057B8] dark:text-blue-400 font-bold active:scale-95 transition-all text-xs sm:text-sm"
              >
                <Camera className="w-6 h-6 text-[#FF6B00]" />
                <span>Cámara en terreno</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="min-h-[70px] flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 text-slate-700 dark:text-slate-300 font-semibold active:scale-95 transition-all text-xs sm:text-sm"
              >
                <Upload className="w-6 h-6 text-slate-500" />
                <span>Subir de Galería</span>
              </button>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Descripción o Ubicación Específica (Opcional)
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Ej: Vista general sector acopio, tablero eléctrico #4..."
              className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#0057B8]"
            />
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[50px] px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!photoUrl}
              className={`flex-1 min-h-[50px] px-4 py-2.5 rounded-xl text-sm font-bold shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 ${
                photoUrl
                  ? 'bg-[#0057B8] hover:bg-[#004799] text-white'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
              }`}
            >
              <Check className="w-5 h-5" />
              <span>Guardar Evidencia</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
