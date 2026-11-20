import React, { useState, useEffect } from 'react';
import { Target, RefreshCw, Layers, ShieldCheck, Play, Pause, AlertTriangle, ShieldCheck as CanaryCheck } from 'lucide-react';

interface SpectrumSpike {
  frequency: string; // GHz
  peakValue: number; // dBm
  class: 'NOMINAL' | 'INTERFERENCE' | 'SPOOFING';
}

export const SpectralCanary: React.FC = () => {
  const [channels, setChannels] = useState<SpectrumSpike[]>([
    { frequency: '1.24', peakValue: -85, class: 'NOMINAL' },
    { frequency: '1.57', peakValue: -42, class: 'INTERFERENCE' },
    { frequency: '2.45', peakValue: -92, class: 'NOMINAL' },
  ]);
  const [canaryStatus, setCanaryStatus] = useState<'GREEN' | 'YELLOW' | 'ALERT'>('GREEN');
  const [logs, setLogs] = useState<string[]>(['[CANARY] Coherent spectrum baseline set. Guarding...']);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString([], { hour12: false })}] ${msg.toUpperCase()}`, ...prev].slice(0, 10));
  };

  const handleSweepSpectrum = () => {
    addLog(`Broadcasting spectral sweep probe...`);
    setCanaryStatus('YELLOW');

    setTimeout(() => {
      setChannels([
        { frequency: '1.24', peakValue: -85, class: 'NOMINAL' },
        { frequency: '1.57', peakValue: -32, class: 'SPOOFING' },
        { frequency: '2.45', peakValue: -91, class: 'NOMINAL' },
      ]);
      setCanaryStatus('ALERT');
      addLog(`[ALERT] High amplitude RF carrier sequence identified on 1.57 GHz.`);
    }, 1200);
  };

  return (
    <div className="p-6 bg-slate-950 border-2 border-slate-900 rounded-3xl text-slate-100 flex flex-col space-y-6 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider font-mono">Spectral Canary Signal intrusion Warning</h3>
            <p className="text-[10px] text-slate-500 font-mono">Observe ambient RF carriers across satellite telemetry channels; triggers immediate warning on signal anomalies or malicious injections</p>
          </div>
        </div>
        <span className="text-[7.5px] font-mono uppercase bg-slate-900 text-red-400 border border-red-950 px-2 py-0.5 rounded">
          SPEC_CANARY
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Settings options left */}
        <div className="md:col-span-5 space-y-4 font-mono">
          <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col space-y-4">
            <span className="text-[8px] font-black uppercase text-slate-500 block tracking-widest">Canary Status Indicators</span>

            <div className="bg-black border border-slate-900 p-3 rounded-2xl flex items-center justify-center space-x-2">
              <span className={`w-3.5 h-3.5 rounded-full animate-ping ${
                canaryStatus === 'GREEN' ? 'bg-emerald-500' : canaryStatus === 'YELLOW' ? 'bg-amber-500 animate-pulse' : 'bg-red-500 animate-bounce'
              }`} />
              <strong className="text-xs font-mono uppercase">
                STATUS_{canaryStatus}
              </strong>
            </div>

            <button
              onClick={handleSweepSpectrum}
              className="w-full bg-cyan-950/50 hover:bg-cyan-900 border border-cyan-800 text-cyan-400 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition"
            >
              Force Ambient Sweep Probe
            </button>
          </div>

          <div className="bg-black border border-slate-900 rounded-xl p-3 h-28 flex flex-col justify-between">
            <span className="text-[7.5px] font-mono text-slate-700 uppercase tracking-widest border-b border-slate-900 pb-1 block">Canary Audit Logs</span>
            <div className="flex-grow font-mono text-[7px] text-slate-400 space-y-0.5 pt-1 overflow-y-auto">
              {logs.map((log, idx) => (
                <div key={idx} className="truncate">
                  <span className="text-red-500 pr-1">▶</span> {log}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Display right */}
        <div className="md:col-span-7 bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-3 flex-grow font-mono">
            <span className="text-[8px] font-black uppercase text-slate-400 block">Monitored Frequencies Peak Array</span>

            <div className="space-y-2">
              {channels.map((chan) => (
                <div key={chan.frequency} className="bg-black/60 border border-slate-900 p-2.5 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-[9.5px] font-bold text-slate-200">Frequency {chan.frequency} GHz</div>
                    <div className="text-[7.5px] text-slate-500">PEAK AMPLITUDE: {chan.peakValue} dBm</div>
                  </div>

                  <span className={`text-[7px] px-2 py-0.5 rounded border font-semibold ${
                    chan.class === 'NOMINAL'
                      ? 'border-emerald-950 text-emerald-400 bg-emerald-950/10'
                      : chan.class === 'INTERFERENCE'
                      ? 'border-amber-900 text-amber-500 animate-pulse'
                      : 'border-red-900 text-red-500 bg-red-950/15 animate-pulse'
                  }`}>
                    {chan.class}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-900 pt-3 flex items-center justify-between text-[7px] font-mono text-slate-600 uppercase">
            <span>Spectrum shield sweeps verified</span>
            <span className="text-emerald-400 font-black flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> SWEEP NOMINAL OK
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
