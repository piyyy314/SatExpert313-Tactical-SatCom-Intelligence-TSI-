/**
 * Threat Intelligence Data & Client-Side Cache Service
 * Provides structured tactical data for:
 * 1. Global Signal Interference Patterns
 * 2. GPS / GNSS Spoofing Areas & Meaconing Clusters
 * 3. Electronic Warfare (EW) High-Energy Pulse Bursts
 * 4. Cyber Command & Control (C2) Malware HQ Nodes
 */

export interface GpsSpoofingArea {
  id: string;
  name: string;
  designator: string;
  center: { lat: number; lng: number };
  radiusKm: number;
  severity: 'CRITICAL' | 'HIGH' | 'ELEVATED';
  technique: string;
  driftRateMetersSec: number;
  affectedConstellations: string[];
  reportedVictims: number;
  tacticalImpact: string;
  countermeasure: string;
  status: 'ACTIVE' | 'SURGING' | 'INTERMITTENT';
  lastObserved: string;
}

export interface EwPulseEmission {
  id: string;
  emitterName: string;
  designator: string;
  lat: number;
  lng: number;
  peakPowerKw: number;
  erpDbm: number;
  carrierFreqGhz: number;
  prfHz: number;
  pulseWidthUs: number;
  platformType: 'MOBILE_EW_TRUCK' | 'GROUND_STATION' | 'NAVAL_MAST' | 'AIRBORNE_POD';
  targetBand: 'L_BAND_GNSS' | 'S_BAND_TT&C' | 'C_BAND_DOWNLINK' | 'KU_BAND_VSAT' | 'KA_BAND_HIGH_THROUGHPUT';
  threatLevel: 'CRITICAL' | 'HIGH' | 'ELEVATED';
  modulation: string;
  operatorOrUnit: string;
  tacticalNotes: string;
  lastPulseTimestamp: string;
}

export interface MalwareC2Hq {
  id: string;
  hqName: string;
  actorGroup: string;
  lat: number;
  lng: number;
  c2Ip: string;
  port: number;
  malwareFamily: string;
  activeBeacons: number;
  campaign: string;
  targetedSatcom: string[];
  encryptionProtocol: string;
  protocol: string;
  severity: 'CRITICAL' | 'HIGH' | 'ELEVATED';
  iocHash: string;
  defenseAction: string;
  lastBeaconTime: string;
}

export interface SignalInterferenceHotspot {
  id: string;
  name: string;
  lat: number;
  lng: number;
  intensity: number; // 0.0 - 1.0
  frequencyGhz: number;
  bandwidthMhz: number;
  snrDegradationDb: number;
  interferenceType: 'BROADBAND_NOISE' | 'CARRIER_JAMMING' | 'INTERMODULATION' | 'SOLAR_TRANSIT' | 'ADJACENT_SATELLITE';
  affectedTransponder: string;
  impactRadiusKm: number;
  timestamp: string;
}

export interface ThreatIntelSnapshot {
  timestamp: number;
  formattedDate: string;
  version: string;
  gpsSpoofingAreas: GpsSpoofingArea[];
  ewPulseEmissions: EwPulseEmission[];
  malwareC2Hqs: MalwareC2Hq[];
  interferenceHotspots: SignalInterferenceHotspot[];
  cacheStats: {
    hits: number;
    misses: number;
    lastPurge: string;
    source: 'LOCAL_STORAGE_CACHE' | 'LIVE_SATELLITE_DOWNLINK';
  };
}

const CACHE_STORAGE_KEY = 'tsi_threat_heatmap_cache_v2';
const CACHE_TTL_MS = 20 * 60 * 1000; // 20 minutes

