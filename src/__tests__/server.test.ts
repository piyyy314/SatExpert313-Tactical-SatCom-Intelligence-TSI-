import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { app, buildSystemPrompt, getGeminiClient } from '../../server.ts';

describe('Express Backend & Gemini Proxy Routes', () => {
  let server: http.Server;
  let baseUrl: string;
  const originalKey = process.env.GEMINI_API_KEY;

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        if (addr && typeof addr === 'object') {
          baseUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    process.env.GEMINI_API_KEY = originalKey;
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it('buildSystemPrompt embeds coordinates, DEFCON level, and stealth prefix instructions', () => {
    const prompt = buildSystemPrompt(
      { lat: 26.5, lng: 56.4, satName: 'Telstar 11N', defcon: 2, weather: 'HEAVY_STORM', isJamming: true },
      { snr: '9.5', rxPower: '-52.0', packetLoss: '4.1', bucTemp: '51.2' },
      { isStealthMode: true, isNeuralCleaning: true, isDecoyActive: false, isZPEActive: true }
    );

    expect(prompt).toContain('Latitude 26.5000°N, Longitude 56.4000°E');
    expect(prompt).toContain('Telstar 11N');
    expect(prompt).toContain('DEFCON 2');
    expect(prompt).toContain('[ENC_MASKED]');
    expect(prompt).toContain('Neural Processing Cleaning: ACTIVE');
    expect(prompt).toContain('Zero-Point Energy Grounding: ENGAGED');
  });

  it('GET /api/health reports online status, server-side capability, and gemini-4-hydrogen model', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('online');
    expect(body.model).toBe('gemini-4-hydrogen');
    expect(body.capabilities).toContain('MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API');
  });

  it('POST /api/chat returns 400 when prompt is missing or empty', async () => {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: '   ' })
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Prompt is required');
  });

  it('POST /api/chat and /api/chat/stream return 503 when GEMINI_API_KEY is unset', async () => {
    delete process.env.GEMINI_API_KEY;
    expect(getGeminiClient()).toBeNull();

    const chatRes = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Status report' })
    });
    expect(chatRes.status).toBe(503);

    const streamRes = await fetch(`${baseUrl}/api/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Status report' })
    });
    expect(streamRes.status).toBe(503);
  });
});
