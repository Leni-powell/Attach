import React from 'react';
import { Download, X, Sparkles } from 'lucide-react';
import { AttachEmblem } from './AttachLogo';

interface InstallBannerProps {
  onInstall: () => void;
  onDismiss: () => void;
}

export const InstallBanner: React.FC<InstallBannerProps> = ({ onInstall, onDismiss }) => {
  return (
    <div
      id="pwa-install-banner"
      className="bg-gradient-to-r from-[#5E5365] to-[#473B4F] dark:from-slate-900 dark:to-slate-950 text-white p-3.5 sm:p-4 rounded-2xl shadow-lg border border-white/15 dark:border-slate-800 flex items-center justify-between gap-3 my-3"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-800 p-1 flex items-center justify-center shrink-0 border border-white/20">
          <AttachEmblem size={28} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="text-sm font-bold truncate">Instalar Attach</h4>
            <span className="flex items-center gap-0.5 text-[10px] font-bold bg-[#CC8B79] text-white px-1.5 py-0.2 rounded-full">
              <Sparkles className="w-2.5 h-2.5" /> PWA
            </span>
          </div>
          <p className="text-xs text-purple-100 dark:text-slate-300 line-clamp-1">
            Reportabilidad inteligente en terreno sin conexión.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          id="pwa-install-confirm-btn"
          onClick={onInstall}
          className="min-h-[44px] px-3.5 py-2 bg-[#CC8B79] hover:bg-[#b87665] text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Instalar</span>
        </button>
        <button
          id="pwa-install-dismiss-btn"
          onClick={onDismiss}
          className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white cursor-pointer"
          aria-label="Cerrar banner de instalación"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
