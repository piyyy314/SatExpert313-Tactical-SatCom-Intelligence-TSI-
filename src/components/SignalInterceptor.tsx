import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Shield, Play, Pause, Radio, RefreshCw, KeyRound, Wifi } from 'lucide-react';

interface DecodedStream {
  id: string;
  source: string;
  frequency: string;
  strength: string;
  decrypted: string;
}

const DECODED_PRESETS: DecodedStream[] = [
  { id: '1', source: 'INMARSAT-5 F1', frequency: '1525.5 MHz', strength: '-45.5 dBm', decrypted: 'CMD_SYS_RECONFIG_SUCCESS: LAT_LOCK_VAL = 51.522' },
  { id: '2', source: 'EUTELSAT-36B', frequency: '11422.3 MHz', strength: '-62.1 dBm', decrypted: 'BEACON_BURST: REG_0xF32B09A0_STATUS = 100%' },
  { id: '3', source: 'MIL-SATCOM-4', frequency: '7250.0 MHz', strength: '-38.2 dBm', decrypted: 'VOICE_FEED_ESTABLISHED: ENCRYPTED_COMPATIBILITY_LOCKED' },
];

interface SignalInterceptorProps {
  isJamming?: boolean;
  jammingPower?: number;
  isStealthMode?: boolean;
}

