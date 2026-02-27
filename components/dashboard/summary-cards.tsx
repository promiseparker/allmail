import Link from "next/link";
import { Calendar, AlertTriangle, Clock, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SummaryCardsProps {
  eventCount:    number;
  conflictCount: number;
  meetingHours:  number;
  accountCount:  number;
}

export function SummaryCards({
  eventCount,
  conflictCount,
  meetingHours,
  accountCount,
}: SummaryCardsProps) {
  const cards = [
    {
      label: "Today",
      value: `${eventCount} event${eventCount !== 1 ? "s" : ""}`,
      icon:  Calendar,
      color: "text-primary",
      bg:    "bg-primary-50",
      href:  "/calendar",
    },
    {
      label: "Conflicts",
      value: conflictCount === 0 ? "All clear" : `${conflictCount} active`,
      icon:  AlertTriangle,
      color: conflictCount > 0 ? "text-conflict-hard" : "text-green-500",
      bg:    conflictCount > 0 ? "bg-conflict-hard-bg" : "bg-green-50",
      href:  "/conflicts",
    },
    {
      label: "Meeting time",
      value: meetingHours === 0 ? "None today" : `${meetingHours}h today`,
      icon:  Clock,
      color: "text-gray-600",
      bg:    "bg-surface-muted",
      href:  "/calendar",
    },
    {
      label: "Accounts",
      value: `${accountCount} connected`,
      icon:  BarChart3,
      color: "text-gray-600",
      bg:    "bg-surface-muted",
      href:  "/accounts",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <Link
          key={card.label}
          href={card.href}
          className="bg-white border border-border rounded-lg p-4 shadow-card hover:border-primary/30 hover:shadow-md transition-all group block"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">{card.label}</p>
              <p className="text-base font-semibold text-gray-900 group-hover:text-gray-800">
                {card.value}
              </p>
            </div>
            <div className={cn("w-8 h-8 rounded-md flex items-center justify-center", card.bg)}>
              <card.icon className={cn("w-4 h-4", card.color)} />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
