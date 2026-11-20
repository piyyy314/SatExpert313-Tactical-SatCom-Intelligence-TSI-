import React, { useState } from 'react';
import { 
  MapPin, Radio, Shield, HelpCircle, AlertTriangle, 
  Clock, Sun, CloudRain, CloudAlert, Compass, Globe, 
  Wifi, RefreshCw, Cpu, Flame, Ship, AlertOctagon
} from 'lucide-react';
import { Satellite, Coordinates, WeatherCondition, TacticalEvent } from '../types.ts';

export interface HormuzFireAlert {
  active: boolean;
  vesselName: string;
  vesselType: string;
  coordinates: string;
  frp: number;
  incidentType: string;
  timestamp: string;
}

interface TacticalHUDProps {
  loc: Coordinates;
  sat: Satellite;
  satellites: Satellite[];
  onLocChange: (loc: Coordinates) => void;
  onSatChange: (sat: Satellite) => void;
  onSatellitesUpdate?: (sats: Satellite[]) => void;
  isTracking: boolean;
  onTrackingChange: (isTracking: boolean) => void;
  isJamming: boolean;
  setIsJamming: (isJamming: boolean) => void;
  jammingPower: number;
  setJammingPower: (power: number) => void;
  isDecoyActive: boolean;
  setIsDecoyActive: (active: boolean) => void;
  isZPEActive: boolean;
  setIsZPEActive: (active: boolean) => void;
  weather: WeatherCondition;
  setWeather: (weather: WeatherCondition) => void;
  isStealthMode: boolean;
  telemetry: any;
  eventLogs: TacticalEvent[];
  setEventLogs: React.Dispatch<React.SetStateAction<TacticalEvent[]>>;
  hasNewLogs: boolean;
  setHasNewLogs: (hasNew: boolean) => void;
  hormuzFireAlert?: HormuzFireAlert | null;
  onDismissHormuzAlert?: () => void;
  onOpenMaritimeMonitor?: () => void;
  onFocusHormuzChokepoint?: () => void;
}

