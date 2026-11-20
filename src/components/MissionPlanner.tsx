import React, { useState } from 'react';
import { Target, RefreshCw, Cpu, FastForward, Play, Pause, ShieldCheck, ListTodo } from 'lucide-react';

interface MissionGoal {
  id: string;
  task: string;
  priority: 'CRITICAL' | 'HIGH' | 'LOW';
  done: boolean;
}

export const MissionPlanner: React.FC = () => {
  const [goals, setGoals] = useState<MissionGoal[]>([
    { id: '1', task: 'Calibrate VSAT high bias amplification transceivers', priority: 'CRITICAL', done: false },
    { id: '2', task: 'Scan localized Ku-band sub-nets for active carriers', priority: 'HIGH', done: true },
    { id: '3', task: 'Rotate post-quantum laser communication tokens', priority: 'LOW', done: false },
  ]);
  const [logs, setLogs] = useState<string[]>(['[PLANNER] Tactical mission target layout synced.']);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString([], { hour12: false })}] ${msg.toUpperCase()}`, ...prev].slice(0, 5));
  };

  const toggleGoal = (id: string) => {
    setGoals(prev => prev.map(g => {
      if (g.id === id) {
        const nextDone = !g.done;
        addLog(`Goal "${g.task.slice(0, 20)}..." shifted to ${nextDone ? 'CLOSED' : 'PENDING'}`);
        return { ...g, done: nextDone };
      }
      return g;
    }));
  };

  return (
    <div className="p-6 bg-slate-950 border-2 border-slate-900 rounded-3xl text-slate-100 flex flex-col space-y-6 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div className="flex items-center space-x-3">
          <ListTodo className="w-5 h-5 text-cyan-400 animate-pulse" />
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider font-mono">Mission Control Objectives & Target Planner</h3>
            <p className="text-[10px] text-slate-500 font-mono font-mono">Define, organize, and execute strategic target objectives to secure cross-link satellite coverage parameters</p>
          </div>
        </div>
        <span className="text-[7.5px] font-mono uppercase bg-slate-900 text-cyan-400 border border-cyan-val px-2 py-0.5 rounded">
          MISSION_GRID
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Goals checklist left */}
        <div className="md:col-span-8 space-y-4 font-mono">
          <span className="text-[8px] font-black uppercase text-slate-500 block tracking-widest">Active Operations Checklist</span>

          <div className="space-y-3">
            {goals.map((g) => (
              <div 
                key={g.id} 
                onClick={() => toggleGoal(g.id)}
                className={`p-3.5 border rounded-2xl flex items-center justify-between gap-4 cursor-pointer select-none transition ${
                  g.done 
                    ? 'bg-emerald-950/15 border-emerald-900/50 text-emerald-400' 
                    : 'bg-slate-950 border-slate-900 text-slate-500 hover:border-slate-800'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={g.done}
                    onChange={() => {}} // toggled via parent div click safely
                    className="accent-emerald-500 h-3.5 w-3.5 bg-black cursor-pointer rounded"
                  />
                  <span className={`text-[10px] font-medium leading-relaxed uppercase ${g.done ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                    {g.task}
                  </span>
                </div>

                <span className={`text-[7px] px-2 py-0.5 border rounded font-semibold ${
                  g.priority === 'CRITICAL' ? 'border-red-950 text-red-500 bg-red-950/5' : 'border-slate-800 text-slate-500'
                }`}>
                  {g.priority}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Audit logs stats right */}
        <div className="md:col-span-4 bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-4 font-mono">
            <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest block">Planner Audit Logs</span>

            <div className="bg-black border border-slate-900 p-3 h-44 rounded-xl overflow-y-auto scrollbar-none text-[7px] text-slate-400 space-y-1">
              {logs.map((log, idx) => (
                <div key={idx} className="truncate">
                  <span className="text-cyan-500 pr-1">▶</span> {log}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-900 pt-3 flex items-center justify-between text-[7px] font-mono text-slate-700 uppercase">
            <span>Objectives verified and synced</span>
            <span className="text-emerald-400 font-black flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> CONFIRMED
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
