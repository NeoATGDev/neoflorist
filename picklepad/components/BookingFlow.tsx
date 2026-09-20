"use client";

import { useEffect, useMemo, useState } from "react";
import type { Court } from "@/data/courts";
import { dayLabel, prettyDate, rupees } from "@/lib/format";
import { formatDistance, haversineKm } from "@/lib/geo";
import {
  buildSlots,
  formatHour,
  nextDates,
  slotRangeLabel,
  toDateKey,
} from "@/lib/slots";
import {
  bookedCountsFor,
  cardBrand,
  digitsOnly,
  formatCardNumber,
  formatExpiry,
  validateCard,
  type CardErrors,
  type PaymentMethod,
} from "@/lib/store";
import { useStore } from "./StoreProvider";
import Sheet from "./Sheet";
import {
  CardIcon,
  CheckIcon,
  ClockIcon,
  IndoorIcon,
  PaddleIcon,
  PinIcon,
  ShieldIcon,
  SpinnerIcon,
  StarIcon,
  SunIcon,
  TicketIcon,
  UpiIcon,
  WalletIcon,
} from "./Icons";
import type { Origin } from "./LocationBar";

type Step = "slots" | "pay" | "processing" | "done";

type Props = {
  court: Court | null;
  origin: Origin | null;
  onClose: () => void;
  onViewBookings: () => void;
};

