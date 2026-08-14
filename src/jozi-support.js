export const JOZI_DIRECTORY_SOURCE_CHECKED_AT = '2026-08-13';

const PUBLIC_SOURCE = 'public_source';

function sourced(record) {
  return {
    ...record,
    sourceCheckedAt: JOZI_DIRECTORY_SOURCE_CHECKED_AT,
    verificationMethod: PUBLIC_SOURCE
  };
}

export const JOZI_SUPPORT_RESOURCES = [
  {
    id: 'mes-johannesburg-navigation',
    name: 'MES Johannesburg',
    primaryCategories: ['shelter_navigation', 'safe_space_navigation', 'social_support', 'mes_services'],
    navigationCategories: ['food', 'hygiene', 'clothing', 'documentation', 'substance_use_support', 'healthcare', 'employment'],
    areas: ['hillbrow', 'joubert park', 'braamfontein', 'berea', 'inner city', 'johannesburg cbd', 'doornfontein', 'jeppestown', 'fairview', 'bertrams'],
    contactModes: ['phone', 'in_person'],
    routingMode: 'call_before_visit',
    addressRole: 'branch_contact',
    address: '16 Kapteijn Street, Hillbrow, Johannesburg, 2038',
    phone: '011 725 6531',
    hours: 'Confirm when calling',
    audiences: ['adult', 'unknown'],
    simulationActions: ['availability_check', 'intake_request', 'navigator_handoff'],
    allowNavigationMatch: true,
    routingPriority: 25,
    description: 'The published MES Johannesburg branch contact for Assessment Centre and service navigation, including social-work assessment, shelter and safe-space information, food and social relief, public-health and rehabilitation links, documentation, family support, and GROW work readiness.',
    availabilityNote: 'Call MES first and call before travelling. The published branch address does not confirm a walk-in intake or the current Assessment Centre entrance, and this listing does not confirm a bed, meal, shower, assessment slot, programme place, or opening hours.',
    sourceUrl: 'https://mes.org.za/contact-us/',
    supportingSourceUrl: 'https://mes.org.za/mes-johannesburg-2/',
    sourceCheckedAt: JOZI_DIRECTORY_SOURCE_CHECKED_AT,
    verificationMethod: PUBLIC_SOURCE,
    operationalStatus: 'official_branch_contact_current_assessment_entry_and_live_availability_unconfirmed'
  },
  sourced({
    id: 'mes-assessment-centre',
    name: 'MES Johannesburg Assessment Centre',
    primaryCategories: ['mes_services'],
    navigationCategories: ['social_support', 'documentation', 'family_support', 'shelter_navigation', 'safe_space_navigation'],
    areas: ['hillbrow', 'joubert park', 'inner city', 'johannesburg cbd'],
    contactModes: ['phone'],
    routingMode: 'phone_only',
    addressRole: 'current_public_entrance_not_confirmed',
    address: '',
    phone: '011 725 6531',
    hours: 'Call the current MES Johannesburg number to confirm',
    audiences: ['adult', 'family', 'older_person', 'person_with_disability', 'unknown'],
    simulationActions: ['intake_request', 'navigator_handoff'],
    description: 'MES describes its Johannesburg Assessment Centre as the first programme entry point after outreach for helpdesk assessment, social-work planning, and referral into the right MES or partner service.',
    availabilityNote: 'Current official pages confirm the programme but not a direct public entrance, direct line, hours, or walk-in status. Call 011 725 6531 to confirm the current entrance and intake process.',
    sourceUrl: 'https://mes.org.za/mes-johannesburg/',
    supportingSourceUrl: 'https://mes.org.za/youth-adults-at-risk/',
    operationalStatus: 'current_programme_public_entrance_and_live_access_unconfirmed'
  }),
  sourced({
    id: 'mes-ekhaya-shelter',
    name: 'MES Ekhaya Shelter',
    primaryCategories: ['mes_services'],
    navigationCategories: ['shelter_navigation', 'safe_space_navigation', 'food', 'hygiene', 'social_support'],
    areas: ['hillbrow', 'joubert park', 'inner city', 'johannesburg cbd'],
    contactModes: ['phone'],
    routingMode: 'phone_only',
    addressRole: 'current_public_entrance_not_confirmed',
    address: '',
    phone: '011 725 6531',
    hours: 'Call the current MES Johannesburg number to confirm',
    audiences: ['adult'],
    simulationActions: ['availability_check', 'intake_request'],
    description: 'A current named MES Johannesburg shelter programme. MES says shelter clients are assessed and linked to its wider social-work, health, relief, and training services.',
    availabilityNote: 'Current official material confirms the programme but not a direct public entrance or current intake hours. Call the MES Johannesburg branch first; admission, capacity, meals, fees, and hours are not confirmed.',
    sourceUrl: 'https://mes.org.za/wp-content/uploads/2025/04/MES-Johannesburg-Needs-List-2025.pdf',
    supportingSourceUrl: 'https://mes.org.za/wp-content/uploads/2024/09/MES-Annual-Report-24-High-Res-compressed.pdf',
    operationalStatus: 'current_programme_public_entrance_and_live_capacity_unconfirmed'
  }),
  sourced({
    id: 'mes-ekuthuleni-shelter',
    name: 'MES Ekuthuleni Shelter',
    primaryCategories: ['mes_services'],
    navigationCategories: ['shelter_navigation', 'safe_space_navigation', 'food', 'hygiene', 'social_support'],
    areas: ['hillbrow', 'joubert park', 'inner city', 'johannesburg cbd'],
    contactModes: ['phone'],
    routingMode: 'phone_only',
    addressRole: 'current_public_entrance_not_confirmed',
    address: '',
    phone: '011 725 6531',
    hours: 'Call the current MES Johannesburg number to confirm',
    audiences: ['adult'],
    simulationActions: ['availability_check', 'intake_request'],
    description: 'A current named MES Johannesburg shelter programme, linked to MES assessment, social work, health, relief, and training services.',
    availabilityNote: 'Current official material confirms the programme but not a direct public entrance or current intake hours. Call the MES Johannesburg branch first; admission, capacity, meals, fees, and hours are not confirmed.',
    sourceUrl: 'https://mes.org.za/wp-content/uploads/2025/04/MES-Johannesburg-Needs-List-2025.pdf',
    supportingSourceUrl: 'https://mes.org.za/wp-content/uploads/2024/09/MES-Annual-Report-24-High-Res-compressed.pdf',
    operationalStatus: 'current_programme_public_entrance_and_live_capacity_unconfirmed'
  }),
  sourced({
    id: 'mes-impilo-shelter',
    name: 'MES Impilo Shelter and Health Support',
    primaryCategories: ['mes_services'],
    navigationCategories: ['shelter_navigation', 'healthcare', 'social_support', 'food'],
    areas: ['fairview', 'jeppestown', 'doornfontein', 'inner city', 'johannesburg cbd'],
    contactModes: ['phone', 'in_person'],
    routingMode: 'call_before_visit',
    addressRole: 'shelter_and_health_programme_location_call_first',
    address: '353 Main Street, Fairview, Johannesburg',
    phone: '011 725 6531',
    hours: 'Call the current MES Johannesburg number to confirm',
    audiences: ['adult', 'older_person', 'person_with_disability'],
    simulationActions: ['availability_check', 'intake_request', 'navigator_handoff'],
    description: 'A current MES Johannesburg programme combining shelter with professional health and social support, including care for people living with chronic or advanced illness.',
    availabilityNote: 'Call the current MES branch number before travelling. This is not a general walk-in clinic, and the listing does not confirm admission, a bed, medical capacity, or the right level of care today.',
    sourceUrl: 'https://mes.org.za/mes-johannesburg/',
    supportingSourceUrl: 'https://mes.org.za/wp-content/uploads/2024/09/MES-Mould-Empower-Serve-NPC-2024-Final-signed-financial-statements.pdf',
    operationalStatus: 'current_programme_and_property_source_checked_live_capacity_unconfirmed'
  }),
  sourced({
    id: 'mes-grow-programme',
    name: 'MES GROW Job and Life Rehabilitation Programme',
    primaryCategories: ['mes_services', 'employment', 'skills_support'],
    navigationCategories: ['social_support', 'documentation', 'substance_use_support'],
    areas: ['hillbrow', 'joubert park', 'inner city', 'johannesburg cbd'],
    contactModes: ['phone'],
    routingMode: 'phone_only',
    addressRole: 'current_public_entrance_not_confirmed',
    address: '',
    phone: '011 725 6531',
    hours: 'Call the current MES Johannesburg number to confirm',
    audiences: ['adult'],
    simulationActions: ['assessment_request', 'navigator_handoff'],
    description: 'MES GROW provides job-and-life rehabilitation, coaching, life skills, work readiness, job-search support, and paid shift opportunities where available.',
    availabilityNote: 'Current official material confirms the programme but not its current public entrance or schedule. Call the current branch number to confirm assessment, eligibility, the entrance, and whether a shift or workshop is available.',
    sourceUrl: 'https://mes.org.za/wp-content/uploads/2025/04/MES-Johannesburg-Needs-List-2025.pdf',
    supportingSourceUrl: 'https://mes.org.za/mes-johannesburg-2/',
    operationalStatus: 'current_programme_public_entrance_and_live_places_unconfirmed'
  }),
  {
    id: 'coj-region-f-social-services',
    name: 'City of Johannesburg Region F Social Services',
    primaryCategories: ['social_support', 'family_support', 'youth_support', 'older_person_support'],
    navigationCategories: ['social_relief', 'shelter_navigation'],
    areas: ['inner city', 'johannesburg cbd', 'hillbrow', 'joubert park', 'braamfontein', 'berea', 'yeoville', 'doornfontein', 'jeppestown', 'region f'],
    contactModes: ['phone', 'in_person'],
    routingMode: 'call_before_visit',
    addressRole: 'public_service_office',
    address: 'CJ Cronje Building, 1st Floor South Wing, 80 Loveday Street, corner Plein Street, Johannesburg',
    phone: '011 376 8533',
    alternateContact: '011 274 4800; street children programmes 011 614 8144 or 011 639 7705',
    hours: 'Monday to Friday, 8:00 AM to 4:30 PM',
    audiences: ['adult', 'family', 'child', 'older_person', 'unknown'],
    simulationActions: ['appointment_request', 'navigator_handoff'],
    allowNavigationMatch: true,
    fallbackOnly: true,
    description: 'A City social-services office for youth and family programmes, street-children programmes, older-person support, poverty-alleviation programmes, and social-service navigation.',
    availabilityNote: 'This is an office-hours public-service route, not a shelter or drop-in safe space. Call to confirm the correct unit and intake process.',
    sourceUrl: 'https://joburg.org.za/about_/regions/Pages/Region%20F%20-%20Inner%20City/Social-Services.aspx',
    sourceCheckedAt: JOZI_DIRECTORY_SOURCE_CHECKED_AT,
    verificationMethod: PUBLIC_SOURCE,
    operationalStatus: 'public_contact_source_checked_live_availability_unconfirmed'
  },
  {
    id: 'coj-general-services',
    name: 'City of Johannesburg General Services',
    primaryCategories: ['city_service_navigation'],
    navigationCategories: ['social_support', 'shelter_navigation', 'social_relief'],
    areas: ['johannesburg', 'citywide'],
    contactModes: ['phone'],
    routingMode: 'phone_only',
    addressRole: 'none',
    address: '',
    phone: '0860 562 874',
    hours: '24 hours',
    audiences: ['adult', 'family', 'child', 'older_person', 'unknown'],
    simulationActions: ['navigator_handoff'],
    allowNavigationMatch: true,
    fallbackOnly: true,
    description: 'The City general-services line, used here as a citywide navigation fallback when a suitable local social-service destination is not in the curated directory.',
    availabilityNote: 'Ask to be routed to Social Development. This line cannot confirm shelter placement or availability.',
    sourceUrl: 'https://joburg.org.za/departments_/Pages/City%20directorates%20including%20departmental%20sub-directorates/Joburg%20Connect/Joburg-Call-Centre-.aspx',
    sourceCheckedAt: JOZI_DIRECTORY_SOURCE_CHECKED_AT,
    verificationMethod: PUBLIC_SOURCE,
    operationalStatus: 'public_contact_source_checked_live_availability_unconfirmed'
  },
  sourced({
    id: 'coj-region-d-social-services',
    name: 'City of Johannesburg Region D Social Development',
    primaryCategories: ['social_support', 'family_support', 'youth_support'],
    navigationCategories: ['shelter_navigation', 'social_relief', 'older_person_support'],
    areas: ['soweto', 'jabulani', 'orlando', 'kliptown', 'pimville', 'rockville', 'diepkloof', 'dobsonville', 'zola', 'region d'],
    contactModes: ['phone', 'in_person'],
    routingMode: 'call_before_visit',
    addressRole: 'public_service_office',
    address: 'Sophi Masite Civic Centre, Koma Road, Jabulani, Soweto',
    phone: '011 022 0953',
    alternateContact: '011 022 0935, 011 022 0963, or 011 022 0967',
    hours: 'Confirm when calling',
    audiences: ['adult', 'family', 'child', 'older_person', 'unknown'],
    simulationActions: ['appointment_request', 'navigator_handoff'],
    allowNavigationMatch: true,
    fallbackOnly: true,
    description: 'The City social-development route for a Soweto social worker and support or shelter navigation.',
    availabilityNote: 'Call first to confirm the right unit and assessment process. This is not a direct shelter door and does not confirm placement.',
    sourceUrl: 'https://joburg.org.za/departments_/Pages/City%20directorates%20including%20departmental%20sub-directorates/Human%20Development/Contacts%20and%20Other%20organisations.aspx',
    operationalStatus: 'public_contact_source_checked_live_availability_unconfirmed'
  }),
  sourced({
    id: 'frida-hartley-shelter',
    name: 'Frida Hartley Shelter',
    primaryCategories: ['women_children_shelter', 'family_support'],
    navigationCategories: ['social_support', 'skills_support', 'emotional_support'],
    areas: ['bellevue', 'yeoville', 'berea', 'hillbrow', 'inner city', 'johannesburg cbd'],
    contactModes: ['phone', 'in_person'],
    routingMode: 'call_before_visit',
    addressRole: 'sensitive_service_site',
    addressSharing: 'after_safe_to_share',
    address: '97 Regent Street, Bellevue, Johannesburg',
    phone: '011 648 6005',
    alternateContact: 'WhatsApp 067 674 6347',
    hours: 'Confirm when calling',
    audiences: ['adult', 'family', 'child'],
    simulationActions: ['availability_check', 'intake_request'],
    description: 'A shelter and development service for women and their children, with counselling and skills support.',
    availabilityNote: 'Call first for eligibility, safety screening, and capacity. Do not disclose the address when another person may be monitoring or threatening the caller, and never promise admission.',
    sourceUrl: 'https://www.fridahartley.org/contact',
    operationalStatus: 'public_contact_source_checked_live_capacity_unconfirmed'
  }),
  sourced({
    id: 'bienvenu-shelter',
    name: 'Bienvenu Shelter',
    primaryCategories: ['women_children_shelter', 'migrant_support'],
    navigationCategories: ['healthcare', 'legal_support', 'emotional_support'],
    areas: ['bertrams', 'doornfontein', 'jeppestown', 'inner city', 'johannesburg cbd'],
    contactModes: ['phone', 'in_person'],
    routingMode: 'call_before_visit',
    addressRole: 'sensitive_service_site',
    addressSharing: 'after_safe_to_share',
    address: '36 Terrace Road, Bertrams, Johannesburg',
    phone: '011 624 2915',
    hours: 'Confirm when calling',
    audiences: ['adult', 'family', 'child'],
    simulationActions: ['availability_check', 'intake_request'],
    description: 'Temporary accommodation and health, legal, and psychosocial support for migrant and refugee women and children.',
    availabilityNote: 'Call first for eligibility, safety screening, and capacity. Do not disclose the address when it may put the caller at risk, and never promise admission.',
    sourceUrl: 'https://bienvenushelter.scalabrinianas.org/',
    operationalStatus: 'public_contact_source_checked_live_capacity_unconfirmed'
  }),
  sourced({
    id: 'soweto-home-for-the-aged',
    name: 'Soweto Home for the Aged',
    primaryCategories: ['older_person_support'],
    navigationCategories: ['shelter_navigation', 'social_support', 'healthcare'],
    areas: ['soweto', 'central western jabavu', 'jabavu', 'jabulani'],
    contactModes: ['phone', 'in_person'],
    routingMode: 'call_before_visit',
    addressRole: 'residential_service_site',
    address: '3146 Mphuthi Street, Central Western Jabavu, Soweto',
    phone: '010 072 0146',
    hours: 'Confirm when calling',
    audiences: ['older_person'],
    simulationActions: ['availability_check', 'intake_request'],
    description: 'Residential, social-work, and health support for older people, including people who are destitute.',
    availabilityNote: 'Call first to confirm age and admission criteria, contributions if any, assessment, and capacity. Do not promise a place.',
    sourceUrl: 'https://www.sowetohome.org.za/',
    operationalStatus: 'public_contact_source_checked_live_capacity_unconfirmed'
  }),
  sourced({
    id: 'joburg-homelessness-network',
    name: 'Johannesburg Homelessness Network',
    primaryCategories: ['homelessness_network'],
    navigationCategories: ['shelter_navigation', 'food', 'hygiene', 'employment', 'social_support'],
    areas: ['johannesburg', 'citywide'],
    contactModes: ['phone'],
    routingMode: 'navigation_only',
    addressRole: 'administrative_office_not_routed',
    address: '',
    phone: '082 395 1268',
    alternateContact: 'joburghomelessnetwork@gmail.com',
    hours: 'Confirm when calling',
    audiences: ['adult', 'family', 'unknown'],
    simulationActions: ['navigator_handoff'],
    allowNavigationMatch: true,
    description: 'A homelessness-sector network that can help identify current outreach, drop-in, shower, food, and work-support activity.',
    availabilityNote: 'Call for current schedules. Do not travel to its administrative address expecting a meal, shower, shelter, or other walk-in service.',
    sourceUrl: 'https://joburghomelessnetwork.org.za/',
    operationalStatus: 'public_contact_confirmed_programme_schedules_unconfirmed'
  }),
  sourced({
    id: 'johannesburg-city-library',
    name: 'Johannesburg City Library',
    primaryCategories: ['daytime_community_space'],
    navigationCategories: ['information_access'],
    areas: ['johannesburg cbd', 'inner city', 'marshalltown', 'braamfontein', 'joubert park'],
    contactModes: ['phone', 'in_person'],
    routingMode: 'call_before_visit',
    addressRole: 'public_civic_space',
    address: 'Beyers Naudé Square, corner Albertina Sisulu Road and Pixley Ka Isaka Seme Street, Johannesburg',
    phone: '011 407 7703',
    alternateContact: '061 438 0153',
    hours: 'Published hours Monday to Friday, 9:00 AM to 5:00 PM; call to confirm current phase-one access',
    audiences: ['adult', 'family', 'child', 'older_person', 'unknown'],
    simulationActions: ['navigator_handoff'],
    allowNavigationMatch: true,
    description: 'A public daytime library and information space; phase-one services reopened in March 2025.',
    availabilityNote: 'This is not a shelter, overnight space, social-work intake, or guaranteed safe space. Call to confirm current opening and accessible areas.',
    sourceUrl: 'https://joburg.org.za/media_/Newsroom/Pages/2025-News-Articles/Phase-one-opening-of-Joburg-City-Library-marks-significant-milestone-for-City.aspx',
    supportingSourceUrl: 'https://joburg.org.za/departments_/Documents/Libraries/LIS-CONTACT-LIST-AND-LIBRARY-HOURS-2024-MARCH.pdf',
    operationalStatus: 'phase_one_open_public_hours_require_confirmation'
  }),
  sourced({
    id: 'hillbrow-recreation-centre',
    name: 'Hillbrow Recreation Centre',
    primaryCategories: ['daytime_community_space'],
    navigationCategories: ['youth_support', 'skills_support', 'substance_use_support'],
    areas: ['hillbrow', 'berea', 'joubert park', 'inner city'],
    contactModes: ['phone', 'in_person'],
    routingMode: 'call_before_visit',
    addressRole: 'public_civic_space',
    address: 'Corner Clarendon and Pretoria Streets, Hillbrow, Johannesburg',
    phone: '011 643 2675',
    hours: 'Call to confirm programme and public-access times',
    audiences: ['adult', 'family', 'child', 'unknown'],
    simulationActions: ['navigator_handoff'],
    description: 'A City recreation centre listing youth, sport, sewing, food-gardening, nursery, and Alcoholics Anonymous programmes.',
    availabilityNote: 'This is not a shelter, overnight space, or guaranteed general drop-in safe space. Call to confirm which programme is running and who may attend.',
    sourceUrl: 'https://joburg.org.za/departments_/Documents/Community%20Development/Region_F-Sport_Recreation_and_Aquatic_Facilities_2024.pdf',
    operationalStatus: 'public_site_source_checked_programme_times_unconfirmed'
  }),
  sourced({
    id: 'orlando-east-library',
    name: 'Orlando East Library',
    primaryCategories: ['daytime_community_space'],
    navigationCategories: ['information_access'],
    areas: ['soweto', 'orlando east', 'orlando', 'rockville'],
    contactModes: ['phone', 'in_person'],
    routingMode: 'call_before_visit',
    addressRole: 'public_civic_space',
    address: '6544 Mooki Street, Orlando East, Soweto',
    phone: '011 935 1040',
    hours: 'Monday to Friday, 9:00 AM to 5:00 PM; closed weekends and public holidays',
    audiences: ['adult', 'family', 'child', 'older_person', 'unknown'],
    simulationActions: ['navigator_handoff'],
    allowNavigationMatch: true,
    description: 'A public daytime library and information space in Orlando East.',
    availabilityNote: 'This is not a shelter, overnight space, social-work intake, or guaranteed safe space. Call to confirm opening before travelling.',
    sourceUrl: 'https://joburg.org.za/departments_/Documents/Community%20Development/2024.08_WEBSITE_CONTACT_LIST_REGION_D.pdf',
    operationalStatus: 'public_site_and_hours_source_checked_live_access_unconfirmed'
  }),
  sourced({
    id: 'diepkloof-multipurpose-centre',
    name: 'Diepkloof Multipurpose Centre',
    primaryCategories: ['daytime_community_space'],
    navigationCategories: ['youth_support', 'skills_support'],
    areas: ['soweto', 'diepkloof'],
    contactModes: ['phone', 'in_person'],
    routingMode: 'call_before_visit',
    addressRole: 'public_civic_space',
    address: '348 Diepkloof Extension, Phase 1, Eden Drive, Zone 3, Diepkloof, Soweto',
    phone: '011 985 7877',
    hours: 'Call to confirm public-access and programme times',
    audiences: ['adult', 'family', 'child', 'older_person', 'unknown'],
    simulationActions: ['navigator_handoff'],
    description: 'A public recreation and community-programme venue in Diepkloof.',
    availabilityNote: 'This is not a shelter, overnight space, or guaranteed safe space. Call to confirm which public programme or area is available.',
    sourceUrl: 'https://joburg.org.za/about_/regions/Pages/Region%20D%20-%20Greater%20Soweto/Region-D-Recreation-Centres.aspx',
    operationalStatus: 'public_site_source_checked_programme_times_unconfirmed'
  }),
  {
    id: 'sadag-suicide-crisis',
    name: 'SADAG Suicide Crisis Helpline',
    primaryCategories: ['mental_health_crisis', 'suicide_support'],
    navigationCategories: ['mental_health', 'emotional_support'],
    areas: ['johannesburg', 'citywide', 'gauteng', 'south africa'],
    contactModes: ['phone'],
    routingMode: 'phone_only',
    addressRole: 'none',
    address: '',
    phone: '0800 567 567',
    hours: '24 hours',
    audiences: ['adult', 'family', 'unknown'],
    simulationActions: ['warm_handoff'],
    allowNavigationMatch: true,
    description: 'A 24-hour mental-health crisis and suicide-support helpline.',
    availabilityNote: 'If someone may act now, has already harmed themselves, or cannot stay safe, contact emergency services first and stay with them if it is safe.',
    sourceUrl: 'https://www.sadag.org/contact/',
    sourceCheckedAt: JOZI_DIRECTORY_SOURCE_CHECKED_AT,
    verificationMethod: PUBLIC_SOURCE,
    operationalStatus: 'public_contact_source_checked_live_queue_unconfirmed'
  },
  {
    id: 'sadag-mental-health',
    name: 'SADAG Cipla Mental Health Helpline',
    primaryCategories: ['mental_health', 'emotional_support'],
    navigationCategories: ['mental_health_crisis'],
    areas: ['johannesburg', 'citywide', 'gauteng', 'south africa'],
    contactModes: ['phone'],
    routingMode: 'phone_only',
    addressRole: 'none',
    address: '',
    phone: '0800 456 789',
    hours: '24 hours',
    audiences: ['adult', 'family', 'unknown'],
    simulationActions: ['warm_handoff'],
    routingPriority: 5,
    description: 'A 24-hour mental-health support helpline for someone who needs to talk or find further help.',
    availabilityNote: 'For immediate danger or an imminent suicide risk, use emergency services and the suicide crisis route instead.',
    sourceUrl: 'https://www.sadag.org/contact/',
    sourceCheckedAt: JOZI_DIRECTORY_SOURCE_CHECKED_AT,
    verificationMethod: PUBLIC_SOURCE,
    operationalStatus: 'public_contact_source_checked_live_queue_unconfirmed'
  },
  {
    id: 'lifeline-national-crisis',
    name: 'LifeLine National Crisis Line',
    primaryCategories: ['mental_health', 'emotional_support', 'bereavement_support'],
    navigationCategories: ['mental_health_crisis', 'abuse_support'],
    areas: ['johannesburg', 'citywide', 'gauteng', 'south africa'],
    contactModes: ['phone'],
    routingMode: 'phone_only',
    addressRole: 'none',
    address: '',
    phone: '0861 322 322',
    hours: '24 hours',
    audiences: ['adult', 'family', 'unknown'],
    simulationActions: ['warm_handoff'],
    routingPriority: 2,
    description: 'Telephone counselling for emotional distress, crisis, abuse, bereavement, and suicide concerns.',
    availabilityNote: 'For immediate danger or an imminent suicide risk, contact emergency services first.',
    sourceUrl: 'https://www.gov.za/about-government/government-call-centres-and-help-lines',
    sourceCheckedAt: JOZI_DIRECTORY_SOURCE_CHECKED_AT,
    verificationMethod: PUBLIC_SOURCE,
    operationalStatus: 'public_contact_source_checked_live_queue_unconfirmed'
  },
  {
    id: 'gbv-command-centre',
    name: 'Gender-Based Violence Command Centre',
    primaryCategories: ['gbv_support', 'abuse_support', 'safety_support'],
    navigationCategories: ['emotional_support', 'social_support'],
    areas: ['johannesburg', 'citywide', 'gauteng', 'south africa'],
    contactModes: ['phone'],
    routingMode: 'phone_only',
    addressRole: 'confidential',
    address: '',
    phone: '0800 428 428',
    alternateContact: '*120*7867# from a mobile phone',
    hours: '24 hours',
    audiences: ['adult', 'family', 'unknown'],
    simulationActions: ['warm_handoff'],
    description: 'A 24-hour support and social-worker referral route for people affected by gender-based violence.',
    availabilityNote: 'First ask whether it is safe to speak. Do not send a follow-up message or disclose the caller’s location without consent. Offer emergency services for immediate danger.',
    sourceUrl: 'https://www.dsd.gov.za/index.php/21-latest-news/567-the-gender-based-violence-command-centre-is-now-live',
    sourceCheckedAt: JOZI_DIRECTORY_SOURCE_CHECKED_AT,
    verificationMethod: PUBLIC_SOURCE,
    operationalStatus: 'public_contact_source_checked_live_queue_unconfirmed'
  },
  {
    id: 'childline-116',
    name: 'Childline South Africa',
    primaryCategories: ['child_safety'],
    navigationCategories: ['family_support', 'emotional_support', 'abuse_support'],
    areas: ['johannesburg', 'citywide', 'gauteng', 'south africa'],
    contactModes: ['phone'],
    routingMode: 'phone_only',
    addressRole: 'none',
    address: '',
    phone: '116',
    hours: '24 hours',
    audiences: ['child', 'family', 'unknown'],
    simulationActions: ['warm_handoff'],
    routingPriority: 8,
    description: 'A free child-safety and support helpline for children and for concerns about child abuse or neglect.',
    availabilityNote: 'Never route a child or family to an adult shelter. Use emergency services for immediate danger.',
    sourceUrl: 'https://www.childlinesa.org.za/about/how-we-help/crisis-line/',
    sourceCheckedAt: JOZI_DIRECTORY_SOURCE_CHECKED_AT,
    verificationMethod: PUBLIC_SOURCE,
    operationalStatus: 'public_contact_source_checked_live_queue_unconfirmed'
  },
  {
    id: 'gauteng-substance-use-helpline',
    name: 'Gauteng Anti-Substance Abuse Helpline',
    primaryCategories: ['substance_use_support'],
    navigationCategories: ['family_support'],
    areas: ['johannesburg', 'citywide', 'gauteng'],
    contactModes: ['phone'],
    routingMode: 'phone_only',
    addressRole: 'none',
    address: '',
    phone: '0800 228 827',
    alternateContact: '*134*474727# from a mobile phone',
    hours: '24 hours',
    audiences: ['adult', 'family', 'child', 'unknown'],
    simulationActions: ['assessment_request', 'warm_handoff'],
    description: 'Gauteng support and referral for people seeking help with alcohol or drug use and for concerned families or caregivers.',
    availabilityNote: 'Treatment admission requires an assessment. The line cannot promise a place in a programme.',
    sourceUrl: 'https://cmbinary.gauteng.gov.za/Media?Item=954&Location=%2Fsocdev&Type=Documents&path=socdev%2FDocuments%2FAnnual+Reports%2FDepartment+of+Social+Development+Annual+Performance+Plan+2025-2026+Financial+Year.pdf',
    sourceCheckedAt: JOZI_DIRECTORY_SOURCE_CHECKED_AT,
    verificationMethod: PUBLIC_SOURCE,
    operationalStatus: 'public_contact_source_checked_live_queue_unconfirmed'
  },
  {
    id: 'sanca-central-rand',
    name: 'SANCA Central Rand Alcohol and Drug Centre',
    primaryCategories: ['substance_use_support'],
    navigationCategories: ['family_support', 'social_support'],
    areas: ['marshalltown', 'johannesburg cbd', 'inner city', 'hillbrow', 'joubert park'],
    contactModes: ['phone', 'in_person'],
    routingMode: 'call_before_visit',
    addressRole: 'service_site',
    address: '1st Floor, Samancor House, 88 Marshall Street, Marshalltown, Johannesburg',
    phone: '011 836 2460',
    hours: 'Monday to Friday, 7:30 AM to 4:00 PM',
    audiences: ['adult', 'family', 'unknown'],
    simulationActions: ['assessment_request', 'appointment_request'],
    description: 'A specialist alcohol and drug support service in central Johannesburg.',
    availabilityNote: 'Call before visiting to confirm the service, assessment process, cost if any, and appointment arrangements.',
    sourceUrl: 'https://www.sancacentral.org.za/contact-us/',
    sourceCheckedAt: JOZI_DIRECTORY_SOURCE_CHECKED_AT,
    verificationMethod: PUBLIC_SOURCE,
    operationalStatus: 'public_contact_source_checked_live_availability_unconfirmed'
  },
  {
    id: 'sanca-soweto',
    name: 'SANCA Soweto Alcohol and Drug Centre',
    primaryCategories: ['substance_use_support'],
    navigationCategories: ['family_support', 'social_support'],
    areas: ['soweto', 'rockville', 'orlando', 'jabulani', 'pimville', 'kliptown'],
    contactModes: ['phone', 'in_person'],
    routingMode: 'call_before_visit',
    addressRole: 'service_site',
    address: '827 Elias Motsoaledi Road, Rockville, Soweto',
    phone: '011 984 4290',
    hours: 'Confirm when calling',
    audiences: ['adult', 'family', 'unknown'],
    simulationActions: ['assessment_request', 'appointment_request'],
    description: 'A SANCA alcohol and drug support centre serving Soweto.',
    availabilityNote: 'Call before visiting to confirm the service, assessment process, cost if any, hours, and appointment arrangements.',
    sourceUrl: 'https://www.sancanational.info/gauteng',
    sourceCheckedAt: JOZI_DIRECTORY_SOURCE_CHECKED_AT,
    verificationMethod: PUBLIC_SOURCE,
    operationalStatus: 'public_contact_source_checked_live_availability_unconfirmed'
  },
  {
    id: 'sassa-social-relief',
    name: 'SASSA Grants and Social Relief Enquiries',
    primaryCategories: ['grants', 'social_relief'],
    navigationCategories: ['financial_support'],
    areas: ['johannesburg', 'citywide', 'gauteng', 'south africa'],
    contactModes: ['phone'],
    routingMode: 'phone_only',
    addressRole: 'administrative_office_not_routed',
    address: '',
    phone: '0800 60 10 11',
    hours: 'Confirm when calling',
    audiences: ['adult', 'family', 'older_person', 'person_with_disability', 'unknown'],
    simulationActions: ['navigator_handoff'],
    allowNavigationMatch: true,
    description: 'Official enquiries about social grants and Social Relief of Distress.',
    availabilityNote: 'Eligibility, the form of assistance, approval, and timing must be confirmed by SASSA. This is not an immediate meal service.',
    sourceUrl: 'https://www.gov.za/about-government/contact-directory/soe/south-african-social-security-agency-sassa',
    sourceCheckedAt: JOZI_DIRECTORY_SOURCE_CHECKED_AT,
    verificationMethod: PUBLIC_SOURCE,
    operationalStatus: 'public_contact_source_checked_live_availability_unconfirmed'
  },
  {
    id: 'khoebo-opportunity-centre',
    name: 'Khoebo Jozi Opportunity Centre',
    primaryCategories: ['employment', 'skills_support'],
    navigationCategories: ['social_support'],
    areas: ['braamfontein', 'johannesburg cbd', 'inner city', 'hillbrow', 'joubert park', 'region f'],
    contactModes: ['phone', 'in_person'],
    routingMode: 'call_before_visit',
    addressRole: 'service_site',
    address: '66 Jorissen Place, Jorissen Street, Braamfontein, Johannesburg, 2001',
    phone: '083 702 9683',
    hours: 'Monday to Friday, 8:00 AM to 4:00 PM',
    audiences: ['adult', 'unknown'],
    simulationActions: ['appointment_request', 'navigator_handoff'],
    description: 'A City employment and opportunity support centre.',
    availabilityNote: 'Call first to confirm current programmes, documents needed, and appointment arrangements. It cannot guarantee work.',
    sourceUrl: 'https://jobseekers.joburg.org.za/Home/ContactUs',
    sourceCheckedAt: JOZI_DIRECTORY_SOURCE_CHECKED_AT,
    verificationMethod: PUBLIC_SOURCE,
    operationalStatus: 'public_contact_source_checked_live_availability_unconfirmed'
  },
  {
    id: 'johannesburg-labour-centre',
    name: 'Johannesburg Labour Centre',
    primaryCategories: ['employment'],
    navigationCategories: ['skills_support'],
    areas: ['marshalltown', 'johannesburg cbd', 'inner city', 'citywide'],
    contactModes: ['phone', 'in_person'],
    routingMode: 'call_before_visit',
    addressRole: 'public_service_office',
    address: '56 Main Street, Marshalltown, Johannesburg',
    phone: '011 843 4000',
    alternateContact: '011 843 4001',
    hours: 'Monday to Friday, 7:30 AM to 4:00 PM',
    audiences: ['adult', 'unknown'],
    simulationActions: ['appointment_request', 'navigator_handoff'],
    description: 'Official public employment services and work-seeker support.',
    availabilityNote: 'Call first to confirm current services, required documents, and appointment arrangements. It cannot guarantee a job.',
    sourceUrl: 'https://www.labour.gov.za/Contacts/Labour-centres/Pages/default.aspx',
    sourceCheckedAt: JOZI_DIRECTORY_SOURCE_CHECKED_AT,
    verificationMethod: PUBLIC_SOURCE,
    operationalStatus: 'public_contact_source_checked_live_availability_unconfirmed'
  },
  {
    id: 'home-affairs-contact-centre',
    name: 'Department of Home Affairs Contact Centre',
    primaryCategories: ['documentation', 'identity_documents'],
    navigationCategories: [],
    areas: ['johannesburg', 'citywide', 'gauteng', 'south africa'],
    contactModes: ['phone'],
    routingMode: 'phone_only',
    addressRole: 'none',
    address: '',
    phone: '0800 601 190',
    hours: 'Confirm when calling',
    audiences: ['adult', 'family', 'unknown'],
    simulationActions: ['navigator_handoff'],
    description: 'Official information about identity documents and Home Affairs services.',
    availabilityNote: 'The line provides information; document eligibility, requirements, and the correct office must be confirmed with Home Affairs.',
    sourceUrl: 'https://ehome.dha.gov.za/eHomeAffairsV3/Home/Contact',
    sourceCheckedAt: JOZI_DIRECTORY_SOURCE_CHECKED_AT,
    verificationMethod: PUBLIC_SOURCE,
    operationalStatus: 'public_contact_source_checked_live_availability_unconfirmed'
  },
  sourced({
    id: 'home-affairs-soweto-office',
    name: 'Home Affairs Soweto Large Office',
    primaryCategories: ['documentation', 'identity_documents'],
    navigationCategories: [],
    areas: ['soweto', 'orlando west', 'orlando', 'rockville'],
    contactModes: ['phone', 'in_person'],
    routingMode: 'call_before_visit',
    addressRole: 'public_service_office',
    address: '11902 Kumalo Main Road and Armitage Street, Orlando West, Soweto',
    phone: '0800 601 190',
    hours: 'Call the Home Affairs contact centre to confirm',
    audiences: ['adult', 'family', 'unknown'],
    simulationActions: ['navigator_handoff'],
    description: 'A current Home Affairs office location in Soweto; the national contact centre should confirm its service scope and access arrangements.',
    availabilityNote: 'Call first to confirm that this office handles the document needed, current hours, booking requirements, and documents to bring.',
    sourceUrl: 'https://www.dha.gov.za/images/Tenderdocs/INVITATION-TO-BID-DHA05-2025.pdf',
    supportingSourceUrl: 'https://www.dha.gov.za/images/PDFs/jobs/HRMC_38_of_2026.pdf',
    operationalStatus: 'public_site_source_checked_service_scope_and_hours_unconfirmed'
  }),
  {
    id: 'legal-aid-johannesburg',
    name: 'Legal Aid South Africa Johannesburg Local Office',
    primaryCategories: ['legal_support'],
    navigationCategories: ['documentation'],
    areas: ['marshalltown', 'johannesburg cbd', 'inner city', 'citywide'],
    contactModes: ['phone', 'in_person'],
    routingMode: 'call_before_visit',
    addressRole: 'public_service_office',
    address: '56 Main Street, Marshalltown, Johannesburg',
    phone: '011 870 1480',
    alternateContact: 'National advice line 0800 110 110',
    hours: 'Confirm when calling',
    audiences: ['adult', 'family', 'unknown'],
    simulationActions: ['appointment_request', 'navigator_handoff'],
    description: 'Legal Aid South Africa’s Johannesburg office and national legal-advice route.',
    availabilityNote: 'Call first to confirm whether the matter qualifies for assistance, what documents are needed, and whether an appointment is required.',
    sourceUrl: 'https://legal-aid.co.za/gauteng/',
    sourceCheckedAt: JOZI_DIRECTORY_SOURCE_CHECKED_AT,
    verificationMethod: PUBLIC_SOURCE,
    operationalStatus: 'public_contact_source_checked_live_availability_unconfirmed'
  },
  {
    id: 'hillbrow-community-health-centre',
    name: 'Hillbrow Community Health Centre',
    primaryCategories: ['healthcare', 'medical_emergency', 'victim_friendly_healthcare'],
    navigationCategories: ['medication'],
    areas: ['joubert park', 'hillbrow', 'johannesburg cbd', 'inner city'],
    contactModes: ['phone', 'in_person'],
    routingMode: 'call_before_visit',
    addressRole: 'health_service_site',
    address: 'Corner Smit and Klein Streets, Hillbrow, Johannesburg',
    phone: '011 694 3775',
    alternateContact: '011 694 3776 or 082 926 0121',
    hours: 'Routine services Monday to Friday, 7:30 AM to 4:00 PM; the City lists emergency and victim-friendly services as 24 hours',
    audiences: ['adult', 'family', 'child', 'older_person', 'person_with_disability', 'unknown'],
    simulationActions: ['appointment_request', 'clinician_handoff'],
    allowNavigationMatch: true,
    description: 'A community health centre providing routine healthcare; the City separately lists emergency and victim-friendly services as available 24 hours.',
    availabilityNote: 'Call first to confirm routine-care hours, the current queue, and appointment arrangements. For a life-threatening emergency, call emergency services.',
    sourceUrl: 'https://joburg.org.za/about_/regions/Pages/Region%20F%20-%20Inner%20City/REGION%20F%20Clinics/REGION-F-CLINICS.aspx',
    sourceCheckedAt: JOZI_DIRECTORY_SOURCE_CHECKED_AT,
    verificationMethod: PUBLIC_SOURCE,
    operationalStatus: 'public_contact_source_checked_live_availability_unconfirmed'
  },
  sourced({
    id: 'hillbrow-clinical-forensic-medical-service',
    name: 'Hillbrow Clinical Forensic Medical Service',
    primaryCategories: ['sexual_assault_care', 'gbv_healthcare', 'victim_friendly_healthcare'],
    navigationCategories: ['healthcare', 'gbv_support'],
    areas: ['hillbrow', 'joubert park', 'berea', 'johannesburg cbd', 'inner city'],
    contactModes: ['phone', 'in_person'],
    routingMode: 'call_before_visit',
    addressRole: 'sensitive_health_service_site',
    addressSharing: 'after_safe_to_share',
    address: 'Hillbrow Community Health Centre, corner Smit and Klein Streets, Hillbrow, Johannesburg',
    phone: '011 694 3805',
    hours: 'Call to confirm access; use emergency services for immediate medical danger',
    audiences: ['adult', 'family', 'child', 'unknown'],
    simulationActions: ['clinician_handoff', 'navigator_handoff'],
    description: 'A clinical forensic medical route in Hillbrow for sexual-assault and violence-related healthcare.',
    availabilityNote: 'First ask whether it is safe to speak. Call to confirm access, preserve the caller’s choices, and use emergency services for immediate medical danger.',
    sourceUrl: 'https://cmbinary.gauteng.gov.za/Media?Item=1753&Location=%2Fcphealth&Type=Documents&path=cphealth%2FDocuments%2FNews+Bulletin+-+15++December+2024.pdf',
    operationalStatus: 'public_specialist_contact_source_checked_live_access_unconfirmed'
  }),
  {
    id: 'jeppe-clinic',
    name: 'Jeppe Clinic',
    primaryCategories: ['healthcare'],
    navigationCategories: ['medication'],
    areas: ['jeppestown', 'jeppe', 'doornfontein', 'inner city'],
    contactModes: ['phone', 'in_person'],
    routingMode: 'call_before_visit',
    addressRole: 'health_service_site',
    address: '34 Ford Street, Jeppestown, Johannesburg',
    phone: '011 614 1474',
    alternateContact: '011 614 1475 or 083 287 0733',
    hours: 'Monday to Friday, 7:30 AM to 4:00 PM',
    audiences: ['adult', 'family', 'child', 'older_person', 'person_with_disability', 'unknown'],
    simulationActions: ['appointment_request', 'clinician_handoff'],
    description: 'A City clinic serving Jeppestown and nearby inner-city areas.',
    availabilityNote: 'Call first to confirm the needed service, current hours, and appointment arrangements.',
    sourceUrl: 'https://joburg.org.za/about_/regions/Pages/Region%20F%20-%20Inner%20City/REGION%20F%20Clinics/REGION-F-CLINICS.aspx',
    sourceCheckedAt: JOZI_DIRECTORY_SOURCE_CHECKED_AT,
    verificationMethod: PUBLIC_SOURCE,
    operationalStatus: 'public_contact_source_checked_live_availability_unconfirmed'
  },
  {
    id: 'yeoville-clinic',
    name: 'Yeoville Clinic',
    primaryCategories: ['healthcare'],
    navigationCategories: ['medication'],
    areas: ['yeoville', 'berea', 'hillbrow', 'inner city'],
    contactModes: ['phone', 'in_person'],
    routingMode: 'call_before_visit',
    addressRole: 'health_service_site',
    address: 'Corner Kenmere and Hopkins Streets, Yeoville, Johannesburg',
    phone: '011 648 8238',
    alternateContact: '011 648 7979 or 083 287 0770',
    hours: 'Monday to Friday, 7:30 AM to 4:00 PM',
    audiences: ['adult', 'family', 'child', 'older_person', 'person_with_disability', 'unknown'],
    simulationActions: ['appointment_request', 'clinician_handoff'],
    description: 'A City clinic serving Yeoville, Berea, and nearby areas.',
    availabilityNote: 'Call first to confirm the needed service, current hours, and appointment arrangements.',
    sourceUrl: 'https://joburg.org.za/about_/regions/Pages/Region%20F%20-%20Inner%20City/REGION%20F%20Clinics/REGION-F-CLINICS.aspx',
    sourceCheckedAt: JOZI_DIRECTORY_SOURCE_CHECKED_AT,
    verificationMethod: PUBLIC_SOURCE,
    operationalStatus: 'public_contact_source_checked_live_availability_unconfirmed'
  },
  sourced({
    id: 'zola-clinic',
    name: 'Zola Clinic',
    primaryCategories: ['healthcare'],
    navigationCategories: ['medication'],
    areas: ['soweto', 'zola', 'emdeni', 'jabulani'],
    contactModes: ['phone', 'in_person'],
    routingMode: 'source_listed_walk_in',
    addressRole: 'health_service_site',
    address: '75/1765 Buthelezi Street, Zola, Soweto',
    phone: '011 934 1000',
    hours: 'Monday to Friday, 7:30 AM to 4:00 PM',
    audiences: ['adult', 'family', 'child', 'older_person', 'person_with_disability', 'unknown'],
    simulationActions: ['appointment_request', 'clinician_handoff'],
    description: 'A City primary-care clinic serving Zola and nearby Soweto communities.',
    availabilityNote: 'Routine public clinic access is listed, but call to confirm the needed service, current hours, and queue.',
    sourceUrl: 'https://joburg.org.za/about_/regions/Pages/Region%20D%20-%20Greater%20Soweto/Clinics-in-Region-D.aspx',
    operationalStatus: 'public_site_and_hours_source_checked_live_queue_unconfirmed'
  }),
  sourced({
    id: 'chiawelo-clinic',
    name: 'Chiawelo Main Clinic',
    primaryCategories: ['healthcare'],
    navigationCategories: ['medication'],
    areas: ['soweto', 'chiawelo', 'klipspruit', 'pimville'],
    contactModes: ['phone', 'in_person'],
    routingMode: 'source_listed_walk_in',
    addressRole: 'health_service_site',
    address: '1743 Rihlamphu Street, off Old Potchefstroom Road, Chiawelo, Soweto',
    phone: '011 984 1599',
    hours: 'Monday to Thursday, 7:00 AM to 4:00 PM; Friday, 7:00 AM to 1:00 PM',
    audiences: ['adult', 'family', 'child', 'older_person', 'person_with_disability', 'unknown'],
    simulationActions: ['appointment_request', 'clinician_handoff'],
    description: 'A City primary-care clinic serving Chiawelo and nearby Soweto communities.',
    availabilityNote: 'Routine public clinic access is listed, but call to confirm the needed service, current hours, and queue.',
    sourceUrl: 'https://joburg.org.za/about_/regions/Pages/Region%20D%20-%20Greater%20Soweto/Clinics-in-Region-D.aspx',
    operationalStatus: 'public_site_and_hours_source_checked_live_queue_unconfirmed'
  }),
  sourced({
    id: 'itireleng-clinic',
    name: 'Itireleng Clinic',
    primaryCategories: ['healthcare'],
    navigationCategories: ['medication'],
    areas: ['soweto', 'dobsonville', 'roodepoort'],
    contactModes: ['phone', 'in_person'],
    routingMode: 'source_listed_walk_in',
    addressRole: 'health_service_site',
    address: '5 Roodepoort Road, Dobsonville, Soweto',
    phone: '011 988 3101',
    hours: 'Monday to Friday, 7:00 AM to 4:00 PM; Saturday, 7:00 AM to 12:00 PM',
    audiences: ['adult', 'family', 'child', 'older_person', 'person_with_disability', 'unknown'],
    simulationActions: ['appointment_request', 'clinician_handoff'],
    description: 'A City primary-care clinic serving Dobsonville and nearby Soweto communities.',
    availabilityNote: 'Routine public clinic access is listed, but call to confirm the needed service, current hours, and queue.',
    sourceUrl: 'https://joburg.org.za/about_/regions/Pages/Region%20D%20-%20Greater%20Soweto/Clinics-in-Region-D.aspx',
    operationalStatus: 'public_site_and_hours_source_checked_live_queue_unconfirmed'
  }),
  sourced({
    id: 'orlando-east-clinic',
    name: 'Orlando East Clinic',
    primaryCategories: ['healthcare'],
    navigationCategories: ['medication'],
    areas: ['orlando east'],
    contactModes: ['in_person'],
    routingMode: 'source_listed_walk_in',
    addressRole: 'health_service_site',
    address: '6516 Rathebe Street, Orlando East, Soweto',
    phone: '',
    hours: 'Monday to Friday, 8:00 AM to 4:30 PM',
    audiences: ['adult', 'family', 'child', 'older_person', 'person_with_disability', 'unknown'],
    simulationActions: ['appointment_request', 'clinician_handoff'],
    description: 'A City primary-care clinic listed for Orlando East.',
    availabilityNote: 'The City directory lists no clinic landline. Live opening and the needed service are not confirmed; use City General Services on 0860 562 874 to check before travelling.',
    sourceUrl: 'https://joburg.org.za/about_/regions/Pages/Region%20D%20-%20Greater%20Soweto/Clinics-in-Region-D.aspx',
    operationalStatus: 'public_site_and_hours_source_checked_no_landline_live_access_unconfirmed'
  }),
  sourced({
    id: 'meadowlands-zone-2-clinic',
    name: 'Meadowlands Zone 2 Clinic',
    primaryCategories: ['healthcare'],
    navigationCategories: ['medication'],
    areas: ['meadowlands', 'meadowlands zone 2'],
    contactModes: ['phone', 'in_person'],
    routingMode: 'source_listed_walk_in',
    addressRole: 'health_service_site',
    address: '293/8 Heckroodt Circle, Meadowlands, Soweto',
    phone: '011 936 4554',
    hours: 'Monday to Friday, 8:00 AM to 4:30 PM',
    audiences: ['adult', 'family', 'child', 'older_person', 'person_with_disability', 'unknown'],
    simulationActions: ['appointment_request', 'clinician_handoff'],
    description: 'A City primary-care clinic listed for Meadowlands and nearby communities.',
    availabilityNote: 'The public site and hours are source-listed, but live opening, the needed service, and the current queue are not confirmed. Call before travelling.',
    sourceUrl: 'https://joburg.org.za/about_/regions/Pages/Region%20D%20-%20Greater%20Soweto/Clinics-in-Region-D.aspx',
    operationalStatus: 'public_site_and_hours_source_checked_live_queue_unconfirmed'
  }),
  sourced({
    id: 'mofolo-south-clinic',
    name: 'Mofolo South Clinic',
    primaryCategories: ['healthcare'],
    navigationCategories: ['medication'],
    areas: ['mofolo', 'mofolo south'],
    contactModes: ['phone', 'in_person'],
    routingMode: 'source_listed_walk_in',
    addressRole: 'health_service_site',
    address: '739 Roodepoort Road, Mofolo South, Soweto',
    phone: '011 984 4050',
    hours: 'Monday to Friday, 7:30 AM to 4:00 PM',
    audiences: ['adult', 'family', 'child', 'older_person', 'person_with_disability', 'unknown'],
    simulationActions: ['appointment_request', 'clinician_handoff'],
    description: 'A City primary-care clinic listed for Mofolo South and nearby communities.',
    availabilityNote: 'The public site and hours are source-listed, but live opening, the needed service, and the current queue are not confirmed. Call before travelling.',
    sourceUrl: 'https://joburg.org.za/about_/regions/Pages/Region%20D%20-%20Greater%20Soweto/Clinics-in-Region-D.aspx',
    operationalStatus: 'public_site_and_hours_source_checked_live_queue_unconfirmed'
  }),
  sourced({
    id: 'tladi-clinic',
    name: 'Tladi Main Clinic',
    primaryCategories: ['healthcare'],
    navigationCategories: ['medication'],
    areas: ['tladi', 'moletsane'],
    contactModes: ['phone', 'in_person'],
    routingMode: 'source_listed_walk_in',
    addressRole: 'health_service_site',
    address: '144 Babinaphuthi Street, Tladi, Soweto',
    phone: '011 930 2111',
    hours: 'Monday to Friday, 7:30 AM to 4:00 PM',
    audiences: ['adult', 'family', 'child', 'older_person', 'person_with_disability', 'unknown'],
    simulationActions: ['appointment_request', 'clinician_handoff'],
    description: 'A City primary-care clinic listed for Tladi and nearby communities.',
    availabilityNote: 'The public site and hours are source-listed, but live opening, the needed service, and the current queue are not confirmed. Call before travelling.',
    sourceUrl: 'https://joburg.org.za/about_/regions/Pages/Region%20D%20-%20Greater%20Soweto/Clinics-in-Region-D.aspx',
    operationalStatus: 'public_site_and_hours_source_checked_live_queue_unconfirmed'
  }),
  sourced({
    id: 'jabavu-clinic',
    name: 'Jabavu Clinic',
    primaryCategories: ['healthcare'],
    navigationCategories: ['medication'],
    areas: ['jabavu', 'central western jabavu'],
    contactModes: ['phone', 'in_person'],
    routingMode: 'source_listed_walk_in',
    addressRole: 'health_service_site',
    address: '3123, corner Tumahole Street and Mauze Drive, Jabavu, Soweto',
    phone: '011 984 4014',
    hours: 'Monday to Friday, 7:30 AM to 4:00 PM',
    audiences: ['adult', 'family', 'child', 'older_person', 'person_with_disability', 'unknown'],
    simulationActions: ['appointment_request', 'clinician_handoff'],
    description: 'A City primary-care clinic listed for Jabavu and nearby communities.',
    availabilityNote: 'The public site and hours are source-listed, but live opening, the needed service, and the current queue are not confirmed. Call before travelling.',
    sourceUrl: 'https://joburg.org.za/about_/regions/Pages/Region%20D%20-%20Greater%20Soweto/Clinics-in-Region-D.aspx',
    operationalStatus: 'public_site_and_hours_source_checked_live_queue_unconfirmed'
  }),
  sourced({
    id: 'klipspruit-west-clinic',
    name: 'Klipspruit West Clinic',
    primaryCategories: ['healthcare'],
    navigationCategories: ['medication'],
    areas: ['klipspruit west'],
    contactModes: ['phone', 'in_person'],
    routingMode: 'source_listed_walk_in',
    addressRole: 'health_service_site',
    address: 'Corner Daisy and Calendula Streets, Klipspruit West, Soweto',
    phone: '011 947 1369',
    hours: 'Monday to Friday, 7:30 AM to 4:00 PM',
    audiences: ['adult', 'family', 'child', 'older_person', 'person_with_disability', 'unknown'],
    simulationActions: ['appointment_request', 'clinician_handoff'],
    description: 'A City primary-care clinic listed for Klipspruit West and nearby communities.',
    availabilityNote: 'The public site and hours are source-listed, but live opening, the needed service, and the current queue are not confirmed. Call before travelling.',
    sourceUrl: 'https://joburg.org.za/about_/regions/Pages/Region%20D%20-%20Greater%20Soweto/Clinics-in-Region-D.aspx',
    operationalStatus: 'public_site_and_hours_source_checked_live_queue_unconfirmed'
  }),
  sourced({
    id: 'chris-hani-baragwanath-hospital',
    name: 'Chris Hani Baragwanath Academic Hospital',
    primaryCategories: ['medical_emergency', 'hospital_care', 'mental_health_emergency'],
    navigationCategories: ['healthcare', 'mental_health'],
    areas: [
      'soweto', 'diepkloof', 'orlando', 'jabulani', 'kliptown', 'pimville', 'citywide',
      'chris hani baragwanath', 'chris hani baragwanath hospital', 'baragwanath', 'baragwanath hospital'
    ],
    contactModes: ['phone', 'in_person'],
    routingMode: 'source_listed_walk_in',
    addressRole: 'hospital_site',
    address: 'Old Potchefstroom Road, Diepkloof, Soweto',
    phone: '011 933 1090',
    alternateContact: 'Emergency and trauma contacts: A&E matron 078 122 6287; medical casualty 081 032 5629; psychiatry 081 032 5488',
    hours: 'Emergency services 24 hours; call for department access',
    audiences: ['adult', 'family', 'child', 'older_person', 'person_with_disability', 'unknown'],
    simulationActions: ['clinician_handoff'],
    description: 'A major public hospital with emergency, trauma, medical-casualty, and psychiatry routes.',
    availabilityNote: 'Use emergency services for unsafe transport or immediate danger. Department phone numbers do not confirm direct admission, a bed, or a clinician transfer.',
    sourceUrl: 'https://cmbinary.gauteng.gov.za/Media?Item=1859&Location=%2Fcphealth&Type=Documents&path=cphealth%2FDocuments%2FChris+Hani+Bara+Hospital+Alternative+Contact+Numbers+06+July+2025.pdf',
    operationalStatus: 'public_hospital_contacts_source_checked_live_capacity_unconfirmed'
  }),
  sourced({
    id: 'nthabiseng-thuthuzela-care-centre',
    name: 'Nthabiseng Thuthuzela Care Centre',
    primaryCategories: ['sexual_assault_care', 'gbv_healthcare', 'victim_friendly_healthcare'],
    navigationCategories: ['gbv_support', 'healthcare', 'legal_support'],
    areas: ['soweto', 'diepkloof', 'orlando', 'jabulani', 'kliptown', 'pimville', 'citywide'],
    contactModes: ['phone', 'in_person'],
    routingMode: 'source_listed_walk_in',
    addressRole: 'sensitive_health_service_site',
    addressSharing: 'after_safe_to_share',
    address: 'Chris Hani Baragwanath Academic Hospital, Old Potchefstroom Road, Diepkloof, Soweto',
    phone: '011 933 1206',
    hours: '24 hours',
    audiences: ['adult', 'family', 'child', 'unknown'],
    simulationActions: ['clinician_handoff', 'navigator_handoff'],
    description: 'Specialised medical, forensic, and support care after sexual assault or gender-based violence.',
    availabilityNote: 'First ask whether it is safe to speak and share a destination. Preserve the caller’s choice and privacy.',
    sourceUrl: 'https://cmbinary.gauteng.gov.za/Media?Item=1534&Location=%2Fcphealth&Type=Documents&path=cphealth%2FDocuments%2FGauteng+Department+of+Health+Clinical+Forensic+Medical+Services+Booklet_final.pdf',
    supportingSourceUrl: 'https://cmbinary.gauteng.gov.za/Media?Item=1753&Location=%2Fcphealth&Type=Documents&path=cphealth%2FDocuments%2FNews+Bulletin+-+15++December+2024.pdf',
    operationalStatus: 'public_specialist_site_and_hours_source_checked_live_queue_unconfirmed'
  }),
  sourced({
    id: 'powa-soweto',
    name: 'POWA Soweto',
    primaryCategories: ['gbv_support', 'abuse_support'],
    navigationCategories: ['emotional_support', 'legal_support'],
    areas: ['soweto', 'diepkloof', 'orlando', 'jabulani', 'kliptown', 'pimville'],
    contactModes: ['phone', 'in_person'],
    routingMode: 'call_before_visit',
    addressRole: 'sensitive_service_site',
    addressSharing: 'after_safe_to_share',
    address: 'Room 10, Nthabiseng Centre, Chris Hani Baragwanath Hospital, Diepkloof, Soweto',
    phone: '011 933 2333',
    alternateContact: '011 933 2310',
    hours: 'Confirm when calling',
    audiences: ['adult', 'family', 'unknown'],
    simulationActions: ['appointment_request', 'navigator_handoff'],
    description: 'Counselling and legal-support navigation for people affected by gender-based violence.',
    availabilityNote: 'Ask whether it is safe to speak or share the address. Call first; this is not a public shelter bed and no admission or appointment is guaranteed.',
    sourceUrl: 'https://www.powa.co.za/contact/',
    operationalStatus: 'public_contact_source_checked_live_availability_unconfirmed'
  }),
  sourced({
    id: 'childline-pfunanani-soweto',
    name: 'Childline Gauteng Pfunanani Centre',
    primaryCategories: ['child_safety', 'family_support'],
    navigationCategories: ['emotional_support', 'abuse_support', 'social_support'],
    areas: ['soweto', 'diepkloof', 'orlando', 'jabulani', 'kliptown', 'pimville'],
    contactModes: ['phone', 'in_person'],
    routingMode: 'call_before_visit',
    addressRole: 'child_support_site',
    address: 'Chris Hani Baragwanath Hospital, Old Potchefstroom Road, Diepkloof, Soweto',
    phone: '011 938 8745',
    alternateContact: '083 558 0681; free 24-hour helpline 116',
    hours: 'Call the centre to confirm; helpline 116 is 24 hours',
    audiences: ['child', 'family'],
    simulationActions: ['navigator_handoff'],
    description: 'A child-protection and support centre, with the national Childline helpline for immediate counselling and referral.',
    availabilityNote: 'Call first for physical-centre access. It does not guarantee emergency removal or accommodation; use emergency services for immediate danger.',
    sourceUrl: 'https://childlinegauteng.co.za/contact-us/',
    operationalStatus: 'public_contact_source_checked_live_availability_unconfirmed'
  }),
  sourced({
    id: 'johannesburg-child-welfare',
    name: 'Johannesburg Child Welfare',
    primaryCategories: ['child_safety', 'family_support'],
    navigationCategories: ['social_support', 'abuse_support'],
    areas: ['ferreirasdorp', 'johannesburg cbd', 'inner city', 'citywide'],
    contactModes: ['phone', 'in_person'],
    routingMode: 'call_before_visit',
    addressRole: 'child_support_site',
    address: '41 Fox Street, Ferreirasdorp, Johannesburg',
    phone: '011 298 8500',
    hours: 'Call to confirm intake hours',
    audiences: ['child', 'family'],
    simulationActions: ['navigator_handoff', 'appointment_request'],
    description: 'A child-protection and family social-work route in central Johannesburg.',
    availabilityNote: 'Call first to confirm intake. Do not promise accommodation or a particular statutory intervention; use emergency services for immediate danger.',
    sourceUrl: 'https://jhbchildwelfare.org.za/get-in-touch/',
    operationalStatus: 'public_contact_source_checked_live_availability_unconfirmed'
  }),
  sourced({
    id: 'national-substance-use-line',
    name: 'National Substance Use Helpline',
    primaryCategories: ['substance_use_support'],
    navigationCategories: ['family_support'],
    areas: ['johannesburg', 'citywide', 'gauteng', 'south africa'],
    contactModes: ['phone'],
    routingMode: 'phone_only',
    addressRole: 'none',
    address: '',
    phone: '0800 12 13 14',
    alternateContact: 'SMS 32312',
    hours: '24 hours',
    audiences: ['adult', 'family', 'child', 'unknown'],
    simulationActions: ['warm_handoff', 'assessment_request'],
    description: 'A national counselling and referral line for alcohol and drug concerns.',
    availabilityNote: 'The line does not guarantee treatment admission. An assessment and provider confirmation are still required.',
    sourceUrl: 'https://knowledgehub.health.gov.za/system/files/elibdownloads/2026-05/Treatment%20Literacy%20Toolkit%20Final_May%202026%20Print.pdf',
    operationalStatus: 'public_contact_source_checked_live_queue_unconfirmed'
  }),
  sourced({
    id: 'soweto-labour-centre',
    name: 'Soweto Labour Centre',
    primaryCategories: ['employment'],
    navigationCategories: ['skills_support', 'uif_support'],
    areas: ['soweto', 'orlando west', 'orlando', 'rockville', 'pimville', 'kliptown'],
    contactModes: ['phone', 'in_person'],
    routingMode: 'source_listed_walk_in',
    addressRole: 'public_service_office',
    address: '2 Khumalo Road, A Centre, Orlando West, Soweto',
    phone: '010 061 3060',
    hours: 'Monday to Friday, 7:30 AM to 4:00 PM',
    audiences: ['adult', 'unknown'],
    simulationActions: ['appointment_request', 'navigator_handoff'],
    allowNavigationMatch: true,
    description: 'Official work-seeker, labour, and UIF navigation in Soweto.',
    availabilityNote: 'Public counter details are listed, but call to confirm the needed service and documents. It cannot guarantee a job or benefit.',
    sourceUrl: 'https://www.labour.gov.za/Contacts/Labour-centres/Pages/default.aspx',
    operationalStatus: 'public_site_and_hours_source_checked_live_queue_unconfirmed'
  }),
  sourced({
    id: 'legal-aid-soweto',
    name: 'Legal Aid South Africa Soweto Local Office',
    primaryCategories: ['legal_support'],
    navigationCategories: ['documentation', 'family_support'],
    areas: ['soweto', 'klipspruit', 'diepkloof', 'orlando', 'jabulani', 'pimville'],
    contactModes: ['phone', 'in_person'],
    routingMode: 'call_before_visit',
    addressRole: 'public_service_office',
    address: 'Maponya Mall, Offices 403 and 411A, Chris Hani Road, Klipspruit, Soweto',
    phone: '011 938 3547',
    hours: 'Call to confirm',
    audiences: ['adult', 'family', 'unknown'],
    simulationActions: ['appointment_request', 'navigator_handoff'],
    description: 'Legal Aid South Africa’s Soweto office for qualifying legal matters.',
    availabilityNote: 'Call before travelling to confirm the current suite, whether the matter qualifies, documents, and intake arrangements.',
    sourceUrl: 'https://legal-aid.co.za/gauteng/',
    operationalStatus: 'public_contact_confirmed_exact_suite_requires_confirmation'
  }),
  sourced({
    id: 'seri-braamfontein',
    name: 'Socio-Economic Rights Institute of South Africa',
    primaryCategories: ['housing_rights', 'eviction_support'],
    navigationCategories: ['legal_support'],
    areas: ['braamfontein', 'johannesburg cbd', 'inner city', 'citywide'],
    contactModes: ['phone', 'in_person'],
    routingMode: 'call_before_visit',
    addressRole: 'legal_service_office',
    address: '6th Floor, Aspern House, 54 De Korte Street, Braamfontein, Johannesburg',
    phone: '011 356 5860',
    hours: 'Potential new clients Monday to Friday, 9:00 AM to 1:00 PM',
    audiences: ['adult', 'family', 'unknown'],
    simulationActions: ['appointment_request', 'navigator_handoff'],
    description: 'Specialist support for housing, eviction, and socio-economic-rights matters.',
    availabilityNote: 'Call first to confirm that the matter fits SERI’s work and what intake information is needed. This is not general legal intake.',
    sourceUrl: 'https://www.seri-sa.org/index.php/component/contact/contact/1-socio-economic-rights-institute-of-south-africa',
    operationalStatus: 'public_contact_and_intake_hours_source_checked_live_capacity_unconfirmed'
  }),
  sourced({
    id: 'zlto-public-rewards',
    name: 'Zlto Rewards',
    primaryCategories: ['zlto_rewards'],
    navigationCategories: ['skills_support', 'employment'],
    areas: ['johannesburg', 'soweto', 'south africa', 'online'],
    contactModes: ['online'],
    routingMode: 'digital_only',
    addressRole: 'online_service',
    address: '',
    website: 'https://zlto.mobi/',
    hours: 'Online access 24 hours; task review, partner support, and reward processing times vary',
    audiences: ['adult', 'child', 'unknown'],
    simulationActions: ['reward_signup'],
    description: 'A data-free-capable digital wallet where eligible members can complete verified learning, surveys, microtasks, or community activities and use earned rewards in the marketplace.',
    availabilityNote: 'Public signup is for people aged 16 and older and requires the person’s own email address, cell number, and valid ID or passport. Never ask for an ID number, password, or one-time PIN on this call. Tasks, verification, selection, and reward values vary.',
    sourceUrl: 'https://www.zlto.co/services',
    supportingSourceUrl: 'https://zlto.mobi/',
    operationalStatus: 'public_digital_platform_source_checked_live_tasks_and_rewards_unconfirmed'
  }),
  sourced({
    id: 'michange-zlto-mes-pathway',
    name: 'Mi-Change and Zlto partner pathway',
    primaryCategories: ['michange_voucher'],
    navigationCategories: ['food', 'hygiene', 'clothing', 'shelter_navigation'],
    areas: ['johannesburg', 'inner city', 'hillbrow', 'citywide'],
    contactModes: ['phone'],
    routingMode: 'phone_only',
    addressRole: 'partner_navigation_only',
    address: '',
    phone: '011 725 6531',
    hours: 'Call MES to ask about the current partner pathway',
    audiences: ['adult', 'family', 'unknown'],
    simulationActions: ['voucher_pathway'],
    description: 'Jozi My Jozi says Mi-Change digital vouchers are powered by Zlto and distributed through partners such as MES and U-Turn to enable essential services. MES is the source-checked first contact used for this Johannesburg pathway.',
    availabilityNote: 'Partner participation, eligibility, voucher allocation, redemption points, and essential services depend on the current programme and provider availability. Food, shelter, and care must never be conditional on earning a reward.',
    sourceUrl: 'https://www.jozimyjozi.com/events/walk-the-talk',
    supportingSourceUrl: 'https://www.zlto.co/services',
    operationalStatus: 'public_partnership_source_checked_live_enrolment_and_vouchers_unconfirmed'
  }),
  {
    id: 'joburg-emergency-connect',
    name: 'City of Johannesburg Emergency Connect',
    primaryCategories: ['medical_emergency', 'fire_emergency'],
    navigationCategories: ['immediate_danger'],
    areas: ['johannesburg', 'citywide'],
    contactModes: ['phone'],
    routingMode: 'emergency_phone',
    addressRole: 'none',
    address: '',
    phone: '011 375 5911',
    hours: '24 hours',
    audiences: ['adult', 'family', 'child', 'older_person', 'person_with_disability', 'unknown'],
    simulationActions: [],
    description: 'City emergency routing for life-threatening ambulance, fire, and JMPD needs.',
    availabilityNote: 'Tell the operator the nearest landmark, what happened, and a callback number, then stay on the line.',
    sourceUrl: 'https://joburg.org.za/about_/Pages/About%20the%20City/Emergency-Connect.aspx',
    sourceCheckedAt: JOZI_DIRECTORY_SOURCE_CHECKED_AT,
    verificationMethod: PUBLIC_SOURCE,
    operationalStatus: 'public_emergency_contact_confirmed'
  },
  {
    id: 'mobile-emergency-112',
    name: 'South Africa Mobile Emergency Number',
    primaryCategories: ['medical_emergency', 'immediate_danger', 'fire_emergency'],
    navigationCategories: [],
    areas: ['johannesburg', 'citywide', 'gauteng', 'south africa'],
    contactModes: ['phone'],
    routingMode: 'emergency_phone',
    addressRole: 'none',
    address: '',
    phone: '112',
    hours: '24 hours',
    audiences: ['adult', 'family', 'child', 'older_person', 'person_with_disability', 'unknown'],
    simulationActions: [],
    description: 'Emergency routing from a mobile phone in South Africa.',
    availabilityNote: 'Tell the operator the nearest landmark, what happened, and a callback number, then stay on the line.',
    sourceUrl: 'https://www.saps.gov.za/alert/safety_tips_tourist.php',
    sourceCheckedAt: JOZI_DIRECTORY_SOURCE_CHECKED_AT,
    verificationMethod: PUBLIC_SOURCE,
    operationalStatus: 'public_emergency_contact_confirmed'
  },
  {
    id: 'saps-10111',
    name: 'South African Police Service Emergency Centre',
    primaryCategories: ['violence_emergency', 'crime_emergency'],
    navigationCategories: ['immediate_danger', 'child_safety'],
    areas: ['johannesburg', 'citywide', 'gauteng', 'south africa'],
    contactModes: ['phone'],
    routingMode: 'emergency_phone',
    addressRole: 'none',
    address: '',
    phone: '10111',
    hours: '24 hours',
    audiences: ['adult', 'family', 'child', 'older_person', 'person_with_disability', 'unknown'],
    simulationActions: [],
    description: 'Police emergency routing for a crime or immediate threat.',
    availabilityNote: 'Use for an immediate threat or crime, not simply because someone is experiencing homelessness. Share the nearest landmark and stay on the line.',
    sourceUrl: 'https://www.saps.gov.za/services/cc_10111.php',
    sourceCheckedAt: JOZI_DIRECTORY_SOURCE_CHECKED_AT,
    verificationMethod: PUBLIC_SOURCE,
    operationalStatus: 'public_emergency_contact_confirmed'
  }
];

