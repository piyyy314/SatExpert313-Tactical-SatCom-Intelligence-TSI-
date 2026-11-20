import React, { useState } from 'react';
import { Settings, RefreshCw, Cpu, Database, Compass, Wifi, Check, AlertCircle } from 'lucide-react';

interface VsatState {
  azimuth: number;
  elevation: number;
  polarization: number;
  frequencyBand: 'KU_BAND' | 'KA_BAND' | 'C_BAND' | 'X_BAND';
  bucEnabled: boolean;
  lnbFrequency: number;
}

export const VSATConfig: React.FC = () => {
  const [config, setConfig] = useState<VsatState>({
    azimuth: 142.5,
    elevation: 32.4,
    polarization: 45.0,
    frequencyBand: 'KU_BAND',
    bucEnabled: true,
    lnbFrequency: 9750,
  });

  const [calibrating, setCalibrating] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>(['[VSAT] Parabolic transceiver initialized. Beacon locked on Inmarsat.']);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString([], { hour12: false })}] ${msg.toUpperCase()}`, ...prev].slice(0, 10));
  };

  const runAlignmentSweep = () => {
    if (calibrating) return;
    setCalibrating(true);
    addLog(`Initiating VSAT tracking mount autotune alignment...`);

    setTimeout(() => {
      setConfig(prev => ({
        ...prev,
        azimuth: Number((prev.azimuth + (Math.random() - 0.5) * 2.0).toFixed(2)),
        elevation: Number((prev.elevation + (Math.random() - 0.5) * 1.5).toFixed(2)),
        polarization: Number((prev.polarization + (Math.random() - 0.5) * 1.0).toFixed(2)),
      }));
      addLog(`Tracking motors adjusted. Feedhorn peak focus lock verified.`);
      setCalibrating(false);
    }, 1500);
  };

  const calculatedSnr = (() => {
    let base = 14.5;
    const azError = Math.abs(config.azimuth - 142.5);
    const elError = Math.abs(config.elevation - 32.4);
    const polError = Math.abs(config.polarization - 45.0);
    
    base -= (azError * 1.8) + (elError * 2.5) + (polError * 1.2);
    if (!config.bucEnabled) base -= 4;
    return Math.max(0, base).toFixed(2);
  })();

  return (
    <div className="p-6 bg-slate-950 border-2 border-slate-900 rounded-3xl text-slate-100 flex flex-col space-y-6 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div className="flex items-center space-x-3">
          <Settings className="w-5 h-5 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider font-mono">VSAT Feedhorn & Parabolic Controller</h3>
            <p className="text-[10px] text-slate-500 font-mono">Configure Very Small Aperture Terminal parameters, alignment angles, & transmit feed power</p>
          </div>
        </div>
        <span className="text-[7.5px] font-mono uppercase bg-slate-900 text-cyan-400 border border-cyan-900/40 px-2 py-0.5 rounded">
          VSAT_IF
        </span>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Alignment Gauges controls */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col space-y-4">
            <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest block font-mono">Mount Alignment offsets</span>

            {/* Azimuth offset */}
            <div className="space-y-1">
              <div className="flex justify-between text-[7px] font-mono text-slate-500 uppercase">
                <span>Azimuth Angle Offset</span>
                <span className="text-cyan-400 font-bold">{config.azimuth}°</span>
              </div>
              <input
                type="range"
                min={138.0}
                max={146.0}
                step={0.01}
                value={config.azimuth}
                onChange={(e) => setConfig(p => ({ ...p, azimuth: parseFloat(e.target.value) }))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            {/* Elevation offset */}
            <div className="space-y-1">
              <div className="flex justify-between text-[7px] font-mono text-slate-500 uppercase">
                <span>Elevation Angle Offset</span>
                <span className="text-cyan-400 font-bold">{config.elevation}°</span>
              </div>
              <input
                type="range"
                min={28.0}
                max={36.0}
                step={0.01}
                value={config.elevation}
                onChange={(e) => setConfig(p => ({ ...p, elevation: parseFloat(e.target.value) }))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            {/* Polarization angle */}
            <div className="space-y-1">
              <div className="flex justify-between text-[7px] font-mono text-slate-500 uppercase">
                <span>Polarization Tilt (SKEW)</span>
                <span className="text-cyan-400 font-bold">{config.polarization}°</span>
              </div>
              <input
                type="range"
                min={40.0}
                max={50.0}
                step={0.01}
                value={config.polarization}
                onChange={(e) => setConfig(p => ({ ...p, polarization: parseFloat(e.target.value) }))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={runAlignmentSweep}
              disabled={calibrating}
              className={`flex-grow py-2.5 rounded-xl border text-[9px] font-mono uppercase tracking-widest font-black transition ${
                calibrating
                  ? 'bg-purple-950/40 border-purple-500 text-purple-400 animate-pulse'
                  : 'bg-cyan-950/50 hover:bg-cyan-900 border border-cyan-800 text-cyan-400'
              }`}
            >
              {calibrating ? 'Autotuning mount motor...' : 'Peak Auto-Align Antenna'}
            </button>
          </div>
        </div>

        {/* Dynamic calculations page */}
        <div className="md:col-span-7 bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[7px] font-black uppercase text-slate-500 tracking-wider block font-mono">VSAT RX/TX Band Select</label>
              <select
                value={config.frequencyBand}
                onChange={(e) => {
                  setConfig(p => ({ ...p, frequencyBand: e.target.value as any }));
                  addLog(`VSAT Frequency band configured to: ${e.target.value}`);
                }}
                className="w-full bg-slate-950 border border-slate-900 rounded-xl px-2.5 py-1.5 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="KU_BAND">Ku-Band (12-18 GHz)</option>
                <option value="KA_BAND">Ka-Band (26-40 GHz)</option>
                <option value="C_BAND">C-Band (4-8 GHz)</option>
                <option value="X_BAND">X-Band (8-12 GHz)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[7px] font-black uppercase text-slate-500 tracking-wider block font-mono">UP-TRANSCEIVER POWER (BUC)</label>
              <div className="flex items-center justify-between bg-black border border-slate-900 p-1.5 rounded-xl">
                <span className="text-[8.5px] font-mono text-slate-400 uppercase font-bold pl-1">
                  {config.bucEnabled ? 'ENABLE (40 WATTS)' : 'SHUTDOWN_OFF'}
                </span>
                <button
                  onClick={() => {
                    setConfig(p => ({ ...p, bucEnabled: !p.bucEnabled }));
                    addLog(config.bucEnabled ? 'Power down BUC Amplifier.' : 'Igniting BUC high-power transceive mode.');
                  }}
                  className={`text-[8px] font-mono uppercase px-2 py-1 rounded border transition font-bold ${
                    config.bucEnabled
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-400'
                      : 'bg-red-950 border-red-500 text-red-400'
                  }`}
                >
                  {config.bucEnabled ? 'MUTE' : 'DRIVE'}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-black/60 border border-slate-900 p-3 rounded-2xl flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[7.5px] font-mono text-slate-500 uppercase">Calculated Local Carrier SNR</span>
              <div className="text-xl font-mono font-black text-cyan-400 flex items-baseline">
                {calculatedSnr} <span className="text-xs pl-1 font-normal select-none">dB</span>
              </div>
            </div>

            <div className="text-right">
              {parseFloat(calculatedSnr) > 10 ? (
                <div className="inline-flex items-center space-x-1.5 bg-emerald-950 text-emerald-400 border border-emerald-900 px-2.5 py-1 rounded-xl text-[8px] font-mono font-bold animate-pulse">
                  <Check className="w-3.5 h-3.5" />
                  <span>BEACON_LOCK_OPTIMAL</span>
                </div>
              ) : (
                <div className="inline-flex items-center space-x-1.5 bg-red-950 text-red-400 border border-red-900 px-2.5 py-1 rounded-xl text-[8px] font-mono font-bold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>MISALIGNED_DRIFT</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-black border border-slate-900 rounded-xl p-3 h-24 overflow-y-auto scrollbar-none flex flex-col justify-between">
            <span className="text-[7.5px] font-mono text-slate-700 uppercase tracking-widest border-b border-slate-900 pb-1 flex justify-between">
              <span>Feedhorn Telemetry Streams</span>
              <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${calibrating ? 'animate-spin' : ''}`} />
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

      </div>
    </div>
  );
};
