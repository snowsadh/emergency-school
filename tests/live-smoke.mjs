import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { chromium } from "playwright";
import { assessmentRubric, rubricVersion } from "../shared/assessment.mjs";

// Explicit opt-in: this test spends API credit and never runs under `npm test`.
assert.ok(
  process.argv.includes("--live"),
  "Pass --live to authorize a paid smoke test.",
);
assert.ok(
  process.env.OPENAI_API_KEY?.trim() && process.env.FISH_API_KEY?.trim(),
  "Both server API keys are required.",
);
const base = process.env.TEST_URL || "http://127.0.0.1:5173";
const requestedScope = {
  mode: "random",
  domains: [],
  difficulty: process.argv.includes("--intense") ? "intense" : "",
  language: "",
};
const summary = {
  checkedAt: new Date().toISOString(),
  syntheticMicrophone: true,
  requestedScope,
  timingsMs: {},
};
const fixtures = await mkdtemp(join(tmpdir(), "emergency-live-"));
await mkdir(resolve("artifacts"), { recursive: true });
let browser;
let sessionId;
let ended = false;

try {
  // Check the local audio dependency before spending API credit.
  await promisify(execFile)("ffmpeg", ["-version"]);
  const status = await (await fetch(`${base}/api/status`)).json();
  assert.equal(
    status.voiceConfigured,
    true,
    "Restart the server after configuring both keys.",
  );
  console.log(
    "Live check: generating a synthetic microphone question with Fish.",
  );
  const began = performance.now();
  const speech = await fetch("https://api.fish.audio/v1/tts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.FISH_API_KEY}`,
      "Content-Type": "application/json",
      model: "drama-3",
    },
    body: JSON.stringify({
      text: "[calm, speaking clearly] Where exactly are you right now?",
      reference_id:
        process.env.FISH_VOICE_ID || "c70cfb98867a4bfb9ae20d2401257b92",
      format: "wav",
    }),
    signal: AbortSignal.timeout(45_000),
  });
  assert.equal(
    speech.status,
    200,
    `Fish speech request failed (HTTP ${speech.status}).`,
  );
  const wav = Buffer.from(await speech.arrayBuffer());
  assert.ok(wav.length > 100, "Fish returned no usable speech.");
  const raw = join(fixtures, "operator-raw.wav");
  const microphone = join(fixtures, "operator-microphone.wav");
  await writeFile(raw, wav);
  await promisify(execFile)("ffmpeg", [
    "-hide_banner",
    "-loglevel",
    "error",
    "-i",
    raw,
    "-af",
    "apad=pad_dur=4",
    "-ar",
    "48000",
    "-ac",
    "1",
    "-c:a",
    "pcm_s16le",
    microphone,
  ]);
  summary.timingsMs.operatorSpeech = Math.round(performance.now() - began);
  console.log("Live check: Fish returned speech; starting the browser call.");

  browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome-stable",
    headless: true,
    args: [
      "--no-sandbox",
      "--use-fake-device-for-media-stream",
      "--use-fake-ui-for-media-stream",
      `--use-file-for-fake-audio-capture=${microphone}`,
    ],
  });
  const context = await browser.newContext({
    permissions: ["microphone"],
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    window.__liveAudio = { decoded: [], ended: 0, tracks: [] };
    const decode = AudioContext.prototype.decodeAudioData;
    AudioContext.prototype.decodeAudioData = async function (...args) {
      const buffer = await decode.apply(this, args);
      window.__liveAudio.decoded.push({
        duration: buffer.duration,
        sampleRate: buffer.sampleRate,
      });
      return buffer;
    };
    const create = AudioContext.prototype.createBufferSource;
    AudioContext.prototype.createBufferSource = function (...args) {
      const source = create.apply(this, args);
      let cancelled = false;
      const stop = source.stop;
      source.stop = function (...stopArgs) {
        cancelled = true;
        return stop.apply(this, stopArgs);
      };
      source.addEventListener("ended", () => {
        if (!cancelled) window.__liveAudio.ended++;
      });
      return source;
    };
    const microphone = navigator.mediaDevices.getUserMedia.bind(
      navigator.mediaDevices,
    );
    navigator.mediaDevices.getUserMedia = async (...args) => {
      const stream = await microphone(...args);
      window.__liveAudio.tracks.push(...stream.getTracks());
      return stream;
    };
  });
  await page.goto(base);
  await page.waitForFunction(
    () => !document.querySelector(".start-call")?.disabled,
  );
  if (requestedScope.difficulty) {
    await page.locator(".customize-toggle").click();
    await page
      .getByRole("combobox", { name: "Optional difficulty" })
      .selectOption(requestedScope.difficulty);
  }
  const creation = page.waitForResponse(
    (response) =>
      response.url() === `${base}/api/sessions` &&
      response.request().method() === "POST",
    { timeout: 120_000 },
  );
  const replyReady = page.waitForResponse(
    (response) => /\/api\/sessions\/[^/]+\/turn$/.test(response.url()),
    { timeout: 180_000 },
  );
  // Avoid an unhandled rejection if initial scenario creation fails.
  replyReady.catch(() => {});
  const started = performance.now();
  await page.getByRole("button", { name: "Start call", exact: true }).click();
  const startResponse = await creation;
  assert.deepEqual(
    startResponse.request().postDataJSON().scope,
    requestedScope,
    "The live check must accurately record its optional scope.",
  );
  const opening = await startResponse.json();
  assert.equal(
    startResponse.status(),
    200,
    opening.error || "Scenario creation failed.",
  );
  sessionId = opening.id;
  summary.sessionId = sessionId;
  summary.timingsMs.createCall = Math.round(performance.now() - started);
  assert.ok(
    opening.audio && !opening.audioError,
    opening.audioError || "Caller speech was not generated.",
  );
  assert.equal(
    opening.briefing,
    null,
    "The default random call must not reveal a briefing.",
  );
  assert.equal(opening.setup.mode, "random");
  if (requestedScope.difficulty)
    assert.equal(opening.setup.difficulty, requestedScope.difficulty);
  await writeFile(
    resolve("artifacts/live-caller-opening.mp3"),
    Buffer.from(opening.audio, "base64"),
  );
  console.log(
    "Live check: scenario and caller speech generated; waiting for the microphone turn.",
  );

  const turnResponse = await replyReady;
  const turn = await turnResponse.json();
  assert.equal(turnResponse.status(), 200, turn.error || "Speech turn failed.");
  assert.ok(turn.user?.text?.trim(), "The microphone was not transcribed.");
  assert.match(
    turn.user.text,
    /where|exact|right now|location/i,
    "The synthetic question was not recognized.",
  );
  assert.ok(
    turn.audio && !turn.audioError,
    turn.audioError || "Reply speech was not generated.",
  );
  await page
    .getByRole("button", { name: "Mute microphone", exact: true })
    .click();
  await page.waitForFunction(() => window.__liveAudio.ended >= 2, null, {
    timeout: 60_000,
  });
  await page.getByText("Microphone muted", { exact: true }).waitFor();
  await page
    .getByRole("button", { name: "Show transcript", exact: true })
    .click();
  await page.getByText(turn.caller.text, { exact: true }).last().waitFor();
  summary.transcribedQuestion = turn.user.text;
  summary.timingsMs.openingAndFirstTurn = Math.round(
    performance.now() - started,
  );
  const typedQuestions = [
    "Are you somewhere safe, away from any immediate danger?",
    "Tell me what happened. Who is affected, and what can you actually see?",
    `To confirm where you are, you told me: "${turn.caller.text.trim()}". Is that correct? Please correct any location detail I got wrong.`,
  ];
  const followUpsBegan = performance.now();
  for (const [index, question] of typedQuestions.entries()) {
    const playbacks = await page.evaluate(() => window.__liveAudio.ended);
    const responseReady = page.waitForResponse(
      (response) =>
        response.url() === `${base}/api/sessions/${sessionId}/turn` &&
        response.request().method() === "POST",
      { timeout: 150_000 },
    );
    responseReady.catch(() => {});
    await page
      .getByRole("textbox", { name: "Your response to the caller" })
      .fill(question);
    await page.getByRole("button", { name: "Send response" }).click();
    const response = await responseReady;
    const result = await response.json();
    assert.equal(response.status(), 200, result.error || "Typed turn failed.");
    assert.equal(result.user?.text, question);
    assert.ok(
      result.audio && !result.audioError,
      "Caller reply audio is required.",
    );
    assert.notEqual(
      result.callerEnded,
      true,
      "The caller ended before the planned debrief.",
    );
    await page.getByText(result.caller.text, { exact: true }).last().waitFor();
    await page.waitForFunction(
      (expected) => window.__liveAudio.ended >= expected,
      playbacks + 1,
      { timeout: 60_000 },
    );
    await page.getByText("Microphone muted", { exact: true }).waitFor();
    console.log(
      `Live check: typed follow-up ${index + 1}/3 and caller playback passed.`,
    );
  }
  summary.timingsMs.typedFollowUps = Math.round(
    performance.now() - followUpsBegan,
  );
  summary.typedFollowUps = typedQuestions.length;
  console.log(
    "Live check: four trainee turns complete; requesting the scored debrief.",
  );

  const ending = page.waitForResponse(
    (response) => response.url() === `${base}/api/sessions/${sessionId}/end`,
    { timeout: 75_000 },
  );
  const reviewStarted = performance.now();
  await page.getByRole("button", { name: "End call", exact: true }).click();
  const endResponse = await ending;
  const report = await endResponse.json();
  await writeFile(
    resolve("artifacts/live-report.json"),
    JSON.stringify(report, null, 2),
  );
  ended = true;
  assert.equal(
    endResponse.status(),
    200,
    report.error || "Ending the call failed.",
  );
  assert.ok(
    report.review && !report.reviewError,
    report.reviewError || "The debrief was not generated.",
  );
  const traineeIds = new Set(
    report.transcript.filter((t) => t.role === "user").map((t) => t.segmentId),
  );
  assert.ok(
    report.review.moments.every((moment) => traineeIds.has(moment.segmentId)),
    "Feedback must cite actual trainee turns.",
  );
  assert.equal(
    traineeIds.size,
    4,
    "One microphone turn and three typed turns are expected.",
  );
  const assessment = report.review.assessment;
  assert.ok(
    assessment,
    "The report must include a grounded rubric assessment.",
  );
  assert.equal(assessment.rubricVersion, rubricVersion);
  assert.equal(assessment.criteria?.length, 9);
  assert.deepEqual(
    assessment.criteria.map((criterion) => criterion.id).sort(),
    assessmentRubric.map((criterion) => criterion.id).sort(),
  );
  const transcriptIds = new Map(
    report.transcript.map((segment) => [segment.segmentId, segment]),
  );
  assert.equal(
    transcriptIds.size,
    report.transcript.length,
    "Transcript IDs must be unique.",
  );
  const multipliers = { met: 1, partial: 0.5, missed: 0 };
  let earned = 0;
  let possible = 0;
  for (const criterion of assessment.criteria) {
    const anchor = assessmentRubric.find((item) => item.id === criterion.id);
    assert.equal(criterion.weight, anchor.weight);
    assert.equal(criterion.critical, anchor.critical);
    assert.ok(
      ["met", "partial", "missed", "not_assessable"].includes(criterion.status),
    );
    if (criterion.status === "not_assessable") {
      assert.equal(criterion.points, null);
      assert.deepEqual(criterion.evidenceIds, []);
      continue;
    }
    assert.equal(
      criterion.points,
      anchor.weight * multipliers[criterion.status],
    );
    assert.ok(
      criterion.evidenceIds.some((id) => traineeIds.has(id)),
      "Assessed criteria need real trainee evidence.",
    );
    for (const id of criterion.evidenceIds) {
      const segment = transcriptIds.get(id);
      assert.ok(
        segment && segment.final !== false && segment.text?.trim(),
        "Evidence must refer to a real final transcript segment.",
      );
      assert.notEqual(
        segment.playbackConfirmed,
        false,
        "Unheard caller lines cannot support a score.",
      );
    }
    earned += criterion.points;
    possible += anchor.weight;
  }
  const totalWeight = assessmentRubric.reduce(
    (sum, criterion) => sum + criterion.weight,
    0,
  );
  const coverage = Math.round((possible / totalWeight) * 100);
  const expectedScore =
    coverage < 60 || traineeIds.size < 3
      ? null
      : Math.round((earned / possible) * 100);
  assert.equal(assessment.earned, earned);
  assert.equal(assessment.possible, possible);
  assert.equal(assessment.coverage, coverage);
  assert.equal(
    assessment.score,
    expectedScore,
    "A score must be derived from assessable evidence or withheld, never invented.",
  );
  assert.equal(
    assessment.provisional,
    expectedScore === null || coverage < 100,
  );
  const critical = assessment.criteria.filter(
    (criterion) =>
      criterion.critical && ["partial", "missed"].includes(criterion.status),
  );
  assert.deepEqual(
    assessment.criticalFindings.map((finding) => finding.criterionId),
    critical.map((criterion) => criterion.id),
  );
  for (const finding of assessment.criticalFindings) {
    const criterion = critical.find((item) => item.id === finding.criterionId);
    assert.deepEqual(finding.evidenceIds, criterion.evidenceIds);
    assert.equal(finding.reason, criterion.rationale);
  }
  await page.locator(".debrief-page").waitFor();
  assert.deepEqual(errors, [], "The live browser flow had an uncaught error.");
  const audio = await page.evaluate(() => ({
    decoded: window.__liveAudio.decoded,
    ended: window.__liveAudio.ended,
    microphoneReleased: window.__liveAudio.tracks.every(
      (track) => track.readyState === "ended",
    ),
  }));
  assert.equal(
    audio.microphoneReleased,
    true,
    "The microphone must be released after the call.",
  );
  assert.ok(
    audio.decoded.length >= 5 &&
      audio.ended >= 5 &&
      audio.decoded.every((a) => a.duration > 0),
    "The opening and all four caller replies must decode and play fully.",
  );
  assert.ok(
    report.transcript
      .filter((segment) => segment.role === "agent")
      .every((segment) => segment.playbackConfirmed === true),
    "Every caller line must have confirmed playback.",
  );
  summary.timingsMs.debrief = Math.round(performance.now() - reviewStarted);
  summary.scenario = {
    title: report.scenario.title,
    domain: report.scenario.domain,
    difficulty: report.setup.difficulty,
  };
  summary.transcriptTurns = report.transcript.length;
  summary.evidenceMoments = report.review.moments.length;
  summary.assessment = assessment;
  summary.callerProfile = report.scenario.caller;
  summary.callerDirections = report.transcript
    .filter((segment) => segment.role === "agent")
    .map((segment) => ({
      segmentId: segment.segmentId,
      directions: segment.dialogue?.match(/\[[^\]]+\]/g) || [],
      pairedTags: [
        ...new Set(
          [
            ...(segment.dialogue?.matchAll(
              /<(whisper|emphasis|soft|fast|slow|stress|forceful)>/g,
            ) || []),
          ].map((match) => match[1]),
        ),
      ],
    }));
  assert.ok(
    summary.callerDirections.every((line) => line.directions.length > 0),
    "Every generated caller line needs specific performance directions.",
  );
  summary.audio = audio;
  summary.passed = true;
  await page.screenshot({
    path: resolve("artifacts/live-debrief-desktop.png"),
    fullPage: true,
  });
  await writeFile(
    resolve("artifacts/live-smoke-summary.json"),
    JSON.stringify(summary, null, 2),
  );
  console.log(JSON.stringify(summary, null, 2));
} finally {
  await browser?.close();
  if (sessionId && !ended) {
    await fetch(`${base}/api/sessions/${sessionId}/end`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
      signal: AbortSignal.timeout(60_000),
    }).catch(() => {});
  }
  await rm(fixtures, { recursive: true, force: true });
}
