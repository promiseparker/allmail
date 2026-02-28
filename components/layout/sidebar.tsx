"use client";

import Link from "next/link";
import Image from "next/image";
import logo from "@/public/logo.png";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Calendar, AlertTriangle, BarChart3,
  Link2, Settings, LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/calendar",  icon: Calendar,         label: "Calendar"  },
  { href: "/conflicts", icon: AlertTriangle,     label: "Conflicts" },
  { href: "/analytics", icon: BarChart3,         label: "Analytics" },
];

const bottomItems = [
  { href: "/accounts", icon: Link2,    label: "Accounts" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[72px] bg-white flex flex-col items-center py-5 border-r border-gray-100 flex-shrink-0">
      {/* Logo */}
      <div className="mb-6 flex-shrink-0 flex items-center justify-center w-full px-2.5">
        <Image src={logo} alt="SyncOne" height={18} style={{ width: "auto" }} priority />
      </div>

      {/* Main nav */}
      <nav className="flex-1 flex flex-col items-center gap-0.5 w-full px-2.5">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            active={pathname.startsWith(item.href)}
          />
        ))}
      </nav>

      {/* Bottom utilities */}
      <div className="flex flex-col items-center gap-0.5 w-full px-2.5">
        <div className="w-6 h-px bg-gray-100 mb-2" />

        {bottomItems.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            active={pathname.startsWith(item.href)}
          />
        ))}

        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          aria-label="Sign out"
          className="flex flex-col items-center gap-1 w-full py-2 rounded-xl text-gray-400 hover:text-gray-500 transition-colors duration-150 select-none cursor-pointer"
        >
          <div className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-50 transition-colors duration-150">
            <LogOut className="w-[17px] h-[17px]" />
          </div>
          <span className="text-[10px] font-medium leading-none">Out</span>
        </button>
      </div>
    </aside>
  );
}

function NavItem({
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
      title={label}
      className={cn(
        "flex flex-col items-center gap-1 w-full py-2 rounded-xl transition-colors duration-150 select-none",
        active ? "text-primary" : "text-gray-400 hover:text-gray-600",
      )}
    >
      <div
        className={cn(
          "w-9 h-9 flex items-center justify-center rounded-xl transition-colors duration-150",
          active ? "bg-primary/[0.08]" : "hover:bg-gray-50",
        )}
      >
        <Icon className="w-[17px] h-[17px]" />
      </div>
      <span className="text-[10px] font-medium leading-none tracking-wide">
        {label}
      </span>
    </Link>
  );
}
