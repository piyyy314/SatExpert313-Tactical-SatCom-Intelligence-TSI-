import React, { useState } from 'react';
import { Target, RefreshCw, Cpu, Play, Terminal, ShieldCheck, Code, AlertTriangle } from 'lucide-react';

interface ScriptProps {
  addMissionLog: (detail: string, status?: 'active' | 'success' | 'warning') => void;
}

export const TacticalScriptEnv: React.FC<ScriptProps> = ({ addMissionLog }) => {
  const [scriptText, setScriptText] = useState<string>(
    `// Tactical automation script template\nfunction automateSpectrumSweep() {\n  const freq = 1420.4; \n  tuneTransceiver(freq);\n  return "SWEEP_COMPLETE";\n}`
  );
  const [isBuilding, setIsBuilding] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>(['[SCRIPT_ENV] Javascript/V8 sandbox automation compiler ready.']);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString([], { hour12: false })}] ${msg.toUpperCase()}`, ...prev].slice(0, 10));
  };

  const handleCompileScript = () => {
    if (isBuilding) return;
    setIsBuilding(true);
    addLog(`Reading automation script bytes...`);
    addMissionLog(`SCRIPT_BUILD: compiling tactical automation loops`, 'active');

    setTimeout(() => {
      addLog(`Analyzing AST trees. Validating sandboxed runtime limits...`);
    }, 500);

    setTimeout(() => {
      setIsBuilding(false);
      addLog(`COMPILATION SUCCESSFUL. EXECUTABLE BUFFER LOCKED.`);
      addMissionLog(`SCRIPT_BUILD_SUCCESS: compiled automation loops correctly`, 'success');
    }, 1200);
  };

  return (
    <div className="p-6 bg-slate-950 border-2 border-slate-900 rounded-3xl text-slate-100 flex flex-col space-y-6 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div className="flex items-center space-x-3">
          <Code className="w-5 h-5 text-cyan-400 animate-pulse" />
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider font-mono">Tactical Script Automation Studio</h3>
            <p className="text-[10px] text-slate-500 font-mono">Write, validate, and compile custom spectrum sweeps and telemetry automation scripts for local terminal controllers</p>
          </div>
        </div>
        <span className="text-[7.5px] font-mono uppercase bg-slate-900 text-cyan-400 border border-cyan-900/40 px-2 py-0.5 rounded">
          SCRIPT_V8
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Editor window left */}
        <div className="lg:col-span-8 bg-black border border-slate-900 rounded-2xl p-4 flex flex-col justify-between h-96">
          <div className="flex justify-between items-center pb-2 border-b border-slate-900">
            <span className="text-[8px] font-black uppercase text-slate-400 font-mono">TypeScript / ES6 Source Input</span>
            <span className="text-[7.5px] font-mono text-slate-500">AUTOMATION_SANDBOX_V2</span>
          </div>

          <textarea
            value={scriptText}
            onChange={(e) => setScriptText(e.target.value)}
            disabled={isBuilding}
            className="flex-grow bg-slate-950 text-xs font-mono text-cyan-300 p-3 rounded-xl border border-slate-900 focus:outline-none focus:border-cyan-500 resize-none my-3 select-all leading-relaxed whitespace-pre"
          />

          <button
            onClick={handleCompileScript}
            disabled={isBuilding}
            className={`w-full py-2.5 rounded-xl border text-[9px] font-mono font-black uppercase tracking-widest transition ${
              isBuilding
                ? 'bg-cyan-950 border-cyan-500 text-slate-200 animate-pulse'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-cyan-400'
            }`}
          >
            {isBuilding ? 'Validating Abstract Syntax Trees...' : 'Compile and Load Code'}
          </button>
        </div>

        {/* Console logs right */}
        <div className="lg:col-span-4 bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-4 font-mono">
            <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest block">Compiler Reports</span>

            <div className="bg-black border border-slate-900 p-3 h-52 rounded-xl overflow-y-auto scrollbar-none text-[7px] text-slate-400 space-y-1">
              {logs.map((log, idx) => (
                <div key={idx} className="truncate">
                  <span className="text-cyan-500 pr-1">▶</span> {log}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-900 pt-3 flex items-center justify-between text-[7px] font-mono text-slate-700 uppercase">
            <span>Sandboxed execution bounds active</span>
            <span className="text-emerald-400 font-black flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> SECURE HANDSHAKES COMPLETE
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
