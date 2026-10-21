"use client";

import { useRef, useState } from "react";

/*
 * AFTER THE PRESS — a stable test-bed page for the state a press reaches
 * (SQALOGIC TestHub, 2026-10-20; the classes corpus sites 04–06 exposed).
 * Each section is one shape a learn must record whole:
 *
 *   - a label that appears only when a REQUEST lands (2 s server delay) and one
 *     that appears only when a TIMER fires (2 s client delay) — the learn waits
 *     for the work the press started, never a fixed sleep;
 *   - a status region filled by the press: a flash with role="alert" holding
 *     its message and a close control, and a result line that is EMPTY until a
 *     press fills it — what they say is a reading, not their name;
 *   - three different actions in one list — each opens a different native
 *     dialog (alert / confirm / prompt) — distinct controls, never one fold;
 *   - a live progress value — the bar is identified by what it is; "40%" is a
 *     reading;
 *   - a notice whose Close is a <p> the page draws as pressable (pointer
 *     cursor, click handler) with no role.
 *
 * Nothing is stored; a reload starts over.
 */
export default function AfterThePressPage() {
  const [fetched, setFetched] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);
  const [timed, setTimed] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const [result, setResult] = useState("");
  const [progress, setProgress] = useState(0);
  const [notice, setNotice] = useState(true);
  const ticking = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = async () => {
    setFetching(true);
    const res = await fetch("/practice/after-the-press/slow", { cache: "no-store" });
    const body = (await res.json()) as { message: string };
    setFetched(body.message);
    setFetching(false);
  };

  const calculate = () => {
    setTimeout(() => setTimed("Totals calculated: 12 items, $340."), 2000);
  };

  const start = () => {
    if (ticking.current) return;
    ticking.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          if (ticking.current) clearInterval(ticking.current);
          ticking.current = null;
          return 100;
        }
        return p + 20;
      });
    }, 500);
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold">After the press</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        What a press leads to: answers that arrive later, messages that fill in, dialogs the
        browser draws, and a value that moves.
      </p>

      <section className="card mt-6">
        <h2 className="text-base font-semibold">Answers that arrive later</h2>
        <div className="mt-3 flex gap-2">
          <button type="button" className="btn-primary" onClick={load}>
            Export report
          </button>
          <button type="button" className="btn-ghost" onClick={calculate}>
            Calculate totals
          </button>
        </div>
        <div id="export-output" className="mt-3 text-sm">
          {fetching && <span className="text-slate-500">Working…</span>}
          {fetched && <p className="text-emerald-700">{fetched}</p>}
        </div>
        <div id="totals-output" className="mt-1 text-sm">
          {timed && <p className="text-emerald-700">{timed}</p>}
        </div>
      </section>

      <section className="card mt-4">
        <h2 className="text-base font-semibold">Messages that fill in</h2>
        <button type="button" className="btn-primary mt-3" onClick={() => setFlash(true)}>
          Save settings
        </button>
        {flash && (
          <div id="flash" role="alert" className="mt-3 rounded bg-emerald-50 p-3 text-sm text-emerald-800">
            Your settings were saved.{" "}
            <a href="#" onClick={(e) => { e.preventDefault(); setFlash(false); }} className="ml-2">
              ×
            </a>
          </div>
        )}
      </section>

      <section className="card mt-4">
        <h2 className="text-base font-semibold">Dialogs the browser draws</h2>
        <ul className="mt-3 space-y-2">
          <li>
            <button type="button" className="btn-ghost" onClick={() => { window.alert("Heads up: maintenance tonight."); setResult("You saw the notice"); }}>
              Show notice
            </button>
          </li>
          <li>
            <button type="button" className="btn-ghost" onClick={() => setResult(window.confirm("Archive this project?") ? "You chose: Archive" : "You chose: Keep")}>
              Archive project
            </button>
          </li>
          <li>
            <button type="button" className="btn-ghost" onClick={() => { const n = window.prompt("Name the copy"); setResult(n === null ? "You cancelled" : `Copy named: ${n}`); }}>
              Duplicate project
            </button>
          </li>
        </ul>
        <h3 className="mt-3 text-sm font-semibold">Outcome:</h3>
        <p id="dialog-outcome" className="text-sm">{result}</p>
      </section>

      <section className="card mt-4">
        <h2 className="text-base font-semibold">A value that moves</h2>
        <button type="button" className="btn-primary mt-3" onClick={start}>
          Start upload
        </button>
        <div className="mt-3 h-4 w-full rounded bg-slate-100">
          <div
            id="upload-progress"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-4 rounded bg-sky-500 text-center text-xs text-white"
            style={{ width: `${progress}%` }}
          >
            {progress}%
          </div>
        </div>
      </section>

      {notice && (
        <section className="card mt-4" id="cookie-notice">
          <h2 className="text-base font-semibold">A notice</h2>
          <p className="mt-2 text-sm">This page remembers nothing between visits.</p>
          <div className="mt-2 text-right">
            <p className="inline cursor-pointer text-sm text-sky-700" onClick={() => setNotice(false)}>
              Dismiss
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
