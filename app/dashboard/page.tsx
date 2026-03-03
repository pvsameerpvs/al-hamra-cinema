"use client";

import { useEffect, useState } from "react";
import { DashboardCards } from "@/components/DashboardCards";
import { RevenueChart } from "@/components/RevenueChart";
import {
  Loader2,
  Ticket,
  RefreshCw,
  PlaySquare,
  LayoutDashboard,
  Bell,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  totalTicketsSold: number;
  totalRevenue: number;
  monthlyTicketsSold: number;
  monthlyRevenue: number;
  chartData: Array<{ name: string; revenue: number }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchStats = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load stats");
      const data: DashboardStats = await res.json();
      setStats(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f7f8fc]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-md flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
          <p className="text-slate-500 font-medium">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f7f8fc]">
        <div className="bg-white border border-red-100 rounded-2xl p-8 shadow text-center max-w-sm">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="font-semibold text-slate-800 mb-2">Failed to Load</h3>
          <p className="text-sm text-slate-500 mb-4">{error}</p>
          <button
            onClick={() => fetchStats()}
            className="px-4 py-2 bg-indigo-500 text-white text-sm rounded-lg hover:bg-indigo-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen bg-[#f7f8fc] font-sans">
      {/* Sidebar */}
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
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-indigo-50 text-indigo-600 font-medium text-sm"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
          <Link
            href="/dashboard/shows"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 font-medium text-sm transition-colors"
          >
            <PlaySquare className="w-4 h-4" />
            Manage Shows
          </Link>
          <Link
            href="/booking"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 font-medium text-sm transition-colors"
          >
            <Ticket className="w-4 h-4" />
            New Booking
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

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
              <p className="text-xs text-slate-400 mt-0.5">{dateStr}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchStats(true)}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors disabled:opacity-60"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <div className="relative">
                <button className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
                  <Bell className="w-4 h-4 text-slate-600" />
                </button>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full" />
              </div>
              <Link
                href="/booking"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold shadow-md shadow-indigo-200 transition-all hover:scale-[1.02]"
              >
                <Ticket className="w-4 h-4" />
                <span className="hidden sm:inline">New Booking</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
          {/* Welcome Banner */}
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200">
            <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full" />
            <div className="absolute -right-4 bottom-0 w-32 h-32 bg-white/5 rounded-full" />
            <div className="relative z-10">
              <p className="text-indigo-100 text-sm font-medium mb-1">Welcome back!</p>
              <h2 className="text-2xl font-bold mb-3">Al-Hamra Cinema Admin</h2>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/dashboard/shows"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur rounded-lg text-sm font-medium text-white transition-colors"
                >
                  <PlaySquare className="w-4 h-4" />
                  Manage Shows
                  <ChevronRight className="w-3 h-3 -ml-1" />
                </Link>
                <Link
                  href="/booking"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 hover:bg-indigo-50 rounded-lg text-sm font-semibold transition-colors shadow"
                >
                  <Ticket className="w-4 h-4" />
                  Sell Tickets
                </Link>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                Overview
              </h3>
            </div>
            <DashboardCards stats={stats} />
          </div>

          {/* Revenue Chart */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                Revenue Trend
              </h3>
            </div>
            <RevenueChart data={stats.chartData} />
          </div>
        </main>
      </div>
    </div>
  );
}
