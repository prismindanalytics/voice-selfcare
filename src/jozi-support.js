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
    primaryCategories: ['shelter_navigation', 'safe_space_navigation', 'social_support'],
    navigationCategories: ['food', 'hygiene', 'clothing', 'documentation', 'substance_use_support', 'healthcare', 'employment'],
    areas: ['hillbrow', 'joubert park', 'braamfontein', 'berea', 'inner city', 'johannesburg cbd', 'doornfontein', 'jeppestown'],
    contactModes: ['phone', 'in_person'],
    routingMode: 'call_before_visit',
    addressRole: 'service_site',
    address: '16 Kapteijn Street, Hillbrow, Johannesburg, 2038',
    phone: '011 725 6531',
    hours: 'Confirm when calling',
    audiences: ['adult', 'unknown'],
    simulationActions: ['availability_check', 'intake_request', 'navigator_handoff'],
    allowNavigationMatch: true,
    description: 'A current MES contact point for social-work navigation, shelter and safe-space information, ID and reunification help, recovery referrals, basic health referrals, and meals when available.',
    availabilityNote: 'Call before travelling. This listing does not confirm a walk-in intake, a bed, a meal, or any other service today.',
    sourceUrl: 'https://mes.org.za/contact-us/',
    supportingSourceUrl: 'https://www.jozimyjozi.com/projects/mes-community-outreach-restoring-dignity-one-person-at-a-time/',
    sourceCheckedAt: JOZI_DIRECTORY_SOURCE_CHECKED_AT,
    verificationMethod: PUBLIC_SOURCE,
    operationalStatus: 'public_contact_source_checked_live_availability_unconfirmed'
  },
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
    availabilityNote: 'Call first for routine care. A demo appointment or clinician handoff is not a live booking or transfer. For a life-threatening emergency, call emergency services.',
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
    availabilityNote: 'Call first to confirm the needed service and current arrangements. A demo appointment or clinician handoff is not live.',
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
    availabilityNote: 'Call first to confirm the needed service and current arrangements. A demo appointment or clinician handoff is not live.',
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
    availabilityNote: 'Routine public clinic access is listed, but call to confirm the needed service and current queue. A demo appointment or clinician handoff is not live.',
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
    availabilityNote: 'Routine public clinic access is listed, but call to confirm the needed service and current queue. A demo request is not a live appointment.',
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
    availabilityNote: 'Routine public clinic access is listed, but call to confirm the needed service and current queue. A demo request is not a live appointment.',
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
    availabilityNote: 'First ask whether it is safe to speak and share a destination. Preserve the caller’s choice and privacy; a demo handoff is not a live transfer.',
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
    name: 'MES Ekhaya, Ekuthuleni, Linatex, and Othandweni direct shelter doors',
    reason: 'Current MES material confirms programmes, but the direct addresses and intake claims circulate from older material. Route through MES at 16 Kapteijn Street first.',
    sourceUrl: 'https://mes.org.za/youth-adults-at-risk/'
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
  safe_place: 'safe_space_navigation',
  safe_space: 'safe_space_navigation',
  safe_community_space: 'daytime_community_space',
  community_space: 'daytime_community_space',
  daytime_space: 'daytime_community_space',
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
  id_help: 'documentation',
  identity_document: 'identity_documents',
  health: 'healthcare',
  clinic: 'healthcare',
  gbv: 'gbv_support',
  domestic_violence: 'gbv_support',
  child_support: 'child_safety',
  women_and_children: 'women_children_shelter',
  grants_and_relief: ['grants', 'social_relief'],
  legal: 'legal_support',
  eviction: 'eviction_support'
};

