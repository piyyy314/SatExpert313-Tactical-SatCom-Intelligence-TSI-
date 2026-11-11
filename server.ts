import express, { Request, Response } from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health and Capabilities endpoint
app.get('/api/health', (req: Request, res: Response) => {
  const apiKey = process.env.GEMINI_API_KEY;
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    capabilities: ['MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API'],
    hasGeminiKey: Boolean(apiKey && apiKey !== 'undefined' && apiKey !== ''),
    model: 'gemini-3.8-flash'
  });
});

// Helper to initialize GoogleGenAI securely on the server
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'undefined' || apiKey === '') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'satexpert-tsi-server/1.0',
      }
    }
  });
}

function buildSystemPrompt(context: any, telemetry: any, flags: any): string {
  const lat = context?.lat != null ? Number(context.lat).toFixed(4) : '26.4000';
  const lng = context?.lng != null ? Number(context.lng).toFixed(4) : '56.5000';
  const satName = context?.satName || 'Telstar 11N (37.5°W)';
  const defcon = context?.defcon ?? 5;
  const weather = context?.weather || 'CLEAR';
  const isJamming = Boolean(context?.isJamming);
  const snr = telemetry?.snr || '14.2';
  const rxPower = telemetry?.rxPower || '-48.5';
  const packetLoss = telemetry?.packetLoss || '0.0';
  const bucTemp = telemetry?.bucTemp || '42.0';
  const isStealthMode = Boolean(flags?.isStealthMode);
  const isNeuralCleaning = Boolean(flags?.isNeuralCleaning);
  const isDecoyActive = Boolean(flags?.isDecoyActive);
  const isZPEActive = Boolean(flags?.isZPEActive);

  return `You are the SatExpert TSI Tactical AI Technician (Unit Designation: SAT-TECH-9000).
Your job is to provide tactical VSAT satellite communications engineering analysis and advice.
You operate on an interactive portable SatCom terminal dashboard.
Current real-time system context:
- Base Coordinates: Latitude ${lat}°N, Longitude ${lng}°E
- Target Satellite: ${satName}
- Alert Status: DEFCON ${defcon}
- Local Weather Condition: ${weather}
- Active Jamming Interference: ${isJamming ? 'YES' : 'NO'}
- Signal Quality: SNR ${snr} dB, Rx Power ${rxPower} dBm, Packet Loss ${packetLoss}%
- BUC Temperature: ${bucTemp} °C
- Stealth Mode Status: ${isStealthMode ? 'ACTIVE (LOW OBSERVABILITY SIGNATURE)' : 'INACTIVE (FULL CARRIER BROADCAST)'}
- Neural Processing Cleaning: ${isNeuralCleaning ? 'ACTIVE (+4.5dB gain)' : 'INACTIVE'}
- Decoy Transmitter: ${isDecoyActive ? 'DEPLOYED (Synthetic RF)' : 'STANDBY'}
- Zero-Point Energy Grounding: ${isZPEActive ? 'ENGAGED' : 'OFFLINE'}

Keep your responses highly concise, extremely technical, professional, and formatted in clean markdown. 
Use bullet points and bold headings. Give precise physical/mathematical advice (like Rain Fade attenuation in dB, modulation switching, Polarization Skew angle adjustments, or RF Shielding checks). 
If Stealth Mode is active, prepend your responses with "[ENC_MASKED] Tactical signature low-visibility log:" and keep the advice even more concise and command-focused.`;
}

// Server-side Gemini API Chat Endpoint (Non-streaming)
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { prompt, context, telemetry, isStealthMode, isNeuralCleaning, isDecoyActive, isZPEActive } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({ 
        error: 'GEMINI_API_KEY_UNAVAILABLE',
        message: 'Server Gemini API key is not configured. Client fallback should be engaged.' 
      });
      return;
    }

    const systemPrompt = buildSystemPrompt(context, telemetry, {
      isStealthMode,
      isNeuralCleaning,
      isDecoyActive,
      isZPEActive
    });

    let replyText = '';
    let usedModel = 'gemini-3.8-flash';

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
          topP: 0.9,
        }
      });
      replyText = response.text || 'No response returned from tactical model.';
    } catch (primaryErr: any) {
      console.warn('[Server Gemini primary model 3.8-flash busy/failed, falling back to gemini-2.5-flash]:', primaryErr?.message);
      usedModel = 'gemini-2.5-flash';
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
          topP: 0.9,
        }
      });
      replyText = fallbackResponse.text || 'No response returned from fallback tactical model.';
    }

    res.json({
      status: 'success',
      text: replyText,
      model: usedModel,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[Server Gemini Error]:', error);
    res.status(500).json({
      error: 'SERVER_GEMINI_ERROR',
      message: error?.message || 'Failed to generate response'
    });
  }
});

// Server-side Gemini API Streaming Endpoint (SSE)
app.post('/api/chat/stream', async (req: Request, res: Response) => {
  try {
    const { prompt, context, telemetry, isStealthMode, isNeuralCleaning, isDecoyActive, isZPEActive } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({ 
        error: 'GEMINI_API_KEY_UNAVAILABLE',
        message: 'Server Gemini API key is not configured.' 
      });
      return;
    }

    const systemPrompt = buildSystemPrompt(context, telemetry, {
      isStealthMode,
      isNeuralCleaning,
      isDecoyActive,
      isZPEActive
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
        topP: 0.9,
      }
    });

    for await (const chunk of responseStream) {
      const chunkText = chunk.text;
      if (chunkText) {
        res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error: any) {
    console.error('[Server Gemini Stream Error]:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'SERVER_GEMINI_STREAM_ERROR',
        message: error?.message || 'Stream generation failed'
      });
    } else {
      res.write(`data: ${JSON.stringify({ error: error?.message || 'Stream error' })}\n\n`);
      res.end();
    }
  }
});

// Full-Stack Dev / Prod mounting
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: { server } },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[SatExpert TSI] Vite middleware mounted in Express development mode.');
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
    console.log(`[SatExpert TSI] Serving production static files from ${distPath}`);
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[SatExpert TSI] Server active at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[SatExpert TSI] Failed to start server:', err);
  process.exit(1);
});
