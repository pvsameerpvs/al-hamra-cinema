"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  MoveLeft,
  Loader2,
  History,
  Ticket,
  User,
  Phone,
  Mail,
  CalendarDays,
  CreditCard,
  ChevronRight,
  Filter,
  Calendar,
  PlaySquare,
} from "lucide-react";
import Link from "next/link";
import { Booking, Show } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/Sidebar";

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
  const [loading, setLoading] = useState(true);
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
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-700 text-sm">
              All Transactions
              {!loading && (
                <span className="ml-2 text-xs text-slate-400 font-normal">
                  ({bookings.length} total)
                </span>
              )}
            </h3>
            {/* Server-Side Filters */}
            <div className="flex flex-wrap items-center gap-3">
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
            </div>
          </div>

          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mb-4" />
              <p className="text-slate-400 text-sm">Loading booking history…</p>
            </div>
          ) : bookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-xs text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-3.5 font-semibold">Customer</th>
                    <th className="px-6 py-3.5 font-semibold">Booking Details</th>
                    <th className="px-6 py-3.5 font-semibold">Payment</th>
                    <th className="px-6 py-3.5 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {bookings.map((booking) => {
                    const cleanIds = booking.seatIds.replace(/\[.*?\]\s*/, "").split(", ").filter(s => s.trim() !== "");
                    const ticketCount = cleanIds.length;
                    
                    const timeMatch = booking.seatIds.match(/\[(.*?)\]/);
                    const showTime = timeMatch ? timeMatch[1] : "N/A";
                    
                    const movieMatch = shows.find(s => s.showTime === showTime);
                    const movieTitle = movieMatch ? movieMatch.movieTitle : "Unknown Movie";

                    return (
                      <tr key={booking.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-indigo-400" />
                              <span className="font-bold text-slate-800 text-base">{booking.customerName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-500 text-xs mt-1">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              {booking.phone}
                            </div>
                            <div className="flex items-center gap-2 text-slate-500 text-xs">
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              {booking.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="inline-flex items-center justify-center px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md text-xs font-bold border border-indigo-100">
                                {ticketCount} {ticketCount === 1 ? 'Ticket' : 'Tickets'}
                              </span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800 text-sm">{movieTitle}</span>
                              </div>
                              <div className="flex items-center gap-2 text-slate-500 text-xs">
                                <span className="text-slate-600 font-medium">Time: {showTime}</span>
                              </div>
                              <div className="flex items-start gap-2 text-slate-500 text-xs mt-1">
                                <Ticket className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                <span className="max-w-[180px] leading-tight break-words">{cleanIds.join(", ")}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                              <CreditCard className="w-4 h-4 text-emerald-500" />
                              <span className="font-bold text-slate-800">{booking.amount} AED</span>
                            </div>
                            <div>
                               <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wide bg-emerald-50 text-emerald-600 border border-emerald-100">
                                {booking.paymentStatus}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          <div className="flex items-center gap-2">
                            <CalendarDays className="w-4 h-4 text-slate-400" />
                            {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            }) : "Unknown Date"}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                <History className="w-7 h-7 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium mb-1">No bookings yet</p>
              <p className="text-slate-400 text-sm mb-5">Transactions and history will appear here once purchases are made.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
