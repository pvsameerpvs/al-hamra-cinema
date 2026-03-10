import { sheets, SPREADSHEET_ID } from "../google";
import { Seat, SeatStatus } from "../types";
import { isMockMode, mockStore } from "./shared";

export async function fetchAllSeats(showKey?: string, showDate?: string): Promise<Seat[]> {
  const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
  const today = new Date().toISOString().split("T")[0];
  const targetDate = showDate && isoDatePattern.test(showDate) ? showDate : today;

  if (isMockMode()) {
    console.warn("Using mock seat data because GOOGLE_PRIVATE_KEY is not configured.");
    const mockSeats: Seat[] = [];

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

    const balconyConfig: Record<string, number> = {
      A: 36,
      B: 37,
      C: 37,
      D: 39,
      E: 39,
      F: 37,
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

    if (showKey) {
      mockSeats.forEach((seat) => {
        const isBooked = mockStore.mockBookings.some(
          (b) => b.seatId === seat.seat_id && b.showKey === showKey && b.showDate === targetDate
        );
        if (isBooked) seat.status = "Booked";
      });
    }

    return mockSeats;
  }

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "seats!A2:F",
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) return [];

    const bookedSeats = new Set<string>();

    if (showKey) {
      try {
        const bookingsRes = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: "bookings!A:I",
        });
        const bookingRows = bookingsRes.data.values || [];

        for (const r of bookingRows) {
          const seatIdsCol = r[1] || "";
          const createdAtStr = r[7] || "";
          const explicitShowDate = r[8] || "";
          const rowShowDate = explicitShowDate || (createdAtStr ? createdAtStr.split("T")[0] : "");

          const bracketMatch = seatIdsCol.match(/\[(.*?)\]/);
          const bracketValue = bracketMatch ? bracketMatch[1] : "";
          if (!bracketValue || bracketValue !== showKey) continue;
          if (!rowShowDate || rowShowDate !== targetDate) continue;

          const cleanIds = seatIdsCol
            .replace(/\[.*?\]\s*/, "")
            .split(", ")
            .filter((s: string) => s.trim() !== "");
          cleanIds.forEach((s: string) => bookedSeats.add(s.trim()));
        }
      } catch (e) {
        console.warn("Failed to fetch bookings for dynamic seat status calculation:", e);
      }
    }

    return rows.map((row) => ({
      seat_id: row[0],
      section: row[1] as "Balcony" | "Orchestra",
      row: row[2],
      seat_number: Number(row[3]),
      status: bookedSeats.has(row[0]) ? "Booked" : "Available",
      price: Number(row[5]),
    }));
  } catch (error) {
    console.error("Error fetching seats:", error);
    return [];
  }
}

export async function updateSeatStatus(seatId: string, newStatus: SeatStatus) {
  if (isMockMode()) {
    console.warn(`Mock: updateSeatStatus(${seatId}, ${newStatus}) bypassed.`);
    return;
  }

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "seats!A:A",
  });

  const ids = response.data.values?.map((r) => r[0]) || [];
  const rowIndex = ids.indexOf(seatId);

  if (rowIndex === -1) {
    throw new Error(`Seat ${seatId} not found`);
  }

  const exactRow = rowIndex + 1;

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `seats!E${exactRow}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[newStatus]],
    },
  });
}
