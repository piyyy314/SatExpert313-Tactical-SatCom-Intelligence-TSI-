import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Ship, Flame, AlertTriangle, Radio, Compass, Anchor, ShieldAlert, 
  RefreshCw, Search, Eye, Filter, Crosshair, ArrowUpRight, Zap, 
  MapPin, Clock, Satellite as SatIcon, Volume2, VolumeX, CheckCircle, 
  ExternalLink, Layers, Navigation, Shield, AlertOctagon, Info
} from 'lucide-react';
import { 
  AisVessel, 
  HORMUZ_AIS_VESSELS, 
  HORMUZ_SHIPPING_LANES, 
  ShippingLane, 
  computeVesselFireProximity, 
  calculateDistanceNm 
} from '../utils/maritimeAisData.ts';
import { 
  HORMUZ_MARITIME_FIRES, 
  MIDDLE_EAST_LAND_FIRES, 
  ALL_MIDDLE_EAST_AND_HORMUZ_FIRES,
  FireDetection 
} from '../utils/heatmapData.ts';
import { nasaFirmsService } from '../services/nasaFirmsService.ts';
import { audioController } from '../services/audioService.ts';
import { TacticalEvent } from '../types.ts';

interface MaritimeFireMonitorProps {
  onSelectFireOnMap?: (fire: FireDetection) => void;
  onOpenTacticalMap?: () => void;
  onTriggerAlert?: (vessel: AisVessel, fire: FireDetection) => void;
  eventLogs?: TacticalEvent[];
  addMissionLog?: (detail: string, status?: string) => void;
  isStealthMode?: boolean;
}

