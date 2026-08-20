import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Inspection, InspectionType } from '../types';

/**
 * Universal helper to trigger automatic file download from a Blob across all browsers/iframes.
 */
export function triggerFileDownload(blob: Blob, fileName: string, fallbackDataUri?: string): boolean {
  try {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.setAttribute('download', fileName);
    link.style.display = 'none';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      window.URL.revokeObjectURL(url);
    }, 20000);
    return true;
  } catch (err) {
    console.warn('Blob URL download failed, trying data URI fallback:', err);
    if (fallbackDataUri) {
      try {
        const link = document.createElement('a');
        link.href = fallbackDataUri;
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          if (document.body.contains(link)) {
            document.body.removeChild(link);
          }
        }, 5000);
        return true;
      } catch (dataErr) {
        console.error('Data URI download failed:', dataErr);
      }
    }
    return false;
  }
}

// ---------------------------------------------------------------------------
// 1. CONSOLIDATED MULTI-CATEGORY PDF GENERATION (Seguridad, Calidad, Ambiental, Operacional)
// ---------------------------------------------------------------------------

export function buildConsolidatedPdfDocument(inspections: Inspection[]): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let currentY = 14;

  // Header Banner (#5E5365 Plum Slate)
  doc.setFillColor(94, 83, 101);
  doc.rect(0, 0, pageWidth, 24, 'F');

  // Header Title & Logo text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('ATTACH', 14, 11);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('REPORTABILIDAD INTELIGENTE • CONSOLIDADO GENERAL DE AUDITORÍAS', 14, 17);

  // Top Right Info
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL AUDITORÍAS: ${inspections.length}`, pageWidth - 14, 10.5, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`Emisión: ${new Date().toLocaleDateString('es-CL')} ${new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`, pageWidth - 14, 16.5, { align: 'right' });

  currentY = 32;

  // Document Main Title
  doc.setTextColor(56, 48, 59);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORME CONSOLIDADO: SEGURIDAD, CALIDAD, AMBIENTAL Y OPERACIONES', 14, currentY);

  currentY += 6;

  // Global KPIs Calculation
  const totalInspections = inspections.length;
  const completedCount = inspections.filter((i) => i.status === 'completada').length;
  const pendingCount = inspections.filter((i) => i.status === 'pendiente').length;
  const expiredCount = inspections.filter((i) => i.status === 'vencida').length;

  let totalChecklistItems = 0;
  let completedChecklistItems = 0;
  let totalFindings = 0;
  let criticalFindings = 0;
  let highFindings = 0;
  let mediumFindings = 0;
  let lowFindings = 0;

  inspections.forEach((insp) => {
    totalChecklistItems += insp.checklist.length;
    completedChecklistItems += insp.checklist.filter((c) => c.completed).length;
    totalFindings += insp.findings.length;
    insp.findings.forEach((f) => {
      if (f.severity === 'Crítica') criticalFindings++;
      else if (f.severity === 'Alta') highFindings++;
      else if (f.severity === 'Media') mediumFindings++;
      else lowFindings++;
    });
  });

  const complianceRate =
    totalChecklistItems > 0 ? Math.round((completedChecklistItems / totalChecklistItems) * 100) : 100;

  // Executive KPI Table
  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    head: [
      [
        { content: 'Total Auditorías', styles: { fontStyle: 'bold' as const, fillColor: [245, 242, 240], textColor: [94, 83, 101], halign: 'center' } },
        { content: 'Completadas', styles: { fontStyle: 'bold' as const, fillColor: [245, 242, 240], textColor: [94, 83, 101], halign: 'center' } },
        { content: 'Pendientes / Vencidas', styles: { fontStyle: 'bold' as const, fillColor: [245, 242, 240], textColor: [94, 83, 101], halign: 'center' } },
        { content: 'Cumplimiento Global', styles: { fontStyle: 'bold' as const, fillColor: [245, 242, 240], textColor: [94, 83, 101], halign: 'center' } },
        { content: 'Total Hallazgos', styles: { fontStyle: 'bold' as const, fillColor: [245, 242, 240], textColor: [94, 83, 101], halign: 'center' } }
      ]
    ],
    body: [
      [
        { content: `${totalInspections}`, styles: { halign: 'center', fontStyle: 'bold' as const } },
        { content: `${completedCount}`, styles: { halign: 'center', fontStyle: 'bold' as const, textColor: [92, 120, 138] } },
        { content: `${pendingCount} / ${expiredCount}`, styles: { halign: 'center', fontStyle: 'bold' as const, textColor: expiredCount > 0 ? [150, 88, 104] : [189, 159, 141] } },
        { content: `${complianceRate}%`, styles: { halign: 'center', fontStyle: 'bold' as const, textColor: [94, 83, 101] } },
        { content: `${totalFindings} (${criticalFindings + highFindings} prioridad alta)`, styles: { halign: 'center', fontStyle: 'bold' as const, textColor: [150, 88, 104] } }
      ]
    ],
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    margin: { left: 14, right: 14 }
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentY = (doc as any).lastAutoTable.finalY + 7;

  // Breakdown by Category Table
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(94, 83, 101);
  doc.text('RESUMEN DE AUDITORÍAS POR ESPECIALIDAD', 14, currentY);
  currentY += 4;

  const categories: { key: InspectionType; label: string; color: [number, number, number] }[] = [
    { key: 'Seguridad', label: 'Seguridad Ocupacional', color: [124, 146, 160] },
    { key: 'Calidad', label: 'Aseguramiento de Calidad', color: [135, 119, 140] },
    { key: 'Medio Ambiente', label: 'Medio Ambiente (Ambiental)', color: [189, 159, 141] },
    { key: 'Operacional', label: 'Control Operacional', color: [176, 134, 148] }
  ];

  const categoryRows = categories.map((cat) => {
    const list = inspections.filter((i) => i.type === cat.key);
    const comp = list.filter((i) => i.status === 'completada').length;
    const pend = list.filter((i) => i.status === 'pendiente').length;
    const venc = list.filter((i) => i.status === 'vencida').length;
    const catFindings = list.reduce((acc, curr) => acc + curr.findings.length, 0);

    let catTotalChecks = 0;
    let catDoneChecks = 0;
    list.forEach((i) => {
      catTotalChecks += i.checklist.length;
      catDoneChecks += i.checklist.filter((c) => c.completed).length;
    });
    const catPct = catTotalChecks > 0 ? Math.round((catDoneChecks / catTotalChecks) * 100) : 100;

    return [
      cat.label,
      `${list.length}`,
      `${comp}`,
      `${pend}`,
      `${venc}`,
      `${catPct}%`,
      `${catFindings}`
    ];
  });

  autoTable(doc, {
    startY: currentY,
    theme: 'striped',
    head: [['Especialidad / Área', 'Total', 'Completas', 'Pendientes', 'Vencidas', '% Cumplimiento', 'Hallazgos']],
    body: categoryRows,
    headStyles: { fillColor: [94, 83, 101], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold' },
      1: { cellWidth: 16, halign: 'center' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 26, halign: 'center', fontStyle: 'bold' },
      6: { cellWidth: 20, halign: 'center', fontStyle: 'bold' }
    },
    margin: { left: 14, right: 14 }
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentY = (doc as any).lastAutoTable.finalY + 8;

  // -------------------------------------------------------------------------
  // Render Detailed Sections for Each Category (Seguridad, Calidad, Ambiental, Operacional)
  // -------------------------------------------------------------------------
  categories.forEach((cat, idx) => {
    const list = inspections.filter((i) => i.type === cat.key);

    if (currentY > pageHeight - 55) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(cat.color[0], cat.color[1], cat.color[2]);
    doc.text(`${idx + 1}. DETALLE DE INSPECCIONES: ${cat.label.toUpperCase()} (${list.length})`, 14, currentY);
    currentY += 4;

    if (list.length === 0) {
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(135, 119, 140);
      doc.text(`No hay auditorías registradas en la categoría ${cat.label}.`, 14, currentY + 3);
      currentY += 9;
    } else {
      const detailedRows = list.map((insp) => {
        const completedChecks = insp.checklist.filter((c) => c.completed).length;
        const totalChecks = insp.checklist.length;
        const checkPct = totalChecks > 0 ? Math.round((completedChecks / totalChecks) * 100) : 100;
        const statusTxt = insp.status.toUpperCase();
        const findingsTxt =
          insp.findings.length > 0
            ? `${insp.findings.length} (${insp.findings.map((f) => f.title).join(', ')})`
            : 'Sin hallazgos';

        return [
          insp.id,
          insp.company,
          `${insp.faena}\n${insp.location}`,
          insp.date,
          `${completedChecks}/${totalChecks} (${checkPct}%)`,
          {
            content: statusTxt,
            styles: {
              fontStyle: 'bold' as const,
              textColor:
                insp.status === 'completada'
                  ? ([92, 120, 138] as [number, number, number])
                  : insp.status === 'vencida'
                  ? ([150, 88, 104] as [number, number, number])
                  : ([94, 83, 101] as [number, number, number])
            }
          },
          findingsTxt
        ];
      });

      autoTable(doc, {
        startY: currentY,
        theme: 'grid',
        head: [['Folio', 'Empresa', 'Faena / Ubicación', 'Fecha', 'Puntos Pauta', 'Estado', 'Hallazgos Registrados']],
        body: detailedRows,
        headStyles: { fillColor: cat.color, textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 7.5, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 18, fontStyle: 'bold' },
          1: { cellWidth: 26 },
          2: { cellWidth: 32 },
          3: { cellWidth: 18, halign: 'center' },
          4: { cellWidth: 24, halign: 'center' },
          5: { cellWidth: 22, halign: 'center' },
          6: { cellWidth: 'auto' }
        },
        margin: { left: 14, right: 14 }
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      currentY = (doc as any).lastAutoTable.finalY + 7;
    }
  });

  // -------------------------------------------------------------------------
  // Consolidate All Findings Across All Inspections
  // -------------------------------------------------------------------------
  const allFindingsWithOrigin: {
    folio: string;
    type: InspectionType;
    company: string;
    title: string;
    severity: string;
    description: string;
  }[] = [];

  inspections.forEach((insp) => {
    insp.findings.forEach((f) => {
      allFindingsWithOrigin.push({
        folio: insp.id,
        type: insp.type,
        company: insp.company,
        title: f.title,
        severity: f.severity,
        description: f.description || 'Sin detalles'
      });
    });
  });

  if (currentY > pageHeight - 65) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(150, 88, 104);
  doc.text(`MATRIZ GENERAL DE HALLAZGOS Y ACCIONES CORRECTIVAS (${allFindingsWithOrigin.length})`, 14, currentY);
  currentY += 4;

  if (allFindingsWithOrigin.length === 0) {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(135, 119, 140);
    doc.text('No existen hallazgos críticos registrados en el periodo evaluado.', 14, currentY + 3);
    currentY += 9;
  } else {
    const findingsTableRows = allFindingsWithOrigin.map((f, idx) => [
      `${idx + 1}`,
      f.folio,
      f.type,
      f.company,
      f.title,
      {
        content: f.severity.toUpperCase(),
        styles: {
          fontStyle: 'bold' as const,
          textColor:
            f.severity === 'Crítica' || f.severity === 'Alta'
              ? ([150, 88, 104] as [number, number, number])
              : ([189, 159, 141] as [number, number, number])
        }
      },
      f.description
    ]);

    autoTable(doc, {
      startY: currentY,
      theme: 'grid',
      head: [['#', 'Folio', 'Área', 'Empresa', 'Hallazgo', 'Severidad', 'Detalle / Medida Correctiva']],
      body: findingsTableRows,
      headStyles: { fillColor: [94, 83, 101], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 7.5, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 16, fontStyle: 'bold' },
        2: { cellWidth: 24 },
        3: { cellWidth: 25 },
        4: { cellWidth: 32, fontStyle: 'bold' },
        5: { cellWidth: 20, halign: 'center' },
        6: { cellWidth: 'auto' }
      },
      margin: { left: 14, right: 14 }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // Institutional Signatures and Certification Section
  if (currentY > pageHeight - 45) {
    doc.addPage();
    currentY = 20;
  }

  currentY += 4;
  doc.setDrawColor(229, 223, 220);
  doc.line(14, currentY, pageWidth - 14, currentY);
  currentY += 7;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(135, 119, 140);
  doc.text('Documento Consolidado Oficial generado en la plataforma móvil Attach • Reportabilidad inteligente.', 14, currentY);
  doc.text('Trazabilidad técnica certificada conforme a normas de Seguridad, Calidad, Medio Ambiente y Operación.', 14, currentY + 4);

  // Supervisor & Audit Signature Box
  const sigX = pageWidth - 65;
  const sigY = currentY - 2;

  // Check if any inspection has a signature image to use as reference
  const signedInsp = inspections.find((i) => i.signature?.dataUrl);
  if (signedInsp?.signature?.dataUrl) {
    try {
      doc.addImage(signedInsp.signature.dataUrl, 'PNG', sigX, sigY, 45, 14);
    } catch (e) {
      console.warn('Could not render signature on consolidated PDF', e);
    }
  }

  doc.line(sigX - 5, sigY + 15, sigX + 50, sigY + 15);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(56, 48, 59);
  doc.text(
    signedInsp?.signature?.supervisorName
      ? signedInsp.signature.supervisorName.replace(/iaptidud/gi, 'Attach')
      : 'Jefatura de Supervisión Attach',
    sigX + 22,
    sigY + 19,
    { align: 'center' }
  );
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(135, 119, 140);
  doc.text(`RUT: ${signedInsp?.signature?.rut || '15.489.321-K'}`, sigX + 22, sigY + 23, { align: 'center' });

  return doc;
}

/**
 * Triggers the automatic generation and download of the Consolidated PDF.
 */
export async function generateConsolidatedInspectionPdf(
  inspections: Inspection[]
): Promise<{ blob: Blob; dataUrl: string; fileName: string; success: boolean }> {
  const doc = buildConsolidatedPdfDocument(inspections);
  const pdfBlob = doc.output('blob');
  const dataUrl = doc.output('datauristring');
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `Informe_Consolidado_Inspecciones_Attach_${dateStr}.pdf`;

  const downloadTriggered = triggerFileDownload(pdfBlob, fileName, dataUrl);

  try {
    doc.save(fileName);
  } catch (err) {
    console.debug('doc.save fallback handled:', err);
  }

  return { blob: pdfBlob, dataUrl, fileName, success: downloadTriggered };
}

// ---------------------------------------------------------------------------
// 2. SINGLE INSPECTION PDF GENERATION (Ficha Técnica Individual)
// ---------------------------------------------------------------------------

export function buildSingleInspectionPdfDocument(inspection: Inspection): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let currentY = 14;

  // Header Bar (#5E5365)
  doc.setFillColor(94, 83, 101);
  doc.rect(0, 0, pageWidth, 24, 'F');

  // Header Title & Subtitle
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('ATTACH', 14, 11);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('REPORTABILIDAD INTELIGENTE • AUDITORÍA EN TERRENO', 14, 17);

  // Top Right Info
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(`FOLIO: ${inspection.id}`, pageWidth - 14, 10.5, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`Emisión: ${new Date().toLocaleDateString('es-CL')}`, pageWidth - 14, 16.5, { align: 'right' });

  currentY = 32;

  // Document Title
  doc.setTextColor(56, 48, 59);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`INFORME TÉCNICO DE INSPECCIÓN: ${inspection.type.toUpperCase()}`, 14, currentY);

  currentY += 6;

  // Metadata Table
  const statusColor: [number, number, number] =
    inspection.status === 'completada'
      ? [92, 120, 138]
      : inspection.status === 'vencida'
      ? [150, 88, 104]
      : [94, 83, 101];

  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    head: [
      [
        { content: 'Empresa', styles: { fontStyle: 'bold' as const, fillColor: [245, 242, 240], textColor: [94, 83, 101] } },
        { content: 'Faena / Obra', styles: { fontStyle: 'bold' as const, fillColor: [245, 242, 240], textColor: [94, 83, 101] } },
        { content: 'Ubicación', styles: { fontStyle: 'bold' as const, fillColor: [245, 242, 240], textColor: [94, 83, 101] } },
        { content: 'Estado', styles: { fontStyle: 'bold' as const, fillColor: [245, 242, 240], textColor: [94, 83, 101] } }
      ]
    ],
    body: [
      [
        inspection.company,
        inspection.faena,
        inspection.location,
        {
          content: inspection.status.toUpperCase(),
          styles: { fontStyle: 'bold' as const, textColor: statusColor }
        }
      ]
    ],
    styles: { fontSize: 8.5, cellPadding: 3 },
    margin: { left: 14, right: 14 }
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Checklist Table Section
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(94, 83, 101);
  doc.text('1. PAUTA DE VERIFICACIÓN EN TERRENO', 14, currentY);
  currentY += 4;

  const checklistRows = inspection.checklist.map((item, index) => [
    `${index + 1}`,
    item.text,
    {
      content: item.completed ? 'CUMPLE' : 'NO CUMPLE',
      styles: {
        fontStyle: 'bold' as const,
        textColor: item.completed ? ([92, 120, 138] as [number, number, number]) : ([150, 88, 104] as [number, number, number])
      }
    }
  ]);

  autoTable(doc, {
    startY: currentY,
    theme: 'striped',
    head: [['#', 'Punto de Control', 'Resultado']],
    body: checklistRows,
    headStyles: { fillColor: [94, 83, 101], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 28, halign: 'center' }
    },
    margin: { left: 14, right: 14 }
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Findings & Actions Section
  if (currentY > pageHeight - 65) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(94, 83, 101);
  doc.text(`2. HALLAZGOS Y MEDIDAS CORRECTIVAS (${inspection.findings.length})`, 14, currentY);
  currentY += 4;

  if (inspection.findings.length === 0) {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(135, 119, 140);
    doc.text('No se registraron hallazgos ni condiciones subestándar en esta inspección.', 14, currentY + 3);
    currentY += 10;
  } else {
    const findingsRows = inspection.findings.map((f, idx) => [
      `${idx + 1}`,
      f.title,
      {
        content: f.severity.toUpperCase(),
        styles: {
          fontStyle: 'bold' as const,
          textColor:
            f.severity === 'Crítica' || f.severity === 'Alta'
              ? ([150, 88, 104] as [number, number, number])
              : ([189, 159, 141] as [number, number, number])
        }
      },
      f.description || 'Sin observaciones adicionales'
    ]);

    autoTable(doc, {
      startY: currentY,
      theme: 'grid',
      head: [['#', 'Hallazgo Registrado', 'Severidad', 'Detalle / Acción']],
      body: findingsRows,
      headStyles: { fillColor: [94, 83, 101], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2.5 },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 48 },
        2: { cellWidth: 26, halign: 'center' },
        3: { cellWidth: 'auto' }
      },
      margin: { left: 14, right: 14 }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // Signatures and Validation Section
  if (currentY > pageHeight - 50) {
    doc.addPage();
    currentY = 20;
  }

  currentY += 4;
  doc.setDrawColor(229, 223, 220);
  doc.line(14, currentY, pageWidth - 14, currentY);
  currentY += 7;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(135, 119, 140);
  doc.text('Documento oficial registrado en terreno mediante plataforma Attach • Reportabilidad inteligente.', 14, currentY);
  doc.text('Validez técnica y trazabilidad conforme a procedimientos operacionales vigentes.', 14, currentY + 4);

  // Supervisor Signature Box
  const sigX = pageWidth - 65;
  const sigY = currentY - 2;

  if (inspection.signature?.dataUrl) {
    try {
      doc.addImage(inspection.signature.dataUrl, 'PNG', sigX, sigY, 45, 15);
    } catch (e) {
      console.warn('Could not render signature on PDF', e);
    }
  }

  doc.line(sigX - 5, sigY + 16, sigX + 50, sigY + 16);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(56, 48, 59);
  doc.text(
    inspection.signature?.supervisorName
      ? inspection.signature.supervisorName.replace(/iaptidud/gi, 'Attach')
      : 'Supervisor Attach',
    sigX + 22,
    sigY + 20,
    { align: 'center' }
  );
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(135, 119, 140);
  doc.text(`RUT: ${inspection.signature?.rut || '15.489.321-K'}`, sigX + 22, sigY + 24, { align: 'center' });

  return doc;
}

export async function generateInspectionPdf(
  inspection: Inspection
): Promise<{ blob: Blob; dataUrl: string; fileName: string; success: boolean }> {
  const doc = buildSingleInspectionPdfDocument(inspection);
  const pdfBlob = doc.output('blob');
  const dataUrl = doc.output('datauristring');
  const safeCompany = inspection.company.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `Informe_Inspeccion_${inspection.id}_${safeCompany}.pdf`;

  const downloadTriggered = triggerFileDownload(pdfBlob, fileName, dataUrl);

  try {
    doc.save(fileName);
  } catch (err) {
    console.debug('doc.save fallback caught:', err);
  }

  return { blob: pdfBlob, dataUrl, fileName, success: downloadTriggered };
}

// ---------------------------------------------------------------------------
// 3. PRINT & NEW TAB HELPERS (For both Consolidated & Single)
// ---------------------------------------------------------------------------

export function openReportInNewTab(inspectionOrList: Inspection | Inspection[]): void {
  const isConsolidated = Array.isArray(inspectionOrList);
  const htmlContent = isConsolidated
    ? generateConsolidatedHtmlReport(inspectionOrList as Inspection[])
    : generateSingleHtmlReport(inspectionOrList as Inspection);

  const newWin = window.open('', '_blank');
  if (newWin) {
    newWin.document.open();
    newWin.document.write(htmlContent);
    newWin.document.close();
    setTimeout(() => {
      try {
        newWin.focus();
        newWin.print();
      } catch (e) {
        console.warn('Could not auto-trigger print in new window', e);
      }
    }, 500);
  } else {
    printInspectionReport(inspectionOrList);
  }
}

export function printInspectionReport(inspectionOrList: Inspection | Inspection[]): void {
  const isConsolidated = Array.isArray(inspectionOrList);
  const htmlContent = isConsolidated
    ? generateConsolidatedHtmlReport(inspectionOrList as Inspection[])
    : generateSingleHtmlReport(inspectionOrList as Inspection);

  const printFrame = document.createElement('iframe');
  printFrame.style.position = 'fixed';
  printFrame.style.right = '0';
  printFrame.style.bottom = '0';
  printFrame.style.width = '0';
  printFrame.style.height = '0';
  printFrame.style.border = '0';
  printFrame.id = 'report-print-iframe';

  document.body.appendChild(printFrame);

  const frameDoc = printFrame.contentWindow?.document;
  if (!frameDoc) {
    window.print();
    return;
  }

  frameDoc.open();
  frameDoc.write(htmlContent);
  frameDoc.close();

  setTimeout(() => {
    try {
      printFrame.contentWindow?.focus();
      printFrame.contentWindow?.print();
    } catch (err) {
      console.warn('Iframe print error, calling window.print()', err);
      window.print();
    } finally {
      setTimeout(() => {
        if (document.body.contains(printFrame)) {
          document.body.removeChild(printFrame);
        }
      }, 3000);
    }
  }, 300);
}

// ---------------------------------------------------------------------------
// 4. HTML REPORT GENERATORS (Full Consolidated & Single)
// ---------------------------------------------------------------------------

export function generateConsolidatedHtmlReport(inspections: Inspection[]): string {
  const categories: { key: InspectionType; label: string; color: string }[] = [
    { key: 'Seguridad', label: 'Seguridad Ocupacional', color: '#7C92A0' },
    { key: 'Calidad', label: 'Aseguramiento de Calidad', color: '#87778C' },
    { key: 'Medio Ambiente', label: 'Medio Ambiente (Ambiental)', color: '#BD9F8D' },
    { key: 'Operacional', label: 'Control Operacional', color: '#B08694' }
  ];

  let totalChecklistItems = 0;
  let completedChecklistItems = 0;
  let totalFindings = 0;

  inspections.forEach((insp) => {
    totalChecklistItems += insp.checklist.length;
    completedChecklistItems += insp.checklist.filter((c) => c.completed).length;
    totalFindings += insp.findings.length;
  });

  const complianceRate =
    totalChecklistItems > 0 ? Math.round((completedChecklistItems / totalChecklistItems) * 100) : 100;

  const categorySectionsHtml = categories
    .map((cat, idx) => {
      const list = inspections.filter((i) => i.type === cat.key);
      const rows =
        list.length === 0
          ? `<tr><td colspan="6" style="text-align:center; color:#87778c; font-style:italic;">No hay auditorías registradas en ${cat.label}.</td></tr>`
          : list
              .map((insp) => {
                const doneChecks = insp.checklist.filter((c) => c.completed).length;
                const totalChecks = insp.checklist.length;
                const pct = totalChecks > 0 ? Math.round((doneChecks / totalChecks) * 100) : 100;
                const findingsTxt =
                  insp.findings.length > 0
                    ? `${insp.findings.length} (${insp.findings.map((f) => f.title).join(', ')})`
                    : 'Sin hallazgos';

                return `
            <tr>
              <td><b>${insp.id}</b></td>
              <td>${insp.company}</td>
              <td>${insp.faena} - ${insp.location}</td>
              <td style="text-align:center;">${insp.date}</td>
              <td style="text-align:center; font-weight:bold;">${doneChecks}/${totalChecks} (${pct}%)</td>
              <td style="text-align:center; font-weight:bold; color: ${
                insp.status === 'completada' ? '#5C788A' : insp.status === 'vencida' ? '#965868' : '#5E5365'
              };">${insp.status.toUpperCase()}</td>
              <td>${findingsTxt}</td>
            </tr>
          `;
              })
              .join('');

      return `
      <div style="margin-top: 20px;">
        <h3 style="color: ${cat.color}; border-bottom: 2px solid ${cat.color}; padding-bottom: 4px; font-size: 13px; text-transform: uppercase;">
          ${idx + 1}. Detalle de Auditorías: ${cat.label} (${list.length})
        </h3>
        <table>
          <thead>
            <tr style="background-color: ${cat.color}; color: white;">
              <th style="width: 60px;">Folio</th>
              <th>Empresa</th>
              <th>Faena / Ubicación</th>
              <th style="width: 75px; text-align:center;">Fecha</th>
              <th style="width: 90px; text-align:center;">Cumplimiento</th>
              <th style="width: 85px; text-align:center;">Estado</th>
              <th>Hallazgos</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <title>Informe_Consolidado_Inspecciones_Attach</title>
      <style>
        @page { size: A4 portrait; margin: 12mm 14mm; }
        * { box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #38303B; margin: 0; padding: 20px; font-size: 11px; background: #fff; }
        .header { border-bottom: 3px solid #5E5365; padding-bottom: 12px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: flex-start; }
        .brand { font-size: 20px; font-weight: 900; color: #5E5365; }
        .badge { display: inline-block; background: #CC8B79; color: white; font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; }
        .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; background: #fdfbf9; padding: 10px; border-radius: 8px; border: 1px solid #e5dfdc; margin-bottom: 14px; }
        .meta-label { color: #87778c; font-size: 9px; font-weight: bold; text-transform: uppercase; }
        .meta-value { font-size: 13px; font-weight: bold; color: #38303b; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 10px; }
        th, td { border: 1px solid #e5dfdc; padding: 5px 7px; text-align: left; }
        th { background: #5E5365; color: white; font-size: 9.5px; text-transform: uppercase; }
        tr:nth-child(even) { background: #fbf9f8; }
        .signature-section { margin-top: 25px; display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #e5dfdc; padding-top: 12px; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="brand">ATTACH</div>
          <span class="badge">Reportabilidad inteligente</span>
          <div style="font-size: 14px; font-weight: bold; margin-top: 4px; color: #38303B;">INFORME CONSOLIDADO: SEGURIDAD, CALIDAD, AMBIENTAL Y OPERACIONAL</div>
        </div>
        <div style="text-align: right; font-size: 10px; color: #87778c;">
          <div><b>Total Auditorías:</b> ${inspections.length}</div>
          <div><b>Emisión:</b> ${new Date().toLocaleDateString('es-CL')}</div>
        </div>
      </div>

      <div class="meta-grid">
        <div>
          <div class="meta-label">Total Auditorías</div>
          <div class="meta-value">${inspections.length}</div>
        </div>
        <div>
          <div class="meta-label">Completadas</div>
          <div class="meta-value" style="color: #5C788A;">${inspections.filter((i) => i.status === 'completada').length}</div>
        </div>
        <div>
          <div class="meta-label">Cumplimiento Global</div>
          <div class="meta-value" style="color: #5E5365;">${complianceRate}%</div>
        </div>
        <div>
          <div class="meta-label">Total Hallazgos</div>
          <div class="meta-value" style="color: #965868;">${totalFindings}</div>
        </div>
      </div>

      ${categorySectionsHtml}

      <div class="signature-section">
        <div style="font-size: 10px; color: #87778c; max-width: 320px;">
          <p><b>Validación Institucional y Trazabilidad</b></p>
          <p>Documento oficial consolidado emitido por la plataforma Attach • Reportabilidad inteligente.</p>
        </div>
        <div style="text-align: center; width: 200px;">
          <div style="border-bottom: 1px solid #5E5365; height: 35px;"></div>
          <div style="font-weight: bold; font-size: 11px; margin-top: 4px; color: #38303B;">Jefatura de Supervisión Attach</div>
          <div style="font-size: 9px; color: #87778c;">RUT: 15.489.321-K</div>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function generateSingleHtmlReport(inspection: Inspection): string {
  const checklistRows = inspection.checklist
    .map(
      (item, idx) => `
      <tr>
        <td style="width: 30px; text-align: center;">${idx + 1}</td>
        <td>${item.text}</td>
        <td style="width: 100px; text-align: center;" class="${item.completed ? 'status-cumple' : 'status-nocumple'}">
          ${item.completed ? 'CUMPLE' : 'NO CUMPLE'}
        </td>
      </tr>
    `
    )
    .join('');

  const findingsRows =
    inspection.findings.length === 0
      ? `<tr><td colspan="4" style="color: #87778c; font-style: italic; text-align: center; padding: 12px;">No se registraron hallazgos ni condiciones subestándar.</td></tr>`
      : inspection.findings
          .map(
            (f, idx) => `
        <tr>
          <td style="width: 30px; text-align: center;">${idx + 1}</td>
          <td><b>${f.title}</b></td>
          <td style="width: 90px; text-align: center; color: ${
            f.severity === 'Crítica' || f.severity === 'Alta' ? '#965868' : '#BD9F8D'
          }; font-weight: bold;">
            ${f.severity}
          </td>
          <td>${f.description || '-'}</td>
        </tr>
      `
          )
          .join('');

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <title>Informe_${inspection.id}_${inspection.company}</title>
      <style>
        @page { size: A4 portrait; margin: 12mm 15mm; }
        * { box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #38303b; margin: 0; padding: 20px; font-size: 12px; background: #ffffff; }
        .header { border-bottom: 3px solid #5E5365; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; }
        .brand { font-size: 20px; font-weight: 900; color: #5E5365; margin-bottom: 2px; }
        .badge { display: inline-block; background: #CC8B79; color: white; font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; }
        .title { font-size: 14px; font-weight: bold; margin-top: 6px; color: #38303b; }
        .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; background: #fdfbf9; padding: 10px; border-radius: 8px; border: 1px solid #e5dfdc; margin-bottom: 16px; font-size: 11px; }
        .meta-label { color: #87778c; font-size: 10px; margin-bottom: 2px; text-transform: uppercase; font-weight: 600; }
        .meta-value { font-weight: bold; color: #38303b; }
        h3 { font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #e5dfdc; padding-bottom: 4px; margin-top: 16px; margin-bottom: 8px; color: #5E5365; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 11px; }
        th, td { border: 1px solid #e5dfdc; padding: 6px 8px; text-align: left; }
        th { background: #5E5365; color: white; font-weight: bold; font-size: 10px; text-transform: uppercase; }
        tr:nth-child(even) { background: #fbf9f8; }
        .status-cumple { color: #5C788A; font-weight: bold; }
        .status-nocumple { color: #965868; font-weight: bold; }
        .signature-section { margin-top: 25px; display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #e5dfdc; padding-top: 12px; }
        .signature-box { text-align: center; width: 200px; }
        .signature-img { height: 55px; max-width: 180px; object-fit: contain; margin: 0 auto; display: block; }
        .signature-line { border-bottom: 1px solid #5E5365; margin-top: 4px; margin-bottom: 4px; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="brand">ATTACH</div>
          <span class="badge">Reportabilidad inteligente</span>
          <div class="title">INFORME TÉCNICO: ${inspection.type.toUpperCase()}</div>
        </div>
        <div style="text-align: right; font-size: 10px; color: #87778c;">
          <div><b>FOLIO:</b> ${inspection.id}</div>
          <div><b>Fecha:</b> ${inspection.date}</div>
          <div><b>Emisión:</b> ${new Date().toLocaleDateString('es-CL')}</div>
        </div>
      </div>

      <div class="meta-grid">
        <div>
          <div class="meta-label">Empresa</div>
          <div class="meta-value">${inspection.company}</div>
        </div>
        <div>
          <div class="meta-label">Faena / Obra</div>
          <div class="meta-value">${inspection.faena}</div>
        </div>
        <div>
          <div class="meta-label">Ubicación</div>
          <div class="meta-value">${inspection.location}</div>
        </div>
        <div>
          <div class="meta-label">Estado</div>
          <div class="meta-value" style="color: ${
            inspection.status === 'completada' ? '#5C788A' : '#5E5365'
          }; text-transform: uppercase;">
            ${inspection.status}
          </div>
        </div>
      </div>

      <h3>1. Pauta de Verificación y Checklist</h3>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Punto de Control</th>
            <th>Resultado</th>
          </tr>
        </thead>
        <tbody>
          ${checklistRows}
        </tbody>
      </table>

      <h3>2. Hallazgos y Medidas Correctivas (${inspection.findings.length})</h3>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Hallazgo</th>
            <th>Severidad</th>
            <th>Descripción</th>
          </tr>
        </thead>
        <tbody>
          ${findingsRows}
        </tbody>
      </table>

      <div class="signature-section">
        <div style="font-size: 10px; color: #87778c; max-width: 320px;">
          <p><b>Validación Técnica Oficial</b></p>
          <p>Documento registrado en plataforma móvil Attach • Reportabilidad inteligente con trazabilidad criptográfica y sello de supervisión.</p>
        </div>
        <div class="signature-box">
          ${
            inspection.signature?.dataUrl
              ? `<img src="${inspection.signature.dataUrl}" class="signature-img" alt="Firma"/>`
              : `<div style="height: 45px; display: flex; align-items: center; justify-content: center; color: #87778c; font-size: 11px;">Pendiente de firma</div>`
          }
          <div class="signature-line"></div>
          <div style="font-weight: bold; font-size: 11px; color: #38303b;">${
            inspection.signature?.supervisorName
              ? inspection.signature.supervisorName.replace(/iaptidud/gi, 'Attach')
              : 'Supervisor Attach'
          }</div>
          <div style="font-size: 9px; color: #87778c;">RUT: ${
            inspection.signature?.rut || '15.489.321-K'
          }</div>
        </div>
      </div>
    </body>
    </html>
  `;
}
