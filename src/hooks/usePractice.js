import { useEffect, useRef, useState } from "react";
import {
  chooseScenario,
  difficulties,
  rehearsalReply,
} from "../../shared/scenarios.mjs";
import { createVoice } from "../voice.mjs";

async function request(path, body, signal) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  const result = await response.json();
  if (!response.ok) {
    const error = new Error(
      result.error || "The request could not be completed.",
    );
    error.result = result;
    throw error;
  }
  return result;
}

export default function usePractice(onComplete) {
  const [session, setSession] = useState(null);
  const [mode, setMode] = useState("listening");
  const [level, setLevel] = useState(0);
  const [muted, setMuted] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [ending, setEnding] = useState(false);
  const [error, setError] = useState("");
  const current = useRef(null);
  const voice = useRef(null);
  const pending = useRef(false);
  const starting = useRef(false);
  const closing = useRef(false);
  const controller = useRef(null);
  const playedIds = useRef(new Set());
  const sendRef = useRef(null);
  const finishRef = useRef(null);

  const update = (value) => {
    current.current = value;
    setSession(value);
  };
  const append = (turns) => {
    if (!current.current || closing.current) return;
    const ids = new Set(current.current.transcript.map((t) => t.segmentId));
    update({
      ...current.current,
      transcript: [
        ...current.current.transcript,
        ...turns.filter((t) => t && !ids.has(t.segmentId)),
      ],
    });
  };
  const playReply = async (result) => {
    if (result.audioError)
      setError(
        `${result.audioError} The caller’s reply is available in the transcript.`,
      );
    if (current.current?.kind === "voice") {
      await voice.current.play(result.audio, () => {
        playedIds.current.add(result.caller.segmentId);
        if (result.callerEnded) finishRef.current();
      });
      if (!result.audio && result.callerEnded) finishRef.current();
    } else if (result.callerEnded) finishRef.current();
    else setMode("listening");
  };

  async function start(kind, scope) {
    if (starting.current || current.current) return;
    starting.current = true;
    closing.current = false;
    setConnecting(true);
    setError("");
    pending.current = false;
    playedIds.current = new Set();
    controller.current = new AbortController();
    try {
      if (kind === "voice")
        voice.current = await createVoice({
          onTurn: (payload) => sendRef.current(payload),
          onState: setMode,
          onLevel: setLevel,
          onError: setError,
        });
      if (kind === "sample") {
        const scenario = chooseScenario(scope);
        const resolved = {
          ...scope,
          language: scope.language || "en",
          difficulty:
            scope.difficulty ||
            difficulties[Math.floor(Math.random() * difficulties.length)].id,
        };
        const caller = {
          segmentId: crypto.randomUUID(),
          role: "agent",
          text:
            resolved.language === "hi" ? scenario.openingHi : scenario.opening,
          at: 0,
          final: true,
        };
        update({
          id: crypto.randomUUID(),
          kind,
          setup: resolved,
          scenario,
          startedAt: Date.now(),
          transcript: [caller],
        });
        setMode("listening");
      } else {
        const result = await request(
          "/api/sessions",
          { kind, scope },
          controller.current.signal,
        );
        update({
          id: result.id,
          kind,
          setup: result.setup,
          briefing: result.briefing,
          startedAt: result.startedAt,
          transcript: [result.caller],
        });
        await playReply(result);
      }
      setMuted(false);
    } catch (cause) {
      voice.current?.close();
      voice.current = null;
      update(null);
      setError(
        cause.name === "NotAllowedError"
          ? "Microphone access is blocked. Allow it in your browser settings, or try a text rehearsal."
          : cause.message || "The call could not start. Try again.",
      );
    } finally {
      starting.current = false;
      setConnecting(false);
    }
  }

  async function send(payload) {
    if (!current.current || pending.current || closing.current) return;
    pending.current = true;
    setMode("thinking");
    voice.current?.pause();
    setError("");
    const snapshot = current.current;
    try {
      if (snapshot.kind === "sample") {
        const text = payload.text?.trim();
        if (!text) return;
        const at = Math.floor((Date.now() - snapshot.startedAt) / 1000);
        append([
          {
            segmentId: crypto.randomUUID(),
            role: "user",
            text,
            at,
            final: true,
          },
        ]);
        await new Promise((resolve) => setTimeout(resolve, 350));
        if (!closing.current && current.current?.id === snapshot.id) {
          append([
            {
              segmentId: crypto.randomUUID(),
              role: "agent",
              text: rehearsalReply(snapshot.scenario, snapshot.setup, text),
              at: Math.floor((Date.now() - snapshot.startedAt) / 1000),
              final: true,
            },
          ]);
          setMode("listening");
        }
      } else {
        controller.current = new AbortController();
        const result = await request(
          `/api/sessions/${snapshot.id}/turn`,
          payload,
          controller.current.signal,
        );
        if (closing.current) return;
        append([result.user, result.caller]);
        await playReply(result);
      }
    } catch (cause) {
      if (!closing.current) {
        if (cause.result?.user) append([cause.result.user]);
        setError(
          cause.message ||
            "That response could not be sent. Try again, or end the call to keep your transcript.",
        );
        voice.current?.listen();
        setMode("listening");
      }
    } finally {
      if (!current.current || current.current.id === snapshot.id)
        pending.current = false;
    }
  }
  sendRef.current = send;

  async function finish() {
    if (!current.current || closing.current) return;
    closing.current = true;
    setEnding(true);
    controller.current?.abort();
    voice.current?.close();
    voice.current = null;
    const snapshot = current.current;
    let finished;
    try {
      if (snapshot.kind === "sample")
        finished = {
          ...snapshot,
          duration: Math.floor((Date.now() - snapshot.startedAt) / 1000),
          createdAt: new Date().toISOString(),
          review: null,
        };
      else
        finished = await request(
          `/api/sessions/${snapshot.id}/end`,
          { playedCallerIds: [...playedIds.current] },
          AbortSignal.timeout(60_000),
        );
    } catch {
      finished = {
        ...snapshot,
        scenario: {
          title: snapshot.briefing?.title || "An unfinished conversation",
          domain: null,
        },
        duration: Math.floor((Date.now() - snapshot.startedAt) / 1000),
        createdAt: new Date().toISOString(),
        review: null,
        reviewError:
          "The server could not return the debrief. Your available transcript has been preserved on this device.",
      };
    }
    update(null);
    setEnding(false);
    setMuted(false);
    setLevel(0);
    setError("");
    onComplete(finished);
  }
  finishRef.current = finish;

  function toggleMic() {
    const next = !muted;
    setMuted(next);
    voice.current?.setMuted(next);
  }
  useEffect(
    () => () => {
      controller.current?.abort();
      voice.current?.close();
    },
    [],
  );
  useEffect(() => {
    const prevent = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    if (session || connecting) window.addEventListener("beforeunload", prevent);
    return () => window.removeEventListener("beforeunload", prevent);
  }, [session, connecting]);
  return {
    session,
    mode,
    level,
    muted,
    connecting,
    ending,
    error,
    clearError: () => setError(""),
    start,
    send,
    finish,
    toggleMic,
  };
}