export default function BookingFlow({
  court,
  origin,
  onClose,
  onViewBookings,
}: Props) {
  const { state, confirmBooking, topUpWallet } = useStore();
  const dates = useMemo(() => nextDates(7), []);
  const [dateKey, setDateKey] = useState(() => toDateKey(dates[0]!));
  const [hour, setHour] = useState<number | null>(null);
  const [players, setPlayers] = useState(4);
  const [step, setStep] = useState<Step>("slots");
  const [method, setMethod] = useState<PaymentMethod>("wallet");
  const [confirmedId, setConfirmedId] = useState<string | null>(null);

  const [card, setCard] = useState({ name: "", number: "", expiry: "", cvv: "" });
  const [cardErrors, setCardErrors] = useState<CardErrors>({});
  const [vpa, setVpa] = useState("");
  const [vpaError, setVpaError] = useState<string | null>(null);

  // Reset the whole flow whenever a different venue is opened, landing on the
  // first date that actually has a free slot so late-evening visitors aren't
  // greeted by a grid of "Passed".
  useEffect(() => {
    if (!court) return;
    const firstOpen =
      dates.find((d) => {
        const key = toDateKey(d);
        return buildSlots(court, key).some((s) => !s.past && s.free > 0);
      }) ?? dates[0]!;
    setDateKey(toDateKey(firstOpen));
    setHour(null);
    setStep("slots");
    setMethod("wallet");
    setConfirmedId(null);
    setCardErrors({});
    setVpaError(null);
  }, [court, dates]);

  const slots = useMemo(() => {
    if (!court) return [];
    return buildSlots(
      court,
      dateKey,
      bookedCountsFor(state.bookings, court.id, dateKey),
    );
  }, [court, dateKey, state.bookings]);

  const selected = slots.find((s) => s.hour === hour) ?? null;
  const amount = selected?.price ?? 0;
  const walletShort = method === "wallet" && state.wallet.balance < amount;

  if (!court) return null;

  const distanceKm = origin ? haversineKm(origin.point, court) : null;

  function pay() {
    if (!selected) return;

    if (method === "card") {
      const errs = validateCard(card);
      setCardErrors(errs);
      if (Object.keys(errs).length > 0) return;
    }
    if (method === "upi") {
      const ok = /^[a-z0-9._-]{3,}@[a-z]{3,}$/i.test(vpa.trim());
      setVpaError(ok ? null : "Enter a UPI ID like yourname@bank");
      if (!ok) return;
    }
    if (walletShort) return;

    setStep("processing");
    // Simulated gateway round-trip. No network call is made.
    window.setTimeout(() => {
      const booking = confirmBooking({
        courtId: court!.id,
        courtName: court!.name,
        area: court!.area,
        dateKey,
        hour: selected.hour,
        players,
        amount: selected.price,
        paidWith: method,
        card:
          method === "card"
            ? {
                last4: digitsOnly(card.number).slice(-4),
                brand: cardBrand(card.number),
                name: card.name.trim(),
              }
            : null,
      });
      setConfirmedId(booking.id);
      setStep("done");
    }, 1500);
  }

  /* ------------------------------ footer ------------------------------ */

  let footer: React.ReactNode = null;
  if (step === "slots") {
    footer = (
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] text-ink-400">
            {selected ? `${prettyDate(dateKey)} · ${selected.label}` : "No slot selected"}
          </p>
          <p className="text-lg font-bold text-white">
            {selected ? rupees(amount) : "—"}
            <span className="ml-1 text-xs font-normal text-ink-400">
              for 1 hour
            </span>
          </p>
        </div>
        <button
          type="button"
          disabled={!selected}
          onClick={() => setStep("pay")}
          className="rounded-xl bg-lime-glow px-5 py-3 text-sm font-bold text-ink-950 transition hover:bg-white disabled:cursor-not-allowed disabled:bg-ink-700 disabled:text-ink-400"
        >
          Continue to payment
        </button>
      </div>
    );
  } else if (step === "pay") {
    footer = (
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setStep("slots")}
          className="rounded-xl border border-white/12 px-4 py-3 text-sm font-semibold text-ink-200 transition hover:border-white/30 hover:text-white"
        >
          Back
        </button>
        <button
          type="button"
          onClick={pay}
          disabled={walletShort}
          className="flex-1 rounded-xl bg-lime-glow px-5 py-3 text-sm font-bold text-ink-950 transition hover:bg-white disabled:cursor-not-allowed disabled:bg-ink-700 disabled:text-ink-400"
        >
          {walletShort ? "Not enough balance" : `Pay ${rupees(amount)}`}
        </button>
      </div>
    );
  } else if (step === "done") {
    footer = (
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl border border-white/12 px-4 py-3 text-sm font-semibold text-ink-200 transition hover:border-white/30 hover:text-white"
        >
          Keep browsing
        </button>
        <button
          type="button"
          onClick={() => {
            onClose();
            onViewBookings();
          }}
          className="flex-1 rounded-xl bg-lime-glow px-4 py-3 text-sm font-bold text-ink-950 transition hover:bg-white"
        >
          View my bookings
        </button>
      </div>
    );
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={
        step === "done" ? "Slot confirmed" : step === "pay" ? "Checkout" : court.name
      }
      subtitle={
        step === "slots"
          ? `${court.area}, Bengaluru${
              distanceKm !== null ? ` · ${formatDistance(distanceKm)} away` : ""
            }`
          : `${court.name} · ${prettyDate(dateKey)} · ${
              selected ? selected.label : ""
            }`
      }
      footer={footer}
    >
      {step === "slots" && (
        <SlotStep
          court={court}
          dates={dates}
          dateKey={dateKey}
          setDateKey={(k) => {
            setDateKey(k);
            setHour(null);
          }}
          slots={slots}
          hour={hour}
          setHour={setHour}
          players={players}
          setPlayers={setPlayers}
        />
      )}

      {step === "pay" && (
        <PayStep
          court={court}
          dateKey={dateKey}
          slotLabel={selected ? selected.label : ""}
          players={players}
          amount={amount}
          basePrice={court.pricePerHour}
          method={method}
          setMethod={setMethod}
          balance={state.wallet.balance}
          short={walletShort}
          onTopUp={() => topUpWallet(2000)}
          card={card}
          setCard={(next) => {
            setCard(next);
            setCardErrors({});
          }}
          cardErrors={cardErrors}
          vpa={vpa}
          setVpa={(v) => {
            setVpa(v);
            setVpaError(null);
          }}
          vpaError={vpaError}
        />
      )}

      {step === "processing" && <Processing amount={amount} method={method} />}

      {step === "done" && confirmedId && (
        <DoneStep
          id={confirmedId}
          court={court}
          dateKey={dateKey}
          hour={selected?.hour ?? 0}
          players={players}
          amount={amount}
          method={method}
        />
      )}
    </Sheet>
  );
}

/* ====================== step 1: pick a 1-hour slot ====================== */

