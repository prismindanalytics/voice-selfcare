# Twilio health and Jozi number setup

## Number assignment

| Purpose | Number | Twilio SID | Incoming voice webhook | Method | Status callback |
|---|---|---|---|---|---|
| Health assistant | `+1 206 309 8528` | `PN19ee9e8ba71f4c532003dee946d4a084` | `https://voice-selfcare.prismindanalytics.workers.dev/twilio/voice/health` | `POST` | `https://voice-selfcare.prismindanalytics.workers.dev/twilio/status` |
| Jozi support demo | `+1 425 517 3281` | `PN8d564bdd6e89dce700ad133c1ccab88e` | `https://voice-selfcare.prismindanalytics.workers.dev/twilio/voice/jozi` | `POST` | `https://voice-selfcare.prismindanalytics.workers.dev/twilio/status` |

The OpenAI project webhook remains:

`https://voice-selfcare.prismindanalytics.workers.dev/openai/webhook`

The Worker must have the Twilio account's primary auth token stored as the encrypted `TWILIO_AUTH_TOKEN` secret. Voice and status requests fail closed when that secret or a valid `X-Twilio-Signature` is missing.

## Twilio Console steps

For each number, open **Phone Numbers → My Inventory → number → Voice and emergency address → Edit configuration details**.

1. Choose **Webhook** and **Use Webhooks**.
2. Paste the incoming voice URL from the table.
3. Select **HTTP POST**.
4. Leave the backup URL empty unless a tested backup exists.
5. Set **Call status changes** to the status callback in the table.
6. Save.

The old health number previously used `/twilio/voice`. That root path now defaults to health, so it remains a safe fallback; the explicit `/twilio/voice/health` assignment is clearer and resists later default-mode changes.

## Verification after a change

1. Open `https://voice-selfcare.prismindanalytics.workers.dev/health` and confirm:
   - `serviceMode` is `health`;
   - `twilioHealth` is `health`;
   - `twilioJozi` is `jozi`.
2. Call the health number. It must greet the caller as a health advisor and expose only health tools.
3. Call the Jozi number. It must say “Jozi support demo line,” use the caring Jozi delivery, and expose only emergency, curated support, and demo-coordination tools.
4. Test one Jozi routine journey and one emergency journey.
5. Confirm the Jozi application record contains no caller phone or raw transcript after finalization.

## Restore or roll back

To restore the old number to health, set its incoming voice webhook to the explicit health URL in the table and save. Do not point it at `/twilio/voice/jozi`.

To take the Jozi demo offline without affecting health, remove the new number’s incoming voice webhook or replace it with a holding-message TwiML Bin. The health number remains on `/twilio/voice/health`.

To roll back a Worker release, use the previous Cloudflare Worker version, then verify `/health` and make one canary call to each number before reopening the lines.
