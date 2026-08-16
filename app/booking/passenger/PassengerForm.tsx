"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRelease, useWizard } from "../../providers";
import StepsNav, { NoDraft } from "../StepsNav";
import Tooltip from "../../components/Tooltip";
import { variantIds, type Variant } from "../../lib/testControls";

const TITLES = ["Mr", "Ms", "Mx", "Dr"];
const NATIONALITIES = [
  "Canada",
  "United States",
  "Brazil",
  "France",
  "United Kingdom",
  "Germany",
  "Spain",
  "Portugal",
  "Mexico",
  "Japan",
];

type Errors = Partial<Record<string, string>>;

export default function PassengerForm({ variant = "none" }: { variant?: Variant }) {
  const { wizard, setWizard } = useWizard();
  const { dynId } = useRelease();
  const router = useRouter();

  const [title, setTitle] = useState(wizard?.title || "");
  const [firstName, setFirstName] = useState(wizard?.firstName || "");
  const [lastName, setLastName] = useState(wizard?.lastName || "");
  const [birthDate, setBirthDate] = useState(wizard?.birthDate || "");
  const [passport, setPassport] = useState(wizard?.passport || "");
  const [nationality, setNationality] = useState(wizard?.nationality || "");
  const [email, setEmail] = useState(wizard?.email || "");
  const [phone, setPhone] = useState(wizard?.phone || "");
  const [frequentFlyer, setFrequentFlyer] = useState(wizard?.frequentFlyer || "");
  const [emergencyName, setEmergencyName] = useState(wizard?.emergencyName || "");
  const [emergencyPhone, setEmergencyPhone] = useState(wizard?.emergencyPhone || "");
  const [errors, setErrors] = useState<Errors>({});

  // --- per-request variant application (same pattern as SearchForm) ---------
  const { tid, rid } = variantIds(variant);
  const heading = variant === "text-change" ? "Traveller information" : "Passenger details";
  const ctaLabel = variant === "text-change" ? "Next: choose seats" : "Continue to seat selection";
  const fakeButton = variant === "type-change";

  if (!wizard?.flightId) return <NoDraft />;

  const validate = (): Errors => {
    const e: Errors = {};
    if (!title) e.title = "Title is required";
    if (!firstName.trim()) e.firstName = "First name is required";
    if (!lastName.trim()) e.lastName = "Last name is required";
    if (!birthDate) e.birthDate = "Date of birth is required";
    else if (new Date(birthDate).getTime() >= Date.now())
      e.birthDate = "Date of birth must be in the past";
    if (!/^[A-Za-z0-9]{6,9}$/.test(passport.trim()))
      e.passport = "Passport number must be 6 to 9 letters or digits";
    if (!nationality) e.nationality = "Nationality is required";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()))
      e.email = "Enter a valid email address";
    if (!/^[+0-9 ()-]{7,}$/.test(phone.trim())) e.phone = "Enter a valid phone number";
    if (frequentFlyer.trim() && !/^[A-Za-z]{2}[0-9]{6,10}$/.test(frequentFlyer.trim()))
      e.frequentFlyer = "Frequent flyer number looks invalid (e.g. SQ123456)";
    if (!emergencyName.trim()) e.emergencyName = "Emergency contact name is required";
    if (!/^[+0-9 ()-]{7,}$/.test(emergencyPhone.trim()))
      e.emergencyPhone = "Enter a valid emergency contact phone";
    return e;
  };

  const onSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setWizard({
      ...wizard,
      title,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      birthDate,
      passport: passport.trim(),
      nationality,
      email: email.trim(),
      phone: phone.trim(),
      frequentFlyer: frequentFlyer.trim(),
      emergencyName: emergencyName.trim(),
      emergencyPhone: emergencyPhone.trim(),
    });
    router.push("/booking/seats");
  };

  const fieldError = (key: string, testBase: string) =>
    errors[key] ? (
      <p className="mt-1 text-xs text-red-600" data-testid={tid(testBase)}>
        {errors[key]}
      </p>
    ) : null;

  const idFirst = rid(dynId("pax_first_name"));
  const idLast = rid(dynId("pax_last_name"));
  const idTitle = rid(dynId("pax_title"));
  const idBirth = rid(dynId("pax_birth_date"));
  const idPassport = rid(dynId("pax_passport"));
  const idNationality = rid(dynId("pax_nationality"));
  const idEmail = rid(dynId("pax_email"));
  const idPhone = rid(dynId("pax_phone"));
  const idFf = rid(dynId("pax_frequent_flyer"));
  const idEmName = rid(dynId("pax_emergency_name"));
  const idEmPhone = rid(dynId("pax_emergency_phone"));

  const firstNameField = (
    <div>
      <label htmlFor={idFirst} className="label">
        First name
      </label>
      <input
        id={idFirst}
        className="input"
        data-testid={tid("passenger-first-name")}
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
      />
      {fieldError("firstName", "passenger-error-first-name")}
    </div>
  );

  const lastNameField = (
    <div>
      <label htmlFor={idLast} className="label">
        Last name
      </label>
      <input
        id={idLast}
        className="input"
        data-testid={tid("passenger-last-name")}
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
      />
      {fieldError("lastName", "passenger-error-last-name")}
    </div>
  );

  // `sibling-reorder` swaps First and Last name in DOM order (and on screen).
  const nameFields =
    variant === "sibling-reorder" ? (
      <>
        {lastNameField}
        {firstNameField}
      </>
    ) : (
      <>
        {firstNameField}
        {lastNameField}
      </>
    );

  const passportFieldInner = (
    <div>
      <label htmlFor={idPassport} className="label">
        Passport number{" "}
        <Tooltip content="6 to 9 letters or digits, e.g. AB123456">
          <span className="ml-1 text-xs text-slate-400 cursor-help">ⓘ</span>
        </Tooltip>
      </label>
      <input
        id={idPassport}
        className="input"
        placeholder="AB123456"
        data-testid={tid("passenger-passport")}
        value={passport}
        onChange={(e) => setPassport(e.target.value)}
      />
      {fieldError("passport", "passenger-error-passport")}
    </div>
  );

  // `moved-container` keeps the passport field, its label and accessible name
  // identical but buries it under two extra ancestors.
  const passportField =
    variant === "moved-container" ? (
      <section data-section="identity">
        <fieldset className="m-0 border-0 p-0">{passportFieldInner}</fieldset>
      </section>
    ) : (
      passportFieldInner
    );

  return (
    <div>
      <h1 className="text-2xl font-semibold">{heading}</h1>
      <StepsNav current={1} tid={tid} />

      <div className="card mt-4">
        <div
          className="text-sm text-slate-600"
          data-testid={tid("passenger-flight-summary")}
        >
          {wizard.airline} {wizard.flightId} &middot; {wizard.from} → {wizard.to} on{" "}
          {wizard.date} &middot; <strong>${wizard.basePrice}</strong>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4" data-testid={tid("passenger-form")}>
          {Object.keys(errors).length > 0 && (
            <ul
              className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              role="alert"
              data-testid={tid("passenger-errors")}
            >
              {Object.values(errors).map((msg) => (
                <li key={msg}>{msg}</li>
              ))}
            </ul>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={idTitle} className="label">
                Title
              </label>
              <select
                id={idTitle}
                className="input"
                data-testid={tid("passenger-title")}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              >
                <option value="">Select…</option>
                {TITLES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              {fieldError("title", "passenger-error-title")}
            </div>
            <div>
              <label htmlFor={idBirth} className="label">
                Date of birth
              </label>
              <input
                id={idBirth}
                type="date"
                className="input"
                data-testid={tid("passenger-birth-date")}
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
              {fieldError("birthDate", "passenger-error-birth-date")}
            </div>
            {nameFields}
            {passportField}
            <div>
              <label htmlFor={idNationality} className="label">
                Nationality
              </label>
              <select
                id={idNationality}
                className="input"
                data-testid={tid("passenger-nationality")}
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
              >
                <option value="">Select…</option>
                {NATIONALITIES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              {fieldError("nationality", "passenger-error-nationality")}
            </div>
            <div>
              <label htmlFor={idEmail} className="label">
                Email
              </label>
              <input
                id={idEmail}
                type="email"
                className="input"
                data-testid={tid("passenger-email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {fieldError("email", "passenger-error-email")}
            </div>
            <div>
              <label htmlFor={idPhone} className="label">
                Phone
              </label>
              <input
                id={idPhone}
                className="input"
                placeholder="+1 514 555 0134"
                data-testid={tid("passenger-phone")}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              {fieldError("phone", "passenger-error-phone")}
            </div>
            <div>
              <label htmlFor={idFf} className="label">
                Frequent flyer number (optional){" "}
                <Tooltip content="Two letters then 6-10 digits, e.g. SQ123456">
                  <span className="ml-1 text-xs text-slate-400 cursor-help">ⓘ</span>
                </Tooltip>
              </label>
              <input
                id={idFf}
                className="input"
                placeholder="SQ123456"
                data-testid={tid("passenger-frequent-flyer")}
                value={frequentFlyer}
                onChange={(e) => setFrequentFlyer(e.target.value)}
              />
              {fieldError("frequentFlyer", "passenger-error-frequent-flyer")}
            </div>
          </div>

          <div className="mt-2 border-t border-slate-100 pt-4">
            <h2 className="text-sm font-semibold">Emergency contact</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor={idEmName} className="label">
                  Contact name
                </label>
                <input
                  id={idEmName}
                  className="input"
                  data-testid={tid("passenger-emergency-name")}
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                />
                {fieldError("emergencyName", "passenger-error-emergency-name")}
              </div>
              {/* `element-removed` deletes the emergency phone input outright —
                  the designated removed element on this page. Validation still
                  requires it, so the form cannot be completed; that is the point. */}
              {variant === "element-removed" ? null : (
                <div>
                  <label htmlFor={idEmPhone} className="label">
                    Contact phone
                  </label>
                  <input
                    id={idEmPhone}
                    className="input"
                    placeholder="+1 514 555 0199"
                    data-testid={tid("passenger-emergency-phone")}
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                  />
                  {fieldError("emergencyPhone", "passenger-error-emergency-phone")}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              className="btn-ghost"
              data-testid={tid("passenger-back")}
              onClick={() => router.push("/results?" + resultsQuery(wizard))}
            >
              Back
            </button>
            {fakeButton ? (
              <div
                role="button"
                tabIndex={0}
                data-testid={tid("passenger-continue")}
                className="btn-primary cursor-pointer"
                onClick={() => onSubmit()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSubmit();
                }}
              >
                {ctaLabel}
              </div>
            ) : (
              <button type="submit" className="btn-primary" data-testid={tid("passenger-continue")}>
                {ctaLabel}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function resultsQuery(w: { from?: string; to?: string; date?: string }) {
  return new URLSearchParams({
    from: w.from || "",
    to: w.to || "",
    date: w.date || "",
  }).toString();
}
