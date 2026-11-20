import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, ShieldAlert, ShieldCheck, Search, Play, RefreshCw, 
  FileText, Code, AlertTriangle, Binary, Settings, Info, List
} from 'lucide-react';

interface YaraRule {
  id: string;
  name: string;
  description: string;
  author: string;
  meta: string;
  strings: { label: string; value: string; isHex: boolean }[];
  condition: string;
}

interface PayloadStream {
  id: string;
  name: string;
  type: 'SAFE' | 'COMPROMISED_BACKDOOR' | 'MALICIOUS_SPECTRUM_SCRIPT' | 'CUSTOM';
  content: string; // Plaintext or hex data representation
  hexDump: { offset: string; hex: string; ascii: string }[];
}

const YARA_RULES_PRESETS: YaraRule[] = [
  {
    id: 'rule_1',
    name: 'satcom_espionage_backdoor',
    description: 'Detects control station administrative bypasses associated with regional APT threat groups',
    author: 'CISA Space-Sec Taskforce',
    meta: 'threat_level = "CRITICAL", platform = "S-Band Transceiver"',
    strings: [
      { label: '$admin_bypass', value: 'station_override_pass', isHex: false },
      { label: '$secret_hook', value: 'admin_bypass_hndl', isHex: false },
      { label: '$payload_start', value: '7F 45 4C 46 02 01 01 00', isHex: true }
    ],
    condition: '$payload_start or ($admin_bypass and $secret_hook)'
  },
  {
    id: 'rule_2',
    name: 'telemetry_exploit_sequence',
    description: 'Detects illegal payload-tuning buffers designed to trigger memory overflows in Ku-Band receivers',
    author: 'ESA Cybersecurity DevGroup',
    meta: 'threat_level = "HIGH", class = "Receiving Buffer Exploit"',
    strings: [
      { label: '$buffer_poison', value: '90 90 90 90 CC CC CC CC', isHex: true },
      { label: '$malicious_flag', value: 'OVERFLOW_TUNE_SAT', isHex: false }
    ],
    condition: 'any of them'
  },
  {
    id: 'rule_3',
    name: 'rf_jamming_tuning_marker',
    description: 'Identifies spectral frequency sweep routines that trigger interference spikes in BUC amplifiers',
    author: 'TSI Cyber Defense Team',
    meta: 'threat_level = "MEDIUM", class = "Electronic Attack Sweeper"',
    strings: [
      { label: '$jam_func', value: 'tune_rf_jam_v2', isHex: false },
      { label: '$power_max', value: 'spectral_sweep_power', isHex: false }
    ],
    condition: '$jam_func or $power_max'
  }
];

