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
}

export function BookingDialog({
  isOpen,
  onClose,
  seats,
  onBookingComplete,
}: BookingDialogProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [showTime, setShowTime] = useState("");
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Complete Your Booking</DialogTitle>
          <DialogDescription>
            You are booking <strong>{seats.length}</strong> seat(s):{" "}
            <strong>{seats.map(s => s.seat_id).join(", ")}</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-1">
          <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-700 dark:text-yellow-500 p-3 rounded-md text-xs text-center font-medium">
            ⚠️ Bookings are only valid for today:<br />
            <strong>{todayDate}</strong>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Select Show Time <span className="text-red-500">*</span></label>
            <div className="flex flex-wrap gap-2">
              {showTimesList.map((time) => (
                <Button
                  key={time}
                  type="button"
                  variant={showTime === time ? "default" : "outline"}
                  onClick={() => setShowTime(time)}
                  className={`flex-1 min-w-[30%] h-9 text-xs ${showTime === time ? 'bg-primary text-primary-foreground border-primary' : 'border-border'}`}
                >
                  {time}
                </Button>
              ))}
            </div>
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
          <div className="bg-muted p-3 rounded-lg flex justify-between items-center mt-2">
            <span className="text-sm">Total Amount:</span>
            <span className="font-bold text-lg">{totalAmount} AED</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleBooking} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
