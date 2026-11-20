import React, { useState, useEffect } from 'react';
import { Cpu, BrainCircuit, Activity, RefreshCw, Zap, ShieldAlert, Check } from 'lucide-react';

interface LayerState {
  name: string;
  weight: number;
  bias: number;
  status: 'OPTIMIZED' | 'DRIFTING' | 'CALIBRATING';
}

export const NeuralProcessor: React.FC = () => {
  const [layers, setLayers] = useState<LayerState[]>([
    { name: 'Input S-Band Vector Weight', weight: 0.882, bias: 0.12, status: 'OPTIMIZED' },
    { name: 'Hadamard Interference Masker', weight: 0.415, bias: -0.05, status: 'OPTIMIZED' },
    { name: 'Multipath Echo Rejection filter', weight: 0.991, bias: 0.35, status: 'CALIBRATING' },
    { name: 'FEC Scrubber Layer Weight', weight: 0.742, bias: 0.08, status: 'OPTIMIZED' },
  ]);

  const [epoch, setEpoch] = useState<number>(3120);
  const [learningRate, setLearningRate] = useState<number>(0.005);
  const [lossRate, setLossRate] = useState<number>(0.014);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>(['[NEURAL_ENGINE] Model loaded: TSI-Scrubber-V3.9', '[NEURAL_ENGINE] Core temperature nominal 41.2C.']);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString([], { hour12: false })}] ${msg.toUpperCase()}`, ...prev].slice(0, 10));
  };

  const handleRunTrain = () => {
    if (isTraining) return;
    setIsTraining(true);
    addLog('Initiating epoch sweep. Updating layer backpropagation vectors...');
    
    let counter = 0;
    const interval = setInterval(() => {
      setLossRate(prev => Math.max(0.001, prev - (prev * 0.15)));
      setEpoch(prev => prev + 120);
      setLayers(curr => curr.map(l => ({
        ...l,
        weight: Number((l.weight + (Math.random() - 0.5) * 0.02).toFixed(4)),
        bias: Number((l.bias + (Math.random() - 0.5) * 0.01).toFixed(4)),
        status: Math.random() > 0.82 ? 'CALIBRATING' : 'OPTIMIZED'
      })));
      counter++;
      if (counter >= 6) {
        clearInterval(interval);
        setIsTraining(false);
        addLog('Training cycle finalized. Minimal convergence threshold reached.');
      }
    }, 400);
  };

  return (
    <div className="p-6 bg-slate-950 border-2 border-slate-900 rounded-3xl text-slate-100 flex flex-col space-y-6 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div className="flex items-center space-x-3">
          <BrainCircuit className="w-5 h-5 text-purple-400 animate-pulse" />
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider font-mono">Cognitive Neural Signal Processor</h3>
            <p className="text-[10px] text-slate-500 font-mono">Cybernetic deep convolutional backpropagation filters for de-noising high fidelity telemetry</p>
          </div>
        </div>
        <span className="text-[7.5px] font-mono uppercase bg-slate-900 text-purple-400 border border-purple-900/40 px-2 py-0.5 rounded">
          NEURAL_CORE
        </span>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Deep Learn controller configuration */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-2xl space-y-4">
            <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest block font-mono">Training Matrix parameters</span>
            
            <div className="space-y-1">
              <div className="flex justify-between text-[7px] font-mono text-slate-500 uppercase">
                <span>Learning Rate Step</span>
                <span className="text-cyan-400 font-bold">{learningRate}</span>
              </div>
              <input
                type="range"
                min={0.001}
                max={0.05}
                step={0.001}
                value={learningRate}
                onChange={(e) => setLearningRate(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950 border border-slate-900 p-3 rounded-xl flex flex-col justify-between">
                <span className="text-[7px] font-mono text-slate-500 uppercase block">Convergence Epochs</span>
                <span className="text-sm font-mono font-black text-slate-200">{epoch}</span>
              </div>
              <div className="bg-slate-950 border border-slate-950 p-3 rounded-xl flex flex-col justify-between">
                <span className="text-[7px] font-mono text-slate-500 uppercase block">Model L2 Loss</span>
                <span className="text-sm font-mono font-black text-rose-500">{lossRate.toFixed(5)}</span>
              </div>
            </div>

            <button
              onClick={handleRunTrain}
              disabled={isTraining}
              className={`w-full py-2.5 rounded-xl border font-mono text-[9px] uppercase tracking-widest font-black transition ${
                isTraining
                  ? 'bg-purple-950/40 border-purple-500 text-purple-400 animate-pulse'
                  : 'bg-cyan-950/50 hover:bg-cyan-900 border border-cyan-800 text-cyan-400'
              }`}
            >
              {isTraining ? 'Propagating Weights...' : 'Trigger Backprop Cycle'}
            </button>
          </div>

          <div className="bg-black border border-slate-900 rounded-2xl p-3 h-28 overflow-y-auto scrollbar-none flex flex-col justify-between">
            <span className="text-[7px] font-mono text-slate-600 uppercase tracking-widest border-b border-slate-900 pb-1 block">Telemetry Clean-Up Log</span>
            <div className="flex-grow font-mono text-[7px] text-slate-400 space-y-0.5 pt-1 overflow-y-auto">
              {logs.map((log, idx) => (
                <div key={idx} className="truncate">
                  <span className="text-cyan-500 pr-1">▶</span> {log}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Network Weights Table */}
        <div className="md:col-span-7 bg-slate-950/40 border border-slate-900 p-4 rounded-2xl space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
            <span className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Scrubber Layers Coefficients</span>
            <Activity className={`w-3.5 h-3.5 text-cyan-400 ${isTraining ? 'animate-bounce' : ''}`} />
          </div>

          <div className="space-y-2 flex-grow">
            {layers.map((l, idx) => (
              <div key={idx} className="bg-black/40 border border-slate-900 p-2.5 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[8.5px] font-mono font-bold text-slate-300">{l.name}</div>
                  <div className="text-[7px] font-mono text-slate-600 space-x-2">
                    <span>WEIGHT: {l.weight}</span>
                    <span>BIAS: {l.bias}</span>
                  </div>
                </div>

                <span className={`text-[6.5px] font-mono uppercase bg-slate-950 px-2 py-0.5 rounded border ${
                  l.status === 'OPTIMIZED'
                    ? 'border-emerald-950 text-emerald-400'
                    : 'border-amber-950 text-amber-400 animate-pulse'
                }`}>
                  {l.status}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-900 pt-3 flex items-center justify-between text-[7.5px] font-mono text-slate-600 uppercase">
            <span>MODEL COMPLIANCE</span>
            <span className="text-emerald-400 font-black flex items-center gap-1">
              <Check className="w-3 h-3" /> MODEL LOCK ATTAINED
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};
