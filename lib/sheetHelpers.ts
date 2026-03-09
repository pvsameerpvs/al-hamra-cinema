import { sheets, SPREADSHEET_ID } from "./google";
import {
  Seat,
  SeatStatus,
  Show,
  Booking,
  Reservation,
  ReservationStatus,
  User,
  UserRole,
} from "./types";

interface MockBooking {
  seatId: string;
  showKey: string;
  showDate: string;
}

interface MockReservation {
  id: string;
  showId: string;
  showDate: string;
  seatIds: string[];
  customerName: string;
  phone: string;
  email: string;
  status: ReservationStatus;
  expiresAt: string;
  createdAt: string;
}

const globalForBookings = global as unknown as {
  mockBookings: MockBooking[];
  mockShows: Show[];
  mockReservations: MockReservation[];
};
if (!globalForBookings.mockBookings) globalForBookings.mockBookings = [];
if (!globalForBookings.mockReservations) globalForBookings.mockReservations = [];
if (!globalForBookings.mockShows) {
  globalForBookings.mockShows = [
    { id: "1", movieTitle: "Dune: Part Two", showTime: "10:00 AM", isActive: true },
    { id: "2", movieTitle: "Spider-Man", showTime: "01:00 PM", isActive: true },
    { id: "3", movieTitle: "Avatar 3", showTime: "04:00 PM", isActive: true },
    { id: "4", movieTitle: "Inception", showTime: "07:00 PM", isActive: true },
    { id: "5", movieTitle: "Interstellar", showTime: "10:00 PM", isActive: true },
  ];
}

