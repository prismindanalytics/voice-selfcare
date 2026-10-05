import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import {
  normalizeLineServiceMode,
  serviceModeForTwilioVoicePath,
  twilioLineBindingMatches,
  verifyNetclinicTwilioRequest
} from '../src/line-routing.js';
import {
  buildServiceGreeting,
  modeIncludesJozi,
  normalizeServiceMode,
  serviceModePolicy
} from '../src/jozi-support.js';

const NETCLINIC = '+27600112421';
const HEALTH = '+12063098528';
const SHARED_425 = '+14255173281';
const KEY = 'k'.repeat(40);
const source = readFileSync(fileURLToPath(new URL('../src/cloudflare-worker.js', import.meta.url)), 'utf8');

function sourceBetween(start, end) {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  assert.ok(from >= 0 && to > from, `source section ${start}`);
  return source.slice(from, to);
}

function twilioRequest(url, headers = {}) {
  return new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', ...headers },
    body: 'CallSid=CA' + '0'.repeat(32) + '&To=%2B27600112421&From=%2B27820000000'
  });
}

test('netclinic is a line mode of its own and older modes are unchanged', () => {
  assert.equal(normalizeLineServiceMode(' NETCLINIC '), 'netclinic');
  assert.equal(normalizeLineServiceMode('unknown', 'netclinic'), 'netclinic');
  assert.equal(normalizeLineServiceMode('unknown'), 'health');
  assert.equal(normalizeLineServiceMode('combined'), 'health');
  assert.equal(normalizeServiceMode('netclinic'), 'netclinic');
  assert.equal(modeIncludesJozi('netclinic'), false);
});

test('only the netclinic path reaches the netclinic line', () => {
  assert.equal(serviceModeForTwilioVoicePath('/twilio/voice/netclinic'), 'netclinic');
  assert.equal(serviceModeForTwilioVoicePath('/TWILIO/VOICE/NETCLINIC/'), 'netclinic');
  assert.equal(serviceModeForTwilioVoicePath('/twilio/voice/netclinic-extra'), null);
  assert.equal(serviceModeForTwilioVoicePath('/twilio/voice', 'health'), 'health');
  assert.equal(serviceModeForTwilioVoicePath('/twilio/voice/selfcare'), 'selfcare');
});

test('the netclinic line answers only on Netclinic\'s number, and the other lines never on it', () => {
  const numbers = { healthNumber: HEALTH, joziNumber: SHARED_425, selfcareNumber: HEALTH, netclinicNumber: NETCLINIC };
  assert.equal(twilioLineBindingMatches({ serviceMode: 'netclinic', to: NETCLINIC, ...numbers }), true);
  assert.equal(twilioLineBindingMatches({ serviceMode: 'netclinic', to: HEALTH, ...numbers }), false);
  assert.equal(twilioLineBindingMatches({ serviceMode: 'netclinic', to: NETCLINIC, healthNumber: HEALTH, joziNumber: SHARED_425 }), false);
  assert.equal(twilioLineBindingMatches({ serviceMode: 'selfcare', to: NETCLINIC, ...numbers }), false);
  assert.equal(twilioLineBindingMatches({ serviceMode: 'jozi', to: SHARED_425, ...numbers }), true);
});

test('netclinic webhooks pass on the URL key only when no auth token is configured', async () => {
  const env = { NETCLINIC_TWILIO_URL_KEY: KEY, TWILIO_AUTH_TOKEN: 'this-workers-own-token' };
  assert.equal(await verifyNetclinicTwilioRequest(twilioRequest(`https://w.example/twilio/voice/netclinic?key=${KEY}`), env), true);
  assert.equal(await verifyNetclinicTwilioRequest(twilioRequest(`https://w.example/twilio/voice/netclinic?key=${KEY}x`), env), false);
  assert.equal(await verifyNetclinicTwilioRequest(twilioRequest('https://w.example/twilio/voice/netclinic'), env), false);
  // a short key is no key
  assert.equal(await verifyNetclinicTwilioRequest(twilioRequest('https://w.example/twilio/voice/netclinic?key=short'),
    { NETCLINIC_TWILIO_URL_KEY: 'short' }), false);
  // with Netclinic's auth token configured the signature decides, and the key alone is not enough
  assert.equal(await verifyNetclinicTwilioRequest(twilioRequest(`https://w.example/twilio/voice/netclinic?key=${KEY}`),
    { ...env, NETCLINIC_TWILIO_AUTH_TOKEN: 'netclinic-account-token' }), false);
});

test('netclinic keeps its record in Netclinic\'s system: no caller memory, no texts, a 30-day transcript here', () => {
  const policy = serviceModePolicy('netclinic');
  assert.equal(policy.callerMemory, false);
  assert.equal(policy.automaticFollowup, false);
  assert.equal(policy.persistRawTranscript, true);
  assert.equal(policy.transcriptTtlDays, 30);
  assert.equal('transcriptTtlDays' in serviceModePolicy('selfcare'), false);
});

