import { NextResponse } from "next/server";
import { fetchAllShows, createShow } from "@/lib/sheetHelpers";
import { MovieRating } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  try {
    const shows = await fetchAllShows();
    return NextResponse.json(shows);
  } catch (error: unknown) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch shows", details },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { movieTitle, showTime, isActive, startDate, endDate, rating } = await req.json();

    if (!movieTitle || !showTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
    const todayIso = new Date().toISOString().split("T")[0];
    const safeStart = typeof startDate === "string" && isoDatePattern.test(startDate) ? startDate : todayIso;
    const safeEnd = typeof endDate === "string" && isoDatePattern.test(endDate) ? endDate : safeStart;

    if (safeEnd < safeStart) {
      return NextResponse.json(
        { error: "End date cannot be before start date" },
        { status: 400 }
      );
    }

    const allowedRatings: MovieRating[] = ["PG 13", "PG 18", "PG", "G"];
    const normalizedRating = typeof rating === "string" ? rating.toUpperCase() : "PG 13";
    const safeRating = (allowedRatings.includes(normalizedRating as MovieRating)
      ? normalizedRating
      : "PG 13") as MovieRating;

    const newShow = {
      id: uuidv4(),
      movieTitle,
      showTime,
      isActive: isActive !== false, // default true
      startDate: safeStart,
      endDate: safeEnd,
      rating: safeRating,
    };

    await createShow(newShow);

    return NextResponse.json({
      success: true,
      message: "Show created successfully",
      show: newShow,
    });
  } catch (error: unknown) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to create show", details },
      { status: 500 }
    );
  }
}
