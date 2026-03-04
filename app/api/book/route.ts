import { NextResponse } from "next/server";
import {
  updateSeatStatus,
  createBookingRecord,
  createRevenueLog,
} from "@/lib/sheetHelpers";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  try {
    const { seatIds, customerName, phone, email, amount, showTime, paymentMethod } = await req.json();

    if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0 || !customerName || !phone || !email || amount === undefined || !showTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const bookingId = uuidv4();
    const month = new Date().toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
    const date = new Date().toISOString().split("T")[0];

    // 1. (Removed global layout update) Seat statuses are now derived dynamically per showTime based on Bookings sheet!

    // 2. Insert booking record
    await createBookingRecord(
      bookingId,
      showTime ? `[${showTime}] ${seatIds.join(", ")}` : seatIds.join(", "),
      customerName,
      phone,
      email,
      amount,
      paymentMethod ? `Paid - ${paymentMethod}` : "Paid - CASH"
    );

    // 3. Insert revenue log
    await createRevenueLog(bookingId, amount, month, date);

    return NextResponse.json({
      success: true,
      message: "Booking confirmed successfully",
    });
  } catch (error: unknown) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to confirm booking", details },
      { status: 500 }
    );
  }
}
