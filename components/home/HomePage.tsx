import { SeatGrid } from "@/components/SeatGrid";
import { HomeHeader } from "@/components/home/HomeHeader";
import { HeroSection } from "@/components/home/HeroSection";

export function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary-foreground">
      <HomeHeader />
      <HeroSection />

      <section
        id="seats"
        className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-20 pt-12 md:px-8"
      >
        <SeatGrid />
      </section>
    </main>
  );
}
