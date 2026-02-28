"use client";

import Link from "next/link";
import { Calendar, AlertTriangle, Clock, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface SummaryCardsProps {
  eventCount:    number;
  conflictCount: number;
  meetingHours:  number;
  accountCount:  number;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
};

export function SummaryCards({
  eventCount,
  conflictCount,
  meetingHours,
  accountCount,
}: SummaryCardsProps) {
  const cards = [
    {
      label:     "Events today",
      value:     String(eventCount),
      sub:       eventCount === 1 ? "scheduled event" : "scheduled events",
      icon:      Calendar,
      iconBg:    "bg-gray-100",
      iconColor: "text-gray-500",
      href:      "/calendar",
      alert:     false,
    },
    {
      label:     "Conflicts",
      value:     conflictCount === 0 ? "0" : String(conflictCount),
      sub:       conflictCount === 0 ? "All clear" : conflictCount === 1 ? "active conflict" : "active conflicts",
      icon:      AlertTriangle,
      iconBg:    "bg-gray-100",
      iconColor: "text-gray-500",
      href:      "/conflicts",
      alert:     conflictCount > 0,
    },
    {
      label:     "Meeting time",
      value:     meetingHours === 0 ? "—" : `${meetingHours}h`,
      sub:       meetingHours === 0 ? "No meetings today" : "in meetings today",
      icon:      Clock,
      iconBg:    "bg-gray-100",
      iconColor: "text-gray-500",
      href:      "/calendar",
      alert:     false,
    },
    {
      label:     "Accounts",
      value:     String(accountCount),
      sub:       accountCount === 1 ? "account connected" : "accounts connected",
      icon:      Link2,
      iconBg:    "bg-gray-100",
      iconColor: "text-gray-500",
      href:      "/accounts",
      alert:     false,
    },
  ];

  return (
    <motion.div
      className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {cards.map((card) => (
        <motion.div key={card.label} variants={item}>
          <Link
            href={card.href}
            className={cn(
              "group block bg-white rounded-xl p-5 border transition-all duration-150",
              card.alert
                ? "border-red-100 hover:border-red-200"
                : "border-gray-100 hover:border-gray-200",
            )}
          >
            {/* Label + icon row */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-medium text-gray-400 tracking-wide">
                {card.label}
              </p>
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", card.iconBg)}>
                <card.icon className={cn("w-[17px] h-[17px]", card.iconColor)} />
              </div>
            </div>

            {/* Value */}
            <p className={cn(
              "text-[26px] font-bold leading-none tracking-tight tabular-nums",
              card.alert ? "text-red-500" : "text-gray-900",
            )}>
              {card.value}
            </p>
            <p className="text-xs text-gray-400 mt-1.5">{card.sub}</p>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}
