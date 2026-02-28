"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2, ChevronLeft, ExternalLink, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Platform definitions ──────────────────────────────────────────────────────

type PlatformId =
  | "google" | "microsoft"
  | "apple" | "fastmail" | "yahoo" | "nextcloud" | "caldav"
  | "zoho" | "proton";

interface CaldavDefaults {
  serverUrl:   string;
  serverFixed: boolean; // if true, user cannot change the URL
  note?:       string;
  noteLink?:   string;
  noteLinkLabel?: string;
}

interface PlatformDef {
  id:            PlatformId;
  name:          string;
  description:   string;
  icon:          React.ReactNode;
  type:          "oauth" | "caldav" | "soon";
  caldav?:       CaldavDefaults;
}

const PLATFORMS: PlatformDef[] = [
  // ── OAuth ──────────────────────────────────────────────────────────────────
  {
    id:          "google",
    name:        "Google Calendar",
    description: "Gmail, Workspace",
    type:        "oauth",
    icon:        <GoogleIcon />,
  },
  {
    id:          "microsoft",
    name:        "Outlook / Microsoft 365",
    description: "Outlook, Exchange, Teams",
    type:        "oauth",
    icon:        <MicrosoftIcon />,
  },

  // ── CalDAV ─────────────────────────────────────────────────────────────────
  {
    id:          "apple",
    name:        "Apple iCloud",
    description: "iCloud Calendar",
    type:        "caldav",
    icon:        <AppleIcon />,
    caldav: {
      serverUrl:   "https://caldav.icloud.com",
      serverFixed: true,
      note:        "Requires an app-specific password (not your Apple ID password).",
      noteLink:    "https://appleid.apple.com/account/manage",
      noteLinkLabel: "Generate at appleid.apple.com →",
    },
  },
  {
    id:          "fastmail",
    name:        "Fastmail",
    description: "Fastmail Calendar",
    type:        "caldav",
    icon:        <FastmailIcon />,
    caldav: {
      serverUrl:   "https://caldav.fastmail.com",
      serverFixed: true,
    },
  },
  {
    id:          "yahoo",
    name:        "Yahoo Calendar",
    description: "Yahoo Mail Calendar",
    type:        "caldav",
    icon:        <YahooIcon />,
    caldav: {
      serverUrl:   "https://caldav.calendar.yahoo.com",
      serverFixed: true,
      note:        "Requires an app password, not your Yahoo account password.",
      noteLink:    "https://login.yahoo.com/account/security",
      noteLinkLabel: "Generate at Yahoo Account Security →",
    },
  },
  {
    id:          "nextcloud",
    name:        "Nextcloud",
    description: "Self-hosted or managed",
    type:        "caldav",
    icon:        <NextcloudIcon />,
    caldav: {
      serverUrl:   "",
      serverFixed: false,
    },
  },
  {
    id:          "caldav",
    name:        "Other CalDAV server",
    description: "Fruux, OwnCloud, Zimbra…",
    type:        "caldav",
    icon:        <CaldavIcon />,
    caldav: {
      serverUrl:   "",
      serverFixed: false,
    },
  },

  // ── Coming soon ────────────────────────────────────────────────────────────
  {
    id:          "zoho",
    name:        "Zoho Calendar",
    description: "Coming soon",
    type:        "soon",
    icon:        <ZohoIcon />,
  },
  {
    id:          "proton",
    name:        "Proton Calendar",
    description: "Coming soon",
    type:        "soon",
    icon:        <ProtonIcon />,
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

interface AddAccountButtonProps {
  disabled?: boolean;
}

export function AddAccountButton({ disabled = false }: AddAccountButtonProps) {
  const [open,     setOpen]     = useState(false);
  const [selected, setSelected] = useState<PlatformDef | null>(null);
  const [loading,  setLoading]  = useState(false);
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        close();
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  function close() {
    setOpen(false);
    setSelected(null);
  }

  // ── Google: use the auto-connect POST (same Google account as sign-in) ──
  async function connectGoogle() {
    setLoading(true);
    close();
    try {
      const res  = await fetch("/api/connect/google/auto", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        router.refresh();
        router.push("/accounts?connected=google");
      } else {
        alert(data.error ?? "Failed to connect Google Calendar. Please try again.");
      }
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handlePlatformClick(p: PlatformDef) {
    if (p.type === "soon") return;
    if (p.id === "google")    { connectGoogle(); return; }
    if (p.id === "microsoft") { window.location.href = "/api/connect/microsoft"; return; }
    // CalDAV → show form
    setSelected(p);
  }

  const oauthPlatforms = PLATFORMS.filter((p) => p.type === "oauth");
  const caldavPlatforms = PLATFORMS.filter((p) => p.type === "caldav");
  const soonPlatforms  = PLATFORMS.filter((p) => p.type === "soon");

  return (
    <div className="relative" ref={panelRef}>
      {/* Trigger button */}
      <button
        onClick={() => !disabled && !loading && setOpen(!open)}
        disabled={disabled || loading}
        className={cn(
          "flex items-center gap-1.5 bg-primary text-white text-sm font-medium px-4 py-2 rounded-md transition-colors",
          disabled || loading ? "opacity-50 cursor-not-allowed" : "hover:bg-primary-700"
        )}
      >
        {loading
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <Plus className="w-4 h-4" />}
        {loading ? "Connecting…" : "Add account"}
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-100 rounded-xl z-30 overflow-hidden animate-slide-up">

          {selected ? (
            <CaldavForm platform={selected} onBack={() => setSelected(null)} onDone={close} />
          ) : (
            <>
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-700">Connect a calendar</p>
                <button onClick={close} aria-label="Close">
                  <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                </button>
              </div>

              <div className="p-2">
                {/* OAuth section */}
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 pt-1 pb-1.5">
                  Sign in with
                </p>
                <div className="space-y-0.5">
                  {oauthPlatforms.map((p) => (
                    <PlatformRow
                      key={p.id}
                      platform={p}
                      onClick={() => handlePlatformClick(p)}
                    />
                  ))}
                </div>

                {/* CalDAV section */}
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 pt-3 pb-1.5">
                  CalDAV
                </p>
                <div className="space-y-0.5">
                  {caldavPlatforms.map((p) => (
                    <PlatformRow
                      key={p.id}
                      platform={p}
                      onClick={() => handlePlatformClick(p)}
                    />
                  ))}
                </div>

                {/* Coming soon section */}
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 pt-3 pb-1.5">
                  Coming soon
                </p>
                <div className="space-y-0.5 pb-1">
                  {soonPlatforms.map((p) => (
                    <PlatformRow
                      key={p.id}
                      platform={p}
                      onClick={() => {}}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── PlatformRow ───────────────────────────────────────────────────────────────

function PlatformRow({
  platform,
  onClick,
}: {
  platform: PlatformDef;
  onClick:  () => void;
}) {
  const isSoon = platform.type === "soon";

  return (
    <button
      onClick={onClick}
      disabled={isSoon}
      className={cn(
        "w-full flex items-center gap-3 px-2 py-2 rounded-lg transition-colors text-left",
        isSoon
          ? "opacity-50 cursor-not-allowed"
          : "hover:bg-gray-50 cursor-pointer"
      )}
    >
      <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
        {platform.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 leading-tight">{platform.name}</p>
        <p className="text-xs text-gray-400 truncate">{platform.description}</p>
      </div>
      {isSoon && (
        <span className="flex items-center gap-0.5 text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full flex-shrink-0">
          <Clock className="w-2.5 h-2.5" />
          Soon
        </span>
      )}
    </button>
  );
}

// ── CaldavForm ────────────────────────────────────────────────────────────────

function CaldavForm({
  platform,
  onBack,
  onDone,
}: {
  platform: PlatformDef;
  onBack:   () => void;
  onDone:   () => void;
}) {
  const router    = useRouter();
  const defaults  = platform.caldav!;
  const [serverUrl, setServerUrl] = useState(defaults.serverUrl);
  const [username,  setUsername]  = useState("");
  const [password,  setPassword]  = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    if (!serverUrl || !username || !password) return;
    setError(null);
    setLoading(true);
    try {
      const res  = await fetch("/api/connect/caldav", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ serverUrl, username, password, platform: platform.id }),
      });
      const data = await res.json();
      if (res.ok) {
        onDone();
        router.refresh();
        router.push(`/accounts?connected=${platform.id}`);
      } else {
        setError(data.error ?? "Connection failed. Check your credentials.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const passwordLabel =
    platform.id === "apple" ? "App-specific password"
    : platform.id === "yahoo" ? "App password"
    : "Password";

  return (
    <>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        <button
          onClick={onBack}
          className="p-0.5 rounded-md hover:bg-gray-100 transition-colors flex-shrink-0"
          aria-label="Back"
        >
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-5 h-5 flex-shrink-0">{platform.icon}</div>
          <p className="text-xs font-semibold text-gray-700 truncate">{platform.name}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleConnect} className="p-4 space-y-3">
        {/* Server URL — hidden if fixed */}
        {!defaults.serverFixed && (
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              CalDAV server URL
            </label>
            <input
              type="url"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="https://cloud.example.com"
              required
              className="w-full text-sm px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-gray-300"
            />
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">
            {platform.id === "apple" ? "Apple ID (email)" : "Username / email"}
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={platform.id === "apple" ? "you@icloud.com" : "user@example.com"}
            required
            autoComplete="username"
            className="w-full text-sm px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-gray-300"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">
            {passwordLabel}
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={platform.id === "apple" ? "xxxx-xxxx-xxxx-xxxx" : "••••••••"}
            required
            autoComplete="current-password"
            className="w-full text-sm px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-gray-300"
          />
        </div>

        {/* Note */}
        {defaults.note && (
          <div className="bg-gray-50 rounded-lg px-3 py-2.5">
            <p className="text-[11px] text-gray-500 leading-relaxed">{defaults.note}</p>
            {defaults.noteLink && (
              <a
                href={defaults.noteLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-primary font-medium mt-1 hover:underline"
              >
                {defaults.noteLinkLabel ?? defaults.noteLink}
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !username || !password || (!defaults.serverFixed && !serverUrl)}
          className="w-full bg-primary text-white text-sm font-medium py-2 rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Connecting…
            </span>
          ) : (
            "Connect"
          )}
        </button>
      </form>
    </>
  );
}

// ── Provider SVG icons ────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7" aria-hidden>
      <rect x="1"  y="1"  width="10" height="10" fill="#F25022" rx="1" />
      <rect x="13" y="1"  width="10" height="10" fill="#7FBA00" rx="1" />
      <rect x="1"  y="13" width="10" height="10" fill="#00A4EF" rx="1" />
      <rect x="13" y="13" width="10" height="10" fill="#FFB900" rx="1" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7" aria-hidden fill="#1d1d1f">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function FastmailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7" aria-hidden>
      <rect width="24" height="24" rx="4" fill="#1E7BE0" />
      <path fill="white" d="M4 8l8 5 8-5v9a1 1 0 01-1 1H5a1 1 0 01-1-1V8zm0-1a1 1 0 011-1h14a1 1 0 011 1l-8 5-8-5z" />
    </svg>
  );
}

function YahooIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7" aria-hidden>
      <rect width="24" height="24" rx="4" fill="#7B0099" />
      <text x="4" y="18" fontSize="16" fontWeight="bold" fill="white" fontFamily="Arial">Y!</text>
    </svg>
  );
}

function NextcloudIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7" aria-hidden>
      <rect width="24" height="24" rx="4" fill="#0082C9" />
      <circle cx="7"  cy="12" r="3" fill="white" />
      <circle cx="17" cy="12" r="3" fill="white" />
      <circle cx="12" cy="12" r="3" fill="white" />
    </svg>
  );
}

function CaldavIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7" aria-hidden>
      <rect width="24" height="24" rx="4" fill="#6B7280" />
      <rect x="4" y="5" width="16" height="14" rx="2" fill="none" stroke="white" strokeWidth="1.5" />
      <path d="M4 9h16" stroke="white" strokeWidth="1.5" />
      <path d="M8 5V3M16 5V3" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="7" y="12" width="3" height="3" rx="0.5" fill="white" />
      <rect x="14" y="12" width="3" height="3" rx="0.5" fill="white" />
    </svg>
  );
}

function ZohoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7" aria-hidden>
      <rect width="24" height="24" rx="4" fill="#3E5BFC" />
      <text x="3" y="17" fontSize="13" fontWeight="bold" fill="white" fontFamily="Arial">Zo</text>
    </svg>
  );
}

function ProtonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7" aria-hidden>
      <rect width="24" height="24" rx="4" fill="#6D4AFF" />
      <path fill="white" d="M7 7h5a4 4 0 010 8H9v3H7V7zm2 6h3a2 2 0 000-4H9v4z" />
    </svg>
  );
}
