"use client";

import { useState } from "react";
import { INVOICES, RECEIPTS, REMINDERS } from "../data";

/*
 * ACCOUNTS RECEIVABLE — the archetype for a ROW ACTION THAT READS THE SAME ON
 * EVERY ROW.
 *
 * Why this page exists, in one sentence: every other repeated element on this
 * site tells its rows apart by what they SHOW, and most business software does
 * not.
 *
 * A seat says "1A", a flight says "04:18 → 06:36", a deal says "Deal #7" — so
 * an automation tool can address one of them with a literal a person reads off
 * the page. An invoice register says "View" twelve times. The visible text of
 * the control is identical on every row by design, because a button that read
 * "View INV-2044" would be a worse product. What tells the rows apart is the
 * mark the developer put on the control, and nothing else.
 *
 * Three lists, and the third is as important as the first two:
 *
 *   1. Outstanding invoices  — <table>, 12 rows, action marked `data-testid`
 *   2. Payment reminders     — <ul>, 11 rows, action marked `data-invoice-id`
 *   3. Unallocated receipts  — <div> stack, 10 rows, action NOT MARKED AT ALL
 *
 * (2) is the realistic one. `data-testid` exists only where somebody wrote
 * tests first; every other application keys its rows with whatever attribute
 * its framework or its developers chose — `data-id`, `data-row-id`, `data-key`,
 * `data-invoice-id`. A tool that can only read `data-testid` can address the
 * rows of a test-friendly application and no others.
 *
 * (3) is the honest negative. An unallocated receipt has no invoice to key it
 * by — that is the entire reason it is sitting in this list — so there is
 * genuinely nothing to mark the row's control with, and no amount of looking
 * harder will find one. A tool asked to offer a choice here must offer
 * nothing rather than invent one. The rows still differ in what they SHOW
 * (payer, amount, date), so those are addressable; the ACTION is not.
 */

type Logged = { what: string; which: string } | null;

export default function InvoicesPage() {
  const [last, setLast] = useState<Logged>(null);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Accounts receivable</h1>
      <p className="mt-2 max-w-3xl text-sm text-slate-600">
        Three lists whose row actions read the same on every row — the ordinary
        shape of business software, and the one shape the rest of this site does not
        have. What separates one row&apos;s button from another&apos;s is the mark on
        it, where there is one.
      </p>

      <p
        className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
        data-testid="ar-last-action"
        aria-live="polite"
      >
        {last ? (
          <>
            Last action: <strong>{last.what}</strong> on <strong>{last.which}</strong>
          </>
        ) : (
          <>No action taken yet</>
        )}
      </p>

      {/* ---------------------------------------------------------------- *
        * 1. OUTSTANDING INVOICES — the action is marked with `data-testid`.
        *    The conventional mark, and the one an automation tool is most
        *    likely to already read.
        * ---------------------------------------------------------------- */}
      <section className="mt-8" aria-labelledby="ar-outstanding">
        <h2 id="ar-outstanding" className="text-lg font-semibold">
          Outstanding invoices
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          {INVOICES.length} invoices. Every action reads <strong>View</strong>; the
          control carries <code className="rounded bg-slate-100 px-1 text-xs">data-testid</code>.
        </p>

        <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full text-sm" data-testid="invoice-register">
            <caption className="sr-only">Outstanding invoices</caption>
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Invoice
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Customer
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Issued
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Due
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  State
                </th>
                <th scope="col" className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Amount
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {INVOICES.map((inv) => (
                <tr key={inv.ref} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2 font-mono text-xs">{inv.ref}</td>
                  <td className="px-3 py-2">{inv.customer}</td>
                  <td className="px-3 py-2">{inv.issued}</td>
                  <td className="px-3 py-2">{inv.due}</td>
                  <td className="px-3 py-2">{inv.state}</td>
                  <td className="px-3 py-2 text-right font-semibold">${inv.amount}</td>
                  <td className="px-3 py-2">
                    {/*
                      The action reads "View" on all twelve rows, on purpose.
                      Its accessible name is therefore the same on all twelve,
                      and the ONLY thing that tells them apart is the testid.
                    */}
                    <button
                      type="button"
                      className="btn-ghost px-3 py-1 text-xs"
                      data-testid={`invoice-view-${inv.ref}`}
                      onClick={() => setLast({ what: "View", which: inv.ref })}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---------------------------------------------------------------- *
        * 2. PAYMENT REMINDERS — the action is marked with `data-invoice-id`,
        *    NOT with `data-testid`. This is the realistic case: a testid is
        *    written by whoever writes the tests, and most applications have
        *    none. The key is on the control because that is where a delegated
        *    click handler reads it from.
        * ---------------------------------------------------------------- */}
      <section className="mt-10" aria-labelledby="ar-reminders">
        <h2 id="ar-reminders" className="text-lg font-semibold">
          Payment reminders due
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          {REMINDERS.length} overdue accounts. Every action reads{" "}
          <strong>Remind</strong>; the control carries{" "}
          <code className="rounded bg-slate-100 px-1 text-xs">data-invoice-id</code> and
          no <code className="rounded bg-slate-100 px-1 text-xs">data-testid</code>.
        </p>

        <ul className="mt-3 space-y-2" data-testid="reminder-list">
          {REMINDERS.map((r) => (
            <li
              key={r.ref}
              className="card flex flex-wrap items-center justify-between gap-4 py-3"
            >
              <div>
                <div className="font-semibold">{r.customer}</div>
                <div className="font-mono text-xs text-slate-500">{r.ref}</div>
              </div>
              <div className="text-sm text-slate-600">{r.daysLate} days late</div>
              <div className="text-lg font-bold">${r.amount}</div>
              <button
                type="button"
                className="btn-ghost px-3 py-1 text-xs"
                data-invoice-id={r.ref}
                onClick={() => setLast({ what: "Remind", which: r.ref })}
              >
                Remind
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------------------------------------------------------------- *
        * 3. UNALLOCATED RECEIPTS — the honest negative.
        *
        *    A payment arrived with no invoice number on it. That is what
        *    "unallocated" means, and it is why the row has nothing to be keyed
        *    by: the application does not know which invoice this is yet, so it
        *    cannot mark the row with one. Nothing here is withheld to make a
        *    test harder — the absence is the domain.
        *
        *    A container that declares no list semantics as well, so the only
        *    evidence that these ten are one repeated thing is that there are
        *    ten of them and they are alike.
        * ---------------------------------------------------------------- */}
      <section className="mt-10" aria-labelledby="ar-receipts">
        <h2 id="ar-receipts" className="text-lg font-semibold">
          Unallocated receipts
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          {RECEIPTS.length} payments received with no invoice reference. Every action
          reads <strong>Match</strong> and carries no mark of any kind — there is no
          invoice to key it by yet.
        </p>

        <div className="mt-3 space-y-2" data-testid="unallocated-receipts">
          {RECEIPTS.map((rc) => (
            <div
              key={`${rc.received}-${rc.payer}`}
              className="card flex flex-wrap items-center justify-between gap-4 py-3"
            >
              <div>
                <div className="font-semibold">{rc.payer}</div>
                <div className="text-xs text-slate-500">
                  {rc.received} · {rc.method}
                </div>
              </div>
              <div className="text-lg font-bold">${rc.amount}</div>
              <button
                type="button"
                className="btn-ghost px-3 py-1 text-xs"
                onClick={() => setLast({ what: "Match", which: `${rc.payer} $${rc.amount}` })}
              >
                Match
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
