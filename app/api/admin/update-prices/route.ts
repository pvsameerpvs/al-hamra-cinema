import { NextResponse } from "next/server";
import { sheets, SPREADSHEET_ID } from "@/lib/google";

export async function GET() {
  try {
    // 1. Read all seats (A=seat_id, B=section, C=row, D=seat_number, E=status, F=price)
    const readRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "seats!A2:F",
    });

    const rows = readRes.data.values || [];
    if (rows.length === 0) {
      return NextResponse.json({ error: "No seats found in sheet" }, { status: 404 });
    }

    const updates: { range: string; values: (string | number)[][] }[] = [];

    rows.forEach((row, idx) => {
      const sheetRow = idx + 2; // because data starts at row 2
      const section = row[1];
      const currentPrice = Number(row[5]);

      // Update both Orchestra and Balcony to 35 if not already
      if ((section === "Orchestra" || section === "Balcony") && currentPrice !== 35) {
        updates.push({
          range: `seats!F${sheetRow}`,
          values: [[35]],
        });
      }
    });

    if (updates.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All seats already priced at 35 AED. No changes needed.",
        totalSeats: rows.length,
      });
    }

    // 2. Batch update all changed cells
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        valueInputOption: "USER_ENTERED",
        data: updates,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Updated ${updates.length} seat prices to 35 AED in Google Sheet.`,
      totalSeats: rows.length,
      updatedCount: updates.length,
      sections: ["Balcony", "Orchestra"],
    });
  } catch (error: unknown) {
    const details = error instanceof Error ? error.message : "Unknown error";
    console.error("Update prices error:", error);
    return NextResponse.json(
      { error: "Failed to update prices in Google Sheet", details },
      { status: 500 }
    );
  }
}