export const JOZI_EXCLUDED_DESTINATIONS = [
  {
    name: 'City shelter at 3 Kotze Street',
    reason: 'City records describe Region F shelter closures for maintenance; no later primary reopening confirmation was found.',
    sourceUrl: 'https://joburg.org.za/about_/government/Documents/Council-Meetings/2024-Signed-Council-Minutes/29-FEBRUARY-2024-18TH-ORD.pdf'
  },
  {
    name: 'Windsor West shelter at 23 Knight Street',
    reason: 'City records describe a temporary closure; no later primary reopening confirmation was found.',
    sourceUrl: 'https://joburg.org.za/about_/government/Documents/Council-Meetings/2024-Signed-Council-Minutes/29-FEBRUARY-2024-18TH-ORD.pdf'
  },
  {
    name: 'Devland or Sodiak Circle shelter',
    reason: 'The City described it as under construction; no primary opening confirmation was found.',
    sourceUrl: 'https://joburg.org.za/media_/Newsroom/Pages/2024%20News%20Article/December/Building-hope-from-ground-up-Shelter-hits-50-completion-milestone.aspx'
  },
  {
    name: 'Othandweni drop-in centre',
    reason: 'Jozi My Jozi describes it as being developed with MES, not as an open public intake site.',
    sourceUrl: 'https://www.jozimyjozi.com/projects/drop-in-centres'
  },
  {
    name: 'MES Linatex and Othandweni direct shelter doors',
    reason: 'Linatex is not named in the current 2025 Johannesburg programme list, and Jozi My Jozi describes Othandweni as being developed. Use the current MES Johannesburg number and Assessment Centre pathway instead.',
    sourceUrl: 'https://mes.org.za/wp-content/uploads/2025/04/MES-Johannesburg-Needs-List-2025.pdf'
  },
  {
    name: 'Esselen Street Clinic',
    reason: 'The current City Region F clinic page marks it temporarily closed for upgrading.',
    sourceUrl: 'https://joburg.org.za/about_/regions/Pages/Region%20F%20-%20Inner%20City/REGION%20F%20Clinics/REGION-F-CLINICS.aspx'
  },
  {
    name: 'Joubert Park Clinic',
    reason: 'Current public sources conflict on operational status. It is suppressed until the City confirms it is open.',
    sourceUrl: 'https://joburg.org.za/media_/Newsroom/Pages/2025-News-Articles/City-calls-for-collective-action-to-protect-public-infrastructure.aspx'
  },
  {
    name: 'SASSA Gauteng regional office at 222 Smit Street',
    reason: 'It is an administrative regional address, not a verified public grant counter. Use the SASSA enquiry line first.',
    sourceUrl: 'https://www.gov.za/about-government/contact-directory/soe/south-african-social-security-agency-sassa'
  },
  {
    name: 'Wembley shelter direct walk-in',
    reason: 'City records describe referrals there, but no current public intake contact or hours were verified. Use City Social Development assessment and referral.',
    sourceUrl: 'https://joburg.org.za/documents_/Documents/HOMELESSNESS-FINAL-APPROVED-POLICY-2024.pdf'
  },
  {
    name: 'Atlehang Jozi Opportunity Centre address',
    reason: 'The current directory and a City relocation announcement conflict, so neither address is spoken as confirmed.',
    sourceUrl: 'https://joburg.org.za/media_/Newsroom/Pages/2025-News-Articles/City-commits-to-empowering-the-youth-with-opportunities.aspx'
  },
  {
    name: 'Protea North Library',
    reason: 'The official Region D directory marks the library closed.',
    sourceUrl: 'https://joburg.org.za/departments_/Documents/Community%20Development/2024.08_WEBSITE_CONTACT_LIST_REGION_D.pdf'
  },
  {
    name: 'Home Affairs Harrison Street walk-in claims',
    reason: 'Current public address, hours, and service scope were not verified. Use the Home Affairs contact centre or the source-checked Soweto office route.',
    sourceUrl: 'https://ehome.dha.gov.za/eHomeAffairsV3/Home/Contact'
  },
  {
    name: 'Ikhaya Lethemba direct address',
    reason: 'Secure-shelter access should be routed through the GBV Command Centre, POWA, or a Thuthuzela Care Centre rather than exposing an old public address.',
    sourceUrl: 'https://www.gov.za/about-government/government-call-centres-and-help-lines'
  }
];

