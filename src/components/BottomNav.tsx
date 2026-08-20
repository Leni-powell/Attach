import React from 'react';
import { Home, ClipboardList, BarChart3, UserCheck } from 'lucide-react';
import { TabType } from '../types';

interface BottomNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  pendingCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  pendingCount
}) => {
  const tabs: { id: TabType; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'dashboard',
      label: 'Inicio',
      icon: <Home className="w-5 h-5" />
    },
    {
      id: 'inspections',
      label: 'Inspecciones',
      icon: <ClipboardList className="w-5 h-5" />,
      badge: pendingCount > 0 ? pendingCount : undefined
    },
    {
      id: 'reports',
      label: 'Reportes',
      icon: <BarChart3 className="w-5 h-5" />
    },
    {
      id: 'profile',
      label: 'Perfil',
      icon: <UserCheck className="w-5 h-5" />
    }
  ];

  return (
    <nav
      id="app-bottom-nav"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-lg pb-safe transition-colors"
    >
      <div className="max-w-md mx-auto grid grid-cols-4 h-16 items-center px-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-btn-${tab.id}`}
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex flex-col items-center justify-center h-full min-h-[56px] py-1 transition-all rounded-lg cursor-pointer ${
                isActive
                  ? 'text-[#5E5365] dark:text-[#CC8B79] font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
              }`}
            >
              <div className="relative">
                <div
                  className={`p-1.5 rounded-xl transition-all ${
                    isActive
                      ? 'bg-[#5E5365]/10 dark:bg-slate-800 text-[#5E5365] dark:text-[#CC8B79] scale-110 shadow-xs'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  {tab.icon}
                </div>

                {tab.badge !== undefined && (
                  <span
                    id={`badge-${tab.id}`}
                    className="absolute -top-1 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-[#CC8B79] text-white text-[10px] font-black flex items-center justify-center shadow-xs animate-scale"
                  >
                    {tab.badge}
                  </span>
                )}
              </div>

              <span className="text-[11px] leading-tight mt-0.5 tracking-tight truncate max-w-[70px]">
                {tab.label}
              </span>

              {isActive && (
                <span className="absolute bottom-1 w-5 h-1 bg-[#5E5365] dark:bg-[#CC8B79] rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
