import test from 'node:test';
import assert from 'node:assert/strict';

import {
  JOZI_SUPPORT_RESOURCES,
  buildJoziPendingLookupContext,
  mergeJoziSupportContext,
  resolveJoziSupport
} from '../src/jozi-support.js';

const MES_ID = 'mes-johannesburg-navigation';
const CITY_NAVIGATION_IDS = new Set([
  'coj-general-services',
  'coj-region-f-social-services',
  'coj-region-d-social-services'
]);
const DIRECTORY_BY_ID = new Map(JOZI_SUPPORT_RESOURCES.map((resource) => [resource.id, resource]));

function optionIds(result) {
  return (result.options || []).map((option) => option.id);
}

function routineArgs(overrides = {}) {
  return {
    audience: 'adult',
    safety_context: 'none',
    timing: 'routine',
    contact_mode: 'either',
    demo_enabled: true,
    ...overrides
  };
}

function assertSourceCheckedOption(option, expectedId) {
  assert.equal(option?.id, expectedId);
  assert.ok(DIRECTORY_BY_ID.has(expectedId), `${expectedId} must come from the curated directory`);
  assert.equal(option.source_url, DIRECTORY_BY_ID.get(expectedId).sourceUrl);
  assert.match(option.source_url, /^https:\/\//);
  assert.ok(option.source_checked_at);
  assert.ok(option.availability_note);
}

function assertNoProviderMetadata(result) {
  assert.deepEqual(result.options || [], []);
  assert.ok(result.selected == null);
  assert.deepEqual(result.spoken_option_ids || [], []);
  assert.deepEqual(result.pending_option_ids || [], []);
  assert.doesNotMatch(
    JSON.stringify(result),
    /MES Johannesburg|City of Johannesburg General Services|011 725 6531|0860 562 874|Kapteijn Street/i
  );
}

test('unqualified safe-site wording asks one bounded question instead of looping on location', () => {
  for (const need of [
    'safe site',
    'safe sites',
    'safe site near me',
    'identify the safe sites',
    'where is a safe site',
    'safe place',
    'safe places',
    'identify the safe places',
    'where is a safe place'
  ]) {
    for (const location of ['', 'Hillbrow']) {
      const result = resolveJoziSupport(routineArgs({
        needs: [need],
        location,
        audience: 'unknown'
      }));
      assert.equal(result.status, 'safe_space_type_clarification_required', `${need} / ${location || 'blank'}`);
      assert.equal(result.awaiting, 'safe_space_type', `${need} / ${location || 'blank'}`);
      assert.equal(result.location, location);
      assert.equal(result.needsMoreLocation, false);
      assertNoProviderMetadata(result);
      assert.match(result.voiceResponse, /somewhere for tonight.*public place during the day.*danger now/i);
      assert.equal((result.voiceResponse.match(/\?/g) || []).length, 1);
    }
  }
});

test('safe-site clarification carries known location or audience into the next lookup', () => {
  const withLocation = mergeJoziSupportContext(
    { location: 'Joubert Park', audience: 'unknown', timing: 'tonight' },
    { needs: ['safe_space_navigation'], audience: 'adult', safety_context: 'none', demo_enabled: true }
  );
  const afterAudience = resolveJoziSupport(withLocation);
  assert.equal(afterAudience.options[0]?.id, MES_ID);
  assert.notEqual(afterAudience.awaiting, 'location');

  const withAudience = mergeJoziSupportContext(
    { audience: 'adult', timing: 'tonight' },
    { needs: ['safe_space_navigation'], location: 'Joubert Park', safety_context: 'none', demo_enabled: true }
  );
  const afterLocation = resolveJoziSupport(withAudience);
  assert.equal(afterLocation.options[0]?.id, MES_ID);
  assert.notEqual(afterLocation.awaiting, 'audience');

  const emergency = resolveJoziSupport(mergeJoziSupportContext(
    { location: 'Joubert Park', audience: 'adult', timing: 'tonight' },
    { needs: ['safe_space_navigation'], safety_context: 'immediate_danger' }
  ));
  assert.equal(emergency.status, 'urgent_escalation');

  const repeatedWordsAfterTonightAnswer = resolveJoziSupport(mergeJoziSupportContext(
    { location: 'Joubert Park', audience: 'unknown', timing: 'routine' },
    {
      needs: ['identify the safe sites'],
      safe_site_type: 'tonight',
      audience: 'adult',
      safety_context: 'none',
      demo_enabled: true
    }
  ));
  assert.equal(repeatedWordsAfterTonightAnswer.options[0]?.id, MES_ID);
  assert.notEqual(repeatedWordsAfterTonightAnswer.awaiting, 'safe_space_type');

  const repeatedWordsAfterDaytimeAnswer = resolveJoziSupport({
    needs: ['safe sites near me'],
    safe_site_type: 'daytime',
    location: 'Hillbrow',
    audience: 'adult',
    safety_context: 'none'
  });
  assert.equal(repeatedWordsAfterDaytimeAnswer.options[0]?.id, 'hillbrow-recreation-centre');

  const repeatedWordsAfterDangerAnswer = resolveJoziSupport({
    needs: ['safe sites'],
    safe_site_type: 'danger_now',
    location: 'Hillbrow',
    audience: 'adult',
    safety_context: 'none'
  });
  assert.equal(repeatedWordsAfterDangerAnswer.status, 'urgent_escalation');

  const childTonight = resolveJoziSupport({
    needs: ['safe sites'],
    safe_site_type: 'tonight',
    location: 'Joubert Park',
    audience: 'child',
    safety_context: 'none'
  });
  assert.notEqual(childTonight.options[0]?.id, MES_ID);
});

test('safe-site clarification state completes across sparse multi-turn tool calls', () => {
  const advance = (pending, args) => {
    const contextualArgs = mergeJoziSupportContext(pending, args);
    const result = resolveJoziSupport(contextualArgs);
    return { result, pending: buildJoziPendingLookupContext(contextualArgs, result) };
  };

  let overnight = advance({}, {
    needs: ['safe sites'],
    location: 'Hillbrow',
    audience: 'unknown',
    safety_context: 'none'
  });
  assert.equal(overnight.result.awaiting, 'safe_space_type');
  overnight = advance(overnight.pending, {
    needs: ['safe sites'],
    safe_site_type: 'tonight',
    audience: 'unknown',
    safety_context: 'none'
  });
  assert.equal(overnight.result.awaiting, 'audience');
  assert.equal(overnight.pending.safe_site_type, 'tonight');
  overnight = advance(overnight.pending, {
    needs: ['safe sites'],
    audience: 'adult',
    safety_context: 'none',
    demo_enabled: true
  });
  assert.equal(overnight.result.options[0]?.id, MES_ID);
  assert.equal(overnight.result.awaiting, 'demo_action_consent');

  let daytime = advance({}, {
    needs: ['safe sites'],
    audience: 'adult',
    safety_context: 'none'
  });
  assert.equal(daytime.result.awaiting, 'safe_space_type');
  daytime = advance(daytime.pending, {
    needs: ['safe sites'],
    safe_site_type: 'daytime',
    safety_context: 'none'
  });
  assert.equal(daytime.result.awaiting, 'location');
  assert.equal(daytime.pending.safe_site_type, 'daytime');
  daytime = advance(daytime.pending, {
    needs: ['safe sites'],
    location: 'Hillbrow',
    safety_context: 'none'
  });
  assert.equal(daytime.result.options[0]?.id, 'hillbrow-recreation-centre');
  assert.notEqual(daytime.result.awaiting, 'safe_space_type');

  let withFood = advance({}, {
    needs: ['safe sites', 'food'],
    location: 'Joubert Park',
    audience: 'unknown',
    safety_context: 'none'
  });
  assert.equal(withFood.result.awaiting, 'safe_space_type');
  assert.ok(withFood.pending.needs.includes('food'));
  withFood = advance(withFood.pending, {
    needs: ['safe sites'],
    safe_site_type: 'tonight',
    audience: 'unknown',
    safety_context: 'none',
    demo_enabled: true
  });
  assert.equal(withFood.result.awaiting, 'audience');
  assert.ok(withFood.pending.needs.includes('food'));
  withFood = advance(withFood.pending, {
    needs: [],
    audience: 'adult',
    timing: 'routine',
    safety_context: 'none',
    demo_enabled: true
  });
  assert.equal(withFood.result.options[0]?.id, MES_ID);
  assert.ok(withFood.result.needs.includes('food'));

  const daytimeCorrection = resolveJoziSupport({
    needs: ['safe sites'],
    safe_site_type: 'daytime',
    timing: 'tonight',
    location: 'Hillbrow',
    audience: 'adult',
    safety_context: 'none'
  });
  assert.equal(daytimeCorrection.options[0]?.id, 'hillbrow-recreation-centre');
  assert.notEqual(daytimeCorrection.awaiting, 'safe_space_type');

  const canonicalDaytimeCorrection = resolveJoziSupport({
    needs: ['safe_space_navigation'],
    safe_site_type: 'daytime',
    timing: 'routine',
    location: 'Hillbrow',
    audience: 'adult',
    safety_context: 'none'
  });
  assert.equal(canonicalDaytimeCorrection.options[0]?.id, 'hillbrow-recreation-centre');

  const canonicalTonightCorrection = resolveJoziSupport({
    needs: ['daytime_community_space'],
    safe_site_type: 'tonight',
    timing: 'routine',
    location: 'Joubert Park',
    audience: 'adult',
    safety_context: 'none',
    demo_enabled: true
  });
  assert.equal(canonicalTonightCorrection.options[0]?.id, MES_ID);
});

test('safe-site follow-ups ignore placeholder or broader model locations when a specific place is known', () => {
  for (const currentLocation of ['unknown', 'not provided', 'Johannesburg']) {
    const contextualArgs = mergeJoziSupportContext(
      { location: 'Joubert Park', audience: 'unknown', timing: 'routine', safe_site_type: '' },
      {
        needs: ['safe sites'],
        safe_site_type: 'tonight',
        location: currentLocation,
        audience: 'adult',
        safety_context: 'none',
        demo_enabled: true
      }
    );
    assert.equal(contextualArgs.location, 'Joubert Park', currentLocation);
    const result = resolveJoziSupport(contextualArgs);
    assert.equal(result.options[0]?.id, MES_ID, currentLocation);
    assert.notEqual(result.awaiting, 'location', currentLocation);
  }
});

test('pending clarification preserves urgent timing and needs against model defaults', () => {
  const routineDefault = mergeJoziSupportContext(
    {
      needs: ['safe_space_navigation'],
      location: 'Orlando East',
      audience: 'unknown',
      timing: 'tonight'
    },
    {
      needs: ['safe_space_navigation'],
      audience: 'adult',
      timing: 'routine',
      safety_context: 'none'
    }
  );
  assert.equal(routineDefault.timing, 'tonight');
  const afterRoutineDefault = resolveJoziSupport(routineDefault);
  assert.equal(afterRoutineDefault.timing, 'tonight');
  assert.equal(afterRoutineDefault.options[0]?.id, 'joburg-homelessness-network');
  assert.equal(afterRoutineDefault.awaiting, 'detail_preference');

  const explicitCurrentTiming = mergeJoziSupportContext(
    { timing: 'tonight', location: 'Joubert Park', audience: 'adult' },
    { needs: ['safe_space_navigation'], timing: 'today', safety_context: 'none' }
  );
  assert.equal(explicitCurrentTiming.timing, 'today');

  const sparseNeeds = mergeJoziSupportContext(
    {
      needs: ['safe_space_navigation'],
      safe_site_type: 'tonight',
      location: 'Joubert Park',
      audience: 'unknown',
      timing: 'tonight'
    },
    {
      needs: [],
      audience: 'adult',
      safety_context: 'none',
      demo_enabled: true
    }
  );
  assert.deepEqual(sparseNeeds.needs, ['safe_space_navigation']);
  const afterSparseNeeds = resolveJoziSupport(sparseNeeds);
  assert.equal(afterSparseNeeds.options[0]?.id, MES_ID);
  assert.notEqual(afterSparseNeeds.error, 'support_need_required');
});

test('a newer canonical safe-site answer overrides the pending interpretation', () => {
  const tonightCorrection = mergeJoziSupportContext(
    {
      needs: ['daytime_community_space'],
      safe_site_type: 'daytime',
      audience: 'adult',
      timing: 'today'
    },
    {
      needs: ['safe_space_navigation'],
      location: 'Hillbrow',
      audience: 'adult',
      timing: 'tonight',
      safety_context: 'none',
      demo_enabled: true
    }
  );
  assert.equal(tonightCorrection.safe_site_type, undefined);
  assert.equal(resolveJoziSupport(tonightCorrection).options[0]?.id, MES_ID);

  const daytimeCorrection = mergeJoziSupportContext(
    {
      needs: ['safe_space_navigation'],
      safe_site_type: 'tonight',
      location: 'Joubert Park',
      audience: 'adult',
      timing: 'tonight'
    },
    {
      needs: ['daytime_community_space'],
      location: 'Hillbrow',
      audience: 'adult',
      timing: 'today',
      safety_context: 'none'
    }
  );
  assert.equal(daytimeCorrection.safe_site_type, undefined);
  assert.equal(resolveJoziSupport(daytimeCorrection).options[0]?.id, 'hillbrow-recreation-centre');
});

test('an explicit scalar need starts the new path instead of restoring the pending safe-site need', () => {
  const pending = {
    needs: ['safe_space_navigation', 'food'],
    safe_site_type: 'tonight',
    location: 'Joubert Park',
    audience: 'adult',
    timing: 'tonight'
  };
  const healthcare = mergeJoziSupportContext(pending, {
    needs: 'healthcare',
    location: 'Hillbrow',
    audience: 'adult',
    timing: 'routine',
    safety_context: 'none'
  });
  assert.equal(healthcare.needs, 'healthcare');
  assert.equal(healthcare.safe_site_type, undefined);
  assert.equal(healthcare.timing, 'routine');
  assert.equal(resolveJoziSupport(healthcare).options[0]?.id, 'hillbrow-community-health-centre');

  const daytime = mergeJoziSupportContext(pending, {
    needs: 'daytime_community_space',
    location: 'Hillbrow',
    audience: 'adult',
    timing: 'today',
    safety_context: 'none'
  });
  assert.equal(daytime.needs, 'daytime_community_space');
  assert.equal(daytime.safe_site_type, undefined);
  assert.equal(resolveJoziSupport(daytime).options[0]?.id, 'hillbrow-recreation-centre');
});

test('natural safe-site clarification answers never repeat the same question', () => {
  for (const safe_site_type of ['day', 'during day', 'in the day']) {
    const result = resolveJoziSupport({
      needs: ['safe sites'],
      safe_site_type,
      location: 'Hillbrow',
      audience: 'adult',
      safety_context: 'none'
    });
    assert.equal(result.options[0]?.id, 'hillbrow-recreation-centre', safe_site_type);
    assert.notEqual(result.awaiting, 'safe_space_type', safe_site_type);
  }
  for (const safe_site_type of ['nighttime', 'at night', 'for the night', 'for tonight']) {
    const result = resolveJoziSupport({
      needs: ['safe sites'],
      safe_site_type,
      location: 'Joubert Park',
      audience: 'adult',
      safety_context: 'none'
    });
    assert.equal(result.options[0]?.id, MES_ID, safe_site_type);
    assert.notEqual(result.awaiting, 'safe_space_type', safe_site_type);
  }
  for (const safe_site_type of ['danger', 'in danger', 'urgent help', 'unsafe now']) {
    const result = resolveJoziSupport({
      needs: ['safe sites'],
      safe_site_type,
      location: 'Hillbrow',
      audience: 'adult',
      safety_context: 'none'
    });
    assert.equal(result.status, 'urgent_escalation', safe_site_type);
  }
});

test('critical and privacy-sensitive co-needs take precedence over safe-site clarification', () => {
  const crisis = resolveJoziSupport(routineArgs({
    needs: ['safe sites', 'mental_health_crisis'],
    location: 'Hillbrow',
    audience: 'adult'
  }));
  assert.equal(crisis.options[0]?.id, 'sadag-suicide-crisis');
  assert.notEqual(crisis.awaiting, 'safe_space_type');

  const gbv = resolveJoziSupport(routineArgs({
    needs: ['safe sites', 'gbv_support'],
    location: 'Hillbrow',
    audience: 'adult',
    safe_to_speak: 'no'
  }));
  assert.equal(gbv.status, 'unsafe_to_speak');
  assert.equal(gbv.awaiting, 'end_or_continue');
  assertNoProviderMetadata(gbv);

  const child = resolveJoziSupport(routineArgs({
    needs: ['safe sites', 'child_safety'],
    location: 'Hillbrow',
    audience: 'child'
  }));
  assert.equal(child.options[0]?.id, 'childline-116');
  assert.notEqual(child.awaiting, 'safe_space_type');
  assert.ok(!optionIds(child).includes(MES_ID));
});

test('an unknown need with a known location never asks for the location again', () => {
  const result = resolveJoziSupport(routineArgs({
    needs: ['something entirely new'],
    location: 'Hillbrow'
  }));
  assert.equal(result.awaiting, 'support_need');
  assert.doesNotMatch(result.voiceResponse, /what nearby area|which suburb|nearest landmark/i);
});

test('Journey 1 keeps MES first across plausible model classifications of safe tonight and food', () => {
  const needSets = [
    ['shelter_navigation', 'food'],
    ['safe_space_navigation', 'food'],
    ['social_support', 'food'],
    ['social_support'],
    ['food'],
    ['safe tonight', 'food support'],
    ['shelter and food']
  ];

  for (const needs of needSets) {
    for (const timing of ['now', 'tonight']) {
      for (const contact_mode of ['phone', 'in_person', 'either']) {
        const result = resolveJoziSupport(routineArgs({
          needs,
          location: 'Joubert Park',
          timing,
          contact_mode
        }));
        const ids = optionIds(result);
        assert.equal(ids[0], MES_ID, `${needs.join('+')} / ${timing} / ${contact_mode}`);
        const firstCity = ids.findIndex((id) => CITY_NAVIGATION_IDS.has(id));
        assert.ok(firstCity < 0 || firstCity > ids.indexOf(MES_ID), `${needs.join('+')} put City before MES`);
        assertSourceCheckedOption(result.options[0], MES_ID);
      }
    }
  }
});

test('Journey 1 recognizes decorated MES-area locations without falling through to City navigation', () => {
  for (const location of [
    'near Joubert Park',
    'Joubert Park, Johannesburg',
    'in Hillbrow',
    'near Hillbrow',
    'Hillbrow, Johannesburg',
    'Berea, Johannesburg',
    'Braamfontein Johannesburg',
    'in Doornfontein',
    'Jeppestown, Johannesburg',
    'CBD',
    'near Park Station'
  ]) {
    const result = resolveJoziSupport(routineArgs({
      needs: ['shelter_navigation', 'food'],
      location,
      timing: 'tonight'
    }));
    assert.equal(optionIds(result)[0], MES_ID, location);
  }
});

test('Journey 1 prefers a specific landmark when the model also supplies a broad location', () => {
  for (const args of [
    { location: 'Johannesburg', landmark: 'Joubert Park' },
    { location: 'near me', landmark: 'Joubert Park' },
    { location: 'Johannesburg', landmark: 'Hillbrow' },
    { location: 'Hillbrow', landmark: 'near me' }
  ]) {
    const result = resolveJoziSupport(routineArgs({
      needs: ['shelter_navigation', 'food'],
      timing: 'tonight',
      ...args
    }));
    assert.equal(optionIds(result)[0], MES_ID, JSON.stringify(args));
  }
});

test('Journey 1 understands the natural adult answers that the voice prompt requests', () => {
  for (const audience of ['adult on my own', 'single adult', 'individual adult']) {
    const result = resolveJoziSupport(routineArgs({
      needs: ['shelter_navigation', 'food'],
      location: 'Joubert Park',
      audience,
      timing: 'tonight'
    }));
    assert.equal(result.audience, 'adult', audience);
    assert.equal(optionIds(result)[0], MES_ID, audience);
  }
});

test('Journey 1 exposes no provider metadata while waiting to learn the shelter audience', () => {
  const result = resolveJoziSupport(routineArgs({
    needs: ['shelter_navigation', 'food'],
    location: 'Joubert Park',
    audience: 'unknown',
    timing: 'tonight'
  }));

  assert.equal(result.awaiting, 'audience');
  assert.match(result.voiceResponse, /adult on your own.*with children.*under 18/i);
  assertNoProviderMetadata(result);
});

test('Journey 1 exposes no provider metadata while waiting for a useful location', () => {
  for (const location of ['', 'Johannesburg', 'near me']) {
    const result = resolveJoziSupport(routineArgs({
      needs: ['shelter_navigation', 'food'],
      location,
      timing: 'tonight'
    }));
    assert.equal(result.awaiting, 'location', location || 'blank');
    assert.match(result.voiceResponse, /suburb|landmark|nearby area/i, location || 'blank');
    assertNoProviderMetadata(result);
  }
});

test('Journey 1 keeps children and families out of the adult MES pathway', () => {
  const family = resolveJoziSupport(routineArgs({
    needs: ['shelter_navigation', 'food'],
    location: 'Joubert Park',
    audience: 'adult with children',
    timing: 'tonight'
  }));
  assert.equal(family.audience, 'family');
  assert.doesNotMatch(optionIds(family).join(' '), /mes-johannesburg-navigation/);

  for (const audience of ['child', 'under 18', 'minor']) {
    const child = resolveJoziSupport(routineArgs({
      needs: ['safe_space_navigation', 'food'],
      location: 'Joubert Park',
      audience,
      timing: 'tonight'
    }));
    assert.equal(child.audience, 'child', audience);
    assert.equal(optionIds(child)[0], 'childline-116', audience);
    assert.doesNotMatch(optionIds(child).join(' '), /mes-johannesburg-navigation/);
  }
});

test('Journey 1 emergency context overrides ordinary MES and City navigation', () => {
  const result = resolveJoziSupport(routineArgs({
    needs: ['shelter_navigation', 'food'],
    location: 'Joubert Park',
    timing: 'tonight',
    safety_context: 'immediate_danger',
    phone_type: 'mobile'
  }));
  assert.equal(result.status, 'urgent_escalation');
  assert.equal(result.options[0]?.id, 'mobile-emergency-112');
  assert.doesNotMatch(optionIds(result).join(' '), /mes-johannesburg-navigation|coj-general-services/);
});

test('Journey 4 maps natural daytime-community intents to the verified Hillbrow venue', () => {
  for (const need of [
    'daytime_community_space',
    'safe_community_space',
    'daytime community service',
    'daytime community support',
    'community centre',
    'community center',
    'safe during the day',
    'safe in the day',
    'somewhere public to sit',
    'public space during the day',
    'recreation centre'
  ]) {
    const result = resolveJoziSupport(routineArgs({ needs: [need], location: 'Hillbrow', timing: 'today' }));
    assertSourceCheckedOption(result.options[0], 'hillbrow-recreation-centre');
    assert.equal(result.availability_confirmed, false);
  }
});

test('Journey 4 recognizes natural and decorated Hillbrow locations', () => {
  for (const location of [
    'Hillbrow',
    'near Hillbrow',
    'in Hillbrow',
    'Hillbrow, Johannesburg',
    'Hillbrow Recreation Centre'
  ]) {
    const result = resolveJoziSupport(routineArgs({
      needs: ['daytime_community_space'],
      location,
      timing: 'today'
    }));
    assert.equal(optionIds(result)[0], 'hillbrow-recreation-centre', location);
  }
});

test('Journey 4 uses a specific Hillbrow landmark instead of a broad model location', () => {
  const result = resolveJoziSupport(routineArgs({
    needs: ['daytime_community_space'],
    location: 'Johannesburg',
    landmark: 'Hillbrow',
    timing: 'today'
  }));
  assertSourceCheckedOption(result.options[0], 'hillbrow-recreation-centre');
});

test('Journey 4 routes CBD wording to Johannesburg City Library', () => {
  for (const args of [
    { location: 'CBD' },
    { location: 'Johannesburg CBD' },
    { location: 'near the CBD' },
    { location: 'Johannesburg', landmark: 'CBD' },
    { location: 'Carlton Centre' }
  ]) {
    const result = resolveJoziSupport(routineArgs({
      needs: ['daytime_community_space'],
      timing: 'today',
      ...args
    }));
    assertSourceCheckedOption(result.options[0], 'johannesburg-city-library');
  }
});

test('Journey 4 routes Orlando wording to Orlando East Library without weakening clinic specificity', () => {
  for (const args of [
    { location: 'Orlando' },
    { location: 'near Orlando' },
    { location: 'Orlando, Soweto' },
    { location: 'near Orlando in Soweto' },
    { location: 'Orlando East' },
    { location: 'Orlando East, Soweto' },
    { location: 'Orlando East in Soweto' },
    { location: 'in Orlando East, Soweto' },
    { location: 'near Orlando East in Soweto' },
    { location: 'Soweto', landmark: 'Orlando' },
    { location: 'Soweto', landmark: 'Orlando East, Soweto' }
  ]) {
    const result = resolveJoziSupport(routineArgs({
      needs: ['daytime_community_space'],
      timing: 'today',
      ...args
    }));
    assertSourceCheckedOption(result.options[0], 'orlando-east-library');
  }

  const clinic = resolveJoziSupport(routineArgs({ needs: ['healthcare'], location: 'Orlando' }));
  assert.equal(clinic.error, 'specific_location_required');
  assertNoProviderMetadata(clinic);

  const decoratedBroadClinic = resolveJoziSupport(routineArgs({ needs: ['healthcare'], location: 'Orlando, Soweto' }));
  assert.equal(decoratedBroadClinic.error, 'specific_location_required');
  assertNoProviderMetadata(decoratedBroadClinic);

  const decoratedSpecificClinic = resolveJoziSupport(routineArgs({ needs: ['healthcare'], location: 'Orlando East, Soweto' }));
  assertSourceCheckedOption(decoratedSpecificClinic.options[0], 'orlando-east-clinic');
});

test('Journey 4 asks for location without leaking or inventing a venue', () => {
  const result = resolveJoziSupport(routineArgs({
    needs: ['daytime community service'],
    location: '',
    timing: 'today'
  }));
  assert.match(result.voiceResponse, /suburb|landmark|nearby area/i);
  assertNoProviderMetadata(result);
});

test('Journey 4 never turns a daytime-community phrase into an overnight option', () => {
  for (const need of ['daytime_community_space', 'community centre', 'safe during the day']) {
    const result = resolveJoziSupport(routineArgs({ needs: [need], location: 'Hillbrow', timing: 'tonight' }));
    assert.deepEqual(result.options || [], [], need);
    assert.match(result.voiceResponse, /daytime|not overnight|tomorrow/i, need);
    assert.doesNotMatch(JSON.stringify(result), /MES Johannesburg|shelter place|bed available/i);
  }
});

test('Journey 4 returns only a source-checked civic venue and retains its safety caveat', () => {
  const result = resolveJoziSupport(routineArgs({
    needs: ['daytime_community_space'],
    location: 'Hillbrow',
    timing: 'today'
  }));
  assert.deepEqual(optionIds(result), ['hillbrow-recreation-centre']);
  assertSourceCheckedOption(result.options[0], 'hillbrow-recreation-centre');
  assert.match(`${result.voiceResponse} ${result.options[0].availability_note}`, /not a shelter|not.*guaranteed.*safe space/i);
  assert.doesNotMatch(result.voiceResponse, /open now|space is available|(?:is|will be) guaranteed/i);
});

test('Journey 5 maps cough, clinic, and medical-care intents to verified healthcare', () => {
  for (const need of ['healthcare', 'clinic', 'medical care', 'need a clinic', 'see a doctor', 'cough']) {
    const result = resolveJoziSupport(routineArgs({ needs: [need], location: 'Joubert Park' }));
    assertSourceCheckedOption(result.options[0], 'hillbrow-community-health-centre');
    assert.equal(result.availability_confirmed, false);
  }
});

test('Journey 5 recognizes decorated clinic-area locations', () => {
  for (const location of [
    'near Joubert Park',
    'Joubert Park, Johannesburg',
    'in Hillbrow',
    'near Hillbrow',
    'Hillbrow, Johannesburg',
    'Hillbrow Community Health Centre',
    'CBD',
    'Park Station'
  ]) {
    const result = resolveJoziSupport(routineArgs({ needs: ['healthcare'], location }));
    assert.equal(optionIds(result)[0], 'hillbrow-community-health-centre', location);
  }
});

test('Journey 5 prefers a specific clinic landmark over a broad required location', () => {
  for (const args of [
    { location: 'Johannesburg', landmark: 'Joubert Park' },
    { location: 'near me', landmark: 'Joubert Park' },
    { location: 'Johannesburg', landmark: 'Hillbrow Community Health Centre' }
  ]) {
    const result = resolveJoziSupport(routineArgs({ needs: ['clinic'], ...args }));
    assertSourceCheckedOption(result.options[0], 'hillbrow-community-health-centre');
  }
});

test('Journey 5 asks intelligently for location and exposes no provider metadata when none is known', () => {
  for (const needs of [['clinic'], ['medical care'], ['cough']]) {
    for (const location of ['', 'Johannesburg', 'near me']) {
      const result = resolveJoziSupport(routineArgs({ needs, location }));
      assert.equal(result.error, 'specific_location_required', `${needs[0]} / ${location || 'blank'}`);
      assert.match(result.voiceResponse, /neighbourhood|clinic|landmark/i);
      assertNoProviderMetadata(result);
    }
  }
});

test('Journey 5 no-location urgent timing preserves emergency screening instead of guessing a clinic', () => {
  for (const timing of ['now', 'tonight']) {
    const result = resolveJoziSupport(routineArgs({ needs: ['cough'], location: '', timing }));
    assert.equal(result.error, 'specific_location_required');
    assert.match(result.voiceResponse, /medical emergency.*neighbourhood.*landmark/i);
    assertNoProviderMetadata(result);
  }
});

test('Journey 5 emergency signals override the ordinary clinic result', () => {
  const result = resolveJoziSupport(routineArgs({
    needs: ['clinic'],
    location: 'Joubert Park',
    safety_context: 'medical_emergency',
    phone_type: 'mobile'
  }));
  assert.equal(result.status, 'urgent_escalation');
  assert.equal(result.options[0]?.id, 'mobile-emergency-112');
  assert.doesNotMatch(optionIds(result).join(' '), /hillbrow-community-health-centre/);
});

test('Journey 5 never claims that the verified clinic is currently open or available', () => {
  const result = resolveJoziSupport(routineArgs({
    needs: ['clinic'],
    location: 'Joubert Park'
  }));
  assertSourceCheckedOption(result.options[0], 'hillbrow-community-health-centre');
  assert.equal(result.availability_confirmed, false);
  assert.match(result.options[0].availability_note, /call first|confirm/i);
  assert.doesNotMatch(result.voiceResponse, /open now|appointment (is|has been) confirmed|walk in now/i);
});

test('Journey 5 keeps symptom timing separate from the caller-chosen demo action', () => {
  const base = routineArgs({
    needs: ['healthcare'],
    location: 'Joubert Park',
    timing: 'now'
  });
  assert.equal(resolveJoziSupport(base).suggested_demo_action, 'phone_connection');
  assert.equal(
    resolveJoziSupport({ ...base, coordination_preference: 'appointment_request' }).suggested_demo_action,
    'appointment_request'
  );
  assert.equal(
    resolveJoziSupport({ ...base, coordination_preference: 'clinician_handoff' }).suggested_demo_action,
    'clinician_handoff'
  );
});

test('Journey 5 can answer a natural hours follow-up from verified metadata', () => {
  const result = resolveJoziSupport(routineArgs({
    needs: ['healthcare'],
    location: 'Joubert Park',
    detail_requested: 'hours'
  }));
  assertSourceCheckedOption(result.options[0], 'hillbrow-community-health-centre');
  assert.match(result.voiceResponse, /Monday to Friday, 7:30 AM to 4:00 PM/i);
  assert.match(result.voiceResponse, /emergency and victim-friendly services as 24 hours/i);
  assert.match(result.voiceResponse, /011 694 3775/);
  assert.doesNotMatch(result.voiceResponse, /open now|currently open/i);
});

test('MES programme questions return the current branch pathway and real named programmes', () => {
  const result = resolveJoziSupport(routineArgs({
    needs: ['MES services'],
    location: 'Joubert Park'
  }));
  assertSourceCheckedOption(result.options[0], MES_ID);
  assert.match(result.voiceResponse, /Assessment Centre.*Ekhaya.*Ekuthuleni.*Impilo.*GROW/i);
  assert.match(result.voiceResponse, /011 725 6531/);

  for (const id of ['mes-assessment-centre', 'mes-ekhaya-shelter', 'mes-ekuthuleni-shelter', 'mes-impilo-shelter', 'mes-grow-programme']) {
    const resource = DIRECTORY_BY_ID.get(id);
    assert.ok(resource, `${id} must be in the verified directory`);
    assert.equal(resource.phone, '011 725 6531');
    assert.match(resource.sourceUrl, /^https:\/\/mes\.org\.za\//);
    assert.match(resource.availabilityNote, /call/i);
  }
  assert.equal(DIRECTORY_BY_ID.get('mes-impilo-shelter').address, '353 Main Street, Fairview, Johannesburg');
  assert.deepEqual(DIRECTORY_BY_ID.get('mes-assessment-centre').contactModes, ['phone']);
  assert.equal(DIRECTORY_BY_ID.get('mes-assessment-centre').address, '');

  for (const [mes_programme, id] of [
    ['assessment_centre', 'mes-assessment-centre'],
    ['ekhaya', 'mes-ekhaya-shelter'],
    ['ekuthuleni', 'mes-ekuthuleni-shelter'],
    ['impilo', 'mes-impilo-shelter'],
    ['grow', 'mes-grow-programme']
  ]) {
    const programme = resolveJoziSupport(routineArgs({
      needs: ['mes_services'],
      mes_programme,
      location: mes_programme === 'impilo' ? 'Fairview' : 'Hillbrow'
    }));
    assert.equal(programme.options[0]?.id, id, mes_programme);
    assert.match(programme.voiceResponse, /MES|GROW/i, mes_programme);
    assert.match(programme.voiceResponse, /011 725 6531/i, mes_programme);
    assert.match(programme.voiceResponse, /confirm/i, mes_programme);
  }

  const unknownAdultProgramme = resolveJoziSupport(routineArgs({
    needs: ['mes_services'],
    mes_programme: 'ekhaya',
    audience: 'unknown'
  }));
  assert.equal(unknownAdultProgramme.awaiting, 'audience');
  assert.equal(unknownAdultProgramme.suggested_demo_action, '');
  assert.deepEqual(unknownAdultProgramme.options, []);
  assert.match(unknownAdultProgramme.voiceResponse, /adult on their own.*adult with children.*under 18/i);

  const childAdultProgramme = resolveJoziSupport(routineArgs({
    needs: ['mes_services'],
    mes_programme: 'ekhaya',
    audience: 'child'
  }));
  assert.equal(childAdultProgramme.suggested_demo_action, '');
  assert.deepEqual(childAdultProgramme.options, []);
  assert.match(childAdultProgramme.voiceResponse, /won't direct a child or family into an adult-only programme/i);

  for (const audience of ['family', 'child']) {
    const overviewForAnyAudience = resolveJoziSupport(routineArgs({
      needs: ['mes_services'],
      mes_programme: 'overview',
      audience,
      location: 'Joubert Park'
    }));
    assert.equal(overviewForAnyAudience.options[0]?.id, MES_ID, audience);
    assert.doesNotMatch(overviewForAnyAudience.voiceResponse, /adult-only programme/i, audience);
    assert.match(overviewForAnyAudience.voiceResponse, /Assessment Centre.*Ekhaya.*Ekuthuleni.*Impilo.*GROW/i, audience);
  }

  const directions = resolveJoziSupport(routineArgs({
    needs: ['shelter_navigation'],
    location: 'Joubert Park',
    detail_requested: 'address'
  }));
  assert.match(directions.voiceResponse, /published branch contact address/i);
  assert.match(directions.voiceResponse, /16 Kapteijn Street/i);
  assert.match(directions.voiceResponse, /confirm the right programme or intake entrance/i);

  const overviewAddress = resolveJoziSupport(routineArgs({
    needs: ['mes_services'],
    mes_programme: 'overview',
    location: 'Joubert Park',
    detail_requested: 'address'
  }));
  assert.match(overviewAddress.voiceResponse, /published branch contact address.*16 Kapteijn Street/i);

  const overviewHours = resolveJoziSupport(routineArgs({
    needs: ['mes_services'],
    mes_programme: 'overview',
    location: 'Joubert Park',
    detail_requested: 'hours'
  }));
  assert.match(overviewHours.voiceResponse, /do not have confirmed current public hours/i);
  assert.match(overviewHours.voiceResponse, /011 725 6531/);

  const impiloAddress = resolveJoziSupport(routineArgs({
    needs: ['mes_services'],
    mes_programme: 'impilo',
    location: 'Joubert Park',
    detail_requested: 'address'
  }));
  assert.match(impiloAddress.voiceResponse, /353 Main Street, Fairview/i);
  assert.match(impiloAddress.voiceResponse, /call 011 725 6531 before travelling/i);

  const ekhayaEntrance = resolveJoziSupport(routineArgs({
    needs: ['mes_services'],
    mes_programme: 'ekhaya',
    location: 'Joubert Park',
    detail_requested: 'address'
  }));
  assert.match(ekhayaEntrance.voiceResponse, /do not have a current verified public entrance/i);
  assert.match(ekhayaEntrance.voiceResponse, /011 725 6531/);
});
