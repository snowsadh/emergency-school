# Emergency School — build log

Last updated: 26 October 2026.

## Current product contract

- Random, instant browser calls are the main experience. One prominent **Start call** action.
- No required onboarding, signup questions, phone number, schedule, or availability control.
- Domains, difficulty, and language are optional constraints. No selection means a freely generated scenario (English by default).
- Guided practice is a secondary option, for beginners or targeted practice.
- OpenAI generates immutable incident facts, caller personality, the opening, and subsequent replies. Replies include Fish performance directions such as `[anxious, hesitant]`.
- Fish Drama 3 speaks the generated replies. OpenAI transcribes the trainee's recorded turns.
- Ending a call opens a transcript-backed, scored debrief using a versioned prototype rubric. Fixed weights and evidence judgements are visible; critical findings are separate. No fabricated grades or validated-readiness claims.
- Visual inspiration: Fish Audio's confident typography, neutral surfaces, and compact controls—not a page or branding clone. The app now uses Onest, warm neutrals, near-black actions, and literal training copy. The earlier lavender/pulse-branded design was rejected and has been replaced.

## Implementation plan and progress

- [x] Inspect the existing repository and preserve the research documents.
- [x] Create the React/Vite shell and local Node server.
- [x] Make scope validation accept an entirely empty setup; make random the default.
- [x] Add OpenAI scenario, caller-turn, transcription, and review code using structured responses.
- [x] Replace the first Fish-hosted-agent backend with the requested OpenAI → Fish speech loop.
- [x] Build the one-click home screen and optional customization panel.
- [x] Implement browser audio capture, caller playback, microphone controls, and a transparent sample rehearsal.
- [x] Finish the evidence-led report, local session history, and reflection notes.
- [x] Apply and review desktop/mobile styling and keyboard accessibility.
- [x] Add runnable backend and browser checks; run tests and a production build.
- [x] Update setup instructions and reconcile earlier research with the final scope.
- [x] Load local credentials and verify a complete call against the real providers with a synthetic microphone.

## Work completed / decisions changed

### Compact README images and footer removal — complete

Founder requested removal of the Build log / Research / Hackathon footer row and smaller README images, then clarified that the images must stay centred. Removed that row and its divider, retained the underlying documents, and set both previews to 600px display width using native image attributes. Centred each image and its caption with a GitHub-compatible paragraph alignment attribute. Preserved alt text, sample-provenance captions, and original PNGs; no asset regeneration or application changes were needed. Ponytail kept this to the README and progress log without additional dependencies.

Verification: both image targets load, images and captions remain present, and the footer links are absent. A local Chromium rendering with GitHub-style responsive image sizing confirms both images are centred at 1100px and 390px viewport widths: 600px and 358px display widths respectively, unchanged aspect ratios, and no horizontal overflow. Diff checks passed. Application/browser regression suites and paid provider checks were not rerun for this documentation-only change; no provider requests were made.

Push follow-up: GitHub contained a newer README edit moving the call-room image below its description. Rebased the unpublished documentation checkpoint onto that commit, preserving the remote placement and applying the smaller, centred styling there; no remote history was overwritten.

### README product presentation — complete

Founder wants the clearer README to also make the project look compelling. Use the frontend-design skill for presentation and Ponytail for a small, dependency-free implementation: keep GitHub-native Markdown, show genuine product screens, and retain the short setup instructions. The subject is browser voice practice for trainee emergency call operators; the README's job is to make the caller experience and evidence-backed review tangible without implying validated training outcomes.

Design plan: reuse the app's warm background `#fbfaf9`, white `#ffffff`, ink `#1d1d1c`, muted `#77716c`, and border `#e8e5e2`. Product screenshots carry Onest display/body type and IBM Plex Mono utility labels; README prose uses GitHub's native typography. The signature is a real call-room view followed by the authored assessment, including its critical findings rather than a decorative perfect score. Keep sample provenance explicit, avoid generic badges, fake statistics, and marketing slogans. Match the founder's operator terminology in the homepage, authored report, and page description before recapturing them. Leave research history and original source titles intact.

