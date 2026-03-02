import { NextResponse } from "next/server";
import { fetchAllSeats } from "@/lib/sheetHelpers";

export const revalidate = 0;

export async function GET() {
  try {
    const seats = await fetchAllSeats();
    return NextResponse.json(seats);
  } catch (error: unknown) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch seats", details },
      { status: 500 }
    );
  }
}
