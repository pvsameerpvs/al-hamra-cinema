import { Sidebar } from "@/components/Sidebar";
import { MoveLeft, Film, Ticket, Shield } from "lucide-react";
import Link from "next/link";
import { fetchAllShows } from "@/lib/sheetHelpers";
import { BookingDateBar } from "@/components/BookingDateBar";

export const revalidate = 0;

const formatIsoDate = (iso: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

export default async function BookingSelectionPage({
  searchParams,
}: {
  searchParams?: { date?: string };
}) {
  const allShows = await fetchAllShows();

  const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
  const todayIso = new Date().toISOString().split("T")[0];
  const bookingDateIso = searchParams?.date && isoDatePattern.test(searchParams.date)
    ? searchParams.date
    : todayIso;
  const activeShows = allShows.filter(
    (s) => s.isActive && s.startDate <= bookingDateIso && s.endDate >= bookingDateIso
  );
  const bookingDateLabel = new Date(`${bookingDateIso}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Aggregate shows per movie to display campaign details
  const movieAggregate = new Map<string, { title: string; rating: string; minStart: string; maxEnd: string }>();
  for (const show of activeShows) {
    const existing = movieAggregate.get(show.movieTitle);
    if (!existing) {
      movieAggregate.set(show.movieTitle, {
        title: show.movieTitle,
        rating: show.rating,
        minStart: show.startDate,
        maxEnd: show.endDate,
      });
    } else {
      existing.minStart = existing.minStart < show.startDate ? existing.minStart : show.startDate;
      existing.maxEnd = existing.maxEnd > show.endDate ? existing.maxEnd : show.endDate;
    }
  }
  const uniqueMovies = Array.from(movieAggregate.values());

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 relative via-[#f8fafc] to-indigo-50/30 selection:bg-indigo-100 font-sans">
      <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-indigo-50/60 to-transparent pointer-events-none" />
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
                <h1 className="text-2xl font-bold text-slate-800">Select a Movie</h1>
                <p className="text-sm text-slate-400 mt-0.5">
                  Booking date: <strong className="text-slate-600">{bookingDateLabel}</strong>
                </p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <BookingDateBar />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {uniqueMovies.length > 0 ? uniqueMovies.map((show) => {
              const movieSlug = show.title.replace(/\s+/g, '-').toLowerCase();
              return (
                <Link
                  key={movieSlug}
                  href={`/booking/${movieSlug}?date=${encodeURIComponent(bookingDateIso)}`}
                  className="group flex flex-col items-center justify-center p-8 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-300 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-5 transition-opacity">
                    <Film className="w-24 h-24 text-indigo-500" />
                  </div>
                  <div className="w-16 h-16 mb-4 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                    <Film className="w-8 h-8" />
                  </div>
                  <span className="text-xl font-bold mb-1 text-slate-800 text-center">{show.title}</span>
                  <p className="text-xs text-slate-400 mb-2">Runs {formatIsoDate(show.minStart)} – {formatIsoDate(show.maxEnd)}</p>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border border-slate-200 bg-white text-slate-600 mb-2">
                    <Shield className="w-3 h-3 text-slate-400" />
                    {show.rating}
                  </span>
                  <span className="text-indigo-600 font-medium text-sm text-center line-clamp-1 px-4">View Show Times &rarr;</span>
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
