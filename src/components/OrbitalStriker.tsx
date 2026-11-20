import React, { useState, useEffect } from 'react';
import { Target, ShieldAlert, Cpu, RefreshCw, Zap, Play, Pause, AlertTriangle } from 'lucide-react';

interface StrikerWeapon {
  id: string;
  name: string;
  chargeTime: number; // seconds
  damageRating: string;
  codename: string;
}

const WEAPONS: StrikerWeapon[] = [
  { id: '1', name: 'Kinetic Tungsten Rod (Thor\'s Hammer)', chargeTime: 10, damageRating: 'EXTREME', codename: 'K_STRIKE_THOR' },
  { id: '2', name: 'High-Alt Electromagnetic EMP Burst', chargeTime: 6, damageRating: 'SYSTEM_MUTE', codename: 'EMP_VULCAN' },
];

interface StrikerProps {
  addMissionLog: (detail: string, status?: 'active' | 'success' | 'warning') => void;
}

export const OrbitalStriker: React.FC<StrikerProps> = ({ addMissionLog }) => {
  const [selectedWep, setSelectedWep] = useState<StrikerWeapon>(WEAPONS[0]);
  const [targetCoords, setTargetCoords] = useState<string>('37.4221°N, 122.0841°W');
  const [isCharging, setIsCharging] = useState<boolean>(false);
  const [chargeLevel, setChargeLevel] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>(['[STRIKER] Orbital kinetic systems locked in standby posture.']);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString([], { hour12: false })}] ${msg.toUpperCase()}`, ...prev].slice(0, 10));
  };

  useEffect(() => {
    if (!isCharging) return;

    const interval = setInterval(() => {
      setChargeLevel(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsCharging(false);
          addLog(`KINETIC Launcher payload fully charged. Discharging beam strike on ${targetCoords}`);
          addMissionLog(`ORBITAL_STRIKE_SUCCESS: targeted strike discharged on ${targetCoords}`, 'warning');
          return 100;
        }
        return prev + 10;
      });
    }, 300);

    return () => clearInterval(interval);
  }, [isCharging, targetCoords]);

  const handleLaunchStrike = () => {
    if (isCharging) return;
    setIsCharging(true);
    setChargeLevel(0);
    addLog(`Targeting vector locked: ${targetCoords}. Initiating main capacitor charge cycles for ${selectedWep.name}...`);
    addMissionLog(`ORBITAL_STRIKE_CHARGING: ${selectedWep.name} locks on ${targetCoords}`, 'active');
  };

  return (
    <div className="p-6 bg-slate-950 border-2 border-slate-900 rounded-3xl text-slate-100 flex flex-col space-y-6 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div className="flex items-center space-x-3">
          <Target className="w-5 h-5 text-red-500 animate-spin" style={{ animationDuration: '4s' }} />
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider font-mono">Orbital Kinetic Strike Targeting Console</h3>
            <p className="text-[10px] text-slate-500 font-mono font-mono font-mono">Select, charge, and visually align space-borne kinetic defense vectors against verified satellite tracking jam structures</p>
          </div>
        </div>
        <span className="text-[7.5px] font-mono uppercase bg-slate-900 text-red-400 border border-red-950 px-2 py-0.5 rounded">
          ORB_FIRE
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left selector inputs */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col space-y-4">
            <span className="text-[8px] font-black uppercase text-slate-500 block font-mono">Striking Configurations</span>

            <div className="space-y-1">
              <label className="text-[7px] font-mono text-slate-500 uppercase">Target Strike Coordinates</label>
              <input
                type="text"
                value={targetCoords}
                onChange={(e) => setTargetCoords(e.target.value)}
                className="w-full bg-black border border-slate-900 rounded-xl px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="space-y-1 text-[8.5px] font-mono">
              <label className="text-[7px] font-mono text-slate-500 uppercase">Select Space Weapon</label>
              <div className="grid grid-cols-1 gap-2">
                {WEAPONS.map(w => (
                  <button
                    key={w.id}
                    onClick={() => {
                      setSelectedWep(w);
                      setChargeLevel(0);
                      addLog(`Armed target launcher payload: ${w.name}`);
                    }}
                    className={`text-left p-2.5 rounded-xl border flex flex-col space-y-1 transition ${
                      selectedWep.id === w.id
                        ? 'bg-red-950 border-red-500 text-red-400 font-bold'
                        : 'bg-slate-950 border-slate-900/60 text-slate-500 hover:text-slate-400'
                    }`}
                  >
                    <span>{w.name}</span>
                    <span className="text-[6.5px] text-slate-500">CODENAME: {w.codename}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleLaunchStrike}
              disabled={isCharging}
              className={`w-full py-2.5 rounded-xl border text-[9px] font-mono uppercase tracking-widest font-black transition ${
                isCharging
                  ? 'bg-red-950 border-red-500 text-slate-200 animate-pulse'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-red-400'
              }`}
            >
              {isCharging ? 'Charging Weapon Systems...' : 'Trigger Orbital Fire'}
            </button>
          </div>

          <div className="bg-black border border-slate-900 rounded-xl p-3 h-28 flex flex-col justify-between">
            <span className="text-[7.5px] font-mono text-slate-700 uppercase tracking-widest border-b border-slate-900 pb-1 block">Striker System Logs</span>
            <div className="flex-grow font-mono text-[7px] text-slate-400 space-y-0.5 pt-1 overflow-y-auto scrollbar-none">
              {logs.map((log, idx) => (
                <div key={idx} className="truncate">
                  <span className="text-red-500 pr-1">▶</span> {log}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right tracking display */}
        <div className="md:col-span-7 bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950 border border-slate-900 p-3 rounded-xl">
              <span className="text-[7.5px] font-mono text-slate-500 block">WEAPON CODENAME</span>
              <span className="text-xs font-mono font-black text-slate-200">{selectedWep.codename}</span>
            </div>

            <div className="bg-slate-950 border border-slate-900 p-3 rounded-xl flex flex-col justify-between">
              <span className="text-[7.5px] font-mono text-slate-500 block">DAMAGE CRITERIA</span>
              <span className="text-xs font-mono font-bold text-red-500 uppercase">{selectedWep.damageRating}</span>
            </div>
          </div>

          {/* Bar charge level indicator */}
          <div className="bg-black border border-slate-900 p-4 rounded-xl flex flex-col justify-between h-20">
            <div className="flex justify-between items-center text-[7.5px] font-mono text-slate-500 uppercase pb-1">
              <span>Capacitor Charge Bar Status</span>
              <span className="text-cyan-400 font-bold">{chargeLevel}%</span>
            </div>
            <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-950">
              <div 
                className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-amber-400 transition-all duration-300"
                style={{ width: `${chargeLevel}%` }}
              />
            </div>
          </div>

          <div className="bg-black border border-slate-900 p-3 rounded-xl flex items-center space-x-2">
            <AlertTriangle className={`w-4 h-4 ${isCharging ? 'text-red-500 animate-bounce' : 'text-slate-600'}`} />
            <span className="text-[7.5px] font-mono text-slate-700 uppercase font-medium leading-relaxed">
              Caution: Triggering kinetic strike requires formal clearance authority under international orbital treaties.
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
