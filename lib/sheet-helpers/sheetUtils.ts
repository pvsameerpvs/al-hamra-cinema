import { sheets, SPREADSHEET_ID } from "../google";

const sheetIdCache: Record<string, number> = {};

async function getSheetIdByTitle(sheetTitle: string): Promise<number> {
  const title = String(sheetTitle || "").trim();
  if (!title) throw new Error("Missing sheet title");

  const cached = sheetIdCache[title];
  if (cached !== undefined) return cached;

  if (!SPREADSHEET_ID) throw new Error("Missing GOOGLE_SHEET_ID");

  const meta = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
  });

  const found = meta.data.sheets?.find((s) => s.properties?.title === title);
  const sheetId = found?.properties?.sheetId;
  if (sheetId === null || sheetId === undefined) throw new Error(`Sheet "${title}" not found`);

  sheetIdCache[title] = sheetId;
  return sheetId;
}

export async function deleteSheetRows(sheetTitle: string, sheetRows: number[]): Promise<number> {
  if (!SPREADSHEET_ID) throw new Error("Missing GOOGLE_SHEET_ID");

  const unique = Array.from(
    new Set(
      (sheetRows || [])
        .map((r) => Number(r))
        .filter((r) => Number.isFinite(r) && r >= 2)
    )
  ).sort((a, b) => b - a);

  if (unique.length === 0) return 0;

  const sheetId = await getSheetIdByTitle(sheetTitle);

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: unique.map((sheetRow) => ({
        deleteDimension: {
          range: {
            sheetId,
            dimension: "ROWS",
            startIndex: sheetRow - 1,
            endIndex: sheetRow,
          },
        },
      })),
    },
  });

  return unique.length;
}
