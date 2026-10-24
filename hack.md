# Fish-A-Thon Brief

Verified 24 October 2026. This is the active event; the earlier CALL-E competition no longer governs the project.

## Event facts

The organizer’s [Luma page](https://luma.com/nkuun44n) describes a Fish Audio build event on **24 October 2026**. Its schedule lists check-in at 09:00, a Fish session at 10:00, credits at 11:00, building from 11:15, and food/networking/demos from 14:30. Registration requires host approval. The listing calls it New Delhi while its location field says Gurugram; the precise address is available to registered guests.

The published page does **not** specify a judging rubric, submission portal, repository requirement, video duration, cash prize, team-size limit, rule about pre-existing work, or a particular model that entries must use. These remain unknown. The 14:30 demo slot is a schedule entry, not an independently published submission deadline. Event announcements or the hosts must settle those details.

## Project positioning

Emergency School provides repeated emergency-call practice through expressive synthetic callers. A trainee chooses incident interests, difficulty, language, and call frequency. Two modes share the same scenario engine:

- **Practice:** start immediately, with guided or hidden-scenario options.
- **Random Call:** receive an undisclosed scenario on the phone at an unpredictable time while availability is ON.

The home screen centers the availability switch. A completed call leads to a short review, supporting transcript evidence, and performance history. No curriculum enrollment or skill-focus selection is needed.

This positioning is a product decision, not an official event track. Fish’s expressive voices are a strong thematic match: [Drama 3](https://docs.fish.audio/features/text-to-speech/drama-3) accepts natural-language performance directions, sounds, and pauses. The demo should make those differences audible through a changing caller persona.

## Fish implementation findings

Fish has a [hosted Agents platform](https://docs.fish.audio/agents/overview), currently in public beta, with browser conversations, speech recognition, speech synthesis, and turn handling. This is the first implementation path to evaluate because it avoids constructing every voice component separately.

Use `drama-3` for speech and explicitly select `fish_audio:transcribe-stream-1` for Fish’s live transcription. The hosted agent’s default transcription provider is currently Deepgram; using Fish Agents alone does not mean Fish’s own transcription model is selected. See [voice and language configuration](https://docs.fish.audio/agents/build/voice-language). Language selection in the product should initially expose English and Hindi, subject to listening tests.

**Indian phone delivery is the main unresolved integration.** Fish documents an [outbound-call API](https://docs.fish.audio/agents/telephony/outbound-calls), but purchased numbers can currently dial only the US, Canada, Japan, UK, Italy, Australia, and Mexico. India is excluded. Fish also documents [bringing a carrier connection](https://docs.fish.audio/agents/telephony/byo-sip), which routes outbound calls through that carrier. A compatible carrier must actually support the intended Indian destination and account. No such route has been provisioned or tested here.

Browser voice practice is separately documented through the [Web SDK](https://docs.fish.audio/agents/deploy/web-sdk). It is useful for immediate practice and a demo, but an in-browser ringing screen does not demonstrate a real phone callback.

## Credits and costs

Plus/web credits and Developer API credit are separate balances; the existing Plus subscription must not be assumed to fund the app. Fish describes that distinction in its [credit explanation](https://fish.audio/es/blog/image-video-generation-mcp/?articleLocale=en).

[Agents pricing](https://docs.fish.audio/agents/pricing) lists a $0.06/minute base conversation rate, a $5 trial balance, and API credit for subsequent usage. Telephone delivery and some language models add charges. With an imported carrier, Fish bills the conversation and the carrier bills the phone leg. Four five-minute calls daily for 30 days would therefore cost **$36 in Fish base conversation fees**, before carrier and other additions. This is an illustrative calculation, not an account quote.

## Recommended demonstration

1. Select interests, language, difficulty, and grit.
2. Turn availability ON; show a clearly labeled shortened demo schedule.
3. Receive a real call if the Indian carrier route is verified.
4. Handle a caller whose uncertainty and delivery change during the conversation.
5. Open a review showing one successful action, one omission, and transcript evidence.
6. Turn availability OFF and show that a pending drill will not dispatch.

If carrier setup is unavailable, demonstrate browser practice and label phone callbacks as pending. Do not claim a completed callback integration from a mock ringing interface.

## Before building

- Check the Developer API balance and hosted Agents access without assuming Plus credit portability.
- Confirm any event-specific rules announced to attendees.
- Test one English and one Hindi conversation with the intended Fish models.
- Test one consenting Indian phone destination through the selected carrier.
- Use the prototype scoring and scenario rules in [research.md](research.md).

The detailed September notes are preserved under `docs/archive/` as historical material.
