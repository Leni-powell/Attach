import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { Inspection, UserSession } from '../types';

// Read config from Vite client-side environment variables or localStorage override
const STORAGE_SUPABASE_URL_KEY = 'attach_supabase_url_config';
const STORAGE_SUPABASE_KEY_KEY = 'attach_supabase_key_config';

/**
 * Robustly sanitizes and normalizes Supabase Project URLs.
 * Handles trailing slashes, /rest/v1 paths, and dashboard URLs.
 */
export function sanitizeSupabaseUrl(rawUrl: string): string {
  let url = (rawUrl || '').trim();
  // Strip enclosing quotes
  url = url.replace(/^['"]+|['"]+$/g, '');

  if (!url) return '';

  // If user pasted dashboard link: https://supabase.com/dashboard/project/<ref-id>/...
  const dashboardMatch = url.match(/supabase\.com\/dashboard\/project\/([a-zA-Z0-9_-]+)/);
  if (dashboardMatch && dashboardMatch[1]) {
    return `https://${dashboardMatch[1]}.supabase.co`;
  }

  // Ensure protocol
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  try {
    const parsed = new URL(url);
    // Supabase client expects strictly the origin without subpaths like /rest/v1
    return parsed.origin;
  } catch {
    // Fallback: strip trailing slashes or subpaths
    return url.replace(/\/+$/, '').replace(/\/rest\/v1.*$/i, '');
  }
}

/**
 * Sanitizes Supabase API key (removes quotes, 'Bearer ' prefix, whitespace).
 */
export function sanitizeSupabaseKey(rawKey: string): string {
  let key = (rawKey || '').trim();
  key = key.replace(/^['"]+|['"]+$/g, '');
  key = key.replace(/^Bearer\s+/i, '');
  return key;
}

export function getSupabaseConfig(): { url: string; anonKey: string; isConfigured: boolean } {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const storedUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_SUPABASE_URL_KEY) || '' : '';
  const storedKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_SUPABASE_KEY_KEY) || '' : '';

  const rawUrl = storedUrl.trim() || envUrl.trim();
  const rawKey = storedKey.trim() || envKey.trim();

  const url = sanitizeSupabaseUrl(rawUrl);
  const anonKey = sanitizeSupabaseKey(rawKey);

  const isConfigured = Boolean(
    url &&
    anonKey &&
    url.startsWith('https://') &&
    anonKey.length > 10 &&
    !url.includes('placeholder') &&
    !anonKey.includes('placeholder')
  );

  return { url, anonKey, isConfigured };
}

export function saveSupabaseCustomConfig(url: string, anonKey: string): void {
  if (typeof window !== 'undefined') {
    const cleanUrl = sanitizeSupabaseUrl(url);
    const cleanKey = sanitizeSupabaseKey(anonKey);

    if (cleanUrl) {
      localStorage.setItem(STORAGE_SUPABASE_URL_KEY, cleanUrl);
    } else {
      localStorage.removeItem(STORAGE_SUPABASE_URL_KEY);
    }

    if (cleanKey) {
      localStorage.setItem(STORAGE_SUPABASE_KEY_KEY, cleanKey);
    } else {
      localStorage.removeItem(STORAGE_SUPABASE_KEY_KEY);
    }
    // Invalidate cached client
    cachedClient = null;
  }
}

let cachedClient: SupabaseClient | null = null;
let cachedConfigKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) {
    return null;
  }

  const currentKey = `${url}_${anonKey}`;
  if (cachedClient && cachedConfigKey === currentKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    cachedConfigKey = currentKey;
    return cachedClient;
  } catch (err) {
    console.error('Error initializing Supabase client:', err);
    return null;
  }
}

// -------------------------------------------------------------
// SUPABASE AUTHENTICATION HELPERS
// -------------------------------------------------------------

/**
 * Maps a Supabase Auth User object to our application UserSession interface.
 */
