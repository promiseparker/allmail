"use client";

import { useQuery } from "@tanstack/react-query";
import { startOfWeek, endOfWeek } from "date-fns";
import type { CalendarEvent } from "@/types/events";

export function useEvents(start: Date, end: Date) {
  return useQuery<CalendarEvent[]>({
    queryKey: ["events", start.toISOString(), end.toISOString()],
    queryFn: async () => {
      const params = new URLSearchParams({
        start: start.toISOString(),
        end: end.toISOString(),
      });
      const res = await fetch(`/api/events?${params}`);
      if (!res.ok) throw new Error("Failed to fetch events");
      const json = await res.json() as { data: CalendarEvent[] };
      return json.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useWeekEvents(date: Date) {
  return useEvents(
    startOfWeek(date, { weekStartsOn: 1 }),
    endOfWeek(date, { weekStartsOn: 1 })
  );
}
