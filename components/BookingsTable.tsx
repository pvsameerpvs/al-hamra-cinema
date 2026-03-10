import { User, Phone, Mail, Ticket, CreditCard, CalendarDays, History, Loader2, Trash2 } from "lucide-react";
import { Booking, Show } from "@/lib/types";

interface BookingsTableProps {
  bookings: Booking[];
  shows: Show[];
  loading: boolean;
  canDelete?: boolean;
  onDelete?: (bookingId: string) => void;
}

export function BookingsTable({ bookings, shows, loading, canDelete, onDelete }: BookingsTableProps) {
  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mb-4" />
        <p className="text-slate-400 text-sm">Loading booking history…</p>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="p-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
          <History className="w-7 h-7 text-slate-300" />
        </div>
        <p className="text-slate-500 font-medium mb-1">No bookings yet</p>
        <p className="text-slate-400 text-sm mb-5">Transactions and history will appear here once purchases are made.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="text-xs text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100">
            <th className="px-6 py-3.5 font-semibold">Customer</th>
            <th className="px-6 py-3.5 font-semibold">Booking Details</th>
            <th className="px-6 py-3.5 font-semibold">Payment</th>
            <th className="px-6 py-3.5 font-semibold">Date</th>
            {canDelete ? <th className="px-6 py-3.5 font-semibold">Action</th> : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {bookings.map((booking) => {
            const cleanIds = booking.seatIds.replace(/\[.*?\]\s*/, "").split(", ").filter(s => s.trim() !== "");
            const ticketCount = cleanIds.length;
            
            const timeMatch = booking.seatIds.match(/\[(.*?)\]/);
            const bracketValue = timeMatch ? timeMatch[1] : "N/A";
            
            // Forward compatible: ID binding
            let movieMatch = shows.find(s => s.id === bracketValue);

            // Backward compatible: Time string binding
            if (!movieMatch) {
              movieMatch = shows.find(s => s.showTime === bracketValue);
            }
            
            const showTime = movieMatch ? movieMatch.showTime : bracketValue;
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
                      {booking.showDate ? (
                        <div className="flex items-center gap-2 text-slate-500 text-xs">
                          <span className="text-slate-600 font-medium">
                            Show Date:{" "}
                            {new Date(`${booking.showDate}T00:00:00`).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      ) : null}
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
                {canDelete ? (
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => onDelete?.(booking.id)}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 shadow-sm transition-colors hover:bg-red-100"
                      title="Delete booking"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
