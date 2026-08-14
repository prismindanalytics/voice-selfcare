import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { readFile } from 'node:fs/promises';

import * as lineRouting from '../src/line-routing.js';

const workerSource = await readFile(new URL('../src/cloudflare-worker.js', import.meta.url), 'utf8');
const HEALTH_NUMBER = '+12063098528';
const JOZI_NUMBER = '+14255173281';

function sourceBetween(startMarker, endMarker) {
  const start = workerSource.indexOf(startMarker);
  const end = workerSource.indexOf(endMarker, start + startMarker.length);
  assert.ok(start >= 0, `Missing source marker: ${startMarker}`);
  assert.ok(end > start, `Missing source marker after ${startMarker}: ${endMarker}`);
  return workerSource.slice(start, end);
}

test('health and Jozi destinations agree with only their exact line profiles', () => {
  assert.equal(typeof lineRouting.twilioLineBindingMatches, 'function');

  const matches = (serviceMode, to, overrides = {}) => lineRouting.twilioLineBindingMatches({
    serviceMode,
    to,
    healthNumber: HEALTH_NUMBER,
    joziNumber: JOZI_NUMBER,
    ...overrides
  });

  assert.equal(matches('health', HEALTH_NUMBER), true);
  assert.equal(matches('jozi', JOZI_NUMBER), true);
  assert.equal(matches('health', JOZI_NUMBER), false);
  assert.equal(matches('jozi', HEALTH_NUMBER), false);
  assert.equal(matches('health', ''), false);
  assert.equal(matches('jozi', ''), false);
  assert.equal(matches('combined', JOZI_NUMBER), false);
  assert.equal(matches('unknown', HEALTH_NUMBER), false);
  assert.equal(matches('health', HEALTH_NUMBER, { joziNumber: HEALTH_NUMBER }), false);
  assert.equal(matches('jozi', JOZI_NUMBER, { healthNumber: JOZI_NUMBER }), false);
  assert.equal(matches('health', HEALTH_NUMBER, { healthNumber: '' }), false);
  assert.equal(matches('jozi', JOZI_NUMBER, { joziNumber: '' }), false);
});

test('every supported Twilio voice path is bound to the matching destination number', () => {
  const bindingFor = (path, to) => {
    const serviceMode = lineRouting.serviceModeForTwilioVoicePath(path, 'health');
    return lineRouting.twilioLineBindingMatches({
      serviceMode,
      to,
      healthNumber: HEALTH_NUMBER,
      joziNumber: JOZI_NUMBER
    });
  };

  assert.equal(bindingFor('/twilio/voice', HEALTH_NUMBER), true);
  assert.equal(bindingFor('/twilio/voice/health', HEALTH_NUMBER), true);
  assert.equal(bindingFor('/twilio/voice/health/pcmu', HEALTH_NUMBER), true);
  assert.equal(bindingFor('/twilio/voice/jozi', JOZI_NUMBER), true);
  assert.equal(bindingFor('/TWILIO/VOICE/JOZI/PCMA/', JOZI_NUMBER), true);

  assert.equal(bindingFor('/twilio/voice', JOZI_NUMBER), false);
  assert.equal(bindingFor('/twilio/voice/health', JOZI_NUMBER), false);
  assert.equal(bindingFor('/twilio/voice/jozi', HEALTH_NUMBER), false);
  assert.equal(bindingFor('/twilio/voice/jozi/pcmu', HEALTH_NUMBER), false);
  assert.equal(bindingFor('/twilio/voice/unknown', JOZI_NUMBER), false);
});

test('only one valid custom Twilio CallSid header can select a stored profile', () => {
  assert.equal(typeof lineRouting.extractTwilioCallSidFromSipHeaders, 'function');
  const callSid = 'CA0123456789abcdef0123456789abcdef';

  assert.equal(lineRouting.extractTwilioCallSidFromSipHeaders([
    { name: 'From', value: 'sip:+12065550123@example.com' },
    { name: 'X-Twilio-ParentCallSid', value: callSid },
    { name: 'Call-ID', value: 'not-the-provider-call-sid' }
  ]), callSid);
  assert.equal(lineRouting.extractTwilioCallSidFromSipHeaders([
    { name: 'SipHeader_X_Twilio_ParentCallSid', value: callSid }
  ]), callSid);

  assert.equal(lineRouting.extractTwilioCallSidFromSipHeaders([
    { name: 'Call-ID', value: callSid }
  ]), null);
  assert.equal(lineRouting.extractTwilioCallSidFromSipHeaders([
    { name: 'X-Twilio-ParentCallSid', value: 'CA-too-short' }
  ]), null);
  assert.equal(lineRouting.extractTwilioCallSidFromSipHeaders([
    { name: 'X-Twilio-ParentCallSid', value: callSid },
    { name: 'x_twilio_parent_call_sid', value: 'CAffffffffffffffffffffffffffffffff' }
  ]), null);
  assert.equal(lineRouting.extractTwilioCallSidFromSipHeaders([]), null);
});

