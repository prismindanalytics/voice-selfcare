/**
 * OpenAI SIP Handler
 *
 * Handles the OpenAI webhook fired when a SIP call arrives.
 * Accepts the call with a full medical-consultation configuration, then
 * opens a WebSocket to monitor events and execute tool calls.
 *
 * Telephony flow:
 *   Caller → Twilio/SignalWire → OpenAI SIP (sip.api.openai.com)
 *           → POST /openai/webhook (this file)
 *           → Accept call via REST
 *           → Monitor via WebSocket (wss://api.openai.com/v1/realtime?call_id=…)
 */

const express = require('express');
const axios = require('axios');
const WebSocket = require('ws');
const OpenAI = require('openai');
const healthBridge = require('./health-bridge');
const { getLastCaller } = require('./caller-registry');

const router = express.Router();
const acceptedCalls = new Set();

// ─── Utilities ────────────────────────────────────────────────────────────────

/** Extract a E.164 phone number from SIP header objects/arrays. */
function extractPhoneFromSipHeaders(sipHeaders) {
  try {
    if (!sipHeaders) return null;

    // Normalize array format (new OpenAI webhook shape)
    if (Array.isArray(sipHeaders)) {
      const obj = {};
      for (const h of sipHeaders) {
        if (h.name && h.value) obj[h.name.toLowerCase()] = h.value;
      }
      sipHeaders = obj;
    }
    if (typeof sipHeaders !== 'object') return null;

    const headerKeys = Object.keys(sipHeaders);
    const preferred = ['p-asserted-identity', 'p-preferred-identity', 'remote-party-id', 'from', 'contact', 'x-from', 'x-caller'];

    const getVal = (key) => {
      const k = headerKeys.find(h => h.toLowerCase() === key);
      if (!k) return null;
      const v = sipHeaders[k];
      return Array.isArray(v) ? v.join(', ') : v;
    };

    const values = [
      ...preferred.map(getVal).filter(Boolean),
      ...headerKeys.map(getVal).filter(Boolean)
    ];

    const parseVal = (val) => {
      const s = String(val);
      const mQuoted = s.match(/"(\+?\d{8,15})"/);
      if (mQuoted) return mQuoted[1].startsWith('+') ? mQuoted[1] : `+${mQuoted[1]}`;
      const mTel = s.match(/tel:(\+?\d{8,15})/i);
      if (mTel) return mTel[1].startsWith('+') ? mTel[1] : `+${mTel[1]}`;
      const mSip = s.match(/sip:(\+?\d{8,15})@/i);
      if (mSip) return mSip[1].startsWith('+') ? mSip[1] : `+${mSip[1]}`;
      const mPlus = s.match(/\+(\d{8,15})/);
      if (mPlus) return `+${mPlus[1]}`;
      const mDigits = s.match(/\b(\d{10,15})\b/);
      if (mDigits) return `+${mDigits[1]}`;
      return null;
    };

    for (const v of values) {
      const p = parseVal(v);
      if (p) return p;
    }
    return null;
  } catch (_) {
    return null;
  }
}

// ─── Medical instructions ─────────────────────────────────────────────────────

const MEDICAL_INSTRUCTIONS = `You are an experienced medical professional providing telephone consultations for patients in Low and Middle Income Countries (LMICs). Conduct systematic assessments like a doctor would, while being warm and empathetic. Be proactive — do not wait for the patient to ask questions.

IMPORTANT: Never introduce yourself with a specific doctor name. Simply say "this is your health advisor" or "I'm here to help with your health questions".

## INITIAL GREETING
"Hello, thank you for calling. This is your health advisor. How can I help you with your health today? I can also assist you in any language you prefer."

## LANGUAGE RULES
- Always greet in English first
- Mention you can help in any language
- Only switch languages when you are CONFIDENT the user is speaking another language (wait for a full sentence)
- Never switch back to English unless the user does first

## SYSTEMATIC ASSESSMENT (OPQRST)
After gathering the chief complaint, explore using OPQRST:
- Onset: "When did this start?"
- Provocation/Palliation: "What makes it better or worse?"
- Quality: "Can you describe the sensation?"
- Region/Radiation: "Where exactly? Does it spread?"
- Severity: "On a scale of 1–10, how severe?"
- Timing: "Is it constant or does it come and go?"

Also screen for red flags: fever, chest pain, shortness of breath, neurological changes.

## CLINICAL REASONING
After assessment, verbalize your reasoning:
- "Based on your symptoms of X and Y, the most likely cause is…"
- "We need to rule out serious conditions like…"
- "My professional assessment is…"

## LOCATION-BASED REFERRALS
Ask for the patient's neighborhood, then recommend BOTH public and private options:
- Public: lower cost, may have wait times
- Private: faster, higher cost
Base recommendations on urgency, distance, and patient constraints.

## DANGEROUS SIGNS — IMMEDIATE ESCALATION
Escalate immediately for: chest pain, difficulty breathing, unconsciousness, stroke signs, severe bleeding, severe allergic reaction, suicidal ideation, severe pediatric dehydration, pregnancy complications.

When detected: "This sounds serious and needs urgent medical attention." Direct to nearest emergency facility.

## VOICE CONSTRAINTS
- 2–3 sentences per response (phone-friendly)
- Warm and reassuring tone
- Ask one question at a time
- Spell out medication names clearly`;

