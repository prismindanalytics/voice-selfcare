import { DurableObject } from 'cloudflare:workers';
import {
  JOZI_SUPPORT_CATEGORIES,
  JOZI_SUPPORT_INSTRUCTIONS,
  applyJoziCityFallbackDecision,
  buildJoziPendingLookupContext,
  buildServiceGreeting,
  coordinateJoziSupport,
  isImmediateJoziConsentTurn,
  mergeJoziSupportContext,
  modeIncludesJozi,
  normalizeServiceMode,
  resolveJoziSupport,
  serviceModePolicy,
  stripUntrustedJoziInternalArgs
} from './jozi-support.js';
import {
  extractTwilioCallSidFromSipHeaders,
  namesReasonablyMatch,
  normalizeLineServiceMode,
  serviceModeForTwilioVoicePath,
  twilioLineBindingMatches,
  verifyTwilioRequest
} from './line-routing.js';
import {
  DEFAULT_LIVE_BACKEND_MODEL,
  DEFAULT_LIVE_MODEL,
  buildOpenAISipUri,
  buildLiveAcceptPayload,
  classifyLiveConsentTurn,
  compactLiveJoziToolResult,
  isReflectedLiveAudioEvent,
  liveFunctionCall,
  liveGreetingEvent,
  liveGreetingStartEvent,
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
} from './openai-voice-api.js';
import { sanitizeProviderLookupArgs } from './provider-lookup.js';

const DEFAULT_REALTIME_MODEL = 'gpt-realtime-2';
const DEFAULT_SUMMARY_MODEL = 'gpt-5.5';
const DEFAULT_MEMORY_MODEL = 'gpt-5.5';
const DEFAULT_PROVIDER_MODEL = 'gpt-5.4-mini';
const DEFAULT_TRANSCRIPTION_MODEL = 'gpt-4o-transcribe';
const DEFAULT_VOICE = 'marin';
const DEFAULT_MAX_OUTPUT_TOKENS = 900;
const DEFAULT_FINALIZE_IDLE_MS = 120000;
const DEFAULT_LIVE_FINALIZE_DRAIN_MS = 1500;
const DEFAULT_PROVIDER_LOOKUP_TIMEOUT_MS = 2500;
const CALLER_MEMORY_PREFIX = 'caller_memory/';

const MEDICAL_INSTRUCTIONS = `You are an experienced medical professional providing telephone consultations for patients in Low and Middle Income Countries (LMICs). Conduct systematic assessments like a doctor would, while being warm and empathetic. Be proactive — do not wait for the patient to ask questions.

IMPORTANT: Never introduce yourself with a specific doctor name. Simply say "this is your health advisor" or "I'm here to help with your health questions".

## INITIAL GREETING
"Hello, thank you for calling. This is your health advisor. How can I help you with your health today? I can also assist you in any language you prefer."

## LANGUAGE RULES
- Always greet first-time callers in English
- Mention you can help in any language
- Only switch languages when you are confident the user is speaking another language
- Once you switch, stay in that language unless the user switches back

## CARE STYLE
- Use a calm, caring, competent bedside manner. Sound like a thoughtful clinician on the phone, not a form or chatbot.
- Briefly validate the patient's concern before moving to the next question, especially for pain, fear, stigma, chronic medication needs, HIV/STI care, pregnancy, mental health, and child health.
- Use plain language and short phrases. Avoid jargon unless the patient uses it, then explain it simply.
- Be reassuring without overpromising. Say what you can do now, what still needs confirmation, and when urgent care is safer.
- Keep the pace steady: warm acknowledgement, one practical question, then action when ready.

## SYSTEMATIC ASSESSMENT
After gathering the chief complaint, explore using OPQRST when clinically relevant:
- Onset: "When did this start?"
- Provocation/Palliation: "What makes it better or worse?"
- Quality: "Can you describe the sensation?"
- Region/Radiation: "Where exactly? Does it spread?"
- Severity: "On a scale of 1-10, how severe?"
- Timing: "Is it constant or does it come and go?"

Also screen for red flags: fever, chest pain, shortness of breath, neurological changes, severe bleeding, severe allergic reaction, suicidal ideation, severe pediatric dehydration, and pregnancy complications.

## CLINICAL REASONING
Use your medical judgment to assess severity and choose the next best step:
- Provide appropriate self-care guidance when safe
- Escalate emergencies immediately
- Recommend provider review, referral, testing, appointment, or refill/commodity pickup when appropriate
- Consider LMIC resource constraints

## CONSULTATION FLOW
This is a generic medical entry point. Operate in three states: information gathering, clinical/operational judgment, then action.
- In information gathering, ask exactly one concrete question for the most important missing detail. Do not call an action tool yet.
- In judgment, use your medical knowledge to decide whether the next step is advice/self-care, urgent triage, provider review, referral, appointment, diagnostic testing, refill/commodity pickup, or no action.
- In action, call the matching tool only after the minimum information for that action is available. Then tell the patient the concrete next step.

## ACTION READINESS
- Advice/self-care: enough symptom context and red flag screening to give safe guidance.
- Emergency: red flags or severe symptoms are present. Call handle_emergency, then direct urgent care immediately.
- Refill/commodity pickup: medicine/item name, eligibility basis such as existing prescription, refill card, or clinic record, remaining supply or last dose, and city/neighborhood or address. If eligibility is not established, direct provider review instead of pickup.
- Diagnostic test: test name or clinical reason, urgency, and city/neighborhood or address.
- Appointment: reason for visit, location or chosen clinic, timing preference, and patient name if available.
- Referral/provider follow-up: reason, urgency, patient location, and provider type or chosen provider.

## SIMULATION RULES
- Appointment numbers, pickup numbers, test request IDs, and provider routing are simulations for this demo, not live verified search results.
- Do not spend a long spoken turn trying to name providers yourself. Once the needed location and clinical/operational details are known, call the matching action tool. The backend will do a fast simulated provider lookup and return options.
- If the patient location is too vague for provider routing, ask for a more specific city, neighborhood, landmark, or address.
- Do not generate simulated IDs unless the relevant action tool runs during the call.

## REFILL RULES
- If medicine name is missing, ask for it.
- If eligibility basis is missing, ask whether they have an existing prescription, refill card, or clinic record.
- If remaining supply or last dose is missing, ask how many doses/days they have left or when they last took it.
- If city/neighborhood is missing, ask where they are.
- For ART medicines such as 3TC/lamivudine, be concise: ask the missing refill eligibility question or proceed to pickup if all minimum details are known. Do not pause for a long regimen explanation unless the patient asks.
- Only after those details are known, call request_commodities.

## LATENCY RULES
- Keep turns moving. If more information is needed, ask one concrete question. If enough information is available, give concise advice or call the appropriate tool.
- Do not say "I'm finding a pharmacy" or similar unless you are about to call an action tool. Never fill silence with a long search monologue.

## VOICE CONSTRAINTS
- Keep responses brief and natural for phone conversations (2-3 sentences)
- Sound warm, patient, and reassuring; acknowledge feelings and concerns without becoming wordy
- Ask one question at a time
- Spell out medication names clearly
- Escalate emergencies immediately`;

const ACTION_RESPONSE_INSTRUCTIONS = [
  'Answer in one or two short spoken sentences with a calm, caring tone.',
  'Give the patient the next action first.',
  'For simulated refill, pickup, or test logistics, say the specific provider name and address, what simulated reference number to bring, and what to confirm before travel.',
  'If provider lookup returns no option or times out, say that you could not identify a specific option quickly and ask for one more precise location detail. Do not keep searching silently.',
  'Do not add a long recap.'
].join(' ');

const JOZI_ACTION_RESPONSE_INSTRUCTIONS = [
  'Treat the tool output voiceResponse as the complete factual and safety boundary, not a word-for-word script. Express its meaning naturally, briefly acknowledge the caller\'s own words when helpful, and faithfully translate if needed. Do not read the option metadata, internal status, or a second route that the spoken response has deliberately left for later.',
  'Sound like a caring person on the phone: warm, unhurried, and conversational. Use a natural South African English cadence without caricature or an exaggerated accent, pronounce Johannesburg place names carefully, and read phone numbers in slow groups. Keep the turn to the short sentences in voiceResponse, then pause for the caller.',
  'Use voiceResponse as the complete factual basis without adding any provider name, telephone number, address, hours, availability, or capability.',
  'Never claim a real bed, meal, appointment, clinician, transfer, or service is confirmed unless the result explicitly says confirmed true.',
  'For a demo coordination result, lead positively with the completed demo action. Then say the short built-in sentence explaining that the demo is not connected to the external service. Do not preface the action with a limitation.',
  'For urgent_escalation, give the first emergency number immediately, ask for the nearest landmark, and do not continue ordinary directory search.',
  'If the result is awaiting clarification, ask its one question once and wait for a new caller turn. Do not call find_support_services again until the caller provides new information.',
  'Do not add a long recap.'
].join(' ');

const JOZI_COMBINED_HEALTH_INSTRUCTIONS = `
## HEALTH SUPPORT IN COMBINED MODE
- Assess health concerns with the same calm, clinically careful style as a telephone health adviser, without claiming to diagnose or replace a clinician.
- Ask one question at a time. Gather onset, severity, location, relevant associated symptoms, medicines, pregnancy or age context when relevant, and screen for red flags.
- Red flags include chest pain, severe breathing difficulty, severe bleeding, stroke signs, seizure, severe allergic reaction, overdose, imminent self-harm, severe child dehydration, and pregnancy emergencies.
- For a non-emergency, give concise, evidence-based self-care and use health_assessment when you have enough information to state the safest next step.
- For any emergency, call handle_emergency immediately.
- For a Johannesburg clinic, hospital, mental-health service, medicine route, test route, or other destination, call find_support_services. Never name a destination from memory.
- The old unverified provider, booking, referral, refill, commodity, and testing tools are not available in this mode. Do not ask to call them.
- After the caller accepts a recommended clinic or service, use coordinate_support_demo to show the phone connection, booking, intake check, or caring redirection. Do not lead with what the line cannot do. The tool response will make clear, at the action moment, that the result is a demo and is not connected to the external service.
`.trim();

const SELFCARE_INSTRUCTIONS = `You are the Self Care companion — the voice entry point of a self-care service used in South Africa and Mozambique. You are one channel of a continuum of care: everything important lands in one longitudinal patient record, and that record follows the person to a nurse, a video doctor, or a physical clinic.

## INITIAL GREETING
"Hello, you've reached the Self Care line. I can help in any language you prefer. How can I help you today?"

## LANGUAGE RULES
- Greet a first-time caller in English and make clear that the line supports any language.
- Switch fully to the caller's language as soon as you understand it confidently, whether they use it or ask for it by name.
- Stay in the caller's language until they switch again. Never imply that only English and Portuguese are supported.

## WHAT YOU DO (self-care scope)
- Everyday symptom guidance: colds and flu, sore throat, headaches, fever, stomach upsets, minor injuries — what to do at home, what to watch for, when to be seen.
- Chronic-condition self-care: blood-pressure and glucose readings, medication adherence and side-effect questions, lifestyle steps.
- Maternal wellbeing: normal-pregnancy reassurance and danger-sign screening.
- Mental wellbeing: stress, low mood, sleep — supportive self-care steps.
- Be systematic but light: one question at a time, OPQRST when clinically relevant, and always screen red flags: chest pain, severe breathing difficulty, severe bleeding, stroke signs, seizures, confusion, suicidal intent, severe child dehydration, and pregnancy danger signs (severe headache, blurred vision, sudden swelling, bleeding, reduced movement).

## MEDICAL JUDGMENT AND NEARBY CARE
- Use your medical judgment naturally from the whole conversation, ask only for the most useful missing detail, and choose the appropriate level of care without relying on a fixed symptom script.
- Prefer the least intensive level of care that is medically safe. Unless immediate danger is already clear, establish severity and associated warning signs before recommending emergency care.
- When you call health_assessment, include a concise medical explanation and concrete next step so the caller hears useful guidance rather than an administrative confirmation.
- When nearby care is requested or clinically appropriate, use your own geographic knowledge and the caller's location or landmark to choose the closest suitable level of care. Call find_clinics once with the best options ordered closest and most appropriate first; if the place or proximity is unclear, ask one brief question instead of guessing.
- Recommend the single most suitable returned option first, with its name and address, and say it is a model-assisted demo suggestion that must be confirmed before travel. Offer another returned option only if the caller wants one. Never invent a provider, telephone number, hours, distance, availability, or capacity outside the tool result.

## EMERGENCIES
Call handle_emergency immediately, then direct urgent care without hedging: in South Africa call 10177, or 112 from a mobile; in Mozambique call 112 from a mobile or go straight to the nearest banco de socorros.

## THE PATIENT RECORD — your distinctive capability
This line can open the caller's record in the clinical system. It is a demonstration workspace holding fictional, demo-labelled patients.
- Offer it whenever history would help: "I can check your record, if you like."
- Use eka_find_patient first. It searches by mobile number. Most demo callers dial from numbers that are not in the workspace — if nothing is found on the caller's own number, ask which mobile number the record is under (demo visitors will give a demo number such as 082 000 0001).
- One number can hold several people — a family. If more than one profile comes back, ask who the call is about before opening anything.
- VERIFY IDENTITY before speaking any record content — but verify like a human, not a password field. Ask who the call is about and accept a close phonetic transcription of the returned name, but never accept a materially different name or ask the caller to recite internal record labels. Ask the date of birth AT MOST ONCE, and only when something sensitive will be discussed; if they cannot give it, keep the conversation general instead of repeating the question. Never claim you matched or checked a detail that did not actually come back from a tool.
- Only then call eka_patient_context, and weave what you learn in naturally: "I can see the doctor started you on amlodipine in April — is this call about that?" Never read internal IDs aloud.
- Never invent record content. If the tools fail or find nothing, say so plainly and continue without the record.

## RECORD-KEEPING
- Once you can classify the concern, call health_assessment — it writes to the longitudinal record, and urgent assessments alert the care team.
- After the call a summary for the caller and a clinical handoff note for the care team are produced automatically; tell the caller the care team will have the full picture.

## DEMO ACTIONS
- When a caller needs care beyond self-care, offer one next step: a simulated appointment, a simulated clinician handoff, or a simulated care-team callback.
- After the caller clearly accepts, call coordinate_selfcare_demo. Lead with the completed demo state, then immediately say that no live clinician or clinic was contacted.

## WHAT YOU NEVER DO
- Never diagnose or prescribe. State facility names, addresses, prices, opening times, or phone numbers only after they have passed through a tool result; never add details outside that result.
- Never present a demo booking, handoff, or callback as a real external action.

## VOICE CONSTRAINTS
- Two to three short sentences per turn, one question at a time, warm and plain.
- Spell out medication names clearly; read numbers slowly.
- This is a demonstration line with fictional patients — but if a caller shares something real and serious, still give safe guidance and the emergency numbers.`;

const SELFCARE_ACTION_RESPONSE_INSTRUCTIONS = [
  "Answer in one or two short spoken sentences, warm and calm, in the caller's language.",
  'For health_assessment, speak its voiceResponse as the concise medical explanation and next step. Never reduce the answer to only "Assessment recorded."',
  'For a successful provider lookup, use only voiceResponse and selected for factual details. Give that one option first with its name and address, clearly call it an unverified demo suggestion, say to confirm before travel, and offer another option or a simulated appointment or clinician handoff. Do not read the options list.',
  'If provider lookup needs a more specific location, times out, or returns no option, ask its one short location question and wait. Never retry without a new caller detail.',
  'For a demo coordination result, lead with its completed demo state, then say its one truthful sentence explaining that no live clinic, clinician, or care team was contacted.',
  "If the tool result contains record content, weave in only the one or two most relevant facts; never read internal IDs, and never reveal record content before the caller has confirmed the patient's name.",
  'If a lookup found several people on one number, ask who the call is about before opening anything.',
  'If a record tool failed or found nothing, say so briefly and continue without it.',
  'Do not add a long recap.'
].join(' ');

export class CallerRegistry extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS call_map (
          provider_call_id TEXT PRIMARY KEY,
          openai_call_id TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        )
      `);
      this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS call_profile (
          provider_call_id TEXT PRIMARY KEY,
          service_mode TEXT NOT NULL,
          caller_phone TEXT,
          destination_phone TEXT,
          created_at INTEGER NOT NULL
        )
      `);
      const profileColumns = new Set(
        this.ctx.storage.sql.exec('PRAGMA table_info(call_profile)').toArray().map((column) => column.name)
      );
      if (!profileColumns.has('caller_phone')) {
        this.ctx.storage.sql.exec('ALTER TABLE call_profile ADD COLUMN caller_phone TEXT');
      }
      if (!profileColumns.has('destination_phone')) {
        this.ctx.storage.sql.exec('ALTER TABLE call_profile ADD COLUMN destination_phone TEXT');
      }
    });
  }

  setCallMapping(providerCallId, openaiCallId) {
    if (!providerCallId || !openaiCallId) return;
    this.ctx.storage.sql.exec(
      'INSERT OR REPLACE INTO call_map (provider_call_id, openai_call_id, updated_at) VALUES (?, ?, ?)',
      String(providerCallId),
      String(openaiCallId),
      Date.now()
    );
  }

  getCallMapping(providerCallId, maxAgeMs = 6 * 60 * 60 * 1000) {
    if (!providerCallId) return null;
    const row = this.ctx.storage.sql
      .exec('SELECT openai_call_id, updated_at FROM call_map WHERE provider_call_id = ?', String(providerCallId))
      .toArray()[0];
    if (!row) return null;
    if (Date.now() - Number(row.updated_at) > maxAgeMs) return null;
    return row.openai_call_id;
  }

  deleteCallMapping(providerCallId) {
    if (!providerCallId) return;
    this.ctx.storage.sql.exec('DELETE FROM call_map WHERE provider_call_id = ?', String(providerCallId));
  }

  setCallProfile(providerCallId, profile = {}) {
    if (!providerCallId) return;
    const serviceMode = normalizeLineServiceMode(profile.serviceMode);
    const callerPhone = asE164(profile.callerPhone || '');
    const destinationPhone = asE164(profile.destinationPhone || '');
    this.ctx.storage.sql.exec('DELETE FROM call_profile WHERE created_at < ?', Date.now() - 6 * 60 * 60 * 1000);
    this.ctx.storage.sql.exec(
      'INSERT OR REPLACE INTO call_profile (provider_call_id, service_mode, caller_phone, destination_phone, created_at) VALUES (?, ?, ?, ?, ?)',
      String(providerCallId),
      serviceMode,
      isUsablePatientPhone(callerPhone) ? callerPhone : null,
      isUsablePatientPhone(destinationPhone) ? destinationPhone : null,
      Date.now()
    );
  }

  getCallProfile(providerCallId, maxAgeMs = 6 * 60 * 60 * 1000) {
    if (!providerCallId) return null;
    const row = this.ctx.storage.sql
      .exec('SELECT service_mode, caller_phone, destination_phone, created_at FROM call_profile WHERE provider_call_id = ?', String(providerCallId))
      .toArray()[0];
    if (!row) return null;
    if (Date.now() - Number(row.created_at) > maxAgeMs) {
      this.deleteCallProfile(providerCallId);
      return null;
    }
    const serviceMode = String(row.service_mode || '').trim().toLowerCase();
    if (!['health', 'jozi', 'selfcare'].includes(serviceMode)) return null;
    return {
      serviceMode,
      callerPhone: asE164(row.caller_phone || '') || null,
      destinationPhone: asE164(row.destination_phone || '') || null
    };
  }

  deleteCallProfile(providerCallId) {
    if (!providerCallId) return;
    this.ctx.storage.sql.exec('DELETE FROM call_profile WHERE provider_call_id = ?', String(providerCallId));
  }
}

