"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  PlaySquare,
  Ticket,
  History,
  Bookmark,
  FileText,
} from "lucide-react";

import { LogoutButton } from "@/components/LogoutButton";

export function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ email: string; role: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => {
        if (d.user) setUser(d.user);
      })
      .catch(() => {});
  }, []);

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
        {user?.role === "admin" && (
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
        )}
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

        <Link
          href="/dashboard/reservations"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors ${
            pathname.startsWith("/dashboard/reservations")
              ? "bg-indigo-50 text-indigo-600"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Bookmark className="w-4 h-4" />
          Pre-Bookings
        </Link>
        <Link
          href="/dashboard/reports/daily"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors ${
            pathname.startsWith("/dashboard/reports/daily")
              ? "bg-indigo-50 text-indigo-600"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <FileText className="w-4 h-4" />
          Daily Report
        </Link>
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3 px-2 flex-1 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0 uppercase">
            {user?.email?.[0] || "A"}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-slate-700 truncate">{user?.email || "Admin"}</p>
            <p className="text-xs text-slate-400 capitalize">{user?.role || "Super User"}</p>
          </div>
        </div>
        <LogoutButton className="w-8 h-8 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors shrink-0" />
      </div>
    </aside>
  );
}
