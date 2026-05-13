import "@testing-library/jest-dom/vitest";
import { webcrypto } from "node:crypto";

if (!globalThis.crypto) {
  // @ts-expect-error polyfill for jsdom
  globalThis.crypto = webcrypto;
}
