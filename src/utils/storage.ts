import { AppSettings, Inspection, UserSession } from '../types';
import { INITIAL_INSPECTIONS } from '../data/initialData';

const INSPECTIONS_KEY = 'iaptidud_inspections_v1';
const USER_SESSION_KEY = 'iaptidud_user_session';
const SETTINGS_KEY = 'iaptidud_settings_v1';

export const DEFAULT_USER: UserSession = {
  isAuthenticated: false,
  email: '',
  name: 'Supervisor Attach',
  role: 'Supervisor Técnico Senior',
  companyName: 'Attach • Reportabilidad Inteligente'
};

export const DEFAULT_SETTINGS: AppSettings = {
  darkMode: false,
  notificationsEnabled: false,
  simulatedOffline: false,
  soundFeedback: true
};

export function getStoredInspections(): Inspection[] {
  try {
    const raw = localStorage.getItem(INSPECTIONS_KEY);
    if (!raw) {
      localStorage.setItem(INSPECTIONS_KEY, JSON.stringify(INITIAL_INSPECTIONS));
      return INITIAL_INSPECTIONS;
    }
    const parsed: Inspection[] = JSON.parse(raw);
    
    // Auto-migrate legacy supervisor names if present
    let hasChanges = false;
    const migrated = parsed.map(insp => {
      if (insp.signature && /iaptidud/i.test(insp.signature.supervisorName)) {
        hasChanges = true;
        return {
          ...insp,
          signature: {
            ...insp.signature,
            supervisorName: 'Supervisor Attach'
          }
        };
      }
      return insp;
    });

    if (hasChanges) {
      localStorage.setItem(INSPECTIONS_KEY, JSON.stringify(migrated));
    }

    return migrated;
  } catch (err) {
    console.error('Error al leer inspecciones de localStorage:', err);
    return INITIAL_INSPECTIONS;
  }
}

export function saveStoredInspections(inspections: Inspection[]): void {
  try {
    // Ensure no legacy name persists
    const cleaned = inspections.map(insp => {
      if (insp.signature && /iaptidud/i.test(insp.signature.supervisorName)) {
        return {
          ...insp,
          signature: {
            ...insp.signature,
            supervisorName: 'Supervisor Attach'
          }
        };
      }
      return insp;
    });
    localStorage.setItem(INSPECTIONS_KEY, JSON.stringify(cleaned));
  } catch (err) {
    console.error('Error al guardar inspecciones en localStorage:', err);
  }
}

export function getStoredSession(): UserSession {
  try {
    const raw = localStorage.getItem(USER_SESSION_KEY);
    if (!raw) return DEFAULT_USER;
    const parsed = JSON.parse(raw);
    if (/iaptidud/i.test(parsed.name) || /iaptidud/i.test(parsed.companyName)) {
      const updated = {
        ...parsed,
        name: parsed.name ? parsed.name.replace(/iaptidud/gi, 'Attach') : 'Supervisor Attach',
        companyName: 'Attach • Reportabilidad Inteligente'
      };
      localStorage.setItem(USER_SESSION_KEY, JSON.stringify(updated));
      return updated;
    }
    return parsed;
  } catch (err) {
    return DEFAULT_USER;
  }
}

export function saveStoredSession(session: UserSession): void {
  try {
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));
  } catch (err) {
    console.error('Error al guardar sesión:', err);
  }
}

export function getStoredSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return JSON.parse(raw);
  } catch (err) {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Error al guardar configuración:', err);
  }
}

export function resetAllStorageData(): Inspection[] {
  try {
    localStorage.setItem(INSPECTIONS_KEY, JSON.stringify(INITIAL_INSPECTIONS));
    return INITIAL_INSPECTIONS;
  } catch (err) {
    return INITIAL_INSPECTIONS;
  }
}

export function generateId(prefix = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
}
