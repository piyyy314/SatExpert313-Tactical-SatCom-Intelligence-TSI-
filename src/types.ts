
export interface Coordinates {
  lat: number;
  lng: number;
}

export type SatelliteStatus = 'active' | 'offline' | 'maintenance' | 'decommissioned';
export type WeatherCondition = 'CLEAR' | 'OVERCAST' | 'LIGHT_RAIN' | 'HEAVY_STORM';

export interface Satellite {
  id: string;
  name: string;
  longitude: number; // Positive for East, Negative for West
  orbitalSlot: string;
  operator?: string;
  apogee?: number;
  perigee?: number;
  inclination?: number;
  velocity?: number;
  launchDate?: string;
  period?: number;
  status?: SatelliteStatus;
  altitude?: number;
  type?: string;
}

export interface LookAngles {
  azimuth: number;
  elevation: number;
  skew: number;
  distance: number; // km;
}

export interface LinkBudgetParams {
  uplinkFreq: number; // GHz
  downlinkFreq: number; // GHz
  txPower: number; // dBW
  antSize: number; // meters
  efficiency: number; // %
  lnbNoiseTemp: number; // K
  rainFade: number; // dB
}

export interface LinkBudgetResults {
  fspl: number; // dB
  antGain: number; // dBi
  gt: number; // dB/K
  ebNo: number; // dB
  ber: string; // Scientific notation string
}

export interface TroubleshootingLog {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isCode?: boolean;
  imageUrl?: string;
}

export interface TacticalEvent {
  id: string;
  timestamp: string;
  satName: string;
  satId: string;
  status: SatelliteStatus | 'CRITICAL' | 'BREACH' | 'INFO' | 'STRIKE' | 'warning' | 'success' | 'info' | 'active' | string;
  detail: string;
}

export interface BugReportEvent {
  id: string;
  timestamp: string;
  team: 'RED' | 'SYSTEM' | 'NEUTRAL';
  action: string;
  type: string;
}

export type MainView = 'tactical' | 'constellation' | 'satellite_detail' | 'threat_heatmap' | 'intelligence' | 'interception' | 'defense' | 'simulation' | 'media' | 'live' | 'calculations' | 'terrain' | 'news' | 'warfare' | 'neural' | 'planner' | 'traps' | 'sniffer' | 'aegis' | 'grover' | 'vsat_config' | 'specter' | 'analyzer' | 'mesh' | 'weather' | 'geolocator' | 'tactical_suite' | 'usb_manager' | 'node_scanner' | 'spoof_tracer' | 'threat_dossier' | 'yara_scanner' | 'orbital_strike' | 'drone_swarm' | 'kill_chain' | 'cyber_attack' | 'signal_jamming' | 'botnet_command' | 'radio_intercept' | 'quantum_decryptor' | 'biometric_scanner' | 'script_env' | 'remote_access' | 'sentinel' | 'infrastructure' | 'telemetry_pulse' | 'c4isr_terminal' | 'maritime_fire_monitor';
export type SecurityTab = 'overview' | 'assessment' | 'modem' | 'attack' | 'detection' | 'hardening' | 'codes' | 'scripts' | 'intel' | 'stealth' | 'quantum' | 'wargames' | 'dns';
