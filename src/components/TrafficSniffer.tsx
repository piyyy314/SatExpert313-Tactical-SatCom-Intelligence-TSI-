import React, { useState, useEffect } from 'react';
import { Target, RefreshCw, Cpu, FastForward, Play, Pause, ShieldCheck, Binary } from 'lucide-react';

interface PacketsUnit {
  id: string;
  protocol: string;
  source: string;
  destination: string;
  payloadHex: string;
}

interface SnifferProps {
  isStealthMode: boolean;
}

export const TrafficSniffer: React.FC<SnifferProps> = ({ isStealthMode }) => {
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [packets, setPackets] = useState<PacketsUnit[]>([
    { id: '1', protocol: 'UDP_TELEMETRY', source: '192.168.1.100', destination: '239.255.42.99', payloadHex: 'BE 83 4E 4F 4D 49' },
    { id: '2', protocol: 'TCP_COMMAND', source: '192.168.1.2', destination: '192.168.1.10', payloadHex: '8F A4 49 4E 49 54' },
  ]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      const protocols = ['UDP_TELEMETRY', 'TCP_COMMAND', 'ICMP_PING'];
      const sources = ['192.168.1.100', '192.168.1.2', '10.0.1.44'];
      const destinations = ['239.255.42.99', '192.168.1.10', '10.0.1.255'];
      const payloadBytes = ['BE 83 4E 4F 4D', '8F A4 49 4E 49', 'FF FF 00 04 AA'];

      const newPkt: PacketsUnit = {
        id: Math.random().toString(),
        protocol: protocols[Math.floor(Math.random() * protocols.length)],
        source: sources[Math.floor(Math.random() * sources.length)],
        destination: destinations[Math.floor(Math.random() * destinations.length)],
        payloadHex: payloadBytes[Math.floor(Math.random() * payloadBytes.length)],
      };

      setPackets(prev => [newPkt, ...prev].slice(0, 10));
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  return (
    <div className="p-6 bg-slate-950 border-2 border-slate-900 rounded-3xl text-slate-100 flex flex-col space-y-6 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div className="flex items-center space-x-3">
          <Binary className="w-5 h-5 text-cyan-400 animate-pulse" />
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider font-mono">Real-time Satcom Baseband Packet Sniffer</h3>
            <p className="text-[10px] text-slate-500 font-mono">Observe live socket frames, TCP/UDP port streams, and hex payload headers routed over baseband transceiver channels</p>
          </div>
        </div>
        <span className="text-[7.5px] font-mono uppercase bg-slate-900 text-cyan-400 border border-cyan-900/40 px-2 py-0.5 rounded animate-pulse">
          SNIFF_CORE
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left configurations */}
        <div className="md:col-span-4 space-y-4 font-mono">
          <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col space-y-4">
            <span className="text-[8px] font-black uppercase text-slate-500 block tracking-widest">Sniffer operations</span>

            <div className="bg-black border border-slate-900 p-3 rounded-xl flex items-center justify-between text-[8px]">
              <span className="text-slate-500 uppercase">Caputre status</span>
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`py-1 px-2.5 border rounded-lg font-black uppercase transition ${
                  isRunning ? 'bg-cyan-950 border-cyan-500 text-cyan-400' : 'bg-slate-950 border-slate-900 text-slate-700'
                }`}
              >
                {isRunning ? 'RUNNING' : 'PAUSED'}
              </button>
            </div>

            <div className={`bg-black/60 border border-slate-900 p-3 rounded-2xl text-[8.5px] text-slate-500 leading-relaxed uppercase tracking-wider ${isStealthMode ? 'border-purple-900/40' : ''}`}>
              {isStealthMode ? 'SHANNON_STEALTH_COVERS: Sniffer operates in passive monitor-only posture to hide active telemetry traces.' : 'DEFAULT_MONITORING: Sniffer logs network traffic streams over standard baseband channels.'}
            </div>
          </div>
        </div>

        {/* Right live dump visualization */}
        <div className="md:col-span-8 bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-2 flex-grow">
            <span className="text-[8px] font-black uppercase text-slate-400 block font-mono">Live Packet Dump Frame Receiver</span>
            
            <div className="bg-black border border-slate-900 p-3.5 h-64 overflow-y-auto scrollbar-thin rounded-xl space-y-2 font-mono text-[7.5px]">
              {packets.map((pkt) => (
                <div key={pkt.id} className="border-b border-slate-900 pb-1.5 flex justify-between items-center text-slate-300">
                  <div>
                    <span className="text-cyan-400 font-bold">[{pkt.protocol}]</span> {pkt.source} ➔ {pkt.destination}
                    <div className="text-slate-500 font-mono text-[6.5px] uppercase">Payload Byte Headers: {pkt.payloadHex}...</div>
                  </div>
                  <span className="text-slate-600">LEN: 42b</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-900 pt-2 flex items-center justify-between text-[7px] font-mono text-slate-600 uppercase">
            <span>Interface capturing synchronized with libpcap frameworks</span>
            <span className="text-emerald-400 font-black flex items-center gap-1">
              <Binary className="w-3.5 h-3.5 font-bold" /> REALTIME
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
