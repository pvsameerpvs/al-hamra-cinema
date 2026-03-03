import { NextResponse } from "next/server";
import { sheets, SPREADSHEET_ID } from "@/lib/google";
import { Seat } from "@/lib/types";

export async function GET() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY || "";
  if (!privateKey || privateKey.includes("Your\\nSuper") || privateKey.includes("Your\nSuper")) {
    return NextResponse.json(
      { error: "GOOGLE_PRIVATE_KEY is not configured in .env.local" },
      { status: 400 }
    );
  }

  try {
    const mockSeats: Seat[] = [];
    
    // 1. Generate Orchestra seats
    const orchestraRows = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N"];
    orchestraRows.forEach((row) => {
      for (let i = 1; i <= 37; i++) {
        mockSeats.push({
          seat_id: `O-${row}-${i}`,
          section: "Orchestra",
          row,
          seat_number: i,
          status: "Available",
          price: 30,
        });
      }
    });

    // 2. Generate Balcony seats
    const balconyConfig: Record<string, number> = {
      "A": 36, "B": 37, "C": 37, "D": 39, "E": 39, "F": 37,
    };
    Object.keys(balconyConfig).forEach((row) => {
      for (let i = 1; i <= balconyConfig[row]; i++) {
        mockSeats.push({
          seat_id: `B-${row}-${i}`,
          section: "Balcony",
          row,
          seat_number: i,
          status: "Available",
          price: 35,
        });
      }
    });

    // 3. Convert to Google Sheets required row format
    // Expected Columns: seat_id, section, row, seat_number, status, price
    const values = mockSeats.map(s => [
      s.seat_id,
      s.section,
      s.row,
      s.seat_number,
      s.status,
      s.price
    ]);

    // 4. Batch clear the tab (optional, to ensure we don't duplicate on multiple hits)
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: "seats!A2:F",
    });

    // 5. Bulk insert everything in one chunk 
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "seats!A2:F",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
      insertDataOption: "INSERT_ROWS"
    });

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${values.length} seats into the Google Sheet!`,
    });
  } catch (error: unknown) {
    const details = error instanceof Error ? error.message : "Unknown error";
    console.error(error);
    return NextResponse.json({ error: "Failed to seed seats", details }, { status: 500 });
  }
}
