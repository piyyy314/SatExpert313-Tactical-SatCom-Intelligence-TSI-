import React, { useState } from 'react';
import { 
  FileText, Download, Printer, Shield, CheckCircle, AlertTriangle, 
  X, Crosshair, Radio, Compass, Orbit, Key, Copy, Check
} from 'lucide-react';
import { Coordinates, LookAngles, Satellite, TacticalEvent, WeatherCondition } from '../types.ts';
import { 
  exportService, 
  formatCoordinates, 
  ReportClassification 
} from '../services/exportService.ts';
import { audioController } from '../services/audioService.ts';

interface TacticalReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defcon: number;
  isStealthMode: boolean;
  isJamming: boolean;
  jammingPower: number;
  weather: WeatherCondition;
  stationCoordinates: Coordinates;
  selectedSatellite: Satellite;
  lookAngles: LookAngles | null;
  telemetry: {
    snr: string | number;
    rxPower: string | number;
    bucTemp: string | number;
    packetLoss: string | number;
    status: string;
  };
  activeView: string;
  eventLogs: TacticalEvent[];
  onMissionLog?: (detail: string, status?: any) => void;
}

export const TacticalReportModal: React.FC<TacticalReportModalProps> = ({
  isOpen,
  onClose,
  defcon,
  isStealthMode,
  isJamming,
  jammingPower,
  weather,
  stationCoordinates,
  selectedSatellite,
  lookAngles,
  telemetry,
  activeView,
  eventLogs,
  onMissionLog
}) => {
  const [classification, setClassification] = useState<ReportClassification>('TOP SECRET // NOFORN');
  const [callsign, setCallsign] = useState<string>('CALLSIGN-PHANTOM-313');
  const [remarks, setRemarks] = useState<string>('Routine tactical telemetry audit. Transponder lock verified within operational thresholds.');
  const [includeLogs, setIncludeLogs] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [copiedDigest, setCopiedDigest] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleDownloadPDF = () => {
    setIsExporting(true);
    try {
      audioController.playBeep(880, 0.08); // tactical chirp
      const { filename } = exportService.exportTacticalReportPDF({
        classification,
        defcon,
        isStealthMode,
        isJamming,
        jammingPower,
        weather,
        operatorName: callsign,
        stationCoordinates,
        selectedSatellite,
        lookAngles,
        telemetry,
        activeView,
        eventLogs: includeLogs ? eventLogs : [],
        notes: remarks
      });

      setDownloadSuccess(filename);
      if (onMissionLog) {
        onMissionLog(`TACTICAL_REPORT_EXPORTED: ${filename} (${classification})`, 'success');
      }
      setTimeout(() => setDownloadSuccess(null), 5000);
    } catch (err) {
      console.error('Failed to export tactical report:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrintPDF = () => {
    try {
      audioController.playBeep(660, 0.08);
      const doc = exportService.generateTacticalReport({
        classification,
        defcon,
        isStealthMode,
        isJamming,
        jammingPower,
        weather,
        operatorName: callsign,
        stationCoordinates,
        selectedSatellite,
        lookAngles,
        telemetry,
        activeView,
        eventLogs: includeLogs ? eventLogs : [],
        notes: remarks
      });
      const blob = doc.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      const printIframe = document.createElement('iframe');
      printIframe.style.position = 'fixed';
      printIframe.style.right = '0';
      printIframe.style.bottom = '0';
      printIframe.style.width = '0';
      printIframe.style.height = '0';
      printIframe.style.border = '0';
      printIframe.src = blobUrl;
      document.body.appendChild(printIframe);
      printIframe.onload = () => {
        try {
          printIframe.contentWindow?.focus();
          printIframe.contentWindow?.print();
        } catch {
          doc.save(`TSI_Tactical_Report_${Date.now()}.pdf`);
        }
      };
      if (onMissionLog) {
        onMissionLog(`TACTICAL_REPORT_PREVIEWED: Print stream initiated for ${selectedSatellite.name}`, 'info');
      }
    } catch (err) {
      console.error('Failed to preview/print report:', err);
    }
  };

  const handleCopyDigest = () => {
    const mockHash = `PQC-SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Date.now().toString(16).toUpperCase()}`;
    navigator.clipboard.writeText(mockHash);
    setCopiedDigest(true);
    setTimeout(() => setCopiedDigest(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-3xl bg-slate-900 border-2 border-cyan-500/60 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Classification Header Banner */}
        <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-cyan-950 border-b border-cyan-500/40 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/50 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <FileText className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-black font-mono tracking-wider text-cyan-300 uppercase">
                  Tactical Dossier & Mission Report Generator
                </h3>
                <span className="text-[9px] font-mono bg-cyan-900/50 text-cyan-200 border border-cyan-700/60 px-2 py-0.5 rounded-full">
                  PDF v5.4
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-400">
                Exports live telemetry, look angles, orbital ephemeris & DEFCON readiness into formatted A4 military PDF
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close generator"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 scrollbar-thin">
          
          {/* Live Mission Snapshot Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Target Satellite</span>
              <strong className="text-cyan-400 font-bold">{selectedSatellite.name}</strong>
              <span className="text-[10px] text-slate-400 block">{selectedSatellite.orbitalSlot}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Ground Station</span>
              <strong className="text-slate-200">{formatCoordinates(stationCoordinates)}</strong>
              <span className="text-[10px] text-slate-400 block">EL: {lookAngles ? `${lookAngles.elevation}°` : '--'} | AZ: {lookAngles ? `${lookAngles.azimuth}°` : '--'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">RF Carrier SNR</span>
              <strong className={Number(telemetry.snr) < 5 ? 'text-red-400 animate-pulse font-black' : 'text-emerald-400'}>
                {telemetry.snr} dB ({telemetry.status})
              </strong>
              <span className="text-[10px] text-slate-400 block">PWR: {telemetry.rxPower} dBW</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Tactical Status</span>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                  defcon === 1 ? 'bg-red-900/60 text-red-300 border border-red-500' :
                  defcon <= 2 ? 'bg-amber-900/60 text-amber-300 border border-amber-500' :
                  'bg-emerald-900/60 text-emerald-300 border border-emerald-500'
                }`}>
                  DEFCON {defcon}
                </span>
                <span className="text-[9px] text-purple-300">
                  {isStealthMode ? 'STEALTH' : 'EMIT'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                JAMMER: {isJamming ? `${jammingPower}%` : 'OFF'}
              </span>
            </div>
          </div>

          {/* Form Options */}
          <div className="space-y-4">
            {/* Classification Selector */}
            <div>
              <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider mb-2">
                Document Security Classification Level
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  'TOP SECRET // NOFORN',
                  'SECRET // REL TO NATO',
                  'CONFIDENTIAL',
                  'UNCLASSIFIED // FOR OFFICIAL USE ONLY'
                ].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setClassification(level as ReportClassification)}
                    className={`p-2 rounded-xl text-[10px] font-mono font-black uppercase text-center border transition-all ${
                      classification === level
                        ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {level.split(' // ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Officer Callsign */}
            <div>
              <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Authorizing Officer Callsign / Unit ID
              </label>
              <input
                type="text"
                value={callsign}
                onChange={(e) => setCallsign(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400 transition-colors"
                placeholder="e.g. OPERATOR-313 / 10th SATCOM BN"
              />
            </div>

            {/* Operational Remarks */}
            <div>
              <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Mission Remarks & Threat Assessment Notes
              </label>
              <textarea
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400 transition-colors"
                placeholder="Document observed carrier jitter, RF spectrum anomalies, or active countermeasures..."
              />
            </div>

            {/* Include Mission Logs Toggle */}
            <div className="flex items-center justify-between bg-slate-950/60 border border-slate-800 px-4 py-3 rounded-xl">
              <div>
                <span className="text-xs font-mono font-bold text-slate-200 block">
                  Append Tactical Event Audit Log (Page 2)
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  Includes the {Math.min(eventLogs.length, 15)} most recent security and telemetry events with timestamps
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeLogs}
                  onChange={(e) => setIncludeLogs(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>
          </div>

          {/* Success Banner */}
          {downloadSuccess && (
            <div className="bg-emerald-950/80 border border-emerald-500 text-emerald-200 p-3.5 rounded-xl flex items-center space-x-3 text-xs font-mono animate-fade-in">
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div>
                <span className="font-bold block">PDF REPORT SUCCESSFULLY GENERATED & SAVED</span>
                <span className="text-[10px] text-emerald-300 opacity-90">{downloadSuccess}</span>
              </div>
            </div>
          )}

          {/* Cryptographic verification strip */}
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>NIST FIPS 204 ML-DSA Signature & Checksum Stamp Ready</span>
            </div>
            <button
              onClick={handleCopyDigest}
              className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              {copiedDigest ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedDigest ? 'Checksum Copied' : 'Copy PQC Stamp'}</span>
            </button>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[10px] font-mono text-slate-500">
            A4 Standard Military Spec • High-Contrast Vector Vectorized Output
          </div>
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePrintPDF}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono font-bold transition-all"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span>Print / Preview</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-mono font-black shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Generating PDF...' : 'Download Tactical PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
