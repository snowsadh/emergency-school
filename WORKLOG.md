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
- [ ] Replace the first Fish-hosted-agent backend with the requested OpenAI → Fish speech loop. **In progress.**
- [ ] Build the one-click home screen and optional customization panel.
- [ ] Implement browser audio capture, caller playback, microphone controls, and a transparent sample rehearsal.
- [ ] Finish the evidence-led report, local session history, and reflection notes.
- [ ] Apply and review desktop/mobile styling and keyboard accessibility.
- [ ] Add runnable backend and browser checks; run tests and a production build.
- [ ] Update setup instructions and reconcile earlier research with the final scope.

## Work completed / decisions changed

### Initial scaffold

Created a React shell, Vite configuration, native Node HTTP server, fictional reference scenarios, and local browser storage. The initial interface treated guided/random as peers and exposed a mandatory setup flow. The first voice path used a published Fish hosted agent. Neither direction is final.

### Founder corrections incorporated

Random now has product priority, and every practice preference is optional. The hosted-agent path is being replaced rather than retained: the founder explicitly wants the OpenAI SDK to control scenario generation and conversation, with Fish used for expressive speech. Existing fictional cases are retained only for the explicitly labelled offline sample, not as the production scenario generator.

### Current build state

Implementation is unfinished. The interface has not yet been styled, the new API routes are being written, and no production build or end-to-end test has passed yet. Some files are temporarily incomplete while this replacement is in progress.

## Verification and external dependencies

- No OpenAI or Fish credentials are present in the current environment. No paid model requests have been made.
- Live model quality, speech recognition, latency, Hindi pronunciation, and Fish emotional delivery are **not yet verified**.
- Official OpenAI Structured Outputs / speech-transcription docs and Fish Drama 3 / speech-endpoint docs have been checked. The TinyFish research helper returned an authentication error, so official documentation was fetched directly.
- Current implementation targets a local, single-process prototype. Public deployment needs authentication and spending controls; active calls are not durable across server restarts.

## Next handoff

Finish the current build, run local checks, then record exact commands/results and remaining limitations here. API keys belong only in the ignored `.env` file, never in this log or client code.
