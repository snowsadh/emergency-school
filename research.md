# Emergency School Product Research

Verified 24 October 2026. India’s 112 call-taker is the assumed initial learner. This report incorporates the revised product direction and Fish Audio event. It replaces provider assumptions in the September notes.

## Current implementation scope — supersedes the earlier proposal below

The founder revised the product during development: **random instant browser calls are the main experience**, with no required onboarding or selections. Incident interests, difficulty, language, and guided mode are all optional. There are no phone numbers, scheduled calls, calling periods, grit frequency, or availability switch.

The official OpenAI SDK now generates a new fictional incident, immutable facts, caller personality, and subsequent dialogue. Fish Drama 3 speaks dialogue containing bracketed delivery directions. OpenAI also transcribes trainee voice turns and produces transcript-linked practice feedback. The first prototype pauses microphone capture during caller playback; full-duplex interruption handling is not implemented. Fixed reference scenarios support the explicitly labelled offline sample only.

The founder subsequently requested a scored assessment. The implementation now uses the versioned `call-handling-v1` evidence rubric in `shared/assessment.mjs`: nine concrete call-handling checks, fixed project-defined weights, half-credit for partial evidence, exclusion of unassessable items, separate critical findings, and totals withheld below three trainee turns or 60% assessable coverage. It draws on [APCO's public calltaker training topics](https://atpa.apcointl.org/guest/chapter-7), not an official scoring standard. These weights and thresholds remain unvalidated prototype choices; this is not a numerical readiness score. The different scorecard below is historical research, not the implemented rubric.

Sections 2–3 and the telephony / hosted-agent implementation proposals below are retained as historical research, not requirements. No scheduled phone flow is being built. Consult [README.md](README.md) for the actual architecture and [WORKLOG.md](WORKLOG.md) for verified development progress. No live provider or operator-validation results should be inferred from the prototype's mocked tests.

## Earlier decisions — historical, superseded where noted above

These are product choices supplied by the founder, rather than findings that research must approve:

- Incident interests appear as flexible, hashtag-like chips.
- Difficulty is selectable. There is no skill-focus question in onboarding.
- Grit controls the frequency of unsolicited practice calls.
- A prominent home-screen ON/OFF switch controls availability for random calls.
- Practice mode starts immediately and offers guided or hidden-scenario practice.
- Random Call mode is the main experience: an unknown scenario arrives on the trainee’s phone.
- Reviews and performance history are included.
- Fish Audio is the voice platform. CALL-E and its competition requirements are superseded.

The research below supplies a practical basis for scenarios, difficulty, scoring, voice technology, and scheduling. Proposed numbers and thresholds are labeled as prototype decisions. No live calling, account access, credit expenditure, training of model weights, or operator interviews were performed.

## 1. Source basis and scope

The Association of Public-Safety Communications Officials (APCO) and National Emergency Number Association (NENA) publish emergency communications standards. Their **2025 quality-assurance standard** includes adaptable evaluation examples for police, fire, and medical calls. Its appendices are informative examples, not a universal scoring system. Its **2025 training standard**, chapter 7, describes call-taking competencies. These are useful comparative references; neither is an Indian State’s operating procedure. [R1][R2]

The European Emergency Number Association (EENA) publishes **Training of Emergency Call Takers**, revised May 2019, covering continuous learning, practice, and differences between organizations. India also has substantial public training material: UP Police’s current training-components page includes communication, dispute handling, fire, first aid, children, older callers, disability, and technical topics. A full curriculum exists in the profession, but the app can begin as supplementary practice without reproducing one. [R3][R4]

For simulation design, the **STAT-911 study protocol** is particularly useful. It describes authored callers of increasing complexity, selected communication obstacles, observation, and feedback. **Sim911** provides a more recent technical precedent for grounded scenario generation and separating incident facts from caller attributes. [R5][R6]

All suggested scoring categories, difficulty bands, frequency presets, and interface flows below are adaptations for this prototype. They have not been validated as a professional assessment instrument.

## 2. Grit, availability, and unpredictable calls

### What the evidence supports

Repeated phone simulation with feedback is a credible training method. The completed STAT-911 randomized trial involved 157 dispatchers across 13 US centers and found improvements in several call-processing skills. It does not establish an optimal daily call frequency for this product. [R7]

A 2026 emergency-department study compared announced and unannounced simulations. Participants preferred announced sessions, and stress was a recurring issue. The study examined feasibility and safety, not whether surprise phone calls improve 112 trainee competence. Random scenario selection, random practice order, and random time of delivery are three different experimental choices. Evidence for one must not be presented as proof of the others. [R8]

### Recommended product behavior

Keep grit and availability exactly as two separate controls:

| Control | Changes | Does not change |
|---|---|---|
| Grit | Target number of random drills | Scenario difficulty, emotional intensity, grading standard |
| Difficulty | Information and conversational challenge | Call frequency |
| Availability ON/OFF | Whether a new random call may dispatch | Access to on-demand practice or historical reviews |

Suggested grit presets are **3–4/week**, **1/day**, **1–3/day**, and **4/day or custom**. These are product presets, not research-backed doses. If the label says “4+,” its underlying setting must still have a finite daily maximum; show the actual selected number.

The switch is necessary but cannot express sleep, shift work, or a forgotten ON state by itself. Pair it with a visible default calling period, editable in settings. For example: “ON · up to 3 calls/day · 09:00–21:00.” Infer the timezone, display it, and allow night-shift users to change the hours. This adds no mandatory scheduling questionnaire.

Scheduling rules proposed for the prototype:

1. Select random times only inside the calling period and while availability is ON.
2. Leave a gap between calls; a one-hour initial minimum is a configurable product choice.
3. Suppress random dispatch during an active practice session or call.
4. Check availability again immediately before dialing; an earlier queue decision is not enough.
5. Turning OFF invalidates pending dispatches. A call already handed to a carrier may have begun ringing, so distinguish “pause future calls” from ending the current call.
6. Paused or missed drills do not accumulate into a burst when the trainee turns ON again.
7. An unanswered call is missed practice, not evidence of poor emergency handling. Skip immediate repeated redials.

Treat the selected frequency as a target subject to availability. If a user leaves ON for ten minutes, the system should not force four calls into that time to satisfy the daily setting. Whether to count attempts or completed calls toward the target must be explicit; for the prototype, cap attempts as well as completions to avoid repeated calls to a busy trainee.

## 3. Minimal onboarding and the two modes

“Role” previously meant call-taker, dispatcher, or trainer. The first version already assumes a trainee practising call-taking, so this question can be removed.

Five compact inputs are sufficient after account creation:

1. **Language:** English, Hindi, or both, initially.
2. **Incident interests:** multi-select chips such as road accidents, fire, medical emergencies, threats/crime, family disputes, and disasters.
3. **Starting level:** beginner, intermediate, or experienced; this sets initial difficulty and remains changeable.
4. **Phone number:** verified before activating callbacks.
5. **Grit:** preferred frequency.

Show the calling period and timezone alongside the final availability setting. Include a short, plain explanation of synthetic practice and recording/transcription. Organization membership, procedure uploads, job title, training history, skill interests, and a mandatory placement test can wait.

**Practice mode:** the trainee chooses a domain and difficulty, then starts. Guided practice may show a short checklist and hints; hidden practice conceals scenario details. Guidance belongs in the coaching interface, so the synthetic citizen does not accidentally become the instructor.

**Random Call mode:** the backend selects an incident from the chosen interests and difficulty, schedules it under grit/availability rules, and calls the phone. The trainee learns the details through questioning. They may start normal practice while random calls are paused.

Store whether hints were used. Guided, unaided, and random-call results should remain distinguishable in the profile; otherwise an assisted high score can look like an independent performance improvement.

## 4. Scenario construction

### Research implication

STAT-911 varied communication obstacles such as misleading initial descriptions and ambiguous answers, using scripts vetted by training staff. Sim911 combines incident knowledge, caller characteristics, controlled generation, and validation. Both support building a bounded situation before generating dialogue, rather than asking a language model to invent and grade everything during the call. [R5][R6]

### Prototype scenario record

Each scenario should carry:

| Part | Contents | Purpose |
|---|---|---|
| Identity | Scenario ID, version, incident tags, language | Reproduce and categorize a drill |
| Fixed facts | Incident, fictional location, people, hazards, what has happened | Keep the simulated world consistent |
| Caller knowledge | What this particular caller can know and what is unknown | Prevent omniscient or impossible answers |
| Disclosure rules | What is volunteered and what requires an appropriate question | Make information gathering observable |
| Persona | Cooperation, confusion, emotion, speech pace | Produce conversational variation |
| Events | Authored changes triggered by time or trainee action | Support evolving situations without arbitrary twists |
| Expected actions | Applicable questions, checks, instructions, and handoff expectations | Establish the grading basis before the call |
| Critical omissions | Scenario-specific serious misses | Keep them visible even with a high average score |
| Ending | When the caller or system should finish | Avoid endless conversations |
| Provenance | Source references and author notes | Separate sourced guidance from invented incident details |

Start with a small authored set, then vary fictional names, landmarks, caller phrasing, and a limited number of complications. The language model can express the situation naturally; it should not change its fixed truth to make the call more dramatic. If it contradicts the scenario or cannot supply an answer it was meant to know, flag the run rather than penalizing the trainee for the simulator’s error.

Interest chips can overlap. Internally, one road collision may belong to police, fire, and medical response. Do not create one isolated generator per hashtag or produce nonsensical combinations merely because two tags were selected.

## 5. Difficulty

Difficulty should describe the work required to understand and manage a call. Medical severity, a caller’s identity, and loudness alone are poor proxies. A life-threatening event can be clearly described; a less severe incident can involve a very confused location or contradictory information.

Proposed difficulty factors:

- **Information uncertainty:** complete facts versus incomplete, vague, or conflicting descriptions.
- **Conversation management:** cooperation versus distraction, repeated interruptions, panic, or reluctance to answer.
- **Task load:** one person and one issue versus several people, hazards, or service needs.
- **Change:** stable situation versus authored new information or deterioration that requires reassessment.
- **Audio conditions:** clear audio versus controlled background noise or reduced intelligibility, after testing transcription reliability.

These are design dimensions inferred from the training literature, not an official five-factor scale. Language preference is an independent setting; selecting Hindi should not silently count as harder than English.

| Level | Proposed challenge budget | Road-collision illustration |
|---|---|---|
| Beginner | Stable event, cooperative caller, clear facts | Witness knows the landmark and answers directly |
| Intermediate | One meaningful obstacle | Witness knows only a nearby shop; location needs clarification |
| Advanced | Two interacting obstacles | Conflicting location descriptions plus a distracted caller |
| Expert, later | Several interacting demands and an authored change | Multiple affected people and a new hazard during questioning |

The examples illustrate complexity only; they are not dispatch or clinical instructions. Difficulty should be recorded as the actual factors used, even if the interface shows one simple label. This lets the system distinguish “struggled with uncertain locations” from “struggled with everything advanced.” Do not make every advanced call maximally distressed or noisy.

Keep difficulty user-controlled initially. Performance can produce a recommendation to increase or repeat a level. Automatic promotion can follow once enough comparable, unaided observations exist; a single score is insufficient evidence.

## 6. Scoring and profile

The APCO competency standard describes relevant questioning, location/callback verification, hazards, prioritization, clear communication, respect, and appropriate action. The APCO/NENA evaluation examples distinguish a forgotten question from an attempted question the caller refuses, and remove irrelevant items. These principles are more useful than copying an entire scoring form. [R1][R2]

### Proposed prototype scorecard

The weights below are **our initial product choices**, not weights endorsed by APCO, NENA, EENA, or an Indian authority.

| Category | Weight | Observable question |
|---|---:|---|
| Location and callback | 25% | Did the trainee establish and verify the usable location and contact details when applicable? |
| Essential incident facts | 20% | Did they elicit the people, circumstances, and facts required by this scenario? |
| Immediate threats | 20% | Did they discover relevant danger and respond to it appropriately? |
| Decisions and instructions | 15% | Did their stated next steps match the authored expectations? |
| Clear, respectful communication | 10% | Were questions understandable and responses acknowledged? |
| Call control and closure | 10% | Did they keep the conversation productive and explain the next step? |

Use item outcomes such as **met, partial, missed, attempted/refused, not applicable, and uncertain**. The scorecard must define what each outcome earns for that item. Exclude not-applicable items; do not treat uncertainty as an automatic miss or quietly award full credit. Show evidence coverage and withhold an overall total when essential items cannot be assessed.

Critical omissions appear separately from the numerical score. A friendly conversation should not hide a missing dispatchable location. Do not invent a universal score cap or passing threshold before trying the rubric on representative calls.

Measure timing as event intervals: first location question, location confirmation, first relevant danger check, and scenario-specific next action. Do not reward shorter calls by default or penalize the learner for synthesis/network delays. A verbal statement of intended dispatch is not proof of actual resource dispatch. Documentation can be assessed only if the product collects an incident note or form.

### Review pipeline

1. Retrieve what was actually spoken, preserving which speaker was the synthetic citizen and which was the trainee.
2. Load the exact scenario and rubric versions used for that call.
3. Have a language model identify relevant trainee actions and cite transcript segments.
4. Verify that cited segments exist and support the claimed observation.
5. Calculate weights and timing in ordinary code; return uncertainty where evidence is insufficient.
6. Produce a short coaching explanation and retain the item-level findings for the profile.

This prototype can use automatic formative feedback; it does not require a trainer approval screen for every drill. Professional readiness or employment judgments are beyond what this unvalidated rubric can establish.

Fish Agents already provides transcript analysis, configurable fields, and up to ten success criteria with success/failure/unknown verdicts. These can supply useful initial checks. Their default examples judge the **agent’s** success; ours must explicitly judge the **human trainee’s** behavior. [R9]

Another relevant limitation: dynamic variables personalize prompts and openers, but Fish documents that they do not render inside post-call analysis prompts. Therefore a generic analysis criterion cannot be assumed to receive a different scenario’s answer key automatically. Fetch the transcript and grade it in the app with the stored scenario when the check depends on hidden facts. [R10]

The profile should show domain performance, difficulty, assisted/unaided mode, sample count, repeated omissions, and trends on comparable drills. Skills can exist internally for this tracking without appearing as onboarding choices. Frequency and participation are separate from competence.

## 7. Fish Audio technology

### Existing models and services

Fish Agents is a hosted conversation platform in public beta. It handles live audio and turn-taking and exposes browser software development kits (SDKs), agent configuration, history, and tools. We would use existing model services through application programming interfaces (APIs), which let our software request those services. Writing a scenario, changing a prompt, or choosing a voice changes configuration; it does not train new model weights. [R11]

| Need | Fish capability to evaluate | Current status |
|---|---|---|
| Expressive citizen voice | `drama-3`, natural-language delivery direction | Documented; role performance still needs listening tests |
| Live understanding | `fish_audio:transcribe-stream-1` inside Agents | Preview; explicitly configure it |
| Recorded-call transcription | `transcribe-1-pro` | Documented file transcription |
| Browser practice | `@fishaudio/agent-client` or React wrapper | Documented live conversation path |
| Review | Session transcript plus post-call analysis | Documented; scenario-aware grading remains app logic |
| Real phone callback | Outbound API with a supported number/carrier | Documented, but Indian route untested |

Drama 3 accepts performance instructions, local sounds, pauses, and phrase-level delivery control. Fish’s changelog dates its release to 13 October 2026. `s2.1-pro` remains a documented alternative. A caller could begin hurriedly, pause while checking a landmark, and become clearer after useful questions. Those changes should follow authored behavior rules. They should not be random audio decorations. [R12][R13]

Voice identity and synthesis model are different settings. The former selects who it sounds like; the latter renders the audio. In Agents, `drama-3` is now listed as the default synthesis model. Recognition currently defaults to Deepgram Nova-3, so explicitly select Fish’s own realtime model if the intended stack uses Fish for both listening and speaking. The language list includes English, Hindi, and several other Indian languages, but advertised support does not establish quality on local names or mixed-language emergency calls. [R14]

The live transcription endpoint detects speech turns, acknowledgements, and interruptions and accepts decoded phone audio. It is still in preview. Measure the whole conversational delay: recognition, response generation, synthesis, network, and playback. A vendor’s time-to-first-audio figure alone is not the delay experienced by the trainee. [R15]

The browser SDK supports live transcripts and interruption. Browser microphone and playback permissions require a user gesture; this makes it suitable for voluntary practice, but it is not a guarantee of background ringing when the site is closed. [R16]

### Phone callbacks in India

Fish’s native endpoint is `POST /v1/agent/phone-calls`. It supports per-call variables, metadata, and a duplicate-prevention key. Purchased numbers have a destination allowlist that currently omits India. An imported carrier connection uses the carrier’s own routing instead. This is the central distinction for this project. [R17]

Fish documents **Session Initiation Protocol (SIP)** connections, a standard way to connect telephone systems. A compatible carrier’s SIP trunk can be imported and configured for outbound delivery. The app then requests the call through Fish, while the carrier completes the telephone leg. Fish names Twilio Elastic SIP Trunking and other compatible systems as examples. [R18]

Twilio’s India guidance allows international outbound calls from non-Indian numbers to Indian destinations, subject to its account/carrier restrictions. Combining this with Fish’s documented Twilio trunk setup is a plausible implementation route, **not an end-to-end result already verified**. Indian destination permissions, caller ID, account activation, and live audio must be tested before committing to it. [R19]

If that route is unavailable, a separate telephone provider with a bidirectional audio stream could connect to a custom Fish transcription/conversation/synthesis loop. That is more implementation work and should be a fallback, not the first build. Twilio’s documented stream format is base64-encoded, 8 kHz mu-law audio, so a custom loop needs explicit audio conversion. [R20]

### Events and truthful results

Fish sends dial-outcome, call-ended, and analysis events. Unanswered calls do not have a trainee conversation to grade; webhooks also deliberately omit the transcript, which must be fetched separately. Handle busy/no-answer/failed separately from a completed drill. [R21]

A call marked answered is not necessarily a completed human exercise: current outbound documentation says answering-machine detection has been removed. Require an actual trainee exchange before counting practice as completed. Pending dispatch must recheck the ON/OFF state in the app even when Fish supports safe API retries.

### Credits and costs

Plus web credits and Developer API credit are distinct. Fish’s account-integration documentation and blog distinguish the two; the user’s reported Plus subscription is accepted, but its balances and API entitlements were not inspected. [R22]

Hosted Agents lists a $0.06/minute base, with additions for some model choices and telephone delivery, and bills against trial/API credit. At an illustrative five minutes per completed call over 30 days, one/day costs $9 and four/day costs $36 in base agent fees. Carrier fees and any token additions are extra. This rate includes the hosted voice loop; do not also add raw Fish transcription and synthesis costs unless using the custom-loop alternative. [R23]

For a custom loop, raw API pricing is different: Drama 3 is listed at $50/million UTF-8 bytes, temporarily $10/million until 12 November 2026 at 17:00 UTC; raw transcription is $0.36/hour. A UTF-8 byte is a unit of encoded text storage, not a word, and non-Latin text can use more bytes per character. These are time-sensitive public prices, not the user’s verified balance or negotiated event terms. [R24]

## 8. Initial implementation recommendation

Use the hosted Fish Agents path first, with one published caller configuration and server-supplied scenario facts. Share it between on-demand browser sessions and real outbound calls through a verified carrier route. The application owns accounts, interest chips, difficulty, grit, availability, scheduling, scenario truth, reviews, and learner history.

Keep two responsibilities distinct: the caller receives only its role and permitted knowledge; the grader receives the full answer key and the recorded conversation. Guided hints can come from a separate interface. A model should not grade a trainee against facts that the caller invented after the call began.

The first vertical slice should demonstrate one scenario in both modes, an expressive caller, a functioning availability switch, and an evidence-based review. Add scenario variants after this loop works. The real Indian callback test is an early dependency because the main product promise depends on it. If it fails, browser practice remains usable, but the callback capability must stay labeled unverified.

## 9. Remaining validation

| Question | Smallest useful check |
|---|---|
| Does the voice sound like the intended caller? | Listen to calm, confused, and hurried versions with the same fixed facts |
| Do English/Hindi work for this setting? | Test names, landmarks, numbers, and common code-switching |
| Is the simulation fair? | Ask differently worded equivalent questions; check fact consistency and disclosure |
| Is the score stable? | Compare obvious good, partial, and missed-action transcripts against the same rubric |
| Does random timing help? | Compare uptake and repeated-skill improvement under voluntary versus random delivery |
| Does grit become intrusive? | Measure declines, OFF use, and completion by frequency preset |
| Can the phone route work? | One consented Indian callback with successful two-way audio and retrieved transcript |
| Does it match real training? | Review the flow and a few scenarios with at least one current call-taker or trainer |

The desk research supports building a supplementary practice prototype. It does not establish that random timing is superior, that four calls daily is optimal, or that these scores predict real emergency performance.

## References

All links accessed 24 October 2026. Product documentation is vendor evidence; published clinical research concerns its stated populations and settings.

- **R1 — APCO/NENA.** [Quality Assurance and Quality Improvement Standard, 1.107.2-2025](https://www.apcointl.org/~documents/standard/1107x-establishment-of-a-quality-assurance-and-quality-improvement-program-for-emergency-communications-centers/?layout=file). See the informative evaluation addenda and scoring instructions.
- **R2 — APCO.** [Minimum Training Standards for Public Safety Telecommunicators, 3.103.3-2025](https://www.apcointl.org/~documents/standard/31032-2015-public-safety-telecommunicator/?layout=file), chapter 7.
- **R3 — EENA.** [Training of Emergency Call Takers](https://eena.org/wp-content/uploads/2019/10/2019_05_10_Training_final-compressed.pdf), revised 10 May 2019.
- **R4 — Uttar Pradesh Police.** [Training Components](https://uppolice.gov.in/article/en/training-components).
- **R5 — Meischke et al.** [STAT-911 study protocol](https://link.springer.com/article/10.1186/s12873-016-0073-6), *BMC Emergency Medicine*, 2016.
- **R6 — Chen et al.** [Sim911: Towards Effective and Equitable 9-1-1 Dispatcher Training with an LLM-Enabled Simulation](https://arxiv.org/html/2412.16844v1), 2024 preprint; subsequently published at AAAI 2025.
- **R7 — Meischke et al.** [Simulation Training to Improve 9-1-1 Dispatcher Identification of Cardiac Arrest: A Randomized Controlled Trial](https://hspop.uw.edu/publication/simulation-training-to-improve-9-1-1-dispatcher-identification-of-cardiac-arrest-a-randomized-controlled-trial/), *Resuscitation*, 2017.
- **R8 — Original research.** [IN SITU: Evaluation of the Feasibility and Impacts of In Situ Simulation in Emergency Medicine](https://pmc.ncbi.nlm.nih.gov/articles/PMC12895658/), 2026, DOI 10.1186/s13049-025-01542-9.
- **R9 — Fish Audio.** [Post-call Analysis](https://docs.fish.audio/agents/monitor/post-call-analysis).
- **R10 — Fish Audio.** [Dynamic Variables](https://docs.fish.audio/agents/build/dynamic-variables).
- **R11 — Fish Audio.** [Agents Overview](https://docs.fish.audio/agents/overview).
- **R12 — Fish Audio.** [Drama 3](https://docs.fish.audio/features/text-to-speech/drama-3).
- **R13 — Fish Audio.** [Changelog](https://docs.fish.audio/developer-guide/getting-started/changelog).
- **R14 — Fish Audio.** [Voice and Language](https://docs.fish.audio/agents/build/voice-language).
- **R15 — Fish Audio.** [Realtime Speech to Text](https://docs.fish.audio/features/speech-to-text/realtime).
- **R16 — Fish Audio.** [Web SDK](https://docs.fish.audio/agents/deploy/web-sdk).
- **R17 — Fish Audio.** [Outbound Calls](https://docs.fish.audio/agents/telephony/outbound-calls).
- **R18 — Fish Audio.** [Bring Your Own Number](https://docs.fish.audio/agents/telephony/byo-sip).
- **R19 — Twilio.** [India Voice Guidelines](https://www.twilio.com/en-us/guidelines/in/voice).
- **R20 — Twilio.** [Media Streams WebSocket Messages](https://www.twilio.com/docs/voice/media-streams/websocket-messages).
- **R21 — Fish Audio.** [Agent Webhooks](https://docs.fish.audio/agents/monitor/webhooks).
- **R22 — Fish Audio.** [Account integration and credit billing](https://docs.fish.audio/overview/mcp) and [web/API credit distinction](https://fish.audio/es/blog/image-video-generation-mcp/?articleLocale=en).
- **R23 — Fish Audio.** [Agents Pricing](https://docs.fish.audio/agents/pricing).
- **R24 — Fish Audio.** [Raw API Pricing and Rate Limits](https://docs.fish.audio/developer-guide/models-pricing/pricing-and-rate-limits).

[R1]: https://www.apcointl.org/~documents/standard/1107x-establishment-of-a-quality-assurance-and-quality-improvement-program-for-emergency-communications-centers/?layout=file
[R2]: https://www.apcointl.org/~documents/standard/31032-2015-public-safety-telecommunicator/?layout=file
[R3]: https://eena.org/wp-content/uploads/2019/10/2019_05_10_Training_final-compressed.pdf
[R4]: https://uppolice.gov.in/article/en/training-components
[R5]: https://link.springer.com/article/10.1186/s12873-016-0073-6
[R6]: https://arxiv.org/html/2412.16844v1
[R7]: https://hspop.uw.edu/publication/simulation-training-to-improve-9-1-1-dispatcher-identification-of-cardiac-arrest-a-randomized-controlled-trial/
[R8]: https://pmc.ncbi.nlm.nih.gov/articles/PMC12895658/
[R9]: https://docs.fish.audio/agents/monitor/post-call-analysis
[R10]: https://docs.fish.audio/agents/build/dynamic-variables
[R11]: https://docs.fish.audio/agents/overview
[R12]: https://docs.fish.audio/features/text-to-speech/drama-3
[R13]: https://docs.fish.audio/developer-guide/getting-started/changelog
[R14]: https://docs.fish.audio/agents/build/voice-language
[R15]: https://docs.fish.audio/features/speech-to-text/realtime
[R16]: https://docs.fish.audio/agents/deploy/web-sdk
[R17]: https://docs.fish.audio/agents/telephony/outbound-calls
[R18]: https://docs.fish.audio/agents/telephony/byo-sip
[R19]: https://www.twilio.com/en-us/guidelines/in/voice
[R20]: https://www.twilio.com/docs/voice/media-streams/websocket-messages
[R21]: https://docs.fish.audio/agents/monitor/webhooks
[R22]: https://docs.fish.audio/overview/mcp
[R23]: https://docs.fish.audio/agents/pricing
[R24]: https://docs.fish.audio/developer-guide/models-pricing/pricing-and-rate-limits
