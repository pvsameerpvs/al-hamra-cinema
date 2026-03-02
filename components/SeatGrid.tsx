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
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
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
    setSelectedSeats((prev) => {
      const isSelected = prev.some((s) => s.seat_id === seat.seat_id);
      if (isSelected) {
        return prev.filter((s) => s.seat_id !== seat.seat_id);
      }
      return [...prev, seat];
    });
  };

  const handleBookingComplete = (seatIds: string[]) => {
    // Optimistic Update
    setSeats((prev) =>
      prev.map((s) => (seatIds.includes(s.seat_id) ? { ...s, status: "Booked" } : s))
    );
    setSelectedSeats([]);
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

  // Balcony Rows: A -> F (A is back row, F is closest to screen)
  const balconyRows = ["A", "B", "C", "D", "E", "F"];
  // Orchestra Rows: N -> A
  const orchestraRows = [
    "N", "M", "L", "K", "J", "I", "H", "G", "F", "E", "D", "C", "B", "A",
  ];

  const renderGrid = (
    sectionSeats: Seat[],
    rows: string[],
    sectionName: string
  ) => {
    return (
      <div className="flex flex-col gap-1 md:gap-3 items-center w-full mx-auto px-1 md:px-4">
        {rows.map((row) => {
          const rowSeats = sectionSeats.filter((s) => s.row === row);

          if (rowSeats.length === 0) return null;

          let leftSeats: Seat[] = [];
          let centerSeats: Seat[] = [];
          let rightSeats: Seat[] = [];

          if (sectionName === "Balcony") {
            let upperCutoff = 27;
            let lowerCutoff = 10;
            if (row === "D" || row === "E") {
              upperCutoff = 28;
              lowerCutoff = 11;
            }
            leftSeats = rowSeats.filter((s) => s.seat_number > upperCutoff).sort((a, b) => b.seat_number - a.seat_number);
            centerSeats = rowSeats.filter((s) => s.seat_number <= upperCutoff && s.seat_number > lowerCutoff).sort((a, b) => b.seat_number - a.seat_number);
            rightSeats = rowSeats.filter((s) => s.seat_number <= lowerCutoff).sort((a, b) => b.seat_number - a.seat_number);
          } else {
            let leftCutoff = 10;
            let centerCutoff = 27;
            leftSeats = rowSeats.filter((s) => s.seat_number <= leftCutoff).sort((a, b) => a.seat_number - b.seat_number);
            centerSeats = rowSeats.filter((s) => s.seat_number > leftCutoff && s.seat_number <= centerCutoff).sort((a, b) => a.seat_number - b.seat_number);
            rightSeats = rowSeats.filter((s) => s.seat_number > centerCutoff).sort((a, b) => a.seat_number - b.seat_number);
          }

          const renderSeat = (seat: Seat) => {
            const isSelected = selectedSeats.some(s => s.seat_id === seat.seat_id);
            let seatStyle = "";

            if (seat.status === "Booked" || seat.status === "Reserved") {
              seatStyle = "bg-yellow-500/80 border border-yellow-600 text-yellow-950 cursor-not-allowed";
            } else if (isSelected) {
              seatStyle = "bg-green-500 border border-green-600 text-white hover:bg-green-600";
            } else {
              seatStyle = "bg-red-500/80 border border-red-600 text-white hover:bg-red-600";
            }

            return (
              <Button
                key={seat.seat_id}
                className={`w-[clamp(12px,2.2vw,36px)] h-[clamp(12px,2.2vw,36px)] min-w-[12px] p-0 text-[clamp(6px,1vw,14px)] font-bold flex items-center justify-center rounded-sm transition-all duration-200 hover:scale-[1.15] active:scale-95 shrink-0 ${seatStyle}`}
                onClick={() => handleSeatClick(seat)}
                title={`Seat ${seat.seat_id} - ${seat.price} AED`}
              >
                {seat.seat_number}
              </Button>
            );
          };

          return (
            <div key={row} className="flex gap-1 sm:gap-2 md:gap-4 items-center justify-center w-full max-w-[1200px] flex-nowrap">
              <span className="w-3 sm:w-5 md:w-8 text-center font-bold text-muted-foreground whitespace-nowrap text-[clamp(8px,1.5vw,16px)] shrink-0">
                {row}
              </span>
              
              <div className="flex justify-center items-center gap-[2px] sm:gap-1 md:gap-2">
                <div className="flex gap-[1px] md:gap-1 flex-nowrap shrink-0">
                  {leftSeats.map(renderSeat)}
                </div>
                
                {leftSeats.length > 0 && <div className="w-1.5 sm:w-3 md:w-6 shrink-0" />}

                <div className="flex gap-[1px] md:gap-1 flex-nowrap shrink-0">
                  {centerSeats.map(renderSeat)}
                </div>
                
                {rightSeats.length > 0 && <div className="w-1.5 sm:w-3 md:w-6 shrink-0" />}

                <div className="flex gap-[1px] md:gap-1 flex-nowrap shrink-0">
                  {rightSeats.map(renderSeat)}
                </div>
              </div>

              <span className="w-3 sm:w-5 md:w-8 text-center font-bold text-muted-foreground whitespace-nowrap text-[clamp(8px,1.5vw,16px)] shrink-0">
                {row}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 bg-card rounded-xl shadow-xl border border-border">
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <span className="bg-accent text-accent-foreground p-2 rounded-lg">🎭</span>
          Select Your Seat
        </h2>
        <div className="flex gap-4 p-3 bg-muted/50 rounded-lg border border-border">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-red-500/80 border border-red-600 shrink-0"></div>
            <span className="text-sm text-foreground">Unselected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-green-500 border border-green-600 shrink-0"></div>
            <span className="text-sm text-foreground">Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-yellow-500/80 border border-yellow-600 shrink-0"></div>
            <span className="text-sm text-foreground">Reserved</span>
          </div>
        </div>
      </div>

      <div className="mb-12">
        <div className="text-center mb-6">
          <Badge variant="outline" className="px-4 py-1.5 text-base border-border bg-muted/30">
            Balcony (35 AED)
          </Badge>
        </div>
        <div className="w-full overflow-hidden pb-4">
          {renderGrid(balconySeats, balconyRows, "Balcony")}
        </div>
      </div>

      <div className="relative mb-16">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent rounded-3xl -z-10 blur-xl"></div>
        <div className="text-center mb-6">
          <Badge variant="outline" className="px-4 py-1.5 text-base border-border bg-muted/30">
            Orchestra (30 AED)
          </Badge>
        </div>
        <div className="w-full overflow-hidden pb-4">
          {renderGrid(orchestraSeats, orchestraRows, "Orchestra")}
        </div>
      </div>

      <div className="w-full h-24 mt-16 bg-gradient-to-t from-muted/70 to-transparent flex items-end justify-center rounded-b-[50%] opacity-70 relative overflow-hidden">
        <div className="absolute top-0 w-[80%] h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent blur-[1px]" />
        <span className="text-muted-foreground/80 font-semibold tracking-[1em] mb-4 text-sm uppercase">Screen</span>
      </div>

      {selectedSeats.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-card/95 backdrop-blur border-t border-border shadow-lg z-50 flex justify-center items-center gap-4 sm:gap-6 animate-in slide-in-from-bottom-5">
          <div className="text-foreground flex items-center gap-2 sm:gap-4 text-sm sm:text-base">
            <span><strong className="text-primary">{selectedSeats.length}</strong> seats selected</span>
            <span className="text-muted-foreground">|</span>
            <span>Total: <strong>{selectedSeats.reduce((sum, s) => sum + s.price, 0)} AED</strong></span>
          </div>
          <Button onClick={() => setIsDialogOpen(true)} size="default" className="min-w-[120px] sm:min-w-[150px]">
            Proceed to Booking
          </Button>
        </div>
      )}

      {selectedSeats.length > 0 && (
        <BookingDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          seats={selectedSeats}
          onBookingComplete={handleBookingComplete}
        />
      )}
    </div>
  );
}
