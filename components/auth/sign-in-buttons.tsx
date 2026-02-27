"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export function SignInButtons() {
  const [loading, setLoading] = useState<"google" | "microsoft" | null>(null);

  const handleSignIn = async (provider: "google" | "microsoft") => {
    setLoading(provider);
    await signIn(provider, { callbackUrl: "/dashboard" });
  };

  return (
    <div className="space-y-3">
      <button
        onClick={() => handleSignIn("google")}
        disabled={!!loading}
        className="w-full flex items-center justify-center gap-3 border border-border rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-surface-muted transition-colors disabled:opacity-60"
      >
        {loading === "google" ? (
          <div className="w-4 h-4 border-2 border-gray-300 border-t-google rounded-full animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        Continue with Google
      </button>

      <button
        onClick={() => handleSignIn("microsoft")}
        disabled={!!loading}
        className="w-full flex items-center justify-center gap-3 border border-border rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-surface-muted transition-colors disabled:opacity-60"
      >
        {loading === "microsoft" ? (
          <div className="w-4 h-4 border-2 border-gray-300 border-t-microsoft rounded-full animate-spin" />
        ) : (
          <MicrosoftIcon />
        )}
        Continue with Microsoft
      </button>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-xs text-gray-400">or</span>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400">
        Sign in with Google to connect your Google Calendar,<br />
        or Microsoft to connect Outlook.
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden>
      <rect x="1" y="1" width="10" height="10" fill="#F25022" rx="1" />
      <rect x="13" y="1" width="10" height="10" fill="#7FBA00" rx="1" />
      <rect x="1" y="13" width="10" height="10" fill="#00A4EF" rx="1" />
      <rect x="13" y="13" width="10" height="10" fill="#FFB900" rx="1" />
    </svg>
  );
}
