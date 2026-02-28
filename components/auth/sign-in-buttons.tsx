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
      {/* Google */}
      <button
        onClick={() => handleSignIn("google")}
        disabled={!!loading}
        className="
          w-full flex items-center gap-3 px-5 py-4 rounded-xl
          bg-white border border-gray-200 shadow-sm
          text-sm font-medium text-gray-700
          hover:border-[#4285F4]/40 hover:bg-[#4285F4]/[0.03] hover:shadow-md
          transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">
          {loading === "google"
            ? <Spinner color="#4285F4" />
            : <GoogleIcon />}
        </span>
        <span className="flex-1 text-center">Continue with Google</span>
        <span className="w-5 flex-shrink-0" />
      </button>

      {/* Microsoft */}
      <button
        onClick={() => handleSignIn("microsoft")}
        disabled={!!loading}
        className="
          w-full flex items-center gap-3 px-5 py-4 rounded-xl
          bg-white border border-gray-200 shadow-sm
          text-sm font-medium text-gray-700
          hover:border-[#00A4EF]/40 hover:bg-[#00A4EF]/[0.03] hover:shadow-md
          transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">
          {loading === "microsoft"
            ? <Spinner color="#00A4EF" />
            : <MicrosoftIcon />}
        </span>
        <span className="flex-1 text-center">Continue with Microsoft</span>
        <span className="w-5 flex-shrink-0" />
      </button>
    </div>
  );
}

function Spinner({ color }: { color: string }) {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke={color} strokeWidth="3" />
      <path className="opacity-75" fill={color} d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
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
      <rect x="1"  y="1"  width="10" height="10" fill="#F25022" rx="1" />
      <rect x="13" y="1"  width="10" height="10" fill="#7FBA00" rx="1" />
      <rect x="1"  y="13" width="10" height="10" fill="#00A4EF" rx="1" />
      <rect x="13" y="13" width="10" height="10" fill="#FFB900" rx="1" />
    </svg>
  );
}
