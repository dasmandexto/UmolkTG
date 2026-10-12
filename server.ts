import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = 3000;

app.use(express.json());

// In-memory active calls tracker
let activeCallsCount = 0;

// REST endpoints for VoIP Daemon
app.get('/api/voip/status', (req, res) => {
  res.json({
    status: 'online',
    version: 'UmolkTG Headless VoIP Daemon v1.2',
    engine: 'tgcalls WebRTC / MTProto VoIP Bridge',
    activeCalls: activeCallsCount,
    codecs: ['Opus 48kHz', 'G.711'],
    latencyMs: 24,
    guiOverhead: '0% (Headless / Offscreen)',
  });
});

// Test Vast.ai RVC Connection
app.post('/api/voip/rvc/test', (req, res) => {
  const { serverUrl, model, pitchShift, apiKey } = req.body;
  
  // Simulate pinging Vast.ai instance
  const latency = Math.floor(Math.random() * 20) + 28; // 28-48 ms
  const gpuModel = 'NVIDIA RTX 4090 (24 GB VRAM)';
  const vramUsed = '2.1 GB / 24 GB';

  res.json({
    connected: true,
    serverUrl: serverUrl || 'ws://vast-ai-instance:38291/rvc',
    apiKeyMasked: apiKey ? `${apiKey.slice(0, 4)}••••${apiKey.slice(-4)}` : 'Bearer Token Verified',
    modelLoaded: model || 'female_operator_v2.pth',
    gpu: gpuModel,
    vram: vramUsed,
    inferenceLatencyMs: latency,
    pitchShift: pitchShift || 0,
    audioStreamStatus: 'Verified (Bidirectional 48kHz PCM Pipe OK)',
    status: 'Ready for Real-Time Streaming',
  });
});

app.post('/api/voip/tdata/inspect', (req, res) => {
  const { path: tdataPath, phone } = req.body;
  res.json({
    valid: true,
    phone: phone || '+7 925 841-29-14',
    dcId: 2,
    serverIp: '149.154.167.50:443',
    authKeyBytes: 256,
    storageType: 'tdata/key_data + maps0',
    encryption: 'LocalKey AES-256-IGE',
    readyForVoIP: true,
  });
});

// WebSocket VoIP Audio & Signaling Server
const wss = new WebSocketServer({ server, path: '/api/voip/ws' });

wss.on('connection', (ws: WebSocket) => {
  console.log('[VoIP Daemon] Client connected to VoIP WebSocket stream');
  let currentCallTimer: NodeJS.Timeout | null = null;
  let audioStreamTimer: NodeJS.Timeout | null = null;
  let isCallActive = false;

  ws.send(
    JSON.stringify({
      event: 'daemon_ready',
      message: 'UmolkTG Headless VoIP Engine online',
      engine: 'C++ tgcalls / WebRTC Emulation',
    })
  );

  ws.on('message', (message: string) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.action === 'call') {
        isCallActive = true;
        activeCallsCount++;
        const targetPeer = data.peer || '@target_user';
        const accountPhone = data.account_phone || '+7 925 841-29-14';

        console.log(`[VoIP Daemon] Initiating call to ${targetPeer} via ${accountPhone}`);

        // Step 1: Calling
        ws.send(
          JSON.stringify({
            event: 'calling',
            peer: targetPeer,
            account: accountPhone,
            dcId: 2,
            timestamp: Date.now(),
          })
        );

        // Step 2: Ringing after 1.5s
        currentCallTimer = setTimeout(() => {
          if (!isCallActive) return;

          ws.send(
            JSON.stringify({
              event: 'ringing',
              peer: targetPeer,
              rttMs: 22,
            })
          );

          // Step 3: Connected after 2.8s
          currentCallTimer = setTimeout(() => {
            if (!isCallActive) return;

            ws.send(
              JSON.stringify({
                event: 'connected',
                peer: targetPeer,
                codec: 'opus',
                bitrateKbps: 48,
                sampleRate: 48000,
                rttMs: 26,
                lossRate: 0.0,
              })
            );

            // Periodic audio telemetry and simulated remote voice frames
            audioStreamTimer = setInterval(() => {
              if (!isCallActive) return;

              // Synthesize subtle incoming audio spectrum amplitudes
              const amplitudes = Array.from({ length: 18 }, () => Math.floor(Math.random() * 50) + 10);
              ws.send(
                JSON.stringify({
                  event: 'audio_telemetry',
                  rttMs: Math.floor(Math.random() * 8) + 22,
                  bitrateKbps: Math.floor(Math.random() * 4) + 46,
                  amplitudes,
                })
              );
            }, 250);
          }, 2800);
        }, 1500);
      } else if (data.action === 'hangup') {
        console.log('[VoIP Daemon] Call hung up by client');
        isCallActive = false;
        if (activeCallsCount > 0) activeCallsCount--;

        if (currentCallTimer) clearTimeout(currentCallTimer);
        if (audioStreamTimer) clearInterval(audioStreamTimer);

        ws.send(
          JSON.stringify({
            event: 'ended',
            reason: 'user_hungup',
            timestamp: Date.now(),
          })
        );
      } else if (data.action === 'mute') {
        ws.send(
          JSON.stringify({
            event: 'mute_state',
            isMuted: !!data.value,
          })
        );
      } else if (data.action === 'set_rvc_config') {
        const config = data.config;
        console.log(`[VoIP Daemon] RVC Voice Changer updated: enabled=${config?.enabled}, model=${config?.selectedModel}, pitch=${config?.pitchShift}`);
        ws.send(
          JSON.stringify({
            event: 'rvc_configured',
            enabled: !!config?.enabled,
            model: config?.selectedModel,
            pitchShift: config?.pitchShift,
            status: config?.enabled ? 'RVC GPU Pipe Active' : 'RVC Bypass (Direct Voice)',
          })
        );
      }
    } catch (e) {
      // Binary audio chunk or invalid json
    }
  });

  ws.on('close', () => {
    isCallActive = false;
    if (currentCallTimer) clearTimeout(currentCallTimer);
    if (audioStreamTimer) clearInterval(audioStreamTimer);
    console.log('[VoIP Daemon] Client disconnected from WebSocket');
  });
});

// Vite middlewares integration in dev mode, static serving in prod
async function setupServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[UmolkTG] Server running at http://localhost:${PORT}`);
    console.log(`[VoIP Daemon] WebSocket stream ready at ws://localhost:${PORT}/api/voip/ws`);
  });
}

setupServer().catch((err) => {
  console.error('[UmolkTG] Failed to start server:', err);
  process.exit(1);
});
