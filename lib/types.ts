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
  booking_id: string;
  seat_id: string;
  customer_name: string;
  phone: string;
  amount: number;
  payment_status: string;
  created_at: string;
}

export interface RevenueLog {
  booking_id: string;
  amount: number;
  month: string;
  date: string;
}
