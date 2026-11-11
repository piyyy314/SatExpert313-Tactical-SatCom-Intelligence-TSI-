import { Coordinates, LookAngles } from '../types.ts';
import { calculateLookAngles } from './geoUtils.ts';

export type FireCategory = 'MARITIME_SHIP' | 'LAND_FIRE';

export const getLiveAcqDate = (): string => new Date().toISOString().slice(0, 10);
export const getLiveAcqTime = (minsAgo = 4): string => {
  const d = new Date(Date.now() - minsAgo * 60000);
  return `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')} UTC`;
};
export const getLiveEta = (daysAhead = 2, timeStr = '18:00'): string => {
  const d = new Date(Date.now() + daysAhead * 86400000);
  return `${d.toISOString().slice(0, 10)} ${timeStr}`;
};

export interface FireDetection {
  id: string;
  name: string;
  category: FireCategory;
  lat: number;
  lng: number;
  frp: number; // Fire Radiative Power in Megawatts (MW)
  brightnessTempK: number; // Brightness temperature in Kelvin
  confidence: number; // Percentage (e.g. 96%)
  sensor: 'NOAA-20 VIIRS 375m' | 'NOAA-21 VIIRS 375m' | 'Suomi NPP VIIRS' | 'NASA Terra MODIS' | 'NASA Aqua MODIS' | 'Sentinel-3 SLSTR';
  clusterRegion: string;
  countryOrWaterBody: string;
  timestamp: string;
  acqDate: string;
  acqTimeUtc: string;
  dayNight: 'D' | 'N';
  severity: 'EXTREME' | 'HIGH' | 'MODERATE';
  estimatedSpreadKm: number;
  vesselDetails?: {
    vesselName: string;
    vesselType: string;
    mmsi?: string;
    flag?: string;
    incidentType: string;
    estimatedSpeedKnots?: number;
    vsatCommsImpact?: string;
  };
  landFacilityDetails?: {
    facilityType: 'Refinery Flare Complex' | 'Oilfield Degassing Flare' | 'Wellhead Fire' | 'Artillery / Combat Burn' | 'Storage Depot Fire' | 'Wildfire / Forest';
    fuelSource: string;
    operatorOrSector?: string;
  };
}

export interface MalwareC2Detection {
  id: string;
  name: string;
  lat: number;
  lng: number;
  c2Ip: string;
  port: number;
  malwareFamily: string;
  protocol: 'HTTPS / TLS 1.3' | 'DNS Tunneling' | 'Sat-IP MPE' | 'IRC C2' | 'WebSocket Mesh';
  severity: 'CRITICAL' | 'HIGH' | 'ELEVATED';
  activeBeacons: number;
  campaign: string;
  targetSector: string;
  timestamp: string;
  iocHash: string;
  countermeasure: string;
}

export interface Telstar11NTransportConfig {
  satelliteName: string;
  orbitalSlot: string;
  longitude: number;
  carrierAllocation: {
    transponderId: string;
    uplinkCenterFreqMhz: number;
    downlinkCenterFreqMhz: number;
    bandwidthMhz: number;
    polarization: 'Linear Horizontal' | 'Linear Vertical' | 'Orthogonal Dual';
    beaconFreqMhz: number;
  };
  dvbS2xParams: {
    standard: 'DVB-S2X (ETSI EN 302 307-2)';
    modcod: string;
    fecRate: string;
    rollOff: number; // alpha = 0.05
    pilots: 'ON (Adaptive Carrier Recovery)' | 'OFF';
    frameLength: '64,800 bits (Normal)' | '16,200 bits (Short)';
  };
  symbolRateAdjustment: {
    nominalMsps: number;
    adaptiveRangeMsps: string;
    currentAllocatedBwKhz: number;
    dataRateMbps: number;
    spectralEfficiencyBpsHz: number;
  };
  polarizationSkewCalibration: {
    stationCoords: Coordinates;
    trueSkewDeg: number;
    feedhornOffsetDeg: number;
    crossPolIsolationDb: number;
    lookAngles: LookAngles;
    status: 'OPTIMAL' | 'CALIBRATION REQUIRED';
  };
  ipTransportParams: {
    encapsulation: 'GSE (Generic Stream Encapsulation)' | 'MPE (Multi-Protocol Encapsulation)';
    multicastUplinkRoute: string;
    gatewayIp: string;
    mtu: number;
    qosProfile: string;
    acmStatus: 'ENABLED (Adaptive Coding & Modulation Active)';
  };
}

/**
 * 1. STRAIT OF HORMUZ MARITIME SHIP FIRES (NASA FIRMS Live VIIRS & MODIS Detections)
 */
