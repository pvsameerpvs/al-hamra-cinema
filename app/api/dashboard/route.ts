import { NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/sheetHelpers";

export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const movieId = searchParams.get("movieId") || undefined;
    const filterMonth = searchParams.get("filterMonth") || undefined;
    const filterDate = searchParams.get("filterDate") || undefined;
    
    const stats = await getDashboardStats(movieId, filterMonth, filterDate);
    return NextResponse.json(stats);
  } catch (error: unknown) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats", details },
      { status: 500 }
    );
  }
}