// Baseline Strategic GPS Spoofing Areas
export const DEFAULT_GPS_SPOOFING_AREAS: GpsSpoofingArea[] = [
  {
    id: 'spoof-blk-01',
    name: 'Black Sea & Sevastopol Naval Perimeter',
    designator: 'CRIMEA-SPOOF-01',
    center: { lat: 44.50, lng: 34.00 },
    radiusKm: 240,
    severity: 'CRITICAL',
    technique: 'Circle-Walking Meaconing & Ephemeris Drift',
    driftRateMetersSec: 42.5,
    affectedConstellations: ['GPS L1/L2', 'GLONASS G1', 'Galileo E1'],
    reportedVictims: 184,
    tacticalImpact: 'Commercial AIS vessels falsely offset to Simferopol Airport runway 01.',
    countermeasure: 'Switch VSAT to INS / celestial Kalman filter and dual-antenna GNSS nulling.',
    status: 'ACTIVE',
    lastObserved: 'Live (4 min ago)'
  },
  {
    id: 'spoof-med-02',
    name: 'Eastern Mediterranean Air-Maritime Corridor',
    designator: 'LEVANT-SPOOF-02',
    center: { lat: 33.80, lng: 35.00 },
    radiusKm: 210,
    severity: 'CRITICAL',
    technique: 'False Pseudorange Timing & High-Power L1 Overwrite',
    driftRateMetersSec: 35.0,
    affectedConstellations: ['GPS L1 C/A', 'GPS L5', 'Galileo E1'],
    reportedVictims: 312,
    tacticalImpact: 'Civilian airliners reporting false Beirut Rafic Hariri runway proximity alarms.',
    countermeasure: 'Cross-reference satellite Ku-band beacon Doppler and eLoran radio navigation.',
    status: 'SURGING',
    lastObserved: 'Live (2 min ago)'
  },
  {
    id: 'spoof-bal-03',
    name: 'Baltic Sea / Gulf of Finland & Kaliningrad Pocket',
    designator: 'BALTIC-SPOOF-03',
    center: { lat: 54.70, lng: 20.50 },
    radiusKm: 280,
    severity: 'CRITICAL',
    technique: 'Synchronized Multi-Emitter Spoofing Network (Tobol System)',
    driftRateMetersSec: 50.0,
    affectedConstellations: ['GPS L1/L2', 'Galileo E1/E5a'],
    reportedVictims: 420,
    tacticalImpact: 'Commercial flights experiencing GPS loss; maritime GPS jumps >45 nm inland.',
    countermeasure: 'Deploy CRPA (Controlled Reception Pattern Antennas) on tactical SATCOM nodes.',
    status: 'ACTIVE',
    lastObserved: 'Live (7 min ago)'
  },
  {
    id: 'spoof-hor-04',
    name: 'Strait of Hormuz & Qeshm Island Channel',
    designator: 'HORMUZ-SPOOF-04',
    center: { lat: 26.65, lng: 56.10 },
    radiusKm: 125,
    severity: 'CRITICAL',
    technique: 'False Inbound TSS Boundary & Spoofed AIS Vessel Re-injection',
    driftRateMetersSec: 18.0,
    affectedConstellations: ['GPS L1', 'BeiDou B1I'],
    reportedVictims: 96,
    tacticalImpact: 'Crude tankers pushed off navigation separation lanes toward territorial waters.',
    countermeasure: 'Verify positions against Telstar-11N and Yamal-402 Ku-band geostationary look angles.',
    status: 'ACTIVE',
    lastObserved: 'Live (1 min ago)'
  },
  {
    id: 'spoof-red-05',
    name: 'Bab-el-Mandeb & Southern Red Sea Trench',
    designator: 'YEMEN-SPOOF-05',
    center: { lat: 13.00, lng: 43.15 },
    radiusKm: 160,
    severity: 'HIGH',
    technique: 'Coastal Ground-Based GPS Repeater Spoofing',
    driftRateMetersSec: 22.0,
    affectedConstellations: ['GPS L1/L2', 'GLONASS'],
    reportedVictims: 68,
    tacticalImpact: 'Merchant vessels diverted into anti-ship ballistic missile kill envelopes.',
    countermeasure: 'Force Inmarsat-C terminal fallback with hardware cryptographic signature checking.',
    status: 'SURGING',
    lastObserved: 'Live (15 min ago)'
  },
  {
    id: 'spoof-arc-06',
    name: 'Arctic Kola Peninsula & Finnmark Border Axis',
    designator: 'ARCTIC-SPOOF-06',
    center: { lat: 69.60, lng: 30.50 },
    radiusKm: 190,
    severity: 'HIGH',
    technique: 'Intermittent High-Latitude High-Power GNSS Jamming & Spoof',
    driftRateMetersSec: 28.0,
    affectedConstellations: ['GPS L1', 'Galileo E1'],
    reportedVictims: 54,
    tacticalImpact: 'Widerøe regional flights navigating without satellite positioning.',
    countermeasure: 'Ground station radar tracking and inertial reference coupling.',
    status: 'INTERMITTENT',
    lastObserved: '28 min ago'
  },
  {
    id: 'spoof-scs-07',
    name: 'South China Sea / Subi & Mischief Reef Corridor',
    designator: 'SCS-SPOOF-07',
    center: { lat: 10.00, lng: 114.20 },
    radiusKm: 230,
    severity: 'HIGH',
    technique: 'Island-Based EW Transmitters Overriding L1 Civil Codes',
    driftRateMetersSec: 15.0,
    affectedConstellations: ['GPS L1', 'Galileo E1', 'QZSS L1-SAIF'],
    reportedVictims: 115,
    tacticalImpact: 'Fisheries surveillance and coast guard patrols report phantom island vectors.',
    countermeasure: 'Cross-satellite multi-beam triangulation.',
    status: 'ACTIVE',
    lastObserved: '12 min ago'
  },
  {
    id: 'spoof-dmz-08',
    name: 'Korean West Sea / Incheon Approaches & DMZ',
    designator: 'KOR-SPOOF-08',
    center: { lat: 37.85, lng: 126.10 },
    radiusKm: 130,
    severity: 'HIGH',
    technique: 'High-Power Ground-Mounted Pulsed Spoofing Towers',
    driftRateMetersSec: 32.0,
    affectedConstellations: ['GPS L1 C/A'],
    reportedVictims: 140,
    tacticalImpact: 'Civilian air traffic and fishing vessels report false navigational vectors.',
    countermeasure: 'KASS differential augmentation & Korean eLoran backup.',
    status: 'SURGING',
    lastObserved: '9 min ago'
  }
];