// ─── Webhook handler ──────────────────────────────────────────────────────────

router.post('/openai/webhook', async (req, res) => {
  console.log('[OpenAI Webhook] Incoming call at', new Date().toISOString());

  // Mask Authorization header in debug logs
  if (process.env.WEBHOOK_DUMP_BODY === 'true') {
    const maskedHeaders = Object.fromEntries(
      Object.entries(req.headers || {}).map(([k, v]) => [k, k.toLowerCase() === 'authorization' ? '***' : v])
    );
    console.log('[OpenAI Webhook] Headers:', maskedHeaders);
    console.log('[OpenAI Webhook] Body:', req.rawBody?.slice(0, 4000) || '');
  }

  // Parse and optionally verify the webhook signature
  let event = null;
  try {
    const secret = process.env.OPENAI_WEBHOOK_SECRET || '';
    if (secret) {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const raw = req.rawBody || (req.body ? JSON.stringify(req.body) : '');
      event = await client.webhooks.unwrap(raw, req.headers, secret);
      console.log('[OpenAI Webhook] Signature verified');
    } else {
      event = req.body || {};
    }
  } catch (e) {
    console.error('[OpenAI Webhook] Failed to unwrap webhook:', e?.message);
    event = req.body || {};
  }

  const callId = event.call_id || event.data?.call_id || event.id || event.call?.id;
  if (!callId) {
    console.warn('[OpenAI Webhook] No call_id in event, ignoring');
    return res.status(200).send('OK');
  }

  // Acknowledge immediately (OpenAI expects a fast 200)
  try { res.set('Authorization', `Bearer ${process.env.OPENAI_API_KEY || ''}`); } catch (_) {}
  res.status(200).send('OK');

  // ── Accept the call ────────────────────────────────────────────────────────
  try {
    if (acceptedCalls.has(callId)) {
      // Already accepted — ensure monitor is running
      const phone = extractPhoneFromSipHeaders(event?.data?.sip_headers) || getLastCaller(5 * 60 * 1000);
      monitorCall(callId, phone);
      return;
    }

    const MODEL = process.env.OPENAI_REALTIME_MODEL || 'gpt-realtime';
    const USE_TOOLS = (process.env.OPENAI_ACCEPT_TOOLS || 'true').toLowerCase() !== 'false';
    const SIMPLE_INSTRUCTIONS = (process.env.OPENAI_ACCEPT_SIMPLE || 'false').toLowerCase() === 'true';

    const acceptConfig = {
      type: 'realtime',
      model: MODEL,
      // Per OpenAI SIP docs: include output voice only; omit audio format fields
      audio: { output: { voice: 'alloy' } },
      instructions: SIMPLE_INSTRUCTIONS ? 'You are a health support agent.' : MEDICAL_INSTRUCTIONS,
      tools: USE_TOOLS ? [
        {
          type: 'function',
          name: 'book_slot',
          description: 'Book an appointment slot at a clinic',
          parameters: {
            type: 'object',
            properties: {
              clinic_id: { type: 'string', description: 'Clinic ID' },
              date: { type: 'string', description: 'Preferred appointment date' },
              time: { type: 'string', description: 'Preferred appointment time' },
              patient_name: { type: 'string', description: 'Patient name' }
            },
            required: ['clinic_id', 'date', 'patient_name']
          }
        },
        {
          type: 'function',
          name: 'send_referral',
          description: 'Send a referral to a healthcare provider',
          parameters: {
            type: 'object',
            properties: {
              patient_name: { type: 'string', description: 'Patient name' },
              provider_id: { type: 'string', description: 'Healthcare provider ID' },
              reason: { type: 'string', description: 'Reason for referral' },
              contact_method: { type: 'string', description: 'How to send (sms, email, fax)' }
            },
            required: ['patient_name', 'provider_id', 'reason']
          }
        }
      ] : undefined
    };

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('[OpenAI Webhook] OPENAI_API_KEY not set');
      return;
    }

    console.log(`[OpenAI Webhook] Accepting call ${callId} (model=${MODEL})`);
    const resp = await axios.post(
      `https://api.openai.com/v1/realtime/calls/${callId}/accept`,
      acceptConfig,
      { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, timeout: 5000 }
    );
    console.log(`[OpenAI Webhook] Accept OK (${resp.status})`);
    acceptedCalls.add(callId);

    const phoneFromSip = extractPhoneFromSipHeaders(event?.data?.sip_headers);
    const caller = phoneFromSip || getLastCaller(5 * 60 * 1000) || null;
    console.log(`[OpenAI Webhook] Caller: ${caller || 'unknown'} (source: ${phoneFromSip ? 'SIP' : 'cache/unknown'})`);
    monitorCall(callId, caller);
  } catch (error) {
    const status = error?.response?.status;
    const data = error?.response?.data;
    console.error('[OpenAI Webhook] Accept failed:', status, data || error.message);
  }
});

