import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  Clock3,
  FolderOpen,
  Trash2,
} from "lucide-react";
import { domains, formatTime } from "../../shared/scenarios.mjs";
import { exampleSession } from "../data/example.mjs";
import "../styles/debrief.css";
function dateLabel(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}
export default function SessionHistory({
  sessions,
  onOpen,
  onPractice,
  onClear,
}) {
  const [confirmingClear, setConfirmingClear] = useState(false);
  const actual = sessions.filter((session) => !session.example);
  return (
    <div className="history-page">
      <header className="page-heading history-heading">
        <div>
          <span className="eyebrow">Your practice, kept close</span>
          <h1>Call journal</h1>
          <p>A place to look back, notice something, and try again.</p>
        </div>
        <button className="button primary" onClick={onPractice}>
          New call <ArrowRight size={16} />
        </button>
      </header>

      {actual.length ? (
        <section className="session-list" aria-label="Completed sessions">
          <div className="session-list-heading">
            <h2>
              {actual.length} {actual.length === 1 ? "session" : "sessions"}
            </h2>
            <span className="muted">Saved in this browser</span>
          </div>
          {actual.map((session) => (
            <button
              className="session-row"
              key={session.id}
              onClick={() => onOpen(session)}
            >
              <span className="session-row-icon">
                <BookOpen size={19} />
              </span>
              <span className="session-row-main">
                <strong>{session.scenario?.title || "Practice session"}</strong>
                <span>
                  {domains.find(
                    (domain) => domain.id === session.scenario?.domain,
                  )?.name || "Open scenario"}
                  <span className="session-divider">·</span>
                  {session.setup?.mode === "guided" ? "Guided" : "Random"}
                  {session.kind === "sample" && (
                    <>
                      <span className="session-divider">·</span>Text rehearsal
                    </>
                  )}
                </span>
              </span>
              <span className="session-row-date">
                {dateLabel(session.createdAt)}
              </span>
              <span className="session-row-duration">
                <Clock3 size={13} />
                {formatTime(session.duration)}
              </span>
              <ChevronRight size={17} className="session-row-chevron" />
            </button>
          ))}
        </section>
      ) : (
        <section className="journal-empty">
          <div className="journal-empty-mark">
            <FolderOpen size={28} strokeWidth={1.5} />
          </div>
          <h2>Your first call is a fresh page.</h2>
          <p>
            Finish a practice call and its conversation and debrief will appear
            here. Nothing to fill in first.
          </p>
          <button className="button secondary" onClick={onPractice}>
            Start a random call <ArrowRight size={16} />
          </button>
        </section>
      )}

      <section className="example-report-row">
        <div className="example-report-icon">
          <BookOpen size={20} />
        </div>
        <div>
          <span className="eyebrow">A look inside</span>
          <h2>See what a debrief feels like.</h2>
          <p>An authored example. Separate from your practice history.</p>
        </div>
        <button className="text-button" onClick={() => onOpen(exampleSession)}>
          Open example <ArrowRight size={16} />
        </button>
      </section>

      {actual.length > 0 && (
        <div className="clear-history-area">
          {confirmingClear ? (
            <div className="clear-history-confirm">
              <p>
                Clear the sessions saved in this browser? Export any reports you
                want to keep first.
              </p>
              <button
                className="text-button danger-text"
                onClick={() => {
                  onClear();
                  setConfirmingClear(false);
                }}
              >
                Yes, clear history
              </button>
              <button
                className="text-button"
                onClick={() => setConfirmingClear(false)}
              >
                Keep sessions
              </button>
            </div>
          ) : (
            <button
              className="text-button"
              onClick={() => setConfirmingClear(true)}
            >
              <Trash2 size={14} /> Clear local history
            </button>
          )}
        </div>
      )}
      <p className="journal-storage-note">
        Your journal is stored on this device, not in an account. Clearing
        browser storage also clears these sessions.
      </p>
    </div>
  );
}
