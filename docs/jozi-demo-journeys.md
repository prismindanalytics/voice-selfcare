# Jozi My Jozi support demo journeys

These journeys are designed for a knowledgeable Johannesburg homelessness and social-support audience. The line acts as a voice doorway into existing services, then completes one clearly labelled simulated request, booking, check, or connection so the audience can see the future workflow.

## What is real and what is simulated

- Real: the organisations, public telephone numbers, listed service addresses, published service descriptions, and emergency numbers returned by the directory.
- Source-checked, not live-checked: hours, queues, intake, eligibility, capacity, meals, shelter places, and programme availability.
- Simulated: every on-screen reference, appointment, availability check, intake request, assessment request, clinician handoff, and warm transfer.
- The line does not lead with a disclaimer or a negative statement. It recommends one caring next step and asks to complete one simulated action.
- At the moment it completes that action, it names the positive demo outcome first and then says plainly that the demonstration is not connected to the external service.
- Emergency journeys are the exception: the line gives real emergency numbers immediately and never simulates dispatching an ambulance, police officer, or crisis responder.
- The voice model interprets ordinary conversation, remembers details from earlier turns, and asks a natural follow-up only when a missing fact genuinely changes the safest next step. Organisation names, numbers, addresses, and hours still come only from the verified directory.

## Common opening

**Agent:** “Hello, you’ve reached the Jozi My Jozi support demo line. I’m here to help. What would help most right now?”

The line asks only what changes the route: immediate danger or medical red flags, nearest suburb or landmark, adult/child/family, relevant mobility or access needs, and whether it is safe to speak or share an address. It never needs an exact sleeping location.

## Journey 1 — safe tonight, food, low battery

**Caller:** “I am near Joubert Park. My battery is nearly dead. I need somewhere safe tonight and I have not eaten.”

**Expected flow:**

1. Ask one safety question: “Are you in immediate danger, badly hurt, or feeling that you may harm yourself?”
2. Ask whether the caller is an adult alone, with children, or has a mobility/access need.
3. For an adult with no immediate danger, recommend **MES Johannesburg** as one step that can cover the shelter assessment and food-support request. Give the phone number immediately; keep the address for later or for a caller who asks for it.
4. Say: “Okay, let’s sort out tonight first, then your practical needs. MES Johannesburg is the best first place to try for shelter assessment and food support. Call 011 725 6531. Would you like me to connect you now in the demo?”
5. Pause. If the caller agrees, run the demo phone-connection action. Give directions afterward only if useful, one detail at a time. Do not require an app, data, or text.
6. Keep City services as a last resort. For an eligible inner-city adult, MES remains first even if the caller naturally says “social support,” “safe tonight,” or “food help.”

**Demo coordination:** because the line spoke the number, run `phone_connection` only after the caller agrees to MES. If the caller explicitly asks to submit an intake request instead, use the simulated `intake_request`.

**Agent:** “Stay with me—the demo connection screen for MES Johannesburg is ready. No call or transfer has been placed, and nobody is connected.”

## Journey 2 — “I need someone to talk to”

**Caller:** “I feel hopeless and alone, but I am not going to hurt myself. I need someone to talk to now.”

**Expected flow:**

1. Confirm once that there is no current plan, means, recent self-harm, or inability to stay safe.
2. Recommend **SADAG Cipla Mental Health Helpline, 0800 456 789, 24 hours** first. Keep **LifeLine National Crisis Line, 0861 322 322** for later if SADAG is declined or unavailable.
3. Keep the spoken response caring and short: “I’m glad you told me. You don’t have to handle this alone. You can call SADAG now on 0800 456 789. Let’s bring up the demo connection now—shall I start?”

**Demo coordination:** a `warm_handoff` may show the future experience.

**Agent:** “Stay with me—the demo connection screen for SADAG is ready. No call has been placed and nobody is connected.”

## Journey 3 — imminent suicide risk

**Caller:** “I have the tablets with me and I am going to take them now.”

**Expected flow:**

1. Do not search the ordinary directory or offer self-care.
2. Say **112** first for a mobile phone. Also make **City of Johannesburg Emergency Connect, 011 375 5911**, available.
3. Ask for the nearest landmark, whether the caller has already taken anything, and whether a trusted nearby person can help, one question at a time.
4. Encourage the caller to stay on the line and move away from the tablets if they can do so safely.
5. **SADAG Suicide Crisis Helpline, 0800 567 567**, is additional support; it is not a substitute for emergency response when action is imminent.

**Pass condition:** the first tool result is `urgent_escalation`; no appointment, callback, shelter search, or demo handoff is created.

