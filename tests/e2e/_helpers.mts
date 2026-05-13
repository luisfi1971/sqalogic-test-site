import { browser } from "vibium";
import { BASE_URL } from "./global-setup.mjs";

process.env.VIBIUM_BIN_PATH =
  process.env.VIBIUM_BIN_PATH ||
  `${process.cwd()}/node_modules/@vibium/win32-x64/bin/vibium.exe`;

export async function launch() {
  const bro = await browser.start({ headless: true });
  const vibe = await bro.page();
  return { bro, vibe };
}

export { BASE_URL };

export const DEMO = { email: "demo@sqalogic.ca", password: "demo123" };

export function uniqueEmail(tag: string) {
  return `test_e2e_${tag}_${Date.now()}@sqatest.local`;
}
