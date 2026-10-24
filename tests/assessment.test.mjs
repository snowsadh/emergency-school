import assert from "node:assert/strict";
import test from "node:test";
import {
  assessmentRubric,
  calculateAssessment,
  rubricVersion,
} from "../shared/assessment.mjs";
import { createIntelligence, groundReview } from "../server/intelligence.mjs";

const transcript = [
  {
    segmentId: "a1",
    role: "agent",
    text: "There is smoke and I am still in the corridor.",
    final: true,
    playbackConfirmed: true,
  },
  {
    segmentId: "u1",
    role: "user",
    text: "Where exactly are you?",
    final: true,
  },
  {
    segmentId: "a2",
    role: "agent",
    text: "Fictional Market, Gate B. I am outside now.",
    final: true,
    playbackConfirmed: true,
  },
  {
    segmentId: "u2",
    role: "user",
    text: "Can I confirm you are at Gate B and outside the building?",
    final: true,
  },
  {
    segmentId: "a3",
    role: "agent",
    text: "Yes. Nobody here looks hurt. What happens if we get cut off?",
    final: true,
    playbackConfirmed: true,
  },
  {
    segmentId: "u3",
    role: "user",
    text: "We will use the simulated callback if disconnected. Who else is there?",
    final: true,
  },
  {
    segmentId: "a4",
    role: "agent",
    text: "Two neighbours. Can I end the practice now?",
    final: true,
    playbackConfirmed: true,
  },
  {
    segmentId: "u4",
    role: "user",
    text: "Yes, this is the end of the simulation.",
    final: true,
  },
];

function judgement(id, status = "met", overrides = {}) {
  return {
    id,
    status,
    evidenceIds: ["u1"],
    opportunityIds: [],
    rationale: "A specific question is recorded in the transcript.",
    ...overrides,
  };
}

test("canonical weights compute half credit and exclude unassessable criteria", () => {
  assert.equal(
    assessmentRubric.reduce((sum, criterion) => sum + criterion.weight, 0),
    100,
  );
  const judgements = assessmentRubric.map((criterion) =>
    judgement(criterion.id),
  );
  judgements.find((item) => item.id === "location_verification").status =
    "partial";
  Object.assign(
    judgements.find((item) => item.id === "immediate_exposure"),
    {
      status: "missed",
      opportunityIds: ["a1"],
      rationale:
        "The caller describes corridor exposure; the trainee's response moves directly to another detail.",
    },
  );
  judgements.find((item) => item.id === "focused_follow_up").status = "partial";
  judgements.find((item) => item.id === "reconnect_plan").status =
    "not_assessable";
  judgements.find((item) => item.id === "closure").status = "partial";
  const result = calculateAssessment(judgements, transcript);
  assert.equal(result.rubricVersion, rubricVersion);
  assert.equal(result.earned, 62.5);
  assert.equal(result.possible, 90);
  assert.equal(result.coverage, 90);
  assert.equal(result.score, 69);
  assert.equal(result.provisional, true);
  assert.equal(
    result.criteria.find((item) => item.id === "reconnect_plan").points,
    null,
  );
  assert.deepEqual(
    result.criticalFindings.map((item) => item.criterionId),
    ["immediate_exposure"],
  );
  assert.deepEqual(result.criticalFindings[0].evidenceIds, ["u1", "a1"]);
});

test("short calls and low coverage withhold totals rather than report a misleading perfect score", () => {
  const allMet = assessmentRubric.map((criterion) => judgement(criterion.id));
  const short = calculateAssessment(allMet, transcript.slice(0, 2));
  assert.equal(short.score, null);
  assert.equal(short.earned, 100);
  assert.equal(short.possible, 100);
  assert.equal(short.provisional, true);

  const lowCoverage = calculateAssessment(
    [judgement("location"), judgement("immediate_exposure")],
    transcript,
  );
  assert.equal(lowCoverage.score, null);
  assert.equal(lowCoverage.coverage, 35);
  const exactlyEnough = calculateAssessment(
    [
      "location",
      "location_verification",
      "immediate_exposure",
      "people_at_risk",
      "factual_confirmation",
    ].map((id) => judgement(id)),
    transcript,
  );
  assert.equal(exactlyEnough.coverage, 60);
  assert.equal(exactlyEnough.score, 100);
  assert.equal(exactlyEnough.provisional, true);

  const complete = calculateAssessment(allMet, transcript);
  assert.equal(complete.score, 100);
  assert.equal(complete.provisional, false);
});

