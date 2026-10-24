import {
  ArrowRight,
  ArrowUpRight,
  AudioLines,
  BookOpen,
  Check,
  ChevronDown,
  Headphones,
  LoaderCircle,
  Phone,
  Plus,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { difficulties, domains } from "../../shared/scenarios.mjs";
import { exampleSession } from "../data/example.mjs";
import Waveform from "./Waveform.jsx";

export default function PracticeRoom({
  scope,
  setScope,
  expanded,
  setExpanded,
  connecting,
  status,
  onStart,
  onOpen,
  latest,
}) {
  const count =
    scope.domains.length +
    Number(Boolean(scope.difficulty)) +
    Number(Boolean(scope.language)) +
    Number(scope.mode === "guided");
  const change = (key, value) =>
    setScope((previous) => ({ ...previous, [key]: value }));
  const toggle = (id) =>
    change(
      "domains",
      scope.domains.includes(id)
        ? scope.domains.filter((d) => d !== id)
        : [...scope.domains, id],
    );
  return (
    <div className="practice-page">
      <div className="practice-intro">
        <span className="eyebrow">A safe place to find your voice</span>
        <h1>
          A new call.
          <br />
          <span>A different story.</span>
        </h1>
        <p>
          You won’t know who’s calling. That’s the practice.
          <br />
          Take a breath, pick up, and take it from there.
        </p>
      </div>
      <section
        className="practice-console"
        aria-label="Start an emergency training call"
      >
        <div className="console-topline">
          <span>
            <AudioLines size={16} />
            {scope.mode === "guided" ? "Guided practice" : "Random practice"}
          </span>
          <span className="console-note">
            {connecting
              ? "Preparing your caller"
              : "Your next story is unwritten"}
          </span>
        </div>
        <div className={`console-visual ${connecting ? "connecting" : ""}`}>
          <Waveform active={connecting} large />
          <div className="waveform-axis" />
        </div>
        <h2>
          {connecting
            ? "A voice on the other end…"
            : "Show up. We’ll bring the unexpected."}
        </h2>
        <p className="console-description">
          {scope.mode === "guided"
            ? "A little context before the conversation begins."
            : "A fresh situation. A human personality. No script to follow."}
        </p>
        <button
          className="button primary start-call"
          disabled={connecting || !status}
          onClick={onStart}
        >
          {connecting ? (
            <LoaderCircle size={19} className="spin" />
          ) : (
            <Phone size={18} />
          )}
          {connecting ? "Starting your call…" : "Start call"}
          {!connecting && <ArrowRight size={18} />}
        </button>
        <p className="console-caption">
          <Headphones size={13} />
          Headphones help. Being perfect doesn’t.
        </p>
        <div className="console-customize">
          <button
            className={`customize-toggle ${expanded ? "expanded" : ""}`}
            aria-expanded={expanded}
            aria-controls="customize-panel"
            onClick={() => setExpanded(!expanded)}
            disabled={connecting}
          >
            <SlidersHorizontal size={15} />
            {count
              ? `${count} optional ${count === 1 ? "preference" : "preferences"}`
              : "Want to shape the call?"}
            <span>Optional</span>
            <ChevronDown size={14} />
          </button>
        </div>
        {expanded && (
          <div className="customize-panel" id="customize-panel">
            <div className="customize-heading">
              <div>
                <h3>A little direction. Or none at all.</h3>
                <p>Leave anything blank and we’ll choose for you.</p>
              </div>
              <button
                className="text-button"
                onClick={() =>
                  setScope({
                    mode: "random",
                    domains: [],
                    difficulty: "",
                    language: "",
                  })
                }
              >
                <RotateCcw size={13} />
                Reset
              </button>
            </div>
            <fieldset>
              <legend className="field-label">
                Incident interests <span>Any, when none selected</span>
              </legend>
              <div className="scope-chips">
                {domains.map((domain) => (
                  <button
                    key={domain.id}
                    aria-pressed={scope.domains.includes(domain.id)}
                    className={`scope-chip ${scope.domains.includes(domain.id) ? "selected" : ""}`}
                    onClick={() => toggle(domain.id)}
                  >
                    {domain.name}
                    {scope.domains.includes(domain.id) ? (
                      <Check size={13} />
                    ) : (
                      <Plus size={13} />
                    )}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="scope-selects">
              <label>
                <span className="field-label">Difficulty</span>
                <span className="select-wrap">
                  <select
                    aria-label="Optional difficulty"
                    value={scope.difficulty}
                    onChange={(e) => change("difficulty", e.target.value)}
                  >
                    <option value="">Surprise me</option>
                    {difficulties.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} />
                </span>
              </label>
              <label>
                <span className="field-label">Language</span>
                <span className="select-wrap">
                  <select
                    aria-label="Optional language"
                    value={scope.language}
                    onChange={(e) => change("language", e.target.value)}
                  >
                    <option value="">Default · English</option>
                    <option value="en">English</option>
                    <option value="hi">हिन्दी · Hindi</option>
                  </select>
                  <ChevronDown size={14} />
                </span>
              </label>
            </div>
            <label className="guided-switch">
              <span>
                <BookOpen size={18} />
                <span>
                  <strong>A little guidance</strong>
                  <small>See a briefing and question prompts.</small>
                </span>
              </span>
              <input
                type="checkbox"
                role="switch"
                aria-label="Guided practice"
                checked={scope.mode === "guided"}
                onChange={(e) =>
                  change("mode", e.target.checked ? "guided" : "random")
                }
              />
              <span className="switch-track" aria-hidden="true" />
            </label>
          </div>
        )}
      </section>
      <div className="practice-understory">
        <span>
          <ShieldCheck size={13} />
          Fictional calls. Real room to grow.
        </span>
        <span>
          Voices by{" "}
          <a href="https://fish.audio/" target="_blank" rel="noreferrer">
            Fish Audio
            <ArrowUpRight size={11} />
          </a>
        </span>
      </div>
      <section className="debrief-peek">
        <div className="debrief-peek-icon">
          <BookOpen size={21} />
        </div>
        <div>
          <span className="eyebrow">
            {latest ? "Keep the conversation going" : "After the call"}
          </span>
          <h3>
            {latest
              ? "Your latest call, with a little perspective."
              : "The best part is what you take away."}
          </h3>
          <p>
            {latest
              ? latest.scenario?.title || "Your latest conversation"
              : "A thoughtful debrief. The moments that mattered. One thing to try next."}
          </p>
        </div>
        <button
          className="peek-link"
          onClick={() => onOpen(latest || exampleSession)}
        >
          {latest ? "Open debrief" : "See an example"}
          <ArrowUpRight size={17} />
        </button>
      </section>
    </div>
  );
}
