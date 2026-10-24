# Fish-A-Thon Brief

Verified 24 October 2026. This is the active event; the earlier CALL-E competition no longer governs the project.

## Event facts

The organizer’s [Luma page](https://luma.com/nkuun44n) describes a Fish Audio build event on **24 October 2026**. Its schedule lists check-in at 09:00, a Fish session at 10:00, credits at 11:00, building from 11:15, and food/networking/demos from 14:30. Registration requires host approval. The listing calls it New Delhi while its location field says Gurugram; the precise address is available to registered guests.

The published page does **not** specify a judging rubric, submission portal, repository requirement, video duration, cash prize, team-size limit, rule about pre-existing work, or a particular model that entries must use. These remain unknown. The 14:30 demo slot is a schedule entry, not an independently published submission deadline. Event announcements or the hosts must settle those details.

## Project positioning

Emergency School provides instant emergency-call practice in the browser. The main action is **Start call**, with no required onboarding or customization:

- **Random:** meet an undisclosed caller and discover the situation through conversation. This is the default and main experience.
- **Guided:** an optional secondary mode with a briefing and question prompts.

Incident interests, difficulty, and language are optional constraints. No selection means OpenAI chooses freely, in English by default. No phone numbers, schedule, frequency setting, or availability switch remain in scope. A completed call leads to a thoughtful transcript-backed debrief, reflection notes, and local session history. Numerical scoring is deferred.

This positioning is a product decision, not an official event track. Fish’s expressive voices are a strong thematic match: [Drama 3](https://docs.fish.audio/features/text-to-speech/drama-3) accepts natural-language performance directions, sounds, and pauses. The demo should make those differences audible through a changing caller persona.

## Implementation direction

The implementation uses the official OpenAI JavaScript SDK for scenario generation, caller dialogue, transcription, and post-call feedback. Structured output schemas keep the incident record and review format consistent. This replaces the earlier hosted-agent proposal; no published Fish agent is needed.

OpenAI writes the caller’s dialogue with directions such as `[anxious, stumbling over words]`. The server sends this text to the [Fish speech endpoint](https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech), explicitly using the `model: drama-3` header. Fish speaks the caller; OpenAI controls the incident and conversation. The first prototype pauses the microphone during caller playback, rather than claiming full-duplex interruption support.

There is no telephone delivery integration or Indian carrier blocker in the revised scope. Everything happens inside the website. English and Hindi are exposed; live quality and voice suitability still need listening tests.

The offline sample uses scripted text and is explicitly labelled. It does not demonstrate live OpenAI dialogue or Fish speech.

## Credits and costs

Plus/web credits and Developer API credit are separate balances; the existing Plus subscription must not be assumed to fund the app. Fish describes that distinction in its [credit explanation](https://fish.audio/es/blog/image-video-generation-mcp/?articleLocale=en).

This architecture incurs separate OpenAI generation/transcription and Fish text-to-speech usage, not hosted-agent or carrier minutes. Check the selected models and account balances before a live demo. No credit balance or unlimited allowance has been verified by this repository.

## Recommended demonstration

1. Open the website and press **Start call**, without filling anything in.
2. Discover the incident through a caller whose personality and delivery are generated for that session.
3. Hear Fish deliver the dialogue with emotional directions while the incident facts remain stable.
4. End the call and open evidence-linked feedback, the complete transcript, and a reflection note.
5. Optionally narrow the next call by incident interest, difficulty, language, or guided mode.

If credentials are unavailable, show the labelled text sample and authored example report. Do not claim a live voice integration has been verified from the sample or mocked tests.

## Before a live demonstration

- Configure both server-side Developer API keys and verify model access without assuming Plus credit portability.
- Confirm any event-specific rules announced to attendees.
- Test one English and one Hindi conversation with the intended Fish models.
- Verify microphone permissions, turn boundaries, caller playback, failure recovery, and transcript fidelity.
- Treat the scenario/assessment research in [research.md](research.md) as references, not a validated readiness instrument.

See [WORKLOG.md](WORKLOG.md) for actual checkpoints and [README.md](README.md) for the current setup and limitations.