const PAYLOAD_STREAMS_PRESETS: PayloadStream[] = [
  {
    id: 'payload_safe',
    name: 'Telemetry Downlink - Clean Frame [0xBE83]',
    type: 'SAFE',
    content: 'NOMINAL DOWNLINK STREAM CONTENT. STATION LOCK OK. POLARIZATION BALANCED. SNR IS STABLE 16.5DB. TEMPERATURE NOMINAL 42C.',
    hexDump: [
      { offset: '0x0000', hex: '4E 4F 4D 49 4E 41 4C 20 44 4F 57 4E 4C 49 4E 4B', ascii: 'NOMINAL DOWNLINK' },
      { offset: '0x0010', hex: '20 53 54 52 45 41 4D 20 43 4F 4E 54 45 4E 54 2E', ascii: ' STREAM CONTENT.' },
      { offset: '0x0020', hex: '20 53 54 41 54 49 4F 4E 20 4C 4F 43 4B 20 4F 4B', ascii: ' STATION LOCK OK' },
      { offset: '0x0030', hex: '2E 20 50 4F 4C 41 52 49 5A 41 54 49 4F 4E 20 42', ascii: '. POLARIZATION B' },
      { offset: '0x0040', hex: '41 4C 41 4E 43 45 44 2E 20 53 4E 52 20 49 53 20', ascii: 'ALANCED. SNR IS ' },
      { offset: '0x0050', hex: '53 54 41 42 4C 45 20 31 36 2E 35 44 42 2E 20 54', ascii: 'STABLE 16.5DB. T' },
      { offset: '0x0060', hex: '45 4D 50 45 52 41 54 55 52 45 20 4E 4F 4D 49 4E', ascii: 'EMPERATURE NOMIN' },
      { offset: '0x0070', hex: '41 4C 20 34 32 43 2E 00 00 00 00 00 00 00 00 00', ascii: 'AL 42C..........' }
    ]
  },
  {
    id: 'payload_compromised',
    name: 'Transceiver Command Stream - Infected [0x8FA4]',
    type: 'COMPROMISED_BACKDOOR',
    content: 'INIT REMOTE SYS ADMIN... station_override_pass ACTIVE... INJECT LOADER: admin_bypass_hndl... OK.',
    hexDump: [
      { offset: '0x0000', hex: '49 4E 49 54 20 52 45 4D 4F 54 45 20 53 59 53 20', ascii: 'INIT REMOTE SYS ' },
      { offset: '0x0010', hex: '41 44 4D 49 4E 2E 2E 2E 20 73 74 61 74 69 6F 6E', ascii: 'ADMIN... station' },
      { offset: '0x0020', hex: '5F 6F 76 65 72 72 69 64 65 5F 70 61 73 73 20 41', ascii: '_override_pass A' },
      { offset: '0x0035', hex: '43 54 49 56 45 2E 2E 2E 20 49 4E 4A 45 43 54 20', ascii: 'CTIVE... INJECT ' },
      { offset: '0x0040', hex: '4C 4F 41 44 45 52 3A 20 61 64 6D 69 6E 5F 62 79', ascii: 'LOADER: admin_by' },
      { offset: '0x0050', hex: '70 61 73 73 5F 68 6E 64 6C 2E 2E 2E 20 4F 4B 2E', ascii: 'pass_hndl... OK.' },
      { offset: '0x0060', hex: '7F 45 4C 46 02 01 01 00 EE EE FF FF 00 04 00 AA', ascii: '.ELF............' },
      { offset: '0x0070', hex: '00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00', ascii: '................' }
    ]
  },
  {
    id: 'payload_jammer',
    name: 'Ku-Band Sweep Controller - Compromised [0xCC38]',
    type: 'MALICIOUS_SPECTRUM_SCRIPT',
    content: 'RUN TACTICAL SCRIPT tune_rf_jam_v2 --power spectral_sweep_power --inject',
    hexDump: [
      { offset: '0x0000', hex: '52 55 4E 20 54 41 43 54 49 43 41 4C 20 53 43 52', ascii: 'RUN TACTICAL SCR' },
      { offset: '0x0010', hex: '49 50 54 20 74 75 6E 65 5F 72 66 5F 6A 61 6D 5F', ascii: 'IPT tune_rf_jam_' },
      { offset: '0x0020', hex: '76 32 20 2D 2D 70 4F 77 65 72 20 73 70 65 63 74', ascii: 'v2 --power spect' },
      { offset: '0x0030', hex: '72 61 6C 5F 73 77 65 65 70 5F 70 6F 77 65 72 20', ascii: 'ral_sweep_power ' },
      { offset: '0x0040', hex: '2D 2D 69 6E 6A 65 63 74 20 39 30 20 39 30 20 39', ascii: '--inject 90 90 9' },
      { offset: '0x0050', hex: '30 20 39 30 20 43 43 20 43 43 20 43 43 20 43 43', ascii: '0 90 CC CC CC CC' },
      { offset: '0x0060', hex: '00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00', ascii: '................' },
      { offset: '0x0070', hex: '00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00', ascii: '................' }
    ]
  }
];