const SUPPORT_CATEGORY_ALIASES = {
  shelter: 'shelter_navigation',
  overnight_shelter: 'shelter_navigation',
  housing: 'shelter_navigation',
  homelessness: 'shelter_navigation',
  homeless_support: 'shelter_navigation',
  somewhere_safe: 'safe_space_navigation',
  safe_site: 'safe_space_navigation',
  safe_sites: 'safe_space_navigation',
  safe_place: 'safe_space_navigation',
  safe_places: 'safe_space_navigation',
  safe_space: 'safe_space_navigation',
  safe_tonight: 'safe_space_navigation',
  somewhere_safe_tonight: 'safe_space_navigation',
  shelter_and_food: ['shelter_navigation', 'food'],
  safe_community_space: 'daytime_community_space',
  community_space: 'daytime_community_space',
  daytime_space: 'daytime_community_space',
  daytime_community_service: 'daytime_community_space',
  daytime_community_support: 'daytime_community_space',
  community_centre: 'daytime_community_space',
  community_center: 'daytime_community_space',
  recreation_centre: 'daytime_community_space',
  recreation_center: 'daytime_community_space',
  drop_in_centre: 'daytime_community_space',
  drop_in_center: 'daytime_community_space',
  public_space: 'daytime_community_space',
  public_space_during_the_day: 'daytime_community_space',
  somewhere_public_to_sit: 'daytime_community_space',
  safe_during_the_day: 'daytime_community_space',
  safe_in_the_day: 'daytime_community_space',
  library: 'daytime_community_space',
  community_support: 'social_support',
  counselling: 'emotional_support',
  someone_to_talk_to: 'mental_health',
  mental_wellbeing: 'mental_health',
  mental_wellness: 'mental_health',
  crisis_support: 'mental_health_crisis',
  mental_health_support: 'mental_health',
  substance_use: 'substance_use_support',
  addiction_support: 'substance_use_support',
  social_grant: 'grants',
  food_support: 'food',
  food_and_hygiene: ['food', 'hygiene'],
  basic_needs: ['food', 'hygiene', 'clothing'],
  work: 'employment',
  job_support: 'employment',
  jobs_and_skills: ['employment', 'skills_support'],
  zlto: 'zlto_rewards',
  zlto_reward: 'zlto_rewards',
  zlto_rewards: 'zlto_rewards',
  rewards: 'zlto_rewards',
  earn_rewards: 'zlto_rewards',
  learn_to_earn: 'zlto_rewards',
  michange: 'michange_voucher',
  mi_change: 'michange_voucher',
  michange_voucher: 'michange_voucher',
  voucher_support: 'michange_voucher',
  responsible_giving: 'michange_voucher',
  id_help: 'documentation',
  identity_document: 'identity_documents',
  health: 'healthcare',
  clinic: 'healthcare',
  need_a_clinic: 'healthcare',
  see_a_doctor: 'healthcare',
  medical_care: 'healthcare',
  health_support: 'healthcare',
  feel_sick: 'healthcare',
  feeling_sick: 'healthcare',
  sick: 'healthcare',
  doctor: 'healthcare',
  coughing: 'healthcare',
  cough: 'healthcare',
  mes: 'mes_services',
  mes_service: 'mes_services',
  mes_services: 'mes_services',
  mes_locations: 'mes_services',
  gbv: 'gbv_support',
  domestic_violence: 'gbv_support',
  child_support: 'child_safety',
  women_and_children: 'women_children_shelter',
  grants_and_relief: ['grants', 'social_relief'],
  legal: 'legal_support',
  eviction: 'eviction_support'
};

