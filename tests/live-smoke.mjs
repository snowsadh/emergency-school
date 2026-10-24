import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { chromium } from "playwright";

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
const summary = {
  checkedAt: new Date().toISOString(),
  syntheticMicrophone: true,
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
      source.addEventListener("ended", () => {
        window.__liveAudio.ended++;
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
  const opening = await startResponse.json();
  assert.equal(
    startResponse.status(),
    200,
    opening.error || "Scenario creation failed.",
  );
  sessionId = opening.id;
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
  summary.transcribedQuestion = turn.user.text;
  summary.timingsMs.openingAndFirstTurn = Math.round(
    performance.now() - started,
  );
  console.log(
    "Live check: microphone transcription and caller reply passed; requesting the debrief.",
  );

  const ending = page.waitForResponse(
    (response) => response.url() === `${base}/api/sessions/${sessionId}/end`,
    { timeout: 75_000 },
  );
  const reviewStarted = performance.now();
  await page.getByRole("button", { name: "End call", exact: true }).click();
  const endResponse = await ending;
  const report = await endResponse.json();
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
    audio.decoded.length >= 2 && audio.decoded.every((a) => a.duration > 0),
    "Both caller turns must decode as real audio.",
  );
  summary.timingsMs.debrief = Math.round(performance.now() - reviewStarted);
  summary.scenario = {
    title: report.scenario.title,
    domain: report.scenario.domain,
    difficulty: report.setup.difficulty,
  };
  summary.transcriptTurns = report.transcript.length;
  summary.evidenceMoments = report.review.moments.length;
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
