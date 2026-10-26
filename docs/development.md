# Developer guide

[Back to Emergency School](../README.md)

This guide describes the current implementation. Historical test results and product decisions live in the [build log](../WORKLOG.md); earlier proposals in the [research notes](../research.md) are not implementation requirements.

## Configuration

Copy [`.env.example`](../.env.example) to `.env` and supply `OPENAI_API_KEY` and `FISH_API_KEY`. These are server-only Developer API credentials. Never use a `VITE_` prefix or commit the file. No published Fish agent is required; do not assume a Fish Plus/web balance funds Developer API usage.

| Setting | Default | Purpose |
| --- | --- | --- |
| `OPENAI_MODEL` | `gpt-4.1` | Scenario, dialogue, and review generation |
| `OPENAI_TRANSCRIBE_MODEL` | `gpt-4o-mini-transcribe` | Transcription of trainee voice turns |
| `FISH_VOICE_ID` | Delia, an official Drama 3 example voice | Override the caller's voice with a Fish Voice Library ID |
| `PORT` | `5173` | Server port |
| `APP_HOST` | `127.0.0.1` | Server bind address; keep local for this prototype |

These model defaults are implementation choices, not claims that they are the latest models. Use models available to your account. English is the default language. Hindi is selectable, but pronunciation and voice suitability still require listening tests.

With no credentials, the app offers a labelled scripted text sample. With only OpenAI configured, it offers a labelled generated text conversation without Fish speech. Neither fallback should be presented as a working voice call.

## Call lifecycle

1. The server uses the OpenAI JavaScript library and a structured response schema to generate incident facts, caller personality, panic, coherence, and an opening line. Optional incident, difficulty, and language choices constrain the request. Random mode keeps the scenario hidden; guided mode adds a briefing and question prompts.
2. OpenAI writes short caller dialogue with bracketed directions for emotion, pacing, breath, tension, and selective emphasis. Previous delivery directions stay in context. Fish receives the exact tagged dialogue through its speech endpoint with the `model: drama-3` header; the displayed transcript omits the tags.
3. The browser plays the caller, then listens for the trainee. An approximately 800ms pause after detected speech submits the recording to OpenAI for transcription. The original incident facts and accumulated transcript drive the next reply.
4. The conversation continues until the trainee ends the call or the caller gives an explicit goodbye. The server builds a review from its transcript, with quotes and timestamps resolved to actual conversation segments.

Difficulty changes caller panic and coherence, not injury or incident severity. The same underlying incident can therefore present different conversational challenges. No model weights were trained or fine-tuned for this project.

The incident picker shows six categories initially and twelve more behind **Show more**. Selected extra categories stay visible when collapsed. All eighteen constrain live generation. The scripted sample uses only six authored cases from [`shared/scenarios.mjs`](../shared/scenarios.mjs) and explicitly rejects unsupported selections; live generation does not pick from those cases.

### Voice boundaries and recovery

The first version is **half-duplex**: the microphone pauses during caller playback, so the trainee cannot interrupt the caller naturally.

Voice detection measures sound amplitude rather than using a trained speech detector. It estimates background levels while the first caller is generated and uses separate speech-start and speech-end thresholds. If those samples are unavailable, it calibrates for 320ms when listening begins. Quiet speech or changing room noise may still need the **Send voice** manual control. Recording and device failures surface an error rather than claiming the app is listening; typing is also available as a fallback.

Each recorded voice turn is limited to 30 seconds. A call can contain up to 120 transcript turns. Caller playback that did not complete is marked in the transcript so unheard dialogue cannot silently count as assessment evidence.

## Assessment method

The report includes a scored assessment, critical findings, a criterion ledger, transcript-linked moments, a next-practice focus, personal notes, and text export. OpenAI proposes evidence-linked judgements; server code owns the weights and arithmetic in [`shared/assessment.mjs`](../shared/assessment.mjs).

The versioned `call-handling-v1` rubric uses these project-defined weights:

| Criterion | Points |
| --- | ---: |
| Incident location | 20 |
| Location verification | 10 |
| Immediate exposure | 15 |
| People at risk | 10 |
| Incident picture | 15 |
| Focused follow-up | 10 |
| Contact and reconnect plan | 10 |
| Factual confirmation | 5 |
| Closure and expectations | 5 |

A met criterion earns full credit, partial earns half, and a demonstrated missed opportunity earns zero. Unassessable criteria are excluded rather than failed. Full credit for acquiring location, exposure, affected-person, or incident information requires evidence from both the trainee and a heard caller turn. Fabricated references and unsupported judgements cannot contribute points. Critical location and exposure findings remain visible separately from the total.

