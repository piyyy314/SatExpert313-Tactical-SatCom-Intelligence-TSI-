import React, { useState } from 'react';
import { Target, RefreshCw, Cpu, FastForward, Play, Pause, ShieldCheck, KeyRound } from 'lucide-react';
import { QuantumEntropyWidget } from './QuantumEntropyWidget.tsx';

interface DefenseProps {
  isStealthMode: boolean;
  addMissionLog: (detail: string, status?: 'active' | 'success' | 'warning') => void;
}

export const QuantumDefense: React.FC<DefenseProps> = ({ isStealthMode, addMissionLog }) => {
  const [entropyRate, setEntropyRate] = useState<number>(98.2);
  const [secureKey, setSecureKey] = useState<string>('CRY_Q_7X8D..9A2');
  const [logs, setLogs] = useState<string[]>(['[SHIELDS] Advanced post-quantum cryptographic shield walls established.']);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString([], { hour12: false })}] ${msg.toUpperCase()}`, ...prev].slice(0, 10));
  };

  const rekeyShields = () => {
    addLog(`Broadcasting post-quantum secure entropy sync beacons...`);
    addMissionLog(`SHIELD_KEY_ROTATE: dynamic crypto key rotation initiated`, 'active');

    setTimeout(() => {
      const chars = 'ABCDEF0123456789';
      let r = '';
      for (let i = 0; i < 4; i++) {
        r += chars[Math.floor(Math.random() * 16)];
      }
      setSecureKey(`CRY_Q_${r}_9A2`);
      setEntropyRate(parseFloat((98 + Math.random() * 2).toFixed(2)));
      addLog(`Cryptographic shift complete. Applied updated entropy boundaries securely.`);
      addMissionLog(`SHIELD_KEY_ROTATE_SUCCESS: new post-quantum shield key deployed`, 'success');
    }, 1000);
  };

  return (
    <div className="p-6 bg-slate-950 border-2 border-slate-900 rounded-3xl text-slate-100 flex flex-col space-y-6 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div className="flex items-center space-x-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 animate-pulse" />
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider font-mono">Quantum Cryptographic Shield Commander</h3>
            <p className="text-[10px] text-slate-500 font-mono">Manage active entropy injectors, rotate quantum keys, and shield signal channels against hostile brute-force decryption sweeps</p>
          </div>
        </div>
        <span className="text-[7.5px] font-mono uppercase bg-slate-900 text-emerald-450 border border-emerald-900 px-2 py-0.5 rounded">
          CRYP_SHIELD
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left operations deck */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col space-y-4">
            <span className="text-[8px] font-black uppercase text-slate-505 block tracking-widest font-mono">Entropy Operations Controls</span>

            <div className="space-y-1">
              <span className="text-[7px] font-mono text-slate-500 uppercase">Active Quantum Shield Key</span>
              <div className="bg-black border border-slate-900 p-2 text-xs font-mono font-bold text-slate-315 text-center truncate">
                {secureKey}
              </div>
            </div>

            <button
              onClick={rekeyShields}
              className="w-full bg-cyan-950/50 hover:bg-cyan-900 border border-cyan-800 text-cyan-405 py-2.5 rounded-xl text-[9px] font-black font-mono uppercase tracking-wider transition"
            >
              Rotate Shield Key
            </button>
          </div>

          <div className="bg-black border border-slate-900 rounded-xl p-3 h-28 flex flex-col justify-between">
            <span className="text-[7.5px] font-mono text-slate-655 uppercase tracking-widest border-b border-slate-900 pb-1 block">Shield Activity Logs</span>
            <div className="flex-grow font-mono text-[7px] text-slate-400 space-y-0.5 pt-1 overflow-y-auto">
              {logs.map((log, idx) => (
                <div key={idx} className="truncate">
                  <span className="text-emerald-505 pr-1">▶</span> {log}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right metrics displays */}
        <div className="md:col-span-7 bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950 border border-slate-900 p-3 rounded-2xl">
              <span className="text-[7.5px] font-mono text-slate-500 block">KEY LENGTH STANDARD</span>
              <span className="text-xs font-mono font-bold text-slate-205">PQ-ECDSA-512 BITS</span>
            </div>

            <div className="bg-slate-950 border border-slate-900 p-3 rounded-2xl">
              <span className="text-[7.5px] font-mono text-slate-500 block">SHIELDS INTEGRITY RATE</span>
              <span className="text-xs font-mono font-black text-emerald-405">{entropyRate}%</span>
            </div>
          </div>

          {/* Interactive entropy visual block */}
          <div className="bg-black border border-slate-900 h-28 rounded-xl relative overflow-hidden flex items-center justify-center p-3 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff04_1px,transparent_1px)] [background-size:12px_12px] opacity-45"></div>
            <div className="absolute w-24 h-24 border border-emerald-900/10 rounded-full animate-ping"></div>

            <div className="relative z-10 font-mono space-y-1">
              <div className="text-[9.5px] font-black text-emerald-400 tracking-widest uppercase">
                ENTROPY_INJECT_SYSTEM: STATUS_NOMINAL
              </div>
              <p className="text-[7px] text-slate-505 uppercase">
                Dynamic noise injector sweeps synchronized. No coherent cryptographic decodability identified inside transponder frames
              </p>
            </div>
          </div>

          <div className="border-t border-slate-900 pt-3 flex items-center justify-between text-[7px] font-mono text-slate-655 uppercase">
            <span>Laser relays fully encrypted</span>
            <span className="text-emerald-450 font-black flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> SECURE HANDSHAKES COMPLETE
            </span>
          </div>
        </div>

      </div>

      {/* Real-Time Quantum Entropy Recharts Trendline Visualizer */}
      <QuantumEntropyWidget onAlert={(msg) => addMissionLog(msg, 'success')} />
    </div>
  );
};
