import React from 'react';
import { ShieldCheck, Crosshair, AlertOctagon, Terminal, Radio, FileText } from 'lucide-react';
import { Satellite } from '../types.ts';

interface SitrepProps {
  selectedSatellite: Satellite;
  defcon: number;
  onOpenReport?: () => void;
}

export const SitrepBoard: React.FC<SitrepProps> = ({ selectedSatellite, defcon, onOpenReport }) => {
  // Map DEFCON levels to specific threat ratings and operational procedures
  let alertName = 'NOMINAL_READINESS_DECLARED';
  let levelColor = 'text-emerald-400 border-emerald-900/40 bg-emerald-950/10';
  let directive = 'Execute generic diagnostic sweeps. Log orbital ephemeris metadata at regular intervals.';
  let advisoryStr = 'All spectrum indices are within standard ITU boundaries.';

  if (defcon === 4) {
    alertName = 'WATCH_SURVEILLANCE_INCREASED';
    levelColor = 'text-cyan-400 border-cyan-900/40 bg-cyan-950/10';
    directive = 'Monitor Ku-band edge channels. Prime look angle servo motors.';
    advisoryStr = 'Increased atmospheric background spurs observed.';
  } else if (defcon === 3) {
    alertName = 'AIR_DEFENSE_STANDBY';
    levelColor = 'text-amber-400 border-amber-900/40 bg-amber-950/10';
    directive = 'Encrypt signal links and enable multi-path carrier backup. Verify polarization skew isolation.';
    advisoryStr = 'Local scanning stations report baseline signal deviation in regional nodes.';
  } else if (defcon === 2) {
    alertName = 'CRITICAL_HIGH_ENGAGEMENT';
    levelColor = 'text-orange-500 border-orange-950 bg-orange-950/20';
    directive = 'Deploy spectrum decoys. Activate LPI (Low Probability of Intercept) emissions profile immediately.';
    advisoryStr = 'Target coordinates visible to broad-spectrum directional finding gear.';
  } else if (defcon === 1) {
    alertName = 'EMERGENCY_COMBAT_READINESS_ALPHA';
    levelColor = 'text-red-500 border-red-900/50 bg-red-950/30 animate-pulse';
    directive = 'Isolate hostile RF jamming spurs. Overclock BUC using Zero-Point grounding cooling protocols.';
    advisoryStr = 'Severe active electronic attack and jamming sweeps detected across broad carriers.';
  }

  return (
    <div className="p-4 bg-slate-950/90 border-2 border-slate-800 rounded-3xl flex flex-col space-y-3.5 select-none shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
        <label className="text-[8px] font-black uppercase tracking-widest text-slate-500 flex items-center space-x-1.5">
          <Terminal className="w-3.5 h-3.5 text-slate-600" />
          <span>Tactical Sitrep Assessment</span>
        </label>
        <span className="text-[7.5px] font-mono uppercase text-slate-500">
          SEC_LEVEL_CONFIRMED
        </span>
      </div>

      {/* DEFCON State Alert Box */}
      <div className={`p-3 rounded-2xl border flex flex-col space-y-1.5 transition duration-300 ${levelColor}`}>
        <div className="flex items-center justify-between">
          <span className="text-[7.5px] font-mono uppercase tracking-[0.2em]">DEFCON LEVEL {defcon}</span>
          {defcon <= 2 ? (
            <AlertOctagon className="w-4 h-4 animate-bounce" />
          ) : (
            <ShieldCheck className="w-4 h-4" />
          )}
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider font-sans leading-tight">
          [{alertName}]
        </span>
      </div>

      {/* Procedures and Directives */}
      <div className="space-y-2 text-[9px] font-mono leading-relaxed">
        <div className="flex flex-col space-y-0.5">
          <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest">Active Station Mandate</span>
          <p className="text-slate-300 bg-slate-900/40 p-2 rounded-xl border border-slate-900">
            {directive}
          </p>
        </div>

        <div className="flex flex-col space-y-0.5">
          <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest">System Advisory Advisory</span>
          <p className="text-slate-400">
            • {advisoryStr}
          </p>
        </div>
      </div>

      {onOpenReport && (
        <button
          type="button"
          onClick={onOpenReport}
          className="mt-2 w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono font-bold tracking-wider uppercase transition-all shadow-[0_0_12px_rgba(6,182,212,0.2)] hover:shadow-[0_0_18px_rgba(6,182,212,0.4)]"
        >
          <FileText className="w-3.5 h-3.5 text-cyan-400" />
          <span>Export Tactical Report (PDF)</span>
        </button>
      )}
    </div>
  );
};
