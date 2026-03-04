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
    sub: (stats: DashboardStats) => `${stats.totalTicketsSold.toLocaleString()} total tickets`,
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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 w-full">
      {cards.map((card) => {
        const Icon = card.icon;
        const value = stats[card.key] as number;
        return (
          <div
            key={card.key}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-4 hover:shadow-md transition-shadow"
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
            <div>
              <p className="text-2xl font-bold text-slate-800 tabular-nums">
                {card.format(value)}
              </p>
              <p className="text-sm font-medium text-slate-500 mt-1">{card.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{card.sub(stats)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