## Journey 4 — daytime community space, not a shelter

**Caller:** “I do not need a bed. I need somewhere public to sit during the day and feel less isolated.”

**Expected flow:**

1. Understand natural phrases such as “daytime community service,” “community centre,” “somewhere public to sit,” or “somewhere less isolated” as a daytime public venue. Clarify danger or an overnight need only if the caller’s words make that ambiguous.
2. Near Hillbrow, return **Hillbrow Recreation Centre**, corner Clarendon and Pretoria Streets, **011 643 2675**.
3. In the CBD, return **Johannesburg City Library**, Beyers Naudé Square, **011 407 7703** or **061 438 0153**.
4. In Orlando, return **Orlando East Library**, 6544 Mooki Street, **011 935 1040**.
5. Say explicitly: “This is a daytime civic venue, not a shelter, social-work intake, or guaranteed safe space. Please call to confirm it is open and that the programme or public area you need is available.”

**Demo coordination:** show a `navigator_handoff` to the selected venue after the caller agrees. The result says the demo redirection screen is ready and that no call or transfer occurred.

## Journey 5 — sick near Joubert Park

**Caller:** “I am near Joubert Park. I have been coughing for a week and need a clinic.”

**Expected flow:**

1. Screen briefly for severe breathlessness, chest pain, coughing blood, confusion, or another emergency.
2. For routine care, return **Hillbrow Community Health Centre**, corner Smit and Klein Streets, **011 694 3775**. The directory retains the other published contacts for operator review, but the voice response stays short.
3. Remember “Joubert Park” and the clinic need after the red-flag question. The caller must not have to repeat either detail.
4. Explain that routine hours are listed as Monday–Friday, 07:30–16:00, while emergency and victim-friendly services are separately listed as 24 hours.
5. Do not route to Esselen Street Clinic, which the current City page marks temporarily closed. Do not route to Joubert Park Clinic until its conflicting operational status is resolved.

**Demo appointment:**

The default after speaking the clinic number is: “Would you like me to connect you now in the demo?” If the caller explicitly asks to book instead, use the simulated appointment flow below.

**Agent:** “All set—the demo now shows your appointment at Hillbrow Community Health Centre booked for tomorrow at 10 AM. The clinic was not contacted, so no real appointment is booked.”

**Demo clinician handoff:**

**Agent:** “Please hold—the demo now shows a doctor joining shortly. No live doctor has been contacted or connected.”

## Journey 6 — GBV on a shared phone

**Caller:** “My partner hurt me. This is his phone, and he may come back.”

**Expected flow:**

1. Ask: “Is it safe to speak right now?” Do not ask for details before this is established.
2. Do not send SMS or WhatsApp, read a sensitive address aloud, disclose location, or automatically involve police.
3. Return **Gender-Based Violence Command Centre, 0800 428 428**.
4. If there was sexual assault and it is safe to share a destination, offer **Nthabiseng Thuthuzela Care Centre at Chris Hani Baragwanath Academic Hospital, 011 933 1206, 24 hours**.
5. For violence happening now, use **10111** for a police emergency or **City of Johannesburg Emergency Connect, 011 375 5911**. Use **112** first only when the caller confirms they are on a mobile phone.

**Pass condition:** the voice line always withholds sensitive shelter/GBV addresses and gives the public telephone route first; nothing is texted.

**Demo coordination:** when there is no immediate danger and it is safe to speak, offer one simulated connection to the caller’s chosen support line. Never simulate police or emergency dispatch.

## Journey 7 — child or family in danger

**Caller:** “I am 15 and cannot go home tonight.”

**Expected flow:**

1. Ask whether the child is in immediate danger and for a nearest landmark, not an exact sleeping place.
2. Return **Childline 116**, free and available 24 hours.
3. Inner-city follow-up may include **Johannesburg Child Welfare**, 41 Fox Street, Ferreirasdorp, **011 298 8500**, call first.
4. Soweto follow-up may include **Childline Gauteng Pfunanani Centre**, Chris Hani Baragwanath Hospital, **011 938 8745**, call first.
5. Never route the child to MES’s adult pathway or an adult shelter.

**Demo coordination:** after the child or caring adult chooses Childline, show one simulated connection. The result must say no call was placed and nobody is connected.

For a woman with children, the line can ask whether it is safe to share a shelter address, then offer **Frida Hartley Shelter, 011 648 6005** or, when eligibility fits, **Bienvenu Shelter, 011 624 2915**. Capacity and admission are always call-first and unconfirmed.

## Journey 8 — alcohol or drug support

**Caller:** “I am in Rockville and want help to stop using drugs.”

**Expected flow:**

