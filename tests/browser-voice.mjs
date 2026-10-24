import assert from "node:assert/strict";
import { chromium } from "playwright";

// Real browser capture/playback, mocked model responses. No paid API requests.
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome-stable",
  headless: true,
  args: [
    "--no-sandbox",
    "--use-fake-device-for-media-stream",
    "--use-fake-ui-for-media-stream",
  ],
});
const context = await browser.newContext({
  permissions: ["microphone"],
  reducedMotion: "reduce",
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
let endPayload;
try {
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
    assert.equal(route.request().postDataJSON().text, user.text);
    await route.fulfill({
      json: { user, caller: reply, audio, callerEnded: false },
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
        transcript: [caller, user, reply],
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
  await page.getByRole("button", { name: "Start call", exact: true }).click();
  await page.locator(".call-page").waitFor();
  await page.getByText("Listening to you", { exact: true }).waitFor();
  await page
    .getByRole("button", { name: "Mute microphone", exact: true })
    .click();
  await page.getByText("Microphone muted", { exact: true }).waitFor();
  await page
    .getByRole("textbox", { name: "Your response to the caller" })
    .fill(user.text);
  await page.getByRole("button", { name: "Send response" }).click();
  await page.getByText("Microphone muted", { exact: true }).waitFor();
  await page.getByRole("button", { name: "End call", exact: true }).click();
  await page
    .getByRole("heading", { name: "A location to build on." })
    .waitFor();
  assert.ok(endPayload.playedCallerIds.includes(caller.segmentId));
  assert.deepEqual(errors, []);
  console.log(
    "Voice browser check passed: native microphone permissions, caller playback, mute, response, playback acknowledgement, and evidence-led debrief (providers mocked).",
  );
} finally {
  await browser.close();
}
