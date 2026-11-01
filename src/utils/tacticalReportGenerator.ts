import jsPDF from 'jspdf';
import { 
  exportService, 
  TacticalReportData, 
  ReportClassification, 
  calculateFSPL, 
  formatCoordinates 
} from '../services/exportService.ts';

export type { ReportClassification, TacticalReportData };
export { calculateFSPL, formatCoordinates };

/**
 * Generates a complete, military-grade printable PDF Tactical Report delegating to exportService
 */
export const generateTacticalReport = (data: TacticalReportData): jsPDF => {
  return exportService.generateTacticalReport(data);
};

/**
 * Downloads the Tactical Report as a formatted PDF file delegating to exportService
 */
export const exportTacticalReportPDF = (
  data: TacticalReportData,
  customFilename?: string
): { doc: jsPDF; filename: string } => {
  return exportService.exportTacticalReportPDF(data, customFilename);
};

/**
 * Generates a Blob URL for in-app preview or printing
 */
export const getTacticalReportBlobUrl = (data: TacticalReportData): string => {
  const doc = exportService.generateTacticalReport(data);
  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
};