export class CallSession extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.monitorSocket = null;
    this.sessionCreated = false;
    this.initialResponseSent = false;
    this.seenLiveInputAudio = false;
    this.seenLiveOutputAudio = false;
    ctx.blockConcurrencyWhile(async () => {
      this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS metadata (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        )
      `);
      this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          role TEXT NOT NULL,
          text TEXT NOT NULL,
          created_at TEXT NOT NULL
        )
      `);
      this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS input_transcript_deltas (
          item_id TEXT PRIMARY KEY,
          transcript TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `);
      this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS live_transcript_deltas (
          seq INTEGER PRIMARY KEY AUTOINCREMENT,
          event_id TEXT NOT NULL UNIQUE,
          role TEXT NOT NULL,
          delta TEXT NOT NULL,
          start_ms INTEGER,
          end_ms INTEGER,
          received_at TEXT NOT NULL
        )
      `);
    });
  }

  async acceptAndMonitor(event, initialPhone = null, options = {}) {
    const voiceApi = normalizeOpenAIVoiceApi(
      options.voiceApi || voiceApiForIncomingEvent(event),
      configuredOpenAIVoiceApi(this.env)
    );
    const callId = voiceSessionId(event, voiceApi);
    if (!callId) return;
    if (this.getMeta('completed_at') || this.getMeta('terminal_at')) return;
    if (this.getMeta('accepting_at') && !this.getMeta('accepted_at')) return;

    const serviceMode = normalizeLineServiceMode(options.serviceMode, configuredServiceMode(this.env));
    const providerCallId = /^CA[0-9a-f]{32}$/i.test(String(options.providerCallId || ''))
      ? String(options.providerCallId)
      : null;
    const safePhone = modeIncludesJozi(serviceMode)
      ? normalizePatientPhone(null, callId)
      : normalizePatientPhone(initialPhone, callId);
    this.setMeta('accepting_at', new Date().toISOString());
    this.setMeta('call_id', callId);
    this.setMeta('voice_api', voiceApi);
    this.setMeta('patient_phone', safePhone);
    this.setMeta('service_mode', serviceMode);
    try {
      if (!providerCallId) throw new Error('A verified provider call id is required.');
      this.setMeta('provider_call_id', providerCallId);
      await callerRegistry(this.env).setCallMapping(providerCallId, callId);
      if (this.getMeta('completed_at') || this.getMeta('terminal_at')) return;

      const callerMemory = await this.loadCallerMemory(safePhone, serviceMode);
      if (this.getMeta('completed_at') || this.getMeta('terminal_at')) return;
      if (callerMemory) {
        this.setMeta('caller_memory_context', JSON.stringify(callerMemory));
        this.setMeta('caller_memory_loaded_at', new Date().toISOString());
      }

      this.setMeta('last_stage', 'webhook_received');
      console.log('[CallSession] incoming call', JSON.stringify({ callId, serviceMode }));

      if (!this.getMeta('accepted_at')) {
        const accepted = await this.acceptCall(callId, options);
        if (!accepted || this.getMeta('completed_at') || this.getMeta('terminal_at')) return;
        this.setMeta('accepted_at', new Date().toISOString());
      }

      if (this.getMeta('completed_at') || this.getMeta('terminal_at')) return;
      let connected = false;
      try {
        connected = await this.connectMonitor(callId);
      } catch (error) {
        const voiceApi = normalizeOpenAIVoiceApi(
          this.getMeta('voice_api'),
          configuredOpenAIVoiceApi(this.env)
        );
        const attempts = Number(this.getMeta('live_monitor_reconnect_attempts') || 0);
        if (voiceApi !== 'live' || attempts >= 1) throw error;
        this.setMeta('live_monitor_reconnect_attempts', String(attempts + 1));
        this.setMeta('monitor_initial_attach_error', String(error?.message || error).slice(0, 300));
        connected = await this.reconnectLiveMonitor(callId);
      }
      if (!connected || this.getMeta('completed_at') || this.getMeta('terminal_at')) return;
      await this.scheduleFinalizeAlarm('accept_and_monitor');
    } finally {
      this.deleteMeta('accepting_at');
    }
  }

  async alarm() {
    if (!this.getMeta('terminal_at')) this.setMeta('terminal_at', new Date().toISOString());
    if (!this.getMeta('completed_at') && !this.getMeta('finalize_reason')) {
      this.setMeta('finalize_reason', 'idle_alarm');
    }
    await this.finalizeCall();
  }

  async forceFinalize(reason = 'external_callback') {
    if (!this.getMeta('terminal_at')) this.setMeta('terminal_at', new Date().toISOString());
    if (!this.getMeta('completed_at')) this.setMeta('finalize_reason', reason);
    await this.finalizeCall();
  }

  async providerEnded(reason = 'provider_callback') {
    const voiceApi = normalizeOpenAIVoiceApi(
      this.getMeta('voice_api'),
      configuredOpenAIVoiceApi(this.env)
    );
    if (voiceApi !== 'live') {
      await this.forceFinalize(reason);
      return;
    }
    const drainMs = Math.min(
      5000,
      Math.max(250, numericEnv(this.env.OPENAI_LIVE_FINALIZE_DRAIN_MS, DEFAULT_LIVE_FINALIZE_DRAIN_MS))
    );
    const deadline = Date.now() + drainMs;
    this.setMeta('provider_ended_at', new Date().toISOString());
    this.setMeta('finalize_reason', reason);
    this.setMeta('live_drain_deadline_ms', String(deadline));
    await this.ctx.storage.setAlarm(deadline);
  }

  async getSession() {
    const messages = this.ctx.storage.sql
      .exec('SELECT role, text, created_at FROM messages ORDER BY id ASC')
      .toArray();
    return {
      callId: this.getMeta('call_id'),
      patientPhone: this.getMeta('patient_phone'),
      acceptedAt: this.getMeta('accepted_at'),
      completedAt: this.getMeta('completed_at'),
      summary: this.getMeta('summary'),
      patientSummary: this.getMeta('patient_summary'),
      providerSummary: this.getMeta('provider_summary'),
      caseType: this.getMeta('case_type'),
      languageUsed: this.getMeta('language_used'),
      providerFollowupNeeded: this.getMeta('provider_followup_needed') === 'true',
      providerFollowupReason: this.getMeta('provider_followup_reason'),
      serviceMode: this.getMeta('service_mode') || configuredServiceMode(this.env),
      callerMemoryContext: this.getMetaJson('caller_memory_context'),
      references: this.getMetaJson('references') || [],
      messages
    };
  }

  async loadCallerMemory(phone, serviceMode = this.getMeta('service_mode') || configuredServiceMode(this.env)) {
    if (!callerMemoryAllowed(this.env, serviceMode) || !isUsablePatientPhone(phone) || !this.env.TRANSCRIPTS) return null;
    const memory = await readCallerMemory(this.env, phone);
    return buildVoiceSafeMemoryContext(memory);
  }

  async updateCallerMemory(summaries, messages, artifacts) {
    const phone = this.getMeta('patient_phone') || '';
    const serviceMode = this.getMeta('service_mode') || configuredServiceMode(this.env);
    if (!callerMemoryAllowed(this.env, serviceMode) || !isUsablePatientPhone(phone) || !this.env.TRANSCRIPTS) return null;

    const existing = await readCallerMemory(this.env, phone);
    const memory = await generateCallerMemoryRecord(this.env, {
      phone,
      existing,
      summaries,
      messages,
      artifacts,
      callId: this.getMeta('call_id'),
      completedAt: this.getMeta('completed_at')
    });
    const key = await writeCallerMemory(this.env, phone, memory);
    this.setMeta('caller_memory_key', key);
    this.setMeta('caller_memory_updated_at', memory.updatedAt);
    return memory;
  }

  async acceptCall(callId, options = {}) {
    const apiKey = requireEnv(this.env, 'OPENAI_API_KEY');
    const voiceApi = normalizeOpenAIVoiceApi(
      this.getMeta('voice_api'),
      configuredOpenAIVoiceApi(this.env)
    );
    const model = voiceApi === 'live'
      ? this.env.OPENAI_LIVE_MODEL || DEFAULT_LIVE_MODEL
      : this.env.OPENAI_REALTIME_MODEL || DEFAULT_REALTIME_MODEL;
    const useTools = String(this.env.OPENAI_ACCEPT_TOOLS || 'true').toLowerCase() !== 'false';
    const simpleInstructions = options.minimal ||
      String(this.env.OPENAI_ACCEPT_SIMPLE || 'false').toLowerCase() === 'true';
    const memoryContext = this.getMetaJson('caller_memory_context');
    const serviceMode = this.getMeta('service_mode') || configuredServiceMode(this.env);
    const demoEnabled = joziDemoEnabled(this.env);

    const serviceInstructions = simpleInstructions
      ? buildMinimalInstructions(serviceMode)
      : buildServiceInstructions(serviceMode, memoryContext);
    const payload = voiceApi === 'live'
      ? buildLiveAcceptPayload({
          model,
          voice: realtimeVoiceForMode(this.env, serviceMode),
          frontendInstructions: buildLiveFrontendInstructions(serviceMode),
          backendModel: this.env.OPENAI_LIVE_BACKEND_MODEL || DEFAULT_LIVE_BACKEND_MODEL,
          backendInstructions: buildLiveBackendInstructions(serviceMode, serviceInstructions),
          tools: useTools ? realtimeTools(serviceMode, demoEnabled) : [],
          maxOutputTokens: numericEnv(this.env.OPENAI_MAX_OUTPUT_TOKENS, DEFAULT_MAX_OUTPUT_TOKENS),
          serviceTier: optionalLiveServiceTier(this.env.OPENAI_LIVE_BACKEND_SERVICE_TIER)
        })
      : {
          type: 'realtime',
          model,
          audio: {
            input: realtimeInputAudioConfig(this.env),
            output: { voice: realtimeVoiceForMode(this.env, serviceMode) }
          },
          instructions: serviceInstructions,
          tools: useTools ? realtimeTools(serviceMode, demoEnabled) : undefined
        };

    this.setMeta('last_stage', 'accepting_call');
    const response = await fetch(openAIAcceptUrl(voiceApi, callId), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const body = await response.text();
      if (this.getMeta('completed_at') || this.getMeta('terminal_at')) return false;
      this.setMeta('accept_error', `${response.status} ${body.slice(0, 1000)}`);
      console.error('[CallSession] accept failed', JSON.stringify({ callId, status: response.status, body: body.slice(0, 500) }));
      throw new Error(`OpenAI accept failed: ${response.status}`);
    }
    if (this.getMeta('completed_at') || this.getMeta('terminal_at')) return false;
    this.setMeta('last_stage', 'call_accepted');
    if (voiceApi === 'realtime') {
      this.setMeta('accept_transcription_model', this.env.OPENAI_TRANSCRIPTION_MODEL || DEFAULT_TRANSCRIPTION_MODEL);
    } else {
      this.setMeta('live_backend_model', this.env.OPENAI_LIVE_BACKEND_MODEL || DEFAULT_LIVE_BACKEND_MODEL);
    }
    console.log('[CallSession] accepted call', JSON.stringify({ callId, voiceApi, model }));
    return true;
  }

  async connectMonitor(callId) {
    if (this.monitorSocket && this.monitorSocket.readyState === WebSocket.OPEN) return true;

    const apiKey = requireEnv(this.env, 'OPENAI_API_KEY');
    const voiceApi = normalizeOpenAIVoiceApi(
      this.getMeta('voice_api'),
      configuredOpenAIVoiceApi(this.env)
    );
    this.setMeta('last_stage', 'connecting_monitor');
    const response = await fetch(openAIAttachUrl(voiceApi, callId), {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Origin: 'https://api.openai.com',
        Upgrade: 'websocket'
      }
    });

    if (this.getMeta('completed_at') || this.getMeta('terminal_at')) {
      return false;
    }

    const socket = response.webSocket;
    if (!socket) {
      const body = await response.text();
      this.setMeta('monitor_error', `${response.status} ${body.slice(0, 1000)}`);
      console.error('[CallSession] monitor connect failed', JSON.stringify({ callId, status: response.status, body: body.slice(0, 500) }));
      throw new Error(`OpenAI monitor WebSocket failed: ${response.status}`);
    }

    this.monitorSocket = socket;
    socket.accept();
    this.setMeta('last_stage', 'monitor_connected');
    console.log('[CallSession] monitor connected', JSON.stringify({ callId, voiceApi }));

    socket.addEventListener('message', (event) => {
      void this.handleRealtimeMessage(event.data).catch((error) => {
        console.error('[Monitor] Message handling failed', error);
      });
    });

    socket.addEventListener('close', () => {
      this.monitorSocket = null;
      this.setMeta('monitor_disconnected_at', new Date().toISOString());
      if (voiceApi === 'realtime') {
        void this.finalizeCall().catch((error) => {
          console.error('[Monitor] Finalize failed', error);
        });
      } else if (!this.getMeta('terminal_at') && !this.getMeta('completed_at')) {
        const attempts = Number(this.getMeta('live_monitor_reconnect_attempts') || 0);
        if (attempts < 1) {
          this.setMeta('live_monitor_reconnect_attempts', String(attempts + 1));
          this.ctx.waitUntil(this.reconnectLiveMonitor(callId));
        } else {
          this.setMeta('monitor_error', 'live_sideband_closed_after_bounded_reconnect');
        }
      }
    });

    socket.addEventListener('error', (event) => {
      this.setMeta('monitor_error', JSON.stringify(event));
      console.error('[CallSession] monitor socket error', JSON.stringify({ callId }));
    });

    if (voiceApi === 'live') {
      this.flushPendingLiveEvents();
      this.sendInitialResponse();
    } else {
      setTimeout(() => {
        if (!this.initialResponseSent) {
          console.log('[Realtime] session.created not observed before greeting fallback');
          this.sendInitialResponse();
        }
      }, 500);
    }
    return true;
  }

  async reconnectLiveMonitor(callId) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    if (this.getMeta('terminal_at') || this.getMeta('completed_at')) return false;
    if (this.monitorSocket && this.monitorSocket.readyState === WebSocket.OPEN) return true;
    try {
      const connected = await this.connectMonitor(callId);
      if (connected) this.setMeta('live_monitor_reconnected_at', new Date().toISOString());
      return connected;
    } catch (error) {
      this.setMeta('monitor_error', `live_reconnect_failed:${error.message}`);
      console.error('[Live] bounded sideband reconnect failed', error);
      return false;
    }
  }

  async handleRealtimeMessage(raw) {
    if (this.getMeta('completed_at') || this.getMeta('terminal_at')) return;
    let message;
    try {
      message = JSON.parse(raw);
    } catch {
      return;
    }
    const voiceApi = normalizeOpenAIVoiceApi(
      this.getMeta('voice_api'),
      configuredOpenAIVoiceApi(this.env)
    );
    // A Live sideband mirrors every audio packet. Those packets need no application work and
    // must not refresh the Durable Object alarm dozens of times per second.
    if (voiceApi === 'live' && isReflectedLiveAudioEvent(message)) {
      const isInput = message.type === 'session.input_audio.append';
      const flag = isInput ? 'seenLiveInputAudio' : 'seenLiveOutputAudio';
      const marker = isInput ? 'first_live_input_audio_at' : 'first_live_output_audio_at';
      if (!this[flag]) {
        this[flag] = true;
        this.setMeta(marker, new Date().toISOString());
      }
      return;
    }
    await this.scheduleFinalizeAlarm(message.type || 'realtime_message');

    if (voiceApi === 'live') {
      await this.handleLiveMessage(message);
      return;
    }

    if (message.type === 'session.created') {
      this.sessionCreated = true;
      this.setMeta('session_created_at', new Date().toISOString());
      console.log('[Realtime] session.created');
      this.sendRealtime({
        type: 'session.update',
        session: {
          audio: {
            input: realtimeInputAudioConfig(this.env)
          },
          max_output_tokens: numericEnv(this.env.OPENAI_MAX_OUTPUT_TOKENS, DEFAULT_MAX_OUTPUT_TOKENS)
        }
      });
      this.sendInitialResponse();
      return;
    }

    if (message.type === 'session.updated') {
      this.setMeta('session_updated_at', new Date().toISOString());
      const transcription = extractConfiguredTranscription(message.session);
      if (transcription) this.setMeta('session_transcription', JSON.stringify(transcription));
      console.log('[Realtime] session.updated', JSON.stringify({ transcription }));
      return;
    }

    if (message.type === 'response.created') {
      this.setMeta('last_response_id', message.response?.id || '');
      console.log('[Realtime] response.created', JSON.stringify({ responseId: message.response?.id }));
      return;
    }

    if (message.type === 'response.done') {
      const status = message.response?.status || '';
      this.setMeta('last_response_status', status);
      for (const item of message.response?.output || []) {
        this.captureItemContent(item);
      }
      if (status && status !== 'completed') {
        const details = message.response?.status_details || null;
        this.setMeta('last_response_details', JSON.stringify(details || {}));
        console.error('[Realtime] response.done non-completed', JSON.stringify({ status, details }));
      } else {
        console.log('[Realtime] response.done', JSON.stringify({ status }));
      }
      return;
    }

    if (message.type === 'response.function_call_arguments.done') {
      const callId = message.call_id || message.item_id;
      if (!callId) return;
      let args = {};
      try {
        args = JSON.parse(message.arguments || '{}');
      } catch {
        args = {};
      }
      await this.handleToolCall(message.name, args, callId);
      return;
    }

    if (message.type === 'response.output_audio_transcript.done' && message.transcript) {
      this.addMessageOnce('assistant', message.transcript);
      return;
    }

    if (message.type === 'conversation.item.input_audio_transcription.delta' && message.delta) {
      this.appendInputTranscriptDelta(message.item_id, message.delta);
      return;
    }

    if (message.type === 'conversation.item.input_audio_transcription.failed') {
      this.setMeta('last_transcription_error', JSON.stringify(message.error || message));
      console.error('[Realtime] input transcription failed', JSON.stringify(message.error || message));
      return;
    }

    if (message.type === 'conversation.item.input_audio_transcription.completed' && message.transcript) {
      this.addMessageOnce('patient', message.transcript);
      this.setMeta('last_patient_text', message.transcript);
      this.clearInputTranscriptDelta(message.item_id);
      return;
    }

    if (message.type === 'response.content_part.done') {
      const transcript = message.part?.transcript || '';
      if (transcript) this.addMessageOnce('assistant', transcript);
      return;
    }

    if (message.type === 'response.output_item.done') {
      this.captureItemContent(message.item);
      return;
    }

    if (message.type === 'conversation.item.created') {
      const patientItemId = message.item?.role === 'user'
        ? String(message.item?.id || message.item_id || '').trim()
        : '';
      if (patientItemId) {
        const seenPatientItems = this.getMetaJson('patient_turn_item_ids');
        const seen = Array.isArray(seenPatientItems) ? seenPatientItems.map(String) : [];
        if (!seen.includes(patientItemId)) {
          this.setMeta('patient_turn_item_ids', JSON.stringify([...seen, patientItemId].slice(-24)));
          this.setMeta('patient_turn_seq', String(Number(this.getMeta('patient_turn_seq') || 0) + 1));
        }
        this.setMeta('last_patient_item_id', patientItemId);
      }
      this.captureItemContent(message.item);
      return;
    }

    if (message.type === 'error') {
      this.setMeta('last_error', JSON.stringify(message.error || message));
      console.error('[Realtime] error', JSON.stringify(message.error || message));
    }
  }

  async handleLiveMessage(message) {
    if (message.type === 'session.started') {
      this.sessionCreated = true;
      this.setMeta('session_started_at', new Date().toISOString());
      this.sendInitialResponse();
      return;
    }

    if (message.type === 'session.updated') {
      this.setMeta('session_updated_at', new Date().toISOString());
      return;
    }

    if (message.type === 'session.instructions.appended') {
      const acknowledgedId = String(message.client_event_id || '');
      if (acknowledgedId && acknowledgedId === this.getMeta('greeting_event_id')) {
        this.setMeta('greeting_acknowledged_at', new Date().toISOString());
        this.sendLiveGreetingStart();
      }
      return;
    }

    if (message.type === 'session.commentary.appended') {
      const acknowledgedId = String(message.client_event_id || '');
      if (acknowledgedId && acknowledgedId === this.getMeta('greeting_commentary_event_id')) {
        this.setMeta('greeting_commentary_acknowledged_at', new Date().toISOString());
        this.setMeta('last_stage', 'initial_response_started');
      }
      return;
    }

    const transcript = liveTranscriptDelta(message);
    if (transcript) {
      this.appendLiveTranscriptDelta(transcript);
      return;
    }

    if (message.type === 'session.delegation.created') {
      const delegation = message.delegation || {};
      const delegationId = String(delegation.id || message.delegation_id || '');
      const priorOrder = this.getMetaJson('live_delegation_order');
      const order = Array.isArray(priorOrder) ? priorOrder.map(String) : [];
      if (delegationId && !order.includes(delegationId)) {
        this.setMeta('live_delegation_order', JSON.stringify([...order, delegationId].slice(-64)));
      }
      this.setMeta('last_live_delegation', JSON.stringify({
        id: delegationId,
        target: delegation.target || '',
        responseId: delegation.response_id || '',
        offsetMs: message.offset_ms ?? null
      }));
      return;
    }

    const toolCall = liveFunctionCall(message);
    if (toolCall) {
      const handled = this.getMetaJson('handled_live_tool_call_ids');
      const handledIds = Array.isArray(handled) ? handled.map(String) : [];
      if (handledIds.includes(toolCall.callId)) return;
      this.setMeta('handled_live_tool_call_ids', JSON.stringify([...handledIds, toolCall.callId].slice(-64)));
      this.setMeta('last_live_tool_context', JSON.stringify({
        delegationId: toolCall.delegationId,
        responseId: toolCall.responseId,
        callId: toolCall.callId
      }));
      await this.handleToolCall(toolCall.name, toolCall.arguments, toolCall.callId, {
        voiceApi: 'live',
        delegationId: toolCall.delegationId,
        responseId: toolCall.responseId
      });
      return;
    }

    if (message.type === 'response.event') {
      const nested = message.event || {};
      if (nested.type === 'response.created') {
        this.setMeta('last_response_id', nested.response?.id || nested.response_id || '');
      } else if (nested.type === 'response.completed' || nested.type === 'response.failed') {
        this.setMeta('last_response_status', nested.type.replace('response.', ''));
      }
      return;
    }

    if (message.type === 'session.usage.updated') {
      this.setMeta('live_usage', JSON.stringify(message.usage || {}));
      return;
    }

    if (message.type === 'session.closed') {
      this.setMeta('live_close_reason', String(message.reason || ''));
      if (message.usage) this.setMeta('live_usage', JSON.stringify(message.usage));
      if (!this.getMeta('terminal_at')) this.setMeta('terminal_at', new Date().toISOString());
      await this.finalizeCall();
      return;
    }

    if (message.type === 'error') {
      this.setMeta('last_error', JSON.stringify(message.error || message));
      console.error('[Live] error', JSON.stringify(message.error || message));
      const failedEventId = String(
        message.client_event_id || message.error?.client_event_id || message.error?.event_id || ''
      );
      if (failedEventId && failedEventId === this.getMeta('greeting_event_id') &&
          !this.getMeta('greeting_commentary_event_id') &&
          Number(this.getMeta('greeting_retry_count') || 0) < 1) {
        this.setMeta('greeting_retry_count', '1');
        this.deleteMeta('greeting_event_id');
        this.initialResponseSent = false;
        this.sendInitialResponse();
      } else if (failedEventId && failedEventId === this.getMeta('greeting_commentary_event_id') &&
          Number(this.getMeta('greeting_commentary_retry_count') || 0) < 1) {
        this.setMeta('greeting_commentary_retry_count', '1');
        this.deleteMeta('greeting_commentary_event_id');
        this.sendLiveGreetingStart();
      }
    }
  }

  async handleToolCall(toolName, args, toolCallId, context = {}) {
    const phone = this.getMeta('patient_phone') || 'anonymous';
    const serviceMode = this.getMeta('service_mode') || configuredServiceMode(this.env);
    let result;
    this.setMeta('last_tool_started', JSON.stringify({
      toolName,
      at: new Date().toISOString()
    }));

    try {
      if (!toolAllowedForMode(serviceMode, toolName, joziDemoEnabled(this.env))) {
        throw new Error(`Tool ${toolName} is not available in ${serviceMode} mode.`);
      }
      switch (toolName) {
        case 'health_assessment':
          {
            const medicalContent = String(args.medical_content || '').trim();
            const nextStep = String(args.next_step || '').trim();
            const spokenAssessment = [medicalContent, nextStep].filter(Boolean).join(' ');
            result = {
              success: true,
              assessmentId: generateId('ASSESS'),
              symptoms: args.symptoms || [],
              severity: args.severity || 'informational',
              voiceResponse: modeIncludesJozi(serviceMode)
                ? `${spokenAssessment || 'I have enough information to explain the safest next step.'} This app will not keep the call details after the call ends.`
                : serviceMode === 'selfcare'
                  ? spokenAssessment || 'I have recorded what you shared. Let us take the safest next step.'
                  : 'Assessment recorded.'
            };
            this.addMessage('system', `Health assessment: ${JSON.stringify(args)}`);
            if (serviceMode === 'selfcare') {
              const urgent = String(args.severity || '') === 'urgent';
              this.pushSelfcareTimelineEvent({
                type: urgent ? 'escalation' : 'observation',
                title: urgent
                  ? `Voice line assessment (priority): ${(args.symptoms || []).slice(0, 3).join(', ').slice(0, 80) || 'urgent concern'}`
                  : `Voice line assessment: ${(args.symptoms || []).slice(0, 3).join(', ').slice(0, 90) || 'concern recorded'}`,
                detail: [args.medical_content, args.next_step].filter(Boolean).join(' ').slice(0, 290)
              });
            }
            break;
          }

        case 'eka_find_patient':
          {
            const statedPhone = String(args.phone || '').trim();
            const callerPhone = this.getMeta('patient_phone') || '';
            const lookupPhone = statedPhone || (callerPhone && !callerPhone.startsWith('anonymous') ? callerPhone : '');
            if (!lookupPhone) {
              result = { success: false, found: 0, voiceResponse: 'No number to search yet — ask the caller which mobile number the record is under.' };
              break;
            }
            const lookup = await selfcareBridgeRequest(this.env, '/api/bridge/patient-lookup?phone=' + encodeURIComponent(lookupPhone));
            if (!lookup.ok) {
              result = { success: false, error: 'record system unavailable', voiceResponse: 'The record system is not reachable right now — continue helping without it.' };
              break;
            }
            result = { success: true, ...lookup.data };
            const candidates = (lookup.data.patients || []).map((patient) => ({
              patientRef: String(patient.patient_ref || patient.patientRef || patient.ref || ''),
              name: String(patient.name || patient.full_name || patient.fullName || '')
            })).filter((patient) => patient.patientRef && patient.name);
            this.setMeta('selfcare_patient_candidates', JSON.stringify(candidates.slice(0, 10)));
            this.addMessage('system', `Eka patient lookup: ${JSON.stringify({
              mobile: lookup.data.mobile || lookupPhone,
              matches: (lookup.data.patients || []).map((p) => ({ name: p.name, age: p.age }))
            })}`);
            break;
          }

        case 'eka_patient_context':
          {
            const ref = String(args.patient_ref || '').trim();
            const confirmedName = String(args.confirmed_name || '').trim();
            const candidates = this.getMetaJson('selfcare_patient_candidates');
            const candidate = (Array.isArray(candidates) ? candidates : [])
              .find((patient) => patient.patientRef === ref);
            if (!/^[\w.-]{4,64}$/.test(ref) ||
                args.identity_verified !== true ||
                !candidate ||
                !namesReasonablyMatch(confirmedName, candidate.name)) {
              result = {
                success: false,
                error: 'verified patient identity is required',
                voiceResponse: 'I could not safely match that name to the selected demo record. I can still help without opening it.'
              };
              break;
            }
            const context = await selfcareBridgeRequest(this.env, '/api/bridge/patient-context?ref=' + encodeURIComponent(ref));
            if (!context.ok) {
              result = { success: false, error: 'record system unavailable', voiceResponse: 'The record could not be opened right now — continue helping without it.' };
              break;
            }
            result = { success: true, ...context.data };
            this.addMessage('system', `Eka patient context: ${JSON.stringify(context.data).slice(0, 900)}`);
            break;
          }

        case 'find_clinic':
        case 'find_clinics':
        case 'resolve_providers':
          result = await resolveProviderOptions(
            this.env,
            sanitizeProviderLookupArgs(toolName, args)
          );
          this.addMessage('system', `Provider options resolved: ${JSON.stringify(result)}`);
          break;

        case 'find_support_services':
          {
            const pendingContext = this.getMetaJson('jozi_pending_lookup_context') || {};
            const cityFallbackOffer = this.getMetaJson('jozi_city_fallback_offer') || {};
            const currentPatientTurnSeq = Number(this.getMeta('patient_turn_seq') || 0);
            const currentPatientItemId = this.getMeta('last_patient_item_id') || '';
            const callerArgs = stripUntrustedJoziInternalArgs(args);
            const currentVoiceApi = normalizeOpenAIVoiceApi(
              context.voiceApi || this.getMeta('voice_api'),
              configuredOpenAIVoiceApi(this.env)
            );
            const cityConsentProvided = Object.prototype.hasOwnProperty.call(
              callerArgs,
              'city_fallback_consent_confirmed'
            );
            const liveCityDecision = currentVoiceApi === 'live'
              ? this.liveConsentDecisionAfterOffer(cityFallbackOffer, context.delegationId)
              : '';
            const callerAnsweredCityOffer = currentVoiceApi === 'live'
              ? ['confirmed', 'declined'].includes(liveCityDecision)
              : isImmediateJoziConsentTurn({
                  currentItemId: currentPatientItemId,
                  currentTurnSeq: currentPatientTurnSeq,
                  offer: cityFallbackOffer
                });
            const mergedContext = mergeJoziSupportContext(pendingContext, callerArgs);
            const cityDecision = applyJoziCityFallbackDecision({
              contextualArgs: mergedContext,
              offer: cityFallbackOffer,
              consentProvided: cityConsentProvided,
              consentConfirmed: currentVoiceApi === 'live'
                ? liveCityDecision === 'confirmed'
                : callerArgs.city_fallback_consent_confirmed,
              callerAnswered: callerAnsweredCityOffer
            });
            const contextualArgs = cityDecision.contextualArgs;
            const acceptedCityFallback = cityDecision.accepted;
            const declinedCityFallback = cityDecision.declined;
            const fallbackNeed = cityDecision.fallbackNeed;
            const remainingNeeds = cityDecision.remainingNeeds;
            result = declinedCityFallback && remainingNeeds.length === 0
              ? {
                  success: false,
                  status: 'city_fallback_declined',
                  error: 'city_last_resort_declined',
                  needs: fallbackNeed ? [fallbackNeed] : [],
                  location: contextualArgs.location || '',
                  audience: contextualArgs.audience || 'unknown',
                  timing: contextualArgs.timing || 'routine',
                  options: [],
                  spoken_option_ids: [],
                  pending_option_ids: [],
                  handled_needs: [],
                  next_need: '',
                  awaiting: 'end_or_continue',
                  suggested_demo_action: '',
                  availability_confirmed: false,
                  voiceResponse: "Okay, I won't use the City route. I do not have another verified match for that need in this area. Would you like to try another nearby area or a different kind of support?"
                }
              : resolveJoziSupport({
                  ...contextualArgs,
                  demo_enabled: joziDemoEnabled(this.env)
                });
            const liveCityConsentUnclear = currentVoiceApi === 'live' &&
              cityFallbackOffer.active === true && cityConsentProvided &&
              !['confirmed', 'declined'].includes(liveCityDecision);
            if (liveCityConsentUnclear) {
              const retryCount = Number(cityFallbackOffer.live_consent_retry_count || 0);
              const closeOffer = retryCount >= 1;
              result = {
                success: false,
                status: closeOffer ? 'city_consent_closed' : 'city_consent_unclear',
                needs: [cityFallbackOffer.fallback_need].filter(Boolean),
                city_fallback_need: cityFallbackOffer.fallback_need || '',
                awaiting: closeOffer ? 'end_or_continue' : 'city_fallback_consent',
                suggested_demo_action: '',
                availability_confirmed: false,
                voiceResponse: closeOffer
                  ? "I didn't hear a clear yes, so I won't use the City route. We can try another nearby area."
                  : 'I want to be sure I heard you correctly. Please say yes or no: should I use the City route as the last option?'
              };
            }
            this.setMeta('jozi_pending_lookup_context', JSON.stringify(
              buildJoziPendingLookupContext(contextualArgs, result)
            ));
            this.setMeta('jozi_city_fallback_offer', JSON.stringify(
              result.awaiting === 'city_fallback_consent'
                ? {
                    active: true,
                    fallback_need: result.city_fallback_need || '',
                    remaining_needs: Array.isArray(result.needs)
                      ? result.needs.filter((need) => need !== result.city_fallback_need)
                      : [],
                    patient_turn_seq: Number(this.getMeta('patient_turn_seq') || 0),
                    patient_item_id: this.getMeta('last_patient_item_id') || '',
                    live_input_seq: this.liveInputCheckpoint(),
                    live_delegation_id: context.delegationId || '',
                    live_consent_retry_count: liveCityConsentUnclear
                      ? Number(cityFallbackOffer.live_consent_retry_count || 0) + 1
                      : Number(cityFallbackOffer.live_consent_retry_count || 0)
                  }
                : {}
            ));
          }
          {
            const consentResourceId = result.awaiting === 'demo_action_consent'
              ? result.spoken_option_ids?.[0] || ''
              : '';
            const consentAction = consentResourceId ? result.suggested_demo_action || '' : '';
            this.setMeta('jozi_demo_consent_offer', JSON.stringify(
              consentResourceId && consentAction
                ? {
                    resource_id: consentResourceId,
                    action: consentAction,
                    patient_turn_seq: Number(this.getMeta('patient_turn_seq') || 0),
                    patient_item_id: this.getMeta('last_patient_item_id') || '',
                    live_input_seq: this.liveInputCheckpoint(),
                    live_delegation_id: context.delegationId || '',
                    live_consent_retry_count: 0
                  }
                : {}
            ));
          }
          this.addMessage('system', `Jozi support options resolved: ${JSON.stringify(result)}`);
          break;

        case 'coordinate_support_demo':
          {
            const consentOffer = this.getMetaJson('jozi_demo_consent_offer') || {};
            const currentPatientTurnSeq = Number(this.getMeta('patient_turn_seq') || 0);
            const currentPatientItemId = this.getMeta('last_patient_item_id') || '';
            const currentVoiceApi = normalizeOpenAIVoiceApi(
              context.voiceApi || this.getMeta('voice_api'),
              configuredOpenAIVoiceApi(this.env)
            );
            const liveConsentDecision = currentVoiceApi === 'live'
              ? this.liveConsentDecisionAfterOffer(consentOffer, context.delegationId)
              : '';
            const callerAnsweredAfterOffer = currentVoiceApi === 'live'
              ? liveConsentDecision === 'confirmed'
              : isImmediateJoziConsentTurn({
                  currentItemId: currentPatientItemId,
                  currentTurnSeq: currentPatientTurnSeq,
                  offer: consentOffer
                });
            if (currentVoiceApi === 'live' && liveConsentDecision === 'declined') {
              result = {
                success: false,
                status: 'demo_action_declined',
                simulation: true,
                submitted: false,
                confirmed: false,
                voiceResponse: "Okay, I won't start that demo step. What would help you next?"
              };
              this.setMeta('jozi_demo_consent_offer', '{}');
            } else if (currentVoiceApi === 'live' && !callerAnsweredAfterOffer) {
              const retryCount = Number(consentOffer.live_consent_retry_count || 0);
              const closeOffer = retryCount >= 1;
              result = {
                success: false,
                status: closeOffer ? 'demo_consent_closed' : 'demo_consent_unclear',
                simulation: true,
                submitted: false,
                confirmed: false,
                voiceResponse: closeOffer
                  ? "I didn't hear a clear yes, so I won't start it. We can choose another kind of help."
                  : 'I want to be sure I heard you correctly. Please say yes or no: should I start that demo step?'
              };
              this.setMeta('jozi_demo_consent_offer', closeOffer
                ? '{}'
                : JSON.stringify({
                    ...consentOffer,
                    live_delegation_id: context.delegationId || '',
                    live_input_seq: this.liveInputCheckpoint(),
                    live_spoken_input_seq: undefined,
                    live_spoken_start_ms: undefined,
                    live_spoken_end_ms: undefined,
                    live_consent_retry_count: retryCount + 1
                  }));
            } else {
              result = coordinateJoziSupport({
                ...args,
                consent_confirmed: currentVoiceApi === 'live' ? true : args.consent_confirmed,
                demo_enabled: joziDemoEnabled(this.env),
                require_confirmed_consent: true,
                caller_answered_after_offer: callerAnsweredAfterOffer,
                require_offered_resource: true,
                offered_resource_ids: consentOffer.resource_id ? [consentOffer.resource_id] : [],
                require_offered_action: true,
                required_action: consentOffer.action || '',
                reference_id: generateId('JZDEMO')
              });
              if (result.success) this.setMeta('jozi_demo_consent_offer', '{}');
            }
          }
          this.addMessage('system', `Jozi demo coordination: ${JSON.stringify(result)}`);
          break;

        case 'book_slot':
        case 'schedule_appointment':
          result = {
            success: true,
            confirmation_number: generateId('APPT'),
            appointment: {
              clinic_id: args.clinic_id || args.provider_type || 'clinic',
              date: args.date || args.preferred_dates?.[0] || 'next available',
              time: args.time || 'next available',
              patient_name: args.patient_name || 'patient'
            }
          };
          this.addMessage('system', `Appointment booked: ${JSON.stringify(result)}`);
          await this.sendPreferredFollowup(phone, `Appointment request received. Reference: ${result.confirmation_number}`);
          break;

        case 'send_referral':
        case 'refer_specialist':
          result = {
            success: true,
            referral_id: generateId('REF'),
            details: {
              patient: args.patient_name || 'patient',
              provider: args.provider_id || args.specialist_type || 'provider',
              reason: args.reason || 'Health consultation'
            }
          };
          this.addMessage('system', `Referral created: ${JSON.stringify(result)}`);
          await this.sendPreferredFollowup(phone, `Referral request received. Reference: ${result.referral_id}`);
          break;

        case 'request_commodities':
        case 'arrange_commodity_pickup':
        case 'create_pickup':
          result = await requestCommodityPickup(this.env, args);
          this.addMessage('system', `Commodity pickup requested: ${JSON.stringify(result)}`);
          if (result.success && result.provider) {
            await this.sendPreferredFollowup(
              phone,
              `Simulated commodity pickup request received. Pickup number: ${result.pickup_number}. Go to ${result.provider.name}, ${result.provider.address}.`
            );
          }
          break;

        case 'request_test':
        case 'order_test':
        case 'schedule_test':
          result = await requestTest(this.env, args);
          this.addMessage('system', `Test request created: ${JSON.stringify(result)}`);
          if (result.success && result.provider) {
            await this.sendPreferredFollowup(
              phone,
              `Simulated test request received. Reference: ${result.test_request_id}. Go to ${result.provider.name}, ${result.provider.address}.`
            );
          }
          break;

        case 'coordinate_selfcare_demo':
          {
            if (args.consent_confirmed !== true) {
              result = {
                success: false,
                status: 'demo_consent_required',
                simulation: true,
                submitted: false,
                confirmed: false,
                voiceResponse: 'Please ask the caller once whether they want that demo step, then wait for their answer.'
              };
              break;
            }
            const action = String(args.action || 'clinician_handoff');
            const when = String(args.requested_time || 'the next available time');
            const messages = {
              appointment_request: `All set—the demo now shows a Self Care appointment booked for ${when}. No clinic or clinician was contacted, so no real appointment was booked.`,
              clinician_handoff: 'Please hold—the demo now shows a doctor joining shortly. No live doctor was contacted or connected.',
              care_team_callback: `All set—the demo now shows a care-team callback requested for ${when}. No live callback request was sent.`
            };
            result = {
              success: true,
              status: 'simulation_only',
              simulation: true,
              submitted: false,
              confirmed: false,
              action,
              reference_id: generateId('SCDEMO'),
              requested_time: when,
              voiceResponse: messages[action] || messages.clinician_handoff
            };
            this.pushSelfcareTimelineEvent({
              type: 'coordination',
              title: `Voice demo: ${action.replace(/_/g, ' ')}`,
              detail: result.voiceResponse
            });
          }
          break;

        case 'handle_emergency':
          if (modeIncludesJozi(serviceMode)) {
            this.setMeta('jozi_demo_consent_offer', '{}');
            this.setMeta('jozi_pending_lookup_context', '{}');
            this.setMeta('jozi_city_fallback_offer', '{}');
          }
          result = modeIncludesJozi(serviceMode)
            ? resolveJoziSupport({
                safety_context: args.safety_context || inferJoziSafetyContext(args),
                location: args.location || args.landmark || '',
                audience: args.audience || 'unknown',
                phone_type: args.phone_type || 'unknown'
              })
            : {
                success: true,
                emergency: true,
                voiceResponse: serviceMode === 'selfcare'
                  ? 'This sounds serious and needs urgent medical attention now. In South Africa call one zero one seven seven, or one one two from a mobile; in Mozambique call one one two or go straight to the nearest banco de socorros.'
                  : 'This sounds serious and needs urgent medical attention. Please call emergency services or go to the nearest emergency facility now.'
              };
          this.addMessage('system', `Emergency protocol: ${JSON.stringify(args)}`);
          if (serviceMode === 'selfcare') {
            this.pushSelfcareTimelineEvent({
              type: 'escalation',
              title: `Voice line emergency: ${(args.symptoms || []).slice(0, 3).join(', ').slice(0, 90) || args.safety_context || 'emergency guidance given'}`,
              detail: 'Deterministic emergency guidance given on the Self Care voice line; caller directed to urgent care.'
            });
          }
          if (!modeIncludesJozi(serviceMode)) {
            await this.sendPreferredFollowup(phone, `Emergency guidance: seek urgent care now. Symptoms: ${(args.symptoms || []).join(', ')}`);
          }
          break;

        default:
          result = { error: `Unknown tool: ${toolName}` };
      }
    } catch (error) {
      result = {
        error: 'Tool execution failed',
        message: error.message
      };
    }
    this.setMeta('last_tool_finished', JSON.stringify({
      toolName,
      at: new Date().toISOString(),
      success: Boolean(result?.success),
      error: result?.error || ''
    }));

    const voiceApi = normalizeOpenAIVoiceApi(
      context.voiceApi || this.getMeta('voice_api'),
      configuredOpenAIVoiceApi(this.env)
    );
    if (voiceApi === 'live') {
      const eventPrefix = `${context.delegationId || 'delegation'}_${toolCallId}`;
      const liveResult = modeIncludesJozi(serviceMode)
        ? compactLiveJoziToolResult(toolName, result)
        : result;
      this.queueLiveEvents(liveToolResultEvents(toolCallId, liveResult, eventPrefix));
    } else {
      this.sendRealtime({
        type: 'conversation.item.create',
        item: {
          type: 'function_call_output',
          call_id: toolCallId,
          output: JSON.stringify(result)
        }
      });
      this.sendRealtime({
        type: 'response.create',
        response: {
          output_modalities: ['audio'],
          max_output_tokens: numericEnv(this.env.OPENAI_MAX_OUTPUT_TOKENS, DEFAULT_MAX_OUTPUT_TOKENS),
          instructions: modeIncludesJozi(serviceMode)
            ? JOZI_ACTION_RESPONSE_INSTRUCTIONS
            : serviceMode === 'selfcare' ? SELFCARE_ACTION_RESPONSE_INSTRUCTIONS : ACTION_RESPONSE_INSTRUCTIONS
        }
      });
    }
  }

  async finalizeCall() {
    if (!this.getMeta('terminal_at')) this.setMeta('terminal_at', new Date().toISOString());
    const serviceMode = this.getMeta('service_mode') || configuredServiceMode(this.env);
    const joziPrivacyMode = !serviceModePolicy(serviceMode).persistRawTranscript;
    if (this.getMeta('completed_at')) {
      const pendingMapping = this.getMeta('mapping_cleanup_pending');
      if (joziPrivacyMode && (this.getMeta('privacy_purged') !== 'true' || pendingMapping)) {
        try {
          await this.cleanupJoziSession(serviceMode, pendingMapping || this.getMeta('provider_call_id'));
          await this.ctx.storage.deleteAlarm();
        } catch (error) {
          await this.scheduleJoziCleanupRetry(error);
          throw error;
        }
      }
      return;
    }

    const providerCallId = this.getMeta('provider_call_id');
    try {
      this.flushPendingInputTranscripts();
      this.flushPendingLiveTranscripts();

      const messages = this.ctx.storage.sql
        .exec('SELECT role, text, created_at FROM messages ORDER BY id ASC')
        .toArray();
      const transcriptMessages = messages.length
        ? messages
        : [{
            role: 'system',
            text: 'No transcript text was captured for this completed call.',
            created_at: new Date().toISOString()
          }];

      const artifacts = buildCallArtifacts(transcriptMessages);
      const summaries = await this.generateCallSummaries(transcriptMessages, artifacts);
      ensureGeneratedReferences(summaries, artifacts);
      this.setMeta('summary', summaries.patientSummary);
      this.setMeta('patient_summary', summaries.patientSummary);
      this.setMeta('provider_summary', summaries.providerSummary || '');
      this.setMeta('case_type', summaries.caseType);
      this.setMeta('language_used', summaries.languageUsed || '');
      this.setMeta('provider_followup_needed', String(summaries.providerFollowupNeeded));
      this.setMeta('provider_followup_reason', summaries.providerFollowupReason || '');
      this.setMeta('references', joziPrivacyMode ? '[]' : JSON.stringify(buildReferences(artifacts)));
      this.setMeta('completed_at', new Date().toISOString());
      await this.persistTranscript(summaries, transcriptMessages, artifacts);
      await this.updateCallerMemory(summaries, transcriptMessages, artifacts).catch((error) => {
        this.setMeta('caller_memory_error', error.message);
        console.error('[Memory] update failed', error);
      });

      /* finalizeCall can be entered concurrently (idle alarm + Twilio completion callbacks race,
         and completed_at is only set after the summary generation await) — the synchronous
         check-and-set below keeps the demo record at one summary event per call. */
      if (serviceMode === 'selfcare' && !this.getMeta('selfcare_summary_pushed')) {
        this.setMeta('selfcare_summary_pushed', '1');
        const urgency = summaries.providerFollowupReason === 'urgent'
          ? 'emergency'
          : summaries.providerFollowupNeeded ? 'priority' : null;
        this.pushSelfcareTimelineEvent({
          type: urgency ? 'escalation' : 'summary',
          title: urgency
            ? `Voice call handed to care team (${urgency})`
            : `Voice call completed${summaries.languageUsed ? ' — ' + summaries.languageUsed : ''} · summary scribed`,
          detail: (summaries.providerSummary || summaries.patientSummary || '').slice(0, 290)
        });
      }

      const phone = this.getMeta('patient_phone') || '';
      await this.sendPreferredFollowup(phone, buildPatientFollowupMessage(summaries, artifacts));
      if (!joziPrivacyMode) await this.ctx.storage.deleteAlarm();
    } finally {
      if (joziPrivacyMode) {
        try {
          await this.cleanupJoziSession(serviceMode, providerCallId);
          await this.ctx.storage.deleteAlarm();
        } catch (error) {
          await this.scheduleJoziCleanupRetry(error);
          throw error;
        }
      }
    }
  }

  async cleanupJoziSession(serviceMode, providerCallId) {
    let firstError = null;
    let mappingError = null;

    if (providerCallId) {
      try {
        await callerRegistry(this.env).deleteCallMapping(providerCallId);
        await callerRegistry(this.env).deleteCallProfile(providerCallId);
      } catch (error) {
        mappingError = error;
        firstError = error;
        console.error('[Privacy] Could not remove external call mapping', error);
      }
    }

    try {
      this.purgeJoziSessionState(serviceMode);
    } catch (error) {
      firstError ||= error;
      console.error('[Privacy] Could not purge Jozi session state', error);
    }

    // If local purge succeeded but the separate registry failed, retain only
    // the opaque mapping id so an alarm can retry without retaining call text.
    if (mappingError) this.setMeta('mapping_cleanup_pending', providerCallId);
    if (!mappingError && this.getMeta('mapping_cleanup_pending')) {
      this.ctx.storage.sql.exec("DELETE FROM metadata WHERE key = 'mapping_cleanup_pending'");
    }
    if (firstError) throw firstError;
  }

  async scheduleJoziCleanupRetry(error) {
    console.error('[Privacy] Jozi session cleanup failed; scheduling retry', error);
    try {
      await this.ctx.storage.setAlarm(Date.now() + 60_000);
    } catch (alarmError) {
      console.error('[Privacy] Could not schedule Jozi cleanup retry', alarmError);
    }
  }

  purgeJoziSessionState(serviceMode) {
    const completedAt = this.getMeta('completed_at') || new Date().toISOString();
    this.ctx.storage.sql.exec('DELETE FROM messages');
    this.ctx.storage.sql.exec('DELETE FROM input_transcript_deltas');
    this.ctx.storage.sql.exec('DELETE FROM live_transcript_deltas');
    this.ctx.storage.sql.exec('DELETE FROM metadata');
    this.setMeta('service_mode', normalizeServiceMode(serviceMode));
    this.setMeta('completed_at', completedAt);
    this.setMeta('privacy_purged', 'true');
  }

  async scheduleFinalizeAlarm(reason = 'activity') {
    const idleMs = numericEnv(this.env.FINALIZE_IDLE_MS, DEFAULT_FINALIZE_IDLE_MS);
    const rawDrainDeadline = this.getMeta('live_drain_deadline_ms');
    this.setMeta('finalize_alarm_reason', reason);
    await this.ctx.storage.setAlarm(nextFinalizeAlarmAt(rawDrainDeadline, { idleMs }));
  }

  async persistTranscript(summaries, messages, artifacts) {
    if (!this.env.TRANSCRIPTS) return;

    const callId = this.getMeta('call_id');
    if (!callId) return;

    const completedAt = this.getMeta('completed_at') || new Date().toISOString();
    const serviceMode = this.getMeta('service_mode') || configuredServiceMode(this.env);
    const policy = serviceModePolicy(serviceMode);
    const references = buildReferences(artifacts);
    const recordId = policy.persistRawTranscript ? callId : await sha256Hex(callId);
    const key = `transcripts/${recordId}.json`;
    const safeActivity = joziSafeActivity(artifacts);
    const payload = {
      callId: policy.persistRawTranscript ? callId : null,
      recordId: policy.persistRawTranscript ? null : recordId,
      serviceMode,
      patientPhone: policy.persistRawTranscript ? this.getMeta('patient_phone') : null,
      acceptedAt: this.getMeta('accepted_at'),
      completedAt,
      summary: policy.persistRawTranscript ? summaries.patientSummary : 'Jozi support call completed. Raw caller details were not retained.',
      patientSummary: policy.persistRawTranscript ? summaries.patientSummary : 'Jozi support call completed. Raw caller details were not retained.',
      providerSummary: policy.persistRawTranscript ? summaries.providerSummary : null,
      caseType: policy.persistRawTranscript ? summaries.caseType : 'community_support',
      languageUsed: policy.persistRawTranscript ? (summaries.languageUsed || '') : 'unknown',
      providerFollowupNeeded: policy.persistRawTranscript ? summaries.providerFollowupNeeded : false,
      providerFollowupReason: policy.persistRawTranscript ? summaries.providerFollowupReason : 'none',
      references: policy.persistRawTranscript ? references : [],
      artifacts: policy.persistRawTranscript ? artifacts : safeActivity,
      messages: policy.persistRawTranscript ? messages : [],
      rawTranscriptRetained: policy.persistRawTranscript
    };

    const putOptions = {
      metadata: {
        recordId,
        completedAt,
        serviceMode
      }
    };
    if (!policy.persistRawTranscript) {
      putOptions.expirationTtl = Math.max(60, Math.round(numericEnv(this.env.JOZI_TRANSCRIPT_TTL_DAYS, 7) * 24 * 60 * 60));
    }
    await this.env.TRANSCRIPTS.put(key, JSON.stringify(payload, null, 2), putOptions);
    this.setMeta('transcript_kv_key', key);
  }

  async generateCallSummaries(messages, artifacts) {
    const summaryServiceMode = normalizeServiceMode(this.getMeta('service_mode') || configuredServiceMode(this.env));
    if (modeIncludesJozi(summaryServiceMode)) {
      return joziFallbackSummaries(artifacts);
    }
    const apiKey = this.env.OPENAI_API_KEY;
    if (!apiKey) return fallbackSummaries(messages, artifacts);
    const selfcareScribeLines = summaryServiceMode === 'selfcare' ? [
      'This call was on the Self Care line for South Africa and Mozambique.',
      'Write patientSummary in the language the caller mainly spoke — a Portuguese caller gets Portuguese.',
      'Write providerSummary in English regardless of the call language.',
      'If the transcript contains clinical-record lines (starting "Eka patient lookup:" or "Eka patient context:"), name the matched patient in providerSummary and fold that record context into the handoff; never copy internal record IDs into patientSummary.',
      'If the call was about someone other than the caller (for example a child), clearly separate the caller and the patient in providerSummary.'
    ] : [];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.env.OPENAI_SUMMARY_MODEL || DEFAULT_SUMMARY_MODEL,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: [
              'Create two operational summaries for a health guidance phone call.',
              'Return strict JSON only with keys: patientSummary, providerSummary, providerFollowupNeeded, providerFollowupReason, caseType, languageUsed, commodityPickupNeeded, commodityItems, testNeeded, testNames.',
              'patientSummary: warm, plain-language, 5-8 short lines for the patient. Include appointment, referral, commodity pickup, and test reference numbers from the supplied artifacts when present. For test/refill logistics, include the next action and simulated provider location from artifacts.',
              'providerSummary: null unless referral, appointment/follow-up, diagnostic testing, commodities, urgent symptoms, or continuity of care is needed. If present, write concise clinical handoff notes for a healthcare provider.',
              'providerFollowupNeeded: true only when provider follow-up/referral/testing/commodity pickup/urgent escalation is relevant.',
              'providerFollowupReason: one of none, referral, follow_up, appointment, test, commodities, urgent, mixed.',
              'caseType: one of simple_acute, simple_chronic, urgent, administrative, unknown.',
              'languageUsed: the main spoken language used by the patient, such as English, Spanish, French, Haitian Creole, Swahili, or unknown. Do not infer ethnicity or nationality.',
              'commodityPickupNeeded: true only for an actual commodity, supply, medicine refill, kit, or pickup request. Do not mark true for general self-care advice or casual mention of medicine.',
              'testNeeded: true only when a diagnostic test is actually recommended or requested.',
              'Never generate post-call pickup or test IDs yourself. If the tool did not run during the call, state what information is still needed instead.',
              'Do not invent appointment numbers, referral IDs, pickup numbers, test request IDs, or provider locations in the summary. Use only the artifacts provided.',
              'Make clear that generated logistics are simulated and unverified, not live pharmacy or clinic search results.',
              ...selfcareScribeLines
            ].join('\n')
          },
          {
            role: 'user',
            content: `Structured artifacts generated during the call:\n${JSON.stringify(buildReferences(artifacts), null, 2)}`
          },
          ...messages.map((message) => ({
            role: message.role === 'assistant' ? 'assistant' : 'user',
            content: message.text
          }))
        ]
      })
    });

    if (!response.ok) return fallbackSummaries(messages, artifacts);
    const body = await response.json();
    const parsed = parseJsonObject(contentToText(body?.choices?.[0]?.message?.content));
    return normalizeSummaries(parsed, messages, artifacts);
  }

  async sendPreferredFollowup(phone, message) {
    const serviceMode = this.getMeta('service_mode') || configuredServiceMode(this.env);
    if (!serviceModePolicy(serviceMode).automaticFollowup) return false;
    if (String(this.env.AUTOMATIC_FOLLOWUP_ENABLED || 'true').toLowerCase() === 'false') return false;
    if (!phone || phone.startsWith('anonymous_')) return false;

    if (this.env.TWILIO_ACCOUNT_SID && this.env.TWILIO_AUTH_TOKEN) {
      const sent = await sendTwilioMessage(this.env, phone, message);
      if (sent) return true;
    }

    if (this.env.SIGNALWIRE_PROJECT_ID && this.env.SIGNALWIRE_TOKEN && this.env.SIGNALWIRE_SPACE) {
      return sendSignalWireMessage(this.env, phone, message);
    }

    return false;
  }

  /* Fire-and-forget: a lost event costs one line on the demo record; blocking the voice turn or
     the finalize path on the bridge would cost the call. */
  pushSelfcareTimelineEvent(event) {
    selfcareBridgeRequest(this.env, '/api/bridge/event', {
      method: 'POST',
      body: { event: { channel: 'voice', lang: 'en', ...event } }
    }).catch(() => {});
  }

  addMessage(role, text) {
    if (!text) return;
    this.ctx.storage.sql.exec(
      'INSERT INTO messages (role, text, created_at) VALUES (?, ?, ?)',
      role,
      String(text),
      new Date().toISOString()
    );
  }

  addMessageOnce(role, text) {
    const normalized = String(text || '').trim();
    if (!normalized) return;
    const existing = this.ctx.storage.sql
      .exec('SELECT id FROM messages WHERE role = ? AND text = ? LIMIT 1', role, normalized)
      .toArray()[0];
    if (existing) return;
    this.addMessage(role, normalized);
  }

  appendInputTranscriptDelta(itemId, delta) {
    const id = String(itemId || '').trim();
    const chunk = String(delta || '');
    if (!id || !chunk) return;
    const existing = this.ctx.storage.sql
      .exec('SELECT transcript FROM input_transcript_deltas WHERE item_id = ?', id)
      .toArray()[0];
    const transcript = `${existing?.transcript || ''}${chunk}`;
    this.ctx.storage.sql.exec(
      'INSERT OR REPLACE INTO input_transcript_deltas (item_id, transcript, updated_at) VALUES (?, ?, ?)',
      id,
      transcript,
      new Date().toISOString()
    );
    this.setMeta('last_patient_text_partial', transcript);
  }

  appendLiveTranscriptDelta({ role, delta, startMs, endMs, eventId }) {
    const safeRole = role === 'assistant' ? 'assistant' : role === 'patient' ? 'patient' : '';
    const chunk = String(delta || '');
    if (!safeRole || !chunk) return;
    const key = String(eventId || `${safeRole}:${startMs ?? ''}:${endMs ?? ''}:${chunk}`).slice(0, 1000);
    this.ctx.storage.sql.exec(
      `INSERT OR IGNORE INTO live_transcript_deltas
        (event_id, role, delta, start_ms, end_ms, received_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      key,
      safeRole,
      chunk,
      startMs,
      endMs,
      new Date().toISOString()
    );
    if (safeRole === 'patient') {
      this.setMeta('last_patient_text_partial', this.livePatientTextAfter(0).slice(-2000));
    } else {
      this.markPendingLiveOffersSpoken(startMs, endMs);
    }
  }

  liveInputCheckpoint() {
    const row = this.ctx.storage.sql
      .exec("SELECT MAX(seq) AS seq FROM live_transcript_deltas WHERE role = 'patient'")
      .toArray()[0];
    return Number(row?.seq || 0);
  }

  livePatientTextAfter(checkpoint = 0) {
    const rows = this.ctx.storage.sql
      .exec(
        "SELECT delta FROM live_transcript_deltas WHERE role = 'patient' AND seq > ? ORDER BY seq ASC",
        Number(checkpoint) || 0
      )
      .toArray();
    return rows.map((row) => String(row.delta || '')).join('');
  }

  livePatientTranscriptAfter(checkpoint = 0, afterMs = 0) {
    const rows = this.ctx.storage.sql
      .exec(
        `SELECT delta, start_ms FROM live_transcript_deltas
         WHERE role = 'patient' AND seq > ? AND start_ms IS NOT NULL AND start_ms >= ?
         ORDER BY seq ASC`,
        Number(checkpoint) || 0,
        Number(afterMs) || 0
      )
      .toArray();
    return {
      text: rows.map((row) => String(row.delta || '')).join(''),
      startMs: rows.length ? Number(rows[0].start_ms) : null
    };
  }

  liveConsentDecisionAfterOffer(offer, currentDelegationId) {
    const checkpoint = Number(offer?.live_spoken_input_seq);
    const offerEndMs = Number(offer?.live_spoken_end_ms);
    const delegationOrder = this.getMetaJson('live_delegation_order');
    const transcript = Number.isFinite(checkpoint) && Number.isFinite(offerEndMs)
      ? this.livePatientTranscriptAfter(checkpoint, offerEndMs)
      : { text: '', startMs: null };
    return classifyLiveConsentTurn({
      offer,
      currentDelegationId,
      delegationOrder,
      transcript: transcript.text,
      inputStartMs: transcript.startMs
    });
  }

  markPendingLiveOffersSpoken(startMs, endMs) {
    for (const key of ['jozi_city_fallback_offer', 'jozi_demo_consent_offer']) {
      const offer = this.getMetaJson(key);
      const armed = markLiveOfferSpoken(offer, this.liveInputCheckpoint(), { startMs, endMs });
      if (armed && JSON.stringify(armed) !== JSON.stringify(offer)) {
        this.setMeta(key, JSON.stringify(armed));
      }
    }
  }

  clearInputTranscriptDelta(itemId) {
    const id = String(itemId || '').trim();
    if (!id) return;
    this.ctx.storage.sql.exec('DELETE FROM input_transcript_deltas WHERE item_id = ?', id);
  }

  flushPendingInputTranscripts() {
    const rows = this.ctx.storage.sql
      .exec('SELECT item_id, transcript FROM input_transcript_deltas ORDER BY updated_at ASC')
      .toArray();
    for (const row of rows) {
      this.addMessageOnce('patient', row.transcript);
    }
    if (rows.length) {
      this.ctx.storage.sql.exec('DELETE FROM input_transcript_deltas');
      this.setMeta('pending_patient_transcripts_flushed', String(rows.length));
    }
  }

  flushPendingLiveTranscripts() {
    const rows = this.ctx.storage.sql
      .exec('SELECT role, delta FROM live_transcript_deltas ORDER BY seq ASC')
      .toArray();
    const groups = [];
    for (const row of rows) {
      const role = row.role === 'assistant' ? 'assistant' : 'patient';
      const last = groups.at(-1);
      if (last?.role === role) last.text += String(row.delta || '');
      else groups.push({ role, text: String(row.delta || '') });
    }
    for (const group of groups) this.addMessage(group.role, group.text);
    if (rows.length) {
      this.ctx.storage.sql.exec('DELETE FROM live_transcript_deltas');
      this.setMeta('pending_live_transcripts_flushed', String(rows.length));
    }
  }

  captureItemContent(item) {
    if (!item || item.type !== 'message') return;
    const role = item.role === 'assistant' ? 'assistant' : item.role === 'user' ? 'patient' : null;
    if (!role) return;
    for (const part of item.content || []) {
      const text = part.transcript || part.text || '';
      if (!text) continue;
      this.addMessageOnce(role, text);
      if (role === 'patient') {
        this.setMeta('last_patient_text', text);
      }
    }
  }

  sendRealtime(message) {
    if (!this.monitorSocket || this.monitorSocket.readyState !== WebSocket.OPEN) {
      this.setMeta('last_send_error', 'monitor_socket_not_open');
      return false;
    }
    this.monitorSocket.send(JSON.stringify(message));
    this.setMeta('last_sent_event', message.type || 'unknown');
    return true;
  }

  queueLiveEvents(events) {
    const pending = this.getMetaJson('pending_live_events');
    const queued = Array.isArray(pending) ? pending : [];
    const byId = new Map(queued.map((event) => [String(event?.event_id || generateId('LIVE')), event]));
    for (const event of events || []) {
      byId.set(String(event?.event_id || generateId('LIVE')), event);
    }
    this.setMeta('pending_live_events', JSON.stringify([...byId.values()].slice(-32)));
    this.flushPendingLiveEvents();
  }

  flushPendingLiveEvents() {
    const pending = this.getMetaJson('pending_live_events');
    const events = Array.isArray(pending) ? pending : [];
    if (!events.length) return true;
    let sentCount = 0;
    for (const event of events) {
      if (!this.sendRealtime(event)) break;
      sentCount += 1;
    }
    const remaining = events.slice(sentCount);
    this.setMeta('pending_live_events', JSON.stringify(remaining));
    return remaining.length === 0;
  }

  sendInitialResponse() {
    if (this.initialResponseSent) return;
    const voiceApi = normalizeOpenAIVoiceApi(
      this.getMeta('voice_api'),
      configuredOpenAIVoiceApi(this.env)
    );
    if (voiceApi === 'live' && this.getMeta('greeting_event_id')) {
      this.initialResponseSent = true;
      if (!this.getMeta('greeting_commentary_event_id')) this.sendLiveGreetingStart();
      return;
    }
    const greeting = buildServiceGreeting(
      this.getMeta('service_mode') || configuredServiceMode(this.env),
      joziDemoEnabled(this.env)
    );
    const greetingEventId = voiceApi === 'live' ? generateId('GREETING') : '';
    const sent = voiceApi === 'live'
      ? this.sendRealtime(liveGreetingEvent(greeting, greetingEventId))
      : this.sendRealtime({
          type: 'response.create',
          response: {
            output_modalities: ['audio'],
            instructions: `Say exactly: "${greeting}"`
          }
        });
    if (sent) {
      this.initialResponseSent = true;
      if (greetingEventId) this.setMeta('greeting_event_id', greetingEventId);
      this.setMeta('initial_response_sent_at', new Date().toISOString());
      this.setMeta('last_stage', 'initial_response_requested');
      console.log(`[${voiceApi === 'live' ? 'Live' : 'Realtime'}] initial response requested`);
      if (voiceApi === 'live') {
        setTimeout(() => {
          if (this.getMeta('terminal_at') || this.getMeta('completed_at') ||
              this.getMeta('greeting_commentary_event_id')) return;
          this.setMeta('greeting_ack_timeout_at', new Date().toISOString());
          this.sendLiveGreetingStart();
        }, 1200);
      }
    }
  }

  sendLiveGreetingStart() {
    if (this.getMeta('greeting_commentary_event_id')) return;
    const eventId = generateId('GREETING_START');
    const greeting = buildServiceGreeting(
      this.getMeta('service_mode') || configuredServiceMode(this.env),
      joziDemoEnabled(this.env)
    );
    if (!this.sendRealtime(liveGreetingStartEvent(greeting, eventId))) return;
    this.setMeta('greeting_commentary_event_id', eventId);
    this.setMeta('greeting_commentary_sent_at', new Date().toISOString());
    this.setMeta('last_stage', 'initial_response_start_requested');
    console.log('[Live] greeting commentary requested');
  }

  setMeta(key, value) {
    if (value === undefined || value === null) return;
    this.ctx.storage.sql.exec(
      'INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)',
      key,
      String(value)
    );
  }

  getMeta(key) {
    const row = this.ctx.storage.sql
      .exec('SELECT value FROM metadata WHERE key = ?', key)
      .toArray()[0];
    return row?.value || null;
  }

  deleteMeta(key) {
    this.ctx.storage.sql.exec('DELETE FROM metadata WHERE key = ?', key);
  }

  getMetaJson(key) {
    const value = this.getMeta(key);
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
}

export default {
  async fetch(request, env, ctx) {
    try {
      return await routeRequest(request, env, ctx);
    } catch (error) {
      console.error('[Worker] Unhandled error', error);
      return textResponse('Internal error', 500);
    }
  }
};

async function routeRequest(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method === 'GET' && path === '/health') {
    const defaultMode = configuredServiceMode(env);
    return Response.json({
      status: 'healthy',
      runtime: 'cloudflare-worker',
      serviceMode: defaultMode,
      joziDemoMode: joziDemoEnabled(env),
      lineConfigurationHealthy: activeLineConfigurationIsValid(env),
      voiceApi: configuredOpenAIVoiceApi(env),
      voiceModel: configuredOpenAIVoiceApi(env) === 'live'
        ? env.OPENAI_LIVE_MODEL || DEFAULT_LIVE_MODEL
        : env.OPENAI_REALTIME_MODEL || DEFAULT_REALTIME_MODEL,
      liveBackendModel: configuredOpenAIVoiceApi(env) === 'live'
        ? env.OPENAI_LIVE_BACKEND_MODEL || DEFAULT_LIVE_BACKEND_MODEL
        : null,
      lineProfiles: {
        ...(lineModeEnabled(env, defaultMode) ? { twilioDefault: defaultMode } : {}),
        ...(healthLineEnabled(env) ? { twilioHealth: 'health' } : {}),
        ...(joziLineEnabled(env) ? { twilioJozi: 'jozi' } : {}),
        ...(selfcareLineEnabled(env) ? { twilioSelfcare: 'selfcare' } : {})
      },
      timestamp: new Date().toISOString()
    });
  }

  if (request.method === 'GET' && path === '/openai/webhook') {
    return Response.json({ status: 'webhook_ready', timestamp: new Date().toISOString() });
  }

  if (request.method === 'POST' && path === '/openai/webhook') {
    return handleOpenAIWebhook(request, env, ctx, false);
  }

  if (request.method === 'POST' && path === '/openai/webhook_min') {
    return handleOpenAIWebhook(request, env, ctx, true);
  }

  if (request.method === 'POST' && path === '/signalwire/voice') {
    return handleSignalWireVoice(request, env);
  }

  if (request.method === 'POST' && path === '/signalwire/dial-status') {
    return xmlResponse(`<Response>
  <Say>We're sorry, we couldn't connect your call. Please try again later.</Say>
  <Hangup/>
</Response>`);
  }

  if (request.method === 'POST' && path === '/signalwire/status') return textResponse('OK');

  if (request.method === 'POST' && path.startsWith('/twilio/voice')) {
    if (!env.TWILIO_AUTH_TOKEN) return textResponse('Twilio verification is not configured.', 503);
    if (!await verifyTwilioRequest(request, env)) return textResponse('Invalid Twilio signature.', 403);
    if (!activeLineConfigurationIsValid(env)) return textResponse('Voice line configuration is invalid.', 503);
    const serviceMode = serviceModeForTwilioVoicePath(path, configuredServiceMode(env));
    if (!serviceMode) return textResponse('Not Found', 404);
    if (serviceMode === 'health' && !healthLineEnabled(env)) return textResponse('Health line is not enabled.', 404);
    if (serviceMode === 'jozi' && !joziLineEnabled(env)) return textResponse('Jozi line is not enabled.', 404);
    if (serviceMode === 'selfcare' && !selfcareLineEnabled(env)) return textResponse('Selfcare line is not enabled.', 404);
    return handleTwilioVoice(request, env, { serviceMode });
  }

  if (request.method === 'POST' && path === '/twilio/status') {
    if (!env.TWILIO_AUTH_TOKEN) return textResponse('Twilio verification is not configured.', 503);
    if (!await verifyTwilioRequest(request, env)) return textResponse('Invalid Twilio signature.', 403);
    return handleTwilioStatus(request, env, ctx);
  }

  if (request.method === 'POST' && path === '/twilio/dial-status') {
    if (!env.TWILIO_AUTH_TOKEN) return textResponse('Twilio verification is not configured.', 503);
    if (!await verifyTwilioRequest(request, env)) return textResponse('Invalid Twilio signature.', 403);
    return handleTwilioDialStatus(request, env, ctx);
  }

  if (request.method === 'GET' && path === '/transcripts') {
    return transcriptReaderPage();
  }

  if (request.method === 'GET' && path === '/api/transcripts') {
    return handleTranscriptList(request, env);
  }

  if (request.method === 'GET' && path === '/api/memory') {
    return handleMemoryRead(request, env);
  }

  if (request.method === 'POST' && path === '/api/memory/backfill') {
    return handleMemoryBackfill(request, env);
  }

  if (request.method === 'GET' && path.startsWith('/api/transcripts/')) {
    return handleTranscriptRead(request, env, decodeURIComponent(path.slice('/api/transcripts/'.length)));
  }

  if (request.method === 'GET' && path.startsWith('/sessions/')) {
    return handleSessionRead(request, env, decodeURIComponent(path.slice('/sessions/'.length)));
  }

  if (path.startsWith('/media-stream/')) {
    return textResponse('Media Streams are not implemented in the native Worker deployment. Use the SIP path.', 501);
  }

  return textResponse('Not Found', 404);
}

async function handleOpenAIWebhook(request, env, ctx, minimal) {
  const configuredVoiceApi = configuredOpenAIVoiceApi(env);
  if ((configuredVoiceApi === 'live' || modeIncludesJozi(configuredServiceMode(env)) || joziLineEnabled(env)) &&
      !env.OPENAI_WEBHOOK_SECRET) {
    return textResponse('Webhook verification is required for this voice deployment.', 503);
  }
  const rawBody = await request.text();
  if (env.OPENAI_WEBHOOK_SECRET) {
    const verified = await verifyStandardWebhook(request.headers, rawBody, env.OPENAI_WEBHOOK_SECRET);
    if (!verified) return textResponse('Invalid signature', 400);
  }

  let event;
  try {
    event = JSON.parse(rawBody || '{}');
  } catch {
    return textResponse('Bad JSON', 400);
  }

  const incomingVoiceApi = voiceApiForIncomingEvent(event);
  if (!incomingVoiceApi || incomingVoiceApi !== configuredVoiceApi) return textResponse('OK');
  if (event?.type === 'live.transport.incoming' && event?.data?.type !== 'sip') return textResponse('OK');

  const callId = voiceSessionId(event, incomingVoiceApi);
  if (callId) {
    const sipHeaders = event?.data?.sip_headers;
    const providerCallId = extractTwilioCallSidFromSipHeaders(sipHeaders);
    const profile = providerCallId ? await callerRegistry(env).getCallProfile(providerCallId) : null;
    const profileDestinationMatches = profile ? twilioLineBindingMatches({
      serviceMode: profile.serviceMode,
      to: profile.destinationPhone,
      healthNumber: env.HEALTH_PHONE_NUMBER,
      joziNumber: env.JOZI_PHONE_NUMBER,
      selfcareNumber: env.SELFCARE_PHONE_NUMBER
    }) : false;
    if (!profile ||
        !activeLineConfigurationIsValid(env) ||
        !profileDestinationMatches ||
        (profile.serviceMode === 'health' && !healthLineEnabled(env)) ||
        (profile.serviceMode === 'jozi' && !joziLineEnabled(env)) ||
        (profile.serviceMode === 'selfcare' && !selfcareLineEnabled(env))) {
      console.error('[Routing] Rejecting call without one trusted, enabled line profile', JSON.stringify({ callId }));
      ctx.waitUntil(rejectOpenAICall(env, callId, 603, incomingVoiceApi).catch((error) => {
        console.error('[Routing] Could not reject unprofiled call', error);
      }));
      return textResponse('OK');
    }
    ctx.waitUntil(callSession(env, callId).acceptAndMonitor(event, profile.callerPhone, {
      minimal,
      serviceMode: profile.serviceMode,
      providerCallId,
      voiceApi: incomingVoiceApi
    }));
  }

  return textResponse('OK');
}

async function rejectOpenAICall(env, callId, statusCode = 603, voiceApi = configuredOpenAIVoiceApi(env)) {
  const apiKey = requireEnv(env, 'OPENAI_API_KEY');
  const response = await fetch(openAIRejectUrl(voiceApi, callId), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status_code: statusCode })
  });
  if (!response.ok) {
    throw new Error(`OpenAI call rejection failed (${response.status}): ${await response.text()}`);
  }
}

async function handleSignalWireVoice(request, env) {
  await readForm(request);

  const projectId = requireEnv(env, 'OPENAI_PROJECT_ID');
  const sipUri = buildOpenAISipUri(projectId, {}, {
    secureMedia: configuredOpenAIVoiceApi(env) === 'live'
  });
  const lineLabel = modeIncludesJozi(configuredServiceMode(env)) ? 'Jozi health and support line' : 'healthcare assistant';

  return xmlResponse(`<Response>
  <Say>Connecting to the ${escapeXml(lineLabel)}, please wait.</Say>
  <Dial>
    <Sip>${escapeXml(sipUri)}</Sip>
  </Dial>
</Response>`);
}

async function handleTwilioVoice(request, env, options = {}) {
  const form = await readForm(request);
  const serviceMode = normalizeLineServiceMode(options.serviceMode, configuredServiceMode(env));
  const callSid = String(form.CallSid || '').trim();
  if (!/^CA[0-9a-f]{32}$/i.test(callSid)) {
    return xmlResponse('<Response><Say>This phone line is temporarily unavailable. Please try again shortly.</Say><Hangup/></Response>', 400);
  }
  if (!twilioLineBindingMatches({
    serviceMode,
    to: form.To,
    healthNumber: env.HEALTH_PHONE_NUMBER,
    joziNumber: env.JOZI_PHONE_NUMBER,
    selfcareNumber: env.SELFCARE_PHONE_NUMBER
  })) {
    return xmlResponse('<Response><Say>This phone number is not configured for this line.</Say><Hangup/></Response>', 403);
  }
  const callerPhone = asE164(form.From || '');
  await callerRegistry(env).setCallProfile(callSid, {
    serviceMode,
    callerPhone: ['health', 'selfcare'].includes(serviceMode) && isUsablePatientPhone(callerPhone) ? callerPhone : null,
    destinationPhone: form.To
  });

  const projectId = requireEnv(env, 'OPENAI_PROJECT_ID');
  const origin = new URL(request.url).origin;
  // Twilio reserves the X-Twilio-* namespace. Use our own extension header so
  // the provider CallSid reaches the signed OpenAI webhook for profile lookup.
  const sipHeaders = { 'x-prismind-call-id': callSid };
  const sipUri = buildOpenAISipUri(projectId, sipHeaders, {
    secureMedia: configuredOpenAIVoiceApi(env) === 'live'
  });
  const statusUrl = `${origin}/twilio/status`;
  const dialStatusUrl = `${origin}/twilio/dial-status`;
  const lineLabel = modeIncludesJozi(serviceMode)
    ? 'Jozi support line'
    : serviceMode === 'selfcare' ? 'Self Care line' : 'healthcare assistant';

  return xmlResponse(`<Response>
  <Say>Connecting to the ${escapeXml(lineLabel)}, please wait.</Say>
  <Dial action="${escapeXml(dialStatusUrl)}" method="POST">
    <Sip statusCallback="${escapeXml(statusUrl)}" statusCallbackMethod="POST" statusCallbackEvent="initiated ringing answered completed">${escapeXml(sipUri)}</Sip>
  </Dial>
</Response>`);
}

async function handleTwilioStatus(request, env, ctx) {
  return handleTwilioCompletionCallback(request, env, ctx, false);
}

async function handleTwilioDialStatus(request, env, ctx) {
  return handleTwilioCompletionCallback(request, env, ctx, true);
}

async function handleTwilioCompletionCallback(request, env, ctx, returnTwiml) {
  const form = await readForm(request);

  const terminalStatuses = new Set(['completed', 'busy', 'failed', 'no-answer', 'canceled']);
  const statusCandidates = uniqueStrings([
    form.DialCallStatus,
    form.CallStatus,
    form.StatusCallbackEvent
  ]).map((value) => value.toLowerCase());
  const status = statusCandidates.find((value) => terminalStatuses.has(value)) || statusCandidates[0] || '';
  if (terminalStatuses.has(status)) {
    const candidates = uniqueStrings([
      form.ParentCallSid,
      form.CallSid,
      form.DialCallSid,
      form.SipCallId,
      form.DialSipCallId
    ]);
    let matched = 0;
    for (const providerCallId of candidates) {
      const openaiCallId = await callerRegistry(env).getCallMapping(providerCallId);
      if (openaiCallId) {
        matched += 1;
        ctx.waitUntil((async () => {
          await callSession(env, openaiCallId).providerEnded(`twilio:${status}`);
          await callerRegistry(env).deleteCallMapping(providerCallId);
          await callerRegistry(env).deleteCallProfile(providerCallId);
        })());
      } else {
        ctx.waitUntil(callerRegistry(env).deleteCallProfile(providerCallId));
      }
    }
    console.log('[Twilio] call status', JSON.stringify({ status, candidates, matched }));
  }

  return returnTwiml ? xmlResponse('<Response></Response>') : textResponse('OK');
}

async function handleSessionRead(request, env, callId) {
  const unauthorized = requireAdmin(request, env);
  if (unauthorized) return unauthorized;
  return Response.json(await callSession(env, callId).getSession());
}

async function handleTranscriptList(request, env) {
  const unauthorized = requireAdmin(request, env);
  if (unauthorized) return unauthorized;
  if (!env.TRANSCRIPTS) return textResponse('TRANSCRIPTS KV binding is not configured.', 500);

  const listing = await env.TRANSCRIPTS.list({ prefix: 'transcripts/', limit: 100 });
  const transcripts = listing.keys
    .map((entry) => {
      const callId = entry.metadata?.callId || entry.name.replace(/^transcripts\//, '').replace(/\.json$/, '');
      return {
        key: entry.name,
        callId,
        completedAt: entry.metadata?.completedAt || null
      };
    })
    .sort((left, right) => String(right.completedAt || '').localeCompare(String(left.completedAt || '')));

  return Response.json({
    transcripts,
    cursor: listing.cursor || null,
    listComplete: listing.list_complete !== false
  });
}

async function handleTranscriptRead(request, env, callId) {
  const unauthorized = requireAdmin(request, env);
  if (unauthorized) return unauthorized;
  if (!env.TRANSCRIPTS) return textResponse('TRANSCRIPTS KV binding is not configured.', 500);

  const key = transcriptKey(callId);
  const transcript = await env.TRANSCRIPTS.get(key, 'json');
  if (!transcript) return textResponse('Transcript not found.', 404);
  return Response.json(transcript);
}

async function handleMemoryRead(request, env) {
  const unauthorized = requireAdmin(request, env);
  if (unauthorized) return unauthorized;
  if (!env.TRANSCRIPTS) return textResponse('TRANSCRIPTS KV binding is not configured.', 500);

  const url = new URL(request.url);
  const phone = asE164(url.searchParams.get('phone') || '');
  if (!isUsablePatientPhone(phone)) return textResponse('Valid phone query parameter is required.', 400);

  const memory = await readCallerMemory(env, phone);
  const safeContext = buildVoiceSafeMemoryContext(memory);
  return Response.json({
    phone,
    found: Boolean(memory),
    memory: memory || null,
    voiceSafeContext: safeContext || null
  });
}

async function handleMemoryBackfill(request, env) {
  const unauthorized = requireAdmin(request, env);
  if (unauthorized) return unauthorized;
  if (!callerMemoryEnabled(env)) return textResponse('Caller memory is disabled.', 400);
  if (!env.TRANSCRIPTS) return textResponse('TRANSCRIPTS KV binding is not configured.', 500);

  let options = {};
  try {
    options = await request.json();
  } catch {
    options = {};
  }

  const maxTranscripts = Math.min(numericEnv(options.limit, 100), 500);
  const transcripts = await listTranscriptRecords(env, maxTranscripts);
  const results = [];
  let processed = 0;
  let skipped = 0;
  let failed = 0;

  for (const transcript of transcripts) {
    const phone = asE164(transcript.patientPhone || '');
    if (!isUsablePatientPhone(phone)) {
      skipped += 1;
      results.push({ callId: transcript.callId || null, status: 'skipped', reason: 'missing_phone' });
      continue;
    }

    try {
      const messages = Array.isArray(transcript.messages) ? transcript.messages : [];
      const artifacts = transcript.artifacts || buildCallArtifacts(messages);
      const summaries = transcriptToSummaries(transcript, artifacts);
      const existing = await readCallerMemory(env, phone);
      const memory = await generateCallerMemoryRecord(env, {
        phone,
        existing,
        summaries,
        messages,
        artifacts,
        callId: transcript.callId,
        completedAt: transcript.completedAt
      });
      await writeCallerMemory(env, phone, memory);
      processed += 1;
      results.push({
        callId: transcript.callId || null,
        phone,
        status: 'processed',
        profileCount: Array.isArray(memory.profiles) ? memory.profiles.length : 0,
        restrictedMemoryPresent: Boolean(memory.restrictedMemoryPresent)
      });
    } catch (error) {
      failed += 1;
      results.push({
        callId: transcript.callId || null,
        phone,
        status: 'failed',
        error: error.message
      });
    }
  }

  return Response.json({
    processed,
    skipped,
    failed,
    total: transcripts.length,
    results
  });
}

function requireAdmin(request, env) {
  if (!env.ADMIN_TOKEN) return textResponse('Transcript reader is disabled. Set ADMIN_TOKEN to enable it.', 404);
  const auth = request.headers.get('authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  if (!token || !timingSafeEqual(token, env.ADMIN_TOKEN)) return textResponse('Unauthorized', 401);
  return null;
}

function transcriptKey(callIdOrKey) {
  const value = String(callIdOrKey || '').trim();
  if (value.startsWith('transcripts/') && value.endsWith('.json')) return value;
  return `transcripts/${value.replace(/^transcripts\//, '').replace(/\.json$/, '')}.json`;
}

function realtimeInputAudioConfig(env) {
  return {
    format: realtimeInputAudioFormat(env),
    transcription: {
      model: env.OPENAI_TRANSCRIPTION_MODEL || DEFAULT_TRANSCRIPTION_MODEL
    },
    turn_detection: {
      type: 'server_vad',
      create_response: true,
      interrupt_response: true,
      threshold: 0.5,
      silence_duration_ms: numericEnv(env.VAD_SILENCE_MS, 1200),
      prefix_padding_ms: 300
    }
  };
}

function realtimeInputAudioFormat(env) {
  switch (String(env.TELEPHONY_CODEC || env.TWILIO_SIP_CODECS || '').toLowerCase()) {
    case 'pcma':
    case 'g711_alaw':
    case 'alaw':
      return { type: 'audio/pcma' };
    case 'pcmu':
    case 'g711_ulaw':
    case 'ulaw':
    default:
      return { type: 'audio/pcmu' };
  }
}

function transcriptReaderPage() {
  return htmlResponse(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Transcript Reader</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f7f7f4;
      --panel: #ffffff;
      --text: #1d1f23;
      --muted: #676f7a;
      --line: #dfe2e6;
      --accent: #1f6feb;
      --patient: #0f766e;
      --assistant: #6d4aff;
      --system: #7a5c18;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      background: var(--bg);
      color: var(--text);
    }

    button, input {
      font: inherit;
    }

    button {
      border: 1px solid var(--line);
      background: var(--panel);
      color: var(--text);
      border-radius: 6px;
      padding: 9px 12px;
      cursor: pointer;
    }

    button.primary {
      background: var(--accent);
      border-color: var(--accent);
      color: white;
    }

    button:disabled {
      cursor: not-allowed;
      opacity: 0.58;
    }

    input {
      width: 100%;
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 10px 12px;
      background: white;
      color: var(--text);
    }

    .layout {
      min-height: 100vh;
      display: grid;
      grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
    }

    .sidebar {
      border-right: 1px solid var(--line);
      background: #fbfbf9;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    .topbar {
      position: sticky;
      top: 0;
      z-index: 2;
      display: flex;
      gap: 10px;
      align-items: center;
      justify-content: space-between;
      padding: 16px 18px;
      border-bottom: 1px solid var(--line);
      background: rgba(251, 251, 249, 0.95);
      backdrop-filter: blur(12px);
    }

    h1, h2, h3, p {
      margin: 0;
    }

    h1 {
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 0;
    }

    h2 {
      font-size: 22px;
      line-height: 1.25;
      letter-spacing: 0;
    }

    h3 {
      font-size: 13px;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0;
      margin-bottom: 8px;
    }

    .controls {
      padding: 14px 18px;
      display: grid;
      gap: 10px;
      border-bottom: 1px solid var(--line);
    }

    .token-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 8px;
    }

    .list {
      overflow: auto;
      padding: 8px;
    }

    .call-button {
      width: 100%;
      text-align: left;
      border: 0;
      border-radius: 6px;
      background: transparent;
      padding: 12px;
      display: grid;
      gap: 4px;
    }

    .call-button:hover,
    .call-button.active {
      background: #eef3ff;
    }

    .call-id {
      font-weight: 700;
      overflow-wrap: anywhere;
    }

    .call-time,
    .status {
      color: var(--muted);
      font-size: 13px;
    }

    .content {
      min-width: 0;
      display: grid;
      grid-template-rows: auto 1fr;
      min-height: 100vh;
    }

    .reader-header {
      padding: 18px 24px;
      border-bottom: 1px solid var(--line);
      background: rgba(247, 247, 244, 0.95);
      backdrop-filter: blur(12px);
      position: sticky;
      top: 0;
      z-index: 1;
      display: grid;
      gap: 14px;
    }

    .meta-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;
    }

    .meta-item {
      border: 1px solid var(--line);
      background: var(--panel);
      border-radius: 6px;
      padding: 10px;
      min-width: 0;
    }

    .meta-label {
      color: var(--muted);
      font-size: 12px;
      margin-bottom: 4px;
    }

    .meta-value {
      font-size: 14px;
      overflow-wrap: anywhere;
    }

    .reader-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      align-items: center;
    }

    .reader-body {
      padding: 22px 24px 40px;
      display: grid;
      gap: 22px;
      align-content: start;
    }

    .summary {
      border-left: 4px solid var(--accent);
      background: var(--panel);
      padding: 16px 18px;
      border-radius: 0 6px 6px 0;
      line-height: 1.55;
      white-space: pre-wrap;
    }

    .summary.provider {
      border-left-color: var(--assistant);
    }

    .references {
      display: grid;
      gap: 10px;
    }

    .memory-search {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto auto;
      gap: 8px;
      align-items: center;
      margin-bottom: 10px;
    }

    .memory-panel {
      display: grid;
      gap: 10px;
    }

    .memory-profile {
      border: 1px solid var(--line);
      background: var(--panel);
      border-radius: 6px;
      padding: 12px 14px;
      display: grid;
      gap: 8px;
    }

    .memory-profile-title {
      font-weight: 800;
      overflow-wrap: anywhere;
    }

    .memory-row {
      color: var(--text);
      line-height: 1.45;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }

    .reference-item {
      border: 1px solid var(--line);
      background: var(--panel);
      border-radius: 6px;
      padding: 12px 14px;
      display: grid;
      gap: 6px;
    }

    .reference-head {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      color: var(--muted);
      font-size: 13px;
    }

    .reference-id {
      color: var(--text);
      font-weight: 800;
      overflow-wrap: anywhere;
    }

    .reference-detail {
      color: var(--text);
      line-height: 1.45;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }

    .messages {
      display: grid;
      gap: 12px;
    }

    .message {
      border: 1px solid var(--line);
      background: var(--panel);
      border-radius: 6px;
      padding: 14px 16px;
      display: grid;
      gap: 8px;
    }

    .message-head {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
      color: var(--muted);
      font-size: 13px;
    }

    .role {
      font-weight: 800;
    }

    .role.patient { color: var(--patient); }
    .role.assistant { color: var(--assistant); }
    .role.system { color: var(--system); }

    .message-text {
      line-height: 1.55;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }

    .empty {
      color: var(--muted);
      padding: 28px;
      text-align: center;
      border: 1px dashed var(--line);
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.5);
    }

    @media (max-width: 860px) {
      .layout {
        grid-template-columns: 1fr;
      }

      .sidebar {
        min-height: auto;
        border-right: 0;
        border-bottom: 1px solid var(--line);
      }

      .list {
        max-height: 260px;
      }

      .meta-grid {
        grid-template-columns: 1fr 1fr;
      }
    }

    @media (max-width: 560px) {
      .token-row,
      .memory-search,
      .meta-grid {
        grid-template-columns: 1fr;
      }

      .reader-header,
      .reader-body {
        padding-left: 16px;
        padding-right: 16px;
      }
    }
  </style>
