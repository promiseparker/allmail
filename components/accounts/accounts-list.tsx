"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  RefreshCw, Trash2, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle2, Clock, Wifi, Check,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";
import { Toast, useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { Plan } from "@/types/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Calendar {
  id:        string;
  name:      string;
  color:     string | null;
  isEnabled: boolean;
  isPrimary: boolean;
}

interface Account {
  id:           string;
  provider:     "google" | "microsoft";
  email:        string;
  displayName:  string | null;
  avatarUrl:    string | null;
  syncStatus:   string;
  lastSyncedAt: string | Date | null;
  errorMessage: string | null;
  calendars:    Calendar[];
  createdAt:    string | Date;
}

interface AccountsListProps {
  initialAccounts: Account[];
  plan:            Plan;
  accountLimit:    number;
  canAddMore:      boolean;
}

// ── Calendar color presets ────────────────────────────────────────────────────

const COLOR_PRESETS = [
  "#4285F4", "#EA4335", "#34A853", "#FBBC05",
  "#8E24AA", "#E67C73", "#F4511E", "#0B8043",
  "#039BE5", "#616161", "#3F51B5", "#33B679",
];

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  synced:   { label: "Synced",   color: "text-green-600",     icon: CheckCircle2 },
  syncing:  { label: "Syncing…", color: "text-primary",       icon: RefreshCw    },
  error:    { label: "Error",    color: "text-conflict-hard", icon: AlertTriangle },
  pending:  { label: "Pending",  color: "text-gray-400",      icon: Clock        },
  paused:   { label: "Paused",   color: "text-gray-400",      icon: Wifi         },
};

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] ?? STATUS_CONFIG.pending!;
}

// ── AccountsList ──────────────────────────────────────────────────────────────

export function AccountsList({
  initialAccounts,
  plan,
  accountLimit,
  canAddMore,
}: AccountsListProps) {
  const qc = useQueryClient();
  const { toast, show, dismiss } = useToast();

  const { data: accounts = initialAccounts } = useQuery<Account[]>({
    queryKey:    ["accounts"],
    queryFn:     async () => {
      const res = await fetch("/api/accounts");
      if (!res.ok) throw new Error("Failed to fetch accounts");
      return (await res.json()).data;
    },
    initialData: initialAccounts,
    staleTime:   30_000,
  });

  function onMutationSuccess(msg: string) {
    show(msg, "success");
    qc.invalidateQueries({ queryKey: ["accounts"] });
  }

  function onMutationError(msg: string) {
    show(msg, "error");
  }

  if (accounts.length === 0) {
    return (
      <>
        <div className="bg-white border border-border rounded-xl p-12 text-center shadow-card">
          <div className="w-12 h-12 rounded-full bg-surface-muted flex items-center justify-center mx-auto mb-4">
            <Wifi className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-700">No accounts connected yet</p>
          <p className="text-xs text-gray-400 mt-1 mb-5">
            Connect a Google or Outlook account to start syncing your calendars.
          </p>
          <a
            href="/api/connect/google"
            className="inline-flex items-center gap-2 bg-primary text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
          >
            Connect Google Calendar
          </a>
        </div>
        {toast && <Toast message={toast.message} variant={toast.variant} onDismiss={dismiss} />}
      </>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {accounts.map((account) => (
          <AccountCard
            key={account.id}
            account={account}
            onSuccess={onMutationSuccess}
            onError={onMutationError}
          />
        ))}
      </div>

      {!canAddMore && plan === "free" && (
        <div className="mt-5 bg-primary-50 border border-primary/20 rounded-xl p-4">
          <p className="text-sm font-medium text-primary-800">Free plan limit reached</p>
          <p className="text-xs text-primary-600 mt-0.5">
            You&apos;ve connected {accountLimit} of {accountLimit} accounts. Upgrade to Pro for
            unlimited accounts.
          </p>
          <a
            href="/settings/billing"
            className="inline-flex text-xs font-semibold text-primary underline mt-2 hover:no-underline"
          >
            Upgrade to Pro →
          </a>
        </div>
      )}

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onDismiss={dismiss} />
      )}
    </>
  );
}

// ── AccountCard ───────────────────────────────────────────────────────────────

interface AccountCardProps {
  account:   Account;
  onSuccess: (msg: string) => void;
  onError:   (msg: string) => void;
}