export function mapSupabaseUserToSession(sbUser: User | null): UserSession | null {
  if (!sbUser) return null;

  const metadata = sbUser.user_metadata || {};
  const email = sbUser.email || '';
  
  // Build a friendly name from metadata or email username
  const name =
    metadata.name ||
    metadata.full_name ||
    (email ? email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Supervisor Attach');

  const role = metadata.role || 'Supervisor Técnico';
  const companyName = metadata.company_name || metadata.companyName || 'Attach • Reportabilidad Inteligente';
  const rut = metadata.rut || '';

  return {
    id: sbUser.id,
    userId: sbUser.id,
    email,
    name,
    role,
    companyName,
    rut,
    isAuthenticated: true,
  };
}

/**
 * Sign in using Supabase Auth (Email + Password)
 */
export async function signInWithSupabase(
  email: string,
  password: string
): Promise<{ userSession: UserSession | null; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      userSession: null,
      error: 'Supabase no está configurado. Configure la URL y Clave Anon en los ajustes.',
    };
  }

  try {
    const { data, error } = await client.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      let friendlyMessage = error.message;
      if (error.message.includes('Invalid login credentials')) {
        friendlyMessage = 'Credenciales incorrectas. Verifique su correo y contraseña en Supabase.';
      } else if (error.message.includes('Email not confirmed')) {
        friendlyMessage = 'El correo electrónico no ha sido confirmado en Supabase.';
      }
      return { userSession: null, error: friendlyMessage };
    }

    if (!data.user) {
      return { userSession: null, error: 'No se pudo obtener el usuario autenticado.' };
    }

    const session = mapSupabaseUserToSession(data.user);
    return { userSession: session, error: null };
  } catch (err: any) {
    return {
      userSession: null,
      error: err.message || 'Error de conexión con Supabase Auth.',
    };
  }
}

/**
 * Sign up a new user using Supabase Auth (Email + Password + Metadata)
 */
export async function signUpWithSupabase(
  email: string,
  password: string,
  metadata?: { name?: string; role?: string; companyName?: string; rut?: string }
): Promise<{
  userSession: UserSession | null;
  error: string | null;
  needsEmailConfirmation?: boolean;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      userSession: null,
      error: 'Supabase no está configurado. Ingrese la URL y Clave Anon.',
    };
  }

  try {
    const { data, error } = await client.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          name: metadata?.name || email.trim().split('@')[0],
          role: metadata?.role || 'Supervisor Técnico',
          company_name: metadata?.companyName || 'Attach • Reportabilidad Inteligente',
          rut: metadata?.rut || '',
        },
      },
    });

    if (error) {
      return { userSession: null, error: error.message };
    }

    if (data.user) {
      // If Supabase has email confirmation enabled and session is empty
      if (!data.session) {
        return {
          userSession: mapSupabaseUserToSession(data.user),
          error: null,
          needsEmailConfirmation: true,
        };
      }

      return {
        userSession: mapSupabaseUserToSession(data.user),
        error: null,
        needsEmailConfirmation: false,
      };
    }

    return { userSession: null, error: 'No se pudo crear la cuenta de usuario.' };
  } catch (err: any) {
    return {
      userSession: null,
      error: err.message || 'Error al registrar usuario en Supabase.',
    };
  }
}

/**
 * Sign out from Supabase Auth
 */
export async function signOutSupabase(): Promise<{ success: boolean; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: true, error: null };
  }

  try {
    const { error } = await client.auth.signOut();
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al cerrar sesión' };
  }
}

/**
 * Get current active Supabase session user if any exists
 */
export async function getCurrentSupabaseUser(): Promise<UserSession | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data } = await client.auth.getSession();
    if (data?.session?.user) {
      return mapSupabaseUserToSession(data.session.user);
    }
    return null;
  } catch (err) {
    console.warn('Error fetching Supabase session:', err);
    return null;
  }
}

/**
 * Subscribes to Supabase Auth state changes
 */
export function onSupabaseAuthStateChange(
  callback: (session: UserSession | null) => void
): { unsubscribe: () => void } {
  const client = getSupabaseClient();
  if (!client) {
    return { unsubscribe: () => {} };
  }

  const { data } = client.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      callback(mapSupabaseUserToSession(session.user));
    } else {
      callback(null);
    }
  });

  return {
    unsubscribe: () => {
      data.subscription.unsubscribe();
    },
  };
}

