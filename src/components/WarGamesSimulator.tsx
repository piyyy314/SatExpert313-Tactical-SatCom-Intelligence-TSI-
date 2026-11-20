import React, { useState } from 'react';
import { Target, RefreshCw, Layers, ShieldCheck, Play, Pause, AlertTriangle } from 'lucide-react';

interface SimulationDetails {
  name: string;
  threatLevel: 'CRITICAL' | 'HIGH' | 'LOW';
  desc: string;
}

const CONST_SCENARIOS: SimulationDetails[] = [
  { name: 'Ku-Band Electromagnetic Pulse EMP Defence', threatLevel: 'CRITICAL', desc: 'Simulates the dynamic signal propagation degradation and power grid recovery bounds following an orbital nuclear EMP blast.' },
  { name: 'Hostile Constellation Spoofing Override', threatLevel: 'HIGH', desc: 'Simulates passive RF carrier validation loops designed to detect and mute counterfeit GPS tracking signals.' },
];

interface WarProps {
  satName: string;
}

export const WarGamesSimulator: React.FC<WarProps> = ({ satName }) => {
  const [activeScen, setActiveScen] = useState<SimulationDetails>(CONST_SCENARIOS[0]);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [pctSuccess, setPctSuccess] = useState<number>(75);
  const [logs, setLogs] = useState<string[]>(['[SIM] Defense scenario strategy matrix synced. Ready.']);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString([], { hour12: false })}] ${msg.toUpperCase()}`, ...prev].slice(0, 10));
  };

  const startSimulationRun = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    addLog(`Initiating war games simulation strategy: ${activeScen.name}`);

    setTimeout(() => {
      addLog(`Broadcasters deploying virtual noise templates across transponders on ${satName}...`);
    }, 500);

    setTimeout(() => {
      setPctSuccess(Math.floor(Math.random() * 25 + 70));
      setIsSimulating(false);
      addLog(`Simulation finalized. Operational success rating evaluated at ${pctSuccess}%`);
    }, 1500);
  };

  return (
    <div className="p-6 bg-slate-950 border-2 border-slate-900 rounded-3xl text-slate-100 flex flex-col space-y-6 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div className="flex items-center space-x-3">
          <Layers className="w-5 h-5 text-red-500 animate-pulse" />
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider font-mono">Orbital Combat & War Games Strategy Simulator</h3>
            <p className="text-[10px] text-slate-500 font-mono">Select, configure, and execute virtual scenarios to test transceiver resilience statistics in contested aerospace environments</p>
          </div>
        </div>
        <span className="text-[7.5px] font-mono uppercase bg-slate-900 text-red-400 border border-red-950 px-2 py-0.5 rounded">
          WAR_SIM
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Settings options left */}
        <div className="md:col-span-5 space-y-4 font-mono">
          <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col space-y-3.5">
            <span className="text-[8px] font-black uppercase text-slate-500 block tracking-widest">Simulation Parameters</span>

            <div className="grid grid-cols-1 gap-2">
              {CONST_SCENARIOS.map(sc => (
                <button
                  key={sc.name}
                  onClick={() => {
                    setActiveScen(sc);
                    setPctSuccess(75);
                    setIsSimulating(false);
                    addLog(`Strategy engine loaded scenario profile: ${sc.name}`);
                  }}
                  className={`text-left p-2.5 rounded-xl border flex flex-col space-y-1 transition ${
                    activeScen.name === sc.name
                      ? 'bg-red-950 border-red-500 text-red-400 font-black'
                      : 'bg-slate-950 border-slate-900/60 text-slate-500 hover:text-slate-400'
                  }`}
                >
                  <span className="text-[9.5px] uppercase">{sc.name.split(' ')[0]} Scenario</span>
                  <span className="text-[6.5px] text-slate-500 italic font-medium">THREAT CLASS: {sc.threatLevel}</span>
                </button>
              ))}
            </div>

            <button
              onClick={startSimulationRun}
              disabled={isSimulating}
              className={`w-full py-2.5 rounded-xl border text-[9px] font-mono uppercase tracking-widest font-black transition ${
                isSimulating
                  ? 'bg-red-950 border-red-500 text-slate-200 animate-pulse'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-red-400'
              }`}
            >
              {isSimulating ? 'Processing Matrix Strategy...' : 'Execute Simulation Run'}
            </button>
          </div>

          <div className="bg-black border border-slate-900 rounded-xl p-3 h-28 flex flex-col justify-between">
            <span className="text-[7.5px] font-mono text-slate-700 uppercase tracking-widest border-b border-slate-900 pb-1 block">Strategy Matrix Logs</span>
            <div className="flex-grow font-mono text-[7px] text-slate-400 space-y-0.5 pt-1 overflow-y-auto index-10 scrollbar-none">
              {logs.map((log, idx) => (
                <div key={idx} className="truncate">
                  <span className="text-red-500 pr-1">▶</span> {log}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Display visualizer right */}
        <div className="md:col-span-7 bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="grid grid-cols-2 gap-4 font-mono">
            <div className="bg-slate-950 border border-slate-900 p-3 rounded-2xl">
              <span className="text-[7.5px] text-slate-500 block">STRATEGY THREAT CLASS</span>
              <span className="text-xs font-mono font-black text-slate-200">{activeScen.threatLevel}</span>
            </div>

            <div className="bg-slate-950 border border-slate-900 p-3 rounded-2xl flex flex-col justify-between">
              <span className="text-[7.5px] text-slate-500 block">EVALUATED SUCCESS COHERENCE</span>
              <span className="text-xs font-mono font-black text-red-500">{pctSuccess}%</span>
            </div>
          </div>

          {/* Description text block */}
          <div className="bg-black border border-slate-900 p-4 rounded-xl flex flex-col justify-center">
            <p className="text-[9px] font-mono text-slate-400 leading-relaxed uppercase tracking-wider">
              {activeScen.desc}
            </p>
          </div>

          <div className="border-t border-slate-900 pt-2 flex items-center justify-between text-[7px] font-mono text-slate-600 uppercase">
            <span>Simulation sweeps compliant with defense aerospace model grids</span>
            <span className="text-emerald-400 font-black flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> SECURE SHIELDS COMPLETE
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
