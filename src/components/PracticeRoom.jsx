import { useState } from "react";
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
  const [showAllTypes, setShowAllTypes] = useState(false);
  const visibleDomains = domains.filter(
    (domain, index) =>
      index < 6 || showAllTypes || scope.domains.includes(domain.id),
  );
  const hiddenTypeCount = domains
    .slice(6)
    .filter((domain) => !scope.domains.includes(domain.id)).length;
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
        <h1>
          Emergency <span>call-taker</span> training
        </h1>
        <p>
          You act as the 112 operator. An AI caller describes an emergency and
          responds to your questions. When the call ends, get a scored review of
          your decisions, with references to the conversation.
        </p>
      </header>

      <section
        className="practice-console"
        aria-label="Start an emergency training call"
      >
        <div className="console-topline">
          <span>Your next call</span>
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
                  : "A new incident is generated for each call. Find out what happened by talking to the caller, without a scenario briefing."}
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
                onClick={() => {
                  setScope({
                    mode: "random",
                    domains: [],
                    difficulty: "",
                    language: "",
                  });
                  setShowAllTypes(false);
                }}
              >
                Reset
              </button>
            </div>
            <fieldset>
              <legend className="field-label">Incident types</legend>
              <div className="scope-chips" id="incident-type-options">
                {visibleDomains.map((domain) => (
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
              {(showAllTypes || hiddenTypeCount > 0) && (
                <button
                  className="text-button incident-types-toggle"
                  aria-expanded={showAllTypes}
                  aria-controls="incident-type-options"
                  onClick={() => setShowAllTypes(!showAllTypes)}
                >
                  {showAllTypes
                    ? "Show fewer types"
                    : `Show ${hiddenTypeCount} more types`}
                  <ChevronDown size={14} />
                </button>
              )}
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

      <section
        className="practice-review"
        aria-labelledby="practice-review-title"
      >
        <div>
          <h2 id="practice-review-title">After the call</h2>
          <p>
            Review how you established the location, checked for immediate
            danger, and followed up on missing details. See the evidence behind
            each scored checkpoint, not just an overall mark.
          </p>
        </div>
        <button
          className="button secondary"
          onClick={() => onOpen(exampleSession)}
        >
          View example review
          <ArrowUpRight size={15} />
        </button>
      </section>

      {latest && (
        <section className="recent-sessions" aria-labelledby="recent-title">
          <div className="recent-heading">
            <h2 id="recent-title">Recent sessions</h2>
            <button className="text-button" onClick={onHistory}>
              View all
              <ArrowRight size={14} />
            </button>
          </div>
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
        </section>
      )}
    </div>
  );
}