export const JOZI_SUPPORT_CATEGORIES = [
  'mes_services',
  'shelter_navigation',
  'safe_space_navigation',
  'daytime_community_space',
  'social_support',
  'women_children_shelter',
  'food',
  'hygiene',
  'clothing',
  'mental_health',
  'emotional_support',
  'mental_health_crisis',
  'mental_health_emergency',
  'suicide_support',
  'bereavement_support',
  'child_safety',
  'family_support',
  'youth_support',
  'gbv_support',
  'gbv_healthcare',
  'abuse_support',
  'safety_support',
  'sexual_assault_care',
  'victim_friendly_healthcare',
  'healthcare',
  'medical_emergency',
  'hospital_care',
  'immediate_danger',
  'violence_emergency',
  'crime_emergency',
  'fire_emergency',
  'medication',
  'substance_use_support',
  'grants',
  'social_relief',
  'documentation',
  'identity_documents',
  'employment',
  'skills_support',
  'zlto_rewards',
  'michange_voucher',
  'uif_support',
  'financial_support',
  'legal_support',
  'housing_rights',
  'eviction_support',
  'older_person_support',
  'migrant_support',
  'homelessness_network',
  'information_access',
  'city_service_navigation'
];

const IMMEDIATE_SAFETY_CONTEXTS = new Set([
  'immediate_danger',
  'medical_emergency',
  'violence_now',
  'gbv_immediate',
  'self_harm_imminent',
  'suicide_imminent',
  'overdose',
  'fire_emergency'
]);

