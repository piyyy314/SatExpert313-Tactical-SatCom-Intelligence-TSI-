import React, { useState } from 'react';
import { Compass, Radio, ShieldCheck, RefreshCw, Layers, Star, Navigation } from 'lucide-react';
import { Satellite } from '../types.ts';

interface DetailProps {
  satellites?: Satellite[];
  selectedSat?: Satellite;
  onSelectSat?: (sat: Satellite) => void;
  satellite?: Satellite;
  lookAngles?: any;
  isStealthMode?: boolean;
  isJamming?: boolean;
  jammingPower?: number;
  weather?: string;
}

export const SatelliteDetail: React.FC<DetailProps> = ({
  satellites = [],
  selectedSat: selectedSatProp,
  onSelectSat,
  satellite
}) => {
  const activeSat = selectedSatProp || satellite || satellites[0] || {
    id: 'sat-1',
    name: 'TACTICAL-SAT',
    longitude: 0,
    orbitalSlot: '0°E',
    altitude: 35786,
    type: 'Ku'
  };
  const [operatorLogs, setOperatorLogs] = useState<string[]>(['[DETAIL] Satellite hardware telemetry monitoring grid engaged.']);

  const addLog = (msg: string) => {
    setOperatorLogs(prev => [`[${new Date().toLocaleTimeString([], { hour12: false })}] ${msg.toUpperCase()}`, ...prev].slice(0, 5));
  };

  return (
    <div className="p-4 bg-slate-950 border-2 border-slate-900 rounded-3xl flex flex-col space-y-4 select-none shadow-lg">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-2">
        <label className="text-[8px] font-black uppercase tracking-widest text-slate-500 flex items-center space-x-1.5">
          <Navigation className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>Orbital Tracking Specs Selector</span>
        </label>
        <span className="text-[7.5px] font-mono uppercase bg-slate-950 text-cyan-400 border border-slate-900 px-1 py-0.5 rounded">
          SPEC_DET
        </span>
      </div>

      {/* Select Box */}
      <div className="flex flex-col space-y-1">
        <span className="text-[7px] font-black uppercase text-slate-500 tracking-wider">Configure Active Satellite</span>
        <select
          value={activeSat.id}
          onChange={(e) => {
            const sat = satellites.find(s => s.id === e.target.value);
            if (sat && onSelectSat) {
              onSelectSat(sat);
              addLog(`Aligned operational targeting coordinate grids with ${sat.name}`);
            }
          }}
          className="w-full bg-slate-950 text-xs font-mono py-1.5 px-2.5 border border-slate-900 rounded-xl focus:outline-none focus:border-cyan-500 cursor-pointer"
        >
          {satellites.length > 0 ? (
            satellites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.type || 'Ku'} band)
              </option>
            ))
          ) : (
            <option value={activeSat.id}>{activeSat.name} ({activeSat.type || 'Ku'} band)</option>
          )}
        </select>
      </div>

      {/* Numerical Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 text-[7.5px] font-mono leading-relaxed">
        <div className="bg-black/40 border border-slate-900/60 p-2 rounded-xl">
          <span className="text-slate-500 uppercase block">Orbital Altitude</span>
          <strong className="text-slate-200 text-[10px]">{activeSat.altitude ?? 35786} Km</strong>
        </div>

        <div className="bg-black/40 border border-slate-900/60 p-2 rounded-xl">
          <span className="text-slate-500 uppercase block">Transceiver Type</span>
          <strong className="text-slate-200 text-[10px]">{activeSat.type || 'Ku'} Band</strong>
        </div>

        <div className="bg-black/40 border border-slate-900/60 p-2 rounded-xl col-span-2">
          <span className="text-slate-500 uppercase block">Active Satellite Name Tag</span>
          <strong className="text-cyan-400 text-[10px]">{activeSat.name} OPERATIONAL</strong>
        </div>
      </div>

      {/* Log ticker */}
      <div className="bg-black border border-slate-900 p-2.5 rounded-xl h-16 overflow-y-auto scrollbar-none font-mono text-[6.5px] text-slate-500 space-y-0.5">
        {operatorLogs.map((log, idx) => (
          <div key={idx} className="truncate">
            <span className="text-cyan-500 pr-1">▶</span> {log}
          </div>
        ))}
      </div>

    </div>
  );
};
