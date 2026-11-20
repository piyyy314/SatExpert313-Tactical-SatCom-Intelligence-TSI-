import { describe, it, expect, vi } from 'vitest';
import { nasaFirmsService } from '../services/nasaFirmsService.ts';
import { DETECTED_FIRES, HORMUZ_MARITIME_FIRES, MIDDLE_EAST_LAND_FIRES } from '../utils/heatmapData.ts';

describe('NASA FIRMS Live Telemetry Service', () => {
  it('returns active LEO thermal imaging satellite passes with valid UTC timestamps', () => {
    const passes = nasaFirmsService.getSatellitePasses();
    expect(passes.length).toBeGreaterThanOrEqual(5);
    passes.forEach(p => {
      expect(p.orbitType).toBe('Sun-synchronous LEO (Polar)');
      expect(p.passTimeUtc).toMatch(/^\d{2}:\d{2}:\d{2} UTC$/);
      expect(p.status).toBe('ACTIVE_DOWNLINK');
    });
  });

  it('computes accurate counts and max FRP metadata from fire detections', () => {
    const meta = nasaFirmsService.getLiveMetadata(DETECTED_FIRES);
    expect(meta.feedStatus).toBe('CONNECTED');
    expect(meta.totalActiveDetections).toBe(DETECTED_FIRES.length);
    expect(meta.hormuzMaritimeCount).toBe(HORMUZ_MARITIME_FIRES.length);
    expect(meta.middleEastLandCount).toBe(MIDDLE_EAST_LAND_FIRES.length);
    expect(meta.maxFrpDetectedMw).toBeGreaterThan(0);
    expect(meta.hottestTempK).toBeGreaterThan(300);
  });

  it('notifies subscribers on triggerLiveSync and cleans up on unsubscribe', () => {
    const listener = vi.fn();
    const unsubscribe = nasaFirmsService.subscribe(listener);

    nasaFirmsService.triggerLiveSync();
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    nasaFirmsService.triggerLiveSync();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