const URGENT_NEED_CONTEXT = {
  immediate_danger: 'immediate_danger',
  medical_emergency: 'medical_emergency',
  mental_health_emergency: 'medical_emergency',
  violence_now: 'violence_now',
  violence_emergency: 'violence_now',
  crime_emergency: 'violence_now',
  gbv_immediate: 'gbv_immediate',
  self_harm_imminent: 'self_harm_imminent',
  suicide_imminent: 'suicide_imminent',
  overdose: 'overdose',
  fire_emergency: 'fire_emergency'
};

export const JOZI_SUPPORT_INSTRUCTIONS = `
You are the Jozi My Jozi support line: a calm, caring, voice-first doorway to verified Johannesburg health and community support.

You can help with mental wellbeing, social support, shelter and safe-space navigation, food and hygiene navigation, clinics, substance-use support, grants, documents, work support, Zlto rewards and Mi-Change partner pathways, legal help, family and child safety, GBV support, and emergencies.

SAFETY AND DIGNITY
- Say "people experiencing homelessness" or "people with low or no income". Never call a caller low-LSM or assume they are homeless.
- Start by asking what would help most. Do not open with limitations, disclaimers, a service list, or what the line cannot do.
- Sound like a caring human being, not an information line. Briefly acknowledge what the caller said, name the immediate priority, take one step, and pause.
- Use natural spoken English, contractions, and short sentences. Avoid internal words such as "route", "directory", "source-checked", "warm handoff", "voice response", and "navigation fallback" when speaking to the caller.
- Ask only one short question at a time. Never ask a question and then continue into a list of organisations or instructions.
- When the caller has several needs, acknowledge all of them but handle the most urgent practical need first. Say which need you will return to next rather than giving everything at once.
- Use judgement rather than a generic checklist. Ask a safety question only when the caller's need could involve immediate danger, an overnight safety need, a medical red flag, self-harm, violence, or abuse.
- For immediate danger, medical emergency, imminent self-harm, overdose, or violence now, use the emergency tool immediately. Ask for a suburb or nearest landmark, not an exact sleeping location.
- For GBV, first ask whether it is safe to speak and pass that answer to find_support_services. Do not promise police involvement, text the caller, or disclose their location without consent.
- A child or family must never be routed to an adult shelter pathway.
- Do not ask for immigration status, income bracket, or ID unless that detail is strictly necessary for the caller's chosen service.
- For Zlto, never ask the caller to say an ID or passport number, password, or one-time PIN. Explain what real signup needs, then let the caller enter it privately outside the call.
- Never make food, shelter, healthcare, or safety support conditional on completing a task or earning a reward.

VOICE DELIVERY
- Use a warm, caring South African English cadence and familiar local pronunciation without exaggerating or caricaturing an accent.
- Speak a little more slowly than ordinary conversation. Read phone numbers in short groups, pause, and offer to repeat them.
- Match the caller's language when you can do so confidently, while keeping the same gentle, respectful tone.

UNDERSTANDING NATURAL CONVERSATION
- You own the conversation and the interpretation. Understand ordinary speech; never ask the caller to choose a service category or repeat a fact they already gave you.
- Carry forward every need, symptom, timing detail, audience detail, suburb, and landmark the caller has already stated anywhere in the call. After a safety follow-up, reuse the earlier facts when you call a tool.
- Translate natural language into the tool categories yourself. Examples: coughing, feeling sick, needing a doctor, or asking for a clinic means healthcare; somewhere public to sit, a community centre, a library, or somewhere less isolated during the day means daytime_community_space; somewhere safe tonight plus something to eat means safe_space_navigation or shelter_navigation AND food.
- Preserve multiple needs separately. Do not collapse shelter plus food into generic social_support, and do not replace a specific landmark with broad "Johannesburg".
- Prefer the most specific caller-stated landmark or neighbourhood from the full conversation. Never send placeholder locations such as "unknown", "not provided", or "N/A". Omit a missing location instead.
- Never invent whether the caller is an adult alone, an adult with children, or under 18. Ask only when that distinction changes a shelter or safety pathway.
- If enough context is already present, act on it without another location question. If a physical destination genuinely cannot be chosen safely, ask one natural follow-up and retain all other context for the next tool call.

HEALTH ROUTING
- Interpret symptoms intelligently, give brief evidence-based conversational support, and use find_support_services when a Johannesburg clinic, hospital, medicine service, or other physical health destination is needed.
- Many callers may be sleeping rough, staying in a shelter, sharing a crowded room, or living without reliable water, electricity, data, transport, food storage, or money. Never assume a private home, bed, bathroom, hot water, quiet room, fridge, or ability to buy something. Do not assume that an individual caller is homeless; ask one neutral practical question when the answer changes what is useful.
- If someone says they cannot sleep, first ask, "Do you have somewhere reasonably safe and sheltered to rest tonight?" If not, check immediate danger and help with a safe-space or shelter pathway. If yes, continue health support one question at a time and tailor any advice to what they actually have. Never suggest a hot shower or bath unless the caller has said that is available and practical.
- Before routine clinic routing, ask one complaint-specific red-flag question when needed. For a cough, check severe breathlessness, chest pain, coughing blood, or confusion in one short question. If a red flag is present, use handle_emergency immediately; otherwise look up healthcare using the caller's remembered area or landmark.
- "Now" can describe when symptoms are happening; it does not mean the caller asked for a doctor connection. If you speak a verified non-emergency phone number, offer the demo phone connection. Otherwise offer a demo appointment by default, while honoring an explicit request to book or speak to a doctor.
- Never name a clinic, hospital, phone number, address, or hours from memory. The verified tool result supplies those facts.

ROUTING
- Use find_support_services for all community-support destinations. Never invent a provider, phone number, address, hours, bed, meal, or eligibility rule.
- For an eligible adult in Hillbrow or the inner city who needs shelter, somewhere safer, food, hygiene, documents, or practical homelessness support, start with MES Johannesburg. MES is Jozi My Jozi's partner pathway. Use City social services only when no suitable partner or specialist option matches, MES is outside the caller's area or audience, or the caller asks for the City.
- If the caller asks what MES offers, use mes_services with mes_programme=overview. If they name Assessment Centre, Ekhaya, Ekuthuleni, Impilo, or GROW, pass that exact mes_programme and explain it one programme at a time. MES also includes youth and family support, food and social relief. Use the current MES branch number to confirm the right entrance and availability.
- Treat an unqualified request for a "safe site", "safe place", or their plurals as ambiguous. Ask once, in plain language: "Do you need somewhere for tonight, a public place during the day, or urgent help because you're in danger now?" Then wait and carry the caller's earlier location into the next lookup. Tonight means safe_space_navigation, daytime means daytime_community_space, and danger now means handle_emergency. Never repeat the same clarification after the caller answers.
- Recommend one best next step at a time. Give a second option only after the first is declined, unavailable, or completed, unless two distinct urgent needs must be addressed immediately.
- Use progressive disclosure: first say the organisation and why it fits; then ask permission to check, book, or connect in the demo. If you speak a non-emergency phone number, offer to connect the caller now in the demo. Give directions or hours only when they are the next useful detail or the caller asks.
- Say only the uncertainty that changes the next action, and say it once. Do not stack a description, phone number, address, hours, and every caveat into one turn.
- The City policy requires social-worker assessment and referral for City-managed or contracted shelter placement. Do not assess eligibility, book a real bed, or promise availability.
- If the verified directory has no suitable local option, ask one useful clarifying question or offer the closest relevant partner or specialist phone route. Offer City navigation only as a last resort. Do not substitute a distant physical destination.

DEMO COORDINATION
- coordinate_support_demo is a presentation-only simulation. Use it only after the caller chooses a returned resource.
- Do not announce the simulation rules at the start of the call or before offering help.
- When the caller agrees, call coordinate_support_demo immediately. Lead with the positive demo screen state, such as "All set—the demo now shows your appointment booked" or "The demo connection screen is ready."
- In the same short turn, say that the demonstration is not connected to the external organisation, so no real booking, reservation, check, or transfer occurred.
- Never omit the word "demo" from the simulated outcome and never present it as a live external action.
- After the demo action, return conversationally to any need that is still waiting instead of reading a recap.

PRIVACY
- Do not offer SMS or WhatsApp. The Jozi demo is voice-only.
- Do not mention prior-call history. Do not repeat sensitive housing, mental-health, GBV, child-safety, substance-use, immigration, or exact-location details in a closing summary.
- If the caller has little airtime, data, or battery, give the most important phone number first and offer to repeat it slowly.
`.trim();

export function normalizeServiceMode(value) {
  const mode = String(value || 'health').trim().toLowerCase();
  return ['health', 'jozi', 'combined'].includes(mode) ? mode : 'health';
}

export function modeIncludesJozi(mode) {
  const normalized = normalizeServiceMode(mode);
  return normalized === 'jozi' || normalized === 'combined';
}

export function modeIncludesHealth(mode) {
  const normalized = normalizeServiceMode(mode);
  return normalized === 'health' || normalized === 'combined';
}

export function serviceModePolicy(mode) {
  const normalized = normalizeServiceMode(mode);
  const includesJozi = modeIncludesJozi(normalized);
  return {
    mode: normalized,
    includesHealth: modeIncludesHealth(normalized),
    includesJozi,
    callerMemory: !includesJozi,
    automaticFollowup: !includesJozi,
    persistRawTranscript: !includesJozi
  };
}

export function buildServiceGreeting(mode, demoEnabled = false) {
  const normalized = normalizeServiceMode(mode);
  if (normalized === 'health') {
    return "Hello, thank you for calling. This is your health advisor. I'm here to help. What health concern can we talk through today?";
  }
  const demoLabel = demoEnabled ? ' demo' : '';
  if (normalized === 'jozi') {
    return `Hello, you've reached the Jozi My Jozi support${demoLabel} line. I'm here to help. What would help most right now?`;
  }
  return `Hello, you've reached the Jozi My Jozi health and support${demoLabel} line. I'm here to help. What would help most right now?`;
}

export function normalizeSupportCategory(value) {
  const normalized = normalizeSearchText(value || '');
  const underscored = normalized.replace(/\s+/g, '_');
  const mapped = SUPPORT_CATEGORY_ALIASES[underscored];
  return Array.isArray(mapped) ? mapped[0] : (mapped || underscored);
}

export function validateJoziResources(resources = JOZI_SUPPORT_RESOURCES, now = new Date()) {
  const ids = new Set();
  const errors = [];
  const allowedRoutingModes = new Set(['phone_only', 'call_before_visit', 'source_listed_walk_in', 'emergency_phone', 'navigation_only', 'digital_only']);
  const today = new Date(now);

  for (const [index, resource] of resources.entries()) {
    const label = resource?.id || index;
    if (!resource?.id) errors.push(`Resource ${index} is missing id.`);
    if (ids.has(resource?.id)) errors.push(`Duplicate resource id: ${resource.id}`);
    ids.add(resource?.id);
    if (!resource?.name) errors.push(`Resource ${label} is missing name.`);
    if (!Array.isArray(resource?.primaryCategories) || !resource.primaryCategories.length) errors.push(`Resource ${label} has no primary categories.`);
    if (!Array.isArray(resource?.contactModes) || !resource.contactModes.length) errors.push(`Resource ${label} has no contact modes.`);
    if (!allowedRoutingModes.has(resource?.routingMode)) errors.push(`Resource ${label} has an invalid routing mode.`);
    if (resource?.contactModes?.includes('phone') && !resource?.phone) errors.push(`Resource ${label} requires a phone number.`);
    if (resource?.contactModes?.includes('in_person') && !resource?.address) errors.push(`Resource ${label} requires an address.`);
    if (resource?.contactModes?.includes('online') && !resource?.website) errors.push(`Resource ${label} requires a website.`);
    if (!resource?.sourceUrl || !resource?.sourceCheckedAt || !resource?.verificationMethod) errors.push(`Resource ${label} lacks source metadata.`);
    if (resource?.sourceCheckedAt && new Date(`${resource.sourceCheckedAt}T00:00:00Z`) > today) errors.push(`Resource ${label} has a future source-check date.`);
    if (!resource?.availabilityNote || resource.availabilityNote.length < 20) {
      errors.push(`Resource ${label} lacks a clear availability or safety caveat.`);
    }
  }
  return { valid: errors.length === 0, errors };
}

