import { NextResponse } from "next/server";
import { fetchAllBookings } from "@/lib/sheetHelpers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const bookings = await fetchAllBookings();
    return NextResponse.json(bookings);
  } catch (error: unknown) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Failed to load bookings" },
      { status: 500 }
    );
  }
}
