import React, { useState } from 'react';
import { User, ShieldAlert, Cpu, Terminal, RefreshCw, Radio, Search, Check, Info } from 'lucide-react';

interface ThreatActor {
  id: string;
  codename: string;
  origin: string;
  victimSectors: string[];
  exploitVulnerability: string;
  status: 'ACTIVE' | 'MONITORED' | 'NEUTRALIZED';
  tactics: string[];
}

const THREAT_ACTORS: ThreatActor[] = [
  {
    id: 'actor_1',
    codename: 'AURORA_SPECTRE',
    origin: 'East Asian Rim (APT Profile)',
    victimSectors: ['S-Band Transmissions', 'Maritime Terminals', 'Ku-Band Telemetries'],
    exploitVulnerability: 'Buffer Overflow on command decoders',
    status: 'ACTIVE',
    tactics: ['Signal Carrier Injection', 'DDoS SatIP Amplification', 'Coordinated Spoofing']
  },
  {
    id: 'actor_2',
    codename: 'CYCLONE_REBEL',
    origin: 'Eastern Europe / Independent',
    victimSectors: ['Commercial Constellations', 'Weather telemetry data streams'],
    exploitVulnerability: 'Brute-force factoring via Shor RSA exploits',
    status: 'MONITORED',
    tactics: ['Quantum Factoring Hack', 'Honeypot Decoy hijacking', 'Multipath Carrier noise']
  },
  {
    id: 'actor_3',
    codename: 'SOLAR_VULCAN',
    origin: 'State-Level Operator',
    victimSectors: ['Military Link Budget channels', 'X-band receivers'],
    exploitVulnerability: 'Retinal signature security check bypass',
    status: 'ACTIVE',
    tactics: ['Biometric bypass injection', 'VSAT alignment tracker takeover', 'Adaptive Active Jamming']
  },
];

export const ThreatDossier: React.FC = () => {
  const [selectedActor, setSelectedActor] = useState<ThreatActor>(THREAT_ACTORS[0]);
  const [search, setSearch] = useState('');
  const [logs, setLogs] = useState<string[]>(['[DOSSIER] Cyber Threat Intelligence registry synced.']);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString([], { hour12: false })}] ${msg.toUpperCase()}`, ...prev].slice(0, 10));
  };

  const filteredActors = THREAT_ACTORS.filter(act => 
    act.codename.toLowerCase().includes(search.toLowerCase()) || 
    act.origin.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 bg-slate-950 border-2 border-slate-900 rounded-3xl text-slate-100 flex flex-col space-y-6 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div className="flex items-center space-x-3">
          <ShieldAlert className="w-5 h-5 text-red-400 animate-pulse" />
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider font-mono">APT & Satellite Cyber Threat Dossier</h3>
            <p className="text-[10px] text-slate-500 font-mono">Military space-sec intelligence database tracking adversary space actors, techniques, and system exploits</p>
          </div>
        </div>
        <span className="text-[7.5px] font-mono uppercase bg-slate-900 text-red-400 border border-red-900/40 px-2 py-0.5 rounded">
          INTEL_REG
        </span>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left list select */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col space-y-3.5">
            <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest block font-mono">Select Adversary Vector</span>

            <div className="relative">
              <input
                type="text"
                placeholder="Search profiles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-black border border-slate-900 rounded-xl px-2.5 py-1.5 text-xs font-mono text-slate-300 focus:outline-none focus:border-red-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-600 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>

            <div className="space-y-1.5 font-mono">
              {filteredActors.map(actor => (
                <button
                  key={actor.id}
                  onClick={() => {
                    setSelectedActor(actor);
                    addLog(`Opened detailed portfolio file: ${actor.codename}`);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl border flex flex-col space-y-0.5 transition ${
                    selectedActor.id === actor.id
                      ? 'bg-red-950/40 border-red-500 text-red-400 font-black'
                      : 'bg-slate-950 border-slate-900/65 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <div className="text-[9.5px] uppercase tracking-wider">{actor.codename}</div>
                  <div className="text-[7px] text-slate-500 flex justify-between">
                    <span>{actor.origin}</span>
                    <span className={actor.status === 'ACTIVE' ? 'text-red-400 animate-pulse' : 'text-slate-600'}>
                      {actor.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-black border border-slate-900 rounded-xl p-3 h-24 overflow-y-auto scrollbar-none flex flex-col justify-between">
            <span className="text-[7.5px] font-mono text-slate-700 uppercase tracking-widest border-b border-slate-900 pb-1 block">Dossier Audit Logs</span>
            <div className="flex-grow font-mono text-[7px] text-slate-400 space-y-0.5 pt-1 overflow-y-auto">
              {logs.map((log, idx) => (
                <div key={idx} className="truncate">
                  <span className="text-red-500 pr-1">▶</span> {log}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right profile detail panel view */}
        <div className="md:col-span-7 bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-900 pb-2">
              <span className="text-[8.5px] font-black uppercase tracking-wider text-slate-400 font-mono">Profile Dossier Overview</span>
              <span className={`text-[7.5px] font-mono uppercase bg-slate-950 px-2.5 py-0.5 border rounded ${
                selectedActor.status === 'ACTIVE' ? 'border-red-900 text-red-500 animate-pulse font-bold' : 'border-slate-800 text-slate-500'
              }`}>
                SYSTEM_STRIKE_PROFILE: {selectedActor.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-900/60">
                <span className="text-[7px] font-mono text-slate-500 block">Codename</span>
                <span className="text-xs font-mono font-black text-slate-200">{selectedActor.codename}</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-900/60">
                <span className="text-[7px] font-mono text-slate-500 block">Origin Vector</span>
                <span className="text-xs font-mono font-bold text-slate-300">{selectedActor.origin}</span>
              </div>
            </div>

            <div className="space-y-1.5 bg-black border border-slate-950 p-3 rounded-xl">
              <span className="text-[7.5px] font-mono text-slate-500 uppercase block">Exploits Vulnerabilitiy Vectors</span>
              <p className="text-[9px] font-mono text-red-400 leading-relaxed font-bold uppercase select-all">{selectedActor.exploitVulnerability}</p>
            </div>

            <div className="space-y-1.5">
              <span className="text-[7.5px] font-mono text-slate-500 uppercase block">Active Exploitation Tactics</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedActor.tactics.map((tac, idx) => (
                  <span key={idx} className="bg-red-950/20 border border-red-900/40 text-red-400 px-2.5 py-0.5 rounded-lg text-[8.5px] font-mono uppercase text-xs font-medium">
                    {tac}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-900 pt-3 flex items-center gap-2 text-[7px] font-mono text-slate-600 uppercase">
            <Info className="w-3.5 h-3.5 text-slate-500" />
            <span>Countermeasure: Build active YARA checks, and ensure Shor's proof lockouts on receivers</span>
          </div>
        </div>

      </div>
    </div>
  );
};