test("fabricated, caller-only, duplicate, and ambiguous evidence cannot earn or lose points", () => {
  const result = calculateAssessment(
    [
      judgement("location", "met", { evidenceIds: ["u1", "fabricated"] }),
      judgement("location_verification", "met", { evidenceIds: ["a2"] }),
      judgement("immediate_exposure"),
      judgement("immediate_exposure", "missed", { opportunityIds: ["a1"] }),
      judgement("invented_criterion", "met", { weight: 10000, points: 10000 }),
      judgement("people_at_risk", "met", { evidenceIds: ["u2"] }),
    ],
    [...transcript, { ...transcript[3] }],
  );
  assert.equal(result.criteria.length, 9);
  assert.equal(result.possible, 0);
  assert.equal(result.earned, 0);
  assert.equal(result.score, null);
  assert.deepEqual(result.criticalFindings, []);
  assert.ok(result.criteria.every((item) => item.status === "not_assessable"));
});

test("missed judgements require a grounded opportunity and a subsequent trainee response", () => {
  for (const overrides of [
    { opportunityIds: [] },
    { opportunityIds: ["invented"] },
    { opportunityIds: ["a4"], evidenceIds: ["u1"] },
    { opportunityIds: ["a1"], evidenceIds: [] },
  ]) {
    const result = calculateAssessment(
      [judgement("immediate_exposure", "missed", overrides)],
      transcript,
    );
    assert.equal(
      result.criteria.find((item) => item.id === "immediate_exposure").status,
      "not_assessable",
    );
    assert.equal(result.criticalFindings.length, 0);
  }
  const grounded = calculateAssessment(
    [judgement("immediate_exposure", "partial")],
    transcript,
  );
  assert.equal(grounded.criticalFindings.length, 1);
  assert.equal(
    grounded.criteria.find((item) => item.id === "immediate_exposure").points,
    7.5,
  );
});

test("unheard or unfinished evidence is excluded and empty sessions are not failed", () => {
  const unheard = transcript.map((turn) =>
    turn.segmentId === "a1" ? { ...turn, playbackConfirmed: false } : turn,
  );
  const result = calculateAssessment(
    [judgement("immediate_exposure", "missed", { opportunityIds: ["a1"] })],
    unheard,
  );
  assert.equal(result.possible, 0);
  const unfinished = calculateAssessment(
    [judgement("location")],
    transcript.map((turn) =>
      turn.segmentId === "u1" ? { ...turn, final: false } : turn,
    ),
  );
  assert.equal(unfinished.possible, 0);
  const empty = calculateAssessment(null, []);
  assert.equal(empty.score, null);
  assert.equal(empty.coverage, 0);
  assert.equal(empty.possible, 0);
  assert.ok(empty.criteria.every((item) => item.status === "not_assessable"));
});

test("review integration requests grounded judgements while code owns weights and totals", async () => {
  let request;
  const raw = {
    headline: "Location checked",
    overview: "The location was checked in the conversation.",
    moments: [
      {
        kind: "observation",
        segmentId: "u2",
        title: "Location",
        comment: "A read-back is recorded.",
      },
    ],
    nextPractice: {
      title: "Check the contact plan",
      explanation: "Confirm the simulated arrangement.",
      prompt: "What should happen if we disconnect?",
    },
    assessment: {
      judgements: assessmentRubric.map((criterion) => judgement(criterion.id)),
    },
  };
  const intelligence = createIntelligence(
    {},
    {
      responses: {
        parse: async (value) => {
          request = value;
          return { status: "completed", output_parsed: raw };
        },
      },
    },
  );
  const result = await intelligence.review({
    scenario: { title: "Fictional training case" },
    transcript,
    duration: 90,
  });
  assert.equal(request.store, false);
  assert.equal(request.text.format.strict, true);
  assert.match(request.instructions, /NOT an official APCO assessment/);
  assert.match(request.instructions, /playbackConfirmed=false/);
  assert.match(request.instructions, /opportunityIds/);
  assert.match(
    request.instructions,
    /never request or reward a real phone number/i,
  );
  assert.equal(request.max_output_tokens, 4000);
  const judgementProperties =
    request.text.format.schema.properties.assessment.properties.judgements.items
      .properties;
  assert.ok(!Object.hasOwn(judgementProperties, "score"));
  assert.ok(!Object.hasOwn(judgementProperties, "weight"));
  assert.equal(result.assessment.score, 100);
  assert.equal(result.assessment.criteria[0].weight, 20);
  const legacy = groundReview({ moments: [] }, transcript);
  assert.ok(!Object.hasOwn(legacy, "assessment"));
});
