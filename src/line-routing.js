export function normalizeLineServiceMode(value, fallback = 'health') {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'health' || normalized === 'jozi' || normalized === 'selfcare') return normalized;

  const fallbackMode = String(fallback || '').trim().toLowerCase();
  if (fallbackMode === 'jozi' || fallbackMode === 'selfcare') return fallbackMode;
  return 'health';
}

export function serviceModeForTwilioVoicePath(path, fallback = 'health') {
  const normalizedPath = String(path || '').toLowerCase().replace(/\/+$/, '') || '/';
  if (/^\/twilio\/voice\/jozi(?:\/(?:pcmu|pcma))?$/.test(normalizedPath)) return 'jozi';
  if (/^\/twilio\/voice\/selfcare(?:\/(?:pcmu|pcma))?$/.test(normalizedPath)) return 'selfcare';
  if (/^\/twilio\/voice\/health(?:\/(?:pcmu|pcma))?$/.test(normalizedPath)) return 'health';
  if (/^\/twilio\/voice(?:\/(?:pcmu|pcma))?$/.test(normalizedPath)) {
    return normalizeLineServiceMode(fallback);
  }
  return null;
}

export function twilioLineBindingMatches({ serviceMode, to, healthNumber, joziNumber, selfcareNumber }) {
  const mode = String(serviceMode || '').trim().toLowerCase();
  if (!['health', 'jozi', 'selfcare'].includes(mode)) return false;
  const destination = normalizePhone(to);
  const health = normalizePhone(healthNumber);
  const jozi = normalizePhone(joziNumber);
  /* Selfcare may reuse either legacy number. Route-enable flags decide which named path is live,
     while Twilio's URL-bound signature prevents a request from being replayed onto another path. */
  if (mode === 'selfcare') {
    const selfcare = normalizePhone(selfcareNumber);
    if (!selfcare) return false;
    return Boolean(destination && destination === selfcare);
  }
  if (!health || !jozi || health === jozi) return false;
  const expected = mode === 'jozi' ? jozi : health;
  return Boolean(destination && expected && destination === expected);
}

export function extractTwilioCallSidFromSipHeaders(headers) {
  const entries = Array.isArray(headers)
    ? headers
        .filter((header) => header?.name && header?.value !== undefined)
        .map((header) => [header.name, header.value])
    : Object.entries(headers || {});
  const values = entries
    .filter(([name]) => canonicalHeaderName(name) === 'xprismindcallid')
    .flatMap(([, value]) => Array.isArray(value) ? value : [value])
    .map((value) => String(value || '').trim())
    .filter(Boolean);

  if (values.length !== 1 || !/^CA[0-9a-f]{32}$/i.test(values[0])) return null;
  return values[0];
}

export async function verifyTwilioRequest(request, env = {}) {
  const authToken = String(env.TWILIO_AUTH_TOKEN || '');
  const suppliedSignature = String(request?.headers?.get('x-twilio-signature') || '');
  const contentType = String(request?.headers?.get('content-type') || '').toLowerCase();
  if (!authToken || !suppliedSignature || !contentType.includes('application/x-www-form-urlencoded')) {
    return false;
  }

  const rawBody = await request.clone().text();
  const params = new URLSearchParams(rawBody);
  let signedPayload = String(request.url || '');
  const names = [...new Set(params.keys())].sort();
  for (const name of names) {
    for (const value of params.getAll(name).sort()) signedPayload += `${name}${value}`;
  }

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(authToken),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
  const expected = bytesToBase64(new Uint8Array(signature));
  return constantTimeEqual(suppliedSignature, expected);
}

export function extractCallerPhoneFromSipHeaders(headers) {
  const entries = Array.isArray(headers)
    ? headers
        .filter((header) => header?.name && header?.value !== undefined)
        .map((header) => [header.name, header.value])
    : Object.entries(headers || {});
  const fromValues = entries
    .filter(([name]) => String(name).trim().toLowerCase() === 'from')
    .flatMap(([, value]) => Array.isArray(value) ? value : [value])
    .map((value) => String(value || '').trim())
    .filter(Boolean);

  if (fromValues.length !== 1) return null;
  const matches = [...fromValues[0].matchAll(/(?:sip|tel):(\+\d{8,15})(?=@|[;>\s]|$)/ig)];
  return matches.length === 1 ? matches[0][1] : null;
}

export function namesReasonablyMatch(statedName, recordName) {
  const stated = normalizePersonName(statedName);
  const recorded = normalizePersonName(recordName);
  if (!stated.length || !recorded.length || stated.length > recorded.length) return false;
  return stated.every((token, index) => nameTokenMatches(token, recorded[index]));
}

function normalizePersonName(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z\s-]/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
}

function nameTokenMatches(stated, recorded) {
  if (stated === recorded) return true;
  if (!stated || !recorded || stated[0] !== recorded[0] || Math.min(stated.length, recorded.length) < 5) {
    return false;
  }
  const distance = levenshteinDistance(stated, recorded);
  return distance <= Math.min(2, Math.floor(Math.max(stated.length, recorded.length) / 4));
}

function levenshteinDistance(left, right) {
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitution = previous[rightIndex - 1] +
        (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1);
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        substitution
      );
    }
    previous = current;
  }
  return previous[right.length];
}

function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : '';
}

function canonicalHeaderName(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/^sipheader[-_]?/i, '')
    .replace(/[-_]/g, '');
}

function bytesToBase64(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function constantTimeEqual(leftValue, rightValue) {
  const left = new TextEncoder().encode(String(leftValue || ''));
  const right = new TextEncoder().encode(String(rightValue || ''));
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) result |= left[index] ^ right[index];
  return result === 0;
}
