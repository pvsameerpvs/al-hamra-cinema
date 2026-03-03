"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  MoveLeft,
  Loader2,
  History,
  Filter,
  Calendar,
  PlaySquare,
  X,
  Search,
  Download,
} from "lucide-react";
import Link from "next/link";
import { Booking, Show } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/Sidebar";
import { BookingsTable } from "@/components/BookingsTable";

export default function BookingsHistoryPage() {
  return (
    <Suspense fallback={<div className="p-16 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>}>
      <BookingsHistoryContent />
    </Suspense>
  );
}

function BookingsHistoryContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [shows, setShows] = useState<Show[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<string>(searchParams.get("movieId") || "all");
  const [selectedMonth, setSelectedMonth] = useState<string>(searchParams.get("filterMonth") || "");
  const [selectedDate, setSelectedDate] = useState<string>(searchParams.get("filterDate") || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const filteredBookings = bookings.filter(b => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (b.customerName || "").toLowerCase().includes(q) ||
      (b.phone || "").toLowerCase().includes(q) ||
      (b.email || "").toLowerCase().includes(q)
    );
  });

  const handleExportCSV = () => {
    if (filteredBookings.length === 0) return;

    const headers = ["Customer Name", "Phone", "Email", "Movie Title", "Show Time", "Seats", "Total Amount (AED)", "Payment Status", "Booking Date"];
    
    const csvRows = filteredBookings.map(b => {
      const cleanIds = (b.seatIds || "").replace(/\[.*?\]\s*/, "").split(", ").filter(s => s.trim() !== "");
      const timeMatch = (b.seatIds || "").match(/\[(.*?)\]/);
      const showTime = timeMatch ? timeMatch[1] : "N/A";
      const movieMatch = shows.find(s => s.showTime === showTime);
      const movieTitle = movieMatch ? movieMatch.movieTitle : "Unknown Movie";

      return [
        `"${b.customerName || ""}"`,
        `"${b.phone || ""}"`,
        `"${b.email || ""}"`,
        `"${movieTitle}"`,
        `"${showTime}"`,
        `"${cleanIds.join(", ")}"`,
        b.amount || 0,
        `"${b.paymentStatus || ""}"`,
        `"${b.createdAt || ""}"`
      ].join(",");
    });

    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `bookings_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const { toast } = useToast();

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (selectedMovie !== "all") queryParams.set("movieId", selectedMovie);
      if (selectedMonth) queryParams.set("filterMonth", selectedMonth);
      if (selectedDate) queryParams.set("filterDate", selectedDate);

      const res = await fetch(`/api/bookings?${queryParams.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load bookings");
      const data = await res.json();
      setBookings(data.bookings || []);
      setShows(data.shows || []);
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    
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

  return (
    <div className="min-h-screen bg-[#f7f8fc] font-sans">
      <Sidebar />
      <div className="lg:pl-64 max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Back */}
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 rounded-xl text-sm font-medium transition-colors w-fit shadow-sm mb-8"
        >
          <MoveLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shadow-sm">
              <History className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Booking History</h1>
              <p className="text-sm text-slate-400 mt-0.5">
                View all customer ticket purchases and transaction details.
              </p>
            </div>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <h3 className="font-semibold text-slate-700 text-sm whitespace-nowrap">
                All Transactions
                {!loading && (
                  <span className="ml-2 text-xs text-slate-400 font-normal">
                    ({filteredBookings.length} total)
                  </span>
                )}
              </h3>
              
              {/* Search Bar */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm min-w-[200px] sm:min-w-[250px] w-full sm:w-auto">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input 
                  type="text"
                  placeholder="Search customer, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none text-sm font-medium text-slate-700 focus:ring-0 outline-none w-full placeholder:text-slate-400 placeholder:font-normal"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Export Button */}
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 rounded-xl px-3 py-1.5 shadow-sm text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={filteredBookings.length === 0}
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>

              {/* Movie Filter */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
                <PlaySquare className="w-4 h-4 text-slate-400" />
                <select 
                  value={selectedMovie}
                  onChange={(e) => setSelectedMovie(e.target.value)}
                  className="bg-transparent border-none text-sm font-medium text-slate-700 focus:ring-0 cursor-pointer outline-none"
                >
                  <option value="all">All Movies</option>
                  {shows.map(show => (
                    <option key={show.id} value={show.id}>
                      {show.movieTitle} ({show.showTime})
                    </option>
                  ))}
                </select>
              </div>

              {/* Month Filter */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
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
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
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

          <BookingsTable bookings={filteredBookings} shows={shows} loading={loading} />
        </div>
      </div>
    </div>
  );
}
