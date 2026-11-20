import React, { useState } from 'react';
import { Target, RefreshCw, Layers, ShieldCheck, Radio, Play, Pause, AlertTriangle } from 'lucide-react';

interface RadioChannel {
  id: string;
  name: string;
  frequency: string; // MHz
  demodulation: 'BPSK' | 'QPSK' | 'FM';
  signalClarity: number; // %
}

const CONST_CHANNELS: RadioChannel[] = [
  { id: '1', name: 'S-Band Telemetry Carrier', frequency: '2240.50', demodulation: 'BPSK', signalClarity: 45 },
  { id: '2', name: 'GEO Military Voice Relay', frequency: '315.22', demodulation: 'FM', signalClarity: 12 },
];

interface RadioProps {
  addMissionLog: (detail: string, status?: 'active' | 'success' | 'warning') => void;
}

export const RadioInterceptSuite: React.FC<RadioProps> = ({ addMissionLog }) => {
  const [activeCh, setActiveCh] = useState<RadioChannel>(CONST_CHANNELS[0]);
  const [isIntercepting, setIsIntercepting] = useState<boolean>(false);
  const [clarity, setClarity] = useState<number>(activeCh.signalClarity);
  const [logs, setLogs] = useState<string[]>(['[INTERCEPT] SigInt listening array initialized. Ready.']);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString([], { hour12: false })}] ${msg.toUpperCase()}`, ...prev].slice(0, 10));
  };

  const handleToggleListening = () => {
    if (isIntercepting) {
      setIsIntercepting(false);
      addLog(`SigInt interception array paused.`);
    } else {
      setIsIntercepting(true);
      addLog(`Tuning antenna parameters to ${activeCh.frequency} MHz. Demodulating with ${activeCh.demodulation}...`);
      addMissionLog(`RF_INTERCEPT_ACTIVE: tuned to frequency ${activeCh.frequency} MHz`, 'active');
    }
  };

  const cleanSignalNoise = () => {
    addLog(`Applying digital signal processing (DSP) filters to clean raw spectrum data...`);
    setTimeout(() => {
      setClarity(Math.min(100, clarity + 35));
      addLog(`Raw noise floor filtered. Interference ratio reduced by 14dB.`);
      addMissionLog(`RF_INTERCEPT_OPTIMIZED: carrier alignment adjusted successfully`, 'success');
    }, 800);
  };

  return (
    <div className="p-6 bg-slate-950 border-2 border-slate-900 rounded-3xl text-slate-100 flex flex-col space-y-6 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div className="flex items-center space-x-3">
          <Radio className="w-5 h-5 text-purple-400 animate-pulse" />
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider font-mono">Military Signal Interception Console</h3>
            <p className="text-[10px] text-slate-500 font-mono">Tuning, demodulating, and passively listening in on analog/digital tactical radio transmission waves</p>
          </div>
        </div>
        <span className="text-[7.5px] font-mono uppercase bg-slate-900 text-purple-400 border border-purple-900/40 px-2 py-0.5 rounded">
          SIG_INT_RF
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Signal parameters select left */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col space-y-3">
            <span className="text-[8px] font-black uppercase text-slate-500 block tracking-widest font-mono">Radio targets directory</span>

            <div className="grid grid-cols-1 gap-2 font-mono">
              {CONST_CHANNELS.map(ch => (
                <button
                  key={ch.id}
                  onClick={() => {
                    setActiveCh(ch);
                    setClarity(ch.signalClarity);
                    setIsIntercepting(false);
                    addLog(`Antenna system configured for target frequency: ${ch.frequency} MHz`);
                  }}
                  className={`text-left p-2.5 rounded-xl border flex flex-col space-y-1 transition ${
                    activeCh.id === ch.id
                      ? 'bg-purple-950/40 border-purple-500 text-purple-400 font-bold'
                      : 'bg-slate-950 border-slate-900/60 text-slate-500 hover:text-slate-400'
                  }`}
                >
                  <label className="text-[9.5px] uppercase tracking-wide">{ch.name}</label>
                  <div className="text-[7.5px] text-slate-500 flex justify-between">
                    <span>FREQ: {ch.frequency} MHz</span>
                    <span>DEMOD: {ch.demodulation}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleToggleListening}
                className={`flex-grow py-2 rounded-xl border text-[9px] font-mono font-black uppercase tracking-wider transition ${
                  isIntercepting
                    ? 'bg-purple-950 border-purple-500 text-slate-200 animate-pulse'
                    : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-purple-400'
                }`}
              >
                {isIntercepting ? 'Stop Intercept' : 'Tune & Sniff'}
              </button>

              <button
                onClick={cleanSignalNoise}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 font-mono text-[9px] uppercase tracking-wider font-extrabold px-3 py-2 rounded-xl transition"
              >
                Clean Static
              </button>
            </div>
          </div>

          <div className="bg-black border border-slate-900 rounded-xl p-3 h-28 flex flex-col justify-between">
            <span className="text-[7.5px] font-mono text-slate-700 uppercase tracking-widest border-b border-slate-900 pb-1 block">Listening Activity Logs</span>
            <div className="flex-grow font-mono text-[7px] text-slate-400 space-y-0.5 pt-1 overflow-y-auto">
              {logs.map((log, idx) => (
                <div key={idx} className="truncate">
                  <span className="text-purple-500 pr-1">▶</span> {log}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Diagnostic display right */}
        <div className="md:col-span-7 bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col justify-between space-y-4 font-mono">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950 border border-slate-900 p-3 rounded-2xl">
              <span className="text-[7.5px] font-mono text-slate-500 block">CARRIER DEMODULATOR LOCK</span>
              <span className={`text-xs font-mono font-black ${isIntercepting ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`}>
                {isIntercepting ? `LOCKED_${activeCh.demodulation}` : 'STANDBY_AWAIT_FREQUENCY_TUNING'}
              </span>
            </div>

            <div className="bg-slate-950 border border-slate-900 p-3 rounded-2xl">
              <span className="text-[7.5px] font-mono text-slate-500 block">SIGNAL RECON CLARITY</span>
              <span className="text-xs font-mono font-black text-cyan-400">{clarity}%</span>
            </div>
          </div>

          {/* Steg decoded data preview */}
          <div className="bg-black border border-slate-900 p-3 h-32 rounded-xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff04_1px,transparent_1px)] [background-size:10px_10px] opacity-35"></div>
            <span className="text-[7px] font-mono text-slate-500 block">Decoded Telemetry Frame Payload</span>
            <div className="flex-grow font-mono text-[9px] py-2 text-cyan-400 break-all select-all select-none leading-relaxed tracking-wider">
              {isIntercepting 
                ? (clarity > 60 ? 'DECODED_VOICE: "TACTICAL TEAM ENGAGING PATTERNS APEX LOCK"' : 'RAW_HEX: 7F 4E AA DE DD 12 CF ["Static Interference - low snr clarity"]') 
                : 'Awaiting intercept tuner lock...'}
            </div>
          </div>

          <div className="border-t border-slate-900 pt-3 flex items-center justify-between text-[7px] font-mono text-slate-600 uppercase">
            <span>Interception systems aligned with NSA space security policy limits</span>
            <span className="text-emerald-400 font-black flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> SEAL OK
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