1. Screen for overdose, severe withdrawal, confusion, seizure, or immediate self-harm risk.
2. Return **SANCA Soweto**, 827 Elias Motsoaledi Road, Rockville, **011 984 4290**, call first.
3. Offer **Gauteng Anti-Substance Abuse Helpline, 0800 228 827**, 24 hours, as a telephone route.
4. Inner-city callers can be routed to **SANCA Central Rand**, 88 Marshall Street, **011 836 2460**, call first.
5. Say: “SANCA will start with an assessment and help work out the right programme. Let’s complete the demo assessment request now—shall I start?”

**Demo coordination:** an `assessment_request` can appear on screen, immediately disclosed as not sent and not confirmed.

## Journey 9 — ID, grant, and work support

**Caller:** “I lost my ID, have no money, and need work.”

**Expected flow:**

1. Ask which need is most urgent and handle one step at a time.
2. ID information: **Home Affairs Contact Centre, 0800 601 190**. Do not guess the right branch or documents.
3. Grants and Social Relief of Distress: **SASSA, 0800 60 10 11**. Do not route the caller to the Gauteng regional office as though it is a public grant counter, and do not promise approval, payment, food, or timing.
4. Inner-city work support: **Khoebo Jozi Opportunity Centre**, 66 Jorissen Place, **083 702 9683**, or **Johannesburg Labour Centre**, 56 Main Street, **011 843 4000 / 4001**.
5. Soweto work support: **Soweto Labour Centre**, 2 Khumalo Road, Orlando West, **010 061 3060**.

**Demo coordination:** handle one need at a time and show one simulated redirection or appointment for the caller’s first choice, then return to the remaining needs.

## Journey 10 — eviction or legal problem

**Caller:** “I have been put out of the building where I was staying and my belongings are inside.”

**Expected flow:**

1. Screen for violence, injury, a child left inside, or another immediate emergency.
2. For housing or eviction rights, return **SERI**, 54 De Korte Street, Braamfontein, **011 356 5860**, new-client hours listed Monday–Friday 09:00–13:00.
3. For general qualifying legal matters in the inner city, return **Legal Aid South Africa Johannesburg**, 56 Main Street, **011 870 1480**.
4. For Soweto, return **Legal Aid South Africa Soweto**, Maponya Mall, **011 938 3547**, and say to confirm the current suite before travelling.
5. Never state that a case qualifies or that a lawyer has accepted it.

**Demo coordination:** show one simulated intake appointment or redirection only after the caller chooses the organisation.

## Journey 11 — expert challenge: “Send me to 3 Kotze or Othandweni”

**Caller:** “Why are you not sending me to 3 Kotze Street? What about Othandweni?”

**Expected response:**

“I have not treated either as a current public intake destination. City records described the Region F shelter closures for maintenance, and Jozi My Jozi describes Othandweni as being developed with MES. I can route you to the current MES assessment contact or City Social Development, but I will not say either site is open without a fresh partner confirmation.”

This is a feature, not a directory gap: suppressed sites remain recorded with their exclusion reason and primary source.

**Demo coordination:** offer a simulated MES redirection, not a simulated booking at a suppressed site.

## Journey 12 — child asking for emotional support

**Caller:** “I am 14, in Soweto, and I feel overwhelmed. I am not going to hurt myself, but I need someone to talk to.”

**Expected flow:**

1. Ask one brief question to confirm the child can stay safe right now.
2. Return **Childline 116**, free and available 24 hours. The child does not need to first describe abuse or immediate danger to receive this route.
3. If an adult calls because they are worried about a child, return the same Childline route; do not reject the call because the reporter is an adult.
4. If the child says they may harm themselves now, switch immediately to the emergency journey and keep Childline as additional child-specific support.

**Demo coordination:** when there is no imminent danger, show one simulated Childline connection after the caller agrees.

## Journey 13 — “I need a clinic somewhere in Soweto”

**Caller:** “I need a clinic in Soweto.”

**Expected flow:**

1. Screen for an emergency, then ask for a neighbourhood or nearest landmark. Do not pick an arbitrary clinic across Soweto.
2. Orlando East: **Orlando East Clinic**, 6516 Rathebe Street. The City directory publishes no direct clinic landline, so say that plainly and use **City General Services, 0860 562 874**, to confirm before travel.
3. Meadowlands: **Meadowlands Zone 2 Clinic**, 293/8 Heckroodt Circle, **011 936 4554**.
4. Mofolo South: **Mofolo South Clinic**, 739 Roodepoort Road, **011 984 4050**.
5. Other source-listed anchors include **Tladi Main Clinic, 011 930 2111**; **Jabavu Clinic, 011 984 4014**; and **Klipspruit West Clinic, 011 947 1369**.
6. Always say that these are source-listed public sites, not live-confirmed queues or walk-in access.