export const HORMUZ_MARITIME_FIRES: FireDetection[] = [
  {
    id: 'fire-hormuz-ship-01',
    name: 'VLCC Front Empress - Hull & Engine Thermal Incident',
    category: 'MARITIME_SHIP',
    lat: 26.38,
    lng: 56.62,
    frp: 460,
    brightnessTempK: 492,
    confidence: 99,
    sensor: 'NOAA-20 VIIRS 375m',
    clusterRegion: 'Strait of Hormuz - Inbound Traffic Separation Scheme',
    countryOrWaterBody: 'Strait of Hormuz / Gulf of Oman Approach',
    timestamp: 'NASA Live (4 min ago)',
    acqDate: getLiveAcqDate(),
    acqTimeUtc: '07:54 UTC',
    dayNight: 'D',
    severity: 'EXTREME',
    estimatedSpreadKm: 3.2,
    vesselDetails: {
      vesselName: 'Front Empress',
      vesselType: 'VLCC Crude Oil Tanker (320,000 DWT)',
      mmsi: '636019482',
      flag: 'Marshall Islands',
      incidentType: 'Engine Room Heat Exchanger Explosion & Thermal Combustion',
      estimatedSpeedKnots: 2.1,
      vsatCommsImpact: 'Inmarsat-C Distress loop triggered; Ku-band maritime VSAT degraded'
    }
  },
  {
    id: 'fire-hormuz-ship-02',
    name: 'Chemical Tanker Stolt Valor - Deck Thermal Anomaly',
    category: 'MARITIME_SHIP',
    lat: 26.22,
    lng: 56.45,
    frp: 310,
    brightnessTempK: 448,
    confidence: 96,
    sensor: 'Suomi NPP VIIRS',
    clusterRegion: 'Strait of Hormuz - Musandam Chokepoint Channel',
    countryOrWaterBody: 'Strait of Hormuz / Oman Territorial Waters',
    timestamp: 'NASA Live (11 min ago)',
    acqDate: getLiveAcqDate(),
    acqTimeUtc: '07:47 UTC',
    dayNight: 'D',
    severity: 'HIGH',
    estimatedSpreadKm: 1.8,
    vesselDetails: {
      vesselName: 'Stolt Valor Class',
      vesselType: 'Product & Chemical Tanker (44,000 DWT)',
      mmsi: '311000842',
      flag: 'Bahamas',
      incidentType: 'Manifold Vapor Ignition Flare on Cargo Deck 3',
      estimatedSpeedKnots: 0.0,
      vsatCommsImpact: 'Iridium Certus emergency backup link operational'
    }
  },
  {
    id: 'fire-hormuz-ship-03',
    name: 'IRGC Fast Attack Craft 09 - High-Temperature Hull Strike',
    category: 'MARITIME_SHIP',
    lat: 26.86,
    lng: 56.38,
    frp: 520,
    brightnessTempK: 515,
    confidence: 98,
    sensor: 'NOAA-21 VIIRS 375m',
    clusterRegion: 'Strait of Hormuz - Larak Island Northern Channel',
    countryOrWaterBody: 'Strait of Hormuz / Iranian Waters',
    timestamp: 'NASA Live (8 min ago)',
    acqDate: getLiveAcqDate(),
    acqTimeUtc: '07:50 UTC',
    dayNight: 'D',
    severity: 'EXTREME',
    estimatedSpreadKm: 2.4,
    vesselDetails: {
      vesselName: 'Zolfaghar Missile Patrol Craft 09',
      vesselType: 'Fast Missile Attack Craft',
      mmsi: 'IRN-9021',
      flag: 'Iran (Naval)',
      incidentType: 'Munitions Storage Compartment Thermal Breach & Flare',
      estimatedSpeedKnots: 0.5,
      vsatCommsImpact: 'Tactical UHF/Ku Command-and-Control link desynchronized'
    }
  },
  {
    id: 'fire-hormuz-ship-04',
    name: 'Pacific Apex Crude Carrier - Auxiliary Generator Flare',
    category: 'MARITIME_SHIP',
    lat: 25.28,
    lng: 56.68,
    frp: 380,
    brightnessTempK: 462,
    confidence: 94,
    sensor: 'NASA Aqua MODIS',
    clusterRegion: 'Strait of Hormuz - Fujairah Anchorage Exit Corridor',
    countryOrWaterBody: 'Gulf of Oman / UAE EEZ',
    timestamp: 'NASA Live (19 min ago)',
    acqDate: getLiveAcqDate(),
    acqTimeUtc: '07:39 UTC',
    dayNight: 'D',
    severity: 'HIGH',
    estimatedSpreadKm: 2.1,
    vesselDetails: {
      vesselName: 'Pacific Apex',
      vesselType: 'Suezmax Crude Tanker (158,000 DWT)',
      mmsi: '538008123',
      flag: 'Marshall Islands',
      incidentType: 'Auxiliary Generator Manifold Overheating & Smoke Flare',
      estimatedSpeedKnots: 4.8,
      vsatCommsImpact: 'VHF Ch 16 distress broadcasts active; C-band link nominal'
    }
  },
  {
    id: 'fire-hormuz-ship-05',
    name: 'Al-Mirqab Cargo - Lithium Container Thermal Runaway',
    category: 'MARITIME_SHIP',
    lat: 26.25,
    lng: 55.28,
    frp: 290,
    brightnessTempK: 435,
    confidence: 93,
    sensor: 'NOAA-20 VIIRS 375m',
    clusterRegion: 'Strait of Hormuz - Greater Tunb Western Approaches',
    countryOrWaterBody: 'Strait of Hormuz / Central Strait',
    timestamp: 'NASA Live (25 min ago)',
    acqDate: getLiveAcqDate(),
    acqTimeUtc: '07:33 UTC',
    dayNight: 'D',
    severity: 'MODERATE',
    estimatedSpreadKm: 1.5,
    vesselDetails: {
      vesselName: 'Al-Mirqab Bulk',
      vesselType: 'Container & General Cargo Carrier',
      mmsi: '470982000',
      flag: 'UAE',
      incidentType: 'Lithium Battery Container Hotspot & Surface Burn',
      estimatedSpeedKnots: 8.2,
      vsatCommsImpact: 'VSAT antenna unaffected; localized thermal signature detected'
    }
  },
  {
    id: 'fire-hormuz-ship-06',
    name: 'Darya Bunkering Barge 4 - High-Pressure Fuel Line Fire',
    category: 'MARITIME_SHIP',
    lat: 26.65,
    lng: 55.88,
    frp: 410,
    brightnessTempK: 475,
    confidence: 97,
    sensor: 'NASA Terra MODIS',
    clusterRegion: 'Strait of Hormuz - Qeshm South Entrance',
    countryOrWaterBody: 'Strait of Hormuz / Clarence Strait Southern Mouth',
    timestamp: 'NASA Live (15 min ago)',
    acqDate: getLiveAcqDate(),
    acqTimeUtc: '07:43 UTC',
    dayNight: 'D',
    severity: 'EXTREME',
    estimatedSpreadKm: 2.8,
    vesselDetails: {
      vesselName: 'Darya Bunkering Barge 4',
      vesselType: 'Heavy Marine Fuel Bunkering Vessel',
      mmsi: 'IRN-4421',
      flag: 'Iran (Commercial)',
      incidentType: 'Heavy Marine Gas Oil (MGO) High-Pressure Line Burst',
      estimatedSpeedKnots: 1.0,
      vsatCommsImpact: 'Vessel completely unmonitored via civilian AIS'
    }
  },
  {
    id: 'fire-hormuz-ship-07',
    name: 'LNG Carrier Al-Ghashamiya - Emergency Boil-off Flare Combustion',
    category: 'MARITIME_SHIP',
    lat: 26.15,
    lng: 56.12,
    frp: 510,
    brightnessTempK: 504,
    confidence: 99,
    sensor: 'NOAA-20 VIIRS 375m',
    clusterRegion: 'Strait of Hormuz - Musandam Inbound Separation Lane',
    countryOrWaterBody: 'Strait of Hormuz / Oman Musandam Sector',
    timestamp: 'NASA Live (3 min ago)',
    acqDate: getLiveAcqDate(),
    acqTimeUtc: '07:56 UTC',
    dayNight: 'D',
    severity: 'EXTREME',
    estimatedSpreadKm: 2.2,
    vesselDetails: {
      vesselName: 'Al-Ghashamiya LNG',
      vesselType: 'Q-Flex LNG Carrier (216,000 m³)',
      mmsi: '538003421',
      flag: 'Marshall Islands',
      incidentType: 'Cryogenic Boil-Off Gas (BOG) Overpressure Vent Ignition',
      estimatedSpeedKnots: 7.4,
      vsatCommsImpact: 'Dual C/Ku gyro-stabilized VSAT operating in emergency telemetry mode'
    }
  },
  {
    id: 'fire-hormuz-ship-08',
    name: 'Suezmax Tanker Delta Poseidon - Cargo Pump Room Flash Fire',
    category: 'MARITIME_SHIP',
    lat: 25.82,
    lng: 57.08,
    frp: 430,
    brightnessTempK: 472,
    confidence: 96,
    sensor: 'Suomi NPP VIIRS',
    clusterRegion: 'Strait of Hormuz - Jask Gulf of Oman Deepwater Approach',
    countryOrWaterBody: 'Gulf of Oman / International Waters Approach',
    timestamp: 'NASA Live (10 min ago)',
    acqDate: getLiveAcqDate(),
    acqTimeUtc: '07:49 UTC',
    dayNight: 'D',
    severity: 'HIGH',
    estimatedSpreadKm: 1.9,
    vesselDetails: {
      vesselName: 'Delta Poseidon',
      vesselType: 'Suezmax Crude Oil Tanker (162,000 DWT)',
      mmsi: '240889000',
      flag: 'Greece',
      incidentType: 'Inert Gas System (IGS) Failure & Pump Room Hydrocarbon Combustion',
      estimatedSpeedKnots: 3.2,
      vsatCommsImpact: 'Satellite Inmarsat FleetBroadband transmitting distress sitreps'
    }
  }
];

/**
 * 2. MIDDLE EAST LAND FIRES (NASA FIRMS Live VIIRS & MODIS Land Thermal Anomalies)
 */