export function resolveJoziSupport(args = {}, resources = JOZI_SUPPORT_RESOURCES) {
  let needs = normalizeNeeds(args);
  const rawSafeSiteRequest = hasAmbiguousSafeSiteRequest(args);
  const demoEnabled = args.demo_enabled === true;
  const locationInput = selectCallerStatedLocation(args);
  let location = normalizeJoziLocation(locationInput);
  if (needs.includes('daytime_community_space') && location === 'orlando') location = 'orlando east';
  const audience = normalizeAudience(args.audience || args.caller_type);
  const contactMode = normalizeContactMode(args.contact_mode || args.contactMode);
  let timing = normalizeTiming(args.timing || args.needed_when || args.urgency);
  const safeSiteType = normalizeSafeSiteType(args.safe_site_type || args.safeSiteType) ||
    (rawSafeSiteRequest && timing === 'tonight' ? 'tonight' : '');
  if (safeSiteType === 'tonight') timing = 'tonight';
  if (safeSiteType === 'daytime' && timing === 'tonight') timing = 'today';
  const hasCanonicalSafeSiteNeed = needs.some((need) => ['safe_space_navigation', 'daytime_community_space'].includes(need));
  if ((rawSafeSiteRequest || hasCanonicalSafeSiteNeed) && ['tonight', 'daytime'].includes(safeSiteType)) {
    const interpretedNeed = safeSiteType === 'daytime' ? 'daytime_community_space' : 'safe_space_navigation';
    needs = [...new Set([
      ...needs.filter((need) =>
        !['safe_space_navigation', 'daytime_community_space'].includes(need) &&
        !/(?:^|_)safe_(?:sites?|places?)(?:_|$)/.test(need)
      ),
      interpretedNeed
    ])];
  }
  const coordinationPreference = normalizeCoordinationPreference(args.coordination_preference || args.coordinationPreference);
  const detailRequested = normalizeDetailRequested(args.detail_requested || args.detailRequested);
  const requestedMesProgrammeId = mesProgrammeResourceId(args.mes_programme || args.mesProgramme);
  const requestedMesResource = requestedMesProgrammeId
    ? resources.find((resource) => resource.id === requestedMesProgrammeId)
    : undefined;
  const informationalMesProgrammeRequest = needs.length === 1 && needs[0] === 'mes_services' && Boolean(requestedMesResource);
  const statedSafetyContext = normalizeSupportCategory(args.safety_context || args.safetyContext || '');
  const safetyContext = safeSiteType === 'danger_now'
    ? 'immediate_danger'
    : deriveUrgentSafetyContext(statedSafetyContext, needs);

  if (safetyContext) {
    return buildUrgentEscalation({ safetyContext, location, audience, resources, phoneType: args.phone_type || args.phoneType });
  }

  if (!needs.length) {
    return noMatch('support_need_required', needs, args.location, 'What feels most urgent right now: safety, health, food, or someone to talk to?', 'support_need');
  }

  const safeToSpeak = normalizeSafeToSpeak(args.safe_to_speak || args.safeToSpeak);
  const privacySensitiveNeed = needs.some((need) => [
    'gbv_support',
    'gbv_healthcare',
    'sexual_assault_care',
    'victim_friendly_healthcare',
    'abuse_support',
    'women_children_shelter'
  ].includes(need));
  if (privacySensitiveNeed && safeToSpeak !== 'yes') {
    const callerSaidNo = safeToSpeak === 'no';
    return {
      success: false,
      status: callerSaidNo ? 'unsafe_to_speak' : 'privacy_clarification_required',
      error: callerSaidNo ? 'caller_cannot_speak_safely' : 'safe_to_speak_required',
      needs,
      location: args.location || '',
      audience,
      timing,
      needsMoreLocation: false,
      needsMoreAudience: false,
      options: [],
      availability_confirmed: false,
      spoken_option_ids: [],
      pending_option_ids: [],
      next_need: needs[0] || '',
      awaiting: callerSaidNo ? 'end_or_continue' : 'safe_to_speak',
      suggested_demo_action: '',
      voiceResponse: callerSaidNo
        ? "Okay. I won't name a service or ask for details. Would you like to end the call now?"
        : 'Before we go further, is it safe for you to speak right now?'
    };
  }

  const criticalNeedBeforeSafeSiteClarification = needs.some((need) => [
    'mental_health_crisis',
    'suicide_support',
    'child_safety',
    'gbv_support',
    'gbv_healthcare',
    'sexual_assault_care',
    'victim_friendly_healthcare',
    'abuse_support',
    'women_children_shelter'
  ].includes(need));
  if (rawSafeSiteRequest && !safeSiteType && !criticalNeedBeforeSafeSiteClarification) {
    return {
      success: false,
      status: 'safe_space_type_clarification_required',
      error: 'safe_space_type_required',
      needs,
      location: locationInput,
      audience,
      timing,
      needsMoreLocation: false,
      needsMoreAudience: false,
      options: [],
      availability_confirmed: false,
      spoken_option_ids: [],
      pending_option_ids: [],
      next_need: 'safe_site',
      awaiting: 'safe_space_type',
      suggested_demo_action: '',
      voiceResponse: "Do you need somewhere for tonight, a public place during the day, or urgent help because you're in danger now?"
    };
  }

  const informationalMesOverviewRequest = requestedMesProgrammeId === 'mes-johannesburg-navigation';
  if (informationalMesProgrammeRequest && !informationalMesOverviewRequest && audience === 'unknown' && !requestedMesResource.audiences.includes('unknown')) {
    return {
      success: false,
      status: 'audience_clarification_required',
      error: 'mes_programme_audience_required',
      needs,
      location: locationInput,
      audience,
      timing,
      options: [],
      spoken_option_ids: [],
      pending_option_ids: [],
      awaiting: 'audience',
      suggested_demo_action: '',
      availability_confirmed: false,
      voiceResponse: `${careLead(needs)} ${mesProgrammeSpokenSummary(requestedMesResource, false)} Is this for an adult on their own, an adult with children, or someone under 18?`
    };
  }

  if (informationalMesProgrammeRequest && !informationalMesOverviewRequest && audience !== 'unknown' && !audienceMatches(requestedMesResource, audience, needs)) {
    return {
      success: false,
      status: 'audience_not_supported',
      error: 'mes_programme_not_suitable_for_audience',
      needs,
      location: locationInput,
      audience,
      timing,
      options: [],
      spoken_option_ids: [],
      pending_option_ids: [],
      awaiting: 'support_need',
      suggested_demo_action: '',
      availability_confirmed: false,
      voiceResponse: `${careLead(needs)} ${mesProgrammeSpokenSummary(requestedMesResource, false)} I won't direct a child or family into an adult-only programme. Would you like me to find the right child or family support instead?`
    };
  }

  if (audience === 'child' && needs.some((need) => ['shelter_navigation', 'safe_space_navigation'].includes(need))) {
    needs = [...new Set(['child_safety', ...needs])];
  }

  if (audience === 'child' && needs.some((need) => [
    'mental_health',
    'emotional_support',
    'mental_health_crisis',
    'suicide_support',
    'gbv_support',
    'abuse_support'
  ].includes(need))) {
    needs = [...new Set(['child_safety', ...needs])];
  }

  const daytimeSpaceUnavailableTonight = timing === 'tonight' && needs.includes('daytime_community_space');
  if (daytimeSpaceUnavailableTonight && needs.length === 1) {
    return noMatch(
      'daytime_space_not_available_tonight',
      needs,
      args.location,
      'The community places I have are for daytime, not overnight shelter. Do you need somewhere for tonight, immediate safety help, or a daytime place tomorrow?',
      'safe_space_type'
    );
  }

  const usefulLocation = isUsefulJoziLocation(location);
  const healthNeeds = ['healthcare', 'medication', 'hospital_care'];
  const healthLocationNeeded = !usefulLocation && needs.some((need) => healthNeeds.includes(need));
  const daytimeLocationNeeded = !usefulLocation && needs.includes('daytime_community_space');
  const supportLocationNeeded = !usefulLocation && needs.some((need) => [
    'shelter_navigation',
    'safe_space_navigation',
    'social_support',
    'social_relief',
    'women_children_shelter'
  ].includes(need));

  const specialistCareNeeds = ['sexual_assault_care', 'gbv_healthcare', 'victim_friendly_healthcare'];
  const needsSpecialistCare = needs.some((need) => specialistCareNeeds.includes(need));
  const hasLocalSpecialist = usefulLocation && resources.some((resource) =>
    resource.primaryCategories.some((category) => needs.includes(category)) &&
    resource.areas.some((area) => locationMatchesArea(location, area)) &&
    (contactModeMatches(resource, contactMode) || resource.contactModes.includes('phone')) &&
    (!['now', 'tonight'].includes(timing) || isPublished24Hour(resource))
  );
  const specialistLocationNeeded = contactMode !== 'online' && needsSpecialistCare && !hasLocalSpecialist;
  const specialistCandidateContactMode = specialistLocationNeeded ? 'phone' : contactMode;
  const specialistPhoneCandidates = specialistLocationNeeded
    ? resources
      .filter((resource) =>
        resource.phone &&
        resource.contactModes.includes(specialistCandidateContactMode) &&
        (!['now', 'tonight'].includes(timing) || isPublished24Hour(resource)) &&
        resource.primaryCategories.some((category) => specialistCareNeeds.includes(category) && needs.includes(category))
      )
      .sort((left, right) => {
        if (['now', 'tonight'].includes(timing)) {
          const hoursDifference = Number(isPublished24Hour(right)) - Number(isPublished24Hour(left));
          if (hoursDifference) return hoursDifference;
        }
        const leftLocal = left.areas.some((area) => normalizeSearchText(area) === location) ? 1 : 0;
        const rightLocal = right.areas.some((area) => normalizeSearchText(area) === location) ? 1 : 0;
        return rightLocal - leftLocal || left.id.localeCompare(right.id);
      })
      .slice(0, 2)
    : [];

  let matched = rankJoziResources({ resources, needs, location, usefulLocation, audience, contactMode, timing });

  for (const resource of specialistPhoneCandidates) {
    for (const need of needs.filter((item) => specialistCareNeeds.includes(item) && resource.primaryCategories.includes(item))) {
      addCoveredCandidate(matched, { resource }, need);
    }
  }

  matched = augmentUncoveredNeedCandidates({
    matched,
    resources,
    needs,
    location,
    usefulLocation,
    audience,
    contactMode,
    timing
  });

  if (needs.includes('mes_services') && requestedMesProgrammeId) {
    const requestedResource = resources.find((resource) => resource.id === requestedMesProgrammeId);
    const informationalProgrammeRequest = needs.every((need) => need === 'mes_services');
    if (requestedResource && informationalProgrammeRequest && contactMode !== 'online' &&
      !matched.some((candidate) => candidate.resource.id === requestedMesProgrammeId)) {
      matched.unshift({
        resource: requestedResource,
        categoryScore: scoreCategories(requestedResource, needs),
        locationScore: scoreLocation(requestedResource, location, usefulLocation),
        modeScore: scoreContactMode(requestedResource, contactMode),
        timingScore: scoreTiming(requestedResource, timing, needs),
        coveredNeeds: ['mes_services']
      });
    }
    matched.sort((left, right) =>
      Number(right.resource.id === requestedMesProgrammeId) - Number(left.resource.id === requestedMesProgrammeId)
    );
  }

  if (!matched.length) {
    if (contactMode === 'online') {
      return noMatch(
        'verified_online_support_not_found',
        needs,
        args.location,
        'I have not found a verified online option for that need. Would you like a phone or in-person route instead?',
        'contact_mode'
      );
    }
    if (healthLocationNeeded) {
      return noMatch(
        'specific_location_required',
        needs,
        locationInput,
        `I want to make sure I do not send you too far. ${['now', 'tonight'].includes(timing) ? 'If this is a medical emergency, tell me now. ' : ''}Which Johannesburg or Soweto neighbourhood, clinic name, or nearest landmark should I use?`,
        'location'
      );
    }
    if (daytimeLocationNeeded) {
      return noMatch(
        'specific_location_required',
        needs,
        locationInput,
        'I can find a real daytime community place. Which neighbourhood or nearest landmark are you near?',
        'location'
      );
    }
    if (contactMode !== 'online' && needs.includes('women_children_shelter')) {
      const regionalNavigatorId = locationRegion(location) === 'region_d'
        ? 'coj-region-d-social-services'
        : 'coj-general-services';
      const navigator = resources.find((resource) => resource.id === regionalNavigatorId);
      if (navigator) {
        const option = publicResource(navigator);
        return {
          success: false,
          status: 'specialist_shelter_navigation_required',
          error: 'local_women_children_shelter_not_confirmed',
          needs,
          location: args.location || '',
          timing,
          needsMoreLocation: !usefulLocation,
          options: [option],
          availability_confirmed: false,
          spoken_option_ids: [option.id],
          pending_option_ids: [],
          next_need: 'women_children_shelter',
          awaiting: demoEnabled ? 'demo_action_consent' : 'detail_preference',
          suggested_demo_action: demoEnabled ? 'phone_connection' : '',
          voiceResponse: `I hear you. I do not have a confirmed women-and-children shelter place in that area. ${option.name} can help you find the right service on ${option.phone}. ${demoEnabled ? 'Would you like me to connect you now in the demo?' : 'Would you like me to repeat the number?'}`
        };
      }
    }
    const fallback = resources.find((resource) => resource.id === 'coj-general-services');
    const fallbackOption = contactMode !== 'online' && fallback && needs.some((need) => ['shelter_navigation', 'safe_space_navigation', 'social_support', 'social_relief'].includes(need))
      ? [publicResource(fallback)]
      : [];
    const unknownNeedAwaiting = usefulLocation ? 'support_need' : 'location';
    return {
      success: false,
      status: 'no_verified_local_match',
      error: 'verified_support_not_found',
      needs,
      location: args.location || '',
      timing,
      needsMoreLocation: !usefulLocation,
      options: fallbackOption,
      spoken_option_ids: fallbackOption.map((option) => option.id),
      pending_option_ids: [],
      next_need: needs[0] || '',
      awaiting: fallbackOption.length ? (demoEnabled ? 'demo_action_consent' : 'detail_preference') : unknownNeedAwaiting,
      suggested_demo_action: fallbackOption.length && demoEnabled ? 'phone_connection' : '',
      voiceResponse: fallbackOption.length
        ? `I have not found a suitable local place yet. You can call ${fallbackOption[0].name} on ${fallbackOption[0].phone} for help finding the right service. ${demoEnabled ? 'Would you like me to connect you now in the demo?' : 'Would you like me to repeat the number?'}`
        : contactMode === 'online'
          ? 'I have not found a verified online option for that need. Would you like a phone or in-person route instead?'
          : usefulLocation
            ? 'I have your area. Could you tell me whether you need safety, food, health support, or something else?'
            : 'I have not found a suitable local option yet. What nearby area or another kind of help should I try?'
    };
  }

  const maxOptions = clamp(Number(args.max_options) || 2, 1, 2);
  const selectedCandidates = selectDiverseCandidates(matched, needs, maxOptions);
  const selected = selectedCandidates.map(({ resource }) => publicResource(resource));
  const oneResourceHandlesEveryNeed = selectedCandidates.length === 1 &&
    needs.every((need) => resourceScoresForNeed(selectedCandidates[0].resource, need));
  const spokenNeeds = oneResourceHandlesEveryNeed
    ? new Set(needs)
    : maximumCoveredNeeds(selectedCandidates, needs);
  const deferredNeeds = needs.filter((need) =>
    !spokenNeeds.has(need) && matched.some((candidate) => candidateMatchesNeed(candidate, need))
  );
  const uncoveredNeeds = needs.filter((need) =>
    !spokenNeeds.has(need) && !matched.some((candidate) => candidateMatchesNeed(candidate, need))
  );
  const uncoveredHealthNeeds = uncoveredNeeds.filter((need) => healthNeeds.includes(need));
  const specialistShelterNavigation = needs.includes('women_children_shelter') &&
    !selectedCandidates.some(({ resource }) => resource.primaryCategories.includes('women_children_shelter')) &&
    selectedCandidates.some((candidate) => candidateMatchesNeed(candidate, 'women_children_shelter'));
  const shelterAudienceNeeded = audience === 'unknown' && needs.some((need) => ['shelter_navigation', 'safe_space_navigation'].includes(need));
  const needsMoreLocation = healthLocationNeeded || supportLocationNeeded || specialistLocationNeeded || uncoveredNeeds.length > 0 ||
    (!usefulLocation && selected.some((option) => option.contact_modes.includes('in_person')));
  const otherUncoveredNeeds = uncoveredNeeds.filter((need) => !healthNeeds.includes(need));
  const phoneAlternativeIncluded = contactMode === 'in_person' && selected.some((option) =>
    option.contact_modes.length === 1 && option.contact_modes[0] === 'phone'
  );
  const conversation = buildConversationalSupportResponse({
    needs,
    selected,
    selectedCandidates,
    contactMode,
    timing,
    demoEnabled,
    shelterAudienceNeeded,
    specialistShelterNavigation,
    specialistLocationNeeded,
    healthLocationNeeded,
    supportLocationNeeded: supportLocationNeeded || daytimeLocationNeeded,
    uncoveredHealthNeeds,
    otherUncoveredNeeds,
    deferredNeeds,
    daytimeSpaceUnavailableTonight,
    coordinationPreference,
    detailRequested
  });
  const onlyPhoneAlternatives = contactMode === 'in_person' && selected.length > 0 && selected.every((option) =>
    option.contact_modes.length === 1 && option.contact_modes[0] === 'phone'
  );
  const partialMatch = uncoveredNeeds.length > 0 || deferredNeeds.length > 0;
  const exposedOptions = conversation.spokenOptionIds.length ? selected : [];
  return {
    success: !partialMatch && !onlyPhoneAlternatives && !shelterAudienceNeeded && !specialistShelterNavigation,
    status: partialMatch
      ? 'partial_source_checked_match'
      : shelterAudienceNeeded
        ? 'audience_clarification_required'
        : specialistShelterNavigation
          ? 'specialist_shelter_navigation_required'
          : onlyPhoneAlternatives
            ? 'no_verified_in_person_match'
            : specialistLocationNeeded
              ? 'source_checked_phone_route_location_needed'
              : 'source_checked_public_contact_found',
    error: uncoveredNeeds.length > 0
      ? 'some_requested_support_not_found'
      : deferredNeeds.length > 0
        ? 'some_requested_support_deferred'
      : shelterAudienceNeeded
        ? 'shelter_audience_required'
        : specialistShelterNavigation
          ? 'local_women_children_shelter_not_confirmed'
          : onlyPhoneAlternatives
            ? 'verified_in_person_support_not_found'
            : undefined,
    directory: 'jozi_curated_public_sources',
    needs,
    location: locationInput,
    audience,
    timing,
    needsMoreLocation,
    needsMoreAudience: shelterAudienceNeeded,
    uncovered_needs: uncoveredNeeds,
    deferred_needs: deferredNeeds,
    options: exposedOptions,
    selected: exposedOptions[0],
    source_checked_at: exposedOptions[0]?.source_checked_at || '',
    availability_confirmed: false,
    phone_alternative_included: phoneAlternativeIncluded,
    phoneAlternatives: onlyPhoneAlternatives,
    spoken_option_ids: conversation.spokenOptionIds,
    pending_option_ids: conversation.spokenOptionIds.length ? conversation.pendingOptionIds : [],
    next_need: conversation.nextNeed,
    awaiting: conversation.awaiting,
    suggested_demo_action: conversation.suggestedDemoAction,
    voiceResponse: conversation.voiceResponse
  };
}

export function coordinateJoziSupport(args = {}, resources = JOZI_SUPPORT_RESOURCES) {
  if (args.require_confirmed_consent && (args.consent_confirmed !== true || args.caller_answered_after_offer !== true)) {
    return {
      success: false,
      status: 'simulation_rejected',
      simulation: true,
      submitted: false,
      confirmed: false,
      error: 'explicit_demo_consent_required',
      voiceResponse: 'Please wait for the caller to answer the demo offer and clearly say yes before starting it.'
    };
  }
  const resource = resources.find((item) => item.id === args.resource_id);
  if (!resource) {
    return {
      success: false,
      simulation: true,
      submitted: false,
      confirmed: false,
      error: 'resource_not_found',
      voiceResponse: 'I cannot create a demo step because that destination is not in the curated directory.'
    };
  }

  const action = String(args.action || '').trim().toLowerCase();
  const offeredIds = Array.isArray(args.offered_resource_ids) ? args.offered_resource_ids.map(String) : [];
  if (args.require_offered_resource && !offeredIds.includes(resource.id)) {
    return {
      success: false,
      status: 'simulation_rejected',
      simulation: true,
      submitted: false,
      confirmed: false,
      error: 'resource_not_offered_in_call',
      voiceResponse: 'Choose a destination returned by the current directory lookup before showing a simulated coordination step.'
    };
  }

  const requiredAction = String(args.required_action || '').trim().toLowerCase();
  if (args.require_offered_action && (!requiredAction || action !== requiredAction)) {
    return {
      success: false,
      status: 'simulation_rejected',
      simulation: true,
      submitted: false,
      confirmed: false,
      error: 'demo_action_not_offered_in_call',
      voiceResponse: 'Let us choose that demo step together before I start it.'
    };
  }

  const supportedActions = new Set(resource.simulationActions || []);
  if (resource.phone && resource.routingMode !== 'emergency_phone') supportedActions.add('phone_connection');
  if (!supportedActions.has(action)) {
    return {
      success: false,
      simulation: true,
      submitted: false,
      confirmed: false,
      error: 'demo_action_not_supported',
      resource: publicResource(resource),
      voiceResponse: `I can give you ${resource.name}'s source-checked public contact, but this demonstration does not support that coordination step.`
    };
  }

  if (!args.demo_enabled) {
    return {
      success: false,
      simulation: false,
      submitted: false,
      confirmed: false,
      error: 'demo_mode_disabled',
      resource: publicResource(resource),
      voiceResponse: `Nothing has been booked or sent. ${buildSupportVoiceResponse(publicResource(resource))}`
    };
  }

  const reference = String(args.reference_id || 'DEMO').trim();
  const when = String(args.requested_time || 'the requested time').trim();
  const messages = {
    appointment_request: `All set—the demo now shows your appointment at ${resource.name} booked for ${when}. ${resource.name} was not contacted, so no real appointment is booked.`,
    clinician_handoff: 'Please hold—the demo now shows a doctor joining shortly. No live doctor has been contacted or connected.',
    availability_check: `All set—the demo now shows the availability check with ${resource.name} as complete. ${resource.name} was not contacted, so no live availability was checked and nothing was reserved.`,
    intake_request: `All set—the demo now shows the intake check with ${resource.name} as complete. ${resource.name} was not contacted, so no real request was sent and no place or meal was reserved.`,
    navigator_handoff: `All set—the demo redirection screen for ${resource.name} is ready. No call or transfer to ${resource.name} has been made.`,
    warm_handoff: `Stay with me—the demo connection screen for ${resource.name} is ready. No call has been placed and nobody is connected.`,
    phone_connection: `Stay with me—the demo connection screen for ${resource.name} is ready. No call or transfer has been placed, and nobody is connected.`,
    assessment_request: `All set—the demo now shows the assessment request with ${resource.name} as ready. ${resource.name} was not contacted, so no real assessment was requested.`,
    reward_signup: 'All set—the demo Zlto sign-up and reward journey is ready. No Zlto account, task, reward, payment, or marketplace order was created.',
    voucher_pathway: 'All set—the demo Mi-Change and Zlto partner check is ready. MES and Zlto were not contacted, and no voucher, reward, meal, shower, shelter place, or service booking was created.'
  };

  return {
    success: true,
    status: 'simulation_only',
    simulation: true,
    live_success: false,
    submitted: false,
    confirmed: false,
    action,
    reference_id: reference,
    requested_time: when,
    resource: publicResource(resource),
    voiceResponse: messages[action]
  };
}

function buildUrgentEscalation({ safetyContext, location, audience, resources, phoneType }) {
  const ids = [];
  if (safetyContext === 'self_harm_imminent' || safetyContext === 'suicide_imminent') {
    ids.push('joburg-emergency-connect', 'sadag-suicide-crisis', 'mobile-emergency-112');
  } else if (safetyContext === 'gbv_immediate') {
    ids.push('joburg-emergency-connect', 'gbv-command-centre', 'saps-10111', 'mobile-emergency-112');
  } else if (safetyContext === 'violence_now') {
    ids.push('saps-10111', 'joburg-emergency-connect', 'mobile-emergency-112');
  } else if (safetyContext === 'medical_emergency' || safetyContext === 'overdose') {
    ids.push('joburg-emergency-connect', 'mobile-emergency-112');
  } else if (safetyContext === 'fire_emergency') {
    ids.push('joburg-emergency-connect', 'mobile-emergency-112');
  } else {
    ids.push('joburg-emergency-connect', 'mobile-emergency-112');
  }
  if (String(phoneType || '').toLowerCase() === 'mobile') {
    const mobileIndex = ids.indexOf('mobile-emergency-112');
    if (mobileIndex > 0) ids.unshift(...ids.splice(mobileIndex, 1));
  }
  if (audience === 'child') ids.push('childline-116');
  const options = ids.map((id) => resources.find((resource) => resource.id === id)).filter(Boolean).map(publicResource);
  const first = options[0];
  const landmark = 'Tell the operator your nearest landmark';
  return {
    success: true,
    status: 'urgent_escalation',
    emergency: true,
    safety_context: safetyContext,
    options,
    selected: first,
    availability_confirmed: false,
    voiceResponse: `${first ? `Call ${first.phone} now. ` : ''}${landmark}, say what happened, and stay on the line.`
  };
}

function normalizeNeeds(args) {
  const raw = args.needs || args.categories || args.service_types || [args.service_type || args.category || args.need_type];
  const values = Array.isArray(raw) ? raw : String(raw || '').split(',');
  return [...new Set(values.flatMap(expandSupportCategory).filter(Boolean))];
}

export function mergeJoziSupportContext(previous = {}, current = {}) {
  const merged = { ...current };
  const currentLocation = selectCallerStatedLocation(current);
  const previousLocation = selectCallerStatedLocation(previous);
  const currentLocationIsUseful = isUsefulJoziLocation(currentLocation);
  const previousLocationIsUseful = isUsefulJoziLocation(previousLocation);

  if (!currentLocationIsUseful && previousLocationIsUseful) {
    merged.location = previous.location || previousLocation;
    if (previous.landmark) merged.landmark = previous.landmark;
    if (previous.area) merged.area = previous.area;
  }

  const currentAudience = normalizeAudience(current.audience || current.caller_type);
  const previousAudience = normalizeAudience(previous.audience || previous.caller_type);
  if (currentAudience === 'unknown' && previousAudience !== 'unknown') merged.audience = previousAudience;

  const currentNeeds = current.needs || current.categories || current.service_types ||
    [current.service_type || current.category || current.need_type].filter(Boolean);
  const currentNeedValues = (Array.isArray(currentNeeds) ? currentNeeds : String(currentNeeds || '').split(','))
    .map((need) => String(need || '').trim())
    .filter(Boolean);
  const previousNeedValues = Array.isArray(previous.needs) ? previous.needs : [];
  const normalizedCurrentNeeds = currentNeedValues.flatMap(expandSupportCategory);
  const normalizedPreviousNeeds = previousNeedValues.flatMap(expandSupportCategory);
  const hasRawAmbiguousSafeNeed = currentNeedValues.some((need) =>
    /\bsafe\s+(?:sites?|places?)\b/.test(normalizeSearchText(need))
  );
  const continuesPendingNeed = currentNeedValues.length === 0 || hasRawAmbiguousSafeNeed ||
    normalizedCurrentNeeds.some((need) => normalizedPreviousNeeds.includes(need));

  const currentTimingRaw = String(current.timing || current.needed_when || current.urgency || '').trim();
  const previousTiming = normalizeTiming(previous.timing || previous.needed_when || previous.urgency);
  const currentTiming = normalizeTiming(currentTimingRaw);
  if (continuesPendingNeed && previous.timing && (!currentTimingRaw || (currentTiming === 'routine' && previousTiming !== 'routine'))) {
    merged.timing = previousTiming;
  }
  if ((!current.phone_type || current.phone_type === 'unknown') && previous.phone_type && previous.phone_type !== 'unknown') {
    merged.phone_type = previous.phone_type;
  }
  const currentSafeSiteType = current.safe_site_type || current.safeSiteType;
  const previousSafeSiteType = previous.safe_site_type || previous.safeSiteType;
  if (!currentSafeSiteType && previousSafeSiteType && (currentNeedValues.length === 0 || hasRawAmbiguousSafeNeed)) {
    merged.safe_site_type = previousSafeSiteType;
  }
  if (hasRawAmbiguousSafeNeed && previousNeedValues.length) {
    merged.needs = [...new Set([...previousNeedValues, ...currentNeedValues])];
  } else if (currentNeedValues.length === 0 && previousNeedValues.length) {
    merged.needs = previous.needs;
  }
  return merged;
}

