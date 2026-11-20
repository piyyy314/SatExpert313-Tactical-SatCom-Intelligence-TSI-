import React, { useState } from 'react';
import { Target, RefreshCw, Layers, ShieldCheck, Flame, Radio, Shuffle, AlertTriangle } from 'lucide-react';

interface JammerProps {
  addMissionLog: (detail: string, status?: 'active' | 'success' | 'warning') => void;
}

export const SignalJammer: React.FC<JammerProps> = ({ addMissionLog }) => {
  const [jammerWave, setJammerWave] = useState<'WHITE_NOISE' | 'GAUSSIAN' | 'SWEEP'>('WHITE_NOISE');
  const [jammerOutputPower, setJammerOutputPower] = useState<number>(45);
  const [isEmitting, setIsEmitting] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>(['[JAMMER] Amplifier bias registers calibrated in standby.']);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString([], { hour12: false })}] ${msg.toUpperCase()}`, ...prev].slice(0, 10));
  };

  const handleToggleEmission = () => {
    const nextVal = !isEmitting;
    setIsEmitting(nextVal);
    addLog(`Broadband noise emission signal turned ${nextVal ? 'ON' : 'OFF'}`);
    addMissionLog(`SIG_JAMMER_EMISSION: status shifted to ${nextVal ? 'ON' : 'OFF'} with power ${jammerOutputPower}dB`, 'warning');
  };

  return (
    <div className="p-6 bg-slate-950 border-2 border-slate-900 rounded-3xl text-slate-100 flex flex-col space-y-6 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div className="flex items-center space-x-3">
          <Flame className="w-5 h-5 text-red-500 animate-pulse" />
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider font-mono">RF Noise Emission & Signal Jammer Commander</h3>
            <p className="text-[10px] text-slate-500 font-mono">Tweak and broadcast high-power interference signals across localized frequencies to mask transponder signals or disrupt hostile tracking gear</p>
          </div>
        </div>
        <span className="text-[7.5px] font-mono uppercase bg-slate-900 text-red-400 border border-red-950 px-2 py-0.5 rounded">
          JAM_RF
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Settings options left */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col space-y-4 font-mono">
            <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest block">Emission configuration</span>

            <div className="space-y-1">
              <label className="text-[7px] text-slate-500 uppercase block">Jammer Output Wave Shape</label>
              <div className="grid grid-cols-3 gap-1.5 text-[8px] font-black uppercase">
                {(['WHITE_NOISE', 'GAUSSIAN', 'SWEEP'] as const).map(w => (
                  <button
                    key={w}
                    onClick={() => {
                      setJammerWave(w);
                      addLog(`Tuned RF wave modulator shape to ${w}`);
                    }}
                    className={`py-1.5 rounded-lg border transition ${
                      jammerWave === w
                        ? 'bg-red-950/40 border-red-500 text-red-400 font-bold'
                        : 'bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {w.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[7px] text-slate-500 uppercase">
                <span>Amplifier gain power level</span>
                <span>{jammerOutputPower} dB</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={jammerOutputPower}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setJammerOutputPower(val);
                }}
                className="w-full accent-red-500 bg-slate-900 cursor-ew-resize h-1.5 rounded-full"
              />
            </div>

            <button
              onClick={handleToggleEmission}
              className={`w-full py-2.5 rounded-xl border text-[9px] font-black uppercase tracking-wider transition ${
                isEmitting
                  ? 'bg-red-950 border-red-500 text-slate-200 animate-pulse'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-red-400'
              }`}
            >
              {isEmitting ? 'Halt EM Emission Interference' : 'Ignit EM Interference'}
            </button>
          </div>

          <div className="bg-black border border-slate-900 rounded-xl p-3 h-28 flex flex-col justify-between">
            <span className="text-[7.5px] font-mono text-slate-700 uppercase tracking-widest border-b border-slate-900 pb-1 block">Tuner Assembly Logs</span>
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
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950 border border-slate-900 p-3 rounded-2xl flex flex-col justify-between font-mono">
              <span className="text-[7.5px] font-mono text-slate-500 block">TRANSMITTER CARRIER STATUS</span>
              <strong className={`text-xs ${isEmitting ? 'text-red-400 animate-pulse' : 'text-slate-500'}`}>
                {isEmitting ? 'EMITTING_NOISE_WAVE' : 'CARRIER_MUTED'}
              </strong>
            </div>

            <div className="bg-slate-950 border border-slate-900 p-3 rounded-2xl flex flex-col justify-between font-mono">
              <span className="text-[7.5px] font-mono text-slate-500 block">WAVE SYNTH TYPE</span>
              <strong className="text-xs text-slate-200">{jammerWave} MOD</strong>
            </div>
          </div>

          {/* Graphical radar mesh representation */}
          <div className="bg-black border border-slate-900 h-28 rounded-xl relative overflow-hidden flex items-center justify-center p-3 text-center">
            {isEmitting ? (
              <div className="absolute inset-0 bg-red-950/10 pointer-events-none animate-pulse"></div>
            ) : null}
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:12px_12px] opacity-45"></div>

            <div className="relative z-10 font-mono space-y-1">
              <div className="text-[9.5px] font-black text-red-400 tracking-widest uppercase">
                EMISS_AMP_LEVEL: {isEmitting ? 'EMISSION_ACTIVE' : 'MUTED'}
              </div>
              <p className="text-[7px] text-slate-500 leading-relaxed uppercase tracking-wider max-w-sm">
                Amplifier high bias active. Ensure emission output complies with localized regulatory boundaries unless tactical defense override codes are applied.
              </p>
            </div>
          </div>

          <div className="border-t border-slate-900 pt-3 flex items-center gap-2 text-[7px] font-mono text-slate-700 uppercase">
            <AlertTriangle className={`w-3.5 h-3.5 ${isEmitting ? 'text-red-500 animate-bounce' : 'text-slate-600'}`} />
            <span>Caution: Sustained RF jamming blocks all close-range downlink tracking telemetry feeds.</span>
          </div>
        </div>

      </div>
    </div>
  );
};
