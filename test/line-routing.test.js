import test from 'node:test';
import assert from 'node:assert/strict';

import {
  extractCallerPhoneFromSipHeaders,
  normalizeLineServiceMode,
  serviceModeForTwilioVoicePath
} from '../src/line-routing.js';

test('line modes fail safely to health', () => {
  assert.equal(normalizeLineServiceMode(' JOZI '), 'jozi');
  assert.equal(normalizeLineServiceMode('health'), 'health');
  assert.equal(normalizeLineServiceMode('combined'), 'health');
  assert.equal(normalizeLineServiceMode('unknown', 'jozi'), 'jozi');
});

test('Twilio voice paths select only explicit health and Jozi profiles', () => {
  assert.equal(serviceModeForTwilioVoicePath('/twilio/voice', 'health'), 'health');
  assert.equal(serviceModeForTwilioVoicePath('/twilio/voice/pcmu', 'health'), 'health');
  assert.equal(serviceModeForTwilioVoicePath('/twilio/voice/health', 'jozi'), 'health');
  assert.equal(serviceModeForTwilioVoicePath('/twilio/voice/health/pcma', 'jozi'), 'health');
  assert.equal(serviceModeForTwilioVoicePath('/twilio/voice/jozi', 'health'), 'jozi');
  assert.equal(serviceModeForTwilioVoicePath('/TWILIO/VOICE/JOZI/PCMU/', 'health'), 'jozi');
  assert.equal(serviceModeForTwilioVoicePath('/twilio/voice/jozi-extra', 'health'), null);
  assert.equal(serviceModeForTwilioVoicePath('/twilio/voice/unknown', 'health'), null);
});

test('caller identity uses the exact SIP From header and never the destination number', () => {
  const toFirst = [
    { name: 'To', value: 'sip:+14255173281@sip.example.com' },
    { name: 'From', value: 'sip:+12065550123@sip.example.com' },
    { name: 'X-Twilio-ParentCallSid', value: 'CA0123456789abcdef0123456789abcdef' }
  ];
  assert.equal(extractCallerPhoneFromSipHeaders(toFirst), '+12065550123');
  assert.equal(extractCallerPhoneFromSipHeaders({ TO: 'sip:+14255173281@example.com', FROM: 'tel:+27821234567' }), '+27821234567');
});

test('ambiguous or malformed SIP From headers remain anonymous', () => {
  assert.equal(extractCallerPhoneFromSipHeaders([{ name: 'To', value: 'sip:+14255173281@example.com' }]), null);
  assert.equal(extractCallerPhoneFromSipHeaders([
    { name: 'From', value: 'sip:+12065550123@example.com' },
    { name: 'from', value: 'sip:+12065550999@example.com' }
  ]), null);
  assert.equal(extractCallerPhoneFromSipHeaders([
    { name: 'From', value: '"+27821234567" <sip:+12065550123@example.com>' }
  ]), '+12065550123');
  assert.equal(extractCallerPhoneFromSipHeaders({
    From: ['sip:+12065550123@example.com', 'sip:+12065550999@example.com']
  }), null);
  assert.equal(extractCallerPhoneFromSipHeaders([{ name: 'From', value: 'sip:2065550123@example.com' }]), null);
  assert.equal(extractCallerPhoneFromSipHeaders([{ name: 'From', value: 'anonymous' }]), null);
});