// Baseline High-Energy Electronic Warfare (EW) Pulse Emissions
export const DEFAULT_EW_PULSE_EMISSIONS: EwPulseEmission[] = [
  {
    id: 'ew-krasukha-01',
    emitterName: 'Krasukha-4 Multi-Spectral Ground Jammer Complex',
    designator: '1RL257E-CRIMEA',
    lat: 45.10,
    lng: 33.60,
    peakPowerKw: 480,
    erpDbm: 86.8,
    carrierFreqGhz: 8.5,
    prfHz: 2400,
    pulseWidthUs: 12.5,
    platformType: 'MOBILE_EW_TRUCK',
    targetBand: 'KU_BAND_VSAT',
    threatLevel: 'CRITICAL',
    modulation: 'Linear Frequency Modulated (LFM) Chirp',
    operatorOrUnit: '18th Independent EW Brigade',
    tacticalNotes: 'Targeting satellite synthetic aperture radar (SAR) and tactical Ku-band uplinks.',
    lastPulseTimestamp: 'Live (45 sec ago)'
  },
  {
    id: 'ew-murmansk-02',
    emitterName: 'Murmansk-BN Strategic HF Communications Suppression System',
    designator: '5P-28-KOLA',
    lat: 68.95,
    lng: 33.05,
    peakPowerKw: 1250,
    erpDbm: 91.0,
    carrierFreqGhz: 0.03, // 30 MHz HF
    prfHz: 120,
    pulseWidthUs: 45.0,
    platformType: 'GROUND_STATION',
    targetBand: 'S_BAND_TT&C',
    threatLevel: 'CRITICAL',
    modulation: 'Broadband Noise Barrage & Agile Carrier Hopping',
    operatorOrUnit: 'Northern Fleet Strategic Reconnaissance Center',
    tacticalNotes: 'Operational range >3,000 km. Capable of blinding military HF/VHF satellite command uplinks.',
    lastPulseTimestamp: 'Live (1 min ago)'
  },
  {
    id: 'ew-zhitel-03',
    emitterName: 'R-330Zh Zhitel Automated Jamming Station',
    designator: 'R-330ZH-DONETSK',
    lat: 48.02,
    lng: 37.75,
    peakPowerKw: 190,
    erpDbm: 82.8,
    carrierFreqGhz: 1.575, // GPS L1 / Inmarsat
    prfHz: 1850,
    pulseWidthUs: 8.0,
    platformType: 'MOBILE_EW_TRUCK',
    targetBand: 'L_BAND_GNSS',
    threatLevel: 'CRITICAL',
    modulation: 'Barker Phase Coded 13 with Digital Noise Masking',
    operatorOrUnit: 'Operational Tactical EW Battalion',
    tacticalNotes: 'Designed to neutralize Inmarsat-C, Iridium, and satellite navigation terminal downlinks.',
    lastPulseTimestamp: 'Live (2 min ago)'
  },
  {
    id: 'ew-tirada-04',
    emitterName: 'Tirada-2S Strategic Anti-Satellite Transponder Jammer',
    designator: '14TS2-KAZAN',
    lat: 55.75,
    lng: 49.12,
    peakPowerKw: 880,
    erpDbm: 89.4,
    carrierFreqGhz: 14.25, // Ku-band Uplink
    prfHz: 4800,
    pulseWidthUs: 6.2,
    platformType: 'GROUND_STATION',
    targetBand: 'KU_BAND_VSAT',
    threatLevel: 'CRITICAL',
    modulation: 'High-Density Spectrum Sweeping & Transponder Saturation',
    operatorOrUnit: 'Russian Space Forces / Anti-Satellite Unit',
    tacticalNotes: 'Direct RF interference beam directed at geostationary commercial communication transponders.',
    lastPulseTimestamp: 'Live (5 min ago)'
  },
  {
    id: 'ew-bandar-05',
    emitterName: 'Bandar Abbas Coastal High-Power Radar & Jamming Array',
    designator: 'HORMUZ-EW-ALPHA',
    lat: 27.15,
    lng: 56.25,
    peakPowerKw: 340,
    erpDbm: 85.3,
    carrierFreqGhz: 12.10,
    prfHz: 2900,
    pulseWidthUs: 10.0,
    platformType: 'NAVAL_MAST',
    targetBand: 'KU_BAND_VSAT',
    threatLevel: 'HIGH',
    modulation: 'Pulse Doppler Frequency Agility',
    operatorOrUnit: 'IRGCN Naval Electronic Warfare Division',
    tacticalNotes: 'Covers entire Strait of Hormuz chokepoint; targets maritime VSAT and naval radars.',
    lastPulseTimestamp: 'Live (1 min ago)'
  },
  {
    id: 'ew-tartus-06',
    emitterName: 'Tartus Naval EW & Air Defense Intercept Battery',
    designator: 'SYRIA-MED-EW',
    lat: 34.89,
    lng: 35.87,
    peakPowerKw: 310,
    erpDbm: 84.9,
    carrierFreqGhz: 2.45,
    prfHz: 2200,
    pulseWidthUs: 14.0,
    platformType: 'NAVAL_MAST',
    targetBand: 'S_BAND_TT&C',
    threatLevel: 'HIGH',
    modulation: 'Coordinated Multi-Frequency Noise Injection',
    operatorOrUnit: 'Mediterranean Naval Task Force EW Detachment',
    tacticalNotes: 'High-power jamming active across eastern Mediterranean airspace and coastal waters.',
    lastPulseTimestamp: 'Live (8 min ago)'
  },
  {
    id: 'ew-woody-07',
    emitterName: 'Woody Island Strategic Electronic Warfare Complex',
    designator: 'PARACEL-EW-MAIN',
    lat: 16.83,
    lng: 112.33,
    peakPowerKw: 680,
    erpDbm: 88.3,
    carrierFreqGhz: 3.30,
    prfHz: 3500,
    pulseWidthUs: 9.5,
    platformType: 'GROUND_STATION',
    targetBand: 'C_BAND_DOWNLINK',
    threatLevel: 'HIGH',
    modulation: 'Phased Array Steerable High-Power Microwave Beam',
    operatorOrUnit: 'PLA Southern Theater Command EW Regiment',
    tacticalNotes: 'Capable of disrupting allied naval carrier strike group satellite relays and AWACS links.',
    lastPulseTimestamp: 'Live (11 min ago)'
  },
  {
    id: 'ew-cali-08',
    emitterName: 'Point Mugu Tactical Jamming Test Pod',
    designator: 'AN/ALQ-249-NGJ',
    lat: 34.12,
    lng: -119.12,
    peakPowerKw: 240,
    erpDbm: 83.8,
    carrierFreqGhz: 11.50,
    prfHz: 5200,
    pulseWidthUs: 4.8,
    platformType: 'AIRBORNE_POD',
    targetBand: 'KU_BAND_VSAT',
    threatLevel: 'ELEVATED',
    modulation: 'Active Electronically Scanned Array (AESA) Digital Jamming',
    operatorOrUnit: 'Naval Air Warfare Center Weapons Division',
    tacticalNotes: 'Next Generation Jammer Mid-Band flight qualification over maritime test range.',
    lastPulseTimestamp: '18 min ago'
  }
];

