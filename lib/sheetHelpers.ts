import { sheets, SPREADSHEET_ID } from "./google";
import { Seat, SeatStatus, Show, Booking } from "./types";

interface MockBooking {
  seatId: string;
  time: string;
  date: string;
}

const globalForBookings = global as unknown as { mockBookings: MockBooking[], mockShows: Show[] };
if (!globalForBookings.mockBookings) globalForBookings.mockBookings = [];
if (!globalForBookings.mockShows) {
  globalForBookings.mockShows = [
    { id: "1", movieTitle: "Dune: Part Two", showTime: "10:00 AM", isActive: true },
    { id: "2", movieTitle: "Spider-Man", showTime: "01:00 PM", isActive: true },
    { id: "3", movieTitle: "Avatar 3", showTime: "04:00 PM", isActive: true },
    { id: "4", movieTitle: "Inception", showTime: "07:00 PM", isActive: true },
    { id: "5", movieTitle: "Interstellar", showTime: "10:00 PM", isActive: true },
  ];
}

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

export async function getDashboardStats(movieId?: string, filterMonth?: string, filterDate?: string) {
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
      range: "revenue_logs!A2:D",
    });
    
    const bookingsRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "bookings!B2:H",
    });

    const rows = revenueRes.data.values || [];
    const bookingRows = bookingsRes.data.values || [];
    
    let totalTicketsSold = 0;
    let totalRevenue = 0;
    let monthlyTicketsSold = 0;
    let monthlyRevenue = 0;
    
    const now = new Date();
    const currentMonthLong = now.toLocaleString("default", { month: "long", year: "numeric" });
    const currentYear = now.getFullYear();
    const currentMonthPad = String(now.getMonth() + 1).padStart(2, '0');
    const currentMonthTight = `${currentYear}-${currentMonthPad}`;
    
    // Revenue over time (for graph)
    const revenueByMonth: Record<string, number> = {};

    // For server-side filtering
    let targetShowTime: string | null = null;
    let validBookingIds = new Set<string>();

    if (movieId) {
      const allShows = await fetchAllShows();
      const targetShow = allShows.find(s => s.id === movieId);
      if (targetShow) {
        targetShowTime = targetShow.showTime;
      }
    }

    // Process Bookings first so we know which IDs belong to the target show
    for (const row of bookingRows) {
      const bookingId = row[0] || ""; // Assuming ID is A column if B is seatIds, let's verify: Wait, in getDashboardStats earlier:
      // A: bookingId, B: seatIds, C: name, D: phone, E: email, F: amount, G: status, H: createdAt
      // Let's rely on B: seatIds to check the time
      const seatIdsStr = row[1] || ""; // B column (seatIds) in bookingRows
      const bId = row[0] || ""; // A column 
      const createdAtStr = row[7] || ""; // H column (createdAt)
      
      const timeMatch = seatIdsStr.match(/\[(.*?)\]/);
      const rowShowTime = timeMatch ? timeMatch[1] : null;

      if (targetShowTime && rowShowTime !== targetShowTime) {
        continue; // Skip this booking if it doesn't match the filtered movie
      }

      let dateObj: Date | null = null;
      let monthStr = "";
      let tightDateStr = "";
      let tightMonthStr = "";

      if (createdAtStr) {
        dateObj = new Date(createdAtStr);
        monthStr = dateObj.toLocaleString("default", { month: "long", year: "numeric" }); // e.g., "February 2026"
        
        // Local YYYY-MM-DD
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        tightDateStr = `${year}-${month}-${day}`;
        tightMonthStr = `${year}-${month}`;
      }

      if (filterMonth && filterMonth !== "all" && tightMonthStr !== filterMonth) {
        continue;
      }

      if (filterDate && tightDateStr !== filterDate) {
        continue;
      }

      validBookingIds.add(bId);

      const cleanIds = seatIdsStr.replace(/\[.*?\]\s*/, "").split(", ").filter((s: string) => s.trim() !== "");
      const ticketCount = cleanIds.length;
      totalTicketsSold += ticketCount;

      if (monthStr === currentMonthLong || tightMonthStr === currentMonthTight) {
        monthlyTicketsSold += ticketCount;
      }
    }

    // Process Revenue Log
    // Now querying A2:D => A: bookingId, B: amount, C: month, D: date
    for (const row of rows) {
      const rBookingId = row[0] || "";
      const amount = Number(row[1]) || 0;
      const monthStrLog = row[2] || "";
      const dateStrLog = row[3] || "";
      
      // If we are filtering by movieId, only include revenue logs that correspond to a valid booking
      if (movieId && !validBookingIds.has(rBookingId)) {
        continue;
      }

      let tightMonthStrLog = "";
      let tightDateStrLog = "";
      if (dateStrLog) {
         // Assuming dateStrLog is MM/DD/YYYY or similar valid string
         const d = new Date(dateStrLog);
         if (!isNaN(d.getTime())) {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            tightMonthStrLog = `${year}-${month}`;
            tightDateStrLog = `${year}-${month}-${day}`;
         }
      }

      if (filterMonth && filterMonth !== "all" && tightMonthStrLog !== filterMonth) {
        continue;
      }
      
      if (filterDate && tightDateStrLog !== filterDate) {
        continue;
      }

      totalRevenue += amount;
      if (monthStrLog === currentMonthLong || tightMonthStrLog === currentMonthTight) {
        monthlyRevenue += amount;
      }
      if (!revenueByMonth[monthStrLog]) revenueByMonth[monthStrLog] = 0;
      revenueByMonth[monthStrLog] += amount;
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

// -------------------------------------------------------------
// Bookings Management
// -------------------------------------------------------------

export async function fetchAllBookings(movieId?: string, filterMonth?: string, filterDate?: string): Promise<Booking[]> {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY || "";
  if (!privateKey || privateKey.includes("Your\\nSuper") || privateKey.includes("Your\nSuper")) {
    return globalForBookings.mockBookings.map((mb, i) => ({
      id: `mock-${i}`,
      seatIds: `[${mb.time}] ${mb.seatId}`,
      customerName: "Mock Customer",
      phone: "+971500000000",
      email: "mock@example.com",
      amount: 35,
      paymentStatus: "Paid",
      createdAt: new Date().toISOString()
    })).reverse();
  }

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "bookings!A2:H",
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) return [];

    let targetShowTime: string | null = null;
    if (movieId) {
      const allShows = await fetchAllShows();
      const targetShow = allShows.find(s => s.id === movieId);
      if (targetShow) targetShowTime = targetShow.showTime;
    }

    const bookings: Booking[] = [];
    
    for (const row of rows) {
      const seatIds = row[1] || "";
      
      if (targetShowTime) {
        const timeMatch = seatIds.match(/\[(.*?)\]/);
        const rowShowTime = timeMatch ? timeMatch[1] : null;
        if (rowShowTime !== targetShowTime) continue;
      }

      const createdAtStr = row[7] || "";
      if (filterMonth && filterMonth !== "all" || filterDate) {
         if (!createdAtStr) continue;
         const dateObj = new Date(createdAtStr);
         
         if (filterMonth && filterMonth !== "all") {
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const rowMonthStr = `${year}-${month}`;
            if (rowMonthStr !== filterMonth) continue;
         }

         if (filterDate) {
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            const tightDateStr = `${year}-${month}-${day}`;
            if (tightDateStr !== filterDate) continue;
         }
      }

      bookings.push({
        id: row[0] || "",
        seatIds,
        customerName: row[2] || "",
        phone: row[3] || "",
        email: row[4] || "",
        amount: Number(row[5]) || 0,
        paymentStatus: row[6] || "",
        createdAt: row[7] || "",
      });
    }

    return bookings.reverse();
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return [];
  }
}

