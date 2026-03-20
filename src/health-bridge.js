/**
 * Health Bridge Module
 *
 * Connects the voice service to downstream health infrastructure:
 *   - Google Drive  (optional) – saves per-session transcripts & notes
 *   - Twilio / SignalWire SMS  (optional) – sends post-call follow-up messages
 *
 * All integrations are opt-in via environment variables.  The service runs
 * perfectly without them; features degrade gracefully with log warnings.
 */

const axios = require('axios');
let twilioClient = null;

// ─── Google Drive ─────────────────────────────────────────────────────────────

let drive = null;

// Per-call conversation buffer (avoids a Drive write per utterance).
// Key: "<phone>::<sessionId>"  (or just "<phone>" for legacy callers)
const conversationBuffers = new Map();

function getBufferKey(phoneNumber, sessionId = null) {
  try {
    const phone = (phoneNumber && typeof phoneNumber === 'string')
      ? formatPhoneNumber(phoneNumber)
      : '+unknown';
    return sessionId ? `${phone}::${sessionId}` : phone;
  } catch (_) {
    return sessionId ? `+unknown::${sessionId}` : '+unknown';
  }
}

/**
 * Initialize Google Drive client.
 * Supports two env-var formats:
 *   GOOGLE_SERVICE_ACCOUNT      – base64-encoded JSON service account key
 *   GOOGLE_SERVICE_ACCOUNT_KEY  – raw JSON string
 * Returns null (with a warning) when neither is set.
 */
async function initGoogleDrive() {
  if (drive) return drive;

  try {
    const { google } = require('googleapis');

    let keyJson = null;
    if (process.env.GOOGLE_SERVICE_ACCOUNT) {
      try {
        keyJson = JSON.parse(Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT, 'base64').toString());
        console.log('[Health Bridge] Loaded Google service account from base64 env');
      } catch (e) {
        console.error('[Health Bridge] Failed to decode GOOGLE_SERVICE_ACCOUNT base64:', e.message);
      }
    }
    if (!keyJson && process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      try {
        keyJson = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
        console.log('[Health Bridge] Loaded Google service account from raw JSON env');
      } catch (e) {
        console.error('[Health Bridge] Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY JSON:', e.message);
      }
    }

    if (!keyJson) {
      console.log('[Health Bridge] Google Drive not configured – transcripts will not be persisted');
      return null;
    }

    const auth = new google.auth.GoogleAuth({
      credentials: keyJson,
      scopes: ['https://www.googleapis.com/auth/drive']
    });

    drive = google.drive({ version: 'v3', auth });
    console.log('[Health Bridge] Google Drive client initialized');
    return drive;
  } catch (error) {
    console.error('[Health Bridge] Error initializing Google Drive:', error.message);
    return null;
  }
}