function AccountCard({ account, onSuccess, onError }: AccountCardProps) {
  const router = useRouter();
  const qc     = useQueryClient();

  const [expanded,             setExpanded]             = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/sync", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ connectedAccountId: account.id }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error?.message ?? "Sync failed");
      }
    },
    onSuccess: () => {
      onSuccess("Sync queued — this may take a moment");
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: (e: Error) => onError(e.message),
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/accounts", {
        method:  "DELETE",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ accountId: account.id }),
      });
      if (!res.ok) throw new Error("Disconnect failed");
    },
    onSuccess: () => {
      onSuccess(`${account.email} disconnected`);
      qc.invalidateQueries({ queryKey: ["accounts"] });
      router.refresh();
    },
    onError: () => onError("Failed to disconnect — please try again"),
  });

  const sc         = getStatusConfig(account.syncStatus);
  const StatusIcon = sc.icon;
  const isError    = account.syncStatus === "error";
  const isSyncing  = account.syncStatus === "syncing" || syncMutation.isPending;

  const enabledCount = account.calendars.filter((c) => c.isEnabled).length;

  return (
    <div
      className={cn(
        "bg-white border rounded-xl shadow-card overflow-hidden transition-colors",
        isError ? "border-conflict-hard/30" : "border-border"
      )}
    >
      {/* ── Card header ── */}
      <div className="flex items-center gap-3 p-4">
        {/* Avatar + provider badge */}
        <div className="relative flex-shrink-0">
          <Avatar
            src={account.avatarUrl ?? undefined}
            name={account.displayName ?? account.email}
            size="md"
          />
          <div
            className={cn(
              "absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center",
              account.provider === "google" ? "bg-google" : "bg-microsoft"
            )}
          >
            <ProviderIcon provider={account.provider} />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {account.displayName ?? account.email}
          </p>
          {account.displayName && (
            <p className="text-xs text-gray-400 truncate">{account.email}</p>
          )}
          <div className="flex items-center gap-1.5 mt-0.5">
            <StatusIcon
              className={cn("w-3 h-3 flex-shrink-0", sc.color, isSyncing && "animate-spin")}
            />
            <span className={cn("text-xs", sc.color)}>{sc.label}</span>
            {account.lastSyncedAt && !isSyncing && !isError && (
              <span className="text-xs text-gray-400">
                · {formatDistanceToNow(new Date(account.lastSyncedAt), { addSuffix: true })}
              </span>
            )}
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Badge variant={account.provider === "google" ? "google" : "microsoft"}>
            {account.provider === "google" ? "Google" : "Outlook"}
          </Badge>

          <button
            onClick={() => syncMutation.mutate()}
            disabled={isSyncing}
            title="Sync now"
            className="p-1.5 rounded-md hover:bg-surface-muted text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-40 ml-1"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isSyncing && "animate-spin")} />
          </button>

          <button
            onClick={() => {
              setExpanded(!expanded);
              if (expanded) setShowDisconnectConfirm(false);
            }}
            className="p-1.5 rounded-md hover:bg-surface-muted text-gray-400 transition-colors"
          >
            {expanded
              ? <ChevronUp className="w-3.5 h-3.5" />
              : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* ── Error banner ── */}
      {isError && account.errorMessage && (
        <div className="mx-4 mb-3 rounded-lg bg-conflict-hard-bg border border-conflict-hard/20 px-3 py-2 flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-conflict-hard flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-conflict-hard">{account.errorMessage}</p>
            <div className="flex items-center gap-3 mt-1">
              <button
                onClick={() => syncMutation.mutate()}
                disabled={isSyncing}
                className="text-xs font-medium text-conflict-hard underline hover:no-underline disabled:opacity-50"
              >
                Retry sync
              </button>
              <a
                href={`/api/connect/${account.provider}`}
                className="text-xs font-medium text-conflict-hard underline hover:no-underline"
              >
                Reconnect account →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── Expanded section ── */}
      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3">
          {/* Calendar list */}
          {account.calendars.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-500">
                  {account.calendars.length} calendar{account.calendars.length !== 1 ? "s" : ""}
                </p>
                <p className="text-xs text-gray-400">
                  {enabledCount} enabled
                </p>
              </div>
              <div className="space-y-0.5 mb-4">
                {account.calendars.map((cal) => (
                  <CalendarRow key={cal.id} calendar={cal} />
                ))}
              </div>
            </>
          )}

          {/* Disconnect */}
          {!showDisconnectConfirm ? (
            <button
              onClick={() => setShowDisconnectConfirm(true)}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-conflict-hard transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Disconnect account
            </button>
          ) : (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-xs font-medium text-conflict-hard mb-1">
                Remove {account.email}?
              </p>
              <p className="text-[11px] text-gray-500 mb-3 leading-relaxed">
                Synced events will be removed from SyncOne. Your actual calendar data
                is not affected.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => disconnectMutation.mutate()}
                  disabled={disconnectMutation.isPending}
                  className="bg-conflict-hard text-white text-xs font-medium px-3 py-1.5 rounded-md disabled:opacity-50 hover:opacity-90 transition-opacity"
                >
                  {disconnectMutation.isPending ? "Removing…" : "Yes, remove"}
                </button>
                <button
                  onClick={() => setShowDisconnectConfirm(false)}
                  className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── CalendarRow ───────────────────────────────────────────────────────────────

function CalendarRow({ calendar }: { calendar: Calendar }) {
  const qc              = useQueryClient();
  const [colorOpen, setColorOpen] = useState(false);

  const toggleMutation = useMutation({
    mutationFn: async (isEnabled: boolean) => {
      const res = await fetch(`/api/calendars/${calendar.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ isEnabled }),
      });
      if (!res.ok) throw new Error("Failed to update calendar");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
  });

  const colorMutation = useMutation({
    mutationFn: async (color: string) => {
      const res = await fetch(`/api/calendars/${calendar.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ color }),
      });
      if (!res.ok) throw new Error("Failed to update color");
    },
    onSuccess: () => {
      setColorOpen(false);
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
  });

  const currentColor = calendar.color ?? "#6B7280";

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 py-1.5 px-2 rounded-lg transition-colors",
        !calendar.isEnabled && "opacity-50",
        "hover:bg-surface-muted"
      )}
    >
      {/* Color dot — click to change color */}
      <div className="relative flex-shrink-0">
        <button
          onClick={() => setColorOpen(!colorOpen)}
          className="w-3 h-3 rounded-full flex-shrink-0 ring-1 ring-black/10 hover:ring-2 hover:ring-black/20 transition-shadow"
          style={{ backgroundColor: currentColor }}
          title="Change color"
          aria-label="Change calendar color"
        />
        {colorOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setColorOpen(false)}
              aria-hidden
            />
            <div className="absolute left-0 top-5 z-20 bg-white border border-border rounded-xl shadow-modal p-2 grid grid-cols-6 gap-1 w-[136px] animate-slide-up">
              {COLOR_PRESETS.map((hex) => (
                <button
                  key={hex}
                  onClick={() => colorMutation.mutate(hex)}
                  disabled={colorMutation.isPending}
                  className="w-5 h-5 rounded-full flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50 ring-1 ring-black/10"
                  style={{ backgroundColor: hex }}
                  title={hex}
                >
                  {hex === currentColor && (
                    <Check className="w-2.5 h-2.5 text-white drop-shadow" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Name */}
      <span className="text-xs flex-1 truncate text-gray-700">
        {calendar.name}
      </span>

      {/* Primary badge */}
      {calendar.isPrimary && (
        <span className="text-[10px] text-gray-400 bg-surface-muted px-1.5 py-0.5 rounded-full flex-shrink-0">
          Primary
        </span>
      )}

      {/* Enable/disable toggle */}
      <Toggle
        checked={calendar.isEnabled}
        onChange={(val) => toggleMutation.mutate(val)}
        disabled={toggleMutation.isPending}
      />
    </div>
  );
}

// ── ProviderIcon ──────────────────────────────────────────────────────────────

function ProviderIcon({ provider }: { provider: "google" | "microsoft" }) {
  if (provider === "google") {
    return (
      <svg viewBox="0 0 24 24" className="w-3 h-3" aria-hidden>
        <path
          fill="white"
          d="M12 11h8.533c.044.385.067.78.067 1.184 0 5.063-3.335 8.816-8.6 8.816C6.441 21 2 16.559 2 12S6.441 3 12 3c2.7 0 4.96.99 6.69 2.61l-2.7 2.7C14.93 7.28 13.55 6.8 12 6.8c-2.87 0-5.2 2.33-5.2 5.2s2.33 5.2 5.2 5.2c2.65 0 4.49-1.51 4.93-3.6H12V11z"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="w-3 h-3" aria-hidden>
      <path
        fill="white"
        d="M0 0h11.5v11.5H0zm12.5 0H24v11.5H12.5zM0 12.5h11.5V24H0zm12.5 0H24V24H12.5z"
      />
    </svg>
  );
}
