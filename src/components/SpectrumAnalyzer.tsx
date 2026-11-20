import React, { useState, useEffect } from 'react';
import { Target, RefreshCw, Layers, ShieldCheck, Play, Pause, AlertTriangle, Radio } from 'lucide-react';

interface FrequencyBin {
  bin: number;
  frequency: string; // MHz
  amplitude: number; // dBm
}

export const SpectrumAnalyzer: React.FC = () => {
  const [bins, setBins] = useState<FrequencyBin[]>([
    { bin: 1, frequency: '1420.4', amplitude: -82 },
    { bin: 2, frequency: '1420.6', amplitude: -45 },
    { bin: 3, frequency: '1420.8', amplitude: -91 },
    { bin: 4, frequency: '1421.0', amplitude: -88 },
  ]);
  const [isRunning, setIsRunning] = useState<boolean>(true);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setBins(prev => prev.map(pt => ({
        ...pt,
        amplitude: Math.max(-100, Math.min(-20, pt.amplitude + Math.floor(Math.random() * 14 - 7)))
      })));
    }, 400);
    return () => clearInterval(interval);
  }, [isRunning]);

  return (
    <div className="p-6 bg-slate-950 border-2 border-slate-900 rounded-3xl text-slate-100 flex flex-col space-y-6 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div className="flex items-center space-x-3">
          <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider font-mono">Digital RF Spectrum Analyzer Graph</h3>
            <p className="text-[10px] text-slate-500 font-mono">Real-time carrier waves visual analyzer showing thermal noise offsets and signal peak characteristics</p>
          </div>
        </div>
        <span className="text-[7.5px] font-mono uppercase bg-slate-900 text-cyan-400 border border-cyan-900/40 px-2 py-0.5 rounded">
          SPEC_ANL
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Settings options left */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col space-y-4 font-mono">
            <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest block">Tuner analyzer details</span>

            <div className="bg-black border border-slate-900 p-3 rounded-2xl flex items-center justify-between">
              <span className="text-[7.5px] text-slate-500 uppercase">Analyzer sweeping</span>
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`py-1 px-2.5 border rounded-lg text-[8px] font-black uppercase transition ${
                  isRunning ? 'bg-cyan-950 border-cyan-500 text-cyan-400 animate-pulse' : 'bg-slate-950 border-slate-900 text-slate-700'
                }`}
              >
                {isRunning ? 'RUNNING' : 'PAUSED'}
              </button>
            </div>

            <div className="bg-black/60 border border-slate-900 p-3 rounded-2xl text-[8px] text-slate-500 leading-relaxed uppercase tracking-wider">
              Note: Observe peak frequencies to align regional VSAT parabolic alignments or configure localized bandpass signals.
            </div>
          </div>
        </div>

        {/* Display visualizer right */}
        <div className="md:col-span-7 bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-3 font-mono">
            <span className="text-[8px] font-black uppercase text-slate-400 block">Frequency Bin Amplitude Plots</span>

            <div className="space-y-2.5">
              {bins.map((bin) => (
                <div key={bin.bin} className="flex flex-col space-y-1">
                  <div className="flex justify-between text-[8px] text-slate-300">
                    <span>Bin #{bin.bin} ({bin.frequency} MHz)</span>
                    <span className="font-bold">{bin.amplitude} dBm</span>
                  </div>
                  {/* Visual gauge */}
                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-950">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-600 to-purple-500 transition-all duration-300"
                      style={{ width: `${Math.max(5, 100 + bin.amplitude)}%` }} // offset range mapping
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-900 pt-2 flex items-center justify-between text-[7px] font-mono text-slate-600 uppercase">
            <span>Spectrum calibration accurate to ±0.2dBm range limit</span>
            <span className="text-emerald-400 font-black flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> CALIBRATED
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
