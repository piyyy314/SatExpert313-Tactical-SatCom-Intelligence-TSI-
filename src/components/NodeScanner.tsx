import React, { useState } from 'react';
import { Target, RefreshCw, Cpu, FastForward, Play, Pause, AlertTriangle, ShieldCheck } from 'lucide-react';

interface ScannedNode {
  port: number;
  service: string;
  status: 'OPEN' | 'CLOSED' | 'FILTERED';
  banner: string;
}

export const NodeScanner: React.FC = () => {
  const [targetSubnet, setTargetSubnet] = useState<string>('192.168.1.0/24');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scannedPorts, setScannedPorts] = useState<ScannedNode[]>([
    { port: 22, service: 'SSH Command Console', status: 'FILTERED', banner: 'SSH-2.0-OpenSSH_9.2' },
    { port: 80, service: 'VSAT Admin Server', status: 'CLOSED', banner: 'nginx v1.21' },
    { port: 1093, service: 'SATCOM Raw Telemetry Frame', status: 'CLOSED', banner: 'Unidentified socket' },
  ]);
  const [logs, setLogs] = useState<string[]>(['[NODE] Subnet scanner system online. Ready.']);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString([], { hour12: false })}] ${msg.toUpperCase()}`, ...prev].slice(0, 10));
  };

  const startSubnetScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    addLog(`Initiating SYN packet sweeps against port array on: ${targetSubnet}`);

    setTimeout(() => {
      setScannedPorts([
        { port: 22, service: 'SSH Command Console', status: 'OPEN', banner: 'SSH-2.0-OpenSSH_9.2' },
        { port: 80, service: 'VSAT Admin Server', status: 'CLOSED', banner: 'nginx v1.21' },
        { port: 1093, service: 'SATCOM Raw Telemetry Frame', status: 'OPEN', banner: 'TSI-Transceiver-Relay-v4.1' },
      ]);
      addLog(`Subnet scan finalize. Identified 2 open ports.`);
      setIsScanning(false);
    }, 1500);
  };

  return (
    <div className="p-6 bg-slate-950 border-2 border-slate-900 rounded-3xl text-slate-100 flex flex-col space-y-6 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div className="flex items-center space-x-3">
          <Target className="w-5 h-5 text-red-500 animate-pulse" />
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider font-mono">VSAT Subnet Port Scanner Check</h3>
            <p className="text-[10px] text-slate-500 font-mono">Scan regional network grids to identify active S-band transceivers and command port configurations</p>
          </div>
        </div>
        <span className="text-[7.5px] font-mono uppercase bg-slate-900 text-red-400 border border-red-950 px-2 py-0.5 rounded">
          SCAN_NET
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Settings options left */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col space-y-4">
            <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest block font-mono">Scan parameters</span>

            <div className="space-y-1">
              <label className="text-[7px] font-mono text-slate-500 uppercase">Subnet Range Target</label>
              <input
                type="text"
                value={targetSubnet}
                onChange={(e) => setTargetSubnet(e.target.value)}
                className="w-full bg-black border border-slate-900 rounded-xl px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-red-500"
              />
            </div>

            <button
              onClick={startSubnetScan}
              disabled={isScanning}
              className={`w-full py-2.5 rounded-xl border text-[9px] font-mono uppercase tracking-widest font-black transition ${
                isScanning
                  ? 'bg-red-950 border-red-500 text-slate-200 animate-pulse'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-red-400'
              }`}
            >
              {isScanning ? 'Pinging hosts...' : 'Execute SYN Port Scan'}
            </button>
          </div>

          <div className="bg-black border border-slate-900 rounded-xl p-3 h-28 flex flex-col justify-between">
            <span className="text-[7.5px] font-mono text-slate-700 uppercase tracking-widest border-b border-slate-900 pb-1 block">Network Scan Logs</span>
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
          <div className="space-y-3 flex-grow">
            <span className="text-[8px] font-black uppercase text-slate-500 block font-mono">Identified Ports Status</span>
            
            <div className="space-y-2">
              {scannedPorts.map((node) => (
                <div key={node.port} className="bg-black/60 border border-slate-900 p-2.5 rounded-xl flex items-center justify-between font-mono">
                  <div>
                    <div className="text-[9.5px] font-bold text-slate-200">Port {node.port} - {node.service}</div>
                    <div className="text-[7.5px] text-slate-500">BANNER: {node.banner}</div>
                  </div>

                  <span className={`text-[7px] px-2 py-0.5 rounded border ${
                    node.status === 'OPEN'
                      ? 'border-emerald-900 text-emerald-400 bg-emerald-950/10'
                      : node.status === 'CLOSED'
                      ? 'border-slate-800 text-slate-600'
                      : 'border-amber-900 text-amber-500 animate-pulse'
                  }`}>
                    {node.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-900 pt-3 flex items-center justify-between text-[7px] font-mono text-slate-600 uppercase">
            <span>Scan configurations verified</span>
            <span className="text-emerald-400 font-black flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> SECURITY BENCHMARK NOMINAL
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
