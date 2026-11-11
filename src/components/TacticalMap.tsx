import React, { useRef, useState, useMemo, useEffect } from 'react';
import { 
  Compass, Crosshair, MapPin, Navigation, Orbit, ShieldAlert, 
  Radio, WifiOff, AlertTriangle, CloudRain, Zap, Eye, EyeOff,
  Filter, Info, X, ChevronRight, Activity, Layers, ShieldCheck,
  Flame, Bug, Globe, Satellite as SatIcon, RefreshCw, Anchor, Ship, Search
} from 'lucide-react';
import { Coordinates, Satellite } from '../types.ts';
import { audioController } from '../services/audioService.ts';
import {
  StrategicZone,
  StrategicZoneType,
  SeverityLevel,
  TelemetryState,
  convertCoordsToSvg,
  calculateDistanceKm,
  calculateDistanceDeg,
  buildLiveStrategicZones,
  evaluateThreatEnvironment
} from '../utils/strategicOverlayUtils.ts';
import {
  DETECTED_FIRES,
  HORMUZ_MARITIME_FIRES,
  MIDDLE_EAST_LAND_FIRES,
  ALL_MIDDLE_EAST_AND_HORMUZ_FIRES,
  ALL_MIDDLE_EAST_FIRES,
  DETECTED_MALWARE_C2,
  getTelstar11NTransportParams,
  FireDetection,
  MalwareC2Detection
} from '../utils/heatmapData.ts';
import { nasaFirmsService } from '../services/nasaFirmsService.ts';

export type TheaterViewMode = 'GLOBAL' | 'HORMUZ_AND_MIDEAST' | 'HORMUZ_CHOKEPOINT';
export type FireScopeFilter = 'ALWAYS_HORMUZ_AND_MIDEAST' | 'ALL_GLOBAL' | 'HORMUZ_SHIPS' | 'MIDEAST_LAND';

interface TacticalMapProps {
  userLoc: Coordinates;
  satellite: Satellite;
  isTracking: boolean;
  isStealthMode: boolean;
  onLocChange: (loc: Coordinates) => void;
  telemetry?: TelemetryState;
  isJamming?: boolean;
  jammingPower?: number;
  weather?: string;
  onSelectSatellite?: (sat: Satellite) => void;
  onOpenC4ISR?: () => void;
  onOpenMaritimeMonitor?: () => void;
}

