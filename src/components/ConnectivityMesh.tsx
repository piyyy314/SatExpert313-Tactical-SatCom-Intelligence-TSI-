import React, { useState } from 'react';
import { Radio, ShieldCheck, Cpu, RefreshCw, Layers, Compass, Network, Globe } from 'lucide-react';
import { Satellite } from '../types.ts';

interface MeshProps {
  satellites: Satellite[];
  selectedSat: Satellite;
}

export const ConnectivityMesh: React.FC<MeshProps> = ({ satellites, selectedSat }) => {
  const [selectedRelay, setSelectedRelay] = useState<Satellite>(satellites[1] || selectedSat);
  const [meshLatency, setMeshLatency] = useState<number>(54);
  const [logs, setLogs] = useState<string[]>(['[MESH] Coherent intra-constellation optical link networks configured.']);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString([], { hour12: false })}] ${msg.toUpperCase()}`, ...prev].slice(0, 10));
  };

  const calculateRelayDistance = (s1: Satellite, s2: Satellite) => {
    // Mock orbital distance in Km
    const dx = Math.abs(s1.id.charCodeAt(0) - s2.id.charCodeAt(0)) * 400;
    return dx === 0 ? 1200 : dx + 650;
  };

  const handleRecalculateRelay = () => {
    addLog(`Initiating mesh path optimization sweep...`);
    setTimeout(() => {
      setMeshLatency(Math.floor(Math.random() * 40 + 35));
      addLog(`Rerouting mesh packets complete. Standard relay latency optimized to ${meshLatency} ms.`);
    }, 800);
  };

  return (
    <div className="p-6 bg-slate-950 border-2 border-slate-900 rounded-3xl text-slate-100 flex flex-col space-y-6 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div className="flex items-center space-x-3">
          <Network className="w-5 h-5 text-purple-400 animate-pulse" />
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider font-mono">Consellation Inter-Satellite Optical Mesh mapping</h3>
            <p className="text-[10px] text-slate-500 font-mono">Real-time status of cross-link routing, orbital backbones, and optical relay laser handshakes</p>
          </div>
        </div>
        <span className="text-[7.5px] font-mono uppercase bg-slate-900 text-purple-400 border border-purple-900/40 px-2 py-0.5 rounded">
          OPT_MESH
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Routing controls left */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col space-y-3">
            <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest block font-mono">Select Relay Link Node</span>

            <div className="space-y-1.5 font-mono">
              {satellites.filter(s => s.id !== selectedSat.id).slice(0, 3).map((sat) => (
                <button
                  key={sat.id}
                  onClick={() => {
                    setSelectedRelay(sat);
                    addLog(`Configured dynamic transit relay boundary on satellite: ${sat.name}`);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl border flex flex-col space-y-1 transition ${
                    selectedRelay.id === sat.id
                      ? 'bg-purple-950/40 border-purple-500 text-purple-400 font-bold'
                      : 'bg-slate-950 border-slate-900/60 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <div className="text-[9px] uppercase tracking-wide flex items-center justify-between">
                    <span>{sat.name}</span>
                    <span className="text-[7px] text-slate-600 bg-slate-950 px-1 py-0.2 rounded border border-slate-900">
                      ALT: {sat.altitude}Km
                    </span>
                  </div>
                  <div className="text-[7.5px] text-slate-500 flex justify-between pr-2">
                    <span>Transponder: {sat.type}</span>
                    <span>Distance: {calculateRelayDistance(selectedSat, sat)} Km</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-black border border-slate-900 rounded-xl p-3 h-28 flex flex-col justify-between">
            <span className="text-[7.5px] font-mono text-slate-700 uppercase tracking-widest border-b border-slate-900 pb-1 block">Relay Mesh Logs</span>
            <div className="flex-grow font-mono text-[7px] text-slate-400 space-y-0.5 pt-1 overflow-y-auto">
              {logs.map((log, idx) => (
                <div key={idx} className="truncate">
                  <span className="text-purple-500 pr-1">▶</span> {log}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mesh diagram right */}
        <div className="md:col-span-7 bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950 border border-slate-900 p-3 rounded-2xl flex items-center space-x-2.5">
              <Globe className="w-5 h-5 text-cyan-400 animate-pulse" />
              <div>
                <span className="text-[7px] font-mono text-slate-500 block">SOURCE CONSTELLATION UPLINK</span>
                <span className="text-xs font-mono font-bold text-slate-200 uppercase">{selectedSat.name}</span>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-900 p-3 rounded-2xl flex items-center space-x-2.5">
              <Network className="w-5 h-5 text-cyan-400 animate-pulse" />
              <div>
                <span className="text-[7px] font-mono text-slate-500 block">TRANSIT BACKUP RELAY</span>
                <span className="text-xs font-mono font-bold text-slate-200 uppercase">{selectedRelay.name}</span>
              </div>
            </div>
          </div>

          {/* Interactive structural Laser Line Graphic */}
          <div className="bg-black border border-slate-900 p-4 h-36 rounded-xl relative overflow-hidden flex items-center justify-center">
            {/* Dots representation */}
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:12px_12px] opacity-45"></div>

            {/* Glowing connecting line */}
            <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <line 
                x1="25%" 
                y1="50%" 
                x2="75%" 
                y2="50%" 
                stroke="#a855f7" 
                strokeWidth="2" 
                strokeDasharray="4 4" 
                className="animate-pulse"
              />
            </svg>

            <div className="relative z-10 flex w-full justify-around items-center px-4 font-mono">
              <div className="flex flex-col items-center">
                <div className="w-2.5 h-2.5 bg-cyan-500 rounded-full animate-ping mb-1"></div>
                <span className="text-[8.5px] text-cyan-400 font-bold bg-black/85 px-2 py-0.5 border border-cyan-900 rounded">{selectedSat.name}</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-ping mb-1"></div>
                <span className="text-[8.5px] text-purple-400 font-bold bg-black/85 px-2 py-0.5 border border-purple-900 rounded">{selectedRelay.name}</span>
              </div>
            </div>

            <div className="absolute bottom-2 right-2 text-[6.5px] font-mono text-slate-700 uppercase">
              LASER COUPLING STATE: COHERENT
            </div>
          </div>

          <div className="bg-black border border-slate-900 p-3.5 rounded-2xl flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[7px] font-mono text-slate-500 block">Consolidated relay latency</span>
              <span className="text-sm font-mono font-black text-cyan-400">{meshLatency} ms</span>
            </div>

            <button
              onClick={handleRecalculateRelay}
              className="bg-cyan-950/50 hover:bg-cyan-900 border border-cyan-800 text-cyan-400 px-3 py-1.5 rounded-xl font-mono text-[8.5px] font-black uppercase tracking-wider transition"
            >
              Optimize Mesh Routes
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