async function getOrCreateFolderByName(parentId, name) {
  const driveClient = await initGoogleDrive();
  if (!driveClient) return null;

  try {
    const listRes = await driveClient.files.list({
      q: `'${parentId}' in parents and name='${name.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true
    });
    if (listRes.data.files && listRes.data.files.length > 0) {
      return listRes.data.files[0].id;
    }

    const createRes = await driveClient.files.create({
      requestBody: {
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId]
      },
      fields: 'id',
      supportsAllDrives: true
    });
    return createRes.data.id;
  } catch (e) {
    console.error('[Health Bridge] Error ensuring folder:', e.message);
    return null;
  }
}

async function ensureNestedFolder(rootId, parts) {
  let current = rootId;
  for (const part of parts) {
    if (!part) continue;
    const id = await getOrCreateFolderByName(current, part);
    if (!id) return null;
    current = id;
  }
  return current;
}

async function ensureSessionFolder(phoneNumber, sessionId) {
  const root = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!root) return null;

  // Anonymous calls go in a separate subtree
  if (phoneNumber && phoneNumber.startsWith('anonymous_')) {
    const date = new Date().toISOString().split('T')[0];
    const anonId = phoneNumber.substring(10);
    return await ensureNestedFolder(root, ['anonymous_calls', anonId, 'sessions', `${date}_${sessionId}`]);
  }

  const safePhone = (phoneNumber || 'unknown').replace(/[^+\d]/g, '');
  const date = new Date().toISOString().split('T')[0];
  return await ensureNestedFolder(root, ['patients', safePhone, 'sessions', `${date}_${sessionId}`]);
}

// ─── Session helpers ──────────────────────────────────────────────────────────

const getOrCreateSession = (phoneNumber) => ({
  phoneNumber,
  healthHistory: [],
  channel: 'voice',
  startTime: new Date()
});

const addToHistory = (session, entry) => {
  if (!session.healthHistory) session.healthHistory = [];
  session.healthHistory.push(entry);
};

const generateId = (prefix = 'ID') =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ─── Stub health-action back-ends ─────────────────────────────────────────────
// Replace these with real integrations (EHR, scheduling system, pharmacy API …)

const healthActions = {
  appointments: {
    scheduleAppointment: async (data) => {
      console.log('[Health Bridge] Would schedule appointment:', data);
      return generateId('APPT');
    }
  },
  referrals: {
    generateReferral: async (data) => {
      console.log('[Health Bridge] Would create referral:', data);
      return generateId('REF');
    }
  },
  prescriptions: {
    createPrescriptionRequest: async (data) => {
      console.log('[Health Bridge] Would request prescription:', data);
      return generateId('RX');
    }
  },
  emergency: {
    activateProtocol: async (data) => {
      console.log('[Health Bridge] Would activate emergency:', data);
      return { protocolActivated: true, emergencyId: generateId('EMRG') };
    }
  }
};

// ─── Voice session init ───────────────────────────────────────────────────────

async function initializeVoiceSession(phoneNumber) {
  console.log(`[Health Bridge] Initializing session for ${phoneNumber}`);
  const session = getOrCreateSession(phoneNumber);
  session.channel = 'voice';
  return session;
}

// ─── Transcript buffering ─────────────────────────────────────────────────────

async function updateConversationInDocument(phoneNumber, text, role, _understanding = null, _channel = 'voice', sessionId = null) {
  const key = getBufferKey(phoneNumber, sessionId);
  if (!conversationBuffers.has(key)) conversationBuffers.set(key, []);
  conversationBuffers.get(key).push({ role, text });
  console.log(`[Health Bridge] Buffered ${role} message (${text?.length || 0} chars)`);
}

async function saveTranscript(phoneNumber, role, text, understanding = null, sessionId = null) {
  if (!phoneNumber || !text) return;
  try {
    await updateConversationInDocument(phoneNumber, text, role, understanding, 'voice', sessionId);
    const session = getOrCreateSession(phoneNumber);
    addToHistory(session, { role, text });
    console.log(`[Health Bridge] Saved ${role} transcript: "${text.substring(0, 50)}…"`);
  } catch (error) {
    console.error('[Health Bridge] Error saving transcript:', error.message);
  }
}

// ─── Voice health actions ─────────────────────────────────────────────────────

const voiceHealthActions = {
  async healthAssessment(args, phoneNumber, sessionId = null) {
    const { symptoms, severity, medical_content } = args;
    if (medical_content) {
      await updateConversationInDocument(phoneNumber,
        `Health Assessment:\nSymptoms: ${symptoms?.join(', ')}\nSeverity: ${severity}\nDetails: ${medical_content}`,
        'system', null, 'voice', sessionId);
    }
    return {
      success: true,
      assessmentId: generateId('ASSESS'),
      symptoms,
      severity,
      voiceResponse: 'Assessment recorded in your medical record'
    };
  },

  async scheduleAppointment(args, phoneNumber, sessionId = null) {
    const { provider_type, preferred_dates, urgency, reason } = args;
    const appointmentId = await healthActions.appointments.scheduleAppointment({
      patient: { id: phoneNumber, phone: phoneNumber },
      providerType: provider_type,
      preferredDates: preferred_dates,
      urgency,
      reason
    });
    await updateConversationInDocument(phoneNumber,
      `Appointment scheduled: ${appointmentId}\nProvider: ${provider_type}\nUrgency: ${urgency}`,
      'system', null, 'voice', sessionId);
    return {
      success: true,
      appointmentId,
      provider: provider_type,
      voiceResponse: `Appointment confirmed. Your reference number is ${appointmentId.slice(-4).split('').join(' ')}. Check your phone for details.`
    };
  },

  async referSpecialist(args, phoneNumber, sessionId = null) {
    const { specialist_type, urgency, reason, symptoms } = args;
    const referralId = await healthActions.referrals.generateReferral({
      patient: { id: phoneNumber, phone: phoneNumber },
      specialistType: specialist_type,
      urgency,
      reason,
      symptoms
    });
    await updateConversationInDocument(phoneNumber,
      `Referral generated: ${referralId}\nSpecialist: ${specialist_type}\nReason: ${reason}\nUrgency: ${urgency}`,
      'system', null, 'voice', sessionId);
    return {
      success: true,
      referralId,
      specialist: specialist_type,
      voiceResponse: `Referral created to ${specialist_type}. Reference ${referralId.slice(-4).split('').join(' ')}. Details sent to your phone.`
    };
  },

  async prescribeMedication(args, phoneNumber, sessionId = null) {
    const { medication, dosage, duration, refills } = args;
    const prescriptionId = await healthActions.prescriptions.createPrescriptionRequest({
      patient: { id: phoneNumber, phone: phoneNumber },
      medication,
      dosage,
      duration,
      refills
    });
    await updateConversationInDocument(phoneNumber,
      `Prescription requested: ${prescriptionId}\nMedication: ${medication}\nDosage: ${dosage}`,
      'system', null, 'voice', sessionId);
    return {
      success: true,
      prescriptionId,
      medication,
      voiceResponse: `Prescription request created. Requires provider approval. Check your phone for updates.`
    };
  },

  async findClinics(args, phoneNumber, sessionId = null) {
    const { location, specialty } = args;
    // Stub – replace with a real clinic directory or geocoding API
    const clinics = [
      {
        id: 'CLINIC001',
        name: 'City Health Center',
        address: `Main Street, ${location}`,
        specialty: specialty || 'general',
        distance: '2 km',
        availableSlots: ['9:00 AM', '2:00 PM', '4:30 PM']
      },
      {
        id: 'CLINIC002',
        name: 'Community Clinic',
        address: `Park Road, ${location}`,
        specialty: specialty || 'general',
        distance: '5 km',
        availableSlots: ['10:00 AM', '3:00 PM']
      }
    ];
    await updateConversationInDocument(phoneNumber,
      `Clinic search: ${location}, ${specialty || 'any specialty'}`,
      'system', null, 'voice', sessionId);
    return {
      success: true,
      clinics,
      voiceResponse: `Found ${clinics.length} clinics near ${location}. Closest is ${clinics[0].name}, ${clinics[0].distance} away, with a slot at ${clinics[0].availableSlots[0]}. Should I book an appointment?`
    };
  },

  async handleEmergency(args, phoneNumber, sessionId = null) {
    const { symptoms } = args;
    await updateConversationInDocument(phoneNumber,
      `⚠️ EMERGENCY PROTOCOL ACTIVATED\nSymptoms: ${symptoms?.join(', ')}\nSeverity: URGENT`,
      'system', null, 'voice', sessionId);
    return {
      success: true,
      emergency: true,
      voiceResponse: 'This is an emergency. Please call emergency services immediately or go to the nearest hospital.'
    };
  }
};

// ─── Follow-up messaging ──────────────────────────────────────────────────────

async function sendWhatsAppFollowup(phoneNumber, message) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;
  if (!sid || !token || !fromNumber) {
    console.log('[Health Bridge] WhatsApp follow-up skipped (Twilio not configured)');
    return;
  }
  if (!twilioClient) {
    twilioClient = require('twilio')(sid, token);
  }
  const to = phoneNumber.startsWith('whatsapp:') ? phoneNumber : `whatsapp:${phoneNumber}`;
  const from = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`;
  await twilioClient.messages.create({ from, to, body: message });
  console.log(`[Health Bridge] WhatsApp follow-up sent to ${phoneNumber}`);
}

async function sendSmsFollowup(phoneNumber, message) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const smsFrom = process.env.TWILIO_SMS_NUMBER;
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
  if (!sid || !token || (!smsFrom && !messagingServiceSid)) {
    console.log('[Health Bridge] SMS follow-up skipped (Twilio SMS not configured)');
    return;
  }
  if (!twilioClient) {
    twilioClient = require('twilio')(sid, token);
  }
  const to = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber.replace(/\D/g, '')}`;
  const params = messagingServiceSid
    ? { messagingServiceSid, to, body: message }
    : { from: smsFrom, to, body: message };
  await twilioClient.messages.create(params);
  console.log(`[Health Bridge] SMS follow-up sent to ${to}`);
}

async function sendSignalWireFollowup(phoneNumber, message) {
  const projectId = process.env.SIGNALWIRE_PROJECT_ID;
  const token = process.env.SIGNALWIRE_TOKEN;
  const space = process.env.SIGNALWIRE_SPACE;
  const from = process.env.SIGNALWIRE_SMS_FROM;
  if (!projectId || !token || !space || !from) {
    console.log('[Health Bridge] SignalWire SMS not configured; skipping');
    return false;
  }
  const to = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber.replace(/\D/g, '')}`;
  const url = `https://${space}/api/laml/2010-04-01/Accounts/${projectId}/Messages.json`;
  const body = new URLSearchParams({ From: from, To: to, Body: message }).toString();
  await axios.post(url, body, {
    auth: { username: projectId, password: token },
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  console.log(`[Health Bridge] SignalWire SMS sent to ${to}`);
  return true;
}

async function sendPreferredFollowup(phoneNumber, message) {
  // Prefer WhatsApp; fall back to SMS
  const hasWA = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_NUMBER);
  if (hasWA) {
    try {
      await sendWhatsAppFollowup(phoneNumber, message);
      return;
    } catch (e) {
      console.warn('[Health Bridge] WhatsApp send failed, falling back to SMS');
    }
  }
  await sendSmsFollowup(phoneNumber, message);
}

// ─── Call finalization ────────────────────────────────────────────────────────

async function generateCallSummary(conversation) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const lastUser = [...conversation].reverse().find(m => m.role === 'patient');
    return `Call summary: Discussed symptoms and next steps. Patient said: "${lastUser?.text?.slice(0, 120) || 'N/A'}".`;
  }
  try {
    const messages = [
      { role: 'system', content: 'You are a medical assistant. Summarize the call in a warm, caring tone. Include: 1) Main concerns, 2) Advice given, 3) Next steps, 4) Any appointments/prescriptions/referrals discussed, 5) Simple reminders. Keep to 5-8 short lines.' },
      ...conversation.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.text }))
    ];
    const resp = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: process.env.OPENAI_SUMMARY_MODEL || 'gpt-4o-mini',
      messages,
      temperature: 0.3
    }, { headers: { Authorization: `Bearer ${apiKey}` } });
    return resp.data?.choices?.[0]?.message?.content || 'Summary unavailable.';
  } catch (e) {
    console.error('[Health Bridge] Error generating summary:', e?.response?.data || e.message);
    const lastUser = [...conversation].reverse().find(m => m.role === 'patient');
    return `Call summary: Discussed symptoms and next steps. Patient said: "${lastUser?.text?.slice(0, 120) || 'N/A'}".`;
  }
}