test('Twilio signature verification is fail-closed and precedes all voice form processing', async () => {
  const voiceRoute = sourceBetween(
    "if (request.method === 'POST' && path.startsWith('/twilio/voice'))",
    "if (request.method === 'POST' && path === '/twilio/status')"
  );
  const verifyIndex = voiceRoute.indexOf('await verifyTwilioRequest(request, env)');
  const delegationIndex = voiceRoute.indexOf('handleTwilioVoice(request, env');
  const url = 'https://voice.example.test/twilio/voice/jozi';
  const body = 'CallSid=CA0123456789abcdef0123456789abcdef&From=%2B12065550123&To=%2B14255173281';
  const authToken = 'test_auth_token_do_not_use';
  const params = new URLSearchParams(body);
  let signedPayload = url;
  for (const name of [...new Set(params.keys())].sort()) {
    for (const value of params.getAll(name).sort()) signedPayload += `${name}${value}`;
  }
  const signature = createHmac('sha1', authToken).update(signedPayload).digest('base64');
  const requestFor = ({ requestUrl = url, requestBody = body, suppliedSignature = signature, contentType = 'application/x-www-form-urlencoded' } = {}) => new Request(requestUrl, {
    method: 'POST',
    headers: {
      'content-type': contentType,
      ...(suppliedSignature ? { 'x-twilio-signature': suppliedSignature } : {})
    },
    body: requestBody
  });

  assert.match(voiceRoute, /if\s*\(\s*!env\.TWILIO_AUTH_TOKEN\s*\)\s*return\s+textResponse\([^)]*503\)/);
  assert.ok(verifyIndex >= 0, 'voice route must verify the Twilio request');
  assert.ok(delegationIndex > verifyIndex, 'Twilio verification must happen before reading or trusting voice form fields');
  assert.equal(typeof lineRouting.verifyTwilioRequest, 'function');
  assert.equal(await lineRouting.verifyTwilioRequest(requestFor(), { TWILIO_AUTH_TOKEN: authToken }), true);
  assert.equal(await lineRouting.verifyTwilioRequest(requestFor(), {}), false);
  assert.equal(await lineRouting.verifyTwilioRequest(requestFor({ suppliedSignature: '' }), { TWILIO_AUTH_TOKEN: authToken }), false);
  assert.equal(await lineRouting.verifyTwilioRequest(requestFor({ requestBody: `${body}&Digits=1` }), { TWILIO_AUTH_TOKEN: authToken }), false);
  assert.equal(await lineRouting.verifyTwilioRequest(requestFor({ requestUrl: `${url}/wrong` }), { TWILIO_AUTH_TOKEN: authToken }), false);
  assert.equal(await lineRouting.verifyTwilioRequest(requestFor({ contentType: 'application/json' }), { TWILIO_AUTH_TOKEN: authToken }), false);
});

test('both Twilio status endpoints verify signatures before terminal state changes', () => {
  const statusRoute = sourceBetween(
    "if (request.method === 'POST' && path === '/twilio/status')",
    "if (request.method === 'POST' && path === '/twilio/dial-status')"
  );
  const dialStatusRoute = sourceBetween(
    "if (request.method === 'POST' && path === '/twilio/dial-status')",
    "if (request.method === 'GET' && path === '/transcripts')"
  );
  const assertVerifiedBefore = (routeSource, handlerName) => {
    const verifyIndex = routeSource.indexOf('await verifyTwilioRequest(request, env)');
    const delegationIndex = routeSource.indexOf(`${handlerName}(request, env, ctx)`);
    assert.match(routeSource, /if\s*\(\s*!env\.TWILIO_AUTH_TOKEN\s*\)\s*return\s+textResponse\([^)]*503\)/);
    assert.ok(verifyIndex >= 0, `${handlerName} route must verify the Twilio request`);
    assert.ok(delegationIndex > verifyIndex, `${handlerName} verification must precede terminal state changes`);
  };

  assertVerifiedBefore(statusRoute, 'handleTwilioStatus');
  assertVerifiedBefore(dialStatusRoute, 'handleTwilioDialStatus');
});

