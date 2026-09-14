import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  DEFAULT_LIVE_BACKEND_MODEL,
  DEFAULT_LIVE_MODEL,
  buildOpenAISipUri,
  buildLiveAcceptPayload,
  classifyLiveConsentTurn,
  classifyExplicitVoiceConsent,
  compactLiveJoziToolResult,
  isReflectedLiveAudioEvent,
  liveFunctionCall,
  liveGreetingEvent,
  liveToolResultEvents,
  liveTranscriptDelta,
  markLiveOfferSpoken,
  nextFinalizeAlarmAt,
  normalizeOpenAIVoiceApi,
  openAIAcceptUrl,
  openAIAttachUrl,
  openAIRejectUrl,
  voiceApiForIncomingEvent,
  voiceSessionId
} from '../src/openai-voice-api.js';

const workerSource = await readFile(new URL('../src/cloudflare-worker.js', import.meta.url), 'utf8');
const workerConfig = await readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8');

test('GPT-Live uses the Live SIP session contract and keeps Realtime as an explicit rollback', () => {
  assert.equal(DEFAULT_LIVE_MODEL, 'gpt-live-1');
  assert.equal(DEFAULT_LIVE_BACKEND_MODEL, 'gpt-5.6-terra');
  assert.equal(normalizeOpenAIVoiceApi('LIVE'), 'live');
  assert.equal(normalizeOpenAIVoiceApi('realtime'), 'realtime');
  assert.equal(normalizeOpenAIVoiceApi('unknown'), 'live');

  const event = {
    type: 'live.transport.incoming',
    id: 'evt_must_not_be_used_as_the_session',
    data: { type: 'sip', session_id: 'live_opaque-123' }
  };
  assert.equal(voiceApiForIncomingEvent(event), 'live');
  assert.equal(voiceApiForIncomingEvent({ type: 'live.call.incoming' }), 'live');
  assert.equal(voiceApiForIncomingEvent({ type: 'realtime.call.incoming' }), 'realtime');
  assert.equal(voiceApiForIncomingEvent({ type: 'other' }), null);
  assert.equal(voiceSessionId(event), 'live_opaque-123');
  assert.equal(voiceSessionId({ type: 'live.transport.incoming', id: 'evt_wrong', data: {} }), null);

  assert.equal(openAIAcceptUrl('live', 'live_a/b'), 'https://api.openai.com/v1/live/sessions/live_a%2Fb/accept');
  assert.equal(openAIRejectUrl('live', 'live_1'), 'https://api.openai.com/v1/live/sessions/live_1/reject');
  assert.equal(openAIAttachUrl('live', 'live_1'), 'https://api.openai.com/v1/live/sessions/live_1/attach');
  assert.equal(openAIAcceptUrl('realtime', 'call_1'), 'https://api.openai.com/v1/realtime/calls/call_1/accept');

  assert.equal(
    buildOpenAISipUri('proj_123', { 'x-prismind-call-id': 'CA123' }, { secureMedia: true }),
    'sip:proj_123@sip.api.openai.com;transport=tls;secure=true?x-prismind-call-id=CA123'
  );
  assert.equal(
    buildOpenAISipUri('proj_123', {}, { secureMedia: false }),
    'sip:proj_123@sip.api.openai.com;transport=tls'
  );
});

test('Live accept payload splits the voice prompt from Responses reasoning and omits SIP input format', () => {
  const tools = [{ type: 'function', name: 'find_support', parameters: { type: 'object' } }];
  const payload = buildLiveAcceptPayload({
    voice: 'marin',
    frontendInstructions: 'Warm voice instructions',
    backendInstructions: 'Verified routing rules',
    tools,
    maxOutputTokens: 700
  });

  assert.equal(payload.session.type, 'live');
  assert.equal(payload.session.model, 'gpt-live-1');
  assert.equal(payload.session.instructions, 'Warm voice instructions');
  assert.deepEqual(payload.session.audio, { output: { voice: 'marin' } });
  assert.equal(payload.session.audio.input, undefined);
  assert.equal(payload.session.delegation.type, 'responses');
  assert.equal(payload.session.delegation.responses.model, 'gpt-5.6-terra');
  assert.equal(payload.session.delegation.responses.instructions, 'Verified routing rules');
  assert.deepEqual(payload.session.delegation.responses.tools, tools);
  assert.equal(payload.session.delegation.responses.tool_choice, 'auto');
  assert.equal(payload.session.delegation.responses.parallel_tool_calls, false);
  assert.equal(payload.session.delegation.responses.max_output_tokens, 700);
});