</head>
<body>
  <main class="layout">
    <aside class="sidebar">
      <div class="topbar">
        <h1>Transcript Reader</h1>
        <button id="refreshButton" type="button">Refresh</button>
      </div>
      <form id="tokenForm" class="controls">
        <div class="token-row">
          <input id="tokenInput" type="password" autocomplete="current-password" placeholder="Admin token">
          <button class="primary" type="submit">Unlock</button>
        </div>
        <input id="listSearch" type="search" placeholder="Filter calls">
        <div id="status" class="status">Locked</div>
      </form>
      <div id="callList" class="list"></div>
    </aside>

    <section class="content">
      <header class="reader-header">
        <div>
          <h2 id="transcriptTitle">Select a transcript</h2>
          <p id="transcriptSubtitle" class="status">No transcript loaded</p>
        </div>
        <div class="meta-grid">
          <div class="meta-item">
            <div class="meta-label">Completed</div>
            <div id="completedAt" class="meta-value">-</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Caller</div>
            <div id="patientPhone" class="meta-value">-</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Language</div>
            <div id="languageUsed" class="meta-value">-</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Patient Turns</div>
            <div id="patientTurns" class="meta-value">-</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">AI Turns</div>
            <div id="assistantTurns" class="meta-value">-</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Case Type</div>
            <div id="caseType" class="meta-value">-</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Provider Follow-up</div>
            <div id="followupStatus" class="meta-value">-</div>
          </div>
        </div>
        <div class="reader-actions">
          <input id="messageSearch" type="search" placeholder="Search transcript">
          <button id="backfillMemoryButton" type="button">Process existing transcripts</button>
          <button id="copySummaryButton" type="button" disabled>Copy summary</button>
          <button id="downloadButton" type="button" disabled>Download JSON</button>
        </div>
      </header>

      <div class="reader-body">
        <section>
          <h3>Phone Memory</h3>
          <form id="memoryForm" class="memory-search">
            <input id="memoryPhoneInput" type="tel" autocomplete="tel" placeholder="Phone number">
            <button class="primary" type="submit">Load memory</button>
            <button id="loadSelectedMemoryButton" type="button" disabled>Use caller</button>
          </form>
          <div id="memoryPanel" class="memory-panel">
            <div class="empty">Load a phone number to review consolidated memory.</div>
          </div>
        </section>
        <section>
          <h3>Patient Summary</h3>
          <div id="summary" class="summary">No summary loaded.</div>
        </section>
        <section id="providerSection">
          <h3>Provider Note</h3>
          <div id="providerSummary" class="summary provider">No provider note generated.</div>
        </section>
        <section>
          <h3>References</h3>
          <div id="references" class="references">
            <div class="empty">No references generated.</div>
          </div>
        </section>
        <section>
          <h3>Conversation</h3>
          <div id="messages" class="messages">
            <div class="empty">No messages loaded.</div>
          </div>
        </section>
      </div>
    </section>
  </main>

  <script>
    const state = {
      token: sessionStorage.getItem('transcriptAdminToken') || '',
      transcripts: [],
      selected: null,
      memory: null
    };

    const els = {
      tokenForm: document.getElementById('tokenForm'),
      memoryForm: document.getElementById('memoryForm'),
      tokenInput: document.getElementById('tokenInput'),
      memoryPhoneInput: document.getElementById('memoryPhoneInput'),
      listSearch: document.getElementById('listSearch'),
      messageSearch: document.getElementById('messageSearch'),
      refreshButton: document.getElementById('refreshButton'),
      backfillMemoryButton: document.getElementById('backfillMemoryButton'),
      loadSelectedMemoryButton: document.getElementById('loadSelectedMemoryButton'),
      status: document.getElementById('status'),
      callList: document.getElementById('callList'),
      transcriptTitle: document.getElementById('transcriptTitle'),
      transcriptSubtitle: document.getElementById('transcriptSubtitle'),
      completedAt: document.getElementById('completedAt'),
      patientPhone: document.getElementById('patientPhone'),
      languageUsed: document.getElementById('languageUsed'),
      patientTurns: document.getElementById('patientTurns'),
      assistantTurns: document.getElementById('assistantTurns'),
      caseType: document.getElementById('caseType'),
      followupStatus: document.getElementById('followupStatus'),
      summary: document.getElementById('summary'),
      providerSection: document.getElementById('providerSection'),
      providerSummary: document.getElementById('providerSummary'),
      references: document.getElementById('references'),
      memoryPanel: document.getElementById('memoryPanel'),
      messages: document.getElementById('messages'),
      copySummaryButton: document.getElementById('copySummaryButton'),
      downloadButton: document.getElementById('downloadButton')
    };

    els.tokenInput.value = state.token;

    els.tokenForm.addEventListener('submit', (event) => {
      event.preventDefault();
      state.token = els.tokenInput.value.trim();
      sessionStorage.setItem('transcriptAdminToken', state.token);
      loadTranscripts();
    });

    els.refreshButton.addEventListener('click', loadTranscripts);
    els.listSearch.addEventListener('input', renderTranscriptList);
    els.messageSearch.addEventListener('input', () => renderTranscript(state.selected));
    els.copySummaryButton.addEventListener('click', copySummary);
    els.downloadButton.addEventListener('click', downloadTranscript);
    els.backfillMemoryButton.addEventListener('click', backfillMemory);
    els.memoryForm.addEventListener('submit', (event) => {
      event.preventDefault();
      loadMemoryForPhone(els.memoryPhoneInput.value.trim());
    });
    els.loadSelectedMemoryButton.addEventListener('click', () => {
      if (state.selected?.patientPhone) loadMemoryForPhone(state.selected.patientPhone);
    });

    if (state.token) loadTranscripts();

    async function loadTranscripts() {
      if (!state.token) {
        setStatus('Locked');
        return;
      }

      setStatus('Loading transcripts');
      els.refreshButton.disabled = true;
      try {
        const data = await fetchJson('/api/transcripts');
        state.transcripts = data.transcripts || [];
        renderTranscriptList();
        setStatus(state.transcripts.length + ' transcript' + (state.transcripts.length === 1 ? '' : 's'));
        if (state.transcripts.length && !state.selected) {
          await selectTranscript(state.transcripts[0].callId);
        }
      } catch (error) {
        setStatus(error.message);
        state.transcripts = [];
        renderTranscriptList();
      } finally {
        els.refreshButton.disabled = false;
      }
    }

    async function selectTranscript(callId) {
      setStatus('Loading ' + callId);
      try {
        state.selected = await fetchJson('/api/transcripts/' + encodeURIComponent(callId));
        renderTranscript(state.selected);
        setStatus('Loaded ' + callId);
      } catch (error) {
        setStatus(error.message);
      }
    }

    async function fetchJson(url) {
      const response = await fetch(url, {
        headers: { Authorization: 'Bearer ' + state.token }
      });

      if (response.status === 401) throw new Error('Unauthorized');
      if (response.status === 404) throw new Error(await response.text());
      if (!response.ok) throw new Error('Request failed: ' + response.status);
      return response.json();
    }

    async function postJson(url, body) {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + state.token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body || {})
      });

      if (response.status === 401) throw new Error('Unauthorized');
      if (response.status === 404) throw new Error(await response.text());
      if (!response.ok) throw new Error('Request failed: ' + response.status + ' ' + await response.text());
      return response.json();
    }

    async function backfillMemory() {
      if (!state.token) {
        setStatus('Locked');
        return;
      }

      els.backfillMemoryButton.disabled = true;
      setStatus('Processing existing transcripts');
      try {
        const result = await postJson('/api/memory/backfill', { limit: 100 });
        setStatus('Memory processed: ' + result.processed + ' processed, ' + result.skipped + ' skipped, ' + result.failed + ' failed');
        if (state.selected?.patientPhone) await loadMemoryForPhone(state.selected.patientPhone);
      } catch (error) {
        setStatus(error.message);
      } finally {
        els.backfillMemoryButton.disabled = false;
      }
    }

    async function loadMemoryForPhone(phone) {
      if (!state.token) {
        setStatus('Locked');
        return;
      }
      const value = String(phone || '').trim();
      if (!value) {
        renderMemory(null, 'Enter a phone number to review memory.');
        return;
      }

      setStatus('Loading memory');
      try {
        state.memory = await fetchJson('/api/memory?phone=' + encodeURIComponent(value));
        renderMemory(state.memory);
        setStatus(state.memory.found ? 'Memory loaded' : 'No memory for phone');
      } catch (error) {
        state.memory = null;
        renderMemory(null, error.message);
        setStatus(error.message);
      }
    }

    function renderTranscriptList() {
      const query = els.listSearch.value.trim().toLowerCase();
      const rows = state.transcripts.filter((item) => {
        return !query ||
          item.callId.toLowerCase().includes(query) ||
          String(item.completedAt || '').toLowerCase().includes(query);
      });

      els.callList.replaceChildren();
      if (!rows.length) {
        els.callList.append(emptyNode('No transcripts found.'));
        return;
      }

      for (const item of rows) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'call-button' + (state.selected?.callId === item.callId ? ' active' : '');
        button.addEventListener('click', () => selectTranscript(item.callId));

        const id = document.createElement('div');
        id.className = 'call-id';
        id.textContent = shortCallId(item.callId);

        const time = document.createElement('div');
        time.className = 'call-time';
        time.textContent = formatDate(item.completedAt);

        button.append(id, time);
        els.callList.append(button);
      }
    }

    function renderTranscript(transcript) {
      if (!transcript) return;

      const messages = Array.isArray(transcript.messages) ? transcript.messages : [];
      const query = els.messageSearch.value.trim().toLowerCase();
      const visibleMessages = messages.filter((message) => {
        return !query ||
          String(message.text || '').toLowerCase().includes(query) ||
          String(message.role || '').toLowerCase().includes(query);
      });

      els.transcriptTitle.textContent = shortCallId(transcript.callId || 'Transcript');
      els.transcriptSubtitle.textContent = transcript.callId || '';
      els.completedAt.textContent = formatDate(transcript.completedAt);
      els.patientPhone.textContent = transcript.patientPhone || '-';
      els.languageUsed.textContent = transcript.languageUsed || '-';
      els.memoryPhoneInput.value = transcript.patientPhone || els.memoryPhoneInput.value;
      els.loadSelectedMemoryButton.disabled = !transcript.patientPhone;
      els.patientTurns.textContent = String(messages.filter((message) => message.role === 'patient').length);
      els.assistantTurns.textContent = String(messages.filter((message) => message.role === 'assistant').length);
      els.caseType.textContent = labelize(transcript.caseType || 'unknown');
      els.followupStatus.textContent = transcript.providerFollowupNeeded
        ? labelize(transcript.providerFollowupReason || 'follow_up')
        : 'Not flagged';
      const patientSummary = transcript.patientSummary || transcript.summary || '';
      els.summary.textContent = patientSummary || 'No patient summary saved.';
      els.providerSummary.textContent = transcript.providerSummary || 'No provider note generated.';
      els.providerSection.hidden = !transcript.providerSummary;
      els.copySummaryButton.disabled = !patientSummary;
      els.downloadButton.disabled = false;
      renderReferences(transcript.references || []);

      els.messages.replaceChildren();
      if (!visibleMessages.length) {
        els.messages.append(emptyNode('No matching messages.'));
        return;
      }

      for (const message of visibleMessages) {
        const row = document.createElement('article');
        row.className = 'message';

        const head = document.createElement('div');
        head.className = 'message-head';

        const role = document.createElement('span');
        role.className = 'role ' + roleClass(message.role);
        role.textContent = roleLabel(message.role);

        const time = document.createElement('span');
        time.textContent = formatDate(message.created_at);

        const text = document.createElement('div');
        text.className = 'message-text';
        text.textContent = message.text || '';

        head.append(role, time);
        row.append(head, text);
        els.messages.append(row);
      }

      renderTranscriptList();
    }

    async function copySummary() {
      const patientSummary = state.selected?.patientSummary || state.selected?.summary;
      if (!patientSummary) return;
      await navigator.clipboard.writeText(patientSummary);
      setStatus('Summary copied');
    }

    function renderReferences(references) {
      els.references.replaceChildren();
      if (!references.length) {
        els.references.append(emptyNode('No references generated.'));
        return;
      }

      for (const reference of references) {
        const row = document.createElement('article');
        row.className = 'reference-item';

        const head = document.createElement('div');
        head.className = 'reference-head';

        const label = document.createElement('span');
        label.textContent = labelize(reference.type || reference.label || 'Reference');

        const id = document.createElement('span');
        id.className = 'reference-id';
        id.textContent = reference.id || '-';

        const detail = document.createElement('div');
        detail.className = 'reference-detail';
        detail.textContent = referenceDetail(reference);

        head.append(label, id);
        row.append(head, detail);
        els.references.append(row);
      }
    }

    function renderMemory(result, emptyText) {
      els.memoryPanel.replaceChildren();
      if (!result) {
        els.memoryPanel.append(emptyNode(emptyText || 'Load a phone number to review consolidated memory.'));
        return;
      }
      if (!result.found || !result.memory) {
        els.memoryPanel.append(emptyNode('No consolidated memory exists for ' + (result.phone || 'this phone') + '.'));
        return;
      }

      const memory = result.memory;
      els.memoryPanel.append(memoryMetaNode(memory, result.phone));

      if (memory.householdSafeContext) {
        els.memoryPanel.append(memoryBlock('Household Safe Context', memory.householdSafeContext));
      }

      const profiles = Array.isArray(memory.profiles) ? memory.profiles : [];
      if (!profiles.length) {
        els.memoryPanel.append(emptyNode('No profile records stored.'));
      } else {
        for (const profile of profiles) {
          els.memoryPanel.append(memoryProfileNode(profile));
        }
      }

      if (memory.restrictedMemoryPresent || memory.restrictedCategories?.length) {
        els.memoryPanel.append(memoryBlock(
          'Restricted Safety Flags',
          [
            'Restricted memory present: ' + (memory.restrictedMemoryPresent ? 'Yes' : 'No'),
            memory.restrictedCategories?.length ? 'Categories: ' + memory.restrictedCategories.join(', ') : ''
          ].filter(Boolean).join('\\n')
        ));
      }
    }

    function memoryMetaNode(memory, phone) {
      return memoryBlock('Memory Record', [
        phone ? 'Phone: ' + phone : '',
        memory.updatedAt ? 'Updated: ' + formatDate(memory.updatedAt) : '',
        memory.lastCallAt ? 'Last call: ' + formatDate(memory.lastCallAt) : '',
        memory.callCount ? 'Call count: ' + memory.callCount : '',
        memory.preferredLanguage ? 'Preferred language: ' + memory.preferredLanguage : '',
        memory.lastLanguageUsed ? 'Last language: ' + memory.lastLanguageUsed : '',
        memory.identityConfidence ? 'Identity: ' + labelize(memory.identityConfidence) : '',
        memory.sharedPhoneWarning || ''
      ].filter(Boolean).join('\\n'));
    }

    function memoryProfileNode(profile) {
      const node = document.createElement('article');
      node.className = 'memory-profile';

      const title = document.createElement('div');
      title.className = 'memory-profile-title';
      title.textContent = profile.profileLabel || profile.profileId || 'Profile';

      const detail = document.createElement('div');
      detail.className = 'memory-row';
      detail.textContent = [
        profile.preferredLanguage ? 'Language: ' + profile.preferredLanguage : '',
        profile.safeForVoiceContext || '',
        profile.safeContinuityItems?.length ? 'Safe continuity: ' + profile.safeContinuityItems.join('; ') : '',
        profile.openItems?.length ? 'Open items: ' + profile.openItems.join('; ') : '',
        profile.carePreferences?.length ? 'Preferences: ' + profile.carePreferences.join('; ') : '',
        profile.restrictedMemoryPresent ? 'Restricted sensitive history flag present. Details are intentionally not stored for voice use.' : '',
        profile.restrictedCategories?.length ? 'Restricted categories: ' + profile.restrictedCategories.join(', ') : ''
      ].filter(Boolean).join('\\n');

      node.append(title, detail);
      return node;
    }

    function memoryBlock(titleText, bodyText) {
      const node = document.createElement('article');
      node.className = 'memory-profile';

      const title = document.createElement('div');
      title.className = 'memory-profile-title';
      title.textContent = titleText;

      const body = document.createElement('div');
      body.className = 'memory-row';
      body.textContent = bodyText || '-';

      node.append(title, body);
      return node;
    }

    function referenceDetail(reference) {
      const detail = reference.detail || {};
      if (reference.type === 'appointment') {
        return [
          detail.date ? 'Date: ' + detail.date : '',
          detail.time ? 'Time: ' + detail.time : '',
          detail.clinic_id ? 'Clinic: ' + detail.clinic_id : ''
        ].filter(Boolean).join('\\n') || JSON.stringify(detail, null, 2);
      }
      if (reference.type === 'referral') {
        return [
          detail.provider ? 'Provider: ' + detail.provider : '',
          detail.reason ? 'Reason: ' + detail.reason : '',
          detail.patient ? 'Patient: ' + detail.patient : ''
        ].filter(Boolean).join('\\n') || JSON.stringify(detail, null, 2);
      }
      if (reference.type === 'commodity_pickup') {
        const pickup = detail.pickup || {};
        return [
          detail.items?.length ? 'Items: ' + detail.items.join(', ') : '',
          detail.reason ? 'Reason: ' + detail.reason : '',
          pickup.location ? 'Pickup: ' + pickup.location : '',
          pickup.instructions ? pickup.instructions : ''
        ].filter(Boolean).join('\\n') || JSON.stringify(detail, null, 2);
      }
      if (reference.type === 'test_request') {
        const provider = detail.provider || {};
        return [
          detail.tests?.length ? 'Tests: ' + detail.tests.join(', ') : '',
          detail.reason ? 'Reason: ' + detail.reason : '',
          provider.name ? 'Provider: ' + provider.name : '',
          provider.capacity ? 'Capacity: ' + provider.capacity : '',
          provider.address ? 'Address: ' + provider.address : ''
        ].filter(Boolean).join('\\n') || JSON.stringify(detail, null, 2);
      }
      return JSON.stringify(detail, null, 2);
    }

    function downloadTranscript() {
      if (!state.selected) return;
      const blob = new Blob([JSON.stringify(state.selected, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = (state.selected.callId || 'transcript') + '.json';
      link.click();
      URL.revokeObjectURL(link.href);
    }

    function emptyNode(text) {
      const node = document.createElement('div');
      node.className = 'empty';
      node.textContent = text;
      return node;
    }

    function setStatus(text) {
      els.status.textContent = text;
    }

    function shortCallId(callId) {
      const text = String(callId || '');
      return text.length > 28 ? text.slice(0, 12) + '...' + text.slice(-8) : text;
    }

    function roleLabel(role) {
      if (role === 'patient') return 'Patient';
      if (role === 'assistant') return 'AI';
      if (role === 'system') return 'System';
      return role || 'Message';
    }

    function roleClass(role) {
      if (role === 'patient' || role === 'assistant' || role === 'system') return role;
      return 'system';
    }

    function labelize(value) {
      return String(value || '')
        .replace(/_/g, ' ')
        .replace(/\\b\\w/g, (char) => char.toUpperCase());
    }

    function formatDate(value) {
      if (!value) return '-';
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return String(value);
      return date.toLocaleString();
    }
  </script>
</body>
</html>`);
}

function callerRegistry(env) {
  return env.CALLER_REGISTRY.getByName('caller-registry');
}

function callSession(env, callId) {
  return env.CALL_SESSIONS.getByName(String(callId));
}

function buildMedicalInstructions(memoryContext) {
  const memoryInstructions = buildMemoryInstructions(memoryContext);
  return memoryInstructions ? `${MEDICAL_INSTRUCTIONS}\n\n${memoryInstructions}` : MEDICAL_INSTRUCTIONS;
}

function buildSelfcareInstructions(memoryContext) {
  const memoryInstructions = buildMemoryInstructions(memoryContext);
  return memoryInstructions ? `${SELFCARE_INSTRUCTIONS}\n\n${memoryInstructions}` : SELFCARE_INSTRUCTIONS;
}

function buildServiceInstructions(mode, memoryContext) {
  const normalized = normalizeServiceMode(mode);
  if (normalized === 'health') return buildMedicalInstructions(memoryContext);
  if (normalized === 'selfcare') return buildSelfcareInstructions(memoryContext);
  if (normalized === 'jozi') return JOZI_SUPPORT_INSTRUCTIONS;
  return [
    JOZI_SUPPORT_INSTRUCTIONS,
    JOZI_COMBINED_HEALTH_INSTRUCTIONS
  ].join('\n\n');
}

function buildLiveFrontendInstructions(mode) {
  const normalized = normalizeServiceMode(mode);
  const identity = normalized === 'selfcare'
    ? 'You are the Self Care companion for callers in South Africa and Mozambique.'
    : modeIncludesJozi(normalized)
      ? 'You are the Jozi My Jozi support companion for people in Johannesburg, including callers without stable housing, money, transport, privacy, a kitchen, or a safe place to wash.'
      : 'You are a warm telephone health adviser for callers in low-resource settings.';
  const language = normalized === 'selfcare'
    ? 'Begin in English and make clear that any language is welcome. Switch fully to the caller\'s language as soon as you understand it confidently, whether they speak it or request it by name. Never imply that only English and Portuguese are supported.'
    : 'Begin in English. Follow the caller into another language when you understand it confidently.';
  const localDelivery = modeIncludesJozi(normalized)
    ? 'Use a gentle, natural South African English cadence and familiar local pronunciation. Never exaggerate or caricature an accent, and pronounce Johannesburg place names carefully.'
    : '';
  const capabilities = normalized === 'selfcare'
    ? [
        '- Clinical reasoning: everyday symptoms, chronic care, maternal and mental wellbeing, red flags, and safe next steps.',
        '- Nearby care: after obtaining a specific location, use the provider tool to suggest an appropriate named clinic, pharmacy, hospital, lab, or health centre and clearly mark it as unverified.',
        '- Patient records: find a demo patient, verify identity, read relevant clinical context, and record an assessment.',
        '- Emergency routing: give the correct country-specific urgent-care action.',
        '- Demo coordination: after a clear yes, show one simulated appointment, clinician handoff, or care-team callback.'
      ]
    : modeIncludesJozi(normalized)
      ? [
          '- Verified Johannesburg support: MES-first shelter and food routes, clinics, mental health, social support, safe community space, crisis help, and Zlto rewards.',
          '- Careful reasoning: interpret ordinary speech in the caller\'s housing and safety context and preserve needs across turns.',
          '- Safe actions: verified service details, crisis routing, and consent-bound demo connections or bookings.'
        ]
      : [
          '- Clinical reasoning: symptom assessment, red flags, self-care, provider review, refills, tests, appointments, and referrals.',
          '- Provider and emergency routing: identify the safest next action and execute supported demo logistics.'
        ];

  return [
    identity,
    'Speak warmly and naturally, at an unhurried pace. Be caring, clear, and direct rather than formal or overly cheerful.',
    'Use one or two short sentences for ordinary turns. A verified tool result may use up to four short sentences when needed. Ask at most one question. Acknowledge distress briefly before the next helpful step.',
    language,
    localDelivery,
    'Backchannel policy: Use moderate, quiet acknowledgements without competing with the caller.',
    'Interruption policy: Stop the main response when the caller interrupts and listen to their correction or added need.',
    '',
    'Delegation policy:',
    'Backend tools:',
    ...capabilities,
    '',
    'Delegate to the backend when:',
    '- The request needs clinical or safety judgment, a destination or phone number, record information, a tool, a crisis route, or a completed demo action.',
    '- The caller changes, adds to, confirms, or declines work already discussed.',
    '',
    'Do not delegate to the backend when:',
    modeIncludesJozi(normalized)
      ? '- The caller is only greeting you or asking you to repeat an already confirmed result. Delegate every substantive support request and let the backend choose any clarification.'
      : '- The caller is only greeting you, asking you to repeat an already confirmed result, or you need one brief clarification to understand the request.',
    '',
    'Delegate before giving any answer that depends on backend work. Do not guess a result, provider fact, availability, booking, transfer, or record detail while waiting.',
    modeIncludesJozi(normalized)
      ? 'If the backend gives one question, speak that question and stop. Do not add, repeat, or answer a second question yourself.'
      : 'When the backend gives one question, ask it once and wait.',
    modeIncludesJozi(normalized)
      ? 'Never default to City of Johannesburg from memory. Never give generic self-care advice that assumes shelter, hot water, food, money, transport, or privacy.'
      : 'Never diagnose, prescribe, or claim an appointment or service outcome before the backend confirms it.'
  ].join('\n');
}

function buildLiveBackendInstructions(mode, serviceInstructions) {
  const normalized = normalizeServiceMode(mode);
  const backendServiceInstructions = normalized === 'selfcare'
    ? serviceInstructions
        .replace(/## INITIAL GREETING[\s\S]*?(?=\n## LANGUAGE RULES)/, '')
        .replace(/## VOICE CONSTRAINTS[\s\S]*?(?=\n\n## PRIOR PHONE CONTEXT|$)/, '')
        .trim()
    : serviceInstructions;
  const resultInstructions = modeIncludesJozi(normalized)
    ? JOZI_ACTION_RESPONSE_INSTRUCTIONS
    : normalized === 'selfcare' ? SELFCARE_ACTION_RESPONSE_INSTRUCTIONS : ACTION_RESPONSE_INSTRUCTIONS;
  return [
    '## GPT-LIVE BACKEND ROLE',
    'You are the reasoning and tool backend for a live phone conversation. The voice frontend handles pacing, empathy, and interruptions; you decide the safe next step and select tools.',
    'Follow every business, safety, privacy, and consent rule below. Use the latest caller correction. Never infer permission for an action.',
    'When a tool is required, call it. After its result, return only concise, verified facts and the next conversational step for the voice frontend. Do not invent missing facts or successful outcomes.',
    '',
    backendServiceInstructions,
    '',
    '## RESULT DELIVERY RULES',
    resultInstructions
  ].join('\n');
}

function buildMinimalInstructions(mode) {
  if (normalizeServiceMode(mode) === 'selfcare') {
    return 'You are the multilingual Self Care line. Follow the caller into any language you understand confidently, use your medical judgment for symptom reasoning, use find_clinics with your own geographic knowledge when nearby care is needed, ask one short question at a time, use record tools only with the caller\'s confirmed identity, and escalate emergencies first.';
  }
  return modeIncludesJozi(mode)
    ? 'You are the caring Jozi My Jozi support line. Understand ordinary speech, remember needs and landmarks across turns, ask one short question at a time, use only verified support tools for destination facts, and escalate immediate danger first.'
    : 'You are a health support agent.';
}

function buildMemoryInstructions(memoryContext) {
  const contextText = buildMemoryContextText(memoryContext);
  if (!contextText) return '';
  return [
    '## PRIOR PHONE CONTEXT - UNVERIFIED AND SAFETY LIMITED',
    'The following context is linked only to this phone number. This number may be shared by multiple people, so do not assume the current caller is the prior patient.',
    'Use this only as quiet continuity context. Do not say "last time you called..." or disclose prior details.',
    'First establish who the call is for with a neutral question such as: "Is this for you or someone else, and is it about a previous concern or something new?"',
    'If a language hint is present, you may start in that language or use a brief bilingual greeting. If the caller uses another language, switch immediately.',
    'Only use a profile hint after the caller independently confirms the same person or same issue. If uncertain, ignore the memory and treat the call as new.',
    'Never reveal or hint at sensitive prior history from phone memory, including gender-based violence, domestic violence, sexual assault, abuse, HIV/STI details, reproductive history, mental health crisis, substance use, or legal risk.',
    '',
    contextText
  ].join('\n');
}

function buildMemoryContextText(memoryContext) {
  if (!memoryContext) return '';
  const lines = [];
  const languageHint = memoryContext.preferredLanguage || memoryContext.lastLanguageUsed || '';
  if (languageHint) {
    lines.push(`Language hint: ${languageHint}`);
  }
  if (memoryContext.householdSafeContext) {
    lines.push(`Safe household-level context: ${memoryContext.householdSafeContext}`);
  }
  for (const profile of memoryContext.profiles || []) {
    const parts = [
      profile.profileLabel ? `Profile: ${profile.profileLabel}` : '',
      profile.preferredLanguage ? `Language: ${profile.preferredLanguage}` : '',
      profile.safeForVoiceContext || '',
      profile.safeContinuityItems?.length ? `Safe continuity: ${profile.safeContinuityItems.join('; ')}` : '',
      profile.openItems?.length ? `Open items: ${profile.openItems.join('; ')}` : '',
      profile.carePreferences?.length ? `Preferences: ${profile.carePreferences.join('; ')}` : ''
    ].filter(Boolean);
    if (parts.length) lines.push(`- ${parts.join(' | ')}`);
  }
  return lines.join('\n').slice(0, 1600);
}

function extractConfiguredTranscription(session) {
  return session?.audio?.input?.transcription ||
    session?.input_audio_transcription ||
    null;
}

function getCallId(event) {
  return event?.call_id || event?.data?.call_id || event?.call?.id || event?.id || null;
}

function realtimeTools(mode = 'health', demoEnabled = false) {
  const healthTools = [
    {
      type: 'function',
      name: 'health_assessment',
      description: 'Record the clinical judgment once you have enough information to classify the concern. Use for advice, triage, simple acute/chronic cases, urgent concerns, or when deciding no logistics action is needed.',
      parameters: {
        type: 'object',
        properties: {
          symptoms: { type: 'array', items: { type: 'string' } },
          severity: { type: 'string', enum: ['urgent', 'moderate', 'routine', 'informational'] },
          medical_content: { type: 'string' },
          pathway: {
            type: 'string',
            enum: ['self_care_advice', 'urgent_triage', 'provider_review', 'refill_eligibility', 'testing', 'appointment', 'referral', 'other']
          },
          next_step: { type: 'string' }
        },
        required: ['symptoms', 'severity']
      }
    },
    {
      type: 'function',
      name: 'find_clinics',
      description: 'Use your own medical and geographic knowledge to choose the closest appropriate real-world care facilities after the caller gives a location or landmark. Match the level of care to the full clinical context and put the closest suitable option first. Call this only when you are confident enough to name at least one local facility; otherwise ask one brief location question first. Results are simulated and unverified.',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string' },
          need: { type: 'string' },
          specialty: { type: 'string' },
          urgency: { type: 'string', enum: ['routine', 'soon', 'urgent'] },
          options: {
            type: 'array',
            description: 'Real-world plausible facilities from your own knowledge, ordered by clinical fit and proximity.',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                address: { type: 'string' },
                type: { type: 'string' },
                distance: { type: 'string' },
                reason: { type: 'string' }
              },
              required: ['name', 'address']
            }
          }
        },
        required: ['location', 'need', 'options']
      }
    },
    {
      type: 'function',
      name: 'resolve_providers',
      description: 'Use this once, after location and care need are known, to get a few real-world plausible nearby pharmacies, clinics, labs, hospitals, or health centers. This is simulated/unverified and has a short timeout to avoid long voice silence.',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string' },
          need: { type: 'string' },
          provider_type: { type: 'string', enum: ['pharmacy', 'clinic', 'health_center', 'lab', 'hospital', 'diagnostic_center', 'other'] },
          urgency: { type: 'string', enum: ['routine', 'soon', 'urgent'] },
          items: { type: 'array', items: { type: 'string' } },
          tests: { type: 'array', items: { type: 'string' } }
        },
        required: ['location', 'need']
      }
    },
    {
      type: 'function',
      name: 'book_slot',
      description: 'Create a simulated appointment request after deciding an appointment is appropriate and enough details are known.',
      parameters: {
        type: 'object',
        properties: {
          clinic_id: { type: 'string' },
          date: { type: 'string' },
          time: { type: 'string' },
          patient_name: { type: 'string' }
        },
        required: ['clinic_id', 'date', 'patient_name']
      }
    },
    {
      type: 'function',
      name: 'send_referral',
      description: 'Create a simulated referral/provider follow-up after deciding referral or continuity of care is appropriate and enough details are known.',
      parameters: {
        type: 'object',
        properties: {
          patient_name: { type: 'string' },
          provider_id: { type: 'string' },
          reason: { type: 'string' },
          contact_method: { type: 'string' }
        },
        required: ['patient_name', 'provider_id', 'reason']
      }
    },
    {
      type: 'function',
      name: 'request_commodities',
      description: 'Create a simulated pickup request when the patient needs medicines, refills, test kits, wound supplies, contraception, ORS, or other health commodities. For medicine refills, call this only after eligibility is established: medicine/regimen, existing prescription or clinic record/refill card, remaining supply or last dose, and city/neighborhood or address. If provider_name/provider_address are not supplied, the backend will run a short provider lookup and choose the first returned option. Do not spend a long spoken turn searching.',
      parameters: {
        type: 'object',
        properties: {
          items: { type: 'array', items: { type: 'string' } },
          reason: { type: 'string' },
          eligibility_basis: { type: 'string' },
          remaining_supply: { type: 'string' },
          location: { type: 'string' },
          pickup_location: { type: 'string' },
          provider_name: { type: 'string' },
          provider_address: { type: 'string' },
          provider_type: { type: 'string', enum: ['pharmacy', 'clinic', 'health_center', 'other'] },
          provider_distance: { type: 'string' },
          urgency: { type: 'string', enum: ['routine', 'soon', 'urgent'] },
          patient_name: { type: 'string' }
        },
        required: ['items', 'reason', 'eligibility_basis', 'remaining_supply', 'location']
      }
    },
    {
      type: 'function',
      name: 'request_test',
      description: 'Create a simulated diagnostic test request only after judging that testing is appropriate and enough details are known: test/reason, urgency, and city/neighborhood or address. If provider_name/provider_address are not supplied, the backend will run a short provider lookup and choose the first returned option. This is simulated and unverified, not live search. Do not spend a long spoken turn searching.',
      parameters: {
        type: 'object',
        properties: {
          tests: { type: 'array', items: { type: 'string' } },
          reason: { type: 'string' },
          location: { type: 'string' },
          provider_name: { type: 'string' },
          provider_address: { type: 'string' },
          provider_type: { type: 'string', enum: ['clinic', 'diagnostic_center', 'lab', 'hospital', 'other'] },
          provider_distance: { type: 'string' },
          provider_capacity: { type: 'string' },
          urgency: { type: 'string', enum: ['routine', 'soon', 'urgent'] },
          patient_name: { type: 'string' }
        },
        required: ['tests', 'reason', 'location']
      }
    },
    {
      type: 'function',
      name: 'handle_emergency',
      description: 'Activate deterministic emergency guidance immediately for urgent medical symptoms, imminent self-harm, overdose, active violence, fire, or other immediate danger.',
      parameters: {
        type: 'object',
        properties: {
          symptoms: { type: 'array', items: { type: 'string' } },
          severity: { type: 'string' },
          safety_context: {
            type: 'string',
            enum: ['medical_emergency', 'self_harm_imminent', 'suicide_imminent', 'overdose', 'violence_now', 'gbv_immediate', 'fire_emergency', 'immediate_danger']
          },
          location: { type: 'string' },
          landmark: { type: 'string' },
          audience: { type: 'string', enum: ['adult', 'family', 'child', 'older_person', 'person_with_disability', 'unknown'] },
          phone_type: { type: 'string', enum: ['mobile', 'landline', 'unknown'] }
        }
      }
    }
  ];

  const supportTools = [
    {
      type: 'function',
      name: 'find_support_services',
      description: 'Find real Johannesburg or Soweto support options from the verified directory after you have intelligently interpreted the caller\'s natural words and remembered context. Preserve every stated need and the most specific caller-stated location or landmark. Use for MES services, mental health, social support, shelter or safe-space navigation, women-and-children shelter, food or hygiene navigation, daytime community space, clinics, substance-use support, GBV, children and families, grants, documents, jobs, Zlto rewards, Mi-Change vouchers, legal help, or crisis routing. Never invent a destination.',
      parameters: {
        type: 'object',
        properties: {
          needs: {
            type: 'array',
            description: 'All needs the caller has stated, translated into these categories. Keep distinct needs distinct: safe tonight plus food must include shelter_navigation or safe_space_navigation AND food; coughing or needing a clinic is healthcare; a public place to sit during the day is daytime_community_space. Do not pass a raw safe site or safe place phrase: if its meaning is not clear, ask once whether the caller means tonight, a daytime public place, or danger now, then use the matching canonical category and retain their earlier location.',
            items: { type: 'string', enum: JOZI_SUPPORT_CATEGORIES }
          },
          service_type: { type: 'string', enum: JOZI_SUPPORT_CATEGORIES },
          mes_programme: { type: 'string', enum: ['overview', 'assessment_centre', 'ekhaya', 'ekuthuleni', 'impilo', 'grow'], description: 'Use only when the caller asks about MES generally or names one of these verified MES programmes. Choose overview for a general MES question; otherwise select the named programme so the directory can return its current verified facts.' },
          location: { type: 'string', description: 'The most specific suburb or area the caller stated anywhere in this call. Reuse it after follow-up questions. Omit this field if none was stated; never send unknown, not provided, N/A, or a guessed location.' },
          landmark: { type: 'string', description: 'The most specific caller-stated landmark remembered from any turn, such as Joubert Park. Preserve it even if the caller also said Johannesburg generally. Omit rather than guess.' },
          audience: { type: 'string', enum: ['adult', 'family', 'child', 'older_person', 'person_with_disability', 'unknown'], description: 'Use only what the caller stated. Never infer adult versus family versus child; use unknown when it has not been established.' },
          contact_mode: { type: 'string', enum: ['phone', 'in_person', 'online', 'either'] },
          safety_context: {
            type: 'string',
            enum: ['none', 'medical_emergency', 'self_harm_imminent', 'suicide_imminent', 'overdose', 'violence_now', 'gbv_immediate', 'fire_emergency', 'immediate_danger']
          },
          timing: { type: 'string', enum: ['now', 'today', 'tonight', 'routine'], description: 'When the caller needs the service. Preserve tonight across follow-up turns. Symptom timing does not mean the caller requested a doctor connection.' },
          safe_site_type: { type: 'string', enum: ['tonight', 'daytime', 'danger_now'], description: 'Use only after an unqualified safe-site clarification: tonight for overnight or shelter help, daytime for a public daytime community place, and danger_now for urgent danger. Retain the caller\'s earlier location and do not ask the same clarification again.' },
          coordination_preference: { type: 'string', enum: ['appointment_request', 'clinician_handoff', 'none'], description: 'For healthcare demos, reflect the action the caller actually requested or accepted. Default to none; do not infer clinician_handoff merely because symptoms are happening now.' },
          detail_requested: { type: 'string', enum: ['recommendation', 'phone', 'hours', 'address', 'directions'], description: 'Use the caller\'s current request so the verified response can give an exact phone number, hours, address, or directions without relying on model memory.' },
          safe_to_speak: { type: 'string', enum: ['yes', 'no', 'unknown'] },
          phone_type: { type: 'string', enum: ['mobile', 'landline', 'unknown'] },
          city_fallback_consent_confirmed: { type: 'boolean', description: 'Set true only when the caller clearly accepts the immediately preceding City-last-resort offer; set false when they clearly decline it so the line can continue to any remaining non-City need. Preserve the caller\'s earlier needs and location. Never set this on the first lookup.' },
          max_options: { type: 'integer', minimum: 1, maximum: 2 }
        },
        required: ['needs', 'safety_context']
      }
    },
    ...(demoEnabled ? [{
      type: 'function',
      name: 'coordinate_support_demo',
      description: 'Complete the selected demo phone connection, appointment, clinician handoff, availability check, intake request, assessment request, caring redirection, Zlto reward journey, or Mi-Change voucher pathway only after the caller answers the offer and clearly says yes. Set consent_confirmed true only for that explicit acceptance. Present the completed demo action positively; the tool response includes the required brief clarification that no external service was contacted.',
      parameters: {
        type: 'object',
        properties: {
          resource_id: { type: 'string' },
          action: {
            type: 'string',
            enum: ['phone_connection', 'appointment_request', 'clinician_handoff', 'availability_check', 'intake_request', 'navigator_handoff', 'warm_handoff', 'assessment_request', 'reward_signup', 'voucher_pathway']
          },
          requested_time: { type: 'string' },
          reason: { type: 'string' },
          consent_confirmed: { type: 'boolean' }
        },
        required: ['resource_id', 'action', 'consent_confirmed']
      }
    }] : [])
  ];

  const selfcareTools = [
    {
      type: 'function',
      name: 'eka_find_patient',
      description: "Look up patient record(s) in the clinical system by mobile number. Call with use_caller_number true first; if nothing is found, ask which mobile number the record is under and call again with phone. Returns every profile on that number — one number can hold a family. Verify the caller's identity before revealing anything it returns.",
      parameters: {
        type: 'object',
        properties: {
          phone: { type: 'string', description: 'Mobile number the caller says the record is under, in any common format (e.g. 082 000 0001 or +27 82 000 0001).' },
          use_caller_number: { type: 'boolean', description: 'True to search the number the caller is dialling from.' }
        }
      }
    },
    {
      type: 'function',
      name: 'eka_patient_context',
      description: 'Fetch recent clinical context (profile, recent visits, current medications) for ONE patient, only after the caller has confirmed who the call is about and verified their identity. Use the patient_ref returned by eka_find_patient.',
      parameters: {
        type: 'object',
        properties: {
          patient_ref: { type: 'string' },
          confirmed_name: { type: 'string', description: 'Name the caller just stated for this record.' },
          identity_verified: { type: 'boolean', description: 'True only after the caller stated a name that reasonably matches this selected record.' }
        },
        required: ['patient_ref', 'confirmed_name', 'identity_verified']
      }
    },
    {
      type: 'function',
      name: 'coordinate_selfcare_demo',
      description: 'Complete one simulated Self Care appointment, clinician handoff, or care-team callback only after the caller clearly accepts the offer. The result positively shows the demo state and then clarifies that no external action occurred.',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['appointment_request', 'clinician_handoff', 'care_team_callback'] },
          requested_time: { type: 'string' },
          reason: { type: 'string' },
          consent_confirmed: { type: 'boolean' }
        },
        required: ['action', 'consent_confirmed']
      }
    }
  ];

  const normalized = normalizeServiceMode(mode);
  if (normalized === 'health') return healthTools;
  const emergencyTool = healthTools.find((tool) => tool.name === 'handle_emergency');
  const assessmentTool = healthTools.find((tool) => tool.name === 'health_assessment');
  const providerTool = healthTools.find((tool) => tool.name === 'find_clinics');
  if (normalized === 'selfcare') return [assessmentTool, emergencyTool, providerTool, ...selfcareTools];
  if (normalized === 'jozi') return [emergencyTool, ...supportTools];
  return [assessmentTool, emergencyTool, ...supportTools];
}

async function resolveProviderOptions(env, args = {}) {
  const location = normalizeOptionalText(args.location || args.pickup_location || args.address || args.city);
  const items = normalizeList(args.items || args.commodities || args.supplies);
  const tests = normalizeList(args.tests || args.test || args.test_name);
  const need = normalizeOptionalText(args.need || args.reason) ||
    [...items, ...tests].join(', ') ||
    'healthcare access';
  const providerType = normalizeProviderType(args.provider_type, items.length ? 'pharmacy' : tests.length ? 'clinic' : 'clinic');
  const timeoutMs = Math.min(numericEnv(env.PROVIDER_LOOKUP_TIMEOUT_MS, DEFAULT_PROVIDER_LOOKUP_TIMEOUT_MS), 7000);

  if (!location || isVagueLocation(location)) {
    return providerLookupResult({
      success: false,
      error: 'more_specific_location_required',
      location: location || '',
      need,
      providerType,
      timeoutMs,
      voiceResponse: 'I need a more specific city, neighborhood, landmark, or address before I can suggest nearby options.'
    });
  }

  const providedOptions = normalizeProviderOptions(args.options, location, providerType);
  if (providedOptions.length) {
    return providerLookupResult({
      success: true,
      location,
      need,
      providerType,
      timeoutMs,
      options: providedOptions,
      source: 'tool_arguments'
    });
  }

  if (!env.OPENAI_API_KEY) {
    return providerLookupResult({
      success: false,
      error: 'provider_lookup_unavailable',
      location,
      need,
      providerType,
      timeoutMs,
      voiceResponse: 'I cannot identify a specific nearby option quickly right now. Please share a more precise location, or use the nearest licensed clinic or pharmacy and confirm before travel.'
    });
  }

  const started = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort('provider_lookup_timeout'), timeoutMs);
  const model = env.OPENAI_PROVIDER_MODEL || DEFAULT_PROVIDER_MODEL;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: [
              'Return strict JSON for a healthcare voice-agent provider lookup.',
              'Use general model knowledge only. Do not claim live search, live availability, current hours, or verified capacity.',
              'Find 2-3 real-world plausible named options near the supplied location for the care need.',
              'Each option must include name, address, type, distance, reason, capacity, and nextAction.',
              'Do not use placeholders such as "nearby pharmacy", "specific clinic not provided", or "AI suggested".',
              'If the location is too vague to name plausible providers, return {"options":[],"needsMoreLocation":true}.',
              'Keep output concise.'
            ].join('\n')
          },
          {
            role: 'user',
            content: JSON.stringify({
              location,
              need,
              providerType,
              urgency: args.urgency || 'routine',
              items,
              tests
            })
          }
        ]
      })
    });
    clearTimeout(timeout);

    const elapsedMs = Date.now() - started;
    if (!response.ok) {
      return providerLookupResult({
        success: false,
        error: 'provider_lookup_failed',
        status: response.status,
        location,
        need,
        providerType,
        timeoutMs,
        elapsedMs,
        voiceResponse: 'I could not identify a specific option quickly. Please share a more precise location or use the nearest licensed provider and confirm before travel.'
      });
    }

    const body = await response.json();
    const parsed = parseJsonObject(contentToText(body?.choices?.[0]?.message?.content));
    const options = normalizeProviderOptions(parsed?.options || parsed?.providers, location, providerType);
    if (!options.length) {
      return providerLookupResult({
        success: false,
        error: parsed?.needsMoreLocation ? 'more_specific_location_required' : 'provider_lookup_no_options',
        location,
        need,
        providerType,
        timeoutMs,
        elapsedMs,
        voiceResponse: 'I could not identify a specific nearby option quickly. Please give me a more specific neighborhood, landmark, or address.'
      });
    }

    return providerLookupResult({
      success: true,
      location,
      need,
      providerType,
      timeoutMs,
      elapsedMs,
      source: model,
      options
    });
  } catch (error) {
    clearTimeout(timeout);
    const elapsedMs = Date.now() - started;
    const timedOut = error?.name === 'AbortError' || String(error?.message || error).includes('provider_lookup_timeout');
    return providerLookupResult({
      success: false,
      error: timedOut ? 'provider_lookup_timeout' : 'provider_lookup_error',
      location,
      need,
      providerType,
      timeoutMs,
      elapsedMs,
      voiceResponse: timedOut
        ? 'I could not identify a specific option quickly enough. Please give me a more precise location, or use the nearest licensed provider and confirm before travel.'
        : 'I could not identify a specific option quickly. Please share a more precise location or use the nearest licensed provider and confirm before travel.'
    });
  }
}

async function requestCommodityPickup(env, args) {
  const items = normalizeList(args.items || args.commodities || args.supplies);
  const location = args.pickup_location || args.location || 'your area';
  let providerName = cleanProviderName(args.provider_name);
  let providerAddress = cleanProviderAddress(args.provider_address);
  let providerOptions = [];
  let providerLookup = null;

  if (!providerName || !providerAddress) {
    providerLookup = await resolveProviderOptions(env, {
      ...args,
      need: args.reason || `${items.join(', ') || 'medicine'} pickup`,
      provider_type: args.provider_type || 'pharmacy',
      items,
      location
    });
    providerOptions = providerLookup.options || [];
    const selected = providerOptions[0];
    providerName = selected?.name || '';
    providerAddress = selected?.address || '';
  }

  if (!providerName || !providerAddress) {
    return {
      success: false,
      error: providerLookup?.error || 'specific_provider_required',
      missing: [
        !providerName ? 'provider_name' : '',
        !providerAddress ? 'provider_address' : ''
      ].filter(Boolean),
      simulation: true,
      provider_lookup: providerLookup || null,
      voiceResponse: providerLookup?.voiceResponse ||
        'I need a more specific city, neighborhood, landmark, or address so I can simulate a named nearby pickup location.'
    };
  }

  const pickupNumber = generateId('PICK');
  const selectedProvider = providerOptions[0] || {};
  const provider = {
    id: selectedProvider.id || generateId('PHARM'),
    name: providerName,
    address: providerAddress,
    capacity: selectedProvider.capacity || `${items[0] || 'medicine'} pickup and refill review`,
    type: selectedProvider.type || args.provider_type || 'pharmacy',
    distance: selectedProvider.distance || args.provider_distance || 'nearby',
    reason: selectedProvider.reason || '',
    nextAvailable: args.urgency === 'urgent' ? 'today if available' : 'same or next business day if available',
    simulation_notice: 'Simulated provider routing for demo use; not a live verified search result.'
  };

  return {
    success: true,
    simulation: true,
    test_mode: true,
    pickup_number: pickupNumber,
    items,
    reason: args.reason || 'Commodity pickup request',
    eligibility_basis: args.eligibility_basis || '',
    remaining_supply: args.remaining_supply || '',
    urgency: args.urgency || 'routine',
    provider,
    provider_options: providerOptions,
    provider_lookup: providerLookup,
    pickup: {
      location: `${provider.name}, ${provider.address}`,
      status: 'simulated_request',
      instructions: 'Simulation only. Confirm availability, eligibility, cost, and clinical appropriateness with the pickup location before dispensing.',
      simulation_notice: 'This pharmacy or clinic assignment and pickup number are simulated for this demo.'
    },
    nextAction: `Go to ${provider.name} at ${provider.address}. Bring simulated pickup number ${pickupNumber} and confirm availability before travel.`,
    voiceResponse: `This is a simulation. I created pickup number ${pickupNumber}. Go to ${provider.name}, about ${provider.distance} away at ${provider.address}, and confirm availability before pickup.`
  };
}

async function requestTest(env, args) {
  const tests = normalizeList(args.tests || args.test || args.test_name);
  const location = args.location || 'your area';
  const primaryTest = tests[0] || 'recommended test';
  let providerName = cleanProviderName(args.provider_name);
  let providerAddress = cleanProviderAddress(args.provider_address);
  let providerOptions = [];
  let providerLookup = null;

  if (!providerName || !providerAddress) {
    providerLookup = await resolveProviderOptions(env, {
      ...args,
      need: args.reason || `${tests.join(', ') || 'diagnostic'} testing`,
      provider_type: args.provider_type || 'clinic',
      tests,
      location
    });
    providerOptions = providerLookup.options || [];
    const selected = providerOptions[0];
    providerName = selected?.name || '';
    providerAddress = selected?.address || '';
  }

  if (!providerName || !providerAddress) {
    return {
      success: false,
      error: providerLookup?.error || 'specific_provider_required',
      missing: [
        !providerName ? 'provider_name' : '',
        !providerAddress ? 'provider_address' : ''
      ].filter(Boolean),
      simulation: true,
      provider_lookup: providerLookup || null,
      voiceResponse: providerLookup?.voiceResponse ||
        'I need a more specific city, neighborhood, landmark, or address so I can simulate a named nearby testing location.'
    };
  }

  const testRequestId = generateId('TEST');
  const selectedProvider = providerOptions[0] || {};
  const provider = {
    id: selectedProvider.id || generateId('CLINIC'),
    name: providerName,
    address: providerAddress,
    capacity: selectedProvider.capacity || args.provider_capacity || `${primaryTest} testing`,
    type: selectedProvider.type || args.provider_type || 'clinic',
    distance: selectedProvider.distance || args.provider_distance || 'nearby',
    reason: selectedProvider.reason || '',
    nextAvailable: args.urgency === 'urgent' ? 'today if available' : 'next available',
    simulation_notice: 'Simulated provider routing for demo use; not a live verified search result.'
  };

  return {
    success: true,
    simulation: true,
    test_mode: true,
    test_request_id: testRequestId,
    tests,
    reason: args.reason || 'Diagnostic testing request',
    urgency: args.urgency || 'routine',
    provider,
    provider_options: providerOptions,
    provider_lookup: providerLookup,
    instructions: 'Simulation only. Confirm testing capacity, eligibility, cost, hours, and sample requirements with the provider.',
    nextAction: `Go to ${provider.name} at ${provider.address}. Bring simulated test request ${testRequestId} and confirm hours, cost, and sample requirements before travel.`,
    voiceResponse: `This is a simulation. I created test request ${testRequestId}. Go to ${provider.name}, about ${provider.distance} away at ${provider.address}, and confirm hours and sample requirements before travel.`
  };
}

async function sendTwilioMessage(env, phone, message) {
  const from = env.TWILIO_WHATSAPP_NUMBER || env.TWILIO_SMS_NUMBER;
  const serviceSid = env.TWILIO_MESSAGING_SERVICE_SID;
  if (!from && !serviceSid) return false;

  const to = from?.startsWith('whatsapp:') ? asWhatsApp(phone) : asE164(phone);
  const params = serviceSid
    ? { MessagingServiceSid: serviceSid, To: to, Body: message }
    : { From: from, To: to, Body: message };

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams(params)
  });

  return response.ok;
}

async function sendSignalWireMessage(env, phone, message) {
  if (!env.SIGNALWIRE_SMS_FROM) return false;
  const response = await fetch(`https://${env.SIGNALWIRE_SPACE}/api/laml/2010-04-01/Accounts/${env.SIGNALWIRE_PROJECT_ID}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${env.SIGNALWIRE_PROJECT_ID}:${env.SIGNALWIRE_TOKEN}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      From: env.SIGNALWIRE_SMS_FROM,
      To: asE164(phone),
      Body: message
    })
  });
  return response.ok;
}

