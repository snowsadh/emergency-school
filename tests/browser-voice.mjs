import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";

// Real browser capture/playback, mocked model responses. No paid API requests.
const fixtures = await mkdtemp(join(tmpdir(), "emergency-voice-test-"));
const microphone = join(fixtures, "quiet-microphone.wav");
const sampleRate = 48000;
const samples = sampleRate * 4;
const input = Buffer.alloc(44 + samples * 2);
input.write("RIFF", 0);
input.writeUInt32LE(input.length - 8, 4);
input.write("WAVEfmt ", 8);
input.writeUInt32LE(16, 16);
input.writeUInt16LE(1, 20);
input.writeUInt16LE(1, 22);
input.writeUInt32LE(sampleRate, 24);
input.writeUInt32LE(sampleRate * 2, 28);
input.writeUInt16LE(2, 32);
input.writeUInt16LE(16, 34);
input.write("data", 36);
input.writeUInt32LE(samples * 2, 40);
for (let sample = 0; sample < samples; sample++) {
  const seconds = sample / sampleRate;
  if (seconds >= 1.2 && seconds < 2.2)
    input.writeInt16LE(
      Math.round(0.008 * 32767 * Math.sin(2 * Math.PI * 320 * seconds)),
      44 + sample * 2,
    );
}
await writeFile(microphone, input);
await mkdir("artifacts", { recursive: true });
const browser = await chromium.launch({
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
  reducedMotion: "reduce",
  serviceWorkers: "block",
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));

