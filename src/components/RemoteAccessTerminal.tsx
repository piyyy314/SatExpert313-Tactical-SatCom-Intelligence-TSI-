import React, { useState } from 'react';
import { Target, Terminal as TermIcon, Play, RefreshCw, KeyRound, ShieldAlert } from 'lucide-react';

interface SSHHost {
  id: string;
  name: string;
  ip: string;
  connectionType: 'SECURE_SSH' | 'UNSECURE_TELNET';
}

const CONST_HOSTS: SSHHost[] = [
  { id: '1', name: 'Master-S-Band Transceiver Node', ip: '192.168.1.10', connectionType: 'SECURE_SSH' },
  { id: '2', name: 'Alkali-Desert Tracking Array Controller', ip: '10.0.4.88', connectionType: 'SECURE_SSH' },
];

interface TerminalProps {
  addMissionLog: (detail: string, status?: 'active' | 'success' | 'warning') => void;
}

export const RemoteAccessTerminal: React.FC<TerminalProps> = ({ addMissionLog }) => {
  const [activeHost, setActiveHost] = useState<SSHHost>(CONST_HOSTS[0]);
  const [cmdInput, setCmdInput] = useState<string>('');
  const [cmdHistory, setCmdHistory] = useState<string[]>([
    'TSI SSH Client v5.14.0 Connection Protocol Ready.',
    'Type "help" to view directory of active diagnostic console operations.'
  ]);
  const [isConnected, setIsConnected] = useState<boolean>(true);

  const addHostLog = (msg: string) => {
    setCmdHistory(prev => [...prev, msg]);
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmdInput) return;

    const cmd = cmdInput.trim().toLowerCase();
    addHostLog(`tsi_user@${activeHost.ip}:~$ ${cmdInput}`);
    setCmdInput('');

    if (cmd === 'help') {
      addHostLog('COMMAND DIRECTORY:\n - STATUS : View target transceiver memory stats\n - DECRYPT : Sweep transponder for active cipher logs\n - ENCRYPT : Apply AES encryption locks\n - REBOOT : Terminate and restore remote operating loop');
    } else if (cmd === 'status') {
      addHostLog(`HOST IP: ${activeHost.ip}\nCOHERENCE STATUS: NOMINAL\nTEMP CURRENT: 46C\nPACKET DRIFT: 0.00%`);
    } else if (cmd === 'decrypt') {
      addHostLog('SWEEPING CRYPTOGRAPHIC REGISTERS: IDENTIFIED ACTIVE CIPHER KEYS: FLAG{SSH_CONSOLATION_SESSION_OK}');
      addMissionLog(`SSH_DECRYPT: read cryptographic keys on target ${activeHost.ip}`, 'warning');
    } else if (cmd === 'encrypt') {
      addHostLog('ENCRYPTION RE-ARMED. ROOT BUFFER IS FULLY FILTERED');
      addMissionLog(`SSH_ENCRYPT: engaged security locks on remote host ${activeHost.ip}`, 'success');
    } else if (cmd === 'reboot') {
      addHostLog('TERMINATING CONSOLE SESSION. INITIATING POWER REBOOT VECTOR...');
      addMissionLog(`SSH_REBOOT: remotely power-cycled transceiver host ${activeHost.ip}`, 'active');
      setIsConnected(false);
      setTimeout(() => {
        setIsConnected(true);
        addHostLog('RECONNNECTION ESTABLISHED. TRANSCONDER ROOT READY.');
      }, 2000);
    } else {
      addHostLog(`Command not recognized: "${cmdInput}". Type "help" to view options.`);
    }
  };

  return (
    <div className="p-6 bg-slate-950 border-2 border-slate-900 rounded-3xl text-slate-100 flex flex-col space-y-6 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div className="flex items-center space-x-3">
          <TermIcon className="w-5 h-5 text-cyan-400 animate-pulse" />
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider font-mono">Secure Remote Access Terminal Console</h3>
            <p className="text-[10px] text-slate-500 font-mono">Establish encrypted SSH channels to target command centers and satellite receiver controllers globally</p>
          </div>
        </div>
        <span className="text-[7.5px] font-mono uppercase bg-slate-900 text-cyan-400 border border-cyan-900/40 px-2 py-0.5 rounded animate-pulse">
          SSH_SHELL
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Connection directory selector left */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col space-y-3">
            <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest block font-mono">Hosts Directory</span>

            <div className="space-y-1.5 font-mono">
              {CONST_HOSTS.map(host => (
                <button
                  key={host.id}
                  onClick={() => {
                    setActiveHost(host);
                    setCmdHistory([
                      `Established fresh command session route on target host: ${host.name}`,
                      'Type "help" to view directory of active shell diagnostic operations.'
                    ]);
                    setIsConnected(true);
                    addMissionLog(`SSH_HOST_CHANGED: selected ${host.name} (${host.ip})`, 'active');
                  }}
                  className={`w-full text-left p-2.5 rounded-xl border flex flex-col space-y-1 transition ${
                    activeHost.id === host.id
                      ? 'bg-cyan-950/40 border-cyan-500 text-cyan-400 font-bold'
                      : 'bg-slate-950 border-slate-900/60 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <label className="text-[9px] uppercase tracking-wide cursor-pointer">{host.name}</label>
                  <div className="text-[7.5px] text-slate-500 flex justify-between pr-2">
                    <span>IP: {host.ip}</span>
                    <span>TYPE: {host.connectionType}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col space-y-2.5 text-[8px] font-mono text-slate-500 uppercase leading-relaxed tracking-wider">
            <span>Terminal Instructions</span>
            <p>
              Type standard terminal keys directly inside the console line interface. Remote shells execute commands locally to alter transceiver power bands.
            </p>
          </div>
        </div>

        {/* Real-time interactive bash screen right */}
        <div className="lg:col-span-8 bg-black border border-slate-900 p-4 h-96 rounded-2xl flex flex-col justify-between">
          <div className="flex-grow font-mono text-[9px] text-slate-200 py-2 overflow-y-auto space-y-1 scrollbar-thin max-h-72 select-text">
            {cmdHistory.map((hist, idx) => (
              <div key={idx} className="whitespace-pre-wrap leading-relaxed tracking-wider">
                {hist}
              </div>
            ))}
            {!isConnected && (
              <div className="text-red-500 animate-pulse font-bold uppercase tracking-widest pt-2">
                CRITICAL WARNING: REMOTE SHELL CONSOLE PATH REPORTING OFFLINE / DISCONNECT...
              </div>
            )}
          </div>

          <form onSubmit={handleCommandSubmit} className="flex items-center gap-2 pt-3 border-t border-slate-900">
            <span className="text-[10px] font-mono font-bold text-cyan-500">
              tsi_user@{activeHost.ip}:~$
            </span>
            <input
              type="text"
              placeholder="Type diagnostic commands (e.g. help, status, decrypt, encrypt)..."
              value={cmdInput}
              onChange={(e) => setCmdInput(e.target.value)}
              disabled={!isConnected}
              className="flex-grow bg-slate-950 text-xs font-mono text-cyan-300 border border-slate-900 rounded-xl px-3 py-1.5 focus:outline-none focus:border-cyan-500"
            />
          </form>
        </div>

      </div>
    </div>
  );
};