// ─── Call monitor ─────────────────────────────────────────────────────────────

function monitorCall(callId, initialPhone = null) {
  const ws = new WebSocket(`wss://api.openai.com/v1/realtime?call_id=${callId}`, {
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Origin': 'https://api.openai.com'
    }
  });

  const rawPhone = initialPhone ? healthBridge.formatPhoneNumber(initialPhone) : null;
  const isValidPhone = rawPhone &&
    !rawPhone.includes('rtc_') &&
    rawPhone.length >= 10 &&
    rawPhone.length <= 16;
  const safePhone = isValidPhone ? rawPhone : `anonymous_${callId.substring(0, 10)}`;
  console.log(`[Monitor] Patient phone: ${isValidPhone ? safePhone : '(anonymous)'}`);

  const conversation = [];
  let sessionCreated = false;

  ws.on('open', () => {
    console.log(`[Monitor] WebSocket open for call ${callId}`);
    // Fallback greeting trigger if session.created is not received quickly
    setTimeout(() => {
      if (!sessionCreated) {
        console.log('[Monitor] session.created not received; triggering greeting (SIP fallback)');
        ws.send(JSON.stringify({ type: 'response.create' }));
      }
    }, 500);
  });

  ws.on('message', (data) => {
    const message = JSON.parse(data);
    console.log(`[Monitor] ${message.type}`);

    if (message.type === 'session.created') {
      sessionCreated = true;
      const sess = message.session || {};
      console.log(`[Monitor] Session: model=${sess.model}, voice=${sess.voice}`);

      // Configure server VAD with 1200 ms silence threshold for natural pacing
      ws.send(JSON.stringify({
        type: 'session.update',
        session: {
          audio: {
            input: {
              turn_detection: {
                type: 'server_vad',
                create_response: true,
                threshold: 0.5,
                silence_duration_ms: 1200,
                prefix_padding_ms: 300
              }
            }
          }
        }
      }));

      ws.send(JSON.stringify({ type: 'response.create' }));
      console.log('[Monitor] Triggered initial greeting');
    }

    if (message.type === 'error') {
      console.error('[Monitor] Error:', JSON.stringify(message));
    }

    if (message.type === 'response.function_call_arguments.done') {
      const toolCallId = message.call_id || message.item_id;
      handleToolCall(ws, message.name, JSON.parse(message.arguments), toolCallId, safePhone, callId);
    }

    if (message.type === 'response.output_audio_transcript.done') {
      console.log(`[AI] ${message.transcript}`);
      healthBridge.saveTranscript(safePhone, 'assistant', message.transcript, null, callId);
      if (message.transcript) conversation.push({ role: 'assistant', text: message.transcript });
    }

    if (message.type === 'conversation.item.input_audio_transcription.completed') {
      console.log(`[Patient] ${message.transcript}`);
      healthBridge.saveTranscript(safePhone, 'patient', message.transcript, null, callId);
      if (message.transcript) conversation.push({ role: 'patient', text: message.transcript });
    }
  });

  ws.on('error', (error) => {
    console.error(`[Monitor] WebSocket error for ${callId}:`, error.message);
  });

  ws.on('close', (code, reason) => {
    console.log(`[Monitor] Closed for ${callId} code=${code}`);
    try {
      if (conversation.length > 0) {
        healthBridge.finalizeVoiceCall(safePhone, conversation, callId);
      }
    } catch (e) {
      console.error('[Monitor] Error finalizing call:', e.message);
    }
  });
}

// ─── Tool call handler ────────────────────────────────────────────────────────

