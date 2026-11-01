import React, { useState } from 'react';
import { Target, ShieldCheck, Cpu, Play, Pause, RefreshCw, KeyRound, Wifi, Radio } from 'lucide-react';
import { ModuleExportToolbar } from './ModuleExportToolbar.tsx';

interface DroneUnit {
  id: string;
  name: string;
  battery: number;
  altitude: number; // meters
  signalStrength: number; // dBm
  status: 'LAUNCHED' | 'STANDBY' | 'RETURNING';
}

interface SwarmProps {
  addMissionLog: (detail: string, status?: 'active' | 'success' | 'warning') => void;
}

export const DroneSwarmCommand: React.FC<SwarmProps> = ({ addMissionLog }) => {
  const [drones, setDrones] = useState<DroneUnit[]>([
    { id: '1', name: 'Relay-Drone Alpha', battery: 88, altitude: 120, signalStrength: -48, status: 'LAUNCHED' },
    { id: '2', name: 'Relay-Drone Beta', battery: 72, altitude: 110, signalStrength: -55, status: 'LAUNCHED' },
    { id: '3', name: 'Relay-Drone Gamma', battery: 94, altitude: 130, signalStrength: -42, status: 'STANDBY' },
  ]);

  const [swarmMode, setSwarmMode] = useState<'BROADCAST' | 'MUTE' | 'FOCUSED'>('BROADCAST');
  const [logs, setLogs] = useState<string[]>(['[SWARM] Aerial tactical command transponders active. Ready.']);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString([], { hour12: false })}] ${msg.toUpperCase()}`, ...prev].slice(0, 10));
  };

  const triggerCalibrationSweep = () => {
    addLog(`Broadcasting dynamic positioning vectors. Aligning quadcopter network mesh...`);
    addMissionLog(`DRONE_CALIBRATION_COMMENCED: Swarm spatial align sweeping triggered.`, 'active');

    setTimeout(() => {
      setDrones(prev => prev.map(d => ({
        ...d,
        altitude: d.altitude + Math.floor(Math.random() * 10 - 5),
        signalStrength: Math.min(-30, d.signalStrength + Math.floor(Math.random() * 8 - 3))
      })));
      addLog(`Aerial transceivers spatial layout locked. Core RSSI strength optimal.`);
      addMissionLog(`DRONE_CALIBRATION_SUCCESS: Swarm geographic mesh aligned successfully.`, 'success');
    }, 1200);
  };

  return (
    <div className="p-6 bg-slate-950 border-2 border-slate-900 rounded-3xl text-slate-100 flex flex-col space-y-6 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div className="flex items-center space-x-3">
          <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider font-mono">Quadcopter Relay Swarm Tactical Command</h3>
            <p className="text-[10px] text-slate-500 font-mono">Deploy, coordinate, and monitor localized micro-drone grids to establish line-of-sight RF bridges in obstructed terrain</p>
          </div>
        </div>
        <span className="text-[7.5px] font-mono uppercase bg-slate-900 text-cyan-405 border border-cyan-900/40 px-2 py-0.5 rounded">
          DRONE_C2
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Swarm details left */}
        <div className="md:col-span-8 space-y-4">
          <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest block font-mono">Active Quadcopter Drone assets</span>

          <div className="space-y-3">
            {drones.map((dr) => (
              <div key={dr.id} className="bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1 font-mono">
                  <div className="text-[10.5px] font-black text-slate-205 uppercase flex items-center space-x-2">
                    <Wifi className="w-4 h-4 text-cyan-453" />
                    <span>{dr.name}</span>
                  </div>
                  <div className="text-[7.5px] text-slate-455 uppercase flex flex-wrap gap-4">
                    <span>Altitude: {dr.altitude}m</span>
                    <span>Battery Status: {dr.battery}%</span>
                    <span>RSSI: {dr.signalStrength} dBm</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[7px] font-mono uppercase px-2 py-0.5 rounded border font-bold ${
                    dr.status === 'LAUNCHED' ? 'border-emerald-950 text-emerald-400 bg-emerald-950/15 animate-pulse' : 'border-slate-800 text-slate-500'
                  }`}>
                    {dr.status}
                  </span>
                  
                  {dr.status === 'STANDBY' && (
                    <button
                      onClick={() => {
                        setDrones(prev => prev.map(d => d.id === dr.id ? { ...d, status: 'LAUNCHED' } : d));
                        addLog(`Instructed ${dr.name} to ignite motors and climb to transceive cell altitude.`);
                      }}
                      className="bg-cyan-950/50 hover:bg-cyan-900 border border-cyan-800 text-cyan-405 px-2.5 py-1 rounded-xl text-[8.5px] font-mono uppercase font-black transition"
                    >
                      Ignite Launch
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-black/40 border border-slate-900 p-4 h-24 rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[7px] font-mono text-slate-500 block uppercase">Transit transmission mode</span>
              <div className="text-sm font-mono font-black text-cyan-400">
                ACTIVE_{swarmMode}_CELL
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSwarmMode('BROADCAST');
                  addLog('Drone Swarm switched to universal broadband broadcast mode.');
                }}
                className={`py-1 px-2.5 border rounded-lg font-mono text-[8px] font-black uppercase transition ${
                  swarmMode === 'BROADCAST' ? 'bg-cyan-950/40 border-cyan-500 text-cyan-400' : 'bg-slate-950 border-slate-900 text-slate-600'
                }`}
              >
                BROADCAST
              </button>
              <button
                onClick={() => {
                  setSwarmMode('FOCUSED');
                  addLog('Drone Swarm tuned to focused directional beam alignment.');
                }}
                className={`py-1 px-2.5 border rounded-lg font-mono text-[8px] font-black uppercase transition ${
                  swarmMode === 'FOCUSED' ? 'bg-cyan-950/40 border-cyan-500 text-cyan-400' : 'bg-slate-950 border-slate-900 text-slate-600'
                }`}
              >
                FOCUSED
              </button>
            </div>
          </div>
        </div>

        {/* Swarm status right */}
        <div className="md:col-span-4 bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest block font-mono">Quadcopter Audit Logs</span>

            <div className="bg-black border border-slate-900 p-3 h-52 rounded-xl overflow-y-auto scrollbar-none font-mono text-[7px] text-slate-400 space-y-1">
              {logs.map((log, idx) => (
                <div key={idx} className="truncate">
                  <span className="text-cyan-500 pr-1">▶</span> {log}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={triggerCalibrationSweep}
            className="w-full bg-cyan-950/50 hover:bg-cyan-900 border border-cyan-800 text-cyan-405 py-2.5 rounded-xl text-[9px] font-black font-mono uppercase tracking-wider transition"
          >
            Calibrate Swarm Positions
          </button>
        </div>

      </div>

      {/* Module Export Toolbar */}
      <ModuleExportToolbar
        moduleTitle="DRONE SWARM MESH COMMAND"
        moduleSubtitle="Quadcopter Mesh Network & Telemetry Matrix"
        classification="TOP SECRET // NOFORN"
        metadata={{
          'Swarm Operational Mode': swarmMode,
          'Active Quadcopters': drones.length,
          'Mesh Frequency': '2.485 GHz ISM / Sat-Relay Link'
        }}
        summaryText="Autonomous drone swarm mesh telemetry. Real-time signal strength, battery levels, and flight vector positions logged."
        columns={[
          { header: 'Drone Name', key: 'name' },
          { header: 'Battery (%)', key: 'battery' },
          { header: 'Altitude (m)', key: 'altitude' },
          { header: 'Signal (dBm)', key: 'signalStrength' },
          { header: 'Status', key: 'status' }
        ]}
        rows={drones}
        filenamePrefix="Drone_Swarm_Mesh"
      />
    </div>
  );
};
