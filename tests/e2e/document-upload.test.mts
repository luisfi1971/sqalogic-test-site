import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import path from "node:path";
import os from "node:os";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { launch, BASE_URL, DEMO } from "./_helpers.mts";

// The target for the canon's `upload`. Vibium's equivalent of Playwright's
// setInputFiles is `element.setFiles(paths)` — which, like every driver-level
// upload, walks straight past the `accept` attribute. That is exactly why the
// page re-checks the rules in JS rather than trusting the file picker.

const FIXTURES = path.join(process.cwd(), "tests", "e2e", "fixtures");
const GOOD = path.join(FIXTURES, "passport.pdf");
const WRONG_TYPE = path.join(FIXTURES, "malware.exe");

let bro: Awaited<ReturnType<typeof launch>>["bro"];
let vibe: Awaited<ReturnType<typeof launch>>["vibe"];
let tmpDir: string;
let oversized: string;

async function clickByText(re: RegExp) {
  for (const b of await vibe.findAll("button")) {
    if (re.test(await b.text())) {
      await b.click();
      return;
    }
  }
  throw new Error(`no button matching ${re}`);
}

async function waitPath(p: string) {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if ((await vibe.url()).includes(p)) return;
    await vibe.wait(150);
  }
  throw new Error(`timeout waiting for ${p}, url=${await vibe.url()}`);
}

/** Reach the passenger step, which is where the document input lives. */
async function gotoBookingStep() {
  await vibe.go(`${BASE_URL}/search`);
  await clickByText(/search flights|find flights/i);
  await waitPath("/results");
  await clickByText(/^Select$/);
  await waitPath("/book");
  await vibe.find('[data-testid="book-document"]').waitUntil("visible");
}

beforeAll(async () => {
  tmpDir = await mkdtemp(path.join(os.tmpdir(), "sqa-upload-"));
  // Built here rather than committed: 3 MB of padding does not belong in git.
  oversized = path.join(tmpDir, "huge.pdf");
  await writeFile(oversized, Buffer.alloc(3 * 1024 * 1024, 0x41));

  ({ bro, vibe } = await launch());
  await vibe.go(`${BASE_URL}/login`);
  const emailEl = await vibe.find('input[type="email"]');
  await emailEl.click();
  await emailEl.type(DEMO.email);
  const pwEl = await vibe.find('input[type="password"]');
  await pwEl.click();
  await pwEl.type(DEMO.password);
  await vibe.find({ role: "button", text: "Sign in" }).click();
  await vibe.waitUntil.url(`${BASE_URL}/search`);
});

afterAll(async () => {
  await bro?.stop();
  await rm(tmpDir, { recursive: true, force: true });
});

beforeEach(async () => {
  await gotoBookingStep();
});

describe("E2E: passport document upload", () => {
  it("E-18 an accepted document shows its name on the page", async () => {
    await vibe.find('[data-testid="book-document"]').setFiles([GOOD]);

    await vibe.find('[data-testid="book-document-name"]').waitUntil("visible");
    const shown = (await vibe.evaluate(
      `document.querySelector('[data-testid="book-document-name"]').textContent`
    )) as string;
    expect(shown).toContain("passport.pdf");

    const errors = (await vibe.evaluate(
      `document.querySelectorAll('[data-testid="book-document-error"]').length`
    )) as number;
    expect(errors).toBe(0);
  });

  it("E-19 a wrong type is refused with a named message, not silently kept", async () => {
    await vibe.find('[data-testid="book-document"]').setFiles([WRONG_TYPE]);

    await vibe.find('[data-testid="book-document-error"]').waitUntil("visible");
    const message = (await vibe.evaluate(
      `document.querySelector('[data-testid="book-document-error"]').textContent`
    )) as string;
    expect(message).toBe("Only PDF, JPG or PNG documents are accepted");

    // Refused means refused: no filename is left showing, and the input is
    // cleared rather than holding a file the rules rejected.
    const kept = (await vibe.evaluate(`
      [document.querySelectorAll('[data-testid="book-document-name"]').length,
       document.querySelector('[data-testid="book-document"]').files.length]
    `)) as number[];
    expect(kept).toEqual([0, 0]);
  });

  it("E-20 an oversized document is refused by size", async () => {
    await vibe.find('[data-testid="book-document"]').setFiles([oversized]);

    await vibe.find('[data-testid="book-document-error"]').waitUntil("visible");
    const message = (await vibe.evaluate(
      `document.querySelector('[data-testid="book-document-error"]').textContent`
    )) as string;
    expect(message).toBe("Document must be 2 MB or smaller");
  });

  it("E-21 Remove takes the accepted document back off", async () => {
    await vibe.find('[data-testid="book-document"]').setFiles([GOOD]);
    await vibe.find('[data-testid="book-document-name"]').waitUntil("visible");

    await vibe.find('[data-testid="book-document-remove"]').click();
    const gone = (await vibe.evaluate(
      `document.querySelectorAll('[data-testid="book-document-name"]').length === 0`
    )) as boolean;
    expect(gone).toBe(true);
  });
});
