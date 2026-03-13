import { NextResponse } from "next/server";
import { fetchAllShows, updateShow, deleteShow } from "@/lib/sheetHelpers";
import { Show } from "@/lib/types";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();

    const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
    const sanitized: Partial<Show> = {};

    if (typeof body.movieTitle === "string") {
      sanitized.movieTitle = body.movieTitle.trim();
    }

    if (typeof body.showTime === "string") {
      sanitized.showTime = body.showTime.trim();
    }

    if (typeof body.isActive === "boolean") {
      sanitized.isActive = body.isActive;
    }

    const needsExistingDates = body.startDate !== undefined || body.endDate !== undefined;
    let existingShow: Show | undefined;
    if (needsExistingDates) {
      const allShows = await fetchAllShows();
      existingShow = allShows.find((s) => s.id === id);
      if (!existingShow) {
        return NextResponse.json({ error: "Show not found" }, { status: 404 });
      }
    }

    if (body.startDate !== undefined) {
      if (typeof body.startDate !== "string" || !isoDatePattern.test(body.startDate)) {
        return NextResponse.json({ error: "Invalid start date" }, { status: 400 });
      }
      sanitized.startDate = body.startDate;
    }

    if (body.endDate !== undefined) {
      if (typeof body.endDate !== "string" || !isoDatePattern.test(body.endDate)) {
        return NextResponse.json({ error: "Invalid end date" }, { status: 400 });
      }
      sanitized.endDate = body.endDate;
    }

    const startForComparison = sanitized.startDate ?? existingShow?.startDate;
    const endForComparison = sanitized.endDate ?? existingShow?.endDate;
    if (startForComparison && endForComparison && endForComparison < startForComparison) {
      return NextResponse.json(
        { error: "End date cannot be before start date" },
        { status: 400 }
      );
    }

    if (body.rating !== undefined) {
      if (typeof body.rating !== "string") {
        return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
      }
      const normalized = body.rating.trim().replace(/\s+/g, " ").toUpperCase();
      if (!normalized) {
        return NextResponse.json({ error: "Rating is required" }, { status: 400 });
      }
      sanitized.rating = normalized;
    }

    await updateShow(id, sanitized);

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