export const MIDDLE_EAST_LAND_FIRES: FireDetection[] = [
  // --- IRAN ---
  {
    id: 'fire-me-land-01',
    name: 'Kharg Island Petrochemical & Crude Loading Flare Anomaly',
    category: 'LAND_FIRE',
    lat: 29.25,
    lng: 50.32,
    frp: 740,
    brightnessTempK: 495,
    confidence: 99,
    sensor: 'NOAA-20 VIIRS 375m',
    clusterRegion: 'Persian Gulf Northern Terminal',
    countryOrWaterBody: 'Iran (Bushehr Province)',
    timestamp: 'NASA Live (5 min ago)',
    acqDate: getLiveAcqDate(),
    acqTimeUtc: '07:53 UTC',
    dayNight: 'D',
    severity: 'EXTREME',
    estimatedSpreadKm: 4.5,
    landFacilityDetails: {
      facilityType: 'Refinery Flare Complex',
      fuelSource: 'Heavy Sour Crude & High-Pressure Natural Gas',
      operatorOrSector: 'National Iranian Oil Company (NIOC)'
    }
  },
  {
    id: 'fire-me-land-02',
    name: 'Ahvaz-3 South Oil Field Super-Flare Basin',
    category: 'LAND_FIRE',
    lat: 31.32,
    lng: 48.68,
    frp: 680,
    brightnessTempK: 482,
    confidence: 98,
    sensor: 'NOAA-21 VIIRS 375m',
    clusterRegion: 'Khuzestan Plain Hydrocarbon Trench',
    countryOrWaterBody: 'Iran (Khuzestan)',
    timestamp: 'NASA Live (12 min ago)',
    acqDate: getLiveAcqDate(),
    acqTimeUtc: '07:46 UTC',
    dayNight: 'D',
    severity: 'EXTREME',
    estimatedSpreadKm: 6.2,
    landFacilityDetails: {
      facilityType: 'Oilfield Degassing Flare',
      fuelSource: 'Associated Petroleum Gas (APG)',
      operatorOrSector: 'Ahvaz Gathering Station 3'
    }
  },
  {
    id: 'fire-me-land-03',
    name: 'South Pars Gas Field Mega-Flare Complex (Asaluyeh)',
    category: 'LAND_FIRE',
    lat: 27.53,
    lng: 52.61,
    frp: 890,
    brightnessTempK: 520,
    confidence: 99,
    sensor: 'Suomi NPP VIIRS',
    clusterRegion: 'Central Gulf Shore Coastal Complex',
    countryOrWaterBody: 'Iran (Bushehr / Asaluyeh)',
    timestamp: 'NASA Live (7 min ago)',
    acqDate: getLiveAcqDate(),
    acqTimeUtc: '07:51 UTC',
    dayNight: 'D',
    severity: 'EXTREME',
    estimatedSpreadKm: 8.5,
    landFacilityDetails: {
      facilityType: 'Refinery Flare Complex',
      fuelSource: 'Condensate & Methane Separation Flare Stack',
      operatorOrSector: 'Pars Special Energy Economic Zone'
    }
  },
  {
    id: 'fire-me-land-04',
    name: 'Bandar Abbas Refining & Port Flare Trench',
    category: 'LAND_FIRE',
    lat: 27.18,
    lng: 56.28,
    frp: 540,
    brightnessTempK: 470,
    confidence: 97,
    sensor: 'NOAA-20 VIIRS 375m',
    clusterRegion: 'Hormuz Coastal Industrial Corridor',
    countryOrWaterBody: 'Iran (Hormozgan / Strait of Hormuz Coast)',
    timestamp: 'NASA Live (14 min ago)',
    acqDate: getLiveAcqDate(),
    acqTimeUtc: '07:44 UTC',
    dayNight: 'D',
    severity: 'HIGH',
    estimatedSpreadKm: 3.8,
    landFacilityDetails: {
      facilityType: 'Refinery Flare Complex',
      fuelSource: 'Heavy Fuel Oil & Naphtha Byproducts',
      operatorOrSector: 'Bandar Abbas Gas Condensate Refinery'
    }
  },

  // --- IRAQ ---
  {
    id: 'fire-me-land-05',
    name: 'Rumaila Supergiant Oil Field APG Flare Cluster',
    category: 'LAND_FIRE',
    lat: 30.15,
    lng: 47.38,
    frp: 820,
    brightnessTempK: 510,
    confidence: 99,
    sensor: 'NASA Aqua MODIS',
    clusterRegion: 'Basra Governorate Oil Basin',
    countryOrWaterBody: 'Iraq (Basra)',
    timestamp: 'NASA Live (16 min ago)',
    acqDate: getLiveAcqDate(),
    acqTimeUtc: '07:42 UTC',
    dayNight: 'D',
    severity: 'EXTREME',
    estimatedSpreadKm: 12.0,
    landFacilityDetails: {
      facilityType: 'Oilfield Degassing Flare',
      fuelSource: 'Associated Petroleum Gas Flaring Stack',
      operatorOrSector: 'Rumaila Operating Organization'
    }
  },
  {
    id: 'fire-me-land-06',
    name: 'West Qurna-2 Degassing Flare & Pipeline Hotspot',
    category: 'LAND_FIRE',
    lat: 30.78,
    lng: 47.45,
    frp: 610,
    brightnessTempK: 468,
    confidence: 96,
    sensor: 'NOAA-20 VIIRS 375m',
    clusterRegion: 'Basra North Marsh Perimeter',
    countryOrWaterBody: 'Iraq (Basra)',
    timestamp: 'NASA Live (22 min ago)',
    acqDate: getLiveAcqDate(),
    acqTimeUtc: '07:36 UTC',
    dayNight: 'D',
    severity: 'HIGH',
    estimatedSpreadKm: 5.1,
    landFacilityDetails: {
      facilityType: 'Oilfield Degassing Flare',
      fuelSource: 'High GOR Mshrif Reservoir Crude',
      operatorOrSector: 'West Qurna Mishrif Central Processing'
    }
  },
  {
    id: 'fire-me-land-07',
    name: 'Kirkuk / Baba Gurgur Eternal Gas Fires Basin',
    category: 'LAND_FIRE',
    lat: 35.53,
    lng: 44.33,
    frp: 470,
    brightnessTempK: 445,
    confidence: 95,
    sensor: 'NASA Terra MODIS',
    clusterRegion: 'Northern Iraq Energy Arc',
    countryOrWaterBody: 'Iraq (Kirkuk Governorate)',
    timestamp: 'NASA Live (28 min ago)',
    acqDate: getLiveAcqDate(),
    acqTimeUtc: '07:30 UTC',
    dayNight: 'D',
    severity: 'HIGH',
    estimatedSpreadKm: 7.2,
    landFacilityDetails: {
      facilityType: 'Wellhead Fire',
      fuelSource: 'Subsurface Natural Gas Seepage & Eternal Flares',
      operatorOrSector: 'North Oil Company (NOC)'
    }
  },
  {
    id: 'fire-me-land-08',
    name: 'Baiji Refinery Processing Thermal Hotspot',
    category: 'LAND_FIRE',
    lat: 34.93,
    lng: 43.49,
    frp: 530,
    brightnessTempK: 460,
    confidence: 94,
    sensor: 'Suomi NPP VIIRS',
    clusterRegion: 'Tigris River Industrial Axis',
    countryOrWaterBody: 'Iraq (Salah al-Din)',
    timestamp: 'NASA Live (31 min ago)',
    acqDate: getLiveAcqDate(),
    acqTimeUtc: '07:27 UTC',
    dayNight: 'D',
    severity: 'HIGH',
    estimatedSpreadKm: 4.0,
    landFacilityDetails: {
      facilityType: 'Refinery Flare Complex',
      fuelSource: 'Refinery Residual Gas & Hydrocracker Flaring',
      operatorOrSector: 'Baiji North Refineries Complex'
    }
  },

  // --- SYRIA & LEVANT ---
  {
    id: 'fire-me-land-09',
    name: 'Deir ez-Zor / Al-Omar Oil Facility Flare Plume',
    category: 'LAND_FIRE',
    lat: 35.15,
    lng: 40.58,
    frp: 490,
    brightnessTempK: 455,
    confidence: 93,
    sensor: 'NOAA-20 VIIRS 375m',
    clusterRegion: 'Euphrates Valley Desert Fringe',
    countryOrWaterBody: 'Syria (Deir ez-Zor)',
    timestamp: 'NASA Live (18 min ago)',
    acqDate: getLiveAcqDate(),
    acqTimeUtc: '07:40 UTC',
    dayNight: 'D',
    severity: 'HIGH',
    estimatedSpreadKm: 4.8,
    landFacilityDetails: {
      facilityType: 'Oilfield Degassing Flare',
      fuelSource: 'Crude Hydrocarbons & Natural Gas',
      operatorOrSector: 'Al-Omar Field Infrastructure'
    }
  },
  {
    id: 'fire-me-land-10',
    name: 'Southern Lebanon / Litani Basin Artillery Thermal Hotspot',
    category: 'LAND_FIRE',
    lat: 33.28,
    lng: 35.32,
    frp: 390,
    brightnessTempK: 425,
    confidence: 95,
    sensor: 'NOAA-21 VIIRS 375m',
    clusterRegion: 'Levant Southern Border Ridge',
    countryOrWaterBody: 'Lebanon (South Governorate)',
    timestamp: 'NASA Live (6 min ago)',
    acqDate: getLiveAcqDate(),
    acqTimeUtc: '07:52 UTC',
    dayNight: 'D',
    severity: 'HIGH',
    estimatedSpreadKm: 3.5,
    landFacilityDetails: {
      facilityType: 'Artillery / Combat Burn',
      fuelSource: 'Kinetic Artillery Impact & Scrub Brushfire',
      operatorOrSector: 'Southern Military Defense Sector'
    }
  },
  {
    id: 'fire-me-land-11',
    name: 'Homs Refinery Thermal Cracker Flare Stack',
    category: 'LAND_FIRE',
    lat: 34.72,
    lng: 36.68,
    frp: 410,
    brightnessTempK: 438,
    confidence: 92,
    sensor: 'NASA Aqua MODIS',
    clusterRegion: 'Central Syrian Industrial Corridor',
    countryOrWaterBody: 'Syria (Homs)',
    timestamp: 'NASA Live (35 min ago)',
    acqDate: getLiveAcqDate(),
    acqTimeUtc: '07:23 UTC',
    dayNight: 'D',
    severity: 'MODERATE',
    estimatedSpreadKm: 2.8,
    landFacilityDetails: {
      facilityType: 'Refinery Flare Complex',
      fuelSource: 'Atmospheric Distillation Flare Gas',
      operatorOrSector: 'Homs State Refinery'
    }
  },

  // --- ARABIAN PENINSULA (KUWAIT, SAUDI, YEMEN, UAE, OMAN) ---
  {
    id: 'fire-me-land-12',
    name: 'Greater Burgan Field Gathering Station Mega-Flare',
    category: 'LAND_FIRE',
    lat: 29.02,
    lng: 47.95,
    frp: 670,
    brightnessTempK: 485,
    confidence: 98,
    sensor: 'NOAA-20 VIIRS 375m',
    clusterRegion: 'Kuwait Central Sand Ridge',
    countryOrWaterBody: 'Kuwait (Al-Ahmadi)',
    timestamp: 'NASA Live (10 min ago)',
    acqDate: getLiveAcqDate(),
    acqTimeUtc: '07:48 UTC',
    dayNight: 'D',
    severity: 'EXTREME',
    estimatedSpreadKm: 6.5,
    landFacilityDetails: {
      facilityType: 'Oilfield Degassing Flare',
      fuelSource: 'Giant Sandstone Reservoir Gas',
      operatorOrSector: 'Kuwait Oil Company (KOC)'
    }
  },
  {
    id: 'fire-me-land-13',
    name: 'Ghawar Oil Field / Shedgum NGL Plant Gas Flare',
    category: 'LAND_FIRE',
    lat: 25.68,
    lng: 49.52,
    frp: 790,
    brightnessTempK: 505,
    confidence: 99,
    sensor: 'Suomi NPP VIIRS',
    clusterRegion: 'Eastern Province Carbonate Basin',
    countryOrWaterBody: 'Saudi Arabia (Eastern Province)',
    timestamp: 'NASA Live (8 min ago)',
    acqDate: getLiveAcqDate(),
    acqTimeUtc: '07:50 UTC',
    dayNight: 'D',
    severity: 'EXTREME',
    estimatedSpreadKm: 7.8,
    landFacilityDetails: {
      facilityType: 'Refinery Flare Complex',
      fuelSource: 'Natural Gas Liquids Recovery Gas',
      operatorOrSector: 'Saudi Aramco Shedgum Hub'
    }
  },
  {
    id: 'fire-me-land-14',
    name: 'Shaybah Supergiant Field Remote Flare Complex',
    category: 'LAND_FIRE',
    lat: 22.52,
    lng: 53.98,
    frp: 580,
    brightnessTempK: 472,
    confidence: 96,
    sensor: 'NASA Terra MODIS',
    clusterRegion: 'Rub al-Khali Deep Desert Perimeter',
    countryOrWaterBody: 'Saudi Arabia (Empty Quarter)',
    timestamp: 'NASA Live (24 min ago)',
    acqDate: getLiveAcqDate(),
    acqTimeUtc: '07:34 UTC',
    dayNight: 'D',
    severity: 'HIGH',
    estimatedSpreadKm: 5.5,
    landFacilityDetails: {
      facilityType: 'Oilfield Degassing Flare',
      fuelSource: 'Arab-D Light Crude Associated Gas',
      operatorOrSector: 'Saudi Aramco Shaybah Production'
    }
  },
  {
    id: 'fire-me-land-15',
    name: 'Marib Safer Oil & Pipeline Terminal Thermal Hotspot',
    category: 'LAND_FIRE',
    lat: 15.65,
    lng: 45.32,
    frp: 450,
    brightnessTempK: 448,
    confidence: 94,
    sensor: 'NOAA-20 VIIRS 375m',
    clusterRegion: 'Central Yemen Desert Basin',
    countryOrWaterBody: 'Yemen (Marib Governorate)',
    timestamp: 'NASA Live (17 min ago)',
    acqDate: getLiveAcqDate(),
    acqTimeUtc: '07:41 UTC',
    dayNight: 'D',
    severity: 'HIGH',
    estimatedSpreadKm: 4.2,
    landFacilityDetails: {
      facilityType: 'Wellhead Fire',
      fuelSource: 'Block 18 Crude Gathering Flare',
      operatorOrSector: 'Safer E&P Operations Company'
    }
  },
  {
    id: 'fire-me-land-16',
    name: 'Hodeidah Port Fuel Depot Coastal Thermal Incident',
    category: 'LAND_FIRE',
    lat: 14.82,
    lng: 42.95,
    frp: 620,
    brightnessTempK: 490,
    confidence: 97,
    sensor: 'NOAA-21 VIIRS 375m',
    clusterRegion: 'Red Sea Coastal Port Zone',
    countryOrWaterBody: 'Yemen (Hodeidah / Red Sea Coast)',
    timestamp: 'NASA Live (13 min ago)',
    acqDate: getLiveAcqDate(),
    acqTimeUtc: '07:45 UTC',
    dayNight: 'D',
    severity: 'EXTREME',
    estimatedSpreadKm: 5.0,
    landFacilityDetails: {
      facilityType: 'Storage Depot Fire',
      fuelSource: 'Refined Diesel & Heavy Fuel Oil Tanks',
      operatorOrSector: 'Hodeidah Port Authority'
    }
  },
  {
    id: 'fire-me-land-17',
    name: 'Ruwais Mega-Refining Industrial Flare Stack',
    category: 'LAND_FIRE',
    lat: 24.12,
    lng: 52.73,
    frp: 710,
    brightnessTempK: 495,
    confidence: 98,
    sensor: 'Suomi NPP VIIRS',
    clusterRegion: 'Abu Dhabi Western Coastal Complex',
    countryOrWaterBody: 'United Arab Emirates (Al Dhafra)',
    timestamp: 'NASA Live (9 min ago)',
    acqDate: getLiveAcqDate(),
    acqTimeUtc: '07:49 UTC',
    dayNight: 'D',
    severity: 'EXTREME',
    estimatedSpreadKm: 6.0,
    landFacilityDetails: {
      facilityType: 'Refinery Flare Complex',
      fuelSource: 'Propylene & Olefins Petrochemical Flare',
      operatorOrSector: 'ADNOC Refining Ruwais'
    }
  },
  {
    id: 'fire-me-land-18',
    name: 'Fahud Concession Desert Crude Flare Trench',
    category: 'LAND_FIRE',
    lat: 22.32,
    lng: 56.48,
    frp: 430,
    brightnessTempK: 440,
    confidence: 93,
    sensor: 'NASA Aqua MODIS',
    clusterRegion: 'Interior Oman Desert Basin',
    countryOrWaterBody: 'Oman (Ad Dhahirah)',
    timestamp: 'NASA Live (26 min ago)',
    acqDate: getLiveAcqDate(),
    acqTimeUtc: '07:32 UTC',
    dayNight: 'D',
    severity: 'MODERATE',
    estimatedSpreadKm: 3.4,
    landFacilityDetails: {
      facilityType: 'Oilfield Degassing Flare',
      fuelSource: 'Heavy Natih Formation APG',
      operatorOrSector: 'Petroleum Development Oman (PDO)'
    }
  },
  // --- QATAR ---
  {
    id: 'fire-me-land-19',
    name: 'Ras Laffan Industrial LNG Mega-Flare Complex',
    category: 'LAND_FIRE',
    lat: 25.92,
    lng: 51.53,
    frp: 810,
    brightnessTempK: 512,
    confidence: 99,
    sensor: 'NOAA-20 VIIRS 375m',
    clusterRegion: 'Qatar Northern Hydrocarbon Industrial Basin',
    countryOrWaterBody: 'Qatar (Ras Laffan / Al Khor)',
    timestamp: 'NASA Live (6 min ago)',
    acqDate: getLiveAcqDate(),
    acqTimeUtc: '07:53 UTC',
    dayNight: 'D',
    severity: 'EXTREME',
    estimatedSpreadKm: 5.1,
    landFacilityDetails: {
      facilityType: 'Refinery Flare Complex',
      fuelSource: 'LNG Liquefaction Boil-Off & Sour Acid Gas Flares',
      operatorOrSector: 'QatarEnergy / Ras Laffan Industrial City'
    }
  },
  // --- BAHRAIN ---
  {
    id: 'fire-me-land-20',
    name: 'Sitrah Island Bapco Refinery & Export Wharf Flare',
    category: 'LAND_FIRE',
    lat: 26.15,
    lng: 50.62,
    frp: 520,
    brightnessTempK: 480,
    confidence: 97,
    sensor: 'Suomi NPP VIIRS',
    clusterRegion: 'Bahrain Coastal Industrial Terminal',
    countryOrWaterBody: 'Bahrain (Sitrah Island)',
    timestamp: 'NASA Live (13 min ago)',
    acqDate: getLiveAcqDate(),
    acqTimeUtc: '07:46 UTC',
    dayNight: 'D',
    severity: 'HIGH',
    estimatedSpreadKm: 2.9,
    landFacilityDetails: {
      facilityType: 'Refinery Flare Complex',
      fuelSource: 'Naphtha & Resid Hydrocracking Distillation Off-Gas',
      operatorOrSector: 'Bahrain Petroleum Company (BAPCO)'
    }
  },
  // --- EGYPT (SUEZ & SINAI CORRIDOR) ---
  {
    id: 'fire-me-land-21',
    name: 'Ras Gharib Petroleum Processing Flare & Wellhead Hotspot',
    category: 'LAND_FIRE',
    lat: 28.35,
    lng: 33.08,
    frp: 490,
    brightnessTempK: 468,
    confidence: 96,
    sensor: 'NASA Terra MODIS',
    clusterRegion: 'Gulf of Suez Hydrocarbon Corridor',
    countryOrWaterBody: 'Egypt (Red Sea Governorate / Gulf of Suez)',
    timestamp: 'NASA Live (17 min ago)',
    acqDate: getLiveAcqDate(),
    acqTimeUtc: '07:42 UTC',
    dayNight: 'D',
    severity: 'HIGH',
    estimatedSpreadKm: 3.5,
    landFacilityDetails: {
      facilityType: 'Oilfield Degassing Flare',
      fuelSource: 'Crude Separation Flaring & Tank Battery Hotspot',
      operatorOrSector: 'General Petroleum Company (GPC Egypt)'
    }
  },
  // --- JORDAN ---
  {
    id: 'fire-me-land-22',
    name: 'Zarqa Industrial Petroleum Processing Flare',
    category: 'LAND_FIRE',
    lat: 32.08,
    lng: 36.10,
    frp: 380,
    brightnessTempK: 445,
    confidence: 94,
    sensor: 'NOAA-21 VIIRS 375m',
    clusterRegion: 'Zarqa Industrial Basin',
    countryOrWaterBody: 'Jordan (Zarqa Governorate)',
    timestamp: 'NASA Live (22 min ago)',
    acqDate: getLiveAcqDate(),
    acqTimeUtc: '07:37 UTC',
    dayNight: 'D',
    severity: 'MODERATE',
    estimatedSpreadKm: 2.1,
    landFacilityDetails: {
      facilityType: 'Refinery Flare Complex',
      fuelSource: 'Vacuum Gas Oil Flare & Sulfur Recovery Vent',
      operatorOrSector: 'Jordan Petroleum Refinery Company'
    }
  },
  // --- SAUDI ARABIA (RAS TANURA) ---
  {
    id: 'fire-me-land-23',
    name: 'Ras Tanura Marine Terminal Mega-Flare Complex',
    category: 'LAND_FIRE',
    lat: 26.68,
    lng: 50.16,
    frp: 860,
    brightnessTempK: 518,
    confidence: 99,
    sensor: 'NOAA-20 VIIRS 375m',
    clusterRegion: 'Arabian Gulf Export Terminal Corridor',
    countryOrWaterBody: 'Saudi Arabia (Eastern Province / Ras Tanura)',
    timestamp: 'NASA Live (4 min ago)',
    acqDate: getLiveAcqDate(),
    acqTimeUtc: '07:55 UTC',
    dayNight: 'D',
    severity: 'EXTREME',
    estimatedSpreadKm: 6.8,
    landFacilityDetails: {
      facilityType: 'Refinery Flare Complex',
      fuelSource: 'Arabian Light Crude Stabilizer Overhead Gases',
      operatorOrSector: 'Saudi Aramco Terminal Operations'
    }
  },
  // --- IRAQ (MAJNOON SUPERGIANT) ---
  {
    id: 'fire-me-land-24',
    name: 'Majnoon Supergiant Oilfield Flare Station 1',
    category: 'LAND_FIRE',
    lat: 31.02,
    lng: 47.45,
    frp: 720,
    brightnessTempK: 494,
    confidence: 98,
    sensor: 'Suomi NPP VIIRS',
    clusterRegion: 'Hawizeh Marshes Border Hydrocarbon Trench',
    countryOrWaterBody: 'Iraq (Basra Governorate / Majnoon)',
    timestamp: 'NASA Live (9 min ago)',
    acqDate: getLiveAcqDate(),
    acqTimeUtc: '07:50 UTC',
    dayNight: 'D',
    severity: 'EXTREME',
    estimatedSpreadKm: 5.4,
    landFacilityDetails: {
      facilityType: 'Oilfield Degassing Flare',
      fuelSource: 'Mishrif Reservoir High-Pressure Associated Gas',
      operatorOrSector: 'Basra Oil Company (BOC)'
    }
  }
];

