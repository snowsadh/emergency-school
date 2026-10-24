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
- Clean, intentionally designed interface: restrained lavender/ink palette, clear typography, generous space. No dashboard clutter or ornamental score widgets.

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
- [ ] Update setup instructions and reconcile earlier research with the final scope.

## Work completed / decisions changed

### Initial scaffold

Created a React shell, Vite configuration, native Node HTTP server, fictional reference scenarios, and local browser storage. The initial interface treated guided/random as peers and exposed a mandatory setup flow. The first voice path used a published Fish hosted agent. Neither direction is final.

### Founder corrections incorporated

Random now has product priority, and every practice preference is optional. The hosted-agent path is being replaced rather than retained: the founder explicitly wants the OpenAI SDK to control scenario generation and conversation, with Fish used for expressive speech. Existing fictional cases are retained only for the explicitly labelled offline sample, not as the production scenario generator.

### Current build state

The first complete local prototype is implemented. Desktop and mobile screenshots have been inspected; the automated sample flow and production build pass. Final source cleanup and setup documentation are being completed. No live provider request has been made.

## Verified checkpoints

1. `f2a8792` — Preserve existing hackathon/product research and establish this build log.
2. `2d6f342` — Backend checkpoint: **4/4 tests passed**. Includes empty-scope defaults, structured OpenAI requests, a mocked complete voice call, Fish performance-tag forwarding, hidden scenario facts, playback acknowledgement, idempotent call ending, and explicit failure paths. Syntax checks passed. Providers are mocked; this does not establish live model or audio quality.
3. `9b08da9` — Independent lifecycle review: backend regressions and browser-audio unit checks added. **12/12 tests passed.** Checked end-during-reply, overlapping turns, failed speech generation, failed model reply, microphone cleanup, mute/unmute while thinking, and stale playback. Fixed the pending-reply microphone race and stale audio playback checks. Rechecked difficulty prompt wording and clarified that microphone audio is temporarily captured, but not stored by the app.
4. Debrief checkpoint: evidence-linked feedback, original-transcript quotes, complete report export, reflection notes, real local history, and activity-only progress. Authored examples are separate from user activity; scripted samples receive no fabricated grading. Automated checks now pass **14/14**.
5. Integrated browser check: `npm run test:browser` passed zero-onboarding random practice, optional guided/Hindi choices, two sample calls, report evidence navigation, note persistence, export contents, reload persistence, and layouts at 375/390/768/1440px. The offline sample made **zero** `/api/sessions` requests. `npm run build` passed. Live provider output/voice quality remains unverified.

## Verification and external dependencies

- No OpenAI or Fish credentials are present in the current environment. No paid model requests have been made.
- Live model quality, speech recognition, latency, Hindi pronunciation, and Fish emotional delivery are **not yet verified**.
- Official OpenAI Structured Outputs / speech-transcription docs and Fish Drama 3 / speech-endpoint docs have been checked. The TinyFish research helper returned an authentication error, so official documentation was fetched directly.
- Current implementation targets a local, single-process prototype. Public deployment needs authentication and spending controls; active calls are not durable across server restarts.

## Next handoff

Finish the current build, run local checks, then record exact commands/results and remaining limitations here. API keys belong only in the ignored `.env` file, never in this log or client code.
