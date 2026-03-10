import { sheets, SPREADSHEET_ID } from "../google";
import { Booking } from "../types";
import { fetchAllShows } from "./shows";
import { isMockMode, mockStore } from "./shared";
import { deleteSheetRows } from "./sheetUtils";

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
  if (isMockMode()) {
    console.warn(`Mock: createBookingRecord(${bookingId}, ${seatIds}) passed to memory.`);
    const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
    const today = new Date().toISOString().split("T")[0];
    const targetShowDate = showDate && isoDatePattern.test(showDate) ? showDate : today;

    const bracketMatch = seatIds.match(/\[(.*?)\]/);
    const showKey = bracketMatch ? bracketMatch[1] : "";
    const cleanly = seatIds
      .replace(/\[.*?\]\s*/, "")
      .split(", ")
      .filter((s) => s.trim() !== "");

    cleanly.forEach((s) => {
      mockStore.mockBookings.push({ seatId: s.trim(), showKey, showDate: targetShowDate });
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
      values: [[bookingId, seatIds, customerName, phone, email, amount, paymentStatus, createdAt, targetShowDate]],
    },
  });
}

export async function createRevenueLog(bookingId: string, amount: number, month: string, date: string) {
  if (isMockMode()) {
    console.warn("Mock: createRevenueLog bypassed.");
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
  if (isMockMode()) {
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
    const currentMonthPad = String(now.getMonth() + 1).padStart(2, "0");
    const currentMonthTight = `${currentYear}-${currentMonthPad}`;

    const revenueByMonth: Record<string, number> = {};

    const validTargetIdentifiers = new Set<string>();
    const validBookingIds = new Set<string>();

    if (movieId) {
      const allShows = await fetchAllShows();
      const targetShows = allShows.filter((s) => s.movieTitle === movieId);
      for (const show of targetShows) {
        validTargetIdentifiers.add(show.id);
        validTargetIdentifiers.add(show.showTime);
      }
    }

    for (const row of bookingRows) {
      const bId = row[0] || "";
      const seatIdsStr = row[1] || "";
      const createdAtStr = row[7] || "";

      const timeMatch = seatIdsStr.match(/\[(.*?)\]/);
      const rowIdentifier = timeMatch ? timeMatch[1] : null;

      if (movieId && rowIdentifier && !validTargetIdentifiers.has(rowIdentifier)) {
        continue;
      }

      let dateObj: Date | null = null;
      let monthStr = "";
      let tightDateStr = "";
      let tightMonthStr = "";

      if (createdAtStr) {
        dateObj = new Date(createdAtStr);
        monthStr = dateObj.toLocaleString("default", { month: "long", year: "numeric" });

        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const day = String(dateObj.getDate()).padStart(2, "0");
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

      const cleanIds = seatIdsStr
        .replace(/\[.*?\]\s*/, "")
        .split(", ")
        .filter((s: string) => s.trim() !== "");

      const ticketCount = cleanIds.length;
      totalBookings += 1;
      totalTicketsSold += ticketCount;

      if (monthStr === currentMonthLong || tightMonthStr === currentMonthTight) {
        monthlyBookings += 1;
        monthlyTicketsSold += ticketCount;
      }
    }

    for (const row of rows) {
      const rBookingId = row[0] || "";
      const amount = Number(row[1]) || 0;
      let monthStrLog = row[2] || "";
      let dateStrLog = row[3] || "";

      if (!isNaN(Number(dateStrLog)) && Number(dateStrLog) > 40000) {
        const d = new Date(Math.round((Number(dateStrLog) - 25569) * 864e5));
        dateStrLog = d.toISOString().split("T")[0];
      }
      if (!isNaN(Number(monthStrLog)) && Number(monthStrLog) > 40000) {
        const d = new Date(Math.round((Number(monthStrLog) - 25569) * 864e5));
        monthStrLog = d.toLocaleString("default", { month: "long", year: "numeric" });
      }

      if (movieId && !validBookingIds.has(rBookingId)) {
        continue;
      }

      let tightMonthStrLog = "";
      let tightDateStrLog = "";
      if (dateStrLog) {
        const d = new Date(dateStrLog);
        if (!isNaN(d.getTime())) {
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
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

export async function fetchAllBookings(
  movieId?: string,
  filterMonth?: string,
  filterDate?: string,
  filterShowDate?: string
): Promise<Booking[]> {
  if (isMockMode()) {
    return mockStore.mockBookings
      .map((mb, i) => ({
        id: `mock-${i}`,
        seatIds: `[${mb.showKey}] ${mb.seatId}`,
        customerName: "Mock Customer",
        phone: "+971500000000",
        email: "mock@example.com",
        amount: 35,
        paymentStatus: "Paid",
        createdAt: new Date().toISOString(),
        showDate: mb.showDate,
      }))
      .reverse();
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

      if (filterShowDate && computedShowDate !== filterShowDate) {
        continue;
      }

      if ((filterMonth && filterMonth !== "all") || filterDate) {
        if (!createdAtStr) continue;
        const dateObj = new Date(createdAtStr);

        if (filterMonth && filterMonth !== "all") {
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, "0");
          const rowMonthStr = `${year}-${month}`;
          if (rowMonthStr !== filterMonth) continue;
        }

        if (filterDate) {
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, "0");
          const day = String(dateObj.getDate()).padStart(2, "0");
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

export async function deleteBookingRecord(bookingId: string): Promise<void> {
  const id = String(bookingId || "").trim();
  if (!id) throw new Error("Missing bookingId");

  if (isMockMode()) {
    if (!id.startsWith("mock-")) {
      console.warn("Mock: deleteBookingRecord ignored (non-mock id)");
      return;
    }

    const idx = Number(id.slice("mock-".length));
    if (!Number.isFinite(idx) || idx < 0) return;
    if (!mockStore.mockBookings || idx >= mockStore.mockBookings.length) return;
    mockStore.mockBookings.splice(idx, 1);
    return;
  }

  const idRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "bookings!A:A",
  });

  const ids = idRes.data.values?.map((r) => r[0]) || [];
  const rowIndex = ids.indexOf(id);
  if (rowIndex === -1) throw new Error(`Booking ${id} not found`);
  const sheetRow = rowIndex + 1;

  if (sheetRow <= 1) throw new Error("Refusing to delete header row");
  await deleteSheetRows("bookings", [sheetRow]);
}

export async function deleteRevenueLogsByBookingId(bookingId: string): Promise<number> {
  const id = String(bookingId || "").trim();
  if (!id) throw new Error("Missing bookingId");

  if (isMockMode()) {
    return 0;
  }

  const idRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "revenue_logs!A:A",
  });

  const ids = idRes.data.values?.map((r) => r[0]) || [];
  const matches: number[] = [];
  for (let i = 0; i < ids.length; i++) {
    if (ids[i] === id) matches.push(i);
  }

  const rowsToDelete = matches.filter((x) => x >= 1).map((x) => x + 1);
  return await deleteSheetRows("revenue_logs", rowsToDelete);
}
