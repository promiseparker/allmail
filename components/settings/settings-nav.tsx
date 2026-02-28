"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { User, Bell, Calendar, Shield, CreditCard } from "lucide-react";

const NAV_ITEMS = [
  { href: "/settings/general",       label: "General",       icon: User       },
  { href: "/settings/notifications", label: "Notifications", icon: Bell       },
  { href: "/settings/calendars",     label: "Calendars",     icon: Calendar   },
  { href: "/settings/privacy",       label: "Privacy",       icon: Shield     },
  { href: "/settings/billing",       label: "Billing",       icon: CreditCard },
] as const;

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-0.5">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
              isActive
                ? "bg-gray-100 text-gray-900 font-medium"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
