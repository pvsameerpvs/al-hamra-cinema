export type SeatStatus = "Available" | "Reserved" | "Booked";

export interface Seat {
  seat_id: string; // e.g. B-A-11 or O-N-27
  section: "Balcony" | "Orchestra";
  row: string;
  seat_number: number;
  status: SeatStatus;
  price: number;
}

export interface Booking {
  id: string;
  seatIds: string;
  customerName: string;
  phone: string;
  email: string;
  amount: number;
  paymentStatus: string;
  createdAt: string;
  /** Show date (YYYY-MM-DD). Used for pre-booking / daily seat availability. */
  showDate?: string;
}

export interface RevenueLog {
  booking_id: string;
  amount: number;
  month: string;
  date: string;
}

export type MovieRating = "PG 13" | "PG 18" | "PG" | "G";

export interface Show {
  id: string;
  movieTitle: string;
  showTime: string;
  isActive: boolean;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  rating: MovieRating;
}

export type ReservationStatus = "Active" | "Cancelled" | "Expired";

export interface Reservation {
  id: string;
  showId: string;
  showDate: string; // YYYY-MM-DD
  seatIds: string; // comma-separated seat IDs
  customerName: string;
  phone: string;
  email: string;
  status: ReservationStatus;
  expiresAt: string; // ISO timestamp
  createdAt: string; // ISO timestamp
}

export type UserRole = "admin" | "user";

export interface User {
  email: string;     // Column A — unique identifier / login username
  password: string;  // Column B — plain text (or hashed in future)
  role: UserRole;    // Column C — "admin" | "user"
  createdAt: string; // Column D — ISO 8601 timestamp
}
