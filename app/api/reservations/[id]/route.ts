import { NextResponse } from "next/server";
import { updateReservationStatus } from "@/lib/sheetHelpers";
import type { ReservationStatus } from "@/lib/types";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json().catch(() => ({}));
    const status = (body?.status as ReservationStatus | undefined) || "Cancelled";

    if (!id) return NextResponse.json({ error: "Missing reservation id" }, { status: 400 });

    await updateReservationStatus(id, status);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Failed to update reservation", details }, { status: 500 });
  }
}
