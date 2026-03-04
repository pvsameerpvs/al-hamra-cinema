import { Sidebar } from "@/components/Sidebar";
import { MoveLeft, Film, Clock, Ticket } from "lucide-react";
import Link from "next/link";
import { fetchAllShows } from "@/lib/sheetHelpers";
import { formatTime12Hour } from "@/lib/utils";

export const revalidate = 0;

export default async function BookingSelectionPage() {
  const allShows = await fetchAllShows();
  const activeShows = allShows.filter(s => s.isActive);

  const todayDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#f7f8fc] font-sans">
      <Sidebar />

      <div className="lg:pl-64">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
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
              <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center shadow-md shadow-indigo-200">
                <Ticket className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Select a Show Time</h1>
                <p className="text-sm text-slate-400 mt-0.5">
                  Bookings are open for today: <strong className="text-slate-600">{todayDate}</strong>
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeShows.length > 0 ? activeShows.map((show) => {
              const slug = show.showTime.replace(/\s+/g, '-');
              return (
                <Link
                  key={show.id}
                  href={`/booking/${slug}`}
                  className="group flex flex-col items-center justify-center p-8 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-300 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-5 transition-opacity">
                    <Film className="w-24 h-24 text-indigo-500" />
                  </div>
                  <div className="w-16 h-16 mb-4 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                    <Clock className="w-8 h-8" />
                  </div>
                  <span className="text-2xl font-bold mb-2 text-slate-800 text-center">{formatTime12Hour(show.showTime)}</span>
                  <span className="text-slate-500 font-medium text-sm text-center line-clamp-1 px-4">{show.movieTitle}</span>
                </Link>
              )
            }) : (
              <div className="col-span-1 sm:col-span-2 lg:col-span-3 text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
                <p className="text-slate-500 text-sm mb-4">No active shows configured for today.</p>
                <Link href="/dashboard/shows" className="text-indigo-500 hover:text-indigo-600 font-semibold text-sm">
                  Go to Dashboard to add some shows &rarr;
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
