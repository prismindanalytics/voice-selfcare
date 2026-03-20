/**
 * Voice Self-Care Agent — Express server
 *
 * Handles:
 *  - OpenAI SIP webhook  (/openai/webhook)   ← primary voice path
 *  - SignalWire LAML     (/signalwire/voice)  ← alternative PSTN path
 *  - Twilio TwiML        (/twilio/voice)      ← alternative PSTN path
 *  - WebSocket           (/media-stream/:id)  ← Twilio Media Streams (legacy)
 *  - Health check        (/health)
 */

require('dotenv').config();
const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);

// Accept both standard JSON and CloudEvents JSON (OpenAI sends application/cloudevents+json)
app.use(express.json({
  type: ['application/json', 'application/*+json'],
  verify: (req, _res, buf) => {
    try { req.rawBody = buf ? buf.toString('utf8') : ''; } catch (_) { req.rawBody = ''; }
  }
}));
app.use(express.urlencoded({ extended: true }));

// OpenAI SIP webhook router
const sipHandler = require('./sip-handler');
app.use(sipHandler);

const PORT = process.env.PORT || 8080;
const PUBLIC_URL = process.env.PUBLIC_URL;

const activeSessions = new Map();

// ─── Codec helpers ────────────────────────────────────────────────────────────

function mapG711ToSip(codec) {
  switch ((codec || '').toLowerCase()) {
    case 'g711_ulaw': case 'pcmu': case 'ulaw': return 'PCMU';
    case 'g711_alaw': case 'pcma': case 'alaw': return 'PCMA';
    default: return '';
  }
}

// ─── SignalWire LAML webhook ──────────────────────────────────────────────────

app.post('/signalwire/voice', (req, res) => {
  console.log('[SignalWire] Incoming call');

  try {
    const { From, To } = req.body || {};
    if (From) {
      const { setLastCaller } = require('./caller-registry');
      setLastCaller(From);
      console.log(`[SignalWire] Cached caller From=${From}`);
    }
  } catch (e) {
    console.error('[SignalWire] Error caching caller:', e.message);
  }

  const openaiProjectId = process.env.OPENAI_PROJECT_ID || '';
  if (!openaiProjectId) {
    console.error('[SignalWire] OPENAI_PROJECT_ID not set');
    return res.status(500).send('Server not configured');
  }

  const sipUri = `sip:${openaiProjectId}@sip.api.openai.com;transport=tls`;
  const codecEnv = (process.env.TELEPHONY_CODEC || '').toLowerCase();
  const sipCodecs = process.env.SIP_CODECS || mapG711ToSip(codecEnv);
  const codecsAttr = sipCodecs ? ` codecs="${sipCodecs}"` : '';

  console.log(`[SignalWire] Forwarding to: ${sipUri}`);

  res.type('text/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Connecting to your healthcare assistant, please wait.</Say>
  <Dial>
    <Sip${codecsAttr}>${sipUri}</Sip>
  </Dial>
</Response>`);
});

app.post('/signalwire/dial-status', (req, res) => {
  const { DialCallStatus, DialSipResponseCode } = req.body || {};
  if (['failed', 'no-answer', 'busy'].includes(DialCallStatus)) {
    console.error(`[SignalWire] Dial failed: status=${DialCallStatus}, sip=${DialSipResponseCode}`);
  } else {
    console.log(`[SignalWire] Dial status: ${DialCallStatus}`);
  }
  res.type('text/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>We're sorry, we couldn't connect your call. Please try again later.</Say>
  <Hangup/>
</Response>`);
});

app.post('/signalwire/status', (req, res) => {
  const { From } = req.body || {};
  if (From) {
    try {
      const { setLastCaller } = require('./caller-registry');
      setLastCaller(From);
    } catch (_) {}
  }
  res.sendStatus(200);
});

// ─── Twilio TwiML webhook ─────────────────────────────────────────────────────

