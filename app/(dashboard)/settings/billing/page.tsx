import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { BillingSection } from "@/components/settings/billing-section";
import { PLAN_LIMITS } from "@/types/api";
import type { Plan } from "@/types/api";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Billing" };
export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const session = await requireAuth();

  const [user, accountCount] = await Promise.all([
    db.user.findUnique({
      where:  { id: session.user.id },
      select: { plan: true, planExpiresAt: true },
    }),
    db.connectedAccount.count({
      where: { userId: session.user.id, isActive: true },
    }),
  ]);

  const plan         = (user?.plan ?? "free") as Plan;
  const accountLimit = PLAN_LIMITS[plan].connectedAccounts;

  return (
    <BillingSection
      plan={plan}
      planExpiresAt={user?.planExpiresAt?.toISOString() ?? null}
      accountCount={accountCount}
      accountLimit={accountLimit}
    />
  );
}
