import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, ShieldCheck, ShieldAlert, Radio, RefreshCw, Cpu, Activity, Radar, Sparkles } from 'lucide-react';

interface SentinelNode {
  id: string;
  name: string;
  frequency: string;
  status: 'MUTED' | 'MONITORED' | 'SECURED';
  threatLevel: number; // 0-100
}

interface SentinelProps {
  isStealthMode: boolean;
  addMissionLog?: (detail: string, status?: 'active' | 'success' | 'warning') => void;
}

export const Sentinel: React.FC<SentinelProps> = ({ isStealthMode, addMissionLog }) => {
  const [nodes, setNodes] = useState<SentinelNode[]>([
    { id: '1', name: 'Alpha-S S-Band Telemetry Node', frequency: '2.24 GHz', status: 'MONITORED', threatLevel: 4 },
    { id: '2', name: 'Gamma-Ku Downlink Transponder', frequency: '12.45 GHz', status: 'SECURED', threatLevel: 0 },
    { id: '3', name: 'Tactical Quantum Uplink Guard', frequency: '14.20 GHz', status: 'MONITORED', threatLevel: 18 },
  ]);

  const [activeMode, setActiveMode] = useState<'PASSIVE' | 'WAR_GUARD' | 'HYPER_SECURE'>('PASSIVE');
  const [sentinelLogs, setSentinelLogs] = useState<string[]>([
    '[SENTINEL] Space Sentry watchdog engine loaded successfully.',
    '[SENTINEL] Passive spectrum monitoring active on orbital slots.',
  ]);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [integrityRate, setIntegrityRate] = useState<number>(98.84);

  const addLog = (msg: string) => {
    setSentinelLogs(prev => [
      `[${new Date().toLocaleTimeString([], { hour12: false })}] ${msg.toUpperCase()}`,
      ...prev,
    ].slice(0, 10));
  };

  const handleMitigateThreats = (nodeId: string) => {
    const targetNode = nodes.find(n => n.id === nodeId);
    if (!targetNode) return;

    addLog(`Deploying countermeasure beam steering to secure ${targetNode.name}`);
    if (addMissionLog) {
      addMissionLog(`SENTINEL_MITIGATE: deploying beam polarization lock on ${targetNode.name}`, 'active');
    }

    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, status: 'SECURED', threatLevel: 0 } : n));

    setTimeout(() => {
      addLog(`Threat mitigation complete. Handshake verified for target nodeId: ${nodeId}.`);
      setIntegrityRate(prev => Math.min(100, prev + 1.25));
      if (addMissionLog) {
        addMissionLog(`SENTINEL_SECURED: successfully mitigated transponder drift on ${targetNode.name}`, 'success');
      }
    }, 1200);
  };

  const executeSentrySweep = () => {
    if (isAuditing) return;
    setIsAuditing(true);
    addLog('Initiating high-frequency spectral sentinel sweep...');
    if (addMissionLog) {
      addMissionLog('SENTINEL_SWEEP: initiating constellation transponder watchdog audit', 'active');
    }

    setTimeout(() => {
      setNodes(prev => prev.map(n => {
        const adjustment = Math.floor(Math.random() * 15 - 5);
        const nextThreat = Math.max(0, Math.min(100, n.threatLevel + adjustment));
        return {
          ...n,
          threatLevel: nextThreat,
          status: nextThreat > 25 ? 'MUTED' : (nextThreat > 5 ? 'MONITORED' : 'SECURED')
        };
      }));
      setIntegrityRate(parseFloat((95 + Math.random() * 5).toFixed(2)));
      setIsAuditing(false);
      addLog('Spectral sweep completed. Integrity parameters updated.');
    }, 1500);
  };

  return (
    <div className={`p-6 bg-slate-950 border-2 rounded-3xl text-slate-100 flex flex-col space-y-6 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 ${
      isStealthMode ? 'border-red-950' : 'border-slate-900'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div className="flex items-center space-x-3">
          <Eye className={`w-5 h-5 ${isStealthMode ? 'text-red-500 animate-pulse' : 'text-cyan-400 animate-spin'} `} style={{ animationDuration: '6s' }} />
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider font-mono">Sentry Sentinel Watchdog Command</h3>
            <p className="text-[10px] text-slate-500 font-mono">Continuous spectral observation engine guarding transponder payloads, detecting adversary carrier locks, and locking handshake keys</p>
          </div>
        </div>
        <span className={`text-[7.5px] font-mono uppercase bg-slate-900 px-2 py-0.5 rounded ${
          isStealthMode ? 'text-red-500 border border-red-950/70 animate-pulse' : 'text-cyan-400 border border-cyan-950/70'
        }`}>
          SENTRY_CTRL
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Controls Layout Left Column */}
        <div className="lg:col-span-5 space-y-4 font-mono">
          <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col space-y-4">
            <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest block">Watchdog Operational Profile</span>

            <div className="space-y-1">
              <label className="text-[7.5px] text-slate-400 uppercase block">Sentinel Protection Mode</label>
              <div className="grid grid-cols-3 gap-1.5 text-[7.5px] font-black uppercase">
                {(['PASSIVE', 'WAR_GUARD', 'HYPER_SECURE'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => {
                      setActiveMode(m);
                      addLog(`Shifted Sentinel watchdog posture to ${m}`);
                      if (addMissionLog) {
                        addMissionLog(`SENTINEL_MODE_SHIFT: posture set to ${m}`, 'warning');
                      }
                    }}
                    className={`py-1.5 rounded-lg border transition ${
                      activeMode === m
                        ? isStealthMode
                          ? 'bg-red-950 border-red-500 text-red-400 font-bold'
                          : 'bg-cyan-950 border-cyan-500 text-cyan-400 font-bold'
                        : 'bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {m.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={executeSentrySweep}
              disabled={isAuditing}
              className={`w-full py-2.5 rounded-xl border text-[9px] font-black uppercase tracking-wider transition ${
                isAuditing
                  ? 'bg-cyan-950 border-cyan-500 text-slate-200 animate-pulse'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-cyan-400'
              }`}
            >
              {isAuditing ? 'Auditing Constellation Nodes...' : 'Execute Automated Sentry Sweep'}
            </button>
          </div>

          <div className="bg-black border border-slate-900 rounded-xl p-3 h-36 flex flex-col justify-between">
            <span className="text-[7.5px] font-mono text-slate-500 uppercase tracking-widest border-b border-slate-900 pb-1 block">Sentinel Watchdog Logs</span>
            <div className="flex-grow font-mono text-[7px] text-slate-400 space-y-0.5 pt-1.5 overflow-y-auto scrollbar-thin">
              {sentinelLogs.map((log, idx) => (
                <div key={idx} className="truncate">
                  <span className={`pr-1 ${isStealthMode ? 'text-red-500' : 'text-cyan-400'}`}>▶</span> {log}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Nodes & Pulse Displays Right Column */}
        <div className="lg:col-span-7 bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col justify-between space-y-4 font-mono">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950 border border-slate-900 p-3.5 rounded-xl">
              <span className="text-[7.5px] text-slate-500 block">S-BAND CARRIER INTEGRITY RATE</span>
              <strong className="text-sm text-cyan-400 animate-pulse">{integrityRate}%</strong>
            </div>

            <div className="bg-slate-950 border border-slate-900 p-3.5 rounded-xl">
              <span className="text-[7.5px] text-slate-500 block">ACTIVE WATCHDOG STATUS</span>
              <span className={`text-sm font-black ${isStealthMode ? 'text-red-500' : 'text-emerald-400'}`}>
                {isStealthMode ? 'STEALTH_ACTIVE_CONCEALED' : 'SPECTRAL_NOMINAL'}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest block">Uplink Channel Watchdog Sentry</span>

            <div className="space-y-2.5">
              {nodes.map((node) => (
                <div key={node.id} className="bg-black/60 border border-slate-900/80 p-3 rounded-xl flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="text-[9.5px] font-bold text-slate-200">{node.name} ({node.frequency})</div>
                    <div className="text-[7px] text-slate-500 uppercase">Threat Footprint: <span className="text-red-400">{node.threatLevel}%</span></div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[7px] px-2 py-0.5 rounded border font-semibold ${
                      node.status === 'SECURED'
                        ? 'border-emerald-950 text-emerald-400 bg-emerald-950/15'
                        : node.status === 'MONITORED'
                        ? 'border-amber-900 text-amber-500 bg-amber-950/10 animate-pulse'
                        : 'border-red-900 text-red-500 bg-red-950/15 animate-bounce'
                    }`}>
                      {node.status}
                    </span>

                    {node.status !== 'SECURED' && (
                      <button
                        onClick={() => handleMitigateThreats(node.id)}
                        className="bg-cyan-950/40 hover:bg-cyan-900 border border-cyan-800 text-cyan-400 px-2 py-0.5 rounded-lg text-[7px] uppercase font-black transition tracking-wider"
                      >
                        Lock Transponder
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-900 pt-2 flex items-center justify-between text-[7px] text-slate-600 uppercase">
            <span>Systems secure with post-quantum anti-jam handshakes</span>
            <span className="text-emerald-400 font-black flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> SENTINEL ACTIVE
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