// A short silent WAV exercises native browser audio decoding without provider audio.
const wav = Buffer.alloc(44 + 3200);
wav.write("RIFF", 0);
wav.writeUInt32LE(wav.length - 8, 4);
wav.write("WAVEfmt ", 8);
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(8000, 24);
wav.writeUInt32LE(16000, 28);
wav.writeUInt16LE(2, 32);
wav.writeUInt16LE(16, 34);
wav.write("data", 36);
wav.writeUInt32LE(3200, 40);
const audio = wav.toString("base64");
const id = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
const setup = {
  mode: "random",
  difficulty: "challenging",
  language: "en",
  domains: [],
};
const caller = {
  segmentId: "voice-opening",
  role: "agent",
  text: "There is smoke near the market.",
  at: 0,
  final: true,
};
const user = {
  segmentId: "voice-user",
  role: "user",
  text: "Where exactly are you?",
  at: 1,
  final: true,
};
const reply = {
  segmentId: "voice-reply",
  role: "agent",
  text: "At the fictional market, Gate B.",
  at: 2,
  final: true,
};
const safetyQuestion = {
  ...user,
  segmentId: "voice-safety",
  text: "Are you somewhere safe?",
  at: 3,
};
const safetyReply = {
  ...reply,
  segmentId: "voice-safety-reply",
  text: "Across the street, away from the smoke.",
  at: 4,
};
const typedQuestion = {
  ...user,
  segmentId: "voice-typed",
  text: "Can you confirm Gate B?",
  at: 5,
};
const typedReply = {
  ...reply,
  segmentId: "voice-typed-reply",
  text: "Yes, Gate B.",
  at: 6,
};
let audioRequests = 0;
let typedRequests = 0;
let failedRequests = 0;
let endPayload;
try {
  // Fail closed: unmocked routes must never reach a paid provider.
  await page.route("**/api/**", (route) => route.abort("blockedbyclient"));
  await page.route("**/api/status", (route) =>
    route.fulfill({
      json: {
        voiceConfigured: true,
        openaiConfigured: true,
        fishConfigured: true,
      },
    }),
  );
  await page.route("**/api/sessions", async (route) => {
    assert.deepEqual(route.request().postDataJSON().scope, {
      mode: "random",
      difficulty: "",
      language: "",
      domains: [],
    });
    await route.fulfill({
      json: {
        id,
        kind: "voice",
        startedAt: Date.now(),
        setup,
        briefing: null,
        caller,
        audio,
      },
    });
  });
  await page.route(`**/api/sessions/${id}/turn`, async (route) => {
    const payload = route.request().postDataJSON();
    let responseUser, responseCaller;
    if (payload.text) {
      if (payload.text === "Failure recovery check") {
        failedRequests++;
        await route.fulfill({
          status: 502,
          json: { error: "Test reply unavailable" },
        });
        return;
      }
      assert.equal(payload.text, typedQuestion.text);
      typedRequests++;
      responseUser = typedQuestion;
      responseCaller = typedReply;
    } else {
      audioRequests++;
      assert.ok(
        payload.audio.length > 100,
        "The browser must send recorded bytes, not typed text.",
      );
      assert.match(payload.mimeType, /^audio\/(webm|mp4|ogg)/);
      responseUser = audioRequests === 1 ? user : safetyQuestion;
      responseCaller = audioRequests === 1 ? reply : safetyReply;
    }
    await route.fulfill({
      json: {
        user: responseUser,
        caller: responseCaller,
        audio,
        callerEnded: false,
      },
    });
  });
  await page.route(`**/api/sessions/${id}/end`, async (route) => {
    endPayload = route.request().postDataJSON();
    await route.fulfill({
      json: {
        id,
        kind: "voice",
        setup,
        scenario: { title: "Smoke near a fictional market", domain: "fire" },
        transcript: [
          caller,
          user,
          reply,
          safetyQuestion,
          safetyReply,
          typedQuestion,
          typedReply,
        ],
        duration: 3,
        createdAt: new Date().toISOString(),
        review: {
          headline: "A location to build on.",
          overview: "You asked where the caller was.",
          moments: [
            {
              kind: "observation",
              segmentId: user.segmentId,
              title: "A location question",
              comment: "Review the answer alongside your question.",
            },
          ],
          nextPractice: {
            title: "Confirm the landmark.",
            explanation: "One detail at a time.",
            prompt: "Which gate?",
          },
        },
      },
    });
  });
  await page.goto(process.env.TEST_URL || "http://127.0.0.1:5173");
  const automaticTurn = page.waitForResponse(
    (response) => response.url().endsWith(`/api/sessions/${id}/turn`),
    { timeout: 20_000 },
  );
  await page.getByRole("button", { name: "Start call", exact: true }).click();
  await page.locator(".call-page").waitFor();
  await automaticTurn;
  assert.equal(
    audioRequests,
    1,
    "Quiet microphone audio must submit automatically after a pause.",
  );
  await page
    .getByRole("button", { name: "Show transcript", exact: true })
    .click();
  await page.getByText(reply.text, { exact: true }).waitFor();
  await page.getByText("Listening to you", { exact: true }).waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: "artifacts/readme-call.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Send voice", exact: true }).click();
  await page.getByText(safetyReply.text, { exact: true }).waitFor();
  await page.getByText("Listening to you", { exact: true }).waitFor();
  await page
    .getByRole("button", { name: "Mute microphone", exact: true })
    .click();
  await page.getByText("Microphone muted", { exact: true }).waitFor();
  await page.screenshot({
    path: "artifacts/voice-call-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 375, height: 850 });
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.screenshot({
    path: "artifacts/voice-call-mobile.png",
    fullPage: true,
  });
  await page
    .getByRole("textbox", { name: "Your response to the caller" })
    .fill(typedQuestion.text);
  await page.getByRole("button", { name: "Send response" }).click();
  await page.getByText(typedReply.text, { exact: true }).waitFor();
  await page.getByText("Microphone muted", { exact: true }).waitFor();
  await page
    .getByRole("button", { name: "Unmute microphone", exact: true })
    .click();
  await page.getByText("Listening to you", { exact: true }).waitFor();
  await page.evaluate(() => {
    MediaRecorder.prototype.start = () => {
      throw new DOMException("Test recording failure", "NotReadableError");
    };
  });
  await page
    .getByRole("textbox", { name: "Your response to the caller" })
    .fill("Failure recovery check");
  await page.getByRole("button", { name: "Send response" }).click();
  await page.getByText("Microphone unavailable", { exact: true }).waitFor();
  assert.equal(
    await page
      .getByRole("button", { name: "Send voice", exact: true })
      .isDisabled(),
    true,
  );
  await page.getByRole("button", { name: "End call", exact: true }).click();
  await page
    .getByRole("heading", { name: "A location to build on." })
    .waitFor();
  assert.ok(endPayload.playedCallerIds.includes(caller.segmentId));
  assert.equal(
    audioRequests,
    2,
    "Both automatic and manual microphone turns must reach the server.",
  );
  assert.equal(typedRequests, 1);
  assert.equal(
    failedRequests,
    1,
    "A failed recorder retry must not be overwritten with a false listening state.",
  );
  assert.deepEqual(errors, []);
  console.log(
    "Voice browser check passed: native quiet microphone auto-submit, Send voice fallback, caller playback, mute, typed fallback, responsive controls, and evidence-led debrief (providers mocked).",
  );
} finally {
  await browser.close();
  await rm(fixtures, { recursive: true, force: true });
}
