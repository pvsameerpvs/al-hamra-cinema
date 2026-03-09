import { NextResponse } from "next/server";
import { fetchAllSeats } from "@/lib/sheetHelpers";

export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const time = searchParams.get('time');
    const showId = searchParams.get('showId');
    const date = searchParams.get('date') || undefined;

    if (!time && !showId) {
      return NextResponse.json({ error: "Time or showId is required" }, { status: 400 });
    }

    const seats = await fetchAllSeats(showId || time || "", date);
    return NextResponse.json(seats);
  } catch (error: unknown) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch seats", details },
      { status: 500 }
    );
  }
}
