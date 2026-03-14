import { NextResponse } from "next/server";
import { fetchAllBookings, fetchAllShows } from "@/lib/sheetHelpers";
import { computeDailyReport } from "@/lib/dailyReport";

export const dynamic = "force-dynamic";

function getDubaiIsoDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dubai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const selectedDate = searchParams.get("selectedDate") || getDubaiIsoDate();
    const selectedMovie = searchParams.get("selectedMovie") || "all";
    const selectedShowTime = searchParams.get("selectedShowTime") || "all";

    const [bookings, shows] = await Promise.all([fetchAllBookings(), fetchAllShows()]);

    const report = computeDailyReport(bookings, shows, {
      selectedDate,
      selectedMovie,
      selectedShowTime,
    });

    return NextResponse.json(report);
  } catch (error: unknown) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to build daily report", details },
      { status: 500 }
    );
  }
}
