import { Booking, Show } from "@/lib/types";

export type SeatClass = "B" | "O";

export type DailyClassSummaryRow = {
  classCode: SeatClass;
  lifetimeTicketsSold: number;
  selectedMovieTicketsSold: number;
  todayTicketsSold: number;
  ticketPrice: number;
  grossCollection: number;
};

export type DailyShowTimeSummary = {
  showTime: string;
  rows: DailyClassSummaryRow[];
};

export type DailyReportFilters = {
  selectedDate: string;
  selectedMovie: string;
  selectedShowTime: string;
};

export type DailyReportComputation = {
  movieOptions: string[];
  showTimeOptions: string[];
  showTimeReports: DailyShowTimeSummary[];
  grandTotalLifetimeTickets: number;
  grandTotalSelectedMovieTickets: number;
  grandTotalTodayTickets: number;
  grandTotalGross: number;
  municipalTax: number;
  netAmount: number;
  distributorShare: number;
};

const CLASS_PRICES: Record<SeatClass, number> = {
  B: 35,
  O: 30,
};

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function parseShowTimeMinutes(raw: string) {
  if (!raw) return Number.POSITIVE_INFINITY;

  const trimmed = raw.trim();

  if (!isNaN(Number(trimmed)) && trimmed.includes(".")) {
    const fraction = Number(trimmed);
    return Math.round(fraction * 24 * 60);
  }

  const m12 = trimmed.match(/^(\d{1,2})\s*:\s*(\d{2})(?:\s*:\s*\d{2})?\s*(AM|PM)$/i);
  if (m12) {
    let h = parseInt(m12[1], 10);
    const min = parseInt(m12[2], 10);
    const ap = m12[3].toUpperCase();
    if (h === 12) h = 0;
    if (ap === "PM") h += 12;
    return h * 60 + min;
  }

  const m24 = trimmed.match(/^(\d{1,2})\s*:\s*(\d{2})(?:\s*:\s*\d{2})?$/);
  if (m24) {
    const h = parseInt(m24[1], 10);
    const min = parseInt(m24[2], 10);
    return h * 60 + min;
  }

  return Number.POSITIVE_INFINITY;
}

function extractBracketValue(seatIds: string) {
  const match = (seatIds || "").match(/\[(.*?)\]/);
  return match ? match[1] : "";
}

