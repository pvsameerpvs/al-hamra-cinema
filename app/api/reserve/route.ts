import { NextResponse } from "next/server";
import { updateSeatStatus } from "@/lib/sheetHelpers";

export async function POST(req: Request) {
  try {
    const { seatId } = await req.json();

    if (!seatId) {
      return NextResponse.json({ error: "Missing seatId" }, { status: 400 });
    }

    await updateSeatStatus(seatId, "Reserved");

    return NextResponse.json({
      success: true,
      message: "Seat reserved successfully",
    });
  } catch (error: unknown) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to reserve seat", details },
      { status: 500 }
    );
  }
}
