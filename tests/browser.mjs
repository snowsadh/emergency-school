import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { chromium } from "playwright";

const base = process.env.TEST_URL || "http://127.0.0.1:5173";
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome-stable",
  headless: true,
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1050 },
  reducedMotion: "reduce",
  acceptDownloads: true,
  serviceWorkers: "block",
});
const page = await context.newPage();
const errors = [];
const sessionRequests = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("request", (request) => {
  if (request.url().includes("/api/sessions"))
    sessionRequests.push(request.url());
});

async function clickNav(name) {
  await page.getByRole("navigation").getByRole("button", { name }).click();
}
async function noOverflow() {
  // Viewport changes reach the renderer before responsive styles finish painting.
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  const layout = await page.evaluate(() => ({
    viewport: innerWidth,
    document: document.documentElement.scrollWidth,
    scrollX,
    overflowing: [...document.querySelectorAll("body *")]
      .map((element) => ({
        tag: element.tagName,
        className: String(element.className),
        right: Math.round(element.getBoundingClientRect().right),
        width: Math.round(element.getBoundingClientRect().width),
      }))
      .filter((element) => element.right > innerWidth + 1 && element.width > 0),
  }));
  if (layout.document > layout.viewport) {
    console.log("Overflow diagnostic:", JSON.stringify(layout));
    await page.screenshot({
      path: "artifacts/overflow-failure.png",
      fullPage: true,
    });
  }
  assert.ok(
    layout.document <= layout.viewport,
    "The page must not overflow horizontally.",
  );
}
async function startSample() {
  await page.getByRole("button", { name: "Start call", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Explore a text-only sample" })
    .click();
  await page.locator(".call-page").waitFor();
}
async function respond(text) {
  const count = await page.locator(".live-turn.agent").count();
  await page
    .getByRole("textbox", { name: "Your response to the caller" })
    .fill(text);
  await page.getByRole("button", { name: "Send response" }).click();
  await page.waitForFunction(
    (expected) =>
      document.querySelectorAll(".live-turn.agent").length === expected,
    count + 1,
  );
}

try {
  // Keep this suite offline even when the local server has real provider keys.
  // Block every other API route so a regression cannot reach a paid endpoint.
  await context.route("**/api/**", async (route) => {
    if (new URL(route.request().url()).pathname === "/api/status") {
      await route.fulfill({
        json: {
          openaiConfigured: false,
          fishConfigured: false,
          voiceConfigured: false,
          audioStored: false,
        },
      });
    } else {
      await route.abort("blockedbyclient");
    }
  });
  await page.goto(base);
  await page
    .getByRole("button", { name: "Start call", exact: true })
    .waitFor({ state: "visible" });
  await page.waitForFunction(
    () => !document.querySelector(".start-call")?.disabled,
  );
  assert.match(await page.locator("h1").textContent(), /Call practice/);
  assert.equal(
    (await page.locator(".line-label").textContent()).trim(),
    "Browser call",
  );
  assert.equal(
    await page.locator(".topbar, .voice-status").count(),
    0,
    "Do not repeat the page title or imply audio health from configured keys.",
  );
  assert.match(
    await page.locator(".page-footer").textContent(),
    /Training only/,
  );
  assert.equal(
    await page.getByRole("combobox").count(),
    0,
    "No required preferences on entry.",
  );
  await noOverflow();
  await page.screenshot({ path: "artifacts/home-desktop.png", fullPage: true });

  await startSample();
  assert.equal(
    await page.locator(".call-guide").count(),
    0,
    "Random is the default, without hints.",
  );
  assert.match(await page.locator(".call-notice").textContent(), /scripted/i);
  await respond("Where exactly are you?");
  await respond("Are you somewhere safe right now?");
  await page.screenshot({
    path: "artifacts/sample-call-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "End call", exact: true }).click();
  await page.locator(".debrief-page").waitFor();
  await page
    .getByLabel("A note to yourself")
    .fill("Next time, confirm the location before assuming.");
  await page.getByRole("button", { name: "Save note", exact: true }).click();
  await page.getByRole("button", { name: "Note saved" }).waitFor();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export report" }).click();
  const download = await downloadPromise;
  const exported = await readFile(await download.path(), "utf8");
  assert.match(exported, /Where exactly are you\?/);
  assert.match(exported, /confirm the location before assuming/);
  assert.match(exported, /No automated assessment/);
  await clickNav("Your debriefs");
  assert.equal(await page.locator(".session-row").count(), 1);
  await page.reload();
  await clickNav("Your debriefs");
  assert.equal(
    await page.locator(".session-row").count(),
    1,
    "Sessions persist across reload.",
  );
  await page.locator(".session-row").click();
  assert.equal(
    await page.getByLabel("A note to yourself").inputValue(),
    "Next time, confirm the location before assuming.",
  );

  await clickNav("Practice room");
  await page.locator(".customize-toggle").click();
  await page.getByRole("button", { name: /Fire & smoke/ }).click();
  await page
    .getByRole("combobox", { name: "Optional difficulty" })
    .selectOption("intense");
  await page
    .getByRole("combobox", { name: "Optional language" })
    .selectOption("hi");
  await page.getByRole("switch", { name: "Guided practice" }).check();
  await noOverflow();
  await page.screenshot({
    path: "artifacts/optional-preferences.png",
    fullPage: true,
  });
  await startSample();
  await page.locator(".call-guide").waitFor();
  await page.getByRole("button", { name: /आप अभी कहाँ हैं/ }).click();
  await page.waitForFunction(
    () => document.querySelectorAll(".live-turn.agent").length === 2,
  );
  await page.getByRole("button", { name: "End call", exact: true }).click();
  await page.locator(".debrief-page").waitFor();
  await clickNav("Your debriefs");
  assert.equal(await page.locator(".session-row").count(), 2);

  await page.getByRole("button", { name: "Open example" }).click();
  assert.equal(
    await page.locator(".assessment-score strong").textContent(),
    "78",
  );
  assert.equal(await page.locator(".criterion-row").count(), 9);
  assert.match(
    await page.locator(".assessment-critical").textContent(),
    /Immediate exposure/,
  );
  const criterion = page.locator(".criterion-row").first();
  await criterion.locator("summary").click();
  await criterion.locator(".assessment-evidence-quote").first().click();
  await page.locator(".transcript-selected").waitFor();
  assert.match(
    await page.locator(".transcript-selected").textContent(),
    /Which city is that in/,
  );
  await criterion.locator("summary").click();
  const scoredDownloadReady = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export report", exact: true })
    .click();
  const scoredDownload = await scoredDownloadReady;
  const scoredReport = await readFile(await scoredDownload.path(), "utf8");
  assert.match(scoredReport, /Overall score: 78\/100/);
  assert.match(scoredReport, /CRITICAL FINDINGS/);
  assert.match(scoredReport, /CRITERION LEDGER/);
  await page
    .getByRole("button", {
      name: /Read Location clarification in the transcript/,
    })
    .click();
  await page.locator(".transcript-selected").waitFor();
  assert.match(
    await page.locator(".transcript-selected").textContent(),
    /Which city is that in/,
  );
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "artifacts/debrief-desktop.png",
    fullPage: true,
  });

  for (const width of [375, 390, 768]) {
    await page.setViewportSize({ width, height: 850 });
    await noOverflow();
    if (width === 390)
      await page.screenshot({
        path: "artifacts/debrief-mobile.png",
        fullPage: true,
      });
  }
  await page.setViewportSize({ width: 375, height: 850 });
  await clickNav("Practice room");
  await noOverflow();
  const customization = page.locator(".customize-toggle");
  if ((await customization.getAttribute("aria-expanded")) !== "true")
    await customization.click();
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await page.locator(".customize-toggle").click();
  await page.screenshot({ path: "artifacts/home-mobile.png", fullPage: true });
  await clickNav("Practice record");
  assert.match(await page.locator(".progress-page").textContent(), /2/);
  await noOverflow();

  assert.deepEqual(
    sessionRequests,
    [],
    "Offline samples must never create paid provider sessions.",
  );
  assert.deepEqual(errors, [], "The browser must not report uncaught errors.");
  console.log(
    "Browser checks passed: zero-onboarding random practice, optional guided/Hindi scope, sample conversation, report export/evidence, notes/history persistence, and responsive layouts.",
  );
} finally {
  await browser.close();
}
