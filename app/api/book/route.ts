import { NextResponse } from "next/server";
import {
  updateSeatStatus,
  createBookingRecord,
  createRevenueLog,
} from "@/lib/sheetHelpers";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  try {
    const { seatId, customerName, phone, amount } = await req.json();

    if (!seatId || !customerName || !phone || amount === undefined) {
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

    // 1. Update seat status to 'Booked'
    await updateSeatStatus(seatId, "Booked");

    // 2. Insert booking record
    await createBookingRecord(
      bookingId,
      seatId,
      customerName,
      phone,
      amount,
      "Paid"
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
