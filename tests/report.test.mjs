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

const { createReportText } = await loadComponent("src/components/Debrief.jsx");
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

  const sample = createReportText({ ...exampleSession, example: false });
  assert.ok(!sample.includes(exampleSession.review.headline));
  assert.match(sample, /No automated assessment is available/);
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