function buildCallArtifacts(messages) {
  const artifacts = {
    assessments: [],
    clinicSearches: [],
    appointments: [],
    referrals: [],
    commodityPickups: [],
    testRequests: [],
    emergencies: [],
    supportLookups: [],
    supportCoordinations: []
  };

  for (const message of messages) {
    if (message.role !== 'system') continue;
    const text = String(message.text || '');
    pushParsedArtifact(artifacts.assessments, text, 'Health assessment:');
    pushParsedArtifact(artifacts.clinicSearches, text, 'Clinic search:');
    pushParsedArtifact(artifacts.appointments, text, 'Appointment booked:');
    pushParsedArtifact(artifacts.referrals, text, 'Referral created:');
    pushParsedArtifact(artifacts.commodityPickups, text, 'Commodity pickup requested:');
    pushParsedArtifact(artifacts.commodityPickups, text, 'Commodity pickup generated after call:');
    pushParsedArtifact(artifacts.testRequests, text, 'Test request created:');
    pushParsedArtifact(artifacts.testRequests, text, 'Test request generated after call:');
    pushParsedArtifact(artifacts.emergencies, text, 'Emergency protocol:');
    pushParsedArtifact(artifacts.supportLookups, text, 'Jozi support options resolved:');
    pushParsedArtifact(artifacts.supportCoordinations, text, 'Jozi demo coordination:');
  }

  return artifacts;
}

