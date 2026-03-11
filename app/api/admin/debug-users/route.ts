import { NextResponse } from "next/server";
import { sheets, SPREADSHEET_ID } from "@/lib/google";

/**
 * GET /api/admin/debug-users
 * Reads the raw users sheet data so you can verify what's stored.
 * REMOVE THIS ROUTE after debugging.
 */
export async function GET() {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "users!A1:D",
    });

    const rows = res.data.values || [];

    return NextResponse.json({
      totalRows: rows.length,
      header: rows[0] || null,
      dataRows: rows.slice(1).map((r, i) => ({
        rowIndex: i + 2,
        username: r[0] || "(empty)",
        passwordLength: r[1]?.length || 0,
        passwordPreview: r[1] ? `${r[1].slice(0, 3)}***` : "(empty)",
        role: r[2] || "(empty)",
        createdAt: r[3] || "(empty)",
      })),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
