import React, { useState, useMemo } from 'react';
import { 
  Radio, ShieldAlert, Flame, Terminal, Search, Send, Play, Pause, 
  RotateCcw, Sliders, Globe, Crosshair, Download, CheckCircle2, 
  AlertTriangle, Cpu, Satellite as SatIcon, Layers, Wifi, ExternalLink,
  Zap, Eye, Activity, ShieldCheck, MapPin, RefreshCw, Ship
} from 'lucide-react';
import { Coordinates, Satellite } from '../types.ts';
import { audioController } from '../services/audioService.ts';
import { 
  DETECTED_FIRES, 
  HORMUZ_MARITIME_FIRES,
  MIDDLE_EAST_LAND_FIRES,
  ALL_MIDDLE_EAST_AND_HORMUZ_FIRES,
  DETECTED_MALWARE_C2, 
  getTelstar11NTransportParams,
  FireDetection,
  MalwareC2Detection
} from '../utils/heatmapData.ts';

interface C4ISRTerminalProps {
  userLoc: Coordinates;
  selectedSatellite: Satellite;
  onSelectSatellite?: (sat: Satellite) => void;
  onNavigateToMapWithHeatmap?: () => void;
  onNavigateToMaritimeMonitor?: () => void;
  addMissionLog: (detail: string, status?: 'active' | 'success' | 'warning') => void;
  isStealthMode?: boolean;
}

interface TelegramMessage {
  id: string;
  channel: string;
  author: string;
  handle: string;
  timestamp: string;
  text: string;
  geo?: { lat: number; lng: number; locationName: string };
  threatType?: 'THERMAL_FIRE' | 'MALWARE_C2' | 'JAMMING' | 'OSINT_RECON';
  confidence: number;
  verified: boolean;
}

const INITIAL_TELEGRAM_MESSAGES: TelegramMessage[] = [
  {
    id: 'tg-01',
    channel: 'Frontline C4ISR Actual',
    author: 'Recon Sentinel',
    handle: '@Frontline_C4ISR',
    timestamp: '2 min ago',
    text: 'URGENT: Intense thermal anomaly cluster detected along Donbas front line. VIIRS sensor corroborates active artillery saturation and wildfires. Lat: 48.01, Lng: 37.80. FRP exceeds 800 MW.',
    geo: { lat: 48.01, lng: 37.80, locationName: 'Eastern European Theater' },
    threatType: 'THERMAL_FIRE',
    confidence: 99,
    verified: true
  },
  {
    id: 'tg-02',
    channel: 'SatCom CyberWatch',
    author: 'SIGINT Analyst Kilo',
    handle: '@SatCom_CyberWatch',
    timestamp: '5 min ago',
    text: 'C2 ALERT: New Cobalt Strike listener beaconing over Sat-IP transponder from IP 185.196.220.44:443. Suspected targeting of Ku-band military baseband gateways.',
    geo: { lat: 50.45, lng: 30.52, locationName: 'Kyiv Perimeter' },
    threatType: 'MALWARE_C2',
    confidence: 96,
    verified: true
  },
  {
    id: 'tg-03',
    channel: 'MidEast Chokepoint Intel',
    author: 'Naval SIGINT Node',
    handle: '@ME_Chokepoints_Intel',
    timestamp: '9 min ago',
    text: 'Telstar 11N Transatlantic uplink experiencing sporadic Ku-Band carrier degradation in vicinity of Strait of Hormuz. Recommend shifting MODCOD to 16APSK 3/4 with alpha 0.05 roll-off.',
    geo: { lat: 26.50, lng: 56.20, locationName: 'Strait of Hormuz' },
    threatType: 'OSINT_RECON',
    confidence: 94,
    verified: true
  },
  {
    id: 'tg-04',
    channel: 'Aerospace Recon & FIRMS',
    author: 'Orbital Imagery Desk',
    handle: '@Orbital_FIRMS_Feed',
    timestamp: '14 min ago',
    text: 'FIRMS infrared hotzone: Eastern Mediterranean coastal front fire expanding rapidly. Lat: 36.85, Lng: 28.25. High temperature 485K detected by NOAA-20 VIIRS. Ground crews requesting satellite comms relay.',
    geo: { lat: 36.85, lng: 28.25, locationName: 'Aegean / Anatolia Sector' },
    threatType: 'THERMAL_FIRE',
    confidence: 98,
    verified: true
  },
  {
    id: 'tg-05',
    channel: 'Vulnerability & Botnet Radar',
    author: 'Reverse Engineering Unit',
    handle: '@SatBot_Watch',
    timestamp: '21 min ago',
    text: 'MALWARE REPORT: AcidRain terminal wiper signature detected targeting MIPS/ARM satellite modems. C2 endpoint verified at 91.240.118.172:8080. Urgent firmware hash validation required.',
    geo: { lat: 44.43, lng: 26.10, locationName: 'Bucharest Relay' },
    threatType: 'MALWARE_C2',
    confidence: 95,
    verified: true
  }
];

