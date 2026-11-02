import { describe, it, expect } from 'vitest';
import { 
  computeTelemetryDigest, 
  validatePqcSignatureFormat, 
  generateTacticalSessionKey,
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

describe('Post-Quantum Cryptography & Tactical Security Utilities', () => {
  it('computes consistent SHA-256 telemetry digest', async () => {
    const payload = 'VSAT_TELEMETRY_PACKET_ID_9901_FREQ_14.25GHZ';
    const digest1 = await computeTelemetryDigest(payload);
    const digest2 = await computeTelemetryDigest(payload);

    expect(digest1).toBe(digest2);
    expect(digest1.length).toBeGreaterThanOrEqual(8);
  });

  it('validates PQC signature formats accurately', () => {
    const validSig = 'a'.repeat(64);
    expect(validatePqcSignatureFormat(validSig)).toBe(true);

    const invalidSig = 'z'.repeat(64);
    expect(validatePqcSignatureFormat(invalidSig)).toBe(false);

    expect(validatePqcSignatureFormat('abc123')).toBe(false);
  });

  it('generates tactical session keys with proper format', () => {
    const key = generateTacticalSessionKey('DEFCON-1');
    expect(key.startsWith('DEFCON-1-')).toBe(true);
    expect(key.length).toBeGreaterThan(24);
  });

  it('performs NIST FIPS 203 ML-KEM-768 post-quantum key encapsulation & decapsulation', () => {
    const keyPair = generateMlKem768KeyPair();
    expect(keyPair.publicKey).toBeInstanceOf(Uint8Array);
    expect(keyPair.secretKey).toBeInstanceOf(Uint8Array);
    expect(keyPair.publicKey.length).toBe(1184); // ML-KEM-768 public key size

    const enc = encapsulateMlKem768(keyPair.publicKey);
    expect(enc.cipherText.length).toBe(1088); // ML-KEM-768 ciphertext size
    expect(enc.sharedSecret.length).toBe(32); // 256-bit shared secret

    const decSharedSecret = decapsulateMlKem768(enc.cipherText, keyPair.secretKey);
    expect(decSharedSecret.length).toBe(32);

    // Verify exact matching of shared secrets
    expect(Array.from(enc.sharedSecret)).toEqual(Array.from(decSharedSecret));
  });

  it('performs NIST FIPS 204 ML-DSA-65 (Dilithium3) digital signing and verification', () => {
    const dsaKeys = generateMlDsa65KeyPair();
    expect(dsaKeys.publicKey).toBeInstanceOf(Uint8Array);
    expect(dsaKeys.secretKey).toBeInstanceOf(Uint8Array);
    expect(dsaKeys.publicKey.length).toBe(1952);

    const message = 'C4ISR_TOP_SECRET_ORBITAL_STRIKE_DIRECTIVE_ALPHA';
    const signature = signMlDsa65(message, dsaKeys.secretKey);
    expect(signature.length).toBe(3309); // ML-DSA-65 signature size

    // Valid verification
    const isValid = verifyMlDsa65(signature, message, dsaKeys.publicKey);
    expect(isValid).toBe(true);

    // Tampered payload verification failure
    const isTamperedValid = verifyMlDsa65(signature, message + '_CORRUPTED', dsaKeys.publicKey);
    expect(isTamperedValid).toBe(false);

    // Corrupted signature verification failure
    const corruptedSig = new Uint8Array(signature);
    corruptedSig[10] ^= 0xff;
    const isCorruptValid = verifyMlDsa65(corruptedSig, message, dsaKeys.publicKey);
    expect(isCorruptValid).toBe(false);
  });

  it('computes Grover quantum amplitude amplification correctly', () => {
    const numStates = 8; // 3 qubits
    const marked = 3;
    const optimalIters = calculateGroverOptimalIterations(numStates);
    expect(optimalIters).toBe(2);

    let amps = Array(numStates).fill(1 / Math.sqrt(numStates));
    const initialProb = Math.pow(amps[marked], 2);
    expect(initialProb).toBeCloseTo(1 / 8, 3);

    // Run optimal iterations
    for (let i = 0; i < optimalIters; i++) {
      amps = simulateGroverIteration(amps, marked);
    }

    const finalProb = Math.pow(amps[marked], 2);
    // After optimal iterations on 8 states, probability should exceed 90%
    expect(finalProb).toBeGreaterThan(0.9);
  });

  it('simulates Shor period-finding factor candidate identification', () => {
    // Factoring 15 with coprime base a = 7
    const result = simulateShorPeriodFinding(7, 15);
    expect(result.period).toBe(4); // 7^4 % 15 = 2401 % 15 = 1
    expect([result.factor1, result.factor2].sort()).toEqual([3, 5]);
  });

  it('passes comprehensive multi-cycle quantum cryptosystem stress test', async () => {
    // Execute 10 concurrent cycles of full post-quantum operations
    const stressResult = await runQuantumStressTest(10);
    expect(stressResult.passed).toBe(true);
    expect(stressResult.kemCycles).toBe(10);
    expect(stressResult.dsaCycles).toBe(10);
    expect(stressResult.details.kemSuccessRate).toBe(100);
    expect(stressResult.details.dsaSuccessRate).toBe(100);
    expect(stressResult.details.tamperedSigDetectedRate).toBe(100);
    expect(stressResult.details.groverMarkedStateConfidence).toBeGreaterThan(90);
    expect(stressResult.operationsPerSec).toBeGreaterThan(0);
  });
});
