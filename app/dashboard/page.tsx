"use client";

import { useEffect, useState } from "react";
import { DashboardCards } from "@/components/DashboardCards";
import { RevenueChart } from "@/components/RevenueChart";
import { Loader2, Ticket, RefreshCw } from "lucide-react";
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
  const [error, setError] = useState("");

  const fetchStats = async () => {
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
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
        <p className="text-destructive bg-destructive/10 border border-destructive/20 p-4 rounded-lg">Error: {error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
        <p className="text-muted-foreground bg-muted/40 border border-border p-4 rounded-lg">
          No dashboard data available.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Overview of cinema bookings and revenue
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={fetchStats}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium transition-colors hover:bg-secondary/80 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh Data</span>
            </button>
            <Link
              href="/booking"
              className="px-6 py-2 bg-primary text-primary-foreground rounded-md text-sm font-semibold transition-transform hover:scale-105 shadow-lg shadow-primary/20 flex items-center gap-2"
            >
              <Ticket className="w-5 h-5" />
              New Booking 🎫
            </Link>
          </div>
        </div>

        <DashboardCards stats={stats} />
        
        <RevenueChart data={stats.chartData} />
      </div>
    </div>
  );
}
