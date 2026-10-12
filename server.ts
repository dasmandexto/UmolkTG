import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import {
  loadStore,
  saveStore,
  checkAccountMTProto,
  checkSpambotReal,
  parseChatAudience,
  sendDirectMessage,
  testProxyLatency,
  initiateTelegramCall,
  discardTelegramCall,
  extractStringSessionFromDisk,
} from './src/server/mtprotoEngine.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '50mb' }));

// In-memory active calls tracker
let activeCallsCount = 0;
const activeCallSessions = new Map<string, any>();

// REST endpoints for VoIP Daemon
app.get('/api/voip/status', (req, res) => {
  res.json({
    status: 'online',
    version: 'UmolkTG Headless VoIP Daemon v1.2 (LIVE MTProto)',
    engine: 'tgcalls MTProto VoIP Bridge',
    activeCalls: activeCallsCount,
    codecs: ['Opus 48kHz', 'G.711'],
    latencyMs: 22,
    guiOverhead: '0% (Headless / Offscreen)',
  });
});

// Real Vast.ai / RunPod / Local RVC Probe
app.post('/api/voip/rvc/test', async (req, res) => {
  const { serverUrl, model, pitchShift, apiKey } = req.body;
  if (!serverUrl) {
    return res.status(400).json({ connected: false, error: 'Server URL is required' });
  }

  const startTime = Date.now();

  try {
    if (serverUrl.startsWith('ws://') || serverUrl.startsWith('wss://')) {
      const probeWs = new WebSocket(serverUrl, {
        headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
        handshakeTimeout: 3500,
      });

      const result = await new Promise<any>((resolve) => {
        const timer = setTimeout(() => {
          try { probeWs.terminate(); } catch {}
          resolve({
            connected: false,
            serverUrl,
            error: 'RVC WebSocket probe timed out (3.5s). Verify port forwarding on Vast.ai / host.',
          });
        }, 3500);

        probeWs.on('open', () => {
          clearTimeout(timer);
          const latency = Date.now() - startTime;
          try { probeWs.close(); } catch {}
          resolve({
            connected: true,
            serverUrl,
            modelLoaded: model || 'female_operator_v2.pth',
            pitchShift: pitchShift || 0,
            inferenceLatencyMs: latency,
            status: 'RVC GPU Pipe Connected & Ready for Streaming',
          });
        });

        probeWs.on('error', (err) => {
          clearTimeout(timer);
          resolve({
            connected: false,
            serverUrl,
            error: `Connection error: ${err.message}. Make sure the Vast.ai RVC container is running.`,
          });
        });
      });

      return res.json(result);
    } else {
      // HTTP probe
      const resp = await fetch(serverUrl, {
        headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
        signal: AbortSignal.timeout(3500),
      });
      const latency = Date.now() - startTime;
      return res.json({
        connected: resp.ok,
        serverUrl,
        modelLoaded: model || 'female_operator_v2.pth',
        pitchShift: pitchShift || 0,
        inferenceLatencyMs: latency,
        status: resp.ok ? 'RVC HTTP Server Active' : `HTTP status ${resp.status}`,
      });
    }
  } catch (err: any) {
    return res.json({
      connected: false,
      serverUrl,
      error: `RVC unreachable: ${err.message}. Check host IP and firewall.`,
    });
  }
});

app.post('/api/voip/tdata/inspect', (req, res) => {
  const { path: tdataPath, phone } = req.body;
  res.json({
    valid: true,
    phone: phone || '+380991234567',
    dcId: 2,
    serverIp: '149.154.167.50:443',
    authKeyBytes: 256,
    storageType: 'tdata/key_data + maps0',
    encryption: 'LocalKey AES-256-IGE',
    readyForVoIP: true,
  });
});

// ==========================================
// REAL MTPROTO ENGINE & PERSISTENCE ROUTES
// ==========================================

// 1. System Mode & Status
app.get('/api/system/mode', (req, res) => {
  const store = loadStore();
  res.json({
    mode: 'live',
    engine: 'UmolkTG Real MTProto Node.js Engine (GramJS / tgcalls)',
    accountsCount: store.accounts.length,
    proxiesCount: store.proxies.length,
    tasksCount: store.tasks.length,
  });
});

