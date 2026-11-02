
import * as React from 'react';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  ShieldCheck, Radio, Compass, Activity, Search, Wifi, AlertTriangle, 
  Zap, Cpu, Terminal, Crosshair, Globe, Layers, Lock, ShieldAlert, 
  Filter, Orbit, Gauge, Eye, EyeOff, Satellite as SatIcon, RefreshCw,
  Sliders, Shield, FileText
} from 'lucide-react';
import { Layout } from './components/Layout.tsx';
import { LookAngleCard } from './components/LookAngleCard.tsx';
import { AITechnician } from './components/AITechnician.tsx';
import { SecurityTools } from './components/SecurityTools.tsx';
import { LinkBudgetCalculator } from './components/LinkBudgetCalculator.tsx';
import { SignalVisualizer } from './components/SignalVisualizer.tsx';
import { TacticalHUD } from './components/TacticalHUD.tsx';
import { TacticalMap } from './components/TacticalMap.tsx';
import { C4ISRTerminal } from './components/C4ISRTerminal.tsx';
import { RSSReader } from './components/RSSReader.tsx';
import { TelemetryPulse } from './components/TelemetryPulse.tsx';
import { SignalInterceptor } from './components/SignalInterceptor.tsx';
import { MediaForge } from './components/MediaForge.tsx';
import { LiveComms } from './components/LiveComms.tsx';
import { TerrainObstruction } from './components/TerrainObstruction.tsx';
import { QuantumDefense } from './components/QuantumDefense.tsx';
import { WarGamesSimulator } from './components/WarGamesSimulator.tsx';
import { ConstellationView } from './components/ConstellationView.tsx';
import { SatelliteDetail } from './components/SatelliteDetail.tsx';
import { ElectronicWarfare } from './components/ElectronicWarfare.tsx';
import { NeuralProcessor } from './components/NeuralProcessor.tsx';
import { MissionPlanner } from './components/MissionPlanner.tsx';
import { TrapManagement } from './components/TrapManagement.tsx';
import { TrafficSniffer } from './components/TrafficSniffer.tsx';
import { AegisC2 } from './components/AegisC2.tsx';
import { GroverVisualizer } from './components/GroverVisualizer.tsx';
import { VSATConfig } from './components/VSATConfig.tsx';
import { QuantumEntropy } from './components/QuantumEntropy.tsx';
import { SitrepBoard } from './components/SitrepBoard.tsx';
import { TacticalReportModal } from './components/TacticalReportModal.tsx';
import { SpectralCanary } from './components/SpectralCanary.tsx';
import { SpectrumAnalyzer } from './components/SpectrumAnalyzer.tsx';
import { ConnectivityMesh } from './components/ConnectivityMesh.tsx';
import { WeatherDashboard } from './components/WeatherDashboard.tsx';
import { IPGeolocator } from './components/IPGeolocator.tsx';
import { AdvancedTacticalSuite } from './components/AdvancedTacticalSuite.tsx';
import { USBDeviceManager } from './components/USBDeviceManager.tsx';
import { NodeScanner } from './components/NodeScanner.tsx';
import { SpoofTracer } from './components/SpoofTracer.tsx';
import { ThreatDossier } from './components/ThreatDossier.tsx';
import { YARAScanner } from './components/YARAScanner.tsx';
import { OrbitalStriker } from './components/OrbitalStriker.tsx';
import { DroneSwarmCommand } from './components/DroneSwarmCommand.tsx';
import { CyberKillChain } from './components/CyberKillChain.tsx';
import { CyberAttackSuite } from './components/CyberAttackSuite.tsx';
import { SignalJammer } from './components/SignalJammer.tsx';
import { BotnetCommand } from './components/BotnetCommand.tsx';
import { RadioInterceptSuite } from './components/RadioInterceptSuite.tsx';
import { QuantumDecryptor } from './components/QuantumDecryptor.tsx';
import { BiometricScanner } from './components/BiometricScanner.tsx';
import { TacticalScriptEnv } from './components/TacticalScriptEnv.tsx';
import { RemoteAccessTerminal } from './components/RemoteAccessTerminal.tsx';
import { Sentinel } from './components/Sentinel.tsx';
import { Infrastructure } from './components/Infrastructure.tsx';
import { MaritimeFireMonitor } from './components/MaritimeFireMonitor.tsx';
import { ThreatHeatmap } from './components/ThreatHeatmap.tsx';
import { ModuleExportToolbar } from './components/ModuleExportToolbar.tsx';
import { HormuzFireAlert } from './components/TacticalHUD.tsx';
import { audioController } from './services/audioService.ts';
import { calculateLookAngles } from './utils/geoUtils.ts';
import { Coordinates, Satellite, LookAngles, WeatherCondition, MainView, TacticalEvent } from './types.ts';
import { COMMON_SATELLITES } from './constants.ts';

const STORAGE_KEY = 'satexpert_tactical_v5';
const STEALTH_STORAGE_KEY = 'satexpert_stealth_mode';
const EVENT_LOG_STORAGE_KEY = 'satexpert_event_logs';