export async function fetchAllSeats(showKey?: string, showDate?: string): Promise<Seat[]> {
  const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
  const today = new Date().toISOString().split("T")[0];
  const targetDate = showDate && isoDatePattern.test(showDate) ? showDate : today;
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

    // Derive bookings for the current showKey + date
    if (showKey) {
      mockSeats.forEach((seat) => {
        const isBooked = globalForBookings.mockBookings.some(
          (b) => b.seatId === seat.seat_id && b.showKey === showKey && b.showDate === targetDate
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

          const cleanIds = seatIdsCol.replace(/\[.*?\]\s*/, "").split(", ").filter((s: string) => s.trim() !== "");
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
  paymentStatus: string,
  showDate?: string
) {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY || "";
  if (!privateKey || privateKey.includes("Your\\nSuper") || privateKey.includes("Your\nSuper")) {
    console.warn(`Mock: createBookingRecord(${bookingId}, ${seatIds}) passed to memory.`);
    const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
    const today = new Date().toISOString().split("T")[0];
    const targetShowDate = showDate && isoDatePattern.test(showDate) ? showDate : today;

    const bracketMatch = seatIds.match(/\[(.*?)\]/);
    const showKey = bracketMatch ? bracketMatch[1] : "";
    const cleanly = seatIds.replace(/\[.*?\]\s*/, "").split(", ").filter((s) => s.trim() !== "");
    cleanly.forEach((s) => {
      globalForBookings.mockBookings.push({ seatId: s.trim(), showKey, showDate: targetShowDate });
    });
    return;
  }

  const createdAt = new Date().toISOString();
  const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
  const today = new Date().toISOString().split("T")[0];
  const targetShowDate = showDate && isoDatePattern.test(showDate) ? showDate : today;

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: "bookings!A:I",
    valueInputOption: "RAW",
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
          targetShowDate,
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
    valueInputOption: "RAW",
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
      totalBookings: 55,
      totalRevenue: 2800,
      monthlyTicketsSold: 45,
      monthlyBookings: 18,
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
      range: "bookings!A2:I",
    });

    const rows = revenueRes.data.values || [];
    const bookingRows = bookingsRes.data.values || [];
    
    let totalTicketsSold = 0;
    let totalBookings = 0;
    let totalRevenue = 0;
    let monthlyTicketsSold = 0;
    let monthlyBookings = 0;
    let monthlyRevenue = 0;
    
    const now = new Date();
    const currentMonthLong = now.toLocaleString("default", { month: "long", year: "numeric" });
    const currentYear = now.getFullYear();
    const currentMonthPad = String(now.getMonth() + 1).padStart(2, '0');
    const currentMonthTight = `${currentYear}-${currentMonthPad}`;
    
    // Revenue over time (for graph)
    const revenueByMonth: Record<string, number> = {};

    // For server-side filtering
    const validTargetIdentifiers = new Set<string>();
    const validBookingIds = new Set<string>();

    if (movieId) {
      const allShows = await fetchAllShows();
      const targetShows = allShows.filter(s => s.movieTitle === movieId);
      for (const show of targetShows) {
        validTargetIdentifiers.add(show.id);
        validTargetIdentifiers.add(show.showTime);
      }
    }

    // Process bookings first so we know which IDs belong to the target show
    for (const row of bookingRows) {
      const bId = row[0] || ""; // A: bookingId
      const seatIdsStr = row[1] || ""; // B: seatIds (includes [showKey])
      const createdAtStr = row[7] || ""; // H: createdAt
      
      const timeMatch = seatIdsStr.match(/\[(.*?)\]/);
      const rowIdentifier = timeMatch ? timeMatch[1] : null;

      if (movieId && rowIdentifier && !validTargetIdentifiers.has(rowIdentifier)) {
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
      totalBookings += 1;
      totalTicketsSold += ticketCount;

      if (monthStr === currentMonthLong || tightMonthStr === currentMonthTight) {
        monthlyBookings += 1;
        monthlyTicketsSold += ticketCount;
      }
    }

    // Process Revenue Log
    // Now querying A2:D => A: bookingId, B: amount, C: month, D: date
    for (const row of rows) {
      const rBookingId = row[0] || "";
      const amount = Number(row[1]) || 0;
      let monthStrLog = row[2] || "";
      let dateStrLog = row[3] || "";

      // Handle raw Google Sheets serial numbers internally (e.g. 46082 -> Date)
      if (!isNaN(Number(dateStrLog)) && Number(dateStrLog) > 40000) {
        const d = new Date(Math.round((Number(dateStrLog) - 25569) * 864e5));
        dateStrLog = d.toISOString().split("T")[0]; // Convert back to YYYY-MM-DD
      }
      if (!isNaN(Number(monthStrLog)) && Number(monthStrLog) > 40000) {
        const d = new Date(Math.round((Number(monthStrLog) - 25569) * 864e5));
        monthStrLog = d.toLocaleString("default", { month: "long", year: "numeric" });
      }
      
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
      totalBookings,
      totalRevenue,
      monthlyTicketsSold,
      monthlyBookings,
      monthlyRevenue,
      chartData,
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {
      totalTicketsSold: 0,
      totalBookings: 0,
      totalRevenue: 0,
      monthlyTicketsSold: 0,
      monthlyBookings: 0,
      monthlyRevenue: 0,
      chartData: [],
    };
  }
}

// -------------------------------------------------------------
// Bookings Management
// -------------------------------------------------------------

export async function fetchAllBookings(
  movieId?: string,
  filterMonth?: string,
  filterDate?: string,
  filterShowDate?: string
): Promise<Booking[]> {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY || "";
  if (!privateKey || privateKey.includes("Your\\nSuper") || privateKey.includes("Your\nSuper")) {
    return globalForBookings.mockBookings.map((mb, i) => ({
      id: `mock-${i}`,
      seatIds: `[${mb.showKey}] ${mb.seatId}`,
      customerName: "Mock Customer",
      phone: "+971500000000",
      email: "mock@example.com",
      amount: 35,
      paymentStatus: "Paid",
      createdAt: new Date().toISOString(),
      showDate: mb.showDate,
    })).reverse();
  }

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "bookings!A2:I",
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) return [];

    let allowedBracketValues: Set<string> | null = null;
    if (movieId) {
      const allShows = await fetchAllShows();
      const byId = allShows.find((s) => s.id === movieId);

      if (byId) {
        allowedBracketValues = new Set([byId.id, byId.showTime]);
      } else {
        // Backward-compatible: treat movieId as a movie title
        const byTitle = allShows.filter((s) => s.movieTitle === movieId);
        allowedBracketValues = new Set(byTitle.flatMap((s) => [s.id, s.showTime]));
      }
    }

    const bookings: Booking[] = [];
    
    for (const row of rows) {
      const seatIds = row[1] || "";

      const bracketMatch = seatIds.match(/\[(.*?)\]/);
      const bracketValue = bracketMatch ? bracketMatch[1] : "";

      if (allowedBracketValues && (!bracketValue || !allowedBracketValues.has(bracketValue))) {
        continue;
      }

      const createdAtStr = row[7] || "";
      const explicitShowDate = row[8] || "";
      const computedShowDate = explicitShowDate || (createdAtStr ? createdAtStr.split("T")[0] : "");

      // Filter by showDate (pre-booking aware)
      if (filterShowDate && computedShowDate !== filterShowDate) {
        continue;
      }

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
        showDate: computedShowDate || undefined,
      });
    }

    return bookings.reverse();
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return [];
  }
}

