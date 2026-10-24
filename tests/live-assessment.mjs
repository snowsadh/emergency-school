import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { createIntelligence } from "../server/intelligence.mjs";

// Opt-in semantic regression for grading errors observed in a live call.
// This is one authored test case, not evidence of general grader accuracy.
assert.ok(
  process.argv.includes("--live"),
  "Pass --live to authorize a paid assessment check.",
);
assert.ok(
  process.env.OPENAI_API_KEY?.trim(),
  "An OpenAI server API key is required.",
);

const scenario = {
  title: "Smoke in an apartment",
  domain: "fire",
  language: "en",
  difficulty: "intense",
  caller: {
    name: "Asha",
    personality: "Usually direct",
    panic: "high, fragmented speech",
    coherence: "scattered",
  },
  facts: {
    location:
      "Flat 8, second floor, Cedar Apartments, fictional Kaveri Street, Nandipur",
    situation: "Kitchen smoke, cause unknown",
    safety: "Caller is inside the flat near the main door, with smoke inside",
    people: "Caller and six-year-old son; son's exact position unknown",
    callback: "SIMULATED CALLBACK",
    unknowns: "Cause of smoke and child's exact location",
  },
};
const exchanges = [
  ["agent", "There's smoke in my kitchen! I can't find my son!"],
  ["user", "Where exactly are you right now?"],
  ["agent", "I'm by the main door, inside my flat."],
  ["user", "Are you somewhere safe, away from immediate danger?"],
  ["agent", "I'm still inside. The smoke is coming from the kitchen."],
  ["user", "Tell me what happened. Who is affected, and what can you see?"],
  [
    "agent",
    "The kitchen filled with smoke. It's me and my six-year-old son, but I can't see him.",
  ],
  [
    "user",
    "To confirm your location, you said you are by the main door inside your flat. Is that correct?",
  ],
  ["agent", "Yes, by the main door inside the flat."],
];
const transcript = exchanges.map(([role, text], index) => ({
  segmentId: `regression-${index + 1}`,
  role,
  text,
  at: index * 8,
  final: true,
  ...(role === "agent" ? { playbackConfirmed: true } : {}),
}));
const review = await createIntelligence().review({
  scenario,
  transcript,
  duration: 72,
});
const assessment = review.assessment;
await mkdir("artifacts", { recursive: true });
await writeFile(
  "artifacts/assessment-semantic-check.json",
  JSON.stringify({ scenario, transcript, review }, null, 2),
);
const criterion = (id) => assessment.criteria.find((item) => item.id === id);
assert.equal(
  criterion("location").status,
  "partial",
  "A relative position inside a flat is not a usable incident address.",
);
assert.notEqual(
  criterion("location_verification").status,
  "met",
  "Repeating an incomplete position does not verify an incident site.",
);
assert.notEqual(
  criterion("reconnect_plan").status,
  "missed",
  "Panic alone does not prove a missed reconnect opportunity.",
);
assert.notEqual(
  criterion("factual_confirmation").status,
  "met",
  "A location-only read-back does not confirm a non-location fact.",
);
assert.ok(
  assessment.criticalFindings.some((item) => item.criterionId === "location"),
  "The incomplete location must remain visible as a critical finding.",
);
console.log(
  JSON.stringify(
    {
      passed: true,
      model: process.env.OPENAI_MODEL || "gpt-4.1",
      authoredRegression: true,
      score: assessment.score,
      coverage: assessment.coverage,
      checks: [
        "location",
        "location_verification",
        "reconnect_plan",
        "factual_confirmation",
      ].map((id) => ({
        id,
        status: criterion(id).status,
        rationale: criterion(id).rationale,
      })),
    },
    null,
    2,
  ),
);
