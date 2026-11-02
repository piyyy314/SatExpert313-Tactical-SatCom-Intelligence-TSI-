import { describe, it, expect, beforeEach } from 'vitest';
import { 
  threatIntelCache, 
  DEFAULT_GPS_SPOOFING_AREAS, 
  DEFAULT_EW_PULSE_EMISSIONS, 
  DEFAULT_MALWARE_C2_HQS, 
  DEFAULT_INTERFERENCE_HOTSPOTS 
} from '../services/threatIntelCache.ts';

describe('Threat Intelligence & Client-Side Cache Service', () => {
  beforeEach(() => {
    // Reset cache prior to tests
    threatIntelCache.purgeAndRefresh();
  });

  it('retrieves valid threat intelligence snapshot with all strategic categories', () => {
    const intel = threatIntelCache.getThreatIntel();
    expect(intel).toBeDefined();
    expect(intel.version).toContain('TSI-PQC-HEATMAP');
    expect(intel.timestamp).toBeGreaterThan(0);

    // 1. GPS Spoofing Areas
    expect(intel.gpsSpoofingAreas.length).toBeGreaterThanOrEqual(8);
    const hormuzSpoof = intel.gpsSpoofingAreas.find(s => s.designator === 'HORMUZ-SPOOF-04');
    expect(hormuzSpoof).toBeDefined();
    expect(hormuzSpoof?.center.lat).toBeCloseTo(26.65, 1);
    expect(hormuzSpoof?.center.lng).toBeCloseTo(56.10, 1);
    expect(hormuzSpoof?.severity).toBe('CRITICAL');
    expect(hormuzSpoof?.driftRateMetersSec).toBeGreaterThan(0);

    // 2. High-Energy EW Pulse Emissions
    expect(intel.ewPulseEmissions.length).toBeGreaterThanOrEqual(8);
    const krasukha = intel.ewPulseEmissions.find(e => e.emitterName.includes('Krasukha-4'));
    expect(krasukha).toBeDefined();
    expect(krasukha?.peakPowerKw).toBe(480);
    expect(krasukha?.carrierFreqGhz).toBe(8.5);
    expect(krasukha?.targetBand).toBe('KU_BAND_VSAT');

    const murmansk = intel.ewPulseEmissions.find(e => e.emitterName.includes('Murmansk-BN'));
    expect(murmansk).toBeDefined();
    expect(murmansk?.peakPowerKw).toBe(1250);
    expect(murmansk?.threatLevel).toBe('CRITICAL');

    // 3. Cyber Command & Control (C2) Malware HQ Nodes
    expect(intel.malwareC2Hqs.length).toBeGreaterThanOrEqual(6);
    const sandworm = intel.malwareC2Hqs.find(c => c.hqName.includes('Sandworm'));
    expect(sandworm).toBeDefined();
    expect(sandworm?.malwareFamily).toContain('AcidRain');
    expect(sandworm?.activeBeacons).toBeGreaterThan(100);
    expect(sandworm?.c2Ip).toBe('185.220.101.5');

    const voltTyphoon = intel.malwareC2Hqs.find(c => c.actorGroup.includes('Volt Typhoon'));
    expect(voltTyphoon).toBeDefined();
    expect(voltTyphoon?.port).toBe(8080);

    // 4. Global Signal Interference Hotspots
    expect(intel.interferenceHotspots.length).toBeGreaterThanOrEqual(12);
    const hormuzRf = intel.interferenceHotspots.find(h => h.id === 'rf-hotspot-01');
    expect(hormuzRf).toBeDefined();
    expect(hormuzRf?.snrDegradationDb).toBeGreaterThan(10);
    expect(hormuzRf?.interferenceType).toBe('CARRIER_JAMMING');
  });

  it('verifies client-side caching hit and memory retention mechanics', () => {
    // Initial fetch (cache miss / init)
    const initial = threatIntelCache.getThreatIntel();
    expect(initial).toBeDefined();

    // Secondary fetch should register cache hit
    const second = threatIntelCache.getThreatIntel();
    expect(second.cacheStats.hits).toBeGreaterThan(0);
    expect(second.timestamp).toBe(initial.timestamp);

    // Estimated cache size is non-zero
    const sizeKb = threatIntelCache.getCacheSizeKb();
    expect(sizeKb).toBeGreaterThan(0);
  });

  it('executes manual cache purge and re-sync from simulated satellite telemetry', () => {
    const original = threatIntelCache.getThreatIntel();
    expect(original).toBeDefined();

    const refreshed = threatIntelCache.purgeAndRefresh();
    expect(refreshed).toBeDefined();
    expect(refreshed.cacheStats.lastPurge).toBeDefined();
    expect(refreshed.cacheStats.source).toBe('LIVE_SATELLITE_DOWNLINK');
  });

  it('validates geographic boundary coordinates across all threat vectors', () => {
    const intel = threatIntelCache.getThreatIntel();

    // Check GPS spoofing coordinates
    intel.gpsSpoofingAreas.forEach(area => {
      expect(area.center.lat).toBeGreaterThanOrEqual(-90);
      expect(area.center.lat).toBeLessThanOrEqual(90);
      expect(area.center.lng).toBeGreaterThanOrEqual(-180);
      expect(area.center.lng).toBeLessThanOrEqual(180);
      expect(area.radiusKm).toBeGreaterThan(0);
      expect(area.reportedVictims).toBeGreaterThanOrEqual(0);
    });

    // Check EW emissions
    intel.ewPulseEmissions.forEach(ew => {
      expect(ew.lat).toBeGreaterThanOrEqual(-90);
      expect(ew.lat).toBeLessThanOrEqual(90);
      expect(ew.lng).toBeGreaterThanOrEqual(-180);
      expect(ew.lng).toBeLessThanOrEqual(180);
      expect(ew.peakPowerKw).toBeGreaterThan(0);
      expect(ew.erpDbm).toBeGreaterThan(0);
    });

    // Check C2 Malware HQs
    intel.malwareC2Hqs.forEach(c2 => {
      expect(c2.lat).toBeGreaterThanOrEqual(-90);
      expect(c2.lat).toBeLessThanOrEqual(90);
      expect(c2.lng).toBeGreaterThanOrEqual(-180);
      expect(c2.lng).toBeLessThanOrEqual(180);
      expect(c2.port).toBeGreaterThan(0);
      expect(c2.port).toBeLessThanOrEqual(65535);
      expect(c2.activeBeacons).toBeGreaterThan(0);
    });
  });
});
