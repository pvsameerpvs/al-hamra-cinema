import { NextResponse } from "next/server";
import { createReservationRecord, fetchAllReservations, fetchAllShows } from "@/lib/sheetHelpers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const showDate = searchParams.get("showDate") || undefined;
    const status = (searchParams.get("status") as "Active" | "Cancelled" | "Expired" | "all" | null) || undefined;
    const showId = searchParams.get("showId") || undefined;

    const [reservations, shows] = await Promise.all([
      fetchAllReservations(showDate, status || "all", showId),
      fetchAllShows(),
    ]);

    return NextResponse.json({ reservations, shows });
  } catch (error: unknown) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Failed to load reservations", details }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      seatIds,
      customerName,
      phone,
      email,
      showId,
      showDate,
      ttlMinutes,
    } = body || {};

    if (!showId || !showDate || !Array.isArray(seatIds) || seatIds.length === 0 || !customerName || !phone || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const result = await createReservationRecord({
      showId,
      showDate,
      seatIds,
      customerName,
      phone,
      email,
      ttlMinutes: typeof ttlMinutes === "number" ? ttlMinutes : undefined,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Failed to create reservation", details }, { status: 500 });
  }
}
