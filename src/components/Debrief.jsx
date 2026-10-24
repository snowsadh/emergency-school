import { useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Check,
  ChevronDown,
  Clock3,
  MessageSquareText,
  NotebookPen,
} from "lucide-react";
import { difficulties, domains, formatTime } from "../../shared/scenarios.mjs";
import "../styles/debrief.css";

const criterionStatus = {
  met: "Met",
  partial: "Partial",
  missed: "Not demonstrated",
  not_assessable: "Not assessable",
};
const formatPoints = (value) =>
  Number.isFinite(value) ? String(Math.round(value * 10) / 10) : "—";

function readReview(session) {
  return session.kind === "sample" && !session.example ? null : session.review;
}

function readAssessment(session, review) {
  const assessment = review?.assessment;
  if (!assessment?.criteria?.length) return null;
  const traineeTurns = (session.transcript || []).filter(
    (segment) => segment.role === "user" && segment.final !== false,
  ).length;
  // Never present a total when the transcript cannot support one, including old local records.
  const score =
    traineeTurns >= 3 &&
    assessment.coverage >= 60 &&
    Number.isFinite(assessment.score)
      ? assessment.score
      : null;
  return {
    ...assessment,
    score,
    provisional: assessment.provisional || score === null,
  };
}

function evidenceFor(ids, transcript) {
  return [...new Set(ids || [])]
    .map((id) => transcript.find((segment) => segment.segmentId === id))
    .filter(Boolean);
}