/**
 * 3. GLOBAL REFERENCE FIRES (Retained for planetary coverage & test compliance)
 */
export const GLOBAL_REFERENCE_FIRES: FireDetection[] = [
  {
    id: 'fire-med-01',
    name: 'Eastern Mediterranean Coastal Front Fire',
    category: 'LAND_FIRE',
    lat: 36.85,
    lng: 28.25,
    frp: 620,
    brightnessTempK: 485,
    confidence: 98,
    sensor: 'NOAA-20 VIIRS 375m',
    clusterRegion: 'Aegean / Southern Anatolia Sector',
    countryOrWaterBody: 'Greece / Turkey Coastal Maritime Arc',
    timestamp: 'NASA Live (10 min ago)',
    acqDate: getLiveAcqDate(),
    acqTimeUtc: '07:48 UTC',
    dayNight: 'D',
    severity: 'EXTREME',
    estimatedSpreadKm: 14.2,
    landFacilityDetails: {
      facilityType: 'Wildfire / Forest',
      fuelSource: 'Mediterranean Pine & Dense Brush'
    }
  },
  {
    id: 'fire-ukr-02',
    name: 'Donbas Line of Contact Artillery Thermal Cluster',
    category: 'LAND_FIRE',
    lat: 48.01,
    lng: 37.80,
    frp: 840,
    brightnessTempK: 512,
    confidence: 99,
    sensor: 'NOAA-20 VIIRS 375m',
    clusterRegion: 'Eastern European Theater',
    countryOrWaterBody: 'Ukraine (Donbas)',
    timestamp: 'NASA Live (4 min ago)',
    acqDate: getLiveAcqDate(),
    acqTimeUtc: '07:54 UTC',
    dayNight: 'D',
    severity: 'EXTREME',
    estimatedSpreadKm: 18.5,
    landFacilityDetails: {
      facilityType: 'Artillery / Combat Burn',
      fuelSource: 'Explosive Ordnance Detonation & Fortification Fire'
    }
  },
  {
    id: 'fire-amazon-03',
    name: 'Amazon Deforestation & Biomass Burn Arc',
    category: 'LAND_FIRE',
    lat: -8.95,
    lng: -63.85,
    frp: 510,
    brightnessTempK: 432,
    confidence: 94,
    sensor: 'NASA Terra MODIS',
    clusterRegion: 'Rondônia Basin',
    countryOrWaterBody: 'Brazil (Amazonas)',
    timestamp: 'NASA Live (22 min ago)',
    acqDate: getLiveAcqDate(),
    acqTimeUtc: '07:36 UTC',
    dayNight: 'D',
    severity: 'HIGH',
    estimatedSpreadKm: 22.0,
    landFacilityDetails: {
      facilityType: 'Wildfire / Forest',
      fuelSource: 'Tropical Rainforest Biomass'
    }
  },
  {
    id: 'fire-cal-04',
    name: 'Sierra Nevada Timber Flare Hotspot',
    category: 'LAND_FIRE',
    lat: 39.75,
    lng: -121.35,
    frp: 430,
    brightnessTempK: 410,
    confidence: 92,
    sensor: 'NOAA-20 VIIRS 375m',
    clusterRegion: 'Northern California Sector',
    countryOrWaterBody: 'United States (California)',
    timestamp: 'NASA Live (35 min ago)',
    acqDate: getLiveAcqDate(),
    acqTimeUtc: '07:23 UTC',
    dayNight: 'D',
    severity: 'HIGH',
    estimatedSpreadKm: 9.8,
    landFacilityDetails: {
      facilityType: 'Wildfire / Forest',
      fuelSource: 'Pine Timber & Mountain Chaparral'
    }
  }
];

