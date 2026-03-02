import { NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/sheetHelpers";

export const revalidate = 0;

export async function GET() {
  try {
    const stats = await getDashboardStats();
    return NextResponse.json(stats);
  } catch (error: unknown) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats", details },
      { status: 500 }
    );
  }
}
