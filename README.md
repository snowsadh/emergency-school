# Emergency School

Voice practice for people training to answer 112 emergency calls. You act as the emergency call operator; an AI caller describes a fictional incident and responds to your questions. After the call, review what you established, what you missed, and the conversation behind each assessment.

No signup, phone number, or onboarding questionnaire. Open the practice room and start a call.

## The practice experience

1. **Meet an unknown caller.** Each live call has a newly generated incident, caller personality, and emotional delivery. You discover the situation through conversation, not a briefing.
2. **Work through the incident.** Ask questions, establish the location, and clarify immediate risks. The caller responds using the same underlying incident facts throughout the call.
3. **Review your decisions.** The report includes scored call-handling checks, critical findings, and quotes linked to the transcript. Keep notes, revisit earlier sessions, or export the review.

Random calls are the main mode. If you want a narrower exercise, optionally choose from 18 incident types, adjust the difficulty, or select English or Hindi. Guided practice adds a briefing and question prompts. None of these choices is required.

OpenAI generates the scenario and dialogue, transcribes your speech, and proposes assessment findings. Fish Audio's Drama 3 turns the caller's dialogue and emotion directions into speech. The app uses React, Vite, and a Node.js server.

## Run locally

You need Node.js **22.12 or newer**, npm, and OpenAI and Fish Audio Developer API keys for live voice calls.

```sh
npm install --include=dev
cp .env.example .env
```

Add your keys to `.env`:

```dotenv
OPENAI_API_KEY=your_openai_api_key
FISH_API_KEY=your_fish_developer_api_key
```

```sh
npm run dev
```

Open [the practice room](http://127.0.0.1:5173) and allow microphone access. Restart the server after changing `.env`. Keys stay on the server; never prefix them with `VITE_` or commit `.env`.

Without keys, you can explore a labelled, scripted text sample. It does not use paid services or generate a performance grade.

## Development

```sh
npm test          # Unit and backend checks; no paid requests
npm run build    # Production build
```

See the [developer guide](docs/development.md) for model and voice settings, browser tests, opt-in paid checks, the scoring method, data handling, and local production setup.

## Current limits

This is a training prototype, not a real 112 connection or a validated professional assessment. Scores use project-defined criteria informed by public training material; they do not certify readiness. The microphone pauses while the caller speaks, so interruptions are not supported yet. Hindi is selectable but still needs listening tests.

Use fictional information only. Voice turns go to OpenAI for transcription; caller dialogue goes to Fish for speech. Completed sessions stay in this browser, and provider retention policies still apply. The server is intended for local use, not public deployment as-is.

## Project notes

- [Build log](WORKLOG.md) — decisions, checkpoints, verification, and remaining work.
- [Research](research.md) — source material and earlier proposals, with superseded scope marked.
- [Hackathon brief](hack.md) — event research and demo context.
