import test from 'node:test';
import assert from 'node:assert/strict';

import {
  JOZI_SUPPORT_RESOURCES,
  buildServiceGreeting,
  coordinateJoziSupport,
  resolveJoziSupport
} from '../src/jozi-support.js';

function wordCount(value) {
  return String(value || '').trim().split(/\s+/).filter(Boolean).length;
}

function questionCount(value) {
  return (String(value || '').match(/\?/g) || []).length;
}

test('the opening is brief, caring, and does not lead with demo limitations', () => {
  for (const mode of ['jozi', 'combined']) {
    const greeting = buildServiceGreeting(mode, true);
    assert.ok(wordCount(greeting) <= 24, greeting);
    assert.equal(questionCount(greeting), 1);
    assert.match(greeting, /I'm here to help/i);
    assert.doesNotMatch(greeting, /cannot|can't|booking|transfer|source-checked|demonstration/i);
  }

  assert.doesNotMatch(buildServiceGreeting('jozi', false), /demo/i);
  assert.doesNotMatch(buildServiceGreeting('combined', false), /demo/i);
});

test('safe tonight plus food asks for missing audience and then stops', () => {
  const result = resolveJoziSupport({
    needs: ['shelter_navigation', 'food'],
    location: 'Joubert Park',
    audience: 'unknown',
    timing: 'tonight',
    safety_context: 'none',
    demo_enabled: true
  });

  assert.equal(result.awaiting, 'audience');
  assert.deepEqual(result.spoken_option_ids, []);
  assert.ok(wordCount(result.voiceResponse) <= 30, result.voiceResponse);
  assert.equal(questionCount(result.voiceResponse), 1);
  assert.match(result.voiceResponse, /adult on your own.*with children.*under 18/i);
  assert.doesNotMatch(result.voiceResponse, /MES|011 725|Kapteijn|first route|another route/i);
  assert.ok(result.voiceResponse.endsWith('?'));
});

test('safe tonight plus food becomes one short caring MES step once details are known', () => {
  const result = resolveJoziSupport({
    needs: ['shelter_navigation', 'food'],
    location: 'Joubert Park',
    audience: 'adult',
    timing: 'tonight',
    safety_context: 'none',
    demo_enabled: true
  });

  assert.deepEqual(result.options.map((option) => option.id), ['mes-johannesburg-navigation']);
  assert.deepEqual(result.uncovered_needs, []);
  assert.deepEqual(result.deferred_needs, []);
  assert.equal(result.suggested_demo_action, 'intake_request');
  assert.equal(result.awaiting, 'demo_action_consent');
  assert.ok(wordCount(result.voiceResponse) <= 55, result.voiceResponse);
  assert.equal(questionCount(result.voiceResponse), 1);
  assert.match(result.voiceResponse, /sort out tonight first/i);
  assert.match(result.voiceResponse, /MES Johannesburg.*shelter assessment and food support/i);
  assert.match(result.voiceResponse, /demo intake check/i);
  assert.doesNotMatch(result.voiceResponse, /Kapteijn|0860 562 874|source-checked|directory|voice response|navigation fallback/i);
  assert.ok(result.voiceResponse.endsWith('?'));
});

test('routine clinic and emotional-support turns invite one demo action without an info dump', () => {
  const clinic = resolveJoziSupport({
    needs: ['healthcare'],
    location: 'Hillbrow',
    audience: 'adult',
    timing: 'routine',
    safety_context: 'none',
    demo_enabled: true
  });
  assert.equal(clinic.suggested_demo_action, 'appointment_request');
  assert.match(clinic.voiceResponse, /sorry.*right care/i);
  assert.match(clinic.voiceResponse, /book the demo appointment now/i);
  assert.doesNotMatch(clinic.voiceResponse, /Klein Streets|queue|not a live booking/i);
  assert.ok(wordCount(clinic.voiceResponse) <= 45, clinic.voiceResponse);

  const emotional = resolveJoziSupport({
    needs: ['mental_health'],
    location: 'Hillbrow',
    audience: 'adult',
    timing: 'now',
    safety_context: 'none',
    demo_enabled: true
  });
  assert.equal(emotional.suggested_demo_action, 'warm_handoff');
  assert.match(emotional.voiceResponse, /don't have to handle this alone/i);
  assert.match(emotional.voiceResponse, /0800 456 789/);
  assert.match(emotional.voiceResponse, /demo connection now/i);
  assert.doesNotMatch(emotional.voiceResponse, /LifeLine|warm handoff|source-checked/i);
  assert.ok(wordCount(emotional.voiceResponse) <= 45, emotional.voiceResponse);
});

test('every demo coordination leads with the completed simulation and then tells the truth once', () => {
  const cases = [
    ['hillbrow-community-health-centre', 'appointment_request', /demo now shows your appointment.*booked/i],
    ['hillbrow-community-health-centre', 'clinician_handoff', /demo now shows a doctor joining shortly/i],
    ['mes-johannesburg-navigation', 'availability_check', /demo now shows the availability check.*complete/i],
    ['mes-johannesburg-navigation', 'intake_request', /demo now shows the intake check.*complete/i],
    ['mes-johannesburg-navigation', 'navigator_handoff', /demo redirection screen.*ready/i],
    ['sadag-mental-health', 'warm_handoff', /demo connection screen.*ready/i],
    ['sanca-soweto', 'assessment_request', /demo now shows the assessment request.*ready/i],
    ['zlto-public-rewards', 'reward_signup', /demo Zlto sign-up and reward journey.*ready/i],
    ['michange-zlto-mes-pathway', 'voucher_pathway', /demo Mi-Change and Zlto partner check.*ready/i]
  ];

  for (const [resourceId, action, positiveOutcome] of cases) {
    const result = coordinateJoziSupport({
      resource_id: resourceId,
      action,
      requested_time: 'tomorrow at 10 AM',
      reference_id: 'JZDEMO-VOICE',
      demo_enabled: true
    });
    assert.equal(result.success, true, action);
    assert.equal(result.simulation, true, action);
    assert.equal(result.live_success, false, action);
    assert.equal(result.submitted, false, action);
    assert.equal(result.confirmed, false, action);
    assert.match(result.voiceResponse, positiveOutcome, action);
    assert.match(result.voiceResponse, /was not contacted|were not contacted|No live doctor|No call|nobody is connected|No Zlto account/i, action);
    assert.doesNotMatch(result.voiceResponse, /JZDEMO-VOICE/, action);
    assert.ok(wordCount(result.voiceResponse) <= 45, `${action}: ${result.voiceResponse}`);
  }
});

test('Zlto and Mi-Change journeys each offer one truthful simulated action', () => {
  const rewards = resolveJoziSupport({
    needs: ['zlto'],
    location: '',
    audience: 'adult',
    safety_context: 'none',
    demo_enabled: true
  });
  assert.deepEqual(rewards.options.map((option) => option.id), ['zlto-public-rewards']);
  assert.equal(rewards.suggested_demo_action, 'reward_signup');
  assert.equal(rewards.awaiting, 'demo_action_consent');
  assert.match(rewards.voiceResponse, /data-free digital wallet/i);
  assert.match(rewards.voiceResponse, /16 or older/i);
  assert.match(rewards.voiceResponse, /zlto dot mobi/i);
  assert.match(rewards.voiceResponse, /demo Zlto reward journey/i);
  assert.equal(questionCount(rewards.voiceResponse), 1);
  assert.ok(wordCount(rewards.voiceResponse) <= 55, rewards.voiceResponse);

  const voucher = resolveJoziSupport({
    needs: ['mi-change'],
    location: 'Hillbrow',
    audience: 'adult',
    safety_context: 'none',
    demo_enabled: true
  });
  assert.deepEqual(voucher.options.map((option) => option.id), ['michange-zlto-mes-pathway']);
  assert.equal(voucher.suggested_demo_action, 'voucher_pathway');
  assert.match(voucher.voiceResponse, /MES.*011 725 6531/i);
  assert.match(voucher.voiceResponse, /demo voucher pathway check/i);
  assert.doesNotMatch(voucher.voiceResponse, /guaranteed|credited|cash/i);
});

test('GBV and sexual-assault support ask whether it is safe to speak before naming a service', () => {
  for (const need of ['gbv_support', 'sexual_assault_care', 'women_children_shelter']) {
    const unknown = resolveJoziSupport({
      needs: [need],
      location: 'Hillbrow',
      audience: 'adult',
      safe_to_speak: 'unknown',
      safety_context: 'none',
      demo_enabled: true
    });
    assert.equal(unknown.awaiting, 'safe_to_speak');
    assert.deepEqual(unknown.options, []);
    assert.match(unknown.voiceResponse, /is it safe for you to speak right now\?/i);
    assert.doesNotMatch(unknown.voiceResponse, /GBV|sexual|shelter|SADAG|Command Centre|Thuthuzela/i);
  }

  const unsafe = resolveJoziSupport({
    needs: ['gbv_support'],
    location: 'Hillbrow',
    audience: 'adult',
    safe_to_speak: 'no',
    safety_context: 'none'
  });
  assert.equal(unsafe.status, 'unsafe_to_speak');
  assert.deepEqual(unsafe.options, []);
  assert.doesNotMatch(unsafe.voiceResponse, /GBV|Command Centre|shelter|address/i);
});

test('ordinary directory metadata does not announce demo rules before an action', () => {
  for (const resource of JOZI_SUPPORT_RESOURCES) {
    assert.doesNotMatch(resource.description, /demo|simulation|not live/i, resource.id);
    assert.doesNotMatch(resource.availabilityNote, /demo|simulation|not live/i, resource.id);
  }
});

test('emergency speech still starts with the action and number', () => {
  const result = resolveJoziSupport({
    needs: ['medical_emergency'],
    location: 'Joubert Park',
    audience: 'adult',
    phone_type: 'mobile',
    safety_context: 'none',
    demo_enabled: true
  });

  assert.equal(result.status, 'urgent_escalation');
  assert.match(result.voiceResponse, /^Call 112 now\./);
  assert.doesNotMatch(result.voiceResponse, /demo|simulation|directory/i);
});

test('online preference never falls back to a phone or physical navigator', () => {
  const onlineOnlyMissing = resolveJoziSupport({
    needs: ['shelter_navigation'],
    location: 'Hillbrow',
    audience: 'adult',
    contact_mode: 'online',
    timing: 'tonight',
    safety_context: 'none',
    demo_enabled: true
  });
  assert.deepEqual(onlineOnlyMissing.options, []);
  assert.match(onlineOnlyMissing.voiceResponse, /phone or in-person route/i);

  const mixed = resolveJoziSupport({
    needs: ['shelter_navigation', 'zlto_rewards'],
    location: 'Hillbrow',
    audience: 'adult',
    contact_mode: 'online',
    timing: 'tonight',
    safety_context: 'none',
    demo_enabled: true
  });
  assert.ok(mixed.options.length > 0);
  assert.ok(mixed.options.every((option) => option.contact_modes.includes('online')));
  assert.doesNotMatch(mixed.voiceResponse, /Joburg Connect|Social Development|011 725 6531/i);
});

test('a mixed daytime-space request describes the selected resource, not the other need', () => {
  for (const needs of [
    ['daytime_community_space', 'healthcare'],
    ['daytime_community_space', 'shelter_navigation']
  ]) {
    const result = resolveJoziSupport({
      needs,
      location: 'Hillbrow',
      audience: 'adult',
      contact_mode: 'either',
      timing: 'today',
      safety_context: 'none'
    });
    assert.doesNotMatch(result.voiceResponse, /(?:Health Centre|MES Johannesburg) is a daytime community place/i);
  }
});
