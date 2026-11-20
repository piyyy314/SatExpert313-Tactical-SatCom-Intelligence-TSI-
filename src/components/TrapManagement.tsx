import React, { useState } from 'react';
import { Target, RefreshCw, Layers, ShieldCheck, Play, Pause, AlertTriangle, HelpCircle } from 'lucide-react';

interface DecoyNode {
  id: string;
  name: string;
  type: 'DECOY_TRANSCEIVER' | 'FAKE_TELNET';
  status: 'DEPLOYED' | 'STANDBY';
  clicksMatched: number;
}

export const TrapManagement: React.FC = () => {
  const [decoys, setDecoys] = useState<DecoyNode[]>([
    { id: '1', name: 'Virtual S-Band Honeypot Decoy', type: 'DECOY_TRANSCEIVER', status: 'DEPLOYED', clicksMatched: 42 },
    { id: '2', name: 'Open Telnet decoy port 23', type: 'FAKE_TELNET', status: 'DEPLOYED', clicksMatched: 104 },
  ]);
  const [logs, setLogs] = useState<string[]>(['[TRAP] Dynamic cybersecurity honeypot system active. Ready.']);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString([], { hour12: false })}] ${msg.toUpperCase()}`, ...prev].slice(0, 10));
  };

  const deployNewTrap = () => {
    addLog(`Broadcasting dynamic virtual decoy transceiver configurations...`);
    setTimeout(() => {
      setDecoys(prev => prev.map(d => ({
        ...d,
        status: 'DEPLOYED',
        clicksMatched: d.clicksMatched + Math.floor(Math.random() * 5)
      })));
      addLog(`All virtual telemetry honeypots reports synched. Decoy telemetry active.`);
    }, 800);
  };

  return (
    <div className="p-6 bg-slate-950 border-2 border-slate-900 rounded-3xl text-slate-100 flex flex-col space-y-6 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-purple-400 animate-pulse" />
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider font-mono">Honeypot Decoy & Trap Management Hub</h3>
            <p className="text-[10px] text-slate-500 font-mono">Deploy virtual baseline transponders and simulate network sockets to intercept and log unauthorized intruder access attempts</p>
          </div>
        </div>
        <span className="text-[7.5px] font-mono uppercase bg-slate-900 text-purple-400 border border-purple-950 px-2 py-0.5 rounded">
          DECOY_GRID
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Settings options left */}
        <div className="md:col-span-5 space-y-4 font-mono">
          <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col space-y-4">
            <span className="text-[8px] font-black uppercase text-slate-500 block tracking-widest">Honeypot operations</span>

            <button
              onClick={deployNewTrap}
              className="w-full bg-cyan-950/50 hover:bg-cyan-900 border border-cyan-800 text-cyan-400 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition"
            >
              Deploy Decoy transponders
            </button>
          </div>

          <div className="bg-black border border-slate-900 rounded-xl p-3 h-28 flex flex-col justify-between">
            <span className="text-[7.5px] font-mono text-slate-700 uppercase tracking-widest border-b border-slate-900 pb-1 block">Trap Operations Logs</span>
            <div className="flex-grow font-mono text-[7px] text-slate-400 space-y-0.5 pt-1 overflow-y-auto">
              {logs.map((log, idx) => (
                <div key={idx} className="truncate">
                  <span className="text-purple-500 pr-1">▶</span> {log}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic metrics displays right */}
        <div className="md:col-span-7 bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-3 flex-grow font-mono">
            <span className="text-[8px] font-black uppercase text-slate-400 block">Deployed Decoy Clusters</span>

            <div className="space-y-2">
              {decoys.map((dec) => (
                <div key={dec.id} className="bg-black/60 border border-slate-900 p-3 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-[9.5px] font-bold text-slate-200">{dec.name}</div>
                    <div className="text-[7px] text-slate-500 uppercase">TYPE: {dec.type} | CLICKS: {dec.clicksMatched}</div>
                  </div>

                  <span className={`text-[7px] px-2 py-0.5 rounded border font-semibold ${
                    dec.status === 'DEPLOYED'
                      ? 'border-emerald-950 text-emerald-400 bg-emerald-950/10'
                      : 'border-slate-800 text-slate-600'
                  }`}>
                    {dec.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-900 pt-2 flex items-center justify-between text-[7px] font-mono text-slate-600 uppercase">
            <span>Cyber decoys fully compliant with honeynet specifications</span>
            <span className="text-emerald-400 font-black flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> DEPLOYED
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