function appendAssessment(lines, assessment, transcript, example) {
  lines.push(
    example ? "AUTHORED ASSESSMENT EXAMPLE" : "EVIDENCE-BASED ASSESSMENT",
    assessment.score === null
      ? "Overall score: withheld — insufficient evidence."
      : `Overall score: ${formatPoints(assessment.score)}/100${assessment.provisional ? " (provisional)" : ""}`,
    `Rubric: ${assessment.rubricVersion}`,
    `Assessable coverage: ${formatPoints(assessment.coverage)}% of weighted rubric`,
    `Points earned: ${formatPoints(assessment.earned)} / ${formatPoints(assessment.possible)} assessable points`,
    "The total is withheld below three trainee turns or 60% assessable coverage. Unassessable criteria are excluded, not treated as passes or failures.",
    "Statuses are evidence judgments. Fixed project-defined weights determine points; this is not a validated or official agency assessment.",
    "",
    "CRITICAL FINDINGS",
  );
  if (!assessment.criticalFindings?.length)
    lines.push(
      "No critical omissions were identified in the assessable criteria. This is not a safety or readiness clearance.",
    );
  for (const finding of assessment.criticalFindings || []) {
    lines.push(finding.title, finding.reason);
    for (const segment of evidenceFor(finding.evidenceIds, transcript))
      lines.push(
        `[${formatTime(segment.at)}] ${segment.role === "user" ? "You" : "Caller"}: “${segment.text}”${segment.playbackConfirmed === false ? " [Audio playback not fully confirmed]" : ""}`,
      );
    lines.push("");
  }
  lines.push("", "CRITERION LEDGER");
  for (const criterion of assessment.criteria) {
    lines.push(
      `${criterion.label}${criterion.critical ? " [Critical check]" : ""}`,
      `Status: ${criterionStatus[criterion.status] || "Not assessable"}`,
      `Points: ${formatPoints(criterion.points)} / ${formatPoints(criterion.weight)}${criterion.status === "not_assessable" ? " — excluded from the total" : ""}`,
      `Expected: ${criterion.expected || "Not supplied."}`,
      `Observed: ${criterion.rationale || "No observation supplied."}`,
      `Next action: ${criterion.nextAction || "Review the transcript with an instructor."}`,
    );
    const evidence = evidenceFor(criterion.evidenceIds, transcript);
    if (!evidence.length)
      lines.push("Evidence: no specific transcript reference supplied.");
    for (const segment of evidence)
      lines.push(
        `Evidence [${formatTime(segment.at)}] ${segment.role === "user" ? "You" : "Caller"}: “${segment.text}”${segment.playbackConfirmed === false ? " [Audio playback not fully confirmed]" : ""}`,
      );
    lines.push("");
  }
}

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
  const review = readReview(session);
  const assessment = readAssessment(session, review);
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
    if (assessment)
      appendAssessment(lines, assessment, transcript, session.example);
    else
      lines.push(
        "RUBRIC ASSESSMENT",
        "Not scored. This session has no evidence-based rubric assessment.",
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

function AssessmentSummary({ assessment, example, turns }) {
  if (!assessment)
    return (
      <section
        className="assessment-unavailable"
        aria-label="Rubric assessment"
      >
        <div>
          <span className="eyebrow">Rubric assessment</span>
          <h2>Not scored</h2>
        </div>
        <p>
          This {example ? "example" : "session"} has no rubric assessment.
          Scripted rehearsals and older sessions are not graded retrospectively.
        </p>
      </section>
    );
  const scored = assessment.score !== null;
  return (
    <section className="assessment-band" aria-label="Assessment summary">
      <div className="assessment-result">
        <span className="eyebrow">
          {example ? "Illustrative score" : "Evidence-based score"}
        </span>
        {scored ? (
          <p className="assessment-score">
            <strong>{formatPoints(assessment.score)}</strong>
            <span>/ 100</span>
          </p>
        ) : (
          <h2>
            Insufficient
            <br />
            evidence
          </h2>
        )}
        <span className="assessment-qualification">
          {assessment.provisional
            ? "Provisional · limited evidence"
            : example
              ? "Authored judgments, fixed weights"
              : "Fixed weights, transcript evidence"}
        </span>
      </div>
      <div className="assessment-context">
        <p>
          {scored
            ? "A record of what this conversation demonstrated—not a measure of readiness for real calls."
            : `${turns} trainee ${turns === 1 ? "turn is" : "turns are"} recorded. A total needs at least three trainee turns and 60% assessable coverage.`}
        </p>
        <dl>
          <div>
            <dt>Assessed coverage</dt>
            <dd>
              {formatPoints(assessment.coverage)}%
              <span> of the weighted rubric</span>
            </dd>
          </div>
          <div>
            <dt>Points established</dt>
            <dd>
              {formatPoints(assessment.earned)}
              <span>
                {" "}
                / {formatPoints(assessment.possible)} assessable points
              </span>
            </dd>
          </div>
          <div>
            <dt>Rubric version</dt>
            <dd className="assessment-version">{assessment.rubricVersion}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}

function AssessmentEvidence({ ids, transcript, label, onEvidence }) {
  const evidence = evidenceFor(ids, transcript);
  return evidence.length ? (
    <div className="assessment-evidence">
      {evidence.map((segment) => (
        <button
          key={segment.segmentId}
          className="assessment-evidence-quote"
          onClick={() => onEvidence(segment.segmentId)}
          aria-label={`Read evidence for ${label} in the transcript at ${formatTime(segment.at)}`}
        >
          <span className="assessment-evidence-meta">
            <span>
              {segment.role === "user" ? "You" : "Caller"}
              <span> · </span>
              {formatTime(segment.at)}
            </span>
            <ArrowRight size={13} />
          </span>
          <span className="assessment-quote">“{segment.text}”</span>
          {segment.playbackConfirmed === false && (
            <span className="assessment-playback-note">
              Audio playback was not fully confirmed.
            </span>
          )}
        </button>
      ))}
    </div>
  ) : (
    <p className="criterion-evidence-empty">
      No specific transcript reference was supplied. Read the full conversation
      before drawing a conclusion.
    </p>
  );
}

function AssessmentLedger({ assessment, transcript, onEvidence }) {
  if (!assessment) return null;
  return (
    <>
      {assessment.criticalFindings?.length > 0 && (
        <section
          className="assessment-critical"
          aria-labelledby="critical-findings-title"
        >
          <div className="critical-heading">
            <AlertCircle size={17} />
            <h2 id="critical-findings-title">Critical checks to revisit</h2>
          </div>
          <p>Review these independently of the overall score.</p>
          {assessment.criticalFindings.map((finding) => (
            <article key={finding.criterionId}>
              <h3>{finding.title}</h3>
              <p>{finding.reason}</p>
              <AssessmentEvidence
                ids={finding.evidenceIds}
                transcript={transcript}
                label={finding.title}
                onEvidence={onEvidence}
              />
            </article>
          ))}
        </section>
      )}
      <section
        className="report-section assessment-ledger"
        aria-labelledby="criterion-ledger-title"
      >
        <div className="report-section-label">
          <h2 id="criterion-ledger-title">Criterion ledger</h2>
          <span className="muted">Fixed point weights</span>
        </div>
        <p className="ledger-intro">
          Open a criterion to compare the expectation with what was recorded.
        </p>
        <div className="criterion-list">
          {assessment.criteria.map((criterion) => (
            <details
              className={`criterion-row criterion-${criterion.status}`}
              key={criterion.id}
            >
              <summary>
                <span className="criterion-name">
                  <strong>{criterion.label}</strong>
                  {criterion.critical && <small>Critical check</small>}
                </span>
                <span className="criterion-status">
                  {criterionStatus[criterion.status] || "Not assessable"}
                </span>
                <span className="criterion-points">
                  <strong>{formatPoints(criterion.points)}</strong>
                  <span> / {formatPoints(criterion.weight)}</span>
                </span>
                <ChevronDown size={15} />
              </summary>
              <div className="criterion-detail">
                {criterion.status === "not_assessable" && (
                  <p className="criterion-excluded">
                    Excluded from the total. There was not enough evidence or
                    opportunity to judge this criterion.
                  </p>
                )}
                <dl>
                  <div>
                    <dt>Expected</dt>
                    <dd>{criterion.expected}</dd>
                  </div>
                  <div>
                    <dt>Observed</dt>
                    <dd>{criterion.rationale}</dd>
                  </div>
                  <div>
                    <dt>Next action</dt>
                    <dd>
                      {criterion.nextAction ||
                        "Keep this behavior in your next practice and review it with an instructor."}
                    </dd>
                  </div>
                </dl>
                <AssessmentEvidence
                  ids={criterion.evidenceIds}
                  transcript={transcript}
                  label={criterion.label}
                  onEvidence={onEvidence}
                />
              </div>
            </details>
          ))}
        </div>
        <details className="assessment-method">
          <summary>
            How this assessment works
            <ChevronDown size={14} />
          </summary>
          <div>
            <p>
              The model classifies transcript evidence against scenario facts.
              Fixed, project-defined weights produce the points: met earns the
              full weight, partial earns half, and not demonstrated earns zero.
              Not assessable is excluded.
            </p>
            <p>
              The overall score is the earned points divided by assessable
              points, expressed out of 100. It is withheld below three trainee
              turns or 60% weighted coverage; incomplete coverage remains
              provisional. Critical findings stay visible separately.
            </p>
            <p>
              The rubric draws on public call-taking training topics, not an
              official scoring standard. Its weights have not been validated by
              instructors.{" "}
              <a
                href="https://atpa.apcointl.org/guest/chapter-7"
                target="_blank"
                rel="noreferrer"
              >
                Public call-taker training reference
              </a>
              . This is not an official Association of Public-Safety
              Communications Officials (APCO) assessment, agency protocol, or
              certification.
            </p>
          </div>
        </details>
      </section>
    </>
  );
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
  const review = readReview(session);
  const assessment = readAssessment(session, review);
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
          Authored example. The judgments illustrate the report format; they are
          not a model result or part of your practice history.
        </div>
      )}
      {!session.example && saved === false && (
        <div className="report-warning">
          This report could not be saved in this browser. Export it before
          leaving this page.
        </div>
      )}

      <AssessmentSummary
        assessment={assessment}
        example={session.example}
        turns={turns}
      />

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

          <AssessmentLedger
            assessment={assessment}
            transcript={transcript}
            onEvidence={(segmentId) => {
              setSelectedSegment(segmentId);
              setShowTranscript(true);
            }}
          />

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
