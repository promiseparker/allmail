"use client";

import { useQuery } from "@tanstack/react-query";

type ConflictStatus = "active" | "acknowledged" | "resolved";

export function useConflicts(status: ConflictStatus = "active") {
  return useQuery({
    queryKey: ["conflicts", status],
    queryFn:  async () => {
      const res = await fetch(`/api/conflicts?status=${status}`);
      if (!res.ok) throw new Error("Failed to fetch conflicts");
      return (await res.json()).data;
    },
    staleTime:       status === "active" ? 2 * 60_000 : 5 * 60_000,
    refetchInterval: status === "active" ? 5 * 60_000 : false,
  });
}
