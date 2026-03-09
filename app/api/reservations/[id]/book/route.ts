import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import {
  createBookingRecord,
  createRevenueLog,
  fetchAllSeats,
  fetchReservationById,
  updateReservationStatus,
} from "@/lib/sheetHelpers";

type PaymentMethod = "CASH" | "BANK";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const reservationId = params?.id;
    if (!reservationId) {
      return NextResponse.json({ error: "Missing reservation id" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const paymentMethod = String(body?.paymentMethod || "CASH").toUpperCase() as PaymentMethod;
    if (paymentMethod !== "CASH" && paymentMethod !== "BANK") {
      return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
    }

    const reservation = await fetchReservationById(reservationId);
    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }
    if (reservation.status !== "Active") {
      return NextResponse.json(
        { error: `Reservation is not active (${reservation.status})` },
        { status: 400 }
      );
    }

    const seatIds = String(reservation.seatIds || "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s !== "");

    if (!reservation.showId || !reservation.showDate || seatIds.length === 0) {
      return NextResponse.json({ error: "Reservation data incomplete" }, { status: 400 });
    }

    const allSeats = await fetchAllSeats(reservation.showId, reservation.showDate);
    const seatMap = new Map(allSeats.map((s) => [s.seat_id, s] as const));

    let amount = 0;
    for (const id of seatIds) {
      const seat = seatMap.get(id);
      if (!seat) {
        return NextResponse.json({ error: `Seat not found: ${id}` }, { status: 400 });
      }
      if (seat.status === "Booked") {
        return NextResponse.json({ error: `Seat already booked: ${id}` }, { status: 409 });
      }
      amount += Number(seat.price) || 0;
    }

    const bookingId = uuidv4();
    const month = new Date().toLocaleString("default", { month: "long", year: "numeric" });
    const date = new Date().toISOString().split("T")[0];

    await createBookingRecord(
      bookingId,
      `[${reservation.showId}] ${seatIds.join(", ")}`,
      reservation.customerName,
      reservation.phone,
      reservation.email,
      amount,
      `Paid - ${paymentMethod}`,
      reservation.showDate
    );

    await createRevenueLog(bookingId, amount, month, date);
    await updateReservationStatus(reservationId, "Cancelled");

    return NextResponse.json({
      success: true,
      bookingId,
      amount,
      seatIds,
      showId: reservation.showId,
      showDate: reservation.showDate,
      customerName: reservation.customerName,
      phone: reservation.phone,
      email: reservation.email,
      paymentMethod,
    });
  } catch (error: unknown) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Failed to book reservation", details }, { status: 500 });
  }
}