function pushParsedArtifact(target, text, prefix) {
  if (!text.startsWith(prefix)) return;
  const parsed = parseJsonObject(text.slice(prefix.length).trim());
  if (parsed) target.push(parsed);
}

function buildReferences(artifacts) {
  return [
    ...artifacts.appointments.map((item) => ({
      type: 'appointment',
      id: item.confirmation_number,
      label: 'Appointment',
      detail: item.appointment || item
    })),
    ...artifacts.referrals.map((item) => ({
      type: 'referral',
      id: item.referral_id,
      label: 'Referral',
      detail: item.details || item
    })),
    ...artifacts.commodityPickups.map((item) => ({
      type: 'commodity_pickup',
      id: item.pickup_number,
      label: 'Commodity pickup',
      detail: {
        items: item.items || [],
        reason: item.reason || '',
        eligibilityBasis: item.eligibility_basis || item.eligibilityBasis || '',
        remainingSupply: item.remaining_supply || item.remainingSupply || '',
        urgency: item.urgency || '',
        provider: item.provider || {},
        pickup: item.pickup || {},
        simulation: Boolean(item.simulation),
        nextAction: item.nextAction || ''
      }
    })),
    ...artifacts.testRequests.map((item) => ({
      type: 'test_request',
      id: item.test_request_id,
      label: 'Test request',
      detail: {
        tests: item.tests || [],
        reason: item.reason || '',
        urgency: item.urgency || '',
        provider: item.provider || {},
        simulation: Boolean(item.simulation),
        nextAction: item.nextAction || item.instructions || ''
      }
    })),
    ...(artifacts.supportLookups || []).flatMap((item) => (item.options || []).map((resource) => ({
      type: 'community_resource',
      id: resource.id,
      label: resource.name || 'Community support',
      detail: {
        resource,
        directory: item.directory || 'jozi_curated_public_sources',
        sourceCheckedAt: resource.source_checked_at || '',
        availabilityConfirmed: false
      }
    }))),
    ...(artifacts.supportCoordinations || []).filter((item) => item.reference_id).map((item) => ({
      type: 'demo_support_coordination',
      id: item.reference_id,
      label: 'Demo support coordination',
      detail: {
        action: item.action || '',
        resource: item.resource || {},
        simulation: true,
        submitted: false,
        confirmed: false
      }
    }))
  ].filter((item) => item.id);
}

