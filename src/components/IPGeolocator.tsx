import React, { useState } from 'react';
import { MapPin, Globe, Compass, Cpu, Search, Wifi, Database } from 'lucide-react';

interface GeoData {
  ip: string;
  country: string;
  city: string;
  lat: number;
  lng: number;
  isp: string;
  asn: string;
  latency: number;
}

const DEFAULT_SITES: GeoData[] = [
  { ip: '8.8.8.8', country: 'United States', city: 'Mountain View', lat: 37.422, lng: -122.084, isp: 'Google LLC', asn: 'AS15169', latency: 12 },
  { ip: '1.1.1.1', country: 'Australia', city: 'Sydney', lat: -33.868, lng: 151.209, isp: 'Cloudflare Inc.', asn: 'AS13335', latency: 24 },
  { ip: '194.20.14.88', country: 'Germany', city: 'Frankfurt', lat: 50.110, lng: 8.682, isp: 'Deutsche Telekom', asn: 'AS3320', latency: 45 },
  { ip: '45.12.80.3', country: 'Japan', city: 'Tokyo', lat: 35.676, lng: 139.650, isp: 'NTT Communications', asn: 'AS2914', latency: 68 },
];

export const IPGeolocator: React.FC = () => {
  const [inputIp, setInputIp] = useState('');
  const [activeGeo, setActiveGeo] = useState<GeoData>(DEFAULT_SITES[0]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanLogs, setScanLogs] = useState<string[]>([]);

  const handleLookup = (ipAddress: string) => {
    setIsScanning(true);
    setScanLogs([`Initializing remote query for node: ${ipAddress}`]);

    // Simulate trace log
    setTimeout(() => {
      setScanLogs(prev => [...prev, `Tracing network hops through S-Band transceivers...`]);
    }, 400);

    setTimeout(() => {
      setScanLogs(prev => [...prev, `Resolving autonomous system metadata...`]);
    }, 800);

    setTimeout(() => {
      const match = DEFAULT_SITES.find(s => s.ip === ipAddress) || {
        ip: ipAddress,
        country: 'Nations Space Union (Mock)',
        city: 'Sector ' + Math.floor(Math.random() * 80 + 10),
        lat: Number((Math.random() * 120 - 60).toFixed(4)),
        lng: Number((Math.random() * 240 - 120).toFixed(4)),
        isp: 'International Satcom Relay',
        asn: 'AS' + Math.floor(Math.random() * 50000 + 1000),
        latency: Math.floor(Math.random() * 120 + 30),
      };
      setActiveGeo(match);
      setScanLogs(prev => [...prev, `Node Geolocation acquired successfully.`]);
      setIsScanning(false);
    }, 1200);
  };

  return (
    <div className="p-6 bg-slate-950 border-2 border-slate-900 rounded-3xl text-slate-100 flex flex-col space-y-6 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div className="flex items-center space-x-3">
          <Globe className="w-5 h-5 text-cyan-400 animate-spin" style={{ animationDuration: '10s' }} />
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider font-mono">IP Geolocation & Spoof Tracer</h3>
            <p className="text-[10px] text-slate-500 font-mono">Resolve terrestrial nodes, carrier routing, and satellite beam locks</p>
          </div>
        </div>
        <span className="text-[7.5px] font-mono uppercase bg-slate-900 text-slate-400 border border-slate-800 px-2 py-0.5 rounded">
          TS_MAP_UPLINK
        </span>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Side: Lookup interface */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col space-y-3">
            <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest block font-mono">Trigger Terrestrial Query</span>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. 194.20.14.88"
                value={inputIp}
                onChange={(e) => setInputIp(e.target.value)}
                className="flex-grow bg-black border border-slate-900 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={() => handleLookup(inputIp || '194.20.14.88')}
                disabled={isScanning}
                className="bg-cyan-950/50 hover:bg-cyan-900 border border-cyan-800 text-cyan-400 px-3 py-1.5 rounded-xl font-mono text-[10px] font-bold uppercase tracking-wider transition disabled:opacity-40"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {DEFAULT_SITES.map((d) => (
                <button
                  key={d.ip}
                  onClick={() => {
                    setInputIp(d.ip);
                    handleLookup(d.ip);
                  }}
                  className={`text-[8.5px] font-mono px-2 py-1 rounded border transition ${
                    activeGeo.ip === d.ip
                      ? 'bg-cyan-950/40 border-cyan-500 text-cyan-400 font-bold'
                      : 'bg-slate-900/40 border-slate-800 text-slate-500 hover:text-white'
                  }`}
                >
                  {d.ip} ({d.city})
                </button>
              ))}
            </div>
          </div>

          {/* Telemetry Logs */}
          <div className="bg-black border border-slate-900 rounded-2xl p-3 h-32 flex flex-col justify-between">
            <span className="text-[7.5px] font-mono text-slate-600 uppercase tracking-widest border-b border-slate-900 pb-1">Query Telemetry Logs</span>
            <div className="flex-grow overflow-y-auto pt-2 space-y-1 scrollbar-none font-mono text-[8px] text-slate-400">
              {scanLogs.length === 0 ? (
                <div className="text-slate-600 text-center uppercase py-4">Awaiting lookup trigger...</div>
              ) : (
                scanLogs.map((log, idx) => (
                  <div key={idx} className="flex items-center space-x-1.5">
                    <span className="text-cyan-500">▶</span>
                    <span>{log.toUpperCase()}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Coordinate / Target Node view */}
        <div className="md:col-span-7 bg-slate-950/50 border border-slate-900 p-4 rounded-2xl flex flex-col justify-between relative min-h-[220px]">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1 border-r border-slate-900/60 pr-2">
              <span className="text-[7px] font-black uppercase text-slate-500 tracking-wider block font-mono">Location Coordinates</span>
              <div className="flex items-center space-x-2 text-slate-200">
                <Compass className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono font-bold select-all">
                  {activeGeo.lat.toFixed(4)}°N, {activeGeo.lng.toFixed(4)}°E
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[7px] font-black uppercase text-slate-500 tracking-wider block font-mono">Network Operator</span>
              <div className="flex items-center space-x-2 text-slate-200">
                <Cpu className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-mono font-bold truncate">{activeGeo.isp}</span>
              </div>
            </div>
          </div>

          {/* Graphical Mock Grid */}
          <div className="my-4 bg-black/60 border border-slate-900 rounded-xl p-3 h-28 relative overflow-hidden flex items-center justify-center">
            {/* Grid markings */}
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
            <div className="absolute h-px w-full bg-cyan-950/40"></div>
            <div className="absolute w-px h-full bg-cyan-950/40"></div>
            
            {/* Active position target pulse */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-4 h-4 bg-cyan-500/20 border border-cyan-400 rounded-full flex items-center justify-center animate-ping"></div>
              <MapPin className="w-5 h-5 text-cyan-400 absolute -top-0.5" />
              <span className="text-[8px] font-mono text-cyan-400 font-bold bg-black/85 px-1 rounded border border-cyan-900 mt-5 uppercase">
                {activeGeo.city}, {activeGeo.country}
              </span>
            </div>
            
            <div className="absolute bottom-1 right-2 text-[6.5px] font-mono text-slate-600 uppercase">
              GRID SCALE: 1:12,000Km
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-900">
            <div className="bg-slate-950 p-2 rounded-xl border border-slate-900/60">
              <span className="text-[6.5px] font-mono text-slate-500 uppercase block">AS Number</span>
              <span className="text-[10px] font-mono font-black text-slate-300">{activeGeo.asn}</span>
            </div>
            <div className="bg-slate-950 p-2 rounded-xl border border-slate-900/60">
              <span className="text-[6.5px] font-mono text-slate-500 uppercase block">Uplink Latency</span>
              <span className="text-[10px] font-mono font-black text-cyan-400">{activeGeo.latency} ms</span>
            </div>
            <div className="bg-slate-950 p-2 rounded-xl border border-slate-900/60">
              <span className="text-[6.5px] font-mono text-slate-500 uppercase block">Sat Spot Lock</span>
              <span className="text-[10px] font-mono font-black text-emerald-400">SECURE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
