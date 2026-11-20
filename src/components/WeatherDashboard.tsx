import React from 'react';
import { Cloud, CloudFog, CloudLightning, Sun, Compass, Wind } from 'lucide-react';
import { Coordinates, WeatherCondition } from '../types.ts';

interface WeatherProps {
  weather: WeatherCondition;
  loc: Coordinates;
  satName: string;
}

export const WeatherDashboard: React.FC<WeatherProps> = ({ weather, loc, satName }) => {
  // Model attenuation stats dynamically
  let attenuation = 0.2; // dB
  let humidity = 12; // %
  let transmittance = 99; // %
  let statusText = 'Excellent Transmittance';

  if (weather === 'OVERCAST') {
    attenuation = 1.8;
    humidity = 64;
    transmittance = 88;
    statusText = 'Minor Gas Absorption';
  } else if (weather === 'LIGHT_RAIN') {
    attenuation = 5.2;
    humidity = 92;
    transmittance = 62;
    statusText = 'Precipitation Scatter';
  } else if (weather === 'HEAVY_STORM') {
    attenuation = 14.8;
    humidity = 99;
    transmittance = 15;
    statusText = 'Severe Rain Fade Alert';
  }

  return (
    <div className="p-4 bg-slate-950/90 border-2 border-slate-800 rounded-3xl flex flex-col space-y-3.5 select-none shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
        <label className="text-[8px] font-black uppercase tracking-widest text-slate-500 flex items-center space-x-1.5">
          <CloudFog className="w-3.5 h-3.5 text-slate-600" />
          <span>Local Atmospheric Analysis</span>
        </label>
        <span className="text-[7.5px] font-mono uppercase tracking-widest text-slate-500">
          ITU_KU_MODEL
        </span>
      </div>

      {/* Main Meteorological Stats */}
      <div className="grid grid-cols-2 gap-3">
        {/* Weather status block */}
        <div className="bg-slate-950 border border-slate-900 rounded-2xl p-3 flex space-x-3 items-center justify-start">
          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
            {weather === 'CLEAR' && <Sun className="w-5 h-5 text-amber-400 animate-pulse" />}
            {weather === 'OVERCAST' && <Cloud className="w-5 h-5 text-slate-400" />}
            {weather === 'LIGHT_RAIN' && <Cloud className="w-5 h-5 text-cyan-400 animate-bounce" />}
            {weather === 'HEAVY_STORM' && <CloudLightning className="w-5 h-5 text-red-500 animate-pulse" />}
          </div>
          <div className="flex flex-col">
            <span className="text-[7px] font-mono text-slate-500 uppercase tracking-widest">Atmosphere</span>
            <span className="text-[11px] font-black uppercase text-slate-100">{weather}</span>
          </div>
        </div>

        {/* Rain fade value */}
        <div className="bg-slate-950 border border-slate-900 rounded-2xl p-3 flex flex-col justify-between">
          <span className="text-[7px] font-mono text-slate-500 uppercase tracking-widest">Est. Path Loss</span>
          <span className={`text-[12px] font-black font-mono tracking-tight ${
            weather === 'HEAVY_STORM' ? 'text-red-400' : (weather === 'LIGHT_RAIN' ? 'text-amber-400' : 'text-emerald-400')
          }`}>
            +{attenuation.toFixed(1)} <span className="text-[8px] font-normal text-slate-500">dB</span>
          </span>
        </div>
      </div>

      {/* Transmittance progress indicators */}
      <div className="bg-slate-950 border border-slate-900 rounded-2xl p-3 space-y-2">
        <div className="flex items-center justify-between text-[8px] font-mono text-slate-500">
          <span className="uppercase">Link Transmittance Grid:</span>
          <span className="text-slate-300 font-bold">{transmittance}%</span>
        </div>
        
        {/* Simple Progress Bar */}
        <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-900">
          <div 
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              weather === 'HEAVY_STORM' ? 'bg-red-500' : (weather === 'LIGHT_RAIN' ? 'bg-amber-400' : 'bg-cyan-500')
            }`}
            style={{ width: `${transmittance}%` }}
          />
        </div>

        <p className="text-[7.5px] font-mono text-slate-400 uppercase tracking-wider italic text-center mt-1">
          {statusText} targeting {satName}
        </p>
      </div>
    </div>
  );
};
