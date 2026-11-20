import React, { useState } from 'react';
import { Target, ShieldCheck, Cpu, RefreshCw, Radio, Compass, Wifi, KeyRound } from 'lucide-react';

export const AdvancedTacticalSuite: React.FC = () => {
  const [tacticalMode, setTacticalMode] = useState<'NOMINAL' | 'DEFND' | 'ALARM'>('NOMINAL');
  const [operatorKey, setOperatorKey] = useState<string>('TSI_KEY_B7C4..91X');
  const [signalShield, setSignalShield] = useState<boolean>(true);
  const [logs, setLogs] = useState<string[]>(['[SUITE] Tactical Suite unified systems dashboard initialized.']);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString([], { hour12: false })}] ${msg.toUpperCase()}`, ...prev].slice(0, 10));
  };

  const rotateOperatorKey = () => {
    const chars = 'ABCDEF0123456789';
    let rand = '';
    for (let i = 0; i < 4; i++) {
      rand += chars[Math.floor(Math.random() * 16)];
    }
    setOperatorKey(`TSI_KEY_${rand}_91X`);
    addLog(`Operator validation cryptographic key refreshed and applied successfully.`);
  };

  return (
    <div className="p-6 bg-slate-950 border-2 border-slate-900 rounded-3xl text-slate-100 flex flex-col space-y-6 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div className="flex items-center space-x-3">
          <Target className="w-5 h-5 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider font-mono">Advanced Master Tactical Commander Suite</h3>
            <p className="text-[10px] text-slate-500 font-mono font-mono">Centralized operator layout providing complete oversight of satellite configurations, orbital tracking mounts, and cryptographic handshakes</p>
          </div>
        </div>
        <span className="text-[7.5px] font-mono uppercase bg-slate-900 text-cyan-400 border border-cyan-900/40 px-2 py-0.5 rounded">
          TACT_MASTER
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Core settings deck left */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col space-y-4">
            <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest block font-mono">Mission Threat Alert level</span>
            
            <div className="grid grid-cols-3 gap-2">
              {(['NOMINAL', 'DEFND', 'ALARM'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setTacticalMode(m);
                    addLog(`System master combat strategy shifted to ${m}`);
                  }}
                  className={`py-2 rounded-xl border text-[9px] font-mono font-black uppercase transition ${
                    tacticalMode === m
                      ? m === 'NOMINAL'
                        ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400'
                        : m === 'DEFND'
                        ? 'bg-amber-950/40 border-amber-500 text-amber-400'
                        : 'bg-red-950/40 border-red-500 text-red-400 animate-pulse'
                      : 'bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <div className="space-y-1.5 pt-1">
              <span className="text-[7.5px] font-mono text-slate-500 uppercase block">Active Operator Payload Certificate</span>
              <div className="bg-black border border-slate-900 p-2.5 rounded-xl flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-cyan-400 select-all">{operatorKey}</span>
                <button
                  onClick={rotateOperatorKey}
                  className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-black border border-slate-900 rounded-xl p-3 h-32 flex flex-col justify-between">
            <span className="text-[7.5px] font-mono text-slate-700 uppercase tracking-widest border-b border-slate-900 pb-1 block">Unified Suite Logs</span>
            <div className="flex-grow font-mono text-[7px] text-slate-400 space-y-0.5 pt-1 overflow-y-auto">
              {logs.map((log, idx) => (
                <div key={idx} className="truncate">
                  <span className="text-cyan-500 pr-1">▶</span> {log}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Big metrics right */}
        <div className="md:col-span-7 bg-slate-950/40 border border-slate-900 p-5 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950 border border-slate-900 p-3 rounded-2xl flex items-center space-x-3">
              <Compass className="w-5 h-5 text-cyan-400" />
              <div>
                <span className="text-[7px] font-mono text-slate-500 block">DISH AZIMUTH LOCK</span>
                <span className="text-xs font-mono font-bold text-slate-200">241.52° APEX OK</span>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-900 p-3 rounded-2xl flex items-center space-x-3">
              <Wifi className="w-5 h-5 text-cyan-400" />
              <div>
                <span className="text-[7px] font-mono text-slate-500 block">W-IF MULTICAST ADAPTER</span>
                <span className="text-xs font-mono font-bold text-slate-200">MEMBER_ACTIVE_OK</span>
              </div>
            </div>
          </div>

          {/* Large display schematic mock vector */}
          <div className="bg-black border border-slate-900 p-4 h-32 rounded-xl flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff04_1px,transparent_1px)] [background-size:12px_12px] opacity-45"></div>

            <div className="relative z-10 flex flex-col items-center select-none text-center space-y-1">
              <div className="text-[9.5px] font-mono font-black text-cyan-400 tracking-widest uppercase">
                INTELL_TACTICAL_CENTERLOCK
              </div>
              <p className="text-[7px] font-mono text-slate-500 uppercase max-w-xs">
                All transponders and localized active shields reporting nominal post-quantum integrity over secure C-Band tracking relays
              </p>
            </div>

            <div className="absolute bottom-2 right-2 text-[6.5px] font-mono text-slate-700 uppercase">
              STATUS SYSTEM LEVEL LOCK
            </div>
          </div>

          <div className="border-t border-slate-900 pt-3 flex items-center justify-between text-[7.5px] font-mono text-slate-600 uppercase">
            <span>MASTER DEFEN BLOCK</span>
            <span className="text-emerald-400 font-black flex items-center space-x-1">
              <ShieldCheck className="w-4 h-4" /> <span>SECURE INTEGRITY SEAL COMPLETE</span>
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
