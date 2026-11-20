import React, { useState, useEffect } from 'react';
import { Cpu, Zap, Thermometer, ShieldCheck, Activity, RefreshCw, Layers, Sparkles, Sliders, AlertTriangle } from 'lucide-react';

interface HardwareComponent {
  id: string;
  name: string;
  category: 'UPLINK_DISH' | 'BUC_AMPLIFIER' | 'LNB_DEMODULATOR' | 'DSP_BOARD';
  voltage: number; // Volts
  temperature: number; // °C
  load: number; // %
  status: 'NOMINAL' | 'OVERHEATED' | 'CALIBRATING';
}

interface InfrastructureProps {
  isStealthMode: boolean;
  addMissionLog?: (detail: string, status?: 'active' | 'success' | 'warning') => void;
}

export const Infrastructure: React.FC<InfrastructureProps> = ({ isStealthMode, addMissionLog }) => {
  const [hardware, setHardware] = useState<HardwareComponent[]>([
    { id: '1', name: 'Raw S-Band 4.5m Parabolic Uplink', category: 'UPLINK_DISH', voltage: 48.0, temperature: 18.2, load: 45, status: 'NOMINAL' },
    { id: '2', name: 'High-Power Block Upconverter (BUC)', category: 'BUC_AMPLIFIER', voltage: 28.5, temperature: 74.8, load: 88, status: 'NOMINAL' },
    { id: '3', name: 'Low Noise Block downconverter (LNB)', category: 'LNB_DEMODULATOR', voltage: 18.0, temperature: 24.5, load: 12, status: 'NOMINAL' },
    { id: '4', name: 'Spectrum Multi-Channel DSP Unit', category: 'DSP_BOARD', voltage: 5.0, temperature: 42.1, load: 62, status: 'NOMINAL' },
  ]);

  const [activeLogs, setActiveLogs] = useState<string[]>([
    '[INFRASTRUCTURE] Core transceiver hardware loop initialization completed.',
    '[INFRASTRUCTURE] Connected S-Band amplification stages reporting live voltages.',
  ]);

  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const addLog = (msg: string) => {
    setActiveLogs(prev => [
      `[${new Date().toLocaleTimeString([], { hour12: false })}] ${msg.toUpperCase()}`,
      ...prev,
    ].slice(0, 10));
  };

  // Random fluctuations
  useEffect(() => {
    const timer = setInterval(() => {
      setHardware(prev => prev.map(comp => {
        if (comp.status === 'CALIBRATING') return comp;
        
        let tempChange = parseFloat((Math.random() * 2 - 1).toFixed(1));
        let loadChange = Math.floor(Math.random() * 6 - 3);
        let nextTemp = comp.temperature + tempChange;
        
        // Ensure within limits
        nextTemp = Math.max(10, Math.min(100, nextTemp));
        let nextLoad = Math.max(0, Math.min(100, comp.load + loadChange));
        
        let status = comp.status;
        if (nextTemp > 80) {
          status = 'OVERHEATED';
        } else if (comp.status === 'OVERHEATED' && nextTemp <= 78) {
          status = 'NOMINAL';
        }

        return {
          ...comp,
          temperature: parseFloat(nextTemp.toFixed(1)),
          load: nextLoad,
          status
        };
      }));
    }, 1500);

    return () => clearInterval(timer);
  }, []);

  const triggerCooling = (id: string) => {
    const comp = hardware.find(h => h.id === id);
    if (!comp) return;

    addLog(`Activating cryogenic secondary cooling cycles on ${comp.name}`);
    if (addMissionLog) {
      addMissionLog(`INFRA_COOL: deploying secondary cooling cycles on ${comp.name}`, 'warning');
    }

    setHardware(prev => prev.map(h => {
      if (h.id === id) {
        return {
          ...h,
          temperature: parseFloat((h.temperature - 20).toFixed(1)),
          status: 'NOMINAL'
        };
      }
      return h;
    }));

    setTimeout(() => {
      addLog(`Thermal envelope sanitized. Cooling stabilization completed on ${comp.name}`);
      if (addMissionLog) {
        addMissionLog(`INFRA_COOL_STABLE: temperature stable on ${comp.name}`, 'success');
      }
    }, 1000);
  };

  const calibrateHardware = (id: string) => {
    const comp = hardware.find(h => h.id === id);
    if (!comp) return;

    addLog(`Initiating raw register phase calibration bounds on ${comp.name}`);
    if (addMissionLog) {
      addMissionLog(`INFRA_CALIBRATE: initiating raw register sweep on ${comp.name}`, 'active');
    }

    setHardware(prev => prev.map(h => h.id === id ? { ...h, status: 'CALIBRATING', load: 100 } : h));

    setTimeout(() => {
      setHardware(prev => prev.map(h => {
        if (h.id === id) {
          return {
            ...h,
            status: 'NOMINAL',
            voltage: h.category === 'UPLINK_DISH' ? 48.0 : h.category === 'BUC_AMPLIFIER' ? 28.5 : h.category === 'LNB_DEMODULATOR' ? 18.0 : 5.0,
            load: 45
          };
        }
        return h;
      }));
      addLog(`Calibration finalized successfully. Operational biases restored for ${comp.name}.`);
      if (addMissionLog) {
        addMissionLog(`INFRA_CALIBRATE_SUCCESS: restored nominal values for ${comp.name}`, 'success');
      }
    }, 1500);
  };

  return (
    <div className={`p-6 bg-slate-950 border-2 rounded-3xl text-slate-100 flex flex-col space-y-6 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 ${
      isStealthMode ? 'border-red-950' : 'border-slate-900'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div className="flex items-center space-x-3">
          <Cpu className={`w-5 h-5 ${isStealthMode ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`} />
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider font-mono">S-Bridge Core Hardware Infrastructure Supervisor</h3>
            <p className="text-[10px] text-slate-500 font-mono">Real-time health telemetry across ground parabolic transmitters, high-power BUC signal amplifiers, downconverters, and backplane DSPs</p>
          </div>
        </div>
        <span className={`text-[7.5px] font-mono uppercase bg-slate-900 px-2 py-0.5 rounded ${
          isStealthMode ? 'text-red-500 border border-red-950 animate-pulse' : 'text-cyan-400 border border-cyan-900/40'
        }`}>
          INFRA_GRID
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Core Controls Column Left */}
        <div className="lg:col-span-5 space-y-4 font-mono">
          <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col space-y-4">
            <span className="text-[8px] font-black uppercase text-slate-500 block tracking-widest">Macro Diagnostic Routines</span>

            <div className="bg-black border border-slate-900 p-3 rounded-2xl text-[8px] text-slate-500 leading-relaxed uppercase tracking-wider">
              Optimize infrastructure telemetry registers routinely. High BUC temperatures above 80°C introduce signal distortion fading, which directly degrades the active transponder lock performance.
            </div>

            <button
              onClick={() => {
                setIsRefreshing(true);
                addLog('Command broadcasting raw global power resets...');
                setTimeout(() => {
                  setHardware(prev => prev.map(h => ({
                    ...h,
                    temperature: Math.max(20, h.temperature - 10),
                    status: 'NOMINAL'
                  })));
                  setIsRefreshing(false);
                  addLog('Global power-line loop recycling complete. Nominal operations online.');
                }, 1200);
              }}
              disabled={isRefreshing}
              className={`w-full py-2.5 rounded-xl border text-[9px] font-black uppercase tracking-widest transition ${
                isRefreshing
                  ? 'bg-red-950 border-red-500 text-slate-200 animate-pulse'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-cyan-400'
              }`}
            >
              {isRefreshing ? 'Recycling hardware loops...' : 'Recycle Hardware Transceivers'}
            </button>
          </div>

          <div className="bg-black border border-slate-900 rounded-xl p-3 h-36 flex flex-col justify-between">
            <span className="text-[7.5px] font-mono text-slate-500 uppercase tracking-widest border-b border-slate-900 pb-1 block">Infrastructure Logs</span>
            <div className="flex-grow font-mono text-[7px] text-slate-400 space-y-0.5 pt-1.5 overflow-y-auto scrollbar-thin">
              {activeLogs.map((log, idx) => (
                <div key={idx} className="truncate">
                  <span className={`pr-1 ${isStealthMode ? 'text-red-500' : 'text-cyan-400'}`}>▶</span> {log}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Diagnostic Visualizer Metrics Column Right */}
        <div className="lg:col-span-7 bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col space-y-4 font-mono">
          <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest block">Active S-Bridge Backplane Hardware</span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {hardware.map((comp) => (
              <div key={comp.id} className="bg-black/60 border border-slate-900 p-4 rounded-xl flex flex-col justify-between space-y-3.5 relative overflow-hidden">
                {comp.status === 'OVERHEATED' ? (
                  <div className="absolute inset-x-0 top-0 h-1 bg-red-500 animate-pulse" />
                ) : null}

                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[6.5px] text-slate-500 uppercase block tracking-wider">{comp.category}</span>
                    <strong className="text-[10px] text-slate-200 uppercase leading-none">{comp.name}</strong>
                  </div>
                  <span className={`text-[6px] px-1.5 py-0.5 font-bold uppercase rounded border ${
                    comp.status === 'NOMINAL'
                      ? 'border-emerald-950 text-emerald-400 bg-emerald-950/10'
                      : comp.status === 'CALIBRATING'
                      ? 'border-cyan-900 text-cyan-400 bg-cyan-950/15 animate-pulse'
                      : 'border-red-900 text-red-500 bg-red-950/15 animate-bounce'
                  }`}>
                    {comp.status}
                  </span>
                </div>

                {/* Sub meters */}
                <div className="grid grid-cols-3 gap-2 text-[7.5px] border-t border-slate-900/60 pt-2 text-slate-400 bg-slate-950/20 p-1.5 rounded-lg">
                  <div>
                    <span className="block text-slate-500 uppercase">Bias Pot</span>
                    <strong>{comp.voltage.toFixed(1)} V</strong>
                  </div>
                  <div>
                    <span className="block text-slate-500 uppercase">Temp</span>
                    <strong className={`${comp.status === 'OVERHEATED' ? 'text-red-400 animate-pulse font-black' : ''}`}>{comp.temperature}°C</strong>
                  </div>
                  <div>
                    <span className="block text-slate-500 uppercase">Load</span>
                    <strong>{comp.load}%</strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => triggerCooling(comp.id)}
                    disabled={comp.status === 'CALIBRATING'}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-cyan-400 py-1 rounded-lg text-[7px] uppercase tracking-wider transition font-black"
                  >
                    Cool Loop
                  </button>
                  <button
                    onClick={() => calibrateHardware(comp.id)}
                    disabled={comp.status === 'CALIBRATING'}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-cyan-400 py-1 rounded-lg text-[7px] uppercase tracking-wider transition font-black"
                  >
                    Calibrate
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-900 pt-3 flex items-center justify-between text-[7px] text-slate-600 uppercase">
            <span>Hardware limits aligned with MIL-STD hardware specifications</span>
            <span className="text-emerald-400 font-black flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> HARDWARE OK
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
