import { MoveLeft, Film, Clock, Ticket, Shield } from "lucide-react";
import Link from "next/link";
import { fetchAllShows } from "@/lib/sheetHelpers";
import { formatTime12Hour } from "@/lib/utils";
import { BookingDateBar } from "@/components/BookingDateBar";

export const revalidate = 0;

const formatIsoDate = (iso: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

export default async function PublicShowsPage({
  searchParams,
}: {
  searchParams?: { date?: string };
}) {
  const allShows = await fetchAllShows();

  const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
  const todayIso = new Date().toISOString().split("T")[0];
  const showDateIso = searchParams?.date && isoDatePattern.test(searchParams.date)
    ? searchParams.date
    : todayIso;

  const activeShows = allShows.filter(
    (s) => s.isActive && s.startDate <= showDateIso && s.endDate >= showDateIso
  );

  const todayDate = new Date(`${showDateIso}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 relative via-[#f8fafc] to-indigo-50/30 selection:bg-indigo-100 font-sans">
      <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-indigo-50/60 to-transparent pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 rounded-xl text-sm font-medium transition-colors w-fit shadow-sm mb-8"
        >
          <MoveLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-200">
              <Ticket className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Available Shows</h1>
              <p className="text-slate-500 mt-1">
                Show date: <strong className="text-slate-700">{todayDate}</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="mb-10">
          <BookingDateBar label="Show date" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {activeShows.length > 0 ? activeShows.map((show) => {
            const movieSlug = show.movieTitle.replace(/\s+/g, '-').toLowerCase();
            return (
              <Link
                key={show.id}
                href={`/booking/${movieSlug}/${show.id}?date=${encodeURIComponent(showDateIso)}`}
                className="group flex flex-col p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-indigo-100 hover:border-indigo-200 transition-all duration-300 relative overflow-hidden h-full"
              >
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-10 transition-opacity duration-300">
                  <Film className="w-32 h-32 text-indigo-500 -mr-8 -mt-8" />
                </div>
                
                <div className="flex justify-between items-start mb-6 relative z-10 gap-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors duration-300">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
                      Booking Open
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border border-slate-200 bg-white text-slate-600">
                      <Shield className="w-3 h-3 text-slate-400" />
                      {show.rating}
                    </span>
                  </div>
                </div>

                <div className="relative z-10 mt-auto">
                  <h3 className="text-2xl font-bold mb-2 text-slate-800 group-hover:text-indigo-600 transition-colors">
                    {formatTime12Hour(show.showTime)}
                  </h3>
                  <p className="text-xs text-slate-400 mb-2">
                    Runs {formatIsoDate(show.startDate)} – {formatIsoDate(show.endDate)}
                  </p>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Film className="w-4 h-4" />
                    <span className="font-medium text-sm line-clamp-1">{show.movieTitle}</span>
                  </div>
                </div>
              </Link>
            )
          }) : (
            <div className="col-span-full flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
                <Ticket className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">No shows available</h3>
              <p className="text-slate-500 text-center max-w-md">There are currently no active screening times configured for today. Please check back later.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
