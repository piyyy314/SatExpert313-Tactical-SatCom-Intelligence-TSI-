import React, { useState, useEffect } from 'react';
import { Compass, ShieldAlert, Cpu, Activity, RefreshCw, Radio, ShieldCheck } from 'lucide-react';

export const SpoofTracer: React.FC = () => {
  const [driftX, setDriftX] = useState<number>(0.005);
  const [driftY, setDriftY] = useState<number>(-0.003);
  const [spoofRisk, setSpoofRisk] = useState<'LOW' | 'HIGH' | 'CRITICAL'>('LOW');
  const [prevRisk, setPrevRisk] = useState<'LOW' | 'HIGH' | 'CRITICAL'>('LOW');
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);
  const [isFilterActive, setIsFilterActive] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>(['[SPOOF] GPS correlation validator active.']);
  const [alertLevel, setAlertLevel] = useState<'HIGH' | 'CRITICAL' | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState<boolean>(false);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString([], { hour12: false })}] ${msg.toUpperCase()}`, ...prev].slice(0, 10));
  };

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time drift jitter
      setDriftX(prev => Number((prev + (Math.random() - 0.5) * 0.001).toFixed(4)));
      setDriftY(prev => Number((prev + (Math.random() - 0.5) * 0.001).toFixed(4)));
      
      const totalDrift = Math.abs(driftX) + Math.abs(driftY);
      if (totalDrift > 0.04) {
        setSpoofRisk('CRITICAL');
      } else if (totalDrift > 0.015) {
        setSpoofRisk('HIGH');
      } else {
        setSpoofRisk('LOW');
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [driftX, driftY]);

  // Alert trigger on risk escalation to HIGH or CRITICAL
  useEffect(() => {
    if (spoofRisk !== prevRisk) {
      if (spoofRisk === 'HIGH' || spoofRisk === 'CRITICAL') {
        setAlertLevel(spoofRisk);
        setIsAlertOpen(true);
        addLog(`ALERT TRANSITION: Spoof risk escalated to ${spoofRisk}! Triggering defense protocols.`);
      }
      setPrevRisk(spoofRisk);
    }
  }, [spoofRisk, prevRisk]);

  const handleRecalibrateRef = () => {
    if (isCalibrating) return;
    setIsCalibrating(true);
    addLog(`Recalibrating carrier delay-locked loops (DLL) against NATO reference clock...`);

    setTimeout(() => {
      setDriftX(0.0004);
      setDriftY(-0.0002);
      setSpoofRisk('LOW');
      setIsAlertOpen(false);
      addLog(`Delay lock re-established. Spoof reference delta stabilized.`);
      setIsCalibrating(false);
    }, 1200);
  };

  return (
    <div className={`p-6 bg-slate-950 border-2 rounded-3xl text-slate-100 flex flex-col space-y-6 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 relative transition-all duration-500 ${
      spoofRisk === 'CRITICAL'
        ? 'border-red-600 shadow-[0_0_35px_rgba(239,68,68,0.35)] lg:animate-none animate-pulse'
        : spoofRisk === 'HIGH'
          ? 'border-amber-600 shadow-[0_0_20px_rgba(217,119,6,0.2)]'
          : 'border-slate-900'
    }`}>
      {/* Visual Alert Warning Banner for continuous persistent view */}
      {(spoofRisk === 'HIGH' || spoofRisk === 'CRITICAL') && (
        <div className={`absolute top-0 inset-x-0 h-1.5 ${spoofRisk === 'CRITICAL' ? 'bg-red-600 animate-pulse' : 'bg-amber-500'} z-20`}></div>
      )}

      {/* Interactive Modal Warning Overlay Dialog */}
      {isAlertOpen && alertLevel && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-250">
          <div className={`p-6 max-w-md w-full rounded-2xl border-2 bg-slate-950 flex flex-col space-y-5 font-mono shadow-2xl relative ${
            alertLevel === 'CRITICAL' ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.25)]' : 'border-amber-500 shadow-[0_0_20px_rgba(217,119,6,0.2)]'
          }`}>
            <div className="flex items-center space-x-3.5 border-b border-wrap pb-3" style={{ borderColor: alertLevel === 'CRITICAL' ? 'rgba(239,68,68,0.2)' : 'rgba(217,119,6,0.2)' }}>
              <ShieldAlert className={`w-8 h-8 ${alertLevel === 'CRITICAL' ? 'text-red-500 animate-bounce' : 'text-amber-500'}`} />
              <div>
                <h4 className={`text-xs font-black uppercase tracking-widest ${alertLevel === 'CRITICAL' ? 'text-red-500' : 'text-amber-500'}`}>
                  {alertLevel === 'CRITICAL' ? 'CRITICAL SPOOF ATTACK' : 'HIGH CARRIER DRIFT WARNING'}
                </h4>
                <p className="text-[8px] text-slate-400 uppercase tracking-wider">Telemetry correlation engine failed consistency audit</p>
              </div>
            </div>

            <div className="space-y-2 text-[9px] text-slate-300 uppercase leading-relaxed">
              <p>
                The validation parser has isolated a critical divergence in active S-Band telemetry phase references.
              </p>
              <div className="bg-black/80 p-2.5 rounded-lg border border-slate-900 space-y-1 font-mono text-[8px]">
                <div>DETECTED RISK LEVEL: <span className={alertLevel === 'CRITICAL' ? 'text-red-400 font-bold' : 'text-amber-400 font-bold'}>{alertLevel}</span></div>
                <div>X-AXIS DEVIATION: <span className="text-cyan-400 font-bold">{driftX}°</span></div>
                <div>Y-AXIS DEVIATION: <span className="text-cyan-400 font-bold">{driftY}°</span></div>
                <div>TOTAL DELTA RADIUS: <span className="text-red-400 font-bold">{(Math.abs(driftX) + Math.abs(driftY)).toFixed(4)}° / THRESHOLD</span></div>
              </div>
              <p className="text-xs text-red-400 font-bold animate-pulse text-center pt-1 tracking-wider">
                [COORDINATES UNRELIABLE - ACTIVE JAMMING IMPLICATED]
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3.5 pt-2">
              <button
                onClick={() => {
                  setIsAlertOpen(false);
                  addLog('ALERT OVERRIDE: Warning dialog acknowledged manually.');
                }}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white py-2 rounded-xl text-[9px] uppercase tracking-wider transition font-medium"
              >
                Mute Warning
              </button>
              <button
                onClick={() => {
                  handleRecalibrateRef();
                }}
                className={`py-2 rounded-xl text-[9px] uppercase tracking-wider transition font-bold border ${
                  alertLevel === 'CRITICAL'
                    ? 'bg-red-950/80 hover:bg-red-900 border-red-500 text-red-200'
                    : 'bg-amber-950/80 hover:bg-amber-900 border-amber-500 text-amber-200'
                }`}
              >
                Auto-Recalibrate
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div className="flex items-center space-x-3">
          <Compass className="w-5 h-5 text-cyan-400 animate-pulse" />
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider font-mono">GPS & Telemetry Spoof Detector</h3>
            <p className="text-[10px] text-slate-500 font-mono">Real-time validation of satellite clock signals, ephemeris accuracy, and geographic coordinates coherence</p>
          </div>
        </div>
        <span className="text-[7.5px] font-mono uppercase bg-slate-900 text-cyan-400 border border-cyan-900/40 px-2 py-0.5 rounded">
          SPOOF_CHECK
        </span>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Settings column */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col space-y-4">
            <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest block font-mono">Antidote Filters</span>

            <div className="space-y-2">
              <label className="text-[7px] font-black uppercase text-slate-500 tracking-wider block font-mono">GPS Multi-Path Filter Mode</label>
              <div className="flex items-center justify-between bg-black border border-slate-900 p-1.5 rounded-xl">
                <span className="text-[8.5px] font-mono text-slate-400 uppercase font-bold pl-1">
                  {isFilterActive ? 'SHADOW CLOCK FILTER ACTIVE' : 'FILTER_PASS_BYPASS'}
                </span>
                <button
                  onClick={() => {
                    setIsFilterActive(!isFilterActive);
                    addLog(isFilterActive ? 'De-activated clock shadow mitigation.' : 'Activated high-order clock spatial filter.');
                  }}
                  className={`text-[8px] font-mono uppercase px-2 py-1 rounded border transition font-bold ${
                    isFilterActive
                      ? 'bg-purple-950 border-purple-500 text-purple-400'
                      : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-white'
                  }`}
                >
                  {isFilterActive ? 'MUTE' : 'DRIVE'}
                </button>
              </div>
            </div>

            <button
              onClick={handleRecalibrateRef}
              disabled={isCalibrating}
              className={`w-full py-2.5 rounded-xl border text-[9px] font-mono uppercase tracking-widest font-black transition ${
                isCalibrating
                  ? 'bg-purple-950 border-purple-500 text-purple-400 animate-pulse'
                  : 'bg-cyan-950/50 hover:bg-cyan-900 border border-cyan-800 text-cyan-400'
              }`}
            >
              {isCalibrating ? 'Autotuning carrier delays...' : 'Recalibrate GPS Reference'}
            </button>
          </div>

          <div className="bg-black border border-slate-900 rounded-xl p-3 h-28 overflow-y-auto scrollbar-none flex flex-col justify-between">
            <span className="text-[7.5px] font-mono text-slate-700 uppercase tracking-widest border-b border-slate-900 pb-1 block">Spoofing Audit logs</span>
            <div className="flex-grow font-mono text-[7px] text-slate-400 space-y-0.5 pt-1 overflow-y-auto">
              {logs.map((log, idx) => (
                <div key={idx} className="truncate">
                  <span className="text-cyan-500 pr-1">▶</span> {log}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Display right */}
        <div className="md:col-span-7 bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950 border border-slate-900 p-3 rounded-xl">
              <span className="text-[7.5px] font-mono text-slate-500 block">COORDINATE DRIFT X</span>
              <span className="text-sm font-black font-mono text-cyan-400 select-all">{driftX >= 0 ? '+' : ''}{driftX}°</span>
            </div>

            <div className="bg-slate-950 border border-slate-900 p-3 rounded-xl">
              <span className="text-[7.5px] font-mono text-slate-500 block">COORDINATE DRIFT Y</span>
              <span className="text-sm font-black font-mono text-cyan-400 select-all">{driftY >= 0 ? '+' : ''}{driftY}°</span>
            </div>
          </div>

          {/* Coordinate grid deviation */}
          <div className="bg-black border border-slate-900 p-4 h-32 rounded-xl flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#06b6d40f_1px,transparent_1px)] [background-size:12px_12px] opacity-40"></div>
            
            <div className="absolute h-px w-full bg-cyan-950/30"></div>
            <div className="absolute w-px h-full bg-cyan-950/30"></div>

            {/* Target indicator ring */}
            <div 
              className="absolute w-6 h-6 border-2 border-red-500 bg-red-500/10 rounded-full flex items-center justify-center transition-all duration-500"
              style={{
                top: `calc(50% + ${driftY * 1800}px)`,
                left: `calc(50% + ${driftX * 1800}px)`,
              }}
            >
              <div className="absolute w-12 h-12 border border-red-500/30 border-dashed rounded-full animate-spin"></div>
            </div>

            <div className="absolute bottom-2 right-2 text-[6.5px] font-mono text-slate-600 uppercase">
              GRID RESO: 0.001° DEVIATION SCALE
            </div>
          </div>

          <div className="bg-black/60 border border-slate-900 p-3 rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[7px] font-mono text-slate-500 uppercase block">Threat Level Audit</span>
              <span className={`text-xs font-mono font-black ${
                spoofRisk === 'CRITICAL' ? 'text-red-500 animate-bounce' : spoofRisk === 'HIGH' ? 'text-amber-500' : 'text-emerald-400'
              }`}>
                {spoofRisk === 'CRITICAL' ? 'CRITICAL_SPOOF_RISK' : spoofRisk === 'HIGH' ? 'HIGH_CARRIER_DRIFT' : 'NOMINAL_CLOCK_ALIGNED'}
              </span>
            </div>

            <span>
              {spoofRisk === 'LOW' ? (
                <div className="inline-flex items-center space-x-1.5 bg-emerald-950 text-emerald-400 border border-emerald-900 px-2 py-0.5 rounded text-[8px] font-mono font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>SECURE_ALIGNED</span>
                </div>
              ) : (
                <div className="inline-flex items-center space-x-1.5 bg-red-950 text-red-400 border border-red-900 px-2 py-0.5 rounded text-[8px] font-mono font-bold animate-pulse">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>SPOOF_DETECTOR_TRIGGER</span>
                </div>
              )}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