export const MaritimeFireMonitor: React.FC<MaritimeFireMonitorProps> = ({
  onSelectFireOnMap,
  onOpenTacticalMap,
  onTriggerAlert,
  addMissionLog,
  isStealthMode = false
}) => {
  const [vessels, setVessels] = useState<AisVessel[]>(HORMUZ_AIS_VESSELS);
  const [selectedVessel, setSelectedVessel] = useState<AisVessel | null>(HORMUZ_AIS_VESSELS[0]);
  const [selectedFire, setSelectedFire] = useState<FireDetection | null>(HORMUZ_MARITIME_FIRES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'ON_FIRE' | 'CRITICAL_PROXIMITY' | 'TANKERS' | 'TSS_ONLY'>('ALL');
  const [activeTab, setActiveTab] = useState<'MAP' | 'ROSTER' | 'FIRMS_FEED' | 'LANES' | 'SATELLITES'>('MAP');
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isSimulatingPass, setIsSimulatingPass] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(nasaFirmsService.getLastSyncTime());
  const [hoveredEntity, setHoveredEntity] = useState<{ type: 'vessel' | 'fire' | 'lane'; data: any } | null>(null);
  const [alertSuccessMsg, setAlertSuccessMsg] = useState<string | null>(null);

  // Sync with NASA FIRMS service
  useEffect(() => {
    const unsub = nasaFirmsService.subscribe(() => {
      setLastSyncTime(nasaFirmsService.getLastSyncTime());
    });
    return unsub;
  }, []);

  // Compute live proximity between AIS vessels and active fires
  const correlatedVessels = useMemo(() => {
    return computeVesselFireProximity(vessels, ALL_MIDDLE_EAST_AND_HORMUZ_FIRES);
  }, [vessels]);

  const nasaMetadata = useMemo(() => {
    return nasaFirmsService.getLiveMetadata(ALL_MIDDLE_EAST_AND_HORMUZ_FIRES);
  }, [lastSyncTime]);

  const satellitePasses = useMemo(() => {
    return nasaFirmsService.getSatellitePasses();
  }, [lastSyncTime]);

  // Statistics
  const burningVesselsCount = useMemo(() => {
    return correlatedVessels.filter(v => v.fireHazardStatus === 'ON_FIRE').length;
  }, [correlatedVessels]);

  const proximityAlertsCount = useMemo(() => {
    return correlatedVessels.filter(v => v.fireHazardStatus === 'CRITICAL_PROXIMITY').length;
  }, [correlatedVessels]);

  // Filtered vessel list
  const filteredVessels = useMemo(() => {
    let result = correlatedVessels;

    if (filterMode === 'ON_FIRE') {
      result = result.filter(v => v.fireHazardStatus === 'ON_FIRE');
    } else if (filterMode === 'CRITICAL_PROXIMITY') {
      result = result.filter(v => v.fireHazardStatus === 'CRITICAL_PROXIMITY' || v.fireHazardStatus === 'ON_FIRE');
    } else if (filterMode === 'TANKERS') {
      result = result.filter(v => v.type.includes('Tanker') || v.type.includes('LNG'));
    } else if (filterMode === 'TSS_ONLY') {
      // Inbound or outbound corridor latitude bounds
      result = result.filter(v => v.lat >= 25.5 && v.lat <= 26.8 && v.lng >= 55.0 && v.lng <= 57.2);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(v => 
        v.name.toLowerCase().includes(q) ||
        v.mmsi.toLowerCase().includes(q) ||
        v.flag.toLowerCase().includes(q) ||
        v.type.toLowerCase().includes(q) ||
        v.destination.toLowerCase().includes(q)
      );
    }

    return result;
  }, [correlatedVessels, filterMode, searchQuery]);

  // Manual NASA FIRMS Live Resync
  const handleManualSync = () => {
    setIsSimulatingPass(true);
    audioController.playBeep();
    setTimeout(() => {
      nasaFirmsService.triggerLiveSync();
      setIsSimulatingPass(false);
      setAlertSuccessMsg(`NASA FIRMS telemetry resynced successfully via NOAA-20 / VIIRS 375m downlink.`);
      setTimeout(() => setAlertSuccessMsg(null), 4000);
      if (addMissionLog) {
        addMissionLog('NASA FIRMS LIVE RE-SYNC: Polled 6 orbital nodes (VIIRS/MODIS/SLSTR) - Hormuz maritime thermal flux verified.', 'active');
      }
    }, 700);
  };

  // Simulate a new high-priority vessel fire in Strait of Hormuz to test automated alert workflow
  const handleSimulateNewFireAlert = () => {
    const newFireId = `fire-hormuz-live-${Date.now().toString().slice(-4)}`;
    const targetVessel = correlatedVessels.find(v => v.fireHazardStatus !== 'ON_FIRE') || correlatedVessels[0];

    const simulatedFire: FireDetection = {
      id: newFireId,
      name: `${targetVessel.name} Engine Room Thermal Explosion`,
      category: 'MARITIME_SHIP',
      lat: parseFloat((targetVessel.lat + 0.01).toFixed(3)),
      lng: parseFloat((targetVessel.lng + 0.01).toFixed(3)),
      frp: 720,
      brightnessTempK: 540,
      confidence: 99,
      sensor: 'NOAA-20 VIIRS 375m',
      clusterRegion: 'Strait of Hormuz Inbound TSS Corridor',
      countryOrWaterBody: 'Strait of Hormuz (International Waters)',
      timestamp: 'NASA Live (Just now)',
      acqDate: new Date().toISOString().slice(0, 10),
      acqTimeUtc: new Date().toISOString().slice(11, 16) + ' UTC',
      dayNight: 'D',
      severity: 'EXTREME',
      estimatedSpreadKm: 1.8,
      vesselDetails: {
        vesselName: targetVessel.name,
        vesselType: targetVessel.type,
        mmsi: targetVessel.mmsi,
        flag: targetVessel.flag,
        incidentType: 'Rapid Thermal Deflagration / Cargo Manifold Rupture',
        estimatedSpeedKnots: targetVessel.sogKnots,
        vsatCommsImpact: 'CRITICAL: Severe risk of crude oil slick igniting in narrow chokepoint transit'
      }
    };

    // Update vessel status
    setVessels(prev => prev.map(v => {
      if (v.mmsi === targetVessel.mmsi) {
        return {
          ...v,
          fireHazardStatus: 'ON_FIRE',
          associatedFireId: newFireId,
          navStatus: 'Not under command (Emergency)'
        };
      }
      return v;
    }));

    setSelectedFire(simulatedFire);
    setSelectedVessel({
      ...targetVessel,
      fireHazardStatus: 'ON_FIRE',
      associatedFireId: newFireId,
      nearestFireId: newFireId,
      nearestFireDistanceNm: 0.0,
      nearestFireFrp: 720
    });

    if (isAudioEnabled) {
      audioController.playAlert();
    }

    if (onTriggerAlert) {
      onTriggerAlert(targetVessel, simulatedFire);
    }

    if (addMissionLog) {
      addMissionLog(
        `[CRITICAL HORMUZ MARITIME FIRE] ${targetVessel.name} (${targetVessel.type}, MMSI ${targetVessel.mmsi}) on fire at ${targetVessel.lat}°N, ${targetVessel.lng}°E - FRP 720MW detected by VIIRS!`,
        'CRITICAL'
      );
    }

    setAlertSuccessMsg(`HIGH-PRIORITY ALERT ISSUED: ${targetVessel.name} registered on fire in Hormuz chokepoint! Logged to Tactical Event HUD.`);
    setTimeout(() => setAlertSuccessMsg(null), 6000);
  };

  // Convert GPS (lat, lng) to local Strait of Hormuz SVG Canvas Coordinates [0-100, 0-100]
  // Geographic bounds: Lat 24.5°N - 27.5°N, Lng 54.0°E - 58.0°E
  const mapCoordsToSvg = (lat: number, lng: number) => {
    const minLat = 24.5;
    const maxLat = 27.5;
    const minLng = 54.0;
    const maxLng = 58.0;

    const x = ((lng - minLng) / (maxLng - minLng)) * 100;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 100;
    return { x, y };
  };

  return (
    <div className="flex flex-col space-y-6 w-full animate-in fade-in duration-300">
      {/* Top Strategic Header Card */}
      <div className={`p-5 lg:p-6 rounded-3xl border-2 shadow-2xl relative overflow-hidden transition-all ${
        isStealthMode 
          ? 'bg-slate-950/90 border-purple-900/60 shadow-purple-950/40' 
          : 'bg-slate-950/90 border-slate-800 shadow-black/80'
      }`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.25)] relative">
              <Ship className="w-6 h-6 animate-pulse" />
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-slate-950 animate-ping"></div>
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <span className="text-sm font-black uppercase tracking-[0.2em] text-cyan-400 font-mono">
                  MARITIME FIRE MONITOR
                </span>
                <span className="text-[9px] font-mono bg-red-950/80 text-red-300 border border-red-700/80 px-2 py-0.5 rounded-full font-bold flex items-center space-x-1">
                  <Flame className="w-2.5 h-2.5 text-red-400 animate-pulse" />
                  <span>STRAIT OF HORMUZ AIS & NASA FIRMS LIVE</span>
                </span>
                <span className="text-[9px] font-mono bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 px-2 py-0.5 rounded-full font-bold">
                  21% GLOBAL CRUDE FLOW CORRIDOR
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Real-time Automatic Identification System (AIS) tracking overlaid with NASA FIRMS active fire hotspots & thermal bloom near chokepoint shipping lanes
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
            <button
              onClick={() => setIsAudioEnabled(!isAudioEnabled)}
              title={isAudioEnabled ? "Mute Tactical Audio Alarm" : "Enable Tactical Audio Alarm"}
              className={`p-2 rounded-xl border text-xs font-mono transition flex items-center space-x-1.5 ${
                isAudioEnabled 
                  ? 'bg-slate-900 border-slate-700 text-cyan-400' 
                  : 'bg-slate-950 border-slate-900 text-slate-500'
              }`}
            >
              {isAudioEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
              <span className="text-[9px] uppercase hidden sm:inline">{isAudioEnabled ? 'ALARM ON' : 'MUTED'}</span>
            </button>

            <button
              onClick={handleManualSync}
              disabled={isSimulatingPass}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 rounded-xl text-xs font-mono font-bold flex items-center space-x-2 transition shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isSimulatingPass ? 'animate-spin' : ''}`} />
              <span className="text-[10px] uppercase">NASA LIVE SYNC</span>
            </button>

            <button
              onClick={handleSimulateNewFireAlert}
              className="px-3.5 py-2 bg-red-950/80 hover:bg-red-900 border border-red-600/80 text-red-300 hover:text-white rounded-xl text-xs font-mono font-bold flex items-center space-x-2 transition shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse"
              title="Simulates an emergency detection of a new vessel fire in Hormuz chokepoint"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span className="text-[10px] uppercase font-black">TRIGGER TEST ALERT</span>
            </button>

            {onOpenTacticalMap && (
              <button
                onClick={onOpenTacticalMap}
                className="px-3.5 py-2 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-600 text-cyan-300 rounded-xl text-xs font-mono font-bold flex items-center space-x-2 transition"
              >
                <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[10px] uppercase">FULL TACTICAL MAP</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Notification Banner */}
        {alertSuccessMsg && (
          <div className="mt-3 p-3 bg-red-950/90 border border-red-500 rounded-2xl flex items-center space-x-3 text-red-200 text-xs font-mono animate-in slide-in-from-top-2">
            <AlertOctagon className="w-5 h-5 text-red-400 shrink-0 animate-bounce" />
            <span className="font-bold flex-1">{alertSuccessMsg}</span>
            <button 
              onClick={() => setAlertSuccessMsg(null)}
              className="text-slate-400 hover:text-white text-xs px-2 py-0.5 rounded bg-slate-900"
            >
              DISMISS
            </button>
          </div>
        )}

        {/* Telemetry KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4">
          <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-2xl">
            <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block">VESSELS ON FIRE (HORMUZ)</span>
            <div className="flex items-center space-x-2 mt-1">
              <Flame className="w-4 h-4 text-red-500 animate-pulse" />
              <span className="text-xl font-mono font-black text-red-400">{burningVesselsCount}</span>
              <span className="text-[9px] font-mono text-red-300/70">SHIPS ACTIVE</span>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-2xl">
            <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block">PROXIMITY ALERTS (&lt;3nm)</span>
            <div className="flex items-center space-x-2 mt-1">
              <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />
              <span className="text-xl font-mono font-black text-amber-400">{proximityAlertsCount}</span>
              <span className="text-[9px] font-mono text-amber-300/70">NEAR LANES</span>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-2xl">
            <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block">MIDDLE EAST LAND FIRES</span>
            <div className="flex items-center space-x-2 mt-1">
              <Layers className="w-4 h-4 text-amber-400" />
              <span className="text-xl font-mono font-black text-amber-300">{MIDDLE_EAST_LAND_FIRES.length}</span>
              <span className="text-[9px] font-mono text-slate-400">HOTSPOTS</span>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-2xl">
            <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block">TOTAL AIS TRACKED FLEET</span>
            <div className="flex items-center space-x-2 mt-1">
              <Ship className="w-4 h-4 text-cyan-400" />
              <span className="text-xl font-mono font-black text-cyan-300">{correlatedVessels.length}</span>
              <span className="text-[9px] font-mono text-slate-400">VESSELS</span>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-2xl">
            <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block">PEAK RADIATIVE POWER</span>
            <div className="flex items-center space-x-2 mt-1">
              <Zap className="w-4 h-4 text-fuchsia-400" />
              <span className="text-xl font-mono font-black text-fuchsia-300">{nasaMetadata.maxFrpDetectedMw}</span>
              <span className="text-[9px] font-mono text-slate-400">MEGAWATTS</span>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-2xl">
            <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block">NASA SATELLITE PASS</span>
            <div className="flex items-center space-x-2 mt-1">
              <SatIcon className="w-4 h-4 text-emerald-400 animate-spin-slow" />
              <span className="text-sm font-mono font-black text-emerald-400">NOAA-20</span>
              <span className="text-[8px] font-mono text-emerald-300/80">375m VIIRS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: AIS Radar / Nautical Chart & Intel Tabs (8 cols) */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          
          {/* View Mode Tabs & Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/80 border border-slate-800/80 p-2.5 rounded-2xl">
            <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
              <button
                onClick={() => setActiveTab('MAP')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center space-x-1.5 ${
                  activeTab === 'MAP'
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(34,211,238,0.5)]'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>AIS NAUTICAL RADAR</span>
              </button>

              <button
                onClick={() => setActiveTab('ROSTER')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center space-x-1.5 ${
                  activeTab === 'ROSTER'
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(34,211,238,0.5)]'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Ship className="w-3.5 h-3.5" />
                <span>VESSEL ROSTER ({filteredVessels.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('FIRMS_FEED')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center space-x-1.5 ${
                  activeTab === 'FIRMS_FEED'
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(34,211,238,0.5)]'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>NASA FIRMS FEED ({ALL_MIDDLE_EAST_AND_HORMUZ_FIRES.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('LANES')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center space-x-1.5 ${
                  activeTab === 'LANES'
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(34,211,238,0.5)]'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>TSS SHIPPING LANES</span>
              </button>

              <button
                onClick={() => setActiveTab('SATELLITES')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center space-x-1.5 ${
                  activeTab === 'SATELLITES'
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(34,211,238,0.5)]'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                <SatIcon className="w-3.5 h-3.5" />
                <span>ORBITAL PASSES (6)</span>
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center space-x-1.5">
              {(['ALL', 'ON_FIRE', 'CRITICAL_PROXIMITY', 'TANKERS', 'TSS_ONLY'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilterMode(f)}
                  className={`text-[9px] font-mono px-2 py-1 rounded-lg uppercase transition ${
                    filterMode === f
                      ? 'bg-cyan-950 border border-cyan-500 text-cyan-300 font-bold'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {f.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* TAB 1: AIS Nautical Radar & Chokepoint Map View */}
          {activeTab === 'MAP' && (
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-4 relative shadow-2xl overflow-hidden flex flex-col space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 pb-1 border-b border-slate-800/80">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></div>
                  <span className="font-bold text-slate-200 uppercase">
                    CHOKEPOINT TACTICAL NAUTICAL PLOT: STRAIT OF HORMUZ & GULF OF OMAN
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-[10px]">
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block"></span>
                    <span>TSS Inbound</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                    <span>TSS Outbound</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-red-500 inline-block animate-pulse"></span>
                    <span className="text-red-400 font-bold">Vessel On Fire</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
                    <span className="text-amber-300">Hazard Proximity</span>
                  </span>
                </div>
              </div>

              {/* SVG Tactical Radar Canvas */}
              <div className="relative aspect-[16/9] w-full rounded-2xl bg-[#030712] border border-slate-800 overflow-hidden shadow-inner">
                {/* Radar Grid Circles and Crosshairs */}
                <svg className="w-full h-full absolute inset-0 select-none" viewBox="0 0 100 100">
                  <defs>
                    <radialGradient id="radar-sweep-glow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.12" />
                      <stop offset="60%" stopColor="#06b6d4" stopOpacity="0.04" />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                    </radialGradient>

                    <radialGradient id="vessel-fire-bloom" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
                      <stop offset="35%" stopColor="#f97316" stopOpacity="0.6" />
                      <stop offset="70%" stopColor="#eab308" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
                    </radialGradient>

                    <radialGradient id="proximity-hazard-bloom" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.6" />
                      <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                    </radialGradient>

                    <filter id="glow-filter" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="0.6" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Range Rings Centered near Hormuz (approx x: 57.5, y: 33.3) */}
                  <circle cx="57.5" cy="33.3" r="12" fill="none" stroke="#083344" strokeWidth="0.25" strokeDasharray="1,1" />
                  <circle cx="57.5" cy="33.3" r="24" fill="none" stroke="#083344" strokeWidth="0.25" strokeDasharray="1,1" />
                  <circle cx="57.5" cy="33.3" r="38" fill="none" stroke="#083344" strokeWidth="0.25" strokeDasharray="1,1" />
                  <circle cx="57.5" cy="33.3" r="48" fill="url(#radar-sweep-glow)" />

                  {/* Meridian & Parallel Grid Lines */}
                  <line x1="0" y1="33.3" x2="100" y2="33.3" stroke="#0f172a" strokeWidth="0.3" strokeDasharray="2,2" />
                  <line x1="57.5" y1="0" x2="57.5" y2="100" stroke="#0f172a" strokeWidth="0.3" strokeDasharray="2,2" />
                  
                  {/* Distance Labels */}
                  <text x="58.5" y="44.8" fill="#0891b2" fontSize="1.8" fontFamily="monospace" opacity="0.7">10 NM</text>
                  <text x="58.5" y="56.8" fill="#0891b2" fontSize="1.8" fontFamily="monospace" opacity="0.7">20 NM</text>
                  <text x="58.5" y="70.8" fill="#0891b2" fontSize="1.8" fontFamily="monospace" opacity="0.7">35 NM</text>

                  {/* Simplified Land Masses & Coastlines */}
                  {/* Iran Coast (North) */}
                  <path 
                    d="M 0,22 Q 20,24 35,20 T 52,14 T 65,16 T 85,26 L 100,28 L 100,0 L 0,0 Z" 
                    fill="#0f172a" 
                    stroke="#1e293b" 
                    strokeWidth="0.4"
                    opacity="0.85" 
                  />
                  {/* Arabian Peninsula & Musandam (South/West) */}
                  <path 
                    d="M 0,70 Q 25,68 45,72 T 58,55 T 61,38 T 68,55 T 75,80 L 80,100 L 0,100 Z" 
                    fill="#0f172a" 
                    stroke="#1e293b" 
                    strokeWidth="0.4"
                    opacity="0.85" 
                  />
                  {/* Qeshm Island */}
                  <path 
                    d="M 38,20 C 44,18 49,20 53,23 C 48,26 43,24 38,20 Z" 
                    fill="#1e293b" 
                    stroke="#334155" 
                    strokeWidth="0.3" 
                  />
                  {/* Hormuz Island & Larak */}
                  <circle cx="58" cy="18" r="1.5" fill="#1e293b" stroke="#334155" strokeWidth="0.3" />
                  <circle cx="56" cy="24" r="1.2" fill="#1e293b" stroke="#334155" strokeWidth="0.3" />

                  {/* Geographic Annotations */}
                  <text x="44" y="14" fill="#64748b" fontSize="2.2" fontFamily="monospace" fontWeight="bold">IRAN (ISLAMIC REP.)</text>
                  <text x="12" y="85" fill="#64748b" fontSize="2.2" fontFamily="monospace" fontWeight="bold">UNITED ARAB EMIRATES</text>
                  <text x="63" y="62" fill="#64748b" fontSize="2.0" fontFamily="monospace" fontWeight="bold">OMAN (MUSANDAM)</text>
                  <text x="18" y="42" fill="#0284c7" fontSize="2.2" fontFamily="monospace" opacity="0.6">PERSIAN GULF</text>
                  <text x="76" y="60" fill="#0284c7" fontSize="2.2" fontFamily="monospace" opacity="0.6">GULF OF OMAN</text>
                  <text x="50" y="30" fill="#38bdf8" fontSize="2.4" fontFamily="monospace" fontWeight="black" letterSpacing="0.2">STRAIT OF HORMUZ</text>

                  {/* Shipping Lanes (TSS) */}
                  {HORMUZ_SHIPPING_LANES.map(lane => {
                    const pathData = lane.points
                      .map((pt, idx) => {
                        const { x, y } = mapCoordsToSvg(pt.lat, pt.lng);
                        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(2)},${y.toFixed(2)}`;
                      })
                      .join(' ');

                    return (
                      <g key={lane.id}>
                        {/* Glow corridor line */}
                        <path
                          d={pathData}
                          fill="none"
                          stroke={lane.color}
                          strokeWidth={lane.laneType === 'SEPARATION_ZONE' ? '0.6' : '1.2'}
                          strokeDasharray={lane.laneType === 'SEPARATION_ZONE' ? '1,1' : undefined}
                          opacity={lane.laneType === 'SEPARATION_ZONE' ? '0.5' : '0.75'}
                        />
                        {/* Lane direction arrows */}
                        {lane.points.slice(1, -1).map((pt, i) => {
                          const { x, y } = mapCoordsToSvg(pt.lat, pt.lng);
                          return (
                            <circle
                              key={i}
                              cx={x}
                              cy={y}
                              r="0.5"
                              fill={lane.color}
                              opacity="0.8"
                            />
                          );
                        })}
                      </g>
                    );
                  })}

                  {/* Proximity Tether Lines: Connect burning ships to nearby vessels within hazard radius */}
                  {correlatedVessels.map(v => {
                    if (v.fireHazardStatus === 'CRITICAL_PROXIMITY' && v.nearestFireId) {
                      const fireMatch = ALL_MIDDLE_EAST_AND_HORMUZ_FIRES.find(f => f.id === v.nearestFireId);
                      if (fireMatch) {
                        const vPos = mapCoordsToSvg(v.lat, v.lng);
                        const fPos = mapCoordsToSvg(fireMatch.lat, fireMatch.lng);
                        return (
                          <g key={`tether-${v.mmsi}`}>
                            <line
                              x1={vPos.x}
                              y1={vPos.y}
                              x2={fPos.x}
                              y2={fPos.y}
                              stroke="#f59e0b"
                              strokeWidth="0.35"
                              strokeDasharray="1,1"
                              className="animate-pulse"
                            />
                            <text
                              x={(vPos.x + fPos.x) / 2}
                              y={(vPos.y + fPos.y) / 2 - 0.8}
                              fill="#fde047"
                              fontSize="1.6"
                              fontFamily="monospace"
                              textAnchor="middle"
                              fontWeight="bold"
                            >
                              {v.nearestFireDistanceNm} NM
                            </text>
                          </g>
                        );
                      }
                    }
                    return null;
                  })}

                  {/* NASA FIRMS Thermal Anomaly Hotspots */}
                  {ALL_MIDDLE_EAST_AND_HORMUZ_FIRES.map(fire => {
                    if (fire.lat < 24.5 || fire.lat > 27.5 || fire.lng < 54.0 || fire.lng > 58.0) return null;
                    const { x, y } = mapCoordsToSvg(fire.lat, fire.lng);
                    const isSelected = selectedFire?.id === fire.id;
                    const isMaritime = fire.category === 'MARITIME_SHIP';
                    const radius = isMaritime ? 3.8 : 2.5;

                    return (
                      <g 
                        key={fire.id}
                        className="cursor-pointer"
                        onClick={() => {
                          setSelectedFire(fire);
                          const matchingVessel = correlatedVessels.find(v => v.associatedFireId === fire.id);
                          if (matchingVessel) setSelectedVessel(matchingVessel);
                          if (onSelectFireOnMap) onSelectFireOnMap(fire);
                        }}
                        onMouseEnter={() => setHoveredEntity({ type: 'fire', data: fire })}
                        onMouseLeave={() => setHoveredEntity(null)}
                      >
                        {/* Clean Tactical Fire Position Boundary (Flare Removed) */}
                        <circle
                          cx={x}
                          cy={y}
                          r={1.5}
                          fill={isMaritime ? '#ef4444' : '#f97316'}
                          fillOpacity={isSelected ? "0.4" : "0.2"}
                          stroke={isMaritime ? '#ef4444' : '#f97316'}
                          strokeWidth="0.25"
                        />
                        {/* Core hotspot center point */}
                        <circle
                          cx={x}
                          cy={y}
                          r="0.8"
                          fill="#ffffff"
                          stroke="#ef4444"
                          strokeWidth="0.25"
                        />
                        {/* Fire Radiative Power (MW) Label */}
                        <text
                          x={x}
                          y={y + radius + 1.8}
                          textAnchor="middle"
                          fill={isMaritime ? '#fca5a5' : '#fed7aa'}
                          fontSize="1.7"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          🔥 {fire.frp}MW
                        </text>
                      </g>
                    );
                  })}

                  {/* AIS Tracked Vessels */}
                  {correlatedVessels.map(vessel => {
                    const { x, y } = mapCoordsToSvg(vessel.lat, vessel.lng);
                    const isSelected = selectedVessel?.mmsi === vessel.mmsi;
                    const isOnFire = vessel.fireHazardStatus === 'ON_FIRE';
                    const isCriticalProximity = vessel.fireHazardStatus === 'CRITICAL_PROXIMITY';

                    // Heading line endpoint
                    const headingRad = (vessel.heading * Math.PI) / 180;
                    const vectorLen = Math.max(1.5, vessel.sogKnots * 0.15);
                    const headX = x + Math.sin(headingRad) * vectorLen;
                    const headY = y - Math.cos(headingRad) * vectorLen;

                    return (
                      <g 
                        key={vessel.mmsi}
                        className="cursor-pointer"
                        onClick={() => {
                          setSelectedVessel(vessel);
                          if (vessel.associatedFireId) {
                            const fire = ALL_MIDDLE_EAST_AND_HORMUZ_FIRES.find(f => f.id === vessel.associatedFireId);
                            if (fire) setSelectedFire(fire);
                          }
                        }}
                        onMouseEnter={() => setHoveredEntity({ type: 'vessel', data: vessel })}
                        onMouseLeave={() => setHoveredEntity(null)}
                      >
                        {/* Selection Reticle */}
                        {isSelected && (
                          <circle
                            cx={x}
                            cy={y}
                            r="3.2"
                            fill="none"
                            stroke="#22d3ee"
                            strokeWidth="0.4"
                            strokeDasharray="1,1"
                            className="animate-spin-slow"
                          />
                        )}

                        {/* Proximity Danger Aura */}
                        {isCriticalProximity && (
                          <circle
                            cx={x}
                            cy={y}
                            r="2.6"
                            fill="url(#proximity-hazard-bloom)"
                            className="animate-ping"
                            style={{ animationDuration: '3s' }}
                          />
                        )}

                        {/* Heading & Speed Vector */}
                        <line
                          x1={x}
                          y1={y}
                          x2={headX}
                          y2={headY}
                          stroke={isOnFire ? '#ef4444' : isCriticalProximity ? '#f59e0b' : '#38bdf8'}
                          strokeWidth="0.35"
                        />

                        {/* Vessel Symbol (Diamond for ships) */}
                        <polygon
                          points={`${x},${y - 1.2} ${x + 0.9},${y} ${x},${y + 1.2} ${x - 0.9},${y}`}
                          fill={isOnFire ? '#ef4444' : isCriticalProximity ? '#f59e0b' : '#0284c7'}
                          stroke="#ffffff"
                          strokeWidth="0.25"
                        />

                        {/* Vessel Call Sign or Short Name */}
                        <text
                          x={x}
                          y={y - 1.8}
                          textAnchor="middle"
                          fill={isOnFire ? '#f87171' : isCriticalProximity ? '#fbbf24' : '#bae6fd'}
                          fontSize="1.7"
                          fontFamily="monospace"
                          fontWeight={isSelected || isOnFire ? 'bold' : 'normal'}
                        >
                          {isOnFire ? '🚨 ' : ''}{vessel.name.split(' ')[0]}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Live Tooltip on Hover */}
                {hoveredEntity && (
                  <div className="absolute top-3 left-3 bg-slate-950/95 border border-cyan-500/60 p-2.5 rounded-xl text-xs font-mono shadow-2xl pointer-events-none z-30 max-w-xs">
                    {hoveredEntity.type === 'vessel' ? (
                      <div>
                        <div className="flex items-center space-x-1.5 text-cyan-300 font-bold border-b border-slate-800 pb-1">
                          <Ship className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{hoveredEntity.data.name}</span>
                          <span className="text-[9px] text-slate-400">({hoveredEntity.data.flag})</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-slate-300 mt-1">
                          <span>MMSI: <strong className="text-white">{hoveredEntity.data.mmsi}</strong></span>
                          <span>TYPE: <strong className="text-white">{hoveredEntity.data.type}</strong></span>
                          <span>SOG: <strong className="text-cyan-400">{hoveredEntity.data.sogKnots} kts</strong></span>
                          <span>COG: <strong className="text-cyan-400">{hoveredEntity.data.cogDegrees}°</strong></span>
                          <span className="col-span-2 text-amber-400 font-bold">
                            STATUS: {hoveredEntity.data.fireHazardStatus.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center space-x-1.5 text-red-400 font-bold border-b border-slate-800 pb-1">
                          <Flame className="w-3.5 h-3.5 text-red-400" />
                          <span>{hoveredEntity.data.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-300 mt-1 space-y-0.5">
                          <div>FRP: <strong className="text-red-400">{hoveredEntity.data.frp} MW</strong></div>
                          <div>TEMP: <strong className="text-amber-400">{hoveredEntity.data.brightnessTempK} K</strong></div>
                          <div>SENSOR: <strong>{hoveredEntity.data.sensor}</strong></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Vessel Roster Table */}
          {activeTab === 'ROSTER' && (
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-4 overflow-hidden shadow-2xl flex flex-col space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center space-x-2">
                  <Ship className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono font-bold text-slate-200 uppercase">
                    GLOBAL MARITIME AIS TRACKING ROSTER // STRAIT OF HORMUZ & PERSIAN GULF FLEET
                  </span>
                </div>
                {/* Search Bar */}
                <div className="relative w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search MMSI, name, flag..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="overflow-x-auto max-h-[500px] scrollbar-thin">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-slate-900 text-[10px] uppercase text-slate-400 sticky top-0">
                    <tr>
                      <th className="p-2.5 rounded-l-lg">Vessel Name</th>
                      <th className="p-2.5">MMSI / Flag</th>
                      <th className="p-2.5">Ship Type</th>
                      <th className="p-2.5">SOG / COG</th>
                      <th className="p-2.5">Fire Proximity</th>
                      <th className="p-2.5">Nav Status</th>
                      <th className="p-2.5 rounded-r-lg">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredVessels.map(v => (
                      <tr 
                        key={v.mmsi}
                        onClick={() => setSelectedVessel(v)}
                        className={`hover:bg-slate-900/60 cursor-pointer transition ${
                          selectedVessel?.mmsi === v.mmsi ? 'bg-cyan-950/40 border-l-2 border-cyan-400' : ''
                        }`}
                      >
                        <td className="p-2.5 font-bold flex items-center space-x-2">
                          {v.fireHazardStatus === 'ON_FIRE' ? (
                            <Flame className="w-3.5 h-3.5 text-red-500 animate-pulse shrink-0" />
                          ) : (
                            <Ship className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                          <span className={v.fireHazardStatus === 'ON_FIRE' ? 'text-red-400' : 'text-slate-200'}>
                            {v.name}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-400">
                          <div>{v.mmsi}</div>
                          <div className="text-[10px] text-slate-500">{v.flag}</div>
                        </td>
                        <td className="p-2.5 text-slate-300">{v.type}</td>
                        <td className="p-2.5 text-cyan-400">
                          {v.sogKnots} kts @ {v.cogDegrees}°
                        </td>
                        <td className="p-2.5">
                          {v.fireHazardStatus === 'ON_FIRE' ? (
                            <span className="px-2 py-0.5 rounded-full bg-red-950 border border-red-700 text-red-400 text-[10px] font-black animate-pulse">
                              ON-BOARD FIRE ({v.nearestFireFrp}MW)
                            </span>
                          ) : v.fireHazardStatus === 'CRITICAL_PROXIMITY' ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-950 border border-amber-700 text-amber-300 text-[10px] font-bold">
                              {v.nearestFireDistanceNm} NM TO FIRE
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[10px]">
                              {v.nearestFireDistanceNm ? `${v.nearestFireDistanceNm} NM (Safe)` : 'CLEAR'}
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-[10px] text-slate-400">{v.navStatus}</td>
                        <td className="p-2.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedVessel(v);
                              setActiveTab('MAP');
                            }}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-cyan-950 border border-slate-700 text-cyan-400 text-[10px] uppercase"
                            title="Inspect on Nautical Radar"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: NASA FIRMS Active Fire Hotspots Feed */}
          {activeTab === 'FIRMS_FEED' && (
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-4 overflow-hidden shadow-2xl flex flex-col space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <div className="flex items-center space-x-2">
                  <Flame className="w-4 h-4 text-red-500 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-slate-200 uppercase">
                    NASA FIRMS LIVE THERMAL DETECTIONS // STRAIT OF HORMUZ MARITIME & MIDDLE EAST LAND FIRES
                  </span>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded-lg">
                  {ALL_MIDDLE_EAST_AND_HORMUZ_FIRES.length} DETECTIONS ACTIVE
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto scrollbar-thin">
                {ALL_MIDDLE_EAST_AND_HORMUZ_FIRES.map(fire => {
                  const isMaritime = fire.category === 'MARITIME_SHIP';
                  return (
                    <div
                      key={fire.id}
                      onClick={() => {
                        setSelectedFire(fire);
                        const vessel = correlatedVessels.find(v => v.associatedFireId === fire.id);
                        if (vessel) setSelectedVessel(vessel);
                      }}
                      className={`p-3 rounded-2xl border transition cursor-pointer flex flex-col space-y-2 ${
                        selectedFire?.id === fire.id 
                          ? 'bg-red-950/40 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          {isMaritime ? (
                            <Ship className="w-4 h-4 text-red-400 animate-pulse shrink-0" />
                          ) : (
                            <Flame className="w-4 h-4 text-amber-400 shrink-0" />
                          )}
                          <span className="text-xs font-mono font-bold text-slate-200 line-clamp-1">
                            {fire.name}
                          </span>
                        </div>
                        <span className={`text-[8.5px] font-mono px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                          fire.severity === 'EXTREME'
                            ? 'bg-red-950 border border-red-700 text-red-400 animate-pulse'
                            : 'bg-amber-950 border border-amber-700 text-amber-300'
                        }`}>
                          {fire.frp} MW
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-x-2 text-[10px] font-mono text-slate-400">
                        <span>REGION: <strong className="text-slate-300">{fire.countryOrWaterBody}</strong></span>
                        <span>TEMP: <strong className="text-amber-400">{fire.brightnessTempK} K</strong></span>
                        <span>LAT/LNG: <strong>{fire.lat}°N, {fire.lng}°E</strong></span>
                        <span>SENSOR: <strong>{fire.sensor.split(' ')[0]}</strong></span>
                      </div>

                      {fire.vesselDetails && (
                        <div className="text-[9.5px] font-mono bg-slate-950/80 p-2 rounded-xl border border-slate-800 text-cyan-300">
                          🚢 VESSEL: {fire.vesselDetails.vesselName} ({fire.vesselDetails.vesselType})
                          <div className="text-red-400 text-[8.5px] mt-0.5 font-bold">
                            ⚠️ {fire.vesselDetails.incidentType}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: Shipping Lanes & Chokepoint Intel */}
          {activeTab === 'LANES' && (
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-4 overflow-hidden shadow-2xl flex flex-col space-y-3">
              <div className="flex items-center space-x-2 pb-2 border-b border-slate-800/80">
                <Navigation className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono font-bold text-slate-200 uppercase">
                  STRAIT OF HORMUZ MARITIME TRAFFIC SEPARATION SCHEME (TSS) BLUEPRINT
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {HORMUZ_SHIPPING_LANES.map(lane => (
                  <div key={lane.id} className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-slate-200" style={{ color: lane.color }}>
                        {lane.name}
                      </span>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
                        DENSITY: {lane.trafficDensity}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-400">
                      {lane.description}
                    </p>
                    <div className="text-[10px] font-mono text-slate-500">
                      WAYPOINTS: {lane.points.length} nodes from {lane.points[0].lat}°N, {lane.points[0].lng}°E to {lane.points[lane.points.length - 1].lat}°N, {lane.points[lane.points.length - 1].lng}°E
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: Orbital Passes */}
          {activeTab === 'SATELLITES' && (
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-4 overflow-hidden shadow-2xl flex flex-col space-y-3">
              <div className="flex items-center space-x-2 pb-2 border-b border-slate-800/80">
                <SatIcon className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono font-bold text-slate-200 uppercase">
                  NASA EOSDIS / FIRMS SATELLITE SENSOR CONSTELLATION OVERPASS SCHEDULE
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {satellitePasses.map((pass, i) => (
                  <div key={i} className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-black text-cyan-400">{pass.satellite}</span>
                        <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-1.5 py-0.5 rounded font-bold">
                          {pass.status}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-300 mt-1 font-bold">{pass.sensor}</div>
                      <div className="text-[9px] font-mono text-slate-500 mt-0.5">{pass.resolution}</div>
                    </div>
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>PASS TIME:</span>
                      <span className="text-cyan-300 font-bold">{pass.passTimeUtc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Selected Vessel & Fire Dossier Inspector (4 cols) */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          
          {/* Active Vessel Inspector Card */}
          {selectedVessel ? (
            <div className={`p-4 lg:p-5 rounded-3xl border shadow-2xl flex flex-col space-y-4 transition ${
              selectedVessel.fireHazardStatus === 'ON_FIRE'
                ? 'bg-red-950/20 border-red-600/80 shadow-[0_0_25px_rgba(239,68,68,0.25)]'
                : 'bg-slate-950 border-slate-800'
            }`}>
              <div className="flex items-start justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    selectedVessel.fireHazardStatus === 'ON_FIRE' 
                      ? 'bg-red-950 border border-red-500 text-red-400 animate-pulse' 
                      : 'bg-slate-900 border border-slate-700 text-cyan-400'
                  }`}>
                    {selectedVessel.fireHazardStatus === 'ON_FIRE' ? <Flame className="w-5 h-5" /> : <Ship className="w-5 h-5" />}
                  </div>
                  <div>
                    <span className="text-xs font-mono font-black text-slate-100 uppercase block">
                      {selectedVessel.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {selectedVessel.type} • {selectedVessel.flag}
                    </span>
                  </div>
                </div>

                <span className={`text-[8px] font-mono px-2 py-0.5 rounded-full font-black uppercase ${
                  selectedVessel.fireHazardStatus === 'ON_FIRE'
                    ? 'bg-red-600 text-white animate-pulse'
                    : selectedVessel.fireHazardStatus === 'CRITICAL_PROXIMITY'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-cyan-950 border border-cyan-800 text-cyan-400'
                }`}>
                  {selectedVessel.fireHazardStatus.replace('_', ' ')}
                </span>
              </div>

              {/* AIS Telemetry Grid */}
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
                <div>
                  <span className="text-slate-500 block text-[8px] uppercase">MMSI</span>
                  <span className="text-slate-200 font-bold">{selectedVessel.mmsi}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[8px] uppercase">IMO NUMBER</span>
                  <span className="text-slate-200 font-bold">{selectedVessel.imo}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[8px] uppercase">SPEED OVER GROUND</span>
                  <span className="text-cyan-400 font-bold">{selectedVessel.sogKnots} KNOTS</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[8px] uppercase">COURSE OVER GROUND</span>
                  <span className="text-cyan-400 font-bold">{selectedVessel.cogDegrees}°</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[8px] uppercase">DESTINATION</span>
                  <span className="text-slate-200 font-bold truncate block">{selectedVessel.destination}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[8px] uppercase">ETA</span>
                  <span className="text-slate-300 font-bold">{selectedVessel.eta}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[8px] uppercase">DRAUGHT / LENGTH</span>
                  <span className="text-slate-300 font-bold">{selectedVessel.draughtMeters}m / {selectedVessel.lengthMeters}m</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[8px] uppercase">VHF COMM CHANNEL</span>
                  <span className="text-emerald-400 font-bold">CH {selectedVessel.vhfChannel}</span>
                </div>
              </div>

              {/* Proximity / Fire Threat Dossier */}
              {selectedVessel.fireHazardStatus === 'ON_FIRE' ? (
                <div className="p-3 bg-red-950/60 border border-red-700/80 rounded-2xl space-y-2 animate-pulse">
                  <div className="flex items-center space-x-1.5 text-red-300 font-mono text-xs font-bold">
                    <Flame className="w-4 h-4 text-red-400" />
                    <span>ACTIVE ON-BOARD INFERNO (NASA FIRMS)</span>
                  </div>
                  <div className="text-[10px] font-mono text-red-200 space-y-1">
                    <div>RADIATIVE POWER: <strong className="text-white">{selectedVessel.nearestFireFrp || 640} MW</strong></div>
                    <div>HOTSPOT: <strong className="text-white">{selectedVessel.nearestFireName}</strong></div>
                    <div className="text-[9px] text-red-300/90 leading-relaxed pt-1 border-t border-red-800">
                      Vessel adrift in international transit corridor. Smoke plume directly compromising inbound Traffic Separation Scheme.
                    </div>
                  </div>
                </div>
              ) : selectedVessel.nearestFireDistanceNm !== undefined ? (
                <div className="p-3 bg-amber-950/30 border border-amber-800/60 rounded-2xl space-y-1.5">
                  <div className="flex items-center space-x-1.5 text-amber-300 font-mono text-xs font-bold">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>CHOKEPOINT FIRE PROXIMITY</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-300 space-y-0.5">
                    <div>DISTANCE TO FIRE: <strong className="text-amber-400">{selectedVessel.nearestFireDistanceNm} NM</strong></div>
                    <div>NEAREST INCIDENT: <strong className="text-slate-200 line-clamp-1">{selectedVessel.nearestFireName}</strong></div>
                  </div>
                </div>
              ) : null}

              {/* Tactical Response Action Buttons */}
              <div className="flex flex-col space-y-2 pt-2 border-t border-slate-800/80">
                <button
                  onClick={() => {
                    if (addMissionLog) {
                      addMissionLog(
                        `URGENT PAN-PAN RELAY BROADCAST on VHF CH 16: Fire emergency reported on ${selectedVessel.name} (${selectedVessel.lat}°N, ${selectedVessel.lng}°E). SAR units advised to clear TSS lane.`,
                        'CRITICAL'
                      );
                    }
                    setAlertSuccessMsg(`MAYDAY RELAY DISPATCHED ON CH 16 for ${selectedVessel.name}!`);
                    setTimeout(() => setAlertSuccessMsg(null), 4000);
                  }}
                  className="w-full py-2 bg-red-950 hover:bg-red-900 border border-red-700 text-red-200 font-mono text-xs font-bold rounded-xl transition flex items-center justify-center space-x-2"
                >
                  <Radio className="w-3.5 h-3.5 text-red-400" />
                  <span>TRANSMIT MAYDAY RELAY (VHF CH 16)</span>
                </button>

                <button
                  onClick={() => {
                    if (addMissionLog) {
                      addMissionLog(
                        `SAR COMMAND: Emergency firefighting tug Fujairah Rescuer 1 dispatched to ${selectedVessel.name}. Intercept ETA: 24 mins.`,
                        'warning'
                      );
                    }
                    setAlertSuccessMsg(`FIREFIGHTING TUG TASKED to rendezvous with ${selectedVessel.name}.`);
                    setTimeout(() => setAlertSuccessMsg(null), 4000);
                  }}
                  className="w-full py-2 bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-200 font-mono text-xs font-bold rounded-xl transition flex items-center justify-center space-x-2"
                >
                  <Anchor className="w-3.5 h-3.5 text-cyan-400" />
                  <span>DISPATCH EMERGENCY FIREFIGHTING TUG</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 text-center text-xs font-mono text-slate-500">
              Select a vessel on the nautical radar or roster to inspect AIS telemetry
            </div>
          )}

          {/* Chokepoint Strategic Brief Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-4 flex flex-col space-y-3">
            <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs font-bold">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              <span>STRAIT OF HORMUZ MARITIME INTELLIGENCE</span>
            </div>
            <p className="text-[11px] font-mono text-slate-400 leading-relaxed">
              The Strait of Hormuz is the world's most critical maritime chokepoint, with approximately <strong>21 million barrels per day</strong> (over 20% of global petroleum liquids consumption) transiting its narrow 2-nautical-mile Traffic Separation Scheme lanes.
            </p>
            <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 text-[10px] font-mono text-slate-300 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">NARROWEST PASSAGE:</span>
                <span className="text-slate-200 font-bold">21 NM (Musandam Peninsula)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">LANE WIDTH:</span>
                <span className="text-slate-200 font-bold">2 NM Inbound + 2 NM Outbound</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">BUFFER MEDIAN:</span>
                <span className="text-slate-200 font-bold">1 NM Separation Zone</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">PRIMARY SURVEILLANCE:</span>
                <span className="text-cyan-400 font-bold">VIIRS 375m (NOAA-20 / NPP)</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
