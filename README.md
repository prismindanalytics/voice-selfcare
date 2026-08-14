# Voice Self-Care and Jozi Support Agent

Voice-first health guidance and source-checked Johannesburg community-support navigation over a regular phone call.

The production runtime is now a fully native Cloudflare deployment:

- Cloudflare Worker for HTTP webhooks.
- Durable Objects for per-call state, OpenAI Realtime monitoring, tool results, and transcript storage.
- Cloudflare KV for finalized transcript export.
- OpenAI Realtime API with `gpt-realtime-2`, independently configurable health and Jozi voices, and `gpt-4o-transcribe` input transcription by default.
- Post-call patient/provider summaries and phone-level memory consolidation with `gpt-5.5`.
- Timed provider/pharmacy option lookup with `gpt-5.4-mini`, capped by `PROVIDER_LOOKUP_TIMEOUT_MS` so voice tool calls fall back quickly instead of leaving long silence.

This system provides health guidance, triage, and service navigation. It does not provide a medical diagnosis, social-work assessment, live shelter placement, or live service availability.

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
| Twilio health voice | `https://your-cloudflare-url/twilio/voice/health` |
| Twilio Jozi voice | `https://your-cloudflare-url/twilio/voice/jozi` |
| Twilio call status | `https://your-cloudflare-url/twilio/status` |
| SignalWire voice | `https://your-cloudflare-url/signalwire/voice` |

Health checks:

```bash
curl https://your-cloudflare-url/health
curl https://your-cloudflare-url/openai/webhook
```

The two Twilio paths use the same Worker and OpenAI project but bind each Twilio CallSid to exactly one line profile before dialing SIP. The signed OpenAI webhook resolves that stored profile; a call carrying an unknown Twilio CallSid is declined rather than falling back to the wrong assistant. The SIP response also includes completion callbacks so calls can finalize even if a Realtime monitor socket closes late or silently.

The current number assignment and rollback checklist are in [`docs/twilio-line-setup.md`](docs/twilio-line-setup.md).

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

## Provider Lookup

Pickup and testing tools can resolve nearby provider options on the backend. The voice agent collects the patient need and location, then the Worker calls `OPENAI_PROVIDER_MODEL` with a short timeout to return a few real-world plausible options from model knowledge. This is still simulated and unverified, not live search.

If the lookup is slow, unavailable, or the location is too vague, the tool returns a fast fallback asking for one more precise location detail. It should not leave the caller waiting in silence.

## Health and Jozi line profiles

`SERVICE_MODE=health` is the default profile for the existing health number. When `JOZI_LINE_ENABLED=true`, `/twilio/voice/jozi` selects the Jozi-only prompt, tools, voice style, and privacy policy for that Twilio call; `/twilio/voice/health` always selects health. Both paths verify Twilio's request signature and require the signed destination number to agree with the path before storing a short-lived call profile. The signed OpenAI webhook then requires that exact profile instead of falling back to health.

In Jozi and combined modes:

- Every tool-returned Johannesburg destination comes from the deterministic directory in `src/jozi-support.js`; model-generated provider lookup tools are not exposed in these modes.
- The directory covers homelessness and shelter navigation, mental health, social support, women and children, food and hygiene navigation, daytime civic spaces, clinics and hospitals, substance-use support, GBV, child safety, grants, documents, work, Zlto and Mi-Change partner pathways, and legal help across the inner city and Soweto.
- Each result includes its primary source, source-check date, access type, audience, operating-status caveat, and `availability_confirmed: false`.
- Known closed, moving, or conflicting destinations are explicitly suppressed rather than silently omitted.
- Immediate danger, medical emergencies, imminent self-harm, overdose, violence, and fire use deterministic emergency routes before ordinary lookup.
- Jozi and combined modes refuse incoming OpenAI webhooks unless `OPENAI_WEBHOOK_SECRET` is configured.
- The Worker disables caller memory, automatic SMS/WhatsApp, application-level raw transcript retention, and the global last-caller phone fallback. Minimal call records omit the phone and raw messages and expire after `JOZI_TRANSCRIPT_TTL_DAYS`; telephony and model providers still process the live call under their own data controls.
- Spoken turns are progressive: acknowledge the need, recommend one useful next step, ask one question, and pause instead of reading the full resource record.
- `JOZI_DEMO_MODE=true` exposes presentation-only appointment, intake, availability-check, assessment, clinician-handoff, redirection, Zlto reward, and Mi-Change voucher-pathway states. The line leads into one caller-approved simulated action, presents the completed demo screen positively, and immediately clarifies that no external service was contacted and no real booking, voucher, reward, or service was created.
- The Jozi line uses `JOZI_REALTIME_VOICE=marin`, one of OpenAI's recommended high-quality Realtime voices, plus a prompt for a caring South African English cadence, slow number-reading, and no exaggerated accent. Health voice selection remains independent.