test('Live sideband events map transcript deltas and nested Responses function calls', () => {
  assert.deepEqual(liveTranscriptDelta({
    type: 'session.input_transcript.delta',
    event_id: 'evt_1',
    delta: 'yes please',
    start_ms: 1200,
    end_ms: 1650
  }), {
    role: 'patient',
    delta: 'yes please',
    startMs: 1200,
    endMs: 1650,
    eventId: 'evt_1'
  });
  assert.equal(liveTranscriptDelta({ type: 'response.done', delta: 'no' }), null);

  const call = liveFunctionCall({
    type: 'response.event',
    delegation_id: 'dlg_1',
    event: {
      type: 'response.output_item.done',
      item: {
        type: 'function_call',
        call_id: 'call_1',
        name: 'find_support',
        arguments: '{"location":"Hillbrow"}'
      }
    }
  });
  assert.deepEqual(call, {
    callId: 'call_1',
    name: 'find_support',
    arguments: { location: 'Hillbrow' },
    delegationId: 'dlg_1',
    responseId: ''
  });
  assert.equal(liveFunctionCall({ type: 'response.output_item.done' }), null);
});

test('Live greeting and tool continuation use Live commands, never Realtime conversation items', () => {
  assert.deepEqual(liveGreetingEvent('Hello, how can I help?', 'greeting_1'), {
    type: 'session.instructions.append',
    event_id: 'greeting_1',
    delegation_id: null,
    content: 'Speak first now in English. Say exactly: "Hello, how can I help?" Then pause and listen for the caller.'
  });

  const [result, continuation] = liveToolResultEvents('call_1', { success: true }, 'dlg-1');
  assert.equal(result.type, 'response.item.create');
  assert.equal(result.item.type, 'function_call_output');
  assert.equal(result.item.call_id, 'call_1');
  assert.equal(result.item.output, '{"success":true}');
  assert.equal(continuation.type, 'response.create');
  assert.equal(continuation.response, undefined);
});

test('explicit spoken consent is fail-closed and distinguishes acceptance from refusal', () => {
  for (const phrase of ['yes', 'Yes please', 'okay', 'connect me', 'please do', 'yebo', 'ja', 'sim', 'ewe', 'ngiyavuma']) {
    assert.equal(classifyExplicitVoiceConsent(phrase), 'confirmed', phrase);
  }
  for (const phrase of ['no', "don't connect me", 'not yet', 'not okay', 'cancel that', 'cha', 'hayi', 'nee', 'não']) {
    assert.equal(classifyExplicitVoiceConsent(phrase), 'declined', phrase);
  }
  for (const phrase of ['', 'what time do they close?', 'okay, what time do they close?', 'maybe later', 'yes but no']) {
    assert.equal(classifyExplicitVoiceConsent(phrase), 'unknown', phrase);
  }
});

test('Live consent is accepted only after the spoken offer and on the immediately next delegation', () => {
  const pending = { live_delegation_id: 'dlg_offer' };
  assert.equal(classifyLiveConsentTurn({
    offer: pending,
    currentDelegationId: 'dlg_reply',
    delegationOrder: ['dlg_offer', 'dlg_reply'],
    transcript: 'yes',
    inputStartMs: 2600
  }), 'not_ready');

  const started = markLiveOfferSpoken(pending, 4, { startMs: 2000, endMs: 2150 });
  const spoken = markLiveOfferSpoken(started, 4, { startMs: 2150, endMs: 2500 });
  assert.equal(spoken.live_spoken_input_seq, 4);
  assert.equal(spoken.live_spoken_start_ms, 2000);
  assert.equal(spoken.live_spoken_end_ms, 2500);
  assert.equal(classifyLiveConsentTurn({
    offer: spoken,
    currentDelegationId: 'dlg_reply',
    delegationOrder: ['dlg_offer', 'dlg_reply'],
    transcript: 'yebo',
    inputStartMs: 2600
  }), 'confirmed');
  assert.equal(classifyLiveConsentTurn({
    offer: spoken,
    currentDelegationId: 'dlg_reply',
    delegationOrder: ['dlg_offer', 'dlg_reply'],
    transcript: 'yes',
    inputStartMs: 2400
  }), 'not_ready');
  assert.equal(classifyLiveConsentTurn({
    offer: spoken,
    currentDelegationId: 'dlg_late',
    delegationOrder: ['dlg_offer', 'dlg_reply', 'dlg_late'],
    transcript: 'yes',
    inputStartMs: 2700
  }), 'stale');
});

