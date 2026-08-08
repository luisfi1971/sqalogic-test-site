import { describe, it, expect } from "vitest";
import {
  ACCEPT_ATTRIBUTE,
  MAX_DOCUMENT_BYTES,
  UPLOAD_ERRORS,
  extensionOf,
  formatBytes,
  validateDocument,
} from "@app/lib/upload";

describe("document upload rules", () => {
  it("U-40 accepts the documented types", () => {
    for (const name of ["passport.pdf", "id.jpg", "id.jpeg", "scan.png"]) {
      expect(validateDocument({ name, size: 1024 })).toEqual({ ok: true });
    }
  });

  it("U-40a is case-insensitive about the extension", () => {
    expect(validateDocument({ name: "PASSPORT.PDF", size: 1024 })).toEqual({ ok: true });
  });

  it("U-40b refuses a wrong type with a named message", () => {
    expect(validateDocument({ name: "passport.exe", size: 1024 })).toEqual({
      ok: false,
      error: UPLOAD_ERRORS.type,
    });
  });

  it("U-40c refuses a file with no extension at all", () => {
    expect(validateDocument({ name: "passport", size: 1024 })).toEqual({
      ok: false,
      error: UPLOAD_ERRORS.type,
    });
  });

  it("U-40d is not fooled by a double extension", () => {
    // "scan.pdf.exe" is an executable, whatever the middle of the name says.
    expect(validateDocument({ name: "scan.pdf.exe", size: 1024 })).toEqual({
      ok: false,
      error: UPLOAD_ERRORS.type,
    });
  });

  it("U-40e refuses anything over the size limit, and accepts exactly the limit", () => {
    expect(validateDocument({ name: "big.pdf", size: MAX_DOCUMENT_BYTES + 1 })).toEqual({
      ok: false,
      error: UPLOAD_ERRORS.size,
    });
    expect(validateDocument({ name: "edge.pdf", size: MAX_DOCUMENT_BYTES })).toEqual({ ok: true });
  });

  it("U-40f refuses an empty file", () => {
    expect(validateDocument({ name: "empty.pdf", size: 0 })).toEqual({
      ok: false,
      error: UPLOAD_ERRORS.empty,
    });
  });

  it("U-40g checks the type before the size, so the message names the real problem", () => {
    const verdict = validateDocument({ name: "huge.exe", size: MAX_DOCUMENT_BYTES * 10 });
    expect(verdict).toEqual({ ok: false, error: UPLOAD_ERRORS.type });
  });

  it("U-40h the accept attribute advertises the same types the rules enforce", () => {
    for (const ext of ["pdf", "jpg", "jpeg", "png"]) {
      expect(ACCEPT_ATTRIBUTE).toContain(`.${ext}`);
    }
  });
});

describe("extensionOf", () => {
  it("U-41 takes the last segment, lowercased", () => {
    expect(extensionOf("a.b.PNG")).toBe("png");
    expect(extensionOf("noext")).toBe("");
    expect(extensionOf(".hidden")).toBe("hidden");
  });
});

describe("formatBytes", () => {
  it("U-42 reads sensibly at each scale", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2.0 KB");
    expect(formatBytes(3 * 1024 * 1024)).toBe("3.0 MB");
  });
});
