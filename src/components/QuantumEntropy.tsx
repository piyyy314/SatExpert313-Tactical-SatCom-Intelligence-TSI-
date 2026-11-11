import React from 'react';
import { Shield, KeyRound, RefreshCw, Zap, Cpu, Lock } from 'lucide-react';
import { QuantumEntropyWidget } from './QuantumEntropyWidget.tsx';
import { ModuleExportToolbar } from './ModuleExportToolbar.tsx';

export const QuantumEntropy: React.FC = () => {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Module Title and Export Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-950/80 border border-slate-800 p-4 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-purple-400" />
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-100">
              Quantum Entropy & Post-Quantum Cryptographic Stability
            </h2>
          </div>
          <p className="text-[10px] font-mono text-slate-400 mt-1">
            Real-time True Random Number Generator (TRNG) entropy trends & FIPS 203/204 key health monitoring
          </p>
        </div>

        <ModuleExportToolbar
          compact={false}
          moduleTitle="QUANTUM ENTROPY & KEY STABILITY"
          moduleSubtitle="FIPS 203 ML-KEM-768 / FIPS 204 ML-DSA-65 TRNG Stream"
          classification="TOP SECRET // SCI // POST-QUANTUM"
          metadata={{
            'Entropy Engine': 'Hardware TRNG + Von Neumann Extractor',
            'Current Shannon Metric': '7.9842 bits/byte (99.80% Max)',
            'Min-Entropy H_inf': '7.9380 bits',
            'Key Encapsulation': 'ML-KEM-768 (Kyber768 NIST FIPS 203)',
            'Digital Signature': 'ML-DSA-65 (Dilithium3 NIST FIPS 204)',
            'Compliance Standard': 'NIST SP 800-90B & FIPS 140-3 Cryptographic Core',
            'Quantum Bit Error Rate': '0.18% (Safe, Threshold < 11.0%)',
            'Key Refresh Cycle': '60-second Ephemeral Ratchet'
          }}
          summaryText="Cryptographic entropy evaluation report confirms TRNG physical source integrity with zero deterministic bias detected across 1,000,000 continuous sample bits."
        />
      </div>

      {/* Primary Dashboard Widget */}
      <QuantumEntropyWidget />

      {/* Deep Cryptographic Architectural Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-mono font-bold uppercase">
            <Cpu className="w-4 h-4" />
            <span>Entropy Harvesting Core</span>
          </div>
          <p className="text-[10px] font-mono text-slate-400 leading-relaxed">
            Continuous quantum phase noise sampling across dual ring oscillators. Raw physical entropy is conditioned through a SHA3-512 cryptographic sponge function to eliminate correlation attacks.
          </p>
          <div className="text-[8px] font-mono text-slate-500 pt-2 border-t border-slate-900">
            NIST SP 800-90B IID Test: <span className="text-emerald-400 font-bold">PASSED</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-purple-400 text-xs font-mono font-bold uppercase">
            <Lock className="w-4 h-4" />
            <span>Post-Quantum KEM Ratchet</span>
          </div>
          <p className="text-[10px] font-mono text-slate-400 leading-relaxed">
            Module-Lattice-Based Key-Encapsulation Mechanism (ML-KEM-768) provides 128-bit quantum security against Grover and Shor quantum algorithms with zero classical performance penalty.
          </p>
          <div className="text-[8px] font-mono text-slate-500 pt-2 border-t border-slate-900">
            Security Category: <span className="text-purple-400 font-bold">NIST Security Level 3</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-mono font-bold uppercase">
            <Zap className="w-4 h-4" />
            <span>Anti-Eavesdropping QBER</span>
          </div>
          <p className="text-[10px] font-mono text-slate-400 leading-relaxed">
            Quantum Bit Error Rate (QBER) monitoring validates channel purity. Any passive optical tap or satellite transponder intercept induces measurable state collapse, instantly flagging key discard.
          </p>
          <div className="text-[8px] font-mono text-slate-500 pt-2 border-t border-slate-900">
            Abort Threshold: <span className="text-amber-400 font-bold">&gt; 11.0% QBER</span>
          </div>
        </div>
      </div>
    </div>
  );
};
