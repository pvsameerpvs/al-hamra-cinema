"use client";

import Link from "next/link";
import { Ticket } from "lucide-react";

import { LogoutButton } from "@/components/LogoutButton";

export function DashboardTopbar() {
  return (
    <div className="print:hidden lg:hidden sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur">
      <div className="px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
            <Ticket className="w-4 h-4" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold text-slate-800">Al-Hamra</div>
            <div className="text-xs text-slate-400">Cinema Admin</div>
          </div>
        </Link>

        <LogoutButton className="w-9 h-9 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors" />
      </div>
    </div>
  );
}
