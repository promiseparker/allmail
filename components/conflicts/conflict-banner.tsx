import Link from "next/link";
import { AlertTriangle } from "lucide-react";

interface ConflictBannerProps {
  count: number;
}

export function ConflictBanner({ count }: ConflictBannerProps) {
  return (
    <div className="flex items-center justify-between bg-conflict-hard-bg border border-conflict-hard/20 rounded-lg px-4 py-3 mb-4">
      <div className="flex items-center gap-2.5">
        <AlertTriangle className="w-4 h-4 text-conflict-hard flex-shrink-0" />
        <p className="text-sm font-medium text-conflict-hard">
          {count} scheduling conflict{count !== 1 ? "s" : ""} detected
        </p>
      </div>
      <Link
        href="/conflicts"
        className="text-xs font-medium text-conflict-hard underline hover:no-underline"
      >
        View conflicts →
      </Link>
    </div>
  );
}