test('voice routing stores the verified caller and both verified line attributes in the CallSid profile', () => {
  const voiceHandler = sourceBetween(
    'async function handleTwilioVoice',
    'async function handleTwilioStatus'
  );

  assert.match(voiceHandler, /twilioLineBindingMatches\s*\(\s*\{/);
  assert.match(voiceHandler, /healthNumber\s*:\s*env\.HEALTH_PHONE_NUMBER/);
  assert.match(voiceHandler, /joziNumber\s*:\s*env\.JOZI_PHONE_NUMBER/);
  assert.match(voiceHandler, /setCallProfile\s*\(\s*callSid\s*,\s*\{/);
  assert.match(voiceHandler, /serviceMode/);
  assert.match(voiceHandler, /const\s+callerPhone\s*=\s*asE164\(form\.From/);
  assert.match(voiceHandler, /callerPhone\s*:\s*serviceMode\s*===\s*'health'\s*&&\s*isUsablePatientPhone\(callerPhone\)\s*\?\s*callerPhone\s*:\s*null/);
  assert.match(voiceHandler, /destinationPhone\s*:\s*(?:asE164\()?form\.To/);
});

test('missing or unknown OpenAI CallSid profiles reject instead of inheriting health mode', () => {
  const webhookHandler = sourceBetween(
    'async function handleOpenAIWebhook',
    'async function rejectOpenAICall'
  );

  assert.match(webhookHandler, /extractTwilioCallSidFromSipHeaders\(sipHeaders\)/);
  assert.match(webhookHandler, /providerCallId\s*\?\s*await callerRegistry\(env\)\.getCallProfile\(providerCallId\)\s*:\s*null/);
  assert.match(webhookHandler, /getCallProfile\(providerCallId\)/);
  assert.match(webhookHandler, /if\s*\(\s*!(?:storedProfile|profile)[\s\S]{0,500}rejectOpenAICall\(env, callId\)/);
  assert.doesNotMatch(webhookHandler, /let\s+serviceMode\s*=\s*configuredServiceMode\(env\)/);
  assert.doesNotMatch(webhookHandler, /extractCallerPhoneFromSipHeaders\(sipHeaders\)/);
});

test('OpenAI call acceptance uses the verified stored caller, never the SIP From identity', () => {
  const webhookHandler = sourceBetween(
    'async function handleOpenAIWebhook',
    'async function rejectOpenAICall'
  );
  const acceptHandler = sourceBetween(
    '  async acceptAndMonitor',
    '  async alarm'
  );

  assert.match(webhookHandler, /(?:storedProfile|profile)\.callerPhone/);
  assert.match(webhookHandler, /(?:storedProfile|profile)\.serviceMode/);
  assert.doesNotMatch(acceptHandler, /phoneFromSip\s*\|\|\s*initialPhone/);
  assert.match(acceptHandler, /normalizePatientPhone\(initialPhone, callId\)/);
});

test('accept retries and terminal callbacks cannot restart a completed call session', () => {
  const acceptHandler = sourceBetween(
    '  async acceptAndMonitor',
    '  async alarm'
  );
  const forceFinalizeHandler = sourceBetween(
    '  async forceFinalize',
    '  async getSession'
  );
  const finalizeHandler = sourceBetween(
    '  async finalizeCall',
    '  async cleanupJoziSession'
  );
  const firstAwait = acceptHandler.indexOf('await ');
  const firstCompletedGuard = acceptHandler.indexOf("this.getMeta('completed_at')");
  const firstTerminalGuard = acceptHandler.indexOf("this.getMeta('terminal_at')");
  const acceptingMarker = acceptHandler.indexOf("this.setMeta('accepting_at'");
  const acceptCall = acceptHandler.indexOf('await this.acceptCall(');
  const connectMonitor = acceptHandler.indexOf('await this.connectMonitor(');
  const postAcceptSection = acceptHandler.slice(acceptCall, connectMonitor);

  assert.ok(firstCompletedGuard >= 0 && firstCompletedGuard < firstAwait,
    'completed sessions must return before acceptAndMonitor reaches its first await');
  assert.ok(firstTerminalGuard >= 0 && firstTerminalGuard < firstAwait,
    'terminal sessions must return before acceptAndMonitor reaches its first await');
  assert.ok(acceptingMarker >= 0 && acceptingMarker < firstAwait,
    'acceptAndMonitor must claim the accept attempt before any interleaving await');
  assert.ok(acceptCall >= 0 && connectMonitor > acceptCall);
  assert.match(postAcceptSection, /this\.getMeta\('completed_at'\)/,
    'terminal state must be rechecked after the network accept and before monitor connection');
  assert.match(postAcceptSection, /this\.getMeta\('terminal_at'\)/,
    'terminal callbacks during accept must stop monitor connection');

  const forceFinalizeSet = forceFinalizeHandler.indexOf("this.setMeta('terminal_at'");
  const forceFinalizeAwait = forceFinalizeHandler.indexOf('await ');
  assert.ok(forceFinalizeSet >= 0 && forceFinalizeSet < forceFinalizeAwait,
    'forceFinalize must mark terminal state before yielding');

  const finalizeSet = finalizeHandler.indexOf("this.setMeta('terminal_at'");
  const finalizeAwait = finalizeHandler.indexOf('await ');
  assert.ok(finalizeSet >= 0 && finalizeSet < finalizeAwait,
    'finalizeCall must mark terminal state before yielding');
});
