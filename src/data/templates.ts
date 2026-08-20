import { InspectionType } from '../types';

export const CHECKLIST_TEMPLATES: Record<InspectionType, string[]> = {
  Seguridad: [
    'Uso obligatorio de EPP completo y en buen estado (casco, lentes, calzado, chaleco)',
    'Sistema de bloqueo y etiquetado de energía (LOTO) implementado',
    'Señalización de peligro y delimitación de áreas de trabajo',
    'Extintores de incendio vigentes, rotulados y con acceso despejado',
    'Permisos de trabajo seguro (PTS / AST) firmados en terreno',
    'Inspección de herramientas manuales y eléctricas (código de color mensual)',
    'Condiciones de orden y aseo en pasillos y vías de evacuación'
  ],
  Calidad: [
    'Verificación de materiales según especificaciones técnicas y certificados de calidad',
    'Control de tolerancias dimensionales, plomos y niveles de obra',
    'Ensayos de adherencia / rotura de probetas de hormigón al día',
    'Trazabilidad de lotes, partidas y registros de recepción conforme',
    'Protección de elementos terminados contra daños o intemperie',
    'Cumplimiento de protocolos de liberación de armaduras y moldajes'
  ],
  'Medio Ambiente': [
    'Segregación adecuada de residuos sólidos y peligrosos (RESPEL)',
    'Bandejas de contención antiderrames bajo generadores y estanques',
    'Control de emisión de polvo en suspensión y humectación de caminos',
    'Almacenamiento seguro de sustancias químicas con HDS visibles',
    'Hermeticidad en canalizaciones y control de efluentes',
    'Monitoreo de niveles de ruido y luminaria en perímetro'
  ],
  Operacional: [
    'Revisión de horómetros, bitácora y check-list de preuso de maquinaria',
    'Operadores y rigger con acreditación y licencias vigentes',
    'Difusión diaria del plan de trabajo y charla de 5 minutos',
    'Disponibilidad de repuestos críticos y suministros operativos',
    'Rutas de tránsito pesado y liviano señalizadas y operativas',
    'Comunicación radial expedita con central de operaciones'
  ]
};

export const SAMPLE_COMPANIES = [
  'Minera Los Andes',
  'Constructora Sur',
  'Energía Austral',
  'Industrial del Norte',
  'Agrícola del Valle',
  'Logística & Puertos'
];

export const SAMPLE_FAENAS = [
  'Faena Norte',
  'Edificio B',
  'Sala máquinas',
  'Campamento Central',
  'Taller de Mantenimiento',
  'Patio de Acopio'
];
