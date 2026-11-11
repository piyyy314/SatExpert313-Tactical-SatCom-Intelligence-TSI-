import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ShieldCheck, KeyRound, RefreshCw, Zap, Activity, AlertTriangle, 
  Lock, Sparkles, TrendingUp, Cpu, Sliders 
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  Tooltip, CartesianGrid, ReferenceLine 
} from 'recharts';

interface EntropyDataPoint {
  time: string;
  shannon: number;
  minEntropy: number;
  fidelity: number;
  qber: number;
}

interface QuantumEntropyWidgetProps {
  compact?: boolean;
  className?: string;
  onAlert?: (msg: string) => void;
}

export const QuantumEntropyWidget: React.FC<QuantumEntropyWidgetProps> = ({
  compact = false,
  className = '',
  onAlert
}) => {
  const [dataPoints, setDataPoints] = useState<EntropyDataPoint[]>([]);
  const [currentKey, setCurrentKey] = useState('0x9F4B..D17A_MLKEM768');
  const [dilithiumKey, setDilithiumKey] = useState('0x3C81..F92B_MLDSA65');
  const [isRotating, setIsRotating] = useState(false);
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);
  const [keyAgeSeconds, setKeyAgeSeconds] = useState(14);
  const [poolStatus, setPoolStatus] = useState<'NOMINAL' | 'DEGRADED' | 'RESEEDING'>('NOMINAL');

  // Initialize rolling window of entropy data points
  useEffect(() => {
    const initial: EntropyDataPoint[] = [];
    const now = Date.now();
    for (let i = 24; i >= 0; i--) {
      const t = new Date(now - i * 1500);
      const timeStr = t.toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' });
      const jitter = (Math.random() - 0.5) * 0.025;
      const shannon = Math.min(7.999, Math.max(7.940, 7.982 + jitter));
      const minEntropy = Math.min(shannon, Math.max(7.910, 7.935 + (Math.random() - 0.5) * 0.02));
      const fidelity = Math.min(99.99, Math.max(98.8, 99.65 + (Math.random() - 0.5) * 0.4));
      const qber = Math.max(0.04, Math.min(0.85, 0.18 + (Math.random() - 0.5) * 0.1));
      initial.push({ time: timeStr, shannon, minEntropy, fidelity, qber });
    }
    setDataPoints(initial);
  }, []);

  // Real-time ticking stream
  useEffect(() => {
    if (!isLiveStreaming) return;

    const interval = setInterval(() => {
      setKeyAgeSeconds(prev => {
        if (prev >= 60) {
          triggerKeyRotation();
          return 0;
        }
        return prev + 1;
      });

      setDataPoints(prev => {
        const last = prev[prev.length - 1];
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' });
        
        // Random micro fluctuations modeling atmospheric photon decay or quantum phase drift
        const jitter = (Math.random() - 0.5) * 0.028;
        const shannon = Math.min(7.999, Math.max(7.935, 7.982 + jitter));
        const minEntropy = Math.min(shannon, Math.max(7.905, 7.938 + (Math.random() - 0.5) * 0.022));
        const fidelity = Math.min(99.99, Math.max(98.5, 99.6 + (Math.random() - 0.5) * 0.45));
        const qber = Math.max(0.04, Math.min(0.95, 0.19 + (Math.random() - 0.5) * 0.12));

        const newPoint: EntropyDataPoint = {
          time: timeStr,
          shannon: Number(shannon.toFixed(4)),
          minEntropy: Number(minEntropy.toFixed(4)),
          fidelity: Number(fidelity.toFixed(2)),
          qber: Number(qber.toFixed(2))
        };

        const updated = [...prev.slice(1), newPoint];
        return updated;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [isLiveStreaming]);

  const triggerKeyRotation = () => {
    setIsRotating(true);
    setPoolStatus('RESEEDING');
    setTimeout(() => {
      const hex = '0123456789ABCDEF';
      let r1 = '';
      let r2 = '';
      for (let i = 0; i < 4; i++) {
        r1 += hex[Math.floor(Math.random() * 16)];
        r2 += hex[Math.floor(Math.random() * 16)];
      }
      setCurrentKey(`0x${r1}..${r2}_MLKEM768`);
      setDilithiumKey(`0x${r2}..${r1}_MLDSA65`);
      setKeyAgeSeconds(0);
      setIsRotating(false);
      setPoolStatus('NOMINAL');
      if (onAlert) {
        onAlert(`QUANTUM TRNG RESEEDED: Ephemeral session key 0x${r1}..${r2} synchronized with satellite transponder.`);
      }
    }, 600);
  };

  const latestPoint = dataPoints[dataPoints.length - 1] || {
    shannon: 7.984,
    minEntropy: 7.938,
    fidelity: 99.65,
    qber: 0.18
  };

  const isDegraded = latestPoint.shannon < 7.95;

  return (
    <div className={`p-4 bg-slate-950/95 border border-slate-800 rounded-3xl flex flex-col space-y-4 shadow-xl select-none ${className}`}>
      {/* Widget Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-purple-950/80 border border-purple-800/60 text-purple-400">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
                Quantum Entropy & Key Stability
              </h3>
              <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold tracking-widest uppercase border ${
                isDegraded 
                  ? 'bg-amber-950/60 border-amber-600/70 text-amber-400 animate-pulse'
                  : 'bg-emerald-950/60 border-emerald-600/70 text-emerald-400'
              }`}>
                {isDegraded ? 'ENTROPY JITTER' : 'NIST SP 800-90B: PASS'}
              </span>
            </div>
            <p className="text-[9px] font-mono text-slate-500 uppercase tracking-wider mt-0.5">
              FIPS 203 ML-KEM-768 & FIPS 204 ML-DSA-65 TRNG Telemetry
            </p>
          </div>
        </div>

        {/* Live Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsLiveStreaming(!isLiveStreaming)}
            className={`px-2 py-1 rounded-lg text-[8px] font-mono uppercase font-bold border transition-all ${
              isLiveStreaming 
                ? 'bg-cyan-950/70 border-cyan-500 text-cyan-300' 
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
            title="Toggle Live Telemetry Stream"
          >
            {isLiveStreaming ? 'LIVE' : 'HOLD'}
          </button>

          <button
            onClick={triggerKeyRotation}
            disabled={isRotating}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[8.5px] font-mono uppercase font-bold bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500 text-slate-300 hover:text-cyan-300 transition-all active:scale-95 disabled:opacity-50"
            title="Re-seed Quantum Entropy Pool"
          >
            <RefreshCw className={`w-3 h-3 ${isRotating ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
            <span>RE-SEED</span>
          </button>
        </div>
      </div>

      {/* KPI Numerical Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-2.5 rounded-2xl bg-slate-900/60 border border-slate-850 flex flex-col justify-between">
          <span className="text-[8px] font-mono uppercase text-slate-500 tracking-wider">Shannon Entropy</span>
          <div className="flex items-baseline space-x-1 mt-1">
            <span className="text-base font-mono font-black text-cyan-400">
              {latestPoint.shannon.toFixed(4)}
            </span>
            <span className="text-[9px] font-mono text-slate-500">/ 8.000</span>
          </div>
          <div className="w-full bg-slate-950 h-1 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-cyan-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${(latestPoint.shannon / 8.0) * 100}%` }}
            />
          </div>
        </div>

        <div className="p-2.5 rounded-2xl bg-slate-900/60 border border-slate-850 flex flex-col justify-between">
          <span className="text-[8px] font-mono uppercase text-slate-500 tracking-wider">Min-Entropy (H_∞)</span>
          <div className="flex items-baseline space-x-1 mt-1">
            <span className="text-base font-mono font-black text-purple-400">
              {latestPoint.minEntropy.toFixed(4)}
            </span>
            <span className="text-[9px] font-mono text-slate-500">bits</span>
          </div>
          <div className="w-full bg-slate-950 h-1 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-purple-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${(latestPoint.minEntropy / 8.0) * 100}%` }}
            />
          </div>
        </div>

        <div className="p-2.5 rounded-2xl bg-slate-900/60 border border-slate-850 flex flex-col justify-between">
          <span className="text-[8px] font-mono uppercase text-slate-500 tracking-wider">Key Stability</span>
          <div className="flex items-baseline space-x-1 mt-1">
            <span className="text-base font-mono font-black text-emerald-400">
              {latestPoint.fidelity.toFixed(1)}%
            </span>
            <span className="text-[9px] font-mono text-slate-500">Fidelity</span>
          </div>
          <span className="text-[7.5px] font-mono text-slate-500 uppercase mt-2">
            Rotates in {Math.max(0, 60 - keyAgeSeconds)}s
          </span>
        </div>

        <div className="p-2.5 rounded-2xl bg-slate-900/60 border border-slate-850 flex flex-col justify-between">
          <span className="text-[8px] font-mono uppercase text-slate-500 tracking-wider">Quantum Bit Error</span>
          <div className="flex items-baseline space-x-1 mt-1">
            <span className="text-base font-mono font-black text-amber-400">
              {latestPoint.qber.toFixed(2)}%
            </span>
            <span className="text-[9px] font-mono text-slate-500">QBER</span>
          </div>
          <span className="text-[7.5px] font-mono text-emerald-400 uppercase mt-2">
            Safe (&lt; 11% threshold)
          </span>
        </div>
      </div>

      {/* Real-Time Recharts Trend Line Visualizer */}
      <div className="bg-black/70 border border-slate-900 rounded-2xl p-3">
        <div className="flex items-center justify-between text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-2 px-1">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-0.5 bg-cyan-400 inline-block"></span>
              <span className="text-cyan-300 font-bold">Shannon Entropy [bits/byte]</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-0.5 bg-purple-400 inline-block"></span>
              <span className="text-purple-300 font-bold">Min-Entropy H_∞</span>
            </span>
          </div>
          <span className="text-slate-600 hidden sm:inline">ROLLING 36s WINDOW</span>
        </div>

        <div className="w-full h-44">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dataPoints} margin={{ top: 8, right: 12, left: -22, bottom: 0 }}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} opacity={0.6} />
              <XAxis 
                dataKey="time" 
                stroke="#475569" 
                fontSize={8} 
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />
              <YAxis 
                domain={[7.90, 8.00]} 
                ticks={[7.90, 7.93, 7.96, 7.98, 8.00]}
                stroke="#475569" 
                fontSize={8} 
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                tickFormatter={(v) => v.toFixed(2)}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#020617',
                  border: '1px solid #1e293b',
                  borderRadius: '12px',
                  fontSize: '9px',
                  fontFamily: 'monospace',
                  color: '#e2e8f0',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.8)'
                }}
                formatter={(value: any, name: any) => {
                  const val = Number(value).toFixed(4);
                  if (name === 'shannon') return [`${val} bits/byte`, 'Shannon Entropy'];
                  if (name === 'minEntropy') return [`${val} bits/byte`, 'Min-Entropy H_∞'];
                  return [val, name];
                }}
                labelStyle={{ color: '#94a3b8', marginBottom: '4px', fontWeight: 'bold' }}
              />
              <ReferenceLine y={7.95} stroke="#f59e0b" strokeDasharray="3 3" opacity={0.5} />
              <Line 
                type="monotone" 
                dataKey="shannon" 
                stroke="#22d3ee" 
                strokeWidth={1.8} 
                dot={false}
                activeDot={{ r: 4, fill: '#22d3ee', stroke: '#0891b2', strokeWidth: 1.5 }}
                isAnimationActive={false}
              />
              <Line 
                type="monotone" 
                dataKey="minEntropy" 
                stroke="#c084fc" 
                strokeWidth={1.4} 
                dot={false}
                activeDot={{ r: 3.5, fill: '#c084fc', stroke: '#9333ea', strokeWidth: 1.5 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Active Post-Quantum Key Fingerprint Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[9px] font-mono">
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <div>
              <span className="text-[7.5px] uppercase text-slate-500 font-bold block">ML-KEM-768 Encapsulation</span>
              <span className="text-slate-200 select-all font-bold">{currentKey}</span>
            </div>
          </div>
          <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 text-[7px] border border-cyan-800/40">
            KEM-L3
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <div>
              <span className="text-[7.5px] uppercase text-slate-500 font-bold block">ML-DSA-65 Signature</span>
              <span className="text-slate-200 select-all font-bold">{dilithiumKey}</span>
            </div>
          </div>
          <span className="px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-400 text-[7px] border border-purple-800/40">
            DSA-L3
          </span>
        </div>
      </div>
    </div>
  );
};
