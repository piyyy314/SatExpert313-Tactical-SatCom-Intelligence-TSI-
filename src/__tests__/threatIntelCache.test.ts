import { describe, it, expect, beforeEach } from 'vitest';
import {
  threatIntelCache,
  DEFAULT_GPS_SPOOFING_AREAS,
  DEFAULT_EW_PULSE_EMISSIONS,
  DEFAULT_MALWARE_C2_HQS,
  DEFAULT_INTERFERENCE_HOTSPOTS
} from '../services/threatIntelCache.ts';

describe('Threat Intelligence Cache Service', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    threatIntelCache.purgeAndRefresh();
  });

  it('populates complete baseline geospatial datasets across all four threat categories', () => {
    expect(DEFAULT_GPS_SPOOFING_AREAS.length).toBeGreaterThanOrEqual(6);
    expect(DEFAULT_EW_PULSE_EMISSIONS.length).toBeGreaterThanOrEqual(6);
    expect(DEFAULT_MALWARE_C2_HQS.length).toBeGreaterThanOrEqual(5);
    expect(DEFAULT_INTERFERENCE_HOTSPOTS.length).toBeGreaterThanOrEqual(10);

    DEFAULT_GPS_SPOOFING_AREAS.forEach(area => {
      expect(area.center.lat).toBeGreaterThanOrEqual(-90);
      expect(area.center.lat).toBeLessThanOrEqual(90);
      expect(area.radiusKm).toBeGreaterThan(0);
    });
  });

  it('tracks cache hits on subsequent getThreatIntel calls', () => {
    const first = threatIntelCache.getThreatIntel();
    const second = threatIntelCache.getThreatIntel();

    expect(first.version).toBe('TSI-PQC-HEATMAP-v5.4');
    expect(second.cacheStats.source).toBe('LOCAL_STORAGE_CACHE');
    expect(second.cacheStats.hits).toBeGreaterThanOrEqual(first.cacheStats.hits);
  });

  it('rebuilds snapshot cleanly when purgeAndRefresh is triggered', () => {
    const refreshed = threatIntelCache.purgeAndRefresh();
    expect(refreshed.cacheStats.source).toBe('LIVE_SATELLITE_DOWNLINK');
    expect(refreshed.gpsSpoofingAreas.length).toBe(DEFAULT_GPS_SPOOFING_AREAS.length);
    expect(threatIntelCache.getCacheSizeKb()).toBeGreaterThan(0);
  });
});
