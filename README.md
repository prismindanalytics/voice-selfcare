# Voice Self-Care Agent

**An AI-powered voice health advisor that triages symptoms, provides clinical guidance, and connects callers with nearby facilities — over a regular phone call.**

Built by [Prismind Analytics](https://prismindanalytics.com/health)

---

> **Disclaimer:** This system provides health *guidance* and *triage*, not medical *diagnosis*. It is designed as a first-access tool to help people navigate the healthcare system, not to replace clinical care.

---

## What it does

| Capability | Details |
|---|---|
| **Symptom triage** | Systematic OPQRST assessment, red-flag detection, urgency stratification |
| **Multilingual** | Greets in English; switches fluently when the caller speaks another language |
| **Facility finder** | Recommends nearby public & private clinics, hospitals, pharmacies by location |
| **Appointment booking** | Generates reference numbers; plugs into your scheduling back-end |
| **Specialist referrals** | Creates referral records; notifies via SMS/WhatsApp |
| **Prescription requests** | Initiates requests pending provider approval |
| **Emergency escalation** | Immediately escalates life-threatening presentations |
| **Post-call follow-up** | Sends a WhatsApp or SMS summary after every call |
| **Transcript storage** | Saves per-session notes to Google Drive (optional) |

The AI runs on the **OpenAI Realtime API** (SIP path), giving you low-latency, bidirectional voice with full tool-calling support.

---

## Architecture

```
                        ┌──────────────────────────────────────┐
   Caller               │           Your Server                │
   ──────               │  (Node.js / Express + WebSocket)     │
     │                  │                                      │
     │  PSTN call       │  POST /signalwire/voice  ──────────► ┐
     ▼                  │       or                             │
  SignalWire            │  POST /twilio/voice      ──────────► ┤
     │  or              │                                      │  LAML / TwiML
  Twilio                │  Returns XML to dial:               │  (dial OpenAI SIP)
     │                  │  sip:<PROJECT_ID>@                  │
     │  SIP / TLS       │    sip.api.openai.com               │
     ▼                  └──────────────────────────────────────┘
  OpenAI SIP
  (sip.api.openai.com)
     │
     │  POST /openai/webhook  (call arrives)
     ▼
  Your Server
     │
     ├─ Accept call via REST  (POST /v1/realtime/calls/{id}/accept)
     │   • Medical instructions
     │   • Tools: book_slot, send_referral, …
     │
     └─ Monitor via WebSocket  (wss://api.openai.com/v1/realtime?call_id=…)
         • Transcripts
         • Tool-call execution
         • Drive / SMS follow-up
```

**Two paths, same AI brain:**

- **SIP path** (recommended): Telephony provider → OpenAI SIP → your webhook. Audio is handled entirely by OpenAI; your server only receives events and executes tool calls. Lower latency, simpler.
- **Media Streams path** (legacy): Telephony provider → your WebSocket → OpenAI Realtime. Your server relays raw audio. More control, higher complexity.

---

## Prerequisites

- **Node.js 18+**
- **OpenAI account** with Realtime API access and a Project ID
- **One of:**
  - [Twilio](https://www.twilio.com/) account + phone number
  - [SignalWire](https://signalwire.com/) account + phone number
- (Optional) Google Cloud service account with Drive API access
- (Optional) Twilio number with WhatsApp or SMS for follow-up messages

---

## Quick start

### 1. Clone & install

```bash
git clone https://github.com/prismindanalytics/voice-selfcare.git
cd voice-selfcare
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your credentials
```

At minimum you need:

```env
OPENAI_API_KEY=sk-...
OPENAI_PROJECT_ID=proj_...
PUBLIC_URL=https://your-server.example.com

# Plus either Twilio or SignalWire credentials (see below)
```

### 3. Run locally

```bash
npm run dev          # uses nodemon for auto-reload
# or
npm start
```

The server starts on port 8080 (configurable via `PORT`).

For local development you need a public URL — use [ngrok](https://ngrok.com/):

```bash
ngrok http 8080
# Copy the https:// URL and set PUBLIC_URL in .env
```

---

## Telephony setup

### Option A — Twilio

1. [Create a Twilio account](https://www.twilio.com/try-twilio) and buy a voice-capable phone number.
2. In the Twilio Console → Phone Numbers → your number → **Voice & Fax**:
   - Set **"A Call Comes In"** to **Webhook** → `https://your-server.example.com/twilio/voice` (HTTP POST)
   - Optionally set **"Call Status Changes"** to `https://your-server.example.com/twilio/status`
3. Add to `.env`:
   ```env
   TWILIO_ACCOUNT_SID=AC...
   TWILIO_AUTH_TOKEN=...
   ```

**Codec variants** (if you have audio quality issues):

| Endpoint | Codec hint |
|---|---|
| `/twilio/voice` | Let SIP negotiate (recommended) |
| `/twilio/voice/pcmu` | Force PCMU (US/Canada) |
| `/twilio/voice/pcma` | Force PCMA (EU/Africa) |

You can also set `TWILIO_SIP_CODECS=PCMU` in `.env` to apply globally.

### Option B — SignalWire

1. [Create a SignalWire account](https://signalwire.com/) and buy a phone number.
2. In the SignalWire Dashboard → Phone Numbers → your number → **Settings**:
   - Set **Voice Webhook** to `https://your-server.example.com/signalwire/voice` (HTTP POST)
   - Set **Status Callback** to `https://your-server.example.com/signalwire/status`
3. Add to `.env`:
   ```env
   SIGNALWIRE_PROJECT_ID=...
   SIGNALWIRE_TOKEN=...
   SIGNALWIRE_SPACE=your-space.signalwire.com
   ```

### OpenAI SIP webhook

In your OpenAI project settings:

1. Go to **Settings → Realtime → SIP** (or the equivalent in your dashboard).
2. Set the **Webhook URL** to: `https://your-server.example.com/openai/webhook`
3. Copy the **Webhook Secret** and set `OPENAI_WEBHOOK_SECRET=...` in `.env`.

Verify the webhook is reachable:

```bash
curl https://your-server.example.com/openai/webhook
# Expected: {"status":"webhook_ready",...}
```

---

## Environment variables reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `OPENAI_API_KEY` | ✅ | — | OpenAI API key with Realtime access |
| `OPENAI_PROJECT_ID` | ✅ | — | OpenAI Project ID (used in SIP URI) |
| `PUBLIC_URL` | ✅ | — | Public HTTPS URL of your server |
| `OPENAI_REALTIME_MODEL` | | `gpt-realtime` | Realtime model name |
| `OPENAI_SUMMARY_MODEL` | | `gpt-4o-mini` | Model for post-call summaries |
| `OPENAI_WEBHOOK_SECRET` | | — | Webhook signing secret (recommended) |
| `WEBHOOK_DUMP_BODY` | | `false` | Log raw webhook bodies (debug) |
| `OPENAI_ACCEPT_TOOLS` | | `true` | Include tools in the SIP accept payload |
| `OPENAI_ACCEPT_SIMPLE` | | `false` | Use short instructions (audio debugging) |
| `TELEPHONY_CODEC` | | `g711_ulaw` | Codec hint: `g711_ulaw` or `g711_alaw` |
| `SIGNALWIRE_PROJECT_ID` | SignalWire | — | SignalWire project ID |
| `SIGNALWIRE_TOKEN` | SignalWire | — | SignalWire API token |
| `SIGNALWIRE_SPACE` | SignalWire | — | SignalWire space hostname |
| `SIGNALWIRE_SMS_FROM` | | — | Outbound SMS number (SignalWire) |
| `SIP_CODECS` | | — | Override SIP codec for SignalWire |
| `TWILIO_ACCOUNT_SID` | Twilio | — | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Twilio | — | Twilio Auth Token |
| `TWILIO_WHATSAPP_NUMBER` | | — | WhatsApp-enabled number for follow-ups |
| `TWILIO_SMS_NUMBER` | | — | SMS number for follow-ups |
| `TWILIO_MESSAGING_SERVICE_SID` | | — | Twilio Messaging Service SID |
| `TWILIO_SIP_CODECS` | | — | Override SIP codec for Twilio |
| `GOOGLE_SERVICE_ACCOUNT` | | — | Base64-encoded service account JSON |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | | — | Raw service account JSON string |
| `GOOGLE_DRIVE_FOLDER_ID` | | — | Root Drive folder for patient records |
| `PORT` | | `8080` | HTTP server port |
| `NODE_ENV` | | `production` | Node environment |

---

## Deployment

### Fly.io (recommended)

```bash
# Install the Fly CLI: https://fly.io/docs/flyctl/install/
fly auth login

# Launch (first time)
fly launch --name voice-selfcare --region sjc

# Set secrets
fly secrets set OPENAI_API_KEY=sk-... OPENAI_PROJECT_ID=proj_... PUBLIC_URL=https://voice-selfcare.fly.dev

# Deploy
fly deploy

# Check logs
fly logs
```

After deployment, update `PUBLIC_URL` to your Fly.io app URL and reconfigure webhooks in Twilio/SignalWire.

### Local dev with ngrok

```bash
ngrok http 8080
# Paste the https:// URL into .env as PUBLIC_URL
# Configure Twilio/SignalWire webhooks to point to the ngrok URL
npm run dev
```

### Docker

```bash
docker build -t voice-selfcare .
docker run -p 8080:8080 --env-file .env voice-selfcare
```

---

## API endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/openai/webhook` | OpenAI SIP incoming-call handler |
| `POST` | `/openai/webhook_min` | Minimal test endpoint (no medical instructions) |
| `POST` | `/signalwire/voice` | SignalWire inbound call → LAML |
| `POST` | `/signalwire/dial-status` | SignalWire dial status callback |
| `POST` | `/signalwire/status` | SignalWire call status callback |
| `POST` | `/twilio/voice` | Twilio inbound call → TwiML |
| `POST` | `/twilio/voice/pcmu` | Twilio → TwiML, force PCMU |
| `POST` | `/twilio/voice/pcma` | Twilio → TwiML, force PCMA |
| `POST` | `/twilio/status` | Twilio call status callback |
| `WS` | `/media-stream/:id` | Twilio Media Streams (legacy path) |
| `GET` | `/health` | Health check |
| `GET` | `/openai/webhook` | Webhook readiness probe |

---

## Troubleshooting audio (white noise)

If callers hear white noise while the assistant speaks:

1. **Isolate the path**: temporarily point your OpenAI webhook to `/openai/webhook_min` (no tools, short instructions). If audio clears, re-enable features one by one using `OPENAI_ACCEPT_TOOLS` and `OPENAI_ACCEPT_SIMPLE`.

2. **Do NOT include** audio format fields (`input_audio_format`, `output_audio_format`, sample rate) in the SIP accept payload. The SIP stack negotiates codec; adding format hints can corrupt audio routing.

3. **Do NOT echo** `sip_headers` back in the accept payload.

4. **Do NOT add** non-standard headers (`OpenAI-Beta`, `OpenAI-Project`) to the accept request.

5. Check that your WebSocket `Origin` header is exactly `https://api.openai.com`.

See [CLAUDE.md](CLAUDE.md) for the full debugging writeup.

---

## Extending the agent

### Plug in a real clinic database

Edit `src/health-bridge.js` → `voiceHealthActions.findClinics()`. Replace the stub array with a call to your facility directory API or a geocoding service.

### Plug in a scheduling system

Edit `src/health-bridge.js` → `healthActions.appointments.scheduleAppointment()`. Wire this to your EHR, booking API, or calendar system.

### Add more tools

1. Define the function schema in `src/sip-handler.js` inside the `tools` array of `acceptConfig`.
2. Add a matching `case` in `handleToolCall()` in the same file.
3. Optionally add corresponding logic in `src/health-bridge.js`.

### Customize the medical instructions

The system prompt lives in `src/sip-handler.js` as `MEDICAL_INSTRUCTIONS`. Edit it to change clinical focus, language defaults, or escalation protocols.

---

## Google Drive integration (optional)

When configured, each call creates a folder at:

```
<GOOGLE_DRIVE_FOLDER_ID>/
└── patients/
    └── <phone_number>/
        └── sessions/
            └── <YYYY-MM-DD>_<session_id>/
                └── session.md   ← transcript + AI summary
```

Anonymous callers (number not captured) go under `anonymous_calls/`.

### Setup

1. Create a Google Cloud project and enable the Drive API.
2. Create a service account and download the JSON key.
3. Share your target Drive folder with the service account email (Editor role).
4. Set one of:
   ```bash
   # Option A: base64-encoded key
   GOOGLE_SERVICE_ACCOUNT=$(openssl base64 -in service-account.json | tr -d '\n')

   # Option B: raw JSON
   GOOGLE_SERVICE_ACCOUNT_KEY=$(cat service-account.json)
   ```
5. Set `GOOGLE_DRIVE_FOLDER_ID` to the folder's ID (from the URL).

---

## License

MIT — see [LICENSE](LICENSE).

---

Built by [Prismind Analytics](https://prismindanalytics.com/health) · Contributions welcome
