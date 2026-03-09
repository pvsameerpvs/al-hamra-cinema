"use client";

import { DollarSign, Ticket, Calendar, TrendingUp, ArrowUp } from "lucide-react";

interface DashboardStats {
  totalTicketsSold: number;
  totalBookings: number;
  totalRevenue: number;
  monthlyTicketsSold: number;
  monthlyBookings: number;
  monthlyRevenue: number;
}

const cards = [
  {
    key: "totalBookings" as keyof DashboardStats,
    label: "Total Bookings",
    sub: (stats: DashboardStats) => `${stats.totalTicketsSold.toLocaleString()} tickets sold`,
    icon: Ticket,
    color: "bg-violet-50",
    iconColor: "text-violet-500",
    badge: "bg-violet-500",
    format: (v: number) => v.toLocaleString(),
  },
  {
    key: "totalRevenue" as keyof DashboardStats,
    label: "Total Revenue",
    sub: () => "Lifetime revenue",
    icon: DollarSign,
    color: "bg-emerald-50",
    iconColor: "text-emerald-500",
    badge: "bg-emerald-500",
    format: (v: number) => `${v.toLocaleString()} AED`,
  },
  {
    key: "monthlyBookings" as keyof DashboardStats,
    label: "Monthly Bookings",
    sub: (stats: DashboardStats) => `${stats.monthlyTicketsSold.toLocaleString()} tickets this month`,
    icon: Calendar,
    color: "bg-amber-50",
    iconColor: "text-amber-500",
    badge: "bg-amber-500",
    format: (v: number) => v.toLocaleString(),
  },
  {
    key: "monthlyRevenue" as keyof DashboardStats,
    label: "Monthly Revenue",
    sub: () => "Revenue this month",
    icon: TrendingUp,
    color: "bg-indigo-50",
    iconColor: "text-indigo-500",
    badge: "bg-indigo-500",
    format: (v: number) => `${v.toLocaleString()} AED`,
  },
];

export function DashboardCards({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid w-full auto-rows-fr gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const value = stats[card.key] as number;
        return (
          <div
            key={card.key}
            className="flex h-full flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                <ArrowUp className="w-3 h-3" />
                Live
              </span>
            </div>

            <div className="mt-5 flex flex-1 flex-col justify-end">
              <p className="text-[clamp(22px,2.2vw,30px)] font-bold leading-none text-slate-900 tabular-nums">
                {card.format(value)}
              </p>
              <p className="mt-3 text-sm font-semibold text-slate-700">{card.label}</p>
              <p className="mt-1 text-xs font-medium leading-snug text-slate-500">
                {card.sub(stats)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
