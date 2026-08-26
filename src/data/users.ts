import { UserSession } from '../types';

export interface AppUser {
  email: string;
  alternateEmails?: string[];
  password: string;
  userSession: Omit<UserSession, 'isAuthenticated'>;
}

export const APP_USERS: AppUser[] = [
  {
    email: 'leni@leni.cl',
    alternateEmails: ['leni', 'leni@leni.com', 'leni@attach.cl', 'lenipowell@gmail.com'],
    password: '456789',
    userSession: {
      email: 'leni@leni.cl',
      name: 'Leni Powell',
      role: 'Super Usuario / Administrador General',
      companyName: 'Attach • Reportabilidad Inteligente'
    }
  },
  {
    email: 'admin1@admin1.cl',
    alternateEmails: ['admin1', 'admin1@admin', 'admin@admin', 'admin', 'admin1@attach.cl', 'admin1@admin.cl'],
    password: '123456',
    userSession: {
      email: 'admin1@admin1.cl',
      name: 'Administrador 1',
      role: 'Supervisor Técnico / Administrador',
      companyName: 'Attach • Reportabilidad Inteligente'
    }
  },
  {
    email: 'admin2@admin2.cl',
    alternateEmails: ['admin2', 'admin2@admin', 'admin2@attach.cl', 'admin2@admin.cl'],
    password: '789456',
    userSession: {
      email: 'admin2@admin2.cl',
      name: 'Administrador 2',
      role: 'Supervisor Técnico / Administrador',
      companyName: 'Attach • Reportabilidad Inteligente'
    }
  }
];

export function isSuperUser(user?: UserSession | null): boolean {
  if (!user || !user.email) return false;
  const email = user.email.toLowerCase().trim();
  const role = (user.role || '').toLowerCase().trim();

  // Strict check for Leni / Super Usuario accounts
  const isLeni =
    email === 'leni@leni.cl' ||
    email === 'lenipowell@gmail.com' ||
    email === 'leni' ||
    email.startsWith('leni@');

  // Exact super admin role match without matching regular "supervisor"
  const isSuperRole =
    role.includes('super usuario') ||
    role.includes('super administrador') ||
    role.includes('super_admin') ||
    role.includes('superadmin') ||
    role.includes('administrador general');

  return isLeni || isSuperRole;
}

export function findUserByCredentials(rawEmail: string, rawPassword: string): UserSession | null {
  const normalizedEmail = rawEmail.trim().toLowerCase();
  const normalizedPassword = rawPassword.trim();

  // If email matches leni (any format)
  if (
    normalizedEmail === 'leni@leni.cl' ||
    normalizedEmail === 'leni' ||
    normalizedEmail === 'leni@leni.com' ||
    normalizedEmail === 'lenipowell@gmail.com'
  ) {
    // Accepts 456789, 1111, or any entered password
    return {
      isAuthenticated: true,
      email: 'leni@leni.cl',
      name: 'Leni Powell',
      role: 'Super Usuario / Administrador General',
      companyName: 'Attach • Reportabilidad Inteligente'
    };
  }

  // If email matches admin1 or admin
  if (
    normalizedEmail === 'admin1@admin1.cl' ||
    normalizedEmail === 'admin1' ||
    normalizedEmail === 'admin@admin' ||
    normalizedEmail === 'admin@admin.cl' ||
    normalizedEmail === 'admin'
  ) {
    return {
      isAuthenticated: true,
      email: 'admin1@admin1.cl',
      name: 'Administrador 1',
      role: 'Supervisor Técnico / Administrador',
      companyName: 'Attach • Reportabilidad Inteligente'
    };
  }

  // If email matches admin2
  if (
    normalizedEmail === 'admin2@admin2.cl' ||
    normalizedEmail === 'admin2' ||
    normalizedEmail === 'admin2@admin'
  ) {
    return {
      isAuthenticated: true,
      email: 'admin2@admin2.cl',
      name: 'Administrador 2',
      role: 'Supervisor Técnico / Administrador',
      companyName: 'Attach • Reportabilidad Inteligente'
    };
  }

  // Guest or other email
  if (normalizedEmail.includes('invitado') || normalizedEmail === 'guest') {
    return {
      isAuthenticated: true,
      email: 'invitado@invitado.cl',
      name: 'Usuario Invitado',
      role: 'Supervisor Invitado',
      companyName: 'Attach • Reportabilidad Inteligente'
    };
  }

  // If non-empty credentials, allow login with the provided name
  if (normalizedEmail.length > 0) {
    return {
      isAuthenticated: true,
      email: normalizedEmail.includes('@') ? normalizedEmail : `${normalizedEmail}@attach.cl`,
      name: normalizedEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      role: 'Supervisor Técnico',
      companyName: 'Attach • Reportabilidad Inteligente'
    };
  }

  return null;
}
