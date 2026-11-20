import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, RotateCw, Cpu, Zap, Lock, Info, 
  Terminal, ShieldCheck, HelpCircle, ChevronRight, Hash, Activity
} from 'lucide-react';

export const GroverVisualizer: React.FC = () => {
  const [qubits, setQubits] = useState<number>(4);
  const numStates = Math.pow(2, qubits);
  
  const [markedState, setMarkedState] = useState<number>(10); // Default to |1010>
  const [amplitudes, setAmplitudes] = useState<number[]>([]);
  const [iterationCount, setIterationCount] = useState<number>(0);
  const [phaseMode, setPhaseMode] = useState<'ORACLE_PENDING' | 'DIFFUSION_PENDING'>('ORACLE_PENDING');
  
  // Simulation player state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1200); // ms per step
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Terminal log
  const [logs, setLogs] = useState<{ id: string; time: string; msg: string; type: 'info' | 'success' | 'warn' | 'quantum' }[]>([]);

  // Initialize amplitudes on mount or qubit change
  useEffect(() => {
    resetToSuperposition();
  }, [qubits]);

  const addLog = (msg: string, type: 'info' | 'success' | 'warn' | 'quantum' = 'info') => {
    const time = new Date().toLocaleTimeString([], { hour12: false });
    const id = Math.random().toString(36).substring(2, 9);
    setLogs(prev => [{ id, time, msg: msg.toUpperCase(), type }, ...prev].slice(0, 30));
  };

  const resetToSuperposition = () => {
    const initialAmplitude = 1 / Math.sqrt(numStates);
    setAmplitudes(Array(numStates).fill(initialAmplitude));
    setIterationCount(0);
    setPhaseMode('ORACLE_PENDING');
    setIsPlaying(false);
    
    // Ensure marked state is in-bounds
    const safeMarked = markedState >= numStates ? numStates - 1 : markedState;
    setMarkedState(safeMarked);

    setLogs([]);
    addLog(`Quantum register initialized with ${qubits} Qu-registries.`, 'quantum');
    addLog(`Hadamard Transform applied. Equal superposition of ${numStates} states created.`, 'info');
    addLog(`Amplitudes set uniformly to 1/√${numStates} ≈ ${initialAmplitude.toFixed(4)}.`, 'info');
  };

  // 1. Oracle: Inverts phase of marked state
  const applyOracle = () => {
    if (phaseMode !== 'ORACLE_PENDING') {
      addLog(`Sequencing Out of Sync. Expected Diffusion reflection before re-applying Oracle.`, 'warn');
    }
    
    setAmplitudes(prev => {
      const next = [...prev];
      next[markedState] = -next[markedState];
      return next;
    });

    const binaryMarked = markedState.toString(2).padStart(qubits, '0');
    addLog(`Oracle Gate triggered for state |${binaryMarked}⟩. Phase shifted 180° (amplitude inverted)`, 'quantum');
    setPhaseMode('DIFFUSION_PENDING');
  };

  // 2. Grover Diffusion: Reflects all amplitudes about the mean
  const applyDiffusion = () => {
    if (phaseMode !== 'DIFFUSION_PENDING') {
      addLog(`Sequencing Out of Sync. Expected Oracle phase inversion before applying Diffusion.`, 'warn');
    }

    setAmplitudes(prev => {
      // Calculate mean of amplitudes
      const mean = prev.reduce((sum, val) => sum + val, 0) / numStates;
      // Grover reflection: a_i_new = 2*mean - a_i
      const next = prev.map(val => 2 * mean - val);
      return next;
    });

    setIterationCount(prev => prev + 1);
    setPhaseMode('ORACLE_PENDING');
    
    // Read the success value of finding marked state
    setTimeout(() => {
      setAmplitudes(curr => {
        const pSuccess = Math.pow(curr[markedState], 2);
        const binaryMarked = markedState.toString(2).padStart(qubits, '0');
        addLog(`Diffusion operator reflected about mean of ${(curr.reduce((a, b) => a + b, 0) / numStates).toFixed(4)}.`, 'quantum');
        addLog(`Grover Iteration #${iterationCount + 1} completed. Target state |${binaryMarked}⟩ probability boosted to ${(pSuccess * 100).toFixed(2)}%.`, pSuccess > 0.8 ? 'success' : 'info');
        
        // Highlight danger of over-rotation
        const optimalSteps = Math.floor((Math.PI / 4) * Math.sqrt(numStates));
        if (iterationCount + 1 > optimalSteps) {
          addLog(`[WARNING] OVER-ROTATION DETECTED: Exceeded ideal steps (${optimalSteps}). Target amplitude is decalcifying!`, 'warn');
        }
        return curr;
      });
    }, 50);
  };

  // Automatically execute full iteration cycle
  const runFullIteration = () => {
    if (phaseMode === 'ORACLE_PENDING') {
      applyOracle();
      // Apply diffusion shortly after for a staged visual sequence
      setTimeout(() => {
        applyDiffusion();
      }, playbackSpeed / 2.5);
    } else {
      applyDiffusion();
    }
  };

  // Handle Play/Pause
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        runFullIteration();
      }, playbackSpeed);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, phaseMode, markedState, numStates, qubits, playbackSpeed, iterationCount]);

  // Calculate stats
  const meanAmplitude = amplitudes.reduce((sum, v) => sum + v, 0) / numStates;
  const successProb = amplitudes.length > 0 ? Math.pow(amplitudes[markedState], 2) : 0;
  const optimalSteps = Math.floor((Math.PI / 4) * Math.sqrt(numStates));

  // Build binary labels
  const getBinaryLabel = (index: number) => {
    return index.toString(2).padStart(qubits, '0');
  };

  // Quick preset targets
  const handleSelectMarked = (idx: number) => {
    if (idx >= 0 && idx < numStates) {
      setMarkedState(idx);
      addLog(`Target database key updated to index ${idx} (|${getBinaryLabel(idx)}⟩).`, 'info');
      // If we already iterated, explain that resetting is recommended for accurate results.
      if (iterationCount > 0) {
        addLog(`Recommended: Click 'Hadamard Reset' to reset amplitudes for new search target.`, 'warn');
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 bg-slate-950/95 border-2 border-slate-900 rounded-3xl text-slate-100 select-none animate-in fade-in slide-in-from-bottom-6">
      {/* LEFT COLUMN: Grover visual graph and spectrum status */}
      <div className="lg:col-span-8 space-y-6 flex flex-col justify-between">
        
        {/* Graph Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-900 pb-4 gap-4">
          <div className="flex items-center space-x-3">
            <Cpu className="w-5 h-5 text-purple-400 animate-pulse" />
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider font-mono">Grover's Quantum Search Engine</h2>
              <p className="text-[10px] text-slate-500 font-mono">Simulative unstructured quantum database brute-force (O(√N) Complexity)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-[10px] font-mono text-right hidden sm:block">
              <span className="text-slate-500">Ideal Steps:</span>{' '}
              <span className="text-cyan-400 font-bold">{optimalSteps} iterations</span>
            </div>
          </div>
        </div>

        {/* Amplitude bars chart screen */}
        <div className="p-4 bg-black border border-slate-900 rounded-2xl relative min-h-[300px] flex flex-col justify-between overflow-hidden">
          
          {/* Faint Grid backings */}
          <div className="absolute inset-x-0 top-1/2 h-[1px] bg-slate-900/60 border-dashed z-0"></div>
          <div className="absolute inset-x-0 top-1/4 h-[0.5px] bg-slate-900/30 border-dashed z-0"></div>
          <div className="absolute inset-x-0 top-3/4 h-[0.5px] bg-slate-900/30 border-dashed z-0"></div>

          {/* Active Mean line layout indicator */}
          {amplitudes.length > 0 && (
            <div 
              className="absolute left-0 right-0 border-t border-emerald-500/40 z-10 transition-all duration-300 pointer-events-none"
              style={{
                // Scale from -1..1 onto bottom..top percentage
                bottom: `${((meanAmplitude + 1) / 2) * 100}%`
              }}
            >
              <span className="absolute right-2 -top-4 text-[7px] font-mono font-bold text-emerald-400 bg-black/80 px-1 py-0.5 rounded border border-emerald-950">
                MEAN AMPLITUDE: {meanAmplitude.toFixed(4)}
              </span>
            </div>
          )}

          {/* Graph bars representation */}
          <div className="flex-grow flex items-end justify-between gap-1 sm:gap-2 pt-6 pb-2 z-10 min-h-[220px]">
            {amplitudes.map((val, idx) => {
              const isTarget = idx === markedState;
              const prob = Math.pow(val, 2);
              
              // Map -1..1 to 0..100% height relative to middle
              // But standard visualization can display simple absolute or negative bar representation relative to baseline
              const heightPercent = Math.min(100, Math.abs(val) * 150); // Amplify for visibility
              const isNegative = val < 0;

              return (
                <div 
                  key={idx} 
                  onClick={() => handleSelectMarked(idx)}
                  className="flex-grow flex flex-col items-center group cursor-pointer h-full justify-end relative"
                >
                  {/* Tooltip on Hover */}
                  <div className="absolute bottom-full mb-2 bg-slate-900 border border-slate-800 p-2 rounded-xl text-[8px] font-mono text-slate-300 hidden group-hover:flex flex-col space-y-1 shadow-2xl z-20 pointer-events-none text-center min-w-[70px]">
                    <span className="text-white font-bold">|{getBinaryLabel(idx)}⟩</span>
                    <span>Amp: {val.toFixed(4)}</span>
                    <span className="text-cyan-400 font-bold">P: {(prob*100).toFixed(1)}%</span>
                  </div>

                  {/* Active bar */}
                  <div className="w-full flex flex-col items-center justify-center relative">
                    <div 
                      style={{ height: `${heightPercent}px` }}
                      className={`w-full rounded-md transition-all duration-300 ${
                        isTarget 
                          ? isNegative 
                            ? 'bg-gradient-to-t from-red-600 via-orange-500 to-red-400 shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                            : 'bg-gradient-to-t from-purple-600 via-indigo-500 to-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)] border border-cyan-300'
                          : isNegative 
                            ? 'bg-red-900/60 border border-red-800' 
                            : 'bg-slate-800/80 hover:bg-slate-700 border border-slate-900'
                      }`}
                    >
                      {/* Interactive flare bar inside */}
                      {isTarget && (
                        <div className="w-full h-1 bg-white/40 rounded-t"></div>
                      )}
                    </div>
                  </div>

                  {/* Highlight indicators */}
                  <div className="text-[7.5px] font-mono mt-1 text-slate-500 group-hover:text-cyan-400 select-all font-bold">
                    {idx}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sub-label indices */}
          <div className="flex items-center justify-between text-[7px] font-mono text-slate-500 select-none border-t border-slate-900/60 pt-2 uppercase">
            <span>DATABASE STATE SPACE INDEX</span>
            <span className="text-cyan-500">⭐ MARKED TARGET STATE: |{getBinaryLabel(markedState)}⟩</span>
            <span>Total: {numStates} States</span>
          </div>
        </div>

        {/* Dashboard metrics of amplitude and probability */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-950 border border-slate-900 p-3 rounded-2xl flex flex-col justify-between">
            <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-wider font-mono">Success Probability</span>
            <span className={`text-lg font-black font-mono transition duration-300 ${successProb > 0.8 ? 'text-emerald-400' : 'text-cyan-400'}`}>
              {(successProb * 100).toFixed(2)}%
            </span>
          </div>

          <div className="bg-slate-950 border border-slate-900 p-3 rounded-2xl flex flex-col justify-between">
            <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-wider font-mono">Grover Iterations</span>
            <div className="flex items-baseline space-x-1.5 font-mono">
              <span className="text-lg font-black text-slate-200">{iterationCount}</span>
              <span className="text-[8px] text-slate-500">/ max optimal {optimalSteps}</span>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-900 p-3 rounded-2xl flex flex-col justify-between">
            <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-wider font-mono">Next Circuit Stage</span>
            <span className={`text-[10px] font-black uppercase tracking-widest font-mono ${
              phaseMode === 'ORACLE_PENDING' ? 'text-purple-400' : 'text-amber-400'
            }`}>
              {phaseMode.replace('_', ' ')}
            </span>
          </div>

          <div className="bg-slate-950 border border-slate-900 p-3 rounded-2xl flex flex-col justify-between">
            <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-wider font-mono">Unstructured Speedup</span>
            <span className="text-[10px] font-bold text-slate-300 font-mono">
              O(√N) vs O(N) Classic
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Interactive Control center and Quantum logs */}
      <div className="lg:col-span-4 space-y-6 flex flex-col justify-between">
        <div className="space-y-6">
          
          {/* System settings and presets */}
          <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-3xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-900 pb-2">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <Hash className="w-3.5 h-3.5 text-slate-500" />
                <span>Algorithm Parameters</span>
              </span>
              <span className="text-[8px] text-slate-500 font-mono">G_REG_CONFIG</span>
            </div>

            {/* Qubits size switch */}
            <div className="flex flex-col space-y-1.5">
              <span className="text-[7.5px] font-black uppercase text-slate-500 tracking-wider">Number of Qubits</span>
              <div className="grid grid-cols-3 gap-2">
                {[3, 4, 5].map(q => (
                  <button
                    key={q}
                    onClick={() => setQubits(q)}
                    className={`py-1.5 rounded-xl font-mono text-[10px] font-black border transition ${
                      qubits === q
                        ? 'bg-purple-950/65 border-purple-500 text-purple-400'
                        : 'bg-slate-950 border-slate-900/60 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {q} Qubits ({Math.pow(2, q)} states)
                  </button>
                ))}
              </div>
            </div>

            {/* Target selection */}
            <div className="flex flex-col space-y-1.5">
              <span className="text-[7.5px] font-black uppercase text-slate-500 tracking-wider">Target Key Index Select</span>
              <select
                value={markedState}
                onChange={(e) => handleSelectMarked(parseInt(e.target.value))}
                className="w-full bg-slate-950 text-xs font-mono py-2 px-3 border border-slate-900 rounded-xl focus:outline-none focus:border-cyan-500 text-slate-200 cursor-pointer"
              >
                {[...Array(numStates)].map((_, idx) => (
                  <option key={idx} value={idx}>
                    Index {idx} (|{getBinaryLabel(idx)}⟩)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Interactive controls */}
          <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-3xl space-y-4">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5 text-slate-500" />
              <span>Step-by-Step Operator Console</span>
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={applyOracle}
                disabled={isPlaying}
                className="py-2.5 px-3 bg-fuchsia-950/45 hover:bg-fuchsia-900 border border-fuchsia-800 text-fuchsia-400 rounded-xl font-mono text-[9px] font-black uppercase tracking-widest transition disabled:opacity-40"
                title="Shift phase of marked element by 180°"
              >
                1. Apply Oracle
              </button>
              <button
                onClick={applyDiffusion}
                disabled={isPlaying}
                className="py-2.5 px-3 bg-sky-950/45 hover:bg-sky-900 border border-sky-800 text-sky-400 rounded-xl font-mono text-[9px] font-black uppercase tracking-widest transition disabled:opacity-40"
                title="Reflect amplitudes about the current mean"
              >
                2. Apply Diffusion
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={runFullIteration}
                className="flex-grow py-2.5 bg-cyan-950/50 hover:bg-cyan-900 border border-cyan-800 text-cyan-400 rounded-xl font-mono text-[9px] font-black uppercase tracking-widest transition"
              >
                Run Iteration (1 & 2)
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`p-2.5 rounded-xl border transition ${
                  isPlaying 
                    ? 'bg-amber-950/40 border-amber-500 text-amber-400 animate-pulse' 
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
            </div>

            <button
              onClick={resetToSuperposition}
              className="w-full py-2 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl font-mono text-[8px] font-black uppercase tracking-widest transition"
            >
              Hadamard Reset (|s⟩)
            </button>
          </div>
        </div>

        {/* Live Quantum Execution Log Console */}
        <div className="flex flex-col space-y-1">
          <div className="flex items-center justify-between text-[8px] font-black text-slate-500 uppercase tracking-wider font-mono">
            <span className="flex items-center space-x-1.5">
              <Terminal className="w-3.5 h-3.5 text-slate-600" />
              <span>Quantum Operator Terminal</span>
            </span>
            <span>Realtime</span>
          </div>

          <div className="h-44 bg-black border border-slate-900 rounded-2xl p-3 overflow-y-auto space-y-1.5 scrollbar-thin">
            {logs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[7.5px] font-mono text-slate-600 uppercase tracking-widest">
                No telemetry logged for Grover registers
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="text-[7.5px] font-mono flex items-start space-x-1.5 leading-snug">
                  <span className="text-slate-600 font-bold whitespace-nowrap">{log.time}</span>
                  <span className={`font-black uppercase text-[6px] px-1 py-[0.1px] rounded ${
                    log.type === 'warn'
                      ? 'bg-amber-950 border border-amber-900 text-amber-500'
                      : log.type === 'success'
                      ? 'bg-emerald-950 border border-emerald-900 text-emerald-400'
                      : log.type === 'quantum'
                      ? 'bg-purple-950 border border-purple-900 text-purple-400'
                      : 'bg-slate-900 border border-slate-800 text-cyan-400'
                  }`}>
                    {log.type}
                  </span>
                  <span className="text-slate-300 break-normal [letter-spacing:-0.01em]">
                    {log.msg}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
