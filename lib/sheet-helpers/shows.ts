import { sheets, SPREADSHEET_ID } from "../google";
import { MovieRating, Show } from "../types";
import { isMockMode, mockStore } from "./shared";
import { deleteSheetRows } from "./sheetUtils";

let cachedShows: Show[] | null = null;
let lastShowFetch = 0;
const SHOWS_CACHE_TTL = 30 * 1000; // 30 seconds

function clearShowsCache() {
  cachedShows = null;
  lastShowFetch = 0;
}

function normalizeMovieRating(value?: string): MovieRating {
  const normalized = String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
  return normalized || "PG 13";
}

export async function fetchAllShows(): Promise<Show[]> {
  if (isMockMode()) {
    return mockStore.mockShows;
  }

  const now = Date.now();
  if (cachedShows && now - lastShowFetch < SHOWS_CACHE_TTL) {
    return cachedShows;
  }

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "shows!A2:G",
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      clearShowsCache();
      return [];
    }

    const todayIso = new Date().toISOString().split("T")[0];
    const builtShows = rows.map((row) => {
      const startDate = row[4] || todayIso;
      const endDate = row[5] || startDate;
      const rating = normalizeMovieRating(row[6]);
      return {
        id: row[0],
        movieTitle: row[1],
        showTime: row[2],
        isActive: row[3] === "TRUE",
        startDate,
        endDate,
        rating,
      } satisfies Show;
    });

    cachedShows = builtShows;
    lastShowFetch = Date.now();

    return builtShows;
  } catch (error) {
    console.error("Error fetching shows:", error);
    return [];
  }
}

export async function createShow(show: Show) {
  if (isMockMode()) {
    mockStore.mockShows.push(show);
    return;
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: "shows!A:G",
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [[
        show.id,
        show.movieTitle,
        show.showTime,
        show.isActive ? "TRUE" : "FALSE",
        show.startDate,
        show.endDate,
        show.rating,
      ]],
    },
  });

  clearShowsCache();
}

export async function updateShow(showId: string, updatedShow: Partial<Show>) {
  if (isMockMode()) {
    const index = mockStore.mockShows.findIndex((s) => s.id === showId);
    if (index !== -1) {
      mockStore.mockShows[index] = { ...mockStore.mockShows[index], ...updatedShow };
    }
    return;
  }

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "shows!A:A",
  });

  const ids = response.data.values?.map((r) => r[0]) || [];
  const rowIndex = ids.indexOf(showId);

  if (rowIndex === -1) throw new Error(`Show ${showId} not found`);
  const exactRow = rowIndex + 1;

  const currentShowRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `shows!A${exactRow}:G${exactRow}`,
  });

  const currentRow = currentShowRes.data.values?.[0];
  if (!currentRow) throw new Error(`Row data for ${showId} not found`);

  const mergedShow = {
    id: showId,
    movieTitle: updatedShow.movieTitle !== undefined ? updatedShow.movieTitle : currentRow[1],
    showTime: updatedShow.showTime !== undefined ? updatedShow.showTime : currentRow[2],
    isActive: updatedShow.isActive !== undefined ? (updatedShow.isActive ? "TRUE" : "FALSE") : currentRow[3],
    startDate: updatedShow.startDate !== undefined ? updatedShow.startDate : currentRow[4],
    endDate: updatedShow.endDate !== undefined ? updatedShow.endDate : currentRow[5],
    rating: updatedShow.rating !== undefined ? normalizeMovieRating(updatedShow.rating) : normalizeMovieRating(currentRow[6]),
  };

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `shows!A${exactRow}:G${exactRow}`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[
        mergedShow.id,
        mergedShow.movieTitle,
        mergedShow.showTime,
        mergedShow.isActive,
        mergedShow.startDate,
        mergedShow.endDate,
        mergedShow.rating,
      ]],
    },
  });

  clearShowsCache();
}

export async function deleteShow(showId: string) {
  if (isMockMode()) {
    mockStore.mockShows = mockStore.mockShows.filter((s) => s.id !== showId);
    return;
  }

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "shows!A:A",
  });

  const ids = response.data.values?.map((r) => r[0]) || [];
  const rowIndex = ids.indexOf(showId);

  if (rowIndex === -1) throw new Error(`Show ${showId} not found`);

  await deleteSheetRows("shows", [rowIndex + 1]);
  clearShowsCache();
}
