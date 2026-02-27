import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function providerColor(provider: "google" | "microsoft" | string): string {
  if (provider === "google") return "#4285F4";
  if (provider === "microsoft") return "#00A4EF";
  return "#6B7280";
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + "…";
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function exponentialBackoff(attempt: number, baseMs = 1000): number {
  return Math.min(baseMs * Math.pow(2, attempt), 30_000);
}