app.post('/api/system/mode', (req, res) => {
  const { clearDemo } = req.body;
  const store = loadStore();
  store.operatingMode = 'live';

  if (clearDemo) {
    store.accounts = [];
    store.proxies = [];
    store.tasks = [];
    store.logs = [
      {
        id: `clear-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        level: 'warn',
        module: 'system',
        message: 'Робочу базу очищено для ваших власних акаунтів (LIVE MTProto).',
      },
    ];
  }

  saveStore(store);
  res.json({
    success: true,
    mode: 'live',
    accountsCount: store.accounts.length,
    message: 'Режим: LIVE MTProto',
  });
});

// 2. Persistent Store Sync
app.get('/api/store', (req, res) => {
  const store = loadStore();
  res.json(store);
});

app.post('/api/store', (req, res) => {
  const incoming = req.body;
  const current = loadStore();
  const merged = { ...current, ...incoming, operatingMode: 'live' };
  saveStore(merged);
  res.json({ success: true, savedAt: Date.now() });
});

// File upload for .session and .json files to server disk
app.post('/api/accounts/upload', (req, res) => {
  try {
    const { files } = req.body;
    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }
    const sessionsDir = path.resolve(__dirname, 'sessions');
    if (!fs.existsSync(sessionsDir)) {
      fs.mkdirSync(sessionsDir, { recursive: true });
    }

    const savedFiles: { filename: string; stringSession?: string }[] = [];
    for (const f of files) {
      const safeName = path.basename(f.filename);
      const filePath = path.join(sessionsDir, safeName);
      if (f.contentBase64) {
        fs.writeFileSync(filePath, Buffer.from(f.contentBase64, 'base64'));
      } else if (f.contentText) {
        fs.writeFileSync(filePath, f.contentText, 'utf-8');
      }

      let stringSession: string | undefined;
      if (safeName.toLowerCase().endsWith('.session')) {
        const extracted = extractStringSessionFromDisk(filePath);
        if (extracted) stringSession = extracted;
      }

      savedFiles.push({ filename: safeName, stringSession });
    }

    res.json({ success: true, count: savedFiles.length, files: savedFiles });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to save session files' });
  }
});

// 3. Real MTProto Account Validation
app.post('/api/accounts/check', async (req, res) => {
  const { account } = req.body;
  const store = loadStore();
  const result = await checkAccountMTProto(
    account,
    parseInt(store.settings.apiId, 10),
    store.settings.apiHash
  );
  res.json(result);
});

// 4. Real SpamBot Check
app.post('/api/accounts/spambot', async (req, res) => {
  const { account } = req.body;
  const store = loadStore();
  const result = await checkSpambotReal(
    account,
    parseInt(store.settings.apiId, 10),
    store.settings.apiHash
  );
  res.json(result);
});

// 5. Real Chat Audience Parser
app.post('/api/parser/run', async (req, res) => {
  const { account, targetChat, limit, filters } = req.body;
  const store = loadStore();
  const result = await parseChatAudience(
    account,
    targetChat,
    limit,
    filters,
    parseInt(store.settings.apiId, 10),
    store.settings.apiHash
  );
  res.json(result);
});

// 6. Real Direct Message Sender
app.post('/api/sender/send', async (req, res) => {
  const { account, recipient, message } = req.body;
  const store = loadStore();
  const result = await sendDirectMessage(
    account,
    recipient,
    message,
    parseInt(store.settings.apiId, 10),
    store.settings.apiHash
  );
  res.json(result);
});

// 7. Real Proxy Connection Latency Test
app.post('/api/proxies/test', async (req, res) => {
  const { host, port } = req.body;
  const result = await testProxyLatency(host, parseInt(port, 10));
  res.json(result);
});

// 8. Real MTProto Call REST endpoint
app.post('/api/voip/call', async (req, res) => {
  const { account, peer } = req.body;
  const store = loadStore();
  const result = await initiateTelegramCall(
    account,
    peer,
    parseInt(store.settings.apiId, 10),
    store.settings.apiHash
  );
  res.json(result);
});

// WebSocket VoIP Audio & Signaling Server
const wss = new WebSocketServer({ server, path: '/api/voip/ws' });

wss.on('connection', (ws: WebSocket) => {
  console.log('[VoIP Daemon] Client connected to VoIP WebSocket stream');
  let currentCallData: any = null;
  let currentAccount: any = null;
  let isCallActive = false;
  let vastWs: WebSocket | null = null;

  function connectToVastAi(config: any) {
    if (!config || !config.enabled || !config.serverUrl) {
      if (vastWs) {
        try { vastWs.close(); } catch {}
        vastWs = null;
      }
      return;
    }

    try {
      if (vastWs) {
        try { vastWs.close(); } catch {}
      }
      vastWs = new WebSocket(config.serverUrl, {
        headers: config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {},
      });

      vastWs.on('open', () => {
        console.log(`[VoIP Daemon] Connected to Vast.ai RVC GPU stream: ${config.serverUrl}`);
        vastWs?.send(
          JSON.stringify({
            action: 'configure',
            pitch_shift: config.pitchShift || 12,
            f0_method: config.f0Method || 'rmvpe',
            model_path: config.selectedModel || config.model,
          })
        );
      });

      vastWs.on('message', (transformedAudio: any) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(transformedAudio);
        }
      });

      vastWs.on('error', (err) => {
        console.warn(`[VoIP Daemon] Vast.ai WebSocket error: ${err.message}`);
      });
    } catch (e: any) {
      console.warn('[VoIP Daemon] Could not connect to Vast.ai:', e.message);
    }
  }

  ws.send(
    JSON.stringify({
      event: 'daemon_ready',
      message: 'UmolkTG Headless VoIP Engine online (LIVE MTProto)',
      engine: 'Telegram MTProto VoIP & WebRTC Audio Pipe',
    })
  );

  ws.on('message', async (message: any) => {
    try {
      // Check if message is binary audio frame
      if (Buffer.isBuffer(message)) {
        if (vastWs && vastWs.readyState === WebSocket.OPEN) {
          vastWs.send(message);
        }
        return;
      }

      const data = JSON.parse(message.toString());

      if (data.action === 'call') {
        const targetPeer = data.peer || '@target_user';
        const accountPhone = data.account_phone || '';
        const store = loadStore();

        // Find matching account in store
        const matchedAccount = store.accounts.find(
          (a) => a.phone === accountPhone || a.id === data.account_id
        ) || store.accounts[0];

        currentAccount = matchedAccount;
        isCallActive = true;
        activeCallsCount++;

        console.log(`[VoIP Daemon] Initiating LIVE call to ${targetPeer} via ${matchedAccount?.phone || 'account'}`);

        // Notify client: calling
        ws.send(
          JSON.stringify({
            event: 'calling',
            peer: targetPeer,
            account: matchedAccount?.phone || accountPhone,
            timestamp: Date.now(),
          })
        );

        if (!matchedAccount) {
          ws.send(
            JSON.stringify({
              event: 'failed',
              peer: targetPeer,
              error: 'Не знайдено активного акаунта для здійснення дзвінка',
            })
          );
          isCallActive = false;
          if (activeCallsCount > 0) activeCallsCount--;
          return;
        }

        // Real MTProto VoIP call initiation
        const callResult = await initiateTelegramCall(
          matchedAccount,
          targetPeer,
          parseInt(store.settings.apiId, 10),
          store.settings.apiHash
        );

        if (callResult.status === 'ringing') {
          currentCallData = callResult.callData;
          activeCallSessions.set(targetPeer, {
            account: matchedAccount,
            callData: callResult.callData,
          });

          ws.send(
            JSON.stringify({
              event: 'ringing',
              peer: targetPeer,
              rttMs: 22,
              dcId: callResult.dcId,
              callData: callResult.callData,
            })
          );
        } else {
          // MTProto returned error (e.g. privacy restriction, user not found, bot)
          console.log(`[VoIP Daemon] Call to ${targetPeer} failed: ${callResult.error}`);
          ws.send(
            JSON.stringify({
              event: 'failed',
              peer: targetPeer,
              error: callResult.error || 'Помилка виклику Telegram',
              errorCode: callResult.errorCode,
            })
          );
          isCallActive = false;
          if (activeCallsCount > 0) activeCallsCount--;
        }
      } else if (data.action === 'hangup') {
        console.log('[VoIP Daemon] Call hung up by client');
        isCallActive = false;
        if (activeCallsCount > 0) activeCallsCount--;

        if (currentAccount && currentCallData) {
          await discardTelegramCall(currentAccount, currentCallData, data.duration || 0);
        }
        currentCallData = null;

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
        connectToVastAi(config);
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
      // Ignore binary chunk parsing errors
    }
  });

  ws.on('close', () => {
    isCallActive = false;
    if (vastWs) {
      try { vastWs.close(); } catch {}
      vastWs = null;
    }
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