export const SignalInterceptor: React.FC<SignalInterceptorProps> = ({
  isJamming,
  jammingPower,
  isStealthMode
}) => {
  const [isActive, setIsActive] = useState<boolean>(true);
  const [selectedPreset, setSelectedPreset] = useState<DecodedStream>(DECODED_PRESETS[0]);
  const [bits, setBits] = useState<string[]>([]);
  const [frequency, setFrequency] = useState<number>(1525.5);
  const [logs, setLogs] = useState<string[]>(['[SYSTEM_INIT] Signal scanner diagnostic check completed.']);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Auto-generate binary streaming data on active state
  useEffect(() => {
    if (!isActive) return;

    const handle = setInterval(() => {
      const row = Array.from({ length: 4 }, () => Math.random() > 0.5 ? '1' : '0').join(' ') + 
                  '  ' + 
                  Array.from({ length: 4 }, () => Math.random() > 0.5 ? '1' : '0').join(' ');
      setBits(prev => [row, ...prev].slice(0, 30));
    }, 250);

    return () => clearInterval(handle);
  }, [isActive]);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString([], { hour12: false })}] ${msg.toUpperCase()}`, ...prev].slice(0, 30));
  };

  const handleInterceptLock = () => {
    addLog(`LOCKING ONTO SPECIFIED CARRIER WAVE AT FREQUENCY: ${frequency.toFixed(2)} MHz...`);
    setIsActive(true);
    setTimeout(() => {
      // Find or generate dynamic mapping
      const matched = DECODED_PRESETS.find(p => parseFloat(p.frequency) === frequency) || {
        id: Math.random().toString(),
        source: 'UNKNOWN INT_NODE',
        frequency: `${frequency.toFixed(2)} MHz`,
        strength: `-${Math.floor(Math.random() * 30 + 40)} dBm`,
        decrypted: 'COHERENT_BEACON_LINKED... DECRYPTING SYSTEM_FRAME_METADATA_HEADER'
      };
      setSelectedPreset(matched);
      addLog(`CARRIER SYNC ESTABLISHED ON NODE '${matched.source}'`);
      addLog(`DECRYPTED PAYLOAD: ${matched.decrypted}`);
    }, 1000);
  };

  return (
    <div className="p-6 bg-slate-950 border-2 border-slate-900 rounded-3xl text-slate-100 flex flex-col space-y-6 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div className="flex items-center space-x-3">
          <Radio className="w-5 h-5 text-purple-400 animate-pulse" />
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider font-mono">HF/L-Band Signal Interceptor</h3>
            <p className="text-[10px] text-slate-500 font-mono">Passive RF carrier sniffer, demodulator and post-quantum frame decoder</p>
          </div>
        </div>
        <span className="text-[7.5px] font-mono uppercase bg-slate-900 text-purple-400 border border-purple-900/40 px-2 py-0.5 rounded">
          SIGINT_RAW
        </span>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Tuning controls */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col space-y-3">
            <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest block font-mono">Receiver Tuning Matrix</span>
            
            <div className="space-y-1.5">
              <label className="text-[7px] font-mono text-slate-500 uppercase">Carrier Frequency (MHz)</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={frequency}
                  step={0.1}
                  onChange={(e) => setFrequency(parseFloat(e.target.value) || 1525.5)}
                  className="flex-grow bg-black text-xs font-mono px-3 py-1.5 rounded-xl border border-slate-900 focus:outline-none focus:border-cyan-500 text-slate-200"
                />
                <button
                  onClick={handleInterceptLock}
                  className="bg-cyan-950/50 hover:bg-cyan-950 border border-cyan-800 text-cyan-400 font-bold px-3 py-1.5 rounded-xl text-[9px] font-mono uppercase tracking-wider whitespace-nowrap"
                >
                  Sync Carrier
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[7px] font-mono text-slate-500 uppercase">Interactive Satellite Targets</label>
              <div className="grid grid-cols-1 gap-2">
                {DECODED_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setFrequency(parseFloat(p.frequency));
                      setSelectedPreset(p);
                      addLog(`Preset selected: Carrier frequency set to ${p.frequency}`);
                    }}
                    className={`text-left p-2 rounded-xl border font-mono text-[9px] uppercase tracking-wider transition ${
                      parseFloat(p.frequency) === frequency
                        ? 'bg-purple-950/40 border-purple-500 text-purple-400 font-bold'
                        : 'bg-slate-950 border-slate-900/60 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <div className="font-bold">{p.source}</div>
                    <div className="text-[7px] text-slate-500 flex justify-between">
                      <span>{p.frequency}</span>
                      <span>{p.strength}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setIsActive(!isActive)}
              className={`flex-grow py-2 px-3 border rounded-xl font-mono text-[9px] uppercase tracking-wider font-bold transition flex items-center justify-center space-x-1 ${
                isActive
                  ? 'bg-orange-950/40 border-orange-500 text-orange-400'
                  : 'bg-emerald-950/40 border-emerald-500 text-emerald-400'
              }`}
            >
              {isActive ? <Pause className="w-3.5 h-3.5 mr-1" /> : <Play className="w-3.5 h-3.5 mr-1" />}
              <span>{isActive ? 'Pause Stream' : 'Resume Stream'}</span>
            </button>
          </div>
        </div>

        {/* Decoder output terminal and binary waterfall */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-12 gap-4">
          
          {/* Binary waterfall columns */}
          <div className="sm:col-span-4 bg-black border border-slate-900 rounded-2xl p-3 flex flex-col justify-between h-72">
            <span className="text-[7px] font-mono text-slate-600 uppercase tracking-widest border-b border-slate-900 pb-1 flex justify-between">
              <span>Bitstream Waterfall</span>
              <span className="animate-pulse text-emerald-500 font-black">● LIVE</span>
            </span>
            <div className="flex-grow overflow-hidden font-mono text-[9px] text-emerald-500/70 py-2 space-y-1 select-all h-full filter tracking-widest text-center">
              {bits.length === 0 ? (
                <div className="text-slate-800 flex items-center justify-center h-full uppercase text-[7px]">Sensing spectral noise...</div>
              ) : (
                bits.map((b, idx) => (
                  <div key={idx} className="transition-all duration-300 opacity-90">{b}</div>
                ))
              )}
            </div>
          </div>

          {/* Decryption status panel */}
          <div className="sm:col-span-8 flex flex-col justify-between space-y-4 h-72">
            <div className="bg-slate-950/60 border border-slate-900 p-4 rounded-2xl flex-grow flex flex-col justify-between h-40">
              <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
                <span className="text-[7.5px] font-black uppercase text-slate-500 tracking-wider flex items-center space-x-1">
                  <Shield className="w-3.5 h-3.5 text-slate-600" />
                  <span>Carrier Wave Modulation Parameters</span>
                </span>
                <span className="text-[7.5px] font-mono text-cyan-400 font-bold bg-slate-900 px-1.5 py-0.5 rounded">
                  {selectedPreset.strength}
                </span>
              </div>

              <div className="space-y-2 py-2">
                <div className="text-[8px] font-mono text-slate-500 uppercase">Active Logged Lockout ID</div>
                <div className="font-mono text-xs bg-black/60 p-2.5 rounded-xl border border-slate-900 text-cyan-400 leading-relaxed font-bold break-words select-all uppercase">
                  {selectedPreset.decrypted}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-[7px] font-mono">
                <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-900">
                  <span className="text-slate-500 block">MODULATION</span>
                  <span className="text-slate-300 font-black">QPSK - 128S</span>
                </div>
                <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-900">
                  <span className="text-slate-500 block">FRAME PROTECTION</span>
                  <span className="text-emerald-400 font-black">BCH CODE LOCK</span>
                </div>
              </div>
            </div>

            {/* General Log terminal bottom */}
            <div className="bg-black border border-slate-900 rounded-2xl p-3 h-24 overflow-y-auto scrollbar-none flex flex-col justify-between">
              <span className="text-[7px] font-mono text-slate-600 uppercase tracking-widest border-b border-slate-900 pb-1 block">Demodulator System Logs</span>
              <div ref={terminalRef} className="flex-grow font-mono text-[7.5px] text-slate-400 space-y-0.5 pt-1 overflow-y-auto">
                {logs.map((log, idx) => (
                  <div key={idx} className="truncate">
                    <span className="text-purple-500 pr-1">▶</span> {log}
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