// -------------------------------------------------------------
// Reservations Management
// Schema: reservations!A:J
//   A: reservation_id
//   B: show_id
//   C: show_date (YYYY-MM-DD)
//   D: seat_ids (comma-separated)
//   E: customer_name
//   F: phone
//   G: email
//   H: status (Active | Cancelled | Expired)
//   I: expires_at (ISO)
//   J: created_at (ISO)
// -------------------------------------------------------------

const RESERVATIONS_SHEET_RANGE = "reservations!A2:J";
const RESERVATIONS_HEADER = [
  "reservation_id",
  "show_id",
  "show_date",
  "seat_ids",
  "customer_name",
  "phone",
  "email",
  "status",
  "expires_at",
  "created_at",
];

export { RESERVATIONS_HEADER };

function computeReservationStatus(statusRaw: string, expiresAtRaw: string, showDateRaw?: string): ReservationStatus {
  const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
  const todayIso = new Date().toISOString().split("T")[0];
  if (showDateRaw && isoDatePattern.test(showDateRaw) && showDateRaw < todayIso) return "Expired";

  const normalized = (statusRaw || "").trim();
  if (normalized === "Cancelled") return "Cancelled";
  if (normalized === "Expired") return "Expired";
  if (normalized !== "Active") return "Expired";

  const exp = new Date(expiresAtRaw || "").getTime();
  if (isNaN(exp)) return "Expired";
  if (exp <= Date.now()) return "Expired";
  return "Active";
}

export async function fetchReservationById(reservationId: string): Promise<Reservation | null> {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY || "";
  if (!reservationId) return null;

  if (!privateKey || privateKey.includes("Your\\nSuper") || privateKey.includes("Your\nSuper")) {
    const r = globalForBookings.mockReservations.find((x) => x.id === reservationId);
    if (!r) return null;
    return {
      id: r.id,
      showId: r.showId,
      showDate: r.showDate,
      seatIds: r.seatIds.join(", "),
      customerName: r.customerName,
      phone: r.phone,
      email: r.email,
      status: computeReservationStatus(r.status, r.expiresAt, r.showDate),
      expiresAt: r.expiresAt,
      createdAt: r.createdAt,
    };
  }

  const idRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "reservations!A:A",
  });
  const ids = idRes.data.values?.map((r) => r[0]) || [];
  const rowIndex = ids.indexOf(reservationId);
  if (rowIndex === -1) return null;

  const sheetRow = rowIndex + 1;
  const rowRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `reservations!A${sheetRow}:J${sheetRow}`,
  });
  const row = rowRes.data.values?.[0] || [];
  if (!row || row.length === 0) return null;

  const status = computeReservationStatus(String(row[7] || ""), String(row[8] || ""), String(row[2] || ""));
  return {
    id: String(row[0] || ""),
    showId: String(row[1] || ""),
    showDate: String(row[2] || ""),
    seatIds: String(row[3] || ""),
    customerName: String(row[4] || ""),
    phone: String(row[5] || ""),
    email: String(row[6] || ""),
    status,
    expiresAt: String(row[8] || ""),
    createdAt: String(row[9] || ""),
  };
}

