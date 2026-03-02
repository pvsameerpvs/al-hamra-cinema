"use client";

import { useEffect, useState } from "react";
import { DashboardCards } from "@/components/DashboardCards";
import { RevenueChart } from "@/components/RevenueChart";
import { Loader2 } from "lucide-react";

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
      <div className="flex flex-col items-center justify-center min-h-screen text-zinc-100 bg-zinc-950">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-zinc-100 bg-zinc-950">
        <p className="text-red-500 bg-red-500/10 p-4 rounded-lg">Error: {error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-zinc-100 bg-zinc-950">
        <p className="text-zinc-400 bg-zinc-900/50 p-4 rounded-lg">
          No dashboard data available.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-zinc-400 mt-2">
              Overview of cinema bookings and revenue
            </p>
          </div>
          <button
            onClick={fetchStats}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium transition-colors hover:bg-primary/90 hidden sm:block"
          >
            Refresh Data
          </button>
        </div>

        <DashboardCards stats={stats} />
        
        <RevenueChart data={stats.chartData} />
      </div>
    </div>
  );
}
