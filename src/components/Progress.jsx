import { ArrowRight, Check, Clock3, Headphones, Layers3 } from "lucide-react";
import { domains } from "../../shared/scenarios.mjs";
import "../styles/debrief.css";
export default function Progress({ sessions, onPractice }) {
  const actual = sessions.filter((session) => !session.example);
  const duration = actual.reduce(
    (total, session) =>
      total +
      (Number.isFinite(session.duration) ? Math.max(0, session.duration) : 0),
    0,
  );
  const covered = new Set(
    actual.map((session) => session.scenario?.domain).filter(Boolean),
  );
  const randomCalls = actual.filter(
    (session) => session.setup?.mode !== "guided",
  ).length;
  const guidedCalls = actual.length - randomCalls;
  const minutes = Math.floor(duration / 60);
  return (
    <div className="progress-page">
      <header className="page-heading">
        <span className="eyebrow">Showing up is a start</span>
        <h1>Your practice, over time.</h1>
        <p>
          Activity, not a readiness score. Every call is another chance to pay
          attention.
        </p>
      </header>
      <section className="activity-strip" aria-label="Your practice activity">
        <div>
          <span className="activity-label">
            <Headphones size={15} />
            Calls practised
          </span>
          <strong>{actual.length}</strong>
          <span>
            {randomCalls} random · {guidedCalls} guided
          </span>
        </div>
        <div>
          <span className="activity-label">
            <Clock3 size={15} />
            Time in practice
          </span>
          <strong>
            {minutes}
            <small> min</small>
          </strong>
          <span>
            {duration > 0 && duration < 60
              ? "Less than a minute so far"
              : "Across your saved sessions"}
          </span>
        </div>
        <div>
          <span className="activity-label">
            <Layers3 size={15} />
            Incident areas
          </span>
          <strong>
            {domains.filter((domain) => covered.has(domain.id)).length}
            <small> / {domains.length}</small>
          </strong>
          <span>Explored at least once</span>
        </div>
      </section>

      <section className="coverage-section">
        <div className="report-section-label">
          <div>
            <span className="eyebrow">A wider perspective</span>
            <h2>Places your practice has taken you.</h2>
          </div>
        </div>
        <p className="coverage-description">
          A record of the situations you have explored—not a measure of
          competence in them.
        </p>
        <div className="coverage-grid">
          {domains.map((domain) => {
            const count = actual.filter(
              (session) => session.scenario?.domain === domain.id,
            ).length;
            return (
              <div
                className={`coverage-item ${count ? "coverage-explored" : ""}`}
                key={domain.id}
              >
                <span className="coverage-dot">
                  {count > 0 && <Check size={12} />}
                </span>
                <span>{domain.name}</span>
                <small>
                  {count
                    ? `${count} ${count === 1 ? "call" : "calls"}`
                    : "Not yet explored"}
                </small>
              </div>
            );
          })}
        </div>
      </section>

      <section className="progress-next">
        <div>
          <span className="eyebrow">No perfect streak required</span>
          <h2>
            {actual.length
              ? "Come back with one small intention."
              : "You don’t need to prepare to begin."}
          </h2>
          <p>
            {actual.length
              ? "Try listening for one more detail, asking one clearer question, or giving the caller a little more space."
              : "Start a random call. The situation unfolds as you talk, and your first debrief gives you a place to reflect."}
          </p>
        </div>
        <button className="button primary" onClick={onPractice}>
          Start a call <ArrowRight size={16} />
        </button>
      </section>
      <p className="journal-storage-note">
        Activity includes sessions saved in this browser only. Example reports
        are never counted.
      </p>
    </div>
  );
}