export function buildJoziPendingLookupContext(args = {}, result = {}) {
  const clarificationAwaits = new Set([
    'audience',
    'location',
    'safe_space_type',
    'safe_to_speak',
    'support_need',
    'contact_mode'
  ]);
  if (!clarificationAwaits.has(result.awaiting)) return {};
  return {
    location: args.location || result.location || '',
    landmark: args.landmark || '',
    area: args.area || '',
    audience: result.audience || args.audience || 'unknown',
    timing: result.timing || args.timing || '',
    phone_type: args.phone_type || 'unknown',
    safe_site_type: args.safe_site_type || args.safeSiteType || '',
    needs: Array.isArray(result.needs) ? result.needs : normalizeNeeds(args)
  };
}

function hasAmbiguousSafeSiteRequest(args = {}) {
  const raw = args.needs || args.categories || args.service_types || [args.service_type || args.category || args.need_type];
  const values = Array.isArray(raw) ? raw : String(raw || '').split(',');
  return values.some((value) => /\bsafe\s+(?:sites?|places?)\b/.test(normalizeSearchText(value)));
}

function normalizeSafeSiteType(value) {
  const normalized = normalizeSupportCategory(value || '');
  if (['tonight', 'for_tonight', 'overnight', 'night', 'nighttime', 'at_night', 'in_the_night', 'for_the_night'].includes(normalized)) return 'tonight';
  if (['day', 'daytime', 'day_time', 'during_day', 'during_the_day', 'in_the_day', 'public_place', 'community_place'].includes(normalized)) return 'daytime';
  if (['danger', 'danger_now', 'in_danger', 'immediate_danger', 'urgent_danger', 'urgent_help', 'unsafe_now', 'not_safe_now', 'emergency'].includes(normalized)) return 'danger_now';
  return '';
}

function expandSupportCategory(value) {
  const normalized = normalizeSearchText(value || '').replace(/\s+/g, '_');
  const mapped = SUPPORT_CATEGORY_ALIASES[normalized];
  if (Array.isArray(mapped)) return mapped;
  return [mapped || normalized];
}

function normalizeAudience(value) {
  const normalized = normalizeSupportCategory(value || 'unknown');
  if (['adult_on_my_own', 'adult_alone', 'single_adult', 'individual_adult', 'individual'].includes(normalized)) return 'adult';
  if (['adult_with_children', 'adult_with_kids', 'with_children', 'with_kids', 'parent_with_children'].includes(normalized)) return 'family';
  if (['under_18', 'under_eighteen', 'minor', 'young_person_under_18'].includes(normalized)) return 'child';
  return ['adult', 'family', 'child', 'older_person', 'person_with_disability', 'unknown'].includes(normalized) ? normalized : 'unknown';
}

function normalizeContactMode(value) {
  const normalized = normalizeSupportCategory(value || 'either');
  return ['phone', 'in_person', 'online', 'either'].includes(normalized) ? normalized : 'either';
}

function normalizeTiming(value) {
  const normalized = normalizeSupportCategory(value || 'routine');
  if (['now', 'immediate'].includes(normalized)) return 'now';
  if (['this_evening', 'later_tonight', 'this_tonight', 'overnight'].includes(normalized)) return 'tonight';
  return ['today', 'tonight', 'routine'].includes(normalized) ? normalized : 'routine';
}

function normalizeSafeToSpeak(value) {
  const normalized = normalizeSupportCategory(value || 'unknown');
  if (['yes', 'true', 'safe'].includes(normalized)) return 'yes';
  if (['no', 'false', 'unsafe'].includes(normalized)) return 'no';
  return 'unknown';
}

function mesProgrammeResourceId(value) {
  const normalized = normalizeSupportCategory(value || 'overview');
  const ids = {
    overview: 'mes-johannesburg-navigation',
    assessment_centre: 'mes-assessment-centre',
    ekhaya: 'mes-ekhaya-shelter',
    ekuthuleni: 'mes-ekuthuleni-shelter',
    impilo: 'mes-impilo-shelter',
    grow: 'mes-grow-programme'
  };
  return ids[normalized] || '';
}

function normalizeCoordinationPreference(value) {
  const normalized = normalizeSupportCategory(value || 'none');
  return ['appointment_request', 'clinician_handoff', 'none'].includes(normalized) ? normalized : 'none';
}

function normalizeDetailRequested(value) {
  const normalized = normalizeSupportCategory(value || 'recommendation');
  return ['recommendation', 'phone', 'hours', 'address', 'directions'].includes(normalized) ? normalized : 'recommendation';
}

function deriveUrgentSafetyContext(statedSafetyContext, needs) {
  if (IMMEDIATE_SAFETY_CONTEXTS.has(statedSafetyContext)) return statedSafetyContext;
  for (const need of needs) {
    if (URGENT_NEED_CONTEXT[need]) return URGENT_NEED_CONTEXT[need];
  }
  return '';
}

function rankJoziResources({ resources, needs, location, usefulLocation, audience, contactMode, timing }) {
  return resources
    .filter((resource) => audienceMatches(resource, audience, needs))
    .filter((resource) => contactModeMatches(resource, contactMode))
    .filter((resource) => timingAllowsResource(resource, timing))
    .map((resource) => ({
      resource,
      categoryScore: scoreCategories(resource, needs),
      locationScore: scoreLocation(resource, location, usefulLocation),
      modeScore: scoreContactMode(resource, contactMode),
      timingScore: scoreTiming(resource, timing, needs)
    }))
    .filter(({ categoryScore }) => categoryScore > 0)
    .filter(({ resource }) => locationAllowsResource(resource, location, usefulLocation))
    .sort((left, right) =>
      Number(Boolean(left.resource.fallbackOnly)) - Number(Boolean(right.resource.fallbackOnly)) ||
      right.timingScore - left.timingScore ||
      right.categoryScore - left.categoryScore ||
      right.locationScore - left.locationScore ||
      right.modeScore - left.modeScore ||
      left.resource.id.localeCompare(right.resource.id)
    );
}

function augmentUncoveredNeedCandidates({ matched, resources, needs, location, usefulLocation, audience, contactMode, timing }) {
  const augmented = matched.map((candidate) => ({ ...candidate, coveredNeeds: [...(candidate.coveredNeeds || [])] }));
  const orderedNeeds = [...needs].sort((left, right) => needPriority(right) - needPriority(left));

  for (const need of orderedNeeds) {
    if (augmented.some((candidate) => candidateMatchesNeed(candidate, need))) continue;

    if (contactMode !== 'online' && ['shelter_navigation', 'safe_space_navigation', 'women_children_shelter', 'social_support', 'social_relief'].includes(need)) {
      const region = locationRegion(location);
      const navigatorId = timing === 'tonight'
        ? 'coj-general-services'
        : region === 'region_d'
          ? 'coj-region-d-social-services'
          : region === 'region_f'
            ? 'coj-region-f-social-services'
            : 'coj-general-services';
      const navigator = resources.find((resource) => resource.id === navigatorId);
      if (navigator) addCoveredCandidate(augmented, { resource: navigator }, need);
    }

    if (contactMode === 'in_person' && !augmented.some((candidate) => candidateMatchesNeed(candidate, need))) {
      const phoneCandidate = rankJoziResources({
        resources,
        needs: [need],
        location,
        usefulLocation,
        audience,
        contactMode: 'phone',
        timing
      }).find(({ resource }) => resource.contactModes.length === 1 && resource.contactModes[0] === 'phone');
      if (phoneCandidate) addCoveredCandidate(augmented, phoneCandidate, need);
    }
  }

  return augmented;
}

function addCoveredCandidate(candidates, candidate, need) {
  const existing = candidates.find((item) => item.resource.id === candidate.resource.id);
  if (existing) {
    existing.coveredNeeds = [...new Set([...(existing.coveredNeeds || []), need])];
    return;
  }
  candidates.push({
    categoryScore: 0,
    locationScore: 0,
    modeScore: 0,
    timingScore: 0,
    ...candidate,
    coveredNeeds: [...new Set([...(candidate.coveredNeeds || []), need])]
  });
}

function selectDiverseCandidates(matched, needs, maxOptions) {
  const directCompleteCandidate = matched.find((candidate) =>
    !candidate.resource.fallbackOnly &&
    needs.length > 1 && needs.every((need) => resourceScoresForNeed(candidate.resource, need))
  );
  if (directCompleteCandidate) return [directCompleteCandidate];

  const directCoverageExists = matched.some((candidate) =>
    !candidate.resource.fallbackOnly && needs.some((need) => candidateMatchesNeed(candidate, need))
  );
  if (!directCoverageExists) {
    const fallbackCompleteCandidate = matched.find((candidate) =>
      needs.length > 1 && needs.every((need) => resourceScoresForNeed(candidate.resource, need))
    );
    if (fallbackCompleteCandidate) return [fallbackCompleteCandidate];
  }

  const selected = [];
  const priorityNeeds = needs
    .map((need, index) => ({ need, index, priority: needPriority(need) }))
    .sort((left, right) => right.priority - left.priority || left.index - right.index)
    .map(({ need }) => need);

  for (const need of priorityNeeds) {
    if (selected.length >= maxOptions) break;
    if (selected.some((candidate) => candidateMatchesNeed(candidate, need))) continue;
    const match = matched.find((candidate) =>
      !selected.some((item) => item.resource.id === candidate.resource.id) && candidateMatchesNeed(candidate, need)
    );
    if (match) selected.push(match);
  }

  const everyNeedHasCandidate = priorityNeeds.every((need) => matched.some((candidate) => candidateMatchesNeed(candidate, need)));
  if (everyNeedHasCandidate) {
    for (const candidate of matched) {
      if (selected.length >= maxOptions) break;
      if (!selected.some((item) => item.resource.id === candidate.resource.id)) selected.push(candidate);
    }
  }
  return selected;
}

function resourceScoresForNeed(resource, need) {
  return scoreCategories(resource, [need]) > 0;
}

function candidateMatchesNeed(candidate, need) {
  return candidate.coveredNeeds?.includes(need) || resourceMatchesNeed(candidate.resource, need);
}

function candidateConversationallyCoversNeed(candidate, need) {
  return candidate.coveredNeeds?.includes(need) || resourceScoresForNeed(candidate.resource, need);
}

function maximumCoveredNeeds(candidates, needs) {
  const orderedNeeds = needs
    .map((need, index) => ({ need, index, priority: needPriority(need) }))
    .sort((left, right) => right.priority - left.priority || left.index - right.index)
    .map(({ need }) => need);
  let best = [];

  function search(candidateIndex, usedNeeds, assignedNeeds) {
    if (candidateIndex >= candidates.length) {
      if (assignedNeeds.length > best.length) best = [...assignedNeeds];
      return;
    }
    search(candidateIndex + 1, usedNeeds, assignedNeeds);
    for (const need of orderedNeeds) {
      if (usedNeeds.has(need) || !candidateMatchesNeed(candidates[candidateIndex], need)) continue;
      usedNeeds.add(need);
      assignedNeeds.push(need);
      search(candidateIndex + 1, usedNeeds, assignedNeeds);
      assignedNeeds.pop();
      usedNeeds.delete(need);
    }
  }

  search(0, new Set(), []);
  return new Set(best);
}

function needPriority(need) {
  if (['mental_health_crisis', 'suicide_support'].includes(need)) return 100;
  if (['child_safety', 'sexual_assault_care', 'gbv_healthcare', 'victim_friendly_healthcare'].includes(need)) return 90;
  if (['shelter_navigation', 'safe_space_navigation', 'women_children_shelter'].includes(need)) return 80;
  if (['healthcare', 'hospital_care', 'medication'].includes(need)) return 70;
  return 10;
}

function resourceMatchesNeed(resource, need) {
  if (resource.primaryCategories.includes(need)) return true;
  if (need === 'medication' && resource.primaryCategories.includes('healthcare')) return true;
  return Boolean(resource.allowNavigationMatch && resource.navigationCategories.includes(need));
}

function audienceMatches(resource, audience, needs) {
  if (resource.id === 'childline-116' && audience === 'adult' && needs.includes('child_safety')) return true;
  const childInvolved = needs.includes('child_safety') || audience === 'child' || audience === 'family';
  const adultShelterPath = needs.some((need) => ['shelter_navigation', 'safe_space_navigation'].includes(need)) &&
    resource.primaryCategories.some((category) => ['shelter_navigation', 'safe_space_navigation'].includes(category)) &&
    !resource.audiences.includes('child') && !resource.audiences.includes('family');
  if (childInvolved && adultShelterPath) return false;
  if (audience === 'unknown') {
    if (adultShelterPath) return false;
    if (needs.includes('women_children_shelter')) {
      return resource.primaryCategories.includes('women_children_shelter') || resource.audiences.includes('unknown');
    }
    return resource.audiences.includes('unknown');
  }
  if (audience === 'older_person' || audience === 'person_with_disability') {
    return resource.audiences.includes(audience) || resource.audiences.includes('adult') || resource.audiences.includes('unknown');
  }
  return resource.audiences.includes(audience);
}

function contactModeMatches(resource, contactMode) {
  if (contactMode === 'either') return true;
  return resource.contactModes.includes(contactMode);
}

function scoreContactMode(resource, contactMode) {
  if (contactMode === 'either') return resource.contactModes.includes('phone') ? 1 : 0;
  return resource.contactModes.includes(contactMode) ? 5 : 0;
}

function scoreCategories(resource, needs) {
  let score = 0;
  let hasPrimaryMatch = false;
  for (const need of needs) {
    if (resource.primaryCategories.includes(need)) {
      score += 30;
      hasPrimaryMatch = true;
    }
    else if (need === 'medication' && resource.primaryCategories.includes('healthcare')) score += 18;
    else if (['healthcare', 'medication'].includes(need) && resource.id === 'mes-johannesburg-navigation') continue;
    else if (resource.allowNavigationMatch && resource.navigationCategories.includes(need)) score += 9;
  }
  // Priority breaks ties between services that directly provide the requested
  // support. It must not let a broad navigator outrank a dedicated specialist.
  if (hasPrimaryMatch) score += Number(resource.routingPriority || 0);
  return score;
}

function scoreLocation(resource, location, usefulLocation) {
  if (jurisdictionMatches(resource, location)) return 12;
  if (!usefulLocation) return resource.contactModes.length === 1 && resource.contactModes[0] === 'phone' ? 3 : 0;
  if (resource.areas.some((area) => normalizeSearchText(area) === location)) return 20;
  if (resource.areas.some((area) => locationMatchesArea(location, area))) return 15;
  return resource.contactModes.length === 1 && resource.contactModes[0] === 'phone' ? 2 : 0;
}

function locationAllowsResource(resource, location, usefulLocation) {
  if (!resource.contactModes.includes('in_person')) return true;
  if (!usefulLocation) return jurisdictionMatches(resource, location);
  return resource.areas.some((area) => locationMatchesArea(location, area)) || jurisdictionMatches(resource, location);
}

function timingAllowsResource(resource, timing) {
  if (timing !== 'tonight') return true;
  if (isPublished24Hour(resource)) return true;
  return resource.id === 'mes-johannesburg-navigation' ||
    resource.primaryCategories.includes('women_children_shelter') ||
    resource.primaryCategories.includes('healthcare');
}

function scoreTiming(resource, timing, needs) {
  if (!['now', 'tonight'].includes(timing)) return 0;
  if (needs.some((need) => ['shelter_navigation', 'safe_space_navigation', 'women_children_shelter', 'healthcare', 'medication'].includes(need))) return 0;
  return isPublished24Hour(resource) ? 60 : 0;
}

function isPublished24Hour(resource) {
  const hours = normalizeSearchText(resource.hours);
  return hours.includes('24 hours') && !hours.includes('routine services');
}

const REGION_D_TERMS = new Set([
  'soweto', 'jabulani', 'orlando', 'orlando east', 'orlando west', 'kliptown', 'klipspruit', 'pimville', 'rockville',
  'diepkloof', 'dobsonville', 'zola', 'chiawelo', 'mapetla', 'meadowlands', 'protea glen', 'emdeni', 'naledi', 'moroka',
  'mofolo', 'mofolo south', 'tladi', 'moletsane', 'jabavu', 'central western jabavu', 'klipspruit west'
]);

const REGION_F_TERMS = new Set([
  'inner city', 'johannesburg cbd', 'cbd', 'hillbrow', 'joubert park', 'braamfontein', 'berea', 'yeoville', 'doornfontein',
  'jeppestown', 'jeppe', 'marshalltown', 'newtown', 'fordsburg', 'city deep', 'turffontein', 'bertrams',
  'bellevue', 'ferreirasdorp', 'mayfair'
]);

function jurisdictionMatches(resource, location) {
  const region = locationRegion(location);
  if (resource.id === 'coj-region-d-social-services') return region === 'region_d';
  if (resource.id === 'coj-region-f-social-services') return region === 'region_f';
  return false;
}

function locationRegion(location) {
  if (!location) return '';
  if (location === 'soweto') return 'region_d';
  if (!isUsefulJoziLocation(location)) return '';
  for (const term of REGION_D_TERMS) if (locationMatchesArea(location, term)) return 'region_d';
  for (const term of REGION_F_TERMS) if (locationMatchesArea(location, term)) return 'region_f';
  return '';
}

function locationMatchesArea(location, area) {
  if (!location || location.length < 3) return false;
  const normalizedArea = normalizeSearchText(area);
  if (!normalizedArea || normalizedArea.length < 3) return false;
  const vagueFragments = new Set([
    'east', 'west', 'north', 'south', 'central', 'city', 'town', 'the city', 'downtown',
    'park', 'station', 'street', 'road', 'centre', 'center'
  ]);
  if (vagueFragments.has(location)) return false;
  if (location === normalizedArea) return true;
  return ` ${location} `.includes(` ${normalizedArea} `) || ` ${normalizedArea} `.includes(` ${location} `);
}

function publicResource(resource) {
  const sensitiveAddress = resource.addressSharing === 'after_safe_to_share';
  const address = sensitiveAddress ? '' : (resource.address || '');
  const demoActions = [...new Set([
    ...(resource.simulationActions || []),
    ...(resource.phone && resource.routingMode !== 'emergency_phone' ? ['phone_connection'] : [])
  ])];
  return {
    id: resource.id,
    name: resource.name,
    primary_categories: resource.primaryCategories,
    navigation_categories: resource.navigationCategories,
    contact_modes: resource.contactModes,
    routing_mode: resource.routingMode,
    address_role: resource.addressRole,
    address,
    address_withheld_for_safety: Boolean(sensitiveAddress),
    phone: resource.phone || '',
    website: resource.website || '',
    hours: resource.hours || 'Confirm when calling',
    audiences: resource.audiences,
    demo_actions: demoActions,
    description: resource.description,
    availability_note: resource.availabilityNote,
    source_url: resource.sourceUrl,
    supporting_source_url: resource.supportingSourceUrl || '',
    source_checked_at: resource.sourceCheckedAt,
    verification_method: resource.verificationMethod,
    operational_status: resource.operationalStatus,
    availability_confirmed: false
  };
}

