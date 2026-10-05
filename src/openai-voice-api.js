export const DEFAULT_LIVE_MODEL = 'gpt-live-1';
export const DEFAULT_LIVE_BACKEND_MODEL = 'gpt-5.6-terra';

const LIVE_WEBHOOK_TYPES = new Set([
  'live.transport.incoming',
  'live.call.incoming'
]);

export function normalizeOpenAIVoiceApi(value, fallback = 'live') {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'live' || normalized === 'realtime') return normalized;
  return String(fallback || '').trim().toLowerCase() === 'realtime' ? 'realtime' : 'live';
}

export function voiceApiForIncomingEvent(event) {
  const type = String(event?.type || '');
  if (LIVE_WEBHOOK_TYPES.has(type)) return 'live';
  if (type === 'realtime.call.incoming') return 'realtime';
  return null;
}

export function voiceSessionId(event, voiceApi = voiceApiForIncomingEvent(event)) {
  if (voiceApi === 'live') {
    const sessionId = String(event?.data?.session_id || '').trim();
    return sessionId || null;
  }
  const callId = String(
    event?.call_id || event?.data?.call_id || event?.call?.id || event?.id || ''
  ).trim();
  return callId || null;
}

export function openAIAcceptUrl(voiceApi, sessionId) {
  const id = encodeURIComponent(String(sessionId || ''));
  return normalizeOpenAIVoiceApi(voiceApi) === 'live'
    ? `https://api.openai.com/v1/live/sessions/${id}/accept`
    : `https://api.openai.com/v1/realtime/calls/${id}/accept`;
}

export function openAIRejectUrl(voiceApi, sessionId) {
  const id = encodeURIComponent(String(sessionId || ''));
  return normalizeOpenAIVoiceApi(voiceApi) === 'live'
    ? `https://api.openai.com/v1/live/sessions/${id}/reject`
    : `https://api.openai.com/v1/realtime/calls/${id}/reject`;
}

export function openAIAttachUrl(voiceApi, sessionId) {
  const id = encodeURIComponent(String(sessionId || ''));
  return normalizeOpenAIVoiceApi(voiceApi) === 'live'
    ? `https://api.openai.com/v1/live/sessions/${id}/attach`
    : `https://api.openai.com/v1/realtime?call_id=${id}`;
}

export function buildLiveAcceptPayload({
  model = DEFAULT_LIVE_MODEL,
  voice = 'marin',
  frontendInstructions,
  backendModel = DEFAULT_LIVE_BACKEND_MODEL,
  backendInstructions,
  tools = [],
  maxOutputTokens = 900,
  serviceTier
}) {
  const responses = {
    model: String(backendModel || DEFAULT_LIVE_BACKEND_MODEL),
    instructions: String(backendInstructions || ''),
    tools: Array.isArray(tools) ? tools : [],
    tool_choice: Array.isArray(tools) && tools.length ? 'auto' : 'none',
    parallel_tool_calls: false,
    max_output_tokens: Math.max(16, Number(maxOutputTokens) || 900)
  };
  if (serviceTier) responses.service_tier = serviceTier;

  return {
    session: {
      type: 'live',
      model: String(model || DEFAULT_LIVE_MODEL),
      instructions: String(frontendInstructions || ''),
      audio: {
        output: { voice: String(voice || 'marin') }
      },
      delegation: {
        type: 'responses',
        responses
      }
    }
  };
}

export function buildOpenAISipUri(projectId, headers = {}, { secureMedia = false } = {}) {
  const base = `sip:${String(projectId || '')}@sip.api.openai.com;transport=tls${secureMedia ? ';secure=true' : ''}`;
  const params = Object.entries(headers)
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim())
    .map(([name, value]) => `${encodeURIComponent(name)}=${encodeURIComponent(String(value))}`);
  return params.length ? `${base}?${params.join('&')}` : base;
}

export function liveGreetingEvent(greeting, eventId) {
  return {
    type: 'session.instructions.append',
    event_id: String(eventId || 'opening_greeting'),
    delegation_id: null,
    content: `Speak first now in English. Say exactly: "${String(greeting || '')}" Then pause and listen for the caller.`
  };
}

