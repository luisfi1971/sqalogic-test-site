import { describe, it, expect } from "vitest";
import WebSocket from "ws";
import { sb } from "../helpers/supabase";

// @ts-expect-error polyfill WebSocket for Node
if (!globalThis.WebSocket) globalThis.WebSocket = WebSocket;

describe("Integration: release_state + Realtime subscription", () => {
  // Skipped in Node: supabase-js Realtime timing out via ws polyfill.
  // Covered end-to-end in E2E (real browser, native WebSocket).
  it.skip("I-19 UPDATE on release_state fires postgres_changes event", async () => {
    const received: number[] = [];
    const channel = sb
      .channel("test-release-rt")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "release_state" },
        (payload) => {
          const next = (payload.new as { release?: number })?.release;
          if (typeof next === "number") received.push(next);
        }
      );

    await new Promise<void>((resolve, reject) => {
      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") resolve();
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") reject(new Error(status));
      });
    });

    const { data: before } = await sb
      .from("release_state")
      .select("release")
      .eq("id", 1)
      .single();
    const next = (before?.release ?? 1) + 1;
    await sb
      .from("release_state")
      .update({ release: next, updated_at: new Date().toISOString() })
      .eq("id", 1);

    await new Promise((r) => setTimeout(r, 2500));
    await sb.removeChannel(channel);

    expect(received).toContain(next);
  }, 15000);
});