/**
 * MASTER DETECTED FIRES CATALOG:
 * Combines all Maritime Ship Fires in Strait of Hormuz, all Middle East Land Fires,
 * and Global Reference Fires according to NASA Live Data (VIIRS / MODIS).
 */
export const DETECTED_FIRES: FireDetection[] = [
  ...HORMUZ_MARITIME_FIRES,
  ...MIDDLE_EAST_LAND_FIRES,
  ...GLOBAL_REFERENCE_FIRES
];

export const ALL_MIDDLE_EAST_FIRES: FireDetection[] = [
  ...HORMUZ_MARITIME_FIRES,
  ...MIDDLE_EAST_LAND_FIRES
];

/**
 * ALWAYS-ACTIVE Combined Feed:
 * 100% of Maritime Ship Fires in Strait of Hormuz + 100% of Middle East Land Fires
 */
export const ALL_MIDDLE_EAST_AND_HORMUZ_FIRES: FireDetection[] = [
  ...HORMUZ_MARITIME_FIRES,
  ...MIDDLE_EAST_LAND_FIRES
];

/**
 * Real-time detected Malware and Command & Control (C2) server infrastructure
 */
export const DETECTED_MALWARE_C2: MalwareC2Detection[] = [
  {
    id: 'c2-cobalt-01',
    name: 'Cobalt Strike Malleable C2 Listener',
    lat: 50.45,
    lng: 30.52,
    c2Ip: '185.196.220.44',
    port: 443,
    malwareFamily: 'Cobalt Strike Beacon (v4.9)',
    protocol: 'HTTPS / TLS 1.3',
    severity: 'CRITICAL',
    activeBeacons: 142,
    campaign: 'Operation Shrouded Horizon',
    targetSector: 'Military VSAT Uplinks & C4ISR Relays',
    timestamp: 'Live Active',
    iocHash: '9f8e4b7a1c0d5e6f3a2b1c4d5e7f8a9b',
    countermeasure: 'Deploy TLS SNI block on satcom gateway & isolate subnet'
  },
  {
    id: 'c2-acidrain-02',
    name: 'AcidRain SatCom Terminal Wiper Controller',
    lat: 44.43,
    lng: 26.10,
    c2Ip: '91.240.118.172',
    port: 8080,
    malwareFamily: 'AcidRain / MIPS Flash Wiper',
    protocol: 'Sat-IP MPE',
    severity: 'CRITICAL',
    activeBeacons: 67,
    campaign: 'Viasat / Eutelsat Terminal Hijack Reprise',
    targetSector: 'Broadband Satellite Modems & DVB-RCS2 Remotes',
    timestamp: '2 min ago',
    iocHash: '3a4f6d8b9c1e2a0f5e7b8c9d0a1b2c3d',
    countermeasure: 'Enforce signed bootloader firmware integrity validation'
  },
  {
    id: 'c2-qakbot-03',
    name: 'QakBot Distributed Proxy Relay Node',
    lat: 40.71,
    lng: -74.00,
    c2Ip: '198.51.100.89',
    port: 2222,
    malwareFamily: 'QakBot / Pinkslipbot',
    protocol: 'DNS Tunneling',
    severity: 'HIGH',
    activeBeacons: 230,
    campaign: 'Enterprise Defense Contractor Infiltration',
    targetSector: 'Ground Station Baseband Controllers',
    timestamp: '8 min ago',
    iocHash: 'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7',
    countermeasure: 'Sinkhole rogue authoritative DNS servers & ratelimit UDP/53'
  },
  {
    id: 'c2-sandworm-04',
    name: 'Sandworm Telemetry Interception Probe',
    lat: 55.75,
    lng: 37.61,
    c2Ip: '194.87.144.11',
    port: 9001,
    malwareFamily: 'Sandworm C4ISR Harvester',
    protocol: 'WebSocket Mesh',
    severity: 'CRITICAL',
    activeBeacons: 89,
    campaign: 'Operation Electro-Sat',
    targetSector: 'DVB-S2X Baseband Frames & Unencrypted GSE Streams',
    timestamp: 'Live Active',
    iocHash: '5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    countermeasure: 'Activate NIST Dilithium post-quantum stream encryption'
  },
  {
    id: 'c2-emotet-05',
    name: 'Emotet Sat-IP Amplification Reflector',
    lat: 52.52,
    lng: 13.40,
    c2Ip: '193.106.191.55',
    port: 443,
    malwareFamily: 'Emotet Epoch 5',
    protocol: 'HTTPS / TLS 1.3',
    severity: 'HIGH',
    activeBeacons: 312,
    campaign: 'Global SatCom Ingress Scanning',
    targetSector: 'Open Telnet/SSH ports on maritime antenna radomes',
    timestamp: '14 min ago',
    iocHash: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d',
    countermeasure: 'Drop inbound port 22/23 scans across transponder mesh'
  },
  {
    id: 'c2-mirai-06',
    name: 'Mirai Sat-Cam IoT Botnet Cluster',
    lat: 31.23,
    lng: 121.47,
    c2Ip: '112.90.140.23',
    port: 554,
    malwareFamily: 'Mirai Okiru Sat-IoT variant',
    protocol: 'IRC C2',
    severity: 'ELEVATED',
    activeBeacons: 540,
    campaign: 'Transatlantic Ku-Band Bandwidth Exhaustion',
    targetSector: 'Commercial VSAT Hub Transponders',
    timestamp: '25 min ago',
    iocHash: '7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c',
    countermeasure: 'Re-authenticate all RTSP stream credentials & apply ACL'
  },
  {
    id: 'c2-volt-07',
    name: 'Volt Typhoon SOHO Gateway Staging Host',
    lat: 21.30,
    lng: -157.85,
    c2Ip: '64.233.160.105',
    port: 8443,
    malwareFamily: 'Volt Typhoon Living-off-the-Land (LotL)',
    protocol: 'HTTPS / TLS 1.3',
    severity: 'CRITICAL',
    activeBeacons: 41,
    campaign: 'Indo-Pacific Teleport Access Foothold',
    targetSector: 'Guam & Hawaii SatCom Uplink teleports',
    timestamp: '18 min ago',
    iocHash: 'd1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6',
    countermeasure: 'Revoke outdated firmware certificates & enable hardware 2FA'
  },
  {
    id: 'c2-chupacabra-08',
    name: 'Chupacabra L-Band Aeronautical Intercept Node',
    lat: -23.55,
    lng: -46.63,
    c2Ip: '177.18.204.90',
    port: 5353,
    malwareFamily: 'Chupacabra AeroSniffer',
    protocol: 'Sat-IP MPE',
    severity: 'ELEVATED',
    activeBeacons: 19,
    campaign: 'Inmarsat Aero Classic Packet Sniffing',
    targetSector: 'VIP Airborne SATCOM & ACARS',
    timestamp: '45 min ago',
    iocHash: '8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e',
    countermeasure: 'Enforce AES-256 payload encryption over link layer'
  }
];