// -------------------------------------------------------------
// INSPECTIONS DATA OPERATIONS & USER ASSOCIATION
// -------------------------------------------------------------

/**
 * Tests connection to Supabase instance and checks if the required 'inspections' table exists.
 */
export async function testSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
  tableExists?: boolean;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'Supabase no está configurado. Ingrese la URL del proyecto y la Clave Anon.',
    };
  }

  try {
    // Try a simple select to verify table and connectivity
    const { data, error } = await client
      .from('inspections')
      .select('id')
      .limit(1);

    if (error) {
      // 42P01 in PostgreSQL means relation does not exist
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return {
          success: true,
          tableExists: false,
          message: 'Conectado a Supabase exitosamente. Falta crear la tabla "inspections" en el SQL Editor.',
        };
      }
      return {
        success: false,
        message: `Error de conexión: ${error.message || 'Credenciales no válidas'}`,
      };
    }

    return {
      success: true,
      tableExists: true,
      message: 'Conexión exitosa y tabla de inspecciones verificada.',
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Fallo al contactar Supabase: ${err.message || 'Error de red'}`,
    };
  }
}

/**
 * Fetch all inspections from Supabase, preserving user_id and creator information
 */
export async function fetchInspectionsFromSupabase(userIdFilter?: string): Promise<{
  data: Inspection[] | null;
  error: string | null;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: 'Supabase no configurado' };
  }

  try {
    let query = client
      .from('inspections')
      .select('*')
      .order('created_at', { ascending: false });

    if (userIdFilter) {
      query = query.eq('user_id', userIdFilter);
    }

    const { data, error } = await query;

    if (error) {
      return { data: null, error: error.message };
    }

    if (!data) {
      return { data: [], error: null };
    }

    // Map database snake_case or raw json column to App Inspection interface
    const mapped: Inspection[] = data.map((row: any) => {
      const payload = row.payload || {};
      const uId = row.user_id || payload.userId || payload.user_id || undefined;
      const createdEmail = row.created_by_email || payload.createdByEmail || undefined;
      const createdName = row.created_by_name || payload.createdByName || undefined;

      const baseItem = row.payload ? { ...row.payload } : { ...row };

      return {
        id: row.id || baseItem.id,
        userId: uId,
        user_id: uId,
        createdByEmail: createdEmail,
        createdByName: createdName,
        type: baseItem.type || row.type || 'Seguridad',
        company: baseItem.company || row.company || '',
        faena: baseItem.faena || row.faena || '',
        location: baseItem.location || row.location || '',
        date: baseItem.date || row.date || new Date().toISOString().split('T')[0],
        status: baseItem.status || row.status || 'pendiente',
        checklist: Array.isArray(baseItem.checklist) ? baseItem.checklist : (Array.isArray(row.checklist) ? row.checklist : []),
        findings: Array.isArray(baseItem.findings) ? baseItem.findings : (Array.isArray(row.findings) ? row.findings : []),
        evidences: Array.isArray(baseItem.evidences) ? baseItem.evidences : (Array.isArray(row.evidences) ? row.evidences : []),
        signature: baseItem.signature || row.signature || null,
        notes: baseItem.notes || row.notes || '',
        createdAt: baseItem.createdAt || row.created_at || new Date().toISOString(),
        updatedAt: baseItem.updatedAt || row.updated_at || new Date().toISOString(),
      };
    });

    return { data: mapped, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Error al obtener inspecciones de Supabase' };
  }
}

/**
 * Upsert / Save a single inspection to Supabase with user_id association
 */
export async function saveInspectionToSupabase(
  inspection: Inspection,
  currentUserId?: string,
  currentUserEmail?: string,
  currentUserName?: string
): Promise<{
  success: boolean;
  error: string | null;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase no configurado' };
  }

  try {
    const finalUserId = inspection.userId || inspection.user_id || currentUserId || null;
    const finalCreatedEmail = inspection.createdByEmail || currentUserEmail || null;
    const finalCreatedName = inspection.createdByName || currentUserName || null;

    // Automatically offload any embedded base64 multimedia (photos, signatures) to Supabase Storage
    let preparedInspection = { ...inspection };
    try {
      preparedInspection = await migrateInspectionMultimediaToStorage(preparedInspection);
    } catch (migErr) {
      console.warn('Multimedia storage upload fallback:', migErr);
    }

    const inspectionWithUser: Inspection = {
      ...preparedInspection,
      userId: finalUserId || undefined,
      user_id: finalUserId || undefined,
      createdByEmail: finalCreatedEmail || undefined,
      createdByName: finalCreatedName || undefined,
    };

    const dbRow = {
      id: preparedInspection.id,
      user_id: finalUserId,
      type: preparedInspection.type,
      company: preparedInspection.company,
      faena: preparedInspection.faena,
      location: preparedInspection.location,
      date: preparedInspection.date,
      status: preparedInspection.status,
      checklist: preparedInspection.checklist,
      findings: preparedInspection.findings,
      evidences: preparedInspection.evidences,
      signature: preparedInspection.signature || null,
      notes: preparedInspection.notes || '',
      created_by_email: finalCreatedEmail,
      created_by_name: finalCreatedName,
      created_at: preparedInspection.createdAt,
      updated_at: preparedInspection.updatedAt,
      payload: inspectionWithUser, // Store clean JSON payload with storage CDN URLs
    };

    const { error } = await client
      .from('inspections')
      .upsert(dbRow, { onConflict: 'id' });

    if (error) {
      console.error('Error saving inspection to Supabase:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error('Exception saving to Supabase:', err);
    return { success: false, error: err.message || 'Error de conexión' };
  }
}

/**
 * Batch sync multiple inspections to Supabase with user association and multimedia migration
 */
export async function syncAllInspectionsToSupabase(
  inspections: Inspection[],
  currentUserId?: string,
  currentUserEmail?: string,
  currentUserName?: string
): Promise<{
  success: boolean;
  syncedCount: number;
  error: string | null;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, syncedCount: 0, error: 'Supabase no configurado' };
  }

  if (inspections.length === 0) {
    return { success: true, syncedCount: 0, error: null };
  }

  try {
    const preparedList: Inspection[] = [];
    for (const insp of inspections) {
      try {
        const cleaned = await migrateInspectionMultimediaToStorage(insp);
        preparedList.push(cleaned);
      } catch {
        preparedList.push(insp);
      }
    }

    const rows = preparedList.map((insp) => {
      const finalUserId = insp.userId || insp.user_id || currentUserId || null;
      const finalCreatedEmail = insp.createdByEmail || currentUserEmail || null;
      const finalCreatedName = insp.createdByName || currentUserName || null;

      const inspWithUser = {
        ...insp,
        userId: finalUserId || undefined,
        user_id: finalUserId || undefined,
        createdByEmail: finalCreatedEmail || undefined,
        createdByName: finalCreatedName || undefined,
      };

      return {
        id: insp.id,
        user_id: finalUserId,
        type: insp.type,
        company: insp.company,
        faena: insp.faena,
        location: insp.location,
        date: insp.date,
        status: insp.status,
        checklist: insp.checklist,
        findings: insp.findings,
        evidences: insp.evidences,
        signature: insp.signature || null,
        notes: insp.notes || '',
        created_by_email: finalCreatedEmail,
        created_by_name: finalCreatedName,
        created_at: insp.createdAt,
        updated_at: insp.updatedAt,
        payload: inspWithUser,
      };
    });

    const { error } = await client
      .from('inspections')
      .upsert(rows, { onConflict: 'id' });

    if (error) {
      return { success: false, syncedCount: 0, error: error.message };
    }

    return { success: true, syncedCount: inspections.length, error: null };
  } catch (err: any) {
    return { success: false, syncedCount: 0, error: err.message || 'Error al sincronizar datos' };
  }
}

/**
 * Delete inspection from Supabase
 */
export async function deleteInspectionFromSupabase(id: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase no configurado' };
  }

  try {
    const { error } = await client.from('inspections').delete().eq('id', id);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al eliminar en Supabase' };
  }
}

// -------------------------------------------------------------
// SUPABASE STORAGE (EVIDENCIAS MULTIMEDIA Y REPORTES PDF)
// -------------------------------------------------------------

export const MULTIMEDIA_BUCKET_NAME = 'evidencia-multimedia';
export const ALT_MULTIMEDIA_BUCKET_NAME = 'evidencias-multimedia';

let resolvedBucketName = 'evidencia-multimedia';

export function getActiveBucketName(): string {
  return resolvedBucketName;
}

export function setActiveBucketName(name: string): void {
  resolvedBucketName = name;
}

/**
 * Converts a Base64 / Data URL to a native JavaScript Blob with MIME detection.
 */
export function dataUrlToBlob(dataUrl: string): { blob: Blob; mimeType: string; extension: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
  if (!match) {
    // Fallback: standard utf8 blob
    return {
      blob: new Blob([dataUrl], { type: 'text/plain' }),
      mimeType: 'text/plain',
      extension: 'txt'
    };
  }

  const mimeType = match[1];
  const b64Data = match[2];
  const byteCharacters = atob(b64Data);
  const byteArrays: Uint8Array[] = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    byteArrays.push(new Uint8Array(byteNumbers));
  }

  const blob = new Blob(byteArrays, { type: mimeType });
  let extension = 'png';
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) extension = 'jpg';
  else if (mimeType.includes('webp')) extension = 'webp';
  else if (mimeType.includes('pdf')) extension = 'pdf';

  return { blob, mimeType, extension };
}

/**
 * Uploads a file, Blob or Base64 string directly to Supabase Storage bucket 'evidencias-multimedia'.
 */
export async function uploadToMultimediaStorage(
  filePath: string,
  source: File | Blob | string,
  customContentType?: string
): Promise<{ publicUrl: string | null; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { publicUrl: null, error: 'Supabase no configurado' };
  }

  try {
    let fileBody: File | Blob;
    let contentType = customContentType || 'image/png';

    if (typeof source === 'string') {
      if (source.startsWith('data:')) {
        const converted = dataUrlToBlob(source);
        fileBody = converted.blob;
        contentType = customContentType || converted.mimeType;
      } else {
        // Already a remote URL
        return { publicUrl: source, error: null };
      }
    } else {
      fileBody = source;
      contentType = customContentType || source.type || 'image/png';
    }

    // Clean file path (remove leading slashes)
    const cleanPath = filePath.replace(/^\/+/, '');
    const targetBucket = getActiveBucketName();

    const { data: _uploadData, error: uploadError } = await client.storage
      .from(targetBucket)
      .upload(cleanPath, fileBody, {
        contentType,
        upsert: true,
        cacheControl: '3600'
      });

    if (uploadError) {
      // If failed on primary bucket, try alternative bucket name if available
      const altBucket = targetBucket === MULTIMEDIA_BUCKET_NAME ? ALT_MULTIMEDIA_BUCKET_NAME : MULTIMEDIA_BUCKET_NAME;
      const { error: retryError } = await client.storage
        .from(altBucket)
        .upload(cleanPath, fileBody, {
          contentType,
          upsert: true,
          cacheControl: '3600'
        });

      if (!retryError) {
        setActiveBucketName(altBucket);
        const { data: altUrlData } = client.storage.from(altBucket).getPublicUrl(cleanPath);
        return { publicUrl: altUrlData.publicUrl, error: null };
      }

      console.warn(`Error uploading to ${targetBucket}/${cleanPath}:`, uploadError.message);
      return { publicUrl: null, error: uploadError.message };
    }

    // Get public URL
    const { data: urlData } = client.storage
      .from(targetBucket)
      .getPublicUrl(cleanPath);

    return { publicUrl: urlData.publicUrl, error: null };
  } catch (err: any) {
    console.error('Exception uploading to storage:', err);
    return { publicUrl: null, error: err.message || 'Error al subir archivo a Storage' };
  }
}

/**
 * Uploads a finding photo to Supabase Storage (evidencias-multimedia/hallazgos/...)
 */
export async function uploadFindingPhotoToStorage(
  inspectionId: string,
  findingId: string,
  photoSource: string | File | Blob
): Promise<{ publicUrl: string | null; error: string | null }> {
  const timestamp = Date.now();
  const path = `hallazgos/${inspectionId}/${findingId}_${timestamp}.jpg`;
  return uploadToMultimediaStorage(path, photoSource, 'image/jpeg');
}

/**
 * Uploads a general inspection evidence photo to Supabase Storage (evidencias-multimedia/evidencias/...)
 */
export async function uploadEvidencePhotoToStorage(
  inspectionId: string,
  evidenceId: string,
  photoSource: string | File | Blob
): Promise<{ publicUrl: string | null; error: string | null }> {
  const timestamp = Date.now();
  const path = `evidencias/${inspectionId}/${evidenceId}_${timestamp}.jpg`;
  return uploadToMultimediaStorage(path, photoSource, 'image/jpeg');
}

/**
 * Uploads a supervisor signature canvas drawing to Supabase Storage (evidencias-multimedia/firmas/...)
 */
export async function uploadSignatureToStorage(
  inspectionId: string,
  signatureDataUrl: string
): Promise<{ publicUrl: string | null; error: string | null }> {
  const timestamp = Date.now();
  const path = `firmas/${inspectionId}/firma_${timestamp}.png`;
  return uploadToMultimediaStorage(path, signatureDataUrl, 'image/png');
}

/**
 * Uploads an official PDF inspection report to Supabase Storage (evidencias-multimedia/reportes-pdf/...)
 */
export async function uploadPdfReportToStorage(
  fileName: string,
  pdfBlob: Blob
): Promise<{ publicUrl: string | null; error: string | null }> {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `reportes-pdf/${safeName}`;
  return uploadToMultimediaStorage(path, pdfBlob, 'application/pdf');
}

/**
 * Automatically inspects and offloads all heavy embedded Base64 multimedia items 
 * (finding photos, evidences, signatures) to Supabase Storage, freeing memory and DB payload size.
 */
export async function migrateInspectionMultimediaToStorage(inspection: Inspection): Promise<Inspection> {
  const client = getSupabaseClient();
  if (!client) return inspection;

  const updated: Inspection = JSON.parse(JSON.stringify(inspection));
  let changed = false;

  // 1. Process Findings photos
  if (Array.isArray(updated.findings)) {
    for (let i = 0; i < updated.findings.length; i++) {
      const f = updated.findings[i];
      if (f.photoUrl && f.photoUrl.startsWith('data:')) {
        const { publicUrl } = await uploadFindingPhotoToStorage(updated.id, f.id, f.photoUrl);
        if (publicUrl) {
          f.photoUrl = publicUrl;
          changed = true;
        }
      }
    }
  }

  // 2. Process Evidences photos
  if (Array.isArray(updated.evidences)) {
    for (let i = 0; i < updated.evidences.length; i++) {
      const e = updated.evidences[i];
      if (e.photoUrl && e.photoUrl.startsWith('data:')) {
        const { publicUrl } = await uploadEvidencePhotoToStorage(updated.id, e.id, e.photoUrl);
        if (publicUrl) {
          e.photoUrl = publicUrl;
          changed = true;
        }
      }
    }
  }

  // 3. Process Signature image
  if (updated.signature?.dataUrl && updated.signature.dataUrl.startsWith('data:')) {
    const { publicUrl } = await uploadSignatureToStorage(updated.id, updated.signature.dataUrl);
    if (publicUrl) {
      updated.signature.dataUrl = publicUrl;
      changed = true;
    }
  }

  if (changed) {
    updated.updatedAt = new Date().toISOString();
  }

  return updated;
}

/**
 * Tests connection to Supabase Storage and verifies if 'evidencias-multimedia' bucket exists.
 */
export async function testSupabaseStorageConnection(): Promise<{
  success: boolean;
  bucketExists: boolean;
  message: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      bucketExists: false,
      message: 'Supabase no está configurado.'
    };
  }

  try {
    const { data: buckets, error: bucketsError } = await client.storage.listBuckets();
    if (bucketsError) {
      return {
        success: false,
        bucketExists: false,
        message: `Fallo al verificar Storage: ${bucketsError.message}`
      };
    }

    const bucketFound = buckets?.find(
      (b) => b.name === MULTIMEDIA_BUCKET_NAME || b.id === MULTIMEDIA_BUCKET_NAME ||
             b.name === ALT_MULTIMEDIA_BUCKET_NAME || b.id === ALT_MULTIMEDIA_BUCKET_NAME
    );

    if (!bucketFound) {
      return {
        success: true,
        bucketExists: false,
        message: `Conectado a Storage. Falta crear el bucket "${MULTIMEDIA_BUCKET_NAME}".`
      };
    }

    setActiveBucketName(bucketFound.name || bucketFound.id);

    return {
      success: true,
      bucketExists: true,
      message: `Storage activo y bucket "${bucketFound.name || bucketFound.id}" verificado exitosamente.`
    };
  } catch (err: any) {
    return {
      success: false,
      bucketExists: false,
      message: `Error al probar Storage: ${err.message || 'Error de red'}`
    };
  }
}

/**
 * SQL creation script provided for users to run on Supabase SQL Editor
 */
export const SUPABASE_SCHEMA_SQL = `-- =============================================================================
-- 1. TABLA PRINCIPAL DE INSPECCIONES (Vinculada a usuario autenticado de Supabase)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.inspections (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  company TEXT NOT NULL,
  faena TEXT NOT NULL,
  location TEXT,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendiente',
  checklist JSONB DEFAULT '[]'::jsonb,
  findings JSONB DEFAULT '[]'::jsonb,
  evidences JSONB DEFAULT '[]'::jsonb,
  signature JSONB,
  notes TEXT,
  created_by_email TEXT,
  created_by_name TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 2. HABILITAR ROW LEVEL SECURITY (RLS) EN TABLA INSPECCIONES
-- =============================================================================
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICA DE ACCESO (Permitir lectura y escritura a clientes autenticados y clave anon)
CREATE POLICY "Permitir acceso total a inspecciones" 
ON public.inspections 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

-- 4. ÍNDICES PARA BÚSQUEDA, HISTORIAL Y RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_inspections_user_id ON public.inspections(user_id);
CREATE INDEX IF NOT EXISTS idx_inspections_company ON public.inspections(company);
CREATE INDEX IF NOT EXISTS idx_inspections_date ON public.inspections(date);
CREATE INDEX IF NOT EXISTS idx_inspections_status ON public.inspections(status);

-- =============================================================================
-- 5. CREACIÓN DEL BUCKET SUPABASE STORAGE: evidencias-multimedia
-- (Para Fotos de Hallazgos, Evidencias, Firmas y Reportes PDF)
-- =============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'evidencias-multimedia',
  'evidencias-multimedia',
  true,
  52428800, -- 50 MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE 
SET public = true, 
    file_size_limit = 52428800;

-- 6. POLÍTICAS DE ACCESO PARA SUPABASE STORAGE (Lectura y Subida Pública / Autenticada)
CREATE POLICY "Acceso de lectura publica evidencias multimedia"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'evidencias-multimedia');

CREATE POLICY "Permitir subida a evidencias multimedia"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'evidencias-multimedia');

CREATE POLICY "Permitir actualizacion en evidencias multimedia"
ON storage.objects
FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'evidencias-multimedia');

CREATE POLICY "Permitir eliminacion en evidencias multimedia"
ON storage.objects
FOR DELETE
TO anon, authenticated
USING (bucket_id = 'evidencias-multimedia');
`;

