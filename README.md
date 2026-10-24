# Emergency School

Browser-based practice for emergency call-takers. Open the app, start a random call, and meet the caller through the conversation. No required onboarding, account, phone number, or scheduling.

Incident interests, difficulty, language, and guided practice are optional. With no preferences, OpenAI generates a new fictional case freely, in English. Guided mode adds a briefing and question prompts; random is the default.

## Run locally

Requires Node.js 22.12+ and npm.

```sh
npm install --include=dev
npm run dev
```

Open [the practice room](http://127.0.0.1:5173). Without credentials, the app explicitly offers a scripted text sample. Samples never call either paid provider and do not receive invented grades.

For live calls, copy `.env.example` to `.env` and fill in:

```dotenv
OPENAI_API_KEY=your_developer_api_key
FISH_API_KEY=your_fish_developer_api_key
```

Restart the server and refresh the page. Keys are server-only; never use a `VITE_` prefix. No published Fish agent is required. Fish Plus/web credits and Developer API credit are separate.

Optional server settings:

| Variable                  | Default                                  | Purpose                                    |
| ------------------------- | ---------------------------------------- | ------------------------------------------ |
| `OPENAI_MODEL`            | `gpt-4.1`                                | Scenario, dialogue, and debrief generation |
| `OPENAI_TRANSCRIBE_MODEL` | `gpt-4o-mini-transcribe`                 | Transcribe the trainee's voice turns       |
| `FISH_VOICE_ID`           | Delia, an official Drama 3 example voice | Use a voice from your Fish Voice Library   |
| `PORT`                    | `5173`                                   | Local server port                          |

The default OpenAI models are explicit implementation choices, not a claim that they are the latest models. Change the environment settings to models available to your account. Hindi is selectable, but pronunciation and voice suitability require listening tests.

## How a call works

1. The server uses the official OpenAI JavaScript SDK and a structured response schema to generate the incident facts, caller personality, panic, coherence, and opening. Optional preferences constrain this request. Facts stay server-side while a random call is active.
2. OpenAI writes short caller dialogue with specific actor directions for emotion, pacing, breath, tension, and selective emphasis. The same guidance applies to openings and replies; prior delivery directions remain in the model's context for continuity. The server sends the exact tagged dialogue to Fish's speech endpoint with the `model: drama-3` header. Tags are removed from the displayed transcript.
3. The browser plays the caller's voice. When playback ends, it listens for the trainee. It estimates background levels while the first caller is being generated, then uses separate speech-start/end thresholds. An approximately 800ms pause ends a detected voice turn, which OpenAI transcribes. **Send voice** submits the current recording without waiting for detection. The transcript and original incident facts drive the next reply.
4. This repeats until the trainee ends the call, or the caller gives an explicit goodbye. The report uses the server's transcript and AI-generated reflection, with quotes and timestamps resolved from actual conversation segments.

This first version is **half-duplex**: the microphone pauses while the caller speaks. It does not yet support naturally interrupting the caller. Detection uses sound amplitude, not a trained speech detector: quiet or changing environments can still require Send voice. If pre-call room samples are unavailable, it uses a 320ms calibration at the start of listening. Voice turns are limited to 30 seconds, with a maximum of 120 transcript turns per call. Recording/device failures show an error rather than claiming the app is listening. Typing is available as a fallback. If only OpenAI is configured, the app offers a clearly labelled generated text conversation without Fish speech.

Difficulty changes caller delivery and information coherence—not injuries or incident severity. Fixed fictional cases in `shared/scenarios.mjs` are used only by the offline sample and authored example. The live generator does not select from that catalogue. No model weights were trained or fine-tuned.

## Debriefs and data

Debriefs include a scored call-handling assessment, critical findings, a criterion ledger, transcript-linked moments, a next-practice focus, personal notes, and complete text export. OpenAI proposes evidence-linked judgements; server code owns the weights and arithmetic. No model weights were trained for grading.

The `call-handling-v1` prototype rubric uses incident location (20 points), location verification (10), immediate exposure (15), people at risk (10), incident picture (15), focused follow-up (10), simulated reconnect plan (10), factual confirmation (5), and closure/expectations (5). Met earns full credit, partial earns half, and a demonstrated missed opportunity earns zero. Unassessable criteria are excluded, not failed. Full credit for acquiring location, exposure, affected-person, or incident information requires both trainee and heard-caller evidence. Fabricated references and unsupported judgements cannot contribute points; critical location/exposure findings remain visible separately from the total.

An overall score needs at least three recorded trainee turns and 60% assessable weighted coverage. It is earned points divided by assessable points, normalized to 100; incomplete coverage remains provisional. The report shows the denominator, coverage, exact evidence, and project-defined method. It does not measure voice quality, response speed, clinical competence, or dispatch-system performance. Scripted samples and legacy sessions are not retroactively graded.

The topics are informed by [APCO's public call-taker training criteria](https://atpa.apcointl.org/guest/chapter-7), but the weights, half-credit rule, and coverage thresholds are our design choices—not an official APCO assessment or Indian 112 protocol. Instructor validation and calibration remain necessary before any professional-use claim. Scores are practice feedback, not certification or operational readiness.

The app keeps up to 40 completed sessions in this browser. They are not synced to an account. Active server sessions are kept in memory for up to an hour and are lost on restart. Clearing the journal deletes only browser history—not provider-held data.

Microphone turns are recorded temporarily in the browser and sent to OpenAI for transcription; generated caller text is sent to Fish for speech. The app does not save microphone audio to disk. Provider retention policies still apply. OpenAI response requests set `store: false`; that is not a promise of zero provider retention. Use fictional information only. Caller playback that was not completed is explicitly marked in the transcript.

## Checks

```sh
npm test
npm run build
npm run test:browser
```

The browser check requires the dev server running and Google Chrome at `/usr/bin/google-chrome-stable`. Override `CHROME_PATH` or `TEST_URL` if needed. It checks random/guided sample flows, optional preferences, report evidence, note/history persistence, exports, and responsive layouts. The sample suite blocks provider routes even when the server has real keys. A second browser check exercises native microphone auto-submission with a quiet synthetic audio fixture, manual Send voice, caller playback, mute, typed fallback, and recorder-failure recovery using mocked provider responses. Unmocked API routes are blocked. Screenshots go to the ignored `artifacts/` directory.

These regular tests use mocked providers; passing them does **not** verify live model quality, speech recognition, latency, or emotional delivery.

An optional live check spends API credit. With the server running and both keys loaded from `.env`, run:

```sh
node --env-file=.env tests/live-smoke.mjs --live
```

This also requires Chrome and `ffmpeg`. It generates a synthetic spoken question, feeds it through Chrome's fake microphone, and follows it with three typed questions using real OpenAI and Fish requests. It checks transcription, five completed caller playbacks, transcript-linked feedback, rubric arithmetic/evidence, and microphone release. Add `--intense` to select optional intense difficulty while staying in random mode; without it the call is unscoped. The `--live` flag is mandatory; this script never runs as part of the regular test commands. Its summary, screenshot, and fictional caller audio are saved under ignored `artifacts/`; temporary microphone files are removed.

The live check passed on 24 October 2026 for one unscoped English call: the question was transcribed exactly, two caller turns played, and the debrief cited the trainee's actual turn. This is a short integration check with synthetic speech, not a human listening test or a validation of training effectiveness. See [WORKLOG.md](WORKLOG.md) for measured timings and remaining limits.

An expanded intense-call check also passed with one microphone question, three typed follow-ups, and five caller playbacks. Reviewing its grading exposed overly generous location credit, so the anchors were tightened and a separate, one-request semantic regression was added:

```sh
node --env-file=.env tests/live-assessment.mjs --live
```

This needs only OpenAI credentials and spends API credit. Its authored transcript tests the difference between a geographic incident location and an indoor position, a genuine reconnect opportunity versus panic alone, and location-only versus non-location confirmation. It passed after the changes; one case is not a claim of general grader accuracy. Both live scripts are excluded from regular tests.

To serve the production build locally:

```sh
npm run build
npm start
```

The server binds to `127.0.0.1` by default. **Do not expose this prototype publicly as-is.** A public version needs user authentication, per-user spending limits, durable sessions, and a privacy/retention policy. The current process-level limiter is not a replacement for those controls.

## Repository map

```text
server/              Local HTTP routes and OpenAI/Fish integration
shared/              Optional-scope validation and offline reference scenarios
src/components/      Practice room, call room, debrief, journal, activity
src/hooks/           Call lifecycle and UI state
src/data/            Explicitly authored example report
src/styles/          Debrief and journal styling
src/styles.css       Shared visual system and practice/call layout
src/voice.mjs        Microphone capture, turn boundaries, caller playback
tests/               Backend, audio lifecycle, report, browser checks
```

[WORKLOG.md](WORKLOG.md) tracks scope, checkpoints, verification, and remaining work. [research.md](research.md) retains the original evidence and clearly marks superseded product proposals. [hack.md](hack.md) contains the active event brief.

Implementation references: [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [OpenAI speech transcription](https://developers.openai.com/api/docs/guides/speech-to-text), [Fish Drama 3](https://docs.fish.audio/features/text-to-speech/drama-3), and [Fish speech endpoint](https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech).
