import { NextResponse } from "next/server";
import { sheets, SPREADSHEET_ID } from "@/lib/google";
import type { SeatStatus } from "@/lib/types";

type SeatRow = [
  seatId: string,
  section: "Balcony" | "Orchestra",
  row: string,
  seatNumber: number,
  status: SeatStatus,
  price: number,
];

export async function GET() {
  try {
    const newSeats: SeatRow[] = [];

    // Orchestra Configuration
    const orchestraRows = [
      "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N",
    ];
    for (const row of orchestraRows) {
      for (let i = 1; i <= 37; i++) {
        const id = `O-${row}-${i.toString().padStart(2, "0")}`;
        newSeats.push([id, "Orchestra", row, i, "Available", 30]);
      }
    }

    // Balcony Configuration
    const balconySeatCounts: Record<string, number> = {
      "A": 36,
      "B": 37,
      "C": 37,
      "D": 39,
      "E": 39,
      "F": 37
    };
    for (const [row, count] of Object.entries(balconySeatCounts)) {
      for (let i = 1; i <= count; i++) {
        const id = `B-${row}-${i.toString().padStart(2, "0")}`;
        newSeats.push([id, "Balcony", row, i, "Available", 35]);
      }
    }

    // Clear old sheets data first
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: "seats!A2:F",
    });

    // Append new seats to sheets
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "seats!A2:F",
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: newSeats,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully inserted ${newSeats.length} seats!`,
    });
  } catch (error: unknown) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to initialize seats", details },
      { status: 500 }
    );
  }
}
