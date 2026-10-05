import test from 'node:test';
import assert from 'node:assert/strict';

import {
  JOZI_SUPPORT_RESOURCES,
  applyJoziCityFallbackDecision,
  buildJoziPendingLookupContext,
  mergeJoziSupportContext,
  isImmediateJoziConsentTurn,
  stripUntrustedJoziInternalArgs,
  resolveJoziSupport
} from '../src/jozi-support.js';

const ROUTINE_CITY_NAVIGATION_IDS = new Set([
  'coj-general-services',
  'coj-region-f-social-services',
  'coj-region-d-social-services'
]);

const ROUTINE_CITY_SPOKEN_PATTERN =
  /City of Johannesburg (?:General Services|Region [DF] (?:Social Services|Social Development))|0860 562 874/i;

function returnedIds(result) {
  return new Set([
    ...(result.options || []).map((option) => option.id),
    ...(result.spoken_option_ids || []),
    ...(result.pending_option_ids || [])
  ]);
}

function assertNoRoutineCity(result, label = 'result') {
  for (const id of returnedIds(result)) {
    assert.equal(
      ROUTINE_CITY_NAVIGATION_IDS.has(id),
      false,
      `${label} exposed routine City fallback ${id}`
    );
  }
  assert.doesNotMatch(result.voiceResponse || '', ROUTINE_CITY_SPOKEN_PATTERN, label);
}

