import { 
  exportService, 
  ModuleExportColumn, 
  ModuleExportData 
} from '../services/exportService.ts';

export type { ModuleExportColumn, ModuleExportData };

export function exportModuleToPDF(data: ModuleExportData): string {
  return exportService.exportModulePDF(data);
}

export function exportModuleToDocs(data: ModuleExportData): string {
  return exportService.exportModuleDocs(data);
}

export function exportModuleToCSV(title: string, columns: ModuleExportColumn[], rows: Record<string, any>[]): string {
  return exportService.exportModuleCSV(title, columns, rows);
}
