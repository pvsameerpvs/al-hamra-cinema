import { SeatGrid } from "@/components/SeatGrid";
import { HomeHeader } from "@/components/home/HomeHeader";
import { MoveLeft } from "lucide-react";
import Link from "next/link";

export default function ShowTimeBookingPage({ params }: { params: { slug: string } }) {
  // slug might be "10-00-AM"
  const rawTime = decodeURIComponent(params.slug).replace(/-/g, " ").replace(" AM", " AM").replace(" PM", " PM");

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary-foreground">
      <HomeHeader />

      <section className="mx-auto max-w-7xl px-4 pt-28 md:pt-32 pb-6 md:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <Link
            href="/booking"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-border bg-card hover:bg-muted text-foreground rounded-md text-sm font-medium transition-colors w-fit"
          >
            <MoveLeft className="w-4 h-4" />
            Back to Show Times
          </Link>
        </div>
        
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">
            Booking for {rawTime}
          </h1>
          <p className="text-muted-foreground mt-2">
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
    </main>
  );
}
