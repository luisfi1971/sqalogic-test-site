import { browser } from "vibium";
import path from "node:path";
import { BASE_URL } from "./global-setup.mjs";

if (!process.env.VIBIUM_BIN_PATH) {
  const platformDir = `${process.platform}-${process.arch}`;
  const binName = process.platform === "win32" ? "vibium.exe" : "vibium";
  process.env.VIBIUM_BIN_PATH = path.join(
    process.cwd(),
    "node_modules",
    "@vibium",
    platformDir,
    "bin",
    binName
  );
}

export async function launch() {
  const bro = await browser.start({ headless: true });
  const vibe = await bro.page();
  return { bro, vibe };
}

export { BASE_URL };

export const DEMO = { email: "demo@sqalogic.ca", password: "demo123" };

/**
 * A second persona over the same flows. Her set is a different shape on
 * purpose — fewer trips, one already cancelled — so a suite that quietly
 * depends on the demo account's rows fails instead of passing by luck.
 */
export const MARIE = { email: "marie@sqalogic.ca", password: "demo123", name: "Marie Tremblay" };

export function uniqueEmail(tag: string) {
  return `test_e2e_${tag}_${Date.now()}@sqatest.local`;
}
