import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { AccountsList } from "@/components/accounts/accounts-list";
import { AddAccountButton } from "@/components/accounts/add-account-button";
import { PLAN_LIMITS } from "@/types/api";
import type { Plan } from "@/types/api";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Connected Accounts" };
export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const session = await requireAuth();
  const plan = session.user.plan as Plan;
  const limit = PLAN_LIMITS[plan].connectedAccounts;

  const accounts = await db.connectedAccount.findMany({
    where: { userId: session.user.id, isActive: true },
    select: {
      id:              true,
      provider:        true,
      providerAccountId: true,
      email:           true,
      displayName:     true,
      avatarUrl:       true,
      scopes:          true,
      syncStatus:      true,
      lastSyncedAt:    true,
      errorMessage:    true,
      createdAt:       true,
      calendars: {
        select: {
          id:        true,
          name:      true,
          color:     true,
          isEnabled: true,
          isPrimary: true,
        },
        orderBy: { isPrimary: "desc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const canAddMore =
    limit === Infinity ? true : accounts.length < limit;

  const totalCalendars  = accounts.reduce((n, a) => n + a.calendars.length, 0);
  const enabledCalendars = accounts.reduce(
    (n, a) => n + a.calendars.filter((c) => c.isEnabled).length,
    0
  );

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Connected Accounts
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {accounts.length} of{" "}
            {limit === Infinity ? "unlimited" : limit} accounts
            {totalCalendars > 0 && (
              <> · {enabledCalendars} of {totalCalendars} calendars enabled</>
            )}
          </p>
        </div>
        <AddAccountButton disabled={!canAddMore} />
      </div>

      <AccountsList
        initialAccounts={accounts as any}
        plan={plan}
        accountLimit={limit}
        canAddMore={canAddMore}
      />
    </div>
  );
}
