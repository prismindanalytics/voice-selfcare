import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import {
  normalizeLineServiceMode,
  namesReasonablyMatch,
  serviceModeForTwilioVoicePath,
  twilioLineBindingMatches
} from '../src/line-routing.js';
import {
  buildServiceGreeting,
  modeIncludesJozi,
  normalizeServiceMode,
  serviceModePolicy
} from '../src/jozi-support.js';

const HEALTH = '+12063098528';
const SHARED_425 = '+14255173281';

test('selfcare is a first-class line mode and legacy fallbacks are unchanged', () => {
  assert.equal(normalizeLineServiceMode(' SELFCARE '), 'selfcare');
  assert.equal(normalizeLineServiceMode('unknown', 'selfcare'), 'selfcare');
  assert.equal(normalizeLineServiceMode('combined'), 'health');
  assert.equal(normalizeLineServiceMode('jozi'), 'jozi');
  assert.equal(normalizeServiceMode('selfcare'), 'selfcare');
  assert.equal(normalizeServiceMode('nonsense'), 'health');
});

test('the selfcare Twilio path routes only to selfcare', () => {
  assert.equal(serviceModeForTwilioVoicePath('/twilio/voice/selfcare', 'health'), 'selfcare');
  assert.equal(serviceModeForTwilioVoicePath('/TWILIO/VOICE/SELFCARE/PCMU/', 'health'), 'selfcare');
  assert.equal(serviceModeForTwilioVoicePath('/twilio/voice/selfcare-extra', 'health'), null);
  // the default and health paths must never drift onto the new profile
  assert.equal(serviceModeForTwilioVoicePath('/twilio/voice', 'health'), 'health');
  assert.equal(serviceModeForTwilioVoicePath('/twilio/voice/health', 'selfcare'), 'health');
});

test('selfcare binding accepts the repurposed 206 number and nothing else', () => {
  const base = { healthNumber: HEALTH, joziNumber: SHARED_425, selfcareNumber: HEALTH };
  // The old health path is disabled at the Worker route; the explicit selfcare path now owns 206.
  assert.equal(twilioLineBindingMatches({ serviceMode: 'selfcare', to: HEALTH, ...base }), true);
  assert.equal(twilioLineBindingMatches({ serviceMode: 'selfcare', to: SHARED_425, ...base }), false);
  // missing configuration fails closed
  assert.equal(twilioLineBindingMatches({ serviceMode: 'selfcare', to: SHARED_425, healthNumber: HEALTH, joziNumber: SHARED_425 }), false);
});

test('health and jozi bindings behave exactly as before the selfcare line existed', () => {
  const legacy = { healthNumber: HEALTH, joziNumber: SHARED_425 };
  assert.equal(twilioLineBindingMatches({ serviceMode: 'health', to: HEALTH, ...legacy }), true);
  assert.equal(twilioLineBindingMatches({ serviceMode: 'health', to: SHARED_425, ...legacy }), false);
  assert.equal(twilioLineBindingMatches({ serviceMode: 'jozi', to: SHARED_425, ...legacy }), true);
  // the selfcareNumber's presence must not change legacy results
  assert.equal(twilioLineBindingMatches({ serviceMode: 'health', to: HEALTH, ...legacy, selfcareNumber: SHARED_425 }), true);
  assert.equal(twilioLineBindingMatches({ serviceMode: 'health', to: SHARED_425, ...legacy, selfcareNumber: SHARED_425 }), false);
});

test('selfcare policy is health-like: memory on, transcripts persisted, followup allowed', () => {
  const policy = serviceModePolicy('selfcare');
  assert.equal(policy.mode, 'selfcare');
  assert.equal(policy.callerMemory, true);
  assert.equal(policy.persistRawTranscript, true);
  assert.equal(policy.automaticFollowup, true);
  assert.equal(policy.includesJozi, false);
  assert.equal(modeIncludesJozi('selfcare'), false);
});

