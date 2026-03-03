import { sheets, SPREADSHEET_ID } from "./google";
import { Seat, SeatStatus } from "./types";

interface MockBooking {
  seatId: string;
  time: string;
  date: string;
}

const globalForBookings = global as unknown as { mockBookings: MockBooking[] };
if (!globalForBookings.mockBookings) globalForBookings.mockBookings = [];

export async function fetchAllSeats(time?: string): Promise<Seat[]> {
  const today = new Date().toISOString().split("T")[0];
  // Fallback to mock data if the private key is not configured or using the default dummy value
  const privateKey = process.env.GOOGLE_PRIVATE_KEY || "";
  if (!privateKey || privateKey.includes("Your\\nSuper") || privateKey.includes("Your\nSuper")) {
    console.warn("Using mock seat data because GOOGLE_PRIVATE_KEY is not configured.");
    const mockSeats: Seat[] = [];
    
    // Generate mock Orchestra seats (A to N, 37 seats each)
    const orchestraRows = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N"];
    orchestraRows.forEach((row) => {
      for (let i = 1; i <= 37; i++) {
        mockSeats.push({
          seat_id: `O-${row}-${i}`,
          section: "Orchestra",
          row,
          seat_number: i,
          status: "Available", // All seats start available layout-wise
          price: 30,
        });
      }
    });

    // Generate mock Balcony seats (A=36, B=37, C=37, D=39, E=39, F=37)
    const balconyConfig: Record<string, number> = {
      "A": 36,
      "B": 37,
      "C": 37,
      "D": 39,
      "E": 39,
      "F": 37,
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

    // Derive bookings for the current time
    if (time) {
      mockSeats.forEach((seat) => {
        const isBooked = globalForBookings.mockBookings.some(
          (b) => b.seatId === seat.seat_id && b.time === time && b.date === today
        );
        if (isBooked) {
          seat.status = "Booked";
        }
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

    let bookedSeats = new Set<string>();

    if (time) {
      try {
        const bookingsRes = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: "bookings!A:H",
        });
        const bookingRows = bookingsRes.data.values || [];
        for (const r of bookingRows) {
          const seatIdsCol = r[1] || "";
          const createdAtStr = r[7] || "";
          const rowDate = createdAtStr.split("T")[0];
          
          if (rowDate === today && seatIdsCol.startsWith(`[${time}]`)) {
            const cleanIds = seatIdsCol.replace(`[${time}] `, "").split(", ");
            cleanIds.forEach((s: string) => bookedSeats.add(s.trim()));
          }
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
  const privateKey = process.env.GOOGLE_PRIVATE_KEY || "";
  if (!privateKey || privateKey.includes("Your\\nSuper") || privateKey.includes("Your\nSuper")) {
    console.warn(`Mock: updateSeatStatus(${seatId}, ${newStatus}) bypassed.`);
    return;
  }

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
  seatIds: string,
  customerName: string,
  phone: string,
  email: string,
  amount: number,
  paymentStatus: string
) {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY || "";
  if (!privateKey || privateKey.includes("Your\\nSuper") || privateKey.includes("Your\nSuper")) {
    console.warn(`Mock: createBookingRecord(${bookingId}, ${seatIds}) passed to memory.`);
    const today = new Date().toISOString().split("T")[0];
    const timeMatch = seatIds.match(/\[(.*?)\]/);
    const time = timeMatch ? timeMatch[1] : "";
    const cleanly = seatIds.replace(/\[.*?\]\s*/, "").split(", ");
    cleanly.forEach((s) => {
      globalForBookings.mockBookings.push({ seatId: s.trim(), time, date: today });
    });
    return;
  }

  const createdAt = new Date().toISOString();

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: "bookings!A:H",
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [
        [
          bookingId,
          seatIds,
          customerName,
          phone,
          email,
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
  const privateKey = process.env.GOOGLE_PRIVATE_KEY || "";
  if (!privateKey || privateKey.includes("Your\\nSuper") || privateKey.includes("Your\nSuper")) {
    console.warn(`Mock: createRevenueLog bypassed.`);
    return;
  }

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
  const privateKey = process.env.GOOGLE_PRIVATE_KEY || "";
  if (!privateKey || privateKey.includes("Your\\nSuper") || privateKey.includes("Your\nSuper")) {
    console.warn("Mock: getDashboardStats returning mock data.");
    return {
      totalTicketsSold: 120,
      totalRevenue: 2800,
      monthlyTicketsSold: 45,
      monthlyRevenue: 950,
      chartData: [
        { name: "January 2026", revenue: 800 },
        { name: "February 2026", revenue: 1050 },
        { name: "March 2026", revenue: 950 },
      ],
    };
  }

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