The demo scripts and exact expected routes are in [`docs/jozi-demo-journeys.md`](docs/jozi-demo-journeys.md).

## Environment Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `OPENAI_API_KEY` | yes | - | OpenAI API key with Realtime access |
| `OPENAI_PROJECT_ID` | yes | - | OpenAI Project ID used in SIP URI |
| `OPENAI_REALTIME_MODEL` | no | `gpt-realtime-2` | Realtime voice model |
| `OPENAI_REALTIME_VOICE` | no | `marin` | Realtime output voice |
| `JOZI_REALTIME_VOICE` | no | `marin` | Jozi-only Realtime output voice |
| `OPENAI_SUMMARY_MODEL` | no | `gpt-5.5` | Post-call summary model |
| `OPENAI_MEMORY_MODEL` | no | `gpt-5.5` | Post-call phone memory consolidation model |
| `OPENAI_PROVIDER_MODEL` | no | `gpt-5.4-mini` | Short provider/pharmacy option lookup model |
| `OPENAI_TRANSCRIPTION_MODEL` | no | `gpt-4o-transcribe` | Patient-side input audio transcription model |
| `OPENAI_MAX_OUTPUT_TOKENS` | no | `900` | Bounds spoken responses without truncating audio |
| `OPENAI_WEBHOOK_SECRET` | Jozi-capable deployment | - | Verifies OpenAI webhooks; Jozi-capable deployments refuse calls when it is absent |
| `OPENAI_ACCEPT_TOOLS` | no | `true` | Include tools in Realtime accept payload |
| `OPENAI_ACCEPT_SIMPLE` | no | `false` | Use minimal instructions for debugging |
| `VAD_SILENCE_MS` | no | `1200` | Silence duration before the Realtime model responds |
| `FINALIZE_IDLE_MS` | no | `120000` | Idle fallback before final transcript export |
| `PROVIDER_LOOKUP_TIMEOUT_MS` | no | `2500` | Hard timeout for provider lookup during voice tool calls |
| `SERVICE_MODE` | no | `health` | `health`, `jozi`, or `combined` prompt and tool profile |
| `JOZI_LINE_ENABLED` | no | `false` | Enables the explicit `/twilio/voice/jozi` line profile |
| `HEALTH_PHONE_NUMBER` | Twilio line split | - | Expected E.164 destination number for the health webhook |
| `JOZI_PHONE_NUMBER` | Jozi Twilio path | - | Expected E.164 destination number for the Jozi webhook |
| `JOZI_DEMO_MODE` | no | `false` | Enables action-time demo booking, intake, assessment, clinician, and redirection screens |
| `AUTOMATIC_FOLLOWUP_ENABLED` | no | `true` | Master switch for outbound SMS/WhatsApp; Jozi modes force it off |
| `CALLER_MEMORY_ENABLED` | no | `true` | Enables hashed phone-level memory refresh after calls |
| `CALLER_MEMORY_TTL_DAYS` | no | - | Optional memory retention TTL in days; blank means no automatic expiry |
| `JOZI_TRANSCRIPT_TTL_DAYS` | no | `7` | Retention for minimal, phone-free Jozi call records |
| `TELEPHONY_CODEC` | no | `g711_ulaw` | SignalWire codec hint |
| `TWILIO_ACCOUNT_SID` | Twilio | - | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Twilio voice paths | - | Twilio primary auth token used to verify every voice and status webhook signature |
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
