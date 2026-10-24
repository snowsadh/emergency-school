import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  LoaderCircle,
  Phone,
  Plus,
  SlidersHorizontal,
} from "lucide-react";
import { difficulties, domains, formatTime } from "../../shared/scenarios.mjs";
import { exampleSession } from "../data/example.mjs";

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
  onHistory,
}) {
  const count =
    scope.domains.length +
    Number(Boolean(scope.difficulty)) +
    Number(Boolean(scope.language)) +
    Number(scope.mode === "guided");
  const guided = scope.mode === "guided";
  const change = (key, value) =>
    setScope((previous) => ({ ...previous, [key]: value }));
  const toggle = (id) =>
    change(
      "domains",
      scope.domains.includes(id)
        ? scope.domains.filter((d) => d !== id)
        : [...scope.domains, id],
    );
  const difficulty =
    difficulties.find((d) => d.id === scope.difficulty)?.name ||
    "Any difficulty";

  return (
    <div className="practice-page">
      <header className="practice-intro">
        <h1>Call practice</h1>
        <p>Take a call. Review your response when it ends.</p>
      </header>

      <section
        className="practice-console"
        aria-label="Start an emergency training call"
      >
        <div className="console-topline">
          <span>New session</span>
          <span className="session-mode">
            {guided ? "Guided practice" : "Random call"}
          </span>
        </div>
        <div className="session-surface">
          <div className="session-brief">
            <div className="line-label">
              <span />
              Browser call
            </div>
            <h2>
              {connecting
                ? "Connecting…"
                : guided
                  ? "Guided call"
                  : "Unknown caller"}
            </h2>
            <p>
              {connecting
                ? "Generating the incident and caller."
                : guided
                  ? "A scenario briefing and question prompts will be available during the call."
                  : "The incident and caller are revealed through the conversation. No briefing, no prepared script."}
            </p>
            <div
              className="session-scope"
              aria-label="Current optional preferences"
            >
              <span>
                {scope.domains.length
                  ? `${scope.domains.length} incident ${scope.domains.length === 1 ? "type" : "types"}`
                  : "Any incident"}
              </span>
              <span>{difficulty}</span>
              <span>{scope.language === "hi" ? "Hindi" : "English"}</span>
            </div>
          </div>
          <div className="session-action">
            <div className="training-line" aria-hidden="true">
              <span>112</span>
              <small>TRAINING</small>
            </div>
            <button
              className="button primary start-call"
              disabled={connecting || !status}
              onClick={onStart}
            >
              {connecting ? (
                <LoaderCircle className="spin" size={17} />
              ) : (
                <Phone size={17} />
              )}
              {connecting ? "Starting call…" : "Start call"}
              {!connecting && <ArrowUpRight size={16} />}
            </button>
            <span className="session-device-note">
              Browser audio · No phone number
            </span>
          </div>
        </div>
        <div className="console-toolbar">
          <button
            className="customize-toggle"
            aria-expanded={expanded}
            aria-controls="customize-panel"
            disabled={connecting}
            onClick={() => setExpanded(!expanded)}
          >
            <SlidersHorizontal size={15} />
            {count ? `Call preferences · ${count}` : "Customize call"}
            <span>Optional</span>
            <ChevronDown size={14} />
          </button>
          <span className="provider-credit">
            Voice by{" "}
            <a href="https://fish.audio/" target="_blank" rel="noreferrer">
              Fish Audio
              <ArrowUpRight size={10} />
            </a>
          </span>
        </div>
        {expanded && (
          <div className="customize-panel" id="customize-panel">
            <div className="customize-heading">
              <div>
                <h3>Call preferences</h3>
                <p>Leave these open for a fully random scenario.</p>
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
                Reset
              </button>
            </div>
            <fieldset>
              <legend className="field-label">Incident types</legend>
              <div className="scope-chips">
                {domains.map((domain) => (
                  <button
                    key={domain.id}
                    className={`scope-chip ${scope.domains.includes(domain.id) ? "selected" : ""}`}
                    aria-pressed={scope.domains.includes(domain.id)}
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
                    <option value="">Any difficulty</option>
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
                <strong>Guided mode</strong>
                <small>
                  Show a briefing and question prompts during the call.
                </small>
              </span>
              <input
                type="checkbox"
                role="switch"
                aria-label="Guided practice"
                checked={guided}
                onChange={(e) =>
                  change("mode", e.target.checked ? "guided" : "random")
                }
              />
              <span className="switch-track" aria-hidden="true" />
            </label>
          </div>
        )}
      </section>

      <section className="recent-sessions" aria-labelledby="recent-title">
        <div className="recent-heading">
          <h2 id="recent-title">Recent sessions</h2>
          <button className="text-button" onClick={onHistory}>
            View all
            <ArrowRight size={14} />
          </button>
        </div>
        {latest ? (
          <button className="recent-session" onClick={() => onOpen(latest)}>
            <div>
              <strong>{latest.scenario?.title || "Practice session"}</strong>
              <span>
                {latest.kind === "sample"
                  ? "Text sample"
                  : latest.kind === "voice"
                    ? "Voice call"
                    : "Text practice"}{" "}
                · {latest.setup.mode === "guided" ? "Guided" : "Random"}
              </span>
            </div>
            <time>{formatTime(latest.duration)}</time>
            <ArrowUpRight size={16} />
          </button>
        ) : (
          <div className="recent-empty">
            <p>No completed calls yet.</p>
            <span>
              Your transcript and debrief will appear here after a session.
            </span>
          </div>
        )}
      </section>
      <div className="example-link-row">
        <span>Want to see the report format?</span>
        <button className="text-button" onClick={() => onOpen(exampleSession)}>
          Example debrief
          <ArrowUpRight size={13} />
        </button>
      </div>
    </div>
  );
}