async function saveMedicalNotesToDrive(phoneNumber, summary, sessionId, conversationParam = null) {
  const driveClient = await initGoogleDrive();
  if (!driveClient) return null;

  const folderId = await ensureSessionFolder(phoneNumber, sessionId);
  if (!folderId) return null;

  let content = `# Health Session\n`;
  content += `**Patient:** ${phoneNumber}\n`;
  content += `**Session ID:** ${sessionId}\n`;
  content += `**Date:** ${new Date().toISOString()}\n\n---\n\n`;
  content += `## Summary\n\n${summary}\n\n---\n\n`;

  // Prefer the explicit conversation array; fall back to any matching buffer entry
  let convo = (Array.isArray(conversationParam) && conversationParam.length > 0) ? conversationParam : null;
  if (!convo) {
    const phoneKey = getBufferKey(phoneNumber, null);
    convo = conversationBuffers.get(phoneKey) || null;
  }
  if (!convo) {
    const prefix = `${getBufferKey(phoneNumber, null)}::`;
    for (const [k, arr] of conversationBuffers.entries()) {
      if (k.startsWith(prefix)) { convo = arr; break; }
    }
  }
  if (!convo) convo = [];

  if (convo.length > 0) {
    content += `## Conversation\n\n`;
    convo.forEach(msg => {
      const label = msg.role === 'assistant' ? 'Health Advisor' : 'Patient';
      content += `**${label}:**\n${msg.text}\n\n`;
    });
  }

  try {
    const res = await driveClient.files.create({
      supportsAllDrives: true,
      requestBody: { name: 'session.md', parents: [folderId], mimeType: 'text/markdown' },
      media: { mimeType: 'text/markdown', body: content },
      fields: 'id'
    });
    console.log(`[Health Bridge] Saved session file to Drive: ${res.data.id}`);
    return res.data.id;
  } catch (e) {
    console.error('[Health Bridge] Error saving medical notes:', e.message);
    return null;
  }
}

