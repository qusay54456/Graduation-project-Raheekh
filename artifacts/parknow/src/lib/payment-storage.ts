// Tiny helper to persist the in-progress booking across the
// book → payment → success page navigation. We use sessionStorage so the
// data lives only for the current tab/session.

const KEY = "parknow.pendingBooking";

export interface PendingBooking {
  lotId: number;
  lotName: string;
  lotLocation: string;
  spotId: number;
  spotNumber: string;
  durationHours: number;
  pricePerHour: number;
  totalPrice: number;
}

export interface CompletedBooking {
  reservationId: number;
  lotName: string;
  spotNumber: string;
  durationHours: number;
  totalPrice: number;
  paymentMethod: "card" | "paypal" | "arrival";
  startTime: string;
  endTime: string;
}

const COMPLETED_KEY = "parknow.completedBooking";

export const pendingBooking = {
  set(data: PendingBooking) {
    sessionStorage.setItem(KEY, JSON.stringify(data));
  },
  get(): PendingBooking | null {
    try {
      const raw = sessionStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as PendingBooking) : null;
    } catch {
      return null;
    }
  },
  clear() {
    sessionStorage.removeItem(KEY);
  },
};

export const completedBooking = {
  set(data: CompletedBooking) {
    sessionStorage.setItem(COMPLETED_KEY, JSON.stringify(data));
  },
  get(): CompletedBooking | null {
    try {
      const raw = sessionStorage.getItem(COMPLETED_KEY);
      return raw ? (JSON.parse(raw) as CompletedBooking) : null;
    } catch {
      return null;
    }
  },
  clear() {
    sessionStorage.removeItem(COMPLETED_KEY);
  },
};
