import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  ShieldAlert, Radio, Crosshair, Zap, Database, RefreshCw, 
  Layers, MapPin, AlertTriangle, Eye, EyeOff, Activity, 
  Download, Terminal, Server, Satellite as SatIcon, Globe,
  Search, Shield, Check, Filter, Compass, Waves
} from 'lucide-react';
import { Coordinates, Satellite } from '../types.ts';
import { 
  threatIntelCache, 
  GpsSpoofingArea, 
  EwPulseEmission, 
  MalwareC2Hq, 
  SignalInterferenceHotspot,
  ThreatIntelSnapshot 
} from '../services/threatIntelCache.ts';
import { ModuleExportToolbar } from './ModuleExportToolbar.tsx';
import { audioController } from '../services/audioService.ts';

interface ThreatHeatmapProps {
  userLoc: Coordinates;
  selectedSatellite: Satellite;
  isStealthMode?: boolean;
  onSelectCoordinates?: (coords: Coordinates) => void;
  onMissionLog?: (detail: string, status?: any) => void;
}

type ThreatLayer = 'INTERFERENCE' | 'GPS_SPOOFING' | 'EW_PULSE' | 'MALWARE_C2';
type SeverityFilter = 'ALL' | 'CRITICAL' | 'HIGH' | 'ELEVATED';
type TheaterFocus = 'GLOBAL' | 'HORMUZ' | 'LEVANT' | 'BLACK_SEA' | 'BALTIC' | 'SOUTH_CHINA_SEA';

// Simplified tactical continent polygons in [lon, lat] coordinates for D3 geo path
const WORLD_LANDMASS_FEATURES: [number, number][][] = [
  // North America
  [[-168, 65], [-140, 70], [-100, 72], [-65, 45], [-80, 25], [-105, 20], [-120, 35], [-160, 58], [-168, 65]],
  // South America
  [[-80, 10], [-50, -5], [-35, -5], [-55, -35], [-70, -55], [-75, -45], [-80, -5], [-80, 10]],
  // Eurasia
  [[-10, 36], [0, 44], [15, 55], [30, 70], [60, 72], [110, 75], [170, 68], [140, 35], [105, 20], [75, 28], [50, 25], [35, 32], [28, 41], [15, 38], [-5, 36], [-10, 36]],
  // Africa
  [[-15, 32], [12, 37], [32, 31], [43, 12], [51, 12], [40, -15], [30, -34], [18, -34], [10, -5], [-15, 12], [-17, 22], [-15, 32]],
  // Australia
  [[115, -22], [130, -12], [148, -20], [150, -36], [138, -38], [115, -34], [115, -22]],
  // Greenland
  [[-50, 60], [-20, 70], [-25, 82], [-60, 82], [-55, 72], [-50, 60]]
];

const getThreatTitle = (threat: { type: ThreatLayer; data: any }): string => {
  if (threat.type === 'GPS_SPOOFING') return (threat.data as GpsSpoofingArea).name;
  if (threat.type === 'EW_PULSE') return (threat.data as EwPulseEmission).emitterName;
  if (threat.type === 'MALWARE_C2') return (threat.data as MalwareC2Hq).hqName;
  return (threat.data as SignalInterferenceHotspot).name;
};

const getThreatSubtitle = (threat: { type: ThreatLayer; data: any }): string => {
  if (threat.type === 'GPS_SPOOFING') return (threat.data as GpsSpoofingArea).designator;
  if (threat.type === 'EW_PULSE') return (threat.data as EwPulseEmission).designator;
  if (threat.type === 'MALWARE_C2') return (threat.data as MalwareC2Hq).actorGroup;
  return (threat.data as SignalInterferenceHotspot).affectedTransponder;
};