export const JOZI_SUPPORT_CATEGORIES = [
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
You are the Jozi support line: a calm, voice-first doorway to source-checked Johannesburg health and community support.

You can help with mental wellbeing, social support, shelter and safe-space navigation, food and hygiene navigation, clinics, substance-use support, grants, documents, work support, legal help, family and child safety, GBV support, and emergencies.

SAFETY AND DIGNITY
- Say "people experiencing homelessness" or "people with low or no income". Never call a caller low-LSM or assume they are homeless.
- Start by asking what would help most. Ask only one short question at a time.
- Before ordinary routing, ask one brief question about immediate danger, severe medical symptoms, or whether the person might harm themselves.
- For immediate danger, medical emergency, imminent self-harm, overdose, or violence now, use the emergency tool immediately. Ask for a suburb or nearest landmark, not an exact sleeping location.
- For GBV, first ask whether it is safe to speak. Do not promise police involvement, text the caller, or disclose their location without consent.
- A child or family must never be routed to an adult shelter pathway.
- Do not ask for immigration status, income bracket, or ID unless that detail is strictly necessary for the caller's chosen service.

ROUTING
- Use find_support_services for all community-support destinations. Never invent a provider, phone number, address, hours, bed, meal, or eligibility rule.
- Clarify what "safe space" means: danger now, somewhere for tonight, a daytime support point, child/family safety, GBV support, or simply someone to talk to.
- Give at most two options. State the name, purpose, telephone number, and address only when the directory marks it as a service site.
- Always repeat the directory caveat: published details were source-checked, but hours, intake, eligibility, and availability can change; call before travelling.
- The City policy requires social-worker assessment and referral for City-managed or contracted shelter placement. Do not assess eligibility, book a real bed, or promise availability.
- If the directory has no suitable local option, say so plainly and offer the City navigation route. Do not substitute a distant physical destination.

DEMO COORDINATION
- coordinate_support_demo is a presentation-only simulation. Use it only after the caller chooses a returned resource.
- Say "For this demonstration, a simulated request has been prepared" or "the next screen shows how a doctor handoff would work," immediately followed by "Nothing has been sent, booked, checked, or transferred live."
- Never present a demo reference, appointment, clinician handoff, shelter check, assessment, or transfer as live.

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
  if (normalized === 'jozi') {
    return demoEnabled
      ? 'Hello, you have reached the Jozi support demonstration line. I can show source-checked support routes, but I cannot make a live booking or transfer. If anyone is in immediate danger, please tell me now. What would help most today?'
      : 'Hello, you have reached the Jozi support line. I can help with mental wellbeing, social support, safe-space and shelter navigation, clinics, and practical help. If anyone is in immediate danger, please tell me now. What would help most today?';
  }
  return demoEnabled
    ? 'Hello, you have reached the Jozi health and support demonstration line. I can show source-checked health and support routes, but I cannot make a live booking or transfer. If anyone is in immediate danger, please tell me now. What would help most today?'
    : 'Hello, you have reached the Jozi health and support line. I can help with health, mental wellbeing, social support, safe-space and shelter navigation, and practical help. If anyone is in immediate danger, please tell me now. What would help most today?';
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
  const allowedRoutingModes = new Set(['phone_only', 'call_before_visit', 'source_listed_walk_in', 'emergency_phone', 'navigation_only']);
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
  const location = normalizeJoziLocation(args.location || args.landmark || args.area || '');
  const audience = normalizeAudience(args.audience || args.caller_type);
  const contactMode = normalizeContactMode(args.contact_mode || args.contactMode);
  const timing = normalizeTiming(args.timing || args.needed_when || args.urgency);
  const statedSafetyContext = normalizeSupportCategory(args.safety_context || args.safetyContext || '');
  const safetyContext = deriveUrgentSafetyContext(statedSafetyContext, needs);

  if (safetyContext) {
    return buildUrgentEscalation({ safetyContext, location, audience, resources, phoneType: args.phone_type || args.phoneType });
  }

  if (!needs.length) {
    return noMatch('support_need_required', needs, args.location, 'What kind of help would be most useful: somewhere safe, someone to talk to, food, a clinic, documents, work, or another need?');
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
      'The curated community venues are daytime spaces, not overnight shelter. Do you need somewhere for tonight, immediate safety help, or a daytime place tomorrow?'
    );
  }

  const usefulLocation = isUsefulJoziLocation(location);
  const healthNeeds = ['healthcare', 'medication', 'hospital_care'];
  const healthLocationNeeded = !usefulLocation && needs.some((need) => healthNeeds.includes(need));
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
  const specialistLocationNeeded = needsSpecialistCare && !hasLocalSpecialist;
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

  if (!matched.length) {
    if (healthLocationNeeded) {
      return noMatch(
        'specific_location_required',
        needs,
        args.location,
        `${['now', 'tonight'].includes(timing) ? 'If this is a medical emergency, tell me now. ' : ''}Which Johannesburg or Soweto neighbourhood, clinic name, or nearest landmark should I use? I will not guess a distant clinic.`
      );
    }
    if (needs.includes('women_children_shelter')) {
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
          voiceResponse: `I cannot confirm a suitable women-and-children shelter in that area from this directory. ${buildSupportVoiceResponse(option, timing)}`
        };
      }
    }
    const fallback = resources.find((resource) => resource.id === 'coj-general-services');
    const fallbackOption = fallback && needs.some((need) => ['shelter_navigation', 'safe_space_navigation', 'social_support', 'social_relief'].includes(need))
      ? [publicResource(fallback)]
      : [];
    return {
      success: false,
      status: 'no_verified_local_match',
      error: 'verified_support_not_found',
      needs,
      location: args.location || '',
      timing,
      needsMoreLocation: !usefulLocation,
      options: fallbackOption,
      voiceResponse: fallbackOption.length
        ? `I cannot confirm a suitable local destination from this directory. ${buildSupportVoiceResponse(fallbackOption[0], timing)}`
        : 'I cannot confirm a suitable service from the curated Jozi directory yet. I can try another type of support or a different area.'
    };
  }

  const maxOptions = clamp(Number(args.max_options) || 2, 1, 2);
  const selectedCandidates = selectDiverseCandidates(matched, needs, maxOptions);
  const selected = selectedCandidates.map(({ resource }) => publicResource(resource));
  const spokenNeeds = maximumCoveredNeeds(selectedCandidates, needs);
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
  const voiceNotices = [];
  if (shelterAudienceNeeded) {
    voiceNotices.push('Before choosing a shelter or safe-space pathway, are you an adult alone, an adult with children, or under 18? I will not route an unknown-age caller to an adult shelter.');
  }
  if (specialistShelterNavigation) {
    voiceNotices.push('I cannot confirm a suitable local women-and-children shelter from this directory, so this is a social-service navigation route, not a shelter place.');
  }
  if (specialistLocationNeeded) {
    voiceNotices.push('I need a suburb or nearest landmark before suggesting a physical specialist destination. I can give a phone-first specialist route now.');
  } else if (healthLocationNeeded) {
    voiceNotices.push(`${['now', 'tonight'].includes(timing) ? 'If this is a medical emergency, tell me now. ' : ''}Which Johannesburg or Soweto neighbourhood, clinic name, or nearest landmark should I use? I will not guess a distant clinic.`);
  } else if (uncoveredHealthNeeds.length) {
    voiceNotices.push(`${['now', 'tonight'].includes(timing) ? 'If this is a medical emergency, tell me now. ' : ''}I cannot confirm a suitable local clinic or hospital route for that area from this directory. Tell me another nearby neighbourhood, clinic name, or landmark and I will not guess a distant service.`);
  } else if (supportLocationNeeded) {
    voiceNotices.push('Which suburb or nearest landmark should I use? I will not guess a physical support destination.');
  }
  const otherUncoveredNeeds = uncoveredNeeds.filter((need) => !healthNeeds.includes(need));
  if (otherUncoveredNeeds.length) {
    voiceNotices.push(`I could not confirm a suitable local route for ${otherUncoveredNeeds.map(humanSupportNeed).join(' and ')} from this directory. I can try a different area or help with that need next.`);
  }
  if (deferredNeeds.length) {
    voiceNotices.push(`I have not yet read a route for ${deferredNeeds.map(humanSupportNeed).join(' and ')} because this voice response is limited to two routes. I can handle that next.`);
  }
  if (daytimeSpaceUnavailableTonight) {
    voiceNotices.push('The curated community venues are daytime spaces, not overnight shelter.');
  }
  const phoneAlternativeIncluded = contactMode === 'in_person' && selected.some((option) =>
    option.contact_modes.length === 1 && option.contact_modes[0] === 'phone'
  );
  if (phoneAlternativeIncluded) {
    voiceNotices.push('I could not verify an in-person route for every need, so one of these routes is phone support.');
  }
  voiceNotices.push(buildSupportVoiceResponses(selected, timing));
  const onlyPhoneAlternatives = contactMode === 'in_person' && selected.length > 0 && selected.every((option) =>
    option.contact_modes.length === 1 && option.contact_modes[0] === 'phone'
  );
  const partialMatch = uncoveredNeeds.length > 0 || deferredNeeds.length > 0;
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
    location: args.location || '',
    audience,
    timing,
    needsMoreLocation,
    needsMoreAudience: shelterAudienceNeeded,
    uncovered_needs: uncoveredNeeds,
    deferred_needs: deferredNeeds,
    options: selected,
    selected: selected[0],
    source_checked_at: selected[0].source_checked_at,
    availability_confirmed: false,
    phone_alternative_included: phoneAlternativeIncluded,
    phoneAlternatives: onlyPhoneAlternatives,
    voiceResponse: voiceNotices.join(' ')
  };
}

