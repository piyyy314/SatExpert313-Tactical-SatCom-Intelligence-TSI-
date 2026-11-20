import { describe, it, expect } from 'vitest';
import {
  calculateFspl,
  calculateReceivedPower,
  calculateLinkMargin
} from '../utils/linkBudgetUtils.ts';

describe('Link Budget Utilities', () => {
  it('calculates Free Space Path Loss accurately for GEO Ku-band link', () => {
    const fspl = calculateFspl(36000, 12);
    // 20*log10(36000) + 20*log10(12) + 92.45 ≈ 205.16 dB
    expect(fspl).toBeGreaterThan(204);
    expect(fspl).toBeLessThan(207);
  });

  it('returns 0 FSPL when distance or frequency is zero or negative', () => {
    expect(calculateFspl(0, 12)).toBe(0);
    expect(calculateFspl(36000, 0)).toBe(0);
    expect(calculateFspl(-100, 14)).toBe(0);
  });

  it('calculates received carrier power with and without rain attenuation', () => {
    const fsplDb = calculateFspl(37500, 14.25);
    const clearPower = calculateReceivedPower({
      bucPowerWatts: 16,
      txGainDbi: 44,
      rxGainDbi: 41,
      fsplDb,
      attenuationDb: 0.4
    });

    const stormPower = calculateReceivedPower({
      bucPowerWatts: 16,
      txGainDbi: 44,
      rxGainDbi: 41,
      fsplDb,
      attenuationDb: 12.0
    });

    expect(clearPower).toBeGreaterThan(stormPower);
    expect(Number((clearPower - stormPower).toFixed(2))).toBe(11.6);
  });

  it('handles non-positive BUC power safely via 1W fallback', () => {
    const rx = calculateReceivedPower({
      bucPowerWatts: 0,
      txGainDbi: 40,
      rxGainDbi: 40,
      fsplDb: 200
    });
    expect(rx).toBe(-120);
  });

  it('computes link margin relative to thermal noise floor', () => {
    expect(calculateLinkMargin(-108.5)).toBe(11.5);
    expect(calculateLinkMargin(-115.0, -125.0)).toBe(10.0);
  });
});
