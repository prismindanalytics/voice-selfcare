import test from 'node:test';
import assert from 'node:assert/strict';

import {
  JOZI_EXCLUDED_DESTINATIONS,
  JOZI_SUPPORT_RESOURCES,
  buildServiceGreeting,
  coordinateJoziSupport,
  modeIncludesHealth,
  modeIncludesJozi,
  normalizeServiceMode,
  resolveJoziSupport,
  serviceModePolicy,
  validateJoziResources
} from '../src/jozi-support.js';

function ids(result) {
  return (result.options || []).map((option) => option.id);
}

test('the complete directory passes integrity validation', () => {
  const validation = validateJoziResources();
  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.ok(JOZI_SUPPORT_RESOURCES.length >= 35);
  assert.equal(new Set(JOZI_SUPPORT_RESOURCES.map((resource) => resource.id)).size, JOZI_SUPPORT_RESOURCES.length);
});

test('every destination is source-dated and never claims live availability', () => {
  for (const resource of JOZI_SUPPORT_RESOURCES) {
    assert.match(resource.sourceUrl, /^https:\/\//);
    assert.equal(resource.sourceCheckedAt, '2026-08-13');
    assert.equal(resource.verificationMethod, 'public_source');
    assert.ok(resource.availabilityNote.length >= 20);
    assert.doesNotMatch(resource.description, /bed is available|meal is available|appointment is confirmed/i);
  }
});

test('closed or conflicting destinations are explicitly suppressed', () => {
  const excluded = JOZI_EXCLUDED_DESTINATIONS.map((item) => item.name).join(' | ');
  assert.match(excluded, /3 Kotze Street/);
  assert.match(excluded, /Othandweni/);
  assert.match(excluded, /Esselen Street Clinic/);
  assert.match(excluded, /Joubert Park Clinic/);
  const routable = JOZI_SUPPORT_RESOURCES.map((item) => item.name).join(' | ');
  assert.doesNotMatch(routable, /3 Kotze Street|Othandweni|Esselen Street Clinic|Joubert Park Clinic/);
});

test('service modes normalize safely and share one privacy policy', () => {
  assert.equal(normalizeServiceMode(' COMBINED '), 'combined');
  assert.equal(normalizeServiceMode('not-a-mode'), 'health');
  assert.equal(modeIncludesJozi('jozi'), true);
  assert.equal(modeIncludesJozi('combined'), true);
  assert.equal(modeIncludesHealth('combined'), true);
  assert.deepEqual(serviceModePolicy('jozi'), {
    mode: 'jozi',
    includesHealth: false,
    includesJozi: true,
    callerMemory: false,
    automaticFollowup: false,
    persistRawTranscript: false
  });
  assert.equal(serviceModePolicy('health').callerMemory, true);
});

test('Jozi and combined greetings cover whole-person support and immediate danger', () => {
  assert.match(buildServiceGreeting('jozi'), /mental wellbeing/i);
  assert.match(buildServiceGreeting('jozi'), /safe-space and shelter/i);
  assert.match(buildServiceGreeting('combined'), /health/i);
  assert.match(buildServiceGreeting('combined'), /immediate danger/i);
});

test('Hillbrow overnight-safe-space request routes to MES navigation, not a City office called a safe space', () => {
  const result = resolveJoziSupport({
    needs: ['safe_space'],
    location: 'Hillbrow',
    audience: 'adult',
    safety_context: 'none'
  });
  assert.equal(result.success, true);
  assert.deepEqual(ids(result), ['mes-johannesburg-navigation']);
  assert.match(result.voiceResponse, /does not confirm a walk-in intake/i);
});

test('Soweto shelter navigation stays in Soweto and does not guess specialist eligibility', () => {
  const result = resolveJoziSupport({
    needs: ['shelter_navigation'],
    location: 'Soweto',
    audience: 'unknown',
    safety_context: 'none'
  });
  assert.equal(result.options[0].id, 'coj-region-d-social-services');
  assert.doesNotMatch(ids(result).join(' '), /mes|aged|frida|bienvenu/);
});

test('inner-city adult shelter navigation uses MES and never promises a bed', () => {
  const result = resolveJoziSupport({
    needs: ['shelter_navigation'],
    location: 'Joubert Park',
    audience: 'adult',
    safety_context: 'none'
  });
  assert.equal(result.options[0].id, 'mes-johannesburg-navigation');
  assert.equal(result.availability_confirmed, false);
  assert.match(result.voiceResponse, /Call before travelling/i);
  assert.match(result.voiceResponse, /does not confirm.*bed/i);
});

test('routine mental-health support prefers the dedicated SADAG line', () => {
  const result = resolveJoziSupport({
    needs: ['mental_health'],
    location: 'Johannesburg',
    audience: 'adult',
    safety_context: 'none'
  });
  assert.equal(result.status, 'source_checked_public_contact_found');
  assert.equal(result.options[0].id, 'sadag-mental-health');
  assert.doesNotMatch(ids(result).join(' '), /substance/);
});

test('imminent self-harm overrides the ordinary directory', () => {
  const result = resolveJoziSupport({
    needs: ['mental_health'],
    location: 'Joubert Park',
    audience: 'adult',
    safety_context: 'self_harm_imminent'
  });
  assert.equal(result.status, 'urgent_escalation');
  assert.equal(result.options[0].id, 'joburg-emergency-connect');
  assert.ok(ids(result).includes('sadag-suicide-crisis'));
  assert.match(result.voiceResponse, /nearest landmark/i);
});

test('medical emergencies use Joburg emergency routing before clinics', () => {
  const result = resolveJoziSupport({
    needs: ['healthcare'],
    location: 'Braamfontein',
    audience: 'adult',
    safety_context: 'medical_emergency'
  });
  assert.equal(result.status, 'urgent_escalation');
  assert.equal(result.options[0].id, 'joburg-emergency-connect');
  assert.doesNotMatch(ids(result).join(' '), /clinic/);
});

test('urgent need categories escalate even when safety_context is incorrectly none', () => {
  for (const [need, expected] of [
    ['medical_emergency', 'joburg-emergency-connect'],
    ['overdose', 'joburg-emergency-connect'],
    ['fire_emergency', 'joburg-emergency-connect'],
    ['violence_emergency', 'saps-10111']
  ]) {
    const result = resolveJoziSupport({ needs: [need], location: 'Soweto', audience: 'adult', safety_context: 'none' });
    assert.equal(result.status, 'urgent_escalation', `${need} must escalate`);
    assert.equal(result.options[0].id, expected);
  }
});

test('112 is first only when the caller is known to be on a mobile phone', () => {
  const unknown = resolveJoziSupport({ needs: ['mental_health'], location: 'Hillbrow', audience: 'adult', safety_context: 'self_harm_imminent', phone_type: 'unknown' });
  assert.equal(unknown.options[0].id, 'joburg-emergency-connect');
  const mobile = resolveJoziSupport({ needs: ['mental_health'], location: 'Hillbrow', audience: 'adult', safety_context: 'self_harm_imminent', phone_type: 'mobile' });
  assert.equal(mobile.options[0].id, 'mobile-emergency-112');
});

test('GBV support prioritizes the specialist line and withholds physical addresses by default', () => {
  const result = resolveJoziSupport({
    needs: ['gbv_support'],
    location: 'Hillbrow',
    audience: 'adult',
    safety_context: 'none'
  });
  assert.equal(result.options[0].id, 'gbv-command-centre');
  const physicalResult = resolveJoziSupport({
    needs: ['sexual_assault_care'],
    location: 'Hillbrow',
    audience: 'adult',
    contact_mode: 'in_person',
    safety_context: 'none'
  });
  const physical = physicalResult.options[0];
  assert.equal(physical.id, 'hillbrow-clinical-forensic-medical-service');
  assert.equal(physical.address, '');
  assert.equal(physical.address_withheld_for_safety, true);
});

test('sensitive shelter addresses remain withheld even if a model sends a safe-to-share flag', () => {
  const base = {
    needs: ['women_children_shelter'],
    location: 'Bellevue',
    audience: 'family',
    safety_context: 'none'
  };
  const hidden = resolveJoziSupport(base);
  assert.equal(hidden.options[0].id, 'frida-hartley-shelter');
  assert.equal(hidden.options[0].address, '');
  const shared = resolveJoziSupport({ ...base, safe_to_share_address: true });
  assert.equal(shared.options[0].address, '');
  assert.match(shared.voiceResponse, /does not read out the service address/i);
});

test('child routing excludes adult shelter pathways', () => {
  const result = resolveJoziSupport({
    needs: ['child_safety'],
    location: 'Johannesburg CBD',
    audience: 'child',
    safety_context: 'none'
  });
  assert.equal(result.options[0].id, 'childline-116');
  assert.ok(result.options.every((option) => option.audiences.includes('child')));
  assert.doesNotMatch(ids(result).join(' '), /mes/);
});

test('child mental-health and abuse concerns always retain the 24-hour Childline route', () => {
  for (const need of ['mental_health', 'emotional_support', 'mental_health_crisis', 'suicide_support', 'gbv_support', 'abuse_support']) {
    const result = resolveJoziSupport({
      needs: [need],
      location: 'Soweto',
      audience: 'child',
      safety_context: 'none'
    });
    assert.equal(result.options[0]?.id, 'childline-116', `${need} should retain Childline`);
  }

  const adultReporter = resolveJoziSupport({
    needs: ['child_safety'],
    location: 'Johannesburg',
    audience: 'adult',
    safety_context: 'none'
  });
  assert.equal(adultReporter.options[0]?.id, 'childline-116');
});

test('child shelter or safe-space language always retains Childline even when timing is omitted', () => {
  for (const location of ['Soweto', 'Johannesburg', 'Jozi', 'JHB']) {
    for (const timing of [undefined, 'routine', 'today', 'tonight']) {
      const result = resolveJoziSupport({
        needs: ['safe_space_navigation'],
        location,
        audience: 'child',
        safety_context: 'none',
        ...(timing ? { timing } : {})
      });
      assert.equal(result.options[0]?.id, 'childline-116', `${location} ${timing || 'no timing'}`);
    }
  }
});

test('women-and-children shelter intent can route safely before audience details are known', () => {
  const result = resolveJoziSupport({
    needs: ['women_children_shelter'],
    location: 'Bellevue',
    audience: 'unknown',
    safety_context: 'none'
  });
  assert.equal(result.options[0]?.id, 'frida-hartley-shelter');
  assert.equal(result.options[0]?.address_withheld_for_safety, true);
});

test('Soweto health, substance-use, employment, and legal needs stay locally coherent', () => {
  const cases = [
    ['healthcare', 'Zola', 'zola-clinic'],
    ['healthcare', 'Dobsonville', 'itireleng-clinic'],
    ['healthcare', 'Chiawelo', 'chiawelo-clinic'],
    ['substance_use_support', 'Rockville', 'sanca-soweto'],
    ['employment', 'Orlando West', 'soweto-labour-centre'],
    ['legal_support', 'Klipspruit', 'legal-aid-soweto']
  ];
  for (const [need, location, expected] of cases) {
    const result = resolveJoziSupport({ needs: [need], location, audience: 'adult', safety_context: 'none' });
    assert.equal(result.options[0].id, expected, `${need} should route to ${expected}`);
  }
});

test('source-listed Soweto clinic anchors cover key neighbourhoods without claiming live walk-in status', () => {
  const clinics = [
    ['Orlando East', 'orlando-east-clinic'],
    ['Meadowlands', 'meadowlands-zone-2-clinic'],
    ['Mofolo South', 'mofolo-south-clinic'],
    ['Tladi', 'tladi-clinic'],
    ['Jabavu', 'jabavu-clinic'],
    ['Klipspruit West', 'klipspruit-west-clinic']
  ];
  for (const [location, expected] of clinics) {
    const result = resolveJoziSupport({ needs: ['healthcare'], location, audience: 'adult', safety_context: 'none' });
    assert.equal(result.options[0]?.id, expected, `${location} should route to ${expected}`);
    assert.equal(result.options[0]?.routing_mode, 'source_listed_walk_in');
    assert.equal(result.options[0]?.availability_confirmed, false);
  }

  const broad = resolveJoziSupport({ needs: ['healthcare'], location: 'Soweto', audience: 'adult', safety_context: 'none' });
  assert.equal(broad.error, 'specific_location_required');
  assert.match(broad.voiceResponse, /neighbourhood.*nearest landmark/i);
});

test('medication and related navigation categories resolve to their intended public routes', () => {
  const cases = [
    ['medication', 'Zola', 'zola-clinic'],
    ['medication', 'Orlando East', 'orlando-east-clinic'],
    ['uif_support', 'Orlando West', 'soweto-labour-centre'],
    ['financial_support', 'Johannesburg', 'sassa-social-relief'],
    ['information_access', 'Orlando East', 'orlando-east-library'],
    ['safety_support', 'Johannesburg', 'gbv-command-centre']
  ];
  for (const [need, location, expected] of cases) {
    const result = resolveJoziSupport({ needs: [need], location, audience: 'adult', safety_context: 'none' });
    assert.equal(result.options[0]?.id, expected, `${need} should route to ${expected}`);
  }
});

test('broad or blank locations request clarification instead of leaking a physical office', () => {
  for (const location of ['', 'east', 'west', 'central', 'city', 'town', 'downtown', 'Johannesburg', 'Joburg', 'Jozi', 'JHB']) {
    const result = resolveJoziSupport({ needs: ['shelter_navigation'], location, audience: 'adult', safety_context: 'none' });
    assert.ok(result.needsMoreLocation || result.options.every((option) => !option.address), location || 'blank');
    assert.doesNotMatch(result.voiceResponse, /Sophi Masite|80 Loveday/i);
  }
});

test('broad Soweto and Orlando clinic requests ask for a neighbourhood instead of guessing', () => {
  for (const location of ['Soweto', 'Orlando']) {
    const result = resolveJoziSupport({ needs: ['healthcare'], location, audience: 'adult', safety_context: 'none' });
    assert.equal(result.error, 'specific_location_required');
    assert.match(result.voiceResponse, /neighbourhood.*nearest landmark/i);
  }
});

test('common Johannesburg aliases normalize to the same local routes', () => {
  for (const location of ['Johannesburg CBD', 'Joburg CBD', 'Jozi CBD', 'JHB CBD']) {
    const shelter = resolveJoziSupport({ needs: ['shelter_navigation'], location, audience: 'adult', safety_context: 'none' });
    assert.equal(shelter.options[0]?.id, 'mes-johannesburg-navigation', location);

    const healthcare = resolveJoziSupport({ needs: ['healthcare'], location, audience: 'adult', safety_context: 'none' });
    assert.equal(healthcare.options[0]?.id, 'hillbrow-community-health-centre', location);
  }
});

test('broad urgent-time healthcare asks for a landmark and preserves emergency screening', () => {
  for (const location of ['', 'near me', 'Soweto', 'Johannesburg', 'Joburg']) {
    for (const timing of ['now', 'tonight']) {
      const result = resolveJoziSupport({ needs: ['healthcare'], location, audience: 'adult', safety_context: 'none', timing });
      assert.equal(result.error, 'specific_location_required');
      assert.match(result.voiceResponse, /medical emergency.*neighbourhood.*nearest landmark/i);
    }
  }
});

test('women-and-children requests outside a listed shelter area retain a regional navigator', () => {
  const result = resolveJoziSupport({
    needs: ['women_children_shelter'],
    location: 'Orlando East',
    audience: 'unknown',
    safety_context: 'none'
  });
  assert.equal(result.status, 'specialist_shelter_navigation_required');
  assert.equal(result.options[0]?.id, 'coj-region-d-social-services');
  assert.doesNotMatch(ids(result).join(' '), /frida|bienvenu/);
});

test('broad-area sexual-assault requests retain a specialist phone route while asking for location', () => {
  const result = resolveJoziSupport({
    needs: ['sexual_assault_care'],
    location: 'Soweto',
    audience: 'adult',
    safety_context: 'none'
  });
  assert.equal(result.status, 'source_checked_phone_route_location_needed');
  assert.equal(result.needsMoreLocation, true);
  assert.equal(result.options[0]?.id, 'nthabiseng-thuthuzela-care-centre');
  assert.equal(result.options[0]?.address, '');
  assert.match(result.voiceResponse, /suburb or nearest landmark/i);
});

test('uncovered suburbs retain a phone-first specialist sexual-assault route', () => {
  for (const location of ['Alexandra', 'Sandton', 'Randburg']) {
    const result = resolveJoziSupport({
      needs: ['sexual_assault_care'],
      location,
      audience: 'adult',
      safety_context: 'none'
    });
    assert.equal(result.status, 'source_checked_phone_route_location_needed');
    assert.ok(result.options.length > 0);
    assert.ok(result.options.every((option) => option.address === ''));
    assert.match(result.voiceResponse, /phone-first specialist route/i);
  }
});

test('multiple needs retain one route per high-priority need', () => {
  const crisisAndClinic = resolveJoziSupport({
    needs: ['healthcare', 'mental_health_crisis'],
    location: 'Hillbrow',
    timing: 'now',
    audience: 'adult',
    safety_context: 'none'
  });
  assert.ok(ids(crisisAndClinic).includes('sadag-suicide-crisis'));
  assert.ok(ids(crisisAndClinic).includes('hillbrow-community-health-centre'));
  assert.equal(crisisAndClinic.options[0].id, 'sadag-suicide-crisis');

  const shelterAndSupport = resolveJoziSupport({
    needs: ['shelter_navigation', 'mental_health'],
    location: 'Hillbrow',
    timing: 'tonight',
    audience: 'adult',
    safety_context: 'none'
  });
  assert.ok(ids(shelterAndSupport).includes('mes-johannesburg-navigation'));
  assert.ok(ids(shelterAndSupport).includes('sadag-mental-health'));
  assert.equal(shelterAndSupport.options[0].id, 'mes-johannesburg-navigation');

  const bounded = resolveJoziSupport({
    needs: ['employment', 'documentation', 'legal_support'],
    location: 'Johannesburg CBD',
    audience: 'adult',
    max_options: 3,
    safety_context: 'none'
  });
  assert.equal(bounded.options.length, 2);
});

test('a third need that does not fit the two spoken slots is reported, not silently dropped', () => {
  const child = resolveJoziSupport({
    needs: ['child_safety', 'shelter_navigation', 'healthcare'],
    location: 'Hillbrow',
    audience: 'child',
    safety_context: 'none'
  });
  assert.ok(ids(child).includes('childline-116'));
  assert.ok(child.deferred_needs.includes('healthcare'));
  assert.match(child.voiceResponse, /not yet read a route for healthcare.*limited to two routes/i);

  const adult = resolveJoziSupport({
    needs: ['shelter_navigation', 'healthcare', 'mental_health'],
    location: 'Hillbrow',
    audience: 'adult',
    safety_context: 'none'
  });
  assert.deepEqual(ids(adult), ['mes-johannesburg-navigation', 'sadag-mental-health']);
  assert.deepEqual(adult.uncovered_needs, []);
  assert.deepEqual(adult.deferred_needs, ['healthcare']);
  assert.equal(adult.status, 'partial_source_checked_match');
});

test('multi-category routes use maximum coverage before declaring a need deferred or missing', () => {
  const jobsAndSkills = resolveJoziSupport({
    needs: ['jobs_and_skills'],
    location: 'Hillbrow',
    audience: 'adult',
    safety_context: 'none'
  });
  assert.deepEqual(jobsAndSkills.uncovered_needs, []);
  assert.deepEqual(jobsAndSkills.deferred_needs, []);
  assert.ok(ids(jobsAndSkills).includes('khoebo-opportunity-centre'));

  const foodAndClothing = resolveJoziSupport({
    needs: ['food', 'clothing'],
    location: 'Hillbrow',
    audience: 'adult',
    safety_context: 'none'
  });
  assert.deepEqual(foodAndClothing.uncovered_needs, []);
  assert.deepEqual(foodAndClothing.deferred_needs, []);
  assert.doesNotMatch(foodAndClothing.voiceResponse, /could not confirm.*clothing/i);
});

test('explicit child involvement blocks an adult shelter route even when the reporter is an adult', () => {
  const result = resolveJoziSupport({
    needs: ['child_safety', 'shelter_navigation'],
    location: 'Hillbrow',
    audience: 'adult',
    safety_context: 'none'
  });
  assert.ok(ids(result).includes('childline-116'));
  assert.doesNotMatch(ids(result).join(' '), /mes-johannesburg-navigation/);
  assert.doesNotMatch(result.voiceResponse, /Kapteijn Street/i);
});

test('location clarification preserves and speaks critical co-needs', () => {
  const childAndClinic = resolveJoziSupport({
    needs: ['child_safety', 'healthcare'],
    location: 'Soweto',
    audience: 'child',
    safety_context: 'none'
  });
  assert.equal(childAndClinic.needsMoreLocation, true);
  assert.ok(ids(childAndClinic).includes('childline-116'));
  assert.match(childAndClinic.voiceResponse, /Childline South Africa/);
  assert.match(childAndClinic.voiceResponse, /neighbourhood.*landmark/i);

  const shelterAndMentalHealth = resolveJoziSupport({
    needs: ['shelter_navigation', 'mental_health'],
    location: 'Johannesburg',
    audience: 'adult',
    safety_context: 'none'
  });
  assert.ok(ids(shelterAndMentalHealth).includes('coj-general-services'));
  assert.ok(ids(shelterAndMentalHealth).includes('sadag-mental-health'));
  assert.match(shelterAndMentalHealth.voiceResponse, /City of Johannesburg General Services/);
  assert.match(shelterAndMentalHealth.voiceResponse, /SADAG Cipla Mental Health Helpline/);
});

test('a specific uncovered suburb reports an unmatched co-need without duplicate filler', () => {
  const mentalHealthAndClinic = resolveJoziSupport({
    needs: ['mental_health', 'healthcare'],
    location: 'Alexandra',
    audience: 'adult',
    safety_context: 'none'
  });
  assert.equal(mentalHealthAndClinic.status, 'partial_source_checked_match');
  assert.deepEqual(mentalHealthAndClinic.uncovered_needs, ['healthcare']);
  assert.deepEqual(ids(mentalHealthAndClinic), ['sadag-mental-health']);
  assert.match(mentalHealthAndClinic.voiceResponse, /cannot confirm a suitable local clinic or hospital route/i);
  assert.doesNotMatch(mentalHealthAndClinic.voiceResponse, /LifeLine/);

  const shelterAndClinic = resolveJoziSupport({
    needs: ['healthcare', 'shelter_navigation'],
    location: 'Alexandra',
    audience: 'adult',
    safety_context: 'none'
  });
  assert.deepEqual(shelterAndClinic.uncovered_needs, ['healthcare']);
  assert.deepEqual(ids(shelterAndClinic), ['coj-general-services']);
  assert.match(shelterAndClinic.voiceResponse, /cannot confirm a suitable local clinic or hospital route/i);
});

test('unknown-age shelter requests never enter the adult MES pathway', () => {
  for (const query of [
    { needs: ['shelter_navigation'], location: 'Hillbrow', timing: 'routine' },
    { needs: ['safe_space_navigation'], location: 'Joubert Park', timing: 'tonight' },
    { needs: ['shelter_navigation'], location: 'Johannesburg CBD', timing: 'today' }
  ]) {
    const result = resolveJoziSupport({ ...query, audience: 'unknown', safety_context: 'none' });
    assert.equal(result.status, 'audience_clarification_required');
    assert.equal(result.needsMoreAudience, true);
    assert.doesNotMatch(ids(result).join(' '), /mes-johannesburg-navigation/);
    assert.doesNotMatch(result.voiceResponse, /Kapteijn Street/i);
    assert.match(result.voiceResponse, /adult alone.*adult with children.*under 18/i);
  }
});

test('in-person preference cannot suppress phone-only safety support in a mixed request', () => {
  const crisisAndClinic = resolveJoziSupport({
    needs: ['mental_health_crisis', 'healthcare'],
    location: 'Hillbrow',
    timing: 'now',
    audience: 'adult',
    contact_mode: 'in_person',
    safety_context: 'none'
  });
  assert.deepEqual(ids(crisisAndClinic), ['sadag-suicide-crisis', 'hillbrow-community-health-centre']);
  assert.equal(crisisAndClinic.phone_alternative_included, true);
  assert.match(crisisAndClinic.voiceResponse, /SADAG Suicide Crisis Helpline/);
  assert.match(crisisAndClinic.voiceResponse, /Hillbrow Community Health Centre/);

  const childAndClinic = resolveJoziSupport({
    needs: ['child_safety', 'healthcare'],
    location: 'Hillbrow',
    audience: 'family',
    contact_mode: 'in_person',
    safety_context: 'none'
  });
  assert.ok(ids(childAndClinic).includes('childline-116'));
  assert.match(childAndClinic.voiceResponse, /Childline South Africa/);

  const broadChildAndClinic = resolveJoziSupport({
    needs: ['child_safety', 'healthcare'],
    location: 'Soweto',
    audience: 'child',
    contact_mode: 'in_person',
    safety_context: 'none'
  });
  assert.deepEqual(ids(broadChildAndClinic), ['childline-116']);
  assert.deepEqual(broadChildAndClinic.uncovered_needs, ['healthcare']);
  assert.match(broadChildAndClinic.voiceResponse, /neighbourhood.*landmark/i);
});

test('mixed requests retain regional navigation for an unmatched shelter or safe-space need', () => {
  const womenAndMentalHealth = resolveJoziSupport({
    needs: ['women_children_shelter', 'mental_health'],
    location: 'Soweto',
    audience: 'adult',
    safety_context: 'none'
  });
  assert.deepEqual(ids(womenAndMentalHealth), ['coj-region-d-social-services', 'sadag-mental-health']);
  assert.match(womenAndMentalHealth.voiceResponse, /Region D Social Development/);
  assert.match(womenAndMentalHealth.voiceResponse, /SADAG Cipla Mental Health Helpline/);

  const safeSpaceAndCrisis = resolveJoziSupport({
    needs: ['safe_space_navigation', 'mental_health_crisis'],
    location: 'Soweto',
    audience: 'adult',
    safety_context: 'none'
  });
  assert.deepEqual(ids(safeSpaceAndCrisis), ['sadag-suicide-crisis', 'coj-region-d-social-services']);
  assert.match(safeSpaceAndCrisis.voiceResponse, /SADAG Suicide Crisis Helpline/);
  assert.match(safeSpaceAndCrisis.voiceResponse, /Region D Social Development/);
});

test('unknown audience for a women-and-children request does not hide a critical co-need', () => {
  const crisis = resolveJoziSupport({
    needs: ['women_children_shelter', 'mental_health_crisis'],
    location: 'Soweto',
    audience: 'unknown',
    safety_context: 'none'
  });
  assert.ok(ids(crisis).includes('sadag-suicide-crisis'));
  assert.ok(ids(crisis).includes('coj-region-d-social-services'));

  const childSafety = resolveJoziSupport({
    needs: ['women_children_shelter', 'child_safety'],
    location: 'Johannesburg',
    audience: 'unknown',
    safety_context: 'none'
  });
  assert.ok(ids(childSafety).includes('childline-116'));
  assert.match(childSafety.voiceResponse, /Childline South Africa/);
});

test('uncovered specialist care stays phone-first while another requested route is retained', () => {
  const result = resolveJoziSupport({
    needs: ['sexual_assault_care', 'shelter_navigation'],
    location: 'Alexandra',
    audience: 'adult',
    safety_context: 'none'
  });
  assert.equal(result.needsMoreLocation, true);
  assert.equal(result.options[0].address, '');
  assert.ok(ids(result).includes('coj-general-services'));
  assert.match(result.voiceResponse, /phone-first specialist route/i);
  assert.match(result.voiceResponse, /City of Johannesburg General Services/);
  assert.doesNotMatch(result.voiceResponse, /Kapteijn Street|Smit and Klein Streets|Old Potchefstroom Road/i);
});

test('after-hours specialist care puts a published 24-hour route first', () => {
  const specialistOnly = resolveJoziSupport({
    needs: ['sexual_assault_care'],
    location: 'Alexandra',
    audience: 'adult',
    timing: 'tonight',
    safety_context: 'none'
  });
  assert.equal(specialistOnly.options[0].id, 'nthabiseng-thuthuzela-care-centre');

  const specialistAndShelter = resolveJoziSupport({
    needs: ['gbv_healthcare', 'shelter_navigation'],
    location: 'Alexandra',
    audience: 'adult',
    timing: 'tonight',
    safety_context: 'none'
  });
  assert.deepEqual(ids(specialistAndShelter), ['nthabiseng-thuthuzela-care-centre', 'coj-general-services']);
  assert.match(specialistAndShelter.voiceResponse, /Nthabiseng Thuthuzela Care Centre/);
  assert.doesNotMatch(specialistAndShelter.voiceResponse, /Hillbrow Clinical Forensic/);

  for (const need of ['sexual_assault_care', 'gbv_healthcare']) {
    const hillbrowTonight = resolveJoziSupport({
      needs: [need],
      location: 'Hillbrow',
      audience: 'adult',
      timing: 'tonight',
      safety_context: 'none'
    });
    assert.equal(hillbrowTonight.options[0]?.id, 'nthabiseng-thuthuzela-care-centre', need);
    assert.match(hillbrowTonight.voiceResponse, /phone-first specialist route/i);
  }

  const hillbrowMixed = resolveJoziSupport({
    needs: ['sexual_assault_care', 'shelter_navigation'],
    location: 'Hillbrow',
    audience: 'adult',
    timing: 'tonight',
    safety_context: 'none'
  });
  assert.deepEqual(ids(hillbrowMixed), ['nthabiseng-thuthuzela-care-centre', 'mes-johannesburg-navigation']);
});

test('a nighttime community-space co-need does not suppress crisis support', () => {
  const result = resolveJoziSupport({
    needs: ['daytime_community_space', 'mental_health_crisis'],
    location: 'Hillbrow',
    timing: 'tonight',
    audience: 'adult',
    safety_context: 'none'
  });
  assert.equal(result.options[0].id, 'sadag-suicide-crisis');
  assert.match(result.voiceResponse, /daytime spaces, not overnight shelter/i);
  assert.match(result.voiceResponse, /SADAG Suicide Crisis Helpline/);
});

test('hospital requests clarify broad areas and recognize Baragwanath by name', () => {
  for (const location of ['Soweto', 'Orlando']) {
    const result = resolveJoziSupport({ needs: ['hospital_care'], location, audience: 'adult', safety_context: 'none' });
    assert.equal(result.error, 'specific_location_required');
  }
  for (const location of ['Chris Hani Baragwanath Hospital', 'Baragwanath Hospital', 'Baragwanath']) {
    const result = resolveJoziSupport({ needs: ['hospital_care'], location, audience: 'adult', safety_context: 'none' });
    assert.equal(result.options[0]?.id, 'chris-hani-baragwanath-hospital', location);
  }
});

test('a daytime community venue is never described as a shelter or guaranteed safe space', () => {
  const result = resolveJoziSupport({
    needs: ['daytime_community_space'],
    location: 'Hillbrow',
    audience: 'adult',
    safety_context: 'none'
  });
  assert.equal(result.options[0].id, 'hillbrow-recreation-centre');
  assert.match(result.voiceResponse, /not a shelter/i);
  assert.match(result.voiceResponse, /not.*guaranteed.*safe space/i);
});

test('tonight never routes to a daytime venue', () => {
  const result = resolveJoziSupport({
    needs: ['daytime_community_space'],
    location: 'Hillbrow',
    audience: 'adult',
    safety_context: 'none',
    timing: 'tonight'
  });
  assert.equal(result.success, false);
  assert.equal(result.error, 'daytime_space_not_available_tonight');
  assert.deepEqual(result.options, []);
});

test('adult shelter navigation tonight retains a call-first homelessness route', () => {
  const result = resolveJoziSupport({
    needs: ['shelter_navigation'],
    location: 'Joubert Park',
    audience: 'adult',
    safety_context: 'none',
    timing: 'tonight'
  });
  assert.equal(result.options[0]?.id, 'mes-johannesburg-navigation');
  assert.match(result.voiceResponse, /cannot verify.*reachable tonight/i);
  assert.match(result.voiceResponse, /does not confirm.*bed/i);
});

test('after-hours requests prefer 24-hour navigation and qualify unconfirmed opening', () => {
  const tonight = resolveJoziSupport({
    needs: ['social_support'],
    location: 'Soweto',
    audience: 'adult',
    safety_context: 'none',
    timing: 'tonight'
  });
  assert.equal(tonight.options[0]?.id, 'coj-general-services');
  assert.doesNotMatch(ids(tonight).join(' '), /region-d-social-services/);

  const now = resolveJoziSupport({
    needs: ['employment'],
    location: 'Orlando West',
    audience: 'adult',
    safety_context: 'none',
    timing: 'now'
  });
  assert.equal(now.options[0]?.id, 'soweto-labour-centre');
  assert.match(now.voiceResponse, /cannot verify.*open.*right now/i);

  const routineClinic = resolveJoziSupport({
    needs: ['healthcare'],
    location: 'Hillbrow',
    audience: 'adult',
    safety_context: 'none',
    timing: 'tonight'
  });
  assert.equal(routineClinic.options[0]?.id, 'hillbrow-community-health-centre');
  assert.match(routineClinic.voiceResponse, /cannot verify.*open.*tonight/i);
});

test('a child needing shelter tonight is routed to child safety, not an office-hours adult path', () => {
  const result = resolveJoziSupport({
    needs: ['shelter_navigation'],
    location: 'Johannesburg CBD',
    audience: 'child',
    safety_context: 'none',
    timing: 'tonight'
  });
  assert.equal(result.options[0].id, 'childline-116');
  assert.ok(result.options.every((option) => option.audiences.includes('child')));
});

test('in-person preference never silently returns phone-only services', () => {
  const result = resolveJoziSupport({
    needs: ['mental_health'],
    location: 'Hillbrow',
    audience: 'adult',
    contact_mode: 'in_person',
    safety_context: 'none'
  });
  assert.equal(result.status, 'no_verified_in_person_match');
  assert.equal(result.phoneAlternatives, true);
  assert.ok(result.options.every((option) => !option.contact_modes.includes('in_person')));
});

test('generic social support does not surface stigmatizing specialist routes', () => {
  for (const location of ['Soweto', 'Alexandra', 'Marshalltown']) {
    const result = resolveJoziSupport({ needs: ['social_support'], location, audience: 'adult', safety_context: 'none' });
    const returned = ids(result).join(' ');
    assert.doesNotMatch(returned, /sanca|substance|gbv|childline|suicide/);
  }
});

test('navigation-only resources never produce blank-address visit instructions', () => {
  const result = resolveJoziSupport({ needs: ['food'], location: 'Soweto', audience: 'adult', safety_context: 'none' });
  const network = result.options.find((option) => option.id === 'joburg-homelessness-network');
  assert.ok(network);
  assert.doesNotMatch(result.voiceResponse, /listed service address is\s*\./i);
});

test('vague or unmatched places do not invent a nearby physical destination', () => {
  const vague = resolveJoziSupport({ needs: ['daytime_community_space'], location: 'near me', audience: 'adult', safety_context: 'none' });
  assert.equal(vague.success, false);
  assert.deepEqual(vague.options, []);
  const alex = resolveJoziSupport({ needs: ['healthcare'], location: 'Alexandra', audience: 'adult', safety_context: 'none' });
  assert.equal(alex.success, false);
  assert.doesNotMatch(ids(alex).join(' '), /baragwanath|zola|chiawelo|itireleng/);
});

test('natural demo terms normalize to canonical support routes', () => {
  const cases = [
    ['mental_wellbeing', 'Johannesburg', 'sadag-mental-health'],
    ['somewhere_safe', 'Hillbrow', 'mes-johannesburg-navigation'],
    ['community_space', 'Orlando East', 'orlando-east-library'],
    ['food_and_hygiene', 'Hillbrow', 'mes-johannesburg-navigation'],
    ['child_support', 'Johannesburg CBD', 'childline-116'],
    ['women_and_children', 'Bellevue', 'frida-hartley-shelter']
  ];
  for (const [need, location, expected] of cases) {
    const audience = need === 'child_support' ? 'child' : need === 'women_and_children' ? 'family' : 'adult';
    const result = resolveJoziSupport({ needs: [need], location, audience, safety_context: 'none' });
    assert.equal(result.options[0]?.id, expected, `${need} should resolve to ${expected}`);
  }
});

test('voice responses never automatically offer SMS or WhatsApp', () => {
  for (const query of [
    { needs: ['shelter_navigation'], location: 'Hillbrow', audience: 'adult', safety_context: 'none' },
    { needs: ['women_children_shelter'], location: 'Bellevue', audience: 'family', safety_context: 'none' },
    { needs: ['substance_use_support'], location: 'Soweto', audience: 'adult', safety_context: 'none' }
  ]) {
    assert.doesNotMatch(resolveJoziSupport(query).voiceResponse, /whatsapp|\bsms\b/i);
  }
});

test('unknown categories produce a bounded no-match instead of an invented provider', () => {
  const result = resolveJoziSupport({
    needs: ['pet_boarding'],
    location: 'Hillbrow',
    audience: 'adult',
    safety_context: 'none'
  });
  assert.equal(result.success, false);
  assert.equal(result.status, 'no_verified_local_match');
  assert.deepEqual(result.options, []);
});

test('demo coordination is explicit about non-submission and non-confirmation', () => {
  const result = coordinateJoziSupport({
    resource_id: 'hillbrow-community-health-centre',
    action: 'clinician_handoff',
    requested_time: 'shortly',
    reference_id: 'JZDEMO-TEST',
    demo_enabled: true
  });
  assert.equal(result.success, true);
  assert.equal(result.simulation, true);
  assert.equal(result.submitted, false);
  assert.equal(result.confirmed, false);
  assert.match(result.voiceResponse, /doctor would join shortly/i);
  assert.match(result.voiceResponse, /No live doctor/i);
});

test('demo appointment is a prepared simulation and never presented as booked', () => {
  const result = coordinateJoziSupport({
    resource_id: 'zola-clinic',
    action: 'appointment_request',
    requested_time: 'tomorrow at 10 AM',
    reference_id: 'JZDEMO-APPT',
    demo_enabled: true
  });
  assert.equal(result.success, true);
  assert.equal(result.status, 'simulation_only');
  assert.equal(result.live_success, false);
  assert.match(result.voiceResponse, /simulated appointment request.*tomorrow at 10 AM.*prepared/i);
  assert.match(result.voiceResponse, /Nothing has been sent, booked, or confirmed/i);
});

test('demo coordination cannot run when demo mode is disabled or action is unsupported', () => {
  const disabled = coordinateJoziSupport({
    resource_id: 'zola-clinic',
    action: 'appointment_request',
    demo_enabled: false
  });
  assert.equal(disabled.error, 'demo_mode_disabled');
  const unsupported = coordinateJoziSupport({
    resource_id: 'mobile-emergency-112',
    action: 'appointment_request',
    demo_enabled: true
  });
  assert.equal(unsupported.error, 'demo_action_not_supported');
});

test('all resolver paths are deterministic and network-free', () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => {
    throw new Error('The Jozi resolver must not access the network');
  };
  try {
    const query = { needs: ['social_support', 'food'], location: 'Hillbrow', audience: 'adult', safety_context: 'none' };
    const first = resolveJoziSupport(query);
    const second = resolveJoziSupport(query);
    assert.deepEqual(first, second);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
