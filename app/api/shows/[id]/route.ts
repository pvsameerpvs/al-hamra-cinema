import { NextResponse } from "next/server";
import { updateShow, deleteShow } from "@/lib/sheetHelpers";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();

    await updateShow(id, body);

    return NextResponse.json({
      success: true,
      message: "Show updated successfully",
    });
  } catch (error: unknown) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to update show", details },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    await deleteShow(id);

    return NextResponse.json({
      success: true,
      message: "Show deleted successfully",
    });
  } catch (error: unknown) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to delete show", details },
      { status: 500 }
    );
  }
}
