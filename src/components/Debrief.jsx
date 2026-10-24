import { useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Clock3,
  MessageSquareText,
  NotebookPen,
} from "lucide-react";
import { difficulties, domains, formatTime } from "../../shared/scenarios.mjs";
import "../styles/debrief.css";
function describeSession(session) {
  return {
    domain:
      domains.find((domain) => domain.id === session.scenario?.domain)?.name ||
      "Open scenario",
    difficulty:
      difficulties.find(
        (difficulty) => difficulty.id === session.setup?.difficulty,
      )?.name || "Unrestricted",
    mode: session.setup?.mode === "guided" ? "Guided practice" : "Random call",
    language:
      session.setup?.language === "hi"
        ? "Hindi"
        : session.setup?.language === "en"
          ? "English"
          : "Automatic language",
  };
}
export function createReportText(session) {
  const labels = describeSession(session);
  const transcript = (session.transcript || []).filter(
    (segment) => segment.final !== false,
  );
  const review =
    session.kind === "sample" && !session.example ? null : session.review;
  const lines = [
    "EMERGENCY SCHOOL — CALL DEBRIEF",
    session.example
      ? "AUTHORED EXAMPLE — not a completed practice session."
      : "Training simulation — not an assessment of operational readiness.",
    "",
    session.scenario?.title || "Practice session",
    `${labels.mode} · ${labels.domain} · ${labels.difficulty} · ${labels.language}`,
    `Duration: ${formatTime(session.duration)}`,
    session.createdAt
      ? `Recorded: ${session.createdAt}`
      : "Date: authored example",
    "",
  ];
  if (review) {
    lines.push(
      session.example ? "AUTHORED FEEDBACK" : "AI-GENERATED FEEDBACK",
      review.headline || "Call reflection",
      review.overview || "",
      "",
    );
    for (const moment of review.moments || []) {
      const segment = transcript.find(
        (item) => item.segmentId === moment.segmentId,
      );
      if (!segment) continue;
      lines.push(
        `${moment.title} [${formatTime(segment.at)}]`,
        `${segment.role === "user" ? "You" : "Caller"}: “${segment.text}”`,
      );
      if (segment.playbackConfirmed === false)
        lines.push("Audio playback was not fully confirmed for this line.");
      lines.push(moment.comment || "", "");
    }
    if (review.nextPractice)
      lines.push(
        "NEXT PRACTICE",
        review.nextPractice.title || "",
        review.nextPractice.explanation || "",
        review.nextPractice.prompt || "",
        "",
      );
  } else {
    lines.push(
      "REFLECTION",
      "No automated assessment is available for this session. Use the transcript to reflect on your questions, assumptions, and the information you established.",
      "",
    );
  }
  lines.push("COMPLETE TRANSCRIPT");
  for (const segment of transcript) {
    lines.push(
      `[${formatTime(segment.at)}] ${segment.role === "user" ? "You" : "Caller"}: ${segment.text}${segment.playbackConfirmed === false ? " [Audio playback not fully confirmed]" : ""}`,
    );
  }
  if (session.note) lines.push("", "YOUR NOTE", session.note);
  lines.push(
    "",
    "This is a fictional training simulation. AI feedback can miss context and be incorrect. It is not certification, clinical advice, or a validated measure of call-taking competence.",
  );
  return lines.join("\n");
}
export default function Debrief({
  session,
  saved,
  onBack,
  onPractice,
  onSaveNote,
}) {
  const [showTranscript, setShowTranscript] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [note, setNote] = useState(session.note || "");
  const [noteSaved, setNoteSaved] = useState(false);
  const transcriptNodes = useRef({});
  const labels = describeSession(session);
  const transcript = (session.transcript || []).filter(
    (segment) => segment.final !== false,
  );
  const turns = transcript.filter((segment) => segment.role === "user").length;
  const review =
    session.kind === "sample" && !session.example ? null : session.review;
  const moments = (review?.moments || []).filter((moment) =>
    transcript.some((segment) => segment.segmentId === moment.segmentId),
  );
  useEffect(() => {
    setNote(session.note || "");
    setNoteSaved(false);
    setShowTranscript(false);
    setSelectedSegment(null);
  }, [session.id]);
  useEffect(() => {
    if (!showTranscript || !selectedSegment) return;
    transcriptNodes.current[selectedSegment]?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: "center",
    });
  }, [selectedSegment, showTranscript]);
  function exportReport() {
    const url = URL.createObjectURL(
      new Blob(
        [
          createReportText({
            ...session,
            note,
          }),
        ],
        {
          type: "text/plain;charset=utf-8",
        },
      ),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `emergency-school-${session.example ? "example" : session.id}.txt`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function saveNote(event) {
    event.preventDefault();
    const result = onSaveNote?.(session.id, note.trim());
    if (result !== false) setNoteSaved(true);
  }
  return (
    <div className="debrief-page">
      <div className="report-toolbar">
        <button className="text-button" onClick={onBack}>
          <ArrowLeft size={16} /> All debriefs
        </button>
        <button className="text-button" onClick={exportReport}>
          <ArrowDownToLine size={16} /> Export report
        </button>
      </div>

      <header className="report-heading">
        <div className="report-kicker">
          <span className="eyebrow">Call debrief</span>
          <span className="report-dot" />
          {session.example
            ? "Authored example"
            : session.kind === "sample"
              ? "Text rehearsal"
              : "Completed session"}
        </div>
        <h1>{review?.headline || "Session debrief"}</h1>
        <p className="report-incident">
          {session.scenario?.title || "Practice session"}
        </p>
        <div className="report-meta">
          <span>
            <Clock3 size={14} />
            {formatTime(session.duration)}
          </span>
          <span>{labels.mode}</span>
          <span>{labels.domain}</span>
          <span>{labels.difficulty}</span>
          <span>{labels.language}</span>
        </div>
      </header>

      {session.example && (
        <div className="report-example-notice">
          Authored example. This report is not part of your practice history.
        </div>
      )}
      {!session.example && saved === false && (
        <div className="report-warning">
          This report could not be saved in this browser. Export it before
          leaving this page.
        </div>
      )}

      <div className="report-layout">
        <div className="report-content">
          <section className="report-section report-overview">
            <div className="report-section-label">
              <h2>Overview</h2>
              <span className="report-provenance">
                {review
                  ? session.example
                    ? "Authored example"
                    : "AI feedback"
                  : "Transcript only"}
              </span>
            </div>
            <p>
              {review?.overview ||
                `${turns} trainee ${turns === 1 ? "turn was" : "turns were"} recorded. No automated assessment is available for this session. The full transcript is below.`}
            </p>
            {session.reviewError && (
              <p className="report-review-error">
                The AI review is unavailable. Your transcript is still available
                to read and export.
              </p>
            )}
          </section>

          {moments.length > 0 ? (
            <section className="report-section">
              <div className="report-section-label">
                <h2>Key moments</h2>
                <span className="muted">Transcript references</span>
              </div>
              <div className="report-moments">
                {moments.map((moment, index) => {
                  const segment = transcript.find(
                    (item) => item.segmentId === moment.segmentId,
                  );
                  return (
                    <article
                      className={`report-moment ${moment.kind === "strength" ? "moment-strength" : "moment-reflection"}`}
                      key={`${moment.segmentId}-${index}`}
                    >
                      <span className="moment-marker" aria-hidden="true">
                        {moment.kind === "strength" ? (
                          <Check size={15} />
                        ) : (
                          <NotebookPen size={14} />
                        )}
                      </span>
                      <div className="moment-body">
                        <div className="moment-title">
                          <h3>{moment.title}</h3>
                          <button
                            className="evidence-link"
                            onClick={() => {
                              setSelectedSegment(segment.segmentId);
                              setShowTranscript(true);
                            }}
                            aria-label={`Read ${moment.title} in the transcript at ${formatTime(segment.at)}`}
                          >
                            {formatTime(segment.at)}
                            <ArrowRight size={12} />
                          </button>
                        </div>
                        <blockquote>“{segment.text}”</blockquote>
                        {segment.playbackConfirmed === false && (
                          <p className="playback-note">
                            This caller line may not have been fully heard;
                            audio playback was not confirmed.
                          </p>
                        )}
                        <p>{moment.comment}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ) : (
            <section className="report-section">
              <h2>Reflection questions</h2>
              <div className="reflection-prompts">
                <p>What did you establish, and what did you assume?</p>
                <p>Which question helped the caller become clearer?</p>
                <p>What would you ask differently next time?</p>
              </div>
            </section>
          )}

          <section className="report-section transcript-section">
            <button
              className="transcript-toggle"
              onClick={() => setShowTranscript(!showTranscript)}
              aria-expanded={showTranscript}
              aria-controls="report-transcript"
            >
              <span>
                <MessageSquareText size={18} />
                <span>
                  Full transcript
                  <small>{transcript.length} recorded turns</small>
                </span>
              </span>
              <ChevronDown
                size={18}
                className={showTranscript ? "is-expanded" : ""}
              />
            </button>
            {showTranscript && (
              <div id="report-transcript" className="report-transcript">
                {transcript.length ? (
                  transcript.map((segment) => (
                    <article
                      key={segment.segmentId}
                      ref={(node) => {
                        transcriptNodes.current[segment.segmentId] = node;
                      }}
                      className={`transcript-line ${segment.role === "user" ? "transcript-you" : ""} ${selectedSegment === segment.segmentId ? "transcript-selected" : ""}`}
                    >
                      <div className="transcript-line-meta">
                        <span>
                          {segment.role === "user" ? "You" : "Caller"}
                        </span>
                        <time>{formatTime(segment.at)}</time>
                      </div>
                      <p>{segment.text}</p>
                      {segment.playbackConfirmed === false && (
                        <span className="playback-note">
                          Audio playback not fully confirmed
                        </span>
                      )}
                    </article>
                  ))
                ) : (
                  <p className="muted">No completed turns were recorded.</p>
                )}
              </div>
            )}
          </section>
        </div>

        <aside className="report-aside">
          <section className="next-practice-card">
            <span className="eyebrow">Next practice</span>
            <h2>{review?.nextPractice?.title || "Review the conversation"}</h2>
            <p>
              {review?.nextPractice?.explanation ||
                "Read the transcript and note what you would change before starting another call."}
            </p>
            {review?.nextPractice?.prompt && (
              <blockquote>{review.nextPractice.prompt}</blockquote>
            )}
            <button className="button primary" onClick={onPractice}>
              Start another call <ArrowRight size={16} />
            </button>
          </section>

          <form className="report-note" onSubmit={saveNote}>
            <label htmlFor="session-note">
              <NotebookPen size={16} /> Session notes
            </label>
            <textarea
              id="session-note"
              aria-label="A note to yourself"
              value={note}
              onChange={(event) => {
                setNote(event.target.value);
                setNoteSaved(false);
              }}
              placeholder="Add a note about this session"
              rows={5}
              maxLength={3000}
            />
            {session.example ? (
              <p className="report-note-help">
                This is an example. Notes are included in your export, but are
                not added to your history.
              </p>
            ) : (
              <>
                <button
                  type="submit"
                  className="text-button"
                  disabled={noteSaved}
                >
                  {noteSaved ? (
                    <>
                      <Check size={14} /> Note saved
                    </>
                  ) : (
                    "Save note"
                  )}
                </button>
                <p className="report-note-help">
                  Stored in this browser, with your session.
                </p>
              </>
            )}
          </form>
        </aside>
      </div>

      <footer className="report-disclaimer">
        {session.example
          ? "Example content was written to illustrate the report format. "
          : review
            ? "AI feedback can miss context and be incorrect. "
            : ""}
        This is a fictional training simulation, not certification or a
        validated measure of operational readiness.
      </footer>
    </div>
  );
}
