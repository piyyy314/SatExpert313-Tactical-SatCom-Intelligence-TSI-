import React from 'react';
import { Compass, ShieldCheck, RefreshCw, CompassIcon } from 'lucide-react';
import { LookAngles, Satellite } from '../types.ts';

interface LookAngleCardProps {
  angles: LookAngles;
  satellite: Satellite;
}

export const LookAngleCard: React.FC<LookAngleCardProps> = ({ angles, satellite }) => {
  const isBeamVisible = angles.elevation > 0;

  return (
    <div className="p-4 bg-slate-950/90 border-2 border-slate-800 rounded-3xl flex flex-col space-y-4 select-none shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
        <label className="text-[8px] font-black uppercase tracking-widest text-slate-500 flex items-center space-x-1.5">
          <Compass className="w-3.5 h-3.5 text-slate-600 animate-spin-slow" />
          <span>Antenna Pointing Angles</span>
        </label>
        <span className={`text-[7px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded ${
          isBeamVisible 
            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/40' 
            : 'bg-red-950/60 text-red-400 border border-red-900/40'
        }`}>
          {isBeamVisible ? "LINE_OF_SIGHT" : "BELOW_HORIZON_BLOCKED"}
        </span>
      </div>

      {/* Target and Slant Range */}
      <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 bg-slate-900/30 p-2 rounded-xl border border-slate-900">
        <span className="uppercase text-[8px] tracking-wider text-slate-500">Target Node:</span>
        <span className="font-bold text-slate-200">{satellite.name}</span>
        <span className="opacity-25">|</span>
        <span className="uppercase text-[8px] tracking-wider text-slate-500">Slant Range:</span>
        <span className="font-bold text-cyan-400 font-mono">
          {angles.distance.toLocaleString()} <span className="text-[7.5px] opacity-60">km</span>
        </span>
      </div>

      {/* Grid of dials */}
      <div className="grid grid-cols-3 gap-2">
        {/* Azimuth Dial */}
        <div className="bg-slate-950 border border-slate-900 p-2.5 rounded-2xl flex flex-col items-center justify-between space-y-2">
          <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-wider">Azi (Bearing)</span>
          
          <div className="relative w-12 h-12 flex items-center justify-center bg-slate-900/40 rounded-full border border-slate-900">
            {/* Minimal SVG arrow rotated to matching degree */}
            <svg className="w-8 h-8 transform duration-1000 ease-out" style={{ transform: `rotate(${angles.azimuth}deg)` }} viewBox="0 0 24 24">
              <path d="M12 2L8 8H16L12 2Z" fill="#22d3ee" />
              <line x1="12" y1="8" x2="12" y2="22" stroke="#475569" strokeWidth="1" strokeDasharray="1,1" />
            </svg>
            <div className="absolute inset-0.5 rounded-full border border-dashed border-slate-800 pointer-events-none"></div>
          </div>
          
          <span className="text-[11px] font-bold font-mono text-slate-200">
            {angles.azimuth.toFixed(1)}°
          </span>
        </div>

        {/* Elevation Scope */}
        <div className="bg-slate-950 border border-slate-900 p-2.5 rounded-2xl flex flex-col items-center justify-between space-y-2">
          <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-wider">Elev (Slope)</span>
          
          <div className="relative w-12 h-12 flex items-center justify-center bg-slate-900/40 rounded-full border border-slate-900">
            {/* SVG quadrant displaying height relative to zero line */}
            <svg className="w-10 h-10 transform -scale-y-100" viewBox="0 0 24 24">
              {/* Baseline horizon */}
              <line x1="2" y1="12" x2="22" y2="12" stroke="#334155" strokeWidth="1" />
              {/* Slope Pointer */}
              <line 
                x1="12" 
                y1="12" 
                x2={(12 + Math.cos((angles.elevation * Math.PI) / 180) * 10).toFixed(2)} 
                y2={(12 + Math.sin((angles.elevation * Math.PI) / 180) * 10).toFixed(2)} 
                stroke={isBeamVisible ? "#22d3ee" : "#ef4444"} 
                strokeWidth="2" 
              />
              <circle cx="12" cy="12" r="1.5" fill="#ffffff" />
            </svg>
          </div>
          
          <span className={`text-[11px] font-bold font-mono ${isBeamVisible ? 'text-slate-200' : 'text-red-400'}`}>
            {angles.elevation.toFixed(1)}°
          </span>
        </div>

        {/* Pol Skew */}
        <div className="bg-slate-950 border border-slate-900 p-2.5 rounded-2xl flex flex-col items-center justify-between space-y-2">
          <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-wider">Pol Isolation</span>
          
          <div className="relative w-12 h-12 flex items-center justify-center bg-slate-900/40 rounded-full border border-slate-900">
            {/* Feed Horn rotation bar */}
            <svg className="w-8 h-8 transform duration-1000 ease-out" style={{ transform: `rotate(${angles.skew}deg)` }} viewBox="0 0 24 24">
              <line x1="2" y1="12" x2="22" y2="12" stroke="#38bdf8" strokeWidth="2.5" />
              <rect x="10" y="8" width="4" height="8" fill="#475569" opacity="0.5" />
            </svg>
          </div>
          
          <span className="text-[11px] font-bold font-mono text-slate-200">
            {angles.skew.toFixed(1)}°
          </span>
        </div>
      </div>
    </div>
  );
};
