"use client";

import { rupees } from "@/lib/format";
import { useStore } from "./StoreProvider";
import { PaddleIcon, TicketIcon, WalletIcon } from "./Icons";

export default function Header({
  onOpenBookings,
}: {
  onOpenBookings: () => void;
}) {
  const { state, ready } = useStore();
  const upcoming = state.bookings.filter((b) => b.status === "confirmed").length;

  return (
    <header className="sticky top-0 z-30 border-b border-white/6 bg-ink-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
        <a href="#top" className="group flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-lime-glow text-ink-950 transition group-hover:rotate-12">
            <PaddleIcon className="h-5 w-5" />
          </span>
          <span className="leading-none">
            <span className="block text-[15px] font-extrabold tracking-tight text-white">
              PicklePad
            </span>
            <span className="block text-[10px] font-medium tracking-[0.18em] text-ink-400 uppercase">
              Bengaluru
            </span>
          </span>
        </a>

        <nav className="ml-6 hidden items-center gap-1 md:flex">
          {[
            { href: "#explore", label: "Find courts" },
            { href: "#map", label: "Map" },
            { href: "#how", label: "How it works" },
          ].map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-ink-300 transition hover:bg-white/5 hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/4 px-3 py-2 text-xs font-semibold text-ink-200 sm:inline-flex">
            <WalletIcon className="h-4 w-4 text-teal-glow" />
            {ready ? rupees(state.wallet.balance) : "—"}
          </span>

          <button
            type="button"
            onClick={onOpenBookings}
            className="relative inline-flex items-center gap-2 rounded-xl bg-white/8 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-white/16"
          >
            <TicketIcon className="h-4 w-4" />
            <span className="hidden sm:inline">My bookings</span>
            <span className="sm:hidden">Bookings</span>
            {ready && upcoming > 0 && (
              <span className="absolute -top-1.5 -right-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-lime-glow px-1 text-[10px] font-extrabold text-ink-950">
                {upcoming}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
