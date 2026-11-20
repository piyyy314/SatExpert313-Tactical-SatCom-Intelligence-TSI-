import React, { useState } from 'react';
import { Target, Shield, AlertTriangle, CheckCircle, RefreshCw, Cpu, FastForward } from 'lucide-react';

interface KillChainStage {
  phase: number;
  name: string;
  threat: string;
  countermeasure: string;
  status: 'MITIGATED' | 'COMPROMISED' | 'MONITORING';
}

interface CyberKillChainProps {
  addMissionLog?: (detail: string, status?: any) => void;
}

export const CyberKillChain: React.FC<CyberKillChainProps> = ({ addMissionLog }) => {
  const [stages, setStages] = useState<KillChainStage[]>([
    { phase: 1, name: 'Reconnaissance', threat: 'Subnet sweeps on VSAT receiver ports', countermeasure: 'Integrate NodeScanner blockades & IP maskers', status: 'MITIGATED' },
    { phase: 2, name: 'Weaponization', threat: 'Crafting targeted satellite telemetry exploits', countermeasure: 'Keep core Dilithium post-quantum keys updated', status: 'MITIGATED' },
    { phase: 3, name: 'Delivery', threat: 'Malicious packets injected through unencrypted S-Band', countermeasure: 'Enable passive carrier delay-lock checks and spoof checkers', status: 'MONITORING' },
    { phase: 4, name: 'Exploitation', threat: 'Feedhorn buffer overflow attempt on firmware', countermeasure: 'Run periodic sands-box YARA checkers', status: 'MITIGATED' },
    { phase: 5, name: 'Installation', threat: 'Persistent remote terminal access backdoors', countermeasure: 'Mute localized USB devices and unauthorized terminals', status: 'COMPROMISED' },
    { phase: 6, name: 'Command & Control (C2)', threat: 'Ground station Botnet DDoS coordinates sync', countermeasure: 'Deploy spectral honeypots and active jamming sweeps', status: 'MONITORING' },
    { phase: 7, name: 'Actions on Objectives', threat: 'Total transponder transceive takeover', countermeasure: 'Trigger orbital kinetic defensive alignment', status: 'MONITORING' },
  ]);

  const [logs, setLogs] = useState<string[]>(['[KILL_CHAIN] Passive cyber sensor arrays online.']);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString([], { hour12: false })}] ${msg.toUpperCase()}`, ...prev].slice(0, 8));
  };

  const handleMitigateStage = (p: number) => {
    addLog(`Deploying specialized security countermeasure on Phase ${p}...`);
    setTimeout(() => {
      setStages(prev => prev.map(s => s.phase === p ? { ...s, status: 'MITIGATED' } : s));
      addLog(`Phase ${p} vulnerability successfully closed and locked.`);
    }, 800);
  };

  return (
    <div className="p-6 bg-slate-950 border-2 border-slate-900 rounded-3xl text-slate-100 flex flex-col space-y-6 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div className="flex items-center space-x-3">
          <Target className="w-5 h-5 text-red-500 animate-pulse" />
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider font-mono">Maritime SATCOM Cyber Kill Chain Radar</h3>
            <p className="text-[10px] text-slate-500 font-mono">Interactive tracking of adversary intrusion lifecycles with corresponding tactical defensive lockouts</p>
          </div>
        </div>
        <span className="text-[7.5px] font-mono uppercase bg-slate-900 text-red-400 border border-red-900/40 px-2 py-0.5 rounded">
          KILL_CHAIN
        </span>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Stages list select */}
        <div className="lg:col-span-8 space-y-2.5">
          {stages.map((st) => (
            <div key={st.phase} className="bg-slate-950/45 border border-slate-900 p-3 rounded-2xl flex items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center font-mono text-xs font-black text-purple-400 select-none">
                  0{st.phase}
                </div>
                <div>
                  <div className="text-[9.5px] font-mono font-black text-slate-200 flex items-center gap-1.5 uppercase">
                    <span>{st.name}</span>
                    <span className={`text-[6.5px] px-1.5 py-0.5 border rounded uppercase font-bold ${
                      st.status === 'MITIGATED'
                        ? 'border-emerald-900 text-emerald-400 bg-emerald-950/20'
                        : st.status === 'COMPROMISED'
                        ? 'border-red-900 text-red-500 bg-red-950/20 animate-pulse'
                        : 'border-amber-900 text-amber-500 bg-amber-950/20'
                    }`}>
                      {st.status}
                    </span>
                  </div>
                  <div className="text-[8px] font-mono text-slate-500 uppercase">{st.threat}</div>
                </div>
              </div>

              {st.status !== 'MITIGATED' && (
                <button
                  onClick={() => handleMitigateStage(st.phase)}
                  className="bg-cyan-950/40 hover:bg-cyan-900 border border-cyan-800 text-cyan-400 px-2.5 py-1.5 rounded-xl font-mono text-[8px] font-black uppercase tracking-wider transition font-medium"
                >
                  Mitigate Phase
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Tactical audit logs right */}
        <div className="lg:col-span-4 bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest block font-mono flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-slate-600" />
              <span>Kill-Chain Mitigation Log</span>
            </span>

            <div className="bg-black border border-slate-900 p-3 h-64 rounded-xl overflow-y-auto scrollbar-none font-mono text-[7px] text-slate-400 space-y-1">
              {logs.map((log, idx) => (
                <div key={idx} className="flex gap-1">
                  <span className="text-purple-500">▶</span>
                  <span className="break-words font-medium">{log}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-900 pt-3 flex items-center gap-2 text-[7px] font-mono text-slate-600 uppercase">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Ensure real-time defenses are loaded under high threat alarms</span>
          </div>
        </div>

      </div>
    </div>
  );
};