export async function fetchAllReservations(
  filterShowDate?: string,
  filterStatus?: ReservationStatus | "all",
  filterShowId?: string
): Promise<Reservation[]> {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY || "";
  const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

  if (!privateKey || privateKey.includes("Your\\nSuper") || privateKey.includes("Your\nSuper")) {
    let list: Reservation[] = globalForBookings.mockReservations.map((r) => ({
      id: r.id,
      showId: r.showId,
      showDate: r.showDate,
      seatIds: r.seatIds.join(", "),
      customerName: r.customerName,
      phone: r.phone,
      email: r.email,
      status: computeReservationStatus(r.status, r.expiresAt, r.showDate),
      expiresAt: r.expiresAt,
      createdAt: r.createdAt,
    }));

    if (filterShowId) list = list.filter((x) => x.showId === filterShowId);
    if (filterShowDate && isoDatePattern.test(filterShowDate)) list = list.filter((x) => x.showDate === filterShowDate);
    if (filterStatus && filterStatus !== "all") list = list.filter((x) => x.status === filterStatus);

    return list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  }

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RESERVATIONS_SHEET_RANGE,
    });
    const rows = res.data.values || [];

    let reservations: Reservation[] = rows
      .filter((r) => (r[0] || "").trim() !== "")
      .map((r) => {
        const status = computeReservationStatus(r[7] || "", r[8] || "", r[2] || "");
        return {
          id: r[0] || "",
          showId: r[1] || "",
          showDate: r[2] || "",
          seatIds: r[3] || "",
          customerName: r[4] || "",
          phone: r[5] || "",
          email: r[6] || "",
          status,
          expiresAt: r[8] || "",
          createdAt: r[9] || "",
        };
      });

    if (filterShowId) reservations = reservations.filter((x) => x.showId === filterShowId);
    if (filterShowDate && isoDatePattern.test(filterShowDate)) reservations = reservations.filter((x) => x.showDate === filterShowDate);
    if (filterStatus && filterStatus !== "all") reservations = reservations.filter((x) => x.status === filterStatus);

    return reservations.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  } catch (error) {
    console.error("Error fetching reservations:", error);
    return [];
  }
}

export async function createReservationRecord(input: {
  showId: string;
  showDate: string;
  seatIds: string[];
  customerName: string;
  phone: string;
  email: string;
  ttlMinutes?: number;
}): Promise<{ reservationId: string; expiresAt: string }> {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY || "";
  const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
  const now = new Date();
  const createdAt = now.toISOString();
  const safeShowDate = isoDatePattern.test(input.showDate) ? input.showDate : createdAt.split("T")[0];

  // Reservation is an advance hold for later show/date (payment at counter when issuing the ticket).
  // Default expiry is end-of-show-date to cover morning -> evening reservations.
  const expiresAt = new Date(`${safeShowDate}T23:59:59.999Z`).toISOString();

  // Lightweight UUID without adding dependency (uuid already exists in deps, but keep helpers pure)
  const reservationId = `res_${Math.random().toString(16).slice(2)}_${Date.now()}`;

  if (!privateKey || privateKey.includes("Your\\nSuper") || privateKey.includes("Your\nSuper")) {
    globalForBookings.mockReservations.push({
      id: reservationId,
      showId: input.showId,
      showDate: safeShowDate,
      seatIds: input.seatIds,
      customerName: input.customerName,
      phone: input.phone,
      email: input.email,
      status: "Active",
      expiresAt,
      createdAt,
    });
    return { reservationId, expiresAt };
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: RESERVATIONS_SHEET_RANGE,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [
        [
          reservationId,
          input.showId,
          safeShowDate,
          input.seatIds.join(", "),
          input.customerName,
          input.phone,
          input.email,
          "Active",
          expiresAt,
          createdAt,
        ],
      ],
    },
  });

  return { reservationId, expiresAt };
}

