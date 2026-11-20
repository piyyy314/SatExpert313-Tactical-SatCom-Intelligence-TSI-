import React, { useState } from 'react';
import { ShieldAlert, Cpu, RefreshCw, KeyRound, Lock, Unlock, Hash, Terminal } from 'lucide-react';

interface CiphertextRecord {
  id: string;
  name: string;
  bitLength: number;
  cipher: string;
  decrypted: string;
}

const SECURE_CHANNELS: CiphertextRecord[] = [
  { id: '1', name: 'Military Uplink S-Band', bitLength: 2048, cipher: '0x99AFA0BC39904FFAE0911A0F9CCB40E2', decrypted: 'SECURE_SAT_COORDINATES: TACTICAL_GRID_NORTH_SUB_9' },
  { id: '2', name: 'Commercial Telemetry Link', bitLength: 1024, cipher: '0xE8B9A091A8EFEF0456108BFDEC2206C5', decrypted: 'STATION_CARRIER_LOCK_ID: 10931-RECON' },
  { id: '3', name: 'Encrypted Diplomatic Brief', bitLength: 4096, cipher: '0xA99FE3B1D5C4092E11AF1004FEAE392D', decrypted: 'OPERATION_AURORA_SITREP: ACTIVE_MEMBER_LIST_LOCKED' },
];

interface QuantumDecryptorProps {
  addMissionLog?: (detail: string, status?: any) => void;
}

