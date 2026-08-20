import React from 'react';
import { Home, ClipboardList, BarChart3, Settings } from 'lucide-react';
import { TabType, UserSession } from '../types';
import { AttachEmblem } from './AttachLogo';

interface SidebarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  pendingCount: number;
  user: UserSession;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  pendingCount,
  user
}) => {
  const navItems: { id: TabType; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'dashboard',
      label: 'Inicio',
      icon: <Home className="w-5 h-5 opacity-90" />
    },
    {
      id: 'inspections',
      label: 'Inspecciones',
      icon: <ClipboardList className="w-5 h-5 opacity-90" />,
      badge: pendingCount > 0 ? pendingCount : undefined
    },
    {
      id: 'reports',
      label: 'Reportes',
      icon: <BarChart3 className="w-5 h-5 opacity-90" />
    },
    {
      id: 'profile',
      label: 'Ajustes',
      icon: <Settings className="w-5 h-5 opacity-90" />
    }
  ];

  return (
    <aside
      id="desktop-app-sidebar"
      className="hidden md:flex w-64 bg-[#5E5365] dark:bg-slate-950 text-white flex-col h-full shrink-0 border-r border-[#4E4454] dark:border-slate-800 shadow-xl z-20 transition-colors"
    >
      {/* Brand Header */}
      <div className="p-5 flex items-center gap-3 border-b border-white/15 dark:border-slate-800/80">
        <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center shadow-xs shrink-0 border border-white/20 dark:border-slate-800 p-1">
          <AttachEmblem size={28} />
        </div>
        <div className="min-w-0">
          <h1 className="font-black text-lg leading-none tracking-tight">ATTACH</h1>
          <span className="text-[10.5px] opacity-80 font-medium text-purple-100 dark:text-slate-400 block truncate mt-0.5">
            Reportabilidad inteligente
          </span>
        </div>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`sidebar-nav-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left cursor-pointer ${
                isActive
                  ? 'bg-white/20 dark:bg-slate-900 text-white font-bold shadow-xs border-l-4 border-[#CC8B79]'
                  : 'hover:bg-white/10 dark:hover:bg-slate-900/60 text-purple-100 dark:text-slate-400 hover:text-white dark:hover:text-slate-100 font-medium'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-[#CC8B79] dark:text-[#CC8B79]' : 'opacity-80'}>{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span className="px-2 py-0.5 rounded-full bg-[#CC8B79] text-white text-[10px] font-black shadow-xs">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User profile footer */}
      <div className="p-5 border-t border-white/15 dark:border-slate-800/80">
        <div
          onClick={() => onSelectTab('profile')}
          className="flex items-center gap-3 bg-white/10 dark:bg-slate-900/70 hover:bg-white/15 dark:hover:bg-slate-800/80 p-3 rounded-xl border border-white/10 dark:border-slate-800 transition-colors cursor-pointer"
        >
          <div className="w-10 h-10 bg-[#CC8B79] rounded-full flex items-center justify-center font-bold text-white shrink-0 shadow-xs">
            {user.name ? user.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="overflow-hidden min-w-0">
            <p className="text-sm font-semibold truncate">{user.email}</p>
            <p className="text-[10px] uppercase tracking-wider opacity-75 font-bold truncate text-purple-100 dark:text-slate-400">
              {user.role || 'Supervisor Pro'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
