import Link from "next/link";
import { ArrowRight, Zap, AlertCircle, BarChart3, Calendar, Shield, Clock } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* NAV */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-border bg-white/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-base tracking-tight">SyncOne</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-500">
            <Link href="#features" className="hover:text-gray-900 transition-colors">Features</Link>
            <Link href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/login"
              className="text-sm bg-primary text-white px-4 py-1.5 rounded-md hover:bg-primary-700 transition-colors font-medium"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary-50 border border-primary-100 text-primary-700 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
            <Zap className="w-3.5 h-3.5" />
            Google Calendar + Outlook in one place
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-5 leading-tight">
            All your calendars.<br />
            One intelligent view.
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-8 leading-relaxed">
            Connect multiple calendar accounts, detect scheduling conflicts instantly,
            and find the best times to meet — without the tab-switching.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/api/connect/google"
              className="flex items-center gap-2.5 bg-white border border-border shadow-card px-5 py-2.5 rounded-md text-sm font-medium hover:shadow-card-hover transition-all"
            >
              <GoogleIcon />
              Connect Google Calendar
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors"
            >
              Get started free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <p className="text-xs text-gray-400 mt-4">Free plan — no credit card required</p>
        </div>

        {/* Hero visual */}
        <div className="max-w-5xl mx-auto mt-16">
          <div className="bg-gray-50 border border-border rounded-xl overflow-hidden shadow-modal">
            <DashboardPreview />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20 px-6 border-t border-border bg-surface-muted">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-semibold text-center text-gray-900 mb-2">
            Everything in one dashboard
          </h2>
          <p className="text-sm text-gray-500 text-center mb-12">
            Built for professionals who live across multiple calendars.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-white border border-border rounded-lg p-5 shadow-card">
                <div className="w-8 h-8 rounded-md bg-primary-50 flex items-center justify-center mb-3">
                  <f.icon className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-20 px-6 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold text-center text-gray-900 mb-2">
            Simple, transparent pricing
          </h2>
          <p className="text-sm text-gray-500 text-center mb-12">Start free. Upgrade when you need it.</p>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Free */}
            <div className="border border-border rounded-lg p-6">
              <p className="text-sm font-medium text-gray-500 mb-1">Free</p>
              <p className="text-3xl font-bold text-gray-900 mb-1">$0</p>
              <p className="text-xs text-gray-400 mb-6">Forever free</p>
              <ul className="space-y-2 text-sm text-gray-600 mb-6">
                {["2 calendar connections", "Basic conflict detection", "Week + month view"].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/login" className="block text-center text-sm border border-border rounded-md py-2 hover:bg-surface-muted transition-colors">
                Get started
              </Link>
            </div>

            {/* Pro */}
            <div className="border-2 border-primary rounded-lg p-6 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs px-3 py-0.5 rounded-full font-medium">
                Most popular
              </div>
              <p className="text-sm font-medium text-gray-500 mb-1">Pro</p>
              <p className="text-3xl font-bold text-gray-900 mb-1">$12<span className="text-sm font-normal text-gray-400">/mo</span></p>
              <p className="text-xs text-gray-400 mb-6">Billed monthly</p>
              <ul className="space-y-2 text-sm text-gray-600 mb-6">
                {[
                  "Unlimited calendar connections",
                  "Advanced conflict detection",
                  "Smart scheduling suggestions",
                  "Workload analytics",
                  "Burnout detection",
                  "Auto-mirror calendars",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/login" className="block text-center text-sm bg-primary text-white rounded-md py-2 hover:bg-primary-700 transition-colors font-medium">
                Start Pro trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span className="font-medium">SyncOne</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-gray-600 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-gray-600 transition-colors">Terms</Link>
          </div>
          <p>© 2026 SyncOne. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function DashboardPreview() {
  return (
    <div className="flex h-64">
      {/* Sidebar preview */}
      <div className="w-12 bg-sidebar-bg flex flex-col items-center py-3 gap-3">
        {[Calendar, BarChart3, AlertCircle, Shield].map((Icon, i) => (
          <div key={i} className={`w-8 h-8 rounded-md flex items-center justify-center ${i === 0 ? "bg-sidebar-active" : ""}`}>
            <Icon className={`w-4 h-4 ${i === 0 ? "text-white" : "text-sidebar-text"}`} />
          </div>
        ))}
      </div>
      {/* Content preview */}
      <div className="flex-1 p-4">
        <div className="grid grid-cols-4 gap-3 mb-4">
          {["6 events today", "2 conflicts", "3.5h free", "4.2h meetings"].map((label) => (
            <div key={label} className="bg-white border border-border rounded p-2">
              <p className="text-xs text-gray-400">{label.split(" ").slice(1).join(" ")}</p>
              <p className="text-sm font-semibold text-gray-900">{label.split(" ")[0]}</p>
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          {[
            { time: "9:00", title: "Team standup", color: "#4285F4" },
            { time: "10:30", title: "Product review", color: "#00A4EF", conflict: true },
            { time: "14:00", title: "Client call", color: "#4285F4" },
          ].map((event) => (
            <div key={event.title} className="flex items-center gap-2 bg-white border border-border rounded px-2 py-1.5">
              <div className="w-0.5 h-6 rounded-full" style={{ backgroundColor: event.color }} />
              <span className="text-xs text-gray-400 w-10">{event.time}</span>
              <span className="text-xs font-medium text-gray-700">{event.title}</span>
              {event.conflict && (
                <span className="ml-auto text-xs text-conflict-hard bg-conflict-hard-bg px-1.5 py-0.5 rounded font-medium">
                  ⚠ Conflict
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const features = [
  {
    icon: Zap,
    title: "Instant sync",
    description: "Real-time webhooks keep all your calendars in sync within seconds. Delta sync ensures minimal API usage.",
  },
  {
    icon: AlertCircle,
    title: "Conflict detection",
    description: "Automatically detect overlapping events across all connected accounts. Hard and soft conflicts flagged instantly.",
  },
  {
    icon: Clock,
    title: "Free time finder",
    description: "Smart algorithm suggests optimal meeting slots based on your actual schedule across all calendars.",
  },
  {
    icon: BarChart3,
    title: "Workload insights",
    description: "Understand your time density, meeting load, and get early burnout signals before they impact you.",
  },
  {
    icon: Shield,
    title: "Secure by design",
    description: "OAuth tokens encrypted at rest with AES-256-GCM. Per-user keys. GDPR compliant data handling.",
  },
  {
    icon: Calendar,
    title: "Universal format",
    description: "Google, Outlook, and more — all normalized into one unified event model. Add providers without changing your workflow.",
  },
];
