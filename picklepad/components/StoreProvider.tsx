"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  INITIAL_STATE,
  OPENING_BALANCE,
  loadState,
  makeBookingId,
  saveState,
  type AppState,
  type Booking,
  type PaymentMethod,
} from "@/lib/store";

type BookingDraft = {
  courtId: string;
  courtName: string;
  area: string;
  dateKey: string;
  hour: number;
  players: number;
  amount: number;
  paidWith: PaymentMethod;
  card?: { last4: string; brand: string; name: string } | null;
};

type StoreValue = {
  state: AppState;
  /** False during the first paint, before localStorage has been read. */
  ready: boolean;
  confirmBooking: (draft: BookingDraft) => Booking;
  cancelBooking: (id: string) => void;
  topUpWallet: (amount: number) => void;
  resetDemo: () => void;
};

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [ready, setReady] = useState(false);

  // Read persisted state after mount so server and first client render match.
  useEffect(() => {
    setState(loadState());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) saveState(state);
  }, [state, ready]);

  const confirmBooking = useCallback((draft: BookingDraft) => {
    const booking: Booking = {
      id: makeBookingId(),
      courtId: draft.courtId,
      courtName: draft.courtName,
      area: draft.area,
      dateKey: draft.dateKey,
      hour: draft.hour,
      durationHours: 1,
      players: draft.players,
      amount: draft.amount,
      paidWith: draft.paidWith,
      status: "confirmed",
      createdAt: Date.now(),
    };

    setState((prev) => {
      const walletDebit = draft.paidWith === "wallet" ? draft.amount : 0;
      return {
        ...prev,
        bookings: [booking, ...prev.bookings],
        wallet: {
          balance: prev.wallet.balance - walletDebit,
          ledger: walletDebit
            ? [
                {
                  id: booking.id,
                  label: `${draft.courtName} · 1 hr slot`,
                  amount: -walletDebit,
                  at: booking.createdAt,
                },
                ...prev.wallet.ledger,
              ]
            : prev.wallet.ledger,
        },
        savedCard: draft.card ?? prev.savedCard,
      };
    });

    return booking;
  }, []);

  const cancelBooking = useCallback((id: string) => {
    setState((prev) => {
      const target = prev.bookings.find((b) => b.id === id);
      if (!target || target.status === "cancelled") return prev;

      // Demo refund policy: full refund to the wallet, whatever was used to pay.
      return {
        ...prev,
        bookings: prev.bookings.map((b) =>
          b.id === id ? { ...b, status: "cancelled" } : b,
        ),
        wallet: {
          balance: prev.wallet.balance + target.amount,
          ledger: [
            {
              id: `refund-${id}-${Date.now()}`,
              label: `Refund · ${target.courtName}`,
              amount: target.amount,
              at: Date.now(),
            },
            ...prev.wallet.ledger,
          ],
        },
      };
    });
  }, []);

  const topUpWallet = useCallback((amount: number) => {
    setState((prev) => ({
      ...prev,
      wallet: {
        balance: prev.wallet.balance + amount,
        ledger: [
          {
            id: `topup-${Date.now()}`,
            label: "Wallet top-up (demo money)",
            amount,
            at: Date.now(),
          },
          ...prev.wallet.ledger,
        ],
      },
    }));
  }, []);

  const resetDemo = useCallback(() => {
    setState({
      bookings: [],
      wallet: {
        balance: OPENING_BALANCE,
        ledger: INITIAL_STATE.wallet.ledger,
      },
      savedCard: null,
    });
  }, []);

  const value = useMemo(
    () => ({ state, ready, confirmBooking, cancelBooking, topUpWallet, resetDemo }),
    [state, ready, confirmBooking, cancelBooking, topUpWallet, resetDemo],
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
