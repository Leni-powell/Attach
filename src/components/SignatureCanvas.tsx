import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Trash2, Check, PenTool, RotateCcw } from 'lucide-react';

interface SignatureCanvasProps {
  initialDataUrl?: string | null;
  onSave: (dataUrl: string) => void;
  onClear?: () => void;
  supervisorName?: string;
}

export const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
  initialDataUrl,
  onSave,
  onClear,
  supervisorName = 'Supervisor Attach'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!initialDataUrl);
  const [savedDataUrl, setSavedDataUrl] = useState<string | null>(initialDataUrl || null);

  // Calibration and resize handling using devicePixelRatio
  const calibrateCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Set logical display size
    canvas.style.width = '100%';
    canvas.style.height = '180px';

    // Set actual canvas drawing buffer size scaled by DPR
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(180 * dpr);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#5E5365';
    ctx.lineWidth = 2.5;

    // If an initial signature exists, draw it back onto canvas
    if (savedDataUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, 180);
      };
      img.src = savedDataUrl;
    }
  }, [savedDataUrl]);

  useEffect(() => {
    calibrateCanvas();
    const handleResize = () => calibrateCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calibrateCanvas]);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    setHasSignature(false);
    setSavedDataUrl(null);
    if (onClear) onClear();
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;

    const dataUrl = canvas.toDataURL('image/png');
    setSavedDataUrl(dataUrl);
    onSave(dataUrl);
  };

  return (
    <div className="w-full bg-slate-50 dark:bg-slate-900/90 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <PenTool className="w-4 h-4 text-[#5E5365] dark:text-[#CC8B79]" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Firma Digital del Supervisor
          </span>
        </div>
        {savedDataUrl ? (
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Check className="w-3 h-3" /> Firmado
          </span>
        ) : (
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
            Pendiente de firma
          </span>
        )}
      </div>

      {/* Touch Canvas Box */}
      <div
        ref={containerRef}
        className="relative w-full h-[180px] bg-white dark:bg-slate-950 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 overflow-hidden touch-none"
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-full cursor-crosshair block"
        />

        {/* Baseline indicator */}
        <div className="absolute bottom-6 left-8 right-8 border-b border-slate-300 dark:border-slate-800 pointer-events-none flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-600">
          <span>Línea de firma</span>
          <span>{supervisorName}</span>
        </div>

        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 dark:text-slate-600 text-xs gap-1.5">
            <PenTool className="w-4 h-4 opacity-50" />
            <span>Dibuje su firma aquí con el dedo o puntero</span>
          </div>
        )}
      </div>

      {/* Action Controls - min 48px to 56px height for touch */}
      <div className="flex items-center gap-2 mt-3">
        <button
          type="button"
          onClick={handleClear}
          className="min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-xs"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Limpiar</span>
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={!hasSignature}
          className={`flex-1 min-h-[48px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md ${
            hasSignature
              ? 'bg-[#CC8B79] hover:bg-[#b87665] text-white'
              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
          }`}
        >
          <Check className="w-4 h-4" />
          <span>{savedDataUrl ? 'Actualizar Firma' : 'Guardar Firma'}</span>
        </button>
      </div>
    </div>
  );
};