function mesProgrammeSpokenSummary(resource, includePhone = true) {
  const summaries = {
    'mes-assessment-centre': 'MES Johannesburg’s Assessment Centre is its first programme entry after outreach for helpdesk assessment, social-work planning, and referral.',
    'mes-ekhaya-shelter': 'MES Ekhaya is a current named Johannesburg shelter programme.',
    'mes-ekuthuleni-shelter': 'MES Ekuthuleni is a current named Johannesburg shelter programme.',
    'mes-impilo-shelter': 'MES Impilo combines shelter with professional health and social support for people living with chronic or advanced illness; it is not a general walk-in clinic.',
    'mes-grow-programme': 'MES GROW offers job-and-life rehabilitation, coaching, life skills, work readiness, and paid work opportunities where available.'
  };
  const summary = summaries[resource?.id] || '';
  if (!summary || !includePhone) return summary;
  return `${summary} Call ${resource.phone} to confirm the current entrance, assessment process, schedule, and availability.`;
}

function buildSupportVoiceResponse(resource, timing = 'routine', needs = [], demoEnabled = false, detailRequested = 'recommendation') {
  const purpose = spokenPurpose(resource, needs);
  const isMesOvernightNeed = resource.id === 'mes-johannesburg-navigation' &&
    timing === 'tonight' &&
    needs.some((need) => ['shelter_navigation', 'safe_space_navigation', 'food'].includes(need));
  const timingCaveat = demoEnabled
    ? ''
    : isMesOvernightNeed
    ? ' Call first to check tonight’s bed, meal, and intake options.'
    : ['now', 'tonight'].includes(timing) && !isPublished24Hour(resource)
      ? ` Call first to check what is available ${timing === 'tonight' ? 'tonight' : 'now'}.`
      : '';
  if (resource.routing_mode === 'emergency_phone') {
    return `Call ${resource.phone} now.`;
  }
  if (detailRequested === 'phone' && resource.phone) {
    return `The number for ${resource.name} is ${resource.phone}.`;
  }
  if (detailRequested === 'hours') {
    if (resource.id === 'mes-johannesburg-navigation' || mesProgrammeSpokenSummary(resource, false)) {
      return `I do not have confirmed current public hours for ${resource.name}. Call ${resource.phone} to confirm the right entrance, intake time, and schedule before travelling.`;
    }
    const confirmStep = resource.phone ? ` Call ${resource.phone} to confirm before travelling.` : '';
    return `${resource.name} lists its hours as ${resource.hours}.${confirmStep}`;
  }
  if (['address', 'directions'].includes(detailRequested)) {
    if (resource.address_withheld_for_safety) {
      return `${resource.name}'s address needs to stay private on this call. Call ${resource.phone} for the safest next step.`;
    }
    if (resource.id === 'mes-johannesburg-navigation') {
      return `MES Johannesburg's published branch contact address is ${resource.address}. Call ${resource.phone} first to confirm the right programme or intake entrance before travelling.`;
    }
    if (mesProgrammeSpokenSummary(resource, false) && !resource.address) {
      return `I do not have a current verified public entrance for ${resource.name}. Call ${resource.phone} to confirm the right entrance before travelling.`;
    }
    if (resource.address) {
      const confirmStep = resource.phone ? ` Call ${resource.phone} before travelling.` : '';
      return `${resource.name} is at ${resource.address}.${confirmStep}`;
    }
  }
  if (resource.id === 'mes-johannesburg-navigation' && needs.includes('mes_services')) {
    return `MES Johannesburg includes its Assessment Centre and social work, Ekhaya and Ekuthuleni shelter programmes, Impilo health support, and GROW work readiness. Call ${resource.phone} to confirm the right current entrance and next step.`;
  }
  if (needs.includes('mes_services') && mesProgrammeSpokenSummary(resource, false)) {
    return mesProgrammeSpokenSummary(resource, true);
  }
  if (resource.address_withheld_for_safety && resource.phone) {
    return `${resource.name} can help with ${purpose} on ${resource.phone}.${timingCaveat}`.trim();
  }
  if (resource.routing_mode === 'digital_only') {
    return `If you are 16 or older, Zlto offers a data-free digital wallet for verified learning, tasks, surveys, and community activity. The official sign-up is at zlto dot mobi.`;
  }
  if (resource.id === 'michange-zlto-mes-pathway') {
    return 'Mi-Change uses Zlto with Johannesburg partners for essential-service vouchers delivered through partner pathways such as MES.';
  }
  if (resource.routing_mode === 'phone_only' || resource.routing_mode === 'navigation_only') {
    if (purpose === 'someone to talk to') {
      return `You can call ${resource.name} now on ${resource.phone} for someone to talk to.${timingCaveat}`.trim();
    }
    return `${resource.name} can help with ${purpose} on ${resource.phone}.${timingCaveat}`.trim();
  }
  if (resource.primary_categories.includes('daytime_community_space')) {
    return `${resource.name} is a daytime community place, not a shelter or a guaranteed safe space.${timingCaveat}`.trim();
  }
  const phoneStep = resource.phone ? ` Call ${resource.phone}.` : '';
  return `${resource.name} is the best first place to try for ${purpose}.${phoneStep}${timingCaveat}`.trim();
}

function buildConversationalSupportResponse({
  needs,
  selected,
  selectedCandidates,
  contactMode,
  timing,
  demoEnabled,
  shelterAudienceNeeded,
  specialistShelterNavigation,
  specialistLocationNeeded,
  healthLocationNeeded,
  supportLocationNeeded,
  uncoveredHealthNeeds,
  otherUncoveredNeeds,
  deferredNeeds,
  daytimeSpaceUnavailableTonight,
  coordinationPreference,
  detailRequested
}) {
  const first = selected[0];
  const lead = careLead(needs);
  const allOptionIds = selected.map((option) => option.id);
  const criticalFirst = Boolean(selectedCandidates[0] && needs.some((need) =>
    needPriority(need) >= 90 && resourceScoresForNeed(selectedCandidates[0].resource, need)
  ));

  if (shelterAudienceNeeded && !criticalFirst) {
    return {
      voiceResponse: `${lead} Are you an adult on your own, an adult with children, or under 18?`,
      spokenOptionIds: [],
      pendingOptionIds: allOptionIds,
      nextNeed: needs.find((need) => ['shelter_navigation', 'safe_space_navigation'].includes(need)) || '',
      awaiting: 'audience',
      suggestedDemoAction: ''
    };
  }

  if (supportLocationNeeded && !specialistLocationNeeded && !criticalFirst) {
    return {
      voiceResponse: `${lead} Which suburb or nearest landmark are you near?`,
      spokenOptionIds: [],
      pendingOptionIds: allOptionIds,
      nextNeed: needs[0] || '',
      awaiting: 'location',
      suggestedDemoAction: ''
    };
  }

  const sentences = [lead];
  const supportSentence = first
    ? buildSupportVoiceResponse(first, timing, needs, demoEnabled, detailRequested)
    : '';
  if (supportSentence) sentences.push(supportSentence);
  const phoneWasSpoken = Boolean(first?.phone && supportSentence.includes(first.phone));

  const firstResource = selectedCandidates[0]?.resource;
  const firstCandidate = selectedCandidates[0];
  const handledNow = new Set(firstResource
    ? needs.filter((need) => candidateConversationallyCoversNeed(firstCandidate, need))
    : []);
  const waitingNeeds = needs.filter((need) =>
    !handledNow.has(need) && !uncoveredHealthNeeds.includes(need) && !otherUncoveredNeeds.includes(need)
  );

  if (daytimeSpaceUnavailableTonight) {
    sentences.push('The community spaces I have are for daytime, so we will handle tonight first.');
  }
  if (specialistShelterNavigation) {
    sentences.push('A service navigator will check the right shelter pathway with you.');
  }
  if (waitingNeeds.length || deferredNeeds.length) {
    const pending = [...new Set([...waitingNeeds, ...deferredNeeds])];
    sentences.push(`I'll come back to ${pending.map(humanSupportNeed).join(' and ')} next.`);
  }

  const explicitCoordinationAction = coordinationPreference === 'appointment_request' && first?.demo_actions.includes('appointment_request')
    ? 'appointment_request'
    : coordinationPreference === 'clinician_handoff' && first?.demo_actions.includes('clinician_handoff')
      ? 'clinician_handoff'
      : '';
  const phoneConnectionAvailable = Boolean(
    demoEnabled && phoneWasSpoken && first?.demo_actions.includes('phone_connection')
  );
  let awaiting = '';
  let question = '';
  if (phoneConnectionAvailable || explicitCoordinationAction) {
    // Complete the caller's chosen or immediately useful connection first.
    // Any secondary location/audience detail remains in nextNeed for the next turn.
  } else if (shelterAudienceNeeded) {
    awaiting = 'audience';
    question = 'Are you an adult on your own, an adult with children, or under 18?';
  } else if (specialistLocationNeeded) {
    awaiting = 'location';
    question = 'What suburb or nearest landmark are you near?';
  } else if (healthLocationNeeded || uncoveredHealthNeeds.length) {
    awaiting = 'location';
    const emergencyCheck = ['now', 'tonight'].includes(timing) ? 'If this is a medical emergency, tell me now. ' : '';
    question = `${emergencyCheck}What nearby neighbourhood, clinic, or landmark should I use?`;
  } else if (otherUncoveredNeeds.length) {
    awaiting = contactMode === 'online' ? 'contact_mode' : 'location';
    question = contactMode === 'online'
      ? `I have not found verified online help for ${otherUncoveredNeeds.map(humanSupportNeed).join(' and ')}. Would a phone or in-person route work instead?`
      : `I have not found local help for ${otherUncoveredNeeds.map(humanSupportNeed).join(' and ')} yet. What nearby area should I try next?`;
  } else if (supportLocationNeeded) {
    awaiting = 'location';
    question = 'Which suburb or nearest landmark are you near?';
  }

  const suggestedDemoAction = !question && demoEnabled && first
    ? explicitCoordinationAction ||
      (phoneWasSpoken && first.demo_actions.includes('phone_connection')
        ? 'phone_connection'
        : preferredDemoAction(first, needs, timing, coordinationPreference))
    : '';
  if (!question && suggestedDemoAction) {
    awaiting = 'demo_action_consent';
    question = demoActionQuestion(suggestedDemoAction);
  } else if (!question && first) {
    awaiting = 'detail_preference';
    question = first.contact_modes.length === 1 && first.contact_modes[0] === 'online'
      ? 'Would you like me to repeat the web address slowly?'
      : first.address_withheld_for_safety || (first.contact_modes.length === 1 && first.contact_modes[0] === 'phone')
      ? 'Would you like me to repeat the number slowly?'
      : first.phone
        ? 'Would you like the phone number or directions first?'
        : 'Would you like the directions?';
  }
  if (question) sentences.push(question);

  return {
    voiceResponse: sentences.filter(Boolean).join(' '),
    spokenOptionIds: first ? [first.id] : [],
    pendingOptionIds: allOptionIds.filter((id) => id !== first?.id),
    nextNeed: waitingNeeds[0] || deferredNeeds[0] || uncoveredHealthNeeds[0] || otherUncoveredNeeds[0] || '',
    awaiting,
    suggestedDemoAction
  };
}

function careLead(needs) {
  const set = new Set(needs);
  if (set.has('child_safety')) return "I'm glad you told me. Let's get you the right support.";
  if (['gbv_support', 'sexual_assault_care', 'gbv_healthcare', 'victim_friendly_healthcare', 'abuse_support'].some((need) => set.has(need))) {
    return "I'm glad you told me. We'll take this carefully.";
  }
  if (['mental_health_crisis', 'suicide_support'].some((need) => set.has(need))) {
    return "I'm glad you told me. You don't have to handle this alone.";
  }
  if (['shelter_navigation', 'safe_space_navigation', 'women_children_shelter'].some((need) => set.has(need))) {
    if (['food', 'hygiene', 'clothing'].some((need) => set.has(need))) {
      return "Okay, let's sort out tonight first, then your practical needs.";
    }
    return "I hear you. Let's focus on somewhere safer first.";
  }
  if (['mental_health', 'emotional_support'].some((need) => set.has(need))) {
    return "I'm glad you told me. You don't have to handle this alone.";
  }
  if (['healthcare', 'hospital_care', 'medication'].some((need) => set.has(need))) {
    return "I'm sorry you're dealing with this. Let's find the right care.";
  }
  return "I hear you. Let's take this one step at a time.";
}

function spokenPurpose(resource, needs) {
  const categories = new Set([...(resource.primary_categories || []), ...(resource.navigation_categories || [])]);
  const relevant = needs.filter((need) => categories.has(need) || (need === 'medication' && categories.has('healthcare')));
  if (relevant.some((need) => ['mental_health', 'emotional_support', 'mental_health_crisis', 'suicide_support'].includes(need))) return 'someone to talk to';
  if (relevant.some((need) => ['sexual_assault_care', 'gbv_healthcare', 'victim_friendly_healthcare'].includes(need))) return 'specialist care and support';
  if (relevant.some((need) => ['gbv_support', 'abuse_support'].includes(need))) return 'confidential support';
  if (relevant.includes('child_safety')) return 'child and family safety support';
  if (relevant.includes('women_children_shelter')) return 'women-and-children support';
  if (relevant.some((need) => ['shelter_navigation', 'safe_space_navigation', 'women_children_shelter'].includes(need)) && relevant.includes('food')) return 'shelter assessment and food support';
  if (relevant.some((need) => ['shelter_navigation', 'safe_space_navigation', 'women_children_shelter'].includes(need))) return 'shelter and practical support';
  if (relevant.some((need) => ['healthcare', 'hospital_care', 'medication'].includes(need))) return 'healthcare';
  if (relevant.some((need) => ['food', 'hygiene', 'clothing'].includes(need))) return 'food and practical support';
  if (relevant.includes('substance_use_support')) return 'substance-use support';
  if (relevant.some((need) => ['employment', 'skills_support'].includes(need))) return 'work and skills support';
  if (relevant.includes('mes_services')) return 'MES programmes and services';
  if (relevant.includes('zlto_rewards')) return 'a Zlto earn-and-learn pathway';
  if (relevant.includes('michange_voucher')) return 'the Mi-Change voucher pathway';
  if (relevant.some((need) => ['grants', 'social_relief', 'financial_support'].includes(need))) return 'grant and social-relief help';
  if (relevant.some((need) => ['documentation', 'identity_documents'].includes(need))) return 'document help';
  if (relevant.some((need) => ['legal_support', 'eviction_support'].includes(need))) return 'legal help';
  return 'the support you asked for';
}

function preferredDemoAction(resource, needs, timing, coordinationPreference = 'none') {
  const actions = new Set(resource.demo_actions || []);
  if (needs.includes('zlto_rewards') && actions.has('reward_signup')) return 'reward_signup';
  if (needs.includes('michange_voucher') && actions.has('voucher_pathway')) return 'voucher_pathway';
  if (needs.some((need) => ['mental_health', 'emotional_support', 'mental_health_crisis', 'suicide_support'].includes(need)) && actions.has('warm_handoff')) return 'warm_handoff';
  if (needs.some((need) => ['shelter_navigation', 'safe_space_navigation', 'women_children_shelter'].includes(need)) && actions.has('intake_request')) return 'intake_request';
  if (needs.some((need) => ['healthcare', 'hospital_care', 'medication'].includes(need))) {
    if (coordinationPreference === 'clinician_handoff' && actions.has('clinician_handoff')) return 'clinician_handoff';
    if (coordinationPreference === 'appointment_request' && actions.has('appointment_request')) return 'appointment_request';
    if (actions.has('appointment_request')) return 'appointment_request';
    if (actions.has('clinician_handoff')) return 'clinician_handoff';
  }
  if (needs.includes('substance_use_support') && actions.has('assessment_request')) return 'assessment_request';
  for (const action of ['reward_signup', 'voucher_pathway', 'navigator_handoff', 'availability_check', 'assessment_request', 'appointment_request', 'warm_handoff', 'clinician_handoff']) {
    if (actions.has(action)) return action;
  }
  return '';
}

function demoActionQuestion(action) {
  const questions = {
    appointment_request: 'Let’s book the demo appointment now—shall I start?',
    clinician_handoff: 'Let’s bring up the demo doctor connection now—shall I start?',
    availability_check: 'Let’s complete the demo availability check now—shall I start?',
    intake_request: 'Let’s complete the demo intake check now—shall I start?',
    navigator_handoff: 'Let’s complete the demo redirection now—shall I start?',
    warm_handoff: 'Let’s bring up the demo connection now—shall I start?',
    phone_connection: 'Would you like me to connect you now in the demo?',
    assessment_request: 'Let’s complete the demo assessment now—shall I start?',
    reward_signup: 'Let’s open the demo Zlto reward journey now—shall I start?',
    voucher_pathway: 'Let’s complete the demo voucher pathway check now—shall I start?'
  };
  return questions[action] || 'Would you like me to take the next demo step now?';
}

function humanSupportNeed(value) {
  const labels = {
    shelter_navigation: 'shelter navigation',
    safe_space_navigation: 'a safe-space pathway',
    women_children_shelter: 'women-and-children shelter navigation',
    daytime_community_space: 'a daytime community space',
    mental_health_crisis: 'mental-health crisis support',
    child_safety: 'child-safety support',
    sexual_assault_care: 'sexual-assault healthcare',
    gbv_healthcare: 'gender-based-violence healthcare',
    victim_friendly_healthcare: 'victim-friendly healthcare',
    zlto_rewards: 'Zlto rewards',
    michange_voucher: 'a Mi-Change voucher pathway'
  };
  return labels[value] || String(value || 'that need').replace(/_/g, ' ');
}

function noMatch(error, needs, location, voiceResponse, awaiting = 'support_need') {
  return {
    success: false,
    status: 'clarification_required',
    error,
    needs,
    location: location || '',
    needsMoreLocation: awaiting === 'location',
    needsMoreAudience: false,
    options: [],
    spoken_option_ids: [],
    pending_option_ids: [],
    next_need: needs[0] || '',
    awaiting,
    suggested_demo_action: '',
    voiceResponse
  };
}

function normalizeSearchText(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function selectCallerStatedLocation(args = {}) {
  const rawLocation = String(args.location || '').trim();
  const rawLandmark = String(args.landmark || '').trim();
  const rawArea = String(args.area || '').trim();
  const location = normalizeJoziLocation(rawLocation);
  const landmark = normalizeJoziLocation(rawLandmark);
  const area = normalizeJoziLocation(rawArea);
  const broadLocations = new Set(['johannesburg', 'soweto', 'orlando', 'inner city', 'johannesburg cbd']);

  if (landmark === 'orlando' && broadLocations.has(location)) return rawLandmark;
  if (isUsefulJoziLocation(landmark) && (!isUsefulJoziLocation(location) || broadLocations.has(location))) {
    return rawLandmark;
  }
  if (isUsefulJoziLocation(location)) return rawLocation;
  if (isUsefulJoziLocation(landmark)) return rawLandmark;
  if (isUsefulJoziLocation(area)) return rawArea;
  return rawLocation || rawLandmark || rawArea;
}

function normalizeJoziLocation(value) {
  let normalized = normalizeSearchText(value);
  if (!normalized || [
    'unknown', 'not provided', 'not given', 'unspecified', 'unclear', 'n a', 'na', 'none', 'no location',
    'not sure', 'dont know', 'do not know', 'location unknown'
  ].includes(normalized)) return '';

  normalized = normalized
    .replace(/^(?:i am|im|i m|we are|were|we re)?\s*(?:near|near to|close to|by|around|at|in)\s+(?:the\s+)?/, '')
    .replace(/\s+(?:in\s+)?(?:johannesburg|joburg|jozi|jhb)$/g, '')
    .replace(/\s+(?:in\s+)?soweto$/g, '')
    .replace(/^(joburg|jozi|jhb)(?=\s|$)/, 'johannesburg')
    .replace(/\s+/g, ' ')
    .trim();

  const landmarkAliases = {
    'park station': 'joubert park',
    'johannesburg park station': 'joubert park',
    'gautrain park station': 'joubert park',
    'carlton centre': 'johannesburg cbd',
    'carlton center': 'johannesburg cbd',
    'bree taxi rank': 'johannesburg cbd',
    'mtn taxi rank': 'johannesburg cbd',
    'constitution hill': 'braamfontein'
  };
  if (landmarkAliases[normalized]) return landmarkAliases[normalized];
  if (['cbd', 'central johannesburg', 'johannesburg central'].includes(normalized)) return 'johannesburg cbd';
  return normalized;
}

function isUsefulJoziLocation(value) {
  const normalized = normalizeJoziLocation(value);
  if (!normalized || [
    'johannesburg', 'soweto', 'orlando', 'near me', 'nearby', 'here', 'my area',
    'east', 'west', 'north', 'south', 'central', 'city', 'town', 'the city', 'downtown',
    'park', 'station', 'street', 'road', 'centre', 'center'
  ].includes(normalized)) return false;
  return normalized.length >= 3;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