export function liveGreetingStartEvent(greeting, eventId) {
  return {
    type: 'session.commentary.append',
    event_id: String(eventId || 'opening_greeting_start'),
    delegation_id: null,
    content: String(greeting || 'Hello. How can I help you today?')
  };
}

export function liveTranscriptDelta(message) {
  const role = message?.type === 'session.input_transcript.delta'
    ? 'patient'
    : message?.type === 'session.output_transcript.delta' ? 'assistant' : null;
  const delta = String(message?.delta || '');
  if (!role || !delta) return null;
  return {
    role,
    delta,
    startMs: finiteNumberOrNull(message?.start_ms),
    endMs: finiteNumberOrNull(message?.end_ms),
    eventId: String(message?.event_id || '') || null
  };
}

export function liveFunctionCall(message) {
  if (message?.type !== 'response.event') return null;
  const nested = message?.event;
  const item = nested?.type === 'response.output_item.done' ? nested?.item : null;
  if (!item || item.type !== 'function_call') return null;
  const callId = String(item.call_id || '').trim();
  const name = String(item.name || '').trim();
  if (!callId || !name) return null;
  let argumentsObject = {};
  try {
    argumentsObject = JSON.parse(item.arguments || '{}');
  } catch {
    argumentsObject = {};
  }
  return {
    callId,
    name,
    arguments: argumentsObject,
    delegationId: String(message.delegation_id || ''),
    responseId: String(nested.response_id || nested.response?.id || '')
  };
}

export function liveToolResultEvents(callId, result, eventIdPrefix = 'tool') {
  const safePrefix = String(eventIdPrefix || 'tool').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
  return [
    {
      type: 'response.item.create',
      event_id: `${safePrefix}_result`,
      item: {
        type: 'function_call_output',
        call_id: String(callId || ''),
        output: JSON.stringify(result)
      }
    },
    {
      type: 'response.create',
      event_id: `${safePrefix}_continue`
    }
  ];
}

export function isReflectedLiveAudioEvent(message) {
  return message?.type === 'session.input_audio.append' ||
    message?.type === 'session.output_audio.delta';
}

export function nextFinalizeAlarmAt(rawDrainDeadline, { now = Date.now(), idleMs = 120000 } = {}) {
  const drainDeadline = rawDrainDeadline === null || rawDrainDeadline === undefined || rawDrainDeadline === ''
    ? null
    : Number(rawDrainDeadline);
  return drainDeadline !== null && Number.isFinite(drainDeadline)
    ? Math.max(Number(now) + 50, drainDeadline)
    : Number(now) + Number(idleMs);
}

export function markLiveOfferSpoken(offer, inputCheckpoint, { startMs, endMs } = {}) {
  if (!offer || typeof offer !== 'object' || !Object.keys(offer).length) return offer;
  const outputEndMs = Number(endMs);
  if (endMs === null || endMs === undefined || !Number.isFinite(outputEndMs)) return offer;
  const existingEndMs = Number(offer.live_spoken_end_ms);
  const hasInputCheckpoint = offer.live_spoken_input_seq !== null &&
    offer.live_spoken_input_seq !== undefined && Number.isFinite(Number(offer.live_spoken_input_seq));
  const hasStartMs = offer.live_spoken_start_ms !== null &&
    offer.live_spoken_start_ms !== undefined && Number.isFinite(Number(offer.live_spoken_start_ms));
  const hasEndMs = offer.live_spoken_end_ms !== null &&
    offer.live_spoken_end_ms !== undefined && Number.isFinite(existingEndMs);
  return {
    ...offer,
    live_spoken_input_seq: hasInputCheckpoint
      ? Number(offer.live_spoken_input_seq)
      : Math.max(0, Number(inputCheckpoint) || 0),
    live_spoken_start_ms: hasStartMs
      ? Number(offer.live_spoken_start_ms)
      : Number.isFinite(Number(startMs)) ? Number(startMs) : outputEndMs,
    live_spoken_end_ms: hasEndMs
      ? Math.max(existingEndMs, outputEndMs)
      : outputEndMs
  };
}

