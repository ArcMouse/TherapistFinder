/**
 * MindEase marketing website + therapist portal end-to-end verification.
 *
 * Prereqs:
 *   - Django API on http://localhost:8000 (seeded, EMAIL_BACKEND=filebased)
 *   - Web dev server on http://localhost:5173
 *
 * Run: node web.mjs
 */
import { chromium } from "playwright-core";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");
const BACKEND = join(REPO_ROOT, "backend");
const EMAILS_DIR = join(BACKEND, "emails");
const SHOTS = join(__dirname, "screenshots");
mkdirSync(SHOTS, { recursive: true });

const WEB_URL = process.env.WEB_URL || "http://localhost:5173";
const API_URL = process.env.API_URL || "http://localhost:8000/api";
const CHROME =
  process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PYTHON = process.env.PYTHON || join(BACKEND, ".venv", "bin", "python");

const THERAPIST_EMAIL = "ananya.iyer@mindease.test";
const THERAPIST_PASSWORD = "TherapistPass123";

const results = [];
const consoleErrors = [];
const pageErrors = [];

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

async function api(path, { method = "GET", token, body } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: response.status, data };
}

function resetBookings() {
  execFileSync(
    PYTHON,
    [
      "manage.py",
      "shell",
      "-c",
      "from bookings.models import BookedSlot, Booking; BookedSlot.objects.all().delete(); Booking.objects.all().delete()",
    ],
    { cwd: BACKEND, env: { ...process.env, HF_HUB_OFFLINE: "1", TRANSFORMERS_OFFLINE: "1" } }
  );
}

function runReminderCommand() {
  return execFileSync(PYTHON, ["manage.py", "send_session_reminders"], {
    cwd: BACKEND,
    encoding: "utf8",
    env: {
      ...process.env,
      HF_HUB_OFFLINE: "1",
      TRANSFORMERS_OFFLINE: "1",
      EMAIL_BACKEND: "django.core.mail.backends.filebased.EmailBackend",
      EMAIL_FILE_PATH: EMAILS_DIR,
    },
  });
}