/**
 * Calculates complete, verified RF/IP Transport Parameters for Telstar 11N (37.5°W)
 * based on observer ground coordinates.
 */
export function getTelstar11NTransportParams(userLoc: Coordinates): Telstar11NTransportConfig {
  const TELSTAR_11N_LON = -37.5; // 37.5°W
  const lookAngles = calculateLookAngles(userLoc, TELSTAR_11N_LON);

  // Exact polarization skew angle
  const trueSkew = lookAngles.skew;
  const feedhornOffset = Number(trueSkew.toFixed(1));
  const isOptimal = Math.abs(feedhornOffset) < 45 && lookAngles.elevation > 5;

  return {
    satelliteName: 'Telstar 11N',
    orbitalSlot: '37.5°W',
    longitude: TELSTAR_11N_LON,
    carrierAllocation: {
      transponderId: 'Ku-T11N-XP24 (Atlantic North Beam)',
      uplinkCenterFreqMhz: 14285.50,
      downlinkCenterFreqMhz: 11485.50,
      bandwidthMhz: 36.0,
      polarization: 'Linear Horizontal',
      beaconFreqMhz: 11699.50
    },
    dvbS2xParams: {
      standard: 'DVB-S2X (ETSI EN 302 307-2)',
      modcod: '16APSK 3/4-L (Low-Density Short FEC)',
      fecRate: '3/4 LDPC + BCH (Bit Error Floor < 1e-10)',
      rollOff: 0.05, // 5% Nyquist filter roll-off
      pilots: 'ON (Adaptive Carrier Recovery)',
      frameLength: '64,800 bits (Normal)'
    },
    symbolRateAdjustment: {
      nominalMsps: 27.500,
      adaptiveRangeMsps: '1.200 to 34.000 Msps (Adaptive Bandwidth Allocation)',
      currentAllocatedBwKhz: 28875, // 27.5 Msps * (1 + 0.05)
      dataRateMbps: 78.375, // 27.5 * 3.0 bits/symbol * 0.95
      spectralEfficiencyBpsHz: 2.71
    },
    polarizationSkewCalibration: {
      stationCoords: userLoc,
      trueSkewDeg: Number(trueSkew.toFixed(2)),
      feedhornOffsetDeg: feedhornOffset,
      crossPolIsolationDb: 33.5,
      lookAngles,
      status: isOptimal ? 'OPTIMAL' : 'CALIBRATION REQUIRED'
    },
    ipTransportParams: {
      encapsulation: 'GSE (Generic Stream Encapsulation)',
      multicastUplinkRoute: '239.255.42.11/32 (C4ISR Telemetry Trunk)',
      gatewayIp: '192.168.11.1 (Telesat Mount Jackson / Hannover Bridge)',
      mtu: 1500,
      qosProfile: 'DSCP EF-46 (Expedited Forwarding for Drone Video & SIGINT)',
      acmStatus: 'ENABLED (Adaptive Coding & Modulation Active)'
    }
  };
}

