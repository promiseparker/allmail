"use client";

import { useQuery } from "@tanstack/react-query";

export function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const res = await fetch("/api/accounts");
      if (!res.ok) throw new Error("Failed to fetch accounts");
      const json = await res.json();
      return json.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
