/**
 * Document upload rules for the booking step.
 *
 * An upload that accepts everything in silence exercises less than one that
 * refuses with a named message, so the validation lives here as a pure
 * function — testable without a browser, and the same rules the UI shows.
 */

export const MAX_DOCUMENT_BYTES = 2 * 1024 * 1024; // 2 MB
export const ACCEPTED_EXTENSIONS = ["pdf", "jpg", "jpeg", "png"] as const;
export const ACCEPT_ATTRIBUTE = ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png";

export const UPLOAD_ERRORS = {
  type: "Only PDF, JPG or PNG documents are accepted",
  size: "Document must be 2 MB or smaller",
  empty: "That file is empty",
} as const;

export type UploadCandidate = { name: string; size: number };
export type UploadVerdict = { ok: true } | { ok: false; error: string };

export function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot + 1).toLowerCase();
}

/**
 * The `accept` attribute is a filter in the file picker, not a guarantee — a
 * driver setting the input's files directly bypasses it entirely, which is
 * precisely what an automation engine does. So the rules are re-checked here.
 */
export function validateDocument(file: UploadCandidate): UploadVerdict {
  if (!ACCEPTED_EXTENSIONS.includes(extensionOf(file.name) as (typeof ACCEPTED_EXTENSIONS)[number])) {
    return { ok: false, error: UPLOAD_ERRORS.type };
  }
  if (file.size <= 0) return { ok: false, error: UPLOAD_ERRORS.empty };
  if (file.size > MAX_DOCUMENT_BYTES) return { ok: false, error: UPLOAD_ERRORS.size };
  return { ok: true };
}

export function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
