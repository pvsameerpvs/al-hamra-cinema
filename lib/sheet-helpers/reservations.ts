import { sheets, SPREADSHEET_ID } from "../google";
import { Reservation, ReservationStatus } from "../types";
import { isMockMode, mockStore } from "./shared";
import { deleteSheetRows } from "./sheetUtils";

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

function computeReservationStatus(
  statusRaw: string,
  expiresAtRaw: string,
  showDateRaw?: string
): ReservationStatus {
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
  if (!reservationId) return null;

  if (isMockMode()) {
    const r = mockStore.mockReservations.find((x) => x.id === reservationId);
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
  const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

  if (isMockMode()) {
    let list: Reservation[] = mockStore.mockReservations.map((r) => ({
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
  const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
  const now = new Date();
  const createdAt = now.toISOString();
  const safeShowDate = isoDatePattern.test(input.showDate) ? input.showDate : createdAt.split("T")[0];

  const expiresAt = new Date(`${safeShowDate}T23:59:59.999Z`).toISOString();

  const reservationId = `res_${Math.random().toString(16).slice(2)}_${Date.now()}`;

  if (isMockMode()) {
    mockStore.mockReservations.push({
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
  if (!reservationId) throw new Error("Missing reservationId");

  if (isMockMode()) {
    const idx = mockStore.mockReservations.findIndex((r) => r.id === reservationId);
    if (idx !== -1) mockStore.mockReservations[idx].status = status;
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

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `reservations!H${sheetRow}`,
    valueInputOption: "RAW",
    requestBody: { values: [[status]] },
  });
}

export async function deleteReservationRecord(reservationId: string): Promise<void> {
  const id = String(reservationId || "").trim();
  if (!id) throw new Error("Missing reservationId");

  if (isMockMode()) {
    const idx = mockStore.mockReservations.findIndex((r) => r.id === id);
    if (idx !== -1) mockStore.mockReservations.splice(idx, 1);
    return;
  }

  const idRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "reservations!A:A",
  });

  const ids = idRes.data.values?.map((r) => r[0]) || [];
  const rowIndex = ids.indexOf(id);
  if (rowIndex === -1) throw new Error(`Reservation ${id} not found`);

  const sheetRow = rowIndex + 1;
  if (sheetRow <= 1) throw new Error("Refusing to delete header row");

  await deleteSheetRows("reservations", [sheetRow]);
}