export function coordinateJoziSupport(args = {}, resources = JOZI_SUPPORT_RESOURCES) {
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

  const action = String(args.action || '').trim().toLowerCase();
  if (!resource.simulationActions.includes(action)) {
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
    appointment_request: `For this demonstration, a simulated appointment request for ${resource.name} at ${when} is prepared, reference ${reference}. Nothing has been sent, booked, or confirmed with the service.`,
    clinician_handoff: `For this demonstration, the next screen shows how a doctor would join shortly, reference ${reference}. No live doctor has been contacted or connected.`,
    availability_check: `For this demonstration, a simulated availability check with ${resource.name} is prepared, reference ${reference}. No live availability was checked and no bed, meal, or service is reserved.`,
    intake_request: `For this demonstration, a simulated intake request with ${resource.name} is prepared, reference ${reference}. Nothing has been sent and no intake or shelter place is confirmed.`,
    navigator_handoff: `For this demonstration, a simulated navigator handoff to ${resource.name} is prepared, reference ${reference}. No live transfer or request has occurred.`,
    warm_handoff: `For this demonstration, the next screen shows how a warm handoff to ${resource.name} would work, reference ${reference}. No live transfer has occurred.`,
    assessment_request: `For this demonstration, a simulated assessment request with ${resource.name} is prepared, reference ${reference}. Nothing has been sent and no assessment is confirmed.`
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
  const landmark = location ? 'Give the operator your nearest landmark' : 'Ask the caller for the nearest landmark';
  return {
    success: true,
    status: 'urgent_escalation',
    emergency: true,
    safety_context: safetyContext,
    options,
    selected: first,
    availability_confirmed: false,
    voiceResponse: `${first ? `Call ${first.phone} now. ` : ''}${landmark}, say what happened, and stay on the line. Do not wait for an ordinary service lookup.`
  };
}

function normalizeNeeds(args) {
  const raw = args.needs || args.categories || args.service_types || [args.service_type || args.category || args.need_type];
  const values = Array.isArray(raw) ? raw : String(raw || '').split(',');
  return [...new Set(values.flatMap(expandSupportCategory).filter(Boolean))];
}

function expandSupportCategory(value) {
  const normalized = normalizeSearchText(value || '').replace(/\s+/g, '_');
  const mapped = SUPPORT_CATEGORY_ALIASES[normalized];
  if (Array.isArray(mapped)) return mapped;
  return [mapped || normalized];
}

function normalizeAudience(value) {
  const normalized = normalizeSupportCategory(value || 'unknown');
  return ['adult', 'family', 'child', 'older_person', 'person_with_disability', 'unknown'].includes(normalized) ? normalized : 'unknown';
}

function normalizeContactMode(value) {
  const normalized = normalizeSupportCategory(value || 'either');
  return ['phone', 'in_person', 'either'].includes(normalized) ? normalized : 'either';
}

function normalizeTiming(value) {
  const normalized = normalizeSupportCategory(value || 'routine');
  if (['now', 'immediate'].includes(normalized)) return 'now';
  return ['today', 'tonight', 'routine'].includes(normalized) ? normalized : 'routine';
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

    if (['shelter_navigation', 'safe_space_navigation', 'women_children_shelter', 'social_support', 'social_relief'].includes(need)) {
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

function candidateMatchesNeed(candidate, need) {
  return candidate.coveredNeeds?.includes(need) || resourceMatchesNeed(candidate.resource, need);
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
  for (const need of needs) {
    if (resource.primaryCategories.includes(need)) score += 30;
    else if (need === 'medication' && resource.primaryCategories.includes('healthcare')) score += 18;
    else if (['healthcare', 'medication'].includes(need) && resource.id === 'mes-johannesburg-navigation') continue;
    else if (resource.allowNavigationMatch && resource.navigationCategories.includes(need)) score += 9;
  }
  if (score > 0) score += Number(resource.routingPriority || 0);
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
  const vagueFragments = new Set(['east', 'west', 'north', 'south', 'central', 'city', 'town', 'the city', 'downtown']);
  if (vagueFragments.has(location)) return false;
  if (location === normalizedArea) return true;
  if (location.split(' ').length < 2 || normalizedArea.split(' ').length < 2) return false;
  return location.includes(normalizedArea) || normalizedArea.includes(location);
}

function publicResource(resource) {
  const sensitiveAddress = resource.addressSharing === 'after_safe_to_share';
  const address = sensitiveAddress ? '' : (resource.address || '');
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
    hours: resource.hours || 'Confirm when calling',
    audiences: resource.audiences,
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

function buildSupportVoiceResponse(resource, timing = 'routine') {
  const timingCaveat = ['now', 'tonight'].includes(timing) && !isPublished24Hour(resource)
    ? `I cannot verify that ${resource.name} is open or reachable ${timing === 'tonight' ? 'tonight' : 'right now'}. `
    : '';
  if (resource.routing_mode === 'emergency_phone') {
    return `${timingCaveat}Call ${resource.phone} now. ${resource.availability_note}`.trim();
  }
  if (resource.routing_mode === 'phone_only' || resource.routing_mode === 'navigation_only') {
    return `${timingCaveat}Call ${resource.name} on ${resource.phone}. ${resource.description} ${resource.availability_note}`.trim();
  }
  if (resource.routing_mode === 'source_listed_walk_in') {
    if (resource.address_withheld_for_safety) {
      return `${timingCaveat}Call ${resource.name} on ${resource.phone}. For safety, this voice line does not read out the service address. ${resource.availability_note}`.trim();
    }
    if (!resource.phone) {
      return `${timingCaveat}${resource.name} is source-listed at ${resource.address}. No direct phone number is published in the City directory. ${resource.availability_note}`.trim();
    }
    return `${timingCaveat}${resource.name} is source-listed at ${resource.address}. Call ${resource.phone} to confirm before travelling. ${resource.availability_note}`.trim();
  }
  if (resource.address_withheld_for_safety) {
    return `${timingCaveat}Call ${resource.name} on ${resource.phone} before visiting. For safety, this voice line does not read out the service address. ${resource.availability_note}`.trim();
  }
  return `${timingCaveat}Call ${resource.name} on ${resource.phone} before visiting. Its listed ${humanAddressRole(resource.address_role)} is ${resource.address}. ${resource.availability_note}`.trim();
}

function buildSupportVoiceResponses(resources, timing = 'routine') {
  const options = (resources || []).filter(Boolean);
  if (!options.length) return '';
  if (options.length === 1) return buildSupportVoiceResponse(options[0], timing);
  return options
    .map((resource, index) => `${index === 0 ? 'First route' : 'Another route'}: ${buildSupportVoiceResponse(resource, timing)}`)
    .join(' ');
}

function humanAddressRole(value) {
  if (value === 'health_service_site') return 'health-service address';
  if (value === 'public_service_office') return 'public-service office';
  return 'service address';
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
    victim_friendly_healthcare: 'victim-friendly healthcare'
  };
  return labels[value] || String(value || 'that need').replace(/_/g, ' ');
}

function noMatch(error, needs, location, voiceResponse) {
  return {
    success: false,
    status: 'clarification_required',
    error,
    needs,
    location: location || '',
    options: [],
    voiceResponse
  };
}

function normalizeSearchText(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeJoziLocation(value) {
  const normalized = normalizeSearchText(value);
  return normalized
    .replace(/^(joburg|jozi|jhb)(?=\s|$)/, 'johannesburg')
    .replace(/\s+/g, ' ')
    .trim();
}

function isUsefulJoziLocation(value) {
  const normalized = normalizeJoziLocation(value);
  if (!normalized || [
    'johannesburg', 'soweto', 'orlando', 'near me', 'nearby', 'here', 'my area',
    'east', 'west', 'north', 'south', 'central', 'city', 'town', 'the city', 'downtown'
  ].includes(normalized)) return false;
  return normalized.length >= 3;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
