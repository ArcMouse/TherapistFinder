/**
 * MindEase end-to-end verification against a real Chromium browser.
 *
 * Prereqs:
 *   - Django API on http://localhost:8000 (seeded)
 *   - Expo web on http://localhost:8081
 *
 * Run: node run.mjs
 */
import { chromium } from "playwright-core";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SHOTS = join(__dirname, "screenshots");
mkdirSync(SHOTS, { recursive: true });

const APP_URL = process.env.APP_URL || "http://localhost:8081";
const CHROME =
  process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const results = [];
const consoleErrors = [];
const pageErrors = [];
const searchedRequests = [];

let stepIndex = 0;
function step(name) {
  stepIndex += 1;
  console.log(`\n[${String(stepIndex).padStart(2, "0")}] ${name}`);
}

async function check(name, fn) {
  const started = Date.now();
  try {
    await fn();
    results.push({ name, status: "PASS", ms: Date.now() - started });
    console.log(`     ✓ ${name}`);
  } catch (error) {
    results.push({ name, status: "FAIL", ms: Date.now() - started, error: String(error) });
    console.log(`     ✗ ${name} — ${error}`);
    throw error;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const context = await browser.newContext({
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(String(error)));
  page.on("request", (request) => {
    if (request.url().includes("/api/search/")) searchedRequests.push(request.url());
  });

  const screenshot = async (name) => {
    const path = join(SHOTS, `${name}.png`);
    await page.screenshot({ path, fullPage: true });
    console.log(`     📸 ${path}`);
  };

  const email = `e2e_${Date.now()}@mindease.test`;
  const password = "E2ePassword123";

  try {
    // 1 — entry point redirects anonymous users to auth
    step("Load app and assert redirect to auth screen");
    await page.goto(APP_URL, { waitUntil: "networkidle" });
    await page.waitForURL(/\/auth$/, { timeout: 30000 });
    await check("unauthenticated visit redirects to /auth", async () => {
      assert(/\/auth$/.test(page.url()), `expected /auth, got ${page.url()}`);
    });

    // 2 — auth screen shows both buttons
    step("Assert both auth options are visible");
    const googleText = page.getByText("Continue with Google");
    const emailText = page.getByText("Continue with Email");
    await googleText.waitFor({ state: "visible", timeout: 20000 });
    await check("Google button visible", async () => {
      assert(await googleText.isVisible(), "Google button not visible");
    });
    await check("Email button visible", async () => {
      assert(await emailText.isVisible(), "Email button not visible");
    });
    await check("Terms link visible", async () => {
      assert(await page.getByText(/Terms & Privacy/).isVisible(), "Terms link not visible");
    });
    await screenshot("01-auth");

    // 3 — email auth screen
    step("Open the email auth screen");
    await page.getByTestId("email-button").click();
    await page.waitForURL(/\/auth\/email$/, { timeout: 20000 });
    await check("navigated to /auth/email", async () => {
      assert(/\/auth\/email$/.test(page.url()), `got ${page.url()}`);
    });
    await screenshot("02-email");

    // 4 — sign up
    step("Sign up with email + password");
    await page.getByTestId("mode-signup").click();
    await page.getByTestId("input-name").fill("E2E Tester");
    await page.getByTestId("input-email").fill(email);
    await page.getByTestId("input-password").fill(password);
    await page.getByTestId("input-confirm-password").fill(password);
    await page.getByTestId("submit-button").click();

    await page.waitForURL(/\/onboarding\/language$/, { timeout: 30000 });
    await check("signup redirects to /onboarding/language", async () => {
      assert(/\/onboarding\/language$/.test(page.url()), `got ${page.url()}`);
    });

    // 5 — onboarding: language
    step("Onboarding — select English");
    await page.getByTestId("language-en").click();
    await check("English option is selected", async () => {
      const classes = (await page.getByTestId("language-en").getAttribute("class")) || "";
      assert(classes.includes("border-primary-500"), `English not selected: ${classes}`);
    });
    await check("other languages are disabled scaffolding", async () => {
      assert((await page.getByTestId("language-hi").count()) === 1, "Hindi scaffolding missing");
      const disabled = await page.getByTestId("language-hi").getAttribute("aria-disabled");
      assert(disabled === "true", `Hindi should be disabled, aria-disabled=${disabled}`);
    });
    await screenshot("03-onboarding-language");
    await page.getByTestId("language-continue").click();
    await page.waitForURL(/\/onboarding\/location$/, { timeout: 30000 });

    // 6 — onboarding: location
    step("Onboarding — select India");
    await page.getByTestId("country-IN").click();
    await check("India is the only country option", async () => {
      const count = await page.getByText("India", { exact: true }).count();
      assert(count === 1, `expected 1 India option, found ${count}`);
    });
    await screenshot("04-onboarding-location");
    await page.getByTestId("country-IN").click();
    await page.getByTestId("location-finish").click();
    await page.waitForURL((url) => !url.pathname.includes("onboarding"), { timeout: 30000 });

    // 7 — therapist list
    step("Assert therapist list renders cards");
    await page.getByText("Find your therapist").waitFor({ timeout: 30000 });
    await page.waitForSelector('[data-testid^="therapist-card-"]', { timeout: 30000 });
    const cardCount = await page.locator('[data-testid^="therapist-card-"]').count();
    await check(`therapist list renders ≥1 card (found ${cardCount})`, async () => {
      assert(cardCount >= 1, "no therapist cards rendered");
    });
    await screenshot("05-therapist-list");

    // 7b — date availability filters
    step("Date filters return matching therapists");
    const applyDateFilter = async (testid) => {
      await page.getByTestId(testid).click();
      // A new filter key hits the network; toggling back can be served from the
      // React Query cache, so don't require a response — just settle briefly.
      await Promise.race([
        page
          .waitForResponse(
            (r) => r.url().includes("/api/therapists/") && r.status() === 200,
            { timeout: 3000 }
          )
          .catch(() => null),
        page.waitForTimeout(700),
      ]);
      await page.waitForTimeout(300);
      return page.locator('[data-testid^="therapist-card-"]').count();
    };

    const tomorrowCount = await applyDateFilter("date-filter-tomorrow");
    await check(`Tomorrow filter shows ${tomorrowCount} therapist(s)`, async () => {
      assert(tomorrowCount >= 1, "Tomorrow returned no therapists");
    });
    const weekendCount = await applyDateFilter("date-filter-this-weekend");
    await check(`This weekend filter shows ${weekendCount} therapist(s)`, async () => {
      assert(weekendCount >= 1, "This weekend returned no therapists");
    });
    await screenshot("06b-date-filter");
    const clearedCount = await applyDateFilter("date-filter-this-weekend");
    await check("toggling the filter off restores all therapists", async () => {
      assert(clearedCount >= 8, `expected all therapists after clearing, got ${clearedCount}`);
    });

    // 8 — natural-language search
    step("Natural-language search");
    const searchBox = page.getByTestId("search-bar");
    await searchBox.fill("anxiety therapist available Sunday evening");
    await searchBox.press("Enter");
    const searchResponse = page.waitForResponse(
      (response) => response.url().includes("/api/search/") && response.status() === 200,
      { timeout: 30000 }
    );
    await searchBox.fill("anxiety therapist available Sunday evening");
    await searchBox.press("Enter");
    const searchPayload = await (await searchResponse).json();
    await check("search called /api/search/", async () => {
      assert(searchedRequests.length >= 1, "no /api/search/ request observed");
    });
    await check("search results label rendered", async () => {
      await page.getByText(/Results for/).waitFor({ timeout: 20000 });
    });
    await screenshot("06-search-results");

    const afterSearchCount = await page.locator('[data-testid^="therapist-card-"]').count();
    await check(`search returns results (${afterSearchCount})`, async () => {
      assert(afterSearchCount >= 1, "search returned no cards");
      assert(searchPayload.count >= 1, "search payload had no results");
    });

    // 9 — therapist detail
    step("Open therapist detail");
    const topResult = searchPayload.results[0];
    const expectedTag = (topResult.top_tags && topResult.top_tags[0]) || topResult.tags[0];
    const firstCard = page.locator('[data-testid^="therapist-card-"]').first();
    const cardTestId = await firstCard.getAttribute("data-testid");
    const therapistId = cardTestId.replace("therapist-card-", "");
    await check("first search result matches the first card", async () => {
      assert(
        String(topResult.id) === String(therapistId),
        `card id ${therapistId} != API id ${topResult.id}`
      );
    });
    await firstCard.click();
    await page.waitForURL(new RegExp(`/therapist/${therapistId}$`), { timeout: 30000 });
    await page.getByTestId("detail-name").waitFor({ timeout: 30000 });

    await check("detail shows the searched therapist name", async () => {
      const name = await page.getByTestId("detail-name").innerText();
      assert(name === topResult.name, `expected ${topResult.name}, got ${name}`);
    });
    await check("detail shows degree", async () => {
      assert(await page.getByTestId("detail-degree").isVisible(), "no degree");
    });
    await check("detail shows bio", async () => {
      assert(await page.getByTestId("detail-bio").isVisible(), "no bio");
    });
    await check(`detail shows tags (${expectedTag})`, async () => {
      const detail = page.getByTestId("therapist-detail");
      assert(
        await detail.getByText(expectedTag, { exact: true }).first().isVisible(),
        `tag ${expectedTag} missing`
      );
    });
    await check("detail shows pricing", async () => {
      const price = await page.getByTestId("detail-pricing").innerText();
      assert(price.includes("₹"), `price missing in: ${price}`);
    });
    await check("detail shows availability grid", async () => {
      await page.getByTestId("therapist-detail").getByTestId("availability-grid").waitFor({ timeout: 20000 });
    });
    await screenshot("07-therapist-detail");

    // 10 — booking confirmation
    step("Book a Zoom call");
    await page.getByTestId("book-cta").click();
    await page.waitForURL((url) => url.pathname.endsWith("/booking/confirm"), { timeout: 30000 });
    const confirm = page.getByTestId("booking-confirm");
    await confirm.getByTestId("booking-summary").waitFor({ timeout: 30000 });

    const slotLocator = confirm.locator('[data-testid^="slot-"]');
    await slotLocator.first().waitFor({ timeout: 30000 });
    const slotCount = await slotLocator.count();
    let chosenTestId = null;
    for (let i = 0; i < slotCount; i += 1) {
      const element = slotLocator.nth(i);
      const disabled = await element.getAttribute("aria-disabled");
      if (disabled !== "true") {
        chosenTestId = await element.getAttribute("data-testid");
        await element.click();
        break;
      }
    }
    await check("picked a free slot", async () => {
      assert(chosenTestId !== null, "no free slot available to pick");
    });
    await screenshot("08-booking-confirm");

    const bookingResponse = page.waitForResponse(
      (response) => response.url().includes("/api/bookings/") && response.request().method() === "POST",
      { timeout: 30000 }
    );
    await page.getByTestId("booking-confirm").getByTestId("confirm-book").click();
    const response = await bookingResponse;
    await check(`POST /api/bookings/ returned ${response.status()}`, async () => {
      assert(response.status() === 201, `expected 201, got ${response.status()}`);
    });

    await page.waitForURL(/\/bookings$/, { timeout: 30000 });
    await check("navigated to My Bookings", async () => {
      assert(/\/bookings$/.test(page.url()), `got ${page.url()}`);
    });
    await check("booking appears in My Bookings", async () => {
      await page.locator('[data-testid^="booking-"]').first().waitFor({ timeout: 20000 });
    });
    await screenshot("09-my-bookings");

    // 11 — booked slot is greyed out on re-open
    step("Re-open therapist and assert the slot is now booked");
    const bookedSlotDate = chosenTestId.replace("slot-", "");
    await page.goto(`${APP_URL}/therapist/${therapistId}`, { waitUntil: "networkidle" });
    await page.getByTestId("therapist-detail").getByTestId("availability-grid").waitFor({ timeout: 30000 });
    await check("previously booked slot is now disabled", async () => {
      const element = page.getByTestId("therapist-detail").locator(`[data-testid="slot-${bookedSlotDate}"]`);
      await element.waitFor({ timeout: 20000 });
      const disabled = await element.getAttribute("aria-disabled");
      assert(disabled === "true", `slot aria-disabled=${disabled}`);
    });
    await screenshot("10-booked-slot-greyed");

    // 12 — booking persisted across reload
    step("Reload and assert session + booking persist");
    await page.goto(APP_URL, { waitUntil: "networkidle" });
    await page.getByText("Find your therapist").waitFor({ timeout: 30000 });
    await page.goto(`${APP_URL}/bookings`, { waitUntil: "networkidle" });
    await check("booking persists after reload", async () => {
      await page.locator('[data-testid^="booking-"]').first().waitFor({ timeout: 20000 });
    });

    // 13 — user-selected timezone changes the displayed time
    step("Client timezone is honoured (IST → user's zone)");
    await check("bookings default to the profile timezone (IST)", async () => {
      const text = await page.locator('[data-testid^="booking-"]').first().innerText();
      assert(text.includes("IST"), `expected IST label, got: ${text}`);
    });

    await page.goto(`${APP_URL}/profile`, { waitUntil: "networkidle" });
    await page.getByTestId("timezone-select").click();
    await page.getByTestId("timezone-America/New_York").click();
    await check("timezone selector shows the new zone", async () => {
      await page
        .getByTestId("timezone-select")
        .getByText(/US Eastern Time/)
        .waitFor({ timeout: 20000 });
    });
    await screenshot("13-timezone-selector");

    await page.goto(`${APP_URL}/bookings`, { waitUntil: "networkidle" });
    await check("booking time is redisplayed in the user's timezone (ET)", async () => {
      const row = page.locator('[data-testid^="booking-"]').first();
      await row.waitFor({ timeout: 20000 });
      const text = await row.innerText();
      assert(text.includes("ET"), `expected ET label, got: ${text}`);
      assert(!text.includes("IST"), `IST should be gone, got: ${text}`);
    });
    await screenshot("14-bookings-user-timezone");

    // 14 — profile + logout
    step("Profile → logout");
    await page.goto(`${APP_URL}/profile`, { waitUntil: "networkidle" });
    await check("profile shows account email", async () => {
      assert(await page.getByText(email).isVisible(), "email not shown on profile");
    });
    await page.getByTestId("logout-button").click();
    await page.waitForURL(/\/auth$/, { timeout: 30000 });
    await check("logout redirects to /auth", async () => {
      assert(/\/auth$/.test(page.url()), `got ${page.url()}`);
    });
    await check("session cleared (auth buttons shown again)", async () => {
      assert(await page.getByText("Continue with Google").isVisible(), "auth screen missing");
    });
    await screenshot("11-after-logout");

    // 14 — Google flow reaches verification
    step("Google flow reaches the verification endpoint");
    const googleRequest = page.waitForRequest(
      (request) => request.url().includes("/api/auth/google/"),
      { timeout: 30000 }
    );
    await page.getByTestId("google-button").click();
    await check("Google button calls /api/auth/google/", async () => {
      const request = await googleRequest;
      const body = request.postData() || "";
      assert(body.includes("id_token"), `no id_token in request body: ${body}`);
    });
    await screenshot("12-google-verification");
  } finally {
    await context.close();
    await browser.close();
  }

  const expectedNetworkNoise = (text) =>
    text.includes("Failed to load resource") && text.includes("401");
  const unexpectedConsoleErrors = consoleErrors.filter((text) => !expectedNetworkNoise(text));

  console.log("\n================ SUMMARY ================");
  const pad = Math.max(...results.map((r) => r.name.length), 10);
  for (const result of results) {
    console.log(
      `${result.name.padEnd(pad)} | ${result.status} | ${String(result.ms).padStart(5)}ms`
    );
  }
  console.log("========================================");
  console.log(`Steps: ${results.length}  Passed: ${results.filter((r) => r.status === "PASS").length}`);
  console.log(`Page errors: ${pageErrors.length}`);
  console.log(`Console errors (raw): ${consoleErrors.length}`);
  console.log(`Console errors (unexpected): ${unexpectedConsoleErrors.length}`);

  const report = {
    generatedAt: new Date().toISOString(),
    appUrl: APP_URL,
    steps: results,
    pageErrors,
    consoleErrors,
    unexpectedConsoleErrors,
  };
  writeFileSync(join(__dirname, "report.json"), JSON.stringify(report, null, 2));

  if (results.some((r) => r.status === "FAIL") || pageErrors.length || unexpectedConsoleErrors.length) {
    console.log("\nUnexpected console errors:");
    unexpectedConsoleErrors.forEach((text) => console.log(`  - ${text}`));
    pageErrors.forEach((text) => console.log(`  - PAGEERROR: ${text}`));
    process.exit(1);
  }
  console.log("\nE2E flow completed with zero unexpected console errors.");
}

main().catch((error) => {
  console.error("\nE2E run failed:", error);
  writeFileSync(
    join(__dirname, "report.json"),
    JSON.stringify({ generatedAt: new Date().toISOString(), steps: results, error: String(error), consoleErrors, pageErrors }, null, 2)
  );
  process.exit(1);
});