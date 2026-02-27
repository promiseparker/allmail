import { Calendar } from "lucide-react";
import { SignInButtons } from "@/components/auth/sign-in-buttons";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log in",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-surface-muted flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center mb-3 shadow-card">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Welcome to SyncOne</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to continue</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-border rounded-xl shadow-card p-6">
          <SignInButtons />
          <p className="text-center text-xs text-gray-400 mt-5 leading-relaxed">
            By signing in, you agree to our{" "}
            <a href="/terms" className="underline hover:text-gray-600">Terms</a>{" "}
            and{" "}
            <a href="/privacy" className="underline hover:text-gray-600">Privacy Policy</a>.
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Your OAuth tokens are encrypted at rest.
        </p>
      </div>
    </div>
  );
}