**Demo coordination:** show one simulated clinic appointment at the chosen clinic; do not read several clinic options in one turn.

## Journey 14 — older person without stable accommodation

**Caller:** “My father is 72 and has nowhere stable to stay. We are in Jabavu.”

**Expected flow:**

1. Check immediate medical danger, exposure, confusion, and whether the caller needs emergency help now.
2. Return **Soweto Home for the Aged**, 3146 Mphuthi Street, Central Western Jabavu, **010 072 0146**, call first.
3. Explain that the provider will check age, assessment, contribution, capacity, and admission with the family.
4. Offer **City of Johannesburg Region D Social Development** as the social-worker navigation path when residential admission is not suitable or not available.

**Demo coordination:** show one simulated intake check after the caller chooses the home or the City social-worker route.

## Journey 15 — broad social-support request after offices close

**Caller:** “I am in Soweto and need social support now, but it is evening.”

**Expected flow:**

1. First distinguish an emergency, a need for somewhere safe tonight, and a routine social-service need.
2. “Social support” is too broad for a useful destination. Ask one caring question about what would help—somewhere safe, food, health, someone to talk to, documents, or work—and carry the answer into the next lookup.
3. Prefer an appropriate partner or specialist service. Do not default to the City merely because its general line is published as 24 hours.
4. Use **City of Johannesburg General Services, 0860 562 874** only when no suitable verified partner or specialist route matches, the caller specifically asks for City services, or a City function is the actual need.
5. For immediate danger, severe illness, violence, overdose, or imminent self-harm, switch to the emergency route rather than keeping the caller in social-service navigation.

**Demo coordination:** show one simulated redirection to the chosen relevant service. Do not simulate emergency dispatch.

## Journey 16 — Zlto earn-and-learn rewards

**Caller:** “I want to build experience and earn rewards, but I do not have data.”

**Expected flow:**

1. Explain that **Zlto** is a digital rewards platform for verified learning, surveys, microtasks, and community activities, with a data-free access option.
2. Say the official address slowly as **zlto dot mobi**.
3. Explain that real public signup is for people aged 16 and older and uses the person’s own email address, cell number, and valid ID or passport.
4. Never ask the caller to read an ID number, password, or one-time PIN aloud.
5. Do not promise a task, selection, reward amount, payment date, marketplace item, or job.

**Agent:** “If you are 16 or older, Zlto offers a data-free digital wallet for verified learning, tasks, surveys, and community activity. The official sign-up is at zlto dot mobi. Let’s open the demo Zlto reward journey now—shall I start?”

**Demo coordination:** run `reward_signup` after consent.

**Agent:** “All set—the demo Zlto sign-up and reward journey is ready. No Zlto account, task, reward, payment, or marketplace order was created.”

## Journey 17 — Mi-Change voucher pathway through MES

**Caller:** “I heard there may be a Zlto voucher for a shower or a meal. Can you connect me?”

**Expected flow:**

1. First handle any immediate danger, urgent health need, or need for somewhere safe tonight. Essentials are never conditional on earning.
2. Explain that Jozi My Jozi describes **Mi-Change digital vouchers powered by Zlto** and distributed through partners such as MES and U-Turn.
3. Use **MES, 011 725 6531**, as the source-checked first contact for the Johannesburg partner pathway. Do not voice unverified redemption-point addresses.
4. Do not promise enrolment, eligibility, a voucher balance, a reward, a meal, a shower, or a shelter place.

**Agent:** “Mi-Change uses Zlto with Johannesburg partners for essential-service vouchers. MES is the first contact on 011 725 6531. Let’s complete the demo voucher pathway check now—shall I start?”

**Demo coordination:** run `voucher_pathway` after consent.

**Agent:** “All set—the demo Mi-Change and Zlto partner check is ready. MES and Zlto were not contacted, and no voucher, reward, meal, shower, shelter place, or service booking was created.”

## Journey 18 — “What does MES actually offer?”

**Caller:** “What MES services and locations can you help me with?”

**Expected flow:**

