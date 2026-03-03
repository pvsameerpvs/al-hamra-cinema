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
}

export interface RevenueLog {
  booking_id: string;
  amount: number;
  month: string;
  date: string;
}

export interface Show {
  id: string;
  movieTitle: string;
  showTime: string;
  isActive: boolean;
}
