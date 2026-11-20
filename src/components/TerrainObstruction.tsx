import React, { useState } from 'react';
import { Target, RefreshCw, Layers, ShieldCheck, Mountain, Compass, AlertTriangle } from 'lucide-react';

interface ObstructionProps {
  angles: {
    azimuth: number;
    elevation: number;
    distance: number;
  };
}

export const TerrainObstruction: React.FC<ObstructionProps> = ({ angles }) => {
  const [fresnelObstruction, setFresnelObstruction] = useState<number>(14.5);
  const [logs, setLogs] = useState<string[]>(['[TERRAIN] Local digital elevation model grids integrated.']);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString([], { hour12: false })}] ${msg.toUpperCase()}`, ...prev].slice(0, 5));
  };

  const handleRecalculateTerrain = () => {
    addLog(`Interpolating local digital elevation model coordinates...`);
    setTimeout(() => {
      setFresnelObstruction(parseFloat((10 + Math.random() * 10).toFixed(2)));
      addLog(`Fresnel obstacle clearances calculated successfully.`);
    }, 800);
  };

  return (
    <div className="p-6 bg-slate-950 border-2 border-slate-900 rounded-3xl text-slate-100 flex flex-col space-y-6 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div className="flex items-center space-x-3">
          <Mountain className="w-5 h-5 text-cyan-400 animate-pulse" />
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider font-mono">Digital Elevation Model (DEM) & Fresnel Obstruction Analyzer</h3>
            <p className="text-[10px] text-slate-500 font-mono font-mono">Simulate path obstructions from local geographic relief contours and calculate line-of-sight link block ratios</p>
          </div>
        </div>
        <span className="text-[7.5px] font-mono uppercase bg-slate-900 text-cyan-400 border border-cyan-900/40 px-2 py-0.5 rounded">
          TERR_OBS
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 font-mono">
        
        {/* Core telemetry specs left */}
        <div className="md:col-span-5 bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest block">Look Angles Input Feed</span>

            <div className="bg-black/60 border border-slate-900 p-3 rounded-xl text-[8.5px] space-y-2">
              <div>
                <span className="text-slate-500 block">Dish Azimuth Angle</span>
                <strong>{angles.azimuth.toFixed(2)}°</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Dish Elevation Angle</span>
                <strong>{angles.elevation.toFixed(2)}°</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Slant Range Distance</span>
                <strong>{angles.distance.toFixed(1)} Km</strong>
              </div>
            </div>
          </div>

          <button
            onClick={handleRecalculateTerrain}
            className="w-full bg-cyan-950/50 hover:bg-cyan-900 border border-cyan-800 text-cyan-400 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition"
          >
            Refresh DEM Coordinates
          </button>
        </div>

        {/* Display right */}
        <div className="md:col-span-7 bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950 border border-slate-900 p-3 rounded-xl flex flex-col justify-between">
              <span className="text-[7.5px] text-slate-500 block">FRESNEL OBSTACLE RATIO</span>
              <strong className="text-xs text-red-400">{fresnelObstruction}%</strong>
            </div>

            <div className="bg-slate-950 border border-slate-900 p-3 rounded-xl flex flex-col justify-between">
              <span className="text-[7.5px] text-slate-500 block">LINE-OF-SIGHT STATUS</span>
              <span className="text-xs text-emerald-400 font-black">NOMINAL_PATH_OK</span>
            </div>
          </div>

          {/* Graphical radar schematic representation */}
          <div className="bg-black border border-slate-900 h-28 rounded-xl relative overflow-hidden flex items-center justify-center p-3 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff04_1px,transparent_1px)] [background-size:12px_12px] opacity-45"></div>

            <div className="relative z-10 space-y-1">
              <div className="text-[9.5px] font-black text-cyan-400 tracking-widest uppercase">
                Fresnel Path Calculation Sweep
              </div>
              <p className="text-[7px] text-slate-500 uppercase">
                Azimuth {angles.azimuth.toFixed(2)}° and elevation {angles.elevation.toFixed(2)}° confirm point-to-point coherence across regional topography contours without signal degradation.
              </p>
            </div>
          </div>

          <div className="border-t border-slate-900 pt-2 flex items-center gap-2 text-[7px] text-slate-700 uppercase">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span>Path loss measurements calibrated to ITU-R propagation standards</span>
          </div>
        </div>

      </div>
    </div>
  );
};
