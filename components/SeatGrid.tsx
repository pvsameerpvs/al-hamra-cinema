"use client";

import { useCallback, useEffect, useState } from "react";
import { Seat } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { BookingDialog } from "./BookingDialog";
import { Loader2 } from "lucide-react";

export function SeatGrid() {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchSeats = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const res = await fetch("/api/seats");
      if (!res.ok) throw new Error("Failed to fetch");
      const data: Seat[] = await res.json();
      setSeats(data);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not load seat map. Please try again later.";
      toast({
        title: "Error fetching seats",
        description: message,
        variant: "destructive",
      });
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSeats(true);
    const interval = setInterval(() => fetchSeats(false), 10000);
    return () => clearInterval(interval);
  }, [fetchSeats]);

  const handleSeatClick = (seat: Seat) => {
    if (seat.status === "Booked" || seat.status === "Reserved") {
      toast({
        title: "Seat Unavailable",
        description: `This seat is currently ${seat.status.toLowerCase()}.`,
        variant: "destructive",
      });
      return;
    }
    setSelectedSeat(seat);
    setIsDialogOpen(true);
  };

  const handleBookingComplete = (seatId: string) => {
    // Optimistic Update
    setSeats((prev) =>
      prev.map((s) => (s.seat_id === seatId ? { ...s, status: "Booked" } : s))
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground animate-pulse">Loading seat map...</p>
      </div>
    );
  }

  // Filter and group seats
  const balconySeats = seats.filter((s) => s.section === "Balcony");
  const orchestraSeats = seats.filter((s) => s.section === "Orchestra");

  // Balcony Rows: F -> A
  const balconyRows = ["F", "E", "D", "C", "B", "A"];
  // Orchestra Rows: N -> A
  const orchestraRows = [
    "N", "M", "L", "K", "J", "I", "H", "G", "F", "E", "D", "C", "B", "A",
  ];

  const getSeatColor = (status: string) => {
    switch (status) {
      case "Available":
        return "bg-green-500 hover:bg-green-400 text-white";
      case "Reserved":
        return "bg-yellow-500 text-white cursor-not-allowed border-yellow-600";
      case "Booked":
        return "bg-red-500 text-white cursor-not-allowed border-red-600";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const renderGrid = (
    sectionSeats: Seat[],
    rows: string[]
  ) => {
    return (
      <div className="flex flex-col gap-2 items-center">
        {rows.map((row) => {
          const rowSeats = sectionSeats
            .filter((s) => s.row === row)
            .sort((a, b) => a.seat_number - b.seat_number);

          // If no seats loaded yet, we can render placeholders based on the required size
          // But since we rely on DB, if DB is empty, nothing renders.
          if (rowSeats.length === 0) return null;

          return (
            <div key={row} className="flex gap-2 items-center">
              <span className="w-6 text-center font-bold text-gray-400">
                {row}
              </span>
              <div className="flex gap-1 flex-wrap justify-center">
                {rowSeats.map((seat) => (
                  <Button
                    key={seat.seat_id}
                    className={`w-8 h-8 md:w-10 md:h-10 p-0 text-xs transition-transform duration-200 hover:scale-110 active:scale-95 shadow-sm ${getSeatColor(
                      seat.status
                    )}`}
                    onClick={() => handleSeatClick(seat)}
                    title={`Seat ${seat.seat_id} - ${seat.price} AED`}
                  >
                    {seat.seat_number}
                  </Button>
                ))}
              </div>
              <span className="w-6 text-center font-bold text-gray-400">
                {row}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 bg-zinc-950 rounded-xl shadow-2xl border border-zinc-900">
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
        <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
          <span className="bg-primary/20 p-2 rounded-lg">🎭</span>
          Select Your Seat
        </h2>
        <div className="flex gap-4 p-3 bg-zinc-900 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500 shrink-0"></div>
            <span className="text-sm text-zinc-300">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500 shrink-0"></div>
            <span className="text-sm text-zinc-300">Reserved</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500 shrink-0"></div>
            <span className="text-sm text-zinc-300">Booked</span>
          </div>
        </div>
      </div>

      <div className="mb-12">
        <div className="text-center mb-6">
          <Badge variant="outline" className="px-4 py-1.5 text-base text-zinc-300 border-zinc-700 bg-zinc-900/50">
            Balcony (35 AED)
          </Badge>
        </div>
        <div className="overflow-x-auto pb-4">
          {renderGrid(balconySeats, balconyRows)}
        </div>
      </div>

      <div className="relative mb-16">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent rounded-3xl -z-10 blur-xl"></div>
        <div className="text-center mb-6">
          <Badge variant="outline" className="px-4 py-1.5 text-base text-zinc-300 border-zinc-700 bg-zinc-900/50">
            Orchestra (30 AED)
          </Badge>
        </div>
        <div className="overflow-x-auto pb-4">
          {renderGrid(orchestraSeats, orchestraRows)}
        </div>
      </div>

      <div className="w-full h-24 mt-16 bg-gradient-to-t from-zinc-800 to-transparent flex items-end justify-center rounded-b-[50%] opacity-50 relative overflow-hidden">
        <div className="absolute top-0 w-[80%] h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent blur-[1px]"></div>
        <span className="text-zinc-400 font-semibold tracking-[1em] mb-4 text-sm mix-blend-screen uppercase">Screen</span>
      </div>

      {selectedSeat && (
        <BookingDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          seat={selectedSeat}
          onBookingComplete={handleBookingComplete}
        />
      )}
    </div>
  );
}