// Baseline Cyber Command & Control (C2) Malware HQ Nodes
export const DEFAULT_MALWARE_C2_HQS: MalwareC2Hq[] = [
  {
    id: 'c2-sandworm-01',
    hqName: 'Sandworm APT28 Satcom Destruction Operations HQ',
    actorGroup: 'Sandworm / GRU Main Directorate (Unit 74455)',
    lat: 55.75,
    lng: 37.62,
    c2Ip: '185.220.101.5',
    port: 443,
    malwareFamily: 'AcidRain / HermeticWiper Satcom Mod',
    activeBeacons: 284,
    campaign: 'Operation Shrouded Horizon / Viasat Flash Wipe Reprise',
    targetedSatcom: ['KA-SAT', 'Eutelsat 10B', 'Telstar-11N'],
    encryptionProtocol: 'Quantum-Resistant Kyber Layered TLS 1.3',
    protocol: 'HTTPS / Custom Sat-IP MPE Tunnel',
    severity: 'CRITICAL',
    iocHash: '9f8e4b7a1c0d5e6f3a2b1c4d5e7f8a9b3c2d1e0f',
    defenseAction: 'Isolate satcom management VLAN and flash verified bootloader keys.',
    lastBeaconTime: 'Live (12 sec ago)'
  },
  {
    id: 'c2-phosphorus-02',
    hqName: 'Cobalt Mirage Maritime SIGINT & VSAT Intercept C2',
    actorGroup: 'Phosphorus / Charming Kitten (IRGC Cyber Command)',
    lat: 35.68,
    lng: 51.38,
    c2Ip: '194.36.191.12',
    port: 8443,
    malwareFamily: 'MuddyWater / SmallSieve Maritime Backdoor',
    activeBeacons: 198,
    campaign: 'Operation Chokepoint Watch',
    targetedSatcom: ['Inmarsat-C', 'Iridium Certus', 'Thuraya-3'],
    encryptionProtocol: 'Custom AES-256-CBC with Rotating Pre-shared Keys',
    protocol: 'WebSocket Mesh / DNS Encrypted Tunnel',
    severity: 'CRITICAL',
    iocHash: '3a4f6d8b9c1e2a0f5e7b8c9d0a1b2c3d4e5f6a7b',
    defenseAction: 'Revoke compromised VSAT terminal client certificates and inspect DNS requests.',
    lastBeaconTime: 'Live (30 sec ago)'
  },
  {
    id: 'c2-lazarus-03',
    hqName: 'Lazarus Group Unit 180 Aerospace SIGINT Relay',
    actorGroup: 'Lazarus Group / RGB Technical Reconnaissance',
    lat: 39.03,
    lng: 125.75,
    c2Ip: '175.45.176.88',
    port: 9001,
    malwareFamily: 'AppleJeus / ThreatNeedle Aerospace Implant',
    activeBeacons: 165,
    campaign: 'Operation SkyFall Espionage',
    targetedSatcom: ['Koreasat 5A', 'JCSAT-16', 'Asiasat 9'],
    encryptionProtocol: 'ChaCha20-Poly1305 with Obfuscated Padding',
    protocol: 'HTTPS Proxy via Compromised Telemetry Hubs',
    severity: 'HIGH',
    iocHash: '8b7a6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b',
    defenseAction: 'Block egress on port 9001 and audit VSAT administrative accounts.',
    lastBeaconTime: 'Live (1 min ago)'
  },
  {
    id: 'c2-volt-04',
    hqName: 'Volt Typhoon Critical Infrastructure Satellite Gateway Proxy',
    actorGroup: 'Volt Typhoon (PRC State-Sponsored)',
    lat: 20.04,
    lng: 110.35,
    c2Ip: '103.224.182.250',
    port: 8080,
    malwareFamily: 'Living-Off-The-Land Satcom Router Firmware Implant',
    activeBeacons: 342,
    campaign: 'Pacific Island Hub Pre-Positioning',
    targetedSatcom: ['Telkom-4', 'Palapa-N1', 'SES-12'],
    encryptionProtocol: 'Stealth SSH Reverse Tunneling with Expired Certs',
    protocol: 'TCP / SOCKS5 Multiplexed Router Mesh',
    severity: 'CRITICAL',
    iocHash: '1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d',
    defenseAction: 'Perform hardware integrity audit and replace embedded gateway SOHO router fleet.',
    lastBeaconTime: 'Live (45 sec ago)'
  },
  {
    id: 'c2-turla-05',
    hqName: 'Turla Satellite Downlink Hijack & Exfiltration Station',
    actorGroup: 'Turla / FSB Center 16',
    lat: 59.93,
    lng: 30.33,
    c2Ip: '185.196.220.78',
    port: 53,
    malwareFamily: 'Snake / Uroburos DVB-S Sniffer',
    activeBeacons: 128,
    campaign: 'Unencrypted DVB Downlink Carrier Spoof',
    targetedSatcom: ['Astra 1N', 'Eutelsat 9B', 'Arabsat 5C'],
    encryptionProtocol: 'Encrypted DNS C2 over Raw DVB-S Transport Stream',
    protocol: 'DNS Tunneling / UDP 53',
    severity: 'HIGH',
    iocHash: '4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e',
    defenseAction: 'Enforce mandatory Link Encryption (BISS-CA / DVB-CSA3) on all transponder downlinks.',
    lastBeaconTime: 'Live (3 min ago)'
  },
  {
    id: 'c2-fancy-06',
    hqName: 'Fancy Bear Tactical Satcom Intercept Command Node',
    actorGroup: 'APT28 / GRU Unit 26165',
    lat: 47.23,
    lng: 39.72,
    c2Ip: '193.106.191.44',
    port: 2222,
    malwareFamily: 'X-Agent / Sofacy Tactical Payload',
    activeBeacons: 210,
    campaign: 'Battlefield Terminal Interception',
    targetedSatcom: ['Starlink LEO Relay', 'O3b mPOWER', 'Skynet 5A'],
    encryptionProtocol: 'RSA-4096 Hybrid AES-256 Key Exchange',
    protocol: 'TLS 1.2 / Malleable HTTP Profile',
    severity: 'HIGH',
    iocHash: '5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f',
    defenseAction: 'Implement Zero-Trust Mutual TLS on all edge transceivers.',
    lastBeaconTime: 'Live (2 min ago)'
  }
];

