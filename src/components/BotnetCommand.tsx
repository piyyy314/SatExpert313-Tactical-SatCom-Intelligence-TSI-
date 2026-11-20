import React, { useState, useEffect } from 'react';
import { Terminal, ShieldAlert, Play, Pause, Activity, Globe, RefreshCw, Radio } from 'lucide-react';

interface BotnetProps {
  addMissionLog: (detail: string, status?: 'active' | 'success' | 'warning') => void;
}

export const BotnetCommand: React.FC<BotnetProps> = ({ addMissionLog }) => {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [totalBots, setTotalBots] = useState<number>(4592);
  const [targetIp, setTargetIp] = useState<string>('192.168.100.1');
  const [method, setMethod] = useState<'SATIP_AMP' | 'TCP_SYN' | 'UDP_FLOOD'>('SATIP_AMP');
  const [targetLatency, setTargetLatency] = useState<number>(14);
  const [logs, setLogs] = useState<string[]>(['[BOTNET] Slave nodes in sleep-standby posture.']);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString([], { hour12: false })}] ${msg.toUpperCase()}`, ...prev].slice(0, 10));
  };

  // Mock dynamic latency jitter and packet traffic
  useEffect(() => {
    if (!isActive) {
      setTargetLatency(14);
      return;
    }

    const interval = setInterval(() => {
      // Latency scales rapidly under attack
      setTargetLatency(prev => Math.min(2500, prev + Math.floor(Math.random() * 250 + 100)));
      setTotalBots(prev => Math.min(10000, prev + Math.floor(Math.random() * 80 - 10)));
      if (Math.random() > 0.7) {
        addLog(`Transceiving SatIP amplification packets to victim target: ${targetIp}`);
      }
    }, 450);

    return () => clearInterval(interval);
  }, [isActive, targetIp]);

  const handleToggleAttack = () => {
    const next = !isActive;
    setIsActive(next);

    if (next) {
      addLog(`Initiating master coordination signal. Instructing ${totalBots} drone relays to flood target ${targetIp}...`);
      addMissionLog(`BOTNET_DDoS_LAUNCHED: target ${targetIp} flooding initiated`, 'warning');
    } else {
      addLog(`Muted coordinate attack. Returning slaves to silent listening standby.`);
      addMissionLog(`BOTNET_DDoS_HALTED: target flooding halted.`, 'success');
    }
  };

  return (
    <div className="p-6 bg-slate-950 border-2 border-slate-900 rounded-3xl text-slate-100 flex flex-col space-y-6 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div className="flex items-center space-x-3">
          <Globe className="w-5 h-5 text-red-500 animate-pulse" />
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider font-mono">Distributed Botnet & Ground Station DDoS Suite</h3>
            <p className="text-[10px] text-slate-500 font-mono">Simulate coordinated satellite IP and ground transceiver traffic amplification attacks to stress test receivers</p>
          </div>
        </div>
        <span className="text-[7.5px] font-mono uppercase bg-slate-900 text-red-400 border border-red-950 px-2 py-0.5 rounded">
          BOTNET_C2
        </span>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Side parameters */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col space-y-4">
            <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest block font-mono">C2 Attack Vectors</span>

            <div className="space-y-1.5">
              <label className="text-[7px] font-mono text-slate-500 uppercase">Victim IP/Target Address</label>
              <input
                type="text"
                value={targetIp}
                onChange={(e) => setTargetIp(e.target.value)}
                className="w-full bg-black border border-slate-900 rounded-xl px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[7px] font-mono text-slate-500 uppercase">Flooding Model Select</label>
              <div className="grid grid-cols-1 gap-2 font-mono text-[8.5px]">
                {['SATIP_AMP', 'TCP_SYN', 'UDP_FLOOD'].map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setMethod(m as any);
                      addLog(`Attack design vector updated to ${m}`);
                    }}
                    className={`text-left p-2 rounded-xl border transition uppercase ${
                      method === m
                        ? 'bg-red-950/40 border-red-500 text-red-400 font-bold shadow-[0_0_8px_rgba(239,68,68,0.2)]'
                        : 'bg-slate-950 border-slate-900/60 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {m.replace('_', ' ')} AMPLIFICATION
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleToggleAttack}
              className={`w-full py-2.5 rounded-xl border text-[9px] font-mono uppercase tracking-widest font-black transition ${
                isActive
                  ? 'bg-red-950 border-red-500 text-white animate-pulse'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-red-400'
              }`}
            >
              {isActive ? 'Mute Attack Coordinator' : 'Ignite DDoS Coordination'}
            </button>
          </div>

          <div className="bg-black border border-slate-900 rounded-xl p-3 h-28 overflow-y-auto scrollbar-none flex flex-col justify-between">
            <span className="text-[7px] font-mono text-slate-700 uppercase tracking-widest border-b border-slate-900 pb-1 block">C2 Telemetries Logs</span>
            <div className="flex-grow font-mono text-[7px] text-slate-400 space-y-0.5 pt-1 overflow-y-auto">
              {logs.map((log, idx) => (
                <div key={idx} className="truncate">
                  <span className="text-red-500 pr-1">▶</span> {log}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right side charts mapping and counters */}
        <div className="md:col-span-7 bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950 border border-slate-900 p-3 rounded-xl">
              <span className="text-[7.5px] font-mono text-slate-500 block">COORDINATED BOT NODES</span>
              <span className="text-lg font-black font-mono text-slate-200">{totalBots} Slaves</span>
            </div>

            <div className="bg-slate-950 border border-slate-900 p-3 rounded-xl flex flex-col justify-between">
              <span className="text-[7.5px] font-mono text-slate-500 block">VICTIM PING LATENCY</span>
              <span className={`text-lg font-bold font-mono ${targetLatency > 500 ? 'text-red-500 animate-bounce' : 'text-cyan-400'}`}>
                {targetLatency} ms
              </span>
            </div>
          </div>

          {/* Visual Grid ping flood */}
          <div className="bg-black border border-slate-900 h-36 rounded-xl flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#ef44440a_1px,transparent_1px)] [background-size:14px_14px]"></div>
            
            {isActive ? (
              <div className="flex items-center space-x-2 relative z-10">
                <div className="w-5 h-5 bg-red-500/20 border border-red-500 rounded-full flex items-center justify-center animate-ping"></div>
                <Radio className="w-6 h-6 text-red-500 animate-pulse" />
                <span className="text-[9px] font-mono text-red-400 font-extrabold bg-black/85 border border-red-950 px-2 py-0.5 rounded uppercase">
                  ACTIVE_FLOOD_TRAFFIC {Math.floor(Math.random() * 45 + 55)} Mbps
                </span>
              </div>
            ) : (
              <div className="text-[7.5px] font-mono text-slate-600 uppercase text-center flex flex-col space-y-1 select-none">
                <span>C2 Coordinator listening passively. Zero traffic broadcasted.</span>
              </div>
            )}

            <div className="absolute bottom-2 right-2 text-[6.5px] font-mono text-slate-600 uppercase">
              ATTACK MODEL: {method}
            </div>
          </div>

          <div className="border-t border-slate-900 pt-3 flex items-center justify-between text-[7.5px] font-mono text-slate-600 uppercase">
            <span>Security Countermeasures status</span>
            <span className="text-red-400 font-black">WARNING: PACKET INJECTION COMPLETED</span>
          </div>
        </div>

      </div>
    </div>
  );
};