export function classifyLiveConsentTurn({
  offer,
  currentDelegationId,
  delegationOrder,
  transcript,
  inputStartMs
}) {
  const offerEndMs = Number(offer?.live_spoken_end_ms);
  if (!offer ||
      offer.live_spoken_input_seq === null || offer.live_spoken_input_seq === undefined ||
      offer.live_spoken_end_ms === null || offer.live_spoken_end_ms === undefined ||
      inputStartMs === null || inputStartMs === undefined ||
      !Number.isFinite(Number(offer.live_spoken_input_seq)) ||
      !Number.isFinite(offerEndMs) ||
      !Number.isFinite(Number(inputStartMs)) ||
      Number(inputStartMs) < offerEndMs) {
    return 'not_ready';
  }
  const offeredDelegationId = String(offer.live_delegation_id || '');
  const currentId = String(currentDelegationId || '');
  const order = Array.isArray(delegationOrder) ? delegationOrder.map(String) : [];
  const offeredIndex = order.indexOf(offeredDelegationId);
  const currentIndex = order.indexOf(currentId);
  if (!offeredDelegationId || !currentId || offeredIndex < 0 || currentIndex !== offeredIndex + 1) {
    return 'stale';
  }
  return classifyExplicitVoiceConsent(transcript);
}

export function compactLiveJoziToolResult(toolName, result = {}) {
  const commonKeys = ['success', 'status', 'error', 'voiceResponse'];
  const lookupKeys = [
    'emergency',
    'awaiting',
    'suggested_demo_action',
    'next_need',
    'city_fallback_need',
    'needsMoreLocation',
    'needsMoreAudience',
    'availability_confirmed'
  ];
  const demoKeys = [
    'simulation',
    'submitted',
    'confirmed',
    'action',
    'reference_id',
    'requested_time'
  ];
  const keys = toolName === 'find_support_services'
    ? [...commonKeys, ...lookupKeys]
    : toolName === 'coordinate_support_demo'
      ? [...commonKeys, ...demoKeys]
      : commonKeys;
  const compact = {};
  for (const key of keys) {
    if (result[key] !== undefined) compact[key] = result[key];
  }
  if (toolName === 'find_support_services' && Array.isArray(result.spoken_option_ids)) {
    compact.offered_resource_id = String(result.spoken_option_ids[0] || '');
  }
  return compact;
}

export function classifyExplicitVoiceConsent(text) {
  const normalized = String(text || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/\bdon't\b/g, 'do not')
    .replace(/\bwon't\b/g, 'will not')
    .replace(/[^a-z0-9\s']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!normalized) return 'unknown';
  const declined = new Set([
    'no', 'no please', 'no thanks', 'no thank you', 'nope',
    'not now', 'not yet', 'not okay', 'rather not', 'stop', 'cancel', 'cancel that',
    'nee', 'nee dankie', 'cha', 'hayi', 'aowa', 'nao', 'nao obrigado', 'nao obrigada'
  ]);
  if (declined.has(normalized) ||
      /^(?:please )?(?:do not|will not) (?:connect me|call them|book it|start it|do that)$/.test(normalized)) {
    return 'declined';
  }
  const confirmed = new Set([
    'yes', 'yes please', 'yes go ahead', 'yes please do', 'yes please connect me',
    'yeah', 'yeah please', 'yep', 'okay', 'ok', 'sure', 'please do', 'go ahead',
    'connect me', 'please connect me', 'call them', 'please call them',
    'book it', 'please book it', 'i agree', 'i consent', 'thats fine',
    'yebo', 'yebo please', 'ewe', 'ee', 'ja', 'ja asseblief', 'sim',
    'sim por favor', 'ngiyavuma', 'kulungile', 'ke a dumela', 'kea dumela'
  ]);
  if (confirmed.has(normalized)) return 'confirmed';
  return 'unknown';
}

function finiteNumberOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
