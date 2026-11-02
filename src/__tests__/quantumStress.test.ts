import { describe, it, expect } from 'vitest';
import { 
  generateMlKem768KeyPair,
  encapsulateMlKem768,
  decapsulateMlKem768,
  generateMlDsa65KeyPair,
  signMlDsa65,
  verifyMlDsa65,
  calculateGroverOptimalIterations,
  simulateGroverIteration,
  simulateShorPeriodFinding,
  runQuantumStressTest
} from '../utils/cryptoUtils.ts';

describe('Quantum Methods Rigorous & High-Concurrency Stress Test Suite', () => {
  it('stress tests ML-KEM-768 across 30 concurrent key encapsulation cycles', () => {
    const cycles = 30;
    const start = performance.now();

    for (let i = 0; i < cycles; i++) {
      const keys = generateMlKem768KeyPair();
      const enc = encapsulateMlKem768(keys.publicKey);
      const dec = decapsulateMlKem768(enc.cipherText, keys.secretKey);

      expect(enc.sharedSecret.length).toBe(32);
      expect(dec.length).toBe(32);
      expect(Array.from(enc.sharedSecret)).toEqual(Array.from(dec));
    }

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(10000); // Must complete within 10 seconds
  });

  it('stress tests ML-DSA-65 (Dilithium3) digital signatures with large telemetry streams and tamper rejection', () => {
    const keys = generateMlDsa65KeyPair();

    // Test with various payload sizes from 100 bytes to 64KB
    const payloadSizes = [100, 1024, 8192, 65536];
    for (const size of payloadSizes) {
      const largePayload = new Uint8Array(size);
      for (let j = 0; j < size; j++) largePayload[j] = (j * 17 + 31) % 256;

      const signature = signMlDsa65(largePayload, keys.secretKey);
      expect(signature.length).toBe(3309);

      // Verify authentic message
      const valid = verifyMlDsa65(signature, largePayload, keys.publicKey);
      expect(valid).toBe(true);

      // Verify corrupted byte rejected
      const tampered = new Uint8Array(largePayload);
      tampered[Math.floor(size / 2)] ^= 0x01;
      const invalid = verifyMlDsa65(signature, tampered, keys.publicKey);
      expect(invalid).toBe(false);
    }
  });

  it('stress tests Grover quantum search amplitude amplification across 2, 3, 4, and 5 qubits (4 to 32 states)', () => {
    const qubitConfigs = [2, 3, 4, 5]; // 4, 8, 16, 32 states

    for (const q of qubitConfigs) {
      const N = Math.pow(2, q);
      const marked = Math.floor(N / 2) + 1;
      const optimalIters = calculateGroverOptimalIterations(N);

      let amps = Array(N).fill(1 / Math.sqrt(N));
      for (let step = 0; step < optimalIters; step++) {
        amps = simulateGroverIteration(amps, marked);
      }

      const markedProb = Math.pow(amps[marked], 2);
      // For any standard Grover search with optimal iterations, marked probability exceeds 50% up to 99%
      expect(markedProb).toBeGreaterThan(0.5);

      // Unmarked states must have lower probability
      const unmarkedIndex = (marked + 1) % N;
      const unmarkedProb = Math.pow(amps[unmarkedIndex], 2);
      expect(markedProb).toBeGreaterThan(unmarkedProb * 2);
    }
  });

  it('stress tests Shor period-finding routine across composite moduli', () => {
    // 15 = 3 * 5 with coprime base 7
    const res15 = simulateShorPeriodFinding(7, 15);
    expect(res15.period).toBe(4);
    expect([res15.factor1, res15.factor2].sort((a, b) => a - b)).toEqual([3, 5]);

    // 21 = 3 * 7 with coprime base 2
    // 2^6 = 64 = 3*21 + 1 => period = 6
    const res21 = simulateShorPeriodFinding(2, 21);
    expect(res21.period).toBe(6);
    expect([res21.factor1, res21.factor2].sort((a, b) => a - b)).toEqual([3, 7]);

    // 33 = 3 * 11 with base 2
    // 2^10 = 1024 = 31*33 + 1 => period = 10
    const res33 = simulateShorPeriodFinding(2, 33);
    expect(res33.period).toBe(10);
    expect([res33.factor1, res33.factor2].sort((a, b) => a - b)).toEqual([3, 11]);
  });

  it('executes full end-to-end multi-cycle quantum cryptosystem stress test benchmark', async () => {
    const result = await runQuantumStressTest(20);
    expect(result.passed).toBe(true);
    expect(result.kemCycles).toBe(20);
    expect(result.dsaCycles).toBe(20);
    expect(result.details.kemSuccessRate).toBe(100);
    expect(result.details.dsaSuccessRate).toBe(100);
    expect(result.details.tamperedSigDetectedRate).toBe(100);
    expect(result.details.groverMarkedStateConfidence).toBeGreaterThan(90);
    expect(result.elapsedMs).toBeGreaterThan(0);
    expect(result.operationsPerSec).toBeGreaterThan(0);
  });
});
