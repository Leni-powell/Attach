import React from 'react';
import { WifiOff, AlertTriangle, RefreshCw } from 'lucide-react';

interface OfflineBannerProps {
  onSync?: () => void;
  isSimulated?: boolean;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ onSync, isSimulated }) => {
  return (
    <div
      id="offline-notification-bar"
      className="bg-amber-500/15 dark:bg-amber-950/40 border border-amber-400/40 text-amber-900 dark:text-amber-200 px-3.5 py-2.5 rounded-xl flex items-center justify-between gap-3 text-xs my-2 backdrop-blur-xs"
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0 text-amber-700 dark:text-amber-300">
          <WifiOff className="w-4 h-4" />
        </div>
        <div className="truncate">
          <span className="font-bold">Modo Offline Activo: </span>
          <span className="text-amber-800 dark:text-amber-300">
            {isSimulated
              ? 'Simulación activa. Guardando en memoria local.'
              : 'Sin señal de red. Todas tus inspecciones se guardan localmente.'}
          </span>
        </div>
      </div>

      {onSync && (
        <button
          onClick={onSync}
          className="shrink-0 flex items-center gap-1 font-bold text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 bg-amber-500/20 hover:bg-amber-500/30 px-2 py-1 rounded-md transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Reintentar</span>
        </button>
      )}
    </div>
  );
};
