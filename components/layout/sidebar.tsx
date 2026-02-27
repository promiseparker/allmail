"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Calendar, AlertTriangle, BarChart3,
  Link2, Settings, HelpCircle, LogOut
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/calendar", icon: Calendar, label: "Calendar" },
  { href: "/conflicts", icon: AlertTriangle, label: "Conflicts" },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
];

const bottomItems = [
  { href: "/accounts", icon: Link2, label: "Accounts" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-14 bg-sidebar-bg flex flex-col items-center py-3 border-r border-white/5 flex-shrink-0 group hover:w-52 transition-all duration-200 overflow-hidden">
      {/* Logo */}
      <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center mb-6 flex-shrink-0">
        <Calendar className="w-4 h-4 text-white" />
      </div>

      {/* Main nav */}
      <nav className="flex-1 flex flex-col gap-0.5 w-full px-2">
        {navItems.map((item) => (
          <SidebarItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            active={pathname.startsWith(item.href)}
          />
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="flex flex-col gap-0.5 w-full px-2 pb-2 border-t border-white/5 pt-2">
        {bottomItems.map((item) => (
          <SidebarItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            active={pathname.startsWith(item.href)}
          />
        ))}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="sidebar-item w-full"
          aria-label="Sign out"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            Sign out
          </span>
        </button>
      </div>
    </aside>
  );
}

function SidebarItem({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn("sidebar-item", active && "active")}
      title={label}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {label}
      </span>
    </Link>
  );
}
