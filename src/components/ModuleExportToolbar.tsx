import React, { useState } from 'react';
import { FileText, FileSpreadsheet, Download, Check, FileCheck, Layers } from 'lucide-react';
import { exportService, exportToPDF, ModuleExportColumn } from '../services/exportService.ts';
import { audioController } from '../services/audioService.ts';

interface ModuleExportToolbarProps {
  moduleTitle: string;
  moduleSubtitle?: string;
  classification?: string;
  metadata?: Record<string, string | number | boolean>;
  summaryText?: string;
  columns?: ModuleExportColumn[];
  rows?: Record<string, any>[];
  filenamePrefix?: string;
  compact?: boolean;
}

export const ModuleExportToolbar: React.FC<ModuleExportToolbarProps> = ({
  moduleTitle,
  moduleSubtitle,
  classification = 'SECRET // REL TO NATO',
  metadata,
  summaryText,
  columns,
  rows,
  filenamePrefix,
  compact = false
}) => {
  const [lastExported, setLastExported] = useState<string | null>(null);

  const handleExportPDF = () => {
    audioController.playBeep(880, 0.08);
    const filename = exportToPDF({
      moduleTitle,
      moduleSubtitle,
      classification,
      metadata,
      summaryText,
      columns,
      rows,
      filenamePrefix
    });
    setLastExported(`PDF: ${filename}`);
    setTimeout(() => setLastExported(null), 4000);
  };

  const handleExportDOCS = () => {
    audioController.playBeep(660, 0.08);
    const filename = exportService.exportModuleDocs({
      moduleTitle,
      moduleSubtitle,
      classification,
      metadata,
      summaryText,
      columns,
      rows,
      filenamePrefix
    });
    setLastExported(`DOCS: ${filename}`);
    setTimeout(() => setLastExported(null), 4000);
  };

  const handleExportCSV = () => {
    if (!columns || !rows) return;
    audioController.playBeep(520, 0.08);
    const filename = exportService.exportModuleCSV(moduleTitle, columns, rows);
    setLastExported(`CSV: ${filename}`);
    setTimeout(() => setLastExported(null), 4000);
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-1.5 font-mono text-[9px]">
        {lastExported && (
          <span className="text-emerald-400 font-bold flex items-center space-x-1 animate-in fade-in">
            <Check className="w-3 h-3 text-emerald-400" />
            <span className="truncate max-w-[120px]">{lastExported}</span>
          </span>
        )}
        <button
          onClick={handleExportPDF}
          title="Export Professional PDF Tactical Report"
          className="px-2 py-1 rounded bg-slate-900 hover:bg-cyan-950 border border-slate-800 hover:border-cyan-500/50 text-cyan-400 font-bold flex items-center space-x-1 transition"
        >
          <FileText className="w-3 h-3 text-cyan-400" />
          <span>PDF</span>
        </button>
        <button
          onClick={handleExportDOCS}
          title="Export Word Document (.DOC)"
          className="px-2 py-1 rounded bg-slate-900 hover:bg-blue-950 border border-slate-800 hover:border-blue-500/50 text-blue-400 font-bold flex items-center space-x-1 transition"
        >
          <FileCheck className="w-3 h-3 text-blue-400" />
          <span>DOCS</span>
        </button>
        {columns && rows && rows.length > 0 && (
          <button
            onClick={handleExportCSV}
            title="Export Raw Data to CSV"
            className="px-2 py-1 rounded bg-slate-900 hover:bg-emerald-950 border border-slate-800 hover:border-emerald-500/50 text-emerald-400 font-bold flex items-center space-x-1 transition"
          >
            <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
            <span>CSV</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/80 border border-slate-800/80 p-3 rounded-2xl">
      <div className="flex items-center space-x-2">
        <Download className="w-4 h-4 text-cyan-400" />
        <span className="text-xs font-mono font-bold text-slate-200 uppercase">
          EXPORT INTEL BRIEF / REPORT ({moduleTitle})
        </span>
      </div>

      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
        {lastExported && (
          <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center space-x-1 px-2 py-0.5 bg-emerald-950/60 border border-emerald-800/60 rounded-lg">
            <Check className="w-3 h-3 text-emerald-400" />
            <span>{lastExported}</span>
          </span>
        )}

        <button
          onClick={handleExportPDF}
          className="px-3 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-300 font-mono text-xs font-bold rounded-xl flex items-center space-x-1.5 transition shadow-[0_0_12px_rgba(6,182,212,0.2)]"
        >
          <FileText className="w-3.5 h-3.5 text-cyan-400" />
          <span>EXPORT PDF REPORT</span>
        </button>

        <button
          onClick={handleExportDOCS}
          className="px-3 py-1.5 bg-blue-950/80 hover:bg-blue-900 border border-blue-500/60 text-blue-300 font-mono text-xs font-bold rounded-xl flex items-center space-x-1.5 transition shadow-[0_0_12px_rgba(59,130,246,0.2)]"
        >
          <FileCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>EXPORT WORD DOC</span>
        </button>

        {columns && rows && rows.length > 0 && (
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/60 text-emerald-300 font-mono text-xs font-bold rounded-xl flex items-center space-x-1.5 transition shadow-[0_0_12px_rgba(16,185,129,0.2)]"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>EXPORT CSV</span>
          </button>
        )}
      </div>
    </div>
  );
};
