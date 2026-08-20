import { Inspection } from '../types';

// Sample signature SVG data URL for the seeded completed inspection
const SAMPLE_SIGNATURE_DATA_URL = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="120" viewBox="0 0 300 120"><path d="M20 70 Q 50 20, 80 60 T 140 50 T 200 70 Q 230 40, 270 60" fill="none" stroke="%230057B8" stroke-width="3" stroke-linecap="round"/><path d="M60 90 Q 150 75, 240 85" fill="none" stroke="%230057B8" stroke-width="2" stroke-linecap="round"/></svg>';

export const INITIAL_INSPECTIONS: Inspection[] = [
  {
    id: 'insp-001',
    type: 'Seguridad',
    company: 'Minera Los Andes',
    faena: 'Faena Norte',
    location: 'Sector A',
    date: '2026-08-18',
    status: 'completada',
    checklist: [
      {
        id: 'chk-101',
        text: 'Uso obligatorio de EPP completo y en buen estado (casco, lentes, calzado, chaleco)',
        completed: true
      },
      {
        id: 'chk-102',
        text: 'Sistema de bloqueo y etiquetado de energía (LOTO) implementado',
        completed: true
      },
      {
        id: 'chk-103',
        text: 'Señalización de peligro y delimitación de áreas de trabajo',
        completed: true
      },
      {
        id: 'chk-104',
        text: 'Extintores de incendio vigentes, rotulados y con acceso despejado',
        completed: true
      }
    ],
    findings: [
      {
        id: 'fnd-101',
        title: 'Extintor bloqueado temporalmente por pallets',
        description: 'Se detecta extintor PQS de 10kg con acceso obstaculizado por acopio provisorio de materiales en el pasillo principal del Sector A.',
        severity: 'Alta',
        photoUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=600&auto=format&fit=crop&q=80',
        createdAt: '2026-08-18T14:30:00.000Z'
      }
    ],
    evidences: [
      {
        id: 'evi-101',
        photoUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80',
        caption: 'Panorámica de seguridad Sector A al inicio de jornada',
        createdAt: '2026-08-18T14:15:00.000Z'
      }
    ],
    signature: {
      dataUrl: SAMPLE_SIGNATURE_DATA_URL,
      supervisorName: 'Admin Attach',
      date: '2026-08-18 16:45'
    },
    notes: 'Inspección de rutina completada. Se solicitó despeje inmediato de extintor.',
    createdAt: '2026-08-18T14:00:00.000Z',
    updatedAt: '2026-08-18T16:45:00.000Z'
  },
  {
    id: 'insp-002',
    type: 'Calidad',
    company: 'Constructora Sur',
    faena: 'Edificio B',
    location: 'Piso 3',
    date: '2026-08-20',
    status: 'pendiente',
    checklist: [
      {
        id: 'chk-201',
        text: 'Verificación de materiales según especificaciones técnicas y certificados de calidad',
        completed: true
      },
      {
        id: 'chk-202',
        text: 'Control de tolerancias dimensionales, plomos y niveles de obra',
        completed: false
      },
      {
        id: 'chk-203',
        text: 'Ensayos de adherencia / rotura de probetas de hormigón al día',
        completed: false
      },
      {
        id: 'chk-204',
        text: 'Trazabilidad de lotes, partidas y registros de recepción conforme',
        completed: false
      }
    ],
    findings: [],
    evidences: [
      {
        id: 'evi-201',
        photoUrl: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=600&auto=format&fit=crop&q=80',
        caption: 'Recepción de armaduras Piso 3',
        createdAt: '2026-08-20T09:00:00.000Z'
      }
    ],
    signature: null,
    notes: 'Pendiente verificar resultados de laboratorio para losa de hormigón.',
    createdAt: '2026-08-19T08:30:00.000Z',
    updatedAt: '2026-08-19T09:15:00.000Z'
  },
  {
    id: 'insp-003',
    type: 'Medio Ambiente',
    company: 'Energía Austral',
    faena: 'Sala máquinas',
    location: 'Sector B',
    date: '2026-08-15',
    status: 'vencida',
    checklist: [
      {
        id: 'chk-301',
        text: 'Segregación adecuada de residuos sólidos y peligrosos (RESPEL)',
        completed: false
      },
      {
        id: 'chk-302',
        text: 'Bandejas de contención antiderrames bajo generadores y estanques',
        completed: false
      },
      {
        id: 'chk-303',
        text: 'Control de emisión de polvo en suspensión y humectación de caminos',
        completed: false
      },
      {
        id: 'chk-304',
        text: 'Almacenamiento seguro de sustancias químicas con HDS visibles',
        completed: false
      }
    ],
    findings: [
      {
        id: 'fnd-301',
        title: 'Bandeja de contención rebalsada con lubricante',
        description: 'Bandeja secundaria bajo motobomba auxiliar presenta acumulación de hidrocarburos sin limpieza periódica.',
        severity: 'Crítica',
        photoUrl: 'https://images.unsplash.com/photo-1618042164219-62c820f10723?w=600&auto=format&fit=crop&q=80',
        createdAt: '2026-08-15T11:00:00.000Z'
      }
    ],
    evidences: [],
    signature: null,
    notes: 'Inspección prioritaria vencida. Requiere reprogramación urgente y plan de mitigación.',
    createdAt: '2026-08-14T10:00:00.000Z',
    updatedAt: '2026-08-15T11:30:00.000Z'
  }
];
