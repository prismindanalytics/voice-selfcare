# Voice Self-Care Agent

AI-powered voice health advisor for symptom triage, guidance, referrals, and follow-up over a regular phone call.

The production runtime is now a fully native Cloudflare deployment:

- Cloudflare Worker for HTTP webhooks.
- Durable Objects for per-call state, OpenAI Realtime monitoring, tool results, and transcript storage.
- Cloudflare KV for finalized transcript export.
- OpenAI Realtime API with `gpt-realtime-2`, `marin` voice, and `gpt-4o-transcribe` input transcription by default.
- Post-call patient/provider summaries and phone-level memory consolidation with `gpt-5.5`.

This system provides health guidance and triage, not medical diagnosis.

## Architecture

```
Caller
  |
  | PSTN
  v
Twilio or SignalWire
  |
  | POST /twilio/voice or /signalwire/voice
  v
Cloudflare Worker
  |
  | returns TwiML/LAML that dials:
  | sip:<OPENAI_PROJECT_ID>@sip.api.openai.com;transport=tls
  v
OpenAI SIP / Realtime
  |
  | POST /openai/webhook
  v
Cloudflare Worker
  |
  | routes call id
  v
CallSession Durable Object
  |
  | accepts call, monitors Realtime WebSocket,
  | executes tools, stores messages in DO SQL,
  | writes final transcript JSON and refreshed
  | phone-level memory to KV
  v
TRANSCRIPTS KV
```

The old Fly.io and Docker deployment path has been removed.
Google Drive integration has also been removed; Cloudflare KV is the storage layer.

## Requirements

- Cloudflare account with Workers, Durable Objects, and KV.
- OpenAI API key with Realtime API access.
- OpenAI Project ID for the SIP URI.
- Twilio or SignalWire phone number.
- Node.js 18+ for local Wrangler commands.

## Install

```bash
npm install
```

## Configure Secrets

Set required secrets in Cloudflare:

```bash
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put OPENAI_PROJECT_ID
```

Set whichever telephony provider you use:

```bash
npx wrangler secret put TWILIO_ACCOUNT_SID
npx wrangler secret put TWILIO_AUTH_TOKEN
npx wrangler secret put TWILIO_SMS_NUMBER
```

or:

```bash
npx wrangler secret put SIGNALWIRE_PROJECT_ID
npx wrangler secret put SIGNALWIRE_TOKEN
npx wrangler secret put SIGNALWIRE_SPACE
npx wrangler secret put SIGNALWIRE_SMS_FROM
```

Optional:

```bash
npx wrangler secret put OPENAI_WEBHOOK_SECRET
npx wrangler secret put ADMIN_TOKEN
```

## Deploy

```bash
npm run deploy:cloudflare
```

## Webhooks

Configure provider webhooks to point at your Cloudflare URL:

| Provider | URL |
|---|---|
| OpenAI SIP | `https://your-cloudflare-url/openai/webhook` |
| Twilio voice | `https://your-cloudflare-url/twilio/voice` |
| SignalWire voice | `https://your-cloudflare-url/signalwire/voice` |

Health checks:

```bash
curl https://your-cloudflare-url/health
curl https://your-cloudflare-url/openai/webhook
```

The Twilio voice response includes SIP status callbacks and a Twilio CallSid SIP header so call completion can finalize and export transcripts even if a Realtime monitor socket closes late or silently.

## Transcript Reader

Open the browser reader:

```text
https://your-cloudflare-url/transcripts
```

Set `ADMIN_TOKEN` first, then enter that token in the page:

```bash
npx wrangler secret put ADMIN_TOKEN
```

The reader lists completed KV transcript exports, shows patient and provider summaries, separates patient and AI turns, displays generated references, supports transcript search, and can download the raw JSON.

The reader also includes admin-only phone memory tools:

- Load consolidated memory by phone number.
- Use the selected transcript caller as the memory lookup key.
- Process existing transcript KV records into consolidated phone memory.
- Review generic safe profiles, open items, care preferences, and restricted safety flags.

Memory is keyed by a hash of the normalized phone number. Because a phone number may be shared, memory is organized as a small phone-level profile set rather than a single patient identity. Sensitive history such as gender-based violence, sexual assault, HIV/STI details, reproductive history, mental health crisis, substance use, and legal risk is never injected into the voice prompt; only generic restricted flags are stored for admin review.

## Reading Transcripts From KV

Finalized calls are written to KV as:

```text
transcripts/<call_id>.json
```

Each export includes:

- `patientSummary` for patient-facing feedback.
- `providerSummary` when referral, follow-up, appointment, testing, commodities, or urgent handoff is relevant.
- `languageUsed` for the main spoken language detected in the call.
- `references` for simulated appointment numbers, referral IDs, commodity pickup numbers, and test request IDs.
- `messages` with patient, AI, and system transcript events.

Consolidated phone memory records are written to KV as:

```text
caller_memory/<sha256_phone_hash>.json
```

The memory record is intentionally conservative. It is keyed to the phone number, not a verified person, and keeps sensitive history as restricted category flags rather than details:

