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
  Info,
  FolderArchive,
  HardDrive
} from 'lucide-react';
import {
  getSupabaseConfig,
  saveSupabaseCustomConfig,
  sanitizeSupabaseUrl,
  sanitizeSupabaseKey,
  testSupabaseConnection,
  testSupabaseStorageConnection,
  fetchInspectionsFromSupabase,
  syncAllInspectionsToSupabase,
  migrateInspectionMultimediaToStorage,
  getActiveBucketName,
  MULTIMEDIA_BUCKET_NAME,
  SUPABASE_SCHEMA_SQL
} from '../lib/supabase';
import { Inspection } from '../types';
import { saveStoredInspections } from '../utils/storage';

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
    storageBucketExists?: boolean;
    storageMessage?: string;
  }>({
    tested: false,
    loading: false,
    success: false,
    message: ''
  });

  const [isSyncingUp, setIsSyncingUp] = useState(false);
  const [isPullingDown, setIsPullingDown] = useState(false);
  const [isOptimizingStorage, setIsOptimizingStorage] = useState(false);
  const [showSqlGuide, setShowSqlGuide] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Count multimedia assets across all inspections
  const totalFindingsPhotos = inspections.reduce(
    (acc, insp) => acc + (insp.findings?.filter((f) => !!f.photoUrl).length || 0),
    0
  );
  const totalEvidencesPhotos = inspections.reduce(
    (acc, insp) => acc + (insp.evidences?.filter((e) => !!e.photoUrl).length || 0),
    0
  );
  const totalSignatures = inspections.filter((insp) => !!insp.signature?.dataUrl).length;
  const totalMultimediaItems = totalFindingsPhotos + totalEvidencesPhotos + totalSignatures;

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
    const dbResult = await testSupabaseConnection();
    const storageResult = await testSupabaseStorageConnection();

    const isOverallSuccess = dbResult.success;
    setTestingStatus({
      tested: true,
      loading: false,
      success: isOverallSuccess,
      message: dbResult.message,
      tableExists: dbResult.tableExists,
      storageBucketExists: storageResult.bucketExists,
      storageMessage: storageResult.message
    });

    if (showToastFeedback) {
      if (isOverallSuccess) {
        onShowToast(
          'success',
          `Conexión a DB y Storage verificadas. ${storageResult.bucketExists ? 'Bucket activo.' : 'Ejecuta el script SQL para crear el bucket de Storage.'}`,
          'Supabase Conectado'
        );
      } else {
        onShowToast('error', dbResult.message, 'Fallo de Conexión');
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
      onShowToast('success', `Se sincronizaron ${result.syncedCount} inspecciones y sus evidencias multimedia con Supabase.`, 'Subida Exitosa');
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

  const handleMigrateMultimediaToStorage = async () => {
    if (!config.isConfigured) {
      onShowToast('warning', 'Configura tu URL y Clave Anon de Supabase primero.', 'Supabase no conectado');
      setIsEditingKeys(true);
      return;
    }

    try {
      setIsOptimizingStorage(true);
      onShowToast('info', 'Subiendo fotos y firmas a Supabase Storage (evidencias-multimedia)...', 'Optimizando Almacenamiento');

      const migratedList: Inspection[] = [];
      for (const insp of inspections) {
        const cleaned = await migrateInspectionMultimediaToStorage(insp);
        migratedList.push(cleaned);
      }

      // Save optimized list to local storage
      saveStoredInspections(migratedList);
      onInspectionsSynced(migratedList);

      // Also sync clean payload to Supabase DB
      await syncAllInspectionsToSupabase(migratedList);

      setIsOptimizingStorage(false);
      onShowToast('success', 'Todas las fotos, firmas y evidencias fueron migradas a Supabase Storage y liberadas del código local.', 'Optimización Completa');
    } catch (err: any) {
      setIsOptimizingStorage(false);
      onShowToast('error', err.message || 'Error durante la optimización', 'Fallo');
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
                Conexión Supabase (DB & Storage)
              </h3>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300">
                PostgreSQL + CDN
              </span>
            </div>
            <p className="text-xs text-[#87778C] dark:text-slate-400 mt-0.5">
              Persistencia cloud en tiempo real y almacenamiento de fotos, firmas y reportes PDF en bucket <code>{MULTIMEDIA_BUCKET_NAME}</code>.
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
              <AlertTriangle className="w-3.5 h-3.5" />
              Credenciales Pendientes
            </span>
          )}
        </div>
      </div>

      {/* Storage Bucket Info Banner */}
      <div className="p-3.5 rounded-2xl bg-[#F0F4F8] dark:bg-[#1E262C] border border-[#BCD1DE] dark:border-[#3E4D59] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#5C788A] dark:text-[#9EB0BE]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-[#5C788A] shrink-0 shadow-2xs">
            <FolderArchive className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#38303B] dark:text-slate-100">Storage de Evidencias Multimedia</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-700">
                {getActiveBucketName()}
              </span>
            </div>
            <p className="text-[11px] text-[#6B5F70] dark:text-slate-400 mt-0.5">
              Fotos de hallazgos, evidencias en terreno, firmas y PDFs respaldados en bucket público CDN.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 font-bold text-[11px] text-[#5C788A] dark:text-[#9EB0BE] border border-[#BCD1DE] dark:border-slate-700 shadow-2xs">
            {totalMultimediaItems} elemento(s) multimedia
          </span>
          <button
            type="button"
            onClick={handleMigrateMultimediaToStorage}
            disabled={isOptimizingStorage || !config.isConfigured}
            className="px-3 py-1.5 rounded-xl bg-[#5C788A] hover:bg-[#4E6777] text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            title="Sube y migra cualquier foto o firma local al Storage de Supabase para optimizar el tamaño de la base de datos"
          >
            <HardDrive className={`w-3.5 h-3.5 ${isOptimizingStorage ? 'animate-spin' : ''}`} />
            <span>{isOptimizingStorage ? 'Migrando...' : 'Migrar a Storage'}</span>
          </button>
        </div>
      </div>

      {/* Diagnostic & Connection Banner */}
      {testingStatus.tested && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex items-start gap-2.5 border transition-all ${
            testingStatus.success
              ? 'bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800/80'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border-rose-200 dark:border-rose-800/80'
          }`}
        >
          {testingStatus.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1 flex-1">
            <p className="font-semibold">{testingStatus.message}</p>
            {testingStatus.storageMessage && (
              <p className="text-[11px] opacity-90">{testingStatus.storageMessage}</p>
            )}
            {testingStatus.success && (!testingStatus.tableExists || !testingStatus.storageBucketExists) && (
              <div className="pt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSqlGuide(true)}
                  className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Layers className="w-3 h-3" />
                  <span>Ver y Copiar Script SQL Completo (Tabla + Storage Bucket)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Configuration Form / Status Bar */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-[#CC8B79]" />
            Parámetros del Proyecto
          </span>
          <button
            type="button"
            onClick={() => setIsEditingKeys(!isEditingKeys)}
            className="text-xs font-bold text-[#5E5365] dark:text-slate-300 hover:underline cursor-pointer"
          >
            {isEditingKeys ? 'Ocultar Campos' : 'Editar Credenciales'}
          </button>
        </div>

        {isEditingKeys ? (
          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Project URL de Supabase (ej: https://xyz.supabase.co)
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="url"
                  value={supabaseUrlInput}
                  onChange={(e) => setSupabaseUrlInput(e.target.value)}
                  placeholder="https://TU_PROYECTO.supabase.co"
                  className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Clave Anónima / Public Anon Key
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={supabaseKeyInput}
                  onChange={(e) => setSupabaseKeyInput(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
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
                Subir a Supabase (DB & Storage)
              </span>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                Guardar {inspections.length} auditorías y evidencias en la nube
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
            <span>Esquema SQL para Supabase (Tabla <code>inspections</code> + Bucket <code>{MULTIMEDIA_BUCKET_NAME}</code>)</span>
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
                <li>¡Listo! La tabla <code>inspections</code> y el bucket <code>{MULTIMEDIA_BUCKET_NAME}</code> quedarán creados con políticas públicas.</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