test('Live audio reflections are ignored and Jozi tool results are minimized before delegation', () => {
  assert.equal(isReflectedLiveAudioEvent({ type: 'session.input_audio.append' }), true);
  assert.equal(isReflectedLiveAudioEvent({ type: 'session.output_audio.delta' }), true);
  assert.equal(isReflectedLiveAudioEvent({ type: 'session.input_transcript.delta' }), false);

  const compact = compactLiveJoziToolResult('find_support_services', {
    success: true,
    status: 'matched',
    voiceResponse: 'MES is the first step. Would you like me to connect the demo now?',
    awaiting: 'demo_action_consent',
    suggested_demo_action: 'phone_connection',
    spoken_option_ids: ['mes-jhb', 'city-fallback'],
    options: [{ id: 'mes-jhb', phone: '011...' }, { id: 'city-fallback' }],
    source_checked_at: '2026-09-01'
  });
  assert.deepEqual(compact, {
    success: true,
    status: 'matched',
    voiceResponse: 'MES is the first step. Would you like me to connect the demo now?',
    awaiting: 'demo_action_consent',
    suggested_demo_action: 'phone_connection',
    offered_resource_id: 'mes-jhb'
  });
  assert.equal(compact.options, undefined);
  assert.equal(compact.source_checked_at, undefined);
});

test('production config maps 206 to selfcare, 425 to Jozi, and disables the legacy health path', () => {
  assert.match(workerConfig, /"OPENAI_VOICE_API"\s*:\s*"live"/);
  assert.match(workerConfig, /"OPENAI_LIVE_MODEL"\s*:\s*"gpt-live-1"/);
  assert.match(workerConfig, /"HEALTH_LINE_ENABLED"\s*:\s*"false"/);
  assert.match(workerConfig, /"SELFCARE_PHONE_NUMBER"\s*:\s*"\+12063098528"/);
  assert.match(workerConfig, /"JOZI_PHONE_NUMBER"\s*:\s*"\+14255173281"/);
  assert.match(workerSource, /serviceMode === 'health' && !healthLineEnabled\(env\)/);
  assert.match(workerSource, /secureMedia: configuredOpenAIVoiceApi\(env\) === 'live'/);
  assert.match(workerSource, /isReflectedLiveAudioEvent\(message\)/);
});

test('Jozi Live frontend—not only the backend—carries the caring South African delivery', () => {
  assert.match(workerSource, /gentle, natural South African English cadence/);
  assert.match(workerSource, /Never exaggerate or caricature an accent/);
  assert.match(workerSource, /pronounce Johannesburg place names carefully/);
});

test('Live finalization keeps the normal idle alarm and uses a bounded provider-end drain', () => {
  assert.match(workerSource, /const rawDrainDeadline = this\.getMeta\('live_drain_deadline_ms'\)/);
  assert.equal(nextFinalizeAlarmAt(null, { now: 1000, idleMs: 120000 }), 121000);
  assert.equal(nextFinalizeAlarmAt('', { now: 1000, idleMs: 120000 }), 121000);
  assert.equal(nextFinalizeAlarmAt('5000', { now: 1000, idleMs: 120000 }), 5000);
  assert.equal(nextFinalizeAlarmAt('900', { now: 1000, idleMs: 120000 }), 1050);
  assert.equal(nextFinalizeAlarmAt('not-a-number', { now: 1000, idleMs: 120000 }), 121000);
  assert.match(workerSource, /OPENAI_LIVE_FINALIZE_DRAIN_MS/);
  assert.match(workerSource, /!this\.getMeta\('finalize_reason'\)/);
});

test('Live sideband has one bounded retry for both initial attach and later disconnects', () => {
  assert.match(workerSource, /monitor_initial_attach_error/);
  assert.match(workerSource, /connected = await this\.reconnectLiveMonitor\(callId\)/);
  assert.match(workerSource, /if \(attempts < 1\)/);
  assert.match(workerSource, /live_monitor_reconnect_attempts/);
  assert.match(workerSource, /return connected/);
});
