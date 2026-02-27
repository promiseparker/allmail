"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddAccountButtonProps {
  disabled?: boolean;
}

export function AddAccountButton({ disabled = false }: AddAccountButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={cn(
          "flex items-center gap-1.5 bg-primary text-white text-sm font-medium px-4 py-2 rounded-md transition-colors",
          disabled
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-primary-700"
        )}
      >
        <Plus className="w-4 h-4" />
        Add account
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-border rounded-xl shadow-modal z-20 overflow-hidden animate-slide-up">
            <div className="px-3 py-2.5 border-b border-border flex items-center justify-between">
              <p className="text-xs font-medium text-gray-500">Connect calendar</p>
              <button onClick={() => setOpen(false)} aria-label="Close">
                <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <div className="p-2 space-y-0.5">
              <a
                href="/api/connect/google"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-muted transition-colors"
                onClick={() => setOpen(false)}
              >
                <GoogleIcon />
                <div>
                  <p className="text-sm text-gray-700 font-medium">Google Calendar</p>
                  <p className="text-xs text-gray-400">Connect a Google account</p>
                </div>
              </a>
              <a
                href="/api/connect/microsoft"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-muted transition-colors"
                onClick={() => setOpen(false)}
              >
                <MicrosoftIcon />
                <div>
                  <p className="text-sm text-gray-700 font-medium">Outlook Calendar</p>
                  <p className="text-xs text-gray-400">Connect a Microsoft account</p>
                </div>
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-8 h-8 flex-shrink-0" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-8 h-8 flex-shrink-0" aria-hidden>
      <rect x="1"  y="1"  width="10" height="10" fill="#F25022" rx="1" />
      <rect x="13" y="1"  width="10" height="10" fill="#7FBA00" rx="1" />
      <rect x="1"  y="13" width="10" height="10" fill="#00A4EF" rx="1" />
      <rect x="13" y="13" width="10" height="10" fill="#FFB900" rx="1" />
    </svg>
  );
}
