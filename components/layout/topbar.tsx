"use client";

import { Bell, Plus } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import Link from "next/link";

interface TopbarProps {
  user: {
    name?: string | null;
    email: string;
    image?: string | null;
    plan: string;
  };
}

export function Topbar({ user }: TopbarProps) {
  return (
    <header className="h-12 border-b border-border bg-white flex items-center justify-between px-5 flex-shrink-0">
      <div />

      <div className="flex items-center gap-2">
        <Link
          href="/calendar?action=new"
          className="flex items-center gap-1.5 bg-primary text-white text-xs font-medium px-3 py-1.5 rounded-md hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New event
        </Link>

        <button
          className="w-8 h-8 rounded-md hover:bg-surface-muted transition-colors flex items-center justify-center text-gray-500"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 ml-1">
          <Avatar
            src={user.image ?? undefined}
            name={user.name ?? user.email}
            size="sm"
          />
          {user.plan === "pro" && (
            <span className="text-xs bg-primary-50 text-primary-700 border border-primary-100 px-1.5 py-0.5 rounded font-medium">
              Pro
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
