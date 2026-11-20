import React, { useState } from 'react';
import { Target, MessageSquare, Send, RefreshCw, Radio, ShieldAlert, Cpu } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
  encrypted: boolean;
}

const PRESET_MESSAGES: ChatMessage[] = [
  { id: '1', sender: 'ORBITAL_OPS_RECON', text: 'Telemetry synchronization confirmed for INMARSAT-5. Beacon SNR holding at 14.2dB.', time: '02:08', encrypted: false },
  { id: '2', sender: 'GROUND_CONTROL_SIG', text: 'Adversary sweep target identified across L-Band spectrum coordinates. Initialized passive YARA check.', time: '02:10', encrypted: false },
];

interface CommsProps {
  isStealthMode: boolean;
  addMissionLog: (detail: string, status?: 'active' | 'success' | 'warning') => void;
}

export const LiveComms: React.FC<CommsProps> = ({ isStealthMode, addMissionLog }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(PRESET_MESSAGES);
  const [inputText, setInputText] = useState<string>('');
  const [encryptionKey, setEncryptionKey] = useState<string>('Q-ECDSA-256');
  const [channelActive, setChannelActive] = useState<boolean>(true);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText) return;

    const newMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: 'TACTICAL_OPERATOR',
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour12: false, minute: '2-digit' }),
      encrypted: isStealthMode,
    };

    setMessages(prev => [...prev, newMsg]);
    addMissionLog(`COMMS_MESSAGE_SENT: encrypted=${isStealthMode}`, 'success');
    setInputText('');

    // Trigger beautiful simulated answer from remote crew shortly
    setTimeout(() => {
      const responseMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: 'ORBITAL_OPS_RECON',
        text: 'TRANSLATIVE RECEIVED. COMMUNICANT CHANNELS LOCK REMAIN COHERENT.',
        time: new Date().toLocaleTimeString([], { hour12: false, minute: '2-digit' }),
        encrypted: isStealthMode,
      };
      setMessages(prev => [...prev, responseMsg]);
    }, 1000);
  };

  return (
    <div className="p-6 bg-slate-950 border-2 border-slate-900 rounded-3xl text-slate-100 flex flex-col space-y-6 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div className="flex items-center space-x-3">
          <MessageSquare className="w-5 h-5 text-purple-400 animate-pulse" />
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider font-mono">Encrypted Laser Live Comms Terminal</h3>
            <p className="text-[10px] text-slate-500 font-mono">Establish point-to-point secure laser link communication channels with operating command cells and orbital operators</p>
          </div>
        </div>
        <span className="text-[7.5px] font-mono uppercase bg-slate-900 text-purple-400 border border-purple-900/40 px-2 py-0.5 rounded animate-pulse">
          {encryptionKey}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Chat window left */}
        <div className="lg:col-span-8 bg-black/60 border border-slate-900 rounded-2xl p-4 flex flex-col justify-between h-96">
          <div className="space-y-3 flex-grow overflow-y-auto scrollbar-thin max-h-72 pr-1 font-mono">
            {messages.map((m) => (
              <div key={m.id} className="space-y-1 bg-slate-950/40 border border-slate-900 p-2.5 rounded-xl">
                <div className="flex justify-between items-center text-[7.5px] text-slate-500 font-black">
                  <span className={m.sender === 'TACTICAL_OPERATOR' ? 'text-cyan-400' : 'text-purple-400'}>
                    {m.sender}
                  </span>
                  <span>{m.time} UTC</span>
                </div>
                <p className="text-[9.5px] text-slate-200 leading-snug break-words uppercase font-semibold">
                  {m.encrypted ? '[CIPHER_SECURE] ' + btoa(m.text).slice(0, 24) + '...' : m.text}
                </p>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="flex gap-2 pt-3 border-t border-slate-900">
            <input
              type="text"
              placeholder="Type encrypted message tag..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-grow bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              className="bg-purple-950/50 hover:bg-purple-900 border border-purple-800 text-purple-400 px-4 py-2 rounded-xl transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Security parameters info right */}
        <div className="lg:col-span-4 bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-4 font-mono">
            <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest block">Link Specifications</span>

            <div className="bg-black p-3 border border-slate-900 rounded-xl space-y-1.5 text-[8.5px]">
              <span className="text-slate-500 block uppercase text-[7px]">Active key algorithm</span>
              <strong>{isStealthMode ? 'SHANNON_STEALTH_MODE_ALIGNED' : 'ECDSA DEFAULT LOCK'}</strong>
            </div>

            <div className="bg-black p-3 border border-slate-900 rounded-xl space-y-1.5 text-[8.5px]">
              <span className="text-slate-500 block uppercase text-[7px]">Decryption state status</span>
              <span className="text-emerald-400 font-extrabold block">ENCRYPTED SHIELDS ENGAGED</span>
            </div>
          </div>

          <div className="border-t border-slate-100/5 pt-3 flex items-center justify-between text-[7px] font-mono text-slate-600 uppercase">
            <span>Laser alignment locked</span>
            <span className="text-emerald-500 font-black">REF_OK</span>
          </div>
        </div>

      </div>
    </div>
  );
};
