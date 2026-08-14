import test from 'node:test';
import assert from 'node:assert/strict';

import {
  JOZI_SUPPORT_RESOURCES,
  buildJoziPendingLookupContext,
  mergeJoziSupportContext,
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
      expectedFirst: 'sadag-suicide-crisis',
      expectedFallbackNeed: 'women_children_shelter',
      expectedCity: 'coj-region-d-social-services'
    },
    {
      label: 'crisis need before shelter need',
      needs: ['mental_health_crisis', 'women_children_shelter'],
      location: 'Orlando East',
      audience: 'family',
      expectedFirst: 'sadag-suicide-crisis',
      expectedFallbackNeed: 'women_children_shelter',
      expectedCity: 'coj-region-d-social-services'
    },
    {
      label: 'highest-priority unresolved need wins even when a lower-priority fallback need appears first',
      needs: ['mental_health_crisis', 'older_person_support', 'women_children_shelter'],
      location: 'Alexandra',
      audience: 'family',
      expectedFirst: 'sadag-suicide-crisis',
      expectedFallbackNeed: 'women_children_shelter',
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
    assert.deepEqual(nextTurn.needs, [entry.expectedFallbackNeed], entry.label);

    const modelReplaysAllNeeds = mergeJoziSupportContext(pending, {
      needs: query.needs,
      audience: entry.audience,
      safe_to_speak: 'yes',
      safety_context: 'none'
    });
    assert.deepEqual(modelReplaysAllNeeds.needs, [entry.expectedFallbackNeed], `${entry.label}: full replay`);

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