function assertOneWarmQuestion(result, awaiting, label) {
  assert.equal(result.awaiting, awaiting, label);
  assert.deepEqual(result.options || [], [], label);
  assert.deepEqual(result.spoken_option_ids || [], [], label);
  assert.deepEqual(result.pending_option_ids || [], [], label);
  assert.equal((result.voiceResponse.match(/\?/g) || []).length, 1, label);
  assert.match(result.voiceResponse, /^(?:I hear you|I can|I want|I have|I'm|Before|Okay)/i, label);
  assert.doesNotMatch(result.voiceResponse, /\b(?:can't|cannot)\b|directory|navigation fallback/i, label);
  assertNoRoutineCity(result, label);
}

test('routine City navigation resources are explicitly marked as fallback-only', () => {
  const actual = JOZI_SUPPORT_RESOURCES
    .filter((resource) => resource.fallbackOnly)
    .map((resource) => resource.id);

  assert.deepEqual(new Set(actual), ROUTINE_CITY_NAVIGATION_IDS);
  assert.equal(
    JOZI_SUPPORT_RESOURCES.find((resource) => resource.id === 'joburg-emergency-connect')?.fallbackOnly,
    undefined,
    'the emergency line is a safety route, not a routine City fallback'
  );
});

test('Journey 1 keeps tonight, food, and shelter with MES and does not queue City next', () => {
  const result = resolveJoziSupport({
    needs: ['safe_space_navigation', 'food'],
    safe_site_type: 'tonight',
    location: 'Joubert Park, Johannesburg CBD',
    audience: 'adult',
    timing: 'tonight',
    safety_context: 'none'
  });

  assert.equal(result.options[0]?.id, 'mes-johannesburg-navigation');
  assert.deepEqual(result.spoken_option_ids, ['mes-johannesburg-navigation']);
  assertNoRoutineCity(result, 'Journey 1');
});

test('eligible partner and specialist services suppress routine City options across core journeys', () => {
  const cases = [
    ['safe site', {
      needs: ['safe_space_navigation'], location: 'Hillbrow', audience: 'adult', safety_context: 'none'
    }, 'mes-johannesburg-navigation'],
    ['daytime space', {
      needs: ['daytime_community_space'], location: 'Hillbrow', audience: 'adult', safety_context: 'none'
    }, 'hillbrow-recreation-centre'],
    ['clinic', {
      needs: ['healthcare'], location: 'Hillbrow', audience: 'adult', safety_context: 'none'
    }, 'hillbrow-community-health-centre'],
    ['mental health', {
      needs: ['mental_health'], location: 'Johannesburg', audience: 'adult', safety_context: 'none'
    }, 'sadag-mental-health'],
    ['inner-city social support', {
      needs: ['social_support'], location: 'Hillbrow', audience: 'adult', safety_context: 'none'
    }, 'mes-johannesburg-navigation'],
    ['citywide homelessness navigation', {
      needs: ['social_support'], location: 'Alexandra', audience: 'adult', safety_context: 'none'
    }, 'joburg-homelessness-network'],
    ['family support', {
      needs: ['family_support'], location: 'Diepkloof', audience: 'family', safety_context: 'none'
    }, 'childline-pfunanani-soweto'],
    ['child support', {
      needs: ['child_safety'], location: 'Johannesburg CBD', audience: 'child', safety_context: 'none'
    }, 'childline-116'],
    ['GBV support', {
      needs: ['gbv_support'], location: 'Johannesburg CBD', audience: 'adult', safe_to_speak: 'yes', safety_context: 'none'
    }, 'gbv-command-centre']
  ];

  for (const [label, query, expectedFirst] of cases) {
    const result = resolveJoziSupport(query);
    assert.equal(result.options[0]?.id, expectedFirst, label);
    assertNoRoutineCity(result, label);
  }
});

test('missing, broad, or placeholder locations get one warm clarification before any City fallback', () => {
  const cases = [
    ['missing shelter location', {
      needs: ['shelter_navigation'], location: '', audience: 'adult', safety_context: 'none'
    }],
    ['unknown safe-site location', {
      needs: ['safe_space_navigation'], location: 'unknown', audience: 'adult', safety_context: 'none'
    }],
    ['near-me daytime location', {
      needs: ['daytime_community_space'], location: 'near me', audience: 'adult', safety_context: 'none'
    }],
    ['broad clinic location', {
      needs: ['healthcare'], location: 'Johannesburg', audience: 'adult', safety_context: 'none'
    }],
    ['broad Soweto social-support location', {
      needs: ['social_support'], location: 'Soweto, Johannesburg', audience: 'adult', safety_context: 'none'
    }],
    ['placeholder family-shelter location', {
      needs: ['women_children_shelter'], location: 'not provided', audience: 'family', safe_to_speak: 'yes', safety_context: 'none'
    }]
  ];

  for (const [label, query] of cases) {
    assertOneWarmQuestion(resolveJoziSupport(query), 'location', label);
  }
});

test('decorated specific locations retain the local non-City route', () => {
  const cases = [
    ['shelter', 'Joubert Park, Johannesburg CBD', 'mes-johannesburg-navigation'],
    ['social support', 'near Constitution Hill in Hillbrow, Johannesburg', 'mes-johannesburg-navigation'],
    ['clinic', 'Hillbrow, Johannesburg', 'hillbrow-community-health-centre'],
    ['daytime space', 'near Constitution Hill in Hillbrow, Johannesburg', 'hillbrow-recreation-centre']
  ];

  for (const [needLabel, location, expected] of cases) {
    const needs = needLabel === 'shelter'
      ? ['shelter_navigation']
      : needLabel === 'social support'
        ? ['social_support']
        : needLabel === 'clinic'
          ? ['healthcare']
          : ['daytime_community_space'];
    const result = resolveJoziSupport({ needs, location, audience: 'adult', safety_context: 'none' });
    assert.equal(result.options[0]?.id, expected, `${needLabel}: ${location}`);
    assertNoRoutineCity(result, `${needLabel}: ${location}`);
  }
});

test('safe-space and shelter wording both use the homelessness network before City', () => {
  for (const need of ['safe_space_navigation', 'shelter_navigation']) {
    const result = resolveJoziSupport({
      needs: [need],
      location: 'Alexandra',
      audience: 'adult',
      timing: 'tonight',
      safety_context: 'none'
    });
    assert.equal(result.options[0]?.id, 'joburg-homelessness-network', need);
    assertNoRoutineCity(result, need);
  }
});

test('after-hours requests keep eligible 24-hour or call-first partners ahead of City', () => {
  const cases = [
    ['tonight safe site and food', {
      needs: ['safe_space_navigation', 'food'], location: 'Joubert Park', audience: 'adult', timing: 'tonight', safety_context: 'none'
    }, 'mes-johannesburg-navigation'],
    ['tonight clinic', {
      needs: ['healthcare'], location: 'Hillbrow', audience: 'adult', timing: 'tonight', safety_context: 'none'
    }, 'hillbrow-community-health-centre'],
    ['mental health now', {
      needs: ['mental_health'], location: 'Hillbrow', audience: 'adult', timing: 'now', safety_context: 'none'
    }, 'sadag-mental-health'],
    ['social support tonight', {
      needs: ['social_support'], location: 'Hillbrow', audience: 'adult', timing: 'tonight', safety_context: 'none'
    }, 'mes-johannesburg-navigation'],
    ['specialist GBV healthcare tonight', {
      needs: ['gbv_healthcare'], location: 'Soweto', audience: 'adult', timing: 'tonight', safe_to_speak: 'yes', safety_context: 'none'
    }, 'nthabiseng-thuthuzela-care-centre']
  ];

  for (const [label, query, expectedFirst] of cases) {
    const result = resolveJoziSupport(query);
    assert.equal(result.options[0]?.id, expectedFirst, label);
    assertNoRoutineCity(result, label);
  }

  const closedDaytime = resolveJoziSupport({
    needs: ['daytime_community_space'],
    location: 'Hillbrow',
    audience: 'adult',
    timing: 'tonight',
    safety_context: 'none'
  });
  assertOneWarmQuestion(closedDaytime, 'safe_space_type', 'daytime space requested tonight');
});

test('online and in-person preferences do not silently unlock or queue City', () => {
  const online = resolveJoziSupport({
    needs: ['social_support'],
    location: 'Hillbrow',
    audience: 'adult',
    contact_mode: 'online',
    safety_context: 'none'
  });
  assertOneWarmQuestion(online, 'contact_mode', 'online social support');

  const inPersonMentalHealth = resolveJoziSupport({
    needs: ['mental_health'],
    location: 'Hillbrow',
    audience: 'adult',
    contact_mode: 'in_person',
    safety_context: 'none'
  });
  assert.equal(inPersonMentalHealth.options[0]?.id, 'sadag-mental-health');
  assert.equal(inPersonMentalHealth.phoneAlternatives, true);
  assertNoRoutineCity(inPersonMentalHealth, 'in-person mental health');

  for (const [label, query, expectedFirst] of [
    ['in-person social support', {
      needs: ['social_support'], location: 'Hillbrow', audience: 'adult', contact_mode: 'in_person', safety_context: 'none'
    }, 'mes-johannesburg-navigation'],
    ['in-person family support', {
      needs: ['family_support'], location: 'Diepkloof', audience: 'family', contact_mode: 'in_person', safety_context: 'none'
    }, 'childline-pfunanani-soweto']
  ]) {
    const result = resolveJoziSupport(query);
    assert.equal(result.options[0]?.id, expectedFirst, label);
    assertNoRoutineCity(result, label);
  }
});

test('specific unmatched requests require explicit consent before City is returned', () => {
  const query = {
    needs: ['women_children_shelter'],
    location: 'Alexandra, Johannesburg',
    audience: 'family',
    safe_to_speak: 'yes',
    safety_context: 'none'
  };

  const beforeConsent = resolveJoziSupport(query);
  assert.equal(beforeConsent.success, false);
  assertOneWarmQuestion(beforeConsent, 'city_fallback_consent', 'before City fallback consent');
  assert.match(beforeConsent.voiceResponse, /haven't found|have not found|couldn't find/i);
  assert.match(beforeConsent.voiceResponse, /City/i);

  const afterConsent = resolveJoziSupport({ ...query, allow_city_fallback: true });
  assert.equal(afterConsent.options[0]?.id, 'coj-general-services');
  assert.deepEqual(afterConsent.spoken_option_ids, ['coj-general-services']);
  assert.match(afterConsent.voiceResponse, /City of Johannesburg General Services/i);

  const regionD = resolveJoziSupport({
    ...query,
    location: 'Orlando West',
    allow_city_fallback: true
  });
  assert.equal(regionD.options[0]?.id, 'coj-region-d-social-services');
  assert.deepEqual(regionD.spoken_option_ids, ['coj-region-d-social-services']);
});

test('City fallback consent never displaces an eligible non-City service', () => {
  const cases = [
    ['MES', {
      needs: ['safe_space_navigation', 'food'], location: 'Joubert Park', audience: 'adult', timing: 'tonight', safety_context: 'none'
    }, 'mes-johannesburg-navigation'],
    ['homelessness network', {
      needs: ['social_support'], location: 'Alexandra', audience: 'adult', safety_context: 'none'
    }, 'joburg-homelessness-network'],
    ['family specialist', {
      needs: ['family_support'], location: 'Diepkloof', audience: 'family', safety_context: 'none'
    }, 'childline-pfunanani-soweto'],
    ['GBV specialist', {
      needs: ['gbv_support'], location: 'Soweto', audience: 'adult', safe_to_speak: 'yes', safety_context: 'none'
    }, 'gbv-command-centre']
  ];

  for (const [label, query, expectedFirst] of cases) {
    const result = resolveJoziSupport({ ...query, allow_city_fallback: true });
    assert.equal(result.options[0]?.id, expectedFirst, label);
    assertNoRoutineCity(result, label);
  }
});

test('mixed requests respect safety priority and never queue City behind a pending partner', () => {
  const higherPriorityShelter = resolveJoziSupport({
    needs: ['women_children_shelter', 'mental_health'],
    location: 'Orlando East',
    audience: 'family',
    safe_to_speak: 'yes',
    safety_context: 'none'
  });
  assertOneWarmQuestion(higherPriorityShelter, 'city_fallback_consent', 'higher-priority shelter need');
  assert.equal(higherPriorityShelter.city_fallback_need, 'women_children_shelter');

  const criticalFirst = resolveJoziSupport({
    needs: ['women_children_shelter', 'mental_health_crisis'],
    location: 'Orlando East',
    audience: 'family',
    safe_to_speak: 'yes',
    safety_context: 'none'
  });
  assert.equal(criticalFirst.options[0]?.id, 'sadag-suicide-crisis');
  assert.notEqual(criticalFirst.awaiting, 'city_fallback_consent');
  assertNoRoutineCity(criticalFirst, 'critical support first');
  assert.doesNotMatch(criticalFirst.voiceResponse, /What nearby area/i);

  const ordinaryPartnerFirst = resolveJoziSupport({
    needs: ['social_relief', 'mental_health'],
    location: 'Hillbrow',
    audience: 'adult',
    timing: 'tonight',
    safety_context: 'none'
  });
  assert.equal(ordinaryPartnerFirst.options[0]?.id, 'sadag-mental-health');
  assert.notEqual(ordinaryPartnerFirst.awaiting, 'city_fallback_consent');
  assert.doesNotMatch(ordinaryPartnerFirst.voiceResponse, /What nearby area/i);
  assertNoRoutineCity(ordinaryPartnerFirst, 'ordinary partner first');

  const childSpecialistsFirst = resolveJoziSupport({
    needs: ['shelter_navigation', 'gbv_healthcare'],
    location: 'Hillbrow',
    audience: 'child',
    safe_to_speak: 'yes',
    safety_context: 'none'
  });
  assert.equal(childSpecialistsFirst.options[0]?.id, 'childline-116');
  assert.equal(
    childSpecialistsFirst.pending_option_ids.includes('hillbrow-clinical-forensic-medical-service'),
    true
  );
  assert.notEqual(childSpecialistsFirst.awaiting, 'city_fallback_consent');
  assert.doesNotMatch(childSpecialistsFirst.voiceResponse, /What nearby area/i);
  assertNoRoutineCity(childSpecialistsFirst, 'child specialists first');

  const childShelter = resolveJoziSupport({
    needs: ['shelter_navigation'],
    location: 'Hillbrow',
    audience: 'child',
    safety_context: 'none'
  });
  assert.equal(childShelter.options[0]?.id, 'childline-116');
  assert.deepEqual(childShelter.uncovered_needs, []);
  assert.notEqual(childShelter.awaiting, 'support_need');
  assertNoRoutineCity(childShelter, 'child shelter specialist');

  const safetyBeforeRoutine = resolveJoziSupport({
    needs: ['employment', 'women_children_shelter'],
    location: 'Alexandra',
    audience: 'family',
    safe_to_speak: 'yes',
    safety_context: 'none'
  });
  assertOneWarmQuestion(safetyBeforeRoutine, 'city_fallback_consent', 'shelter before routine work support');
  assert.equal(safetyBeforeRoutine.city_fallback_need, 'women_children_shelter');

  const unresolvedShelterOnly = resolveJoziSupport({
    needs: ['women_children_shelter'],
    location: 'Orlando East',
    audience: 'family',
    safe_to_speak: 'yes',
    safety_context: 'none'
  });
  assertOneWarmQuestion(unresolvedShelterOnly, 'city_fallback_consent', 'shelter after partner step');
});

test('last-option consent retains context and unlocks City only on the next lookup', () => {
  const query = {
    needs: ['women_children_shelter'],
    location: 'Orlando East',
    audience: 'family',
    safe_to_speak: 'yes',
    safety_context: 'none'
  };
  const offer = resolveJoziSupport(query);
  const pending = buildJoziPendingLookupContext(query, offer);
  assert.equal(offer.awaiting, 'city_fallback_consent');
  assert.deepEqual(pending.needs, ['women_children_shelter']);
  assert.equal(pending.location, 'Orlando East');

  const contextual = mergeJoziSupportContext(pending, {
    needs: [],
    audience: 'family',
    safety_context: 'none'
  });
  const consented = resolveJoziSupport({ ...contextual, allow_city_fallback: true });
  assert.equal(consented.options[0]?.id, 'coj-region-d-social-services');
});

test('mixed critical support defers City until the unresolved need is retried alone', () => {
  const cases = [
    {
      label: 'shelter need before crisis need',
      needs: ['women_children_shelter', 'mental_health_crisis'],
      location: 'Orlando East',
      audience: 'family',
      safe_to_speak: 'yes',
      expectedFirst: 'sadag-suicide-crisis',
      expectedFallbackNeed: 'women_children_shelter',
      expectedQueue: ['women_children_shelter'],
      expectedCity: 'coj-region-d-social-services'
    },
    {
      label: 'crisis need before shelter need',
      needs: ['mental_health_crisis', 'women_children_shelter'],
      location: 'Orlando East',
      audience: 'family',
      expectedFirst: 'sadag-suicide-crisis',
      expectedFallbackNeed: 'women_children_shelter',
      expectedQueue: ['women_children_shelter'],
      expectedCity: 'coj-region-d-social-services'
    },
    {
      label: 'highest-priority unresolved need wins even when a lower-priority fallback need appears first',
      needs: ['mental_health_crisis', 'older_person_support', 'women_children_shelter'],
      location: 'Alexandra',
      audience: 'family',
      expectedFirst: 'sadag-suicide-crisis',
      expectedFallbackNeed: 'women_children_shelter',
      expectedQueue: ['women_children_shelter', 'older_person_support'],
      expectedCity: 'coj-general-services'
    },
  ];

  for (const entry of cases) {
    const query = {
      needs: entry.needs,
      location: entry.location,
      audience: entry.audience,
      safe_to_speak: 'yes',
      safety_context: 'none'
    };
    const first = resolveJoziSupport(query);
    assert.equal(first.options[0]?.id, entry.expectedFirst, entry.label);
    assert.notEqual(first.awaiting, 'city_fallback_consent', entry.label);
    assertNoRoutineCity(first, entry.label);
    assert.equal(first.awaiting, 'support_need', entry.label);
    assert.equal(first.next_need, entry.expectedFallbackNeed, entry.label);

    const pending = buildJoziPendingLookupContext(query, first);
    const nextTurn = mergeJoziSupportContext(pending, {
      needs: [],
      audience: entry.audience,
      safe_to_speak: 'yes',
      safety_context: 'none'
    });
    assert.deepEqual(nextTurn.needs, entry.expectedQueue, entry.label);

    const modelReplaysAllNeeds = mergeJoziSupportContext(pending, {
      needs: query.needs,
      audience: entry.audience,
      safe_to_speak: 'yes',
      safety_context: 'none'
    });
    assert.deepEqual(modelReplaysAllNeeds.needs, entry.expectedQueue, `${entry.label}: full replay`);

    const offer = resolveJoziSupport(nextTurn);
    assert.equal(offer.awaiting, 'city_fallback_consent', entry.label);
    assert.equal(offer.city_fallback_need, entry.expectedFallbackNeed, entry.label);

    const consented = resolveJoziSupport({
      ...query,
      needs: [offer.city_fallback_need],
      allow_city_fallback: true,
      authorized_city_fallback_need: offer.city_fallback_need
    });
    assert.equal(consented.options[0]?.id, entry.expectedCity, entry.label);
    assert.deepEqual(consented.spoken_option_ids, [entry.expectedCity], entry.label);
    assert.notEqual(consented.awaiting, 'city_fallback_consent', entry.label);
  }
});

test('an unmatched high-priority family shelter need is handled before a routine matched need', () => {
  for (const needs of [
    ['women_children_shelter', 'employment'],
    ['employment', 'women_children_shelter']
  ]) {
    const result = resolveJoziSupport({
      needs,
      location: 'Alexandra',
      audience: 'family',
      safe_to_speak: 'yes',
      safety_context: 'none'
    });

    assert.equal(result.awaiting, 'city_fallback_consent');
    assert.equal(result.city_fallback_need, 'women_children_shelter');
    assert.deepEqual(result.options, []);
    assert.doesNotMatch(result.voiceResponse, /work and skills|employment/i);
    assertNoRoutineCity(result, needs.join(' then '));
  }
});

test('a child shelter continuation cannot replay the same Childline step forever', () => {
  const query = {
    needs: ['shelter_navigation'],
    location: 'Hillbrow',
    audience: 'child',
    safe_to_speak: 'yes',
    safety_context: 'none'
  };
  const first = resolveJoziSupport(query);
  assert.equal(first.options[0]?.id, 'childline-116');

  const pending = buildJoziPendingLookupContext(query, first);
  const sparseNextTurn = mergeJoziSupportContext(pending, {
    needs: [],
    safety_context: 'none'
  });
  const second = resolveJoziSupport(sparseNextTurn);

  assert.notDeepEqual(
    [second.awaiting, second.next_need, second.spoken_option_ids, second.voiceResponse],
    [first.awaiting, first.next_need, first.spoken_option_ids, first.voiceResponse],
    'a new caller turn accepting the pending shelter step must advance the conversation'
  );
  assertNoRoutineCity(first, 'child shelter first step');
  assertNoRoutineCity(second, 'child shelter continuation before City consent');
});

test('urgent safety routing remains immediate and is exempt from routine City consent', () => {
  const cases = [
    ['medical emergency', {
      needs: ['healthcare'], location: 'Hillbrow', audience: 'adult', safety_context: 'medical_emergency'
    }, 'joburg-emergency-connect'],
    ['fire emergency', {
      needs: ['fire_emergency'], location: 'Soweto', audience: 'family', safety_context: 'none'
    }, 'joburg-emergency-connect'],
    ['violence emergency', {
      needs: ['violence_emergency'], location: 'Johannesburg CBD', audience: 'adult', safety_context: 'none'
    }, 'saps-10111'],
    ['immediate danger on mobile', {
      needs: ['safe_space_navigation'], safe_site_type: 'danger_now', location: 'Hillbrow', audience: 'adult', phone_type: 'mobile', safety_context: 'none'
    }, 'mobile-emergency-112']
  ];

  for (const [label, query, expectedFirst] of cases) {
    const result = resolveJoziSupport(query);
    assert.equal(result.status, 'urgent_escalation', label);
    assert.equal(result.options[0]?.id, expectedFirst, label);
    assert.notEqual(result.awaiting, 'city_fallback_consent', label);
    assertNoRoutineCity(result, label);
  }
});

test('demo actions retain and advance the next unresolved need instead of replaying the first route', () => {
  const cases = [
    {
      label: 'crisis then family shelter',
      query: {
        needs: ['mental_health_crisis', 'women_children_shelter'],
        location: 'Orlando East',
        audience: 'family',
        safe_to_speak: 'yes'
      },
      first: 'sadag-suicide-crisis',
      nextNeed: 'women_children_shelter',
      secondAwaiting: 'city_fallback_consent'
    },
    {
      label: 'child safety then GBV healthcare',
      query: {
        needs: ['shelter_navigation', 'gbv_healthcare'],
        location: 'Hillbrow',
        audience: 'child',
        safe_to_speak: 'yes'
      },
      first: 'childline-116',
      nextNeed: 'gbv_healthcare',
      second: 'hillbrow-clinical-forensic-medical-service'
    },
    {
      label: 'crisis then MES safe-space route',
      query: {
        needs: ['safe_space_navigation', 'mental_health_crisis'],
        location: 'Joubert Park',
        audience: 'adult',
        timing: 'tonight'
      },
      first: 'sadag-suicide-crisis',
      nextNeed: 'safe_space_navigation',
      second: 'mes-johannesburg-navigation'
    }
  ];

  for (const entry of cases) {
    const query = { ...entry.query, safety_context: 'none', demo_enabled: true };
    const first = resolveJoziSupport(query);
    assert.equal(first.spoken_option_ids[0], entry.first, entry.label);
    assert.equal(first.awaiting, 'demo_action_consent', entry.label);
    assert.equal(first.next_need, entry.nextNeed, entry.label);

    const pending = buildJoziPendingLookupContext(query, first);
    assert.equal(pending.continuation_need, entry.nextNeed, entry.label);
    const replayed = mergeJoziSupportContext(pending, query);
    assert.deepEqual(replayed.needs, [entry.nextNeed], entry.label);

    for (const defaults of [
      { coordination_preference: 'none' },
      { detail_requested: 'recommendation' }
    ]) {
      const replayedWithDefaults = mergeJoziSupportContext(pending, { ...query, ...defaults });
      assert.deepEqual(replayedWithDefaults.needs, [entry.nextNeed], `${entry.label}: defaults`);
    }

    const replayedWithNewNeed = mergeJoziSupportContext(pending, {
      ...query,
      needs: [...query.needs, 'food']
    });
    assert.deepEqual(replayedWithNewNeed.needs, [entry.nextNeed, 'food'], `${entry.label}: new need`);

    const second = resolveJoziSupport(replayed);
    if (entry.second) assert.equal(second.spoken_option_ids[0], entry.second, entry.label);
    if (entry.secondAwaiting) assert.equal(second.awaiting, entry.secondAwaiting, entry.label);
    assert.notEqual(second.spoken_option_ids[0], entry.first, entry.label);
  }
});

test('an ordered continuation queue completes every remaining need without restarting the first route', () => {
  const query = {
    needs: ['safe_space_navigation', 'food', 'mental_health_crisis'],
    location: 'Joubert Park',
    audience: 'adult',
    timing: 'tonight',
    safety_context: 'none',
    demo_enabled: true
  };
  const first = resolveJoziSupport(query);
  assert.equal(first.spoken_option_ids[0], 'sadag-suicide-crisis');
  assert.deepEqual(first.handled_needs, ['mental_health_crisis']);

  const pending = buildJoziPendingLookupContext(query, first);
  assert.deepEqual(pending.continuation_needs, ['safe_space_navigation', 'food']);
  const nextTurn = mergeJoziSupportContext(pending, query);
  assert.deepEqual(nextTurn.needs, ['safe_space_navigation', 'food']);

  const second = resolveJoziSupport(nextTurn);
  assert.equal(second.spoken_option_ids[0], 'mes-johannesburg-navigation');
  assert.deepEqual(new Set(second.handled_needs), new Set(['safe_space_navigation', 'food']));
  assert.equal(second.next_need, '');
  const finalContext = buildJoziPendingLookupContext(nextTurn, second);
  assert.deepEqual(finalContext.continuation_needs, []);
  assert.deepEqual(new Set(finalContext.current_route_needs), new Set(['safe_space_navigation', 'food']));
  assert.deepEqual(
    new Set(finalContext.completed_needs),
    new Set(['mental_health_crisis', 'safe_space_navigation', 'food'])
  );
});

test('a three-step child journey does not re-add a route that was already handled', () => {
  const query = {
    needs: ['shelter_navigation', 'gbv_healthcare', 'healthcare'],
    location: 'Hillbrow',
    audience: 'child',
    safe_to_speak: 'yes',
    safety_context: 'none',
    demo_enabled: true
  };
  const first = resolveJoziSupport(query);
  assert.equal(first.spoken_option_ids[0], 'childline-116');

  const firstPending = buildJoziPendingLookupContext(query, first);
  const secondArgs = mergeJoziSupportContext(firstPending, query);
  const second = resolveJoziSupport(secondArgs);
  assert.equal(second.spoken_option_ids[0], 'hillbrow-clinical-forensic-medical-service');

  const secondPending = buildJoziPendingLookupContext(secondArgs, second);
  assert.deepEqual(secondPending.continuation_needs, ['healthcare']);
  const thirdArgs = mergeJoziSupportContext(secondPending, query);
  assert.deepEqual(thirdArgs.needs, ['healthcare']);
  const third = resolveJoziSupport(thirdArgs);
  assert.equal(third.spoken_option_ids[0], 'hillbrow-community-health-centre');
  assert.notEqual(third.spoken_option_ids[0], 'childline-116');
});

test('an accepted City fallback retains lower-priority partner needs for the next step', () => {
  const cityStep = resolveJoziSupport({
    needs: ['women_children_shelter'],
    continuation_needs: ['mental_health', 'food'],
    location: 'Orlando East',
    audience: 'family',
    safe_to_speak: 'yes',
    safety_context: 'none',
    allow_city_fallback: true,
    demo_enabled: true
  });
  assert.equal(cityStep.spoken_option_ids[0], 'coj-region-d-social-services');
  assert.deepEqual(cityStep.handled_needs, ['women_children_shelter']);
  assert.equal(cityStep.next_need, 'mental_health');

  const pending = buildJoziPendingLookupContext({}, cityStep);
  assert.deepEqual(pending.continuation_needs, ['mental_health', 'food']);
  const nextTurn = mergeJoziSupportContext(pending, {
    needs: ['women_children_shelter', 'mental_health', 'food'],
    safety_context: 'none'
  });
  assert.deepEqual(nextTurn.needs, ['mental_health', 'food']);
  const partnerStep = resolveJoziSupport(nextTurn);
  assert.equal(partnerStep.spoken_option_ids[0], 'sadag-mental-health');
  assert.notEqual(partnerStep.awaiting, 'city_fallback_consent');
});

test('City consent and decline each advance once while preserving every non-City need', () => {
  const offer = {
    active: true,
    fallback_need: 'women_children_shelter',
    remaining_needs: ['mental_health']
  };
  const contextualArgs = {
    needs: ['women_children_shelter', 'mental_health', 'food'],
    location: 'Orlando East',
    audience: 'family'
  };

  const accepted = applyJoziCityFallbackDecision({
    contextualArgs,
    offer,
    consentProvided: true,
    consentConfirmed: true,
    callerAnswered: true
  });
  assert.equal(accepted.accepted, true);
  assert.deepEqual(accepted.contextualArgs.needs, ['women_children_shelter']);
  assert.deepEqual(accepted.contextualArgs.continuation_needs, ['mental_health', 'food']);

  const declined = applyJoziCityFallbackDecision({
    contextualArgs,
    offer,
    consentProvided: true,
    consentConfirmed: false,
    callerAnswered: true
  });
  assert.equal(declined.declined, true);
  assert.equal(declined.contextualArgs.allow_city_fallback, false);
  assert.equal(declined.contextualArgs.allowCityFallback, undefined);
  assert.equal(declined.contextualArgs.suppress_city_fallback, true);
  assert.deepEqual(declined.contextualArgs.needs, ['mental_health', 'food']);
  assert.deepEqual(declined.contextualArgs.prior_needs, ['women_children_shelter', 'mental_health', 'food']);

  const stale = applyJoziCityFallbackDecision({
    contextualArgs,
    offer,
    consentProvided: true,
    consentConfirmed: true,
    callerAnswered: false
  });
  assert.equal(stale.accepted, false);
  assert.deepEqual(stale.contextualArgs.needs, contextualArgs.needs);
});

test('City acceptance never overrides a crisis or critical safety need stated in the same answer', () => {
  const base = {
    needs: ['women_children_shelter'],
    location: 'Orlando East',
    audience: 'family',
    safe_to_speak: 'yes',
    safety_context: 'none'
  };
  for (const criticalNeed of ['medical_emergency', 'suicide_imminent', 'mental_health_crisis', 'child_safety', 'gbv_healthcare']) {
    const decision = applyJoziCityFallbackDecision({
      contextualArgs: { ...base, needs: [...base.needs, criticalNeed] },
      offer: { active: true, fallback_need: 'women_children_shelter' },
      consentProvided: true,
      consentConfirmed: true,
      callerAnswered: true
    });
    assert.equal(decision.accepted, false, criticalNeed);
    assert.equal(decision.deferred, true, criticalNeed);
    const result = resolveJoziSupport({ ...decision.contextualArgs, demo_enabled: true });
    assert.notEqual(result.spoken_option_ids?.[0], 'coj-region-d-social-services', criticalNeed);
    if (['medical_emergency', 'suicide_imminent'].includes(criticalNeed)) {
      assert.equal(result.emergency, true, criticalNeed);
    } else {
      assert.ok(result.handled_needs?.includes(criticalNeed), criticalNeed);
    }
  }
});

test('model-supplied City aliases cannot bypass the authenticated consent decision', () => {
  const callerArgs = stripUntrustedJoziInternalArgs({
      needs: ['women_children_shelter'],
      location: 'Orlando East',
      audience: 'family',
      safe_to_speak: 'yes',
      allowCityFallback: true,
      allow_city_fallback: true,
      completed_needs: ['women_children_shelter'],
      continuation_needs: ['city_service_navigation']
  });
  assert.equal(callerArgs.allowCityFallback, undefined);
  assert.equal(callerArgs.completed_needs, undefined);
  const decision = applyJoziCityFallbackDecision({
    contextualArgs: callerArgs,
    offer: {},
    consentProvided: false,
    callerAnswered: false
  });
  assert.equal(decision.contextualArgs.allowCityFallback, undefined);
  assert.equal(decision.contextualArgs.allow_city_fallback, false);
  const result = resolveJoziSupport(decision.contextualArgs);
  assert.equal(result.awaiting, 'city_fallback_consent');
  assert.deepEqual(result.spoken_option_ids, []);
});

test('private continuation state survives a location clarification without restarting handled routes', () => {
  const original = {
    needs: ['shelter_navigation', 'healthcare', 'mental_health', 'legal_support'],
    location: 'Hillbrow',
    audience: 'adult',
    timing: 'tonight',
    safety_context: 'none',
    demo_enabled: true
  };
  let args = original;
  for (const expected of ['mes-johannesburg-navigation', 'hillbrow-community-health-centre', 'sadag-mental-health']) {
    const result = resolveJoziSupport(args);
    assert.equal(result.spoken_option_ids[0], expected);
    const pending = buildJoziPendingLookupContext(args, result);
    args = mergeJoziSupportContext(pending, original);
  }
  const noLocalLegal = resolveJoziSupport(args);
  assert.equal(noLocalLegal.awaiting, 'location');
  const pendingLocation = buildJoziPendingLookupContext(args, noLocalLegal);
  const moved = mergeJoziSupportContext(pendingLocation, {
    ...original,
    location: 'Johannesburg CBD',
    timing: 'today'
  });
  assert.deepEqual(moved.needs, ['legal_support']);
  const legal = resolveJoziSupport(moved);
  assert.equal(legal.spoken_option_ids[0], 'legal-aid-johannesburg');
  assert.notEqual(legal.spoken_option_ids[0], 'mes-johannesburg-navigation');
});

test('declining City suppresses every later City offer in the current continuation queue', () => {
  const original = {
    needs: ['women_children_shelter', 'mental_health', 'food'],
    location: 'Orlando East',
    audience: 'family',
    safe_to_speak: 'yes',
    safety_context: 'none',
    demo_enabled: true
  };
  const offerResult = resolveJoziSupport(original);
  assert.equal(offerResult.awaiting, 'city_fallback_consent');
  const declined = applyJoziCityFallbackDecision({
    contextualArgs: original,
    offer: {
      active: true,
      fallback_need: offerResult.city_fallback_need,
      remaining_needs: offerResult.needs.filter((need) => need !== offerResult.city_fallback_need)
    },
    consentProvided: true,
    consentConfirmed: false,
    callerAnswered: true
  });
  const partner = resolveJoziSupport(declined.contextualArgs);
  assert.notEqual(partner.awaiting, 'city_fallback_consent');
  assert.equal(partner.spoken_option_ids[0], 'sadag-mental-health');

  const pending = buildJoziPendingLookupContext(declined.contextualArgs, partner);
  const replay = mergeJoziSupportContext(pending, original);
  assert.deepEqual(replay.needs, ['food']);
  assert.equal(replay.suppress_city_fallback, true);
  const final = resolveJoziSupport(replay);
  assert.notEqual(final.awaiting, 'city_fallback_consent');
});

test('asking for a current route detail preserves the queued next need', () => {
  const query = {
    needs: ['mental_health_crisis', 'women_children_shelter'],
    location: 'Orlando East',
    audience: 'family',
    safe_to_speak: 'yes',
    safety_context: 'none',
    demo_enabled: true
  };
  const first = resolveJoziSupport(query);
  const pending = buildJoziPendingLookupContext(query, first);
  const detailArgs = mergeJoziSupportContext(pending, {
    needs: ['mental_health_crisis'],
    detail_requested: 'phone',
    safety_context: 'none'
  });
  assert.deepEqual(detailArgs.continuation_needs, ['women_children_shelter']);
  const detail = resolveJoziSupport(detailArgs);
  assert.equal(detail.next_need, 'women_children_shelter');
  assert.deepEqual(buildJoziPendingLookupContext(detailArgs, detail).continuation_needs, ['women_children_shelter']);
});

test('a full replay can ask for the current number and add a new need without losing the queue', () => {
  const query = {
    needs: ['shelter_navigation', 'gbv_healthcare', 'healthcare'],
    location: 'Hillbrow',
    audience: 'child',
    safe_to_speak: 'yes',
    safety_context: 'none',
    demo_enabled: true
  };
  const first = resolveJoziSupport(query);
  assert.equal(first.spoken_option_ids[0], 'childline-116');

  const pending = buildJoziPendingLookupContext(query, first);
  const detailArgs = mergeJoziSupportContext(pending, {
    ...query,
    needs: [...query.needs, 'food'],
    detail_requested: 'phone'
  });
  assert.deepEqual(new Set(detailArgs.needs), new Set(first.handled_needs));
  assert.deepEqual(
    new Set(detailArgs.continuation_needs),
    new Set(['gbv_healthcare', 'healthcare', 'food'])
  );

  const detail = resolveJoziSupport(detailArgs);
  assert.equal(detail.spoken_option_ids[0], 'childline-116');
  const afterDetail = buildJoziPendingLookupContext(detailArgs, detail);
  assert.deepEqual(
    new Set(afterDetail.continuation_needs),
    new Set(['gbv_healthcare', 'healthcare', 'food'])
  );
});

test('an accepted City route can answer a detail without asking for City consent again', () => {
  const cityArgs = {
    needs: ['women_children_shelter'],
    continuation_needs: ['mental_health'],
    location: 'Orlando East',
    audience: 'family',
    safe_to_speak: 'yes',
    safety_context: 'none',
    allow_city_fallback: true,
    demo_enabled: true
  };
  const city = resolveJoziSupport(cityArgs);
  assert.equal(city.spoken_option_ids[0], 'coj-region-d-social-services');
  const pending = buildJoziPendingLookupContext(cityArgs, city);
  assert.equal(pending.current_route_city_fallback_need, 'women_children_shelter');

  const detailArgs = mergeJoziSupportContext(pending, {
    needs: ['women_children_shelter', 'mental_health'],
    location: 'Orlando East',
    audience: 'family',
    detail_requested: 'phone',
    safety_context: 'none'
  });
  const decision = applyJoziCityFallbackDecision({ contextualArgs: detailArgs });
  const detail = resolveJoziSupport(decision.contextualArgs);
  assert.equal(detail.spoken_option_ids[0], 'coj-region-d-social-services');
  assert.notEqual(detail.awaiting, 'city_fallback_consent');
  assert.equal(detail.next_need, 'mental_health');
});

test('a genuinely new topic is not replaced by stale current-route context, even when asking for a detail', () => {
  const clinicArgs = {
    needs: ['healthcare'],
    location: 'Hillbrow',
    audience: 'adult',
    safety_context: 'none',
    demo_enabled: true
  };
  const clinic = resolveJoziSupport(clinicArgs);
  const pending = buildJoziPendingLookupContext(clinicArgs, clinic);
  for (const detail_requested of [undefined, 'phone', 'hours']) {
    const newTopic = mergeJoziSupportContext(pending, {
      needs: ['employment'],
      location: 'Hillbrow',
      audience: 'adult',
      safety_context: 'none',
      ...(detail_requested ? { detail_requested } : {})
    });
    assert.deepEqual(newTopic.needs, ['employment'], detail_requested || 'recommendation');
    const result = resolveJoziSupport(newTopic);
    assert.notEqual(result.spoken_option_ids[0], 'hillbrow-community-health-centre', detail_requested || 'recommendation');
  }
});

test('a new emergency interrupts a current-route detail request', () => {
  const clinicArgs = {
    needs: ['healthcare'],
    location: 'Hillbrow',
    audience: 'adult',
    safety_context: 'none',
    demo_enabled: true
  };
  const clinic = resolveJoziSupport(clinicArgs);
  const clinicPending = buildJoziPendingLookupContext(clinicArgs, clinic);
  const medicalEmergency = mergeJoziSupportContext(clinicPending, {
    ...clinicArgs,
    needs: ['healthcare', 'medical_emergency'],
    detail_requested: 'phone'
  });
  const medicalResult = resolveJoziSupport(medicalEmergency);
  assert.equal(medicalResult.emergency, true);
  assert.equal(medicalResult.safety_context, 'medical_emergency');

  const cityArgs = {
    needs: ['women_children_shelter'],
    location: 'Orlando East',
    audience: 'family',
    safe_to_speak: 'yes',
    safety_context: 'none',
    allow_city_fallback: true,
    demo_enabled: true
  };
  const city = resolveJoziSupport(cityArgs);
  const cityPending = buildJoziPendingLookupContext(cityArgs, city);
  const suicideEmergency = mergeJoziSupportContext(cityPending, {
    ...cityArgs,
    needs: ['women_children_shelter', 'suicide_imminent'],
    detail_requested: 'phone'
  });
  const suicideResult = resolveJoziSupport(suicideEmergency);
  assert.equal(suicideResult.emergency, true);
  assert.equal(suicideResult.safety_context, 'suicide_imminent');
  assert.notEqual(suicideResult.spoken_option_ids?.[0], 'coj-region-d-social-services');
});

test('new crisis, child-safety, and GBV needs take priority over a routine route detail', () => {
  for (const [baseArgs, expectedBase, criticalNeed] of [
    [{
      needs: ['healthcare'],
      continuation_needs: ['food'],
      location: 'Hillbrow',
      audience: 'adult',
      safety_context: 'none',
      demo_enabled: true
    }, 'hillbrow-community-health-centre', 'mental_health_crisis'],
    [{
      needs: ['women_children_shelter'],
      continuation_needs: ['food'],
      location: 'Orlando East',
      audience: 'family',
      safe_to_speak: 'yes',
      safety_context: 'none',
      allow_city_fallback: true,
      demo_enabled: true
    }, 'coj-region-d-social-services', 'child_safety'],
    [{
      needs: ['women_children_shelter'],
      continuation_needs: ['food'],
      location: 'Orlando East',
      audience: 'family',
      safe_to_speak: 'yes',
      safety_context: 'none',
      allow_city_fallback: true,
      demo_enabled: true
    }, 'coj-region-d-social-services', 'gbv_healthcare']
  ]) {
    const first = resolveJoziSupport(baseArgs);
    assert.equal(first.spoken_option_ids[0], expectedBase, criticalNeed);
    const pending = buildJoziPendingLookupContext(baseArgs, first);
    const criticalArgs = mergeJoziSupportContext(pending, {
      ...baseArgs,
      needs: [...baseArgs.needs, criticalNeed],
      detail_requested: 'phone'
    });
    const critical = resolveJoziSupport(criticalArgs);
    assert.notEqual(critical.spoken_option_ids[0], expectedBase, criticalNeed);
    assert.ok(critical.handled_needs?.includes(criticalNeed), criticalNeed);
  }
});

test('privacy-sensitive needs pause a route detail until it is safe to speak', () => {
  for (const safe_to_speak of ['unknown', 'no']) {
    const baseArgs = {
      needs: ['healthcare'],
      continuation_needs: safe_to_speak === 'no' ? ['gbv_healthcare'] : ['food'],
      location: 'Hillbrow',
      audience: 'adult',
      safe_to_speak: safe_to_speak === 'no' ? 'yes' : 'unknown',
      safety_context: 'none',
      demo_enabled: true
    };
    const first = resolveJoziSupport(baseArgs);
    const pending = buildJoziPendingLookupContext(baseArgs, first);
    const currentNeeds = safe_to_speak === 'no'
      ? ['healthcare']
      : ['healthcare', 'abuse_support'];
    const privateArgs = mergeJoziSupportContext(pending, {
      ...baseArgs,
      needs: currentNeeds,
      safe_to_speak,
      detail_requested: 'phone'
    });
    const result = resolveJoziSupport(privateArgs);
    assert.deepEqual(result.spoken_option_ids, [], safe_to_speak);
    assert.equal(result.awaiting, safe_to_speak === 'no' ? 'end_or_continue' : 'safe_to_speak');
    assert.doesNotMatch(result.voiceResponse, /abuse|gender|violence|shelter/i, safe_to_speak);
  }
});

test('a corrected location retries the stated need instead of treating it as completed', () => {
  const firstArgs = {
    needs: ['healthcare'],
    location: 'Hillbrow',
    audience: 'adult',
    safety_context: 'none',
    demo_enabled: true
  };
  const first = resolveJoziSupport(firstArgs);
  const pending = buildJoziPendingLookupContext(firstArgs, first);
  const corrected = mergeJoziSupportContext(pending, {
    ...firstArgs,
    location: 'Berea',
    detail_requested: 'recommendation'
  });
  assert.deepEqual(corrected.needs, ['healthcare']);
  assert.deepEqual(corrected.completed_needs, []);
  const retried = resolveJoziSupport(corrected);
  assert.notEqual(retried.error, 'support_need_required');
  assert.ok(retried.spoken_option_ids.length > 0);

  const sparseCorrection = mergeJoziSupportContext(pending, {
    needs: [],
    location: 'Orlando East',
    audience: 'adult',
    detail_requested: 'recommendation',
    safety_context: 'none'
  });
  assert.deepEqual(sparseCorrection.needs, ['healthcare']);
  assert.deepEqual(sparseCorrection.completed_needs, []);
  const sparseRetried = resolveJoziSupport(sparseCorrection);
  assert.equal(sparseRetried.spoken_option_ids[0], 'orlando-east-clinic');
});

test('sparse audience and tonight corrections re-evaluate the current safety route', () => {
  const shelterArgs = {
    needs: ['shelter_navigation'],
    location: 'Hillbrow',
    audience: 'adult',
    timing: 'tonight',
    safety_context: 'none',
    demo_enabled: true
  };
  const adultShelter = resolveJoziSupport(shelterArgs);
  assert.equal(adultShelter.spoken_option_ids[0], 'mes-johannesburg-navigation');
  const shelterPending = buildJoziPendingLookupContext(shelterArgs, adultShelter);
  for (const audience of ['family', 'child']) {
    const corrected = mergeJoziSupportContext(shelterPending, {
      needs: [],
      audience,
      safety_context: 'none'
    });
    assert.deepEqual(corrected.needs, ['shelter_navigation'], audience);
    const result = resolveJoziSupport(corrected);
    assert.notEqual(result.spoken_option_ids?.[0], 'mes-johannesburg-navigation', audience);
  }

  const daytimeArgs = {
    needs: ['daytime_community_space'],
    safe_site_type: 'daytime',
    location: 'Hillbrow',
    audience: 'adult',
    timing: 'today',
    safety_context: 'none',
    demo_enabled: true
  };
  const daytime = resolveJoziSupport(daytimeArgs);
  const daytimePending = buildJoziPendingLookupContext(daytimeArgs, daytime);
  const tonight = mergeJoziSupportContext(daytimePending, {
    needs: [],
    timing: 'tonight',
    audience: 'adult',
    safety_context: 'none'
  });
  assert.deepEqual(tonight.needs, ['daytime_community_space']);
  assert.equal(tonight.safe_site_type, 'tonight');
  const tonightResult = resolveJoziSupport(tonight);
  assert.equal(tonightResult.spoken_option_ids[0], 'mes-johannesburg-navigation');
});

test('older and disabled callers are never routed to Childline without a child need', () => {
  for (const audience of ['older_person', 'person_with_disability']) {
    const result = resolveJoziSupport({
      needs: ['shelter_navigation'],
      location: 'Yeoville',
      audience,
      timing: 'tonight',
      safety_context: 'none',
      demo_enabled: true
    });
    assert.notEqual(result.spoken_option_ids[0], 'childline-116', audience);
    assert.doesNotMatch(result.voiceResponse, /Childline|\b116\b/, audience);
  }
});

test('known unmatched needs ask for an alternate area instead of asking what support is needed again', () => {
  for (const [need, audience] of [['healthcare', 'adult'], ['food', 'child'], ['clothing', 'family']]) {
    const result = resolveJoziSupport({
      needs: [need],
      location: 'Alexandra',
      audience,
      safety_context: 'none'
    });
    assert.equal(result.awaiting, 'location', `${need}/${audience}`);
    assert.match(result.voiceResponse, /another nearby suburb or landmark/i, `${need}/${audience}`);
    assert.doesNotMatch(result.voiceResponse, /what feels most urgent|whether you need safety, food, health/i, `${need}/${audience}`);
  }
});

test('consent is accepted only on the exact next deduplicated caller item', () => {
  const offer = { patient_item_id: 'item_1', patient_turn_seq: 4 };
  assert.equal(isImmediateJoziConsentTurn({ currentItemId: 'item_2', currentTurnSeq: 5, offer }), true);
  assert.equal(isImmediateJoziConsentTurn({ currentItemId: 'item_1', currentTurnSeq: 5, offer }), false);
  assert.equal(isImmediateJoziConsentTurn({ currentItemId: 'item_3', currentTurnSeq: 6, offer }), false);
  assert.equal(isImmediateJoziConsentTurn({ currentItemId: '', currentTurnSeq: 5, offer }), false);
  assert.equal(isImmediateJoziConsentTurn({ currentItemId: 'item_2', currentTurnSeq: 5, offer: {} }), false);
});

test('a known unsupported daytime area asks for another area instead of repeating the support question', () => {
  const result = resolveJoziSupport({
    needs: ['safe sites'],
    safe_site_type: 'daytime',
    location: 'Alexandra',
    audience: 'adult',
    safety_context: 'none',
    demo_enabled: true
  });
  assert.equal(result.error, 'verified_daytime_space_not_found_in_area');
  assert.equal(result.awaiting, 'location');
  assert.match(result.voiceResponse, /another nearby suburb or landmark/i);
  assert.doesNotMatch(result.voiceResponse, /what.*support|what feels most urgent/i);
  assert.deepEqual(result.spoken_option_ids, []);
});
