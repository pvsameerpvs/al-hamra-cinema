"use client";

import { useState } from "react";
import { Seat } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface BookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  seats: Seat[];
  onBookingComplete: (seatIds: string[]) => void;
  showTime: string;
}

export function BookingDialog({
  isOpen,
  onClose,
  seats,
  onBookingComplete,
  showTime,
}: BookingDialogProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const totalAmount = seats.reduce((sum, s) => sum + s.price, 0);
  const todayDate = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const showTimesList = ["10:00 AM", "01:00 PM", "04:00 PM", "07:00 PM", "10:00 PM"];

  const handleBooking = async () => {
    if (!name.trim() || !phone.trim() || !email.trim() || !showTime) {
      toast({
        title: "Validation Error",
        description: "Name, Phone, Email, and Show Time are required.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seatIds: seats.map(s => s.seat_id),
          customerName: name,
          phone,
          email,
          amount: totalAmount,
          showTime,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to book seats");
      }

      toast({
        title: "Booking Confirmed! 🎉",
        description: `Your seats ${seats.map(s => s.seat_id).join(", ")} have been successfully booked.`,
      });

      onBookingComplete(seats.map(s => s.seat_id));
      onClose();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Booking Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl bg-white border-slate-100 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800">Complete Your Booking</DialogTitle>
            <DialogDescription className="text-slate-500">
              You are booking <strong className="text-indigo-600">{seats.length}</strong> seat(s):{" "}
              <strong className="text-slate-700">{seats.map(s => s.seat_id).join(", ")}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-4 max-h-[70vh] overflow-y-auto px-1">
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-xs text-center font-medium shadow-sm">
              ⚠️ Bookings are only valid for today:<br />
              <strong className="text-amber-900">{todayDate} - {showTime}</strong>
            </div>

          <div className="grid gap-2">
            <label htmlFor="name" className="text-sm font-medium">
              Full Name
            </label>
            <Input
              id="name"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="phone" className="text-sm font-medium">
              Phone Number
            </label>
            <Input
              id="phone"
              placeholder="+971 50 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            </div>
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex justify-between items-center mt-2 shadow-sm">
              <span className="text-sm font-medium text-indigo-800">Total Amount:</span>
              <span className="font-bold text-xl text-indigo-600">{totalAmount} AED</span>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={onClose} disabled={loading} className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50">
              Cancel
            </Button>
            <Button onClick={handleBooking} disabled={loading} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 transition-all">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Booking
            </Button>
          </DialogFooter>
        </DialogContent>
    </Dialog>
  );
}
