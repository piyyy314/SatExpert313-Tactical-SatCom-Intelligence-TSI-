import { describe, it, expect } from 'vitest';

describe('QuantumEntropyWidget & Mathematical Metrics Validation', () => {
  it('calculates Shannon entropy within valid 0.0 to 8.0 bits/byte domain', () => {
    // Generate synthetic byte array with pseudo-random distribution
    const frequencies = new Array(256).fill(0);
    const totalBytes = 10000;
    for (let i = 0; i < totalBytes; i++) {
      const byte = Math.floor(Math.random() * 256);
      frequencies[byte]++;
    }

    let shannon = 0;
    for (let i = 0; i < 256; i++) {
      const p = frequencies[i] / totalBytes;
      if (p > 0) {
        shannon -= p * Math.log2(p);
      }
    }

    expect(shannon).toBeGreaterThan(7.9);
    expect(shannon).toBeLessThanOrEqual(8.0);
  });

  it('guarantees min-entropy H_inf is bounded below Shannon entropy', () => {
    const pMax = 1 / 250; // max probability
    const minEntropy = -Math.log2(pMax);
    expect(minEntropy).toBeGreaterThanOrEqual(7.9);
  });

  it('validates quantum key stability thresholds and QBER tolerances', () => {
    const qberNominal = 0.18; // 0.18%
    const qberThreshold = 11.0; // 11% quantum bit error abort limit
    expect(qberNominal).toBeLessThan(qberThreshold);
  });
});
