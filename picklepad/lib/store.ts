/**
 * Client-side persistence layer.
 *
 * Everything the "user" does — bookings, the dummy wallet balance, the saved
 * dummy card — lives in localStorage under a single key. There is no server
 * and no database, so a free Vercel static deploy is all this app ever needs.
 */

export type PaymentMethod = "wallet" | "card" | "upi";

export type Booking = {
  id: string;
  courtId: string;
  courtName: string;
  area: string;
  dateKey: string;
  hour: number;
  /** Always 1 — the product only sells 1-hour slots. Kept explicit for clarity. */
  durationHours: 1;
  players: number;
  amount: number;
  paidWith: PaymentMethod;
  status: "confirmed" | "cancelled";
  createdAt: number;
};

export type LedgerEntry = {
  id: string;
  label: string;
  amount: number; // negative = debit
  at: number;
};

export type AppState = {
  bookings: Booking[];
  wallet: {
    balance: number;
    ledger: LedgerEntry[];
  };
  savedCard: { last4: string; brand: string; name: string } | null;
};

const STORAGE_KEY = "picklepad.state.v1";
export const OPENING_BALANCE = 5000;

export const INITIAL_STATE: AppState = {
  bookings: [],
  wallet: {
    balance: OPENING_BALANCE,
    ledger: [
      {
        id: "seed",
        label: "Welcome credit (demo money)",
        amount: OPENING_BALANCE,
        at: 0,
      },
    ],
  },
  savedCard: null,
};

export function loadState(): AppState {
  if (typeof window === "undefined") return INITIAL_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STATE;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      bookings: Array.isArray(parsed.bookings) ? parsed.bookings : [],
      wallet: {
        balance:
          typeof parsed.wallet?.balance === "number"
            ? parsed.wallet.balance
            : OPENING_BALANCE,
        ledger: Array.isArray(parsed.wallet?.ledger)
          ? parsed.wallet!.ledger
          : INITIAL_STATE.wallet.ledger,
      },
      savedCard: parsed.savedCard ?? null,
    };
  } catch {
    // Corrupt or blocked storage (private window, storage disabled) — the app
    // still works, it just starts fresh every load.
    return INITIAL_STATE;
  }
}

export function saveState(state: AppState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage full or blocked — non-fatal, keep the in-memory state */
  }
}

export function makeBookingId(): string {
  const n = Math.floor(Math.random() * 46656)
    .toString(36)
    .toUpperCase()
    .padStart(3, "0");
  const t = Date.now().toString(36).toUpperCase().slice(-4);
  return `PP-${t}${n}`;
}

/** hour -> number of courts this browser has booked, for one court+date. */
export function bookedCountsFor(
  bookings: Booking[],
  courtId: string,
  dateKey: string,
): Record<number, number> {
  const out: Record<number, number> = {};
  for (const b of bookings) {
    if (b.status !== "confirmed") continue;
    if (b.courtId !== courtId || b.dateKey !== dateKey) continue;
    out[b.hour] = (out[b.hour] ?? 0) + 1;
  }
  return out;
}

export function isUpcoming(b: Booking): boolean {
  const start = new Date(`${b.dateKey}T00:00:00`);
  start.setHours(b.hour);
  return start.getTime() + 60 * 60 * 1000 > Date.now();
}

/* ------------------------------------------------------------------ */
/* Dummy card validation — format only. No network, no real processing. */
/* ------------------------------------------------------------------ */

export function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

export function formatCardNumber(s: string): string {
  return digitsOnly(s).slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

export function formatExpiry(s: string): string {
  const d = digitsOnly(s).slice(0, 4);
  return d.length <= 2 ? d : `${d.slice(0, 2)}/${d.slice(2)}`;
}

export function cardBrand(number: string): string {
  const d = digitsOnly(number);
  if (/^4/.test(d)) return "Visa";
  if (/^5[1-5]/.test(d)) return "Mastercard";
  if (/^6/.test(d)) return "RuPay";
  if (/^3[47]/.test(d)) return "Amex";
  return "Card";
}

export type CardErrors = Partial<
  Record<"name" | "number" | "expiry" | "cvv", string>
>;

export function validateCard(input: {
  name: string;
  number: string;
  expiry: string;
  cvv: string;
}): CardErrors {
  const errors: CardErrors = {};
  if (input.name.trim().length < 3) errors.name = "Enter the name on the card";

  const num = digitsOnly(input.number);
  if (num.length !== 16) errors.number = "Card number must be 16 digits";

  const exp = digitsOnly(input.expiry);
  if (exp.length !== 4) {
    errors.expiry = "Use MM/YY";
  } else {
    const mm = Number(exp.slice(0, 2));
    const yy = Number(exp.slice(2));
    const now = new Date();
    const curYY = now.getFullYear() % 100;
    if (mm < 1 || mm > 12) errors.expiry = "Month must be 01–12";
    else if (yy < curYY || (yy === curYY && mm < now.getMonth() + 1))
      errors.expiry = "Card has expired";
  }

  if (digitsOnly(input.cvv).length !== 3) errors.cvv = "CVV must be 3 digits";

  return errors;
}