async function main() {
  // Fresh email capture directory
  rmSync(EMAILS_DIR, { recursive: true, force: true });
  mkdirSync(EMAILS_DIR, { recursive: true });

  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text());
  });
  page.on("pageerror", (e) => pageErrors.push(String(e)));

  const screenshot = async (name) => {
    const path = join(SHOTS, `web-${name}.png`);
    await page.screenshot({ path, fullPage: true });
    console.log(`     📸 ${path}`);
  };

  const clientEmail = `webclient_${Date.now()}@mindease.test`;
  const clientPassword = "ClientPass123";
  let bookingId = null;
  let zoomLink = null;

  try {
    // 1 — marketing landing page
    step("Landing page renders the sales pitch");
    await page.goto(WEB_URL, { waitUntil: "networkidle" });
    await check("hero headline visible", async () => {
      assert(
        await page.getByRole("heading", { name: /Therapy that fits/ }).isVisible(),
        "hero missing"
      );
    });
    await check("value proposition visible", async () => {
      assert(
        await page.getByText(/natural-language therapist search/i).first().isVisible(),
        "subcopy missing"
      );
    });
    await check("features section present", async () => {
      await page.locator("#features").scrollIntoViewIfNeeded();
      assert(await page.getByText("Search the way you talk").isVisible(), "feature missing");
    });
    await check("therapist section present", async () => {
      await page.locator("#therapists").scrollIntoViewIfNeeded();
      assert(
        await page.getByText("A practice dashboard that just works").isVisible(),
        "therapist section missing"
      );
    });
    await check("pricing section present", async () => {
      await page.locator("#pricing").scrollIntoViewIfNeeded();
      assert(await page.getByText("Pay per session. No subscriptions.").isVisible(), "pricing missing");
    });
    await check("therapist login link in nav", async () => {
      assert(await page.getByTestId("nav-therapist-login").isVisible(), "nav login missing");
    });
    await screenshot("01-landing");

    // 2 — set up data through the API
    step("Create a client booking ~25 minutes out via the API");
    const therapistLogin = await api("/auth/login/", {
      method: "POST",
      body: { email: THERAPIST_EMAIL, password: THERAPIST_PASSWORD },
    });
    await check("therapist can authenticate", async () => {
      assert(therapistLogin.status === 200, `login ${therapistLogin.status}`);
    });
    const therapistMe = await api("/therapist/me/", { token: therapistLogin.data.access });
    await check("therapist profile exposes credits", async () => {
      assert(therapistMe.status === 200, `me ${therapistMe.status}`);
      assert(typeof therapistMe.data.credits === "number", "credits missing");
    });

    const registration = await api("/auth/register/", {
      method: "POST",
      body: {
        email: clientEmail,
        password: clientPassword,
        password_confirm: clientPassword,
        name: "Web Client",
      },
    });
    await check("client account created", async () => {
      assert(registration.status === 201, `register ${registration.status}`);
    });
    const clientToken = registration.data.access;

    resetBookings();
    const start = new Date(Date.now() + 25 * 60 * 1000).toISOString();
    const booking = await api("/bookings/", {
      method: "POST",
      token: clientToken,
      body: { therapist: therapistMe.data.id, start_dt: start },
    });
    await check("booking created with a Zoom link", async () => {
      assert(booking.status === 201, `booking ${booking.status}`);
      assert(booking.data.zoom_link, "no zoom link");
    });
    bookingId = booking.data.id;
    zoomLink = booking.data.zoom_link;

    // 3 — reminder email 30 minutes before
    step("Zoom-link reminder email is sent 30 minutes before the session");
    const firstRun = runReminderCommand();
    await check("first run reports 1 reminder sent", async () => {
      assert(firstRun.includes("Reminders sent: 1"), firstRun.trim());
    });
    await check("an email file was written", async () => {
      const files = readdirSync(EMAILS_DIR).filter((f) => !f.startsWith("."));
      assert(files.length === 1, `expected 1 email, found ${files.length}`);
      const contents = readFileSync(join(EMAILS_DIR, files[0]), "utf8");
      assert(contents.includes(zoomLink), "email does not contain the Zoom link");
      assert(contents.includes("IST"), "email does not show IST time");
      assert(contents.includes(clientEmail), "email not addressed to the client");
    });
    const secondRun = runReminderCommand();
    await check("second run is idempotent (0 sent)", async () => {
      assert(secondRun.includes("Reminders sent: 0"), secondRun.trim());
    });

    // 4 — therapist portal login
    step("Therapist portal login");
    await page.getByTestId("nav-therapist-login").click();
    await page.waitForURL(/\/portal\/login$/, { timeout: 20000 });
    await check("login page rendered", async () => {
      await page.getByTestId("portal-login-card").waitFor({ timeout: 20000 });
    });
    await page.getByTestId("portal-email").fill("wrong@mindease.test");
    await page.getByTestId("portal-password").fill("WrongPass123");
    await page.getByTestId("portal-submit").click();
    await check("invalid credentials show an error", async () => {
      await page.getByTestId("portal-error").waitFor({ timeout: 15000 });
    });
    await screenshot("02-portal-login");

    await page.getByTestId("portal-email").fill(THERAPIST_EMAIL);
    await page.getByTestId("portal-password").fill(THERAPIST_PASSWORD);
    await page.getByTestId("portal-submit").click();
    await page.waitForURL(/\/portal$/, { timeout: 20000 });

    // 5 — dashboard
    step("Dashboard shows credits, sessions in IST and Zoom links");
    await page.getByTestId("portal-dashboard").waitFor({ timeout: 20000 });
    await check("IST badge shown", async () => {
      assert(await page.getByTestId("ist-badge").isVisible(), "IST badge missing");
    });
    await check("practice credits displayed", async () => {
      const credits = await page.getByTestId("stat-credits-value").innerText();
      assert(Number(credits) > 0, `credits = ${credits}`);
    });
    await check("the booked session appears", async () => {
      await page.getByTestId(`session-${bookingId}`).waitFor({ timeout: 20000 });
    });
    await check("session time is labelled IST", async () => {
      const text = await page.getByTestId(`session-${bookingId}`).innerText();
      assert(text.includes("IST"), `no IST in session card: ${text}`);
      assert(text.includes("Web Client"), "client name missing");
    });
    await check("Zoom link is present and correct", async () => {
      const link = page.getByTestId(`zoom-link-${bookingId}`);
      await link.waitFor({ timeout: 10000 });
      assert((await link.getAttribute("href")) === zoomLink, "zoom link mismatch");
    });
    await check("reminder shows as sent", async () => {
      const text = await page.getByTestId(`session-${bookingId}`).innerText();
      assert(text.includes("Email sent"), `reminder status missing: ${text}`);
    });
    await screenshot("03-portal-dashboard");

    // 6 — availability editor
    step("Therapist can manage weekly availability");
    const beforeCount = await page.getByTestId("availability-list").locator("> *").count();
    await page.getByTestId("weekday-select").selectOption("5"); // Saturday
    await page.getByTestId("start-time").fill("08:00");
    await page.getByTestId("end-time").fill("11:00");
    await page.getByTestId("add-availability").click();
    await check("new availability rule appears", async () => {
      await page
        .getByTestId("availability-list")
        .getByText("Saturday")
        .waitFor({ timeout: 15000 });
      const afterCount = await page.getByTestId("availability-list").locator("> *").count();
      assert(afterCount === beforeCount + 1, `expected ${beforeCount + 1}, got ${afterCount}`);
    });
    await check("invalid range is rejected client-side", async () => {
      await page.getByTestId("start-time").fill("18:00");
      await page.getByTestId("end-time").fill("09:00");
      await page.getByTestId("add-availability").click();
      await page.getByTestId("availability-error").waitFor({ timeout: 10000 });
    });
    await screenshot("04-portal-availability");

    // remove the rule we added
    const ruleIds = await page
      .getByTestId("availability-list")
      .locator("[data-testid^='availability-rule-']")
      .all();
    for (const rule of ruleIds) {
      const text = await rule.innerText();
      if (text.includes("Saturday")) {
        const testid = await rule.getAttribute("data-testid");
        const id = testid.replace("availability-rule-", "");
        await page.getByTestId(`remove-availability-${id}`).click();
        break;
      }
    }
    await check("availability rule removed", async () => {
      await page.waitForTimeout(500);
      const count = await page.getByTestId("availability-list").locator("> *").count();
      assert(count === beforeCount, `expected ${beforeCount}, got ${count}`);
    });

    // 7 — logout + non-therapist rejection
    step("Logout and reject a non-therapist account");
    await page.getByTestId("portal-logout").click();
    await page.waitForURL(/\/portal\/login$/, { timeout: 20000 });
    await page.getByTestId("portal-email").fill(clientEmail);
    await page.getByTestId("portal-password").fill(clientPassword);
    await page.getByTestId("portal-submit").click();
    await check("non-therapist sees a clear message", async () => {
      const error = page.getByTestId("portal-error");
      await error.waitFor({ timeout: 15000 });
      assert(
        (await error.innerText()).includes("not registered as a therapist"),
        await error.innerText()
      );
    });
    await screenshot("05-non-therapist");
  } finally {
    await context.close();
    await browser.close();
  }

  const expected = (text) =>
    text.includes("Failed to load resource") &&
    (text.includes("401") || text.includes("403") || text.includes("400"));
  const unexpected = consoleErrors.filter((t) => !expected(t));

  console.log("\n================ SUMMARY ================");
  const pad = Math.max(...results.map((r) => r.name.length), 10);
  for (const r of results) {
    console.log(`${r.name.padEnd(pad)} | ${r.status} | ${String(r.ms).padStart(5)}ms`);
  }
  console.log("========================================");
  console.log(`Steps: ${results.length}  Passed: ${results.filter((r) => r.status === "PASS").length}`);
  console.log(`Page errors: ${pageErrors.length}`);
  console.log(`Console errors (unexpected): ${unexpected.length}`);

  writeFileSync(
    join(__dirname, "web-report.json"),
    JSON.stringify(
      { generatedAt: new Date().toISOString(), webUrl: WEB_URL, steps: results, pageErrors, consoleErrors, unexpected },
      null,
      2
    )
  );

  if (results.some((r) => r.status === "FAIL") || pageErrors.length || unexpected.length) {
    unexpected.forEach((t) => console.log(`  - CONSOLE: ${t}`));
    pageErrors.forEach((t) => console.log(`  - PAGEERROR: ${t}`));
    process.exit(1);
  }
  console.log("\nWebsite + therapist portal E2E completed with zero unexpected console errors.");
}

main().catch((error) => {
  console.error("\nWeb E2E run failed:", error);
  writeFileSync(
    join(__dirname, "web-report.json"),
    JSON.stringify(
      { generatedAt: new Date().toISOString(), steps: results, error: String(error), consoleErrors, pageErrors },
      null,
      2
    )
  );
  process.exit(1);
});