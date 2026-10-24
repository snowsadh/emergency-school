# Emergency School — build log

Last updated: 24 October 2026.

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

### Voice turn recovery, expressive callers, and scored assessment — in progress

Founder reported that voice practice stays on "Listening" and caller delivery sounds flat; they also requested a serious scored report rather than overview-only feedback or generic trait ratings.

Plan:

- Replace the fixed microphone threshold with short background calibration and separate speech-start/end thresholds; retain automatic turn submission and add a manual Send voice fallback. Reproduce quiet speech, background noise, recording failures, and genuine browser audio submission in tests.
- Give GPT shared, specific actor-direction instructions for Fish Drama 3, with pacing, breaths, emphasis, difficulty-appropriate intensity, and gradual emotional changes. Preserve caller directions in conversation context; keep scenario facts immutable and display transcripts without tags.
- Add a versioned, transcript-grounded call-handling rubric with server-calculated points, a critical-findings section, an evidence ledger, assessment coverage, and export. Withhold an overall score when too little can be assessed. Weights are project-defined, informed by APCO's public calltaker training criteria, not validated professional or Indian 112 grading.
- Verify offline first, inspect desktop/mobile report and call controls, then perform a bounded real-provider smoke test if needed. Keep separate checkpoint commits and never print credentials.

Voice checkpoint: replaced the fixed `0.018` amplitude threshold with room calibration before the first caller plays (320ms fallback if no pre-call samples exist), separate speech-start/end thresholds, and an 800ms endpoint pause. Added Send voice without requiring the detector to classify speech. Recorder failures, lost microphones, and suspended audio now leave "Listening" explicitly; finalized audio survives muting but cannot send after call closure. Fixed suspended caller playback not resuming on unmute, and removed a hook state update that overwrote recorder errors with a false "Listening" state. **14/14 voice unit checks pass.** The expanded native-Chrome test passed automatic submission from a quiet synthetic microphone fixture, manual audio submission, mute, typed fallback, recorder-error recovery state, and debrief, with provider routes mocked and all other API routes blocked. Inspected the mobile call controls and retained the existing design. This is still amplitude-based, half-duplex detection, not a trained speech detector or natural interruption support; real speech and changing room noise still need user testing.

Assessment/backend checkpoint: shared actor-direction guidance now covers both generation and every reply; previous caller directions remain in the conversation for continuity. The model is still `gpt-4.1`, and Fish still receives Drama 3 requests; no trained weights, voice ID, or provider changed. Added `call-handling-v1`, nine anchored criteria, server-owned weights/point arithmetic, evidence/opportunity validation, weighted coverage, short-call score withholding, and separate critical findings. Met/partial need trainee evidence; missed additionally needs an actual preceding opportunity. Invalid, duplicate, unfinished, and unheard references cannot earn or lose points. Topic basis: [APCO public calltaker training](https://atpa.apcointl.org/guest/chapter-7), sections 7.2.2–7.2.4, 7.5, and 7.6; weights are our unvalidated design choices. Official OpenAI prompting and Fish Drama 3 delivery docs were fetched; TinyFish authentication was unavailable, so direct official docs were used.

Integrated offline verification now passes **34/34 tests**, `npm run test:browser`, `npm run build`, and diff checks. This includes six deterministic scoring tests and five report/export tests. Report UI has an expandable criterion ledger, expected/observed/next-action details, exact evidence navigation, critical findings, method disclosure, and full export; authored example data is explicitly illustrative and never user activity. Desktop/mobile report screenshots were inspected; 375/390/768/1440px layouts passed. Synthetic/mock checks do not establish human speech accuracy, audible emotional quality, or instructor agreement with the rubric.

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
