import React, { useState, useRef } from 'react';
import { X, Camera, Upload, Check, CloudUpload, Loader2 } from 'lucide-react';
import { Evidence } from '../types';
import { generateId } from '../utils/storage';
import { uploadEvidencePhotoToStorage, getSupabaseConfig, MULTIMEDIA_BUCKET_NAME } from '../lib/supabase';

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
  const [isUploadingToStorage, setIsUploadingToStorage] = useState(false);
  const [isCloudStored, setIsCloudStored] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      setPhotoUrl(dataUrl);

      // Upload to Supabase Storage if configured
      const { isConfigured } = getSupabaseConfig();
      if (isConfigured) {
        try {
          setIsUploadingToStorage(true);
          const tempEvidenceId = generateId('evi');
          const uploadRes = await uploadEvidencePhotoToStorage('temp_inspection', tempEvidenceId, file);
          if (uploadRes.publicUrl) {
            setPhotoUrl(uploadRes.publicUrl);
            setIsCloudStored(true);
          }
        } catch (err) {
          console.warn('Evidence storage direct upload failed, fallback on save:', err);
        } finally {
          setIsUploadingToStorage(false);
        }
      }
    };
    reader.readAsDataURL(file);
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
    setIsCloudStored(false);
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
                <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-1.5">
                  {isUploadingToStorage ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                      <span>Subiendo a Storage ({MULTIMEDIA_BUCKET_NAME})...</span>
                    </>
                  ) : isCloudStored || photoUrl.startsWith('http') ? (
                    <>
                      <CloudUpload className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-300">Guardado en Supabase Storage</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3 h-3 text-[#CC8B79]" />
                      <span>Evidencia capturada (se sincronizará a Storage)</span>
                    </>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPhotoUrl(null);
                    setIsCloudStored(false);
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-lg hover:bg-black/80 backdrop-blur-xs text-xs font-semibold flex items-center gap-1 cursor-pointer"
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
                className="min-h-[70px] flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl border-2 border-dashed border-[#CC8B79]/40 dark:border-[#CC8B79]/40 bg-[#FAF0EC]/60 dark:bg-[#2C211E]/40 hover:bg-[#FAF0EC] text-[#CC8B79] dark:text-[#E5BEA6] font-bold active:scale-95 transition-all text-xs sm:text-sm cursor-pointer"
              >
                <Camera className="w-6 h-6 text-[#CC8B79]" />
                <span>Cámara en terreno</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="min-h-[70px] flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 text-slate-700 dark:text-slate-300 font-semibold active:scale-95 transition-all text-xs sm:text-sm cursor-pointer"
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
              className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#5E5365]"
            />
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[50px] px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!photoUrl}
              className={`flex-1 min-h-[50px] px-4 py-2.5 rounded-xl text-sm font-bold shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                photoUrl
                  ? 'bg-[#5E5365] hover:bg-[#4E4454] text-white'
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