export const TacticalHUD: React.FC<TacticalHUDProps> = ({
  loc,
  sat,
  satellites,
  onLocChange,
  onSatChange,
  isTracking,
  onTrackingChange,
  isJamming,
  setIsJamming,
  jammingPower,
  setJammingPower,
  isDecoyActive,
  setIsDecoyActive,
  isZPEActive,
  setIsZPEActive,
  weather,
  setWeather,
  isStealthMode,
  telemetry,
  eventLogs,
  setEventLogs,
  setHasNewLogs,
  hormuzFireAlert,
  onDismissHormuzAlert,
  onOpenMaritimeMonitor,
  onFocusHormuzChokepoint
}) => {
  const [latInput, setLatInput] = useState(loc.lat.toString());
  const [lngInput, setLngInput] = useState(loc.lng.toString());
  const [isCoordinatesExpanded, setIsCoordinatesExpanded] = useState(false);

  const handleCoordinatesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      onLocChange({ lat, lng });
      const newEvent: TacticalEvent = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString([], { hour12: false }),
        satName: sat.name,
        satId: sat.id,
        status: 'INFO',
        detail: `COORDINATES REMAPPED: STATION SHIFTED TO ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`
      };
      setEventLogs(prev => [newEvent, ...prev].slice(0, 50));
      setHasNewLogs(true);
    }
  };

  const handleSatSelect = (satId: string) => {
    const selected = satellites.find(s => s.id === satId);
    if (selected) {
      onSatChange(selected);
      const newEvent: TacticalEvent = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString([], { hour12: false }),
        satName: selected.name,
        satId: selected.id,
        status: 'active',
        detail: `SATELLITE HANDSHAKE INITIATED: TARGET EXTRACTED AT O_SLOT: ${selected.orbitalSlot}`
      };
      setEventLogs(prev => [newEvent, ...prev].slice(0, 50));
      setHasNewLogs(true);
    }
  };

  const toggleJamming = () => {
    const nextJamming = !isJamming;
    setIsJamming(nextJamming);
    const newEvent: TacticalEvent = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString([], { hour12: false }),
      satName: sat.name,
      satId: sat.id,
      status: nextJamming ? 'CRITICAL' : 'INFO',
      detail: nextJamming 
        ? `TACTICAL ELECTROMAGNETIC INTRUSION: SPECTRUM NOISE INJECTED [${jammingPower}mW]` 
        : `JAMMING CORRELATION SUSPENDED: NORMAL SPECTRUM LOCK RESTORED`
    };
    setEventLogs(prev => [newEvent, ...prev].slice(0, 50));
    setHasNewLogs(true);
  };

  const setWeatherCondition = (cond: WeatherCondition) => {
    setWeather(cond);
    const newEvent: TacticalEvent = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString([], { hour12: false }),
      satName: sat.name,
      satId: sat.id,
      status: cond === 'HEAVY_STORM' ? 'CRITICAL' : 'INFO',
      detail: `ATMOSPHERIC MODEL RECONFIGURED: SIMULATED SHIELD SET TO [${cond}]`
    };
    setEventLogs(prev => [newEvent, ...prev].slice(0, 50));
    setHasNewLogs(true);
  };

  // Quick preset locations to help engineers immediately test links
  const PRESET_STATIONS = [
    { name: "Norfolk Base", lat: 36.8508, lng: -76.2859 },
    { name: "Svalbard Gnd", lat: 78.2232, lng: 15.6267 },
    { name: "Doha Terminal", lat: 25.2854, lng: 51.5310 },
    { name: "Pine Gap", lat: -23.7984, lng: 133.7374 },
  ];

  return (
    <div className={`p-5 rounded-3xl border-2 transition-all duration-300 flex flex-col space-y-5 select-none ${
      isStealthMode 
        ? 'bg-black/95 border-purple-900/50 shadow-[0_0_35px_rgba(168,85,247,0.06)]' 
        : 'bg-slate-950/90 border-slate-800 shadow-xl'
    }`}>
      {/* Title Deck */}
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className={`h-2.5 w-2.5 rounded-full ${isStealthMode ? 'bg-purple-500 animate-pulse' : 'bg-cyan-500 animate-ping'}`} />
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-200 font-mono">
            UPLINK_MASTER_DECK
          </h2>
        </div>
        <span className="text-[8px] font-mono text-slate-500 tracking-widest uppercase">
          TSI_STATION_CMD
        </span>
      </div>

      {/* Visual Flashing Warning for Strait of Hormuz Maritime Fires */}
      {hormuzFireAlert?.active && (
        <div className="p-3.5 bg-red-950/90 border-2 border-red-500 rounded-2xl flex flex-col space-y-2 shadow-[0_0_25px_rgba(239,68,68,0.7)] animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Flame className="w-4 h-4 text-red-400 animate-bounce" />
              <Ship className="w-4 h-4 text-cyan-300" />
              <span className="text-[10px] font-mono font-black text-red-100 tracking-wider uppercase">
                [HORMUZ EMERGENCY] NEW MARITIME SHIP FIRE
              </span>
            </div>
            <span className="text-[7.5px] font-mono bg-red-600 text-white px-1.5 py-0.5 rounded font-black uppercase tracking-wider animate-ping">
              FLASH ALERT
            </span>
          </div>

          <div className="text-[9px] font-mono text-red-200 space-y-1 bg-black/60 p-2.5 rounded-xl border border-red-800/80">
            <div className="flex items-center justify-between">
              <span>VESSEL: <strong className="text-white">{hormuzFireAlert.vesselName}</strong></span>
              <span className="text-amber-400 font-bold">{hormuzFireAlert.vesselType}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>COORDS: <strong className="text-amber-300">{hormuzFireAlert.coordinates}</strong></span>
              <span>FRP: <strong className="text-red-400 font-bold">{hormuzFireAlert.frp} MW</strong></span>
            </div>
            <div className="text-red-300 text-[8.5px] pt-1 border-t border-red-900/60 truncate">
              ⚠️ {hormuzFireAlert.incidentType}
            </div>
          </div>

          <div className="flex items-center space-x-1.5 pt-1">
            {onOpenMaritimeMonitor && (
              <button
                type="button"
                onClick={onOpenMaritimeMonitor}
                className="flex-1 py-1.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500 text-cyan-300 text-[8.5px] font-mono font-bold rounded-lg uppercase transition flex items-center justify-center space-x-1 shadow-sm"
              >
                <Ship className="w-3 h-3 text-cyan-400" />
                <span>MARITIME MONITOR</span>
              </button>
            )}
            {onFocusHormuzChokepoint && (
              <button
                type="button"
                onClick={onFocusHormuzChokepoint}
                className="flex-1 py-1.5 bg-red-900 hover:bg-red-800 border border-red-500 text-white text-[8.5px] font-mono font-black rounded-lg uppercase transition flex items-center justify-center space-x-1 shadow-sm"
              >
                <Compass className="w-3 h-3 text-red-200" />
                <span>FOCUS HORMUZ</span>
              </button>
            )}
            {onDismissHormuzAlert && (
              <button
                type="button"
                onClick={onDismissHormuzAlert}
                className="px-2 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 text-[8px] font-mono rounded-lg uppercase transition"
              >
                SILENCE
              </button>
            )}
          </div>
        </div>
      )}

      {/* Target Satellite Selection */}
      <div className="flex flex-col space-y-1.5">
        <label className="text-[8px] font-black uppercase tracking-widest text-slate-500 flex items-center space-x-1.5">
          <Globe className="w-3 h-3 text-slate-600" />
          <span>Locked Orbital Node</span>
        </label>
        <select
          value={sat.id}
          onChange={(e) => handleSatSelect(e.target.value)}
          className={`w-full bg-slate-950 text-xs font-mono px-3.5 py-2.5 rounded-xl border appearance-none cursor-pointer focus:outline-none transition ${
            isStealthMode 
              ? 'border-purple-950 text-purple-300 focus:border-purple-500' 
              : 'border-slate-800 text-slate-200 focus:border-cyan-500'
          }`}
        >
          {satellites.map((s) => (
            <option key={s.id} value={s.id} className="bg-slate-950 text-slate-200">
              {s.name} ({s.orbitalSlot}) [{s.operator || 'UNKNOWN'}]
            </option>
          ))}
        </select>
      </div>

      {/* Point of Presence Station Coordinates */}
      <div className="flex flex-col space-y-1.5">
        <div className="flex items-center justify-between">
          <button 
            type="button"
            onClick={() => setIsCoordinatesExpanded(!isCoordinatesExpanded)}
            className="text-[8px] font-black uppercase tracking-widest text-slate-500 flex items-center space-x-1.5 hover:text-slate-300 transition"
          >
            <MapPin className="w-3 h-3 text-slate-600" />
            <span>Remap Terminal Position</span>
            <span className="text-[7px] text-cyan-500 font-mono">[{isCoordinatesExpanded ? "HIDE" : "MANUAL_INPUT"}]</span>
          </button>
          
          <span className="text-[9px] font-mono font-bold text-slate-300 bg-slate-900/60 border border-slate-800 px-2 py-0.5 rounded-lg">
            {loc.lat.toFixed(4)}°N, {loc.lng.toFixed(4)}°E
          </span>
        </div>

        {isCoordinatesExpanded ? (
          <form onSubmit={handleCoordinatesSubmit} className="bg-slate-950/40 p-3.5 border border-slate-800 rounded-2xl space-y-3.5 mt-1.5 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col space-y-1">
                <span className="text-[7px] font-mono text-slate-500 uppercase tracking-wider">Latitude [-90 to 90]</span>
                <input 
                  type="text" 
                  value={latInput} 
                  onChange={(e) => setLatInput(e.target.value)}
                  className="bg-slate-950 text-[10px] font-mono px-2.5 py-1.5 rounded-lg border border-slate-800 text-slate-300 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-[7px] font-mono text-slate-500 uppercase tracking-wider">Longitude [-180 to 180]</span>
                <input 
                  type="text" 
                  value={lngInput} 
                  onChange={(e) => setLngInput(e.target.value)}
                  className="bg-slate-950 text-[10px] font-mono px-2.5 py-1.5 rounded-lg border border-slate-800 text-slate-300 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
            <button 
              type="submit"
              className="w-full py-1.5 bg-cyan-950/50 hover:bg-cyan-900 border border-cyan-800 text-cyan-400 font-mono text-[9px] font-black uppercase tracking-widest rounded-lg transition"
            >
              Lock Terminal Coordinates
            </button>
          </form>
        ) : null}

        {/* Preset selections */}
        <div className="grid grid-cols-4 gap-1.5 pt-1">
          {PRESET_STATIONS.map((preset) => {
            const active = Math.abs(loc.lat - preset.lat) < 0.05 && Math.abs(loc.lng - preset.lng) < 0.05;
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => {
                  onLocChange({ lat: preset.lat, lng: preset.lng });
                  setLatInput(preset.lat.toString());
                  setLngInput(preset.lng.toString());
                  const newEvent: TacticalEvent = {
                    id: Math.random().toString(36).substr(2, 9),
                    timestamp: new Date().toLocaleTimeString([], { hour12: false }),
                    satName: sat.name,
                    satId: sat.id,
                    status: 'INFO',
                    detail: `POSITION CLASSIFICATION SHIFTED: RELOCATED TO [${preset.name.toUpperCase()}]`
                  };
                  setEventLogs(prev => [newEvent, ...prev].slice(0, 50));
                  setHasNewLogs(true);
                }}
                className={`py-1 rounded font-mono text-[7px] font-bold text-center border uppercase transition-all whitespace-nowrap ${
                  active 
                    ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400 font-black' 
                    : 'bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-300 hover:border-slate-800'
                }`}
              >
                {preset.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Atmospheric Fading Simulation */}
      <div className="flex flex-col space-y-1.5">
        <label className="text-[8px] font-black uppercase tracking-widest text-slate-500 flex items-center space-x-1.5">
          <CloudRain className="w-3 h-3 text-slate-600" />
          <span>Atmospheric Attenuation / Rain Fade</span>
        </label>
        <div className="grid grid-cols-4 gap-1.5">
          {(['CLEAR', 'OVERCAST', 'LIGHT_RAIN', 'HEAVY_STORM'] as WeatherCondition[]).map((wCond) => (
            <button
              key={wCond}
              type="button"
              onClick={() => setWeatherCondition(wCond)}
              className={`py-1.5 rounded-xl border flex flex-col items-center justify-center space-y-1 transition ${
                weather === wCond
                  ? 'bg-slate-900 border-slate-700 text-cyan-400 font-bold'
                  : 'bg-slate-950 border-slate-900/50 text-slate-500 hover:text-slate-400'
              }`}
            >
              {wCond === 'CLEAR' && <Sun className="w-3.5 h-3.5" />}
              {wCond === 'OVERCAST' && <CloudRain className="w-3.5 h-3.5 text-slate-400" />}
              {wCond === 'LIGHT_RAIN' && <CloudRain className="w-3.5 h-3.5 text-cyan-400" />}
              {wCond === 'HEAVY_STORM' && <CloudAlert className="w-3.5 h-3.5 text-red-500 animate-pulse" />}
              <span className="text-[6.5px] font-mono tracking-wider font-extrabold">{wCond}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Electronic Jamming injecter */}
      <div className={`p-3.5 rounded-2xl border flex flex-col space-y-2.5 transition ${
        isJamming 
          ? 'bg-red-950/10 border-red-900/30' 
          : 'bg-slate-950/40 border-slate-900/60'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Radio className={`w-3.5 h-3.5 ${isJamming ? 'text-red-500 animate-bounce' : 'text-slate-500'}`} />
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
              RF Spectral Intrusion Simulation
            </span>
          </div>
          <button
            type="button"
            onClick={toggleJamming}
            className={`px-3 py-1 text-[8px] font-mono rounded border uppercase transition font-black ${
              isJamming 
                ? 'bg-red-500 text-white border-red-400 shadow-[0_0_8px_rgba(239,68,68,0.2)]' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {isJamming ? "ACTIVE" : "OFFLINE"}
          </button>
        </div>

        {isJamming && (
          <div className="flex flex-col space-y-1 mt-1.5 animate-in fade-in">
            <div className="flex items-center justify-between text-[7px] font-mono text-slate-500">
              <span>JAMMING NOISE DENSITY:</span>
              <span className="text-red-400 font-extrabold">{jammingPower} mW / MHz</span>
            </div>
            <input 
              type="range" 
              min="10" 
              max="99" 
              value={jammingPower}
              onChange={(e) => setJammingPower(parseInt(e.target.value))}
              className="w-full accent-red-500 bg-slate-900 h-1 rounded cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* Passive Countermeasures quick switches */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Spectral Decoy Switch */}
        <button
          type="button"
          onClick={() => {
            const nextDecoy = !isDecoyActive;
            setIsDecoyActive(nextDecoy);
            const newEvent: TacticalEvent = {
              id: Math.random().toString(36).substr(2, 9),
              timestamp: new Date().toLocaleTimeString([], { hour12: false }),
              satName: sat.name,
              satId: sat.id,
              status: 'INFO',
              detail: nextDecoy 
                ? `ANALOG COUNTERMEASURE ENGAGED: SPECTRAL COHERENT DECOY BROADCASTING AT OFFSET` 
                : `DECOY INTRUSION DISSOLVED: STANDBY RECALIBRATION COMPLETE`
            };
            setEventLogs(prev => [newEvent, ...prev].slice(0, 50));
            setHasNewLogs(true);
          }}
          className={`p-2.5 rounded-xl border flex flex-col items-center justify-center space-y-1 transition relative ${
            isDecoyActive 
              ? 'bg-purple-950/20 border-purple-500 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.15)] font-bold' 
              : 'bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-400'
          }`}
        >
          <span className="text-[8px] font-black tracking-widest uppercase">DECOY TRANS.</span>
          <span className="text-[7px] font-mono font-bold">{isDecoyActive ? "EMITTING" : "STANDBY"}</span>
        </button>

        {/* Dynamic Coolant/ZPE Switch */}
        <button
          type="button"
          onClick={() => {
            const nextZPE = !isZPEActive;
            setIsZPEActive(nextZPE);
            const newEvent: TacticalEvent = {
              id: Math.random().toString(36).substr(2, 9),
              timestamp: new Date().toLocaleTimeString([], { hour12: false }),
              satName: sat.name,
              satId: sat.id,
              status: 'INFO',
              detail: nextZPE 
                ? `CRYO COOLING: ZERO-POINT GROUNDING OVERCLOCK ACTIVE. THERMAL SIGNATURE CLIPPED` 
                : `DYNAMIC THERMIONIC COOLER RECYCLED`
            };
            setEventLogs(prev => [newEvent, ...prev].slice(0, 50));
            setHasNewLogs(true);
          }}
          className={`p-2.5 rounded-xl border flex flex-col items-center justify-center space-y-1 transition relative ${
            isZPEActive 
              ? 'bg-cyan-950/25 border-cyan-500 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.15)] font-bold' 
              : 'bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-400'
          }`}
        >
          <span className="text-[8px] font-black tracking-widest uppercase">ZPE GROUNDING</span>
          <span className="text-[7px] font-mono font-bold">{isZPEActive ? "REDUCED THERMAL" : "OFFLINE"}</span>
        </button>
      </div>

      {/* Live Tactical Event logs inside HUD */}
      <div className="flex flex-col space-y-1 mx-0.5">
        <div className="flex items-center justify-between text-[8px] font-black text-slate-500 uppercase tracking-widest">
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3 text-slate-600" />
            <span>Station Command Event Logs</span>
          </div>
          <span>REALTIME</span>
        </div>
        
        <div className="h-24 bg-slate-950 border border-slate-900 rounded-2xl p-2.5 overflow-y-auto space-y-1.5 scrollbar-thin">
          {eventLogs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-[7px] font-mono text-slate-600 uppercase tracking-widest">
              No incidents logged for {sat.name}
            </div>
          ) : (
            eventLogs.map((log) => (
              <div key={log.id} className="text-[7.5px] font-mono flex items-start space-x-1.5 leading-snug">
                <span className="text-slate-600 font-bold whitespace-nowrap">{log.timestamp}</span>
                <span className={`font-black uppercase [font-size:7px] px-1 py-[0.1px] rounded ${
                  log.status === 'CRITICAL' || log.status === 'BREACH'
                    ? 'bg-red-950 border border-red-900 text-red-500'
                    : log.status === 'warning'
                    ? 'bg-purple-950 border border-purple-900 text-purple-400'
                    : 'bg-slate-900 border border-slate-800 text-cyan-400'
                }`}>
                  {log.status}
                </span>
                <span className="text-slate-300 break-normal [letter-spacing:-0.01em]">
                  {log.detail}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
