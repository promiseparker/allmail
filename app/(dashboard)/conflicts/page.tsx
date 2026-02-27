import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ConflictList } from "@/components/conflicts/conflict-list";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Conflicts" };
export const dynamic = "force-dynamic";

export default async function ConflictsPage() {
  const session = await requireAuth();

  // Fetch both active + acknowledged counts for the initial tab badges
  const [activeCount, acknowledgedCount] = await Promise.all([
    db.conflictFlag.count({
      where: { userId: session.user.id, status: "active" },
    }),
    db.conflictFlag.count({
      where: { userId: session.user.id, status: "acknowledged" },
    }),
  ]);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Conflicts</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Scheduling overlaps detected across your calendars
          </p>
        </div>
      </div>

      <ConflictList
        initialActiveCount={activeCount}
        initialAcknowledgedCount={acknowledgedCount}
      />
    </div>
  );
}
