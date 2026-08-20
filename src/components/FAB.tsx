import React from 'react';
import { Plus } from 'lucide-react';

interface FABProps {
  onClick: () => void;
  label?: string;
}

export const FAB: React.FC<FABProps> = ({ onClick, label = 'Nueva Inspección' }) => {
  return (
    <button
      id="main-fab-new-inspection"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="fixed right-5 bottom-20 md:bottom-8 z-40 w-14 h-14 sm:w-16 sm:h-16 bg-[#FF6B00] text-white rounded-full shadow-lg shadow-orange-500/35 flex items-center justify-center font-bold text-2xl sm:text-3xl hover:scale-105 active:scale-95 transition-all cursor-pointer focus:outline-none focus:ring-4 focus:ring-orange-300 dark:focus:ring-orange-800"
    >
      <Plus className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.8]" />
    </button>
  );
};
