import { HomeHeader } from "@/components/home/HomeHeader";
import { MoveLeft, Film, Clock } from "lucide-react";
import Link from "next/link";
import { fetchAllShows } from "@/lib/sheetHelpers";

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
    <main className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary-foreground">
      <HomeHeader />

      <section className="mx-auto max-w-7xl px-4 pt-28 md:pt-32 pb-6 md:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-border bg-card hover:bg-muted text-foreground rounded-md text-sm font-medium transition-colors w-fit"
          >
            <MoveLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
        
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Select a Show Time</h1>
          <p className="text-muted-foreground text-lg md:text-xl">
            Bookings are currently open only for today: <strong className="text-primary">{todayDate}</strong>
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {activeShows.length > 0 ? activeShows.map((show) => {
            const slug = show.showTime.replace(/\s+/g, '-');
            return (
              <Link
                key={show.id}
                href={`/booking/${slug}`}
                className="group flex flex-col items-center justify-center p-8 border border-border bg-card hover:border-primary hover:bg-primary/5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Film className="w-24 h-24" />
                </div>
                <div className="w-16 h-16 mb-4 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <Clock className="w-8 h-8" />
                </div>
                <span className="text-2xl font-bold mb-2 text-center">{show.showTime}</span>
                <span className="text-muted-foreground font-medium text-center line-clamp-1 px-4">{show.movieTitle}</span>
              </Link>
            )
          }) : (
            <div className="col-span-1 sm:col-span-2 lg:col-span-3 text-center py-16 bg-muted/30 rounded-2xl border border-dashed border-border">
              <p className="text-muted-foreground text-lg mb-4">No active shows configured for today.</p>
              <Link href="/dashboard/shows" className="text-primary hover:underline font-medium">Go to Dashboard to add some shows &rarr;</Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
