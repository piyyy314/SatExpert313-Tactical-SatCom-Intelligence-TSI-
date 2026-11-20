import React, { useState } from 'react';
import { Target, RefreshCw, Layers, ShieldCheck, Image, ShieldAlert, Cpu } from 'lucide-react';

export const MediaForge: React.FC = () => {
  const [hasScanned, setHasScanned] = useState<boolean>(false);
  const [purgedMetadata, setPurgedMetadata] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>(['[MEDIA_FORGE] Steganography decoding engines primed.']);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString([], { hour12: false })}] ${msg.toUpperCase()}`, ...prev].slice(0, 10));
  };

  const handleRunScan = () => {
    addLog(`Initiating steganography decode scanning vector...`);
    setTimeout(() => {
      setHasScanned(true);
      addLog(`ASCII hidden payload sequence matched inside lower index bitstreams.`);
    }, 1000);
  };

  const handlePurgeMetadata = () => {
    addLog(`Wiping regional EXIF tags, telemetry offsets, and device fingerprint headers...`);
    setTimeout(() => {
      setPurgedMetadata(true);
      addLog(`Sanitizing finalized. Image binary saved cleanly over sandboxed storage.`);
    }, 1200);
  };

  return (
    <div className="p-6 bg-slate-950 border-2 border-slate-900 rounded-3xl text-slate-100 flex flex-col space-y-6 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div className="flex items-center space-x-3">
          <Image className="w-5 h-5 text-purple-400 animate-pulse" />
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider font-mono">Steganographic Forensic Decoder</h3>
            <p className="text-[10px] text-slate-500 font-mono">Examine imagery payload streams for hidden cyber markers, geographic EXIF tags, and sanitize metadata</p>
          </div>
        </div>
        <span className="text-[7.5px] font-mono uppercase bg-slate-900 text-purple-400 border border-purple-900/40 px-2 py-0.5 rounded">
          STEG_DEC
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Settings options left */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col space-y-4">
            <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest block font-mono">Image Stego Check</span>

            <button
              onClick={handleRunScan}
              className="w-full bg-cyan-950/50 hover:bg-cyan-900 border border-cyan-800 text-cyan-400 py-2.5 rounded-xl text-[9px] font-black font-mono uppercase tracking-wider transition"
            >
              Analyze Hidden Stego Pixels
            </button>

            <button
              onClick={handlePurgeMetadata}
              className="w-full bg-red-950/45 hover:bg-red-900 border border-red-800 text-red-400 py-2.5 rounded-xl text-[9px] font-black font-mono uppercase tracking-wider transition"
            >
              Purge Geo EXIF Metadata
            </button>
          </div>

          <div className="bg-black border border-slate-900 rounded-xl p-3 h-28 flex flex-col justify-between">
            <span className="text-[7.5px] font-mono text-slate-600 uppercase tracking-widest border-b border-slate-900 pb-1 block">Forge Operations Logs</span>
            <div className="flex-grow font-mono text-[7px] text-slate-400 space-y-0.5 pt-1 overflow-y-auto">
              {logs.map((log, idx) => (
                <div key={idx} className="truncate">
                  <span className="text-purple-500 pr-1">▶</span> {log}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Display right */}
        <div className="md:col-span-7 bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950 border border-slate-900 p-3 rounded-2xl">
              <span className="text-[7px] font-mono text-slate-500 block">STEGANOGRAPHY STATUS</span>
              <span className={`text-xs font-mono font-black ${hasScanned ? 'text-red-400 animate-pulse' : 'text-slate-500'}`}>
                {hasScanned ? 'CYBER_PAYLOAD_FOUND' : 'AWAIT_CHECK_SCAN'}
              </span>
            </div>

            <div className="bg-slate-950 border border-slate-900 p-3 rounded-2xl">
              <span className="text-[7px] font-mono text-slate-500 block">EXIF SANITIZER LOCK</span>
              <span className={`text-xs font-mono font-black ${purgedMetadata ? 'text-emerald-400' : 'text-slate-500'}`}>
                {purgedMetadata ? 'SANITIZED_COMPLETE' : 'HEADER_TAGS_PENDING'}
              </span>
            </div>
          </div>

          {/* Steg ASCII Display Box */}
          <div className="bg-black border border-slate-900 p-3 h-28 rounded-xl flex flex-col justify-between">
            <span className="text-[7px] font-mono text-slate-500 block">Decoded Unicode Stream Bytes</span>
            <div className="flex-grow font-mono text-[9px] py-1.5 text-cyan-400 select-all break-all leading-relaxed tracking-wider">
              {hasScanned ? 'DECODED_TEXT: FLAG{SATCOM_RECON_REVELATION_2026}' : 'Awaiting pixel-block analysis vectors...'}
            </div>
          </div>

          <div className="border-t border-slate-900 pt-3 flex items-center justify-between text-[7px] font-mono text-slate-600 uppercase">
            <span>Security audit levels validated</span>
            <span className="text-emerald-400 font-black flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> SECURE HANDSHAKES DEPLOYED
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
