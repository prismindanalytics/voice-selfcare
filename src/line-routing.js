export function normalizeLineServiceMode(value, fallback = 'health') {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'health' || normalized === 'jozi') return normalized;

  const fallbackMode = String(fallback || '').trim().toLowerCase();
  return fallbackMode === 'jozi' ? 'jozi' : 'health';
}

export function serviceModeForTwilioVoicePath(path, fallback = 'health') {
  const normalizedPath = String(path || '').toLowerCase().replace(/\/+$/, '') || '/';
  if (/^\/twilio\/voice\/jozi(?:\/(?:pcmu|pcma))?$/.test(normalizedPath)) return 'jozi';
  if (/^\/twilio\/voice\/health(?:\/(?:pcmu|pcma))?$/.test(normalizedPath)) return 'health';
  if (/^\/twilio\/voice(?:\/(?:pcmu|pcma))?$/.test(normalizedPath)) {
    return normalizeLineServiceMode(fallback);
  }
  return null;
}

export function twilioLineBindingMatches({ serviceMode, to, healthNumber, joziNumber }) {
  const mode = String(serviceMode || '').trim().toLowerCase();
  if (!['health', 'jozi'].includes(mode)) return false;
  const destination = normalizePhone(to);
  const health = normalizePhone(healthNumber);
  const jozi = normalizePhone(joziNumber);
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
    .filter(([name]) => canonicalHeaderName(name) === 'xtwilioparentcallsid')
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