test('Netty greets as Netclinic and says the call is transcribed', () => {
  const greeting = buildServiceGreeting('netclinic');
  assert.match(greeting, /Netclinic/);
  assert.match(greeting, /Netty/);
  assert.match(greeting, /transcribed/);
  assert.match(source, /NETCLINIC_DOCTOR_MISSED_GREETING = "Hello, this is Netty from Netclinic\. Your doctor couldn't take your call/);
});

test('the netclinic line has its own tools, voice and prompt rules', () => {
  const tools = sourceBetween('const netclinicTools = [', 'const normalized = normalizeServiceMode(mode);');
  for (const name of ['netclinic_answer', 'find_nearest_netclinic', 'send_booking_link', 'send_visit_link', 'ask_for_person']) {
    assert.match(tools, new RegExp(`name: '${name}'`));
  }
  assert.match(source, /if \(normalized === 'netclinic'\) return \[emergencyTool, \.\.\.netclinicTools\];/);
  assert.match(source, /env\.NETCLINIC_REALTIME_VOICE \|\| 'quartz'/);
  const prompt = sourceBetween('const NETCLINIC_INSTRUCTIONS = `', '`;');
  assert.match(prompt, /one zero one seven seven, or one one two from a cell phone/);
  assert.match(prompt, /Never say a booking was made/);
  assert.match(prompt, /ask for the patient's full name and date of birth once/);
  assert.match(source, /kind: 'booking'/);
  assert.match(source, /kind: 'visit', name:/);
  assert.match(prompt, /You never read a patient's records, documents or anything clinical on this line/);
  assert.match(prompt, /Medirite is "medi" as in medical, then "rite" as in right/);
  // a respelling is what the model copies into its words (seen on the first test call: "MED-ee-rite Sea Point")
  assert.doesNotMatch(source, /MED-ee-rite|BLOW-berg|NET-clinic|NET-ee/);
  assert.match(source, /never call them simulated or unverified/);
});

test('netclinic routes check Netclinic\'s account before anything else and keep the line on their callbacks', () => {
  const route = sourceBetween("serviceModeForTwilioVoicePath(path) === 'netclinic'", "path.startsWith('/twilio/voice')");
  assert.ok(route.indexOf('verifyNetclinicTwilioRequest') < route.indexOf('handleTwilioVoice'));
  assert.match(route, /netclinicLineEnabled\(env\)/);
  const statusRoute = sourceBetween("searchParams.get('line') === 'netclinic'", "path === '/twilio/status') {");
  assert.match(statusRoute, /verifyNetclinicTwilioRequest/);
  const voice = sourceBetween('async function handleTwilioVoice', 'async function handleTwilioStatus');
  assert.match(voice, /twilio\/status\?line=netclinic/);
  assert.match(voice, /twilio\/dial-status\?line=netclinic/);
  assert.match(voice, /netclinicNumber: env\.NETCLINIC_PHONE_NUMBER/);
  assert.match(source, /\['health', 'jozi', 'selfcare', 'netclinic'\]\.includes\(serviceMode\)/);
});

test('turns, flags and the end of a call go to Netclinic\'s server in order, never blocking the call', () => {
  const post = sourceBetween('netclinicPost(path, body) {', 'liveTranscriptGroups(afterSeq = 0) {');
  assert.match(post, /this\.netclinicChain = \(this\.netclinicChain \|\| Promise\.resolve\(\)\)\.then\(send, send\)/);
  assert.match(source, /if \(this\.lastLiveDeltaRole && this\.lastLiveDeltaRole !== safeRole\) this\.forwardNetclinicTurns\(\);/);
  assert.match(source, /this\.forwardNetclinicTurns\(\{ trailing: 'netty' \}\);/);
  const finalize = sourceBetween('async finalizeCall() {', 'async cleanupJoziSession');
  assert.ok(finalize.indexOf("this.forwardNetclinicTurns({ trailing: 'all' })") < finalize.indexOf('this.flushPendingLiveTranscripts()'));
  assert.match(finalize, /netclinic_end_posted/);
});

test('the booking link carries the caller\'s words and who it is for, filled in on the link (5 October 2026)', () => {
  const tools = sourceBetween('const netclinicTools = [', 'const normalized = normalizeServiceMode(mode);');
  assert.match(tools, /complaint: \{ type: 'string', description: 'What the visit is about, in the caller\\'s own words and short/);
  assert.match(tools, /for_whom: \{ type: 'string', enum: \['me', 'child', 'someone_else'\]/);
  assert.match(source, /kind: 'booking', complaint: String\(args\.complaint \|\| ''\)\.slice\(0, 600\),/);
  assert.match(source, /\.\.\.\(\['me', 'child', 'someone_else'\]\.includes\(args\.for_whom\) \? \{ for_whom: args\.for_whom \} : \{\}\)/);
  const prompt = sourceBetween('const NETCLINIC_INSTRUCTIONS = `', '`;');
  assert.match(prompt, /with that filled in: they open it, check their details and pay/);
  // Opening the link signs their number in: there is no code to promise.
  assert.doesNotMatch(prompt, /confirm their number with the code they get/);
});
