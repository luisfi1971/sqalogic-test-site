"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth, useI18n, useRelease } from "../providers";
import { useState } from "react";

export default function Header() {
  const { user, logout } = useAuth();
  const { release, bump } = useRelease();
  const { locale, setLocale, t } = useI18n();
  const [flash, setFlash] = useState(false);

  const onSimulate = () => {
    bump();
    setFlash(true);
    setTimeout(() => setFlash(false), 1200);
  };

  /**
   * A real window.confirm, not a DOM modal. This is the target for the canon's
   * nativeDialog slot, which was reserved with no way to prove it: a native
   * dialog is categorically different from a modal in the page — it is not an
   * element at all, it is an interruption of the browser, and it blocks script
   * until it is answered.
   */
  const onLogout = () => {
    if (window.confirm(t("logout.confirm"))) logout();
  };

  return (
    <header className="border-b border-slate-200 bg-[color:var(--brand)] text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/sqalogic-logo.png" alt="SQALOGIC" width={140} height={32} priority />
          <span className="hidden sm:inline text-sm opacity-80">Automation Test Site</span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4 text-sm">
          <Link href="/search" className="hover:underline">{t("nav.search")}</Link>
          <Link href="/my-trips" className="hover:underline">{t("nav.trips")}</Link>
          <button
            type="button"
            onClick={() => setLocale(locale === "en" ? "fr-CA" : "en")}
            data-testid="locale-toggle"
            data-locale={locale}
            aria-label={t("nav.language")}
            className="rounded border border-white/30 px-2 py-1 text-xs font-semibold"
          >
            {locale === "en" ? "FR" : "EN"}
          </button>
          {user ? (
            <>
              <span className="hidden sm:inline opacity-80">
                {t("nav.greeting", { name: user.name.split(" ")[0] })}
              </span>
              <button
                onClick={onLogout}
                data-testid="logout"
                className="rounded bg-white/10 px-3 py-1 hover:bg-white/20"
              >
                {t("nav.logout")}
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded bg-white/10 px-3 py-1 hover:bg-white/20">{t("nav.login")}</Link>
              <Link href="/register" className="rounded bg-[color:var(--brand-accent)] px-3 py-1">{t("nav.register")}</Link>
            </>
          )}
          <button
            onClick={onSimulate}
            title="Simulate a new release — breaks IDs and some selectors"
            className={`ml-2 rounded border border-amber-300 px-3 py-1 text-xs font-semibold transition ${
              flash ? "bg-amber-400 text-black" : "bg-amber-500/20 text-amber-200 hover:bg-amber-500/30"
            }`}
          >
            {flash ? `Release v${release} deployed!` : `Simulate New Release (v${release})`}
          </button>
        </nav>
      </div>
    </header>
  );
}
