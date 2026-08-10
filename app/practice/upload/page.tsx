"use client";

import { useRef, useState } from "react";

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED = [".pdf", ".png", ".jpg", ".jpeg"];

type Attached = { name: string; size: number };

function validate(file: File): string | null {
  const lower = file.name.toLowerCase();
  if (!ALLOWED.some((ext) => lower.endsWith(ext))) {
    return `“${file.name}” is not an accepted format. Upload a PDF, PNG or JPG.`;
  }
  if (file.size > MAX_BYTES) {
    return `“${file.name}” is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 2 MB.`;
  }
  return null;
}

export default function UploadPage() {
  const [error, setError] = useState<string | null>(null);
  const [attached, setAttached] = useState<Attached | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onPick = (file: File | undefined) => {
    setSubmitted(false);
    if (!file) {
      setAttached(null);
      setError(null);
      return;
    }
    const problem = validate(file);
    if (problem) {
      setAttached(null);
      setError(problem);
      return;
    }
    setError(null);
    setAttached({ name: file.name, size: file.size });
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold">Upload a travel document</h1>
      <p className="mt-2 text-sm text-slate-600">
        Passport scan or visa. PDF, PNG or JPG, up to 2 MB. Anything else is rejected —
        that rejection path is the point of this page. Nothing leaves your browser.
      </p>

      <form
        className="card mt-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (!attached) {
            setError("Attach a document before submitting.");
            return;
          }
          setSubmitted(true);
        }}
      >
        <label htmlFor="doc-file" className="label">
          Document file
        </label>
        <input
          id="doc-file"
          ref={inputRef}
          type="file"
          accept={ALLOWED.join(",")}
          className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border file:border-slate-300 file:bg-white file:px-3 file:py-2 file:text-sm file:text-slate-700 hover:file:bg-slate-100"
          onChange={(e) => onPick(e.target.files?.[0])}
          data-testid="upload-input"
        />

        {error && (
          <p
            className="mt-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            role="alert"
            data-testid="upload-error"
          >
            {error}
          </p>
        )}

        {attached && !error && (
          <p
            className="mt-3 rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
            data-testid="upload-attached"
          >
            Attached <strong>{attached.name}</strong> ({(attached.size / 1024).toFixed(1)} KB)
          </p>
        )}

        <div className="mt-5 flex gap-3">
          <button type="submit" className="btn-primary">
            Submit document
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              if (inputRef.current) inputRef.current.value = "";
              setAttached(null);
              setError(null);
              setSubmitted(false);
            }}
          >
            Clear
          </button>
        </div>

        {submitted && attached && (
          <p className="mt-4 text-sm font-medium text-emerald-700" data-testid="upload-ok">
            {attached.name} received. Your document is under review.
          </p>
        )}
      </form>

      <p className="mt-4 text-xs text-slate-500">
        Accepted extensions: {ALLOWED.join(", ")}. Maximum size: 2 MB.
      </p>
    </div>
  );
}
