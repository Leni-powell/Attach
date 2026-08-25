import React, { useState } from 'react';
import {
  Moon,
  Sun,
  Bell,
  BellRing,
  Trash2,
  LogOut,
  ShieldCheck,
  Smartphone,
  HardHat,
  User,
  Check,
  AlertTriangle,
  RefreshCw,
  WifiOff,
  Wifi
} from 'lucide-react';
import { AppSettings, Inspection, UserSession } from '../types';
import { SupabaseSyncCard } from './SupabaseSyncCard';

interface ProfileViewProps {
  user: UserSession;
  settings: AppSettings;
  inspections: Inspection[];
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onResetAllData: () => void;
  onLogout: () => void;
  onTriggerNotificationTest: () => void;
  onInspectionsSynced: (newInspections: Inspection[]) => void;
  onShowToast: (type: 'success' | 'error' | 'info' | 'warning', message: string, title?: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  settings,
  inspections,
  onUpdateSettings,
  onResetAllData,
  onLogout,
  onTriggerNotificationTest,
  onInspectionsSynced,
  onShowToast
}) => {
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  const handleRequestNotificationPermission = async () => {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        if (permission === 'granted') {
          onUpdateSettings({ notificationsEnabled: true });
          onTriggerNotificationTest();
        } else {
          onUpdateSettings({ notificationsEnabled: false });
        }
      } catch (err) {
        console.error('Error solicitando permisos de notificación:', err);
      }
    } else {
      alert('Las notificaciones push no están soportadas en este navegador.');
    }
  };

  return (
    <div className="space-y-5 pb-24 animate-fade-in">
      {/* Profile Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#5E5365] to-[#CC8B79] text-white flex items-center justify-center font-black text-2xl shadow-md border-2 border-white dark:border-slate-800 shrink-0">
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
                {user.name}
              </h2>
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            </div>
            <p className="text-xs font-semibold text-[#5E5365] dark:text-[#CC8B79]">
              {user.role}
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span>{user.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Preferences and Settings Section */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">
          Ajustes de la Aplicación
        </h3>

        <div className="space-y-3">
          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-slate-800 text-[#5E5365] dark:text-[#CC8B79] flex items-center justify-center">
                {settings.darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Modo Claro
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Optimizado para visualización diurna en terreno.
                </p>
              </div>
            </div>

            <button
              id="profile-toggle-darkmode"
              onClick={() => onUpdateSettings({ darkMode: !settings.darkMode })}
              className={`w-13 h-7 rounded-full p-1 transition-colors flex items-center cursor-pointer ${
                settings.darkMode ? 'bg-[#CC8B79] justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
              }`}
              aria-label="Alternar modo oscuro"
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-md" />
            </button>
          </div>

          {/* Push Notifications Permission */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-3 min-w-0 pr-2">
              <div className="w-9 h-9 rounded-xl bg-[#FAF0EC] dark:bg-[#2C211E] text-[#CC8B79] dark:text-[#E5BEA6] flex items-center justify-center shrink-0">
                <BellRing className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Notificaciones de Alerta
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {notificationPermission === 'granted'
                    ? 'Permiso concedido para alertas de terreno.'
                    : 'Avisos de inspecciones vencidas o hallazgos críticos.'}
                </p>
              </div>
            </div>

            <button
              id="profile-toggle-notifications"
              onClick={handleRequestNotificationPermission}
              className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 cursor-pointer ${
                notificationPermission === 'granted'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-[#CC8B79] text-white hover:bg-[#B87A69] shadow-xs'
              }`}
            >
              {notificationPermission === 'granted' ? 'Habilitadas' : 'Activar'}
            </button>
          </div>

          {/* Simulated Offline Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center">
                {settings.simulatedOffline ? <WifiOff className="w-5 h-5 text-amber-500" /> : <Wifi className="w-5 h-5 text-emerald-500" />}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Simular Modo Offline
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Probar almacenamiento local y comportamiento sin cobertura de red.
                </p>
              </div>
            </div>

            <button
              onClick={() => onUpdateSettings({ simulatedOffline: !settings.simulatedOffline })}
              className={`w-13 h-7 rounded-full p-1 transition-colors flex items-center ${
                settings.simulatedOffline ? 'bg-amber-500 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
              }`}
              aria-label="Simular modo offline"
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-md" />
            </button>
          </div>
        </div>
      </div>

      {/* Supabase Cloud Connection & Sync Card */}
      <SupabaseSyncCard
        inspections={inspections}
        onInspectionsSynced={onInspectionsSynced}
        onShowToast={onShowToast}
      />

      {/* Danger Zone: Reset Data & Logout */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400">
          Mantenimiento & Sesión
        </h3>

        {/* Clear Data Button (min 56px touch height) */}
        <button
          id="profile-reset-data-btn"
          onClick={() => setShowConfirmReset(true)}
          className="w-full min-h-[56px] px-4 py-3 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 hover:bg-rose-100 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
        >
          <Trash2 className="w-5 h-5 text-rose-600" />
          <span>Borrar todos los datos y restaurar ejemplo</span>
        </button>

        {/* Logout Button (min 56px touch height) */}
        <button
          id="profile-logout-btn"
          onClick={onLogout}
          className="w-full min-h-[56px] px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>

      {/* Confirmation Reset Modal */}
      {showConfirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                ¿Borrar todos los datos?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Esta acción restablecerá las 3 inspecciones iniciales de ejemplo y eliminará cualquier nuevo hallazgo o firma registrada.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="min-h-[48px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onResetAllData();
                  setShowConfirmReset(false);
                }}
                className="min-h-[48px] px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold shadow-md active:scale-95"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* App Info Footer */}
      <div className="text-center text-xs text-slate-400 space-y-1">
        <p className="font-bold text-slate-600 dark:text-slate-300">Attach • Reportabilidad inteligente v1.0.0 (PWA)</p>
        <p>Especializada para minería, construcción y servicios técnicos en terreno.</p>
      </div>
    </div>
  );
};
