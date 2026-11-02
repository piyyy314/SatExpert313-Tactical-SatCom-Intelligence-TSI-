import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Send, Cpu, ShieldAlert, Sparkles, AlertCircle, RefreshCw, Layers, CheckCircle2, Sliders } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface AITechnicianProps {
  context: {
    lat: number;
    lng: number;
    satName: string;
    defcon: number;
    weather: string;
    isJamming: boolean;
  };
  telemetry: {
    snr: string;
    rxPower: string;
    bucTemp: string;
    packetLoss: string;
    status: string;
  };
  isStealthMode: boolean;
  isNeuralCleaning: boolean;
  onToggleNeuralCleaning: () => void;
  isDecoyActive: boolean;
  onToggleDecoy: () => void;
  isZPEActive: boolean;
  onToggleZPE: () => void;
}

interface Message {
  id: string;
  sender: 'system' | 'user' | 'assistant';
  text: string;
  timestamp: string;
  isCode?: boolean;
}

export const AITechnician: React.FC<AITechnicianProps> = ({
  context,
  telemetry,
  isStealthMode,
  isNeuralCleaning,
  onToggleNeuralCleaning,
  isDecoyActive,
  onToggleDecoy,
  isZPEActive,
  onToggleZPE
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      sender: 'system',
      text: '[SYS_READY] SatExpert Tactical Intelligence (TSI) Diagnostic Unit active. Telemetry stream locked. Operator authenticated.',
      timestamp: new Date().toLocaleTimeString([], { hour12: false })
    },
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Greetings, tactical VSAT engineer. I am Unit SAT-TECH-9000, your automated intelligence assistant.

Current uplink locked with satellite **${context.satName}** at DEFCON **${context.defcon}**. 

How would you like to proceed with diagnostics today? You can select any structural automated task below or input custom tactical queries.`,
      timestamp: new Date().toLocaleTimeString([], { hour12: false })
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useLocalFallback, setUseLocalFallback] = useState(false);
  const [apiKeyDetected, setApiKeyDetected] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Check if GEMINI_API_KEY is available in the compiled env
  useEffect(() => {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== 'undefined' && key !== '') {
      setApiKeyDetected(true);
      setUseLocalFallback(false);
    } else {
      setApiKeyDetected(false);
      setUseLocalFallback(true);
    }
  }, []);

  // Sync scroll on chat updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Generate rule-based local diagnostics when offline or API is missing
  const getLocalResponse = (query: string): string => {
    const q = query.toLowerCase();

    if (q.includes('signal') || q.includes('path') || q.includes('noise') || q.includes('elevation')) {
      const weatherImpact = context.weather !== 'CLEAR' ? `\n- **Weather Loss Factor**: Rain and cloud cover (${context.weather}) are creating attenuation of up to ${context.weather === 'HEAVY_STORM' ? '12.4' : '4.2'} dB in the Ku/Ka band satellite spectrum.` : '\n- **Atmospheric Path**: Clear skies. Path loss is restricted to free space path loss (FSPL).';
      const jammingStatus = context.isJamming ? '\n- **Active Countermeasures**: Broad-spectrum RF static is severely lowering carrier density.' : '';
      
      return `### PHYSICAL PATH & SIGNAL ANALYSIS
[UNIT: SAT-TECH-9000 // DETERMINISTIC ENGINE]

Uplink analysis conducted for coordinates **${context.lat.toFixed(4)}°N, ${context.lng.toFixed(4)}°E** targeting **${context.satName}**.

#### Signal Metrics
- **Carrier-to-Noise Floor (C/N)**: ${telemetry.snr} dB (Nominal standard is 12.0 dB+)
- **Rx Power Level**: ${telemetry.rxPower} dBm
- **Status Classification**: **${telemetry.status}**
${weatherImpact}${jammingStatus}

#### Corrective Protocols Recommended:
1. **Adaptive Coding & Modulation (ACM)**: Enable lower coding rates (e.g. QPSK 1/2 redundancy) to maintain lock under current degradation.
2. **Azimuth Correction**: Ensure fine-pointing peak is aligned. Even any 0.2° deviation will degrade Ku-Band uplink by up to 3.5dB.
3. ${isNeuralCleaning ? 'Neural Filter is actively cleaning high-order spurs.' : 'Engage Neural Cleaning filter to isolate localized RF distortions.'}`;
    }

    if (q.includes('jamming') || q.includes('jam') || q.includes('anti-jamming') || q.includes('interference')) {
      return `### ELECTRONIC WARFARE & ANTI-JAMMING MITIGATION
[UNIT: SAT-TECH-9000 // TACTICAL SECURE COUNTERMEASURES]

Broad-spectrum electromagnetic noise overlay warning. Frequency spectrum monitoring indicates targeted or regional carrier noise injection.

#### Countermeasures Matrix
- **Jamming Power Modulus**: ${context.isJamming ? `${context.isJamming ? 'ACTIVE' : 'INACTIVE'} (Level: ${context.isJamming ? 'CRITICAL - HIGH INTENSITY' : 'NOMINAL'})` : 'OFFLINE'}
- **Decoy Transmitter State**: ${isDecoyActive ? 'ACTIVE (Offset transmission operational to draw fire/location tracers)' : 'INACTIVE (Warning: Uplink is vulnerable to visual IP georeferencing)'}
- **Neural Cleaner**: ${isNeuralCleaning ? 'ACTIVE (Isolating baseline frequencies from white noise)' : 'DISENGAGED (Highly recommended to enable immediately)'}

#### Active Directives:
1. **Dynamic Frequency Hopping**: Shift secondary carrier band to guard frequency slots [+15MHz offset step].
2. **Spectral Decoy Deployment**: Decoy is ${isDecoyActive ? 'already active.' : 'offline. Activate decoy sequence to obfuscate VSAT coordinates.'}
3. **Power Control**: Transition BUC amplification. Current Temp is **${telemetry.bucTemp}°C**. Use zero-point grounding (ZPE) to avoid thermal clipping if using high-power amplification.`;
    }

    if (q.includes('budget') || q.includes('link') || q.includes('losses')) {
      const fspl = (32.44 + 20 * Math.log10(35786) + 20 * Math.log10(14250)).toFixed(1); // Rough FSPL at Ku band
      const rainFade = context.weather === 'HEAVY_STORM' ? 12.0 : (context.weather === 'LIGHT_RAIN' ? 3.5 : 0.4);
      const totalLoss = (parseFloat(fspl) + rainFade).toFixed(1);
      
      return `### RF LINK BUDGET ESTIMATION
[UNIT: SAT-TECH-9000 // DETERMINISTIC LINK MODEL]

Theoretical link calculation parameters verified for geostationary orbit node:

- **Free Space Path Loss (FSPL)**: ~${fspl} dB (Estimated at 14.25 GHz Ku Uplink)
- **Atmospheric / Rain Loss**: ${rainFade} dB (${context.weather} status)
- **Estimated Total Path Loss**: ${totalLoss} dB
- **Active Transmit Power (BUC)**: ${telemetry.bucTemp > '55' ? 'Throttled / Overheated' : 'Max Linear'}

#### Tactical Link Recommendations:
1. **Polarization Alignment**: Check skew parameters. Polarization isolation must be >= 30dB to mitigate cross-pol interference.
2. **Symbol Rate Tuning**: For narrow tactical beams under heavy attenuation, decrease carrier bandwidth to match available Link Margin.`;
    }

    if (q.includes('stealth') || q.includes('emissions') || q.includes('masking')) {
      return `### STEALTH EMISSIONS CONTROL (EMCON)
[UNIT: SAT-TECH-9000 // LOW OBSERVABLE SIG PROFILE]

Security guidelines status: **${isStealthMode ? 'STEALTH_ENGAGED' : 'EXPOSED'}**

${isStealthMode 
  ? `-[ACTIVE_STEALTH_MODE_CONFIRMED]-
- **Emission Signature**: Minimum allowable burst transmissions.
- **Spectrum Masking**: Side-lobes filtered using post-quantum envelope.
- **Uplink Radiated Power**: Low probability of intercept (LPI) parameters deployed. 
- **Telemetry Pulses**: Decimated and randomized frequency intervals to avoid Direction Finding (DF) triangulation.`
  : `-[WARNING: HIGH ELECTROMAGNETIC EMISSIONS PROFILE]-
- Hostile signal tracking nodes can easily locate this active carrier.
- Recommend engaging **Active Stealth Mode** to drop transmit signature level.
- Shunt non-essential diagnostic telemetry to avoid continuous carrier tracking.`
}

#### Actions:
1. Toggle Stealth Mode on the bridge control panel.
2. ${isDecoyActive ? 'Decoy Transmitter is operational' : 'Engage Decoy transmitter to blend your signature into ambient spectral noise.'}`;
    }

    if (q.includes('osint') || q.includes('telegram') || q.includes('c4isr') || q.includes('reconnaissance')) {
      return `### CYBERSEC / C4ISR SIGINT RECONNAISSANCE DIRECTIVE
[UNIT: SAT-TECH-9000 // TACTICAL NODE DISPATCH]

**RECOMMENDED ACTION 1: ROUTING TO C4ISR SIGINT TERMINAL NODE**
- **Action**: Request successfully routed to **CYBERSEC / C4ISR SIGINT Terminal Node** (SIGINT Suite -> \`c4isr_terminal\`).
- **Live Intercepts**: Active encrypted Telegram tactical feed monitoring (@Frontline_C4ISR, @SatCom_CyberWatch, @ME_Chokepoints_Intel).
- **Target Extraction**: Real-time geolocation coordinates extracted and ready for direct plotting onto the Tactical Heatmap.
- **Counter-Intelligence**: Automated MGRS and RF carrier beacon matching active.`;
    }

    if (q.includes('telstar') || q.includes('uplink') || q.includes('dvb-s2x') || q.includes('carrier allocation') || q.includes('routing')) {
      return `### SATELLITE UPLINK ROUTING & TRANSPORT PARAMETERS: TELSTAR 11N (37.5°W)
[UNIT: SAT-TECH-9000 // RF TRANSPORT ENGINE]

**RECOMMENDED ACTION 2: TELSTAR 11N DVB-S2X TRANSPORT ALLOCATION**
- **Satellite Locked**: Telstar 11N (Orbital Slot: 37.5°W // Longitude: -37.5°)
- **Carrier Allocation**: Transponder Ku-T11N-XP24 (Uplink: 14285.50 MHz, Downlink: 11485.50 MHz, BW: 36.0 MHz, Linear Horizontal)
- **DVB-S2X Parameters**: MODCOD 16APSK 3/4-L, Roll-off factor α = 0.05 (Nyquist +5%), Pilots ON, FEC: 3/4 LDPC+BCH
- **Symbol Rate Adjustment**: Nominal 27.500 Msps (tunable 1.2 to 34.0 Msps, 78.38 Mbps throughput at 2.71 bps/Hz)
- **Polarization Skew Calibration**: Dynamically aligned to feedhorn offset for station coords (Cross-Pol Isolation: 33.5 dB)
- **IP Transport / GSE**: Generic Stream Encapsulation, Multicast route 239.255.42.11/32, Teleport Gateway 192.168.11.1, MTU 1500 (DSCP EF-46)`;
    }

    if (
      (q.includes('hormuz') || q.includes('ship') || q.includes('maritime') || q.includes('middle east') || q.includes('mideast')) &&
      (q.includes('fire') || q.includes('fires') || q.includes('nasa') || q.includes('live'))
    ) {
      return `### NASA FIRMS LIVE THERMAL DOSSIER: STRAIT OF HORMUZ MARITIME & MIDDLE EAST LAND FIRES
[UNIT: SAT-TECH-9000 // ORBITAL INFRARED DOWNLINK STATUS: ALWAYS ACTIVE]

**1. STRAIT OF HORMUZ MARITIME SHIP FIRES (8 ACTIVE VESSELS TRACKED BY NOAA-20 / SUOMI-NPP VIIRS 375m):**
- **VLCC Front Empress** (Marshall Islands // MMSI 636019482) - Lat 26.38°N, Lng 56.62°E | FRP: **460 MW** (492 K) | Inbound TSS Channel
- **Chemical Tanker Stolt Valor** (Bahamas // MMSI 311000842) - Lat 26.22°N, Lng 56.45°E | FRP: **310 MW** (448 K) | Musandam Chokepoint
- **IRGC Fast Attack Craft 09** (Iran // MMSI IRN-9021) - Lat 26.86°N, Lng 56.38°E | FRP: **520 MW** (515 K) | Larak Island North Channel
- **Suezmax Pacific Apex** (Marshall Islands // MMSI 538008123) - Lat 25.28°N, Lng 56.68°E | FRP: **380 MW** (462 K) | Fujairah Anchorage Exit
- **Container Al-Mirqab** (UAE // MMSI 470982000) - Lat 26.25°N, Lng 55.28°E | FRP: **290 MW** (435 K) | Greater Tunb Western Approaches
- **Darya Bunkering Barge 4** (Iran // MMSI IRN-4421) - Lat 26.65°N, Lng 55.88°E | FRP: **410 MW** (475 K) | Qeshm South Entrance
- **LNG Carrier Al-Ghashamiya** (Marshall Islands // MMSI 538003421) - Lat 26.15°N, Lng 56.12°E | FRP: **510 MW** (504 K) | Cryogenic Boil-Off Flare
- **Suezmax Delta Poseidon** (Greece // MMSI 240889000) - Lat 25.82°N, Lng 57.08°E | FRP: **430 MW** (472 K) | Jask Approach Cargo Pump Fire

**2. MIDDLE EAST TERRESTRIAL LAND FIRES (24 MAJOR FACILITIES MONITORED BY VIIRS & MODIS):**
- **Iran**: Kharg Island Petrochemical Flare (740 MW), Ahvaz-3 Oilfield Flare (680 MW), South Pars Asaluyeh Mega-Flare (890 MW), Bandar Abbas Refinery Flare (620 MW)
- **Iraq**: Rumaila Supergiant Flare (820 MW), Zubair Degassing Flare (580 MW), Kirkuk Baba Gurgur (710 MW), Baiji Refinery Flare (540 MW), Majnoon Station 1 (720 MW)
- **Syria & Lebanon**: Deir ez-Zor Al-Omar Field (610 MW), Palmyra Gas Flare (490 MW), South Lebanon Litani Combat Hotspot (440 MW)
- **Arabian Peninsula & Gulf**: Kuwait Burgan Field (790 MW), Saudi Arabia Abqaiq GOSP-1 (850 MW), Saudi Shaybah Field (670 MW), Saudi Ras Tanura Terminal (860 MW), Qatar Ras Laffan LNG Complex (810 MW), Bahrain Sitrah BAPCO Wharf (520 MW), UAE Habshan Gas Complex (580 MW), Oman Fahud Field (430 MW)
- **Red Sea & Levant Corridor**: Yemen Marib Safer Depot (530 MW), Yemen Hodeidah Ras Isa (490 MW), Egypt Ras Gharib Suez Flare (490 MW), Jordan Zarqa Refinery (380 MW)

**3. TACTICAL MAP ACTIONS:**
- The Tactical Map is permanently locked to **ALWAYS ACTIVE: HORMUZ SHIPS + MIDEAST LAND FIRES**.
- Click **MIDEAST THEATER (6.2x)** or **HORMUZ CHOKEPOINT (20x)** in the Tactical Map to view individual ship hulls, nautical diamond markers, MMSI callouts, and plume radii!`;
    }

    if (q.includes('fire') || q.includes('fires') || q.includes('heatmap') || q.includes('malware') || q.includes('c2')) {
      return `### GEOSPATIAL HEATMAP: THERMAL FIRES & MALWARE/C2 CORRELATION
[UNIT: SAT-TECH-9000 // SATELLITE SENSOR FUSION]

**HEATMAP LAYER STATUS: SYNCHRONIZED**
- **Strait of Hormuz Maritime Ships**: 8 active vessels with thermal anomalies (Front Empress 460 MW, Stolt Valor 310 MW, IRGC FAC 520 MW, Al-Ghashamiya LNG 510 MW).
- **Middle East Land Fires**: 24 terrestrial oilfield, refinery, and combat fire detections (South Pars 890 MW, Ras Tanura 860 MW, Abqaiq 850 MW, Rumaila 820 MW).
- **Malware & C2 Infrastructure**: 8 active cyber threat beacons mapped (Cobalt Strike 185.196.220.44:443, AcidRain VSAT Wiper 91.240.118.172:8080, QakBot 198.51.100.89:2222, Sandworm 194.87.144.11:9001).
- **Tactical Map**: Configured to ALWAYS show all maritime ship fires in Strait of Hormuz and all Middle East land fires with Theater Zoom presets.`;
    }

    // Default general-purpose fallback response if no keyword matched
    return `### DETECTED CONTEXT & TELEMETRY LOGS
[UNIT: SAT-TECH-9000 // OFFLINE SYSTEM PROCESSOR]

I suggest initiating one of the optimized automated scripts to analyze current VSAT hardware.

#### Live Operations Board:
- **Locked Node**: ${context.satName}
- **DEFCON Safety Threshold**: Level ${context.defcon} (${context.defcon <= 2 ? 'RED_ALERT' : 'STABLE_GUARD'})
- **Telemetry Lock**: SNR ${telemetry.snr} dB, Packet Loss ${telemetry.packetLoss}%, Temperature ${telemetry.bucTemp}°C
- **Active Distortions**: Jamming frequency injections are ${context.isJamming ? 'ON' : 'OFF'}.

*Please try one of the instant diagnostic buttons above or supply specific RF terms (such as system noise, path budget, electronic warfare, or stealth emissions).*`;
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputMessage;
    if (!textToSend.trim() || isLoading) return;

    const userMsgId = Math.random().toString(36).substr(2, 9);
    const userMsg: Message = {
      id: userMsgId,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour12: false })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customPrompt) setInputMessage('');
    setIsLoading(true);

    try {
      if (useLocalFallback) {
        // Enforce delay to simulate analysis processing
        await new Promise(resolve => setTimeout(resolve, 800));
        const localReply = getLocalResponse(textToSend);
        
        setMessages(prev => [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          sender: 'assistant',
          text: localReply,
          timestamp: new Date().toLocaleTimeString([], { hour12: false })
        }]);
      } else {
        // Build real-time server-defined or client-safe configuration for Gemini API call
        const key = process.env.GEMINI_API_KEY;
        if (!key) {
          throw new Error('GEMINI_API_KEY_MISSING');
        }

        const ai = new GoogleGenAI({
          apiKey: key,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });

        const systemPrompt = `You are the SatExpert TSI Tactical AI Technician (Unit Designation: SAT-TECH-9000).
Your job is to provide tactical VSAT satellite communications engineering analysis and advice.
You operate on an interactive portable SatCom terminal dashboard.
Current real-time system context:
- Base Coordinates: Latitude ${context.lat.toFixed(4)}, Longitude ${context.lng.toFixed(4)}
- Target Satellite: ${context.satName}
- Alert Status: DEFCON ${context.defcon}
- Local Weather Condition: ${context.weather}
- Active Jamming Interference: ${context.isJamming ? 'YES' : 'NO'}
- Signal Quality: SNR ${telemetry.snr} dB, Rx Power ${telemetry.rxPower} dBm, Packet Loss ${telemetry.packetLoss}%
- BUC Temperature: ${telemetry.bucTemp} °C
- Stealth Mode Status: ${isStealthMode ? 'ACTIVE (LOW OBSERVABILITY SIGNATURE)' : 'INACTIVE (FULL CARRIER BROADCAST)'}
- Neural Processing Cleaning: ${isNeuralCleaning ? 'ACTIVE' : 'INACTIVE'}
- Decoy Transmitter: ${isDecoyActive ? 'DEPLOYED' : 'STANDBY'}
- Zero-Point Energy Grounding: ${isZPEActive ? 'ENGAGED' : 'OFFLINE'}

Keep your responses highly concise, extremely technical, professional, and formatted in clean markdown. 
Use bullet points and bold headings. Give precise physical/mathematical advice (like Rain Fade attenuation in dB, modulation switching, Polarization Skew angle adjustments, or RF Shielding checks). 
If Stealth Mode is active, prepend your responses with "[ENC_MASKED] Tactical signature low-visibility log:" and keep the advice even more concise and command-focused.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: textToSend,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.7,
            topP: 0.9,
          }
        });

        const replyText = response.text || "No response received. Hardware interface error.";

        setMessages(prev => [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          sender: 'assistant',
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour12: false })
        }]);
      }
    } catch (err: any) {
      console.warn("Gemini API call failed, reverting to local diagnostics:", err);
      // Fail elegantly and fallback to local intelligence logic
      const localReply = getLocalResponse(textToSend);
      setMessages(prev => [...prev, {
        id: Math.random().toString(36).substr(2, 9),
        sender: 'system',
        text: `[SYS_WARN] API Handshake timeout. Activating offline tactical processing fallback.`,
        timestamp: new Date().toLocaleTimeString([], { hour12: false })
      }, {
        id: Math.random().toString(36).substr(2, 9),
        sender: 'assistant',
        text: `### [OFFLINE FALLBACK ENGAGED]\n\n${localReply}`,
        timestamp: new Date().toLocaleTimeString([], { hour12: false })
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearLog = () => {
    setMessages([
      {
        id: 'init-revived',
        sender: 'system',
        text: '[SYS_READY] Log cleared. Tactical processor recycled. System telemetry lock preserved.',
        timestamp: new Date().toLocaleTimeString([], { hour12: false })
      },
      {
        id: 'welcome-revived',
        sender: 'assistant',
        text: `Unit SAT-TECH-9000 ready. Live Uplink: **${context.satName}**. Specify operational parameters.`,
        timestamp: new Date().toLocaleTimeString([], { hour12: false })
      }
    ]);
  };

  return (
    <div className={`flex flex-col rounded-[24px] border-2 transition-all duration-300 relative overflow-hidden shadow-2xl ${
      isStealthMode 
        ? 'bg-black/95 border-purple-900/50 shadow-[0_0_40px_rgba(147,51,234,0.1)]' 
        : 'bg-slate-950/90 border-slate-800'
    }`}>
      {/* Visual scanning line for tactical vibe */}
      <div className={`absolute top-0 left-0 w-full h-[2px] opacity-10 pointer-events-none z-10 animate-scan ${
        isStealthMode ? 'bg-purple-500' : 'bg-cyan-400'
      }`}></div>

      {/* Header Panel */}
      <div className={`p-4 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 select-none ${
        isStealthMode ? 'border-purple-950 bg-purple-950/10' : 'border-slate-800 bg-slate-900/40'
      }`}>
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${isStealthMode ? 'bg-purple-950 text-purple-400' : 'bg-cyan-950 text-cyan-400'}`}>
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center space-x-2">
              <span>Unit SAT-TECH-9000</span>
              <span className={`text-[8px] font-mono px-2 py-0.5 rounded border ${
                isStealthMode 
                  ? 'bg-purple-950/80 border-purple-800/40 text-purple-400' 
                  : 'bg-slate-900 border-slate-800 text-cyan-400'
              }`}>
                {isStealthMode ? "LPI_SECURE" : "BROADCAST"}
              </span>
            </h2>
            <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">
              Tactical AI & Diagnostic Technician
            </p>
          </div>
        </div>

        {/* Engine type control switch */}
        <div className="flex items-center space-x-2">
          {apiKeyDetected ? (
            <div className="flex items-center space-x-2 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-lg max-h-8">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[8px] font-mono text-slate-400 uppercase tracking-wider">GEMINI FLASH ACTIVE</span>
              <button
                onClick={() => setUseLocalFallback(!useLocalFallback)}
                className={`text-[8px] font-mono uppercase px-2 py-0.5 rounded border transition-all ${
                  useLocalFallback 
                    ? 'bg-amber-950/60 border-amber-850 text-amber-500' 
                    : 'bg-emerald-950/60 border-emerald-850 text-emerald-400'
                }`}
              >
                {useLocalFallback ? "OFFLINE_CORE" : "ONLINE_API"}
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 bg-purple-950/30 border border-purple-900/40 px-3 py-1.5 rounded-lg max-h-8">
              <Terminal className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-[8px] font-mono text-purple-400 uppercase tracking-wider">OFFLINE SECURITY MODE UNLOCKED</span>
            </div>
          )}
        </div>
      </div>

      {/* Central Telemetry Grid Block */}
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-2.5 p-3.5 border-b ${
        isStealthMode ? 'border-purple-950 bg-black/40' : 'border-slate-800 bg-slate-900/20'
      }`}>
        <div className="bg-slate-950/60 border border-slate-800/50 p-2 rounded-xl flex flex-col justify-between">
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">carrier_snr</span>
          <span className={`text-base font-bold font-mono tracking-tight mt-1 ${isStealthMode ? 'text-purple-400' : 'text-cyan-400'}`}>
            {telemetry.snr} <span className="text-[10px] font-normal text-slate-500">dB</span>
          </span>
        </div>
        <div className="bg-slate-950/60 border border-slate-800/50 p-2 rounded-xl flex flex-col justify-between">
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">rx_level</span>
          <span className="text-base font-bold font-mono tracking-tight text-emerald-400 mt-1">
            {telemetry.rxPower} <span className="text-[10px] font-normal text-slate-500">dBm</span>
          </span>
        </div>
        <div className="bg-slate-950/60 border border-slate-800/50 p-2 rounded-xl flex flex-col justify-between">
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">packet_loss</span>
          <span className={`text-base font-bold font-mono tracking-tight mt-1 ${
            parseFloat(telemetry.packetLoss) > 5 ? 'text-red-400' : 'text-slate-300'
          }`}>
            {telemetry.packetLoss} <span className="text-[10px] font-normal text-slate-500">%</span>
          </span>
        </div>
        <div className="bg-slate-950/60 border border-slate-800/50 p-2 rounded-xl flex flex-col justify-between">
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">buc_temp</span>
          <span className={`text-base font-bold font-mono tracking-tight mt-1 ${
            parseFloat(telemetry.bucTemp) > 55 ? 'text-red-400 animate-pulse' : 'text-amber-400'
          }`}>
            {telemetry.bucTemp} <span className="text-[10px] font-normal text-slate-500">°C</span>
          </span>
        </div>
      </div>

      {/* Automated Diagnostic Buttons (Pre-loaded Tactical Prompts) */}
      <div className={`p-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs select-none ${
        isStealthMode ? 'bg-purple-950/5 border-purple-950' : 'bg-slate-900/10 border-slate-800/50'
      }`}>
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap">
          AUTOMATED SCRIPTS:
        </span>
        <div className="flex flex-wrap gap-2 w-full">
          <button
            onClick={() => handleSendMessage("Perform Automated Signal Path Elevation Noise Analysis")}
            disabled={isLoading}
            className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all duration-200 active:scale-95 ${
              isStealthMode 
                ? 'bg-purple-950/40 border-purple-900/50 text-purple-400 hover:bg-purple-900/50' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-slate-700'
            }`}
          >
            Signal Analysis
          </button>
          <button
            onClick={() => handleSendMessage("Trigger Emergency Electronic Radio Jamming Mitigation Sequence")}
            disabled={isLoading}
            className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all duration-200 active:scale-95 ${
              isStealthMode 
                ? 'bg-purple-950/40 border-purple-900/50 text-purple-400 hover:bg-purple-900/50' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-amber-400 hover:border-slate-700'
            }`}
          >
            Anti-Jamming mitigation
          </button>
          <button
            onClick={() => handleSendMessage("Conduct VSAT link budget assessment path losses profile")}
            disabled={isLoading}
            className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all duration-200 active:scale-95 ${
              isStealthMode 
                ? 'bg-purple-950/40 border-purple-900/50 text-purple-400 hover:bg-purple-900/50' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-emerald-400 hover:border-slate-700'
            }`}
          >
            Link Budget
          </button>
          <button
            onClick={() => handleSendMessage("Check emissions rating and stealth EMCON profile safety")}
            disabled={isLoading}
            className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all duration-200 active:scale-95 ${
              isStealthMode 
                ? 'bg-purple-950/40 border-purple-900/50 text-purple-400 hover:bg-purple-900/50 shadow-[0_0_8px_rgba(168,85,247,0.1)]' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-slate-700'
            }`}
          >
            Stealth EMCON
          </button>
        </div>
      </div>

      {/* Scrollable Conversation Terminal */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3.5 min-h-[300px] max-h-[460px] scrollbar-thin"
      >
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex flex-col space-y-1 max-w-[85%] transition-all ${
              msg.sender === 'user' 
                ? 'ml-auto items-end' 
                : msg.sender === 'system' 
                ? 'mx-auto w-full max-w-full'
                : 'mr-auto items-start'
            }`}
          >
            {/* Header info */}
            <div className="flex items-center space-x-2 px-1 text-[8px] font-mono text-slate-500 select-none uppercase tracking-wider">
              <span>{msg.sender === 'user' ? 'Operator' : msg.sender === 'system' ? 'System Broadcast' : 'SAT-TECH AI'}</span>
              <span>•</span>
              <span className="opacity-75">{msg.timestamp}</span>
            </div>

            {/* Bubble contents */}
            <div className={`p-3.5 rounded-2xl text-[11px] font-sans leading-relaxed shadow-md border ${
              msg.sender === 'user' 
                ? isStealthMode 
                  ? 'bg-purple-950/30 border-purple-800/40 text-purple-200 rounded-tr-none'
                  : 'bg-cyan-950/30 border-cyan-800/40 text-cyan-150 rounded-tr-none'
                : msg.sender === 'system'
                ? 'bg-slate-950/80 border-slate-800/60 text-amber-500/80 font-mono text-[9px] mx-auto w-full py-2 px-3 border-dashed rounded-lg flex items-center space-x-2'
                : isStealthMode
                ? 'bg-slate-950 border-purple-950 text-purple-100 rounded-tl-none'
                : 'bg-slate-900/95 border-slate-800/80 text-slate-200 rounded-tl-none'
            }`}>
              {msg.sender === 'system' && <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />}
              
              {/* Simple inline markdown text decorator */}
              <div className="whitespace-pre-wrap select-text markdown-body">
                {msg.text.split('\n').map((line, i) => {
                  let rendered = line;
                  // Handle custom tag coloring inside bubbles
                  if (rendered.startsWith('[SYS_READY]')) {
                    return <p key={i} className="text-emerald-400 font-mono font-bold tracking-tight">{rendered}</p>;
                  }
                  if (rendered.startsWith('[SYS_WARN]')) {
                    return <p key={i} className="text-amber-500 font-mono font-bold tracking-tight animate-pulse">{rendered}</p>;
                  }
                  if (rendered.startsWith('### ')) {
                    return <h3 key={i} className={`text-[11px] font-black uppercase tracking-wider mt-2.5 mb-1 ${isStealthMode ? 'text-purple-400' : 'text-cyan-400'}`}>{rendered.replace('### ', '')}</h3>;
                  }
                  if (rendered.startsWith('#### ')) {
                    return <h4 key={i} className="text-[10px] font-mono font-black mt-2 mb-0.5 text-slate-300">{rendered.replace('#### ', '')}</h4>;
                  }
                  if (rendered.startsWith('- ')) {
                    return <li key={i} className="ml-2.5 list-disc pl-1 text-[11px]">{rendered.replace('- ', '')}</li>;
                  }
                  return <p key={i} className="mb-1.5">{rendered}</p>;
                })}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex flex-col space-y-1 max-w-[80%] mr-auto items-start animate-pulse">
            <div className="flex items-center space-x-2 px-1 text-[8px] font-mono text-slate-500 uppercase tracking-widest select-none">
              <span>SAT-TECH AI</span>
              <span>•</span>
              <span className="opacity-75">PROCESSING...</span>
            </div>
            <div className={`p-4 rounded-2xl rounded-tl-none border text-[10px] font-mono flex items-center space-x-3 ${
              isStealthMode ? 'bg-black/80 border-purple-950 text-purple-400' : 'bg-slate-900 border-slate-800 text-cyan-400'
            }`}>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-500" />
              <span className="tracking-widest uppercase">TUNING QUANTUM CODES / COMPUTING DICT...</span>
            </div>
          </div>
        )}
      </div>

      {/* Hardware Overclocking Quick Action Controls */}
      <div className={`p-3.5 border-t grid grid-cols-1 md:grid-cols-3 gap-3 ${
        isStealthMode ? 'border-purple-950 bg-purple-950/10' : 'border-slate-800 bg-slate-900/40'
      }`}>
        {/* Tool 1: Neural Cleanup Filter */}
        <div className="flex flex-col space-y-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Neural Cleanup Filter</span>
            <span className={`text-[8px] font-mono font-bold ${isNeuralCleaning ? 'text-emerald-400' : 'text-slate-500'}`}>
              {isNeuralCleaning ? "ACTIVE [+4.5dB]" : "STANDBY"}
            </span>
          </div>
          <button 
            type="button"
            onClick={onToggleNeuralCleaning}
            className={`w-full py-2 px-2 rounded-lg text-[8.5px] font-mono font-black border transition-all active:scale-95 ${
              isNeuralCleaning 
                ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.25)]' 
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
            }`}
          >
            {isNeuralCleaning ? "DISENGAGE_FILTER [-4.5dB]" : "ENGAGE_NEURAL_FILTER [+4.5dB]"}
          </button>
        </div>

        {/* Tool 2: Decoy Broadcaster */}
        <div className="flex flex-col space-y-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Decoy Broadcaster</span>
            <span className={`text-[8px] font-mono font-bold ${isDecoyActive ? 'text-purple-400 animate-pulse' : 'text-slate-500'}`}>
              {isDecoyActive ? "TRANSMITTING" : "OFFLINE"}
            </span>
          </div>
          <button 
            type="button"
            onClick={onToggleDecoy}
            className={`w-full py-2 px-2 rounded-lg text-[8.5px] font-mono font-black border transition-all active:scale-95 ${
              isDecoyActive 
                ? 'bg-purple-950/70 border-purple-500 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.3)] animate-pulse' 
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
            }`}
          >
            {isDecoyActive ? "TERMINATE_DECOY" : "DEPLOY_RF_DECOYS"}
          </button>
        </div>

        {/* Tool 3: Zero-Point Energy */}
        <div className="flex flex-col space-y-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Zero-Point energy</span>
            <span className={`text-[8px] font-mono font-bold ${isZPEActive ? 'text-cyan-400' : 'text-slate-500'}`}>
              {isZPEActive ? "ENGAGED" : "OFFLINE"}
            </span>
          </div>
          <button 
            type="button"
            onClick={onToggleZPE}
            className={`w-full py-2 px-2 rounded-lg text-[8.5px] font-mono font-black border transition-all active:scale-95 ${
              isZPEActive 
                ? 'bg-cyan-950/70 border-cyan-500 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]' 
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
            }`}
          >
            {isZPEActive ? "DISENGAGE_ZPE" : "ENGAGE_ZPE_GROUNDING"}
          </button>
        </div>
      </div>

      {/* Input Message Area / Form */}
      <form 
        onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
        className={`p-3 border-t flex items-center space-x-2 ${
          isStealthMode ? 'border-purple-950 bg-black' : 'border-slate-800 bg-slate-900/30'
        }`}
      >
        <button
          type="button"
          onClick={clearLog}
          className="p-2 ml-1 text-slate-600 hover:text-red-400 hover:bg-slate-950 border border-transparent hover:border-slate-800 rounded-xl transition"
          title="Recycle Systems Log"
        >
          <Sliders className="w-4 h-4" />
        </button>

        <input 
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={isLoading ? "Please wait..." : "Execute tactical queries (e.g. 'check elevation path', 'mitigate jamming', 'emissions status')..."}
          disabled={isLoading}
          className={`flex-grow bg-slate-950 px-4 py-2.5 rounded-xl text-[11px] font-mono border focus:outline-none focus:ring-0 ${
            isStealthMode 
              ? 'border-purple-950/80 focus:border-purple-500 text-purple-300 placeholder-purple-950' 
              : 'border-slate-800 focus:border-cyan-500 text-slate-200 placeholder-slate-700'
          }`}
        />

        <button
          type="submit"
          disabled={isLoading || !inputMessage.trim()}
          className={`p-2.5 rounded-xl transition font-black uppercase text-[10px] tracking-wider flex items-center justify-center ${
            isStealthMode
              ? 'bg-purple-950/60 border border-purple-800 text-purple-400 hover:bg-purple-900 disabled:opacity-20'
              : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 disabled:opacity-20'
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
