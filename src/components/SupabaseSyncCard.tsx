import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  CloudUpload,
  CloudDownload,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
  Save,
  Key,
  Globe,
  Info
} from 'lucide-react';
import {
  getSupabaseConfig,
  saveSupabaseCustomConfig,
  sanitizeSupabaseUrl,
  sanitizeSupabaseKey,
  testSupabaseConnection,
  fetchInspectionsFromSupabase,
  syncAllInspectionsToSupabase,
  SUPABASE_SCHEMA_SQL
} from '../lib/supabase';
import { Inspection } from '../types';

interface SupabaseSyncCardProps {
  inspections: Inspection[];
  onInspectionsSynced: (newInspections: Inspection[]) => void;
  onShowToast: (type: 'success' | 'error' | 'info' | 'warning', message: string, title?: string) => void;
}

export const SupabaseSyncCard: React.FC<SupabaseSyncCardProps> = ({
  inspections,
  onInspectionsSynced,
  onShowToast
}) => {
  const [config, setConfig] = useState(getSupabaseConfig());
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(config.url);
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(config.anonKey);
  const [isEditingKeys, setIsEditingKeys] = useState(!config.isConfigured);

  const [testingStatus, setTestingStatus] = useState<{
    tested: boolean;
    loading: boolean;
    success: boolean;
    message: string;
    tableExists?: boolean;
  }>({
    tested: false,
    loading: false,
    success: false,
    message: ''
  });

  const [isSyncingUp, setIsSyncingUp] = useState(false);
  const [isPullingDown, setIsPullingDown] = useState(false);
  const [showSqlGuide, setShowSqlGuide] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Auto test on mount if configured
  useEffect(() => {
    if (config.isConfigured) {
      handleTestConnection(false);
    }
  }, []);

  const handleSaveCredentials = () => {
    const cleanUrl = sanitizeSupabaseUrl(supabaseUrlInput);
    const cleanKey = sanitizeSupabaseKey(supabaseKeyInput);

    setSupabaseUrlInput(cleanUrl);
    setSupabaseKeyInput(cleanKey);

    saveSupabaseCustomConfig(cleanUrl, cleanKey);
    const updated = getSupabaseConfig();
    setConfig(updated);
    setIsEditingKeys(false);

    if (updated.isConfigured) {
      onShowToast('success', 'Credenciales de Supabase guardadas y normalizadas.', 'Configuración Actualizada');
      handleTestConnection(true);
    } else {
      onShowToast('info', 'Supabase deshabilitado o datos incompletos.', 'Ajuste de Conexión');
    }
  };

  const handleTestConnection = async (showToastFeedback = true) => {
    setTestingStatus(prev => ({ ...prev, loading: true }));
    const result = await testSupabaseConnection();
    setTestingStatus({
      tested: true,
      loading: false,
      success: result.success,
      message: result.message,
      tableExists: result.tableExists
    });

    if (showToastFeedback) {
      if (result.success) {
        onShowToast(
          'success',
          result.tableExists
            ? 'Conexión a Supabase establecida correctamente.'
            : 'Conectado a Supabase. Se requiere ejecutar el script SQL.',
          'Supabase Conectado'
        );
      } else {
        onShowToast('error', result.message, 'Fallo de Conexión');
      }
    }
  };

  const handlePushAllToSupabase = async () => {
    if (!config.isConfigured) {
      onShowToast('warning', 'Configura tu URL y Clave Anon de Supabase primero.', 'Supabase no conectado');
      setIsEditingKeys(true);
      return;
    }

    setIsSyncingUp(true);
    const result = await syncAllInspectionsToSupabase(inspections);
    setIsSyncingUp(false);

    if (result.success) {
      onShowToast('success', `Se sincronizaron ${result.syncedCount} inspecciones con Supabase.`, 'Sube Completada');
    } else {
      onShowToast('error', result.error || 'Error al subir datos', 'Error de Sincronización');
    }
  };

  const handlePullAllFromSupabase = async () => {
    if (!config.isConfigured) {
      onShowToast('warning', 'Configura tu URL y Clave Anon de Supabase primero.', 'Supabase no conectado');
      setIsEditingKeys(true);
      return;
    }

    setIsPullingDown(true);
    const result = await fetchInspectionsFromSupabase();
    setIsPullingDown(false);

    if (result.data) {
      if (result.data.length === 0) {
        onShowToast('info', 'La base de datos de Supabase no contiene inspecciones aún. Puedes subir las locales.', 'Sin Registros');
      } else {
        onInspectionsSynced(result.data);
        onShowToast('success', `Se descargaron y sincronizaron ${result.data.length} inspecciones desde Supabase.`, 'Descarga Exitosa');
      }
    } else {
      onShowToast('error', result.error || 'Error al descargar datos', 'Fallo al Descargar');
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopiedSql(true);
    onShowToast('success', 'Script SQL copiado al portapapeles. Pégalo en el SQL Editor de Supabase.', 'Copiado');
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div
      id="supabase-integration-panel"
      className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-[#E5DFDC] dark:border-slate-800 shadow-xs space-y-4 transition-all"
    >
      {/* Header with Title & Supabase Status Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black shadow-xs shrink-0 border border-emerald-200/60 dark:border-emerald-800">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-[#38303B] dark:text-slate-100">
                Conexión con Supabase (PostgreSQL)
              </h3>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300">
                Cloud DB
              </span>
            </div>
            <p className="text-xs text-[#87778C] dark:text-slate-400 mt-0.5">
              Persistencia cloud en tiempo real, respaldos automáticos y sincronización multi-dispositivo.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {config.isConfigured ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Configurado
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Pendiente Configuración
            </span>
          )}
        </div>
      </div>

      {/* Connection Status Banner */}
      {testingStatus.tested && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-medium flex items-start gap-2.5 ${
            testingStatus.success
              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/80 text-rose-800 dark:text-rose-200'
          }`}
        >
          {testingStatus.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 space-y-1">
            <p className="font-bold">{testingStatus.message}</p>
            {testingStatus.success && testingStatus.tableExists === false && (
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                Abre la sección "Esquema SQL de Supabase" abajo para crear la tabla <code>inspections</code> con 1 clic.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Connection Credentials Config Form (Collapsible / Toggleable) */}
      <div className="space-y-3 bg-slate-50/80 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-[#CC8B79]" />
            Parámetros de Acceso Supabase
          </span>
          <button
            type="button"
            onClick={() => setIsEditingKeys(!isEditingKeys)}
            className="text-xs font-bold text-[#5E5365] dark:text-[#CC8B79] hover:underline cursor-pointer"
          >
            {isEditingKeys ? 'Ocultar campos' : 'Editar credenciales'}
          </button>
        </div>

        {isEditingKeys ? (
          <div className="space-y-3 pt-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Project URL (URL base de tu proyecto)
                </label>
                <span className="text-[10px] text-[#5C788A] dark:text-slate-400">
                  Debe terminar en <strong>.supabase.co</strong>
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="https://xyzcompany.supabase.co"
                  value={supabaseUrlInput}
                  onChange={(e) => setSupabaseUrlInput(e.target.value)}
                  className="w-full text-xs font-mono px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#CC8B79] focus:outline-none"
                />
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                💡 Pega la URL base (ej: <code>https://tuid.supabase.co</code>). No agregues <code>/rest/v1</code> ni barras al final.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Anon Public API Key
                </label>
                <span className="text-[10px] text-slate-400">
                  Clave pública (anon)
                </span>
              </div>
              <div className="relative">
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseKeyInput}
                  onChange={(e) => setSupabaseKeyInput(e.target.value)}
                  className="w-full text-xs font-mono px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#CC8B79] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleSaveCredentials}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Credenciales</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSupabaseUrlInput('');
                  setSupabaseKeyInput('');
                  saveSupabaseCustomConfig('', '');
                  setConfig(getSupabaseConfig());
                  setIsEditingKeys(false);
                }}
                className="px-3 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-300 transition-all cursor-pointer"
              >
                Restablecer
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="text-slate-600 dark:text-slate-400 truncate max-w-md">
              <span className="font-semibold text-slate-800 dark:text-slate-200">URL Conectada: </span>
              {config.url ? <code className="font-mono text-[11px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded">{config.url}</code> : <span className="italic text-amber-600">No definida</span>}
            </div>

            <button
              type="button"
              onClick={() => handleTestConnection(true)}
              disabled={testingStatus.loading || !config.isConfigured}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[#5E5365] dark:text-slate-200 hover:bg-slate-100 rounded-xl font-bold flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingStatus.loading ? 'animate-spin' : ''}`} />
              <span>{testingStatus.loading ? 'Verificando...' : 'Comprobar Estado'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Synchronization Actions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* Upload Local Inspections to Supabase */}
        <button
          type="button"
          id="btn-sync-upload-supabase"
          onClick={handlePushAllToSupabase}
          disabled={isSyncingUp || !config.isConfigured}
          className="p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/30 text-emerald-900 dark:text-emerald-200 flex items-center justify-between text-left transition-all active:scale-98 disabled:opacity-50 cursor-pointer shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CloudUpload className={`w-5 h-5 ${isSyncingUp ? 'animate-bounce' : ''}`} />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-extrabold block">
                Subir a Supabase
              </span>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                Guardar {inspections.length} inspección(es) locales en la nube
              </span>
            </div>
          </div>
        </button>

        {/* Download & Pull from Supabase */}
        <button
          type="button"
          id="btn-sync-pull-supabase"
          onClick={handlePullAllFromSupabase}
          disabled={isPullingDown || !config.isConfigured}
          className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-between text-left transition-all active:scale-98 disabled:opacity-50 cursor-pointer shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#5E5365] text-white flex items-center justify-center shrink-0">
              <CloudDownload className={`w-5 h-5 ${isPullingDown ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-extrabold block">
                Descargar de Supabase
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Sincronizar y cargar registros de la nube al dispositivo
              </span>
            </div>
          </div>
        </button>
      </div>

      {/* Collapsible SQL Schema Creator */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
        <button
          type="button"
          onClick={() => setShowSqlGuide(!showSqlGuide)}
          className="w-full flex items-center justify-between text-xs font-bold text-[#5E5365] dark:text-slate-300 py-1 hover:text-slate-900 dark:hover:text-white cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#CC8B79]" />
            <span>Esquema SQL para Supabase (Tabla <code>inspections</code> + RLS)</span>
          </div>
          {showSqlGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showSqlGuide && (
          <div className="mt-3 p-4 rounded-2xl bg-slate-900 text-slate-100 border border-slate-800 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-emerald-400">schema_supabase.sql</span>
              <button
                type="button"
                onClick={handleCopySql}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? '¡Copiado!' : 'Copiar SQL'}</span>
              </button>
            </div>

            <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto p-3 bg-black/40 rounded-xl max-h-56 leading-relaxed">
              {SUPABASE_SCHEMA_SQL}
            </pre>

            <div className="text-[11px] text-slate-400 space-y-1">
              <p className="font-semibold text-slate-200">¿Cómo aplicarlo en tu proyecto Supabase?</p>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>Entra a tu consola de Supabase y ve a la sección <strong>SQL Editor</strong>.</li>
                <li>Pega este script y haz clic en <strong>Run</strong>.</li>
                <li>¡Listo! Tu base de datos PostgreSQL quedará configurada para recibir y consultar las inspecciones.</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
