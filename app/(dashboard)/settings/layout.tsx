import { SettingsNav } from "@/components/settings/settings-nav";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Settings</h1>
      <div className="flex gap-8 items-start">
        {/* Secondary nav */}
        <aside className="w-44 flex-shrink-0 sticky top-4">
          <SettingsNav />
        </aside>

        {/* Page content */}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
