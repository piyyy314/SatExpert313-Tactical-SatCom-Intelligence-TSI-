import React, { useState } from 'react';
import { Target, RefreshCw, Layers, ShieldCheck, Play, Pause, AlertTriangle, Cpu, HardDrive } from 'lucide-react';

interface USBPartition {
  id: string;
  name: string;
  size: string;
  firmwareScan: 'SAFE' | 'CYBER_COMPROMISE' | 'SUSPICIOUS';
  capacityUsed: number; // %
}

export const USBDeviceManager: React.FC = () => {
  const [partitions, setPartitions] = useState<USBPartition[]>([
    { id: '1', name: 'Alkali-Decoy-Transceiver-Partition', size: '16 GB', firmwareScan: 'SAFE', capacityUsed: 35 },
    { id: '2', name: 'Raw-Bootloader-SPI-Eeprom', size: '2 MB', firmwareScan: 'SUSPICIOUS', capacityUsed: 88 },
  ]);
  const [logs, setLogs] = useState<string[]>(['[USB] Hardware isolation sandbox initialized. Ready.']);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString([], { hour12: false })}] ${msg.toUpperCase()}`, ...prev].slice(0, 10));
  };

  const startMalwareScan = () => {
    addLog(`Initiating raw SPI register scanning sweep on local storage buffers...`);
    setTimeout(() => {
      setPartitions(prev => prev.map(p => {
        if (p.firmwareScan === 'SUSPICIOUS') {
          return { ...p, firmwareScan: 'CYBER_COMPROMISE' };
        }
        return p;
      }));
      addLog(`[ALERT] Malicious boot sector malware matched inside lower memory partition.`);
    }, 1200);
  };

  const wipeHardwareStorage = () => {
    addLog(`Broadcasting complete NAND flash sector zeros...`);
    setTimeout(() => {
      setPartitions([]);
      addLog(`NAND flash storage completely overwritten. 0 partitions remaining.`);
    }, 1000);
  };

  return (
    <div className="p-6 bg-slate-950 border-2 border-slate-900 rounded-3xl text-slate-100 flex flex-col space-y-6 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div className="flex items-center space-x-3">
          <HardDrive className="w-5 h-5 text-cyan-400 animate-pulse" />
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider font-mono">USB Hardware & Malware Isolation manager</h3>
            <p className="text-[10px] text-slate-500 font-mono font-mono">Simulate connected flash partitions, analyze bootloader microcode, and perform raw storage sterilization wipes</p>
          </div>
        </div>
        <span className="text-[7.5px] font-mono uppercase bg-slate-900 text-cyan-400 border border-cyan-900/40 px-2 py-0.5 rounded">
          USB_SAN
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Settings options left */}
        <div className="md:col-span-5 space-y-4 font-mono">
          <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col space-y-4">
            <span className="text-[8px] font-black uppercase text-slate-500 block tracking-widest">Sanitizer operations</span>

            <button
              onClick={startMalwareScan}
              className="w-full bg-cyan-950/50 hover:bg-cyan-900 border border-cyan-800 text-cyan-400 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition"
            >
              Analyze Partition Firmware
            </button>

            <button
              onClick={wipeHardwareStorage}
              className="w-full bg-red-950/45 hover:bg-red-900 border border-red-800 text-red-100 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition"
            >
              Sanitize NAND Storage Wipe
            </button>
          </div>

          <div className="bg-black border border-slate-900 rounded-xl p-3 h-28 flex flex-col justify-between">
            <span className="text-[7.5px] font-mono text-slate-700 uppercase tracking-widest border-b border-slate-900 pb-1 block">USB Operations Logs</span>
            <div className="flex-grow font-mono text-[7px] text-slate-400 space-y-0.5 pt-1 overflow-y-auto">
              {logs.map((log, idx) => (
                <div key={idx} className="truncate">
                  <span className="text-cyan-500 pr-1">▶</span> {log}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic displays right */}
        <div className="md:col-span-7 bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-3 flex-grow font-mono">
            <span className="text-[8px] font-black uppercase text-slate-400 block">Detected Partition Clusters</span>

            {partitions.length === 0 ? (
              <div className="bg-black/60 border border-slate-900/60 p-6 rounded-xl flex items-center justify-center text-slate-500 text-[10px] uppercase tracking-wider font-extrabold">
                Zero active partitions connected to sandbox.
              </div>
            ) : (
              <div className="space-y-2">
                {partitions.map((part) => (
                  <div key={part.id} className="bg-black/60 border border-slate-900 p-2.5 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-[9.5px] font-bold text-slate-200">{part.name} ({part.size})</div>
                      <div className="text-[7px] text-slate-500 uppercase">FS CAPACITY USED: {part.capacityUsed}%</div>
                    </div>

                    <span className={`text-[7px] px-2 py-0.5 rounded border font-semibold ${
                      part.firmwareScan === 'SAFE'
                        ? 'border-emerald-950 text-emerald-400 bg-emerald-950/10'
                        : part.firmwareScan === 'SUSPICIOUS'
                        ? 'border-amber-900 text-amber-500 animate-pulse'
                        : 'border-red-900 text-red-500 bg-red-950/15 animate-bounce'
                    }`}>
                      {part.firmwareScan}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-slate-900 pt-2 flex items-center justify-between text-[7px] font-mono text-slate-700 uppercase">
            <span>Hardware isolation sandboxing compliant with NIST-800 guidelines</span>
            <span className="text-emerald-400 font-black flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> SECURE HANDSHAKES COMPLETE
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
