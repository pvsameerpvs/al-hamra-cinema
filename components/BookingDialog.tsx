"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { MovieRating, Seat } from "@/lib/types";
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
import { Loader2, Printer, CheckCircle2 } from "lucide-react";
import { ReceiptTicket } from "@/components/ReceiptTicket";
import { formatTime12Hour } from "@/lib/utils";

interface BookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  seats: Seat[];
  onBookingComplete: (seatIds: string[]) => void;
  showTime: string;
  showId?: string;
  showDate?: string;
  movieTitle?: string;
  rating?: MovieRating;
}

export function BookingDialog({
  isOpen,
  onClose,
  seats,
  onBookingComplete,
  showTime,
  showId,
  showDate,
  movieTitle,
  rating,
}: BookingDialogProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [loading, setLoading] = useState(false);
  const [successType, setSuccessType] = useState<"booking" | null>(null);
  const [bookedSeats, setBookedSeats] = useState<Seat[]>([]);
  const { toast } = useToast();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const handleClose = () => {
    setSuccessType(null);
    setBookedSeats([]);
    setName("");
    setPhone("");
    setEmail("");
    setPaymentMethod("CASH");
    onClose();
  };

  const isSuccess = successType !== null;
  const activeSeats = isSuccess ? bookedSeats : seats;
  const baseAmount = activeSeats.reduce((sum, s) => sum + s.price, 0);
  const vatAmount = Number((baseAmount * 0.05).toFixed(2));
  const totalAmount = Number((baseAmount + vatAmount).toFixed(2));
  const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
  const todayIso = new Date().toISOString().split("T")[0];
  const bookingShowDate = showDate && isoDatePattern.test(showDate) ? showDate : todayIso;
  const showDateLabel = new Date(`${bookingShowDate}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
  });


  const handleBooking = async () => {
    if (!name.trim() || !phone.trim() || !email.trim() || !showTime || !showId) {
      toast({
        title: "Validation Error",
        description: "Name, Phone, Email, and Show are required.",
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
          showId,
          showDate: bookingShowDate,
          paymentMethod,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to book seats");
      }

      toast({
        title: "Booking Confirmed! 🎉",
        description: `Your seats ${seats.map(s => s.seat_id).join(", ")} are booked for ${showDateLabel}.`,
      });

      setBookedSeats(seats);
      setSuccessType("booking");
      onBookingComplete(seats.map(s => s.seat_id));
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

  const handlePrint = () => {
    const originalTitle = document.title;
    const safeName = name.replace(/[^a-zA-Z0-9]/g, "");
    const last4Phone = phone.trim().slice(-4);

    // Setting the exact filename standard for PDF saving/printing spoolers
    document.title = `${safeName}-${last4Phone}`;

    // Scope print CSS to receipt only (prevents breaking other prints)
    document.body.dataset.print = "receipt";

    // Inject receipt-only @page size (cannot be scoped via selectors)
    const styleEl = document.createElement("style");
    styleEl.setAttribute("data-print-style", "receipt");
    styleEl.media = "print";
    styleEl.textContent = `@page { margin: 0; size: 80mm auto; }`;
    document.head.appendChild(styleEl);

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      delete document.body.dataset.print;
      styleEl.remove();
      document.title = originalTitle;
    };

    window.addEventListener("afterprint", cleanup, { once: true });
    // Fallback: some browsers don't reliably fire `afterprint`.
    window.addEventListener("focus", cleanup, { once: true });
    window.print();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl bg-white border-slate-100 shadow-xl overflow-hidden [&>button:last-child]:print:hidden">
          {!isSuccess ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-slate-800">Complete Your Booking</DialogTitle>
                <DialogDescription className="text-slate-500">
                  You are booking <strong className="text-indigo-600">{seats.length}</strong> seat(s):{" "}
                  <strong className="text-slate-700">{seats.map(s => s.seat_id).join(", ")}</strong>.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-5 py-4 max-h-[70vh] overflow-y-auto px-1">
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-xs text-center font-medium shadow-sm">
                  ⚠️ Ticket is valid for:<br />
                  <strong className="text-amber-900">{showDateLabel} - {formatTime12Hour(showTime)}</strong>
                </div>

                 <div className="bg-slate-50 border border-slate-200 text-slate-600 p-3 rounded-xl text-xs text-center font-semibold shadow-sm">
                   Note: Rates shown (35 AED Balcony / 30 AED Orchestra) are before VAT. A 5% VAT is added at checkout.
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
                    placeholder="[EMAIL_ADDRESS]"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="paymentMethod" className="text-sm font-medium">
                    Payment Method
                  </label>
                  <select
                    id="paymentMethod"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK">Bank Transfer / Card</option>
                  </select>
                </div>
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex flex-col gap-2 mt-2 shadow-sm">
                  <div className="flex justify-between items-center text-sm text-indigo-700">
                    <span>Subtotal:</span>
                    <span>{baseAmount.toFixed(2)} AED</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-indigo-700">
                    <span>VAT (5%):</span>
                    <span>{vatAmount.toFixed(2)} AED</span>
                  </div>
                  <div className="border-t border-indigo-200/60 my-1"></div>
                  <div className="flex justify-between items-center">
                     <span className="text-sm font-bold text-indigo-800">Total Amount (incl. VAT):</span>
                     <span className="font-bold text-xl text-indigo-600">{totalAmount.toFixed(2)} AED</span>
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={handleClose} disabled={loading} className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50">
                  Cancel
                </Button>
                <Button onClick={handleBooking} disabled={loading} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 transition-all">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirm Booking
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="p-6 flex flex-col items-center justify-center text-center print:hidden">
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Booking Success!</h2>
                  <p className="text-slate-500 mb-4">
                    Successfully booked {bookedSeats.length} ticket(s) under <strong className="text-slate-700">{name}</strong>.
                  </p>

                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 w-full mb-6">
                    <div className="flex justify-between text-sm text-slate-500 mb-1">
                      <span>Subtotal:</span>
                      <span>{baseAmount.toFixed(2)} AED</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-500 mb-2">
                      <span>VAT (5%):</span>
                      <span>{vatAmount.toFixed(2)} AED</span>
                    </div>
                     <div className="border-t border-slate-200 my-2"></div>
                     <div className="flex justify-between font-bold text-slate-800 text-lg">
                       <span>Total Paid:</span>
                       <span>{totalAmount.toFixed(2)} AED</span>
                     </div>
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>Payment Method:</span>
                      <span className="uppercase">{paymentMethod}</span>
                    </div>
                  </div>

                  <div className="flex flex-col w-full gap-3">
                    <Button
                      onClick={handlePrint}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg shadow-slate-200"
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      Print Receipt
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleClose}
                      className="w-full rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
                    >
                      Close Window
                    </Button>
                  </div>
                </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Hidden Thermal Print Layout (Mounted outside dialog overflow!) */}
      {successType === "booking" && mounted && typeof document !== 'undefined' && createPortal(
        <ReceiptTicket 
          movieTitle={movieTitle || "Al Hamra Cinema Show"}
          showTime={formatTime12Hour(showTime)}
          showDate={bookingShowDate}
          customerName={name}
          customerPhone={phone}
          customerEmail={email}
          seats={bookedSeats}
          paymentMethod={paymentMethod}
          rating={rating}
        />,
        document.body
      )}
    </>
  );
}
