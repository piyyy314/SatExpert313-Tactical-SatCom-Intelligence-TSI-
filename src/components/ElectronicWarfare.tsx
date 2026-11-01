import React, { useState } from 'react';
import { Shield, Radio, KeyRound, RefreshCw, AlertTriangle, Play, Pause, FastForward } from 'lucide-react';
import { ModuleExportToolbar } from './ModuleExportToolbar.tsx';

interface ElectronicWarfareProps {
  isStealthMode: boolean;
  isJamming: boolean;
  jammingPower: number;
  onToggleJamming: (v: boolean) => void;
  onSetJammingPower: (v: number) => void;
}

export const ElectronicWarfare: React.FC<ElectronicWarfareProps> = ({
  isStealthMode,
  isJamming,
  jammingPower,
  onToggleJamming,
  onSetJammingPower,
}) => {
  const [carrierSweep, setCarrierSweep] = useState<number>(35.4);
  const [pulseWidth, setPulseWidth] = useState<number>(12);
  const [logs, setLogs] = useState<string[]>(['[ECCM] Localized electronic shielding ready.']);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString([], { hour12: false })}] ${msg.toUpperCase()}`, ...prev].slice(0, 10));
  };

  const triggerFrequencySweep = () => {
    addLog(`Initiating sweeping sequence across S-Band to Ka-Band RF channels...`);
    let speed = 0;
    const handle = setInterval(() => {
      setCarrierSweep(p => Number((p + (Math.random() - 0.5) * 4.0).toFixed(2)));
      speed++;
      if (speed >= 8) {
        clearInterval(handle);
        addLog(`Frequency sweeping finalized. Optimal masking vectors compiled.`);
      }
    }, 200);
  };

  return (
    <div className="p-6 bg-slate-950 border-2 border-slate-900 rounded-3xl text-slate-100 flex flex-col space-y-6 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div className="flex items-center space-x-3">
          <Shield className="w-5 h-5 text-red-400 animate-pulse" />
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider font-mono">Tactical Electronic Warfare & ECCM Hub</h3>
            <p className="text-[10px] text-slate-500 font-mono">Manage Active Jamming, broadband carrier sweeps, and localized radar shielding envelopes</p>
          </div>
        </div>
        <span className="text-[7.5px] font-mono uppercase bg-slate-900 text-red-400 border border-red-900/40 px-2 py-0.5 rounded">
          EW_OPS
        </span>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Active controls left */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col space-y-4">
            <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest block font-mono">Jamming Carrier Settings</span>

            <div className="space-y-1">
              <div className="flex justify-between text-[7px] font-mono text-slate-500 uppercase">
                <span>Broadband Jammer Power</span>
                <span className="text-red-400 font-bold">{jammingPower} dBW</span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                step={1}
                value={jammingPower}
                onChange={(e) => {
                  onSetJammingPower(parseInt(e.target.value));
                  if (Math.random() > 0.8) {
                    addLog(`Jammer amplification output modified to ${e.target.value} dBW.`);
                  }
                }}
                className="w-full accent-red-500 cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[7px] font-mono text-slate-500 uppercase">
                <span>Interfering Pulse Width (ns)</span>
                <span className="text-cyan-400 font-bold">{pulseWidth} ns</span>
              </div>
              <input
                type="range"
                min={2}
                max={50}
                step={1}
                value={pulseWidth}
                onChange={(e) => setPulseWidth(parseInt(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            {/* Jammer master toggle */}
            <button
              onClick={() => {
                const next = !isJamming;
                onToggleJamming(next);
                addLog(next ? `SPECTRAL JAMMER ENGAGED. BROADCASTING INTERFERENCE WAVEFORMS.` : `SPECTRAL JAMMER SILENCED. NORMAL RF RECEIVE FLOW RE-ESTABLISHED.`);
              }}
              className={`w-full py-2.5 rounded-xl border text-[9px] font-mono uppercase tracking-widest font-black transition ${
                isJamming
                  ? 'bg-red-950/40 border-red-500 text-red-500 animate-pulse font-extrabold'
                  : 'bg-emerald-950/40 border-emerald-500 text-emerald-405'
              }`}
            >
              {isJamming ? 'DISENGAGE ACTIVE JAMMING' : 'IGNITE BROADCAST JAMMING'}
            </button>
          </div>

          <div className="bg-black border border-slate-900 rounded-xl p-3 h-28 overflow-y-auto scrollbar-none flex flex-col justify-between">
            <span className="text-[7.5px] font-mono text-slate-655 uppercase tracking-widest border-b border-slate-900 pb-1 block">ECCM Combat Log</span>
            <div className="flex-grow font-mono text-[7px] text-slate-400 space-y-0.5 pt-1 overflow-y-auto">
              {logs.map((log, idx) => (
                <div key={idx} className="truncate">
                  <span className="text-red-505 pr-1">▶</span> {log}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Display right */}
        <div className="md:col-span-7 bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950 border border-slate-900 p-3 rounded-2xl">
              <span className="text-[7.5px] font-mono text-slate-500 block">CARRIER FREQUENCY SWEEP</span>
              <span className="text-sm font-black font-mono text-cyan-400">{carrierSweep} GHz</span>
            </div>
            
            <div className="bg-slate-950 border border-slate-900 p-3 rounded-2xl">
              <span className="text-[7.5px] font-mono text-slate-500 block">STEALTH INTERCEPT BLOCK</span>
              <span className={`text-sm font-black font-mono ${isStealthMode ? 'text-purple-400' : 'text-slate-500'}`}>
                {isStealthMode ? 'SHIELDED' : 'UNSHIELDED'}
              </span>
            </div>
          </div>

          {/* Active Jammer Wave Animation container */}
          <div className="bg-black/90 border border-slate-900 hover:border-slate-850 p-4 rounded-xl flex flex-col justify-center items-center h-32 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff04_1px,transparent_1px)] [background-size:12px_12px] opacity-40"></div>
            
            {/* Thematic signal waves */}
            {isJamming ? (
              <div className="flex items-center space-x-1.5 h-16 relative z-10">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-red-500 rounded animate-bounce shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                    style={{
                      height: `${Math.floor(Math.random() * 40 + 20)}%`,
                      animationDelay: `${i * 30}ms`,
                      animationDuration: '600ms'
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 h-16 relative z-10 opacity-30">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-2 bg-slate-700 rounded"
                  />
                ))}
              </div>
            )}

            <div className="absolute bottom-2 right-2 text-[6.5px] font-mono text-slate-600 uppercase tracking-wider">
              {isJamming ? 'TRANSMITTING HIGH INTERFERENCE' : 'PASSIVE MONITORING STANDBY'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-[7.5px] font-mono">
            <button
              onClick={triggerFrequencySweep}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-850 py-2 rounded-xl text-slate-400 hover:text-white transition font-black"
            >
              Run Frequency Sweep
            </button>
            <div className="bg-slate-950 py-2.5 rounded-xl border border-slate-900 text-slate-550 flex items-center justify-center space-x-1.5 font-bold">
              <AlertTriangle className={`w-3.5 h-3.5 ${isJamming ? 'text-red-500 animate-bounce' : 'text-slate-600'}`} />
              <span>{isJamming ? 'EW_ALERT_TRANSMITTING' : 'NOMINAL_COHERENCE'}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Module Export Toolbar */}
      <ModuleExportToolbar
        moduleTitle="ELECTRONIC WARFARE & ECCM SPECTRUM CMD"
        moduleSubtitle="RF Jamming, Carrier Sweep & Countermeasure Matrix"
        classification="SECRET // REL TO NATO"
        metadata={{
          'RF Intrusion Jamming': isJamming ? `ENGAGED (${jammingPower} mW/MHz)` : 'OFFLINE',
          'Carrier Sweep Center': `${carrierSweep} GHz`,
          'Pulse Width Interval': `${pulseWidth} µs`,
          'Stealth Emission Grid': isStealthMode ? 'ACTIVE' : 'NORMAL'
        }}
        summaryText="Electronic Warfare & ECCM spectrum telemetry. Noise injection power density and carrier sweep metrics recorded."
        filenamePrefix="Electronic_Warfare_ECCM"
      />
    </div>
  );
};
