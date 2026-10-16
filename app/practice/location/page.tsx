"use client";

import { useState } from "react";

const CITIES: Record<string, string[]> = {
  Ontario: ["Toronto", "Ottawa", "Hamilton"],
  Quebec: ["Montreal", "Quebec City", "Gatineau"],
  "British Columbia": ["Vancouver", "Victoria"],
};

export default function LocationPage() {
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [saved, setSaved] = useState("");

  return (
    <div>
      <h1 className="text-2xl font-semibold">Home airport region</h1>
      <p className="mt-2 text-sm text-slate-600">Pick a province, then a city in it.</p>
      <form
        className="mt-4 max-w-sm space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          setSaved(`${city}, ${state}`);
        }}
      >
        <div>
          <label htmlFor="loc-state" className="label">State</label>
          <select
            id="loc-state"
            className="input"
            value={state}
            onChange={(e) => {
              setState(e.target.value);
              setCity("");
            }}
          >
            <option value="">Select state</option>
            {Object.keys(CITIES).map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="loc-city" className="label">City</label>
          <select
            id="loc-city"
            className="input"
            value={city}
            disabled={!state}
            onChange={(e) => setCity(e.target.value)}
          >
            <option value="">Select city</option>
            {(CITIES[state] ?? []).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <button className="btn-primary" type="submit" disabled={!city}>Save region</button>
      </form>
      {saved && <p className="mt-4 text-sm" role="status">Saved region: {saved}</p>}
    </div>
  );
}