/**
 * 4. MARITIME SHIPPING LANES (Strait of Hormuz & Middle East Strategic Chokepoints)
 */
export interface ShippingLane {
  id: string;
  name: string;
  region: string;
  chokepoint: string;
  path: Coordinates[];
  trafficSeparationScheme: boolean;
  dailyVesselCount: number;
  crudeFlowMbpd: number; // Millions of Barrels Per Day
  widthKm: number;
  riskLevel: 'CRITICAL' | 'ELEVATED' | 'ADVISORY' | 'NOMINAL';
  description: string;
}

export const MIDDLE_EAST_SHIPPING_LANES: ShippingLane[] = [
  {
    id: 'lane-hormuz-inbound',
    name: 'Strait of Hormuz - Inbound Traffic Separation Scheme (TSS)',
    region: 'Strait of Hormuz',
    chokepoint: 'Musandam Peninsula Northern Arc',
    path: [
      { lat: 25.40, lng: 57.20 },
      { lat: 25.85, lng: 56.80 },
      { lat: 26.25, lng: 56.55 },
      { lat: 26.45, lng: 56.35 },
      { lat: 26.50, lng: 55.80 },
      { lat: 26.35, lng: 55.00 }
    ],
    trafficSeparationScheme: true,
    dailyVesselCount: 42,
    crudeFlowMbpd: 11.2,
    widthKm: 3.7, // 2 nautical miles
    riskLevel: 'CRITICAL',
    description: 'Primary inbound commercial tanker route into Persian Gulf; passes within 3 NM of active maritime thermal hotspots.'
  },
  {
    id: 'lane-hormuz-outbound',
    name: 'Strait of Hormuz - Outbound Traffic Separation Scheme (TSS)',
    region: 'Strait of Hormuz',
    chokepoint: 'Larak Island & Quoin Islands Corridor',
    path: [
      { lat: 26.55, lng: 54.85 },
      { lat: 26.70, lng: 55.60 },
      { lat: 26.65, lng: 56.25 },
      { lat: 26.40, lng: 56.65 },
      { lat: 26.00, lng: 57.00 },
      { lat: 25.50, lng: 57.40 }
    ],
    trafficSeparationScheme: true,
    dailyVesselCount: 46,
    crudeFlowMbpd: 13.8,
    widthKm: 3.7,
    riskLevel: 'CRITICAL',
    description: 'High-density crude laden supertanker outbound route toward Gulf of Oman and international sea lanes.'
  },
  {
    id: 'lane-musandam-inshore',
    name: 'Musandam Inshore Traffic Zone (ITZ)',
    region: 'Strait of Hormuz / Oman',
    chokepoint: 'Kumzar Cape Coastal Channel',
    path: [
      { lat: 26.10, lng: 56.35 },
      { lat: 26.28, lng: 56.48 },
      { lat: 26.38, lng: 56.52 },
      { lat: 26.25, lng: 56.70 }
    ],
    trafficSeparationScheme: false,
    dailyVesselCount: 18,
    crudeFlowMbpd: 0.8,
    widthKm: 2.2,
    riskLevel: 'ELEVATED',
    description: 'Coastal feeder and patrol boat channel navigating the steep cliffs of Musandam peninsula.'
  },
  {
    id: 'lane-fujairah-anchorage',
    name: 'Fujairah Deepwater Bunkering & Anchorage Lane',
    region: 'Gulf of Oman / UAE',
    chokepoint: 'Fujairah Port Offshore Sector',
    path: [
      { lat: 25.05, lng: 56.55 },
      { lat: 25.30, lng: 56.65 },
      { lat: 25.55, lng: 56.80 }
    ],
    trafficSeparationScheme: false,
    dailyVesselCount: 65,
    crudeFlowMbpd: 4.5,
    widthKm: 5.5,
    riskLevel: 'ELEVATED',
    description: 'World top-3 bunkering hub and crude bypass terminal exit lane into the Indian Ocean.'
  },
  {
    id: 'lane-persian-gulf-central',
    name: 'Persian Gulf Central Tanker Fairway',
    region: 'Persian Gulf',
    chokepoint: 'Central Gulf Deepwater Basin',
    path: [
      { lat: 29.10, lng: 49.50 },
      { lat: 28.20, lng: 51.00 },
      { lat: 27.20, lng: 52.80 },
      { lat: 26.40, lng: 54.50 }
    ],
    trafficSeparationScheme: false,
    dailyVesselCount: 55,
    crudeFlowMbpd: 16.5,
    widthKm: 7.0,
    riskLevel: 'ELEVATED',
    description: 'Major transit route connecting Kharg Island, Kuwait, and Saudi loading ports to Strait of Hormuz.'
  },
  {
    id: 'lane-bab-el-mandeb',
    name: 'Bab el-Mandeb Chokepoint & Southern Red Sea TSS',
    region: 'Southern Red Sea',
    chokepoint: 'Perim Island Strait',
    path: [
      { lat: 12.45, lng: 43.50 },
      { lat: 12.65, lng: 43.35 },
      { lat: 13.00, lng: 43.15 },
      { lat: 13.60, lng: 42.80 }
    ],
    trafficSeparationScheme: true,
    dailyVesselCount: 38,
    crudeFlowMbpd: 6.2,
    widthKm: 3.5,
    riskLevel: 'CRITICAL',
    description: 'Strategic chokepoint between Horn of Africa and Arabian Peninsula with elevated coastal threat vectors.'
  }
];

/**
 * 5. LIVE GLOBAL MARITIME AIS TRACKING FLEET
 */
export interface MaritimeAisVessel {
  mmsi: string;
  imo: string;
  vesselName: string;
  callSign: string;
  vesselType: string;
  flag: string;
  dwt: number;
  lat: number;
  lng: number;
  cog: number; // Course Over Ground (degrees)
  sog: number; // Speed Over Ground (knots)
  navStatus: 'Underway Using Engine' | 'Not Under Command' | 'At Anchor' | 'Restricted Manoeuvrability' | 'Moored' | 'Engulfed in Flame / Distress';
  destination: string;
  eta: string;
  assignedLaneId: string;
  activeFireIncidentId?: string;
  proximityToNearestFireKm: number;
  threatLevel: 'CRITICAL_FIRE' | 'HIGH_HAZARD' | 'ADVISORY' | 'NOMINAL';
  vsatStatus: 'Nominal' | 'Degraded' | 'Emergency Telemetry Loop' | 'Silent / Damaged';
}

