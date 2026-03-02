import { SeatGrid } from "@/components/SeatGrid";
import { Toaster } from "@/components/ui/toaster";
import Link from "next/link";
import { Film } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-primary/30 selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer">
            <Film className="w-6 h-6 text-primary group-hover:scale-110 transition-transform duration-300" />
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
              Al Hamra Cinema
            </h1>
          </div>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-zinc-400 hover:text-white transition-colors border border-white/10 rounded-full px-4 py-1.5 hover:border-white/20 hover:bg-white/5"
          >
            Dashboard
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 md:px-8 max-w-7xl mx-auto text-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-[300px] bg-primary/20 blur-[100px] rounded-full -z-10 pointer-events-none"></div>
        <Badge />
        <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
          Immersive Cinema <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            Experience Awaits
          </span>
        </h2>
        <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-10">
          Book your tickets for the latest blockbusters. Select your preferred section from the Balcony or the Orchestra for an unforgettable viewing experience.
        </p>
      </section>

      {/* Seat Selection Component */}
      <section className="pz-4 pb-20">
        <SeatGrid />
      </section>

      <Toaster />
    </main>
  );
}

function Badge() {
  return (
    <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 mb-8 text-sm text-zinc-300 select-none shadow-sm shadow-white/5 ring-1 ring-white/5 backdrop-blur-md">
      <span className="flex h-2 w-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
      Now Showing: Interstellar In IMAX
    </div>
  );
}
