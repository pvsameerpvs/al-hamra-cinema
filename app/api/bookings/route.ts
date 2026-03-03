import { NextResponse } from "next/server";
import { fetchAllBookings, fetchAllShows } from "@/lib/sheetHelpers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const bookings = await fetchAllBookings();
    const shows = await fetchAllShows();
    return NextResponse.json({ bookings, shows });
  } catch (error: unknown) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Failed to load bookings" },
      { status: 500 }
    );
  }
}
