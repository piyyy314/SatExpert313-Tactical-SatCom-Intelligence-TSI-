import React, { useState } from 'react';
import { Radio, ShieldAlert, Cpu, Calculator, RefreshCw, KeyRound, Wifi } from 'lucide-react';

interface LinkBudgetProps {
  distance: number; // km
  isStealthMode: boolean;
}

export const LinkBudgetCalculator: React.FC<LinkBudgetProps> = ({ distance, isStealthMode }) => {
  const [bucPower, setBucPower] = useState<number>(40); // Watts
  const [antennaGainRx, setAntennaGainRx] = useState<number>(38.5); // dBi
  const [antennaGainTx, setAntennaGainTx] = useState<number>(42.0); // dBi
  const [carrierFreq, setCarrierFreq] = useState<number>(14.25); // GHz

  // Free Space Path Loss: FSPL (dB) = 20 log10(d) + 20 log10(f) + 92.45 (where d is in km, f is in GHz)
  const calculatedFspl = (() => {
    if (distance <= 0) return 150.0;
    const fspl = 20 * Math.log10(distance) + 20 * Math.log10(carrierFreq) + 92.45;
    return Number(fspl.toFixed(2));
  })();

  const bucPowerDbi = 10 * Math.log10(bucPower);

  // Received power C (dBW) = BUC_Power_dBW + Antenna_Tx_Gain - FSPL + Antenna_Rx_Gain
  const receivedPower = (() => {
    let power = bucPowerDbi + antennaGainTx - calculatedFspl + antennaGainRx;
    if (isStealthMode) power -= 15; // Shielded absorption attenuation offset
    return Number(power.toFixed(2));
  })();

  const margin = Number((receivedPower + 120.0).toFixed(2)); // Offset relative to thermal floor receiver threshold

  return (
    <div className="p-6 bg-slate-950 border-2 border-slate-900 rounded-3xl text-slate-100 flex flex-col space-y-6 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div className="flex items-center space-x-3">
          <Calculator className="w-5 h-5 text-purple-400" />
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider font-mono">Satellite Link Budget Scientific Calculator</h3>
            <p className="text-[10px] text-slate-500 font-mono">Resolve carrier transmission path attenuation, free space path loss (FSPL), and receiver margin dynamics</p>
          </div>
        </div>
        <span className="text-[7.5px] font-mono uppercase bg-slate-900 text-purple-400 border border-purple-900/40 px-2 py-0.5 rounded">
          MATH_ENG
        </span>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left variables input */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col space-y-4">
            <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest block font-mono">Antenna & Amplifier Inputs</span>

            <div className="space-y-1">
              <div className="flex justify-between text-[7px] font-mono text-slate-500 uppercase">
                <span>Transmitter Amplifier Power</span>
                <span className="text-cyan-400 font-bold">{bucPower} Watts</span>
              </div>
              <input
                type="range"
                min={2}
                max={150}
                step={1}
                value={bucPower}
                onChange={(e) => setBucPower(parseInt(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[7px] font-mono text-slate-500 uppercase">
                <span>Parabolic Transmitter Gain (TX)</span>
                <span className="text-cyan-400 font-bold">{antennaGainTx} dBi</span>
              </div>
              <input
                type="range"
                min={20.0}
                max={55.0}
                step={0.5}
                value={antennaGainTx}
                onChange={(e) => setAntennaGainTx(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[7px] font-mono text-slate-500 uppercase">
                <span>Receiver Ground Gain (RX)</span>
                <span className="text-cyan-400 font-bold">{antennaGainRx} dBi</span>
              </div>
              <input
                type="range"
                min={20.0}
                max={55.0}
                step={0.5}
                value={antennaGainRx}
                onChange={(e) => setAntennaGainRx(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Right answers display */}
        <div className="md:col-span-7 bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="grid grid-cols-2 gap-4 text-xs font-mono font-bold uppercase">
            <div className="bg-slate-950 border border-slate-900 p-2.5 rounded-xl">
              <span className="text-[6.5px] text-slate-500 block">Atmospheric Path Distance</span>
              <span className="text-slate-200">{distance.toFixed(2)} Km</span>
            </div>
            <div className="bg-slate-950 border border-slate-900 p-2.5 rounded-xl">
              <span className="text-[6.5px] text-slate-500 block">Link Transmit Frequency</span>
              <span className="text-slate-200">{carrierFreq} GHz</span>
            </div>
          </div>

          <div className="bg-black border border-slate-900 rounded-xl p-3 space-y-2">
            <div className="flex justify-between text-[7.5px] font-mono text-slate-500 uppercase tracking-wider pb-1 border-b border-slate-950">
              <span>Calculated Loss Terms</span>
              <span>Attenuation Unit</span>
            </div>
            
            <div className="flex justify-between text-[8.5px] font-mono text-slate-300">
              <span>Broadband Free Space Attenuation (FSPL)</span>
              <span className="font-bold text-red-500">-{calculatedFspl} dB</span>
            </div>

            <div className="flex justify-between text-[8.5px] font-mono text-slate-300">
              <span>Carrier power at receiver (C)</span>
              <span className="font-bold text-cyan-400">{receivedPower} dBW</span>
            </div>
          </div>

          <div className="bg-black/60 border border-slate-900 p-3.5 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[7.5px] font-mono text-slate-500 block font-black">Coherent Link Margin Threshold</span>
              <div className="text-xl font-mono font-black text-cyan-400 flex items-baseline">
                {margin} <span className="text-xs font-normal pl-0.5 select-none">dB</span>
              </div>
            </div>

            <span>
              {margin > 6.0 ? (
                <div className="bg-emerald-950 text-emerald-400 border border-emerald-900 px-3 py-1 rounded-xl text-[8.5px] font-mono font-black uppercase tracking-wider">
                  LINK_LOCK: SECURED
                </div>
              ) : (
                <div className="bg-red-950 text-red-400 border border-red-900 px-3 py-1 rounded-xl text-[8.5px] font-mono font-black uppercase tracking-wider animate-pulse">
                  SIGNAL_DEGRADED
                </div>
              )}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