function joziSafeActivity(artifacts) {
  return {
    directoryLookups: (artifacts.supportLookups || []).length,
    demoActions: (artifacts.supportCoordinations || []).length
  };
}

function ensureGeneratedReferences(summaries, artifacts) {
  if (summaries.commodityPickupNeeded && artifacts.commodityPickups.length === 0) {
    summaries.providerFollowupNeeded = true;
    summaries.providerFollowupReason = summaries.providerFollowupReason === 'none' ? 'commodities' : summaries.providerFollowupReason;
    appendReferenceLine(
      summaries,
      'Refill or pickup was discussed, but no simulated pickup number was generated because eligibility/location details were incomplete during the call.'
    );
  }

  if (summaries.testNeeded && artifacts.testRequests.length === 0) {
    summaries.providerFollowupNeeded = true;
    summaries.providerFollowupReason = summaries.providerFollowupReason === 'none' ? 'test' : summaries.providerFollowupReason;
    appendReferenceLine(
      summaries,
      'Testing was discussed, but no simulated test request ID was generated because provider/location details were incomplete during the call.'
    );
  }
}

function appendReferenceLine(summaries, line) {
  if (!line) return;
  summaries.patientSummary = `${summaries.patientSummary}\n${line}`;
  if (summaries.providerSummary) summaries.providerSummary = `${summaries.providerSummary}\n${line}`;
}