async function finalizeVoiceCall(phoneNumber, conversation, bufferSessionId = null) {
  try {
    if (!phoneNumber || !conversation || conversation.length === 0) return;
    const sessionId = generateId('SESSION');
    const summary = await generateCallSummary(conversation);
    await saveMedicalNotesToDrive(phoneNumber, summary, sessionId, conversation);

    // Clear buffer
    const key = getBufferKey(phoneNumber, bufferSessionId);
    conversationBuffers.delete(key);

    // Skip follow-up for anonymous / uncaptured callers
    if (phoneNumber.startsWith('anonymous_')) {
      console.log('[Health Bridge] Skipping follow-up for anonymous call');
      return;
    }

    const msg = `Thank you for speaking with me today.\n\n${summary}\n\nIf anything worsens, please seek care. I'm here if you need me.`;
    await sendPreferredFollowup(phoneNumber, msg);
  } catch (e) {
    console.error('[Health Bridge] Error finalizing call:', e.message);
  }
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatPhoneNumber(number) {
  if (!number || typeof number !== 'string') return '+unknown';
  const digits = number.replace(/\D/g, '');
  if (!digits) return '+unknown';
  if (!number.startsWith('+')) return `+${digits}`;
  return `+${digits}`;
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  initializeVoiceSession,
  saveTranscript,
  voiceHealthActions,
  sendWhatsAppFollowup,
  sendSmsFollowup,
  sendSignalWireFollowup,
  sendMessageFollowup: sendPreferredFollowup,
  sendPreferredFollowup,
  formatPhoneNumber,
  finalizeVoiceCall
};
