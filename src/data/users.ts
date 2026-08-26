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
    alternateEmails: ['leni@leni.com', 'leni@attach.cl'],
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
    alternateEmails: ['admin1@attach.cl', 'admin1@admin.cl'],
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
    alternateEmails: ['admin2@attach.cl', 'admin2@admin.cl'],
    password: '789456',
    userSession: {
      email: 'admin2@admin2.cl',
      name: 'Administrador 2',
      role: 'Supervisor Técnico / Administrador',
      companyName: 'Attach • Reportabilidad Inteligente'
    }
  }
];

export function findUserByCredentials(rawEmail: string, rawPassword: string): UserSession | null {
  const normalizedEmail = rawEmail.trim().toLowerCase();
  const normalizedPassword = rawPassword.trim();

  // Legacy fallback if anyone still had admin@admin.cl / 1234 saved
  if (normalizedEmail === 'admin@admin.cl' && normalizedPassword === '1234') {
    return {
      isAuthenticated: true,
      email: 'admin@admin.cl',
      name: 'Admin Supervisor',
      role: 'Subusuario / Supervisor Técnico Senior',
      companyName: 'Attach • Reportabilidad Inteligente'
    };
  }

  const match = APP_USERS.find((u) => {
    const isEmailMatch =
      u.email.toLowerCase() === normalizedEmail ||
      (u.alternateEmails && u.alternateEmails.some((alt) => alt.toLowerCase() === normalizedEmail));
    return isEmailMatch && u.password === normalizedPassword;
  });

  if (match) {
    return {
      ...match.userSession,
      isAuthenticated: true
    };
  }

  return null;
}
