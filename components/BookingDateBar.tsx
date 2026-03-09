"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays } from "lucide-react";

export function BookingDateBar({
  label = "Booking date",
}: {
  label?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const todayIso = useMemo(() => new Date().toISOString().split("T")[0], []);
  const current = searchParams.get("date") || todayIso;

  const isPreBooking = current > todayIso;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <CalendarDays className="h-4 w-4 text-slate-400" />
        {label}
        {isPreBooking ? (
          <span className="ml-2 inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
            Pre-booking
          </span>
        ) : (
          <span className="ml-2 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
            Today
          </span>
        )}
      </div>

      <input
        type="date"
        value={current}
        min={todayIso}
        onChange={(e) => {
          const next = e.target.value;
          const params = new URLSearchParams(searchParams.toString());
          if (next) params.set("date", next);
          else params.delete("date");
          const qs = params.toString();
          router.replace(`${pathname}${qs ? `?${qs}` : ""}`);
        }}
        className="h-10 w-40 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition-colors hover:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
      />
    </div>
  );
}