function handleTwilioVoice(req, res, forcedCodecs) {
  try {
    const openaiProjectId = process.env.OPENAI_PROJECT_ID || '';
    if (!openaiProjectId) {
      console.error('[Twilio] OPENAI_PROJECT_ID not set');
      return res.status(500).send('Server not configured');
    }

    try {
      const { From } = req.body || {};
      if (From) {
        const { setLastCaller } = require('./caller-registry');
        setLastCaller(From);
        console.log(`[Twilio] Cached caller: ${From}`);
      }
    } catch (e) {
      console.error('[Twilio] Error caching caller:', e.message);
    }

    const envCodecs = (process.env.TWILIO_SIP_CODECS || '').trim();
    const sipCodecs = forcedCodecs || envCodecs || '';
    const sipUri = `sip:${openaiProjectId}@sip.api.openai.com;transport=tls`;
    const codecsAttr = sipCodecs ? ` codecs="${sipCodecs}"` : '';

    console.log(`[Twilio] Dialing ${sipUri} (codecs: ${sipCodecs || 'default'})`);

    res.type('text/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Connecting to your healthcare assistant, please wait.</Say>
  <Dial>
    <Sip${codecsAttr}>${sipUri}</Sip>
  </Dial>
</Response>`);
  } catch (e) {
    console.error('[Twilio] Error generating TwiML:', e.message);
    res.status(500).send('Internal error');
  }
}

// Default — let SIP negotiate codec
app.post('/twilio/voice', (req, res) => handleTwilioVoice(req, res));

// Convenience endpoints to force a specific codec without changing env vars
app.post('/twilio/voice/pcmu', (req, res) => handleTwilioVoice(req, res, 'PCMU'));
app.post('/twilio/voice/pcma', (req, res) => handleTwilioVoice(req, res, 'PCMA'));

app.post('/twilio/status', (req, res) => {
  try { console.log('[Twilio] Status:', JSON.stringify(req.body || {})); } catch (_) {}
  res.sendStatus(200);
});

// ─── WebSocket / Media Streams (Twilio legacy path) ──────────────────────────

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  const pathMatch = req.url.match(/^\/media-stream\/(.+)$/);
  if (!pathMatch) { ws.close(); return; }

  const sessionId = pathMatch[1];
  console.log(`[WebSocket] Connection for session ${sessionId}`);

  const session = { id: sessionId, ws, callSid: null, streamSid: null, realtimeClient: null, metadata: {} };
  activeSessions.set(sessionId, session);

  const RealtimeClient = require('./realtime-client');
  session.realtimeClient = new RealtimeClient(session);

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      switch (data.event) {
        case 'start':
          session.callSid = data.start.callSid;
          session.streamSid = data.start.streamSid;
          session.metadata = data.start.customParameters || {};
          await session.realtimeClient.connect();
          break;
        case 'media':
          if (data.media?.payload) session.realtimeClient.sendAudio(Buffer.from(data.media.payload, 'base64'));
          break;
        case 'stop':
          if (session.realtimeClient) session.realtimeClient.disconnect();
          break;
      }
    } catch (error) {
      console.error('[WebSocket] Error processing message:', error.message);
    }
  });

  ws.on('close', () => {
    console.log(`[WebSocket] Closed for session ${sessionId}`);
    if (session.realtimeClient) session.realtimeClient.disconnect();
    activeSessions.delete(sessionId);
  });

  ws.on('error', (error) => console.error(`[WebSocket] Error for session ${sessionId}:`, error.message));
});

// TTS relay endpoint (used by realtime-client.js → SignalWire redirect)
app.post('/signalwire/say/:sessionId', (req, res) => {
  const session = activeSessions.get(req.params.sessionId);
  if (session?.pendingText) {
    const text = session.pendingText;
    session.pendingText = null;
    res.type('text/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${text}</Say>
  <Redirect>${PUBLIC_URL}/media-stream/${req.params.sessionId}</Redirect>
</Response>`);
  } else {
    res.type('text/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<Response><Pause length="60"/></Response>`);
  }
});

// ─── Health check ─────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', activeSessions: activeSessions.size, timestamp: new Date().toISOString() });
});

// Readiness probe for the OpenAI webhook endpoint
app.get('/openai/webhook', (_req, res) => {
  res.json({ status: 'webhook_ready', timestamp: new Date().toISOString() });
});

// ─── Catch-all ────────────────────────────────────────────────────────────────

app.all('*', (req, res) => {
  console.log(`[Server] Unhandled ${req.method} ${req.url}`);
  res.status(404).send('Not Found');
});

// ─── Start ────────────────────────────────────────────────────────────────────

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] Listening on 0.0.0.0:${PORT}`);
  if (PUBLIC_URL) console.log(`[Server] Public URL: ${PUBLIC_URL}`);
});
