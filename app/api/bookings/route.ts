import { NextResponse } from "next/server";
import { fetchAllBookings, fetchAllShows } from "@/lib/sheetHelpers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const movieId = searchParams.get("movieId") || undefined;
    const filterMonth = searchParams.get("filterMonth") || undefined;
    const filterDate = searchParams.get("filterDate") || undefined;

    const bookings = await fetchAllBookings(movieId, filterMonth, filterDate);
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
