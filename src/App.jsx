import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ChartNoAxesCombined,
  CircleHelp,
  FileText,
  Headphones,
  Settings2,
  X,
} from "lucide-react";
import { validateSetup } from "../shared/scenarios.mjs";
import { readHistory, readSetup, saveHistory, saveSetup } from "./storage.mjs";
import usePractice from "./hooks/usePractice.js";
import PracticeRoom from "./components/PracticeRoom.jsx";
import CallRoom from "./components/CallRoom.jsx";
import Debrief from "./components/Debrief.jsx";
import SessionHistory from "./components/SessionHistory.jsx";
import Progress from "./components/Progress.jsx";

const navigation = [
  {
    id: "practice",
    title: "Practice room",
    label: "Practice",
    icon: Headphones,
  },
  { id: "history", title: "Your debriefs", label: "Sessions", icon: FileText },
  {
    id: "progress",
    title: "Practice record",
    label: "Activity",
    icon: ChartNoAxesCombined,
  },
];

function Modal({ title, onClose, children }) {
  const dialog = useRef(null);
  const titleId = `modal-${title.replace(/\W+/g, "-").toLowerCase()}`;
  useEffect(() => {
    dialog.current.showModal();
  }, []);
  return (
    <dialog
      className="modal"
      aria-labelledby={titleId}
      ref={dialog}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal-heading">
        <h2 id={titleId}>{title}</h2>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={19} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

export default function App() {
  const [screen, setScreen] = useState("practice");
  const [scope, setScope] = useState(() => {
    try {
      return validateSetup(readSetup());
    } catch {
      return validateSetup();
    }
  });
  const [sessions, setSessions] = useState(readHistory);
  const [status, setStatus] = useState(null);
  const [report, setReport] = useState(null);
  const [modal, setModal] = useState(null);
  const [customize, setCustomize] = useState(false);
  const [saved, setSaved] = useState(true);
  const practice = usePractice((finished) => {
    const next = [finished, ...sessions].slice(0, 40);
    setSessions(next);
    setSaved(saveHistory(next));
    setReport(finished);
    setScreen("report");
    window.scrollTo({ top: 0 });
  });
  const locked = Boolean(practice.session || practice.connecting);

  useEffect(() => {
    fetch("/api/status")
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then(setStatus)
      .catch(() => setStatus({ voiceConfigured: false, unavailable: true }));
  }, []);
  useEffect(() => {
    saveSetup(scope);
  }, [scope]);
  useEffect(() => {
    if (practice.session) {
      setScreen("call");
      setModal(null);
      window.scrollTo({ top: 0 });
    }
  }, [practice.session?.id]);
  const navigate = (target) => {
    if (!locked) {
      setScreen(target);
      practice.clearError();
      window.scrollTo({ top: 0 });
    }
  };
  const openReport = (session) => {
    setReport(session);
    navigate("report");
  };
  const start = () => {
    if (status?.voiceConfigured) practice.start("voice", scope);
    else if (status?.openaiConfigured) practice.start("text", scope);
    else setModal("setup");
  };
  const startSample = () => {
    setModal(null);
    practice.start("sample", scope);
  };
  const activeNav =
    screen === "report" ? "history" : screen === "call" ? "practice" : screen;

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <aside className="sidebar">
        <button
          className="brand"
          aria-label="Emergency School home"
          onClick={() => navigate("practice")}
          disabled={locked}
        >
          <span className="brand-name">
            Emergency
            <br />
            School<span className="brand-tag">112 call training</span>
          </span>
        </button>
        <nav aria-label="Main navigation">
          {navigation.map(({ id, title, label, icon: Icon }) => (
            <button
              className={`nav-item ${activeNav === id ? "selected" : ""}`}
              aria-label={title}
              aria-current={activeNav === id ? "page" : undefined}
              onClick={() => navigate(id)}
              disabled={locked}
              key={id}
            >
              <Icon size={18} />
              <span>{label}</span>
              {id === "history" && sessions.length > 0 && (
                <small>{sessions.length}</small>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button
            className="nav-item quiet"
            aria-label="How it works"
            onClick={() => setModal("help")}
            disabled={locked}
          >
            <CircleHelp size={17} />
            How it works
            <ArrowUpRight size={13} />
          </button>
          <button
            className="nav-item quiet"
            aria-label="Voice setup"
            onClick={() => setModal("setup")}
            disabled={locked}
          >
            <Settings2 size={17} />
            Voice setup
          </button>
          <p className="local-storage-label">Sessions saved on this device</p>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <span className="topbar-title">
            {screen === "call"
              ? "Current call"
              : screen === "report"
                ? "Session debrief"
                : navigation.find((n) => n.id === screen)?.label}
          </span>
          <button
            className={`voice-status ${status?.voiceConfigured ? "connected" : ""}`}
            onClick={() => setModal("setup")}
            disabled={locked}
          >
            <span />
            {!status
              ? "Checking connection"
              : status.voiceConfigured
                ? "Voice ready"
                : status.openaiConfigured
                  ? "Text practice ready"
                  : "Preview mode"}
          </button>
        </header>
        <main id="main-content" className="page-content">
          {practice.error && (
            <div className="error-banner" role="alert">
              <CircleHelp size={17} />
              <p>{practice.error}</p>
              <button
                className="icon-button"
                aria-label="Dismiss error"
                onClick={practice.clearError}
              >
                <X size={16} />
              </button>
            </div>
          )}
          {screen === "practice" && (
            <PracticeRoom
              scope={scope}
              setScope={setScope}
              expanded={customize}
              setExpanded={setCustomize}
              connecting={practice.connecting}
              status={status}
              onStart={start}
              onOpen={openReport}
              latest={sessions[0]}
              onHistory={() => navigate("history")}
            />
          )}
          {screen === "call" && practice.session && (
            <CallRoom key={practice.session.id} practice={practice} />
          )}
          {screen === "report" && report && (
            <Debrief
              key={report.id}
              session={report}
              saved={saved}
              onBack={() => navigate("history")}
              onPractice={() => navigate("practice")}
              onSaveNote={(id, note) => {
                const updated = { ...report, note };
                setReport(updated);
                const next = sessions.map((s) => (s.id === id ? updated : s));
                setSessions(next);
                const success = saveHistory(next);
                setSaved(success);
                return success;
              }}
            />
          )}
          {screen === "history" && (
            <SessionHistory
              sessions={sessions}
              onOpen={openReport}
              onPractice={() => navigate("practice")}
              onClear={() => {
                setSessions([]);
                saveHistory([]);
              }}
            />
          )}
          {screen === "progress" && (
            <Progress
              sessions={sessions}
              onPractice={() => navigate("practice")}
            />
          )}
          {screen !== "call" && (
            <footer className="page-footer">
              <span>Training only. No real emergency calls or dispatch.</span>
            </footer>
          )}
        </main>
      </div>
      {modal === "setup" && (
        <Modal title="Voice setup" onClose={() => setModal(null)}>
          <div className="setup-service">
            <div>
              <h3>Connect OpenAI and Fish Audio</h3>
              <p>
                {status?.voiceConfigured
                  ? "Both keys are configured. Live access and audio quality still need to be tested with a call."
                  : "Live calling needs server credentials. There’s no signup or profile to fill out."}
              </p>
            </div>
          </div>
          {!status?.voiceConfigured && (
            <>
              <p className="modal-copy">
                Add your keys to the local <code>.env</code> file, then restart
                the app. No Fish hosted agent or phone number is needed.
              </p>
              <pre>OPENAI_API_KEY=your_key{"\n"}FISH_API_KEY=your_key</pre>
              <p className="fine-print">
                Your OpenAI and Fish Developer API keys stay on the server. Fish
                Plus/web credits and Developer API credit are separate.
              </p>
            </>
          )}
          <div className="privacy-note">
            <p>
              Voice turns are sent to OpenAI for transcription. Fish receives
              the generated caller dialogue. This app does not store microphone
              recordings; providers may retain data under their policies.
              Transcripts are saved on this device. Use fictional details only.
            </p>
          </div>
          <button className="button secondary full" onClick={startSample}>
            Explore a text-only sample
            <ArrowUpRight size={15} />
          </button>
          <p className="fine-print center">
            Scripted sample. No microphone or model credits required.
          </p>
        </Modal>
      )}
      {modal === "help" && (
        <Modal title="How practice works" onClose={() => setModal(null)}>
          <div className="help-content">
            <section>
              <h3>Start a random call</h3>
              <p>
                Press Start call. OpenAI creates a fictional incident and
                caller; Fish gives their words a voice. No setup questions, no
                real calls.
              </p>
            </section>
            <section>
              <h3>Optional preferences</h3>
              <p>
                Optional incident interests, difficulty, and language narrow the
                next call. Guided practice adds a briefing and conversation
                prompts.
              </p>
            </section>
            <section>
              <h3>Review the call</h3>
              <p>
                End the call to see your transcript, evidence-linked feedback,
                and a next-practice focus. Save a fieldnote for next time.
              </p>
            </section>
          </div>
          <p className="fine-print">
            AI feedback is for reflection, not certification. This prototype
            does not replace an instructor or your agency’s procedures.
          </p>
        </Modal>
      )}
    </div>
  );
}
