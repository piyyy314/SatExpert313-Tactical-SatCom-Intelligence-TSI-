import React, { useState } from 'react';
import { Target, Terminal, Cpu, Play, Pause, RefreshCw, KeyRound, Wifi, ShieldAlert } from 'lucide-react';

interface AttackExploit {
  id: string;
  name: string;
  vectors: string;
  severity: 'CRITICAL' | 'HIGH' | 'LOW';
  description: string;
}

const EXPLOITS: AttackExploit[] = [
  { id: '1', name: 'SatIP Local Firmware Overflow', vectors: 'Buffer Poison [0x90 CC]', severity: 'CRITICAL', description: 'Triggers arbitrary memory code loading inside Ku-band telemetry transceivers.' },
  { id: '2', name: 'SSH Bypass Command Injection', vectors: 'Administrative Override Port 22', severity: 'HIGH', description: 'Overrides operator biometric filters and gains root level feedback access.' },
];

interface SuiteProps {
  addMissionLog: (detail: string, status?: 'active' | 'success' | 'warning') => void;
}

export const CyberAttackSuite: React.FC<SuiteProps> = ({ addMissionLog }) => {
  const [activeExp, setActiveExp] = useState<AttackExploit>(EXPLOITS[0]);
  const [targetHost, setTargetHost] = useState<string>('192.168.1.100');
  const [isExploiting, setIsExploiting] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>(['[ATTACK_SUITE] Pen-testing modules synchronized. Ready.']);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString([], { hour12: false })}] ${msg.toUpperCase()}`, ...prev].slice(0, 10));
  };

  const handleLaunchExploit = () => {
    if (isExploiting) return;
    setIsExploiting(true);
    addLog(`Target lock established: ${targetHost}. Initiating attack signature search...`);
    addMissionLog(`EXPLOIT_COMMENCED: testing ${activeExp.name} against ${targetHost}`, 'warning');

    setTimeout(() => {
      addLog(`Sending exploit buffer payload payload bytes: ${activeExp.vectors}...`);
    }, 600);

    setTimeout(() => {
      addLog(`Securing terminal root session...`);
    }, 1200);

    setTimeout(() => {
      setIsExploiting(false);
      addLog(`PEN-TEST COMPLETE. TARGET SUB-SYSTEM FULLY COMPROMISED.`);
      addMissionLog(`EXPLOIT_SUCCESS: ${activeExp.name} successfully deployed to target ${targetHost}`, 'success');
    }, 2000);
  };

  return (
    <div className="p-6 bg-slate-950 border-2 border-slate-900 rounded-3xl text-slate-100 flex flex-col space-y-6 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div className="flex items-center space-x-3">
          <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider font-mono">SATCOM Penetration Testing & Exploit Deck</h3>
            <p className="text-[10px] text-slate-500 font-mono">Simulate controlled vulnerability audits and testing sweeps against satellite baseband equipment</p>
          </div>
        </div>
        <span className="text-[7.5px] font-mono uppercase bg-slate-900 text-red-400 border border-red-950 px-2 py-0.5 rounded">
          DECK_PENTEST
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left selector inputs */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col space-y-3.5">
            <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest block font-mono">Target configuration</span>

            <div className="space-y-1">
              <label className="text-[7px] font-mono text-slate-500 uppercase">Target Address Host</label>
              <input
                type="text"
                value={targetHost}
                onChange={(e) => setTargetHost(e.target.value)}
                className="w-full bg-black border border-slate-900 rounded-xl px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="space-y-1 text-[8.5px] font-mono">
              <label className="text-[7px] font-mono text-slate-500 uppercase">Select Vulnerability Vector</label>
              <div className="grid grid-cols-1 gap-2">
                {EXPLOITS.map(ex => (
                  <button
                    key={ex.id}
                    onClick={() => {
                      setActiveExp(ex);
                      addLog(`Armed testing module: ${ex.name}`);
                    }}
                    className={`text-left p-2.5 rounded-xl border flex flex-col space-y-1 transition ${
                      activeExp.id === ex.id
                        ? 'bg-red-950/40 border-red-500 text-red-400 font-black'
                        : 'bg-slate-950 border-slate-900/60 text-slate-500 hover:text-slate-400'
                    }`}
                  >
                    <span>{ex.name}</span>
                    <span className="text-[6.5px] text-slate-500">VECTORS: {ex.vectors}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleLaunchExploit}
              disabled={isExploiting}
              className={`w-full py-2.5 rounded-xl border text-[9px] font-mono uppercase tracking-widest font-black transition ${
                isExploiting
                  ? 'bg-red-950 border-red-500 text-slate-200 animate-pulse'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-red-400'
              }`}
            >
              {isExploiting ? 'Running testing vector...' : 'Trigger Security Audit'}
            </button>
          </div>

          <div className="bg-black border border-slate-900 rounded-xl p-3 h-28 flex flex-col justify-between">
            <span className="text-[7px] font-mono text-slate-700 uppercase tracking-widest border-b border-slate-900 pb-1 block">Audit Terminal logs</span>
            <div className="flex-grow font-mono text-[7px] text-slate-400 space-y-1 pt-1 overflow-y-auto scrollbar-none">
              {logs.map((log, idx) => (
                <div key={idx} className="truncate">
                  <span className="text-red-500 pr-1">▶</span> {log}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right diagnostic visualizer */}
        <div className="md:col-span-7 bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-900 pb-2">
              <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 font-mono">Exploit Deck Description</span>
              <span className="text-[7.5px] font-mono text-red-500 bg-red-950/20 border border-red-900 px-2 py-0.5 rounded font-black uppercase">
                {activeExp.severity} SEVERITY
              </span>
            </div>

            <p className="text-[10px] font-mono text-slate-400 bg-black/50 p-3 rounded-xl border border-slate-900 leading-relaxed uppercase tracking-wider">
              {activeExp.description}
            </p>
          </div>

          {/* Core progress meter */}
          <div className="bg-black border border-slate-900 p-4 rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[7.5px] font-mono text-slate-500 block">EXPLOIT BUFFER SUCCESS RATIO</span>
              <span className="text-lg font-mono font-black text-cyan-400">
                {isExploiting ? 'INJECTING PAYLOAD...' : 'AUDIT READY'}
              </span>
            </div>

            <span>
              {isExploiting ? (
                <div className="bg-amber-950 text-amber-400 border border-amber-900 px-3 py-1 rounded-xl text-[8.5px] font-mono font-black uppercase tracking-wider animate-pulse">
                  INJECTING_PAYLOAD
                </div>
              ) : (
                <div className="bg-emerald-950 text-emerald-400 border border-emerald-900 px-3 py-1 rounded-xl text-[8.5px] font-mono font-black uppercase tracking-wider">
                  STANDBY_NOMINAL
                </div>
              )}
            </span>
          </div>

          <div className="border-t border-slate-900 pt-3 flex items-center gap-2 text-[7px] font-mono text-slate-600 uppercase">
            <span>Ensure all audit profiles confirm to NSA space security benchmarks before starting tests</span>
          </div>
        </div>

      </div>
    </div>
  );
};