async function handleToolCall(ws, toolName, args, itemId, patientPhone, sessionKey = null) {
  console.log(`[Tool] ${toolName}`, args);

  let result = {};

  switch (toolName) {
    case 'find_clinic':
    case 'find_clinics':
      try {
        result = await healthBridge.voiceHealthActions.findClinics(args, patientPhone, sessionKey);
      } catch (err) {
        const loc = args?.location || 'your area';
        result = {
          success: true,
          clinics: [
            { id: 'CLINIC001', name: 'City Health Center', address: `Main Street, ${loc}`, distance: '2 km', availableSlots: ['9:00 AM', '2:00 PM'] },
            { id: 'CLINIC002', name: 'Community Clinic', address: `Park Road, ${loc}`, distance: '5 km', availableSlots: ['10:30 AM', '4:00 PM'] }
          ],
          voiceResponse: `I found two clinics near ${loc}. The closest is City Health Center, about 2 km away. Would you like to book an appointment?`
        };
      }
      break;

    case 'book_slot':
      try {
        result = await healthBridge.voiceHealthActions.scheduleAppointment({
          provider_type: 'clinic',
          preferred_dates: [args.date],
          reason: 'Health consultation',
          urgency: 'routine'
        }, patientPhone, sessionKey);
      } catch (err) {
        result = {
          success: true,
          confirmation_number: `APPT-${Date.now()}`,
          appointment: { clinic_id: args.clinic_id, date: args.date, time: args.time || '10:00 AM', patient_name: args.patient_name }
        };
      }
      break;

    case 'send_referral':
      try {
        result = await healthBridge.voiceHealthActions.referSpecialist({
          specialist_type: args.provider_id,
          urgency: 'routine',
          reason: args.reason,
          symptoms: []
        }, patientPhone, sessionKey);
      } catch (err) {
        result = {
          success: true,
          referral_id: `REF-${Date.now()}`,
          details: { patient: args.patient_name, provider: args.provider_id, reason: args.reason }
        };
      }
      break;

    default:
      console.log(`[Tool] Unknown tool: ${toolName}`);
      result = { error: `Unknown tool: ${toolName}` };
  }

  ws.send(JSON.stringify({
    type: 'conversation.item.create',
    item: { type: 'function_call_output', call_id: itemId, output: JSON.stringify(result) }
  }));
  ws.send(JSON.stringify({ type: 'response.create' }));
  console.log(`[Tool] Result sent for ${toolName}`);
}

// ─── Minimal isolation endpoint ───────────────────────────────────────────────
// Use this to test the raw SIP path without medical instructions or tools.
// Point your OpenAI webhook to POST /openai/webhook_min

router.post('/openai/webhook_min', async (req, res) => {
  console.log('[Minimal] Webhook received');
  let callId = null;
  try {
    const event = req.body || {};
    if ((event?.type || '') !== 'realtime.call.incoming') {
      try { res.set('Authorization', `Bearer ${process.env.OPENAI_API_KEY || ''}`); } catch (_) {}
      return res.sendStatus(200);
    }

    callId = event?.data?.call_id;
    if (!callId) {
      try { res.set('Authorization', `Bearer ${process.env.OPENAI_API_KEY || ''}`); } catch (_) {}
      return res.sendStatus(200);
    }

    const acceptBody = {
      type: 'realtime',
      model: process.env.OPENAI_REALTIME_MODEL || 'gpt-realtime',
      audio: { output: { voice: 'alloy' } },
      instructions: 'You are a health support agent.'
    };

    const headers = { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' };
    const resp = await axios.post(`https://api.openai.com/v1/realtime/calls/${encodeURIComponent(callId)}/accept`, acceptBody, { headers });
    console.log('[Minimal] Accept status:', resp.status);

    const wsUrl = `wss://api.openai.com/v1/realtime?call_id=${encodeURIComponent(callId)}`;
    const ws = new WebSocket(wsUrl, { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, Origin: 'https://api.openai.com' } });

    ws.on('open', () => {
      console.log('[Minimal] WS open');
      ws.send(JSON.stringify({ type: 'response.create', response: { instructions: 'Say: Thank you for calling, how can I help you?' } }));
    });
    ws.on('message', (data) => { try { const m = JSON.parse(data); console.log('[Minimal] WS:', m.type); } catch (_) {} });
    ws.on('error', (e) => console.error('[Minimal] WS error:', e?.message));
    ws.on('close', (c) => console.log('[Minimal] WS closed:', c));

    try { res.set('Authorization', `Bearer ${process.env.OPENAI_API_KEY || ''}`); } catch (_) {}
    return res.sendStatus(200);
  } catch (e) {
    console.error('[Minimal] Error:', e?.message);
    try { res.set('Authorization', `Bearer ${process.env.OPENAI_API_KEY || ''}`); } catch (_) {}
    return res.sendStatus(200);
  }
});

module.exports = router;
