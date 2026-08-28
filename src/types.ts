export type InspectionType = 'Seguridad' | 'Calidad' | 'Medio Ambiente' | 'Operacional';

export type InspectionStatus = 'pendiente' | 'completada' | 'vencida';

export type Severity = 'Baja' | 'Media' | 'Alta' | 'Crítica';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Finding {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  photoUrl?: string;
  createdAt: string;
}

export interface Evidence {
  id: string;
  photoUrl: string;
  caption?: string;
  createdAt: string;
}

export interface SupervisorSignature {
  dataUrl: string;
  supervisorName: string;
  rut?: string;
  date: string;
}

export interface Inspection {
  id: string;
  userId?: string;
  user_id?: string;
  createdByEmail?: string;
  createdByName?: string;
  type: InspectionType;
  company: string;
  faena: string;
  location: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  status: InspectionStatus;
  checklist: ChecklistItem[];
  findings: Finding[];
  evidences: Evidence[];
  signature?: SupervisorSignature | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSession {
  id?: string;
  userId?: string;
  isAuthenticated: boolean;
  email: string;
  name: string;
  role: string;
  companyName?: string;
  rut?: string;
}

export type TabType = 'dashboard' | 'inspections' | 'reports' | 'profile';

export interface AppSettings {
  darkMode: boolean;
  notificationsEnabled: boolean;
  simulatedOffline: boolean;
  soundFeedback: boolean;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
}
