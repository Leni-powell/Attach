import { Inspection } from '../types';

/**
 * Extracts a formatted time string (e.g. "14:30 hrs") from an inspection.
 * Uses `inspection.time` if available, or derives it from `inspection.createdAt`.
 */
export function getInspectionFormattedTime(inspection: {
  time?: string;
  createdAt?: string;
  date?: string;
}): string {
  if (inspection.time && inspection.time.trim()) {
    const cleanTime = inspection.time.trim();
    return cleanTime.includes('hrs') ? cleanTime : `${cleanTime} hrs`;
  }

  if (inspection.createdAt) {
    try {
      const d = new Date(inspection.createdAt);
      if (!isNaN(d.getTime())) {
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes} hrs`;
      }
    } catch {
      // fallback
    }
  }

  return '09:00 hrs';
}

/**
 * Returns formatted date and time for an inspection (e.g., "18/08/2026 a las 14:30 hrs" or "2026-08-18 14:30 hrs").
 */
export function formatInspectionDateTime(inspection: {
  date: string;
  time?: string;
  createdAt?: string;
}): string {
  const time = getInspectionFormattedTime(inspection);
  let dateFormatted = inspection.date;

  try {
    if (inspection.date && /^\d{4}-\d{2}-\d{2}$/.test(inspection.date)) {
      const [y, m, d] = inspection.date.split('-');
      dateFormatted = `${d}/${m}/${y}`;
    }
  } catch {
    dateFormatted = inspection.date;
  }

  return `${dateFormatted} a las ${time}`;
}

/**
 * Returns formatted date and time for findings or evidence photos (e.g., "18/08/2026 14:30 hrs").
 */
export function formatDateTime(isoOrDateString?: string): string {
  if (!isoOrDateString) return 'Hora no registrada';

  try {
    const d = new Date(isoOrDateString);
    if (isNaN(d.getTime())) {
      return isoOrDateString;
    }
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes} hrs`;
  } catch {
    return isoOrDateString;
  }
}

/**
 * Returns only the time portion with "hrs" (e.g., "14:30 hrs").
 */
export function formatTimeOnly(isoOrDateString?: string): string {
  if (!isoOrDateString) return '';

  try {
    const d = new Date(isoOrDateString);
    if (isNaN(d.getTime())) {
      // Check if it's already HH:mm
      if (/^\d{1,2}:\d{2}/.test(isoOrDateString)) {
        return `${isoOrDateString.slice(0, 5)} hrs`;
      }
      return isoOrDateString;
    }
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes} hrs`;
  } catch {
    return isoOrDateString;
  }
}

/**
 * Returns the photo upload timestamp label.
 */
export function formatPhotoUploadTime(createdAt?: string): string {
  if (!createdAt) return 'Hora de subida no registrada';
  return `Subida: ${formatDateTime(createdAt)}`;
}