export const YARAScanner: React.FC = () => {
  const [selectedRule, setSelectedRule] = useState<YaraRule>(YARA_RULES_PRESETS[0]);
  const [selectedPayload, setSelectedPayload] = useState<PayloadStream>(PAYLOAD_STREAMS_PRESETS[0]);
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanOffset, setScanOffset] = useState<number>(-1);
  const [logs, setLogs] = useState<{ id: string; msg: string; type: 'info' | 'success' | 'warn' | 'threat' }[]>([]);
  const [scanResults, setScanResults] = useState<{
    tripped: boolean;
    matches: { label: string; offset: string; fragment: string }[];
    evaluation: string;
  } | null>(null);

  // Custom User rules
  const [editableRuleName, setEditableRuleName] = useState<string>(selectedRule.name);
  const [editableDescription, setEditableDescription] = useState<string>(selectedRule.description);
  const [editableMeta, setEditableMeta] = useState<string>(selectedRule.meta);
  const [editableCondition, setEditableCondition] = useState<string>(selectedRule.condition);

  // Sync edits when rule selection changes
  useEffect(() => {
    setEditableRuleName(selectedRule.name);
    setEditableDescription(selectedRule.description);
    setEditableMeta(selectedRule.meta);
    setEditableCondition(selectedRule.condition);
    setScanResults(null);
    setScanOffset(-1);
    setLogs([]);
  }, [selectedRule]);

  const addLog = (msg: string, type: 'info' | 'success' | 'warn' | 'threat' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setLogs(prev => [...prev, { id, msg: msg.toUpperCase(), type }]);
  };

  const handleRunScan = () => {
    if (isScanning || isCompiling) return;
    
    // 1. Simulate Rule Compilation
    setIsCompiling(true);
    setScanResults(null);
    setScanOffset(-1);
    setLogs([]);
    
    addLog(`Initiating YARA Scanner compiler engine...`, 'info');
    setTimeout(() => {
      addLog(`Validating signature ruleset: '${editableRuleName}'`, 'info');
    }, 400);

    setTimeout(() => {
      // Basic validation check
      if (!editableRuleName || !editableCondition) {
        addLog(`Compilation Failure: Rule name or condition is empty`, 'warn');
        setIsCompiling(false);
        return;
      }
      addLog(`YARA Rule parsed. Rule '${editableRuleName}' compiled successfully.`, 'success');
      setIsCompiling(false);

      // 2. Start Payload Search
      setIsScanning(true);
      addLog(`Target payload loaded: '${selectedPayload.name}' (${selectedPayload.hexDump.length * 16} bytes)`, 'info');
      addLog(`Scanning binary frames across address space...`, 'info');
      
      // Animate sweep down rows
      let rowIdx = 0;
      const interval = setInterval(() => {
        if (rowIdx < selectedPayload.hexDump.length) {
          setScanOffset(rowIdx);
          addLog(`Scanning offset index: ${selectedPayload.hexDump[rowIdx].offset}`, 'info');
          rowIdx++;
        } else {
          clearInterval(interval);
          setIsScanning(false);
          evaluateYaraMatches();
        }
      }, 350);

    }, 1200);
  };

  const evaluateYaraMatches = () => {
    // Determine matches based on hardcoded logic for our preset payloads and active compiled rules
    const matchesList: { label: string; offset: string; fragment: string }[] = [];
    let tripped = false;

    if (selectedPayload.type === 'COMPROMISED_BACKDOOR') {
      // rule_1 should match
      if (editableRuleName === 'satcom_espionage_backdoor' || selectedRule.id === 'rule_1') {
        tripped = true;
        matchesList.push({ label: '$admin_bypass', offset: '0x0019', fragment: 'station_override_pass' });
        matchesList.push({ label: '$secret_hook', offset: '0x0048', fragment: 'admin_bypass_hndl' });
        matchesList.push({ label: '$payload_start', offset: '0x0061', fragment: '7F 45 4C 46 02 01 01 00' });
      }
    } else if (selectedPayload.type === 'MALICIOUS_SPECTRUM_SCRIPT') {
      // rule_3 or rule_2 can match
      if (editableRuleName === 'rf_jamming_tuning_marker' || selectedRule.id === 'rule_3') {
        tripped = true;
        matchesList.push({ label: '$jam_func', offset: '0x0014', fragment: 'tune_rf_jam_v2' });
        matchesList.push({ label: '$power_max', offset: '0x002B', fragment: 'spectral_sweep_power' });
      } else if (editableRuleName === 'telemetry_exploit_sequence' || selectedRule.id === 'rule_2') {
        tripped = true;
        matchesList.push({ label: '$buffer_poison', offset: '0x0055', fragment: '90 90 90 90 CC CC CC CC' });
      }
    }

    if (tripped) {
      addLog(`[ALERT] SECURITY MATCH TRIPPED: '${editableRuleName}' matched!`, 'threat');
      matchesList.forEach(m => {
        addLog(`Matched Token ${m.label} at offset ${m.offset} - Content matching: "${m.fragment}"`, 'threat');
      });
      setScanResults({
        tripped: true,
        matches: matchesList,
        evaluation: `CRITICAL SIGNATURE DETECTED. Payload contains patterns matching active APT profiles. Command recommended: Raise DEFCON, invoke stealth spectrum masking immediately.`
      });
    } else {
      addLog(`Scan Complete: Zero signature deviations found in receiver workspace. Status: optimal.`, 'success');
      setScanResults({
        tripped: false,
        matches: [],
        evaluation: 'NOMINAL COHERENCY SECURED. No malicious remote injection or administrative override bypass signatures identified inside the target firmware dump.'
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 bg-slate-950/95 border-2 border-slate-900 rounded-3xl text-slate-100 select-none animate-in fade-in slide-in-from-bottom-6">
      
      {/* LEFT COLUMN: Rule Configuration and Presets */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-slate-950 border border-slate-900 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-900 pb-2">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <Code className="w-4 h-4 text-purple-400" />
              <span>YARA Signature Rule Editor</span>
            </span>
            <span className="text-[7.5px] font-mono text-slate-500">YARA_COMPILER_V4</span>
          </div>

          {/* Rule preset dropdown */}
          <div className="flex flex-col space-y-1">
            <span className="text-[7px] font-black uppercase text-slate-500 tracking-wider">Select Signature Template</span>
            <select
              value={selectedRule.id}
              onChange={(e) => {
                const rule = YARA_RULES_PRESETS.find(r => r.id === e.target.value);
                if (rule) setSelectedRule(rule);
              }}
              className="w-full bg-slate-950 text-xs font-mono py-2 px-3 border border-slate-900 rounded-xl focus:outline-none focus:border-cyan-500 text-slate-200 cursor-pointer"
            >
              {YARA_RULES_PRESETS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.strings.length} targets)
                </option>
              ))}
            </select>
          </div>

          {/* Editable Parameters */}
          <div className="space-y-3.5">
            <div className="flex flex-col space-y-1">
              <span className="text-[7px] font-mono text-slate-500 uppercase tracking-wider">Rule Identifier</span>
              <input
                type="text"
                value={editableRuleName}
                onChange={(e) => setEditableRuleName(e.target.value)}
                className="bg-black text-[10px] font-mono px-3 py-2 rounded-lg border border-slate-900 text-slate-300 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <span className="text-[7px] font-mono text-slate-500 uppercase tracking-wider">Rule Descript</span>
              <textarea
                value={editableDescription}
                onChange={(e) => setEditableDescription(e.target.value)}
                rows={2}
                className="bg-black text-[9px] font-mono px-3 py-2 rounded-lg border border-slate-900 text-slate-400 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex flex-col space-y-1 bg-black/60 p-2.5 rounded-xl border border-slate-900">
              <span className="text-[7px] font-mono text-slate-500 uppercase tracking-widest pb-1 border-b border-slate-950">Active Signature Tokens</span>
              <div className="space-y-1.5 pt-1">
                {selectedRule.strings.map((str, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[8px] font-mono">
                    <span className="text-purple-400 font-bold">{str.label}</span>
                    <span className="text-slate-400">{str.isHex ? 'hex' : 'ascii'}: "{str.value}"</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col space-y-1">
              <span className="text-[7px] font-mono text-slate-500 uppercase tracking-wider">Logic Condition</span>
              <input
                type="text"
                value={editableCondition}
                onChange={(e) => setEditableCondition(e.target.value)}
                className="bg-black text-[10px] font-mono px-3 py-2 rounded-lg border border-slate-900 text-purple-300 focus:outline-none focus:border-cyan-500 font-bold"
              />
            </div>
          </div>
        </div>

        {/* Tactical YARA guide context info */}
        <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col space-y-2">
          <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 flex items-center space-x-1">
            <Info className="w-3.5 h-3.5 text-slate-500" />
            <span>Tactical YARA Operations</span>
          </span>
          <p className="text-[7.5px] font-mono text-slate-400 leading-relaxed uppercase tracking-wider">
            Signature detection patterns are verified directly inside stream payloads to protect control terminals against cyber intrusions. In stealth profiles, passive checking prevents hostile tracking.
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN: Hex dump and Interactive scanning console */}
      <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
        
        {/* Memory Buffer Target Select */}
        <div className="bg-slate-950 border border-slate-900 rounded-2xl p-4 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <Binary className="w-4 h-4 text-cyan-400" />
              <span>Downlink Stream Buffer Target</span>
            </span>
            <span className="text-[7px] font-mono text-slate-500 uppercase">SYS_MEM_DUMP</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {PAYLOAD_STREAMS_PRESETS.map((pst) => (
              <button
                key={pst.id}
                onClick={() => {
                  setSelectedPayload(pst);
                  setScanResults(null);
                  setScanOffset(-1);
                  setLogs([]);
                }}
                className={`p-2.5 rounded-xl border flex flex-col items-start text-left space-y-1 transition ${
                  selectedPayload.id === pst.id
                    ? pst.type === 'SAFE'
                      ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400'
                      : 'bg-red-950/40 border-red-500 text-red-400'
                    : 'bg-slate-950 border-slate-900/60 text-slate-500 hover:text-slate-300'
                }`}
              >
                <span className="text-[7.5px] font-black uppercase tracking-wider truncate w-full">{pst.name.split(' - ')[0]}</span>
                <span className="text-[6.5px] font-mono uppercase tracking-widest">{pst.type}</span>
              </button>
            ))}
          </div>

          {/* HEX DUMP ARRAY SCREEN */}
          <div className="bg-black border border-slate-900 rounded-xl p-3 h-52 overflow-y-auto scrollbar-thin space-y-0.5 relative">
            {/* Horizontal sweep indicator bar */}
            {isScanning && scanOffset >= 0 && (
              <div 
                className="absolute left-0 right-0 h-6 bg-cyan-500/5 border-y border-cyan-500/20 pointer-events-none transition-all duration-300"
                style={{ top: `${(scanOffset * 24) + 12}px` }}
              />
            )}

            <div className="flex items-center text-[7px] font-mono text-slate-600 uppercase pb-1 border-b border-slate-900 mb-1 tracking-widest">
              <span className="w-12">Offset</span>
              <span className="flex-grow text-center">Hexadecimal Array Buffer Bytes</span>
              <span className="w-24 text-right">ASCII Frame</span>
            </div>

            {selectedPayload.hexDump.map((row, idx) => {
              const isSweeping = idx === scanOffset;
              
              // Determine if a substring match should highlight inside this hex row
              // Note: For simple visual simulation, highlight specific offsets
              const hasMatchHighlight = scanResults?.tripped && (
                (selectedPayload.type === 'COMPROMISED_BACKDOOR' && idx >= 1 && idx <= 5) || 
                (selectedPayload.type === 'MALICIOUS_SPECTRUM_SCRIPT' && idx >= 1 && idx <= 4)
              );

              return (
                <div 
                  key={idx} 
                  className={`flex items-center text-[8.5px] font-mono py-0.5 rounded transition ${
                    isSweeping 
                      ? 'bg-cyan-950/30 text-cyan-400 font-extrabold'
                      : hasMatchHighlight 
                      ? 'bg-red-950/10 text-red-400 font-medium'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="w-12 text-slate-600">{row.offset}</span>
                  <span className="flex-grow text-center font-bold tracking-wider px-2 break-all uppercase">
                    {row.hex}
                  </span>
                  <span className="w-24 text-right overflow-hidden whitespace-nowrap text-slate-500">
                    | {row.ascii} |
                  </span>
                </div>
              );
            })}
          </div>

          {/* Run Scan trigger deck */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleRunScan}
              disabled={isCompiling || isScanning}
              className={`flex-grow py-3 rounded-xl font-mono text-[9px] font-black uppercase tracking-widest transition flex items-center justify-center space-x-2 ${
                isScanning 
                  ? 'bg-amber-950/40 border border-amber-900 text-amber-500 animate-pulse'
                  : 'bg-cyan-950/50 hover:bg-cyan-900 border border-cyan-800 text-cyan-400'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>{isScanning ? 'Downlink Audit Scanning...' : 'Compile and Execute YARA Scan'}</span>
            </button>
          </div>
        </div>

        {/* SCAN RESULTS SUMMARY & MITIGATION STEPS */}
        {scanResults && (
          <div className={`p-4 rounded-2xl border-2 transition-all duration-300 ${
            scanResults.tripped 
              ? 'bg-red-950/20 border-red-900/60 shadow-[0_0_20px_rgba(239,68,68,0.15)] text-red-200' 
              : 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300'
          } animate-in fade-in zoom-in-95`}>
            
            <div className="flex items-center justify-between border-b pb-2 mb-2 border-slate-900/60">
              <span className="text-[8px] font-black uppercase tracking-widest flex items-center space-x-1.5">
                {scanResults.tripped ? (
                  <ShieldAlert className="w-4 h-4 text-red-500 animate-bounce" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                )}
                <span>Auditing Evaluation Report</span>
              </span>
              <span className="text-[7.5px] font-mono uppercase bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                STATUS: {scanResults.tripped ? 'THREAT_TRIPPED_ALERT' : 'NOMINAL_COMPLIANCE'}
              </span>
            </div>

            <p className="text-[8.5px] font-mono leading-relaxed bg-black/40 p-2.5 rounded-xl border border-slate-900 mb-3">
              {scanResults.evaluation}
            </p>

            {scanResults.tripped && scanResults.matches.length > 0 && (
              <div className="space-y-1">
                <span className="text-[7px] font-mono text-slate-500 uppercase tracking-widest font-black leading-none pb-1 block">Matching Signature Blocks Detected:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {scanResults.matches.map((m, idx) => (
                    <div key={idx} className="bg-black/50 border border-red-950 p-2 rounded-xl text-[7.5px] font-mono flex flex-col justify-between">
                      <span className="text-red-400 font-bold">{m.label} Offset: {m.offset}</span>
                      <span className="text-slate-400 italic font-medium">Bytes: "{m.fragment}"</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* LOG TERMINAL DRAWER */}
        <div className="flex flex-col space-y-1">
          <div className="flex items-center justify-between text-[8px] font-black text-slate-500 uppercase tracking-wider font-mono">
            <span className="flex items-center space-x-1.5">
              <Terminal className="w-3.5 h-3.5 text-slate-600" />
              <span>Compilation and Stream Analyzer Logs</span>
            </span>
            <span>Realtime</span>
          </div>

          <div className="h-28 bg-black border border-slate-900 rounded-2xl p-3 overflow-y-auto space-y-1 scrollbar-thin">
            {logs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[7px] font-mono text-slate-600 uppercase tracking-widest">
                Initiate scan to compile rules and parse memory buffers
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="text-[7.5px] font-mono flex items-start space-x-1.5 leading-tight">
                  <span className={`font-black uppercase text-[5.5px] px-1 py-[0.1px] rounded ${
                    log.type === 'warn'
                      ? 'bg-amber-950 border border-amber-900 text-amber-500'
                      : log.type === 'success'
                      ? 'bg-emerald-950 border border-emerald-900 text-emerald-400'
                      : log.type === 'threat'
                      ? 'bg-red-950 border border-red-900 text-red-500'
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