```json
{
  "version": 1,
  "phoneHash": "<sha256_phone_hash>",
  "updatedAt": "2026-05-14T20:59:47.358Z",
  "callCount": 10,
  "lastCallId": "rtc_...",
  "lastCallAt": "2026-05-14T20:31:03.144Z",
  "identityConfidence": "phone_number_only",
  "sharedPhoneWarning": "This memory is linked to a phone number only. It may represent multiple people and must not be treated as confirmed identity.",
  "preferredLanguage": "Spanish",
  "lastLanguageUsed": "Spanish",
  "profiles": [
    {
      "profileId": "profile_1",
      "profileLabel": "adult caller",
      "preferredLanguage": "Spanish",
      "safeForVoiceContext": "Adult caller has used this line for refill and care navigation questions.",
      "safeContinuityItems": [],
      "openItems": [
        "Confirm privacy and permission before discussing any prior request, pickup information, or recent health concern."
      ],
      "carePreferences": [],
      "restrictedMemoryPresent": true,
      "restrictedCategories": [
        "sexual-health-sensitive",
        "reproductive-health-sensitive",
        "safety-sensitive"
      ]
    }
  ],
  "householdSafeContext": "Phone may be shared; confirm caller identity and privacy before discussing prior requests.",
  "restrictedMemoryPresent": true,
  "restrictedCategories": [
    "sexual-health-sensitive",
    "reproductive-health-sensitive",
    "safety-sensitive"
  ]
}
```

At the start of the next call, the Worker passes only the voice-safe memory fields into the Realtime instructions. If `preferredLanguage` or `lastLanguageUsed` is present, the agent may start in that language or use a brief bilingual greeting, then immediately switch if the caller uses a different language.

These memory records are refreshed after each completed call. They do not expire by default; set `CALLER_MEMORY_TTL_DAYS` to a positive number if a deployment needs automatic retention limits.

List transcript keys:

```bash
npx wrangler kv key list --binding TRANSCRIPTS --prefix transcripts/ --remote
```

Read one transcript:

```bash
npx wrangler kv key get "transcripts/<call_id>.json" --binding TRANSCRIPTS --remote
```

Save one locally:

```bash
npx wrangler kv key get "transcripts/<call_id>.json" --binding TRANSCRIPTS --remote > transcript.json
```

You can also read a session through the Worker if `ADMIN_TOKEN` is set:

```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://your-cloudflare-url/sessions/<call_id>
```

Admin API examples:

```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "https://your-cloudflare-url/api/memory?phone=%2B15555550123"

curl -X POST \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"limit":100}' \
  https://your-cloudflare-url/api/memory/backfill
```

Durable Object SQL remains the source of truth during the live call. KV is the finalized export layer for easy reads and operational review.

## Environment Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `OPENAI_API_KEY` | yes | - | OpenAI API key with Realtime access |
| `OPENAI_PROJECT_ID` | yes | - | OpenAI Project ID used in SIP URI |
| `OPENAI_REALTIME_MODEL` | no | `gpt-realtime-2` | Realtime voice model |
| `OPENAI_REALTIME_VOICE` | no | `marin` | Realtime output voice |
| `OPENAI_SUMMARY_MODEL` | no | `gpt-5.5` | Post-call summary model |
| `OPENAI_MEMORY_MODEL` | no | `gpt-5.5` | Post-call phone memory consolidation model |
| `OPENAI_TRANSCRIPTION_MODEL` | no | `gpt-4o-transcribe` | Patient-side input audio transcription model |
| `OPENAI_MAX_OUTPUT_TOKENS` | no | `900` | Bounds spoken responses without truncating audio |
| `OPENAI_WEBHOOK_SECRET` | no | - | Enables Standard Webhooks signature verification |
| `OPENAI_ACCEPT_TOOLS` | no | `true` | Include tools in Realtime accept payload |
| `OPENAI_ACCEPT_SIMPLE` | no | `false` | Use minimal instructions for debugging |
| `VAD_SILENCE_MS` | no | `1200` | Silence duration before the Realtime model responds |
| `FINALIZE_IDLE_MS` | no | `120000` | Idle fallback before final transcript export |
| `CALLER_MEMORY_ENABLED` | no | `true` | Enables hashed phone-level memory refresh after calls |
| `CALLER_MEMORY_TTL_DAYS` | no | - | Optional memory retention TTL in days; blank means no automatic expiry |
| `TELEPHONY_CODEC` | no | `g711_ulaw` | SignalWire codec hint |
| `TWILIO_ACCOUNT_SID` | Twilio | - | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Twilio | - | Twilio auth token |
| `TWILIO_SMS_NUMBER` | no | - | SMS follow-up sender |
| `TWILIO_WHATSAPP_NUMBER` | no | - | WhatsApp follow-up sender |
| `TWILIO_MESSAGING_SERVICE_SID` | no | - | Twilio Messaging Service SID |
| `TWILIO_SIP_CODECS` | no | - | Twilio SIP codec override |
| `SIGNALWIRE_PROJECT_ID` | SignalWire | - | SignalWire project ID |
| `SIGNALWIRE_TOKEN` | SignalWire | - | SignalWire API token |
| `SIGNALWIRE_SPACE` | SignalWire | - | SignalWire space hostname |
| `SIGNALWIRE_SMS_FROM` | no | - | SignalWire SMS sender |
| `SIP_CODECS` | no | - | SignalWire SIP codec override |
| `ADMIN_TOKEN` | no | - | Enables transcript reader, `/sessions/<call_id>`, and admin memory APIs |

## Notes

- `/media-stream/:id` is intentionally not implemented in the native Worker deployment. Use the SIP path.
- Google Drive integration has been removed. Use KV export or the admin session endpoint for transcripts.
- `wrangler.jsonc` includes the `TRANSCRIPTS` KV namespace binding.

## License

MIT - see [LICENSE](LICENSE).