function normalizeSummaries(parsed, messages, artifacts) {
  const fallback = fallbackSummaries(messages, artifacts);
  if (!parsed || typeof parsed !== 'object') return fallback;

  const providerFollowupNeeded = Boolean(parsed.providerFollowupNeeded) ||
    Boolean(parsed.commodityPickupNeeded) ||
    Boolean(parsed.testNeeded) ||
    hasCareCoordinationArtifacts(artifacts);
  const providerSummary = normalizeOptionalText(parsed.providerSummary);

  return {
    patientSummary: normalizeRequiredText(parsed.patientSummary, fallback.patientSummary),
    providerSummary: providerFollowupNeeded
      ? (providerSummary || fallback.providerSummary || 'Provider follow-up requested. Review transcript and generated references.')
      : null,
    providerFollowupNeeded,
    providerFollowupReason: normalizeEnum(
      parsed.providerFollowupReason,
      ['none', 'referral', 'follow_up', 'appointment', 'test', 'commodities', 'urgent', 'mixed'],
      providerFollowupNeeded
        ? (parsed.testNeeded ? 'test' : parsed.commodityPickupNeeded ? 'commodities' : inferProviderReason(artifacts))
        : 'none'
    ),
    caseType: normalizeEnum(
      parsed.caseType,
      ['simple_acute', 'simple_chronic', 'urgent', 'administrative', 'unknown'],
      fallback.caseType
    ),
    languageUsed: normalizeLanguageHint(parsed.languageUsed) || fallback.languageUsed,
    commodityPickupNeeded: Boolean(parsed.commodityPickupNeeded),
    commodityItems: normalizeList(parsed.commodityItems),
    testNeeded: Boolean(parsed.testNeeded),
    testNames: normalizeList(parsed.testNames)
  };
}

function fallbackSummaries(messages, artifacts) {
  const lastPatient = [...messages].reverse().find((message) => message.role === 'patient');
  const references = buildReferences(artifacts);
  const referenceLines = references.map(referenceLine);
  const providerFollowupNeeded = hasCareCoordinationArtifacts(artifacts);
  const patientSummary = [
    'Call summary: Discussed symptoms and next steps.',
    `Patient said: "${(lastPatient?.text || 'N/A').slice(0, 120)}".`,
    ...referenceLines,
    'If symptoms worsen or red flags appear, seek care urgently.'
  ].join('\n');

  return {
    patientSummary,
    providerSummary: providerFollowupNeeded
      ? [
          'Provider note: Patient completed an AI-assisted health guidance call.',
          `Latest patient concern: ${(lastPatient?.text || 'N/A').slice(0, 180)}.`,
          ...referenceLines
        ].join('\n')
      : null,
    providerFollowupNeeded,
    providerFollowupReason: providerFollowupNeeded ? inferProviderReason(artifacts) : 'none',
    caseType: artifacts.emergencies.length ? 'urgent' : 'unknown',
    languageUsed: inferLanguageHintFromMessages(messages) || 'unknown',
    commodityPickupNeeded: false,
    commodityItems: [],
    testNeeded: false,
    testNames: []
  };
}

function joziFallbackSummaries(artifacts) {
  const references = buildReferences(artifacts);
  const resourceNames = references
    .filter((reference) => reference.type === 'community_resource')
    .map((reference) => reference.label)
    .filter((value, index, values) => values.indexOf(value) === index)
    .slice(0, 4);
  const urgent = Boolean(artifacts.emergencies?.length);
  return {
    patientSummary: resourceNames.length
      ? `Jozi support call completed. Public-source options discussed: ${resourceNames.join(', ')}. Availability was not confirmed.`
      : 'Jozi support call completed. No raw caller details were retained.',
    providerSummary: null,
    providerFollowupNeeded: false,
    providerFollowupReason: urgent ? 'urgent' : 'none',
    caseType: urgent ? 'crisis_support' : 'community_support',
    languageUsed: 'unknown',
    commodityPickupNeeded: false,
    commodityItems: [],
    testNeeded: false,
    testNames: []
  };
}

async function readCallerMemory(env, phone) {
  if (!env.TRANSCRIPTS || !isUsablePatientPhone(phone)) return null;
  try {
    return await env.TRANSCRIPTS.get(await callerMemoryKey(phone), 'json');
  } catch {
    return null;
  }
}

async function listTranscriptRecords(env, maxTranscripts = 100) {
  const keys = [];
  let cursor;
  do {
    const listing = await env.TRANSCRIPTS.list({
      prefix: 'transcripts/',
      limit: Math.min(1000, Math.max(1, maxTranscripts - keys.length)),
      cursor
    });
    keys.push(...listing.keys);
    cursor = listing.list_complete === false ? listing.cursor : null;
  } while (cursor && keys.length < maxTranscripts);

  const sortedKeys = keys
    .filter((entry) => entry.name.endsWith('.json'))
    .sort((left, right) => String(left.metadata?.completedAt || '').localeCompare(String(right.metadata?.completedAt || '')))
    .slice(0, maxTranscripts);

  const transcripts = [];
  for (const entry of sortedKeys) {
    const transcript = await env.TRANSCRIPTS.get(entry.name, 'json');
    if (transcript) transcripts.push(transcript);
  }
  return transcripts;
}

async function writeCallerMemory(env, phone, memory) {
  const key = await callerMemoryKey(phone);
  await env.TRANSCRIPTS.put(key, JSON.stringify(memory, null, 2), {
    ...callerMemoryPutOptions(env),
    metadata: {
      updatedAt: memory.updatedAt,
      callCount: memory.callCount,
      lastCallId: memory.lastCallId
    }
  });
  return key;
}

async function generateCallerMemoryRecord(env, input) {
  const phone = asE164(input.phone || '');
  const existing = input.existing || null;
  const summaries = input.summaries || {};
  const messages = Array.isArray(input.messages) ? input.messages : [];
  const artifacts = input.artifacts || buildCallArtifacts(messages);
  const phoneHash = await sha256Hex(phone);
  const now = new Date().toISOString();
  const currentRestrictedCategories = detectRestrictedCategories(JSON.stringify({ summaries, messages, artifacts }));
  const currentLanguage = normalizeLanguageHint(summaries.languageUsed) || inferLanguageHintFromMessages(messages);
  const base = {
    version: 1,
    phoneHash,
    updatedAt: now,
    callCount: Number(existing?.callCount || 0) + 1,
    lastCallId: input.callId || null,
    lastCallAt: input.completedAt || now,
    identityConfidence: 'phone_number_only',
    sharedPhoneWarning: 'This memory is linked to a phone number only. It may represent multiple people and must not be treated as confirmed identity.',
    preferredLanguage: normalizeLanguageHint(existing?.preferredLanguage) || '',
    lastLanguageUsed: currentLanguage || normalizeLanguageHint(existing?.lastLanguageUsed) || '',
    profiles: normalizeMemoryProfiles(existing?.profiles || []),
    householdSafeContext: normalizeOptionalText(existing?.householdSafeContext) || '',
    restrictedMemoryPresent: Boolean(existing?.restrictedMemoryPresent) || currentRestrictedCategories.length > 0,
    restrictedCategories: uniqueStrings([
      ...normalizeList(existing?.restrictedCategories),
      ...currentRestrictedCategories
    ])
  };

  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) return fallbackCallerMemory(base, summaries);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: env.OPENAI_MEMORY_MODEL || env.OPENAI_SUMMARY_MODEL || DEFAULT_MEMORY_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: [
            'Update phone-level memory for a healthcare voice agent.',
            'This is a consolidated memory refresh after every call. Merge the current call into the existing memory; do not append a timeline or duplicate old facts.',
            'Edit existing profile records in place when the current call matches a known generic profile.',
            'Insert a new generic profile record when the current call appears to be for a different person using the same phone number.',
            'Organize profiles by stable profileId and concise non-sensitive profileLabel. Keep related continuity items under the right profile.',
            'Preserve stable non-sensitive chronic or continuity flags when still relevant. Refresh stale open items, close resolved items, and keep only the most useful current facts.',
            'A phone number may be shared by multiple people. Maintain a small list of safe household profiles, not a single patient identity.',
            'Return strict JSON only with keys: preferredLanguage, lastLanguageUsed, householdSafeContext, profiles, restrictedMemoryPresent, restrictedCategories.',
            'preferredLanguage: the safest language hint for future calls from this phone, such as English, Spanish, French, Haitian Creole, Swahili, or blank if unknown. It may come from the latest call or stable previous calls.',
            'lastLanguageUsed: the main language used in the current call, or blank if unknown.',
            'Do not infer ethnicity, nationality, migration status, or sensitive identity from language.',
            'profiles must be an array of up to 5 objects with keys: profileId, profileLabel, preferredLanguage, safeForVoiceContext, safeContinuityItems, openItems, carePreferences, restrictedMemoryPresent, restrictedCategories.',
            'profileLabel must be generic and non-sensitive, such as "adult caller", "caregiver for child", or "older adult"; do not use diagnoses, medicines, abuse history, sexual history, HIV/STI status, pregnancy details, or mental health crisis as labels.',
            'profile preferredLanguage should be blank unless the language preference clearly belongs to that generic profile.',
            'safeForVoiceContext and safeContinuityItems may contain only information safe to quietly use if someone from this number calls again.',
            'Do not put gender-based violence, domestic violence, sexual assault, abuse, HIV/STI details, reproductive history, mental health crisis, substance use, legal risk, or stigmatizing information in safeForVoiceContext, safeContinuityItems, openItems, carePreferences, or householdSafeContext.',
            'If sensitive information occurred, mark restrictedMemoryPresent true and use only generic restrictedCategories such as "safety-sensitive" or "sexual-health-sensitive". Do not include details.',
            'If the current call is mainly sensitive and no safe continuity exists, leave safe context empty.',
            'Do not store raw transcript quotes. Keep all fields concise.'
          ].join('\n')
        },
        {
          role: 'user',
          content: [
            `Existing phone-level memory:\n${JSON.stringify(existing || null, null, 2)}`,
            `Current call summaries:\n${JSON.stringify(summaries, null, 2)}`,
            `Current call generated references:\n${JSON.stringify(buildReferences(artifacts), null, 2)}`,
            `Current call transcript:\n${JSON.stringify(messages, null, 2)}`
          ].join('\n\n')
        }
      ]
    })
  });

  if (!response.ok) return fallbackCallerMemory(base, summaries);
  const body = await response.json();
  const parsed = parseJsonObject(contentToText(body?.choices?.[0]?.message?.content));
  return normalizeCallerMemory(parsed, base);
}

