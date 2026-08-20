import React from 'react';

interface AttachLogoProps {
  variant?: 'full' | 'horizontal' | 'mark' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showSlogan?: boolean;
}

export const AttachEmblem: React.FC<{ size?: number; className?: string }> = ({
  size = 40,
  className = ''
}) => {
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Top Diamond */}
      <polygon points="100,8 114,24 100,40 86,24" fill="#6E5677" />

      {/* Left Crosshair Bar */}
      <rect x="12" y="93" width="22" height="14" rx="2" fill="#6E5677" />

      {/* Right Crosshair Bar */}
      <rect x="166" y="93" width="22" height="14" rx="2" fill="#6E5677" />

      {/* Left Teal Circle & Stem */}
      <circle
        cx="72"
        cy="100"
        r="44"
        stroke="#008E76"
        strokeWidth="16"
        fill="none"
      />
      {/* Stem lower left */}
      <path
        d="M28 100 L28 144 L44 144 L44 128"
        stroke="#008E76"
        strokeWidth="16"
        strokeLinecap="square"
        strokeLinejoin="miter"
        fill="none"
      />
      {/* Central bridge connector */}
      <path
        d="M72 56 L128 56"
        stroke="#008E76"
        strokeWidth="16"
        strokeLinecap="round"
      />

      {/* Right Teal Circle / Arc */}
      <circle
        cx="128"
        cy="100"
        r="44"
        stroke="#008E76"
        strokeWidth="16"
        fill="none"
      />

      {/* Left Inner Purple Dot */}
      <circle cx="72" cy="100" r="16" fill="#6E5677" />

      {/* Right Inner Purple Dot */}
      <circle cx="128" cy="100" r="16" fill="#6E5677" />

      {/* Right outer accent arc */}
      <path
        d="M174 85 A 46 46 0 0 1 174 115"
        stroke="#6E5677"
        strokeWidth="11"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
};

export const AttachLogo: React.FC<AttachLogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  className = '',
  showSlogan = true
}) => {
  const pixelSizes = {
    sm: 28,
    md: 36,
    lg: 48,
    xl: 64
  };

  const currentPx = pixelSizes[size];

  if (variant === 'mark' || variant === 'icon') {
    return <AttachEmblem size={currentPx} className={className} />;
  }

  if (variant === 'horizontal') {
    return (
      <div className={`flex items-center gap-2.5 sm:gap-3 ${className}`}>
        <div className="bg-white dark:bg-slate-900 p-1.5 rounded-xl shadow-xs border border-slate-200/80 dark:border-slate-800 shrink-0 flex items-center justify-center">
          <AttachEmblem size={currentPx} />
        </div>
        <div className="flex flex-col justify-center min-w-0">
          <span className="font-black text-slate-900 dark:text-white tracking-tight leading-none text-base sm:text-lg">
            ATTACH
          </span>
          {showSlogan && (
            <span className="text-[10px] sm:text-[11px] font-medium text-slate-600 dark:text-slate-400 tracking-tight leading-tight truncate mt-0.5">
              Reportabilidad inteligente
            </span>
          )}
        </div>
      </div>
    );
  }

  // Full stacked variant
  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 inline-flex items-center justify-center mb-2">
        <AttachEmblem size={currentPx * 1.5} />
      </div>
      <h1 className="font-black text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight">
        ATTACH
      </h1>
      {showSlogan && (
        <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">
          Reportabilidad inteligente
        </p>
      )}
    </div>
  );
};
