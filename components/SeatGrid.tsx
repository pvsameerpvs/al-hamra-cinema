"use client";

import { useCallback, useEffect, useState } from "react";
import { Seat } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { BookingDialog } from "./BookingDialog";
import { Loader2 } from "lucide-react";

const seatCache: Record<string, { data: Seat[], timestamp: number }> = {};

export function SeatGrid({ showTime }: { showTime?: string }) {
  const cacheKey = showTime || "all";
  const cachedData = seatCache[cacheKey];
  const [seats, setSeats] = useState<Seat[]>(cachedData ? cachedData.data : []);
  const [loading, setLoading] = useState(!cachedData);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchSeats = useCallback(async (showLoader = false) => {
    if (showLoader && !seatCache[cacheKey]) setLoading(true);
    try {
      const url = showTime ? `/api/seats?time=${encodeURIComponent(showTime)}` : "/api/seats";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch");
      const data: Seat[] = await res.json();
      seatCache[cacheKey] = { data, timestamp: Date.now() };
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
      setLoading(false);
    }
  }, [showTime, cacheKey, toast]);

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
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
        <p className="mt-4 text-slate-500 font-medium animate-pulse">Loading seat map...</p>
      </div>
    );
  }

  // Filter and group seats
  const balconySeats = seats.filter((s) => s.section === "Balcony");
  const orchestraSeats = seats.filter((s) => s.section === "Orchestra");

  // Balcony Rows: A -> F (A is back row, F is closest to screen)
  const balconyRows = ["A", "B", "C", "D", "E", "F"];
  // Orchestra Rows: A -> N
  const orchestraRows = [
    "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N",
  ];

  const renderGrid = (
    sectionSeats: Seat[],
    rows: string[],
    sectionName: string
  ) => {
    return (
      <div className="flex flex-col gap-0.5 sm:gap-1 md:gap-2 items-center w-full mx-auto">
        {rows.map((row) => {
          const rowSeats = sectionSeats.filter((s) => s.row === row);

          if (rowSeats.length === 0) return null;

          let upperCutoff = 27;
          let lowerCutoff = 10;

          if (sectionName === "Balcony" && (row === "D" || row === "E")) {
            upperCutoff = 28;
            lowerCutoff = 11;
          }

          const leftSeats = rowSeats.filter((s) => s.seat_number > upperCutoff).sort((a, b) => b.seat_number - a.seat_number);
          const centerSeats = rowSeats.filter((s) => s.seat_number <= upperCutoff && s.seat_number > lowerCutoff).sort((a, b) => b.seat_number - a.seat_number);
          const rightSeats = rowSeats.filter((s) => s.seat_number <= lowerCutoff).sort((a, b) => b.seat_number - a.seat_number);

          const renderSeat = (seat: Seat) => {
            const isSelected = selectedSeats.some(s => s.seat_id === seat.seat_id);
            let seatStyle = "";

            if (seat.status === "Booked" || seat.status === "Reserved") {
              seatStyle = "bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed";
            } else if (isSelected) {
              seatStyle = "bg-indigo-500 border border-indigo-600 text-white hover:bg-indigo-600 shadow-sm";
            } else {
              seatStyle = "bg-white border border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50";
            }

            return (
              <Button
                key={seat.seat_id}
                className={`w-[clamp(7.5px,2vw,28px)] h-[clamp(7.5px,2vw,28px)] min-w-[7.5px] p-0 text-[clamp(4.5px,0.8vw,11px)] leading-none font-bold flex flex-shrink-0 items-center justify-center rounded-[2px] transition-all duration-200 hover:scale-[1.15] active:scale-95 ${seatStyle}`}
                onClick={() => handleSeatClick(seat)}
                title={`Seat ${seat.seat_id} - ${seat.price} AED`}
              >
                {seat.seat_number}
              </Button>
            );
          };

          return (
            <div key={row} className="flex gap-[1px] sm:gap-1 md:gap-2 items-center justify-center w-full max-w-full flex-nowrap overflow-visible">
              <span className="w-2.5 sm:w-4 md:w-6 text-center font-bold text-slate-400 whitespace-nowrap text-[clamp(6px,1.2vw,14px)] shrink-0">
                {row}
              </span>
              
              <div className="flex justify-center items-center gap-[2px] sm:gap-[3px] md:gap-2">
                <div className="flex gap-[0.5px] sm:gap-[1px] md:gap-1 flex-nowrap shrink-0">
                  {leftSeats.map(renderSeat)}
                </div>
                
                {leftSeats.length > 0 && <div className="w-1 sm:w-2 md:w-5 shrink-0" />}

                <div className="flex gap-[0.5px] sm:gap-[1px] md:gap-1 flex-nowrap shrink-0">
                  {centerSeats.map(renderSeat)}
                </div>
                
                {rightSeats.length > 0 && <div className="w-1 sm:w-2 md:w-5 shrink-0" />}

                <div className="flex gap-[0.5px] sm:gap-[1px] md:gap-1 flex-nowrap shrink-0">
                  {rightSeats.map(renderSeat)}
                </div>
              </div>

              <span className="w-2.5 sm:w-4 md:w-6 text-center font-bold text-slate-400 whitespace-nowrap text-[clamp(6px,1.2vw,14px)] shrink-0">
                {row}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full mx-auto p-1 sm:p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 md:mb-10 gap-4">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <span className="bg-indigo-50 text-indigo-500 p-2 rounded-xl shadow-sm">🎭</span>
          Select Your Seat
        </h2>
        <div className="flex gap-4 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-white border border-slate-200 shrink-0"></div>
            <span className="text-sm font-medium text-slate-600">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-indigo-500 border border-indigo-600 shrink-0"></div>
            <span className="text-sm font-medium text-slate-600">Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-slate-100 border border-slate-200 shrink-0"></div>
            <span className="text-sm font-medium text-slate-600">Reserved</span>
          </div>
        </div>
      </div>

      <div className="mb-12">
        <div className="text-center mb-6">
          <Badge variant="outline" className="px-4 py-1.5 text-base font-semibold border-slate-200 bg-white text-slate-600 shadow-sm">
            Balcony (35 AED)
          </Badge>
        </div>
        <div className="w-full overflow-visible pb-4 px-0.5">
          {renderGrid(balconySeats, balconyRows, "Balcony")}
        </div>
      </div>

      <div className="relative mb-16">
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-50/50 to-transparent rounded-3xl -z-10 blur-xl"></div>
        <div className="text-center mb-6">
          <Badge variant="outline" className="px-4 py-1.5 text-base font-semibold border-slate-200 bg-white text-slate-600 shadow-sm">
            Orchestra : 30 AED
          </Badge>
        </div>
        <div className="w-full overflow-visible pb-4 px-0.5">
          {renderGrid(orchestraSeats, orchestraRows, "Orchestra")}
        </div>
      </div>

      <div className="w-full h-24 mt-16 bg-gradient-to-t from-indigo-50 to-transparent flex items-end justify-center rounded-b-[50%] relative overflow-hidden">
        <div className="absolute top-0 w-[80%] h-[2px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent blur-[1px]" />
        <span className="text-slate-400 font-bold tracking-[1em] mb-4 text-sm uppercase">Screen</span>
      </div>

      {selectedSeats.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-slate-100 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] z-50 flex justify-center items-center gap-4 sm:gap-6 animate-in slide-in-from-bottom-5">
          <div className="text-slate-700 flex items-center gap-2 sm:gap-4 text-sm sm:text-base font-medium">
            <span><strong className="text-indigo-600 text-lg">{selectedSeats.length}</strong> seats selected</span>
            <span className="text-slate-300">|</span>
            <span>Total: <strong className="text-slate-900 text-lg">{selectedSeats.reduce((sum, s) => sum + s.price, 0)} AED</strong></span>
          </div>
          <Button onClick={() => setIsDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[120px] sm:min-w-[150px] rounded-xl shadow-md shadow-indigo-200 transition-all">
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
          showTime={showTime || ""}
        />
      )}
    </div>
  );
}
