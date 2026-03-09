import { SeatGrid } from "@/components/SeatGrid";
import { MoveLeft } from "lucide-react";
import Link from "next/link";
import { formatTime12Hour, isShowStartInPastDubai } from "@/lib/utils";
import { fetchAllShows } from "@/lib/sheetHelpers";
import { HomeHeader } from "@/components/home/HomeHeader";

export const revalidate = 0;

export default async function ShowTimeBookingPage({
  params,
  searchParams,
}: {
  params: { movieSlug: string; showId: string };
  searchParams?: { date?: string };
}) {
  const allShows = await fetchAllShows();
  const activeShows = allShows.filter(s => s.isActive);
  
  // Find the exact show matching explicitly by ID
  const show = activeShows.find(s => s.id === params.showId);

  if (!show) {
    return (
      <div className="min-h-screen bg-[#f7f8fc] font-sans">
        <HomeHeader />
        <div className="flex flex-col items-center justify-center p-16 pt-32">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Show Not Found</h2>
          <p className="text-slate-500 mb-4">This show time is inactive or does not exist.</p>
          <Link href={`/booking/${params.movieSlug}`} className="text-indigo-600 font-medium">
            &larr; Back to shows
          </Link>
        </div>
      </div>
    );
  }

  const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
  const todayIso = new Date().toISOString().split("T")[0];
  const showDateIso = searchParams?.date && isoDatePattern.test(searchParams.date)
    ? searchParams.date
    : todayIso;
  const showDateLabel = new Date(`${showDateIso}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const isPastDate = showDateIso < todayIso;
  const isPastTime = showDateIso === todayIso && isShowStartInPastDubai(showDateIso, show.showTime);
  const bookingClosed = isPastDate || isPastTime;

  if (bookingClosed) {
    return (
      <div className="min-h-screen bg-[#f7f8fc] font-sans">
        <HomeHeader />
        <div className="flex flex-col items-center justify-center p-16 pt-32 text-center">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Booking Closed</h2>
          <p className="text-slate-500 mb-6">
            This show time has already passed for <strong className="text-slate-700">{showDateLabel}</strong>.
          </p>
          <Link href={`/booking/${params.movieSlug}?date=${encodeURIComponent(showDateIso)}`} className="text-indigo-600 font-medium">
            &larr; Back to shows
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc] font-sans pb-20">
      <HomeHeader />

      <div className="mx-auto w-full max-w-7xl pt-24 md:pt-28">
        <section className="mx-auto max-w-5xl px-4 pb-6 md:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <Link
              href={`/booking/${params.movieSlug}?date=${encodeURIComponent(showDateIso)}`}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 rounded-xl text-sm font-medium transition-colors w-fit shadow-sm"
            >
              <MoveLeft className="w-4 h-4" />
              Back to {show.movieTitle} Shows
            </Link>
          </div>
          
          <div className="bg-white border border-slate-100 rounded-2xl p-6 text-center mb-0 mt-4 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-violet-500"></div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-800">
              {show.movieTitle} at <span className="text-indigo-600">{formatTime12Hour(show.showTime)}</span>
            </h1>
            <p className="text-slate-500 mt-2 text-sm">
              Select seats for <strong className="text-slate-700">{showDateLabel}</strong>.
            </p>
          </div>
        </section>

        <section
          id="seats"
          className="mx-auto max-w-5xl px-4 md:px-6"
        >
          <SeatGrid showId={show.id} showTime={show.showTime} showDate={showDateIso} movieTitle={show.movieTitle} />
        </section>
      </div>
    </div>
  );
}
