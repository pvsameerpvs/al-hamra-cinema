import { ReservationStatus, Show } from "../types";

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

interface SheetHelpersMockStore {
  mockBookings: MockBooking[];
  mockShows: Show[];
  mockReservations: MockReservation[];
}

const globalForBookings = global as unknown as SheetHelpersMockStore;

if (!globalForBookings.mockBookings) globalForBookings.mockBookings = [];
if (!globalForBookings.mockReservations) globalForBookings.mockReservations = [];
if (!globalForBookings.mockShows) {
  const today = new Date();
  const format = (offsetDays: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split("T")[0];
  };
  globalForBookings.mockShows = [
    { id: "1", movieTitle: "Dune: Part Two", showTime: "10:00 AM", isActive: true, startDate: format(-10), endDate: format(20), rating: "PG 13" },
    { id: "2", movieTitle: "Spider-Man", showTime: "01:00 PM", isActive: true, startDate: format(-5), endDate: format(15), rating: "PG 13" },
    { id: "3", movieTitle: "Avatar 3", showTime: "04:00 PM", isActive: true, startDate: format(-1), endDate: format(30), rating: "PG 13" },
    { id: "4", movieTitle: "Inception", showTime: "07:00 PM", isActive: true, startDate: format(-30), endDate: format(-2), rating: "PG 18" },
    { id: "5", movieTitle: "Interstellar", showTime: "10:00 PM", isActive: true, startDate: format(-3), endDate: format(60), rating: "PG 13" },
  ];
}

export const mockStore = globalForBookings;

export function isMockMode(): boolean {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY || "";
  return !privateKey || privateKey.includes("Your\\nSuper") || privateKey.includes("Your\nSuper");
}
