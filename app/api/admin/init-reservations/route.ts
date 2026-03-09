import { NextResponse } from "next/server";
import { sheets, SPREADSHEET_ID } from "@/lib/google";
import { RESERVATIONS_HEADER } from "@/lib/sheetHelpers";

/**
 * GET /api/admin/init-reservations
 * Creates/initialises the "reservations" sheet with header row.
 */
export async function GET() {
  try {
    const metaRes = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const existingSheets = metaRes.data.sheets || [];
    const tabExists = existingSheets.some((s) => s.properties?.title === "reservations");

    if (!tabExists) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: "reservations",
                  gridProperties: { rowCount: 2000, columnCount: 10 },
                },
              },
            },
          ],
        },
      });
    }

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: "reservations!A1:J1",
      valueInputOption: "RAW",
      requestBody: { values: [RESERVATIONS_HEADER] },
    });

    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: "reservations!A2:J",
    });

    return NextResponse.json({
      success: true,
      tabCreated: !tabExists,
      message: tabExists
        ? "Reservations table already existed — header refreshed and data cleared."
        : "Reservations table created from scratch with header.",
      schema: RESERVATIONS_HEADER,
    });
  } catch (error: unknown) {
    const details = error instanceof Error ? error.message : String(error);
    console.error("[init-reservations] Error:", details);
    return NextResponse.json({ error: "Failed to initialise reservations table", details }, { status: 500 });
  }
}