export const TacticalMap: React.FC<TacticalMapProps> = ({
  userLoc,
  satellite,
  isTracking,
  isStealthMode,
  onLocChange,
  telemetry,
  isJamming = false,
  jammingPower = 20,
  weather = 'CLEAR',
  onSelectSatellite,
  onOpenC4ISR,
  onOpenMaritimeMonitor
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverCoord, setHoverCoord] = useState<Coordinates | null>(null);

  // Theater View Mode (Global / Middle East Regional / Strait of Hormuz Chokepoint)
  const [theaterView, setTheaterView] = useState<TheaterViewMode>('HORMUZ_AND_MIDEAST');
  const [showNasaDossier, setShowNasaDossier] = useState<boolean>(false);
  const [dossierSearch, setDossierSearch] = useState<string>('');

  // Strategic Overlay Controls
  const [isOverlayEnabled, setIsOverlayEnabled] = useState<boolean>(true);
  const [layerFilters, setLayerFilters] = useState<Record<StrategicZoneType, boolean>>({
    restricted_airspace: true,
    jamming_zone: true,
    interference_area: true
  });
  const [selectedZone, setSelectedZone] = useState<StrategicZone | null>(null);
  const [hoveredZone, setHoveredZone] = useState<StrategicZone | null>(null);

  // Heatmap Controls: ALWAYS defaults to ALWAYS_HORMUZ_AND_MIDEAST
  const [isHeatmapEnabled, setIsHeatmapEnabled] = useState<boolean>(true);
  const [fireScopeFilter, setFireScopeFilter] = useState<FireScopeFilter>('ALWAYS_HORMUZ_AND_MIDEAST');
  const [heatmapLayers, setHeatmapLayers] = useState<{ fires: boolean; malwareC2: boolean }>({
    fires: true,
    malwareC2: true
  });
  const [selectedFire, setSelectedFire] = useState<FireDetection | null>(null);
  const [selectedC2, setSelectedC2] = useState<MalwareC2Detection | null>(null);
  const [hoveredHeatItem, setHoveredHeatItem] = useState<{ type: 'fire'; data: FireDetection } | { type: 'c2'; data: MalwareC2Detection } | null>(null);

  // NASA FIRMS Live Telemetry State
  const [nasaMeta, setNasaMeta] = useState(nasaFirmsService.getLiveMetadata(DETECTED_FIRES));
  const [isSyncingNasa, setIsSyncingNasa] = useState(false);

  // Real-time ticking UTC timestamp and radar sweep angle
  const [liveUtcTime, setLiveUtcTime] = useState(() => new Date().toISOString().slice(11, 19) + ' UTC');
  const [sweepAngle, setSweepAngle] = useState(0);

  useEffect(() => {
    const clockTimer = setInterval(() => {
      setLiveUtcTime(new Date().toISOString().slice(11, 19) + ' UTC');
    }, 1000);
    const sweepTimer = setInterval(() => {
      setSweepAngle(prev => (prev + 3) % 360);
    }, 45);
    return () => {
      clearInterval(clockTimer);
      clearInterval(sweepTimer);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = nasaFirmsService.subscribe(() => {
      setNasaMeta(nasaFirmsService.getLiveMetadata(DETECTED_FIRES));
    });
    return unsubscribe;
  }, []);

  const handleSyncNasaLive = () => {
    setIsSyncingNasa(true);
    audioController.playBeep(1120, 'triangle', 0.09);
    nasaFirmsService.triggerLiveSync();
    setTimeout(() => {
      setIsSyncingNasa(false);
      setNasaMeta(nasaFirmsService.getLiveMetadata(DETECTED_FIRES));
    }, 600);
  };

  // Toggle master overlay
  const handleToggleOverlay = () => {
    const nextState = !isOverlayEnabled;
    setIsOverlayEnabled(nextState);
    if (!nextState) {
      setSelectedZone(null);
      setHoveredZone(null);
    }
    audioController.playBeep(nextState ? 960 : 440, 'triangle', 0.08);
  };

  // Toggle heatmap master
  const handleToggleHeatmap = () => {
    const nextState = !isHeatmapEnabled;
    setIsHeatmapEnabled(nextState);
    if (!nextState) {
      setSelectedFire(null);
      setSelectedC2(null);
      setHoveredHeatItem(null);
    }
    audioController.playBeep(nextState ? 1020 : 480, 'sine', 0.08);
  };

  // Toggle specific layer
  const handleToggleLayer = (type: StrategicZoneType, e: React.MouseEvent) => {
    e.stopPropagation();
    setLayerFilters(prev => ({ ...prev, [type]: !prev[type] }));
    audioController.playBeep(780, 'sine', 0.05);
  };

  // Toggle heatmap layer
  const handleToggleHeatmapLayer = (layer: 'fires' | 'malwareC2', e: React.MouseEvent) => {
    e.stopPropagation();
    setHeatmapLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
    audioController.playBeep(820, 'sine', 0.05);
  };

  // Build reactive real-time zones based on telemetry & environment
  const allZones = useMemo(() => {
    return buildLiveStrategicZones(userLoc, telemetry, isJamming, jammingPower, weather);
  }, [userLoc, telemetry, isJamming, jammingPower, weather]);

  // Filter visible zones
  const visibleZones = useMemo(() => {
    if (!isOverlayEnabled) return [];
    return allZones.filter(z => layerFilters[z.type]);
  }, [allZones, isOverlayEnabled, layerFilters]);

  // Filter visible Fires: ALWAYS includes both Hormuz Maritime Ships & All Middle East Land Fires
  const visibleFires = useMemo(() => {
    if (!isHeatmapEnabled || !heatmapLayers.fires) return [];
    if (fireScopeFilter === 'HORMUZ_SHIPS') return HORMUZ_MARITIME_FIRES;
    if (fireScopeFilter === 'MIDEAST_LAND') return MIDDLE_EAST_LAND_FIRES;
    if (fireScopeFilter === 'ALWAYS_HORMUZ_AND_MIDEAST') return ALL_MIDDLE_EAST_AND_HORMUZ_FIRES;
    return DETECTED_FIRES;
  }, [isHeatmapEnabled, heatmapLayers.fires, fireScopeFilter]);

  const visibleC2Nodes = useMemo(() => {
    if (!isHeatmapEnabled || !heatmapLayers.malwareC2) return [];
    return DETECTED_MALWARE_C2;
  }, [isHeatmapEnabled, heatmapLayers.malwareC2]);

  // Evaluate current operator proximity and threats
  const threatEval = useMemo(() => {
    return evaluateThreatEnvironment(userLoc, allZones);
  }, [userLoc, allZones]);

  // Dynamic ViewBox calculation based on Theater Mode
  const currentViewBox = useMemo(() => {
    switch (theaterView) {
      case 'HORMUZ_CHOKEPOINT':
        // Tight 20x zoom on Strait of Hormuz chokepoint (Ras Musandam, Larak, Tunbs, Jask, Fujairah)
        return { x: 63.4, y: 16.2, w: 5.2, h: 2.6 };
      case 'HORMUZ_AND_MIDEAST':
        // Regional 6.25x zoom on Middle East & Persian Gulf (Egypt to Iran, Turkey to Yemen)
        return { x: 55.0, y: 13.5, w: 16.0, h: 8.0 };
      case 'GLOBAL':
      default:
        return { x: 0, y: 0, w: 100, h: 50 };
    }
  }, [theaterView]);

  // Dynamic scaling factor for icons and text depending on current zoom
  const zoomScale = useMemo(() => {
    if (theaterView === 'HORMUZ_CHOKEPOINT') return 0.22;
    if (theaterView === 'HORMUZ_AND_MIDEAST') return 0.52;
    return 1.0;
  }, [theaterView]);

  // Dynamic click mapping back into WGS-84 Coordinates based on active SVG viewBox
  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const fx = (e.clientX - rect.left) / rect.width;
    const fy = (e.clientY - rect.top) / rect.height;

    const svgX = currentViewBox.x + fx * currentViewBox.w;
    const svgY = currentViewBox.y + fy * currentViewBox.h;

    const lng = -180 + (svgX / 100) * 360;
    const lat = 90 - (svgY / 50) * 180;

    const newLoc = {
      lat: Math.max(-90, Math.min(90, lat)),
      lng: Math.max(-180, Math.min(180, lng))
    };

    onLocChange(newLoc);
    audioController.playBeep(840, 'sine', 0.04);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const fx = (e.clientX - rect.left) / rect.width;
    const fy = (e.clientY - rect.top) / rect.height;

    const svgX = currentViewBox.x + fx * currentViewBox.w;
    const svgY = currentViewBox.y + fy * currentViewBox.h;

    const lng = -180 + (svgX / 100) * 360;
    const lat = 90 - (svgY / 50) * 180;

    setHoverCoord({
      lat: Math.max(-90, Math.min(90, lat)),
      lng: Math.max(-180, Math.min(180, lng))
    });
  };

  const handleMouseLeave = () => {
    setHoverCoord(null);
  };

  // Quick presets
  const handleFocusHormuzChokepoint = () => {
    onLocChange({ lat: 26.50, lng: 56.50 });
    setTheaterView('HORMUZ_CHOKEPOINT');
    setSelectedFire(HORMUZ_MARITIME_FIRES[0]);
    audioController.playBeep(1020, 'sine', 0.08);
  };

  const handleFocusMideastTheater = () => {
    onLocChange({ lat: 26.50, lng: 52.00 });
    setTheaterView('HORMUZ_AND_MIDEAST');
    setFireScopeFilter('ALWAYS_HORMUZ_AND_MIDEAST');
    audioController.playBeep(920, 'sine', 0.08);
  };

  const handleFocusHormuz = () => {
    handleFocusHormuzChokepoint();
  };

  // Convert real coordinates to flat percentage coordinates for SVG viewport [100x50]
  const userSvg = convertCoordsToSvg(userLoc);
  // Geostationary satellites sit directly over the Equator (latitude 0)
  const satEquatorialLoc = { lat: 0, lng: satellite.longitude };
  const satSvg = convertCoordsToSvg(satEquatorialLoc);

  // Inspector card zone to show
  const activeInspectorZone = hoveredZone || selectedZone;
  const activeFire = (hoveredHeatItem?.type === 'fire' ? hoveredHeatItem.data : null) || selectedFire;
  const activeC2 = (hoveredHeatItem?.type === 'c2' ? hoveredHeatItem.data : null) || selectedC2;

  return (
    <div className={`p-4 rounded-3xl border-2 transition-all duration-300 relative overflow-hidden flex flex-col space-y-3.5 select-none ${
      isStealthMode 
        ? 'bg-black border-purple-950/50 shadow-[inset_0_0_24px_rgba(168,85,247,0.03)]' 
        : 'bg-slate-950/90 border-slate-800 shadow-lg'
    }`}>
      {/* HUD Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-2.5">
        <div className="flex items-center space-x-2">
          <Compass className={`w-3.5 h-3.5 ${isStealthMode ? 'text-purple-400' : 'text-cyan-400'} animate-spin-slow`} />
          <span className="text-[10px] font-black tracking-widest uppercase text-slate-200 font-mono">
            TACTICAL_GEOSPATIAL_RADAR
          </span>
          <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
            WGS-84 / GEO
          </span>

          {/* NASA Live Telemetry Badge & Sync Trigger */}
          <div className="flex items-center space-x-1.5 bg-slate-900/90 border border-slate-800 rounded-md px-2 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-[7.5px] font-mono text-emerald-300 font-bold">
              NASA LIVE (VIIRS/MODIS)
            </span>
            <button
              onClick={handleSyncNasaLive}
              disabled={isSyncingNasa}
              className="text-slate-400 hover:text-cyan-300 p-0.5 transition"
              title="Poll latest NASA FIRMS satellite active downlink"
            >
              <RefreshCw className={`w-2.5 h-2.5 ${isSyncingNasa ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>

          {onOpenC4ISR && (
            <button
              onClick={onOpenC4ISR}
              className="px-2 py-0.5 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800/80 text-cyan-300 text-[7.5px] font-mono font-bold flex items-center space-x-1 transition-all"
              title="Open C4ISR SIGINT Terminal Node for Telegram Reconnaissance & Uplink Routing"
            >
              <Radio className="w-2.5 h-2.5" />
              <span>C4ISR NODE</span>
            </button>
          )}

          {onOpenMaritimeMonitor && (
            <button
              onClick={onOpenMaritimeMonitor}
              className="px-2 py-0.5 rounded bg-red-950/80 hover:bg-red-900 border border-red-700/80 text-red-300 hover:text-white text-[7.5px] font-mono font-black flex items-center space-x-1 transition-all shadow-[0_0_8px_rgba(239,68,68,0.3)] animate-pulse"
              title="Open Maritime Fire Monitor: AIS Tracking & NASA FIRMS Correlator for Strait of Hormuz"
            >
              <Ship className="w-2.5 h-2.5 text-cyan-400" />
              <Flame className="w-2.5 h-2.5 text-red-400" />
              <span>MARITIME MONITOR</span>
            </button>
          )}
        </div>

        {/* Theater View & Strategic Heatmap Controls */}
        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
          {/* Theater View Presets (Global / Middle East Regional / Strait of Hormuz Chokepoint) */}
          <div className="flex items-center space-x-1 bg-slate-900/90 border border-slate-800 rounded-md p-0.5">
            <span className="text-[7px] font-mono text-slate-500 uppercase px-1">ZOOM:</span>
            <button
              onClick={() => { setTheaterView('GLOBAL'); audioController.playBeep(800, 'sine', 0.04); }}
              className={`px-1.5 py-0.5 rounded text-[7px] font-mono uppercase transition-all ${
                theaterView === 'GLOBAL'
                  ? 'bg-slate-750 text-cyan-300 font-bold border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Full Planetary Orbit Projection (1.0x)"
            >
              GLOBAL
            </button>

            <button
              onClick={handleFocusMideastTheater}
              className={`px-1.5 py-0.5 rounded text-[7px] font-mono uppercase transition-all flex items-center space-x-1 ${
                theaterView === 'HORMUZ_AND_MIDEAST'
                  ? 'bg-amber-600/90 text-white font-bold shadow-sm'
                  : 'text-amber-400 hover:text-amber-200'
              }`}
              title="Focus on Middle East & Persian Gulf Theater (6.25x Zoom)"
            >
              <Flame className="w-2.5 h-2.5 text-amber-300" />
              <span>MIDEAST THEATER</span>
            </button>

            <button
              onClick={handleFocusHormuzChokepoint}
              className={`px-1.5 py-0.5 rounded text-[7px] font-mono uppercase transition-all flex items-center space-x-1 ${
                theaterView === 'HORMUZ_CHOKEPOINT'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-cyan-400 hover:text-cyan-200'
              }`}
              title="Direct high-resolution zoom on Strait of Hormuz Chokepoint (20x Zoom)"
            >
              <Ship className="w-2.5 h-2.5" />
              <span>HORMUZ CHOKEPOINT</span>
            </button>
          </div>

          {/* NASA Live Dossier Drawer Toggle */}
          <button
            onClick={() => {
              const next = !showNasaDossier;
              setShowNasaDossier(next);
              audioController.playBeep(next ? 1040 : 540, 'triangle', 0.06);
            }}
            className={`px-2 py-1 rounded-md text-[7.5px] font-mono font-bold tracking-wider uppercase transition-all flex items-center space-x-1 border ${
              showNasaDossier
                ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-emerald-300'
            }`}
            title="Open comprehensive NASA FIRMS live detections dossier for Hormuz and Middle East"
          >
            <Activity className="w-3 h-3 text-emerald-400" />
            <span>NASA DOSSIER</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          {/* Heatmap Master Toggle */}
          <button
            onClick={handleToggleHeatmap}
            className={`px-2 py-1 rounded-md text-[8px] font-mono font-bold tracking-wider uppercase transition-all duration-200 flex items-center space-x-1.5 border shadow-sm ${
              isHeatmapEnabled
                ? 'bg-amber-950/60 border-amber-500/70 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                : 'bg-slate-900/80 border-slate-750 text-slate-400 hover:text-slate-200 hover:border-slate-600'
            }`}
            title="Toggle Geospatial Heatmap displaying detected thermal fires (FIRMS) and cyber malware/C2 beacons"
          >
            <Flame className={`w-3 h-3 ${isHeatmapEnabled ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
            <span>HEATMAP</span>
            <span className={`w-1.5 h-1.5 rounded-full ${isHeatmapEnabled ? 'bg-amber-400 animate-ping' : 'bg-slate-600'}`} />
          </button>

          {/* Heatmap Category Scope Filter Pills */}
          {isHeatmapEnabled && (
            <div className="flex items-center space-x-1 bg-slate-900/90 border border-slate-800 rounded-md p-0.5">
              {/* PRIMARY ALWAYS-ACTIVE MODE: HORMUZ SHIPS + ALL MIDEAST LAND FIRES */}
              <button
                onClick={() => setFireScopeFilter('ALWAYS_HORMUZ_AND_MIDEAST')}
                className={`px-1.5 py-0.5 rounded text-[7px] font-mono uppercase transition-all flex items-center space-x-1 ${
                  fireScopeFilter === 'ALWAYS_HORMUZ_AND_MIDEAST'
                    ? 'bg-gradient-to-r from-blue-600 to-amber-600 text-white font-extrabold shadow-[0_0_10px_rgba(245,158,11,0.35)]'
                    : 'text-amber-300 hover:text-amber-100'
                }`}
                title="ALWAYS ACTIVE: Show all maritime ship fires in Strait of Hormuz + all land fires in Middle East simultaneously"
              >
                <Ship className="w-2.5 h-2.5 text-cyan-300" />
                <Flame className="w-2.5 h-2.5 text-amber-300" />
                <span>ALWAYS: HORMUZ + MIDEAST ({ALL_MIDDLE_EAST_AND_HORMUZ_FIRES.length})</span>
              </button>

              <button
                onClick={() => setFireScopeFilter('HORMUZ_SHIPS')}
                className={`px-1.5 py-0.5 rounded text-[7px] font-mono uppercase transition-all flex items-center space-x-1 ${
                  fireScopeFilter === 'HORMUZ_SHIPS'
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'text-cyan-400 hover:text-cyan-200'
                }`}
                title="Filter only maritime ship and tanker fires in the Strait of Hormuz"
              >
                <Ship className="w-2.5 h-2.5" />
                <span>HORMUZ SHIPS ({HORMUZ_MARITIME_FIRES.length})</span>
              </button>

              <button
                onClick={() => setFireScopeFilter('MIDEAST_LAND')}
                className={`px-1.5 py-0.5 rounded text-[7px] font-mono uppercase transition-all flex items-center space-x-1 ${
                  fireScopeFilter === 'MIDEAST_LAND'
                    ? 'bg-amber-600 text-white font-bold shadow-sm'
                    : 'text-amber-400 hover:text-amber-200'
                }`}
                title="Filter land fires across all Middle East regions"
              >
                <Flame className="w-2.5 h-2.5" />
                <span>MIDEAST LAND ({MIDDLE_EAST_LAND_FIRES.length})</span>
              </button>

              <button
                onClick={() => setFireScopeFilter('ALL_GLOBAL')}
                className={`px-1.5 py-0.5 rounded text-[7px] font-mono uppercase transition-all ${
                  fireScopeFilter === 'ALL_GLOBAL'
                    ? 'bg-slate-750 text-cyan-300 font-bold border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Show all planetary detected fires"
              >
                GLOBAL ({DETECTED_FIRES.length})
              </button>

              <button
                onClick={(e) => handleToggleHeatmapLayer('malwareC2', e)}
                className={`px-1.5 py-0.5 rounded text-[7px] font-mono uppercase transition-all flex items-center space-x-1 ${
                  heatmapLayers.malwareC2
                    ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40'
                    : 'text-slate-500 hover:text-slate-400'
                }`}
                title="Toggle Malware & C2 Server Detections"
              >
                <Crosshair className="w-2.5 h-2.5 text-red-400" />
                <span>C2 ({DETECTED_MALWARE_C2.length})</span>
              </button>
            </div>
          )}

          {/* Strategic Overlay Master Toggle */}
          <button
            onClick={handleToggleOverlay}
            className={`px-2 py-1 rounded-md text-[8px] font-mono font-bold tracking-wider uppercase transition-all duration-200 flex items-center space-x-1.5 border shadow-sm ${
              isOverlayEnabled
                ? 'bg-red-950/50 border-red-500/60 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.2)]'
                : 'bg-slate-900/80 border-slate-750 text-slate-400 hover:text-slate-200 hover:border-slate-600'
            }`}
            title="Toggle Strategic Overlay displaying restricted airspace, EW jamming zones, and high-risk interference areas"
          >
            <ShieldAlert className={`w-3 h-3 ${isOverlayEnabled ? 'text-red-400 animate-pulse' : 'text-slate-500'}`} />
            <span>STRATEGIC OVERLAY</span>
            <span className={`w-1.5 h-1.5 rounded-full ${isOverlayEnabled ? 'bg-red-400 animate-ping' : 'bg-slate-600'}`} />
          </button>
        </div>
      </div>

      {/* Real-Time Telemetry & NASA Live Alert Banner */}
      <div className={`p-2 rounded-xl border text-[8px] font-mono flex items-center justify-between transition-all duration-300 ${
        fireScopeFilter === 'ALWAYS_HORMUZ_AND_MIDEAST' || theaterView !== 'GLOBAL'
          ? 'bg-gradient-to-r from-blue-950/90 via-slate-950/90 to-amber-950/90 border-amber-500/70 text-amber-200 shadow-[0_0_16px_rgba(245,158,11,0.25)]'
          : fireScopeFilter === 'HORMUZ_SHIPS'
          ? 'bg-blue-950/80 border-blue-500/80 text-blue-200 shadow-[0_0_16px_rgba(59,130,246,0.25)]'
          : threatEval.overallThreatLevel === 'CRITICAL' || isJamming
          ? 'bg-red-950/70 border-red-600/80 text-red-200 shadow-[0_0_16px_rgba(239,68,68,0.25)] animate-pulse'
          : 'bg-slate-900/80 border-slate-800 text-slate-300'
      }`}>
        <div className="flex items-center space-x-2 truncate">
          <div className="flex items-center space-x-1 shrink-0">
            <Ship className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          </div>
          <span className="font-bold uppercase tracking-wide truncate">
            {fireScopeFilter === 'ALWAYS_HORMUZ_AND_MIDEAST'
              ? `[NASA LIVE DATA ALWAYS ON] ${HORMUZ_MARITIME_FIRES.length} SHIPS ON FIRE IN STRAIT OF HORMUZ & ${MIDDLE_EAST_LAND_FIRES.length} MIDDLE EAST LAND FIRES TRACKED (NOAA-20 / SUOMI-NPP / MODIS)`
              : fireScopeFilter === 'HORMUZ_SHIPS'
              ? `[NASA FIRMS LIVE] STRAIT OF HORMUZ MARITIME CORRIDOR: ${HORMUZ_MARITIME_FIRES.length} SHIPS / TANKERS IN FLAME DETECTED BY VIIRS 375m`
              : fireScopeFilter === 'MIDEAST_LAND'
              ? `[NASA FIRMS LIVE] MIDDLE EAST TERRESTRIAL FLUX: ${MIDDLE_EAST_LAND_FIRES.length} LAND REFINERY / COMBAT FIRES MONITORED`
              : isJamming
              ? `[EW THREAT DETECTED] ACTIVE JAMMING EMITTER (${jammingPower} dBm) - TELEMETRY DEGRADED`
              : `[NASA EOSDIS STREAM LIVE // ${nasaMeta.lastSyncTimestamp}] ${nasaMeta.hormuzMaritimeCount} HORMUZ SHIP FIRES & ${nasaMeta.middleEastLandCount} MIDEAST LAND FIRES ACTIVE`}
          </span>
        </div>

        <div className="flex items-center space-x-2 shrink-0 pl-2">
          <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-[7px] text-cyan-300 font-bold">
            MAX FRP: {nasaMeta.maxFrpDetectedMw} MW
          </span>
          <span className="px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-800 text-[7px] text-amber-300 font-bold">
            {visibleFires.length} FIRES LIVE
          </span>
          <span className="text-[7px] text-slate-400 hidden sm:inline">
            THEATER: {theaterView === 'GLOBAL' ? 'PLANETARY (1.0x)' : theaterView === 'HORMUZ_AND_MIDEAST' ? 'MIDEAST (6.2x)' : 'HORMUZ (20x)'}
          </span>
        </div>
      </div>

      {/* Grid Canvas Map Workspace */}
      <div 
        ref={containerRef}
        className="relative aspect-[2/1] w-full rounded-2xl bg-black border border-slate-900 overflow-hidden cursor-crosshair group shadow-inner"
      >
        {/* Dynamic sweeping overlay */}
        <div className={`absolute top-0 left-0 w-full h-full pointer-events-none opacity-[0.03] ${
          isStealthMode ? 'bg-purple-500' : 'bg-cyan-500'
        } animate-pulse`}></div>

        <svg 
          className="w-full h-full absolute inset-0 z-10" 
          viewBox={`${currentViewBox.x} ${currentViewBox.y} ${currentViewBox.w} ${currentViewBox.h}`} 
          onClick={handleMapClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* DEFINITIONS FOR STRATEGIC OVERLAY & HEATMAP PATTERNS & GRADIENTS */}
          <defs>
            <pattern id="restricted-hatch" width="1.5" height="1.5" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="1.5" stroke="#ef4444" strokeWidth="0.25" opacity="0.6" />
            </pattern>

            <pattern id="jamming-dots" width="1.2" height="1.2" patternUnits="userSpaceOnUse">
              <circle cx="0.6" cy="0.6" r="0.25" fill="#f59e0b" opacity="0.5" />
            </pattern>

            <pattern id="scintillation-wave" width="2" height="2" patternUnits="userSpaceOnUse">
              <path d="M 0 1 Q 0.5 0, 1 1 T 2 1" fill="none" stroke="#a855f7" strokeWidth="0.2" opacity="0.4" />
            </pattern>

            <radialGradient id="jamming-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
            </radialGradient>

            <radialGradient id="restricted-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
              <stop offset="70%" stopColor="#ef4444" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
            </radialGradient>

            <radialGradient id="scintillation-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.35" />
              <stop offset="60%" stopColor="#06b6d4" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
            </radialGradient>

            {/* Land Thermal Fire Heatmap Radial Gradient (Refined tactical military aura, non-blinding) */}
            <radialGradient id="thermal-fire-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fef08a" stopOpacity="0.45" />
              <stop offset="35%" stopColor="#f97316" stopOpacity="0.22" />
              <stop offset="70%" stopColor="#ef4444" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0.0" />
            </radialGradient>

            {/* Maritime Ship Fire Dispersion Gradient (Cyan sea halo + Incandescent white-orange core) */}
            <radialGradient id="maritime-ship-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1.0" />
              <stop offset="25%" stopColor="#fde047" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#ea580c" stopOpacity="0.75" />
              <stop offset="75%" stopColor="#0284c7" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#0369a1" stopOpacity="0.0" />
            </radialGradient>

            {/* Malware / C2 Cyber Radar Gradient */}
            <radialGradient id="cyber-c2-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
              <stop offset="45%" stopColor="#a855f7" stopOpacity="0.45" />
              <stop offset="80%" stopColor="#3b82f6" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.0" />
            </radialGradient>
          </defs>

          {/* SIMPLIFIED TACTICAL CONTINENT CONTOURS */}
          <g fill="#1e293b" fillOpacity="0.28" stroke="#334155" strokeWidth="0.12" strokeOpacity="0.35">
            <path d="M 4.2 6.5 L 14.5 4.5 L 24.8 5.8 L 32.5 12.0 L 27.2 16.5 L 29.5 21.0 L 24.5 20.2 L 20.0 24.5 L 17.5 20.8 L 9.0 16.0 Z" />
            <path d="M 33.0 2.5 L 43.5 3.0 L 40.5 7.8 L 32.5 6.0 Z" />
            <path d="M 27.5 24.5 L 34.0 24.0 L 38.5 28.5 L 36.5 38.5 L 32.0 42.0 L 28.5 35.0 L 26.5 27.5 Z" />
            <path d="M 47.5 7.5 L 56.0 5.0 L 72.0 6.0 L 89.0 7.5 L 94.5 14.0 L 88.0 21.0 L 78.5 21.0 L 72.0 26.0 L 63.5 20.5 L 54.0 22.0 L 47.5 17.0 Z" />
            <path d="M 47.0 10.5 L 49.5 9.5 L 49.0 13.0 L 46.5 13.0 Z" />
            <path d="M 45.5 17.5 L 59.0 17.0 L 64.0 23.0 L 59.5 34.0 L 52.0 37.5 L 48.0 30.5 L 44.5 21.5 Z" />
            <path d="M 81.0 28.5 L 91.5 27.5 L 93.0 34.0 L 86.5 38.0 L 80.5 34.0 Z" />
            <path d="M 87.0 15.0 L 89.0 13.5 L 91.0 17.0 L 88.5 18.5 Z" />
            <path d="M 0 47.5 L 100 47.5 L 100 50 L 0 50 Z" />
          </g>

          {/* EQUATOR GRID LINE */}
          <line x1="0" y1="25" x2="100" y2="25" stroke="#334155" strokeWidth="0.18" strokeDasharray="1,1" />
          {/* MERIDIAN LINE */}
          <line x1="50" y1="0" x2="50" y2="50" stroke="#334155" strokeWidth="0.18" strokeDasharray="1,1" />
          
          <line x1="0" y1="12.5" x2="100" y2="12.5" stroke="#1e293b" strokeWidth="0.1" />
          <line x1="0" y1="37.5" x2="100" y2="37.5" stroke="#1e293b" strokeWidth="0.1" />
          <line x1="25" y1="0" x2="25" y2="50" stroke="#1e293b" strokeWidth="0.1" />
          <line x1="75" y1="0" x2="75" y2="50" stroke="#1e293b" strokeWidth="0.1" />

          {/* Reference cities/bases */}
          <g fill="#475569" opacity="0.35">
            <circle cx="28.6" cy="14.8" r="0.6" />
            <circle cx="54.3" cy="3.3" r="0.6" />
            <circle cx="64.3" cy="18.0" r="0.6" />
            <circle cx="87.1" cy="34.4" r="0.6" />
            <circle cx="34.0" cy="39.8" r="0.6" />
            <circle cx="5.0" cy="20.0" r="0.6" />
            <circle cx="70.1" cy="27.0" r="0.6" />
            <circle cx="89.5" cy="21.3" r="0.6" />
          </g>

          {/* STRATEGIC OVERLAY ZONES */}
          {isOverlayEnabled && visibleZones.map((zone) => {
            const svgPos = convertCoordsToSvg(zone.center);
            const svgRadius = Math.max(1.2, zone.radiusDeg * (5 / 18));
            const isHovered = hoveredZone?.id === zone.id;
            const isSelected = selectedZone?.id === zone.id;
            const isInside = threatEval.insideZones.some(z => z.id === zone.id);

            return (
              <g 
                key={zone.id} 
                className="cursor-pointer transition-all duration-200"
                onClick={(e) => { e.stopPropagation(); setSelectedZone(zone); setSelectedFire(null); setSelectedC2(null); }}
                onMouseEnter={() => setHoveredZone(zone)}
                onMouseLeave={() => setHoveredZone(null)}
              >
                <circle cx={svgPos.x} cy={svgPos.y} r={svgRadius} fill={zone.type === 'restricted_airspace' ? "url(#restricted-glow)" : zone.type === 'jamming_zone' ? "url(#jamming-glow)" : "url(#scintillation-glow)"} />
                <circle 
                  cx={svgPos.x} 
                  cy={svgPos.y} 
                  r={svgRadius} 
                  fill={zone.type === 'restricted_airspace' ? "url(#restricted-hatch)" : zone.type === 'jamming_zone' ? "url(#jamming-dots)" : "url(#scintillation-wave)"} 
                  stroke={zone.type === 'restricted_airspace' ? "#ef4444" : zone.type === 'jamming_zone' ? "#f59e0b" : "#a855f7"} 
                  strokeWidth={isSelected || isHovered ? 0.45 : isInside ? 0.35 : 0.22} 
                  strokeDasharray="0.8,0.5" 
                  className={isInside ? 'animate-pulse' : ''}
                />
                <circle cx={svgPos.x} cy={svgPos.y} r="0.5" fill={zone.type === 'restricted_airspace' ? "#ef4444" : zone.type === 'jamming_zone' ? "#fbbf24" : "#c084fc"} />
              </g>
            );
          })}

          {/* GEOSPATIAL HEATMAP: DETECTED NASA LIVE FIRES (MARITIME HORMUZ SHIPS & MIDDLE EAST LAND) */}
          {isHeatmapEnabled && visibleFires.map((fire) => {
            const svgPos = convertCoordsToSvg({ lat: fire.lat, lng: fire.lng });
            const isMaritime = fire.category === 'MARITIME_SHIP';
            const heatRadius = Math.max(1.8, Math.min(4.8, fire.frp / 160)) * zoomScale;
            const isHovered = hoveredHeatItem?.type === 'fire' && hoveredHeatItem.data.id === fire.id;
            const isSelected = selectedFire?.id === fire.id;
            const fontSize = theaterView === 'HORMUZ_CHOKEPOINT' ? 0.26 : theaterView === 'HORMUZ_AND_MIDEAST' ? 0.45 : 0.95;
            const diamondSize = 0.55 * zoomScale;
            const strokeW = (isSelected || isHovered ? 0.28 : 0.16) * zoomScale;

            if (isMaritime) {
              return (
                <g 
                  key={fire.id}
                  className="cursor-pointer transition-all duration-200"
                  onClick={(e) => { e.stopPropagation(); setSelectedFire(fire); setSelectedC2(null); setSelectedZone(null); }}
                  onMouseEnter={() => setHoveredHeatItem({ type: 'fire', data: fire })}
                  onMouseLeave={() => setHoveredHeatItem(null)}
                >
                  {/* Clean Tactical Maritime Position Ring (Flare Removed, Alert Kept) */}
                  <circle 
                    cx={svgPos.x} 
                    cy={svgPos.y} 
                    r={0.9 * zoomScale} 
                    fill="#0284c7" 
                    fillOpacity="0.25"
                    stroke={isSelected || isHovered ? "#38bdf8" : "#0284c7"} 
                    strokeWidth={0.12 * zoomScale}
                  />

                  {/* Clean Tactical Diamond Center Point */}
                  <polygon 
                    points={`${svgPos.x},${svgPos.y - diamondSize} ${svgPos.x + diamondSize * 0.8},${svgPos.y} ${svgPos.x},${svgPos.y + diamondSize} ${svgPos.x - diamondSize * 0.8},${svgPos.y}`} 
                    fill={isSelected || isHovered ? "#38bdf8" : "#0284c7"} 
                    stroke="#ffffff" 
                    strokeWidth={0.08 * zoomScale} 
                  />
                  <circle cx={svgPos.x} cy={svgPos.y} r={0.25 * zoomScale} fill="#fef08a" />

                  {/* Ship Name & FRP Label (Only shown on hover, selection, or chokepoint zoom to prevent clutter) */}
                  {(isSelected || isHovered || theaterView === 'HORMUZ_CHOKEPOINT') && (
                    <g className="pointer-events-none select-none">
                      <rect
                        x={svgPos.x - (3.8 * zoomScale)}
                        y={svgPos.y + diamondSize + (0.3 * zoomScale)}
                        width={7.6 * zoomScale}
                        height={fontSize * 1.5}
                        fill="#020617"
                        fillOpacity="0.9"
                        stroke="#0284c7"
                        strokeWidth={0.06 * zoomScale}
                        rx={0.3 * zoomScale}
                      />
                      <text 
                        x={svgPos.x} 
                        y={svgPos.y + diamondSize + fontSize * 1.15} 
                        textAnchor="middle" 
                        fill="#38bdf8" 
                        fontSize={fontSize * 0.95} 
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        🚢 {fire.vesselDetails?.vesselName.split(' ')[0] || 'VESSEL'} [{fire.frp}MW]
                      </text>
                    </g>
                  )}
                </g>
              );
            }

            // Land Fire Rendering (Middle East & Global - Crisp Tactical Target Reticle)
            const landRadius = Math.max(0.65, Math.min(1.3, (fire.frp / 600) * 0.9)) * zoomScale;
            return (
              <g 
                key={fire.id}
                className="cursor-pointer transition-all duration-200"
                onClick={(e) => { e.stopPropagation(); setSelectedFire(fire); setSelectedC2(null); setSelectedZone(null); }}
                onMouseEnter={() => setHoveredHeatItem({ type: 'fire', data: fire })}
                onMouseLeave={() => setHoveredHeatItem(null)}
              >
                {/* Refined thermal aura halo (clean tactical dissipation) */}
                <circle 
                  cx={svgPos.x} 
                  cy={svgPos.y} 
                  r={landRadius} 
                  fill="url(#thermal-fire-glow)" 
                />

                {/* Tactical target reticle ring */}
                <circle 
                  cx={svgPos.x} 
                  cy={svgPos.y} 
                  r={0.42 * zoomScale} 
                  fill="none" 
                  stroke={isSelected || isHovered ? "#fbbf24" : "#f97316"} 
                  strokeWidth={0.08 * zoomScale} 
                  className={isSelected ? 'animate-ping' : ''}
                />

                {/* Sharp core target pip */}
                <circle cx={svgPos.x} cy={svgPos.y} r={0.22 * zoomScale} fill={isSelected || isHovered ? "#ffffff" : "#f59e0b"} />

                {/* Land Fire Label (Only shown on hover or selection to prevent overlapping cluster clutter) */}
                {(isSelected || isHovered) && (
                  <g className="pointer-events-none select-none">
                    <rect
                      x={svgPos.x - (4.2 * zoomScale)}
                      y={svgPos.y + heatRadius + (0.3 * zoomScale)}
                      width={8.4 * zoomScale}
                      height={fontSize * 1.5}
                      fill="#020617"
                      fillOpacity="0.9"
                      stroke="#f97316"
                      strokeWidth={0.06 * zoomScale}
                      rx={0.3 * zoomScale}
                    />
                    <text 
                      x={svgPos.x} 
                      y={svgPos.y + heatRadius + fontSize * 1.15} 
                      textAnchor="middle" 
                      fill="#fbbf24" 
                      fontSize={fontSize * 0.95} 
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      🔥 {fire.name.split('-')[0].trim().slice(0, 14)} [{fire.frp}MW]
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* GEOSPATIAL HEATMAP: MALWARE & C2 BEACON DETECTIONS */}
          {isHeatmapEnabled && visibleC2Nodes.map((c2) => {
            const svgPos = convertCoordsToSvg({ lat: c2.lat, lng: c2.lng });
            const c2Radius = 2.4 * zoomScale;
            const isHovered = hoveredHeatItem?.type === 'c2' && hoveredHeatItem.data.id === c2.id;
            const isSelected = selectedC2?.id === c2.id;
            const fontSize = theaterView === 'HORMUZ_CHOKEPOINT' ? 0.26 : theaterView === 'HORMUZ_AND_MIDEAST' ? 0.45 : 0.95;

            return (
              <g 
                key={c2.id}
                className="cursor-pointer transition-all duration-200"
                onClick={(e) => { e.stopPropagation(); setSelectedC2(c2); setSelectedFire(null); setSelectedZone(null); }}
                onMouseEnter={() => setHoveredHeatItem({ type: 'c2', data: c2 })}
                onMouseLeave={() => setHoveredHeatItem(null)}
              >
                <circle cx={svgPos.x} cy={svgPos.y} r={c2Radius} fill="url(#cyber-c2-glow)" />
                <circle 
                  cx={svgPos.x} 
                  cy={svgPos.y} 
                  r={c2Radius * (isSelected || isHovered ? 1.3 : 1.0)} 
                  fill="none" 
                  stroke="#ef4444" 
                  strokeWidth={(isSelected || isHovered ? 0.28 : 0.18) * zoomScale} 
                  strokeDasharray={`${0.6 * zoomScale},${0.6 * zoomScale}`}
                  className="animate-spin-slow"
                  style={{ transformOrigin: `${svgPos.x}px ${svgPos.y}px` }}
                />
                <line x1={svgPos.x - 0.7 * zoomScale} y1={svgPos.y} x2={svgPos.x + 0.7 * zoomScale} y2={svgPos.y} stroke="#f87171" strokeWidth={0.12 * zoomScale} />
                <line x1={svgPos.x} y1={svgPos.y - 0.7 * zoomScale} x2={svgPos.x} y2={svgPos.y + 0.7 * zoomScale} stroke="#f87171" strokeWidth={0.12 * zoomScale} />
                <circle cx={svgPos.x} cy={svgPos.y} r={0.35 * zoomScale} fill="#ef4444" />
                
                {/* C2 Node Label (Only on hover or select) */}
                {(isSelected || isHovered) && (
                  <g className="pointer-events-none select-none">
                    <rect
                      x={svgPos.x - (3.5 * zoomScale)}
                      y={svgPos.y - c2Radius - (fontSize * 1.6)}
                      width={7.0 * zoomScale}
                      height={fontSize * 1.4}
                      fill="#020617"
                      fillOpacity="0.9"
                      stroke="#ef4444"
                      strokeWidth={0.06 * zoomScale}
                      rx={0.3 * zoomScale}
                    />
                    <text 
                      x={svgPos.x} 
                      y={svgPos.y - c2Radius - (fontSize * 0.4)} 
                      textAnchor="middle" 
                      fill="#fca5a5" 
                      fontSize={fontSize * 0.95} 
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      ⚡ {c2.malwareFamily.split(' ')[0]}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* SATELLITE BEAM COVERAGE / PLOTTING ENVELOPE */}
          <circle 
            cx={satSvg.x} 
            cy={satSvg.y} 
            r="16" 
            fill="transparent" 
            stroke={isStealthMode ? "#a855f7" : "#06b6d4"} 
            strokeWidth="0.18" 
            strokeDasharray="1,1" 
            opacity="0.38"
          />

          {/* REALTIME TRACING VECTOR FROM STATION TO GEOSCIENTIFIC NODE */}
          <line 
            x1={userSvg.x} 
            y1={userSvg.y} 
            x2={satSvg.x} 
            y2={satSvg.y} 
            stroke={isStealthMode ? "#d8b4fe" : "#22d3ee"} 
            strokeWidth="0.25" 
            strokeDasharray="0.8,0.8" 
            className="animate-pulse"
          />

          {/* OPERATOR LOCATION CARD PIN */}
          <g transform={`translate(${userSvg.x - 1}, ${userSvg.y - 1})`}>
            {threatEval.insideZones.length > 0 ? (
              <circle 
                cx="1" 
                cy="1" 
                r="3.5" 
                fill="transparent" 
                stroke="#ef4444" 
                strokeWidth="0.22" 
                className="animate-ping" 
                style={{ transformOrigin: '1px 1px' }} 
              />
            ) : (
              <circle 
                cx="1" 
                cy="1" 
                r="2.8" 
                fill="transparent" 
                stroke={isStealthMode ? "#c084fc" : "#22d3ee"} 
                strokeWidth="0.15" 
                className="animate-ping" 
                style={{ transformOrigin: '1px 1px' }} 
              />
            )}
            <circle cx="1" cy="1" r="0.9" fill={threatEval.insideZones.length > 0 ? "#ef4444" : isStealthMode ? "#a855f7" : "#06b6d4"} />
            <line x1="1" y1="-1" x2="1" y2="3" stroke={threatEval.insideZones.length > 0 ? "#ef4444" : isStealthMode ? "#c084fc" : "#22d3ee"} strokeWidth="0.1" />
            <line x1="-1" y1="1" x2="3" y2="1" stroke={threatEval.insideZones.length > 0 ? "#ef4444" : isStealthMode ? "#c084fc" : "#22d3ee"} strokeWidth="0.1" />
          </g>

          {/* TARGET SATELLITE LONGITUDE POSITION MARK */}
          <g transform={`translate(${satSvg.x - 1.2}, ${satSvg.y - 1.2})`}>
            <circle cx="1.2" cy="1.2" r="1.4" fill="transparent" stroke={isStealthMode ? "#d8b4fe" : "#38bdf8"} strokeWidth="0.15" />
            <rect x="0.8" y="0.8" width="0.8" height="0.8" fill={isStealthMode ? "#c084fc" : "#38bdf8"} />
          </g>
        </svg>

        {/* Top-Right Tactical Radar Telemetry & Live Clock */}
        <div className="absolute right-2.5 top-2.5 flex items-center space-x-2 bg-slate-950/90 border border-slate-800/80 px-2 py-1 rounded-lg text-[7.5px] font-mono text-cyan-400 pointer-events-none z-20">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>LIVE RADAR // {liveUtcTime}</span>
          {hoverCoord && (
            <span className="text-slate-300 border-l border-slate-800 pl-1.5">
              LOC: {hoverCoord.lat.toFixed(2)}°N, {hoverCoord.lng.toFixed(2)}°E
            </span>
          )}
        </div>

        {/* Clean Docked Legend Bar */}
        <div className="absolute left-2.5 bottom-2.5 pointer-events-none font-mono text-[7px] text-slate-300 uppercase space-y-0.5 z-20 bg-slate-950/90 backdrop-blur-md border border-slate-800/90 px-2.5 py-1.5 rounded-xl shadow-xl">
          <div className="flex items-center space-x-2 text-cyan-400 font-bold">
            <span>SLOT: {satellite.orbitalSlot}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">RADIAL: {(Math.abs(userLoc.lng - satellite.longitude)).toFixed(1)}° OFFSET</span>
          </div>
          {isHeatmapEnabled && (
            <div className="flex items-center space-x-2 text-[6.5px] text-cyan-300 font-bold pt-0.5 border-t border-slate-800/80 mt-1">
              <span>FIRMS: {HORMUZ_MARITIME_FIRES.length} SHIPS</span>
              <span>•</span>
              <span className="text-amber-400">{MIDDLE_EAST_LAND_FIRES.length} LAND</span>
              <span>•</span>
              <span className="text-red-400">{visibleC2Nodes.length} C2</span>
            </div>
          )}
        </div>
      </div>

      {/* STRATEGIC ZONE INSPECTOR PANEL */}
      {isOverlayEnabled && activeInspectorZone && (
        <div className="p-3 rounded-2xl bg-slate-900/95 border border-slate-750 shadow-xl text-[8px] font-mono space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <div className="flex items-center space-x-2">
              <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase ${
                activeInspectorZone.type === 'restricted_airspace' 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40' 
                  : activeInspectorZone.type === 'jamming_zone'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
              }`}>
                {activeInspectorZone.type.replace('_', ' ')}
              </span>

              <span className="font-bold text-slate-200 text-[9px]">
                {activeInspectorZone.name}
              </span>

              <span className="text-slate-400">
                [{activeInspectorZone.designator}]
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <span className={`px-1.5 py-0.5 rounded text-[7px] font-bold ${
                activeInspectorZone.severity === 'CRITICAL'
                  ? 'bg-red-600 text-white animate-pulse'
                  : activeInspectorZone.severity === 'HIGH'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-cyan-500/20 text-cyan-300'
              }`}>
                SEVERITY: {activeInspectorZone.severity}
              </span>

              {selectedZone && (
                <button
                  onClick={() => setSelectedZone(null)}
                  className="text-slate-400 hover:text-slate-200 p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300">
            <div className="space-y-1">
              <div className="text-slate-400">
                <span className="text-slate-500">CENTER / RADIUS: </span>
                {activeInspectorZone.center.lat.toFixed(2)}°, {activeInspectorZone.center.lng.toFixed(2)}° (R: {activeInspectorZone.radiusDeg.toFixed(1)}° / ~{Math.round(activeInspectorZone.radiusDeg * 111)} km)
              </div>
              <div>
                <span className="text-slate-500">BAND / CEILING: </span>
                {activeInspectorZone.altitudeBand || activeInspectorZone.frequencyBand || 'ALL ALTITUDES'}
              </div>
              <div className="text-slate-400">
                {activeInspectorZone.description}
              </div>
            </div>

            <div className="space-y-1 bg-slate-950/80 p-2 rounded-xl border border-slate-800">
              <div className="text-amber-300/90 font-medium">
                <span className="text-slate-500">TELEMETRY IMPACT: </span>
                {activeInspectorZone.telemetryImpact}
              </div>
              <div className="text-emerald-400/90 font-medium">
                <span className="text-slate-500">RECOMMENDED ACTION: </span>
                {activeInspectorZone.recommendedAction}
              </div>
              <div className="text-slate-400 pt-0.5 border-t border-slate-850 flex justify-between items-center">
                <span>DISTANCE TO OPERATOR: {calculateDistanceKm(userLoc, activeInspectorZone.center)} km</span>
                <button
                  onClick={() => {
                    onLocChange({ lat: activeInspectorZone.center.lat, lng: activeInspectorZone.center.lng });
                    audioController.playBeep(880, 'sine', 0.05);
                  }}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[7px] font-bold"
                >
                  REPOSITION STATION HERE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HEATMAP DETECTED FIRE INSPECTOR PANEL (MARITIME SHIP OR LAND FIRE) */}
      {isHeatmapEnabled && activeFire && (
        <div className={`p-3 rounded-2xl border shadow-xl text-[8px] font-mono space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-150 ${
          activeFire.category === 'MARITIME_SHIP'
            ? 'bg-blue-950/90 border-blue-500/80'
            : 'bg-amber-950/80 border-amber-500/70'
        }`}>
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <div className="flex items-center space-x-2">
              <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase flex items-center space-x-1 ${
                activeFire.category === 'MARITIME_SHIP'
                  ? 'bg-blue-600 text-white'
                  : 'bg-red-600 text-white'
              }`}>
                {activeFire.category === 'MARITIME_SHIP' ? <Ship className="w-2.5 h-2.5" /> : <Flame className="w-2.5 h-2.5" />}
                <span>{activeFire.category === 'MARITIME_SHIP' ? 'MARITIME SHIP FIRE' : 'TERRESTRIAL LAND FIRE'}</span>
              </span>
              <span className="font-bold text-slate-100 text-[9px]">{activeFire.name}</span>
              <span className="text-cyan-300">[{activeFire.countryOrWaterBody}]</span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-bold text-[7px]">
                FRP: {activeFire.frp} MW
              </span>
              {selectedFire && (
                <button onClick={() => setSelectedFire(null)} className="text-slate-400 hover:text-slate-200">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300">
            {/* Specifics for Maritime Ships vs Land Facility */}
            <div className="space-y-1">
              {activeFire.category === 'MARITIME_SHIP' && activeFire.vesselDetails ? (
                <>
                  <div><span className="text-slate-400">VESSEL CLASS:</span> <span className="text-cyan-300 font-bold">{activeFire.vesselDetails.vesselName}</span> ({activeFire.vesselDetails.vesselType})</div>
                  <div><span className="text-slate-400">MMSI / FLAG:</span> {activeFire.vesselDetails.mmsi || 'N/A'} • {activeFire.vesselDetails.flag || 'INTERNATIONAL'}</div>
                  <div><span className="text-slate-400">INCIDENT TYPE:</span> <span className="text-amber-300 font-bold">{activeFire.vesselDetails.incidentType}</span></div>
                  <div><span className="text-slate-400">ESTIMATED SPEED:</span> {activeFire.vesselDetails.estimatedSpeedKnots} knots</div>
                </>
              ) : activeFire.landFacilityDetails ? (
                <>
                  <div><span className="text-slate-400">FACILITY TYPE:</span> <span className="text-amber-300 font-bold">{activeFire.landFacilityDetails.facilityType}</span></div>
                  <div><span className="text-slate-400">FUEL SOURCE:</span> {activeFire.landFacilityDetails.fuelSource}</div>
                  <div><span className="text-slate-400">OPERATOR / SECTOR:</span> {activeFire.landFacilityDetails.operatorOrSector || 'State Energy Grid'}</div>
                  <div><span className="text-slate-400">REGION:</span> {activeFire.clusterRegion}</div>
                </>
              ) : (
                <div><span className="text-slate-400">REGION:</span> {activeFire.clusterRegion}</div>
              )}
              <div className="text-slate-400 pt-0.5 border-t border-slate-800">
                COORDINATES: {activeFire.lat.toFixed(4)}°N, {activeFire.lng.toFixed(4)}°E
              </div>
            </div>

            <div className="space-y-1 bg-black/60 p-2 rounded-xl border border-slate-800">
              <div className="text-emerald-300 font-bold">
                NASA FIRMS TELEMETRY: {activeFire.sensor} ({activeFire.confidence}% Conf) | Brightness: {activeFire.brightnessTempK} K (~{(activeFire.brightnessTempK - 273.15).toFixed(1)}°C)
              </div>
              <div className="text-slate-300">
                ACQUISITION TIME: {activeFire.acqDate} at {activeFire.acqTimeUtc} (Pass: {activeFire.dayNight === 'D' ? 'Day Orbit' : 'Night Orbit'})
              </div>
              {activeFire.vesselDetails?.vsatCommsImpact && (
                <div className="text-amber-300">
                  VSAT IMPACT: {activeFire.vesselDetails.vsatCommsImpact}
                </div>
              )}
              <div className="text-slate-400 pt-1 flex justify-between items-center border-t border-slate-850">
                <span>DISTANCE TO TARGET: {calculateDistanceKm(userLoc, { lat: activeFire.lat, lng: activeFire.lng })} km</span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => {
                      onLocChange({ lat: activeFire.lat, lng: activeFire.lng });
                      audioController.playBeep(880, 'sine', 0.05);
                    }}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[7px] font-bold"
                  >
                    REPOINT DISH HERE
                  </button>

                  {onSelectSatellite && (
                    <button
                      onClick={() => {
                        onSelectSatellite({
                          id: 't-11w',
                          name: 'Telstar 11N',
                          longitude: -37.5,
                          orbitalSlot: '37.5°W',
                          operator: 'Telesat',
                          status: 'active'
                        });
                        audioController.playBeep(980, 'sine', 0.05);
                      }}
                      className="px-2 py-0.5 rounded bg-blue-900 hover:bg-blue-800 text-blue-200 text-[7px] font-bold"
                    >
                      TELSTAR 11N BEAM
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HEATMAP MALWARE & C2 BEACON INSPECTOR PANEL */}
      {isHeatmapEnabled && activeC2 && (
        <div className="p-3 rounded-2xl bg-red-950/80 border border-red-500/70 shadow-xl text-[8px] font-mono space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between border-b border-red-800/80 pb-1.5">
            <div className="flex items-center space-x-2">
              <span className="px-1.5 py-0.5 rounded text-[7px] font-black uppercase bg-red-600 text-white flex items-center space-x-1">
                <Crosshair className="w-2.5 h-2.5" />
                <span>MALWARE / C2 BEACON</span>
              </span>
              <span className="font-bold text-slate-100 text-[9px]">{activeC2.name}</span>
              <span className="text-red-300 font-mono">[{activeC2.c2Ip}:{activeC2.port}]</span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="px-1.5 py-0.5 rounded bg-red-500 text-white font-bold text-[7px]">
                BEACONS: {activeC2.activeBeacons}
              </span>
              {selectedC2 && (
                <button onClick={() => setSelectedC2(null)} className="text-slate-400 hover:text-slate-200">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300">
            <div className="space-y-1">
              <div><span className="text-slate-400">FAMILY:</span> <span className="text-red-300 font-bold">{activeC2.malwareFamily}</span></div>
              <div><span className="text-slate-400">PROTOCOL:</span> {activeC2.protocol}</div>
              <div><span className="text-slate-400">CAMPAIGN:</span> {activeC2.campaign}</div>
              <div><span className="text-slate-400">TARGET:</span> {activeC2.targetSector}</div>
              <div><span className="text-slate-400">IOC HASH:</span> <span className="font-mono text-cyan-400">{activeC2.iocHash}</span></div>
            </div>

            <div className="space-y-1 bg-black/60 p-2 rounded-xl border border-red-800/50">
              <div className="text-emerald-400 font-bold">
                COUNTERMEASURE: {activeC2.countermeasure}
              </div>
              <div className="text-slate-400 pt-1 flex justify-between items-center">
                <span>DISTANCE TO C2: {calculateDistanceKm(userLoc, { lat: activeC2.lat, lng: activeC2.lng })} km</span>
                {onOpenC4ISR && (
                  <button
                    onClick={onOpenC4ISR}
                    className="px-2 py-0.5 rounded bg-red-900 hover:bg-red-800 text-white text-[7px] font-bold"
                  >
                    DISPATCH TO C4ISR SIGINT NODE
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NASA FIRMS LIVE THERMAL DOSSIER SLIDE-OVER MODAL */}
      {showNasaDossier && (
        <div className="p-3.5 rounded-2xl bg-slate-900/95 border-2 border-emerald-500/80 shadow-2xl space-y-3 font-mono text-[8px] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
              <div>
                <div className="text-[10px] font-black uppercase text-emerald-300">
                  NASA FIRMS / EOSDIS LIVE THERMAL INTELLIGENCE DOSSIER
                </div>
                <div className="text-[7.5px] text-slate-400">
                  ALWAYS-ACTIVE STREAM: {HORMUZ_MARITIME_FIRES.length} STRAIT OF HORMUZ MARITIME SHIP FIRES + {MIDDLE_EAST_LAND_FIRES.length} MIDDLE EAST LAND FIRES
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 text-[7px] font-bold">
                FEED STATUS: 24/7 LIVE DOWNLINK
              </span>
              <button
                onClick={() => setShowNasaDossier(false)}
                className="text-slate-400 hover:text-slate-200 p-1"
                title="Close NASA Dossier"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Satellite Constellation Overpass Status */}
          <div className="bg-black/60 p-2 rounded-xl border border-slate-800 flex items-center justify-between overflow-x-auto gap-2">
            <span className="text-[7px] text-slate-400 shrink-0 font-bold">ORBITAL PASSES:</span>
            {nasaFirmsService.getSatellitePasses().map(pass => (
              <div key={pass.satellite} className="flex items-center space-x-1 shrink-0 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-[6.5px]">
                <SatIcon className="w-2.5 h-2.5 text-cyan-400" />
                <span className="text-slate-200 font-bold">{pass.satellite.split(' ')[0]}</span>
                <span className="text-emerald-400 font-black">{pass.passTimeUtc}</span>
              </div>
            ))}
          </div>

          {/* Search & Filter Bar */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="w-3 h-3 text-slate-500 absolute left-2 top-2" />
              <input
                type="text"
                placeholder="Search ships, MMSI, oilfields, refineries, or countries..."
                value={dossierSearch}
                onChange={(e) => setDossierSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-750 rounded-lg pl-7 pr-2 py-1.5 text-[8px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            {dossierSearch && (
              <button
                onClick={() => setDossierSearch('')}
                className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-[7px]"
              >
                CLEAR
              </button>
            )}
          </div>

          {/* Detections Dual Column: Hormuz Maritime Ships & Middle East Land */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pr-1">
            {/* Column 1: Maritime Ships in Strait of Hormuz */}
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-blue-900/60 pb-1 text-blue-300 font-bold">
                <span className="flex items-center space-x-1">
                  <Ship className="w-3 h-3 text-cyan-400" />
                  <span>STRAIT OF HORMUZ MARITIME SHIPS ({HORMUZ_MARITIME_FIRES.length})</span>
                </span>
                <span className="text-[7px] text-cyan-400">VIIRS 375m NAUTICAL</span>
              </div>

              {HORMUZ_MARITIME_FIRES
                .filter(f => !dossierSearch || f.name.toLowerCase().includes(dossierSearch.toLowerCase()) || f.vesselDetails?.mmsi?.includes(dossierSearch) || f.countryOrWaterBody.toLowerCase().includes(dossierSearch.toLowerCase()))
                .map(vessel => (
                  <div key={vessel.id} className="p-2 rounded-xl bg-slate-950/90 border border-blue-900/50 space-y-1 hover:border-blue-500 transition">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-200">{vessel.name}</span>
                      <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-black">
                        {vessel.frp} MW
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[7px]">
                      <span>MMSI: {vessel.vesselDetails?.mmsi || 'UNKNOWN'} • {vessel.vesselDetails?.vesselType}</span>
                      <span className="text-cyan-300 font-bold">{vessel.vesselDetails?.flag}</span>
                    </div>
                    <div className="text-slate-400 text-[7px] truncate">
                      {vessel.vesselDetails?.incidentType}
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-slate-850">
                      <span className="text-slate-500 text-[6.5px]">{vessel.clusterRegion}</span>
                      <button
                        onClick={() => {
                          onLocChange({ lat: vessel.lat, lng: vessel.lng });
                          setTheaterView('HORMUZ_CHOKEPOINT');
                          setSelectedFire(vessel);
                          audioController.playBeep(980, 'sine', 0.06);
                        }}
                        className="px-1.5 py-0.5 rounded bg-blue-900/80 hover:bg-blue-800 text-cyan-200 font-bold text-[6.5px]"
                      >
                        FOCUS IN CHOKEPOINT
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            {/* Column 2: Middle East Land Fires */}
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-amber-900/60 pb-1 text-amber-300 font-bold">
                <span className="flex items-center space-x-1">
                  <Flame className="w-3 h-3 text-amber-400" />
                  <span>MIDDLE EAST LAND FIRES ({MIDDLE_EAST_LAND_FIRES.length})</span>
                </span>
                <span className="text-[7px] text-amber-400">VIIRS & MODIS TERRESTRIAL</span>
              </div>

              {MIDDLE_EAST_LAND_FIRES
                .filter(f => !dossierSearch || f.name.toLowerCase().includes(dossierSearch.toLowerCase()) || f.countryOrWaterBody.toLowerCase().includes(dossierSearch.toLowerCase()) || f.landFacilityDetails?.facilityType?.toLowerCase().includes(dossierSearch.toLowerCase()))
                .map(landFire => (
                  <div key={landFire.id} className="p-2 rounded-xl bg-slate-950/90 border border-amber-900/50 space-y-1 hover:border-amber-500 transition">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-200">{landFire.name}</span>
                      <span className="px-1 py-0.2 rounded bg-red-600 text-white font-black text-[6.5px]">
                        {landFire.frp} MW
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[7px]">
                      <span className="text-amber-300 font-medium">{landFire.countryOrWaterBody}</span>
                      <span>{landFire.brightnessTempK} K ({landFire.sensor})</span>
                    </div>
                    <div className="text-slate-400 text-[7px] truncate">
                      {landFire.landFacilityDetails?.facilityType}: {landFire.landFacilityDetails?.fuelSource}
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-slate-850">
                      <span className="text-slate-500 text-[6.5px]">{landFire.landFacilityDetails?.operatorOrSector || 'Regional Sector'}</span>
                      <button
                        onClick={() => {
                          onLocChange({ lat: landFire.lat, lng: landFire.lng });
                          setTheaterView('HORMUZ_AND_MIDEAST');
                          setSelectedFire(landFire);
                          audioController.playBeep(920, 'sine', 0.06);
                        }}
                        className="px-1.5 py-0.5 rounded bg-amber-900/80 hover:bg-amber-800 text-amber-100 font-bold text-[6.5px]"
                      >
                        FOCUS IN THEATER
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Click mapping prompt */}
      <div className="flex items-center justify-between text-[7px] font-mono text-slate-500 uppercase tracking-widest px-0.5">
        <span className="flex items-center space-x-1">
          <Crosshair className="w-3 h-3 text-slate-500" />
          <span>Click Grid Array to Manual Repoint</span>
        </span>
        <span className={isStealthMode ? 'text-purple-400' : 'text-cyan-400 font-extrabold'}>
          {satellite.name.toUpperCase()} LOCK
        </span>
      </div>
    </div>
  );
};
