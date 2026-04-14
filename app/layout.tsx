import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "./providers";
import Chrome from "./components/Chrome";

export const metadata: Metadata = {
  title: "SQALOGIC Automation Test Site",
  description: "A flight booking sandbox for testing web automation tools.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <AppProviders>
          <Chrome>{children}</Chrome>
        </AppProviders>
      </body>
    </html>
  );
}
