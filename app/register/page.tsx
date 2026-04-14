"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, useRelease } from "../providers";

export default function RegisterPage() {
  const { register } = useAuth();
  const { dynId, dynClass } = useRelease();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match"); return; }
    const r = await register(name, email, password);
    if (!r.ok) { setError(r.error || "Registration failed"); return; }
    router.push("/search");
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="card">
        <h1 className="text-2xl font-semibold">Create account</h1>
        <form onSubmit={onSubmit} className={`mt-6 space-y-4 ${dynClass("reg-form")}`}>
          {/* Intentional: label not linked with htmlFor */}
          <div className="wrapper-outer">
            <div className="wrapper-inner">
              <div>
                <div className="label">Full name</div>
                <input
                  data-field="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                  placeholder="Jane Doe"
                />
              </div>
            </div>
          </div>
          <div>
            <div className="label">Email</div>
            <input
              id={dynId("reg_email")}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="label">Password</div>
              <input
                id={dynId("reg_pw")}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <div className="label">Confirm</div>
              <input
                id={dynId("reg_pw_confirm")}
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="input"
              />
            </div>
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <button type="submit" className="btn-primary w-full">Register</button>
        </form>
        <p className="mt-4 text-sm text-slate-600">
          Already registered? <Link href="/login" className="text-[color:var(--brand-accent)] underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
