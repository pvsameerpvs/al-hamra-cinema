"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PlaySquare,
  Ticket,
  History,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed top-0 left-0 h-full w-64 bg-white border-r border-slate-100 z-20 flex flex-col shadow-sm hidden lg:flex">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center shadow-md shadow-indigo-200">
            <span className="text-white text-lg">🎬</span>
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm leading-tight">Al-Hamra</p>
            <p className="text-xs text-slate-400 leading-tight">Cinema Admin</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-3">
          Main Menu
        </p>
        <Link
          href="/dashboard"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors ${
            pathname === "/dashboard"
              ? "bg-indigo-50 text-indigo-600"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </Link>
        <Link
          href="/dashboard/shows"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors ${
            pathname === "/dashboard/shows"
              ? "bg-indigo-50 text-indigo-600"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <PlaySquare className="w-4 h-4" />
          Manage Shows
        </Link>
        <Link
          href="/booking"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors ${
            pathname.startsWith("/booking")
              ? "bg-indigo-50 text-indigo-600"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Ticket className="w-4 h-4" />
          New Booking
        </Link>
        <Link
          href="/dashboard/bookings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors ${
            pathname === "/dashboard/bookings"
              ? "bg-indigo-50 text-indigo-600"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <History className="w-4 h-4" />
          Booking History
        </Link>
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-100">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
            A
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-700">Admin</p>
            <p className="text-xs text-slate-400">Super User</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
