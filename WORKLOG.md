# Emergency School — build log

Last updated: 24 October 2026.

## Current product contract

- Random, instant browser calls are the main experience. One prominent **Start call** action.
- No required onboarding, signup questions, phone number, schedule, or availability control.
- Domains, difficulty, and language are optional constraints. No selection means a freely generated scenario (English by default).
- Guided practice is a secondary option, for beginners or targeted practice.
- OpenAI generates immutable incident facts, caller personality, the opening, and subsequent replies. Replies include Fish performance directions such as `[anxious, hesitant]`.
- Fish Drama 3 speaks the generated replies. OpenAI transcribes the trainee's recorded turns.
- Ending a call opens a transcript-backed debrief. No fabricated grades, validated-readiness claims, or frozen scoring weights.
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

## Work completed / decisions changed

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

The first complete local prototype is implemented. Desktop and mobile screenshots have been inspected; automated sample and real-browser audio flows pass against both the development server and production build, with model responses mocked. Source has been consistently formatted and setup documentation is complete. No live provider request has been made.

## Verified checkpoints

1. `f2a8792` — Preserve existing hackathon/product research and establish this build log.
2. `2d6f342` — Backend checkpoint: **4/4 tests passed**. Includes empty-scope defaults, structured OpenAI requests, a mocked complete voice call, Fish performance-tag forwarding, hidden scenario facts, playback acknowledgement, idempotent call ending, and explicit failure paths. Syntax checks passed. Providers are mocked; this does not establish live model or audio quality.
3. `9b08da9` — Independent lifecycle review: backend regressions and browser-audio unit checks added. **12/12 tests passed.** Checked end-during-reply, overlapping turns, failed speech generation, failed model reply, microphone cleanup, mute/unmute while thinking, and stale playback. Fixed the pending-reply microphone race and stale audio playback checks. Rechecked difficulty prompt wording and clarified that microphone audio is temporarily captured, but not stored by the app.
4. `b36f859` — Debrief checkpoint: evidence-linked feedback, original-transcript quotes, complete report export, reflection notes, real local history, and activity-only progress. Authored examples are separate from user activity; scripted samples receive no fabricated grading. Automated checks now pass **14/14**.
5. Integrated browser check: `npm run test:browser` passed zero-onboarding random practice, optional guided/Hindi choices, two sample calls, report evidence navigation, note persistence, export contents, reload persistence, and layouts at 375/390/768/1440px. The offline sample made **zero** `/api/sessions` requests. `npm run build` passed. Live provider output/voice quality remains unverified.
6. Added a separate real-Chrome audio check using a fake microphone and local WAV fixture, with model/provider responses mocked. Browser permissions, native audio decoding/playback, microphone mute, typed fallback, playback acknowledgement, and AI-debrief rendering passed. This is an integration test, not a listening-quality test.
7. `c1baf18` — Consistent core-source formatting and removal of the obsolete hosted-agent prompt / unused lexical-scorecard helpers.
8. `ac57acf` — One-click random practice, optional customization and guided mode, browser call lifecycle, responsive visual system, and repeatable browser checks. `TEST_URL=http://127.0.0.1:5174 npm run test:browser` also passed against the production server, not only Vite development mode.

## Verification and external dependencies

- No OpenAI or Fish credentials are present in the current environment. No paid model requests have been made.
- Live model quality, speech recognition, latency, Hindi pronunciation, and Fish emotional delivery are **not yet verified**.
- Official OpenAI Structured Outputs / speech-transcription docs and Fish Drama 3 / speech-endpoint docs have been checked. The TinyFish research helper returned an authentication error, so official documentation was fetched directly.
- Current implementation targets a local, single-process prototype. Public deployment needs authentication and spending controls; active calls are not durable across server restarts.

## Next handoff / remaining live validation

The development app is available at `http://127.0.0.1:5173`. Add `OPENAI_API_KEY` and `FISH_API_KEY` to the ignored `.env` file, restart, and test a short English call before Hindi and more difficult callers. Check recognition fidelity, factual consistency, emotional delivery, latency, and how the debrief handles ambiguous or short calls. API keys belong only in `.env`, never in this log or client code.

Known first-version limits: microphone capture pauses while the caller speaks (no natural interruptions yet); turn boundaries use a simple silence threshold; active server sessions are in-memory; feedback is generated for reflection rather than validated grading. Public deployment and a final scoring rubric are outside this checkpoint.
