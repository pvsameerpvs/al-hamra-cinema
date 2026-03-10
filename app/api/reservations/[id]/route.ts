import { NextResponse } from "next/server";
import { deleteReservationRecord, updateReservationStatus } from "@/lib/sheetHelpers";
import type { ReservationStatus } from "@/lib/types";
import { getSession } from "@/lib/auth";

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

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { id } = params;
    if (!id) return NextResponse.json({ error: "Missing reservation id" }, { status: 400 });

    await deleteReservationRecord(id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Failed to delete reservation", details }, { status: 500 });
  }
}
