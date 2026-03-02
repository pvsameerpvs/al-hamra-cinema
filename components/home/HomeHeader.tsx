import Link from "next/link";
import { Film } from "lucide-react";

import { Button } from "@/components/ui/button";

export function HomeHeader() {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-border/60 bg-background/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        <Link href="/" className="group flex items-center gap-2">
          <Film className="h-6 w-6 text-primary transition-transform duration-300 group-hover:scale-110" />
          <span className="text-base font-bold tracking-tight md:text-lg">
            <span className="bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Al Hamra Cinema
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="rounded-full">
            <a href="#seats">Book Seats</a>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