Implemented a more concrete opening, compact section navigation, and two genuine interface previews: the voice call room and the authored report's score, coverage, critical finding, and conversation evidence. The screenshots are stored in `docs/images/` (212,390 bytes combined); existing browser checks now capture their source images in ignored `artifacts/`. Captions distinguish the synthetic test conversation and authored example from live trainee results. Kept local setup and limitations visible. Updated the homepage, authored overview, and page description to emergency call operator; no conversation logic, scoring method, provider settings, or storage behavior changed.

Verification: **36/36 tests**, both browser suites, the production build, and diff checks passed. Browser calls used mocked providers with other API routes blocked; no paid requests were made. Inspected the two source screenshots and a local GitHub-style Markdown preview at 1120px and 390px; both images load and neither layout overflows horizontally. This preview approximates GitHub styling rather than being a live GitHub render. Checked all 23 documentation links/anchors, balanced code fences, operator terminology, and PNG dimensions/combined size. No new dependency was added.

### README cleanup — complete

Founder requested a cleaner, more pleasant README and clarified the product term: emergency call operator. Rewrote the README around the project introduction, practice flow, and local setup, reducing it from 120 to 60 lines. Moved detailed configuration, call mechanics, scoring, privacy, and test instructions to `docs/development.md`. Historical results remain in this log rather than being repeated in the project introduction. The rewritten documents use emergency call operator; historical notes and application copy were not rewritten. No application behavior, model configuration, or scoring rules changed.

Verification: all 11 relative Markdown links resolve; code fences are balanced; documented npm scripts exist; all nine scoring labels and weights match the implementation. Compared configuration defaults and test requirements with the source. `npm test` passed **36/36**, `npm run build` passed, and diff checks passed. Browser and live-provider checks were not rerun for this documentation-only change. No paid requests were made.

### More incident types with progressive disclosure — complete

Founder requested additional incident types behind an expander and clarified that the current six are the right default amount. Preserve their order and appearance; add twelve choices behind Show more. Keep selected extra types visible when collapsed, preserve selections across reload, and keep all customization optional. Reuse the current neutral palette, Onest typography, and wrapping chips; use a small disclosure control rather than a new picker or mandatory setup.

Implementation plan: extend the shared incident catalogue and derive the generator's allowed values from it, so choices work in live calls and appear consistently in reviews/history/activity. Make unsupported scripted-sample selections fail clearly rather than return an unrelated case or crash. Check schema compatibility with official OpenAI Structured Outputs docs, add backend/browser coverage for all types and expand/collapse/persistence, inspect desktop/mobile expanded layouts, then restart the server to load the catalogue. No paid provider calls are needed.

Implemented eighteen optional types: the original six remain the default, with gas leaks, electrical hazards, flooding, severe weather, water incidents, trapped people, domestic violence, break-ins/intruders, assault/threats, mental health crises, workplace incidents, and animal incidents behind Show more. The shared catalogue now defines the picker, validation, generator schema, and existing report/history/activity labels. Extra selections stay visible on collapse and survive reload; Reset clears them and collapses the list. The generator receives category descriptions through the schema, without changing models, SDK, voice settings, or scoring. The offline sample still has six authored cases; unsupported selections now explain that limit instead of crashing.

Verification: **36/36 tests**, `npm run test:browser`, `npm run build`, and diff checks passed. New checks cover all eighteen schema/scope values, original default order/count, expand/collapse, selected-extra visibility, persisted selection, unsupported sample handling, and responsive layouts. Expanded desktop and 375px mobile screenshots inspected. Restarted the local server; a deliberately invalid call type confirmed that new incident preferences pass validation before rejecting the request without any provider work. No paid API requests were made; realistic model output for every new type has not been individually evaluated.

### First-visit homepage context — complete

Founder feedback: the homepage does not explain the product quickly enough, but slogans and fragmented AI-style copy are not acceptable. The audience is emergency call-taker trainees; the page's job is to explain the operator/caller roles and the resulting assessment without adding onboarding.