export const App: React.FC = () => {
  const [satellites, setSatellites] = useState<Satellite[]>(COMMON_SATELLITES);
  const [userLoc, setUserLoc] = useState<Coordinates>({ lat: 51.5074, lng: -0.1278 });
  const [selectedSat, setSelectedSat] = useState<Satellite>(satellites[0]);
  const [lookAngles, setLookAngles] = useState<LookAngles | null>(null);
  const [view, setView] = useState<MainView>('tactical');
  const [defcon, setDefcon] = useState<number>(5);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [weather, setWeather] = useState<WeatherCondition>('CLEAR');
  const [isJamming, setIsJamming] = useState<boolean>(false);
  const [jammingPower, setJammingPower] = useState<number>(50);
  const [isStealthMode, setIsStealthMode] = useState<boolean>(false);
  const [isNeuralCleaning, setIsNeuralCleaning] = useState(false);
  const [isDecoyActive, setIsDecoyActive] = useState(false);
  const [isZPEActive, setIsZPEActive] = useState(false);
  
  // Global Event Log State
  const [eventLogs, setEventLogs] = useState<TacticalEvent[]>([]);
  const [hasNewLogs, setHasNewLogs] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const isFirstMount = useRef(true);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  const addMissionLog = useCallback((detail: string, status: any = 'active') => {
    const newEvent: TacticalEvent = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString([], { hour12: false }),
      satName: selectedSat.name,
      satId: selectedSat.id,
      status: status,
      detail: detail
    };
    setEventLogs(prev => [newEvent, ...prev].slice(0, 50));
    setHasNewLogs(true);
  }, [selectedSat]);

  // Automated Notification Alert System for Strait of Hormuz Maritime Ship Fires
  const [hormuzFireAlert, setHormuzFireAlert] = useState<HormuzFireAlert | null>({
    active: true,
    vesselName: 'MT Front Altair',
    vesselType: 'VLCC Crude Tanker',
    coordinates: '26.34°N, 56.41°E',
    frp: 640,
    incidentType: 'Severe Cargo Deck Inferno / Inbound TSS Chokepoint Compromised',
    timestamp: new Date().toLocaleTimeString([], { hour12: false })
  });

  const hasTriggeredInitialFireLog = useRef(false);
  useEffect(() => {
    // Initial high-priority entry into event log for Strait of Hormuz ship fire detection
    if (!hasTriggeredInitialFireLog.current) {
      hasTriggeredInitialFireLog.current = true;
      const initialAlertLog: TacticalEvent = {
        id: 'evt-hormuz-fire-' + Math.random().toString(36).substr(2, 7),
        timestamp: new Date().toLocaleTimeString([], { hour12: false }),
        satName: selectedSat.name,
        satId: selectedSat.id,
        status: 'CRITICAL',
        detail: '[NASA FIRMS / VIIRS 375m] NEW MARITIME SHIP FIRE DETECTED: MT Front Altair (VLCC Crude Tanker) ablaze at 26.34°N, 56.41°E in Strait of Hormuz Inbound TSS. FRP: 640MW. Flash warning routed to Tactical HUD.'
      };
      setEventLogs(prev => {
        const exists = prev.some(l => l.detail.includes('MT Front Altair'));
        return exists ? prev : [initialAlertLog, ...prev].slice(0, 50);
      });
      setHasNewLogs(true);
    }

    // Automated periodic satellite surveillance check for maritime ship fires in Strait of Hormuz
    const fireInterval = setInterval(() => {
      const candidates = [
        {
          name: 'MT Front Altair',
          type: 'VLCC Crude Tanker',
          coords: '26.34°N, 56.41°E',
          frp: 640,
          incident: 'Cargo Tank Deck Flash Blaze in Inbound TSS Lane'
        },
        {
          name: 'Stolt Valor',
          type: 'Chemical Tanker',
          coords: '26.48°N, 56.55°E',
          frp: 480,
          incident: 'Manifold Flaring / Chemical Cargo Deck Inferno'
        },
        {
          name: 'Delta Poseidon',
          type: 'VLCC Crude Tanker',
          coords: '26.58°N, 56.28°E',
          frp: 450,
          incident: 'Pump Room Explosion near Musandam Chokepoint'
        },
        {
          name: 'Al-Ghashamiya',
          type: 'LNG Carrier',
          coords: '26.12°N, 56.74°E',
          frp: 510,
          incident: 'Cryogenic Methane Boil-Off Flare Out of Control'
        }
      ];

      const chosen = candidates[Math.floor(Math.random() * candidates.length)];
      setHormuzFireAlert({
        active: true,
        vesselName: chosen.name,
        vesselType: chosen.type,
        coordinates: chosen.coords,
        frp: chosen.frp,
        incidentType: chosen.incident,
        timestamp: new Date().toLocaleTimeString([], { hour12: false })
      });

      const recurringLog: TacticalEvent = {
        id: 'evt-fire-' + Math.random().toString(36).substr(2, 7),
        timestamp: new Date().toLocaleTimeString([], { hour12: false }),
        satName: selectedSat.name,
        satId: selectedSat.id,
        status: 'CRITICAL',
        detail: `[AUTOMATED SATELLITE ALERT] Thermal anomaly pulse: ${chosen.name} (${chosen.type}) confirmed on fire at ${chosen.coords}. FRP: ${chosen.frp}MW.`
      };
      setEventLogs(prev => [recurringLog, ...prev].slice(0, 50));
      setHasNewLogs(true);
    }, 45000);

    return () => clearInterval(fireInterval);
  }, [selectedSat]);

  // Source of Truth Telemetry logic
  const telemetry = useMemo(() => {
    let snr = 16.0;
    let rxPower = -42.0;
    let packetLoss = 0.00;
    let bucTemp = 45.0;

    if (weather === 'OVERCAST') { snr -= 2.0; rxPower -= 1.5; }
    else if (weather === 'LIGHT_RAIN') { snr -= 5.0; rxPower -= 3.5; packetLoss += 0.8; }
    else if (weather === 'HEAVY_STORM') { snr -= 14.0; rxPower -= 12.0; packetLoss += 12.5; }

    if (isJamming) {
      snr -= (jammingPower / 5); 
      packetLoss += (jammingPower / 2);
      rxPower += (jammingPower / 10);
      bucTemp += (jammingPower / 15);
    }

    if (isNeuralCleaning) {
      snr += 4.5;
      packetLoss *= 0.2;
    }
    
    if (isDecoyActive && isJamming) {
      // Decoy broadcaster radiates phantom transponders, attenuating hostile EW jamming impact
      snr += (jammingPower / 8);
      packetLoss *= 0.5;
    }

    if (isZPEActive) {
      bucTemp = Math.max(32.0, bucTemp - 14.0);
      snr += 1.8;
    }
    
    if (defcon <= 2) bucTemp += 8.0;

    if (isStealthMode) {
      snr = 20.0; rxPower = -30.0; packetLoss = 0.00; bucTemp = 35.0;
    }

    return {
      snr: Math.max(0, snr + (Math.random() - 0.5)).toFixed(2),
      rxPower: (rxPower + (Math.random() - 0.5)).toFixed(1),
      bucTemp: (bucTemp + (Math.random() - 0.5)).toFixed(1),
      packetLoss: Math.min(100, packetLoss + (Math.random() * 0.2)).toFixed(2),
      status: snr > 10 ? "NOMINAL" : (snr > 4 ? "DEGRADED" : "CRITICAL")
    };
  }, [weather, isJamming, jammingPower, defcon, isStealthMode, isNeuralCleaning, isDecoyActive, isZPEActive]);

  useEffect(() => {
    if (!process.env.GEMINI_API_KEY) {
      setApiKeyError("CRITICAL: GEMINI_API_KEY is not defined in environment.");
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.loc) setUserLoc(parsed.loc);
      if (parsed.satId) {
        const sat = satellites.find(s => s.id === parsed.satId);
        if (sat) setSelectedSat(sat);
      }
      setDefcon(parsed.defcon || 5);
    }
    const savedStealth = localStorage.getItem(STEALTH_STORAGE_KEY);
    if (savedStealth !== null) setIsStealthMode(JSON.parse(savedStealth));

    const savedLogs = localStorage.getItem(EVENT_LOG_STORAGE_KEY);
    if (savedLogs) setEventLogs(JSON.parse(savedLogs));

    isFirstMount.current = false;

    // Start audio on first user interaction (browser restriction)
    const startAudio = () => {
      audioController.startAmbientDrone();
      window.removeEventListener('mousedown', startAudio);
      window.removeEventListener('keydown', startAudio);
    };
    window.addEventListener('mousedown', startAudio);
    window.addEventListener('keydown', startAudio);

    const handleNavView = (e: Event) => {
      const customEvent = e as CustomEvent<MainView>;
      if (customEvent.detail) setView(customEvent.detail);
    };
    window.addEventListener('nav-view', handleNavView);
    return () => {
      window.removeEventListener('mousedown', startAudio);
      window.removeEventListener('keydown', startAudio);
      window.removeEventListener('nav-view', handleNavView);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ loc: userLoc, satId: selectedSat.id, defcon }));
  }, [userLoc, selectedSat, defcon]);

  useEffect(() => {
    if (!isFirstMount.current) {
      localStorage.setItem(STEALTH_STORAGE_KEY, JSON.stringify(isStealthMode));
    }
    if (isStealthMode) {
      document.body.classList.add('stealth-active');
    } else {
      document.body.classList.remove('stealth-active');
    }
  }, [isStealthMode]);

  useEffect(() => {
    localStorage.setItem(EVENT_LOG_STORAGE_KEY, JSON.stringify(eventLogs));
  }, [eventLogs]);

  useEffect(() => {
    setLookAngles(calculateLookAngles(userLoc, selectedSat.longitude));
  }, [userLoc, selectedSat]);

  const VIEW_CATEGORIES = useMemo(() => [
    { 
      id: 'TACTICAL_BASE',
      name: 'Tactical Base',
      icon: Orbit,
      tagline: 'Look angles, constellation orbits, hardware specs, threat heatmap & mesh',
      views: ['tactical', 'constellation', 'satellite_detail', 'threat_heatmap', 'mesh', 'weather', 'geolocator'] as MainView[]
    },
    { 
      id: 'SIGINT_SUITE',
      name: 'SIGINT Suite',
      icon: Radio,
      tagline: 'Carrier interception, quantum decryptor, packet sniffer & spectrum canary',
      views: ['c4isr_terminal', 'maritime_fire_monitor', 'intelligence', 'interception', 'node_scanner', 'spoof_tracer', 'threat_dossier', 'yara_scanner', 'sniffer', 'analyzer', 'specter', 'traps', 'radio_intercept', 'quantum_decryptor', 'biometric_scanner', 'telemetry_pulse'] as MainView[]
    },
    { 
      id: 'ACTIVE_OPS',
      name: 'Active Ops',
      icon: Zap,
      tagline: 'Electronic warfare, drone swarms, orbital strike, kill chain & botnets',
      views: ['tactical_suite', 'warfare', 'planner', 'neural', 'orbital_strike', 'drone_swarm', 'kill_chain', 'cyber_attack', 'signal_jamming', 'botnet_command', 'script_env', 'remote_access'] as MainView[]
    },
    { 
      id: 'CYBER_CMD',
      name: 'Cyber CMD',
      icon: Shield,
      tagline: 'Quantum defense, Aegis C2, Grover brute visualizer & Sentinel telemetry',
      views: ['defense', 'simulation', 'aegis', 'usb_manager', 'vsat_config', 'grover', 'sentinel'] as MainView[]
    },
    { 
      id: 'AUX_DATA',
      name: 'Aux Intelligence',
      icon: Layers,
      tagline: 'Scientific link budget, terrain path clearance, intel RSS & infrastructure',
      views: ['media', 'live', 'calculations', 'terrain', 'news', 'infrastructure'] as MainView[]
    }
  ], []);

  const [activeCategory, setActiveCategory] = useState<string>('TACTICAL_BASE');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Keep category tab in sync with active view
  useEffect(() => {
    const matching = VIEW_CATEGORIES.find(c => c.views.includes(view));
    if (matching && matching.id !== activeCategory) {
      setActiveCategory(matching.id);
    }
  }, [view, VIEW_CATEGORIES]);

  const currentCategoryObj = useMemo(() => {
    return VIEW_CATEGORIES.find(c => c.id === activeCategory) || VIEW_CATEGORIES[0];
  }, [VIEW_CATEGORIES, activeCategory]);

  const allViewsList = useMemo(() => {
    return VIEW_CATEGORIES.flatMap(c => c.views.map(v => ({ view: v, category: c.id })));
  }, [VIEW_CATEGORIES]);

  const filteredViews = useMemo(() => {
    if (!searchQuery.trim()) {
      return currentCategoryObj.views;
    }
    const q = searchQuery.toLowerCase().trim();
    return allViewsList
      .filter(item => item.view.toLowerCase().includes(q))
      .map(item => item.view);
  }, [searchQuery, currentCategoryObj, allViewsList]);

  return (
    <div className={`crt-screen min-h-screen ${(!isStealthMode && (isJamming || defcon === 1)) ? 'crt-distorted' : ''}`}>
      {/* CRT Overlay Effects */}
      <div className="crt-overlay" />
      <div className="crt-vignette" />
      <div className="crt-flicker" />

      {apiKeyError && (
        <div className="bg-red-600 text-white py-2 px-4 text-center font-black text-[10px] tracking-[0.5em] uppercase animate-pulse z-[9999] relative">
          [VOICE_UPLINK_FAILURE] {apiKeyError}
        </div>
      )}
      <Layout isStealthMode={isStealthMode} setIsStealthMode={setIsStealthMode}>
        <div className="flex flex-col space-y-6 max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8 pb-12 transition-all duration-500">
          
          {/* Tactical Command Bridge Header */}
          <div className={`glass p-5 lg:p-6 rounded-[28px] border-2 border-slate-800 shadow-[0_24px_50px_rgba(0,0,0,0.6)] relative overflow-hidden group transition-all ${defcon === 1 || isJamming ? 'defcon-alert' : ''}`}>
            {/* Top Command Line */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
              {/* Left Branding */}
              <div className="flex items-center space-x-3.5">
                <div className="relative">
                  <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                    <Crosshair className="w-5 h-5 animate-spin" style={{ animationDuration: '16s' }} />
                  </div>
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950 animate-pulse"></div>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-black uppercase tracking-[0.25em] text-cyan-400 font-mono">SATEXPERT-313</span>
                    <span className="text-[9px] font-mono bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 px-1.5 py-0.5 rounded">TSI C2 v5.4</span>
                    <span className="text-[9px] font-mono text-emerald-400 hidden sm:inline-flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span>NIST PQC ACTIVE</span>
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono tracking-wide">
                    Tactical Satellite Communications Intelligence & Cyber-Kinetic Operations Platform
                  </p>
                </div>
              </div>

              {/* Right Controls Dock: DEFCON, Stealth, Jammer, Stats */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-start md:justify-end">
                {/* DEFCON Selector */}
                <div className="flex items-center space-x-1 bg-slate-950/90 border border-slate-800 p-1 rounded-xl shadow-inner">
                  <span className="text-[8.5px] font-mono font-bold text-slate-400 px-2 uppercase tracking-wider hidden sm:inline">DEFCON</span>
                  {[5, 4, 3, 2, 1].map(lvl => (
                    <button
                      key={lvl}
                      onClick={() => setDefcon(lvl)}
                      title={`Readiness: DEFCON ${lvl}`}
                      className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-black transition-all ${
                        defcon === lvl
                          ? lvl === 1
                            ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.8)] animate-pulse'
                            : lvl === 2
                            ? 'bg-amber-500 text-slate-950 shadow-[0_0_10px_rgba(245,158,11,0.6)]'
                            : lvl === 3
                            ? 'bg-yellow-400 text-slate-950'
                            : 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(34,211,238,0.5)]'
                          : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>

                {/* Stealth Toggle */}
                <button 
                  onClick={() => {
                    const nextStealth = !isStealthMode;
                    setIsStealthMode(nextStealth);
                    addMissionLog(nextStealth ? "STEALTH_MODE_ENGAGED: MASKING ALL TELEMETRY TRANSMISSIONS" : "STEALTH_MODE_DISENGAGED: RESUMING NORMAL OPERATION", "warning");
                  }}
                  className={`text-[9px] font-mono uppercase tracking-widest px-3 py-1.5 rounded-xl border transition-all duration-300 flex items-center space-x-2 ${
                    isStealthMode 
                      ? 'bg-purple-950/90 border-purple-500 text-purple-300 font-bold shadow-[0_0_12px_rgba(168,85,247,0.4)] animate-pulse'
                      : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-cyan-400'
                  }`}
                  title="Toggle Stealth Mode"
                >
                  <span className={`w-2 h-2 rounded-full ${isStealthMode ? 'bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.9)]' : 'bg-slate-600'}`}></span>
                  <span>STEALTH: {isStealthMode ? "ACTIVE" : "OFFLINE"}</span>
                </button>

                {/* Jammer Quick Toggle */}
                <button
                  onClick={() => {
                    const nextJamming = !isJamming;
                    setIsJamming(nextJamming);
                    addMissionLog(nextJamming ? `JAMMER_ACTIVATED: ELECTRONIC COUNTERMEASURES SWEEP AT ${jammingPower}% POWER` : "JAMMER_STANDBY: RF SPECTRUM QUIET", nextJamming ? "CRITICAL" : "INFO");
                  }}
                  className={`text-[9px] font-mono uppercase tracking-widest px-3 py-1.5 rounded-xl border transition-all ${
                    isJamming
                      ? 'bg-red-950/90 border-red-500 text-red-300 font-black shadow-[0_0_12px_rgba(239,68,68,0.5)] animate-pulse'
                      : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-red-400'
                  }`}
                  title="Toggle RF Jammer"
                >
                  <ShieldAlert className="w-3.5 h-3.5 inline mr-1 text-red-500" />
                  <span>JAMMER: {isJamming ? `${jammingPower}%` : "OFF"}</span>
                </button>

                {/* Tactical Report PDF Generator Button */}
                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="text-[9px] font-mono uppercase tracking-widest px-3 py-1.5 rounded-xl border border-cyan-500/50 bg-cyan-950/70 hover:bg-cyan-900/90 text-cyan-300 font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)] hover:shadow-[0_0_18px_rgba(6,182,212,0.5)] transition-all flex items-center space-x-1.5 group"
                  title="Generate & Export Printable Tactical PDF Report"
                >
                  <FileText className="w-3.5 h-3.5 text-cyan-400 group-hover:animate-bounce" />
                  <span>TACTICAL REPORT (PDF)</span>
                </button>

                {/* Mini Telemetry Snapshot */}
                <div className="hidden xl:flex items-center space-x-2.5 bg-slate-950/80 border border-slate-800/80 px-3 py-1.5 rounded-xl text-[9px] font-mono">
                  <span className="text-slate-500">SNR: <strong className={Number(telemetry.snr) < 5 ? 'text-red-400 animate-pulse' : 'text-cyan-400'}>{telemetry.snr} dB</strong></span>
                  <span className="text-slate-700">·</span>
                  <span className="text-slate-500">PWR: <strong className="text-slate-300">{telemetry.rxPower} dBW</strong></span>
                  <span className="text-slate-700">·</span>
                  <span className="text-slate-500">LOSS: <strong className="text-slate-300">{telemetry.packetLoss}%</strong></span>
                </div>
              </div>
            </div>

            {/* Middle: 5 Category Tabs + Module Filter Search */}
            <div className="pt-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              {/* Category Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950/90 border border-slate-850 rounded-2xl">
                {VIEW_CATEGORIES.map(cat => {
                  const Icon = cat.icon;
                  const isActive = activeCategory === cat.id && !searchQuery.trim();
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setActiveCategory(cat.id);
                        setSearchQuery('');
                      }}
                      className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 border ${
                        isActive
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.35)]'
                          : 'text-slate-400 border-transparent hover:text-cyan-300 hover:bg-slate-900/80'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-slate-500'}`} />
                      <span>{cat.name}</span>
                      <span className={`text-[8px] font-mono px-1.5 py-0.2 rounded-md ${
                        isActive ? 'bg-slate-950/20 text-slate-950 font-bold' : 'bg-slate-900 text-slate-500'
                      }`}>
                        {cat.views.length}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search Input for 43+ modules */}
              <div className="relative min-w-[260px] max-w-md">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search all 43 modules (e.g. quantum, warfare, strike)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950/90 text-xs font-mono pl-9 pr-8 py-2 border border-slate-800 rounded-xl text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Active Category Tagline & Modules Ribbon */}
            <div className="pt-3.5">
              <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 mb-2 px-1">
                <span>
                  {searchQuery.trim()
                    ? `FILTERED MODULES (${filteredViews.length} found)`
                    : `${currentCategoryObj.tagline.toUpperCase()}`
                  }
                </span>
                <span className="text-slate-600 hidden sm:inline">CLICK TO ENGAGE INTERFACE</span>
              </div>

              {/* Modules Buttons Bar */}
              <div className="flex flex-wrap gap-2 p-1 max-h-[160px] overflow-y-auto scrollbar-thin">
                {filteredViews.length === 0 ? (
                  <div className="text-xs font-mono text-slate-600 py-2 px-3">
                    No tactical modules match "{searchQuery}". Clear query to view category modules.
                  </div>
                ) : (
                  filteredViews.map((v) => {
                    const isSelected = view === v;
                    return (
                      <button
                        key={v}
                        onClick={() => setView(v as MainView)}
                        className={`px-3 py-1.5 rounded-xl text-[9.5px] font-black uppercase tracking-wider transition-all duration-200 border ${
                          isSelected
                            ? isStealthMode
                              ? 'bg-purple-950 border-purple-500 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.4)] scale-105'
                              : 'bg-cyan-500 border-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(34,211,238,0.4)] scale-105 font-black'
                            : 'text-slate-400 border-slate-900 bg-slate-950/60 hover:border-slate-700 hover:text-cyan-300 hover:bg-slate-900 active:scale-95'
                        }`}
                      >
                        {v.replace(/_/g, ' ')}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Operational View Header & Telemetry Breadcrumb */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-950/80 border border-slate-800/80 px-4 py-2.5 rounded-2xl shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></div>
              <div className="flex items-center space-x-2 font-mono text-xs">
                <span className="text-slate-400 font-bold uppercase tracking-wider">{currentCategoryObj.name}</span>
                <span className="text-slate-600">/</span>
                <span className="text-cyan-400 font-black uppercase tracking-wider">{view.replace(/_/g, ' ')}</span>
              </div>
            </div>
            <div className="flex items-center space-x-3 text-[10px] font-mono text-slate-400">
              <span className="hidden sm:inline">SAT: <strong className="text-slate-200">{selectedSat.name}</strong> ({selectedSat.orbitalSlot})</span>
              <span className="text-slate-700 hidden sm:inline">|</span>
              <span>EL: <strong className="text-slate-200">{lookAngles ? `${lookAngles.elevation}°` : '--'}</strong></span>
              <span className="text-slate-700">|</span>
              <span>AZ: <strong className="text-slate-200">{lookAngles ? `${lookAngles.azimuth}°` : '--'}</strong></span>
              <span className="text-slate-700">|</span>
              <span>LINK: <strong className={telemetry.status === 'NOMINAL' ? 'text-emerald-400' : 'text-amber-400'}>{telemetry.status}</strong></span>
              
              <div className="ml-1 border-l border-slate-800 pl-2 hidden md:block">
                <ModuleExportToolbar 
                  compact={true}
                  moduleTitle={view.replace(/_/g, ' ').toUpperCase()}
                  moduleSubtitle={`Category: ${currentCategoryObj.name} | Node: ${selectedSat.name} (${selectedSat.orbitalSlot})`}
                  classification={isStealthMode ? 'TOP SECRET // NOFORN' : 'SECRET // REL TO NATO'}
                  metadata={{
                    'Target Orbital Node': `${selectedSat.name} (${selectedSat.orbitalSlot})`,
                    'Ground Terminal Loc': `${userLoc.lat.toFixed(4)}°N, ${userLoc.lng.toFixed(4)}°E`,
                    'DEFCON Readiness': defcon,
                    'Telemetry State': telemetry.status,
                    'SNR Ratio': `${telemetry.snr} dB`,
                    'Rx Signal Power': `${telemetry.rxPower} dBW`,
                    'Atmospheric Attenuation': weather,
                    'Stealth Low-Observable': isStealthMode ? 'Active' : 'Offline',
                    'RF Jamming Countermeasure': isJamming ? `Engaged (${jammingPower}%)` : 'Inactive'
                  }}
                  summaryText={`Tactical C2 operational brief extracted for ${view.replace(/_/g, ' ')} module viewport under DEFCON ${defcon} readiness status.`}
                />
              </div>

              <button
                onClick={() => setIsReportModalOpen(true)}
                className="ml-1 text-[9px] uppercase font-mono px-2 py-1 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500 hover:text-slate-950 transition-colors flex items-center space-x-1"
                title="Full Classified PDF Dossier"
              >
                <FileText className="w-2.5 h-2.5 text-cyan-400" />
                <span>Full PDF Dossier</span>
              </button>
              {view !== 'tactical' && (
                <button
                  onClick={() => setView('tactical')}
                  className="ml-1 text-[9px] uppercase font-mono px-2 py-1 rounded bg-slate-900 border border-slate-800 text-cyan-400 hover:bg-cyan-500 hover:text-slate-950 transition-colors"
                >
                  Return to Base
                </button>
              )}
            </div>
          </div>

          <div className="min-h-[70vh]">
            {view === 'tactical' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                {/* 1. Master Command HUD across top */}
                <TacticalHUD 
                  loc={userLoc} 
                  sat={selectedSat} 
                  satellites={satellites} 
                  onLocChange={setUserLoc} 
                  onSatChange={setSelectedSat} 
                  onSatellitesUpdate={setSatellites} 
                  isTracking={isTracking} 
                  onTrackingChange={setIsTracking} 
                  isJamming={isJamming} 
                  setIsJamming={setIsJamming} 
                  jammingPower={jammingPower} 
                  setJammingPower={setJammingPower} 
                  isDecoyActive={isDecoyActive}
                  setIsDecoyActive={setIsDecoyActive}
                  isZPEActive={isZPEActive}
                  setIsZPEActive={setIsZPEActive}
                  weather={weather} 
                  setWeather={setWeather} 
                  isStealthMode={isStealthMode}
                  telemetry={telemetry} 
                  eventLogs={eventLogs}
                  setEventLogs={setEventLogs}
                  hasNewLogs={hasNewLogs}
                  setHasNewLogs={setHasNewLogs}
                  hormuzFireAlert={hormuzFireAlert}
                  onDismissHormuzAlert={() => setHormuzFireAlert(null)}
                  onOpenMaritimeMonitor={() => setView('maritime_fire_monitor')}
                  onFocusHormuzChokepoint={() => {
                    setUserLoc({ lat: 26.50, lng: 56.40 });
                    addMissionLog('OPERATOR ACTION: Focused ground station coordinates to Strait of Hormuz Chokepoint (26.50°N, 56.40°E)', 'INFO');
                  }}
                />

                {/* 2. Main Operational Workspace (Balanced 7 / 5 Grid) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Primary Geospatial & RF Radar Column (Wide, Uncluttered) */}
                  <div className="lg:col-span-7 xl:col-span-7 space-y-6">
                    <TacticalMap 
                      userLoc={userLoc} 
                      satellite={selectedSat} 
                      isTracking={isTracking} 
                      isStealthMode={isStealthMode} 
                      onLocChange={setUserLoc} 
                      telemetry={telemetry}
                      isJamming={isJamming}
                      jammingPower={jammingPower}
                      weather={weather}
                      onSelectSatellite={setSelectedSat}
                      onOpenC4ISR={() => setView('c4isr_terminal')}
                      onOpenMaritimeMonitor={() => setView('maritime_fire_monitor')}
                    />

                    {/* RF Analysis & Positioning Instruments */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {lookAngles && <LookAngleCard angles={lookAngles} satellite={selectedSat} />}
                      <SignalVisualizer 
                        quality={lookAngles?.elevation && lookAngles.elevation > 0 ? 85 : 0} 
                        isJamming={isJamming} 
                        jammingPower={jammingPower} 
                        rainFade={weather === 'CLEAR' ? 0.5 : 5.0} 
                        isStealthMode={isStealthMode} 
                        snr={telemetry.snr}
                        packetLoss={telemetry.packetLoss}
                        satelliteName={selectedSat.name}
                      />
                    </div>
                  </div>

                  {/* Secondary AI C2 Technician & Telemetry Column */}
                  <div className="lg:col-span-5 xl:col-span-5 space-y-6">
                    <AITechnician 
                      context={{ lat: userLoc.lat, lng: userLoc.lng, satName: selectedSat.name, defcon, weather, isJamming }} 
                      telemetry={telemetry} 
                      isStealthMode={isStealthMode}
                      isNeuralCleaning={isNeuralCleaning}
                      onToggleNeuralCleaning={() => {
                        const next = !isNeuralCleaning;
                        setIsNeuralCleaning(next);
                        audioController.playBeep(next ? 880 : 440, 0.08);
                        addMissionLog(`NEURAL_FILTER_${next ? 'ENGAGED' : 'STANDBY'}: +4.5dB gain filter ${next ? 'activated' : 'reverted'}.`, next ? 'success' : 'info');
                      }}
                      isDecoyActive={isDecoyActive}
                      onToggleDecoy={() => {
                        const next = !isDecoyActive;
                        setIsDecoyActive(next);
                        audioController.playBeep(next ? 960 : 380, 0.08);
                        addMissionLog(`DECOY_BROADCASTER_${next ? 'DEPLOYED' : 'OFFLINE'}: Synthetic RF decoy transponders ${next ? 'radiating' : 'disabled'}.`, next ? 'warning' : 'info');
                      }}
                      isZPEActive={isZPEActive}
                      onToggleZPE={() => {
                        const next = !isZPEActive;
                        setIsZPEActive(next);
                        audioController.playBeep(next ? 1040 : 320, 0.08);
                        addMissionLog(`ZERO_POINT_ENERGY_${next ? 'ENGAGED' : 'OFFLINE'}: Sub-harmonic quantum grounding ${next ? 'locked' : 'offline'}.`, next ? 'success' : 'info');
                      }}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
                      <SitrepBoard 
                        selectedSatellite={selectedSat} 
                        defcon={defcon} 
                        onOpenReport={() => setIsReportModalOpen(true)}
                      />
                      <QuantumEntropy />
                    </div>

                    <WeatherDashboard weather={weather} loc={userLoc} satName={selectedSat.name} />
                  </div>
                </div>
              </div>
            )}

            {view === 'constellation' && (
              <ConstellationView 
                satellites={satellites} 
                selectedSat={selectedSat} 
                onSatSelect={(sat) => {
                  setSelectedSat(sat);
                  setView('satellite_detail');
                }} 
                isStealthMode={isStealthMode} 
              />
            )}

            {view === 'satellite_detail' && (
              <SatelliteDetail 
                satellite={selectedSat}
                selectedSat={selectedSat}
                satellites={satellites}
                onSelectSat={(sat) => setSelectedSat(sat)}
                lookAngles={lookAngles} 
                isStealthMode={isStealthMode} 
                isJamming={isJamming} 
                jammingPower={jammingPower}
                weather={weather}
              />
            )}

            {view === 'threat_heatmap' && (
              <ThreatHeatmap 
                userLoc={userLoc}
                selectedSatellite={selectedSat}
                isStealthMode={isStealthMode}
                onSelectCoordinates={setUserLoc}
                onMissionLog={addMissionLog}
              />
            )}

            {view === 'intelligence' && (
              <SecurityTools 
                userLoc={userLoc} 
                selectedSatName={selectedSat.name} 
                isJamming={isJamming} 
                setIsJamming={setIsJamming} 
                jammingPower={jammingPower} 
                setJammingPower={setJammingPower} 
                signalQuality={88} 
                onBack={() => setView('tactical')} 
                isStealthMode={isStealthMode} 
                setIsStealthMode={setIsStealthMode} 
                addMissionLog={addMissionLog}
              />
            )}
            
            {view === 'interception' && (
              <SignalInterceptor isJamming={isJamming} jammingPower={jammingPower} isStealthMode={isStealthMode} />
            )}

            {view === 'warfare' && (
              <ElectronicWarfare 
                isStealthMode={isStealthMode} 
                isJamming={isJamming} 
                jammingPower={jammingPower} 
                onToggleJamming={setIsJamming} 
                onSetJammingPower={setJammingPower} 
              />
            )}

            {view === 'neural' && (
              <NeuralProcessor />
            )}

            {view === 'planner' && (
              <MissionPlanner />
            )}

            {view === 'traps' && (
              <TrapManagement />
            )}

            {view === 'sniffer' && (
              <TrafficSniffer isStealthMode={isStealthMode} />
            )}

            {view === 'aegis' && (
              <AegisC2 />
            )}

            {view === 'grover' && (
              <GroverVisualizer />
            )}

            {view === 'vsat_config' && (
              <VSATConfig />
            )}

            {view === 'specter' && (
              <SpectralCanary />
            )}

            {view === 'analyzer' && (
              <SpectrumAnalyzer />
            )}

            {view === 'mesh' && (
              <ConnectivityMesh satellites={satellites} selectedSat={selectedSat} />
            )}

            {view === 'weather' && (
              <WeatherDashboard weather={weather} loc={userLoc} satName={selectedSat.name} />
            )}

            {view === 'media' && <MediaForge />}
            {view === 'live' && <LiveComms isStealthMode={isStealthMode} addMissionLog={addMissionLog} />}

            {view === 'geolocator' && (
              <IPGeolocator />
            )}

            {view === 'tactical_suite' && (
              <AdvancedTacticalSuite />
            )}

            {view === 'usb_manager' && (
              <USBDeviceManager />
            )}

            {view === 'node_scanner' && (
              <NodeScanner />
            )}

            {view === 'spoof_tracer' && (
              <SpoofTracer />
            )}

            {view === 'threat_dossier' && (
              <ThreatDossier />
            )}

            {view === 'yara_scanner' && (
              <YARAScanner />
            )}

            {view === 'orbital_strike' && (
              <OrbitalStriker addMissionLog={addMissionLog} />
            )}

            {view === 'drone_swarm' && (
              <DroneSwarmCommand addMissionLog={addMissionLog} />
            )}

            {view === 'kill_chain' && (
              <CyberKillChain addMissionLog={addMissionLog} />
            )}

            {view === 'cyber_attack' && (
              <CyberAttackSuite addMissionLog={addMissionLog} />
            )}

            {view === 'signal_jamming' && (
              <SignalJammer addMissionLog={addMissionLog} />
            )}

            {view === 'botnet_command' && (
              <BotnetCommand addMissionLog={addMissionLog} />
            )}

            {view === 'radio_intercept' && (
              <RadioInterceptSuite addMissionLog={addMissionLog} />
            )}

            {view === 'telemetry_pulse' && (
              <TelemetryPulse telemetry={telemetry} isStealthMode={isStealthMode} />
            )}

            {view === 'c4isr_terminal' && (
              <C4ISRTerminal 
                userLoc={userLoc}
                selectedSatellite={selectedSat}
                onSelectSatellite={setSelectedSat}
                onNavigateToMapWithHeatmap={() => setView('tactical')}
                onNavigateToMaritimeMonitor={() => setView('maritime_fire_monitor')}
                addMissionLog={addMissionLog}
                isStealthMode={isStealthMode}
              />
            )}

            {view === 'maritime_fire_monitor' && (
              <MaritimeFireMonitor 
                onOpenTacticalMap={() => setView('tactical')}
                addMissionLog={addMissionLog}
                isStealthMode={isStealthMode}
                eventLogs={eventLogs}
                onTriggerAlert={(vessel, fire) => {
                  setHormuzFireAlert({
                    active: true,
                    vesselName: vessel.name,
                    vesselType: vessel.type,
                    coordinates: `${fire.lat}°N, ${fire.lng}°E`,
                    frp: fire.frp,
                    incidentType: fire.vesselDetails?.incidentType || 'Catastrophic Maritime Thermal Anomaly',
                    timestamp: new Date().toLocaleTimeString([], { hour12: false })
                  });
                }}
              />
            )}
            
            {view === 'quantum_decryptor' && (
              <QuantumDecryptor addMissionLog={addMissionLog} />
            )}

            {view === 'biometric_scanner' && (
              <BiometricScanner addMissionLog={addMissionLog} />
            )}

            {view === 'script_env' && (
              <TacticalScriptEnv addMissionLog={addMissionLog} />
            )}

            {view === 'remote_access' && (
              <RemoteAccessTerminal addMissionLog={addMissionLog} />
            )}

            {view === 'defense' && (
              <div className="max-w-6xl mx-auto">
                <QuantumDefense isStealthMode={isStealthMode} addMissionLog={addMissionLog} />
              </div>
            )}

            {view === 'simulation' && (
              <div className="max-w-6xl mx-auto">
                <WarGamesSimulator satName={selectedSat.name} />
              </div>
            )}

            {view === 'terrain' && lookAngles && (
              <div className="max-w-4xl mx-auto">
                <TerrainObstruction angles={lookAngles} />
              </div>
            )}

            {view === 'calculations' && lookAngles && (
              <div className="max-w-4xl mx-auto space-y-6">
                <TerrainObstruction angles={lookAngles} />
                <LinkBudgetCalculator distance={lookAngles.distance} isStealthMode={isStealthMode} />
              </div>
            )}

            {view === 'news' && (
              <div className="max-w-4xl mx-auto">
                <RSSReader />
              </div>
            )}

            {view === 'sentinel' && (
              <div className="max-w-6xl mx-auto">
                <Sentinel isStealthMode={isStealthMode} addMissionLog={addMissionLog} />
              </div>
            )}

            {view === 'infrastructure' && (
              <div className="max-w-6xl mx-auto">
                <Infrastructure isStealthMode={isStealthMode} addMissionLog={addMissionLog} />
              </div>
            )}
          </div>
          <div className="mt-auto pt-10 border-t border-slate-800/60 flex flex-col md:flex-row items-center justify-between gap-6 text-[10px] font-black uppercase tracking-widest text-slate-600 px-6 bg-slate-950/20 py-8 rounded-b-3xl">
             <div className="flex items-center space-x-6">
                <span className="flex items-center space-x-3 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 relative group overflow-hidden">
                   <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                   <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse"></div>
                   <span className="text-slate-400 group-hover:text-cyan-400 transition-colors">System_Status: Optimal</span>
                </span>
                <span className="text-slate-800 hidden md:block">/</span>
                <span className="text-slate-500 italic opacity-60">Verified_Operator_Access_Only</span>
             </div>
             
             <div className="text-center md:text-right max-w-md opacity-30 hover:opacity-100 transition-all duration-700 cursor-help border-x border-slate-800/30 px-6 py-1">
                <p className="leading-relaxed">This software is a technical simulation for authorized cybersecurity research and training only. Unauthorized misuse is strictly prohibited by standard federal guidelines.</p>
             </div>
             
             <div className="flex items-center space-x-8">
                <div className="flex flex-col items-end">
                   <span className="text-[8px] text-slate-700">KERNEL_CORE_BASE</span>
                   <span className="text-slate-400">V5.4.2-STABLE</span>
                </div>
                <div className="flex space-x-1.5 h-6 items-end">
                   {[1,2,3,4,5,6].map(i => <div key={i} className={`w-1 bg-slate-800 rounded-full ${i <= 3 ? 'h-3 bg-cyan-500/40' : 'h-1.5'}`}></div>)}
                </div>
             </div>
          </div>
        </div>
      </Layout>

      {/* Tactical Report PDF Modal */}
      <TacticalReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        defcon={defcon}
        isStealthMode={isStealthMode}
        isJamming={isJamming}
        jammingPower={jammingPower}
        weather={weather}
        stationCoordinates={userLoc}
        selectedSatellite={selectedSat}
        lookAngles={lookAngles}
        telemetry={telemetry}
        activeView={view}
        eventLogs={eventLogs}
        onMissionLog={addMissionLog}
      />
    </div>
  );
};

export default App;
