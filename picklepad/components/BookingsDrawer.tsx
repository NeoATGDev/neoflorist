"use client";

import { useMemo, useState } from "react";
import { prettyDate, rupees } from "@/lib/format";
import { slotRangeLabel } from "@/lib/slots";
import { isUpcoming, type Booking } from "@/lib/store";
import { useStore } from "./StoreProvider";
import Sheet from "./Sheet";
import { CardIcon, PinIcon, TicketIcon, UpiIcon, WalletIcon } from "./Icons";

type Props = { open: boolean; onClose: () => void };

export default function BookingsDrawer({ open, onClose }: Props) {
  const { state, cancelBooking, topUpWallet, resetDemo } = useStore();
  const [tab, setTab] = useState<"upcoming" | "history" | "wallet">("upcoming");

  const { upcoming, history } = useMemo(() => {
    const up: Booking[] = [];
    const hist: Booking[] = [];
    for (const b of state.bookings) {
      if (b.status === "confirmed" && isUpcoming(b)) up.push(b);
      else hist.push(b);
    }
    up.sort(
      (a, b) =>
        new Date(`${a.dateKey}T00:00:00`).setHours(a.hour) -
        new Date(`${b.dateKey}T00:00:00`).setHours(b.hour),
    );
    return { upcoming: up, history: hist };
  }, [state.bookings]);

  const tabs = [
    { id: "upcoming" as const, label: "Upcoming", count: upcoming.length },
    { id: "history" as const, label: "History", count: history.length },
    { id: "wallet" as const, label: "Wallet", count: null },
  ];

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="My bookings"
      subtitle="Stored in this browser only — no account needed"
      footer={
        <button
          type="button"
          onClick={() => {
            if (
              window.confirm(
                "Reset the demo? This clears all bookings and restores the ₹5,000 wallet.",
              )
            ) {
              resetDemo();
            }
          }}
          className="w-full rounded-xl border border-white/12 px-4 py-2.5 text-xs font-semibold text-ink-400 transition hover:border-coral/40 hover:text-coral"
        >
          Reset demo data
        </button>
      }
    >
      <div className="mb-5 flex gap-1 rounded-2xl border border-white/8 bg-white/3 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition ${
              tab === t.id
                ? "bg-lime-glow text-ink-950"
                : "text-ink-300 hover:text-white"
            }`}
          >
            {t.label}
            {t.count !== null && t.count > 0 && (
              <span className="ml-1.5 opacity-70">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {tab === "wallet" ? (
        <div className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-teal-glow/12 via-transparent to-lime-glow/8 p-5">
            <p className="text-[11px] tracking-wider text-ink-400 uppercase">
              PicklePay balance
            </p>
            <p className="mt-1 text-3xl font-bold text-white">
              {rupees(state.wallet.balance)}
            </p>
            <div className="mt-4 flex gap-2">
              {[500, 1000, 2000].map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => topUpWallet(a)}
                  className="flex-1 rounded-xl border border-teal-glow/30 bg-teal-glow/10 px-2 py-2 text-xs font-bold text-teal-glow transition hover:bg-teal-glow/20"
                >
                  + {rupees(a)}
                </button>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-ink-400">
              Demo money. Top-ups are instant and free because none of this is
              real.
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold tracking-wider text-ink-400 uppercase">
              Activity
            </h3>
            <ul className="divide-y divide-white/6 overflow-hidden rounded-2xl border border-white/8">
              {state.wallet.ledger.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between gap-3 bg-white/2 px-4 py-3"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-ink-200">
                      {e.label}
                    </span>
                    {e.at > 0 && (
                      <span className="block text-[11px] text-ink-400">
                        {new Date(e.at).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </span>
                  <span
                    className={`shrink-0 text-sm font-bold ${
                      e.amount < 0 ? "text-coral" : "text-teal-glow"
                    }`}
                  >
                    {e.amount < 0 ? "−" : "+"}
                    {rupees(Math.abs(e.amount))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <BookingList
          bookings={tab === "upcoming" ? upcoming : history}
          empty={
            tab === "upcoming"
              ? "No upcoming slots. Find a court and grab an hour."
              : "Nothing here yet — past and cancelled bookings show up in this tab."
          }
          onCancel={tab === "upcoming" ? cancelBooking : undefined}
        />
      )}
    </Sheet>
  );
}

function BookingList({
  bookings,
  empty,
  onCancel,
}: {
  bookings: Booking[];
  empty: string;
  onCancel?: (id: string) => void;
}) {
  if (bookings.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/12 px-6 py-12 text-center">
        <TicketIcon className="mx-auto h-8 w-8 text-ink-600" />
        <p className="mt-3 text-sm text-ink-400">{empty}</p>
      </div>
    );
  }

  const methodIcon = {
    wallet: WalletIcon,
    card: CardIcon,
    upi: UpiIcon,
  } as const;

  return (
    <ul className="space-y-3">
      {bookings.map((b) => {
        const Icon = methodIcon[b.paidWith];
        const cancelled = b.status === "cancelled";
        return (
          <li
            key={b.id}
            className={`overflow-hidden rounded-3xl border transition ${
              cancelled
                ? "border-white/6 bg-white/2 opacity-60"
                : "border-white/10 bg-ink-850/70"
            }`}
          >
            <div className="flex items-start gap-3 p-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-lime-glow/12 text-lime-glow">
                <TicketIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">
                  {b.courtName}
                </p>
                <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-ink-400">
                  <PinIcon className="h-3 w-3 shrink-0" />
                  {b.area}
                </p>
                <p className="mt-1.5 text-xs text-ink-200">
                  {prettyDate(b.dateKey)} · {slotRangeLabel(b.hour)}
                </p>
                <p className="mt-1 flex items-center gap-2 text-[11px] text-ink-400">
                  <span className="font-mono">{b.id}</span>
                  <span className="inline-flex items-center gap-1">
                    <Icon className="h-3 w-3" />
                    {rupees(b.amount)}
                  </span>
                  <span>{b.players === 2 ? "Singles" : "Doubles"}</span>
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold tracking-wide uppercase ${
                  cancelled
                    ? "bg-white/6 text-ink-400"
                    : "bg-teal-glow/15 text-teal-glow"
                }`}
              >
                {cancelled ? "Cancelled" : "Confirmed"}
              </span>
            </div>

            {onCancel && !cancelled && (
              <div className="border-t border-white/8 px-4 py-2.5">
                <button
                  type="button"
                  onClick={() => onCancel(b.id)}
                  className="text-xs font-semibold text-ink-400 transition hover:text-coral"
                >
                  Cancel booking · full refund to wallet
                </button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
