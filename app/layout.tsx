import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SyncOne — Unified Calendar Intelligence",
    template: "%s · SyncOne",
  },
  description:
    "Connect Google Calendar and Outlook in one intelligent dashboard. Detect scheduling conflicts, find free time, and gain workload insights.",
  keywords: ["calendar", "scheduling", "productivity", "google calendar", "outlook"],
  openGraph: {
    type: "website",
    siteName: "SyncOne",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-surface text-gray-900 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
