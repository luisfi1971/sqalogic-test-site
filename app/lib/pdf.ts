/**
 * A hand-rolled, single-page PDF. No dependency is pulled in for this: the
 * e-ticket exists to give `download.verify` something real to fetch, and a real
 * file that a PDF reader will open is the whole requirement.
 *
 * The bytes are plain ASCII, so string length equals byte length and the xref
 * offsets can be computed as we build.
 */

export type ETicketField = { label: string; value: string };

/** PDF string literals escape backslash and both parentheses. */
function escapePdfText(s: string): string {
  return s
    // Non-ASCII would break the 1-char-1-byte assumption the xref relies on.
    .replace(/[^\x20-\x7E]/g, "?")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

export function eTicketFilename(reference: string): string {
  // The reference is in the filename on purpose: it closes the
  // capture -> verify chain, letting a suite prove the file it downloaded
  // belongs to the booking it just made.
  return `eticket-${reference}.pdf`;
}

export function buildETicketPdf(reference: string, fields: ETicketField[]): Uint8Array {
  const lines = [
    "SQALOGIC AIR",
    "ELECTRONIC TICKET",
    "",
    `Booking reference: ${reference}`,
    "",
    ...fields.map((f) => `${f.label}: ${f.value}`),
    "",
    "This document is a QA fixture and is not valid for travel.",
  ];

  const content =
    "BT\n/F1 12 Tf\n60 780 Td\n18 TL\n" +
    lines.map((l) => `(${escapePdfText(l)}) Tj T*\n`).join("") +
    "ET\n";

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] " +
      "/Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${content.length} >>\nstream\n${content}endstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  const pad = (n: number, width: number) => String(n).padStart(width, "0");
  // Every xref entry is exactly 20 bytes, trailing space included.
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (const off of offsets) pdf += `${pad(off, 10)} ${pad(0, 5)} n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF\n`;

  const bytes = new Uint8Array(pdf.length);
  for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 0xff;
  return bytes;
}

/** Hand a file to the browser's download machinery. */
export function triggerDownload(filename: string, bytes: Uint8Array, type = "application/pdf") {
  const blob = new Blob([bytes as unknown as BlobPart], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give the browser a moment to start the transfer before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
