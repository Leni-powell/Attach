import { Inspection } from '../types';

export function exportInspectionsToCsv(inspections: Inspection[]): void {
  const headers = [
    'ID',
    'Tipo',
    'Empresa',
    'Faena',
    'Ubicacion',
    'Fecha',
    'Estado',
    'Total Checklist',
    'Checklist Completados',
    'Progreso %',
    'Num Hallazgos',
    'Num Evidencias',
    'Firmado',
    'Supervisor Firmante',
    'Notas'
  ];

  const rows = inspections.map((i) => {
    const totalChk = i.checklist.length;
    const doneChk = i.checklist.filter((c) => c.completed).length;
    const pct = totalChk > 0 ? Math.round((doneChk / totalChk) * 100) : 0;
    const isSigned = i.signature ? 'SI' : 'NO';
    const signer = i.signature?.supervisorName || '';
    const notes = (i.notes || '').replace(/"/g, '""');

    return [
      `"${i.id}"`,
      `"${i.type}"`,
      `"${i.company.replace(/"/g, '""')}"`,
      `"${i.faena.replace(/"/g, '""')}"`,
      `"${i.location.replace(/"/g, '""')}"`,
      `"${i.date}"`,
      `"${i.status}"`,
      totalChk,
      doneChk,
      `${pct}%`,
      i.findings.length,
      i.evidences.length,
      `"${isSigned}"`,
      `"${signer}"`,
      `"${notes}"`
    ].join(';');
  });

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `attach_inspecciones_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
