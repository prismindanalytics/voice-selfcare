# Twilio health, selfcare and Jozi number setup

## Number assignment

| Purpose | Number | Twilio SID | Incoming voice webhook | Method | Status callback |
|---|---|---|---|---|---|
| Self Care | `+1 206 309 8528` | `PN19ee9e8ba71f4c532003dee946d4a084` | `https://voice-selfcare.prismindanalytics.workers.dev/twilio/voice/selfcare` | `POST` | `https://voice-selfcare.prismindanalytics.workers.dev/twilio/status` |
| Jozi My Jozi | `+1 425 517 3281` | `PN8d564bdd6e89dce700ad133c1ccab88e` | `https://voice-selfcare.prismindanalytics.workers.dev/twilio/voice/jozi` | `POST` | `https://voice-selfcare.prismindanalytics.workers.dev/twilio/status` |

**2026-09-13:** the final two-line assignment is `+1 206` for Self Care and `+1 425` for Jozi.
The legacy health route is disabled. Self Care also needs the `SELFCARE_BRIDGE_TOKEN` secret;
its Eka record lookups and demo-timeline events go through the Self Care demo Worker bridge.

The OpenAI project webhook is:

`https://voice-selfcare.prismindanalytics.workers.dev/openai/webhook`

Subscribe it to both `live.transport.incoming` and `realtime.call.incoming` so the configured
Realtime rollback remains immediately available. Its signing secret must be stored as
`OPENAI_WEBHOOK_SECRET`, and the Worker API key must be created in that same OpenAI project.

The Worker must have the Twilio account's primary auth token stored as the encrypted `TWILIO_AUTH_TOKEN` secret. Voice and status requests fail closed when that secret or a valid `X-Twilio-Signature` is missing.

## Twilio Console steps

For each number, open **Phone Numbers → My Inventory → number → Voice and emergency address → Edit configuration details**.

1. Choose **Webhook** and **Use Webhooks**.
2. Paste the incoming voice URL from the table.
3. Select **HTTP POST**.
4. Leave the backup URL empty unless a tested backup exists.
5. Set **Call status changes** to the status callback in the table.
6. Save.

Do not use `/twilio/voice` for either production number: it is the disabled legacy health fallback.

## Verification after a change

1. Open `https://voice-selfcare.prismindanalytics.workers.dev/health` and confirm:
   - `serviceMode` is `health`;
   - `voiceApi` is `live` and `voiceModel` is `gpt-live-1`;
   - `twilioSelfcare` is `selfcare` and `twilioJozi` is `jozi`;
   - `twilioHealth` is absent.
2. Call the 206 number. It must greet the caller as Self Care and expose only selfcare tools.
3. Call the Jozi number. It must say “Jozi support demo line,” use the caring Jozi delivery, and expose only emergency, curated support, and demo-coordination tools.
4. Test one Jozi routine journey and one emergency journey.
5. Confirm the Jozi application record contains no caller phone or raw transcript after finalization.

## Restore or roll back

To restore 206 to the old health assistant, set `HEALTH_LINE_ENABLED=true` and
`SELFCARE_LINE_ENABLED=false`, deploy, then change its incoming webhook to
`https://voice-selfcare.prismindanalytics.workers.dev/twilio/voice/health`. Reverse those two flags
and return the webhook to `/twilio/voice/selfcare` to restore Self Care.

To take Jozi offline without affecting Self Care, set `JOZI_LINE_ENABLED=false` and use a
holding-message TwiML Bin on 425.

To roll the OpenAI transport back, set `OPENAI_VOICE_API=realtime`, redeploy, and keep the existing
`realtime.call.incoming` webhook subscription available. The code retains the Realtime accept,
sideband, transcript, greeting, and tool-result paths.

To roll back a Worker release, use the previous Cloudflare Worker version, then verify `/health` and make one canary call to each number before reopening the lines.
