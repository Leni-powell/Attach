import React, { useState, useEffect } from 'react';
import {
  Wifi,
  WifiOff,
  Download,
  Moon,
  Sun,
  Bell,
  Search,
  Calendar,
  Clock
} from 'lucide-react';
import { TabType, UserSession } from '../types';
import { AttachEmblem } from './AttachLogo';

interface HeaderProps {
  isOnline: boolean;
  user: UserSession;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  canInstallPwa: boolean;
  onInstallPwa: () => void;
  pendingCount: number;
  activeTab: TabType;
  globalSearchQuery: string;
  onGlobalSearchChange: (query: string) => void;
  onTriggerNotificationClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isOnline,
  user,
  darkMode,
  onToggleDarkMode,
  canInstallPwa,
  onInstallPwa,
  pendingCount,
  activeTab,
  globalSearchQuery,
  onGlobalSearchChange,
  onTriggerNotificationClick
}) => {
  // Live date and time ticker
  const [currentDateTime, setCurrentDateTime] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format date: e.g. "Viernes, 28 de agosto" or "28 ago 2026"
  const formattedDate = currentDateTime.toLocaleDateString('es-CL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });

  // Format time: e.g. "16:56:33 hrs" or "16:56 hrs"
  const formattedTime = currentDateTime.toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Dashboard';
      case 'inspections':
        return 'Inspecciones';
      case 'reports':
        return 'Reportes';
      case 'profile':
        return 'Ajustes';
      default:
        return 'Dashboard';
    }
  };

  return (
    <header
      id="app-main-header"
      className="sticky top-0 z-30 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 flex items-center justify-between shrink-0 shadow-xs transition-colors"
    >
      {/* Left side: Mobile Brand + Tab Title + Live Date & Time + Status indicator */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
        {/* Mobile-only logo */}
        <div className="flex md:hidden items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-xs">
            <AttachEmblem size={24} />
          </div>
        </div>

        <h2 className="text-base sm:text-xl font-bold text-slate-800 dark:text-slate-100 truncate">
          {getTabTitle()}
        </h2>

        {/* Live Date & Time Display Badge in Top-Left */}
        <div
          id="header-live-datetime"
          className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/70 text-slate-600 dark:text-slate-300 shrink-0 text-xs font-medium"
          title="Fecha y hora actual del sistema"
        >
          <span className="flex items-center gap-1 text-slate-700 dark:text-slate-200 capitalize">
            <Calendar className="w-3.5 h-3.5 text-[#5E5365] dark:text-[#CC8B79]" />
            <span>{formattedDate}</span>
          </span>
          <span className="text-slate-300 dark:text-slate-600 font-normal">|</span>
          <span className="flex items-center gap-1 font-bold text-[#5E5365] dark:text-[#CC8B79]">
            <Clock className="w-3.5 h-3.5 text-[#5E5365] dark:text-[#CC8B79] animate-pulse" />
            <span className="tabular-nums tracking-wide">{formattedTime} hrs</span>
          </span>
        </div>

        {/* Mobile Date & Time (visible on smaller screens) */}
        <div
          className="flex sm:hidden items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-[#5E5365] dark:text-[#CC8B79] shrink-0"
          title="Hora actual"
        >
          <Clock className="w-3 h-3 text-[#5E5365] dark:text-[#CC8B79]" />
          <span className="tabular-nums">
            {currentDateTime.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false })}
          </span>
        </div>

        {/* Connection Status Pill badge */}
        <div
          id="status-connection-badge"
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider shrink-0 transition-all ${
            isOnline
              ? 'bg-green-100 dark:bg-green-950/70 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
              : 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 animate-pulse'
          }`}
          title={isOnline ? 'Conexión activa - Sincronizado' : 'Modo sin conexión - Datos locales'}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              isOnline ? 'bg-green-500 animate-pulse' : 'bg-amber-500'
            }`}
          />
          <span className="hidden xs:inline">{isOnline ? 'EN LÍNEA' : 'OFFLINE'}</span>
        </div>
      </div>

      {/* Right side: Search, Notifications, Theme switch, Install */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Search input pill */}
        <div className="relative h-9 sm:h-10 w-36 xs:w-44 sm:w-64 bg-slate-100 dark:bg-slate-800/90 rounded-full flex items-center px-3 sm:px-4 border border-transparent focus-within:border-[#5E5365] dark:focus-within:border-[#CC8B79] focus-within:bg-white dark:focus-within:bg-slate-900 transition-all">
          <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0 mr-2" />
          <input
            type="text"
            value={globalSearchQuery}
            onChange={(e) => onGlobalSearchChange(e.target.value)}
            placeholder="Buscar inspección..."
            className="w-full bg-transparent text-slate-800 dark:text-slate-100 placeholder:text-slate-400 text-xs sm:text-sm focus:outline-none"
          />
          {globalSearchQuery && (
            <button
              onClick={() => onGlobalSearchChange('')}
              className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold px-1 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Action icons group */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Notification Bell */}
          <button
            id="header-notification-btn"
            onClick={onTriggerNotificationClick}
            className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center bg-white dark:bg-slate-800 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700/60 active:scale-95 transition-all text-slate-600 dark:text-slate-300 cursor-pointer"
            title="Alertas y Notificaciones"
            aria-label="Ver alertas"
          >
            <Bell className="w-4 h-4" />
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#CC8B79] rounded-full ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {/* PWA Install Button */}
          {canInstallPwa && (
            <button
              id="header-install-btn"
              onClick={onInstallPwa}
              className="hidden sm:flex items-center gap-1.5 bg-[#CC8B79] hover:bg-[#b87665] text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
              title="Instalar App en el dispositivo"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Instalar</span>
            </button>
          )}

          {/* Dark mode switch */}
          <button
            id="header-darkmode-btn"
            onClick={onToggleDarkMode}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center bg-white dark:bg-slate-800 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700/60 active:scale-95 transition-all text-slate-600 dark:text-slate-300 cursor-pointer"
            title={darkMode ? 'Modo Oscuro (clic para cambiar a claro)' : 'Modo Claro (clic para cambiar a oscuro)'}
            aria-label="Alternar tema"
          >
            {darkMode ? (
              <Moon className="w-4 h-4 text-[#CC8B79] dark:text-[#CC8B79]" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
