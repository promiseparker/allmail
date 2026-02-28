"use client";

import { Bell, Plus } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface TopbarProps {
  user: {
    name?: string | null;
    email: string;
    image?: string | null;
    plan: string;
  };
}

const PAGE_TITLES: Record<string, string> = {
  "/dashboard":              "Dashboard",
  "/calendar":               "Calendar",
  "/conflicts":              "Conflicts",
  "/analytics":              "Analytics",
  "/accounts":               "Accounts",
  "/settings/general":       "Settings",
  "/settings/notifications": "Settings",
  "/settings/calendars":     "Settings",
  "/settings/privacy":       "Settings",
  "/settings/billing":       "Settings",
};

function usePageTitle(): string {
  const pathname = usePathname();
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  const match = Object.keys(PAGE_TITLES).find((key) => pathname.startsWith(key));
  return match ? PAGE_TITLES[match] : "";
}

export function Topbar({ user }: TopbarProps) {
  const title = usePageTitle();

  return (
    <header className="h-14 border-b border-gray-100 bg-white flex items-center justify-between px-6 flex-shrink-0">
      {/* Left — page title */}
      <h1 className="text-[15px] font-semibold text-gray-900 tracking-tight">
        {title}
      </h1>

      {/* Right — actions */}
      <div className="flex items-center gap-1.5">
        {/* New event CTA */}
        <Link
          href="/calendar?action=new"
          className="flex items-center gap-1.5 bg-primary text-white text-xs font-medium px-3.5 py-2 rounded-lg hover:bg-primary-600 transition-colors duration-150"
        >
          <Plus className="w-3.5 h-3.5" />
          New event
        </Link>

        {/* Divider */}
        <div className="w-px h-5 bg-gray-100 mx-1" />

        {/* Notification bell */}
        <button
          className="relative w-9 h-9 rounded-xl hover:bg-gray-50 transition-colors duration-150 flex items-center justify-center text-gray-400 hover:text-gray-600"
          aria-label="Notifications"
        >
          <Bell className="w-[17px] h-[17px]" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full ring-2 ring-white" />
        </button>

        {/* Avatar */}
        <button
          className="w-9 h-9 rounded-xl hover:bg-gray-50 transition-colors duration-150 flex items-center justify-center"
          aria-label="Account"
        >
          <div className="ring-2 ring-gray-100 rounded-full">
            <Avatar
              src={user.image ?? undefined}
              name={user.name ?? user.email}
              size="sm"
            />
          </div>
        </button>

        {/* Pro badge */}
        {user.plan === "pro" && (
          <span className="text-[11px] bg-primary/[0.06] text-primary border border-primary/20 px-1.5 py-0.5 rounded-md font-semibold">
            Pro
          </span>
        )}
      </div>
    </header>
  );
}