test('every fail-closed service-mode allowlist in the worker admits selfcare', () => {
  // getCallProfile silently dropped 'selfcare' profiles on the first live call because its own
  // defence-in-depth allowlist lagged the routing layer. Pin every inline mode allowlist.
  const source = readFileSync(fileURLToPath(new URL('../src/cloudflare-worker.js', import.meta.url)), 'utf8');
  const allowlists = [...source.matchAll(/\[([^\]\n]*'health'[^\]\n]*'jozi'[^\]\n]*)\]\s*\.includes\(\s*serviceMode\s*\)/g)];
  assert.ok(allowlists.length >= 1, 'expected at least one service-mode allowlist in the worker source');
  for (const [full, inner] of allowlists) {
    assert.match(inner, /'selfcare'/, `allowlist is missing selfcare: ${full}`);
  }
});

test('the selfcare greeting offers unrestricted multilingual help', () => {
  const greeting = buildServiceGreeting('selfcare');
  assert.match(greeting, /Self Care/);
  assert.match(greeting, /any language/i);
  assert.doesNotMatch(greeting, /English|Portugu/i);
  // and the untouched lines still greet exactly as before
  assert.match(buildServiceGreeting('health'), /health advisor/);
  assert.match(buildServiceGreeting('jozi'), /Jozi My Jozi/);
});

test('every Self Care Live prompt follows the caller without a two-language restriction', () => {
  const source = readFileSync(fileURLToPath(new URL('../src/cloudflare-worker.js', import.meta.url)), 'utf8');
  assert.match(source, /multilingual Self Care line/);
  assert.match(source, /Follow the caller into any language you understand confidently/);
  assert.match(source, /Never imply that only English and Portuguese are supported/);
  assert.doesNotMatch(source, /Speak English or Portuguese following the caller/);
  assert.doesNotMatch(source, /English — ou em português/);
});

test('selfcare record identity accepts close transcription only, never a different name', () => {
  assert.equal(namesReasonablyMatch('Thandiwe', 'Thandiwe Mokoena'), true);
  assert.equal(namesReasonablyMatch('Tandiwe', 'Thandiwe Mokoena'), true);
  assert.equal(namesReasonablyMatch('Thandiwe Mokoena', 'Thandiwe Mokoena'), true);
  assert.equal(namesReasonablyMatch('Sandile', 'Thandiwe Mokoena'), false);
  assert.equal(namesReasonablyMatch('', 'Thandiwe Mokoena'), false);
});

test('selfcare exposes one truthful simulated care-coordination tool', () => {
  const source = readFileSync(fileURLToPath(new URL('../src/cloudflare-worker.js', import.meta.url)), 'utf8');
  assert.match(source, /name:\s*'coordinate_selfcare_demo'/);
  assert.match(source, /appointment_request/);
  assert.match(source, /clinician_handoff/);
  assert.match(source, /care_team_callback/);
  assert.match(source, /No live doctor was contacted or connected/);
});

test('selfcare uses medical judgment and can resolve nearby care after location', () => {
  const source = readFileSync(fileURLToPath(new URL('../src/cloudflare-worker.js', import.meta.url)), 'utf8');
  assert.match(source, /## MEDICAL JUDGMENT AND NEARBY CARE/);
  assert.match(source, /Use broad medical knowledge to reason from the caller's symptoms/);
  assert.match(source, /call resolve_providers once/);
  assert.match(source, /single most suitable returned option first/);
  assert.match(source, /use only voiceResponse and selected for factual details/i);
  assert.match(source, /Never retry without a new caller detail/);
  assert.match(source, /const providerTool = healthTools\.find\(\(tool\) => tool\.name === 'resolve_providers'\)/);
  assert.match(source, /if \(normalized === 'selfcare'\) return \[assessmentTool, emergencyTool, providerTool, \.\.\.selfcareTools\]/);
  assert.doesNotMatch(
    source.match(/if \(normalized === 'selfcare'\) return \[[^\n]+/)?.[0] || '',
    /find_clinics|book_slot|send_referral|request_commodities|request_test/
  );
});