// -------------------------------------------------------------
// Shows Management
// -------------------------------------------------------------

let cachedShows: Show[] | null = null;
let lastShowFetch = 0;
const SHOWS_CACHE_TTL = 30 * 1000; // 30 seconds

export async function fetchAllShows(): Promise<Show[]> {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY || "";
  if (!privateKey || privateKey.includes("Your\\nSuper") || privateKey.includes("Your\nSuper")) {
    return globalForBookings.mockShows;
  }

  const now = Date.now();
  if (cachedShows && (now - lastShowFetch < SHOWS_CACHE_TTL)) {
    return cachedShows;
  }

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "shows!A2:D",
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) return [];

    const builtShows = rows.map((row) => ({
      id: row[0],
      movieTitle: row[1],
      showTime: row[2],
      isActive: row[3] === "TRUE",
    }));

    cachedShows = builtShows;
    lastShowFetch = Date.now();

    return builtShows;
  } catch (error) {
    console.error("Error fetching shows:", error);
    return [];
  }
}

export async function createShow(show: Show) {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY || "";
  if (!privateKey || privateKey.includes("Your\\nSuper") || privateKey.includes("Your\nSuper")) {
    globalForBookings.mockShows.push(show);
    return;
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: "shows!A:D",
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [[show.id, show.movieTitle, show.showTime, show.isActive ? "TRUE" : "FALSE"]],
    },
  });
}

export async function updateShow(showId: string, updatedShow: Partial<Show>) {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY || "";
  if (!privateKey || privateKey.includes("Your\\nSuper") || privateKey.includes("Your\nSuper")) {
    const index = globalForBookings.mockShows.findIndex((s) => s.id === showId);
    if (index !== -1) {
      globalForBookings.mockShows[index] = { ...globalForBookings.mockShows[index], ...updatedShow };
    }
    return;
  }

  // Real sheets update (fetching all, finding row, updating row)
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "shows!A:A", 
  });
  
  const ids = response.data.values?.map((r) => r[0]) || [];
  const rowIndex = ids.indexOf(showId);
  
  if (rowIndex === -1) throw new Error(`Show ${showId} not found`);
  const exactRow = rowIndex + 1;

  // We have to figure out exactly what to update. Simplest is overwriting A:D for that row
  // We'll fetch the current row first if it's partial, or just trust the admin UI passes complete data
  const currentShowRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `shows!A${exactRow}:D${exactRow}`,
  });
  const currentRow = currentShowRes.data.values?.[0];
  if (!currentRow) throw new Error(`Row data for ${showId} not found`);

  const mergedShow = {
    id: showId,
    movieTitle: updatedShow.movieTitle !== undefined ? updatedShow.movieTitle : currentRow[1],
    showTime: updatedShow.showTime !== undefined ? updatedShow.showTime : currentRow[2],
    isActive: updatedShow.isActive !== undefined ? (updatedShow.isActive ? "TRUE" : "FALSE") : currentRow[3],
  };

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `shows!A${exactRow}:D${exactRow}`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[mergedShow.id, mergedShow.movieTitle, mergedShow.showTime, mergedShow.isActive]],
    },
  });
}

export async function deleteShow(showId: string) {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY || "";
  if (!privateKey || privateKey.includes("Your\\nSuper") || privateKey.includes("Your\nSuper")) {
    globalForBookings.mockShows = globalForBookings.mockShows.filter((s) => s.id !== showId);
    return;
  }

  // It's safer to just set isActive to false or clear the row rather than hard deleting the row natively via API
  await updateShow(showId, { isActive: false });
}
