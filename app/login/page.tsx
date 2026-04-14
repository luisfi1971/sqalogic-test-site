"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, useRelease } from "../providers";

export default function LoginPage() {
  const { login } = useAuth();
  const { release, dynId } = useRelease();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await login(email, password);
    if (!r.ok) { setError(r.error || "Login failed"); return; }
    router.push("/search");
  };

  // On release >= 2, swap the semantic roles of the two fields in the DOM
  // (email and password) to throw off cached locators.
  const swap = release >= 2 && release % 2 === 0;

  const emailField = (
    <div>
      <div className="text-sm font-medium text-slate-700 mb-1">Email address</div>
      <input
        id={dynId("login_email")}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="input"
        placeholder="you@example.com"
        autoComplete="email"
      />
    </div>
  );

  const passwordField = (
    <div>
      <div className="text-sm font-medium text-slate-700 mb-1">Password</div>
      <input
        id={dynId("login_pw")}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="input"
        placeholder="••••••"
        autoComplete="current-password"
      />
    </div>
  );

  return (
    <div className="mx-auto max-w-md">
      <div className="card">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="mt-1 text-sm text-slate-600">Welcome back.</p>
        <div className="mt-3 rounded border border-slate-200 bg-slate-50 p-2 text-xs text-slate-600">
          Demo account — <code>demo@sqalogic.ca</code> / <code>demo123</code>
        </div>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {swap ? <>{passwordField}{emailField}</> : <>{emailField}{passwordField}</>}
          {error && <div className="text-sm text-red-600">{error}</div>}
          <button type="submit" className="btn-primary w-full">Sign in</button>
        </form>
        <p className="mt-4 text-sm text-slate-600">
          No account? <Link href="/register" className="text-[color:var(--brand-accent)] underline">Register</Link>
        </p>
      </div>
    </div>
  );
}
