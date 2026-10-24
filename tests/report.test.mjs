import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import { build } from "esbuild";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { exampleSession } from "../src/data/example.mjs";

const require = createRequire(import.meta.url);

async function loadComponent(path) {
  const result = await build({
    entryPoints: [path],
    bundle: true,
    platform: "node",
    format: "cjs",
    jsx: "automatic",
    external: ["react", "react/jsx-runtime", "lucide-react"],
    loader: { ".css": "empty" },
    write: false,
  });
  const module = { exports: {} };
  new Function("require", "module", "exports", result.outputFiles[0].text)(
    require,
    module,
    module.exports,
  );
  return module.exports;
}

const { createReportText, default: Debrief } = await loadComponent(
  "src/components/Debrief.jsx",
);
const { default: Progress } = await loadComponent(
  "src/components/Progress.jsx",
);

test("report exports use recorded evidence, preserve playback uncertainty, and do not grade scripted samples", () => {
  const report = createReportText({
    ...exampleSession,
    note: "Ask one question at a time.",
    transcript: exampleSession.transcript.map((segment) => ({
      ...segment,
      playbackConfirmed: segment.role === "agent" ? false : undefined,
    })),
    review: {
      ...exampleSession.review,
      moments: [
        ...exampleSession.review.moments,
        {
          segmentId: "missing-segment",
          title: "Invented evidence must not appear",
        },
      ],
    },
  });
  assert.match(report, /AUTHORED EXAMPLE/);
  assert.match(report, /\[00:25\]/);
  assert.ok(report.includes(exampleSession.transcript[3].text));
  assert.ok(!report.includes("Invented evidence must not appear"));
  assert.match(report, /Audio playback not fully confirmed/);
  assert.match(report, /Ask one question at a time\./);
  assert.match(report, /AUTHORED ASSESSMENT EXAMPLE/);
  assert.match(report, /Overall score: 78\/100/);
  assert.match(report, /Points earned: 77\.5 \/ 100 assessable points/);
  assert.match(report, /CRITICAL FINDINGS\nImmediate exposure/);
  assert.match(report, /CRITERION LEDGER/);
  for (const criterion of exampleSession.review.assessment.criteria) {
    assert.ok(report.includes(criterion.label));
    assert.ok(report.includes(`Expected: ${criterion.expected}`));
    assert.ok(report.includes(`Observed: ${criterion.rationale}`));
  }
  assert.match(report, /Points: 7\.5 \/ 15/);
  assert.match(report, /Evidence \[00:25\] You: “Which city is that in/);
  assert.match(report, /Next action: Clarify where the caller is/);

  const sample = createReportText({ ...exampleSession, example: false });
  assert.ok(!sample.includes(exampleSession.review.headline));
  assert.ok(!sample.includes("EVIDENCE-BASED ASSESSMENT"));
  assert.ok(!sample.includes("Overall score:"));
  assert.match(sample, /No automated assessment is available/);
});

test("assessment report keeps authored provenance, critical findings and expandable evidence distinct from the total", () => {
  const markup = renderToStaticMarkup(
    createElement(Debrief, { session: exampleSession, saved: true }),
  );
  assert.match(markup, /Illustrative score/);
  assert.match(markup, /not a model result or part of your practice history/);
  assert.match(markup, /Critical checks to revisit/);
  assert.match(markup, /Criterion ledger/);
  assert.match(markup, /<details class="criterion-row criterion-partial"/);
  assert.match(
    markup,
    /Read evidence for Immediate exposure in the transcript at 01:09/,
  );
  assert.match(markup, /How this assessment works/);
  assert.match(
    markup,
    /not an official Association of Public-Safety Communications Officials/,
  );
});

test("scoring is withheld for short or low-coverage calls and never backfilled into legacy or scripted sessions", () => {
  const actual = { ...exampleSession, kind: "text", example: false };
  for (const session of [
    { ...actual, transcript: exampleSession.transcript.slice(0, 3) },
    {
      ...actual,
      review: {
        ...exampleSession.review,
        assessment: {
          ...exampleSession.review.assessment,
          coverage: 59,
          score: 100,
        },
      },
    },
  ]) {
    const report = createReportText(session);
    assert.match(report, /Overall score: withheld — insufficient evidence/);
    assert.ok(!report.includes("Overall score: 100/100"));
    const markup = renderToStaticMarkup(createElement(Debrief, { session }));
    assert.match(markup, /Insufficient<br\/>evidence/);
    assert.ok(!markup.includes('class="assessment-score"'));
  }

  const legacy = {
    ...actual,
    review: { ...exampleSession.review, assessment: undefined },
  };
  for (const session of [legacy, { ...exampleSession, example: false }]) {
    const report = createReportText(session);
    assert.ok(!report.includes("Overall score:"));
    const markup = renderToStaticMarkup(createElement(Debrief, { session }));
    assert.match(markup, /Not scored/);
    assert.ok(!markup.includes("Criterion ledger"));
  }
});

test("zero points and unassessable criteria are explicit in exports", () => {
  const assessment = exampleSession.review.assessment;
  const first = {
    ...assessment.criteria[0],
    status: "not_assessable",
    points: null,
    evidenceIds: [],
  };
  const report = createReportText({
    ...exampleSession,
    kind: "text",
    example: false,
    review: {
      ...exampleSession.review,
      assessment: {
        ...assessment,
        score: 0,
        earned: 0,
        possible: 80,
        coverage: 80,
        provisional: true,
        criteria: [first, ...assessment.criteria.slice(1)],
      },
    },
  });
  assert.match(report, /Overall score: 0\/100 \(provisional\)/);
  assert.match(report, /Points: — \/ 20 — excluded from the total/);
  assert.match(report, /Status: Not assessable/);
  assert.match(report, /Evidence: no specific transcript reference supplied/);
});

test("practice activity never counts the authored example", () => {
  const emptyMarkup = renderToStaticMarkup(
    createElement(Progress, { sessions: [exampleSession] }),
  );
  assert.ok(emptyMarkup.includes("Calls practised</span><strong>0</strong>"));
  const actual = { ...exampleSession, id: "actual", example: false };
  const markup = renderToStaticMarkup(
    createElement(Progress, { sessions: [exampleSession, actual] }),
  );
  assert.ok(markup.includes("Calls practised</span><strong>1</strong>"));
});
