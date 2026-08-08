import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { readFile } from "node:fs/promises";
import { launch, BASE_URL, DEMO } from "./_helpers.mts";

// The target for the canon's `download.verify`. The whole point of putting the
// booking reference in the filename is that it closes the capture -> verify
// chain: read the reference off the row, download, and prove the file belongs
// to that booking rather than to whichever row happened to be first.

const TABLE = '[data-testid="trips-table"]';

let bro: Awaited<ReturnType<typeof launch>>["bro"];
let vibe: Awaited<ReturnType<typeof launch>>["vibe"];

async function rowIndex(reference: string): Promise<number> {
  return (await vibe.evaluate(`
    Array.from(document.querySelectorAll('${TABLE} tbody tr'))
      .findIndex(r => r.querySelector('td[data-col="reference"]').textContent.trim() === '${reference}') + 1
  `)) as number;
}

beforeAll(async () => {
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
});

beforeEach(async () => {
  await vibe.go(`${BASE_URL}/my-trips`);
  await vibe.find(TABLE).waitUntil("visible");
});

describe("E2E: e-ticket download", () => {
  it("E-15 the downloaded filename carries the reference of the row it came from", async () => {
    const reference = "BK-DEMO2";
    const i = await rowIndex(reference);
    expect(i).toBeGreaterThan(0);

    const download = await vibe.capture.download(async () => {
      await vibe.find(`${TABLE} tbody tr:nth-child(${i}) [data-testid="download-eticket"]`).click();
    });

    expect(download.suggestedFilename()).toBe(`eticket-${reference}.pdf`);
  });

  it("E-16 the file on disk is a real PDF containing that booking", async () => {
    const reference = "BK-DEMO3";
    const i = await rowIndex(reference);

    const download = await vibe.capture.download(async () => {
      await vibe.find(`${TABLE} tbody tr:nth-child(${i}) [data-testid="download-eticket"]`).click();
    });

    const path = await download.path();
    expect(path).toBeTruthy();

    const bytes = await readFile(path!);
    // A file named .pdf that no reader can open would pass a filename-only
    // assertion, so check the bytes.
    expect(bytes.subarray(0, 8).toString("latin1")).toBe("%PDF-1.4");
    expect(bytes.toString("latin1")).toContain(reference);
    expect(bytes.toString("latin1").trimEnd().endsWith("%%EOF")).toBe(true);
  });

  it("E-17 each row hands back its own ticket, not the first one on the page", async () => {
    const wanted = "BK-DEMO1";
    const i = await rowIndex(wanted);

    const download = await vibe.capture.download(async () => {
      await vibe.find(`${TABLE} tbody tr:nth-child(${i}) [data-testid="download-eticket"]`).click();
    });

    const text = (await readFile((await download.path())!)).toString("latin1");
    expect(download.suggestedFilename()).toBe(`eticket-${wanted}.pdf`);
    expect(text).toContain(wanted);
    expect(text).not.toContain("BK-DEMO2");
  });
});
