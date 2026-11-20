import React, { useState, useEffect } from 'react';
import { Fingerprint, Heart, Eye } from 'lucide-react';

interface OperatorProfile {
  name: string;
  rank: string;
  id: string;
  clearance: 'RESTRICTED' | 'SECRET' | 'TOP_SECRET';
  pulse: number;
}

const OPERATORS: OperatorProfile[] = [
  { name: 'Cmdr. John Miller', rank: 'Systems Security Division', id: 'SSD-9031-A', clearance: 'TOP_SECRET', pulse: 68 },
  { name: 'Dr. Sarah Carter', rank: 'Space-Sec Research lead', id: 'SSR-4902-B', clearance: 'SECRET', pulse: 71 },
  { name: 'Lt. Mason Cole', rank: 'Orbital Intercept Ops', id: 'OIO-8812-C', clearance: 'RESTRICTED', pulse: 82 },
];

interface BiometricScannerProps {
  addMissionLog?: (detail: string, status?: any) => void;
}

export const BiometricScanner: React.FC<BiometricScannerProps> = ({ addMissionLog }) => {
  const [activeOperator, setActiveOperator] = useState<OperatorProfile>(OPERATORS[0]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [hasScanned, setHasScanned] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>(['[BIOMETRIC] System ready for scanning authorization.']);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString([], { hour12: false })}] ${msg.toUpperCase()}`, ...prev].slice(0, 10));
  };

  const startScanProcedure = () => {
    if (isScanning) return;
    setIsScanning(true);
    setHasScanned(false);
    addLog(`Initiating scanner array. Adjusting focal depth sensors...`);

    setTimeout(() => {
      addLog(`Biometric signature match identified for ID: ${activeOperator.id}`);
    }, 600);

    setTimeout(() => {
      addLog(`Evaluating system credentials...`);
    }, 1200);

    setTimeout(() => {
      setIsScanning(false);
      setHasScanned(true);
      addLog(`ACCESS GRANTED. Welcoming ${activeOperator.name.toUpperCase()}`);
    }, 1800);
  };

  return (
    <div className="p-6 bg-slate-950 border-2 border-slate-900 rounded-3xl text-slate-100 flex flex-col space-y-6 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div className="flex items-center space-x-3">
          <Fingerprint className="w-5 h-5 text-purple-400 animate-pulse" />
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider font-mono">Quantum Biometric Authorization Console</h3>
            <p className="text-[10px] text-slate-500 font-mono">High-precision dual fingerprint and ocular profile vetting for tactical system lock clearance</p>
          </div>
        </div>
        <span className="text-[7.5px] font-mono uppercase bg-slate-900 text-purple-400 border border-purple-900/40 px-2 py-0.5 rounded">
          SECURE_AUTH
        </span>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Profile Details Selection */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col space-y-3">
            <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest block font-mono">Present Credentials</span>
            
            <div className="space-y-1.5">
              {OPERATORS.map((op) => (
                <button
                  key={op.id}
                  onClick={() => {
                    setActiveOperator(op);
                    setHasScanned(false);
                    addLog(`Operator switched. Set to ${op.name}`);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl border flex flex-col space-y-1 transition ${
                    activeOperator.id === op.id
                      ? 'bg-purple-950/40 border-purple-400/80 text-purple-400'
                      : 'bg-slate-950 border-slate-900/60 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <div className="text-[9.5px] font-black font-mono leading-none">{op.name.toUpperCase()}</div>
                  <div className="text-[7.5px] font-mono text-slate-500 flex justify-between pr-2">
                    <span>Rank: {op.rank}</span>
                    <span>Clearance: {op.clearance}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-black border border-slate-900 rounded-xl p-3 h-32 flex flex-col justify-between">
            <span className="text-[7px] font-mono text-slate-600 uppercase tracking-widest border-b border-slate-900 pb-1 block">Biometric System Logs</span>
            <div className="flex-grow font-mono text-[7px] text-slate-400 space-y-0.5 pt-1 overflow-y-auto">
              {logs.map((log, idx) => (
                <div key={idx} className="truncate">
                  <span className="text-purple-500 pr-1">▶</span> {log}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Graphical Laser scanner pad */}
        <div className="md:col-span-7 bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col justify-between h-80 relative">
          
          {/* Laser scanning visualization container */}
          <div className="bg-black/80 border border-slate-900 rounded-xl relative h-48 overflow-hidden flex items-center justify-center">
            {/* Focal grid lines */}
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:12px_12px] opacity-40"></div>
            
            {/* Retinal and fingerprint icons side by side */}
            <div className="flex items-center space-x-12 relative z-10">
              <div className="flex flex-col items-center space-y-1">
                <div className={`p-4 rounded-full border transition-all duration-300 ${
                  isScanning ? 'border-cyan-500/80 text-cyan-400 animate-pulse' : 'border-slate-800 text-slate-600'
                }`}>
                  <Eye className="w-10 h-10" />
                </div>
                <span className="text-[7px] font-mono text-slate-500 uppercase tracking-widest">Retinal Array</span>
              </div>

              <div className="flex flex-col items-center space-y-1">
                <div className={`p-4 rounded-full border transition-all duration-300 ${
                  isScanning ? 'border-purple-500/80 text-purple-400 animate-pulse' : 'border-slate-800 text-slate-600'
                }`}>
                  <Fingerprint className="w-10 h-10" />
                </div>
                <span className="text-[7px] font-mono text-slate-500 uppercase tracking-widest">Print Sensor</span>
              </div>
            </div>

            {/* Scanning sweeping laser beam */}
            {isScanning && (
              <div className="absolute left-0 right-0 top-1/2 h-[1.5px] bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)] z-20 animate-bounce"></div>
            )}

            {/* Scan output badges */}
            {!isScanning && hasScanned && (
              <div className="absolute top-3 right-3 bg-emerald-950/30 border border-emerald-500 text-emerald-400 px-2 py-0.5 rounded text-[8px] font-mono animate-pulse uppercase">
                CREDENTIALS VERIFIED
              </div>
            )}
            
            <div className="absolute bottom-2 left-2 text-[6.5px] font-mono text-slate-600 uppercase tracking-widest">
              HARDWARE SCANNER INACTIVE_STANDBY
            </div>
          </div>

          {/* Stats & Operator Core detail parameters */}
          <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-900 items-center">
            <div className="bg-slate-950 p-2 rounded-xl border border-slate-900/40">
              <span className="text-[6.5px] font-mono text-slate-500 uppercase block">Operator Heartbeat</span>
              <div className="flex items-center justify-center space-x-1 text-slate-200 font-mono">
                <Heart className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                <span className="font-bold">{activeOperator.pulse} BPM</span>
              </div>
            </div>

            <div className="bg-slate-950 p-2 rounded-xl border border-slate-900/40">
              <span className="text-[6.5px] font-mono text-slate-500 uppercase block">Clearance</span>
              <span className="text-[10px] font-mono font-black text-purple-400">{activeOperator.clearance}</span>
            </div>

            <button
              onClick={startScanProcedure}
              disabled={isScanning}
              className={`py-2 px-3 rounded-xl border font-mono text-[9px] uppercase tracking-wider font-extrabold transition ${
                isScanning
                  ? 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-cyan-950/50 hover:bg-cyan-900 border border-cyan-800 text-cyan-400'
              }`}
            >
              Start Scan
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
