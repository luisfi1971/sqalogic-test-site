/*
 * The server half of /practice/after-the-press: answers after a fixed delay,
 * so the page's label appears only when a REQUEST lands — the shape a learn
 * must wait for (SQALOGIC TestHub, 2026-10-20, corpus site 05 /ajax).
 */
export const dynamic = "force-dynamic";

export async function GET() {
  await new Promise((r) => setTimeout(r, 2000));
  return Response.json({ message: "Report ready: 3 files exported." });
}
