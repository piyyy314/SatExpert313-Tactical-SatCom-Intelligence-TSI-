import React, { useState, useEffect } from 'react';
import { Shield, Target, RefreshCw, Radio, Zap, AlertTriangle, ShieldAlert } from 'lucide-react';
import { ModuleExportToolbar } from './ModuleExportToolbar.tsx';

interface ThreatVector {
  id: string;
  source: string;
  altitude: number; // km
  speed: number; // mach
  impactEta: number; // seconds
  status: 'TRACKING' | 'INTERCEPTED' | 'WARNING';
}

export const AegisC2: React.FC = () => {
  const [threats, setThreats] = useState<ThreatVector[]>([
    { id: '1', source: 'ICBM_NORTH_V_1', altitude: 120, speed: 18.4, impactEta: 120, status: 'TRACKING' },
    { id: '2', source: 'HYPERSONIC_HG_9', altitude: 45, speed: 7.2, impactEta: 45, status: 'TRACKING' },
  ]);
  const [shieldActive, setShieldActive] = useState<boolean>(true);
  const [logs, setLogs] = useState<string[]>(['[AEGIS_C2] Tracking grids synchronized with orbital DSP infrared satellites.']);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString([], { hour12: false })}] ${msg.toUpperCase()}`, ...prev].slice(0, 10));
  };

  useEffect(() => {
    const handle = setInterval(() => {
      setThreats(prev => prev.map(t => {
        if (t.status === 'INTERCEPTED') return t;
        const nextEta = Math.max(0, t.impactEta - 1);
        return {
          ...t,
          impactEta: nextEta,
          status: nextEta === 0 ? 'WARNING' : t.status
        };
      }));
    }, 1000);
    return () => clearInterval(handle);
  }, []);

  const triggerIntercept = (id: string) => {
    addLog(`Launching SM-3 Block IIA interceptor against target ID: ${id}...`);
    setTimeout(() => {
      setThreats(prev => prev.map(t => t.id === id ? { ...t, status: 'INTERCEPTED' } : t));
      addLog(`SM-3 telemetry match! Dynamic impact kinetic destruction verified.`);
    }, 1200);
  };

  return (
    <div className="p-6 bg-slate-950 border-2 border-slate-900 rounded-3xl text-slate-100 flex flex-col space-y-6 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div className="flex items-center space-x-3">
          <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider font-mono">Aegis Space-Assisted Command & Control (C2)</h3>
            <p className="text-[10px] text-slate-500 font-mono font-mono">Synchronized command layout tracking ballistic threat arcs and activating terminal protection shield grids</p>
          </div>
        </div>
        <span className="text-[7.5px] font-mono uppercase bg-slate-900 text-red-400 border border-red-950 px-2 py-0.5 rounded animate-pulse">
          AEGIS_SYS
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Trajectory tracks left */}
        <div className="md:col-span-8 space-y-4">
          <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest block font-mono">Active Orbital Threat Targets</span>
          
          <div className="space-y-3">
            {threats.map((th) => (
              <div key={th.id} className="bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1 font-mono">
                  <div className="text-[10px] font-black text-rose-500 uppercase flex items-center space-x-2">
                    <Target className="w-4 h-4 animate-spin" />
                    <span>{th.source}</span>
                  </div>
                  <div className="text-[7.5px] text-slate-450 uppercase flex flex-wrap gap-3">
                    <span>ALTITUDE: {th.altitude} Km</span>
                    <span>SPEED: Mach {th.speed}</span>
                    <span>ETA: {th.impactEta}s</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[7px] font-mono uppercase px-2 py-1 rounded border font-bold ${
                    th.status === 'INTERCEPTED'
                      ? 'border-emerald-950 text-emerald-450 bg-emerald-950/15'
                      : 'border-red-900 text-red-450 bg-red-950/15 animate-pulse'
                  }`}>
                    {th.status}
                  </span>
                  
                  {th.status !== 'INTERCEPTED' && (
                    <button
                      onClick={() => triggerIntercept(th.id)}
                      className="bg-red-950/45 hover:bg-red-900 border border-red-800 text-red-405 px-3 py-1.5 rounded-xl font-mono text-[9px] uppercase font-black transition tracking-wider"
                    >
                      Fire Interceptor
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Simulated radar vector map */}
          <div className="bg-black border border-slate-900 h-44 rounded-2xl relative overflow-hidden flex items-center justify-center">
            {/* Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
            <div className="absolute w-28 h-28 border border-cyan-800/25 rounded-full animate-ping" style={{ animationDuration: '4s' }}></div>
            <div className="absolute w-44 h-44 border border-cyan-850/20 rounded-full"></div>
            
            <div className="relative z-10 font-mono text-[8.5px] uppercase bg-black/85 border border-cyan-900/60 px-3 py-1.5 rounded-xl text-cyan-405 font-bold animate-pulse">
              AEGIS AIR SHIELD STATE CODE: ACTIVE_LOCKED
            </div>

            <div className="absolute bottom-2 left-2 text-[6.5px] font-mono text-slate-655 uppercase">
              RADAR INTEGRATION SWEEP ONGOING
            </div>
          </div>
        </div>

        {/* Diagnostic logs right */}
        <div className="md:col-span-4 bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest block font-mono">System Audit Log</span>

            <div className="bg-black border border-slate-900 p-3 h-56 rounded-xl overflow-y-auto scrollbar-none font-mono text-[7px] text-slate-400 space-y-1">
              {logs.map((log, idx) => (
                <div key={idx} className="truncate">
                  <span className="text-red-500 pr-1">▶</span> {log}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-black border border-slate-950 p-2.5 rounded-xl text-center text-[7.5px] font-mono text-slate-600 uppercase font-bold pr-2 flex items-center justify-center space-x-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-450 animate-pulse" />
            <span>TERMINAL PROTECTION FULLY UNLOCKED</span>
          </div>
        </div>

      </div>

      {/* Module Export Toolbar */}
      <ModuleExportToolbar
        moduleTitle="AEGIS AIR SHIELD & C2 DEFENSE GRID"
        moduleSubtitle="Space-Assisted Interceptor Tracking & Air Shield Grid"
        classification="TOP SECRET // NOFORN"
        metadata={{
          'Aegis Shield State': shieldActive ? 'ACTIVE_LOCKED' : 'INACTIVE',
          'Tracked Ballistic Vectors': threats.length,
          'Active Interceptors': 'SM-3 Block IIA / THAAD System Link'
        }}
        summaryText="Space-Assisted C2 ballistic threat tracking matrix. Real-time intercept telemetry verified."
        columns={[
          { header: 'Threat ID', key: 'source' },
          { header: 'Altitude (km)', key: 'altitude' },
          { header: 'Speed (Mach)', key: 'speed' },
          { header: 'Impact ETA (s)', key: 'impactEta' },
          { header: 'Status', key: 'status' }
        ]}
        rows={threats}
        filenamePrefix="Aegis_C2_Air_Shield"
      />
    </div>
  );
};
