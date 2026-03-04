import { SeatGrid } from "@/components/SeatGrid";
import { HomeHeader } from "@/components/home/HomeHeader";
import { MoveLeft } from "lucide-react";
import Link from "next/link";
import { formatTime12Hour } from "@/lib/utils";

export default function ShowTimeBookingPage({ params }: { params: { slug: string } }) {
  // slug might be "10-00-AM"
  const rawTime = decodeURIComponent(params.slug).replace(/-/g, " ").replace(" AM", " AM").replace(" PM", " PM");

  return (
    <div className="min-h-screen bg-[#f7f8fc] font-sans">
      <HomeHeader />

      <section className="mx-auto max-w-7xl px-4 pt-28 md:pt-32 pb-6 md:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <Link
            href="/booking"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 rounded-xl text-sm font-medium transition-colors w-fit shadow-sm"
          >
            <MoveLeft className="w-4 h-4" />
            Back to Show Times
          </Link>
        </div>
        
        <div className="bg-white border border-slate-100 rounded-2xl p-6 text-center mb-8 shadow-sm">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-800">
            Booking for <span className="text-indigo-600">{formatTime12Hour(rawTime)}</span>
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            Only seats available for this specific time are shown below.
          </p>
        </div>
      </section>

      <section
        id="seats"
        className="mx-auto max-w-7xl px-4 pb-20 md:px-8"
      >
        <SeatGrid showTime={rawTime} />
      </section>
    </div>
  );
}
