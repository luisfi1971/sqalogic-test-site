"use client";

import { useState } from "react";

const HOBBIES = ["Sports", "Reading", "Music", "Cooking", "Travel"];

export default function HobbiesPage() {
  const [picked, setPicked] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[] | null>(null);
  const toggle = (h: string) =>
    setPicked((p) => (p.includes(h) ? p.filter((x) => x !== h) : [...p, h]));

  return (
    <div>
      <h1 className="text-2xl font-semibold">Traveller interests</h1>
      <p className="mt-2 text-sm text-slate-600">
        Tell us what you enjoy; any number can apply.
      </p>
      <form
        className="mt-4 max-w-md"
        onSubmit={(e) => {
          e.preventDefault();
          setSaved(picked);
        }}
      >
        <div className="label" id="hobbies-label">Hobbies</div>
        <div role="group" aria-labelledby="hobbies-label" className="space-y-1">
          {HOBBIES.map((h) => (
            <div key={h}>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={picked.includes(h)} onChange={() => toggle(h)} />
                {h}
              </label>
            </div>
          ))}
        </div>
        <button className="btn-primary mt-4" type="submit">Save interests</button>
      </form>
      {saved && (
        <p className="mt-4 text-sm" role="status">
          Saved interests: {saved.length ? saved.join(", ") : "none"}
        </p>
      )}
    </div>
  );
}
