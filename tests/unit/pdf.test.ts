import { describe, it, expect } from "vitest";
import { buildETicketPdf, eTicketFilename } from "@app/lib/pdf";

const REF = "BK-MSJ9U4AH";
const FIELDS = [
  { label: "Passenger", value: "Demo User" },
  { label: "Route", value: "YUL - Montreal -> JFK - New York" },
];

function asText(bytes: Uint8Array) {
  return Array.from(bytes, (b) => String.fromCharCode(b)).join("");
}

describe("e-ticket filename", () => {
  it("U-30 carries the booking reference, which is what closes capture -> verify", () => {
    expect(eTicketFilename(REF)).toBe("eticket-BK-MSJ9U4AH.pdf");
    expect(eTicketFilename(REF)).toContain(REF);
  });
});

describe("e-ticket PDF", () => {
  it("U-31 is a real PDF, not a text file with a .pdf name", () => {
    const text = asText(buildETicketPdf(REF, FIELDS));
    expect(text.startsWith("%PDF-1.4")).toBe(true);
    expect(text.trimEnd().endsWith("%%EOF")).toBe(true);
  });

  it("U-31a startxref points at the actual xref table", () => {
    // The offset is the part most likely to be silently wrong, and a wrong one
    // makes readers reject the file — so assert it rather than trust it.
    const text = asText(buildETicketPdf(REF, FIELDS));
    const declared = Number(text.match(/startxref\n(\d+)/)![1]);
    expect(text.slice(declared, declared + 4)).toBe("xref");
  });

  it("U-31b every object offset in the xref lands on that object's header", () => {
    const text = asText(buildETicketPdf(REF, FIELDS));
    const entries = [...text.matchAll(/^(\d{10}) 00000 n $/gm)].map((m) => Number(m[1]));
    expect(entries).toHaveLength(5);
    entries.forEach((offset, i) => {
      expect(text.slice(offset).startsWith(`${i + 1} 0 obj`)).toBe(true);
    });
  });

  it("U-31c the declared stream length matches the content stream", () => {
    const text = asText(buildETicketPdf(REF, FIELDS));
    const declared = Number(text.match(/<< \/Length (\d+) >>/)![1]);
    const stream = text.slice(text.indexOf("stream\n") + "stream\n".length, text.indexOf("endstream"));
    expect(stream).toHaveLength(declared);
  });

  it("U-31d the reference and the booking fields are in the page text", () => {
    const text = asText(buildETicketPdf(REF, FIELDS));
    expect(text).toContain(REF);
    expect(text).toContain("Demo User");
    expect(text).toContain("YUL - Montreal -> JFK - New York");
  });

  it("U-31e parentheses in a value cannot break out of the PDF string", () => {
    const text = asText(buildETicketPdf(REF, [{ label: "Note", value: "a (tricky) value" }]));
    expect(text).toContain("a \\(tricky\\) value");
    // The declared length must still match after escaping, or the file is junk.
    const declared = Number(text.match(/<< \/Length (\d+) >>/)![1]);
    const stream = text.slice(text.indexOf("stream\n") + "stream\n".length, text.indexOf("endstream"));
    expect(stream).toHaveLength(declared);
  });

  it("U-31f non-ASCII is folded, keeping one byte per character", () => {
    const bytes = buildETicketPdf(REF, [{ label: "Passenger", value: "Renée Côté" }]);
    const text = asText(bytes);
    expect(bytes).toHaveLength(text.length);
    expect(text).toContain("Ren?e C?t?");
    const declared = Number(text.match(/startxref\n(\d+)/)![1]);
    expect(text.slice(declared, declared + 4)).toBe("xref");
  });
});
