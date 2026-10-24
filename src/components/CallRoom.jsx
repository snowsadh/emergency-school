import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  FileText,
  Headphones,
  LoaderCircle,
  Mic,
  MicOff,
  PhoneOff,
  Send,
} from "lucide-react";
import { formatTime } from "../../shared/scenarios.mjs";
import Waveform from "./Waveform.jsx";

const questions = {
  en: [
    "Where exactly are you?",
    "Are you somewhere safe right now?",
    "Tell me what you can see.",
    "Can I confirm your name and callback details?",
  ],
  hi: [
    "आप अभी कहाँ हैं?",
    "क्या आप अभी सुरक्षित हैं?",
    "आपको क्या दिख रहा है?",
    "आपका नाम और कॉलबैक विवरण मिल सकता है?",
  ],
};

export default function CallRoom({ practice }) {
  const {
    session,
    mode,
    muted,
    ending,
    level,
    send,
    finish,
    toggleMic,
    sendVoice,
  } = practice;
  const [elapsed, setElapsed] = useState(0);
  const [text, setText] = useState("");
  const [showTranscript, setShowTranscript] = useState(
    session.kind !== "voice",
  );
  const scrollRef = useRef(null);
  const voice = session.kind === "voice";
  const pending = mode === "thinking" || mode === "speaking" || ending;
  const guided = session.setup.mode === "guided";
  useEffect(() => {
    const timer = setInterval(
      () => setElapsed((Date.now() - session.startedAt) / 1000),
      1000,
    );
    return () => clearInterval(timer);
  }, [session.startedAt]);
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [session.transcript]);
  const submit = (event) => {
    event.preventDefault();
    if (!text.trim() || pending) return;
    send({ text: text.trim() });
    setText("");
  };

  return (
    <div className={`call-page ${guided ? "with-guide" : ""}`}>
      <header className="call-heading">
        <div>
          <span className="eyebrow">
            {session.kind === "sample"
              ? "Scripted text sample"
              : voice
                ? "Practice session"
                : "Generated text practice"}
          </span>
          <h1>
            {guided
              ? session.briefing?.title || session.scenario?.title
              : "Random call"}
          </h1>
        </div>
        <span className="pill">
          {guided ? "Guided" : "Random"}
          <span>·</span>
          {formatTime(elapsed)}
        </span>
      </header>
      {session.kind === "sample" && (
        <p className="call-notice">
          A text-only sample with scripted replies. No microphone, OpenAI, or
          Fish is being used.
        </p>
      )}
      {session.kind === "text" && (
        <p className="call-notice">
          OpenAI is generating this conversation. Fish voice isn’t connected, so
          responses are text-only.
        </p>
      )}
      <div className="call-grid">
        <div className="call-primary">
          <section
            className={`call-stage ${!voice && !ending ? "text-stage" : ""}`}
          >
            <span className="call-state">
              <span
                className={`state-dot ${mode === "thinking" ? "thinking" : ""}`}
              />
              {ending
                ? "Preparing your debrief"
                : voice
                  ? mode === "speaking"
                    ? "Caller speaking"
                    : mode === "thinking"
                      ? "Preparing reply"
                      : muted
                        ? "Microphone muted"
                        : mode === "error"
                          ? "Microphone unavailable"
                          : "Listening to you"
                  : mode === "thinking"
                    ? "Caller is replying"
                    : "Your turn"}
            </span>
            {voice && (
              <Waveform
                large
                active={
                  !muted && ["listening", "speaking"].includes(mode) && !ending
                }
                level={level}
              />
            )}
            {ending && <h2>Call complete</h2>}
            {(voice || ending) && (
              <p>
                {ending
                  ? "Saving the transcript and preparing your debrief."
                  : voice
                    ? mode === "error"
                      ? "You can continue by typing a response."
                      : muted
                        ? "Unmute to speak, or type a response."
                        : mode === "listening"
                          ? "Pause after speaking to send automatically, or press Send voice."
                          : mode === "thinking"
                            ? "Transcribing your response and preparing the reply."
                            : "Your microphone pauses while the caller speaks."
                    : "Type your response to continue the call."}
              </p>
            )}
            <div className="call-buttons">
              {voice && (
                <button
                  className={`icon-button microphone-button ${muted ? "is-muted" : ""}`}
                  aria-label={muted ? "Unmute microphone" : "Mute microphone"}
                  aria-pressed={muted}
                  disabled={ending}
                  onClick={toggleMic}
                >
                  {muted ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
              )}
              {voice && (
                <button
                  className="button secondary"
                  onClick={sendVoice}
                  disabled={mode !== "listening" || muted || ending}
                >
                  <Send size={16} />
                  Send voice
                </button>
              )}
              <button
                className="button end-call"
                onClick={finish}
                disabled={ending}
              >
                {ending ? (
                  <LoaderCircle size={18} className="spin" />
                ) : (
                  <PhoneOff size={18} />
                )}
                {ending ? "Preparing debrief…" : "End call"}
              </button>
            </div>
          </section>
          <section className="transcript-panel">
            <div className="transcript-heading">
              <h3>
                <FileText size={16} />
                Conversation
              </h3>
              {voice && (
                <button
                  className="text-button"
                  aria-expanded={showTranscript}
                  onClick={() => setShowTranscript(!showTranscript)}
                >
                  {showTranscript ? "Hide transcript" : "Show transcript"}
                  <ChevronDown size={14} />
                </button>
              )}
              {!voice && (
                <span className="muted">
                  {session.kind === "sample" ? "Scripted sample" : "Live text"}
                </span>
              )}
            </div>
            {showTranscript ? (
              <div
                className="live-transcript"
                ref={scrollRef}
                aria-live="polite"
                aria-relevant="additions"
              >
                {session.transcript.map((turn) => (
                  <div
                    key={turn.segmentId}
                    className={`live-turn ${turn.role}`}
                  >
                    <div>
                      <strong>{turn.role === "user" ? "You" : "Caller"}</strong>
                      <time>{formatTime(turn.at)}</time>
                    </div>
                    <p>{turn.text}</p>
                  </div>
                ))}
                {mode === "thinking" && (
                  <p className="typing-indicator">
                    Caller is replying<span>···</span>
                  </p>
                )}
              </div>
            ) : (
              <div className="transcript-hidden">
                <Headphones size={20} />
                <p>
                  Transcript hidden
                  <span>Show it at any point during the call.</span>
                </p>
              </div>
            )}
            <form className="response-form" onSubmit={submit}>
              <input
                aria-label="Your response to the caller"
                placeholder={
                  voice ? "Or type a response…" : "Ask the caller a question…"
                }
                value={text}
                maxLength={4000}
                onChange={(event) => setText(event.target.value)}
                disabled={ending}
                autoFocus={!voice}
              />
              <button
                className="icon-button send-response"
                aria-label="Send response"
                disabled={!text.trim() || pending}
              >
                <Send size={17} />
              </button>
            </form>
          </section>
        </div>
        {guided && (
          <aside className="call-guide">
            <BookOpen size={23} />
            <span className="eyebrow">Guided mode</span>
            <h2>Scenario briefing</h2>
            <p>{session.briefing?.brief || session.scenario?.brief}</p>
            <div className="guide-questions">
              <span className="field-label">Questions to explore</span>
              {questions[session.setup.language || "en"].map((question) => (
                <button
                  className="guide-question"
                  key={question}
                  disabled={pending}
                  onClick={() => send({ text: question })}
                >
                  {question}
                  <ArrowRight size={14} />
                </button>
              ))}
            </div>
            <p className="fine-print">
              Prompts for practice, not an agency protocol. Follow your
              instructor’s guidance.
            </p>
          </aside>
        )}
      </div>
    </div>
  );
}
