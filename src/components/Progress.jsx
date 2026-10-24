import { ArrowRight, Clock3, Headphones, Layers3 } from "lucide-react";
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
      <header className="page-heading history-heading">
        <div>
          <h1>Practice record</h1>
          <p>Session activity saved on this device.</p>
        </div>
        <button className="button primary" onClick={onPractice}>
          New call <ArrowRight size={16} />
        </button>
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
              ? "Less than one minute"
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
          <span>Practised at least once</span>
        </div>
      </section>

      <section className="coverage-section">
        <div className="report-section-label">
          <div>
            <h2>Incident coverage</h2>
          </div>
        </div>
        <p className="coverage-description">
          Completed calls by incident type. These counts do not measure
          competence.
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
                <span className="coverage-name">{domain.name}</span>
                <small>
                  {count
                    ? `${count} ${count === 1 ? "call" : "calls"}`
                    : "No calls"}
                </small>
              </div>
            );
          })}
        </div>
      </section>

      <p className="journal-storage-note">
        Activity includes sessions saved in this browser only. Example reports
        are never counted.
      </p>
    </div>
  );
}