function transcriptToSummaries(transcript, artifacts) {
  return {
    patientSummary: transcript.patientSummary || transcript.summary || '',
    providerSummary: transcript.providerSummary || null,
    providerFollowupNeeded: Boolean(transcript.providerFollowupNeeded) || hasCareCoordinationArtifacts(artifacts),
    providerFollowupReason: transcript.providerFollowupReason || inferProviderReason(artifacts),
    caseType: transcript.caseType || 'unknown',
    languageUsed: normalizeLanguageHint(transcript.languageUsed) || inferLanguageHintFromMessages(transcript.messages || []),
    commodityPickupNeeded: Boolean(artifacts.commodityPickups?.length),
    commodityItems: artifacts.commodityPickups?.flatMap((item) => item.items || []) || [],
    testNeeded: Boolean(artifacts.testRequests?.length),
    testNames: artifacts.testRequests?.flatMap((item) => item.tests || []) || []
  };
}

async function callerMemoryKey(phone) {
  return `${CALLER_MEMORY_PREFIX}${await sha256Hex(asE164(phone))}.json`;
}

function callerMemoryEnabled(env) {
  return String(env.CALLER_MEMORY_ENABLED || 'true').toLowerCase() !== 'false';
}

function configuredServiceMode(env) {
  return normalizeServiceMode(env.SERVICE_MODE || 'health');
}

function configuredOpenAIVoiceApi(env) {
  return normalizeOpenAIVoiceApi(env.OPENAI_VOICE_API || 'live');
}

function joziDemoEnabled(env) {
  return String(env.JOZI_DEMO_MODE || 'false').toLowerCase() === 'true';
}

function realtimeVoiceForMode(env, serviceMode) {
  if (modeIncludesJozi(serviceMode)) return env.JOZI_REALTIME_VOICE || 'marin';
  if (normalizeServiceMode(serviceMode) === 'selfcare') {
    return env.SELFCARE_REALTIME_VOICE || env.OPENAI_REALTIME_VOICE || DEFAULT_VOICE;
  }
  return env.OPENAI_REALTIME_VOICE || DEFAULT_VOICE;
}

function joziLineEnabled(env) {
  return String(env.JOZI_LINE_ENABLED || 'false').toLowerCase() === 'true';
}

function healthLineEnabled(env) {
  return String(env.HEALTH_LINE_ENABLED || 'true').toLowerCase() !== 'false';
}

function selfcareLineEnabled(env) {
  return String(env.SELFCARE_LINE_ENABLED || 'false').toLowerCase() === 'true';
}

function lineModeEnabled(env, mode) {
  const normalized = normalizeServiceMode(mode);
  if (normalized === 'health') return healthLineEnabled(env);
  if (normalized === 'jozi') return joziLineEnabled(env);
  if (normalized === 'selfcare') return selfcareLineEnabled(env);
  return false;
}

function activeLineConfigurationIsValid(env) {
  const numbers = [];
  if (healthLineEnabled(env)) numbers.push(asE164(env.HEALTH_PHONE_NUMBER || ''));
  if (joziLineEnabled(env)) numbers.push(asE164(env.JOZI_PHONE_NUMBER || ''));
  if (selfcareLineEnabled(env)) numbers.push(asE164(env.SELFCARE_PHONE_NUMBER || ''));
  return numbers.length > 0 && numbers.every(Boolean) && new Set(numbers).size === numbers.length;
}

function optionalLiveServiceTier(value) {
  const tier = String(value || '').trim().toLowerCase();
  return ['auto', 'default', 'flex', 'priority'].includes(tier) ? tier : undefined;
}

/* The Self Care demo Worker owns the Eka credentials and the demo timeline; this Worker only
   holds a bearer token for its bridge. Short timeout — a voice turn cannot wait long. */
const DEFAULT_SELFCARE_BRIDGE_TIMEOUT_MS = 3500;
async function selfcareBridgeRequest(env, path, options = {}) {
  if (!env.SELFCARE_BRIDGE_URL || !env.SELFCARE_BRIDGE_TOKEN) {
    return { ok: false, error: 'bridge not configured' };
  }
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort('timeout'),
    numericEnv(env.SELFCARE_BRIDGE_TIMEOUT_MS, DEFAULT_SELFCARE_BRIDGE_TIMEOUT_MS)
  );
  try {
    const response = await fetch(String(env.SELFCARE_BRIDGE_URL).replace(/\/$/, '') + path, {
      method: options.method || 'GET',
      headers: {
        Authorization: `Bearer ${env.SELFCARE_BRIDGE_TOKEN}`,
        ...(options.body ? { 'Content-Type': 'application/json' } : {})
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, error: `bridge ${response.status}`, data };
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: String(error?.message || error).slice(0, 200) };
  } finally {
    clearTimeout(timer);
  }
}

function callerMemoryAllowed(env, serviceMode = configuredServiceMode(env)) {
  return callerMemoryEnabled(env) && serviceModePolicy(serviceMode).callerMemory;
}

function toolAllowedForMode(mode, toolName, demoEnabled) {
  return realtimeTools(mode, demoEnabled).some((tool) => tool.name === toolName);
}

function inferJoziSafetyContext(args = {}) {
  const text = [...(args.symptoms || []), args.severity || ''].join(' ').toLowerCase();
  if (/suicid|self[-\s]?harm|cannot stay safe|can'?t stay safe/.test(text)) return 'self_harm_imminent';
  if (/overdose|unresponsive|not breathing/.test(text)) return 'overdose';
  if (/fire|smoke|burning building/.test(text)) return 'fire_emergency';
  if (/violence|attacking|weapon|gun|knife|threat/.test(text)) return 'violence_now';
  return 'medical_emergency';
}

function callerMemoryPutOptions(env) {
  const days = optionalPositiveNumber(env.CALLER_MEMORY_TTL_DAYS);
  return days ? { expirationTtl: Math.round(days * 24 * 60 * 60) } : {};
}

function buildVoiceSafeMemoryContext(memory) {
  if (!memory || typeof memory !== 'object') return null;
  const preferredLanguage = normalizeLanguageHint(memory.preferredLanguage);
  const lastLanguageUsed = normalizeLanguageHint(memory.lastLanguageUsed);
  const householdSafeContext = sanitizeMemoryText(memory.householdSafeContext, 500);
  const profiles = normalizeMemoryProfiles(memory.profiles || [])
    .filter((profile) => profile.safeForVoiceContext ||
      profile.preferredLanguage ||
      profile.safeContinuityItems.length ||
      profile.openItems.length ||
      profile.carePreferences.length)
    .slice(0, 5);

  if (!preferredLanguage && !lastLanguageUsed && !householdSafeContext && profiles.length === 0) return null;
  return {
    updatedAt: memory.updatedAt || null,
    callCount: Number(memory.callCount || 0),
    identityConfidence: 'phone_number_only',
    preferredLanguage,
    lastLanguageUsed,
    householdSafeContext,
    profiles
  };
}

function normalizeCallerMemory(parsed, base) {
  const source = parsed && typeof parsed === 'object' ? parsed : {};
  const sourceHasProfiles = Array.isArray(source.profiles);
  const sourceHasHouseholdContext = Object.prototype.hasOwnProperty.call(source, 'householdSafeContext');
  const profiles = normalizeMemoryProfiles(sourceHasProfiles ? source.profiles : (base.profiles || [])).slice(0, 5);
  const rawText = JSON.stringify(source);
  const detectedRestricted = detectRestrictedCategories(rawText);
  const restrictedCategories = uniqueStrings([
    ...normalizeList(base.restrictedCategories).map(normalizeRestrictedCategory),
    ...normalizeList(source.restrictedCategories).map(normalizeRestrictedCategory),
    ...detectedRestricted,
    ...profiles.flatMap((profile) => profile.restrictedCategories)
  ]).filter(Boolean);

  return {
    ...base,
    preferredLanguage: normalizeLanguageHint(source.preferredLanguage) ||
      normalizeLanguageHint(source.lastLanguageUsed) ||
      base.preferredLanguage,
    lastLanguageUsed: normalizeLanguageHint(source.lastLanguageUsed) ||
      base.lastLanguageUsed,
    householdSafeContext: sanitizeMemoryText(
      sourceHasHouseholdContext ? source.householdSafeContext : base.householdSafeContext,
      500
    ),
    profiles,
    restrictedMemoryPresent: Boolean(source.restrictedMemoryPresent) ||
      Boolean(base.restrictedMemoryPresent) ||
      restrictedCategories.length > 0 ||
      profiles.some((profile) => profile.restrictedMemoryPresent),
    restrictedCategories
  };
}

function normalizeMemoryProfiles(profiles) {
  return (Array.isArray(profiles) ? profiles : [])
    .map((profile, index) => normalizeMemoryProfile(profile, index))
    .filter(Boolean);
}

function normalizeMemoryProfile(profile, index) {
  if (!profile || typeof profile !== 'object') return null;
  const rawText = JSON.stringify(profile);
  const detectedRestricted = detectRestrictedCategories(rawText);
  const restrictedCategories = uniqueStrings([
    ...normalizeList(profile.restrictedCategories).map(normalizeRestrictedCategory),
    ...detectedRestricted
  ]).filter(Boolean);
  const profileId = sanitizeProfileId(profile.profileId) || `profile_${index + 1}`;
  const profileLabel = sanitizeMemoryText(profile.profileLabel, 80) || `profile ${index + 1}`;

  return {
    profileId,
    profileLabel,
    preferredLanguage: normalizeLanguageHint(profile.preferredLanguage),
    safeForVoiceContext: sanitizeMemoryText(profile.safeForVoiceContext, 500),
    safeContinuityItems: sanitizeMemoryList(profile.safeContinuityItems, 5, 160),
    openItems: sanitizeMemoryList(profile.openItems, 5, 160),
    carePreferences: sanitizeMemoryList(profile.carePreferences, 5, 120),
    restrictedMemoryPresent: Boolean(profile.restrictedMemoryPresent) || restrictedCategories.length > 0,
    restrictedCategories
  };
}

function fallbackCallerMemory(base, summaries) {
  const restrictedCategories = detectRestrictedCategories(JSON.stringify(summaries || {}));
  const safeForVoiceContext = sanitizeMemoryText(
    summaries?.caseType === 'administrative' ? summaries.patientSummary : '',
    300
  );
  const profiles = safeForVoiceContext
    ? [
        ...normalizeMemoryProfiles(base.profiles || []),
        {
          profileId: `profile_${normalizeMemoryProfiles(base.profiles || []).length + 1}`,
          profileLabel: 'caller profile',
          safeForVoiceContext,
          safeContinuityItems: [],
          openItems: [],
          carePreferences: [],
          restrictedMemoryPresent: restrictedCategories.length > 0,
          restrictedCategories
        }
      ]
    : normalizeMemoryProfiles(base.profiles || []);
  return normalizeCallerMemory({
    preferredLanguage: base.preferredLanguage || base.lastLanguageUsed || '',
    lastLanguageUsed: base.lastLanguageUsed || '',
    householdSafeContext: base.householdSafeContext || '',
    profiles,
    restrictedMemoryPresent: restrictedCategories.length > 0,
    restrictedCategories
  }, base);
}

function sanitizeProfileId(value) {
  const text = String(value || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  return text.slice(0, 40);
}

function sanitizeMemoryList(value, limit = 5, maxLength = 160) {
  return normalizeList(value)
    .map((item) => sanitizeMemoryText(item, maxLength))
    .filter(Boolean)
    .slice(0, limit);
}

function sanitizeMemoryText(value, maxLength = 500) {
  const text = normalizeOptionalText(value);
  if (!text || hasRestrictedMemoryContent(text)) return '';
  return limitText(text, maxLength);
}

function normalizeLanguageHint(value) {
  const text = normalizeOptionalText(value);
  if (!text) return '';
  const cleaned = limitText(
    text
      .replace(/^(main spoken language|language used|preferred language|language)\s*:\s*/i, '')
      .replace(/[.!?]+$/g, '')
      .trim(),
    80
  );
  if (!cleaned || /^(unknown|unclear|not clear|not specified|unspecified|none|n\/a|null)$/i.test(cleaned)) return '';
  if (hasRestrictedMemoryContent(cleaned)) return '';
  return cleaned;
}

function inferLanguageHintFromMessages(messages) {
  const text = (Array.isArray(messages) ? messages : [])
    .filter((message) => message?.role === 'patient')
    .map((message) => message.text || '')
    .join(' ')
    .toLowerCase();
  if (!text) return '';
  if (/\b(espanol|español|hola|gracias|necesito|medicamento|farmacia|clinica|clínica|dolor)\b/.test(text)) return 'Spanish';
  if (/\b(français|francais|bonjour|merci|douleur|medecin|médecin|pharmacie)\b/.test(text)) return 'French';
  if (/\b(kreyol|creole|créole|mwen|bezwen|famasi|dokt[eè])\b/.test(text)) return 'Haitian Creole';
  if (/\b(swahili|kiswahili|jambo|habari|asante|daktari|dawa|maumivu)\b/.test(text)) return 'Swahili';
  if (/\b(hello|thanks|thank you|need|pain|medicine|refill|pharmacy|doctor|clinic)\b/.test(text)) return 'English';
  return '';
}

function limitText(value, maxLength) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1).trim()}...` : text;
}

function hasRestrictedMemoryContent(value) {
  return detectRestrictedCategories(value).length > 0;
}

function detectRestrictedCategories(value) {
  const text = String(value || '').toLowerCase();
  const categories = [];
  if (/\b(gbv|gender[-\s]?based violence|domestic violence|intimate partner violence|partner violence|sexual assault|rape|traffick|coercion|abuse)\b/.test(text)) {
    categories.push('safety-sensitive');
  }
  if (/\b(hiv|aids|antiretroviral|art\b|sti|std|sexually transmitted|prep|pep|sexual health)\b/.test(text)) {
    categories.push('sexual-health-sensitive');
  }
  if (/\b(pregnan|abortion|miscarriage|contraception|family planning|reproductive)\b/.test(text)) {
    categories.push('reproductive-health-sensitive');
  }
  if (/\b(suicid|self[-\s]?harm|psychosis|mental health crisis)\b/.test(text)) {
    categories.push('mental-health-sensitive');
  }
  if (/\b(substance use|drug use|addiction)\b/.test(text)) {
    categories.push('substance-use-sensitive');
  }
  if (/\b(immigration|legal risk|police report)\b/.test(text)) {
    categories.push('legal-sensitive');
  }
  return uniqueStrings(categories);
}

function normalizeRestrictedCategory(value) {
  const text = String(value || '').toLowerCase();
  if (!text) return '';
  if (/safety|violence|assault|abuse|gbv|rape/.test(text)) return 'safety-sensitive';
  if (/sexual|hiv|sti|std|aids|prep|pep/.test(text)) return 'sexual-health-sensitive';
  if (/preg|reproductive|abortion|miscarriage|contraception/.test(text)) return 'reproductive-health-sensitive';
  if (/mental|suicid|self-harm|psych/.test(text)) return 'mental-health-sensitive';
  if (/substance|drug|addiction/.test(text)) return 'substance-use-sensitive';
  if (/legal|immigration|police/.test(text)) return 'legal-sensitive';
  return 'restricted-sensitive';
}

function hasCareCoordinationArtifacts(artifacts) {
  return artifacts.appointments.length > 0 ||
    artifacts.referrals.length > 0 ||
    artifacts.commodityPickups.length > 0 ||
    artifacts.testRequests.length > 0 ||
    artifacts.emergencies.length > 0;
}

function inferProviderReason(artifacts) {
  const reasons = [];
  if (artifacts.emergencies.length) reasons.push('urgent');
  if (artifacts.referrals.length) reasons.push('referral');
  if (artifacts.appointments.length) reasons.push('appointment');
  if (artifacts.testRequests.length) reasons.push('test');
  if (artifacts.commodityPickups.length) reasons.push('commodities');
  if (reasons.length === 0) return 'follow_up';
  if (reasons.length === 1) return reasons[0];
  return 'mixed';
}

function buildPatientFollowupMessage(summaries, artifacts) {
  const references = buildReferences(artifacts);
  const referenceLines = references.map(referenceLine);
  return [
    'Thank you for speaking with us today.',
    '',
    summaries.patientSummary,
    referenceLines.length ? `\nReferences:\n${referenceLines.join('\n')}` : '',
    '',
    'If anything worsens, please seek care.'
  ].filter(Boolean).join('\n');
}

function referenceLine(reference) {
  const detail = reference.detail || {};
  const provider = detail.provider || {};
  const base = `${reference.label}: ${reference.id}`;
  const location = provider.name
    ? ` at ${provider.name}${provider.address ? `, ${provider.address}` : ''}`
    : '';
  const simulated = detail.simulation ? ' (simulated, unverified)' : '';
  const action = detail.nextAction ? ` Next action: ${detail.nextAction}` : '';
  return `${base}${location}${simulated}.${action}`.trim();
}

function normalizeRequiredText(value, fallback) {
  const text = normalizeOptionalText(value);
  return text || fallback;
}

function normalizeOptionalText(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  if (!text || text.toLowerCase() === 'null' || text.toLowerCase() === 'none') return null;
  return text;
}

function normalizeEnum(value, allowed, fallback) {
  const text = String(value || '').trim();
  return allowed.includes(text) ? text : fallback;
}

function normalizeList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (value === null || value === undefined) return [];
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseJsonObject(value) {
  try {
    const parsed = JSON.parse(String(value || '').trim());
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    const text = String(value || '');
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return null;
    try {
      const parsed = JSON.parse(text.slice(start, end + 1));
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  }
}

function contentToText(content) {
  if (Array.isArray(content)) {
    return content
      .map((part) => typeof part === 'string' ? part : part?.text || part?.content || '')
      .join('');
  }
  return String(content || '');
}

function normalizePatientPhone(phone, callId) {
  const formatted = phone ? asE164(phone) : '';
  if (formatted && formatted.length >= 10 && formatted.length <= 16 && !formatted.includes('rtc_')) {
    return formatted;
  }
  return `anonymous_${String(callId).slice(0, 10)}`;
}

function isUsablePatientPhone(phone) {
  return /^\+\d{8,15}$/.test(String(phone || ''));
}

function asE164(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits ? `+${digits}` : '';
}

function asWhatsApp(phone) {
  return String(phone).startsWith('whatsapp:') ? String(phone) : `whatsapp:${asE164(phone)}`;
}

async function verifyStandardWebhook(headers, rawBody, secret) {
  const id = headers.get('webhook-id');
  const timestamp = headers.get('webhook-timestamp');
  const signatureHeader = headers.get('webhook-signature');
  if (!id || !timestamp || !signatureHeader) return false;

  const timestampMs = Number(timestamp) * 1000;
  if (!Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > 5 * 60 * 1000) {
    return false;
  }

  const signedPayload = `${id}.${timestamp}.${rawBody}`;
  const expected = await hmacSha256Base64(secret, signedPayload);
  const signatures = signatureHeader
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.startsWith('v1,') ? part.slice(3) : part);

  return signatures.some((signature) => timingSafeEqual(signature, expected));
}

async function hmacSha256Base64(secret, payload) {
  const keyBytes = decodeWebhookSecret(secret);
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return bytesToBase64(new Uint8Array(signature));
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(value || '')));
  return bytesToHex(new Uint8Array(digest));
}

function decodeWebhookSecret(secret) {
  const raw = String(secret).startsWith('whsec_') ? String(secret).slice(6) : String(secret);
  try {
    return base64ToBytes(raw);
  } catch {
    return new TextEncoder().encode(raw);
  }
}

function timingSafeEqual(a, b) {
  const left = new TextEncoder().encode(String(a));
  const right = new TextEncoder().encode(String(b));
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left[index] ^ right[index];
  }
  return result === 0;
}

function bytesToBase64(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function bytesToHex(bytes) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function base64ToBytes(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function readForm(request) {
  const text = await request.text();
  return Object.fromEntries(new URLSearchParams(text));
}

function xmlResponse(body, status = 200) {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n${body}`, {
    status,
    headers: { 'Content-Type': 'text/xml; charset=utf-8' }
  });
}

function textResponse(body, status = 200) {
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}

function htmlResponse(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'"
    }
  });
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function generateId(prefix) {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  let value = 0;
  for (const byte of bytes) value = ((value * 256) + byte) % 1000000;
  return `${prefix}-${String(value).padStart(6, '0')}`;
}

function numericEnv(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function optionalPositiveNumber(value) {
  if (value === undefined || value === null || String(value).trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function uniqueStrings(values) {
  return [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))];
}

function cleanProviderName(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  if (/\b(ai[- ]?suggested|nearby pharmacy|nearby clinic|specific .* not provided|placeholder)\b/i.test(text)) return '';
  return text;
}

function cleanProviderAddress(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  if (/\b(your area|patient area|near the patient area|nearby|unknown|not provided|placeholder)\b/i.test(text)) return '';
  return text;
}

function providerLookupResult(input) {
  const options = Array.isArray(input.options) ? input.options : [];
  const selected = options[0] || null;
  return {
    success: Boolean(input.success && selected),
    simulation: true,
    test_mode: true,
    error: input.error || '',
    status: input.status || undefined,
    location: input.location || '',
    need: input.need || '',
    provider_type: input.providerType || '',
    source: input.source || '',
    timeout_ms: input.timeoutMs || DEFAULT_PROVIDER_LOOKUP_TIMEOUT_MS,
    elapsed_ms: input.elapsedMs || 0,
    options,
    selected,
    voiceResponse: input.voiceResponse || (selected
      ? `This is a simulation. A plausible option is ${selected.name} at ${selected.address}. Please confirm services before travel.`
      : 'I could not identify a specific nearby option quickly. Please share a more precise location.')
  };
}

function normalizeProviderOptions(options, location, fallbackType) {
  return (Array.isArray(options) ? options : [])
    .map((option, index) => {
      if (!option || typeof option !== 'object') return null;
      const name = cleanProviderName(option.name);
      const address = cleanProviderAddress(option.address);
      if (!name || !address) return null;
      return {
        id: generateId(index === 0 ? 'CARE' : 'CAREALT'),
        name: limitText(name, 120),
        address: limitText(address, 180),
        type: normalizeProviderType(option.type, fallbackType),
        distance: limitText(option.distance || 'nearby', 80),
        reason: limitText(option.reason || '', 180),
        capacity: limitText(option.capacity || option.services || '', 180),
        nextAction: limitText(option.nextAction || option.next_action || 'Confirm hours, eligibility, cost, and services before travel.', 180),
        simulation_notice: `Simulated provider option near ${location}; not a live verified search result.`
      };
    })
    .filter(Boolean)
    .slice(0, 3);
}

function normalizeProviderType(value, fallback = 'clinic') {
  const text = String(value || '').trim().toLowerCase().replace(/\s+/g, '_');
  if (['pharmacy', 'clinic', 'health_center', 'lab', 'hospital', 'diagnostic_center', 'other'].includes(text)) return text;
  if (/pharm/.test(text)) return 'pharmacy';
  if (/lab/.test(text)) return 'lab';
  if (/diagnostic|imaging|test/.test(text)) return 'diagnostic_center';
  if (/hospital/.test(text)) return 'hospital';
  if (/health/.test(text)) return 'health_center';
  return fallback;
}

function isVagueLocation(value) {
  const text = String(value || '').trim().toLowerCase();
  if (!text) return true;
  if (/^(here|near me|nearby|my area|around me|this area|your area|patient area|traveling|i am traveling)$/.test(text)) return true;
  return text.length < 3;
}

function requireEnv(env, name) {
  const value = env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}