// Baseline Global Signal Interference Hotspots
export const DEFAULT_INTERFERENCE_HOTSPOTS: SignalInterferenceHotspot[] = [
  {
    id: 'rf-hotspot-01',
    name: 'Strait of Hormuz Ku-Band Maritime Jamming Hotspot',
    lat: 26.55,
    lng: 56.35,
    intensity: 0.96,
    frequencyGhz: 11.75,
    bandwidthMhz: 72,
    snrDegradationDb: 14.8,
    interferenceType: 'CARRIER_JAMMING',
    affectedTransponder: 'Telstar-11N Ku-Transponder T12',
    impactRadiusKm: 180,
    timestamp: 'Live'
  },
  {
    id: 'rf-hotspot-02',
    name: 'Sevastopol Naval Base Broadband Noise Flare',
    lat: 44.62,
    lng: 33.53,
    intensity: 0.94,
    frequencyGhz: 12.20,
    bandwidthMhz: 120,
    snrDegradationDb: 16.2,
    interferenceType: 'BROADBAND_NOISE',
    affectedTransponder: 'Eutelsat 10B Wide Beam',
    impactRadiusKm: 220,
    timestamp: 'Live'
  },
  {
    id: 'rf-hotspot-03',
    name: 'Kaliningrad Corridor GNSS & Satcom Null',
    lat: 54.71,
    lng: 20.45,
    intensity: 0.98,
    frequencyGhz: 1.575,
    bandwidthMhz: 54,
    snrDegradationDb: 18.0,
    interferenceType: 'CARRIER_JAMMING',
    affectedTransponder: 'Galileo E1 / GPS L1',
    impactRadiusKm: 290,
    timestamp: 'Live'
  },
  {
    id: 'rf-hotspot-04',
    name: 'Eastern Mediterranean Coastal Jamming Zone',
    lat: 34.00,
    lng: 35.50,
    intensity: 0.92,
    frequencyGhz: 14.10,
    bandwidthMhz: 90,
    snrDegradationDb: 13.5,
    interferenceType: 'INTERMODULATION',
    affectedTransponder: 'Amos-17 Ku-Band Beam',
    impactRadiusKm: 200,
    timestamp: 'Live'
  },
  {
    id: 'rf-hotspot-05',
    name: 'Bab-el-Mandeb Red Sea Maritime Intermod',
    lat: 12.80,
    lng: 43.30,
    intensity: 0.88,
    frequencyGhz: 11.95,
    bandwidthMhz: 36,
    snrDegradationDb: 11.2,
    interferenceType: 'BROADBAND_NOISE',
    affectedTransponder: 'Arabsat-6A Transponder B04',
    impactRadiusKm: 150,
    timestamp: 'Live'
  },
  {
    id: 'rf-hotspot-06',
    name: 'Persian Gulf North Oilfield Radar Flare',
    lat: 28.50,
    lng: 50.80,
    intensity: 0.82,
    frequencyGhz: 12.50,
    bandwidthMhz: 48,
    snrDegradationDb: 9.8,
    interferenceType: 'ADJACENT_SATELLITE',
    affectedTransponder: 'BADR-7 Spot Ku-4',
    impactRadiusKm: 140,
    timestamp: 'Live'
  },
  {
    id: 'rf-hotspot-07',
    name: 'Taiwan Strait High-Density Spectral Congestion',
    lat: 24.50,
    lng: 119.50,
    intensity: 0.89,
    frequencyGhz: 14.35,
    bandwidthMhz: 110,
    snrDegradationDb: 12.4,
    interferenceType: 'CARRIER_JAMMING',
    affectedTransponder: 'JCSAT-2B Asia Beam',
    impactRadiusKm: 195,
    timestamp: 'Live'
  },
  {
    id: 'rf-hotspot-08',
    name: 'Kola Peninsula Arctic Space Surveillance Jamming',
    lat: 69.20,
    lng: 33.50,
    intensity: 0.91,
    frequencyGhz: 2.20,
    bandwidthMhz: 60,
    snrDegradationDb: 15.0,
    interferenceType: 'BROADBAND_NOISE',
    affectedTransponder: 'S-Band Telemetry Carrier',
    impactRadiusKm: 210,
    timestamp: 'Live'
  },
  {
    id: 'rf-hotspot-09',
    name: 'Nevada Test Range High-Power Radar Testing',
    lat: 37.25,
    lng: -115.80,
    intensity: 0.78,
    frequencyGhz: 9.40,
    bandwidthMhz: 80,
    snrDegradationDb: 10.5,
    interferenceType: 'BROADBAND_NOISE',
    affectedTransponder: 'Anik F2 Military Ku',
    impactRadiusKm: 170,
    timestamp: 'Live'
  },
  {
    id: 'rf-hotspot-10',
    name: 'Korean DMZ Incheon Airport Jamming Vector',
    lat: 37.75,
    lng: 126.30,
    intensity: 0.87,
    frequencyGhz: 1.575,
    bandwidthMhz: 40,
    snrDegradationDb: 13.0,
    interferenceType: 'CARRIER_JAMMING',
    affectedTransponder: 'Civil GNSS Navigation Band',
    impactRadiusKm: 135,
    timestamp: 'Live'
  },
  {
    id: 'rf-hotspot-11',
    name: 'Equatorial Scintillation Deep Fade (Atlantic Sector)',
    lat: 2.50,
    lng: -28.00,
    intensity: 0.72,
    frequencyGhz: 11.20,
    bandwidthMhz: 250,
    snrDegradationDb: 8.6,
    interferenceType: 'SOLAR_TRANSIT',
    affectedTransponder: 'IS-37e Atlantic Spot',
    impactRadiusKm: 420,
    timestamp: 'Live'
  },
  {
    id: 'rf-hotspot-12',
    name: 'South China Sea Woody Island Uplink Shadow',
    lat: 16.85,
    lng: 112.35,
    intensity: 0.85,
    frequencyGhz: 6.20,
    bandwidthMhz: 72,
    snrDegradationDb: 11.8,
    interferenceType: 'CARRIER_JAMMING',
    affectedTransponder: 'Chinasat-12 C-Band Transponder',
    impactRadiusKm: 230,
    timestamp: 'Live'
  }
];

