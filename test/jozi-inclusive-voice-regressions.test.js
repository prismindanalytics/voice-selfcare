import test from 'node:test';
import assert from 'node:assert/strict';

import {
  JOZI_SUPPORT_CATEGORIES,
  JOZI_SUPPORT_INSTRUCTIONS,
  coordinateJoziSupport,
  resolveJoziSupport
} from '../src/jozi-support.js';

function spokenOption(result) {
  const spokenId = result.spoken_option_ids?.[0];
  return (result.options || []).find((option) => option.id === spokenId);
}

test('Jozi sleep guidance is safe for callers sleeping rough or in shared accommodation', () => {
  const sleepGuidance = JOZI_SUPPORT_INSTRUCTIONS
    .split('\n')
    .filter((line) => /insomnia|sleep|rest|shower|bath|outdoors|rough|shared accommodation/i.test(line))
    .join(' ');

  assert.match(sleepGuidance, /insomnia|trouble sleeping|cannot sleep|can't sleep/i);
  assert.match(sleepGuidance, /sleeping rough|outdoors/i);
  assert.match(sleepGuidance, /shared accommodation|shared sleeping space|shared room|sharing (?:a )?(?:crowded )?room/i);
  assert.match(sleepGuidance, /hot shower|warm shower|bath/i);
  assert.match(sleepGuidance, /never (?:suggest|recommend).*(?:hot|warm) shower|(?:hot|warm) shower.*unless/i);
  assert.match(sleepGuidance, /ask (?:one|a single).*question|first ask.*(?:safe|safety|rest|tonight)/i);
  assert.match(sleepGuidance, /if not.*(?:safe-space|shelter)|(?:unsafe|not safe).*(?:safe_space_navigation|shelter_navigation|somewhere safer|emergency)/i);
});

test('Jozi instructions make the phone-number-to-demo-connection rule explicit', () => {
  assert.match(
    JOZI_SUPPORT_INSTRUCTIONS,
    /(?:whenever|every time|if)[^\n]*(?:speaks?|gives?|reads?)[^\n]*(?:phone )?number[^\n]*(?:offer|invite)[^\n]*(?:connect|connection|handoff|redirection|action)[^\n]*demo/i
  );
});

test('every non-emergency response that speaks a phone number offers one truthful demo action', () => {
  const locations = ['Joubert Park', 'Orlando East', 'Alexandra'];
  const audiences = ['adult', 'child'];
  const timings = ['routine', 'tonight'];
  const contactModes = ['phone', 'either'];
  const checkedActions = new Set();
  let spokenPhoneResponses = 0;

  for (const need of JOZI_SUPPORT_CATEGORIES) {
    for (const location of locations) {
      for (const audience of audiences) {
        for (const timing of timings) {
          for (const contactMode of contactModes) {
            const result = resolveJoziSupport({
              needs: [need],
              location,
              audience,
              timing,
              contact_mode: contactMode,
              safety_context: 'none',
              safe_to_speak: 'yes',
              demo_enabled: true
            });
            const option = spokenOption(result);
            const speaksPhone = option?.phone && result.voiceResponse.includes(option.phone);

            if (result.status === 'urgent_escalation' || !speaksPhone) {
              continue;
            }

            spokenPhoneResponses += 1;
            assert.equal(result.awaiting, 'demo_action_consent', JSON.stringify({ need, location, audience, timing, contactMode }));
            assert.equal(result.suggested_demo_action, 'phone_connection', JSON.stringify({ need, location, audience, timing, contactMode }));
            assert.match(result.voiceResponse, /demo/i);
            assert.match(result.voiceResponse, /\?$/);

            const actionKey = `${option.id}:${result.suggested_demo_action}`;
            if (checkedActions.has(actionKey)) continue;
            checkedActions.add(actionKey);

            const coordinated = coordinateJoziSupport({
              resource_id: option.id,
              action: result.suggested_demo_action,
              demo_enabled: true,
              require_confirmed_consent: true,
              consent_confirmed: true,
              caller_answered_after_offer: true,
              require_offered_resource: true,
              offered_resource_ids: [option.id],
              require_offered_action: true,
              required_action: result.suggested_demo_action
            });

            assert.equal(coordinated.success, true, actionKey);
            assert.equal(coordinated.status, 'simulation_only', actionKey);
            assert.equal(coordinated.live_success, false, actionKey);
            assert.equal(coordinated.submitted, false, actionKey);
            assert.equal(coordinated.confirmed, false, actionKey);
            assert.match(coordinated.voiceResponse, /demo/i, actionKey);
            assert.match(
              coordinated.voiceResponse,
              /not contacted|no live doctor|no call|nobody is connected|No Zlto account/i,
              actionKey
            );
          }
        }
      }
    }
  }

  assert.ok(spokenPhoneResponses >= 100, spokenPhoneResponses);
  assert.ok(checkedActions.size >= 10, checkedActions.size);
});

test('emergency numbers can never be turned into a simulated phone connection', () => {
  for (const resourceId of ['joburg-emergency-connect', 'mobile-emergency-112', 'saps-10111']) {
    const result = coordinateJoziSupport({
      resource_id: resourceId,
      action: 'phone_connection',
      demo_enabled: true,
      require_confirmed_consent: true,
      consent_confirmed: true,
      caller_answered_after_offer: true,
      require_offered_resource: true,
      offered_resource_ids: [resourceId],
      require_offered_action: true,
      required_action: 'phone_connection'
    });

    assert.equal(result.success, false, resourceId);
    assert.equal(result.error, 'demo_action_not_supported', resourceId);
  }

  const emergency = resolveJoziSupport({
    needs: ['healthcare'],
    location: 'Joubert Park',
    audience: 'adult',
    safety_context: 'medical_emergency',
    phone_type: 'mobile',
    demo_enabled: true
  });
  assert.equal(emergency.status, 'urgent_escalation');
  assert.equal(emergency.options[0]?.id, 'mobile-emergency-112');
  assert.ok(!emergency.suggested_demo_action);
  assert.doesNotMatch(emergency.voiceResponse, /demo|connect/i);
});
