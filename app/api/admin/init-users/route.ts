import { NextResponse } from "next/server";
import { sheets, SPREADSHEET_ID } from "@/lib/google";
import { USERS_HEADER } from "@/lib/sheetHelpers";

/**
 * GET /api/admin/init-users
 *
 * Initialises the "users" sheet table:
 *  1. Creates the "users" tab if it does not already exist.
 *  2. Writes the header row: username | password | role | createdAt
 *  3. Clears any stale data rows.
 *  4. Seeds the two default accounts (admin + user).
 */
export async function GET() {
  try {
    // ── Step 1: fetch existing sheet tabs ──────────────────────────────────
    const metaRes = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const existingSheets = metaRes.data.sheets || [];
    const usersTabExists = existingSheets.some(
      (s) => s.properties?.title === "users"
    );

    // ── Step 2: create the tab if it is missing ────────────────────────────
    if (!usersTabExists) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: "users",
                  gridProperties: { rowCount: 1000, columnCount: 4 },
                },
              },
            },
          ],
        },
      });
    }

    // ── Step 3: write the header row (A1:D1) ──────────────────────────────
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: "users!A1:D1",
      valueInputOption: "RAW",
      requestBody: { values: [USERS_HEADER] },
    });

    // ── Step 4: clear existing data rows ──────────────────────────────────
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: "users!A2:D",
    });

    // ── Step 5: seed default users ────────────────────────────────────────
    const now = new Date().toISOString();
    const defaultUsers = [
      ["alhamra1992", "1992", "admin", now],
      ["amir1992",  "Alhamra1992",  "user",  now],
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "users!A2:D",
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: defaultUsers },
    });

    return NextResponse.json({
      success: true,
      tabCreated: !usersTabExists,
      message: usersTabExists
        ? "Users table already existed — header refreshed and data reseeded."
        : "Users table created from scratch with header and default accounts.",
      schema: {
        sheet: "users",
        columns: {
          A: "username   — unique login identifier",
          B: "password   — plain-text (hash in production)",
          C: "role       — \"admin\" | \"user\"",
          D: "createdAt  — ISO 8601 timestamp",
        },
      },
      seededUsers: defaultUsers.map(([username, , role]) => ({ username, role })),
    });
  } catch (error: unknown) {
    const details = error instanceof Error ? error.message : String(error);
    console.error("[init-users] Error:", details);
    return NextResponse.json(
      { error: "Failed to initialise users table", details },
      { status: 500 }
    );
  }
}
