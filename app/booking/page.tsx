import { HomeHeader } from "@/components/home/HomeHeader";
import { MoveLeft, Clock } from "lucide-react";
import Link from "next/link";

export default function BookingSelectionPage() {
  const showTimesList = ["10:00 AM", "01:00 PM", "04:00 PM", "07:00 PM", "10:00 PM"];

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

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {showTimesList.map((time) => {
            const slug = time.replace(/\s+/g, '-');
            return (
              <Link
                key={time}
                href={`/booking/${slug}`}
                className="group flex flex-col items-center justify-center p-10 border border-border bg-card hover:border-primary hover:bg-primary/5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300"
              >
                <Clock className="w-10 h-10 mb-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-2xl font-bold">{time}</span>
              </Link>
            )
          })}
        </div>
      </section>
    </main>
  );
}