class ThreatIntelCacheService {
  private inMemoryCache: ThreatIntelSnapshot | null = null;
  private hitCounter = 0;
  private missCounter = 0;

  /**
   * Retrieves threat intelligence from local cache or initializes baseline
   */
  public getThreatIntel(): ThreatIntelSnapshot {
    // 1. Try memory cache first
    if (this.inMemoryCache && Date.now() - this.inMemoryCache.timestamp < CACHE_TTL_MS) {
      this.hitCounter++;
      return {
        ...this.inMemoryCache,
        cacheStats: {
          ...this.inMemoryCache.cacheStats,
          hits: this.hitCounter,
          misses: this.missCounter,
          source: 'LOCAL_STORAGE_CACHE'
        }
      };
    }

    // 2. Try localStorage
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(CACHE_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as ThreatIntelSnapshot;
          if (parsed && parsed.timestamp && Date.now() - parsed.timestamp < CACHE_TTL_MS) {
            this.hitCounter++;
            this.inMemoryCache = parsed;
            return {
              ...parsed,
              cacheStats: {
                ...parsed.cacheStats,
                hits: this.hitCounter,
                misses: this.missCounter,
                source: 'LOCAL_STORAGE_CACHE'
              }
            };
          }
        }
      } catch (err) {
        console.warn('Threat cache storage read failure, falling back to baseline:', err);
      }
    }

    // 3. Cache Miss: Rebuild baseline snapshot and persist
    this.missCounter++;
    const freshSnapshot = this.generateFreshSnapshot('LIVE_SATELLITE_DOWNLINK');
    this.saveThreatIntel(freshSnapshot);
    return freshSnapshot;
  }

  /**
   * Persists snapshot to localStorage and memory
   */
  public saveThreatIntel(snapshot: ThreatIntelSnapshot): void {
    this.inMemoryCache = snapshot;
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(snapshot));
      } catch (err) {
        console.warn('Failed to persist threat cache to localStorage:', err);
      }
    }
  }

  /**
   * Manually purge cache and re-synchronize from baseline satellite telemetry
   */
  public purgeAndRefresh(): ThreatIntelSnapshot {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(CACHE_STORAGE_KEY);
      } catch {
        // Ignore
      }
    }
    this.inMemoryCache = null;
    this.missCounter++;
    const freshSnapshot = this.generateFreshSnapshot('LIVE_SATELLITE_DOWNLINK');
    freshSnapshot.cacheStats.lastPurge = new Date().toLocaleTimeString([], { hour12: false });
    this.saveThreatIntel(freshSnapshot);
    return freshSnapshot;
  }

  /**
   * Calculates estimated cache size in Kilobytes
   */
  public getCacheSizeKb(): number {
    if (typeof localStorage === 'undefined') return 12.4;
    try {
      const raw = localStorage.getItem(CACHE_STORAGE_KEY);
      return raw ? Math.round((raw.length * 2) / 1024 * 10) / 10 : 14.2;
    } catch {
      return 14.2;
    }
  }

  private generateFreshSnapshot(source: 'LOCAL_STORAGE_CACHE' | 'LIVE_SATELLITE_DOWNLINK'): ThreatIntelSnapshot {
    const now = Date.now();
    return {
      timestamp: now,
      formattedDate: new Date(now).toUTCString(),
      version: 'TSI-PQC-HEATMAP-v5.4',
      gpsSpoofingAreas: DEFAULT_GPS_SPOOFING_AREAS,
      ewPulseEmissions: DEFAULT_EW_PULSE_EMISSIONS,
      malwareC2Hqs: DEFAULT_MALWARE_C2_HQS,
      interferenceHotspots: DEFAULT_INTERFERENCE_HOTSPOTS,
      cacheStats: {
        hits: this.hitCounter,
        misses: this.missCounter,
        lastPurge: new Date(now).toLocaleTimeString([], { hour12: false }),
        source
      }
    };
  }
}

export const threatIntelCache = new ThreatIntelCacheService();
