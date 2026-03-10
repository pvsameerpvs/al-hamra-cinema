"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { MoveLeft, Loader2, Search, CalendarDays, X, Ticket, Trash2 } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { useToast } from "@/hooks/use-toast";
import type { Booking, Seat, Show } from "@/lib/types";
import { formatTime12Hour, isShowStartInPastDubai } from "@/lib/utils";
import { ReceiptTicket } from "@/components/ReceiptTicket";

export default function PreBookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      }
    >
      <PreBookingsContent />
    </Suspense>
  );
}

function PreBookingsContent() {
  const { toast } = useToast();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("user");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedShowDate, setSelectedShowDate] = useState<string>("");

  // Recompute time-based filtering without requiring a manual refresh.
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 30 * 1000);
    return () => window.clearInterval(id);
  }, []);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [printPayload, setPrintPayload] = useState<null | {
    movieTitle: string;
    showTime: string;
    showDate: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    seats: Seat[];
    totalAmount: number;
    paymentMethod: string;
  }>(null);

  const fetchPreBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bookings", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load pre-bookings");
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
    fetchPreBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d?.user?.role) setUserRole(String(d.user.role));
      })
      .catch(() => {});
  }, []);

  const deleteBooking = async (bookingId: string) => {
    const ok = window.confirm("Delete this booking? This cannot be undone.");
    if (!ok) return;

    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(bookingId)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.error || "Failed to delete booking");
      }
      toast({ title: "Deleted", description: "Booking removed." });
      await fetchPreBookings();
    } catch (err: unknown) {
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const todayIso = new Date().toISOString().split("T")[0];

  const list = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    // Pre-bookings = upcoming show dates (today + future).
    let base = bookings.filter((b) => {
      const showDate = b.showDate || (b.createdAt ? b.createdAt.split("T")[0] : "");
      if (!showDate) return false;
      if (showDate < todayIso) return false;
      if (showDate > todayIso) return true;

      // Today: hide bookings after show time starts.
      const bracketMatch = (b.seatIds || "").match(/\[(.*?)\]/);
      const bracketValue = bracketMatch ? bracketMatch[1] : "";
      const show = shows.find((s) => s.id === bracketValue) || shows.find((s) => s.showTime === bracketValue);
      const showTime = show?.showTime || bracketValue;
      if (!showTime) return true;
      return !isShowStartInPastDubai(showDate, showTime, nowMs);
    });

    if (selectedShowDate) {
      base = base.filter((b) => (b.showDate || "") === selectedShowDate);
    }

    if (q) {
      base = base.filter((b) => {
        const seats = (b.seatIds || "").toLowerCase();
        const name = (b.customerName || "").toLowerCase();
        const phone = (b.phone || "").toLowerCase();
        const email = (b.email || "").toLowerCase();

        const bracketMatch = (b.seatIds || "").match(/\[(.*?)\]/);
        const bracketValue = bracketMatch ? bracketMatch[1] : "";
        const show = shows.find((s) => s.id === bracketValue) || shows.find((s) => s.showTime === bracketValue);
        const movie = (show?.movieTitle || "").toLowerCase();

        return seats.includes(q) || name.includes(q) || phone.includes(q) || email.includes(q) || movie.includes(q);
      });
    }

    return base;
  }, [bookings, searchQuery, selectedShowDate, shows, todayIso, nowMs]);

  const doPrint = (customerName: string, phone: string) => {
    const originalTitle = document.title;
    const safeName = (customerName || "").replace(/[^a-zA-Z0-9]/g, "");
    const last4Phone = (phone || "").trim().slice(-4);
    document.title = `${safeName}-${last4Phone}`;
    document.body.dataset.print = "receipt";

    const styleEl = document.createElement("style");
    styleEl.setAttribute("data-print-style", "receipt");
    styleEl.media = "print";
    styleEl.textContent = `@page { margin: 0; size: 80mm auto; }`;
    document.head.appendChild(styleEl);

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      delete document.body.dataset.print;
      styleEl.remove();
      document.title = originalTitle;
      setPrintPayload(null);
    };

    window.addEventListener("afterprint", cleanup, { once: true });
    window.addEventListener("focus", cleanup, { once: true });
    window.print();
  };

  useEffect(() => {
    if (!mounted || !printPayload) return;
    const t = window.setTimeout(() => {
      doPrint(printPayload.customerName, printPayload.customerPhone);
    }, 50);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, printPayload]);

  const parsePaymentMethod = (paymentStatusRaw: string) => {
    const raw = String(paymentStatusRaw || "").trim();
    const m = raw.match(/paid\s*-\s*(.+)$/i);
    return (m ? m[1] : raw) || "CASH";
  };

  const printBooking = async (b: Booking) => {
    try {
      const bracketMatch = (b.seatIds || "").match(/\[(.*?)\]/);
      const bracketValue = bracketMatch ? bracketMatch[1] : "";
      const show = shows.find((s) => s.id === bracketValue) || shows.find((s) => s.showTime === bracketValue);
      const showId = show?.id || bracketValue;
      const movieTitle = show?.movieTitle || "Al Hamra Cinema Show";
      const showTime = show?.showTime ? formatTime12Hour(show.showTime) : "N/A";
      const showDate = b.showDate || (b.createdAt ? b.createdAt.split("T")[0] : "");
      if (!showId || !showDate) throw new Error("Missing show info for printing");

      const cleanSeatIds = (b.seatIds || "")
        .replace(/\[.*?\]\s*/, "")
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s !== "");

      const seatsRes = await fetch(
        `/api/seats?showId=${encodeURIComponent(showId)}&date=${encodeURIComponent(showDate)}`,
        { cache: "no-store" }
      );
      if (!seatsRes.ok) throw new Error("Failed to load seat data for printing");
      const allSeats: Seat[] = await seatsRes.json();
      const chosen = new Set<string>(cleanSeatIds);
      const selectedSeats = allSeats.filter((s) => chosen.has(s.seat_id));
      if (chosen.size > 0 && selectedSeats.length === 0) {
        throw new Error("Could not match seats for printing");
      }

      setPrintPayload({
        movieTitle,
        showTime,
        showDate,
        customerName: b.customerName,
        customerPhone: b.phone,
        customerEmail: b.email,
        seats: selectedSeats,
        totalAmount: Number(b.amount) || 0,
        paymentMethod: parsePaymentMethod(b.paymentStatus),
      });
    } catch (err: unknown) {
      toast({
        title: "Print Failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8fc] font-sans">
      <Sidebar />
      <div className="lg:pl-64 max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 rounded-xl text-sm font-medium transition-colors w-fit shadow-sm mb-8"
        >
          <MoveLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shadow-sm">
              <Ticket className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Pre-Bookings</h1>
              <p className="text-sm text-slate-400 mt-0.5">Paid bookings for upcoming shows (today and future).</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <h3 className="font-semibold text-slate-700 text-sm whitespace-nowrap">
                Pre-Bookings
                {!loading && (
                  <span className="ml-2 text-xs text-slate-400 font-normal">({list.length} total)</span>
                )}
              </h3>

              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm min-w-[220px] w-full sm:w-auto">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search customer, seats, movie…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none text-sm font-medium text-slate-700 focus:ring-0 outline-none w-full placeholder:text-slate-400 placeholder:font-normal"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
                <CalendarDays className="w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={selectedShowDate}
                  onChange={(e) => setSelectedShowDate(e.target.value)}
                  className="bg-transparent border-none text-sm font-medium text-slate-700 focus:ring-0 cursor-pointer outline-none w-36"
                />
              </div>

              {(searchQuery || selectedShowDate) && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedShowDate("");
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors border border-transparent hover:border-red-100 shadow-sm"
                >
                  <X className="w-3.5 h-3.5" />
                  Reset
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mb-4" />
              <p className="text-slate-400 text-sm">Loading pre-bookings…</p>
            </div>
          ) : list.length === 0 ? (
            <div className="p-16 text-center">
              <p className="text-slate-500 font-medium mb-1">No pre-bookings</p>
              <p className="text-slate-400 text-sm">Upcoming paid bookings will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-xs text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-3.5 font-semibold">Customer</th>
                    <th className="px-6 py-3.5 font-semibold">Show</th>
                    <th className="px-6 py-3.5 font-semibold">Seats</th>
                    <th className="px-6 py-3.5 font-semibold">Payment</th>
                    <th className="px-6 py-3.5 font-semibold">Booked At</th>
                    <th className="px-6 py-3.5 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {list.map((b) => {
                    const bracketMatch = (b.seatIds || "").match(/\[(.*?)\]/);
                    const bracketValue = bracketMatch ? bracketMatch[1] : "";

                    const show = shows.find((s) => s.id === bracketValue) || shows.find((s) => s.showTime === bracketValue);
                    const movieTitle = show?.movieTitle || "Unknown";
                    const showTime = show?.showTime ? formatTime12Hour(show.showTime) : "N/A";
                    const showDate = b.showDate || (b.createdAt ? b.createdAt.split("T")[0] : "");
                    const showDateLabel = showDate
                      ? new Date(`${showDate}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      : "";

                    const seatList = (b.seatIds || "")
                      .replace(/\[.*?\]\s*/, "")
                      .split(",")
                      .map((s) => s.trim())
                      .filter((s) => s !== "");

                    const bookedAtLabel = b.createdAt
                      ? new Date(b.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                      : "";

                    return (
                      <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">{b.customerName}</div>
                          <div className="text-xs text-slate-500 mt-1">{b.phone} · {b.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">{movieTitle}</div>
                          <div className="text-xs text-slate-500 mt-1">{showDateLabel} · {showTime}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-800">{seatList.length} seat(s)</div>
                          <div className="text-xs text-slate-500 mt-1 max-w-[240px] break-words">{seatList.join(", ")}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">{b.amount} AED</div>
                          <div className="text-xs text-slate-500 mt-1">{b.paymentStatus}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 text-sm">{bookedAtLabel}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => printBooking(b)}
                              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:border-slate-300"
                            >
                              Print
                            </button>
                            {userRole === "admin" && (
                              <button
                                type="button"
                                onClick={() => deleteBooking(b.id)}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 shadow-sm transition-colors hover:bg-red-100"
                                title="Delete booking"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {printPayload && mounted && typeof document !== "undefined" &&
        createPortal(
          <ReceiptTicket
            movieTitle={printPayload.movieTitle}
            showTime={printPayload.showTime}
            showDate={printPayload.showDate}
            customerName={printPayload.customerName}
            customerPhone={printPayload.customerPhone}
            customerEmail={printPayload.customerEmail}
            seats={printPayload.seats}
            totalAmount={printPayload.totalAmount}
            paymentMethod={printPayload.paymentMethod}
          />,
          document.body
        )}
    </div>
  );
}