function parseSeatIds(seatIds: string) {
  return String(seatIds || "")
    .replace(/\[.*?\]\s*/, "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function resolveSeatClass(seatId: string): SeatClass {
  return seatId.toUpperCase().startsWith("B") ? "B" : "O";
}

function getBookingShowDate(booking: Booking) {
  if (booking.showDate) return booking.showDate;
  if (booking.createdAt) return booking.createdAt.split("T")[0];
  return "";
}

function resolveBookingShow(seatIds: string, relevantShows: Show[]) {
  const bracket = extractBracketValue(seatIds || "");

  let show = bracket ? relevantShows.find((s) => s.id === bracket) : undefined;
  if (!show && bracket) show = relevantShows.find((s) => s.showTime === bracket);

  return {
    movieTitle: show?.movieTitle,
    showTime: show?.showTime || bracket,
  };
}

export function computeDailyReport(
  bookings: Booking[],
  shows: Show[],
  filters: DailyReportFilters
): DailyReportComputation {
  const { selectedDate, selectedMovie, selectedShowTime } = filters;

  const bookingBracketValues = new Set<string>();
  bookings.forEach((b) => {
    const v = extractBracketValue(b.seatIds || "");
    if (v) bookingBracketValues.add(v);
  });

  const relevantShows = shows.filter(
    (s) => s.isActive || bookingBracketValues.has(s.id) || bookingBracketValues.has(s.showTime)
  );

  const movieOptions = Array.from(new Set(relevantShows.map((s) => s.movieTitle))).sort((a, b) =>
    a.localeCompare(b)
  );

  const showTimeTargetShows =
    selectedMovie !== "all" ? relevantShows.filter((s) => s.movieTitle === selectedMovie) : relevantShows;
  const showTimeOptions = Array.from(new Set(showTimeTargetShows.map((s) => s.showTime))).sort(
    (a, b) => parseShowTimeMinutes(a) - parseShowTimeMinutes(b)
  );

  const targetShows =
    selectedMovie !== "all" ? relevantShows.filter((s) => s.movieTitle === selectedMovie) : relevantShows;
  const uniqueShowtimes = Array.from(new Set(targetShows.map((s) => s.showTime))).sort(
    (a, b) => parseShowTimeMinutes(a) - parseShowTimeMinutes(b)
  );
  const showtimesToRender = selectedShowTime !== "all" ? [selectedShowTime] : uniqueShowtimes;

  const showTimeReports: DailyShowTimeSummary[] = showtimesToRender.map((showTime) => {
    const summary: Record<SeatClass, Omit<DailyClassSummaryRow, "classCode" | "ticketPrice">> = {
      B: {
        lifetimeTicketsSold: 0,
        selectedMovieTicketsSold: 0,
        todayTicketsSold: 0,
        grossCollection: 0,
      },
      O: {
        lifetimeTicketsSold: 0,
        selectedMovieTicketsSold: 0,
        todayTicketsSold: 0,
        grossCollection: 0,
      },
    };

    for (const booking of bookings) {
      const seats = parseSeatIds(booking.seatIds || "");
      if (!seats.length) continue;

      const resolved = resolveBookingShow(booking.seatIds || "", relevantShows);
      if (resolved.showTime !== showTime) continue;

      const matchesSelectedMovie = selectedMovie === "all" || resolved.movieTitle === selectedMovie;
      const isSelectedDate = getBookingShowDate(booking) === selectedDate;

      for (const seat of seats) {
        const seatClass = resolveSeatClass(seat);
        summary[seatClass].lifetimeTicketsSold += 1;

        if (matchesSelectedMovie) {
          summary[seatClass].selectedMovieTicketsSold += 1;
        }

        if (matchesSelectedMovie && isSelectedDate) {
          summary[seatClass].todayTicketsSold += 1;
        }
      }
    }

    const rows: DailyClassSummaryRow[] = (["B", "O"] as const).map((classCode) => {
      const todayTicketsSold = summary[classCode].todayTicketsSold;
      const ticketPrice = CLASS_PRICES[classCode];
      return {
        classCode,
        lifetimeTicketsSold: summary[classCode].lifetimeTicketsSold,
        selectedMovieTicketsSold: summary[classCode].selectedMovieTicketsSold,
        todayTicketsSold,
        ticketPrice,
        grossCollection: round2(todayTicketsSold * ticketPrice),
      };
    });

    return { showTime, rows };
  });

  const allRows = showTimeReports.flatMap((report) => report.rows);
  const grandTotalLifetimeTickets = allRows.reduce((acc, row) => acc + row.lifetimeTicketsSold, 0);
  const grandTotalSelectedMovieTickets = allRows.reduce((acc, row) => acc + row.selectedMovieTicketsSold, 0);
  const grandTotalTodayTickets = allRows.reduce((acc, row) => acc + row.todayTicketsSold, 0);
  const grandTotalGross = round2(allRows.reduce((acc, row) => acc + row.grossCollection, 0));
  const municipalTax = round2(grandTotalGross * 0.1);
  const netAmount = round2(grandTotalGross + municipalTax);
  const distributorShare = round2(netAmount * 0.5);

  return {
    movieOptions,
    showTimeOptions,
    showTimeReports,
    grandTotalLifetimeTickets,
    grandTotalSelectedMovieTickets,
    grandTotalTodayTickets,
    grandTotalGross,
    municipalTax,
    netAmount,
    distributorShare,
  };
}