export async function updateReservationStatus(reservationId: string, status: ReservationStatus): Promise<void> {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY || "";
  if (!reservationId) throw new Error("Missing reservationId");

  if (!privateKey || privateKey.includes("Your\\nSuper") || privateKey.includes("Your\nSuper")) {
    const idx = globalForBookings.mockReservations.findIndex((r) => r.id === reservationId);
    if (idx !== -1) globalForBookings.mockReservations[idx].status = status;
    return;
  }

  const idRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "reservations!A:A",
  });
  const ids = idRes.data.values?.map((r) => r[0]) || [];
  const rowIndex = ids.indexOf(reservationId);
  if (rowIndex === -1) throw new Error(`Reservation ${reservationId} not found`);
  const sheetRow = rowIndex + 1;

  // Status column is H
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `reservations!H${sheetRow}`,
    valueInputOption: "RAW",
    requestBody: { values: [[status]] },
  });
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

export async function getUserByCredentials(emailStr: string, passwordStr: string): Promise<{email: string, role: string} | null> {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "users!A2:D",
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) return null;

    // Trimming the email from the sheet just in case there are trailing spaces in the DB
    const row = rows.find(r => (r[0] || "").trim() === emailStr && r[1] === passwordStr);
    if (row) {
      return { email: row[0].trim(), role: row[2] || "user" };
    }
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("Unable to parse range")) {
      console.error("The 'users' tab does not exist in the Google Sheet!");
    } else {
      console.error("Error finding user:", error);
    }
    return null;
  }
  return null;
}

// -------------------------------------------------------------
// Users Management
// Schema: users!A:D
//   A: email      — unique login identifier
//   B: password   — plain text (consider hashing in production)
//   C: role       — "admin" | "user"
//   D: createdAt  — ISO 8601 timestamp
// -------------------------------------------------------------

const USERS_SHEET_RANGE = "users!A2:D";
const USERS_HEADER = ["email", "password", "role", "createdAt"];

// Removed in-memory mock store and isMockMode because we strictly use the DB now.

/** Return all users (without exposing passwords to the caller — handled at API layer) */
export async function getAllUsers(): Promise<User[]> {

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: USERS_SHEET_RANGE,
    });
    const rows = res.data.values || [];
    return rows.map((r) => ({
      email: r[0] || "",
      password: r[1] || "",
      role: (r[2] as UserRole) || "user",
      createdAt: r[3] || "",
    }));
  } catch (err) {
    console.error("getAllUsers error:", err);
    return [];
  }
}

/** Create a new user row in the sheet */
export async function createUser(user: Omit<User, "createdAt">): Promise<void> {
  const createdAt = new Date().toISOString();
  const newUser: User = { ...user, createdAt };

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: USERS_SHEET_RANGE,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [[newUser.email, newUser.password, newUser.role, newUser.createdAt]],
    },
  });
}

/** Update an existing user's role (and optionally password) by email */
export async function updateUser(
  email: string,
  updates: Partial<Pick<User, "password" | "role">>
): Promise<void> {

  // Find the row number in the sheet
  const idRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "users!A:A",
  });
  const emails = idRes.data.values?.map((r) => r[0]) || [];
  const rowIndex = emails.indexOf(email);
  if (rowIndex === -1) throw new Error(`User ${email} not found`);
  const sheetRow = rowIndex + 1; // 1-based (header is row 1, data starts at row 2)

  // Fetch current row to merge changes
  const curRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `users!A${sheetRow}:D${sheetRow}`,
  });
  const cur = curRes.data.values?.[0] || [];

  const merged = [
    cur[0] || email,
    updates.password !== undefined ? updates.password : (cur[1] || ""),
    updates.role !== undefined ? updates.role : (cur[2] || "user"),
    cur[3] || new Date().toISOString(),
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `users!A${sheetRow}:D${sheetRow}`,
    valueInputOption: "RAW",
    requestBody: { values: [merged] },
  });
}

/** Delete (clear) a user row by email */
export async function deleteUser(email: string): Promise<void> {

  const idRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "users!A:A",
  });
  const emails = idRes.data.values?.map((r) => r[0]) || [];
  const rowIndex = emails.indexOf(email);
  if (rowIndex === -1) throw new Error(`User ${email} not found`);
  const sheetRow = rowIndex + 1;

  // Clear the row (blanks it out)
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: `users!A${sheetRow}:D${sheetRow}`,
  });
}

/** Export the header constant so the init route can use it */
export { USERS_HEADER };
