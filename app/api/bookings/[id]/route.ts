import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { deleteBookingRecord, deleteRevenueLogsByBookingId } from "@/lib/sheetHelpers";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const bookingId = String(params?.id || "").trim();
    if (!bookingId) return NextResponse.json({ error: "Missing booking id" }, { status: 400 });

    const revenueLogsDeleted = await deleteRevenueLogsByBookingId(bookingId);
    await deleteBookingRecord(bookingId);

    return NextResponse.json({ success: true, bookingId, revenueLogsDeleted });
  } catch (error: unknown) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Failed to delete booking", details }, { status: 500 });
  }
}