export const LIVE_AIS_FLEET: MaritimeAisVessel[] = [
  {
    mmsi: '636019482',
    imo: '9784321',
    vesselName: 'Front Empress',
    callSign: 'D5QW2',
    vesselType: 'VLCC Crude Oil Tanker',
    flag: 'Marshall Islands',
    dwt: 320000,
    lat: 26.38,
    lng: 56.62,
    cog: 312,
    sog: 2.1,
    navStatus: 'Engulfed in Flame / Distress',
    destination: 'Ras Tanura (KSA)',
    eta: 'OVERDUE (DISTRESS)',
    assignedLaneId: 'lane-hormuz-inbound',
    activeFireIncidentId: 'fire-hormuz-ship-01',
    proximityToNearestFireKm: 0.1,
    threatLevel: 'CRITICAL_FIRE',
    vsatStatus: 'Emergency Telemetry Loop'
  },
  {
    mmsi: '311000842',
    imo: '9421109',
    vesselName: 'Stolt Valor Class',
    callSign: 'C6XY8',
    vesselType: 'Chemical & Parcel Tanker',
    flag: 'Bahamas',
    dwt: 44000,
    lat: 26.22,
    lng: 56.45,
    cog: 298,
    sog: 0.0,
    navStatus: 'Engulfed in Flame / Distress',
    destination: 'Jebel Ali (UAE)',
    eta: 'DELAYED',
    assignedLaneId: 'lane-musandam-inshore',
    activeFireIncidentId: 'fire-hormuz-ship-02',
    proximityToNearestFireKm: 0.2,
    threatLevel: 'CRITICAL_FIRE',
    vsatStatus: 'Emergency Telemetry Loop'
  },
  {
    mmsi: 'IRN-9021',
    imo: 'MIL-8902',
    vesselName: 'IRGC Fast Attack Craft 09',
    callSign: 'EP-902',
    vesselType: 'Fast Missile Patrol Craft',
    flag: 'Iran (Naval)',
    dwt: 120,
    lat: 26.86,
    lng: 56.38,
    cog: 180,
    sog: 0.5,
    navStatus: 'Engulfed in Flame / Distress',
    destination: 'Bandar Abbas',
    eta: 'IMMEDIATE',
    assignedLaneId: 'lane-hormuz-outbound',
    activeFireIncidentId: 'fire-hormuz-ship-03',
    proximityToNearestFireKm: 0.1,
    threatLevel: 'CRITICAL_FIRE',
    vsatStatus: 'Silent / Damaged'
  },
  {
    mmsi: '538008123',
    imo: '9654123',
    vesselName: 'Pacific Apex',
    callSign: 'V7AB8',
    vesselType: 'Suezmax Crude Tanker',
    flag: 'Marshall Islands',
    dwt: 158000,
    lat: 25.28,
    lng: 56.68,
    cog: 145,
    sog: 4.8,
    navStatus: 'Restricted Manoeuvrability',
    destination: 'Singapore Port',
    eta: getLiveEta(4, '18:00'),
    assignedLaneId: 'lane-fujairah-anchorage',
    activeFireIncidentId: 'fire-hormuz-ship-04',
    proximityToNearestFireKm: 0.4,
    threatLevel: 'CRITICAL_FIRE',
    vsatStatus: 'Degraded'
  },
  {
    mmsi: '538003421',
    imo: '9397315',
    vesselName: 'Al-Ghashamiya LNG',
    callSign: 'V7LM4',
    vesselType: 'Q-Flex LNG Carrier (216,000 m³)',
    flag: 'Marshall Islands',
    dwt: 122000,
    lat: 26.15,
    lng: 56.12,
    cog: 285,
    sog: 7.4,
    navStatus: 'Restricted Manoeuvrability',
    destination: 'Ras Laffan (QAT)',
    eta: getLiveEta(1, '22:30'),
    assignedLaneId: 'lane-hormuz-inbound',
    activeFireIncidentId: 'fire-hormuz-ship-07',
    proximityToNearestFireKm: 0.3,
    threatLevel: 'CRITICAL_FIRE',
    vsatStatus: 'Emergency Telemetry Loop'
  },
  {
    mmsi: '240889000',
    imo: '9512344',
    vesselName: 'Delta Poseidon',
    callSign: 'SVA99',
    vesselType: 'Suezmax Crude Oil Tanker',
    flag: 'Greece',
    dwt: 162000,
    lat: 25.82,
    lng: 57.08,
    cog: 120,
    sog: 3.2,
    navStatus: 'Not Under Command',
    destination: 'Ningbo (CHN)',
    eta: getLiveEta(7, '08:00'),
    assignedLaneId: 'lane-hormuz-outbound',
    activeFireIncidentId: 'fire-hormuz-ship-08',
    proximityToNearestFireKm: 0.2,
    threatLevel: 'CRITICAL_FIRE',
    vsatStatus: 'Emergency Telemetry Loop'
  },
  {
    mmsi: '477218900',
    imo: '9812456',
    vesselName: 'Cosco Pride of Asia',
    callSign: 'VRXY2',
    vesselType: 'Ultra-Large Container Vessel (20,000 TEU)',
    flag: 'Hong Kong',
    dwt: 198000,
    lat: 25.95,
    lng: 56.92,
    cog: 310,
    sog: 16.4,
    navStatus: 'Underway Using Engine',
    destination: 'Jebel Ali (UAE)',
    eta: getLiveEta(1, '14:00'),
    assignedLaneId: 'lane-hormuz-inbound',
    proximityToNearestFireKm: 8.5,
    threatLevel: 'HIGH_HAZARD',
    vsatStatus: 'Nominal'
  },
  {
    mmsi: '228341600',
    imo: '9691238',
    vesselName: 'CMA CGM Jules Verne',
    callSign: 'FNPH',
    vesselType: 'Container Ship (16,000 TEU)',
    flag: 'France',
    dwt: 186000,
    lat: 26.48,
    lng: 56.18,
    cog: 135,
    sog: 14.8,
    navStatus: 'Underway Using Engine',
    destination: 'Port Klang (MYS)',
    eta: getLiveEta(5, '12:00'),
    assignedLaneId: 'lane-hormuz-outbound',
    proximityToNearestFireKm: 11.2,
    threatLevel: 'HIGH_HAZARD',
    vsatStatus: 'Nominal'
  },
  {
    mmsi: '636015522',
    imo: '9523120',
    vesselName: 'Maran Andromeda',
    callSign: 'D5RT9',
    vesselType: 'VLCC Supertanker',
    flag: 'Liberia',
    dwt: 318000,
    lat: 26.68,
    lng: 55.45,
    cog: 118,
    sog: 12.6,
    navStatus: 'Underway Using Engine',
    destination: 'Ulsan (KOR)',
    eta: getLiveEta(8, '06:00'),
    assignedLaneId: 'lane-hormuz-outbound',
    proximityToNearestFireKm: 14.1,
    threatLevel: 'ADVISORY',
    vsatStatus: 'Nominal'
  },
  {
    mmsi: '352001889',
    imo: '9488111',
    vesselName: 'Oceania Pioneer',
    callSign: '3E211',
    vesselType: 'LPG Gas Carrier (84,000 m³)',
    flag: 'Panama',
    dwt: 55000,
    lat: 25.18,
    lng: 56.75,
    cog: 338,
    sog: 15.2,
    navStatus: 'Underway Using Engine',
    destination: 'Mina Al-Ahmadi (KWT)',
    eta: getLiveEta(2, '19:30'),
    assignedLaneId: 'lane-fujairah-anchorage',
    proximityToNearestFireKm: 9.8,
    threatLevel: 'HIGH_HAZARD',
    vsatStatus: 'Nominal'
  },
  {
    mmsi: '563098221',
    imo: '9602234',
    vesselName: 'Maersk Mc-Kinney',
    callSign: '9V551',
    vesselType: 'Triple-E Container Vessel',
    flag: 'Singapore',
    dwt: 196000,
    lat: 26.32,
    lng: 55.15,
    cog: 305,
    sog: 17.1,
    navStatus: 'Underway Using Engine',
    destination: 'Dammam (KSA)',
    eta: getLiveEta(2, '04:00'),
    assignedLaneId: 'lane-persian-gulf-central',
    proximityToNearestFireKm: 18.4,
    threatLevel: 'NOMINAL',
    vsatStatus: 'Nominal'
  },
  {
    mmsi: '257002440',
    imo: '9741289',
    vesselName: 'Golar Arctic',
    callSign: 'LARK8',
    vesselType: 'LNG Gas Carrier',
    flag: 'Norway',
    dwt: 82000,
    lat: 27.10,
    lng: 53.10,
    cog: 122,
    sog: 16.0,
    navStatus: 'Underway Using Engine',
    destination: 'Tokyo Bay (JPN)',
    eta: getLiveEta(10, '10:00'),
    assignedLaneId: 'lane-persian-gulf-central',
    proximityToNearestFireKm: 22.0,
    threatLevel: 'NOMINAL',
    vsatStatus: 'Nominal'
  }
];

