import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";

interface ConflictBannerProps {
  count: number;
}

export function ConflictBanner({ count }: ConflictBannerProps) {
  return (
    <div className="flex items-center justify-between bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
        </div>
        <p className="text-sm font-medium text-red-600">
          {count} scheduling conflict{count !== 1 ? "s" : ""} need{count === 1 ? "s" : ""} attention
        </p>
      </div>
      <Link
        href="/conflicts"
        className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-600 transition-colors"
      >
        View
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
