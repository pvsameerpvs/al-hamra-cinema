"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { DashboardCards } from "@/components/DashboardCards";
import { RevenueChart } from "@/components/RevenueChart";
import { Sidebar } from "@/components/Sidebar";
import { LogoutButton } from "@/components/LogoutButton";
import {
  Loader2,
  Ticket,
  RefreshCw,
  Bell,
  ChevronRight,
  Filter,
  Calendar,
  PlaySquare,
  X,
} from "lucide-react";
import Link from "next/link";
import { Show } from "@/lib/types";

interface DashboardStats {
  totalTicketsSold: number;
  totalBookings: number;
  totalRevenue: number;
  monthlyTicketsSold: number;
  monthlyBookings: number;
  monthlyRevenue: number;
  chartData: Array<{ name: string; revenue: number }>;
  userRole?: string;
}

let cachedStats: DashboardStats | null = null;

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-16 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [stats, setStats] = useState<DashboardStats | null>(cachedStats);
  const [shows, setShows] = useState<Show[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<string>(searchParams.get("movieId") || "all");
  const [selectedMonth, setSelectedMonth] = useState<string>(searchParams.get("filterMonth") || "");
  const [selectedDate, setSelectedDate] = useState<string>(searchParams.get("filterDate") || "");
  const [loading, setLoading] = useState(!cachedStats);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchStats = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else if (!cachedStats) setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (selectedMovie !== "all") queryParams.set("movieId", selectedMovie);
      if (selectedMonth) queryParams.set("filterMonth", selectedMonth);
      if (selectedDate) queryParams.set("filterDate", selectedDate);
      
      const [resStats, resShows] = await Promise.all([
        fetch(`/api/dashboard?${queryParams.toString()}`, { cache: "no-store" }),
        fetch("/api/shows", { cache: "no-store" })
      ]);
      
      if (!resStats.ok) throw new Error("Failed to load stats");
      
      const data: DashboardStats = await resStats.json();
      const showsData: Show[] = resShows.ok ? await resShows.json() : [];
      
      cachedStats = data;
      setStats(data);
      setShows(showsData.filter(s => s.isActive));
    } catch (err: unknown) {
      if (!cachedStats) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    const params = new URLSearchParams(searchParams.toString());
    if (selectedMovie && selectedMovie !== "all") params.set("movieId", selectedMovie);
    else params.delete("movieId");
    
    if (selectedMonth) params.set("filterMonth", selectedMonth);
    else params.delete("filterMonth");
    
    if (selectedDate) params.set("filterDate", selectedDate);
    else params.delete("filterDate");
    
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMovie, selectedMonth, selectedDate]);

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
      <Sidebar />

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
              <LogoutButton className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors" />
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
                {stats.userRole === "admin" && (
                  <Link
                    href="/dashboard/shows"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur rounded-lg text-sm font-medium text-white transition-colors"
                  >
                    <PlaySquare className="w-4 h-4" />
                    Manage Shows
                    <ChevronRight className="w-3 h-3 -ml-1" />
                  </Link>
                )}
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                Overview
              </h3>
              
              {/* Server-Side Filters */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Movie Filter */}
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
                  <PlaySquare className="w-4 h-4 text-slate-400" />
                  <select 
                    value={selectedMovie}
                    onChange={(e) => setSelectedMovie(e.target.value)}
                    className="bg-transparent border-none text-sm font-medium text-slate-700 focus:ring-0 cursor-pointer outline-none"
                  >
                    <option value="all">All Movies</option>
                    {Array.from(new Set(shows.map(s => s.movieTitle))).map(title => (
                      <option key={title} value={title}>
                        {title}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Month Filter */}
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <input 
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => {
                       setSelectedMonth(e.target.value);
                       if (e.target.value) setSelectedDate(""); 
                    }}
                    className="bg-transparent border-none text-sm font-medium text-slate-700 focus:ring-0 cursor-pointer outline-none w-32"
                  />
                </div>

                {/* Date Filter */}
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <input 
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                       setSelectedDate(e.target.value);
                       if (e.target.value) setSelectedMonth("");
                    }}
                    className="bg-transparent border-none text-sm font-medium text-slate-700 focus:ring-0 cursor-pointer outline-none w-32"
                  />
                </div>

                {/* Reset Filters */}
                {(selectedMovie !== "all" || selectedMonth !== "" || selectedDate !== "") && (
                  <button
                    onClick={() => {
                      setSelectedMovie("all");
                      setSelectedMonth("");
                      setSelectedDate("");
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors border border-transparent hover:border-red-100 shadow-sm"
                  >
                    <X className="w-3.5 h-3.5" />
                    Reset
                  </button>
                )}
              </div>
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
