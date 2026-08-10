"use client";

import { useState } from "react";

type Form = {
  firstName: string;
  lastName: string;
  passport: string;
  email: string;
  phone: string;
  seat: string;
  meal: string;
  insurance: boolean;
};

const EMPTY: Form = {
  firstName: "",
  lastName: "",
  passport: "",
  email: "",
  phone: "",
  seat: "Window",
  meal: "Standard",
  insurance: false,
};

const STEPS = ["Passenger", "Contact", "Preferences", "Review"];

export default function WizardPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<string[]>([]);
  const [reference, setReference] = useState<string | null>(null);

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const validate = (which: number): string[] => {
    const e: string[] = [];
    if (which === 0) {
      if (!form.firstName.trim()) e.push("First name is required");
      if (!form.lastName.trim()) e.push("Last name is required");
      if (!/^[A-Za-z0-9]{6,9}$/.test(form.passport.trim()))
        e.push("Passport number must be 6 to 9 letters or digits");
    }
    if (which === 1) {
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim()))
        e.push("Enter a valid email address");
      if (form.phone.trim() && !/^[+0-9 ()-]{7,}$/.test(form.phone.trim()))
        e.push("Phone number looks invalid");
    }
    return e;
  };

  const next = () => {
    const e = validate(step);
    setErrors(e);
    if (e.length === 0) setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  const back = () => {
    setErrors([]);
    setStep((s) => Math.max(0, s - 1));
  };

  const submit = () => {
    // Deterministic reference from the entered data — no randomness.
    const basis = `${form.firstName}${form.lastName}${form.passport}`.toUpperCase();
    let h = 0;
    for (let i = 0; i < basis.length; i++) h = (h * 31 + basis.charCodeAt(i)) >>> 0;
    setReference(`WZ-${(h % 900000) + 100000}`);
  };

  if (reference) {
    return (
      <div className="card max-w-xl">
        <h1 className="text-2xl font-semibold">Check-in complete</h1>
        <p className="mt-2 text-sm text-slate-600">
          {form.firstName} {form.lastName} is checked in.
        </p>
        <p className="mt-4 text-sm">
          Reference:{" "}
          <span className="font-mono font-semibold" data-testid="wizard-reference">
            {reference}
          </span>
        </p>
        <button
          type="button"
          className="btn-ghost mt-6"
          onClick={() => {
            setForm(EMPTY);
            setStep(0);
            setReference(null);
          }}
        >
          Start another check-in
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold">Online check-in</h1>

      <ol className="mt-4 flex flex-wrap gap-2 text-sm" data-testid="wizard-steps">
        {STEPS.map((label, i) => (
          <li
            key={label}
            aria-current={i === step ? "step" : undefined}
            className={`rounded-md border px-3 py-1 ${
              i === step
                ? "border-[color:var(--brand-accent)] bg-[color:var(--brand-accent)] text-white"
                : i < step
                  ? "border-slate-300 bg-white text-slate-700"
                  : "border-slate-200 bg-slate-50 text-slate-400"
            }`}
          >
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      <div className="card mt-4" data-testid="wizard-panel" data-step={step + 1}>
        <h2 className="text-lg font-semibold">
          Step {step + 1} of {STEPS.length}: {STEPS[step]}
        </h2>

        {errors.length > 0 && (
          <ul
            className="mt-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            role="alert"
            data-testid="wizard-errors"
          >
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}

        {step === 0 && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="wz-first" className="label">
                First name
              </label>
              <input
                id="wz-first"
                className="input"
                value={form.firstName}
                onChange={(e) => set("firstName", e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="wz-last" className="label">
                Last name
              </label>
              <input
                id="wz-last"
                className="input"
                value={form.lastName}
                onChange={(e) => set("lastName", e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="wz-passport" className="label">
                Passport number
              </label>
              <input
                id="wz-passport"
                className="input"
                placeholder="AB123456"
                value={form.passport}
                onChange={(e) => set("passport", e.target.value)}
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="wz-email" className="label">
                Email
              </label>
              <input
                id="wz-email"
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="wz-phone" className="label">
                Phone (optional)
              </label>
              <input
                id="wz-phone"
                className="input"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="wz-seat" className="label">
                Seat preference
              </label>
              <select
                id="wz-seat"
                className="input"
                value={form.seat}
                onChange={(e) => set("seat", e.target.value)}
              >
                <option>Window</option>
                <option>Aisle</option>
                <option>No preference</option>
              </select>
            </div>
            <div>
              <label htmlFor="wz-meal" className="label">
                Meal
              </label>
              <select
                id="wz-meal"
                className="input"
                value={form.meal}
                onChange={(e) => set("meal", e.target.value)}
              >
                <option>Standard</option>
                <option>Vegetarian</option>
                <option>Gluten free</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.insurance}
                  onChange={(e) => set("insurance", e.target.checked)}
                />
                Add trip insurance ($24)
              </label>
            </div>
          </div>
        )}

        {step === 3 && (
          <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2" data-testid="wizard-review">
            <Row label="Name" value={`${form.firstName} ${form.lastName}`.trim()} />
            <Row label="Passport" value={form.passport} />
            <Row label="Email" value={form.email} />
            <Row label="Phone" value={form.phone || "—"} />
            <Row label="Seat" value={form.seat} />
            <Row label="Meal" value={form.meal} />
            <Row label="Insurance" value={form.insurance ? "Yes" : "No"} />
          </dl>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            className="btn-ghost disabled:opacity-40"
            onClick={back}
            disabled={step === 0}
          >
            Back
          </button>
          {step < STEPS.length - 1 ? (
            <button type="button" className="btn-primary" onClick={next}>
              Continue
            </button>
          ) : (
            <button type="button" className="btn-primary" onClick={submit}>
              Confirm check-in
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-1">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium" data-review={label.toLowerCase()}>
        {value}
      </dd>
    </div>
  );
}
