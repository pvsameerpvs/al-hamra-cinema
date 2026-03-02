import { sheets, SPREADSHEET_ID } from "./google";
import { Seat, SeatStatus } from "./types";

export async function fetchAllSeats(): Promise<Seat[]> {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "seats!A2:F",
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) return [];

    return rows.map((row) => ({
      seat_id: row[0],
      section: row[1] as "Balcony" | "Orchestra",
      row: row[2],
      seat_number: Number(row[3]),
      status: row[4] as SeatStatus,
      price: Number(row[5]),
    }));
  } catch (error) {
    console.error("Error fetching seats:", error);
    return [];
  }
}

export async function updateSeatStatus(seatId: string, newStatus: SeatStatus) {
  // First, find the row index of the seat
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "seats!A:A", // Fetch just the IDs
  });

  const ids = response.data.values?.map((r) => r[0]) || [];
  const rowIndex = ids.indexOf(seatId);

  if (rowIndex === -1) {
    throw new Error(`Seat ${seatId} not found`);
  }

  // Row index is 1-based, array index is 0-based.
  // We need the 1-based index (which is rowIndex + 1)
  const exactRow = rowIndex + 1;

  // Status is in the E column (A=1, B=2, C=3, D=4, E=5)
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `seats!E${exactRow}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[newStatus]],
    },
  });
}

export async function createBookingRecord(
  bookingId: string,
  seatId: string,
  customerName: string,
  phone: string,
  amount: number,
  paymentStatus: string
) {
  const createdAt = new Date().toISOString();

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: "bookings!A:G",
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [
        [
          bookingId,
          seatId,
          customerName,
          phone,
          amount,
          paymentStatus,
          createdAt,
        ],
      ],
    },
  });
}

export async function createRevenueLog(
  bookingId: string,
  amount: number,
  month: string,
  date: string
) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: "revenue_logs!A:D",
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [[bookingId, amount, month, date]],
    },
  });
}

export async function getDashboardStats() {
  try {
    const revenueRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "revenue_logs!B2:D",
    });

    const rows = revenueRes.data.values || [];
    
    let totalRevenue = 0;
    let totalTicketsSold = 0;
    let monthlyRevenue = 0;
    let monthlyTicketsSold = 0;

    const currentMonth = new Date().toLocaleString("default", { month: "long", year: "numeric" });
    
    // Revenue over time (for graph)
    const revenueByMonth: Record<string, number> = {};

    for (const row of rows) {
      const amount = Number(row[0]) || 0;
      const month = row[1]; // e.g., "February 2026"
      
      totalRevenue += amount;
      totalTicketsSold += 1;

      if (month === currentMonth) {
        monthlyRevenue += amount;
        monthlyTicketsSold += 1;
      }
      
      if (!revenueByMonth[month]) revenueByMonth[month] = 0;
      revenueByMonth[month] += amount;
    }

    const chartData = Object.keys(revenueByMonth).map((month) => ({
      name: month,
      revenue: revenueByMonth[month],
    }));

    return {
      totalTicketsSold,
      totalRevenue,
      monthlyTicketsSold,
      monthlyRevenue,
      chartData,
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {
      totalTicketsSold: 0,
      totalRevenue: 0,
      monthlyTicketsSold: 0,
      monthlyRevenue: 0,
      chartData: [],
    };
  }
}
