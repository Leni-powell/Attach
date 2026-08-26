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

    const inspectionWithUser: Inspection = {
      ...inspection,
      userId: finalUserId || undefined,
      user_id: finalUserId || undefined,
      createdByEmail: finalCreatedEmail || undefined,
      createdByName: finalCreatedName || undefined,
    };

    const dbRow = {
      id: inspection.id,
      user_id: finalUserId,
      type: inspection.type,
      company: inspection.company,
      faena: inspection.faena,
      location: inspection.location,
      date: inspection.date,
      status: inspection.status,
      checklist: inspection.checklist,
      findings: inspection.findings,
      evidences: inspection.evidences,
      signature: inspection.signature || null,
      notes: inspection.notes || '',
      created_by_email: finalCreatedEmail,
      created_by_name: finalCreatedName,
      created_at: inspection.createdAt,
      updated_at: inspection.updatedAt,
      payload: inspectionWithUser, // Store complete JSON payload including user_id
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
 * Batch sync multiple inspections to Supabase with user association
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
    const rows = inspections.map((insp) => {
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

/**
 * SQL creation script provided for users to run on Supabase SQL Editor
 */
export const SUPABASE_SCHEMA_SQL = `-- 1. TABLA PRINCIPAL DE INSPECCIONES (Vinculada a usuario autenticado de Supabase)
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

-- 2. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICA DE ACCESO (Permitir lectura y escritura a clientes autenticados y clave anon)
CREATE POLICY "Permitir acceso a inspecciones" 
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
`;

