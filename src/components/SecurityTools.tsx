import React, { useState } from 'react';
import { Target, RefreshCw, Layers, ShieldCheck, KeyRound, Clock, Flame, ShieldAlert } from 'lucide-react';

interface SecurityProps {
  userLoc: { lat: number; lng: number };
  selectedSatName: string;
  isJamming: boolean;
  setIsJamming: (v: boolean) => void;
  jammingPower: number;
  setJammingPower: (v: number) => void;
  signalQuality: number;
  onBack: () => void;
  isStealthMode: boolean;
  setIsStealthMode: (v: boolean) => void;
  addMissionLog: (detail: string, status?: 'active' | 'success' | 'warning') => void;
}

export const SecurityTools: React.FC<SecurityProps> = ({
  userLoc,
  selectedSatName,
  isJamming,
  setIsJamming,
  jammingPower,
  setJammingPower,
  signalQuality,
  onBack,
  isStealthMode,
  setIsStealthMode,
  addMissionLog,
}) => {
  const [operatorShieldKey, setOperatorShieldKey] = useState<string>('CRY_T_82A..3B1');
  const [logs, setLogs] = useState<string[]>(['[SEC_TOOLS] Administrative tactical defense shields ready.']);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString([], { hour12: false })}] ${msg.toUpperCase()}`, ...prev].slice(0, 10));
  };

  const handleToggleStealthMode = () => {
    const nextVal = !isStealthMode;
    setIsStealthMode(nextVal);
    addLog(`Stealth spectrum concealment shifted to ${nextVal ? 'ENABLED' : 'DISABLED'}`);
    addMissionLog(`STEALTH_CONCEALMENT_MODE: toggled to ${nextVal}`, 'warning');
  };

  const resetCryptoShields = () => {
    addLog(`Broadcasting tactical post-quantum encryption key rotations...`);
    setTimeout(() => {
      const chars = 'ABCDEF0123456789';
      let r = '';
      for (let i = 0; i < 4; i++) {
        r += chars[Math.floor(Math.random() * 16)];
      }
      setOperatorShieldKey(`CRY_T_${r}_3B1`);
      addLog(`Cryptographic signature rotating finalized. Active key applied.`);
      addMissionLog(`CRYPTO_ROTATE_SUCCESS: active transponder handshake key rotated`, 'success');
    }, 1000);
  };

  return (
    <div className="p-6 bg-slate-950 border-2 border-slate-900 rounded-3xl text-slate-100 flex flex-col space-y-6 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div className="flex items-center space-x-3">
          <ShieldAlert className="w-5 h-5 text-purple-400 animate-pulse" />
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider font-mono">Satellite Cyber Defense Operations</h3>
            <p className="text-[10px] text-slate-500 font-mono">Manage regional stealth spectrum masking, toggle localized telemetry jam shields, and rotate secure keys</p>
          </div>
        </div>
        <span className="text-[7.5px] font-mono uppercase bg-slate-900 text-purple-400 border border-purple-950 px-2 py-0.5 rounded animate-pulse">
          SEC_HUB
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Operations menu left */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col space-y-4 font-mono">
            <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest block">Defense operations</span>

            <button
              onClick={handleToggleStealthMode}
              className={`w-full py-2.5 rounded-xl border text-[9px] font-black uppercase tracking-wider transition ${
                isStealthMode
                  ? 'bg-purple-950/40 border-purple-500 text-purple-400 animate-pulse'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-purple-400'
              }`}
            >
              Concealment Mode: {isStealthMode ? 'ACTIVE' : 'OFFLINE'}
            </button>

            <button
              onClick={resetCryptoShields}
              className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-purple-400 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition"
            >
              Rotate Handshake Key
            </button>

            <button
              onClick={onBack}
              className="w-full bg-slate-950 border border-slate-900 text-slate-500 font-medium py-2 rounded-xl text-[8.5px] uppercase tracking-wider hover:text-slate-300 transition"
            >
              Return to Master HUD
            </button>
          </div>

          <div className="bg-black border border-slate-900 rounded-xl p-3 h-28 flex flex-col justify-between">
            <span className="text-[7.5px] font-mono text-slate-700 uppercase tracking-widest border-b border-slate-900 pb-1 block">Cyber Ops Logs</span>
            <div className="flex-grow font-mono text-[7px] text-slate-400 space-y-0.5 pt-1 overflow-y-auto">
              {logs.map((log, idx) => (
                <div key={idx} className="truncate">
                  <span className="text-purple-500 pr-1">▶</span> {log}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic details displays right */}
        <div className="md:col-span-7 bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950 border border-slate-900 p-3 rounded-xl flex flex-col justify-between font-mono">
              <span className="text-[7.5px] font-mono text-slate-500 block">STEALTH MASK ALIGNED</span>
              <strong className={`text-xs ${isStealthMode ? 'text-purple-400 animate-pulse' : 'text-slate-500'}`}>
                {isStealthMode ? 'MUTE_CONCEAL_OK' : 'BROADCAST_ACTIVE'}
              </strong>
            </div>

            <div className="bg-slate-950 border border-slate-900 p-3 rounded-xl flex flex-col justify-between font-mono">
              <span className="text-[7.5px] font-mono text-slate-500 block">ENCRYPTION HANDSHAKE</span>
              <strong className="text-xs text-slate-200 select-all">{operatorShieldKey}</strong>
            </div>
          </div>

          {/* Core schematic text block */}
          <div className="bg-black border border-slate-900 p-4 rounded-xl text-center flex flex-col justify-center space-y-1">
            <div className="text-[9.5px] font-mono font-black text-cyan-400 tracking-widest uppercase">
              COHERENT CYBERSECURITY FRAMEWORK
            </div>
            <p className="text-[7px] font-mono text-slate-400 leading-relaxed uppercase tracking-wider max-w-sm mx-auto">
              Current baseband transceiver: {selectedSatName}. Stealth status tracks across passive telemetry bounds designed specifically to block hostile geolocation probes.
            </p>
          </div>

          <div className="border-t border-slate-900 pt-3 flex items-center justify-between text-[7px] font-mono text-slate-700 uppercase">
            <span>Security boundaries compliant with TSI-Space standard-42</span>
            <span className="text-emerald-400 font-black flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> SECURE HANDSHAKES DEPLOYED
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