An overall score requires at least three recorded trainee turns and 60% assessable weighted coverage. The score is earned points divided by assessable points, normalized to 100. The report shows the denominator and coverage; incomplete coverage remains provisional. Scripted samples and legacy sessions are not retroactively graded.

The topics are informed by public training material from the Association of Public-Safety Communications Officials (APCO), [Chapter 7](https://atpa.apcointl.org/guest/chapter-7). The weights, half-credit rule, and coverage thresholds are our design choices—not an official APCO assessment or Indian 112 protocol. They require instructor validation and calibration before professional use. The rubric does not measure vocal delivery, response speed, clinical competence, or dispatch-system performance. It is practice feedback, not certification or operational readiness.

## Data and privacy

- Up to 40 completed sessions are stored in this browser, without account synchronization. Clearing the journal removes browser history, not provider-held data.
- Active server sessions live in memory for up to an hour and are lost on restart.
- Microphone turns are recorded temporarily in the browser and sent to OpenAI for transcription. Generated caller dialogue goes to Fish for speech. The app does not save microphone audio to disk.
- Provider retention policies still apply. OpenAI response requests set `store: false`; that does not guarantee zero provider retention. Use fictional information only.

## Verification

### Regular checks — no paid provider requests

From the repository root:

```sh
npm test
npm run build
```

For browser checks, keep `npm run dev` running in another terminal, then run:

```sh
mkdir -p artifacts
npm run test:browser
```

The browser checks use Google Chrome at `/usr/bin/google-chrome-stable`. Override `CHROME_PATH` or `TEST_URL` if needed. Screenshots go to the ignored `artifacts/` directory.

The sample suite checks random and guided flows, optional preferences, report evidence, note/history persistence, exports, and responsive layouts. It blocks provider routes even if the server has real keys. The voice suite exercises native microphone capture with a quiet synthetic audio fixture, automatic submission, **Send voice**, caller playback, mute, typed fallback, and recorder-failure recovery. Provider responses are mocked and unmocked API routes are blocked.

Passing these checks does not verify live model quality, recognition of human speech, latency, emotional delivery, or training effectiveness.

### Live checks — explicit opt-in, spend API credit

For a full integration check, run the dev server with both credentials configured. Chrome and `ffmpeg` must be installed:

```sh
node --env-file=.env tests/live-smoke.mjs --live
```

This generates a synthetic spoken question, feeds it through Chrome's fake microphone, then submits three typed follow-ups using real OpenAI and Fish requests. It checks transcription, five completed caller playbacks, transcript-linked feedback, rubric arithmetic and evidence, and microphone release. Add `--intense` to select intense difficulty while retaining random mode; otherwise the call is unscoped.

The script saves a summary, screenshot, and fictional caller audio under ignored `artifacts/`. Temporary microphone files are removed. It is an integration check using synthetic speech, not a human listening test.

A separate, one-request grading regression needs only OpenAI credentials and no running server or browser:

```sh
node --env-file=.env tests/live-assessment.mjs --live
```

Its authored transcript tests geographic location versus indoor position, a genuine reconnect opportunity versus panic alone, and location-only versus non-location confirmation. One fixture cannot establish general grader accuracy.

Both scripts refuse to run without `--live` and are excluded from regular test commands. Recorded results, measured timings, and known limitations are in the [build log](../WORKLOG.md), not implied by the existence of these scripts.

## Serving a local production build

```sh
npm run build
npm start
```

The server binds to `127.0.0.1` by default. Do not expose this prototype publicly as-is. A public version needs user authentication, per-user spending limits, durable sessions, and a privacy/retention policy. The current process-level request limiter does not replace those controls.

## Code layout

```text
server/             HTTP routes and OpenAI/Fish integration
shared/             Scope validation, sample scenarios, assessment rules
src/components/     Practice room, call room, review, journal, activity
src/hooks/          Call lifecycle and interface state
src/data/           Authored example report
src/styles/         Review and journal styling
src/styles.css      Shared visual system and practice/call layout
src/voice.mjs       Microphone capture, turn boundaries, caller playback
tests/              Backend, audio, assessment, report, and browser checks
```

## Implementation references

- [OpenAI structured responses](https://developers.openai.com/api/docs/guides/structured-outputs)
- [OpenAI speech transcription](https://developers.openai.com/api/docs/guides/speech-to-text)
- [Fish Drama 3 performance directions](https://docs.fish.audio/features/text-to-speech/drama-3)
- [Fish speech endpoint](https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech)