export const ThreatHeatmap: React.FC<ThreatHeatmapProps> = ({
  userLoc,
  selectedSatellite,
  isStealthMode = false,
  onSelectCoordinates,
  onMissionLog
}) => {
  const [intelData, setIntelData] = useState<ThreatIntelSnapshot>(() => threatIntelCache.getThreatIntel());
  const [activeLayers, setActiveLayers] = useState<Record<ThreatLayer, boolean>>({
    INTERFERENCE: true,
    GPS_SPOOFING: true,
    EW_PULSE: true,
    MALWARE_C2: true
  });
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('ALL');
  const [theater, setTheater] = useState<TheaterFocus>('GLOBAL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cacheNotification, setCacheNotification] = useState<string | null>(null);

  // Selected item for the tactical inspector drawer
  const [selectedThreat, setSelectedThreat] = useState<{
    type: ThreatLayer;
    data: GpsSpoofingArea | EwPulseEmission | MalwareC2Hq | SignalInterferenceHotspot;
  } | null>(null);

  const [hoveredThreat, setHoveredThreat] = useState<{
    type: ThreatLayer;
    data: any;
    x: number;
    y: number;
  } | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);

  // Viewport dimensions for SVG equirectangular D3 canvas
  const width = 960;
  const height = 480;

  // Theater bounding box and zoom scaling
  const theaterBounds = useMemo(() => {
    switch (theater) {
      case 'HORMUZ':
        return { centerLng: 56.25, centerLat: 26.50, scaleMultiplier: 6.5 };
      case 'LEVANT':
        return { centerLng: 35.50, centerLat: 34.00, scaleMultiplier: 5.5 };
      case 'BLACK_SEA':
        return { centerLng: 34.00, centerLat: 44.50, scaleMultiplier: 5.0 };
      case 'BALTIC':
        return { centerLng: 21.00, centerLat: 56.00, scaleMultiplier: 4.8 };
      case 'SOUTH_CHINA_SEA':
        return { centerLng: 114.00, centerLat: 14.00, scaleMultiplier: 4.0 };
      case 'GLOBAL':
      default:
        return { centerLng: 0, centerLat: 0, scaleMultiplier: 1.0 };
    }
  }, [theater]);

  // Setup D3 projection
  const projection = useMemo(() => {
    const scale = (width / (2 * Math.PI)) * theaterBounds.scaleMultiplier;
    return d3.geoEquirectangular()
      .scale(scale)
      .center([theaterBounds.centerLng, theaterBounds.centerLat])
      .translate([width / 2, height / 2]);
  }, [width, height, theaterBounds]);

  const geoPathGenerator = useMemo(() => {
    return d3.geoPath().projection(projection);
  }, [projection]);

  // Graticule lines via D3
  const graticules = useMemo(() => {
    const graticuleGen = d3.geoGraticule().step([15, 15]);
    return geoPathGenerator(graticuleGen());
  }, [geoPathGenerator]);

  // Filtered datasets based on search and severity
  const filteredGpsSpoofing = useMemo(() => {
    if (!activeLayers.GPS_SPOOFING) return [];
    return intelData.gpsSpoofingAreas.filter(item => {
      const matchSeverity = severityFilter === 'ALL' || item.severity === severityFilter;
      const matchQuery = !searchQuery || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.designator.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.technique.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSeverity && matchQuery;
    });
  }, [intelData, activeLayers.GPS_SPOOFING, severityFilter, searchQuery]);

  const filteredEwPulses = useMemo(() => {
    if (!activeLayers.EW_PULSE) return [];
    return intelData.ewPulseEmissions.filter(item => {
      const matchSeverity = severityFilter === 'ALL' || item.threatLevel === severityFilter;
      const matchQuery = !searchQuery || 
        item.emitterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.designator.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.operatorOrUnit.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSeverity && matchQuery;
    });
  }, [intelData, activeLayers.EW_PULSE, severityFilter, searchQuery]);

  const filteredMalwareC2 = useMemo(() => {
    if (!activeLayers.MALWARE_C2) return [];
    return intelData.malwareC2Hqs.filter(item => {
      const matchSeverity = severityFilter === 'ALL' || item.severity === severityFilter;
      const matchQuery = !searchQuery || 
        item.hqName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.actorGroup.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.malwareFamily.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.c2Ip.includes(searchQuery);
      return matchSeverity && matchQuery;
    });
  }, [intelData, activeLayers.MALWARE_C2, severityFilter, searchQuery]);

  const filteredInterference = useMemo(() => {
    if (!activeLayers.INTERFERENCE) return [];
    return intelData.interferenceHotspots.filter(item => {
      const matchQuery = !searchQuery || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.interferenceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.affectedTransponder.toLowerCase().includes(searchQuery.toLowerCase());
      return matchQuery;
    });
  }, [intelData, activeLayers.INTERFERENCE, searchQuery]);

  // Compute D3 density contours for Signal Interference Patterns
  const interferenceContours = useMemo(() => {
    if (!activeLayers.INTERFERENCE || filteredInterference.length === 0) return [];
    
    // Convert interference hotspots to projected canvas points with weights
    const points: [number, number, number][] = [];
    filteredInterference.forEach(h => {
      const projected = projection([h.lng, h.lat]);
      if (projected && projected[0] > -100 && projected[0] < width + 100 && projected[1] > -100 && projected[1] < height + 100) {
        points.push([projected[0], projected[1], h.intensity]);
      }
    });

    if (points.length < 2) return [];

    try {
      const density = d3.contourDensity<[number, number, number]>()
        .x(d => d[0])
        .y(d => d[1])
        .weight(d => d[2] * 2.5)
        .size([width, height])
        .bandwidth(38 * (theater === 'GLOBAL' ? 1.0 : 1.8))
        .thresholds(7);

      return density(points);
    } catch {
      return [];
    }
  }, [filteredInterference, projection, width, height, activeLayers.INTERFERENCE, theater]);

  // Handle Layer Toggle
  const toggleLayer = (layer: ThreatLayer) => {
    audioController.playBeep(720, 0.05);
    setActiveLayers(prev => ({ ...prev, [layer]: !prev [layer] }));
  };

  // Handle Cache Purge & Live Re-sync
  const handlePurgeAndRefresh = () => {
    setIsRefreshing(true);
    audioController.playBeep(980, 0.08);
    setTimeout(() => {
      const refreshed = threatIntelCache.purgeAndRefresh();
      setIntelData(refreshed);
      setIsRefreshing(false);
      setCacheNotification(`CACHE_REFRESHED: 100% telemetry synced via satellite downlink at ${refreshed.cacheStats.lastPurge}`);
      if (onMissionLog) {
        onMissionLog('THREAT_INTEL_CACHE_PURGED: Local storage cache invalidated. Resynced 44 tactical threat vectors from live RF downlink.', 'success');
      }
      setTimeout(() => setCacheNotification(null), 5000);
    }, 600);
  };

  // Focus on threat coordinates
  const handleSelectThreatItem = (type: ThreatLayer, data: any) => {
    audioController.playBeep(880, 0.06);
    setSelectedThreat({ type, data });
    if (onSelectCoordinates && data.lat !== undefined && data.lng !== undefined) {
      onSelectCoordinates({ lat: data.lat, lng: data.lng });
    } else if (onSelectCoordinates && data.center) {
      onSelectCoordinates(data.center);
    }
  };

  // Operator ground station and satellite position projections
  const operatorPos = projection([userLoc.lng, userLoc.lat]);
  const satPos = projection([selectedSatellite.longitude, 0]);

  // Aggregate stats
  const totalThreatsTracked = intelData.gpsSpoofingAreas.length + 
    intelData.ewPulseEmissions.length + 
    intelData.malwareC2Hqs.length + 
    intelData.interferenceHotspots.length;

  const activeThreatsInView = filteredGpsSpoofing.length + 
    filteredEwPulses.length + 
    filteredMalwareC2.length + 
    filteredInterference.length;

  // Flattened data for ModuleExportToolbar
  const exportRows = useMemo(() => {
    const rows: Record<string, any>[] = [];
    filteredGpsSpoofing.forEach(s => rows.push({
      category: 'GPS Spoofing Area',
      name: s.name,
      location: `${s.center.lat.toFixed(2)}°N, ${s.center.lng.toFixed(2)}°E`,
      severity: s.severity,
      details: `${s.technique} (Radius: ${s.radiusKm}km, Drift: ${s.driftRateMetersSec}m/s)`,
      victims: s.reportedVictims,
      status: s.status
    }));
    filteredEwPulses.forEach(e => rows.push({
      category: 'EW Pulse Emission',
      name: e.emitterName,
      location: `${e.lat.toFixed(2)}°N, ${e.lng.toFixed(2)}°E`,
      severity: e.threatLevel,
      details: `Power: ${e.peakPowerKw}kW (${e.erpDbm}dBm ERP) | PRF: ${e.prfHz}Hz | Band: ${e.targetBand}`,
      victims: 'N/A',
      status: 'TRANSMITTING'
    }));
    filteredMalwareC2.forEach(c => rows.push({
      category: 'Malware C2 HQ',
      name: c.hqName,
      location: `${c.lat.toFixed(2)}°N, ${c.lng.toFixed(2)}°E`,
      severity: c.severity,
      details: `${c.malwareFamily} | IP: ${c.c2Ip}:${c.port} | Protocol: ${c.protocol}`,
      victims: `${c.activeBeacons} beacons`,
      status: 'LIVE'
    }));
    filteredInterference.forEach(i => rows.push({
      category: 'Signal Interference',
      name: i.name,
      location: `${i.lat.toFixed(2)}°N, ${i.lng.toFixed(2)}°E`,
      severity: i.intensity > 0.9 ? 'CRITICAL' : 'HIGH',
      details: `Type: ${i.interferenceType} | Transponder: ${i.affectedTransponder} | Degradation: ${i.snrDegradationDb}dB`,
      victims: 'N/A',
      status: 'DETECTED'
    }));
    return rows;
  }, [filteredGpsSpoofing, filteredEwPulses, filteredMalwareC2, filteredInterference]);

  return (
    <div className={`p-5 rounded-3xl border-2 transition-all duration-300 flex flex-col space-y-4 ${
      isStealthMode 
        ? 'bg-black border-purple-950/70 shadow-[0_20px_50px_rgba(168,85,247,0.06)]' 
        : 'bg-slate-950 border-slate-800 shadow-[0_25px_60px_rgba(0,0,0,0.8)]'
    }`}>
      {/* HUD Header Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-red-950/70 border border-red-500/50 flex items-center justify-center text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-100 font-mono">
                GLOBAL_THREAT_HEATMAP
              </h2>
              <span className="text-[9px] font-mono bg-red-950/80 text-red-300 border border-red-800/80 px-1.5 py-0.5 rounded">
                D3 TACTICAL RADAR
              </span>
              <span className="text-[9px] font-mono text-cyan-400 hidden sm:inline">
                {activeThreatsInView} ACTIVE IN VIEW / {totalThreatsTracked} CATALOGED
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono tracking-wide">
              Global Electronic Warfare Pulse Energy, GPS/GNSS Spoofing Zones & Malware C2 HQ Matrix
            </p>
          </div>
        </div>

        {/* Top Control Actions: Theater Presets, Cache Status, Export */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-start lg:justify-end">
          {/* Cache Status Badge & Purge Button */}
          <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 px-2 py-1 rounded-xl font-mono text-[9px]">
            <Database className="w-3 h-3 text-cyan-400" />
            <span className="text-slate-400 hidden sm:inline">CACHE:</span>
            <span className="text-emerald-400 font-bold">{intelData.cacheStats.source === 'LOCAL_STORAGE_CACHE' ? 'PERSISTED' : 'LIVE'}</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-300">{threatIntelCache.getCacheSizeKb()} KB</span>
            <button
              onClick={handlePurgeAndRefresh}
              disabled={isRefreshing}
              title="Force Cache Purge and Re-synchronize from Satellite Downlink"
              className="ml-1 p-0.5 text-slate-400 hover:text-cyan-300 transition"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>

          {/* Module Export Toolbar */}
          <ModuleExportToolbar
            compact={true}
            moduleTitle="GLOBAL THREAT HEATMAP & EW INTELLIGENCE DOSSIER"
            moduleSubtitle={`Theater: ${theater} | Node: ${selectedSatellite.name} | Active In View: ${activeThreatsInView}`}
            classification={isStealthMode ? 'TOP SECRET // NOFORN' : 'SECRET // REL TO NATO'}
            columns={[
              { header: 'Threat Category', key: 'category' },
              { header: 'Designator / Name', key: 'name' },
              { header: 'Coordinates', key: 'location' },
              { header: 'Severity', key: 'severity' },
              { header: 'Technical Parameters', key: 'details' },
              { header: 'Impacted Units / Beacons', key: 'victims' },
              { header: 'Status', key: 'status' }
            ]}
            rows={exportRows}
            filenamePrefix="TSI_Threat_Heatmap"
            summaryText={`Global signal interference, high-energy EW pulse detection, GPS spoofing bubbles, and malware C2 infrastructure intelligence assessment.`}
          />
        </div>
      </div>

      {/* Cache Notification Banner */}
      {cacheNotification && (
        <div className="bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 px-3 py-1.5 rounded-xl font-mono text-[9px] flex items-center justify-between animate-in fade-in">
          <div className="flex items-center space-x-2">
            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{cacheNotification}</span>
          </div>
          <button onClick={() => setCacheNotification(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Filter and Theater Segmented Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-slate-900/70 p-3 rounded-2xl border border-slate-800/80 text-xs font-mono">
        {/* Layer Toggles */}
        <div className="md:col-span-6 flex flex-wrap items-center gap-1.5">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mr-1">LAYERS:</span>
          
          <button
            onClick={() => toggleLayer('INTERFERENCE')}
            className={`px-2 py-1 rounded-lg text-[9px] font-bold transition flex items-center space-x-1.5 border ${
              activeLayers.INTERFERENCE 
                ? 'bg-amber-950/80 border-amber-500/80 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]' 
                : 'bg-slate-950 border-slate-850 text-slate-500'
            }`}
          >
            <Waves className="w-3 h-3 text-amber-400" />
            <span>RF INTERFERENCE ({intelData.interferenceHotspots.length})</span>
          </button>

          <button
            onClick={() => toggleLayer('GPS_SPOOFING')}
            className={`px-2 py-1 rounded-lg text-[9px] font-bold transition flex items-center space-x-1.5 border ${
              activeLayers.GPS_SPOOFING 
                ? 'bg-red-950/80 border-red-500/80 text-red-300 shadow-[0_0_10px_rgba(239,68,68,0.3)]' 
                : 'bg-slate-950 border-slate-850 text-slate-500'
            }`}
          >
            <Compass className="w-3 h-3 text-red-400" />
            <span>GPS SPOOFING ({intelData.gpsSpoofingAreas.length})</span>
          </button>

          <button
            onClick={() => toggleLayer('EW_PULSE')}
            className={`px-2 py-1 rounded-lg text-[9px] font-bold transition flex items-center space-x-1.5 border ${
              activeLayers.EW_PULSE 
                ? 'bg-cyan-950/80 border-cyan-500/80 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]' 
                : 'bg-slate-950 border-slate-850 text-slate-500'
            }`}
          >
            <Zap className="w-3 h-3 text-cyan-400" />
            <span>EW PULSES ({intelData.ewPulseEmissions.length})</span>
          </button>

          <button
            onClick={() => toggleLayer('MALWARE_C2')}
            className={`px-2 py-1 rounded-lg text-[9px] font-bold transition flex items-center space-x-1.5 border ${
              activeLayers.MALWARE_C2 
                ? 'bg-purple-950/80 border-purple-500/80 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.3)]' 
                : 'bg-slate-950 border-slate-850 text-slate-500'
            }`}
          >
            <Server className="w-3 h-3 text-purple-400" />
            <span>C2 MALWARE HQ ({intelData.malwareC2Hqs.length})</span>
          </button>
        </div>

        {/* Theater Zoom Presets */}
        <div className="md:col-span-6 flex flex-wrap items-center justify-start md:justify-end gap-1.5">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mr-1">THEATER:</span>
          {(['GLOBAL', 'HORMUZ', 'LEVANT', 'BLACK_SEA', 'BALTIC', 'SOUTH_CHINA_SEA'] as TheaterFocus[]).map(t => (
            <button
              key={t}
              onClick={() => {
                audioController.playBeep(640, 0.04);
                setTheater(t);
              }}
              className={`px-2 py-1 rounded-lg text-[9px] font-mono font-bold transition border ${
                theater === t
                  ? 'bg-cyan-500 border-cyan-400 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Main D3 Heatmap Canvas & Interactive Stage */}
      <div className="relative aspect-[2/1] w-full rounded-2xl bg-black border border-slate-900 overflow-hidden cursor-crosshair group shadow-inner">
        {/* Dynamic scanline radar sweep */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-950/10 via-transparent to-transparent opacity-40"></div>

        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full absolute inset-0 select-none"
        >
          {/* DEFINITIONS FOR GRADIENTS AND PATTERNS */}
          <defs>
            {/* GPS Spoofing Radar Glow */}
            <radialGradient id="d3-spoof-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#ef4444" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
            </radialGradient>

            {/* EW Pulse Energy Burst Glow */}
            <radialGradient id="d3-ew-burst" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.95" />
              <stop offset="35%" stopColor="#0284c7" stopOpacity="0.6" />
              <stop offset="70%" stopColor="#0369a1" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#082f49" stopOpacity="0.0" />
            </radialGradient>

            {/* Malware C2 Cyber Core Glow */}
            <radialGradient id="d3-c2-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#d946ef" stopOpacity="0.85" />
              <stop offset="45%" stopColor="#9333ea" stopOpacity="0.4" />
              <stop offset="85%" stopColor="#581c87" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#3b0764" stopOpacity="0.0" />
            </radialGradient>

            {/* Signal Interference Thermal Flame Glow */}
            <radialGradient id="d3-rf-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="25%" stopColor="#fde047" stopOpacity="0.75" />
              <stop offset="55%" stopColor="#f97316" stopOpacity="0.5" />
              <stop offset="85%" stopColor="#dc2626" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0.0" />
            </radialGradient>
          </defs>

          {/* D3 TACTICAL GRATICULE GRID */}
          {graticules && (
            <path
              d={graticules}
              fill="none"
              stroke="#1e293b"
              strokeWidth="0.5"
              strokeDasharray="2,2"
              opacity="0.45"
            />
          )}

          {/* CONTINENTAL LANDMASS BASELINE PATHS */}
          <g fill="#0f172a" fillOpacity="0.6" stroke="#334155" strokeWidth="0.8" strokeOpacity="0.5">
            {WORLD_LANDMASS_FEATURES.map((polygon, idx) => {
              const geoJsonPolygon: GeoJSON.Feature<GeoJSON.Polygon> = {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'Polygon',
                  coordinates: [polygon]
                }
              };
              const pathStr = geoPathGenerator(geoJsonPolygon);
              return pathStr ? <path key={`land-${idx}`} d={pathStr} /> : null;
            })}
          </g>

          {/* LAYER 1: D3 CONTINUOUS SIGNAL INTERFERENCE DENSITY CONTOURS */}
          {interferenceContours.map((contour, i) => {
            const contourPath = geoPathGenerator(contour as any);
            if (!contourPath) return null;
            const opacity = 0.12 + (i / interferenceContours.length) * 0.25;
            const strokeColor = i > 4 ? '#ef4444' : i > 2 ? '#f97316' : '#eab308';
            return (
              <path
                key={`contour-${i}`}
                d={contourPath}
                fill="#f97316"
                fillOpacity={opacity * 0.4}
                stroke={strokeColor}
                strokeWidth={0.7}
                strokeOpacity={opacity * 1.5}
              />
            );
          })}

          {/* LAYER 1B: SIGNAL INTERFERENCE HOTSPOT DISCRETE MARKERS */}
          {activeLayers.INTERFERENCE && filteredInterference.map((hotspot) => {
            const pos = projection([hotspot.lng, hotspot.lat]);
            if (!pos) return null;
            const radius = Math.max(12, hotspot.intensity * 28);
            const isSelected = selectedThreat?.data?.id === hotspot.id;

            return (
              <g
                key={hotspot.id}
                className="cursor-pointer transition-transform duration-200"
                onClick={() => handleSelectThreatItem('INTERFERENCE', hotspot)}
                onMouseEnter={() => setHoveredThreat({ type: 'INTERFERENCE', data: hotspot, x: pos[0], y: pos[1] })}
                onMouseLeave={() => setHoveredThreat(null)}
              >
                <circle
                  cx={pos[0]}
                  cy={pos[1]}
                  r={radius}
                  fill="url(#d3-rf-glow)"
                  className="animate-pulse"
                />
                <circle
                  cx={pos[0]}
                  cy={pos[1]}
                  r={radius * 1.25}
                  fill="none"
                  stroke="#f97316"
                  strokeWidth={isSelected ? 1.8 : 0.8}
                  strokeDasharray="3,3"
                />
                <circle cx={pos[0]} cy={pos[1]} r={2.5} fill="#ffffff" />
                <text
                  x={pos[0]}
                  y={pos[1] - radius - 4}
                  textAnchor="middle"
                  fill="#fbbf24"
                  fontSize={8}
                  fontWeight="bold"
                  fontFamily="monospace"
                  className="pointer-events-none drop-shadow"
                >
                  ⚡ {hotspot.name.split(' ')[0]} [-{hotspot.snrDegradationDb}dB]
                </text>
              </g>
            );
          })}

          {/* LAYER 2: GPS / GNSS SPOOFING AREAS & MEACONING BUBBLES */}
          {activeLayers.GPS_SPOOFING && filteredGpsSpoofing.map((spoof) => {
            const pos = projection([spoof.center.lng, spoof.center.lat]);
            if (!pos) return null;
            // Scale radius based on theater bounds and real km
            const pixelRadius = Math.max(16, (spoof.radiusKm / 12) * (theater === 'GLOBAL' ? 1.0 : theaterBounds.scaleMultiplier * 0.45));
            const isSelected = selectedThreat?.data?.id === spoof.id;

            return (
              <g
                key={spoof.id}
                className="cursor-pointer transition-transform duration-200"
                onClick={() => handleSelectThreatItem('GPS_SPOOFING', spoof)}
                onMouseEnter={() => setHoveredThreat({ type: 'GPS_SPOOFING', data: spoof, x: pos[0], y: pos[1] })}
                onMouseLeave={() => setHoveredThreat(null)}
              >
                {/* Spoofing Area Radar Bubble */}
                <circle
                  cx={pos[0]}
                  cy={pos[1]}
                  r={pixelRadius}
                  fill="url(#d3-spoof-glow)"
                />
                <circle
                  cx={pos[0]}
                  cy={pos[1]}
                  r={pixelRadius}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth={isSelected ? 2.0 : 1.0}
                  strokeDasharray="4,2"
                  className="animate-spin-slow"
                  style={{ transformOrigin: `${pos[0]}px ${pos[1]}px` }}
                />
                {/* Meaconing Target Reticle Center */}
                <circle cx={pos[0]} cy={pos[1]} r={3} fill="#ef4444" />
                <line x1={pos[0] - 6} y1={pos[1]} x2={pos[0] + 6} y2={pos[1]} stroke="#ffffff" strokeWidth={0.8} />
                <line x1={pos[0]} y1={pos[1] - 6} x2={pos[0]} y2={pos[1] + 6} stroke="#ffffff" strokeWidth={0.8} />

                {/* Drift Velocity Vector Arrow */}
                <line
                  x1={pos[0]}
                  y1={pos[1]}
                  x2={pos[0] + spoof.driftRateMetersSec * 0.45}
                  y2={pos[1] - spoof.driftRateMetersSec * 0.3}
                  stroke="#fca5a5"
                  strokeWidth={1.4}
                />

                <text
                  x={pos[0]}
                  y={pos[1] + pixelRadius + 9}
                  textAnchor="middle"
                  fill="#f87171"
                  fontSize={8}
                  fontWeight="bold"
                  fontFamily="monospace"
                  className="pointer-events-none drop-shadow"
                >
                  📡 {spoof.designator} [{spoof.reportedVictims} VCT]
                </text>
              </g>
            );
          })}

          {/* LAYER 3: HIGH-ENERGY EW PULSE DETECTIONS */}
          {activeLayers.EW_PULSE && filteredEwPulses.map((pulse) => {
            const pos = projection([pulse.lng, pulse.lat]);
            if (!pos) return null;
            const pulseRadius = Math.max(14, (pulse.peakPowerKw / 40) * (theater === 'GLOBAL' ? 1.0 : theaterBounds.scaleMultiplier * 0.35));
            const isSelected = selectedThreat?.data?.id === pulse.id;

            return (
              <g
                key={pulse.id}
                className="cursor-pointer transition-transform duration-200"
                onClick={() => handleSelectThreatItem('EW_PULSE', pulse)}
                onMouseEnter={() => setHoveredThreat({ type: 'EW_PULSE', data: pulse, x: pos[0], y: pos[1] })}
                onMouseLeave={() => setHoveredThreat(null)}
              >
                {/* High Energy Microwave Burst Radiation */}
                <circle
                  cx={pos[0]}
                  cy={pos[1]}
                  r={pulseRadius}
                  fill="url(#d3-ew-burst)"
                  className="animate-pulse"
                />
                <polygon
                  points={`${pos[0]},${pos[1] - 5} ${pos[0] + 4.5},${pos[0] ? pos[1] + 3 : 0} ${pos[0] - 4.5},${pos[0] ? pos[1] + 3 : 0}`}
                  fill="#22d3ee"
                  stroke="#ffffff"
                  strokeWidth={0.8}
                />
                <circle cx={pos[0]} cy={pos[1]} r={2} fill="#ffffff" />

                <text
                  x={pos[0]}
                  y={pos[1] - pulseRadius - 4}
                  textAnchor="middle"
                  fill="#38bdf8"
                  fontSize={8}
                  fontWeight="bold"
                  fontFamily="monospace"
                  className="pointer-events-none drop-shadow"
                >
                  ⚡ {pulse.emitterName.split(' ')[0]} [{pulse.peakPowerKw}kW]
                </text>
              </g>
            );
          })}

          {/* LAYER 4: CYBER COMMAND & CONTROL (C2) MALWARE HQ */}
          {activeLayers.MALWARE_C2 && filteredMalwareC2.map((c2) => {
            const pos = projection([c2.lng, c2.lat]);
            if (!pos) return null;
            const isSelected = selectedThreat?.data?.id === c2.id;

            return (
              <g
                key={c2.id}
                className="cursor-pointer transition-transform duration-200"
                onClick={() => handleSelectThreatItem('MALWARE_C2', c2)}
                onMouseEnter={() => setHoveredThreat({ type: 'MALWARE_C2', data: c2, x: pos[0], y: pos[1] })}
                onMouseLeave={() => setHoveredThreat(null)}
              >
                <circle
                  cx={pos[0]}
                  cy={pos[1]}
                  r={18}
                  fill="url(#d3-c2-glow)"
                />
                {/* Diamond Box */}
                <polygon
                  points={`${pos[0]},${pos[1] - 6} ${pos[0] + 6},${pos[1]} ${pos[0]},${pos[1] + 6} ${pos[0] - 6},${pos[1]}`}
                  fill="#c026d3"
                  stroke={isSelected ? "#fdf4ff" : "#e879f9"}
                  strokeWidth={isSelected ? 1.8 : 1.0}
                />
                <circle cx={pos[0]} cy={pos[1]} r={2} fill="#ffffff" />

                <text
                  x={pos[0]}
                  y={pos[1] + 16}
                  textAnchor="middle"
                  fill="#f0abfc"
                  fontSize={8}
                  fontWeight="bold"
                  fontFamily="monospace"
                  className="pointer-events-none drop-shadow"
                >
                  ☠ {c2.malwareFamily.split(' ')[0]} [{c2.activeBeacons} BCN]
                </text>
              </g>
            );
          })}

          {/* OPERATOR GROUND TERMINAL POSITION VECTOR */}
          {operatorPos && (
            <g>
              <circle
                cx={operatorPos[0]}
                cy={operatorPos[1]}
                r={16}
                fill="none"
                stroke="#22d3ee"
                strokeWidth={0.8}
                className="animate-ping"
                style={{ transformOrigin: `${operatorPos[0]}px ${operatorPos[1]}px` }}
              />
              <circle cx={operatorPos[0]} cy={operatorPos[1]} r={3.5} fill="#22d3ee" stroke="#ffffff" strokeWidth={0.8} />
              <text
                x={operatorPos[0]}
                y={operatorPos[1] - 8}
                textAnchor="middle"
                fill="#67e8f9"
                fontSize={8}
                fontWeight="black"
                fontFamily="monospace"
                className="pointer-events-none drop-shadow"
              >
                ⊕ BASE STATION
              </text>
            </g>
          )}

          {/* GEOSTATIONARY SATELLITE SUBSATELLITE POINT */}
          {satPos && (
            <g>
              <circle cx={satPos[0]} cy={satPos[1]} r={4} fill="#a855f7" stroke="#ffffff" strokeWidth={0.8} />
              <text
                x={satPos[0]}
                y={satPos[1] + 11}
                textAnchor="middle"
                fill="#d8b4fe"
                fontSize={8}
                fontWeight="bold"
                fontFamily="monospace"
                className="pointer-events-none drop-shadow"
              >
                🛰 {selectedSatellite.name} ({selectedSatellite.orbitalSlot})
              </text>
            </g>
          )}
        </svg>

        {/* Floating Quick Tooltip */}
        {hoveredThreat && (
          <div
            className="absolute z-20 pointer-events-none bg-slate-900/95 border border-cyan-500/70 p-2.5 rounded-xl text-left shadow-2xl font-mono text-[9px] max-w-xs animate-in fade-in"
            style={{
              left: `${Math.min(hoveredThreat.x + 12, width - 220)}px`,
              top: `${Math.min(hoveredThreat.y + 12, height - 120)}px`
            }}
          >
            <div className="flex items-center space-x-1.5 text-cyan-400 font-bold mb-1">
              <Crosshair className="w-3 h-3" />
              <span>{hoveredThreat.type}: {hoveredThreat.data.name || hoveredThreat.data.emitterName || hoveredThreat.data.hqName}</span>
            </div>
            <div className="text-slate-300 space-y-0.5">
              {hoveredThreat.type === 'GPS_SPOOFING' && (
                <>
                  <div>Technique: {hoveredThreat.data.technique}</div>
                  <div>Radius: {hoveredThreat.data.radiusKm} km | Drift: {hoveredThreat.data.driftRateMetersSec} m/s</div>
                  <div className="text-red-400 font-bold">Affected Victims: {hoveredThreat.data.reportedVictims} AIS/ADS-B vessels</div>
                </>
              )}
              {hoveredThreat.type === 'EW_PULSE' && (
                <>
                  <div>Power: {hoveredThreat.data.peakPowerKw} kW ({hoveredThreat.data.erpDbm} dBm ERP)</div>
                  <div>Frequency: {hoveredThreat.data.carrierFreqGhz} GHz | PRF: {hoveredThreat.data.prfHz} Hz</div>
                  <div className="text-amber-400 font-bold">Target Band: {hoveredThreat.data.targetBand}</div>
                </>
              )}
              {hoveredThreat.type === 'MALWARE_C2' && (
                <>
                  <div>Actor: {hoveredThreat.data.actorGroup}</div>
                  <div>C2 IP: {hoveredThreat.data.c2Ip}:{hoveredThreat.data.port}</div>
                  <div className="text-purple-400 font-bold">Active Beacons: {hoveredThreat.data.activeBeacons}</div>
                </>
              )}
              {hoveredThreat.type === 'INTERFERENCE' && (
                <>
                  <div>Type: {hoveredThreat.data.interferenceType}</div>
                  <div>Bandwidth: {hoveredThreat.data.bandwidthMhz} MHz | SNR Loss: -{hoveredThreat.data.snrDegradationDb} dB</div>
                  <div className="text-amber-400 font-bold">Transponder: {hoveredThreat.data.affectedTransponder}</div>
                </>
              )}
            </div>
            <div className="mt-1 pt-1 border-t border-slate-800 text-[8px] text-slate-500">
              CLICK TO ENGAGE FULL TACTICAL INSPECTION
            </div>
          </div>
        )}
      </div>

      {/* Threat Detail Inspector Drawer & Data Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 font-mono text-xs">
        {/* Left Column: Selected Threat Tactical Dossier */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span>THREAT_VECTOR_DOSSIER</span>
              </span>
              {selectedThreat && (
                <span className="text-[9px] px-2 py-0.5 rounded font-bold bg-red-950/80 border border-red-800 text-red-300">
                  {selectedThreat.type}
                </span>
              )}
            </div>

            {selectedThreat ? (
              <div className="pt-3 space-y-2.5 text-[10.5px]">
                <div>
                  <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide">
                    {getThreatTitle(selectedThreat)}
                  </h3>
                  <p className="text-[9.5px] text-slate-400">
                    {getThreatSubtitle(selectedThreat)}
                  </p>
                </div>

                {selectedThreat.type === 'GPS_SPOOFING' && (
                  <div className="space-y-1.5 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-500">Center Coordinates:</span>
                      <strong className="text-cyan-300">{(selectedThreat.data as GpsSpoofingArea).center.lat.toFixed(4)}°N, {(selectedThreat.data as GpsSpoofingArea).center.lng.toFixed(4)}°E</strong>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-500">Bubble Radius:</span>
                      <span>{(selectedThreat.data as GpsSpoofingArea).radiusKm} km</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-500">Pseudorange Drift:</span>
                      <strong className="text-red-400 font-bold">{(selectedThreat.data as GpsSpoofingArea).driftRateMetersSec} m/s</strong>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-500">Reported Victims:</span>
                      <strong className="text-amber-400 font-bold">{(selectedThreat.data as GpsSpoofingArea).reportedVictims} Vessels/Aircraft</strong>
                    </div>
                    <div className="text-[9px] text-slate-400 pt-1 border-t border-slate-800/60">
                      <strong>Tactical Impact:</strong> {(selectedThreat.data as GpsSpoofingArea).tacticalImpact}
                    </div>
                    <div className="text-[9px] text-emerald-400 pt-1">
                      <strong>Countermeasure:</strong> {(selectedThreat.data as GpsSpoofingArea).countermeasure}
                    </div>
                  </div>
                )}

                {selectedThreat.type === 'EW_PULSE' && (
                  <div className="space-y-1.5 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-500">Peak Radiated Power:</span>
                      <strong className="text-cyan-400">{(selectedThreat.data as EwPulseEmission).peakPowerKw} kW ({(selectedThreat.data as EwPulseEmission).erpDbm} dBm ERP)</strong>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-500">Center Frequency:</span>
                      <span>{(selectedThreat.data as EwPulseEmission).carrierFreqGhz} GHz</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-500">PRF & Pulse Width:</span>
                      <span>{(selectedThreat.data as EwPulseEmission).prfHz} Hz | {(selectedThreat.data as EwPulseEmission).pulseWidthUs} µs</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-500">Platform & Unit:</span>
                      <span className="text-slate-200">{(selectedThreat.data as EwPulseEmission).platformType} ({(selectedThreat.data as EwPulseEmission).operatorOrUnit})</span>
                    </div>
                    <div className="text-[9px] text-slate-400 pt-1 border-t border-slate-800/60">
                      <strong>Target Satcom Band:</strong> {(selectedThreat.data as EwPulseEmission).targetBand}
                    </div>
                    <div className="text-[9px] text-amber-300 pt-1">
                      <strong>Tactical Notes:</strong> {(selectedThreat.data as EwPulseEmission).tacticalNotes}
                    </div>
                  </div>
                )}

                {selectedThreat.type === 'MALWARE_C2' && (
                  <div className="space-y-1.5 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-500">Malware Family:</span>
                      <strong className="text-purple-400">{(selectedThreat.data as MalwareC2Hq).malwareFamily}</strong>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-500">C2 Server Socket:</span>
                      <strong className="text-slate-100">{(selectedThreat.data as MalwareC2Hq).c2Ip}:{(selectedThreat.data as MalwareC2Hq).port}</strong>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-500">Active Beacons:</span>
                      <strong className="text-red-400 font-bold">{(selectedThreat.data as MalwareC2Hq).activeBeacons} Infected Nodes</strong>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-500">IOC SHA-256:</span>
                      <span className="text-[8px] text-slate-400 truncate max-w-[150px]">{(selectedThreat.data as MalwareC2Hq).iocHash}</span>
                    </div>
                    <div className="text-[9px] text-slate-400 pt-1 border-t border-slate-800/60">
                      <strong>Target Satcom:</strong> {(selectedThreat.data as MalwareC2Hq).targetedSatcom.join(', ')}
                    </div>
                    <div className="text-[9px] text-cyan-300 pt-1">
                      <strong>Recommended Countermeasure:</strong> {(selectedThreat.data as MalwareC2Hq).defenseAction}
                    </div>
                  </div>
                )}

                {selectedThreat.type === 'INTERFERENCE' && (
                  <div className="space-y-1.5 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-500">Interference Mode:</span>
                      <strong className="text-amber-400">{(selectedThreat.data as SignalInterferenceHotspot).interferenceType}</strong>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-500">Downlink SNR Loss:</span>
                      <strong className="text-red-400 font-bold">-{(selectedThreat.data as SignalInterferenceHotspot).snrDegradationDb} dB</strong>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-500">Bandwidth:</span>
                      <span>{(selectedThreat.data as SignalInterferenceHotspot).bandwidthMhz} MHz</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-500">Affected Transponder:</span>
                      <span className="text-cyan-300">{(selectedThreat.data as SignalInterferenceHotspot).affectedTransponder}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-10 text-center text-slate-500 text-xs">
                <Compass className="w-8 h-8 text-slate-700 mx-auto mb-2 animate-spin-slow" />
                <p>Click on any threat marker on the D3 radar map to inspect real-time electronic warfare parameters and defense countermeasures.</p>
              </div>
            )}
          </div>

          {selectedThreat && (
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[9px]">
              <span className="text-slate-500">TACTICAL DEFCON 1 READINESS</span>
              <button
                onClick={() => setSelectedThreat(null)}
                className="text-slate-400 hover:text-white"
              >
                DISMISS INSPECTOR
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Live Threat Feed Stream */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2">
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                LIVE_THREAT_SPECTRAL_MATRIX
              </span>
            </div>

            {/* Severity Filter Tabs */}
            <div className="flex items-center space-x-1 bg-slate-950 p-0.5 rounded-lg border border-slate-850 text-[8.5px]">
              {(['ALL', 'CRITICAL', 'HIGH', 'ELEVATED'] as SeverityFilter[]).map(s => (
                <button
                  key={s}
                  onClick={() => {
                    audioController.playBeep(580, 0.04);
                    setSeverityFilter(s);
                  }}
                  className={`px-2 py-0.5 rounded transition ${
                    severityFilter === s
                      ? 'bg-red-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search threat by name, actor, designator, frequency, or IP address..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-[10px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/70"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Scrollable Threat Feed List */}
          <div className="space-y-2 max-h-[340px] overflow-y-auto scrollbar-thin pr-1">
            {exportRows.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                No active threats match the current search filters.
              </div>
            ) : (
              exportRows.map((item, idx) => (
                <div
                  key={`feed-${idx}`}
                  onClick={() => {
                    // Match and open threat
                    const matchedGps = intelData.gpsSpoofingAreas.find(g => g.name === item.name);
                    if (matchedGps) return handleSelectThreatItem('GPS_SPOOFING', matchedGps);
                    const matchedEw = intelData.ewPulseEmissions.find(e => e.emitterName === item.name);
                    if (matchedEw) return handleSelectThreatItem('EW_PULSE', matchedEw);
                    const matchedC2 = intelData.malwareC2Hqs.find(c => c.hqName === item.name);
                    if (matchedC2) return handleSelectThreatItem('MALWARE_C2', matchedC2);
                    const matchedRf = intelData.interferenceHotspots.find(r => r.name === item.name);
                    if (matchedRf) return handleSelectThreatItem('INTERFERENCE', matchedRf);
                  }}
                  className="bg-slate-950/70 border border-slate-800/80 hover:border-cyan-500/50 p-2.5 rounded-xl cursor-pointer transition flex items-center justify-between group"
                >
                  <div className="space-y-0.5 truncate pr-2">
                    <div className="flex items-center space-x-2">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        item.severity === 'CRITICAL' ? 'bg-red-400 animate-ping' : item.severity === 'HIGH' ? 'bg-amber-400' : 'bg-cyan-400'
                      }`}></span>
                      <span className="text-[10px] font-bold text-slate-200 group-hover:text-cyan-300 transition truncate">
                        {item.name}
                      </span>
                      <span className="text-[8px] text-slate-500 hidden sm:inline">[{item.category}]</span>
                    </div>
                    <div className="text-[8.5px] text-slate-400 truncate">
                      {item.details}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                      item.severity === 'CRITICAL'
                        ? 'bg-red-950 text-red-300 border border-red-800'
                        : item.severity === 'HIGH'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                    }`}>
                      {item.severity}
                    </span>
                    <div className="text-[8px] text-slate-500 mt-1 font-mono">
                      {item.location}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
