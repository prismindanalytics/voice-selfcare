/**
 * RealtimeClient
 *
 * WebSocket client for the OpenAI Realtime API.
 * Used by the Twilio Media Streams path (legacy / alternative to the SIP path).
 * For the primary SIP path, see sip-handler.js.
 */

const WebSocket = require('ws');
const healthBridge = require('./health-bridge');

class RealtimeClient {
  constructor(session) {
    this.session = session;
    this.ws = null;
    this.connected = false;
    this.model = process.env.OPENAI_REALTIME_MODEL || 'gpt-realtime';
    this.apiKey = process.env.OPENAI_API_KEY;
    this.patientPhone = null;
    this.patientSession = null;
    this.conversation = [];
  }

  async connect() {
    console.log(`[Realtime] Connecting to OpenAI for session ${this.session.id}`);

    try {
      this.ws = new WebSocket(`wss://api.openai.com/v1/realtime?model=${this.model}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'OpenAI-Beta': 'realtime=v1'
        }
      });

      this.ws.on('open', () => {
        console.log('[Realtime] WebSocket connected to OpenAI');
        this.initializeSession();
      });

      this.ws.on('message', (data) => {
        let msg;
        try { msg = JSON.parse(data); } catch (e) {
          console.error('[Realtime] Failed to parse message:', e.message);
          return;
        }
        this.handleRealtimeMessage(msg);
      });

      this.ws.on('error', (error) => {
        console.error('[Realtime] WebSocket error:', error.message);
      });

      this.ws.on('close', () => {
        console.log('[Realtime] WebSocket closed');
        this.connected = false;
      });
    } catch (error) {
      console.error('[Realtime] Connection error:', error.message);
    }
  }

  async initializeSession() {
    if (this.session.callSid || this.session.metadata?.phoneNumber) {
      this.patientPhone = healthBridge.formatPhoneNumber(
        this.session.metadata?.phoneNumber || this.session.callSid
      );
      this.patientSession = await healthBridge.initializeVoiceSession(this.patientPhone);
      console.log(`[Realtime] Initialized health session for ${this.patientPhone}`);
    }

    const sessionConfig = {
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        instructions: `You are a warm, caring health advisor for voice-based self-care serving patients in Low and Middle Income Countries (LMICs). Use an empathetic, supportive tone.

IMPORTANT: Never introduce yourself with a specific doctor name. Simply say "this is your health advisor" or "I'm here to help with your health questions".

INITIAL GREETING:
Use this template: "Hello, thank you for calling. This is your health advisor. How can I help you with your health today? I can also assist you in any language you prefer."

LANGUAGE RULES:
- ALWAYS greet first-time callers in English
- Mention you can help in any language
- Only switch languages when you're CONFIDENT the user is speaking another language
- Once you switch, stay in that language

VOICE CONSTRAINTS:
- Keep responses brief and natural for phone conversations (2-3 sentences)
- Sound warm and reassuring; acknowledge feelings and concerns
- Spell out medication names clearly
- Ask one question at a time

HEALTHCARE NAVIGATION:
- Ask clarifying questions: location, type of care needed, urgency level
- Recommend 2-3 nearby options with addresses/neighborhoods when possible
- Generate reference numbers for appointments (format: APPT-XXXX)

MEDICAL PRINCIPLES:
- Trust your medical judgment to assess severity
- Provide appropriate self-care guidance when safe
- Escalate emergencies immediately
- Consider LMIC resource constraints`,
        voice: 'alloy',
        input_audio_format: 'g711_ulaw',
        output_audio_format: 'g711_ulaw',
        input_audio_transcription: {
          model: 'gpt-4o-transcribe',
          prompt: 'Medical conversation. Expect medical terms, symptoms, medication names, body parts, conditions.',
          language: 'en'
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 1200,
          create_response: true
        },
        tools: [
          {
            type: 'function',
            name: 'health_assessment',
            description: 'Evaluate symptoms and record health assessment',
            parameters: {
              type: 'object',
              properties: {
                symptoms: { type: 'array', items: { type: 'string' }, description: 'List of symptoms mentioned' },
                severity: { type: 'string', enum: ['urgent', 'moderate', 'routine', 'informational'], description: 'Assessed severity level' },
                medical_content: { type: 'string', description: 'Medical assessment details' }
              },
              required: ['symptoms', 'severity']
            }
          },
          {
            type: 'function',
            name: 'schedule_appointment',
            description: 'Schedule an appointment at a health facility',
            parameters: {
              type: 'object',
              properties: {
                provider_type: { type: 'string', description: 'Type of provider (clinic, health center, CHW)' },
                preferred_dates: { type: 'array', items: { type: 'string' }, description: 'Preferred appointment dates/times' },
                urgency: { type: 'string', enum: ['urgent', 'routine'], description: 'Urgency of appointment' },
                reason: { type: 'string', description: 'Reason for appointment' }
              },
              required: ['provider_type', 'reason']
            }
          },
          {
            type: 'function',
            name: 'refer_specialist',
            description: 'Generate a referral to a specialist or higher-level facility',
            parameters: {
              type: 'object',
              properties: {
                specialist_type: { type: 'string', description: 'Type of specialist needed' },
                urgency: { type: 'string', enum: ['urgent', 'routine'], description: 'Urgency of referral' },
                reason: { type: 'string', description: 'Reason for referral' },
                symptoms: { type: 'array', items: { type: 'string' }, description: 'Relevant symptoms' }
              },
              required: ['specialist_type', 'reason']
            }
          },
          {
            type: 'function',
            name: 'prescribe_medication',
            description: 'Create a prescription request (requires provider approval)',
            parameters: {
              type: 'object',
              properties: {
                medication: { type: 'string', description: 'Medication name' },
                dosage: { type: 'string', description: 'Dosage instructions' },
                duration: { type: 'string', description: 'Duration of treatment' },
                refills: { type: 'number', description: 'Number of refills' }
              },
              required: ['medication', 'dosage']
            }
          },
          {
            type: 'function',
            name: 'handle_emergency',
            description: 'Activate emergency protocol for urgent medical situations',
            parameters: {
              type: 'object',
              properties: {
                symptoms: { type: 'array', items: { type: 'string' }, description: 'Emergency symptoms' },
                severity: { type: 'string', description: 'Always urgent for emergencies' }
              },
              required: ['symptoms']
            }
          }
        ]
      }
    };

    this.ws.send(JSON.stringify(sessionConfig));
    this.connected = true;
    console.log('[Realtime] Session initialized with tools');
  }

  handleRealtimeMessage(message) {
    switch (message.type) {
      case 'session.created':
        console.log('[Realtime] Session created:', message.session.id);
        setTimeout(() => {
          this.ws.send(JSON.stringify({
            type: 'conversation.item.create',
            item: {
              type: 'message',
              role: 'user',
              content: [{ type: 'input_text', text: 'Please greet the caller warmly IN ENGLISH and ask how you can help them today.' }]
            }
          }));
          this.ws.send(JSON.stringify({ type: 'response.create' }));
          console.log('[Realtime] Triggered initial greeting');
        }, 100);
        break;

      case 'session.updated':
        console.log('[Realtime] Session updated');
        break;

      case 'response.audio.delta':
        if (message.delta) {
          this.sendAudioToProvider(Buffer.from(message.delta, 'base64'));
        }
        break;

      case 'response.audio_transcript.delta':
      case 'response.output_audio_transcript.delta':
        // Streaming transcript delta – useful for debugging
        break;

      case 'response.audio_transcript.done':
      case 'response.output_audio_transcript.done':
        console.log('[Realtime] Assistant finished speaking:', message.transcript);
        if (this.patientPhone && message.transcript) {
          healthBridge.saveTranscript(this.patientPhone, 'assistant', message.transcript, null, this.session?.id);
        }
        if (message.transcript) this.conversation.push({ role: 'assistant', text: message.transcript });
        this.sendTextToProvider(message.transcript);
        break;

      case 'input_audio_buffer.speech_started':
        console.log('[Realtime] User started speaking');
        break;

      case 'input_audio_buffer.speech_stopped':
        console.log('[Realtime] User stopped speaking');
        break;

      case 'conversation.item.input_audio_transcription.completed':
        console.log('[Realtime] User said:', message.transcript);
        if (this.patientPhone && message.transcript) {
          healthBridge.saveTranscript(this.patientPhone, 'patient', message.transcript, null, this.session?.id);
        }
        if (message.transcript) this.conversation.push({ role: 'patient', text: message.transcript });
        break;

      case 'response.function_call_arguments.done': {
        const callId = message.item_id || message.call_id;
        if (!callId) { console.error('[Realtime] Tool call missing id, skipping'); break; }
        let args;
        try { args = JSON.parse(message.arguments); } catch (e) { console.error('[Realtime] Bad tool args:', e.message); break; }
        console.log('[Realtime] Function call:', message.name);
        this.handleToolCall(message.name, args, callId);
        break;
      }

      case 'response.done':
        console.log('[Realtime] Response completed');
        break;

      case 'error':
        console.error('[Realtime] Error:', message.error);
        break;

      default:
        // Ignore other event types
        break;
    }
  }

  async handleToolCall(toolName, args, callId) {
    console.log(`[Tool] Executing ${toolName} with args:`, args);

    if (!this.patientPhone) {
      this.patientPhone = healthBridge.formatPhoneNumber(
        this.session.metadata?.phoneNumber || this.session.callSid || 'unknown'
      );
      if (!this.patientSession) {
        this.patientSession = await healthBridge.initializeVoiceSession(this.patientPhone);
      }
    }

    let result = {};
    try {
      switch (toolName) {
        case 'health_assessment':
          result = await healthBridge.voiceHealthActions.healthAssessment(args, this.patientPhone, this.session?.id);
          break;
        case 'find_clinics':
          result = await healthBridge.voiceHealthActions.findClinics(args, this.patientPhone, this.session?.id);
          break;
        case 'schedule_appointment':
          result = await healthBridge.voiceHealthActions.scheduleAppointment(args, this.patientPhone, this.session?.id);
          if (result.success) {
            await healthBridge.sendPreferredFollowup(this.patientPhone,
              `Appointment confirmed!\nProvider: ${result.provider}\nReference: ${result.appointmentId}`);
          }
          break;
        case 'refer_specialist':
          result = await healthBridge.voiceHealthActions.referSpecialist(args, this.patientPhone, this.session?.id);
          if (result.success) {
            await healthBridge.sendPreferredFollowup(this.patientPhone,
              `Referral created!\nSpecialist: ${result.specialist}\nReference: ${result.referralId}`);
          }
          break;
        case 'prescribe_medication':
          result = await healthBridge.voiceHealthActions.prescribeMedication(args, this.patientPhone, this.session?.id);
          if (result.success) {
            await healthBridge.sendPreferredFollowup(this.patientPhone,
              `Prescription request created!\nMedication: ${result.medication}\nReference: ${result.prescriptionId}\nAwaiting provider approval.`);
          }
          break;
        case 'handle_emergency':
          result = await healthBridge.voiceHealthActions.handleEmergency(args, this.patientPhone, this.session?.id);
          if (result.emergency) {
            await healthBridge.sendPreferredFollowup(this.patientPhone,
              `EMERGENCY: Call emergency services now!\nSymptoms: ${args.symptoms?.join(', ')}`);
          }
          break;
        default:
          console.log(`[Tool] Unknown tool: ${toolName}`);
          result = { error: `Unknown tool: ${toolName}` };
      }
    } catch (error) {
      console.error(`[Tool] Error executing ${toolName}:`, error.message);
      result = {
        error: 'Tool execution failed',
        message: error.message,
        voiceResponse: 'I encountered an issue processing that request. Please try again.'
      };
    }

    if (result.voiceResponse) result._voice_hint = result.voiceResponse;

    this.ws.send(JSON.stringify({
      type: 'conversation.item.create',
      item: { type: 'function_call_output', call_id: callId, output: JSON.stringify(result) }
    }));
    console.log(`[Tool] Sent result for ${toolName}`);

    try {
      this.ws.send(JSON.stringify({ type: 'response.create' }));
      console.log('[Tool] Triggered response.create after tool output');
    } catch (e) {
      console.error('[Tool] Failed to trigger response.create:', e.message);
    }
  }

  sendAudio(audioData) {
    if (!this.connected || !this.ws) return;
    this.ws.send(JSON.stringify({
      type: 'input_audio_buffer.append',
      audio: audioData.toString('base64')
    }));
  }

  // Override this method when integrating with a specific telephony provider
  sendAudioToProvider(audioData) {
    console.log('[Realtime] Audio delta received – override sendAudioToProvider() to relay to your telephony provider');
  }

  // Sends AI text as TTS via SignalWire call redirect.
  // If you are using Twilio Media Streams, override this method with your own implementation.
  async sendTextToProvider(text) {
    if (!this.session.callSid) return;

    const axios = require('axios');
    const projectId = process.env.SIGNALWIRE_PROJECT_ID;
    const token = process.env.SIGNALWIRE_TOKEN;
    const space = process.env.SIGNALWIRE_SPACE;
    const publicUrl = process.env.PUBLIC_URL;

    if (!projectId || !token || !space || !publicUrl) return;

    try {
      const url = `https://${space}/api/laml/2010-04-01/Accounts/${projectId}/Calls/${this.session.callSid}`;
      await axios.post(url,
        new URLSearchParams({ Url: `${publicUrl}/signalwire/say/${this.session.id}`, Method: 'POST' }).toString(),
        { auth: { username: projectId, password: token }, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      this.session.pendingText = text;
      console.log('[Realtime] Redirected call for TTS:', text.substring(0, 50) + '…');
    } catch (error) {
      console.error('[Realtime] Error sending TTS to SignalWire:', error.message);
    }
  }

  disconnect() {
    console.log(`[Realtime] Disconnecting session ${this.session.id}`);

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    if (this.patientPhone && this.conversation.length > 0) {
      try {
        healthBridge.finalizeVoiceCall(this.patientPhone, this.conversation, this.session?.id);
      } catch (e) {
        console.error('[Realtime] Error finalizing call:', e.message);
      }
    }

    this.connected = false;
  }
}

module.exports = RealtimeClient;