export const QuantumDecryptor: React.FC<QuantumDecryptorProps> = ({ addMissionLog }) => {
  const [activeRecord, setActiveRecord] = useState<CiphertextRecord>(SECURE_CHANNELS[0]);
  const [cryptAlgorithm, setCryptAlgorithm] = useState<'SHOR' | 'ANNEALING' | 'GROVER_BRUTE'>('SHOR');
  const [isDecrypting, setIsDecrypting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [coherence, setCoherence] = useState<number>(93.5);
  const [logs, setLogs] = useState<string[]>(['[DECRYPTOR] System ready. Quantum circuit coherent.']);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString([], { hour12: false })}] ${msg.toUpperCase()}`, ...prev].slice(0, 10));
  };

  const startDecryptionVector = () => {
    if (isDecrypting) return;
    setIsDecrypting(true);
    setSuccess(false);
    addLog(`Configuring Shor's circuit register structure...`);

    setTimeout(() => {
      addLog(`Stabilizing system coherence. Level optimal at ${coherence.toFixed(2)}%`);
    }, 600);

    setTimeout(() => {
      addLog(`Factoring RSA-modulo divisor keys. Solving period metrics...`);
    }, 1200);

    setTimeout(() => {
      setIsDecrypting(false);
      setSuccess(true);
      addLog(`FACTORS CORRELATION IDENTIFIED. DECRYPTION KEY INJECTED FULLY.`);
    }, 2000);
  };

  return (
    <div className="p-6 bg-slate-950 border-2 border-slate-900 rounded-3xl text-slate-100 flex flex-col space-y-6 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div className="flex items-center space-x-3">
          <KeyRound className="w-5 h-5 text-purple-400 animate-pulse" />
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider font-mono">Shor's Post-Quantum Cryptanalysis Suite</h3>
            <p className="text-[10px] text-slate-500 font-mono">Utilize simulated register factoring nodes to decrypt hijacked adversary satellite telecommand streams</p>
          </div>
        </div>
        <span className="text-[7.5px] font-mono uppercase bg-slate-900 text-purple-400 border border-purple-900/40 px-2 py-0.5 rounded">
          Q_DECRYPT
        </span>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left column configuration */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col space-y-3.5">
            <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest block font-mono">Select Captured Target Block</span>
            
            <div className="space-y-1.5 font-mono">
              {SECURE_CHANNELS.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => {
                    setActiveRecord(ch);
                    setSuccess(false);
                    addLog(`Assigned decryptor target to channel: ${ch.name}`);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl border flex flex-col space-y-1 transition ${
                    activeRecord.id === ch.id
                      ? 'bg-purple-950/40 border-purple-500 text-purple-400 font-black'
                      : 'bg-slate-950 border-slate-900/65 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <div className="text-[9.5px] uppercase tracking-wider">{ch.name}</div>
                  <div className="text-[7.5px] text-slate-500 flex justify-between pr-2">
                    <span>Key length: {ch.bitLength} bits</span>
                    <span className="truncate max-w-[120px]">Cipher: {ch.cipher}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-900 flex justify-between gap-2">
              <button
                onClick={() => setCryptAlgorithm('SHOR')}
                className={`flex-grow py-1.5 rounded-lg border text-[8px] font-bold uppercase transition font-mono ${
                  cryptAlgorithm === 'SHOR' ? 'bg-cyan-950/40 border-cyan-500 text-cyan-400' : 'bg-slate-950 border-slate-900/60 text-slate-600 hover:text-slate-300'
                }`}
              >
                Shor's Factoring
              </button>
              <button
                onClick={() => setCryptAlgorithm('ANNEALING')}
                className={`flex-grow py-1.5 rounded-lg border text-[8px] font-bold uppercase transition font-mono ${
                  cryptAlgorithm === 'ANNEALING' ? 'bg-cyan-950/40 border-cyan-500 text-cyan-400' : 'bg-slate-950 border-slate-900/60 text-slate-600 hover:text-slate-300'
                }`}
              >
                Quantum Anneal
              </button>
            </div>
          </div>

          {/* Core Telemetry logs */}
          <div className="bg-black border border-slate-900 rounded-xl p-3 h-32 flex flex-col justify-between">
            <span className="text-[7px] font-mono text-slate-700 uppercase tracking-widest border-b border-slate-900 pb-1 flex justify-between">
              <span>Decoder Hardware logs</span>
              <Terminal className="w-3.5 h-3.5 text-slate-600" />
            </span>
            <div className="flex-grow font-mono text-[7px] text-slate-400 space-y-0.5 pt-1 overflow-y-auto">
              {logs.map((log, idx) => (
                <div key={idx} className="truncate">
                  <span className="text-cyan-500 pr-1">▶</span> {log}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right decrypted analysis and control screen */}
        <div className="md:col-span-7 bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-900 pb-2">
              <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 font-mono">Q-Register Coherence Tuning</span>
              <span className="text-xs font-mono font-black text-cyan-400">{coherence}%</span>
            </div>
            
            <input
              type="range"
              min={80.0}
              max={100.0}
              step={0.1}
              value={coherence}
              onChange={(e) => setCoherence(parseFloat(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />

            <div className="space-y-2 bg-black border border-slate-900 p-3 rounded-2xl">
              <div className="flex items-center justify-between text-[7px] font-mono text-slate-500 uppercase">
                <span>Intercepted Raw Ciphertext Packet</span>
                <span className="text-purple-400 select-all font-bold">SHA-256</span>
              </div>
              <div className="font-mono text-[8.5px] text-slate-400 leading-normal select-all select-all font-bold truncate">
                {activeRecord.cipher}
              </div>
            </div>

            <div className="space-y-2 bg-black border border-slate-900 p-3 rounded-2xl h-24 flex flex-col justify-between">
              <div className="text-[7.5px] font-mono text-slate-500 uppercase flex justify-between">
                <span>Decrypted ASCII Payload Outcome</span>
                <span className="flex items-center space-x-1">
                  {success ? <Unlock className="w-3 h-3 text-emerald-400" /> : <Lock className="w-3 h-3 text-red-400" />}
                  <span className={success ? 'text-emerald-400' : 'text-red-400'}>
                    {success ? 'UNLOCKED' : 'LOCKED'}
                  </span>
                </span>
              </div>
              <div className={`font-mono text-[10px] leading-relaxed transition font-bold uppercase ${
                success ? 'text-emerald-400 select-all' : 'text-slate-600 italic select-none'
              }`}>
                {success ? activeRecord.decrypted : 'Awaiting decryption lock on transponder array...'}
              </div>
            </div>
          </div>

          <button
            onClick={startDecryptionVector}
            disabled={isDecrypting}
            className={`w-full py-3 rounded-xl border font-mono text-[9px] uppercase tracking-widest font-black transition ${
              isDecrypting
                ? 'bg-purple-950 border-purple-500 text-purple-400 animate-pulse'
                : 'bg-cyan-950/50 hover:bg-cyan-900 border border-cyan-800 text-cyan-400'
            }`}
          >
            {isDecrypting ? 'Evaluating divisors...' : 'Run Cryptanalysis Decode'}
          </button>
        </div>

      </div>
    </div>
  );
};
