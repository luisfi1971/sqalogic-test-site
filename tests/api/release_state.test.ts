import { describe, it, expect } from "vitest";
import { sb } from "../helpers/supabase";

describe("API: release_state table (Supabase real)", () => {
  it("A-14 single-row check constraint blocks id=2", async () => {
    const { error } = await sb.from("release_state").insert({ id: 2, release: 99 });
    expect(error).not.toBeNull();
    expect(error?.code).toMatch(/23514|23505/);
  });

  it("A-15 update release is allowed and reflected on read", async () => {
    const { data: before } = await sb
      .from("release_state")
      .select("release")
      .eq("id", 1)
      .single();
    const next = (before?.release ?? 1) + 1;
    const { error } = await sb
      .from("release_state")
      .update({ release: next, updated_at: new Date().toISOString() })
      .eq("id", 1);
    expect(error).toBeNull();
    const { data: after } = await sb
      .from("release_state")
      .select("release")
      .eq("id", 1)
      .single();
    expect(after?.release).toBe(next);
  });
});