Design plan: retain the established Onest display/body typography, IBM Plex Mono utility labels, warm background `#fbfaf9`, white surfaces `#ffffff`, ink `#1d1d1c`, muted text `#77716c`, and borders `#e8e5e2`. Use a literal product heading and a short explanation of the call/review flow above the existing start surface. Replace the first visitor's empty history placeholder with a compact, concrete assessment explanation and working example-report link; keep actual history for returning visitors. No new hero artwork, metrics, decorative steps, or marketing feature cards. Verify content, one-click entry, example navigation, and desktop/mobile layouts before a checkpoint commit. No provider requests are needed.

Implemented: the heading now names emergency call-taker training; the opening paragraph explains that the user is the 112 operator, the AI plays a responsive caller, and the completed call produces a transcript-referenced assessment. The call panel explains generated, unbriefed incidents. An "After the call" section names location, immediate danger, and follow-up review, with a working example-review button. Empty history is hidden until an actual session exists; no first-visit gate or onboarding state was added. Kept the current typography and controls, removed obsolete empty-state styles, and adjusted mobile heading wrapping/section spacing.

Verification: **35/35 tests**, `npm run test:browser`, `npm run build`, and diff checks passed. New browser assertions verify the first-visit explanation, hidden empty history, example-report navigation, and Start call remaining inside the 375×850 mobile viewport. Existing random/guided flows, optional preferences, recorded-audio submission, exports, notes/history, and 375/390/768/1440px layouts still pass. Desktop and first-visit mobile screenshots inspected. No API, prompt, call lifecycle, rubric, or storage behavior changed; no paid provider calls were made.

### Voice turn recovery, expressive callers, and scored assessment — complete

Founder reported that voice practice stays on "Listening" and caller delivery sounds flat; they also requested a serious scored report rather than overview-only feedback or generic trait ratings.

Plan:

- Replace the fixed microphone threshold with short background calibration and separate speech-start/end thresholds; retain automatic turn submission and add a manual Send voice fallback. Reproduce quiet speech, background noise, recording failures, and genuine browser audio submission in tests.
- Give GPT shared, specific actor-direction instructions for Fish Drama 3, with pacing, breaths, emphasis, difficulty-appropriate intensity, and gradual emotional changes. Preserve caller directions in conversation context; keep scenario facts immutable and display transcripts without tags.
- Add a versioned, transcript-grounded call-handling rubric with server-calculated points, a critical-findings section, an evidence ledger, assessment coverage, and export. Withhold an overall score when too little can be assessed. Weights are project-defined, informed by APCO's public calltaker training criteria, not validated professional or Indian 112 grading.
- Verify offline first, inspect desktop/mobile report and call controls, then perform a bounded real-provider smoke test if needed. Keep separate checkpoint commits and never print credentials.

Voice checkpoint: replaced the fixed `0.018` amplitude threshold with room calibration before the first caller plays (320ms fallback if no pre-call samples exist), separate speech-start/end thresholds, and an 800ms endpoint pause. Added Send voice without requiring the detector to classify speech. Recorder failures, lost microphones, and suspended audio now leave "Listening" explicitly; finalized audio survives muting but cannot send after call closure. Fixed suspended caller playback not resuming on unmute, and removed a hook state update that overwrote recorder errors with a false "Listening" state. **14/14 voice unit checks pass.** The expanded native-Chrome test passed automatic submission from a quiet synthetic microphone fixture, manual audio submission, mute, typed fallback, recorder-error recovery state, and debrief, with provider routes mocked and all other API routes blocked. Inspected the mobile call controls and retained the existing design. This is still amplitude-based, half-duplex detection, not a trained speech detector or natural interruption support; real speech and changing room noise still need user testing.