function SlotStep({
  court,
  dates,
  dateKey,
  setDateKey,
  slots,
  hour,
  setHour,
  players,
  setPlayers,
}: {
  court: Court;
  dates: Date[];
  dateKey: string;
  setDateKey: (k: string) => void;
  slots: ReturnType<typeof buildSlots>;
  hour: number | null;
  setHour: (h: number) => void;
  players: number;
  setPlayers: (p: number) => void;
}) {
  const freeCount = slots.filter((s) => !s.past && s.free > 0).length;

  return (
    <div className="space-y-6">
      {/* venue facts */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Fact icon={<StarIcon className="h-4 w-4 text-lime-glow" />} label="Rating">
          {court.rating.toFixed(1)}{" "}
          <span className="text-ink-400">({court.reviews})</span>
        </Fact>
        <Fact icon={<PaddleIcon className="h-4 w-4 text-teal-glow" />} label="Courts">
          {court.courts}
        </Fact>
        <Fact
          icon={
            court.indoor ? (
              <IndoorIcon className="h-4 w-4 text-teal-glow" />
            ) : (
              <SunIcon className="h-4 w-4 text-lime-glow" />
            )
          }
          label="Setting"
        >
          {court.indoor ? "Indoor" : "Outdoor"}
        </Fact>
        <Fact icon={<ClockIcon className="h-4 w-4 text-ink-300" />} label="Open">
          {formatHour(court.openHour)}–{formatHour(court.closeHour)}
        </Fact>
      </div>

      <div className="rounded-2xl border border-white/8 bg-white/3 p-4 text-sm">
        <p className="flex items-start gap-2 text-ink-300">
          <PinIcon className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
          <span>{court.address}</span>
        </p>
        <p className="mt-2 flex items-center gap-2 text-ink-400">
          <span className="font-mono text-xs">{court.phone}</span>
          <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] tracking-wide uppercase">
            demo number
          </span>
        </p>
        <p className="mt-3 text-xs text-ink-400">
          {court.surface} surface · {court.amenities.join(" · ")}
        </p>
      </div>

      {/* date strip */}
      <section>
        <h3 className="mb-2.5 text-xs font-semibold tracking-wider text-ink-400 uppercase">
          Pick a date
        </h3>
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {dates.map((d, i) => {
            const key = toDateKey(d);
            const active = key === dateKey;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setDateKey(key)}
                className={`shrink-0 rounded-2xl border px-4 py-2.5 text-center transition ${
                  active
                    ? "border-lime-glow bg-lime-glow text-ink-950"
                    : "border-white/10 bg-white/3 text-ink-300 hover:border-white/25 hover:text-white"
                }`}
              >
                <span className="block text-[11px] font-semibold opacity-80">
                  {dayLabel(d, i)}
                </span>
                <span className="block text-sm font-bold">
                  {d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* slot grid */}
      <section>
        <div className="mb-2.5 flex items-baseline justify-between">
          <h3 className="text-xs font-semibold tracking-wider text-ink-400 uppercase">
            1-hour slots
          </h3>
          <span className="text-xs text-ink-400">
            {freeCount} available · peak hours cost 25% more
          </span>
        </div>

        {slots.every((s) => s.past) ? (
          <p className="rounded-2xl border border-white/8 bg-white/3 px-4 py-6 text-center text-sm text-ink-400">
            This venue has closed for the day. Try tomorrow.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {slots.map((s) => {
              const disabled = s.past || s.free === 0;
              const active = s.hour === hour;
              return (
                <button
                  key={s.hour}
                  type="button"
                  disabled={disabled}
                  onClick={() => setHour(s.hour)}
                  className={`relative rounded-2xl border px-3 py-2.5 text-left transition ${
                    active
                      ? "border-lime-glow bg-lime-glow/12 ring-2 ring-lime-glow/40"
                      : disabled
                        ? "cursor-not-allowed border-white/6 bg-white/2 opacity-45"
                        : "border-white/10 bg-white/3 hover:border-white/25 hover:bg-white/6"
                  }`}
                >
                  <span
                    className={`block text-sm font-semibold ${
                      active ? "text-lime-glow" : "text-white"
                    }`}
                  >
                    {formatHour(s.hour)}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-ink-400">
                    {s.past
                      ? "Passed"
                      : s.free === 0
                        ? "Booked out"
                        : `${s.free} court${s.free === 1 ? "" : "s"} free`}
                  </span>
                  <span className="mt-1 flex items-center gap-1.5">
                    <span className="text-xs font-bold text-ink-200">
                      {rupees(s.price)}
                    </span>
                    {s.peak && !disabled && (
                      <span className="rounded bg-coral/18 px-1 py-0.5 text-[9px] font-bold tracking-wide text-coral uppercase">
                        peak
                      </span>
                    )}
                  </span>
                  {active && (
                    <CheckIcon className="absolute top-2 right-2 h-3.5 w-3.5 text-lime-glow" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* players */}
      <section>
        <h3 className="mb-2.5 text-xs font-semibold tracking-wider text-ink-400 uppercase">
          Playing format
        </h3>
        <div className="flex gap-2">
          {[
            { n: 2, label: "Singles", sub: "2 players" },
            { n: 4, label: "Doubles", sub: "4 players" },
          ].map((o) => (
            <button
              key={o.n}
              type="button"
              onClick={() => setPlayers(o.n)}
              className={`flex-1 rounded-2xl border px-4 py-3 text-left transition ${
                players === o.n
                  ? "border-teal-glow bg-teal-glow/10"
                  : "border-white/10 bg-white/3 hover:border-white/25"
              }`}
            >
              <span className="block text-sm font-semibold text-white">
                {o.label}
              </span>
              <span className="block text-[11px] text-ink-400">{o.sub}</span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-ink-400">
          Court hire is charged per hour, not per player.
        </p>
      </section>
    </div>
  );
}

function Fact({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/3 px-3 py-2.5">
      <p className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-ink-400 uppercase">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-white">{children}</p>
    </div>
  );
}

/* ========================== step 2: checkout ========================== */

function PayStep(props: {
  court: Court;
  dateKey: string;
  slotLabel: string;
  players: number;
  amount: number;
  /** The venue's list price, so the surcharge line is exact, not reverse-derived. */
  basePrice: number;
  method: PaymentMethod;
  setMethod: (m: PaymentMethod) => void;
  balance: number;
  short: boolean;
  onTopUp: () => void;
  card: { name: string; number: string; expiry: string; cvv: string };
  setCard: (c: { name: string; number: string; expiry: string; cvv: string }) => void;
  cardErrors: CardErrors;
  vpa: string;
  setVpa: (v: string) => void;
  vpaError: string | null;
}) {
  const {
    court,
    dateKey,
    slotLabel,
    players,
    amount,
    basePrice,
    method,
    setMethod,
    balance,
    short,
    onTopUp,
    card,
    setCard,
    cardErrors,
    vpa,
    setVpa,
    vpaError,
  } = props;

  const base = basePrice;
  const surge = amount - base;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-dashed border-white/15 bg-white/3 p-4">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-wider text-ink-400 uppercase">
          <TicketIcon className="h-4 w-4" />
          Order summary
        </p>
        <dl className="mt-3 space-y-2 text-sm">
          <Row k="Venue" v={court.name} />
          <Row k="Where" v={`${court.area}, Bengaluru`} />
          <Row k="When" v={`${prettyDate(dateKey)} · ${slotLabel}`} />
          <Row k="Format" v={players === 2 ? "Singles (2)" : "Doubles (4)"} />
          <div className="my-2 border-t border-white/8" />
          <Row k="Court hire (1 hr)" v={rupees(base)} />
          {surge > 0 && <Row k="Peak-hour surcharge" v={rupees(surge)} muted />}
          <Row k="Convenience fee" v="₹0 (waived)" muted />
          <div className="my-2 border-t border-white/8" />
          <div className="flex items-baseline justify-between">
            <dt className="text-sm font-semibold text-white">Total payable</dt>
            <dd className="text-xl font-bold text-lime-glow">{rupees(amount)}</dd>
          </div>
        </dl>
      </div>

      <section>
        <h3 className="mb-2.5 text-xs font-semibold tracking-wider text-ink-400 uppercase">
          Pay with
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { id: "wallet", label: "PicklePay", Icon: WalletIcon },
              { id: "card", label: "Card", Icon: CardIcon },
              { id: "upi", label: "UPI", Icon: UpiIcon },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMethod(m.id)}
              className={`flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 transition ${
                method === m.id
                  ? "border-lime-glow bg-lime-glow/10 text-lime-glow"
                  : "border-white/10 bg-white/3 text-ink-300 hover:border-white/25 hover:text-white"
              }`}
            >
              <m.Icon className="h-5 w-5" />
              <span className="text-xs font-semibold">{m.label}</span>
            </button>
          ))}
        </div>
      </section>

      {method === "wallet" && (
        <div className="animate-in-fade rounded-2xl border border-white/8 bg-gradient-to-br from-teal-glow/10 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] tracking-wider text-ink-400 uppercase">
                PicklePay balance
              </p>
              <p className="text-2xl font-bold text-white">{rupees(balance)}</p>
              <p className="mt-0.5 text-[11px] text-ink-400">
                After this booking: {rupees(Math.max(0, balance - amount))}
              </p>
            </div>
            <button
              type="button"
              onClick={onTopUp}
              className="rounded-xl border border-teal-glow/35 bg-teal-glow/12 px-3 py-2 text-xs font-bold text-teal-glow transition hover:bg-teal-glow/22"
            >
              + Add ₹2,000
            </button>
          </div>
          {short && (
            <p className="mt-3 rounded-xl bg-coral/12 px-3 py-2 text-xs text-coral">
              Short by {rupees(amount - balance)}. Top up the demo wallet or pay
              by card.
            </p>
          )}
        </div>
      )}

      {method === "card" && (
        <div className="animate-in-fade space-y-3">
          <CardPreview card={card} />
          <Field
            label="Name on card"
            value={card.name}
            onChange={(v) => setCard({ ...card, name: v })}
            placeholder="Your name"
            error={cardErrors.name}
            autoComplete="off"
          />
          <Field
            label="Card number"
            value={card.number}
            onChange={(v) => setCard({ ...card, number: formatCardNumber(v) })}
            placeholder="4111 1111 1111 1111"
            error={cardErrors.number}
            inputMode="numeric"
            mono
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Expiry"
              value={card.expiry}
              onChange={(v) => setCard({ ...card, expiry: formatExpiry(v) })}
              placeholder="MM/YY"
              error={cardErrors.expiry}
              inputMode="numeric"
              mono
            />
            <Field
              label="CVV"
              value={card.cvv}
              onChange={(v) =>
                setCard({ ...card, cvv: digitsOnly(v).slice(0, 3) })
              }
              placeholder="123"
              error={cardErrors.cvv}
              inputMode="numeric"
              mono
            />
          </div>
        </div>
      )}

      {method === "upi" && (
        <div className="animate-in-fade space-y-3">
          <Field
            label="UPI ID"
            value={vpa}
            onChange={setVpa}
            placeholder="yourname@bank"
            error={vpaError ?? undefined}
            mono
          />
          <p className="text-xs text-ink-400">
            A real app would open your UPI app here. This demo just checks the
            format and moves on.
          </p>
        </div>
      )}

      <p className="flex items-start gap-2 rounded-2xl border border-white/8 bg-white/3 p-3 text-[11px] leading-relaxed text-ink-400">
        <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0 text-teal-glow" />
        <span>
          <strong className="text-ink-200">This is a demo checkout.</strong> No
          payment is taken and nothing is sent anywhere — the card fields are
          validated for format only and never leave this browser tab. Don&apos;t
          type a real card number.
        </span>
      </p>
    </div>
  );
}

function Row({ k, v, muted }: { k: string; v: string; muted?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={muted ? "text-ink-400" : "text-ink-300"}>{k}</dt>
      <dd
        className={`text-right ${muted ? "text-ink-400" : "font-medium text-white"}`}
      >
        {v}
      </dd>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  error,
  inputMode,
  mono,
  autoComplete = "off",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  inputMode?: "numeric" | "text";
  mono?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold tracking-wider text-ink-400 uppercase">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete={autoComplete}
        className={`w-full rounded-xl border bg-ink-900/70 px-3.5 py-2.5 text-sm text-white placeholder:text-ink-400/70 focus:outline-none ${
          mono ? "font-mono tracking-wide" : ""
        } ${
          error
            ? "border-coral/60 focus:border-coral"
            : "border-white/12 focus:border-lime-glow/60"
        }`}
      />
      {error && <span className="mt-1 block text-[11px] text-coral">{error}</span>}
    </label>
  );
}

function CardPreview({
  card,
}: {
  card: { name: string; number: string; expiry: string };
}) {
  const brand = cardBrand(card.number);
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-ink-700 via-ink-800 to-ink-900 p-4">
      <div className="absolute -top-10 -right-6 h-32 w-32 rounded-full bg-lime-glow/10 blur-2xl" />
      <div className="flex items-start justify-between">
        <span className="text-[10px] font-bold tracking-[0.2em] text-ink-400 uppercase">
          Demo card
        </span>
        <span className="text-xs font-bold text-ink-200">{brand}</span>
      </div>
      <p className="mt-5 font-mono text-base tracking-[0.18em] text-white">
        {card.number || "•••• •••• •••• ••••"}
      </p>
      <div className="mt-4 flex items-end justify-between text-[11px]">
        <span className="truncate text-ink-300 uppercase">
          {card.name || "CARDHOLDER NAME"}
        </span>
        <span className="font-mono text-ink-300">{card.expiry || "MM/YY"}</span>
      </div>
    </div>
  );
}

/* ======================= step 3: fake processing ======================= */

function Processing({
  amount,
  method,
}: {
  amount: number;
  method: PaymentMethod;
}) {
  const labels: Record<PaymentMethod, string> = {
    wallet: "Debiting your PicklePay balance",
    card: "Authorising with the demo gateway",
    upi: "Waiting for the demo UPI approval",
  };
  return (
    <div className="flex min-h-[18rem] flex-col items-center justify-center text-center">
      <SpinnerIcon className="h-10 w-10 text-lime-glow" />
      <p className="mt-5 text-lg font-semibold text-white">
        Holding your court…
      </p>
      <p className="mt-1 text-sm text-ink-400">
        {labels[method]} · {rupees(amount)}
      </p>
      <div className="mt-6 h-1 w-48 overflow-hidden rounded-full bg-ink-700">
        <div className="animate-shimmer h-full w-full bg-gradient-to-r from-transparent via-lime-glow to-transparent" />
      </div>
    </div>
  );
}

/* ========================= step 4: confirmation ========================= */

function DoneStep({
  id,
  court,
  dateKey,
  hour,
  players,
  amount,
  method,
}: {
  id: string;
  court: Court;
  dateKey: string;
  hour: number;
  players: number;
  amount: number;
  method: PaymentMethod;
}) {
  const methodLabel: Record<PaymentMethod, string> = {
    wallet: "PicklePay wallet",
    card: "Demo card",
    upi: "Demo UPI",
  };

  return (
    <div className="animate-pop space-y-5">
      <div className="flex flex-col items-center py-4 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-lime-glow/15 text-lime-glow ring-1 ring-lime-glow/40">
          <CheckIcon className="h-8 w-8" />
        </span>
        <h3 className="mt-4 text-xl font-bold text-white">Court locked in</h3>
        <p className="mt-1 text-sm text-ink-400">
          Booking <span className="font-mono text-ink-200">{id}</span>
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10">
        <div className="bg-gradient-to-r from-lime-glow/12 to-teal-glow/10 px-4 py-3">
          <p className="text-sm font-bold text-white">{court.name}</p>
          <p className="text-xs text-ink-300">{court.address}</p>
        </div>
        <dl className="space-y-2 bg-ink-900/60 p-4 text-sm">
          <Row k="Date" v={prettyDate(dateKey)} />
          <Row k="Slot" v={`${slotRangeLabel(hour)} (1 hour)`} />
          <Row k="Format" v={players === 2 ? "Singles" : "Doubles"} />
          <Row k="Paid" v={`${rupees(amount)} · ${methodLabel[method]}`} />
          <Row k="Venue desk" v={court.phone} muted />
        </dl>
      </div>

      <p className="rounded-2xl border border-white/8 bg-white/3 p-3 text-[11px] leading-relaxed text-ink-400">
        Saved in this browser only — no account, no server. Clearing site data
        clears your bookings. Cancel any time from{" "}
        <strong className="text-ink-200">My bookings</strong> for a full refund
        to the demo wallet.
      </p>
    </div>
  );
}
