import { requireAuth } from "@/lib/auth/session";
import { PLAN_LIMITS } from "@/types/api";
import type { Plan } from "@/types/api";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";
import Link from "next/link";
import { BarChart3 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const session = await requireAuth();
  const plan = session.user.plan as Plan;

  if (!PLAN_LIMITS[plan].analyticsEnabled) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-xl font-semibold text-gray-900 mb-6">Analytics</h1>
        <div className="bg-white border border-border rounded-xl p-10 text-center">
          <BarChart3 className="w-10 h-10 text-gray-300 mx-auto mb-4" />
          <h2 className="text-base font-semibold text-gray-900 mb-2">Analytics requires Pro</h2>
          <p className="text-sm text-gray-500 mb-6">
            Unlock workload heatmaps, meeting analysis, and burnout detection.
          </p>
          <Link
            href="/settings/billing"
            className="bg-primary text-white text-sm font-medium px-5 py-2.5 rounded-md hover:bg-primary-700 transition-colors"
          >
            Upgrade to Pro →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Analytics</h1>
      </div>
      <AnalyticsDashboard />
    </div>
  );
}
