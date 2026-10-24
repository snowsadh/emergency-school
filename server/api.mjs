import { validateSetup } from "../shared/scenarios.mjs";
import {
  createIntelligence,
  plainDialogue,
  validateDialogue,
} from "./intelligence.mjs";

export function createApi({
  env = process.env,
  fetchImpl = fetch,
  intelligence = createIntelligence(env),
} = {}) {
  // ponytail: single-process active calls. Add durable sessions before multi-server deployment.
  const sessions = new Map();
  let attempts = [];
  const openaiConfigured = Boolean(env.OPENAI_API_KEY);
  const fishConfigured = Boolean(env.FISH_API_KEY);
  const defaultVoice = "c70cfb98867a4bfb9ae20d2401257b92"; // Delia, official Drama 3 example voice.

  async function speech(dialogue, signal) {
    const response = await fetchImpl("https://api.fish.audio/v1/tts", {
      method: "POST",
      signal: AbortSignal.any([signal, AbortSignal.timeout(30_000)]),
      headers: {
        Authorization: `Bearer ${env.FISH_API_KEY}`,
        "Content-Type": "application/json",
        model: "drama-3",
      },
      body: JSON.stringify({
        text: validateDialogue(dialogue),
        reference_id: env.FISH_VOICE_ID || defaultVoice,
        format: "mp3",
      }),
    });
    if (!response.ok)
      throw new Error(
        "Fish could not generate speech. Check Developer API credit and your voice ID.",
      );
    const audio = Buffer.from(await response.arrayBuffer());
    if (!audio.length || audio.length > 5_000_000)
      throw new Error("Fish returned an invalid audio response.");
    return audio.toString("base64");
  }
  function callerLine(session, dialogue) {
    const turn = {
      segmentId: crypto.randomUUID(),
      role: "agent",
      text: plainDialogue(dialogue),
      dialogue,
      at: Math.floor((Date.now() - session.startedAt) / 1000),
      final: true,
    };
    session.transcript.push(turn);
    return turn;
  }

  return async function api(req, res) {
    const path = new URL(req.url, "http://localhost").pathname;
    if (!path.startsWith("/api/")) return false;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    const send = (status, data) => {
      res.writeHead(status);
      res.end(JSON.stringify(data));
      return true;
    };
    if (path === "/api/status" && req.method === "GET")
      return send(200, {
        openaiConfigured,
        fishConfigured,
        voiceConfigured: openaiConfigured && fishConfigured,
        model: env.OPENAI_MODEL || "gpt-4.1",
        audioStored: false,
      });
    if (req.method !== "POST") return send(404, { error: "Not found." });
    const origin = req.headers.origin;
    if (
      origin &&
      origin !== `http://${req.headers.host}` &&
      origin !== `https://${req.headers.host}`
    )
      return send(403, { error: "Only same-origin requests are allowed." });
    if (!req.headers["content-type"]?.startsWith("application/json"))
      return send(415, { error: "Expected JSON." });
    let body;
    try {
      const chunks = [];
      let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 10_000_000)
          return send(413, {
            error: "Audio turn is too large. Keep it under 30 seconds.",
          });
        chunks.push(chunk);
      }
      body = JSON.parse(Buffer.concat(chunks).toString() || "{}");
      if (!body || typeof body !== "object" || Array.isArray(body))
        throw new Error();
    } catch {
      return send(400, { error: "Invalid request body." });
    }
    const now = Date.now();
    for (const [id, session] of sessions)
      if (now - session.startedAt > 60 * 60_000) {
        session.abort?.abort();
        sessions.delete(id);
      }

    if (path === "/api/sessions") {
      let scope;
      try {
        scope = validateSetup(body.scope);
      } catch (error) {
        return send(400, { error: error.message });
      }
      const kind = body.kind || "voice";
      if (!["voice", "text"].includes(kind))
        return send(400, { error: "Invalid call type." });
      if (!openaiConfigured || (kind === "voice" && !fishConfigured))
        return send(503, {
          error:
            "Add OPENAI_API_KEY and FISH_API_KEY to .env, then restart the server. No signup or practice preferences are required.",
        });
      attempts = attempts.filter((time) => now - time < 60_000);
      if (attempts.length >= 6 || sessions.size >= 100)
        return send(429, {
          error: "Please wait a minute before starting another call.",
        });
      attempts.push(now);
      const abort = new AbortController();
      try {
        const scenario = await intelligence.generate(scope, abort.signal);
        const session = {
          id: crypto.randomUUID(),
          kind,
          scope,
          scenario,
          startedAt: Date.now(),
          transcript: [],
          ended: false,
          abort,
        };
        const caller = callerLine(session, scenario.opening);
        let audio = null;
        let audioError = null;
        if (kind === "voice")
          try {
            audio = await speech(caller.dialogue, abort.signal);
          } catch (error) {
            audioError = error.message;
          }
        sessions.set(session.id, session);
        return send(200, {
          id: session.id,
          kind,
          startedAt: session.startedAt,
          setup: {
            mode: scope.mode,
            language: scenario.language,
            difficulty: scenario.difficulty,
            domains: scope.domains,
          },
          briefing:
            scope.mode === "guided"
              ? { title: scenario.title, brief: scenario.brief }
              : null,
          caller,
          audio,
          audioError,
        });
      } catch {
        return send(502, {
          error:
            "The scenario could not be generated. Check your OpenAI key, model access, and API credit, then try again.",
        });
      }
    }

    const match = path.match(/^\/api\/sessions\/([a-f0-9-]+)\/(turn|end)$/);
    if (!match) return send(404, { error: "Not found." });
    const session = sessions.get(match[1]);
    if (!session)
      return send(404, {
        error:
          "This call expired or the server restarted. Your local transcript can still be saved.",
      });
    if (match[2] === "end") {
      if (session.reviewPromise) return send(200, await session.reviewPromise);
      session.ended = true;
      session.abort?.abort();
      session.duration = Math.floor((now - session.startedAt) / 1000);
      const played = new Set(
        Array.isArray(body.playedCallerIds)
          ? body.playedCallerIds.filter((v) => typeof v === "string")
          : [],
      );
      session.transcript = session.transcript.map((t) =>
        t.role === "agent"
          ? {
              ...t,
              playbackConfirmed:
                session.kind === "text" || played.has(t.segmentId),
            }
          : t,
      );
      session.reviewPromise = (async () => {
        let review = null;
        let reviewError = null;
        try {
          review = await intelligence.review(
            session,
            AbortSignal.timeout(45_000),
          );
        } catch {
          reviewError =
            "The AI review could not be generated. Your transcript is preserved; no performance score has been invented.";
        }
        return {
          id: session.id,
          kind: session.kind,
          scenario: session.scenario,
          setup: {
            ...session.scope,
            difficulty: session.scenario.difficulty,
            language: session.scenario.language,
          },
          transcript: session.transcript,
          duration: session.duration,
          createdAt: new Date().toISOString(),
          review,
          reviewError,
        };
      })();
      return send(200, await session.reviewPromise);
    }
    if (session.ended) return send(409, { error: "This call has ended." });
    if (session.busy)
      return send(409, {
        error: "Wait for the caller’s response before sending another turn.",
      });
    if (session.transcript.length >= 120)
      return send(422, {
        error:
          "This practice call has reached its turn limit. End the call to open your debrief.",
      });
    const hasText =
      typeof body.text === "string" &&
      body.text.trim().length > 0 &&
      body.text.length <= 4000;
    const mimeType =
      typeof body.mimeType === "string" ? body.mimeType.split(";")[0] : "";
    const hasAudio =
      typeof body.audio === "string" &&
      body.audio.length > 100 &&
      body.audio.length < 8_000_000 &&
      /^[A-Za-z0-9+/]*={0,2}$/.test(body.audio) &&
      ["audio/webm", "audio/mp4", "audio/ogg", "audio/wav"].includes(mimeType);
    if ((!hasText && !hasAudio) || (hasText && hasAudio))
      return send(400, {
        error: "Send one text response or a supported audio recording.",
      });
    session.busy = true;
    session.abort = new AbortController();
    let userTurn;
    try {
      const text = hasText
        ? body.text.trim()
        : await intelligence.transcribe(
            Buffer.from(body.audio, "base64"),
            mimeType,
            session.scenario.language,
            session.abort.signal,
          );
      if (session.ended) return send(409, { error: "The call has ended." });
      userTurn = {
        segmentId: crypto.randomUUID(),
        role: "user",
        text,
        at: Math.floor((Date.now() - session.startedAt) / 1000),
        final: true,
      };
      session.transcript.push(userTurn);
      const reply = await intelligence.reply(session, session.abort.signal);
      if (session.ended) return send(409, { error: "The call has ended." });
      const caller = callerLine(session, reply.dialogue);
      let audio = null;
      let audioError = null;
      if (session.kind === "voice")
        try {
          audio = await speech(caller.dialogue, session.abort.signal);
        } catch (error) {
          audioError = error.message;
        }
      if (session.ended) return send(409, { error: "The call has ended." });
      return send(200, {
        user: userTurn,
        caller,
        audio,
        audioError,
        callerEnded: reply.endCall,
      });
    } catch {
      return send(502, {
        user: userTurn,
        error:
          "That turn could not be completed. Your earlier conversation is safe. Try another response or end the call.",
      });
    } finally {
      session.busy = false;
    }
  };
}
