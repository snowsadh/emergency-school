import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { createApi } from "../server/api.mjs";
import {
  createIntelligence,
  groundReview,
  plainDialogue,
  validateDialogue,
} from "../server/intelligence.mjs";
import { validateSetup, chooseScenario } from "../shared/scenarios.mjs";

const scenario = {
  title: "Smoke beside a market",
  domain: "fire",
  brief: "A bystander sees smoke.",
  language: "en",
  difficulty: "challenging",
  caller: {
    name: "Asha",
    personality: "An observant shopkeeper",
    panic: "moderate",
    coherence: "fragmented",
  },
  facts: {
    location: "Fictional Market Gate B",
    situation: "Smoke, no visible flames",
    safety: "Across the street",
    people: "Unknown",
    callback: "SIMULATED CALLBACK",
    unknowns: "Source of smoke",
  },
  opening:
    "[frightened, quick uneven phrases, voice trembling] There is <emphasis>smoke</emphasis> near the market. [short, shaky inhale]",
};

async function withServer(options, run) {
  const api = createApi(options);
  const server = http.createServer((req, res) => {
    api(req, res).catch((error) => {
      res.writeHead(500);
      res.end(error.message);
    });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = async (path, body, headers = {}) => {
    const response = await fetch(base + path, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    });
    return { status: response.status, body: await response.json() };
  };
  try {
    await run({ base, post });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("empty scope works; optional constraints remain optional and invalid values fail", () => {
  assert.deepEqual(validateSetup(), {
    mode: "random",
    difficulty: "",
    language: "",
    domains: [],
  });
  assert.equal(chooseScenario({}, () => 0).domain, "road");
  assert.equal(chooseScenario({ domains: ["fire"] }, () => 0).domain, "fire");
  assert.throws(() => validateSetup({ domains: ["invented"] }));
  assert.throws(() => validateSetup({ domains: "fire" }));
  assert.throws(() => validateSetup({ mode: "scheduled" }));
  assert.equal(
    plainDialogue("[shaky breath] Please <emphasis>help</emphasis> me."),
    "Please help me.",
  );
  assert.throws(() => validateDialogue("[silence]"));
  const review = groundReview(
    {
      moments: [
        { segmentId: "real" },
        { segmentId: "invented" },
        { segmentId: "caller" },
      ],
    },
    [
      { segmentId: "real", role: "user" },
      { segmentId: "caller", role: "agent" },
    ],
  );
  assert.deepEqual(review.moments, [{ segmentId: "real" }]);
});

test("OpenAI SDK receives structured, non-stored requests and rejects scope drift", async () => {
  const requests = [];
  const intelligence = createIntelligence(
    {},
    {
      responses: {
        parse: async (request) => {
          requests.push(request);
          return {
            status: "completed",
            output_parsed: structuredClone(scenario),
          };
        },
      },
    },
  );
  const generated = await intelligence.generate(validateSetup({}));
  assert.equal(generated.domain, "fire");
  assert.equal(requests[0].store, false);
  assert.equal(requests[0].text.format.type, "json_schema");
  assert.equal(requests[0].text.format.strict, true);
  await assert.rejects(
    intelligence.generate(validateSetup({ domains: ["road"] })),
  );
});

test("opening and reply prompts share actor direction, intensity examples, and emotional continuity", async () => {
  const requests = [];
  const dialogue =
    "[still frightened, slightly steadier after a slow exhale] At the market. [brief pause] <slow>Gate B.</slow>";
  const intelligence = createIntelligence(
    {},
    {
      responses: {
        parse: async (request) => {
          requests.push(request);
          return {
            status: "completed",
            output_parsed:
              request.text.format.name === "training_scenario"
                ? structuredClone(scenario)
                : { dialogue, endCall: false },
          };
        },
      },
    },
  );
  const generated = await intelligence.generate(validateSetup({}));
  const reply = await intelligence.reply({
    scenario: generated,
    transcript: [
      {
        role: "agent",
        text: plainDialogue(generated.opening),
        dialogue: generated.opening,
      },
      { role: "user", text: "I am listening. Which gate are you near?" },
    ],
  });
  for (const request of requests) {
    assert.equal(request.model, "gpt-4.1");
    assert.match(request.instructions, /Brief a voice actor/);
    assert.match(request.instructions, /emotion and intensity/);
    assert.match(
      request.instructions,
      /pacing, breath, vocal tension, or phrase breaks/,
    );
    assert.match(request.instructions, /do not force every caller to panic/);
    for (const level of [
      "Low panic",
      "Moderate panic",
      "High panic",
      "Gradual settling",
    ])
      assert.ok(request.instructions.includes(`${level} example`));
    for (const tag of [
      "whisper",
      "emphasis",
      "soft",
      "fast",
      "slow",
      "stress",
      "forceful",
    ])
      assert.ok(request.instructions.includes(`<${tag}>...</${tag}>`));
    assert.match(request.instructions, /over several exchanges/);
    assert.match(request.instructions, /NEVER copy their incident facts/);
  }
  assert.match(requests[1].instructions, /facts are immutable/);
  assert.match(
    requests[1].instructions,
    /Never claim real help was dispatched/,
  );
  assert.equal(requests[1].input[0].content, scenario.opening);
  assert.equal(reply.dialogue, dialogue);
  assert.equal(plainDialogue(reply.dialogue), "At the market. Gate B.");
});

test("a complete voice call: no onboarding, hidden facts, tagged Fish speech, authoritative transcript, idempotent debrief", async () => {
  const spoken = [];
  const taggedReply =
    "[still frightened, slower with a trembling voice] At the market, <stress>Gate B.</stress> [brief pause]";
  let reviews = 0;
  const intelligence = {
    generate: async (scope) => {
      assert.equal(scope.mode, "random");
      assert.deepEqual(scope.domains, []);
      return structuredClone(scenario);
    },
    reply: async (session) => {
      assert.equal(session.scenario.facts.location, "Fictional Market Gate B");
      return {
        dialogue: taggedReply,
        endCall: false,
      };
    },
    review: async (session) => {
      reviews++;
      return {
        headline: "A location to build on.",
        overview: "You asked a location question.",
        moments: [
          {
            kind: "observation",
            segmentId: session.transcript[1].segmentId,
            title: "Location",
            comment: "Review the answer.",
          },
        ],
        nextPractice: {
          title: "Confirm the landmark",
          explanation: "Try a follow-up.",
          prompt: "Which gate?",
        },
      };
    },
  };
  await withServer(
    {
      env: { OPENAI_API_KEY: "test-only", FISH_API_KEY: "test-only" },
      intelligence,
      fetchImpl: async (url, options) => {
        assert.equal(url, "https://api.fish.audio/v1/tts");
        assert.equal(options.headers.model, "drama-3");
        spoken.push(JSON.parse(options.body));
        return new Response(new Uint8Array([1, 2, 3]), {
          headers: { "Content-Type": "audio/mpeg" },
        });
      },
    },
    async ({ base, post }) => {
      const status = await (await fetch(base + "/api/status")).json();
      assert.equal(status.voiceConfigured, true);
      const start = await post("/api/sessions", {});
      assert.equal(start.status, 200);
      assert.equal(start.body.briefing, null);
      assert.equal(start.body.scenario, undefined);
      assert.equal(start.body.caller.text, "There is smoke near the market.");
      assert.equal(start.body.caller.dialogue, scenario.opening);
      assert.equal(spoken[0].text, scenario.opening);
      assert.ok(start.body.audio);
      const id = start.body.id;
      const reply = await post(`/api/sessions/${id}/turn`, {
        text: "Where exactly are you?",
      });
      assert.equal(reply.status, 200);
      assert.equal(reply.body.user.role, "user");
      assert.equal(reply.body.caller.text, "At the market, Gate B.");
      assert.equal(reply.body.caller.dialogue, taggedReply);
      assert.equal(spoken[1].text, taggedReply);
      const end = await post(`/api/sessions/${id}/end`, {
        playedCallerIds: [start.body.caller.segmentId],
      });
      assert.equal(end.status, 200);
      assert.equal(end.body.transcript.length, 3);
      assert.equal(end.body.transcript[0].playbackConfirmed, true);
      assert.equal(end.body.transcript[2].playbackConfirmed, false);
      assert.equal(end.body.transcript[2].dialogue, taggedReply);
      assert.equal(end.body.transcript[2].text, "At the market, Gate B.");
      assert.equal(end.body.scenario.title, scenario.title);
      assert.ok(end.body.review);
      assert.equal((await post(`/api/sessions/${id}/end`, {})).status, 200);
      assert.equal(reviews, 1);
      assert.equal(
        (await post(`/api/sessions/${id}/turn`, { text: "Still there?" }))
          .status,
        409,
      );
    },
  );
});

test("missing credentials, malformed scope, cross-origin access, and unavailable review are explicit", async () => {
  await withServer({ env: {} }, async ({ post }) => {
    assert.equal((await post("/api/sessions", {})).status, 503);
    assert.equal(
      (await post("/api/sessions", { scope: { language: "xx" } })).status,
      400,
    );
    assert.equal(
      (await post("/api/sessions", {}, { Origin: "https://untrusted.example" }))
        .status,
      403,
    );
  });
  await withServer(
    {
      env: { OPENAI_API_KEY: "test-only" },
      intelligence: {
        generate: async () => structuredClone(scenario),
        review: async () => {
          throw new Error("upstream unavailable");
        },
      },
    },
    async ({ post }) => {
      const start = await post("/api/sessions", { kind: "text" });
      assert.equal(start.status, 200);
      const end = await post(`/api/sessions/${start.body.id}/end`, {});
      assert.equal(end.status, 200);
      assert.equal(end.body.review, null);
      assert.ok(end.body.reviewError);
      assert.equal(end.body.transcript.length, 1);
    },
  );
});

test("ending during an in-flight reply freezes the transcript and refuses overlapping turns", async () => {
  const enteredReply = Promise.withResolvers();
  const releaseReply = Promise.withResolvers();
  let reviewedTranscript;
  let reviews = 0;
  const intelligence = {
    generate: async () => structuredClone(scenario),
    reply: async () => {
      enteredReply.resolve();
      await releaseReply.promise;
      return { dialogue: "[calmer] I am at Gate B.", endCall: false };
    },
    review: async (session) => {
      reviews++;
      reviewedTranscript = structuredClone(session.transcript);
      return null;
    },
  };
  await withServer(
    { env: { OPENAI_API_KEY: "test-only" }, intelligence },
    async ({ post }) => {
      const start = await post("/api/sessions", { kind: "text" });
      const path = `/api/sessions/${start.body.id}`;
      const pendingTurn = post(`${path}/turn`, {
        text: "Where exactly are you?",
      });
      try {
        await enteredReply.promise;
        assert.equal(
          (await post(`${path}/turn`, { text: "Are you still there?" })).status,
          409,
        );
        const ended = await post(`${path}/end`, {});
        assert.equal(ended.status, 200);
        assert.deepEqual(
          ended.body.transcript.map((turn) => turn.role),
          ["agent", "user"],
        );
        assert.equal(reviewedTranscript[1].text, "Where exactly are you?");
        releaseReply.resolve();
        assert.equal((await pendingTurn).status, 409);
        const repeatedEnd = await post(`${path}/end`, {});
        assert.deepEqual(repeatedEnd.body.transcript, ended.body.transcript);
        assert.equal(reviews, 1);
      } finally {
        releaseReply.resolve();
        await pendingTurn;
      }
    },
  );
});

test("audio transcription and speech failures preserve evidence without inventing playback", async () => {
  const recording = Buffer.from("fictional recorded audio ".repeat(8));
  let speechRequests = 0;
  let reviewedSession;
  const intelligence = {
    generate: async () => structuredClone(scenario),
    transcribe: async (buffer, mimeType, language, signal) => {
      assert.deepEqual(buffer, recording);
      assert.equal(mimeType, "audio/webm");
      assert.equal(language, "en");
      assert.equal(signal.aborted, false);
      return "Which gate are you near?";
    },
    reply: async () => ({
      dialogue: "[trying to focus] Gate B.",
      endCall: false,
    }),
    review: async (session) => {
      reviewedSession = session;
      return null;
    },
  };
  await withServer(
    {
      env: { OPENAI_API_KEY: "test-only", FISH_API_KEY: "test-only" },
      intelligence,
      fetchImpl: async () =>
        ++speechRequests === 1
          ? new Response("Unavailable", { status: 503 })
          : new Response(new Uint8Array([1, 2, 3])),
    },
    async ({ post }) => {
      const start = await post("/api/sessions", {});
      assert.equal(start.status, 200);
      assert.equal(start.body.audio, null);
      assert.match(start.body.audioError, /Fish/);
      const path = `/api/sessions/${start.body.id}`;
      const turn = await post(`${path}/turn`, {
        audio: recording.toString("base64"),
        mimeType: "audio/webm;codecs=opus",
      });
      assert.equal(turn.status, 200);
      assert.equal(turn.body.user.text, "Which gate are you near?");
      assert.ok(turn.body.audio);
      const end = await post(`${path}/end`, {
        playedCallerIds: [turn.body.caller.segmentId],
      });
      assert.equal(end.body.transcript[0].playbackConfirmed, false);
      assert.equal(end.body.transcript[2].playbackConfirmed, true);
      assert.equal(
        JSON.stringify(reviewedSession).includes(recording.toString("base64")),
        false,
      );
    },
  );
});

test("a failed reply retains the trainee turn and allows the next response", async () => {
  let attempts = 0;
  const intelligence = {
    generate: async () => structuredClone(scenario),
    reply: async () => {
      if (++attempts === 1) throw new Error("Provider unavailable");
      return { dialogue: "[steadier] I am across the street.", endCall: false };
    },
    review: async () => null,
  };
  await withServer(
    { env: { OPENAI_API_KEY: "test-only" }, intelligence },
    async ({ post }) => {
      const start = await post("/api/sessions", { kind: "text" });
      const path = `/api/sessions/${start.body.id}`;
      const failed = await post(`${path}/turn`, { text: "Are you safe?" });
      assert.equal(failed.status, 502);
      assert.equal(failed.body.user.text, "Are you safe?");
      assert.equal(
        (await post(`${path}/turn`, { text: "Can you hear me?" })).status,
        200,
      );
      const ended = await post(`${path}/end`, {});
      assert.deepEqual(
        ended.body.transcript.map((turn) => turn.role),
        ["agent", "user", "user", "agent"],
      );
      assert.equal(
        ended.body.transcript[1].segmentId,
        failed.body.user.segmentId,
      );
    },
  );
});

test("call creation is rate limited before additional provider work", async () => {
  let generations = 0;
  await withServer(
    {
      env: { OPENAI_API_KEY: "test-only" },
      intelligence: {
        generate: async () => {
          generations++;
          return structuredClone(scenario);
        },
      },
    },
    async ({ post }) => {
      for (let i = 0; i < 6; i++)
        assert.equal(
          (await post("/api/sessions", { kind: "text" })).status,
          200,
        );
      assert.equal((await post("/api/sessions", { kind: "text" })).status, 429);
      assert.equal(generations, 6);
    },
  );
});
