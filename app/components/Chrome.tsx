"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import Toaster from "./Toaster";

export default function Chrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const bare = pathname?.startsWith("/embed");

  if (bare) {
    return <div className="p-4">{children}</div>;
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      <footer className="mt-16 border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        SQALOGIC Automation Test Site &middot; For QA automation practice only
      </footer>
      <Toaster />
    </>
  );
}
