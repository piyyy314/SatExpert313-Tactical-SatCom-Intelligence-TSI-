import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  Activity, ShieldAlert, Wifi, AlertTriangle, Play, Pause, 
  RotateCcw, Download, TrendingDown, TrendingUp, Layers, 
  BarChart2, Radio, CheckCircle2, Sliders, Eye
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { audioController } from '../services/audioService.ts';

export interface SignalVisualizerProps {
  quality: number; // 0 to 100
  isJamming: boolean;
  jammingPower: number;
  rainFade: number;
  isStealthMode: boolean;
  snr?: number | string;
  packetLoss?: number | string;
  carrierFrequency?: string;
  satelliteName?: string;
}

export interface TelemetryPoint {
  second: number; // -59 to 0
  timeLabel: string;
  timestamp: string;
  snr: number;
  packetLoss: number;
  threshold: number;
  isBreached: boolean;
}

type VisualizerViewMode = 'chart' | 'spectrum' | 'dual';

// Custom Military HUD Tooltip for Recharts
const CustomTacticalTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0]?.payload as TelemetryPoint | undefined;
    const snrVal = typeof dataPoint?.snr === 'number' ? dataPoint.snr : parseFloat(dataPoint?.snr || '0');
    const lossVal = typeof dataPoint?.packetLoss === 'number' ? dataPoint.packetLoss : parseFloat(dataPoint?.packetLoss || '0');
    const isCritical = snrVal < 5.0;
    const isDegraded = snrVal < 10.0 && !isCritical;

    return (
      <div className="bg-slate-950/95 border border-cyan-500/50 rounded-xl p-3 shadow-[0_0_25px_rgba(0,0,0,0.85)] font-mono text-[10px] space-y-1.5 backdrop-blur-md min-w-[190px] pointer-events-none z-50">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1 text-slate-400 text-[8.5px]">
          <span className="font-bold text-cyan-400">OFFSET: {label}</span>
          <span className="text-slate-500">{dataPoint?.timestamp || ''}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-cyan-400 font-bold flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            <span>CARRIER SNR:</span>
          </span>
          <span className={`font-black ${isCritical ? 'text-red-400' : (isDegraded ? 'text-amber-400' : 'text-cyan-300')}`}>
            {snrVal.toFixed(2)} dB
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-rose-400 font-bold flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            <span>PACKET LOSS:</span>
          </span>
          <span className={`font-black ${lossVal > 5 ? 'text-rose-400' : (lossVal > 1 ? 'text-amber-300' : 'text-slate-300')}`}>
            {lossVal.toFixed(2)}%
          </span>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[8.5px]">
          <span className="text-slate-500">LOCK QUALITY:</span>
          <span className={`px-1.5 py-0.5 rounded font-black uppercase text-[8px] ${
            isCritical ? 'bg-red-950 text-red-400 border border-red-700' :
            (isDegraded ? 'bg-amber-950 text-amber-400 border border-amber-700' : 'bg-emerald-950 text-emerald-400 border border-emerald-700')
          }`}>
            {isCritical ? 'CRITICAL' : (isDegraded ? 'DEGRADED' : 'NOMINAL')}
          </span>
        </div>

        {isCritical && (
          <div className="text-[7.5px] text-red-400 bg-red-950/80 px-1.5 py-0.5 rounded border border-red-500/50 flex items-center space-x-1 animate-pulse">
            <AlertTriangle className="w-2.5 h-2.5 text-red-400 shrink-0" />
            <span>BELOW 5.0 dB THRESHOLD</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export const SignalVisualizer: React.FC<SignalVisualizerProps> = ({
  quality,
  isJamming,
  jammingPower,
  rainFade,
  isStealthMode,
  snr,
  packetLoss,
  carrierFrequency = '14.25 GHz',
  satelliteName
}) => {
  // View mode switcher: 'chart' | 'spectrum' | 'dual'
  const [viewMode, setViewMode] = useState<VisualizerViewMode>('dual');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [ticker, setTicker] = useState(0);

  // Compute resolved numeric SNR and Packet Loss
  const numericSnr = useMemo(() => {
    if (typeof snr === 'number') return snr;
    if (typeof snr === 'string') {
      const parsed = parseFloat(snr);
      return isNaN(parsed) ? 16.0 : parsed;
    }
    return 16.0;
  }, [snr]);

  const numericPacketLoss = useMemo(() => {
    if (typeof packetLoss === 'number') return packetLoss;
    if (typeof packetLoss === 'string') {
      const parsed = parseFloat(packetLoss);
      return isNaN(parsed) ? 0.0 : parsed;
    }
    return 0.0;
  }, [packetLoss]);

  const isCriticalDegradation = numericSnr < 5.0;

  // Initialize a realistic 60-second historical window buffer
  const [historyData, setHistoryData] = useState<TelemetryPoint[]>(() => {
    const points: TelemetryPoint[] = [];
    const now = new Date();
    const baseSnr = typeof snr === 'number' ? snr : 16.0;
    const baseLoss = typeof packetLoss === 'number' ? packetLoss : 0.0;

    for (let i = 59; i >= 0; i--) {
      const pointTime = new Date(now.getTime() - i * 1000);
      const timeStr = pointTime.toLocaleTimeString([], { hour12: false });
      const offsetSeconds = -i;
      const timeLabel = i === 0 ? '0s (NOW)' : `-${i}s`;
      
      // Seed with subtle realistic variations leading up to current state
      const drift = Math.sin(i / 6) * 0.4 + (Math.random() - 0.5) * 0.3;
      const sampleSnr = Math.max(0, Math.min(26, baseSnr + drift));
      const sampleLoss = Math.max(0, Math.min(100, baseLoss + (Math.random() * 0.08)));

      points.push({
        second: offsetSeconds,
        timeLabel,
        timestamp: timeStr,
        snr: parseFloat(sampleSnr.toFixed(2)),
        packetLoss: parseFloat(sampleLoss.toFixed(2)),
        threshold: 5.0,
        isBreached: sampleSnr < 5.0
      });
    }
    return points;
  });

  const lastBreachRef = useRef<boolean>(false);

  // Interval for Spectrum animation (150ms)
  useEffect(() => {
    const handle = setInterval(() => {
      setTicker(t => t + 1);
    }, 150);
    return () => clearInterval(handle);
  }, []);

  // Interval for 60s Telemetry Streaming (1000ms tick)
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setHistoryData(prev => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour12: false });

        // Calculate latest telemetry point with micro-jitter
        const jitterSnr = (Math.random() - 0.5) * (isJamming ? 1.6 : 0.35);
        const nextSnr = Math.max(0, Math.min(26, numericSnr + jitterSnr));

        const jitterLoss = (Math.random() * (isJamming ? 1.4 : 0.12)) - (isJamming ? 0.3 : 0.03);
        const nextLoss = Math.max(0, Math.min(100, numericPacketLoss + jitterLoss));

        const isBreached = nextSnr < 5.0;

        // Audible alert on critical breach transition
        if (isBreached && !lastBreachRef.current) {
          audioController.playBeep(480, 'sawtooth', 0.2);
        }
        lastBreachRef.current = isBreached;

        const updated = [...prev.slice(1)];
        // Re-label seconds from -59 to 0
        const reIndexed = updated.map((pt, idx) => ({
          ...pt,
          second: -(59 - idx),
          timeLabel: idx === 58 ? '-1s' : `-${59 - idx}s`
        }));

        reIndexed.push({
          second: 0,
          timeLabel: '0s (NOW)',
          timestamp: timeStr,
          snr: parseFloat(nextSnr.toFixed(2)),
          packetLoss: parseFloat(nextLoss.toFixed(2)),
          threshold: 5.0,
          isBreached
        });

        return reIndexed;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, numericSnr, numericPacketLoss, isJamming]);

  // Rolling 60s Statistical Metrics
  const stats = useMemo(() => {
    if (historyData.length === 0) {
      return {
        currentSnr: numericSnr,
        avgSnr: numericSnr,
        minSnr: numericSnr,
        maxSnr: numericSnr,
        currentLoss: numericPacketLoss,
        avgLoss: numericPacketLoss,
        maxLoss: numericPacketLoss,
        linkMargin: numericSnr - 5.0,
        stabilityPct: 100,
        breachCount: 0
      };
    }

    const snrValues = historyData.map(d => d.snr);
    const lossValues = historyData.map(d => d.packetLoss);

    const sumSnr = snrValues.reduce((a, b) => a + b, 0);
    const sumLoss = lossValues.reduce((a, b) => a + b, 0);

    const minSnr = Math.min(...snrValues);
    const maxSnr = Math.max(...snrValues);
    const maxLoss = Math.max(...lossValues);

    const latest = historyData[historyData.length - 1];
    const breachCount = historyData.filter(d => d.isBreached).length;
    const nominalCount = historyData.filter(d => d.snr >= 10.0).length;
    const stabilityPct = (nominalCount / historyData.length) * 100;

    return {
      currentSnr: latest.snr,
      avgSnr: parseFloat((sumSnr / historyData.length).toFixed(2)),
      minSnr: parseFloat(minSnr.toFixed(2)),
      maxSnr: parseFloat(maxSnr.toFixed(2)),
      currentLoss: latest.packetLoss,
      avgLoss: parseFloat((sumLoss / historyData.length).toFixed(2)),
      maxLoss: parseFloat(maxLoss.toFixed(2)),
      linkMargin: parseFloat((latest.snr - 5.0).toFixed(2)),
      stabilityPct: parseFloat(stabilityPct.toFixed(1)),
      breachCount
    };
  }, [historyData, numericSnr, numericPacketLoss]);

  // Reset Buffer Action
  const handleResetBuffer = useCallback(() => {
    const points: TelemetryPoint[] = [];
    const now = new Date();
    for (let i = 59; i >= 0; i--) {
      const pointTime = new Date(now.getTime() - i * 1000);
      points.push({
        second: -i,
        timeLabel: i === 0 ? '0s (NOW)' : `-${i}s`,
        timestamp: pointTime.toLocaleTimeString([], { hour12: false }),
        snr: parseFloat(numericSnr.toFixed(2)),
        packetLoss: parseFloat(numericPacketLoss.toFixed(2)),
        threshold: 5.0,
        isBreached: numericSnr < 5.0
      });
    }
    setHistoryData(points);
    audioController.playBeep(650, 'sine', 0.08);
  }, [numericSnr, numericPacketLoss]);

  // Export CSV Action
  const handleExportCsv = useCallback(() => {
    const headers = "Timestamp,WindowOffset,SNR_dB,PacketLoss_Pct,Threshold_dB,Status\n";
    const rows = historyData.map(pt => 
      `${pt.timestamp},${pt.timeLabel},${pt.snr.toFixed(2)},${pt.packetLoss.toFixed(2)},5.00,${pt.snr < 5.0 ? 'CRITICAL' : pt.snr < 10.0 ? 'DEGRADED' : 'NOMINAL'}`
    ).join("\n");
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `telemetry_60s_snr_loss_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    audioController.playBeep(880, 'sine', 0.1);
  }, [historyData]);

  // Compute RF spectrum mathematical curve
  const points: string[] = [];
  const totalPoints = 60;
  const width = 300;
  const height = 80;

  let carrierPeak = isStealthMode ? 28 : (quality > 0 ? 55 : 4);
  if (isJamming) {
    carrierPeak = Math.max(12, carrierPeak - (jammingPower / 4));
  }
  carrierPeak = Math.max(2, carrierPeak - rainFade);
  if (isCriticalDegradation) {
    carrierPeak = Math.max(4, carrierPeak * (numericSnr / 10));
  }

  for (let i = 0; i <= totalPoints; i++) {
    const x = (i / totalPoints) * width;
    let baselineNoise = 12;
    if (isJamming) baselineNoise += (jammingPower / 3);
    if (isCriticalDegradation) baselineNoise += 10;

    const noiseJitterRange = isJamming || isCriticalDegradation ? 12 : 1.8;
    const jitter = Math.sin((i / 2) + ticker) * noiseJitterRange + (Math.random() - 0.5) * (isJamming || isCriticalDegradation ? 4 : 1);
    
    const centerIndex = 30;
    const gaussianWidth = isStealthMode ? 3 : (isCriticalDegradation ? 8 : 5);
    const exponent = -Math.pow(i - centerIndex, 2) / (2 * Math.pow(gaussianWidth, 2));
    const peakHeight = carrierPeak * Math.exp(exponent);

    const rawY = height - (baselineNoise + peakHeight + jitter);
    const y = Math.max(5, Math.min(height - 2, rawY));
    points.push(`${x},${y}`);
  }

  const svgPathCoords = points.join(' ');

  return (
    <div className={`p-4 sm:p-5 bg-slate-950/90 border-2 rounded-3xl flex flex-col space-y-4 select-none shadow-xl transition-all duration-300 ${
      isCriticalDegradation
        ? 'border-red-600/90 shadow-[0_0_28px_rgba(239,68,68,0.35)] ring-1 ring-red-500/50'
        : 'border-slate-800'
    }`}>
      {/* Visualizer Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-800/80 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className={`p-1.5 rounded-lg border ${
            isCriticalDegradation 
              ? 'bg-red-950/80 border-red-500 text-red-400 animate-pulse' 
              : 'bg-cyan-950/50 border-cyan-800/60 text-cyan-400'
          }`}>
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-200 font-mono">
                Real-Time Signal Telemetry & Spectrum
              </h4>
              <span className="text-[7.5px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/50">
                60s BUFFER
              </span>
            </div>
            <p className="text-[8px] font-mono text-slate-500">
              {satelliteName ? `LINK: ${satelliteName.toUpperCase()} // ` : ''}CARRIER: {carrierFrequency} // 1 Hz TELEMETRY SAMPLING
            </p>
          </div>
        </div>

        {/* View Mode Switcher and Controls */}
        <div className="flex items-center flex-wrap gap-1.5 self-end sm:self-auto">
          {/* View Mode Buttons */}
          <div className="bg-slate-900/80 border border-slate-800 p-0.5 rounded-xl flex items-center space-x-1">
            <button
              onClick={() => { setViewMode('chart'); audioController.playBeep(700, 'sine', 0.05); }}
              className={`px-2 py-1 rounded-lg text-[8px] font-mono font-bold tracking-wider transition-all flex items-center space-x-1 ${
                viewMode === 'chart' 
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Focus on 60s Recharts Telemetry Line Graph"
            >
              <BarChart2 className="w-3 h-3" />
              <span>60s TELEMETRY</span>
            </button>
            <button
              onClick={() => { setViewMode('spectrum'); audioController.playBeep(700, 'sine', 0.05); }}
              className={`px-2 py-1 rounded-lg text-[8px] font-mono font-bold tracking-wider transition-all flex items-center space-x-1 ${
                viewMode === 'spectrum' 
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Focus on RF Spectrum FFT"
            >
              <Radio className="w-3 h-3" />
              <span>SPECTRUM FFT</span>
            </button>
            <button
              onClick={() => { setViewMode('dual'); audioController.playBeep(700, 'sine', 0.05); }}
              className={`px-2 py-1 rounded-lg text-[8px] font-mono font-bold tracking-wider transition-all flex items-center space-x-1 ${
                viewMode === 'dual' 
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Dual Tactical HUD (Both Chart & Spectrum)"
            >
              <Layers className="w-3 h-3" />
              <span>DUAL HUD</span>
            </button>
          </div>

          {/* Pause/Resume Toggle */}
          <button
            onClick={() => { setIsPaused(!isPaused); audioController.playBeep(800, 'sine', 0.05); }}
            className={`p-1.5 rounded-lg border text-[8px] font-mono font-bold flex items-center space-x-1 transition-all ${
              isPaused 
                ? 'bg-amber-950/80 border-amber-500 text-amber-400 animate-pulse' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-cyan-400'
            }`}
            title={isPaused ? "Resume telemetry sampling" : "Pause live stream"}
          >
            {isPaused ? <Play className="w-3 h-3 text-amber-400" /> : <Pause className="w-3 h-3" />}
          </button>

          {/* Reset Buffer */}
          <button
            onClick={handleResetBuffer}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-cyan-400 transition-all"
            title="Reset 60s buffer history"
          >
            <RotateCcw className="w-3 h-3" />
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCsv}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-emerald-400 transition-all"
            title="Export 60s telemetry data to CSV"
          >
            <Download className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Real-time Status Notification Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/40 px-3 py-1.5 rounded-xl border border-slate-800/80 text-[8px] font-mono">
        <div className="flex items-center space-x-2">
          <span className="flex items-center space-x-1 text-slate-400">
            <span className={`w-1.5 h-1.5 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-emerald-400 animate-ping'}`} />
            <span>STREAM: <strong className={isPaused ? 'text-amber-400' : 'text-emerald-400'}>{isPaused ? 'PAUSED' : 'LIVE (1 Hz)'}</strong></span>
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">WINDOW: <strong className="text-cyan-300">60 SECONDS</strong></span>
        </div>

        <div className="flex items-center space-x-2">
          {isCriticalDegradation && (
            <span className="text-red-400 bg-red-950/80 border border-red-600/80 px-2 py-0.5 rounded-full font-bold flex items-center space-x-1 animate-pulse">
              <AlertTriangle className="w-2.5 h-2.5 text-red-500 shrink-0" />
              <span>CRITICAL SNR &lt; 5.0 dB</span>
            </span>
          )}
          {isJamming && !isCriticalDegradation && (
            <span className="text-amber-400 bg-amber-950/60 border border-amber-600/60 px-2 py-0.5 rounded-full font-bold flex items-center space-x-1">
              <ShieldAlert className="w-2.5 h-2.5 text-amber-500 shrink-0" />
              <span>JAMMER INJECTION (+{jammingPower}%)</span>
            </span>
          )}
          <span className="text-slate-400">STABILITY: <strong className={stats.stabilityPct > 80 ? 'text-emerald-400' : 'text-amber-400'}>{stats.stabilityPct}%</strong></span>
        </div>
      </div>

      {/* 60-Second Recharts Telemetry Chart View */}
      {(viewMode === 'chart' || viewMode === 'dual') && (
        <div className="bg-black/90 border border-slate-900 rounded-2xl p-3 relative flex flex-col space-y-2">
          {/* Chart Header Bar */}
          <div className="flex items-center justify-between text-[8px] font-mono border-b border-slate-900 pb-1.5 px-1">
            <div className="flex items-center space-x-3">
              <span className="flex items-center space-x-1.5 text-cyan-400 font-bold">
                <span className="w-2 h-0.5 bg-cyan-400 rounded"></span>
                <span>CARRIER SNR (LEFT AXIS, dB)</span>
              </span>
              <span className="flex items-center space-x-1.5 text-rose-400 font-bold">
                <span className="w-2 h-0.5 bg-rose-400 rounded"></span>
                <span>PACKET LOSS (RIGHT AXIS, %)</span>
              </span>
            </div>
            <div className="flex items-center space-x-2 text-slate-500">
              <span className="text-red-400 font-mono">--- THRESHOLD (5.0 dB)</span>
              <span>• SMOOTH MONOTONE SCROLL</span>
            </div>
          </div>

          {/* Recharts Chart Container */}
          <div className="w-full h-48 sm:h-52 relative">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart 
                data={historyData} 
                margin={{ top: 8, right: 12, left: -22, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="snrAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                
                <XAxis 
                  dataKey="timeLabel" 
                  stroke="#475569" 
                  tick={{ fontSize: 8, fill: '#64748b', fontFamily: 'monospace' }} 
                  interval={9} // ~Every 10 seconds (-50s, -40s, -30s, -20s, -10s, 0s)
                  tickLine={{ stroke: '#334155' }}
                />
                
                {/* Primary Left Y-Axis: SNR in dB */}
                <YAxis 
                  yAxisId="snrAxis" 
                  orientation="left" 
                  domain={[0, 24]} 
                  stroke="#06b6d4" 
                  tick={{ fontSize: 8, fill: '#06b6d4', fontFamily: 'monospace' }} 
                  unit=" dB"
                  tickLine={{ stroke: '#0e7490' }}
                />

                {/* Secondary Right Y-Axis: Packet Loss in % */}
                <YAxis 
                  yAxisId="lossAxis" 
                  orientation="right" 
                  domain={[0, (dataMax: number) => Math.max(10, Math.ceil(dataMax * 1.3))]} 
                  stroke="#f43f5e" 
                  tick={{ fontSize: 8, fill: '#f43f5e', fontFamily: 'monospace' }} 
                  unit="%"
                  tickLine={{ stroke: '#be123c' }}
                />

                <Tooltip content={<CustomTacticalTooltip />} />

                {/* Critical SNR Limit Reference Line at 5.0 dB */}
                <ReferenceLine 
                  yAxisId="snrAxis" 
                  y={5.0} 
                  stroke="#ef4444" 
                  strokeDasharray="4 4" 
                  strokeWidth={1.5}
                />

                {/* SNR Area Wave */}
                <Area 
                  yAxisId="snrAxis" 
                  type="monotone" 
                  dataKey="snr" 
                  stroke="#06b6d4" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#snrAreaGradient)" 
                  isAnimationActive={false} 
                  name="SNR (dB)"
                />

                {/* Packet Loss Smooth Line */}
                <Line 
                  yAxisId="lossAxis" 
                  type="monotone" 
                  dataKey="packetLoss" 
                  stroke="#f43f5e" 
                  strokeWidth={1.8} 
                  dot={false} 
                  isAnimationActive={false} 
                  name="Packet Loss (%)"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Realtime RF Spectrum FFT Analyzer View */}
      {(viewMode === 'spectrum' || viewMode === 'dual') && (
        <div className="bg-black border border-slate-900 rounded-2xl p-2.5 h-28 overflow-hidden relative flex flex-col justify-between">
          {/* Graticule grid ticks */}
          <div className="absolute inset-2 border border-dashed border-slate-900/40 pointer-events-none grid grid-cols-5 grid-rows-3">
            {[...Array(15)].map((_, idx) => <div key={idx} className="border-[0.25px] border-slate-900/20"></div>)}
          </div>

          {/* Visual Threshold-Based Alert: Red Blinking Overlay when SNR < 5.0 dB */}
          {isCriticalDegradation && (
            <div className="absolute inset-0 bg-red-950/40 border-2 border-red-500/80 z-30 pointer-events-none animate-pulse flex flex-col items-center justify-center p-2 backdrop-blur-[0.5px]">
              <div className="bg-red-950/90 border border-red-500 px-3 py-1 rounded-lg flex items-center space-x-1.5 shadow-[0_0_15px_rgba(239,68,68,0.7)] animate-bounce">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-spin" style={{ animationDuration: '3s' }} />
                <span className="text-[8px] font-mono font-black text-red-200 tracking-widest uppercase">
                  CRITICAL SIGNAL DEGRADATION (SNR: {numericSnr.toFixed(1)} dB)
                </span>
              </div>
              <span className="text-[6.5px] font-mono text-red-400 uppercase tracking-widest mt-1 bg-black/60 px-2 py-0.5 rounded">
                THRESHOLD VIOLATION &lt; 5.0 dB // CARRIER LOCK AT RISK
              </span>
            </div>
          )}

          {/* Live SVG spectrum envelope */}
          <svg className="w-full h-full relative z-10 overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
            {/* Shaded Area underneath the spectrum */}
            <polygon
              fill={isCriticalDegradation ? "rgba(239, 68, 68, 0.18)" : (isStealthMode ? "rgba(168, 85, 247, 0.04)" : (isJamming ? "rgba(239, 68, 68, 0.04)" : "rgba(34, 211, 238, 0.04)"))}
              points={`0,${height} ${svgPathCoords} ${width},${height}`}
            />
            {/* Spectrum Trace Line */}
            <polyline
              fill="none"
              stroke={isCriticalDegradation ? "#ef4444" : (isStealthMode ? "#c084fc" : (isJamming ? "#ef4444" : "#22d3ee"))}
              strokeWidth={isCriticalDegradation ? "2" : "1.5"}
              points={svgPathCoords}
            />

            {/* Locked Carrier marker */}
            {quality > 0 && !isJamming && !isCriticalDegradation && (
              <g transform={`translate(${width/2}, ${height - 62})`}>
                <line x1="0" y1="0" x2="0" y2="50" stroke="#05b6d4" strokeWidth="0.5" strokeDasharray="2,2" />
                <text x="3" y="10" className="fill-cyan-400 font-mono text-[6px] tracking-widest">FC: {carrierFrequency}</text>
              </g>
            )}
          </svg>

          {/* Live frequency labels at bottom */}
          <div className="flex items-center justify-between text-[6.5px] font-mono text-slate-500 uppercase tracking-wider relative z-20">
            <span>U_FC: 14.00 GHz</span>
            <span className={`font-extrabold ${isCriticalDegradation ? 'text-red-400' : 'text-slate-300'}`}>
              {isCriticalDegradation ? 'CARRIER LOCK DEGRADED' : 'Uplink Peak Center'}
            </span>
            <span>U_FC: 14.50 GHz</span>
          </div>
        </div>
      )}

      {/* 60-Second Telemetry Statistical Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 font-mono">
        <div className="bg-slate-900/60 border border-slate-800/80 p-2 rounded-xl">
          <span className="text-[7px] text-slate-500 uppercase block tracking-wider">CURRENT SNR</span>
          <div className="flex items-baseline space-x-1">
            <strong className={`text-xs font-black ${stats.currentSnr < 5.0 ? 'text-red-400' : stats.currentSnr < 10.0 ? 'text-amber-400' : 'text-cyan-400'}`}>
              {stats.currentSnr.toFixed(2)}
            </strong>
            <span className="text-[8px] text-slate-500">dB</span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 p-2 rounded-xl">
          <span className="text-[7px] text-slate-500 uppercase block tracking-wider">60S AVG SNR</span>
          <div className="flex items-baseline space-x-1">
            <strong className="text-xs font-black text-slate-300">
              {stats.avgSnr.toFixed(2)}
            </strong>
            <span className="text-[8px] text-slate-500">dB</span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 p-2 rounded-xl">
          <span className="text-[7px] text-slate-500 uppercase block tracking-wider">60S MIN / MAX</span>
          <div className="flex items-baseline space-x-1 text-slate-300">
            <span className="text-[10px] text-red-400 font-bold">{stats.minSnr.toFixed(1)}</span>
            <span className="text-[8px] text-slate-600">/</span>
            <span className="text-[10px] text-emerald-400 font-bold">{stats.maxSnr.toFixed(1)}</span>
            <span className="text-[8px] text-slate-500">dB</span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 p-2 rounded-xl">
          <span className="text-[7px] text-slate-500 uppercase block tracking-wider">CURRENT LOSS</span>
          <div className="flex items-baseline space-x-1">
            <strong className={`text-xs font-black ${stats.currentLoss > 5.0 ? 'text-red-400' : stats.currentLoss > 1.0 ? 'text-amber-400' : 'text-slate-300'}`}>
              {stats.currentLoss.toFixed(2)}
            </strong>
            <span className="text-[8px] text-slate-500">%</span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 p-2 rounded-xl">
          <span className="text-[7px] text-slate-500 uppercase block tracking-wider">60S MAX LOSS</span>
          <div className="flex items-baseline space-x-1">
            <strong className={`text-xs font-black ${stats.maxLoss > 5.0 ? 'text-rose-400' : 'text-slate-400'}`}>
              {stats.maxLoss.toFixed(2)}
            </strong>
            <span className="text-[8px] text-slate-500">%</span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 p-2 rounded-xl">
          <span className="text-[7px] text-slate-500 uppercase block tracking-wider">LINK MARGIN</span>
          <div className="flex items-baseline space-x-1">
            <strong className={`text-xs font-black ${stats.linkMargin < 0 ? 'text-red-400' : stats.linkMargin < 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {stats.linkMargin >= 0 ? `+${stats.linkMargin.toFixed(1)}` : stats.linkMargin.toFixed(1)}
            </strong>
            <span className="text-[8px] text-slate-500">dB</span>
          </div>
        </div>
      </div>

      {/* Footer Metrics */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between font-mono text-[7px] text-slate-500 uppercase pt-1 border-t border-slate-900">
        <div className="flex items-center space-x-3">
          <span>Carrier Span: 500 MHz</span>
          <span>Resolution Bandwidth (RBW): 100 kHz</span>
          <span>Lock Threshold: 5.0 dB</span>
        </div>
        <div className="flex items-center space-x-2 mt-1 sm:mt-0">
          <span>Breach Events (60s): <strong className={stats.breachCount > 0 ? 'text-red-400' : 'text-emerald-400'}>{stats.breachCount}</strong></span>
          <span>Sampling Interval: 1.0s</span>
        </div>
      </div>
    </div>
  );
};