Assessment/backend checkpoint: shared actor-direction guidance now covers both generation and every reply; previous caller directions remain in the conversation for continuity. The model is still `gpt-4.1`, and Fish still receives Drama 3 requests; no trained weights, voice ID, or provider changed. Added `call-handling-v1`, nine anchored criteria, server-owned weights/point arithmetic, evidence/opportunity validation, weighted coverage, short-call score withholding, and separate critical findings. Met/partial need trainee evidence; missed additionally needs an actual preceding opportunity. Invalid, duplicate, unfinished, and unheard references cannot earn or lose points. Topic basis: [APCO public calltaker training](https://atpa.apcointl.org/guest/chapter-7), sections 7.2.2–7.2.4, 7.5, and 7.6; weights are our unvalidated design choices. Official OpenAI prompting and Fish Drama 3 delivery docs were fetched; TinyFish authentication was unavailable, so direct official docs were used.

Integrated offline verification now passes **34/34 tests**, `npm run test:browser`, `npm run build`, and diff checks. This includes six deterministic scoring tests and five report/export tests. Report UI has an expandable criterion ledger, expected/observed/next-action details, exact evidence navigation, critical findings, method disclosure, and full export; authored example data is explicitly illustrative and never user activity. Desktop/mobile report screenshots were inspected; 375/390/768/1440px layouts passed. Synthetic/mock checks do not establish human speech accuracy, audible emotional quality, or instructor agreement with the rubric.

Live follow-up: `node --env-file=.env tests/live-smoke.mjs --live --intense` passed a real random call with optional intense difficulty, one auto-submitted synthetic microphone question and three typed follow-ups. All five caller lines decoded and completed playback; the microphone was released, the nine-criterion assessment arithmetic/evidence checks passed, and no browser errors occurred. The exact spoken question was transcribed as "Where exactly are you right now?". Observed call creation was **6.147 seconds**, start through the first voice reply playback **40.108 seconds**, three typed follow-ups including all playback **63.778 seconds**, and review **6.493 seconds**. These figures include recorded input and playback, not isolated network latency. All caller lines had specific bracketed directions; this confirms the directions were generated and audio played, not subjective listening quality.

Semantic review of that live output found over-generous location credit, an unjustified reconnect omission inferred from panic, and location-only read-back counted as non-location confirmation. The functional smoke pass and its provisional **89/100** do not validate those judgements. Tightened the canonical anchors and review prompt with explicit contrasting examples; full credit for location, immediate exposure, people-at-risk, and incident information now requires both trainee evidence and heard caller information.

Added an opt-in one-request grading regression, `node --env-file=.env tests/live-assessment.mjs --live`, using a separately authored transcript that reproduces these distinctions. It passed against real `gpt-4.1`: location/verification partial, reconnect and non-location confirmation not assessable, and a critical location finding. Its **69/100 at 80% coverage** is for that authored fixture, not a regrade of the earlier live call. Full fixture and response are in ignored `artifacts/assessment-semantic-check.json`. This is a focused regression, not a general accuracy or professional-validation study.

Final regression suite: **35/35 tests**, including seven scoring checks, plus browser evidence navigation/export, native automatic/manual microphone submission, error recovery, responsive layouts, and production build. One browser run overlapped the intentional server restart and failed to connect; rerunning after the server was ready passed both browser suites. Both paid checks refuse to run without explicit `--live`; credentials and artifacts remain Git-ignored. Implementation checkpoints: `de9e08e` voice recovery; `6bc1604` expressive caller directions and scoring engine; `6692495` scored report UI and documentation. The development server was restarted with the tightened prompts and reports both services configured. Remaining real-user checks are microphone behavior in the founder's environment, subjective voice delivery, Hindi, and instructor calibration. Refresh the browser and start a fresh call to use the new capture code and grader.

### Call-screen copy and header cleanup — complete

Founder feedback: "Simulated line" makes the working call experience feel like a fake/demo. Replace that label with "Browser call" and make the introduction direct. Remove the redundant page-title / "Voice ready" top bar; credential presence is not an audio-health check. Preserve the existing Onest typography, warm neutral palette, session layout, real provider behavior, and explicit training disclaimer in the footer. This is a focused copy and layout correction, not a new visual direction.

Updated the shared shell and practice screen, deleted the unused desktop/mobile header styles, and added browser assertions for "Browser call", the removed top bar, and the retained training disclaimer. `npm test` (**14/14**), `npm run test:browser`, `npm run build`, and `git diff --check` all passed. Inspected the updated 1440px desktop and 375px mobile home screenshots; responsive checks also passed at 390px and 768px. The real-browser voice flow was checked with mocked providers; no paid provider calls were made for this UI change. No API, model prompt, microphone, or report behavior changed.

### UI revision — Fish Audio inspiration (implemented, pending founder review)

The founder rejected the first UI's pulse branding, marketing slogans, and generic voice-AI styling. Inspected the actual Fish Audio public site and app in Chrome, including computed typography: Onest, warm neutral backgrounds, compact navigation, white tool surfaces, and near-black pill buttons. Reference screenshots are kept in ignored `artifacts/`, not committed as product assets.

Plan:

- [x] Inspect the actual reference, rather than infer its design from memory.
- [x] Replace pulse branding and promotional copy with a typographic identity and literal training controls.
- [x] Rebuild the practice screen around a compact session surface and one Start call action; keep customization optional.
- [x] Apply the same neutral design to calls, debriefs, history, and activity.
- [x] Review desktop/mobile screenshots and rerun behavior/audio checks before checkpoint commits.

Built an original training-session surface with an unknown caller, current optional scope, and a 112 training identifier. Removed the oversized marketing hero, pulse logo, motivational slogans, fake profile block, and decorative sample waveform. Waveforms remain only in actual voice mode. Supporting screens use direct headings: Sessions, Overview, Key moments, Session notes, and Practice record. No Fish artwork, logo, or page structure was copied.

Verification after the revision: `npm run test:browser`, `npm test` (**14/14**), and `npm run build` passed. Browser coverage includes random/guided samples, optional Hindi scope, evidence navigation, notes/export/history persistence, 375/390/768/1440px layouts, and native microphone/playback with mocked providers. Adjusted tablet report layout for reading width and made responsive assertions wait for the renderer's media-query repaint. No voice-provider, call lifecycle, or conversation logic changed. No paid provider calls were made.

### Initial scaffold

Created a React shell, Vite configuration, native Node HTTP server, fictional reference scenarios, and local browser storage. The initial interface treated guided/random as peers and exposed a mandatory setup flow. The first voice path used a published Fish hosted agent. Neither direction is final.

### Founder corrections incorporated

Random now has product priority, and every practice preference is optional. The hosted-agent path has been replaced rather than retained: the founder explicitly wants the OpenAI SDK to control scenario generation and conversation, with Fish used for expressive speech. Existing fictional cases are retained only for the explicitly labelled offline sample, not as the production scenario generator.

### Current build state

The first complete local prototype is implemented. Desktop and mobile screenshots have been inspected; automated sample and real-browser audio flows pass against both the development server and production build, with model responses mocked. A separate, explicitly opted-in live check has now passed against the real OpenAI and Fish services using a synthetic microphone. No model weights were changed; this checkpoint verifies the existing integrations rather than replacing them.

## Verified checkpoints

1. `f2a8792` — Preserve existing hackathon/product research and establish this build log.
2. `2d6f342` — Backend checkpoint: **4/4 tests passed**. Includes empty-scope defaults, structured OpenAI requests, a mocked complete voice call, Fish performance-tag forwarding, hidden scenario facts, playback acknowledgement, idempotent call ending, and explicit failure paths. Syntax checks passed. Providers are mocked; this does not establish live model or audio quality.
3. `9b08da9` — Independent lifecycle review: backend regressions and browser-audio unit checks added. **12/12 tests passed.** Checked end-during-reply, overlapping turns, failed speech generation, failed model reply, microphone cleanup, mute/unmute while thinking, and stale playback. Fixed the pending-reply microphone race and stale audio playback checks. Rechecked difficulty prompt wording and clarified that microphone audio is temporarily captured, but not stored by the app.
4. `b36f859` — Debrief checkpoint: evidence-linked feedback, original-transcript quotes, complete report export, reflection notes, real local history, and activity-only progress. Authored examples are separate from user activity; scripted samples receive no fabricated grading. Automated checks now pass **14/14**.
5. Integrated browser check: `npm run test:browser` passed zero-onboarding random practice, optional guided/Hindi choices, two sample calls, report evidence navigation, note persistence, export contents, reload persistence, and layouts at 375/390/768/1440px. The offline sample made **zero** `/api/sessions` requests. `npm run build` passed. Live provider output/voice quality remains unverified.
6. Added a separate real-Chrome audio check using a fake microphone and local WAV fixture, with model/provider responses mocked. Browser permissions, native audio decoding/playback, microphone mute, typed fallback, playback acknowledgement, and AI-debrief rendering passed. This is an integration test, not a listening-quality test.
7. `c1baf18` — Consistent core-source formatting and removal of the obsolete hosted-agent prompt / unused lexical-scorecard helpers.
8. `ac57acf` — One-click random practice, optional customization and guided mode, browser call lifecycle, responsive visual system, and repeatable browser checks. `TEST_URL=http://127.0.0.1:5174 npm run test:browser` also passed against the production server, not only Vite development mode.
9. Live integration, 24 October 2026 — With both local keys configured, `node --env-file=.env tests/live-smoke.mjs --live` passed a real unscoped English call in Chrome. OpenAI generated "Scooter Hit Near School Gate"; Fish produced the opening and reply; the microphone question "Where exactly are you right now?" was transcribed exactly; the resulting debrief cited the actual trainee turn. Both caller audio buffers decoded and finished playing, and all microphone tracks were released on call end. No browser exceptions were recorded. The debrief screenshot was inspected.

   Observed timings for this one run: call creation including opening speech **4.774 seconds**; start through opening playback, synthetic question capture, reply generation and reply playback **26.413 seconds**; debrief **2.407 seconds**. The 26-second figure includes playback and silence detection, not just provider latency. There were three transcript turns and one evidence-linked review moment. Artifacts are local and ignored: `artifacts/live-smoke-summary.json`, `artifacts/live-debrief-desktop.png`, and `artifacts/live-caller-opening.mp3`.
10. `ce6eeae` — Prevent the sample browser suite from contacting paid routes when real credentials are configured. After live validation, `npm test` (**14/14**), `npm run test:browser` (sample and mocked native voice flows), and `npm run build` all passed. The separate live script passes syntax checking and refuses to run without `--live`; that refusal was tested without provider requests. Local credentials and live artifacts remain Git-ignored and untracked. No production integration changes were needed for the live pass.

## Verification and external dependencies

- Both credentials are present in the Git-ignored local `.env`; the development server was restarted to load them. Status exposes configuration booleans only. Keys are not recorded in this log or committed.
- One real-provider English call passed using synthetic microphone speech. This establishes connectivity and a short functional round trip, not broad recognition accuracy, sustained factual consistency, or voice quality. Human speech, Hindi pronunciation, emotional delivery, and longer scenarios still need listening and usage tests.
- Regular browser tests are kept offline even when real credentials are configured: the sample suite mocks status and blocks every other API route. The paid live script requires a separate `--live` opt-in and is excluded from regular test commands.
- Official OpenAI Structured Outputs / speech-transcription docs and Fish Drama 3 / speech-endpoint docs have been checked. The TinyFish research helper returned an authentication error, so official documentation was fetched directly.
- Current implementation targets a local, single-process prototype. Public deployment needs authentication and spending controls; active calls are not durable across server restarts.

## Next handoff / remaining validation

The real-provider smoke test is complete. Both supplied keys worked for their configured services. The test used a synthetic English microphone question, not a recording of a human trainee; no claim of "perfect" recognition or realistic emotional delivery follows from this check.

The development app is available at `http://127.0.0.1:5173`. Refresh the existing tab, press Start call, and allow microphone access. Next, test a real spoken English conversation before Hindi and more difficult callers. Check recognition fidelity, factual consistency, emotional delivery, latency, and how the debrief handles ambiguous or short calls. API keys belong only in `.env`, never in this log or client code.

Known first-version limits: microphone capture pauses while the caller speaks (no natural interruptions yet); turn boundaries remain amplitude-based; active server sessions are in-memory; feedback is generated for practice rather than validated grading. The scored rubric is now implemented at the founder's request, but professional validation, public deployment, and instructor calibration remain outside this checkpoint.
