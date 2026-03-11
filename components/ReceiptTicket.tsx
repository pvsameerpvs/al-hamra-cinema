import React from "react";
import { MovieRating, Seat } from "@/lib/types";

interface ReceiptTicketProps {
  movieTitle: string;
  showTime: string;
  /** Show date (YYYY-MM-DD) */
  showDate?: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  seats: Seat[];
  totalAmount?: number;
  paymentMethod: string;
  rating?: MovieRating;
}

export function ReceiptTicket({
  movieTitle,
  showTime,
  showDate,
  customerName,
  customerPhone,
  customerEmail,
  seats,
  totalAmount,
  paymentMethod = "CASH",
  rating,
}: ReceiptTicketProps) {
  const currentDate = new Date().toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const baseAmount = seats.reduce((sum, seat) => sum + seat.price, 0);
  const vatAmount = Number((baseAmount * 0.05).toFixed(2));
  const resolvedTotalAmount =
    typeof totalAmount === "number" && !Number.isNaN(totalAmount)
      ? Number(totalAmount.toFixed(2))
      : Number((baseAmount + vatAmount).toFixed(2));

  const showDateLabel = showDate
    ? new Date(`${showDate}T00:00:00`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  return (
    <div id="receipt-root" className="hidden print:block bg-white text-black font-mono w-[72mm] py-4 px-2 mx-auto text-sm leading-tight border-none shadow-none text-left">
      {/* Header - Theater Details */}
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold uppercase tracking-wider mb-1">AL HAMRA CINEMA</h1>
        <p className="text-xs font-semibold">Mobile: 056 800 3586 / 050 310 9855</p>
        <p className="text-xs">Email: alhamracinema21@gmail.com</p>
        {rating && (
          <p className="text-xs font-semibold mt-1">Rating: {rating}</p>
        )}
      </div>

      <div className="border-t-2 border-dashed border-black my-3"></div>

      {/* Customer Details */}
      <div className="mb-4 space-y-1">
        <h3 className="font-bold underline mb-2">CUSTOMER DETAILS</h3>
        <div className="flex justify-between">
          <span>Name:</span>
          <span className="font-bold uppercase truncate max-w-[150px] text-right">{customerName}</span>
        </div>
        <div className="flex justify-between">
          <span>Phone:</span>
          <span className="text-right">{customerPhone}</span>
        </div>
        <div className="flex justify-between">
          <span>Email:</span>
          <span className="text-[10px] break-all max-w-[150px] text-right">{customerEmail}</span>
        </div>
      </div>

      <div className="border-t-2 border-dashed border-black my-3"></div>

      {/* Booking Details */}
      <div className="mb-4 space-y-1">
        <h3 className="font-bold underline mb-2">BOOKING DETAILS</h3>
        <div className="flex justify-between leading-tight">
          <span>Movie:</span>
          <span className="font-bold text-right uppercase max-w-[150px]">{movieTitle}</span>
        </div>
        <div className="flex justify-between leading-tight">
          <span>Show Time:</span>
          <span className="font-bold text-right">{showTime}</span>
        </div>
        {showDateLabel ? (
          <div className="flex justify-between leading-tight">
            <span>Show Date:</span>
            <span className="font-bold text-right">{showDateLabel}</span>
          </div>
        ) : null}
        <div className="flex justify-between leading-tight">
          <span>Date/Time:</span>
          <span className="text-right">{currentDate}</span>
        </div>
        <div className="flex justify-between mt-2 leading-tight">
          <span>Ticket Qty:</span>
          <span className="font-bold text-lg text-right">{seats.length}</span>
        </div>
      </div>

      <div className="border-t-2 border-dashed border-black my-3"></div>

      {/* Itemized Seats */}
      <div className="mb-4">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-black">
              <th className="font-bold pb-1 text-xs">SEAT</th>
              <th className="font-bold pb-1 text-xs text-center">SEC</th>
              <th className="font-bold text-right pb-1 text-xs">PRICE</th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {seats.map((seat) => (
              <tr key={seat.seat_id}>
                <td className="py-1 font-bold">{seat.seat_id}</td>
                <td className="py-1 text-center">{seat.section === "Balcony" ? "BALC" : "ORCH"}</td>
                <td className="text-right py-1">{seat.price} AED</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t-2 border-dashed border-black my-3"></div>

      {/* Totals */}
      <div className="space-y-1 mb-6">
        <div className="flex justify-between text-sm">
          <span>Subtotal:</span>
          <span>{baseAmount.toFixed(2)} AED</span>
        </div>
        <div className="flex justify-between text-sm font-semibold">
          <span>VAT (5%):</span>
          <span>{vatAmount.toFixed(2)} AED</span>
        </div>
        <div className="border-t-2 border-black my-2"></div>
        <div className="flex justify-between text-xl font-bold">
          <span>TOTAL:</span>
          <span>{resolvedTotalAmount.toFixed(2)} AED</span>
        </div>
        <div className="flex justify-between text-xs mt-2">
          <span>Payment Method:</span>
          <span>{paymentMethod}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs space-y-1">
        <p className="font-bold">THANK YOU FOR YOUR VISIT!</p>
        <p>Please retain this receipt</p>
        <p className="font-semibold">Rating: {rating ?? "Not Rated"}</p>
        <p>Outside food is not allowed.</p>
        <p>Staff is not responsible for any loss of items.</p>
        <p>No refunds or exchanges</p>
        <p className="mt-4 break-all">***********************************</p>
      </div>
    </div>
  );
}