export const C4ISRTerminal: React.FC<C4ISRTerminalProps> = ({
  userLoc,
  selectedSatellite,
  onSelectSatellite,
  onNavigateToMapWithHeatmap,
  onNavigateToMaritimeMonitor,
  addMissionLog,
  isStealthMode = false
}) => {
  // Navigation tabs inside C4ISR terminal
  const [activeTab, setActiveTab] = useState<'osint_telegram' | 'telstar_uplink' | 'heatmap_intel'>('osint_telegram');

  // Telegram OSINT state
  const [messages, setMessages] = useState<TelegramMessage[]>(INITIAL_TELEGRAM_MESSAGES);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedThreatFilter, setSelectedThreatFilter] = useState<string>('ALL');
  const [customReconPrompt, setCustomReconPrompt] = useState('');
  const [isLiveStreamActive, setIsLiveStreamActive] = useState(true);

  // Telstar 11N Uplink Transport state
  const [symbolRateSlider, setSymbolRateSlider] = useState<number>(27.5);
  const [modcodSelection, setModcodSelection] = useState<string>('16APSK 3/4-L');
  const [rollOffSelection, setRollOffSelection] = useState<number>(0.05);
  const [isUplinkLocked, setIsUplinkLocked] = useState(selectedSatellite.name.includes('Telstar 11N'));

  // Heatmap Intel Scope State: defaults to ALWAYS_HORMUZ_AND_MIDEAST
  const [fireIntelScope, setFireIntelScope] = useState<'ALWAYS_HORMUZ_AND_MIDEAST' | 'HORMUZ_SHIPS' | 'MIDEAST_LAND' | 'GLOBAL'>('ALWAYS_HORMUZ_AND_MIDEAST');

  const displayedFires = useMemo(() => {
    if (fireIntelScope === 'HORMUZ_SHIPS') return HORMUZ_MARITIME_FIRES;
    if (fireIntelScope === 'MIDEAST_LAND') return MIDDLE_EAST_LAND_FIRES;
    if (fireIntelScope === 'ALWAYS_HORMUZ_AND_MIDEAST') return ALL_MIDDLE_EAST_AND_HORMUZ_FIRES;
    return DETECTED_FIRES;
  }, [fireIntelScope]);

  // Telstar 11N calculated transport parameters
  const telstarConfig = useMemo(() => {
    return getTelstar11NTransportParams(userLoc);
  }, [userLoc]);

  // Filtered telegram feed
  const filteredMessages = useMemo(() => {
    return messages.filter(msg => {
      const matchesSearch = msg.text.toLowerCase().includes(searchFilter.toLowerCase()) ||
                            msg.channel.toLowerCase().includes(searchFilter.toLowerCase()) ||
                            msg.author.toLowerCase().includes(searchFilter.toLowerCase());
      const matchesThreat = selectedThreatFilter === 'ALL' || msg.threatType === selectedThreatFilter;
      return matchesSearch && matchesThreat;
    });
  }, [messages, searchFilter, selectedThreatFilter]);

  // Handle Dispatch of OSINT coordinates to Tactical Heatmap / Mission Log
  const handleDispatchToMap = (msg: TelegramMessage) => {
    if (!msg.geo) return;
    audioController.playBeep(980, 'triangle', 0.08);
    addMissionLog(
      `C4ISR_OSINT_TARGET_DISPATCHED: ${msg.geo.locationName} (${msg.geo.lat}N, ${msg.geo.lng}E) routed to Tactical Heatmap`,
      'success'
    );
    if (onNavigateToMapWithHeatmap) {
      onNavigateToMapWithHeatmap();
    }
  };

  // Handle Apply Telstar 11N Uplink Routing
  const handleApplyTelstar11NRouting = () => {
    audioController.playBeep(1040, 'sine', 0.1);
    setIsUplinkLocked(true);

    if (onSelectSatellite) {
      onSelectSatellite({
        id: 't-11w',
        name: 'Telstar 11N',
        longitude: -37.5,
        orbitalSlot: '37.5°W',
        operator: 'Telesat',
        apogee: 35794,
        perigee: 35778,
        inclination: 0.02,
        velocity: 3.07,
        status: 'active'
      });
    }

    addMissionLog(
      `TELSTAR_11N_TRANSPORT_ROUTED: Carrier XP24 (14285.50 MHz) allocated. Symbol rate set to ${symbolRateSlider} Msps (${modcodSelection}, roll-off α=${rollOffSelection}). Polarization skew calibrated to ${telstarConfig.polarizationSkewCalibration.feedhornOffsetDeg}°. Multicast GSE route active.`,
      'success'
    );
  };

  // Add simulated custom OSINT reconnaissance query
  const handleSendReconQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customReconPrompt.trim()) return;

    audioController.playBeep(720, 'sine', 0.05);
    const newMsg: TelegramMessage = {
      id: 'tg-user-' + Date.now(),
      channel: 'Field Recon Task Force',
      author: 'Tactical Operator (Local)',
      handle: '@Operator_Actual',
      timestamp: 'Just now',
      text: customReconPrompt,
      geo: { lat: userLoc.lat, lng: userLoc.lng, locationName: 'Local Station Vector' },
      threatType: 'OSINT_RECON',
      confidence: 100,
      verified: true
    };

    setMessages(prev => [newMsg, ...prev]);
    setCustomReconPrompt('');
    addMissionLog(`OSINT_RECON_TASKED: "${customReconPrompt.slice(0, 40)}..."`, 'active');
  };

  return (
    <div className={`p-6 rounded-3xl border-2 transition-all duration-300 text-slate-100 flex flex-col space-y-6 shadow-2xl overflow-hidden ${
      isStealthMode 
        ? 'bg-black border-purple-950/60 shadow-[inset_0_0_30px_rgba(168,85,247,0.05)]' 
        : 'bg-slate-950 border-slate-900'
    }`}>
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-cyan-950/60 border border-cyan-800/80 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <Radio className="w-6 h-6 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-black uppercase tracking-wider font-mono text-slate-100">
                CYBERSEC / C4ISR SIGINT Terminal Node
              </h2>
              <span className="text-[8px] font-mono px-2 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-800/80 font-bold animate-pulse">
                TOP SECRET // C4ISR
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Open-source intelligence (OSINT) reconnaissance, Telegram intercept stream & Telstar 11N satellite uplink routing transport
            </p>
          </div>
        </div>

        {/* Global Action / Sub-Tab Switcher */}
        <div className="flex items-center space-x-2 bg-slate-900/90 border border-slate-800 rounded-xl p-1">
          <button
            onClick={() => { setActiveTab('osint_telegram'); audioController.playBeep(880, 'sine', 0.04); }}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold tracking-wider uppercase transition-all flex items-center space-x-1.5 ${
              activeTab === 'osint_telegram'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>OSINT / TELEGRAM ({filteredMessages.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('telstar_uplink'); audioController.playBeep(880, 'sine', 0.04); }}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold tracking-wider uppercase transition-all flex items-center space-x-1.5 ${
              activeTab === 'telstar_uplink'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <SatIcon className="w-3.5 h-3.5" />
            <span>TELSTAR 11N UPLINK ROUTING</span>
          </button>

          <button
            onClick={() => { setActiveTab('heatmap_intel'); audioController.playBeep(880, 'sine', 0.04); }}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold tracking-wider uppercase transition-all flex items-center space-x-1.5 ${
              activeTab === 'heatmap_intel'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>HEATMAP CORRELATION ({DETECTED_FIRES.length + DETECTED_MALWARE_C2.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: OSINT & TELEGRAM RECONNAISSANCE CONSOLE */}
      {activeTab === 'osint_telegram' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Controls bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center space-x-2 flex-1 min-w-[260px]">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter OSINT chatter by keywords (e.g. fire, C2, Telstar, thermal, drone)..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-[9px] font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center space-x-1">
                {['ALL', 'THERMAL_FIRE', 'MALWARE_C2', 'OSINT_RECON'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedThreatFilter(type)}
                    className={`px-2 py-1 rounded-lg text-[7.5px] font-mono font-bold uppercase transition-all ${
                      selectedThreatFilter === type
                        ? 'bg-slate-700 text-cyan-300 border border-cyan-500/40'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {type.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsLiveStreamActive(!isLiveStreamActive)}
                className={`px-2.5 py-1.5 rounded-xl text-[8px] font-mono font-bold tracking-wider uppercase border flex items-center space-x-1.5 ${
                  isLiveStreamActive
                    ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                {isLiveStreamActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                <span>{isLiveStreamActive ? 'STREAM: LIVE' : 'STREAM: PAUSED'}</span>
              </button>

              {onNavigateToMapWithHeatmap && (
                <button
                  onClick={onNavigateToMapWithHeatmap}
                  className="px-2.5 py-1.5 rounded-xl text-[8px] font-mono font-bold tracking-wider uppercase bg-red-950/60 border border-red-500/50 text-red-300 hover:bg-red-900/60 transition-all flex items-center space-x-1"
                >
                  <MapPin className="w-3 h-3" />
                  <span>VIEW ON MAP HEATMAP</span>
                </button>
              )}
            </div>
          </div>

          {/* Messages Feed */}
          <div className="grid grid-cols-1 gap-3 max-h-[460px] overflow-y-auto pr-1">
            {filteredMessages.map((msg) => (
              <div 
                key={msg.id}
                className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/90 hover:border-slate-700 transition-all space-y-2.5"
              >
                <div className="flex items-center justify-between text-[8px] font-mono">
                  <div className="flex items-center space-x-2">
                    <span className="font-black text-cyan-400 px-1.5 py-0.5 rounded bg-cyan-950/70 border border-cyan-800/60">
                      {msg.channel}
                    </span>
                    <span className="text-slate-400 font-bold">{msg.author}</span>
                    <span className="text-slate-500">{msg.handle}</span>
                    {msg.verified && (
                      <span className="flex items-center text-emerald-400 text-[7px] space-x-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>VERIFIED SIGINT</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {msg.threatType && (
                      <span className={`px-1.5 py-0.5 rounded font-black text-[7px] ${
                        msg.threatType === 'THERMAL_FIRE'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                          : msg.threatType === 'MALWARE_C2'
                          ? 'bg-red-950 text-red-300 border border-red-800/60'
                          : 'bg-purple-950 text-purple-300 border border-purple-800/60'
                      }`}>
                        {msg.threatType.replace('_', ' ')}
                      </span>
                    )}
                    <span className="text-slate-500">{msg.timestamp}</span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-200 font-mono leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  {msg.text}
                </p>

                {msg.geo && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80 text-[7.5px] font-mono text-slate-400">
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-500">EXTRACTED LOCATION:</span>
                      <span className="text-cyan-300 font-bold">{msg.geo.locationName}</span>
                      <span className="text-slate-400">({msg.geo.lat.toFixed(2)}°N, {msg.geo.lng.toFixed(2)}°E)</span>
                      <span className="text-emerald-400">CONFIDENCE: {msg.confidence}%</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDispatchToMap(msg)}
                        className="px-2 py-0.5 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-800/80 text-cyan-300 font-bold transition-all flex items-center space-x-1"
                      >
                        <Crosshair className="w-2.5 h-2.5" />
                        <span>DISPATCH TO HEATMAP</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Custom OSINT Recon Prompt Form */}
          <form onSubmit={handleSendReconQuery} className="flex items-center space-x-2 pt-2">
            <input
              type="text"
              placeholder="Inject custom OSINT field reconnaissance report or command (e.g. Request thermal FIRMS sweep for Baltic corridor)..."
              value={customReconPrompt}
              onChange={(e) => setCustomReconPrompt(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-[9px] font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[9px] font-mono font-black uppercase tracking-wider transition-all flex items-center space-x-1.5 shadow-md"
            >
              <Send className="w-3.5 h-3.5" />
              <span>TRANSMIT TO TERMINAL</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: TELSTAR 11N SATELLITE UPLINK ROUTING & TRANSPORT PARAMETERS */}
      {activeTab === 'telstar_uplink' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header Action Banner */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <SatIcon className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-black uppercase tracking-wider font-mono text-slate-100">
                  Telstar 11N (37.5°W) RF/IP Transport Configuration
                </h3>
                <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono text-[7.5px] font-bold">
                  ORBITAL SLOT: 37.5°W // TELESAT
                </span>
              </div>
              <p className="text-[9px] font-mono text-slate-400">
                High-throughput transatlantic Ku-band beam routing. Ground station coordinates: {userLoc.lat.toFixed(4)}°N, {userLoc.lng.toFixed(4)}°E
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleApplyTelstar11NRouting}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 text-[9px] font-mono font-black uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>APPLY TELSTAR 11N UPLINK ROUTING</span>
              </button>
            </div>
          </div>

          {/* Grid of Transport Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Box 1: Carrier Allocation */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-[9px] font-mono font-black text-cyan-400 uppercase">
                  1. Carrier Allocation & Spectrum
                </span>
                <span className="text-[7.5px] font-mono text-slate-500">KU-BAND</span>
              </div>
              <div className="space-y-1.5 text-[8px] font-mono text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Transponder ID:</span>
                  <span className="text-slate-200 font-bold">{telstarConfig.carrierAllocation.transponderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Uplink Center Freq:</span>
                  <span className="text-cyan-300 font-bold">{telstarConfig.carrierAllocation.uplinkCenterFreqMhz} MHz</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Downlink Center Freq:</span>
                  <span className="text-slate-300">{telstarConfig.carrierAllocation.downlinkCenterFreqMhz} MHz</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Transponder BW:</span>
                  <span className="text-slate-300">{telstarConfig.carrierAllocation.bandwidthMhz} MHz</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Polarization:</span>
                  <span className="text-slate-300 font-bold">{telstarConfig.carrierAllocation.polarization}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Telemetry Beacon:</span>
                  <span className="text-slate-400">{telstarConfig.carrierAllocation.beaconFreqMhz} MHz</span>
                </div>
              </div>
            </div>

            {/* Box 2: DVB-S2X Parameters */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-[9px] font-mono font-black text-emerald-400 uppercase">
                  2. DVB-S2X ModCod & FEC
                </span>
                <span className="text-[7.5px] font-mono text-emerald-500">ACM ACTIVE</span>
              </div>
              <div className="space-y-2 text-[8px] font-mono text-slate-300">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">MODCOD Scheme:</span>
                  <select 
                    value={modcodSelection}
                    onChange={(e) => setModcodSelection(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-[8px] text-cyan-300 font-bold focus:outline-none"
                  >
                    <option value="QPSK 1/2 (Heavy Storm Resilience)">QPSK 1/2</option>
                    <option value="8PSK 3/4 (Standard)">8PSK 3/4</option>
                    <option value="16APSK 3/4-L (Optimal Carrier)">16APSK 3/4-L</option>
                    <option value="32APSK 5/6 (Max Throughput)">32APSK 5/6</option>
                  </select>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Roll-Off Factor (α):</span>
                  <select 
                    value={rollOffSelection}
                    onChange={(e) => setRollOffSelection(Number(e.target.value))}
                    className="bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-[8px] text-cyan-300 font-bold focus:outline-none"
                  >
                    <option value={0.05}>α = 0.05 (Nyquist +5%)</option>
                    <option value={0.10}>α = 0.10 (+10%)</option>
                    <option value={0.20}>α = 0.20 (+20%)</option>
                  </select>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">FEC Engine:</span>
                  <span className="text-slate-300">LDPC + BCH (Bit Error &lt; 1e-10)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Carrier Recovery Pilots:</span>
                  <span className="text-emerald-400 font-bold">ON (Dynamic Fast Lock)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Baseband Frame:</span>
                  <span className="text-slate-300">64,800 bits (Normal FECFrame)</span>
                </div>
              </div>
            </div>

            {/* Box 3: Polarization Skew Calibration */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-[9px] font-mono font-black text-amber-400 uppercase">
                  3. Polarization Skew Calibration
                </span>
                <span className={`text-[7.5px] font-mono font-bold ${
                  telstarConfig.polarizationSkewCalibration.status === 'OPTIMAL' ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {telstarConfig.polarizationSkewCalibration.status}
                </span>
              </div>
              <div className="space-y-1.5 text-[8px] font-mono text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Calculated True Skew:</span>
                  <span className="text-amber-300 font-bold">{telstarConfig.polarizationSkewCalibration.trueSkewDeg}°</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Feedhorn Offset Required:</span>
                  <span className="text-cyan-300 font-black">{telstarConfig.polarizationSkewCalibration.feedhornOffsetDeg}°</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cross-Pol Isolation:</span>
                  <span className="text-emerald-400 font-bold">{telstarConfig.polarizationSkewCalibration.crossPolIsolationDb} dB (Nominal &gt; 30 dB)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Telstar 11N True Azimuth:</span>
                  <span className="text-slate-300">{telstarConfig.polarizationSkewCalibration.lookAngles.azimuth.toFixed(1)}°</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Telstar 11N Elevation:</span>
                  <span className="text-slate-300">{telstarConfig.polarizationSkewCalibration.lookAngles.elevation.toFixed(1)}°</span>
                </div>
              </div>
            </div>

            {/* Box 4: Symbol Rate Adjustment */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-[9px] font-mono font-black text-purple-400 uppercase">
                  4. Symbol Rate Adjustment
                </span>
                <span className="text-[7.5px] font-mono text-purple-400">TUNABLE</span>
              </div>
              <div className="space-y-2 text-[8px] font-mono text-slate-300">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-500">Symbol Rate:</span>
                    <span className="text-purple-300 font-black">{symbolRateSlider.toFixed(3)} Msps</span>
                  </div>
                  <input
                    type="range"
                    min="1.2"
                    max="45.0"
                    step="0.1"
                    value={symbolRateSlider}
                    onChange={(e) => setSymbolRateSlider(Number(e.target.value))}
                    className="w-full accent-purple-400 cursor-pointer h-1 bg-slate-950 rounded"
                  />
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Occupied RF Bandwidth:</span>
                  <span className="text-slate-300">{(symbolRateSlider * (1 + rollOffSelection)).toFixed(2)} MHz</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Estimated IP Data Rate:</span>
                  <span className="text-cyan-300 font-bold">{(symbolRateSlider * 2.85).toFixed(2)} Mbps</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Spectral Efficiency:</span>
                  <span className="text-slate-400">2.71 bps / Hz</span>
                </div>
              </div>
            </div>

            {/* Box 5: IP Transport & GSE Encapsulation */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 md:col-span-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-[9px] font-mono font-black text-cyan-400 uppercase">
                  5. IP Transport & GSE Encapsulation Layer
                </span>
                <span className="text-[7.5px] font-mono text-emerald-400">C4ISR TRUNK ACTIVE</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[8px] font-mono text-slate-300">
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Encapsulation Type:</span>
                    <span className="text-slate-200 font-bold">{telstarConfig.ipTransportParams.encapsulation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Multicast Trunk Route:</span>
                    <span className="text-cyan-300 font-bold">{telstarConfig.ipTransportParams.multicastUplinkRoute}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Teleport Gateway IP:</span>
                    <span className="text-slate-300">{telstarConfig.ipTransportParams.gatewayIp}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payload MTU:</span>
                    <span className="text-slate-300">{telstarConfig.ipTransportParams.mtu} bytes (Jumbo 9000 ready)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">QoS Profile:</span>
                    <span className="text-emerald-400 font-bold">{telstarConfig.ipTransportParams.qosProfile}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">ACM Controller:</span>
                    <span className="text-slate-300">{telstarConfig.ipTransportParams.acmStatus}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HEATMAP CORRELATION (THERMAL FIRES & C2/MALWARE) */}
      {activeTab === 'heatmap_intel' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
            <div>
              <h3 className="text-xs font-mono font-bold text-slate-200 uppercase">
                Geospatial Tactical Heatmap Correlation
              </h3>
              <p className="text-[8.5px] font-mono text-slate-400">
                Cross-correlating orbital FIRMS infrared fire hotspots with active cyber Command & Control (C2) botnet infrastructure
              </p>
            </div>

            <div className="flex items-center space-x-2">
              {onNavigateToMaritimeMonitor && (
                <button
                  onClick={onNavigateToMaritimeMonitor}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-[8.5px] font-mono font-black uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center space-x-1.5"
                >
                  <Ship className="w-3.5 h-3.5 text-cyan-200" />
                  <span>MARITIME FIRE MONITOR (AIS)</span>
                </button>
              )}
              {onNavigateToMapWithHeatmap && (
                <button
                  onClick={onNavigateToMapWithHeatmap}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-red-500 text-slate-950 text-[8.5px] font-mono font-black uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] flex items-center space-x-1.5"
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>OPEN TACTICAL MAP HEATMAP</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Thermal Fire Detections (FIRMS) */}
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-2 gap-2">
                <div className="flex items-center space-x-2">
                  <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
                  <span className="text-[10px] font-mono font-bold text-amber-300 uppercase">
                    Detected Fires (VIIRS / MODIS) - {displayedFires.length} Points
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setFireIntelScope('ALWAYS_HORMUZ_AND_MIDEAST')}
                    className={`px-1.5 py-0.5 rounded text-[6.5px] font-mono font-bold uppercase transition ${
                      fireIntelScope === 'ALWAYS_HORMUZ_AND_MIDEAST'
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    HORMUZ + MIDEAST ({ALL_MIDDLE_EAST_AND_HORMUZ_FIRES.length})
                  </button>
                  <button
                    onClick={() => setFireIntelScope('HORMUZ_SHIPS')}
                    className={`px-1.5 py-0.5 rounded text-[6.5px] font-mono font-bold uppercase transition ${
                      fireIntelScope === 'HORMUZ_SHIPS'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    SHIPS ({HORMUZ_MARITIME_FIRES.length})
                  </button>
                  <button
                    onClick={() => setFireIntelScope('MIDEAST_LAND')}
                    className={`px-1.5 py-0.5 rounded text-[6.5px] font-mono font-bold uppercase transition ${
                      fireIntelScope === 'MIDEAST_LAND'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    LAND ({MIDDLE_EAST_LAND_FIRES.length})
                  </button>
                  <button
                    onClick={() => setFireIntelScope('GLOBAL')}
                    className={`px-1.5 py-0.5 rounded text-[6.5px] font-mono font-bold uppercase transition ${
                      fireIntelScope === 'GLOBAL'
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    GLOBAL ({DETECTED_FIRES.length})
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {displayedFires.map(fire => (
                  <div key={fire.id} className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1 text-[8px] font-mono">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-200 flex items-center space-x-1">
                        {fire.category === 'MARITIME_SHIP' ? <Ship className="w-2.5 h-2.5 text-cyan-400 shrink-0" /> : <Flame className="w-2.5 h-2.5 text-amber-400 shrink-0" />}
                        <span className="truncate">{fire.name}</span>
                      </span>
                      <span className={`px-1 py-0.2 rounded font-black shrink-0 ${
                        fire.severity === 'EXTREME' ? 'bg-red-600 text-white' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {fire.severity}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Coords: {fire.lat.toFixed(2)}°N, {fire.lng.toFixed(2)}°E [{fire.countryOrWaterBody}]</span>
                      <span className="text-amber-400 font-bold">{fire.frp} MW ({fire.brightnessTempK} K)</span>
                    </div>
                    {fire.vesselDetails && (
                      <div className="text-cyan-300 text-[7px] truncate">
                        VESSEL: {fire.vesselDetails.vesselType} | MMSI: {fire.vesselDetails.mmsi || 'N/A'} | Flag: {fire.vesselDetails.flag}
                      </div>
                    )}
                    {fire.landFacilityDetails && (
                      <div className="text-amber-300/90 text-[7px] truncate">
                        FACILITY: {fire.landFacilityDetails.facilityType} | Fuel: {fire.landFacilityDetails.fuelSource}
                      </div>
                    )}
                    <div className="flex justify-between text-slate-500 text-[7px]">
                      <span>Sensor: {fire.sensor}</span>
                      <span>Confidence: {fire.confidence}% | Pass: {fire.acqTimeUtc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Malware & C2 Detections */}
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center space-x-2">
                  <Crosshair className="w-4 h-4 text-red-500 animate-pulse" />
                  <span className="text-[10px] font-mono font-bold text-red-300 uppercase">
                    Malware & C2 Infrastructure - {DETECTED_MALWARE_C2.length} Nodes
                  </span>
                </div>
                <span className="text-[7px] font-mono px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
                  CYBER THREAT BEACONS
                </span>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {DETECTED_MALWARE_C2.map(c2 => (
                  <div key={c2.id} className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1 text-[8px] font-mono">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-200">{c2.name}</span>
                      <span className="px-1 py-0.2 rounded bg-red-950 text-red-300 border border-red-800 font-bold">
                        {c2.malwareFamily}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span className="text-cyan-300 font-bold">IP: {c2.c2Ip}:{c2.port} ({c2.protocol})</span>
                      <span className="text-red-400">Active Beacons: {c2.activeBeacons}</span>
                    </div>
                    <div className="text-slate-500 text-[7px] truncate">
                      Target: {c2.targetSector} | IOC: {c2.iocHash.slice(0, 12)}...
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
