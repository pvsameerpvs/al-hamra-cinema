import { NextResponse } from "next/server";
import { fetchAllShows, createShow } from "@/lib/sheetHelpers";
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
    const { movieTitle, showTime, isActive } = await req.json();

    if (!movieTitle || !showTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newShow = {
      id: uuidv4(),
      movieTitle,
      showTime,
      isActive: isActive !== false, // default true
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