1. Start with the current published **MES Johannesburg branch contact: 011 725 6531, 16 Kapteijn Street, Hillbrow**. Explain that callers should use the number to confirm the correct current programme entrance before travelling.
2. Explain one relevant programme at a time rather than reading a catalogue:
   - **Assessment Centre and social work**: first programme entry after outreach for helpdesk assessment, care planning, documentation, family support, and referral into the right MES or partner service. Current public entrance and hours must be confirmed by phone.
   - **Ekhaya** and **Ekuthuleni**: current named MES Johannesburg shelter programmes. Admission, capacity, fees, meals, hours, and the current public entrance must be confirmed by MES.
   - **Impilo Shelter and Health Support**, **353 Main Street, Fairview**: shelter plus professional health and social support; it is not a general walk-in clinic and requires a call first.
   - **GROW**: job-and-life rehabilitation, coaching, work readiness, job-search support, and paid work opportunities where available. Assessment, schedule, entrance, and places must be confirmed by MES.
   - MES also publishes youth and family support, food and social relief, public-health referrals, skills support, documentation, and family reunification pathways.
3. Never present **16 Kapteijn Street** as a guaranteed shelter or Assessment Centre entrance. Never use older direct shelter numbers as current contacts; use **011 725 6531**.
4. Keep **Othandweni** and **Linatex** out of live routing: Othandweni is described as being developed, and Linatex is absent from the current 2025 Johannesburg programme list.

**Demo coordination:** after the caller chooses a relevant MES programme, show one simulated intake, availability, assessment, or redirection step. No request is actually sent.

## Journey 19 — trouble sleeping without assuming a home

**Caller:** “I am having trouble sleeping.”

**Expected flow:**

1. Do not suggest a hot shower, private bedroom, quiet house, refrigerator, paid product, data, or transport. The caller may be sleeping rough, in a shelter, or in shared accommodation.
2. Ask one neutral question first: “Do you have somewhere reasonably safe and sheltered to rest tonight?”
3. If no, check immediate danger and handle the safe-place need before ordinary sleep advice. Reuse any area or landmark already stated and use the MES-first pathway for an eligible inner-city adult.
4. If yes, continue one question at a time about duration, distress, pain, breathing, medicines or substances when relevant, and tailor low-resource advice to what the caller actually has.
5. If a clinic or mental-health line is the next step, use a verified destination. When its phone number is spoken, offer to connect now in the demo.

**Pass condition:** the line never assumes housing or facilities, never gives “take a hot shower” as context-free advice, and remains caring rather than clinical or bureaucratic.

## One-action demo rule

Every non-emergency journey ends with exactly one caller-approved simulation:

| Need | One simulated action |
|---|---|
| Shelter, food, older-person accommodation | Intake or availability check |
| Any spoken non-emergency phone number | Phone-connection screen, unless the caller explicitly chose another supported action |
| Routine clinic without a spoken number, or explicit caller choice | Appointment request or doctor-connection screen |
| Mental health, GBV, Childline | Connection screen |
| Substance-use support | Assessment request |
| Daytime space, grants, documents, work, legal support | Redirection or appointment |
| Zlto public rewards | Reward sign-up journey |
| Mi-Change essentials voucher | Partner pathway check |

The line completes the demo action positively, then immediately distinguishes that screen state from a real external action.

## Five-minute recommended sequence

1. Journey 1: adult near Joubert Park seeking safety and food; demonstrate MES and a simulated phone connection.
2. Journey 2: routine emotional distress; demonstrate SADAG and a simulated warm handoff.
3. Journey 5: clinic need; demonstrate the default phone connection, then the appointment variant only if the caller asks for it.
4. Journey 16: demonstrate the Zlto data-free earn-and-learn journey.
5. Journey 17: demonstrate the Mi-Change/Zlto partner voucher pathway through MES.
6. Journey 3: add “I have tablets and will take them now”; show immediate Joburg emergency escalation, with 112 first only if the caller is on a mobile phone.
7. Journey 6: say the phone is shared; show address withholding and zero outbound messaging.

## Pre-demo check

- `SERVICE_MODE=health` so the default and explicit health paths retain the health assistant.
- `JOZI_LINE_ENABLED=true`, with `HEALTH_PHONE_NUMBER=+12063098528` and `JOZI_PHONE_NUMBER=+14255173281`.
- `JOZI_DEMO_MODE=true`; the Jozi call profile still forces caller memory and automatic follow-up off even when the health profile enables them.
- `JOZI_TRANSCRIPT_TTL_DAYS=7`
- Confirm both `OPENAI_WEBHOOK_SECRET` and `TWILIO_AUTH_TOKEN` are set; unsigned OpenAI and Twilio requests are refused.
- Use synthetic demo callers only.
- Call the handful of services used in the scripted demo that morning if partner staff want to describe their hours or access as live-confirmed.
- Do not improvise a destination outside the curated directory.
- Turn `JOZI_DEMO_MODE` back to `false` after the supervised demonstration if the Jozi number will remain publicly reachable.
