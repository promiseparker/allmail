"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { parseISO, isValid } from "date-fns";
import { CalendarView } from "@/components/calendar/calendar-view";
import { CalendarToolbar } from "@/components/calendar/calendar-toolbar";
import type { CalendarView as ViewType } from "@/types/events";

export default function CalendarPage() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const [view, setView]               = useState<ViewType>(() => {
    const v = searchParams.get("view");
    return (v === "day" || v === "week" || v === "month") ? v : "week";
  });
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    const d = searchParams.get("date");
    if (d) {
      const parsed = parseISO(d);
      if (isValid(parsed)) return parsed;
    }
    return new Date();
  });

  // Keep URL in sync with state so sharing/bookmarking works
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("view", view);
    params.set("date", currentDate.toISOString().slice(0, 10));
    router.replace(`/calendar?${params.toString()}`, { scroll: false });
  }, [view, currentDate, router]);

  return (
    <div className="h-full flex flex-col">
      <CalendarToolbar
        view={view}
        currentDate={currentDate}
        onViewChange={setView}
        onDateChange={setCurrentDate}
      />
      <div className="flex-1 overflow-hidden">
        <CalendarView
          view={view}
          currentDate={currentDate}
          onViewChange={setView}
          onDateChange={setCurrentDate}
        />
      </div>
    </div>
  );
}
