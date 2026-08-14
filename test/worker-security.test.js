import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workerSource = await readFile(new URL('../src/cloudflare-worker.js', import.meta.url), 'utf8');

test('webhook responses never echo the OpenAI API key', () => {
  const start = workerSource.indexOf('async function handleOpenAIWebhook');
  const end = workerSource.indexOf('async function handleSignalWireVoice', start);
  const webhookHandler = workerSource.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.doesNotMatch(webhookHandler, /Authorization:\s*`Bearer \$\{env\.OPENAI_API_KEY/);
  assert.match(webhookHandler, /return textResponse\('OK'\)/);
});

test('Jozi modes gate caller memory, follow-up messaging, and last-caller fallback', () => {
  assert.match(workerSource, /if \(!callerMemoryAllowed\(this\.env, serviceMode\)/);
  assert.match(workerSource, /serviceModePolicy\(serviceMode\)\.automaticFollowup/);
  assert.match(workerSource, /profile\.callerPhone/);
  assert.doesNotMatch(workerSource, /extractCallerPhoneFromSipHeaders\(sipHeaders\)/);
  assert.doesNotMatch(workerSource, /extractPhoneFromSipHeaders/);
  assert.doesNotMatch(workerSource, /getLastCaller\(5 \* 60 \* 1000\)/);
});

test('Jozi session finalization purges raw messages, transcript deltas, and metadata', () => {
  assert.match(workerSource, /DELETE FROM messages/);
  assert.match(workerSource, /DELETE FROM input_transcript_deltas/);
  assert.match(workerSource, /DELETE FROM metadata/);
  assert.match(workerSource, /this\.setMeta\('privacy_purged', 'true'\)/);
  assert.match(workerSource, /finally\s*\{[\s\S]{0,500}cleanupJoziSession/);
  assert.match(workerSource, /async cleanupJoziSession[\s\S]{0,1200}purgeJoziSessionState/);
  assert.match(workerSource, /session cleanup failed; scheduling retry/);
  assert.match(workerSource, /setAlarm\(Date\.now\(\) \+ 60_000\)/);
  assert.match(workerSource, /async handleRealtimeMessage\(raw\) \{\s*if \(this\.getMeta\('completed_at'\) \|\| this\.getMeta\('terminal_at'\)\) return/);
});

test('completed Jozi sessions can re-enter finalization to retry privacy cleanup', () => {
  const alarmStart = workerSource.indexOf('  async alarm()');
  const alarmEnd = workerSource.indexOf('  async getSession()', alarmStart);
  const retryEntryPoints = workerSource.slice(alarmStart, alarmEnd);
  assert.match(retryEntryPoints, /async alarm\(\)[\s\S]*await this\.finalizeCall\(\)/);
  assert.match(retryEntryPoints, /async forceFinalize[\s\S]*await this\.finalizeCall\(\)/);
  assert.doesNotMatch(retryEntryPoints, /if \(this\.getMeta\('completed_at'\)\) return/);
  assert.match(workerSource, /mapping_cleanup_pending/);
  assert.match(workerSource, /pendingMapping \|\| this\.getMeta\('provider_call_id'\)/);
});

test('combined health assessment speaks the supplied advice and next step', () => {
  const start = workerSource.indexOf("case 'health_assessment':");
  const end = workerSource.indexOf("case 'find_clinic':", start);
  const assessmentCase = workerSource.slice(start, end);
  assert.match(assessmentCase, /args\.medical_content/);
  assert.match(assessmentCase, /args\.next_step/);
  assert.match(assessmentCase, /spokenAssessment/);
});

test('combined mode does not expose model-generated provider lookup tools', () => {
  assert.match(workerSource, /return \[assessmentTool, emergencyTool, \.\.\.supportTools\]/);
});

test('Jozi action instructions enforce short progressive spoken turns', () => {
  const start = workerSource.indexOf('const JOZI_ACTION_RESPONSE_INSTRUCTIONS');
  const end = workerSource.indexOf('const JOZI_COMBINED_HEALTH_INSTRUCTIONS', start);
  const instructions = workerSource.slice(start, end);
  assert.match(instructions, /complete factual and safety boundary, not a word-for-word script/);
  assert.match(instructions, /acknowledge the caller\\'s own words/);
  assert.match(instructions, /second route.*left for later/);
  assert.match(instructions, /warm, unhurried, and conversational/);
  assert.match(instructions, /Do not preface the action with a limitation/);
  assert.match(instructions, /ask its one question once and wait for a new caller turn/i);
  assert.match(instructions, /Do not call find_support_services again until the caller provides new information/i);
});

test('Jozi lookup lets the voice model carry natural context without inventing placeholders', () => {
  const start = workerSource.indexOf("name: 'find_support_services'");
  const end = workerSource.indexOf("name: 'coordinate_support_demo'", start);
  const lookupTool = workerSource.slice(start, end);
  assert.match(lookupTool, /intelligently interpreted the caller\\'s natural words and remembered context/);
  assert.match(lookupTool, /safe tonight plus food/);
  assert.match(lookupTool, /raw safe site or safe place phrase/);
  assert.match(lookupTool, /safe_site_type/);
  assert.match(lookupTool, /coughing or needing a clinic is healthcare/);
  assert.match(lookupTool, /mes_programme/);
  assert.match(lookupTool, /Omit this field if none was stated/);
  assert.match(lookupTool, /coordination_preference/);
  assert.match(lookupTool, /detail_requested/);
  assert.match(lookupTool, /required: \['needs', 'safety_context'\]/);
  assert.doesNotMatch(lookupTool, /required: \[[^\]]*'location'/);
  assert.doesNotMatch(lookupTool, /required: \[[^\]]*'audience'/);
});

test('Jozi clarification context is retained only for the pending lookup and emergencies clear stale consent', () => {
  const lookupStart = workerSource.indexOf("case 'find_support_services':");
  const lookupEnd = workerSource.indexOf("case 'coordinate_support_demo':", lookupStart);
  const lookupCase = workerSource.slice(lookupStart, lookupEnd);
  assert.match(lookupCase, /jozi_pending_lookup_context/);
  assert.match(lookupCase, /mergeJoziSupportContext/);
  assert.match(lookupCase, /buildJoziPendingLookupContext/);

  const emergencyStart = workerSource.indexOf("case 'handle_emergency':");
  const emergencyEnd = workerSource.indexOf('default:', emergencyStart);
  const emergencyCase = workerSource.slice(emergencyStart, emergencyEnd);
  assert.match(emergencyCase, /setMeta\('jozi_demo_consent_offer', '\{\}'\)/);
  assert.match(emergencyCase, /setMeta\('jozi_pending_lookup_context', '\{\}'\)/);
});

test('emergency routing can be called for fire or violence without inventing symptoms', () => {
  const start = workerSource.indexOf("name: 'handle_emergency'");
  const end = workerSource.indexOf('const supportTools', start);
  const emergencyTool = workerSource.slice(start, end);
  assert.match(emergencyTool, /fire_emergency/);
  assert.match(emergencyTool, /violence_now/);
  assert.doesNotMatch(emergencyTool, /required:\s*\['symptoms'\]/);
});

test('Jozi mode refuses unsigned OpenAI webhooks', () => {
  assert.match(workerSource, /modeIncludesJozi\(configuredServiceMode\(env\)\) \|\| joziLineEnabled\(env\)/);
  assert.match(workerSource, /Webhook verification is required for a Jozi-capable deployment/);
});

test('Twilio CallSid binds a signed incoming OpenAI call to one line profile', () => {
  assert.match(workerSource, /setCallProfile\(callSid, \{/);
  assert.match(workerSource, /x-prismind-call-id/);
  assert.doesNotMatch(workerSource, /x-twilio-parentcallsid/i);
  assert.match(workerSource, /getCallProfile\(providerCallId\)/);
  assert.match(workerSource, /Rejecting call without one trusted, enabled line profile/);
  assert.match(workerSource, /rejectOpenAICall\(env, callId\)/);
  assert.match(workerSource, /event\?\.type !== 'realtime\.call\.incoming'/);
  assert.match(workerSource, /deleteCallProfile\(providerCallId\)/);
  assert.doesNotMatch(workerSource, /serviceModeFromSipHeaders/);
});

test('Jozi calls use their own recommended voice and caring delivery prompt', () => {
  assert.match(workerSource, /realtimeVoiceForMode\(this\.env, serviceMode\)/);
  assert.match(workerSource, /env\.JOZI_REALTIME_VOICE \|\| 'marin'/);
});

test('demo coordination is bound to resources offered in the current call', () => {
  assert.match(workerSource, /phone_connection/);
  assert.match(workerSource, /jozi_demo_consent_offer/);
  assert.match(workerSource, /result\.spoken_option_ids\?\.\[0\]/);
  assert.match(workerSource, /result\.suggested_demo_action/);
  assert.match(workerSource, /require_offered_resource: true/);
  assert.match(workerSource, /require_offered_action: true/);
  assert.match(workerSource, /required_action: consentOffer\.action/);
  assert.match(workerSource, /if \(result\.success\) this\.setMeta\('jozi_demo_consent_offer', '\{\}'\)/);
  assert.doesNotMatch(workerSource, /jozi_offered_resource_ids/);
});
