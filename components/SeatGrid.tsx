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

  // Balcony Rows: F -> A
  const balconyRows = ["F", "E", "D", "C", "B", "A"];
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
      <div className="flex flex-col gap-3 items-center w-max mx-auto px-4">
        {rows.map((row) => {
          const rowSeats = sectionSeats
            .filter((s) => s.row === row)
            .sort((a, b) => a.seat_number - b.seat_number);

          if (rowSeats.length === 0) return null;

          // Determine aisle thresholds based on section and row
          let leftCutoff = 10;
          let centerCutoff = 27;

          // Balcony Rows D and E have slightly shifted aisles
          if (sectionName === "Balcony" && (row === "D" || row === "E")) {
            leftCutoff = 11;
            centerCutoff = 28;
          }

          const leftSeats = rowSeats.filter((s) => s.seat_number <= leftCutoff);
          const centerSeats = rowSeats.filter(
            (s) => s.seat_number > leftCutoff && s.seat_number <= centerCutoff
          );
          const rightSeats = rowSeats.filter((s) => s.seat_number > centerCutoff);

          const renderSeat = (seat: Seat) => {
            const isSelected = selectedSeats.some(s => s.seat_id === seat.seat_id);
            let seatStyle = "";

            if (seat.status === "Booked" || seat.status === "Reserved") {
              seatStyle = "bg-muted border border-muted text-muted-foreground opacity-50 cursor-not-allowed";
            } else if (isSelected) {
              seatStyle = "bg-white text-black border border-white hover:bg-gray-200";
            } else {
              seatStyle = "bg-transparent border border-muted-foreground text-muted-foreground hover:border-white hover:text-white";
            }

            return (
              <Button
                key={seat.seat_id}
                className={`w-8 h-8 md:w-10 md:h-10 p-0 text-xs font-semibold flex items-center justify-center rounded-sm transition-all duration-200 hover:scale-110 active:scale-95 ${seatStyle}`}
                onClick={() => handleSeatClick(seat)}
                title={`Seat ${seat.seat_id} - ${seat.price} AED`}
              >
                {seat.seat_number}
              </Button>
            );
          };

          return (
            <div key={row} className="flex gap-4 md:gap-8 items-center justify-between w-full">
              <span className="w-8 text-center font-bold text-muted-foreground whitespace-nowrap">
                {row}
              </span>
              
              <div className="flex gap-1 md:gap-1.5 flex-nowrap">
                {leftSeats.map(renderSeat)}
              </div>
              
              <div className="flex gap-1 md:gap-1.5 flex-nowrap">
                {centerSeats.map(renderSeat)}
              </div>
              
              <div className="flex gap-1 md:gap-1.5 flex-nowrap">
                {rightSeats.map(renderSeat)}
              </div>

              <span className="w-8 text-center font-bold text-muted-foreground whitespace-nowrap">
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
            <div className="w-4 h-4 rounded-sm border border-muted-foreground bg-transparent shrink-0"></div>
            <span className="text-sm text-muted-foreground">Unselected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-white shrink-0"></div>
            <span className="text-sm text-muted-foreground">Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-muted shrink-0 opacity-50"></div>
            <span className="text-sm text-muted-foreground">Reserved</span>
          </div>
        </div>
      </div>

      <div className="mb-12">
        <div className="text-center mb-6">
          <Badge variant="outline" className="px-4 py-1.5 text-base border-border bg-muted/30">
            Balcony (35 AED)
          </Badge>
        </div>
        <div className="overflow-x-auto pb-4">
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
        <div className="overflow-x-auto pb-4">
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
