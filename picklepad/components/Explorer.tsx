"use client";

import { useEffect, useMemo, useState } from "react";
import { COURTS, type Court } from "@/data/courts";
import { haversineKm } from "@/lib/geo";
import { matchesQuery } from "@/lib/search";
import { buildSlots, toDateKey } from "@/lib/slots";
import { bookedCountsFor } from "@/lib/store";
import BookingFlow from "./BookingFlow";
import BookingsDrawer from "./BookingsDrawer";
import CourtCard from "./CourtCard";
import CourtMap from "./CourtMap";
import Filters, { DEFAULT_FILTERS, type FilterState } from "./Filters";
import Header from "./Header";
import LocationBar, { type Origin } from "./LocationBar";
import SearchTypeahead from "./SearchTypeahead";
import { useStore } from "./StoreProvider";
import { PaddleIcon, SearchIcon } from "./Icons";

type Row = {
  court: Court;
  distanceKm: number | null;
  freeToday: number | null;
  nextFreeHour: number | null;
  score: number;
};

const PAGE_SIZE = 9;

export default function Explorer() {
  const { state, ready } = useStore();

  const [query, setQuery] = useState("");
  const [area, setArea] = useState<string | null>(null);
  const [origin, setOrigin] = useState<Origin | null>(null);
  const [radiusKm, setRadiusKm] = useState(5);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [selected, setSelected] = useState<Court | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [bookingsOpen, setBookingsOpen] = useState(false);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const todayKey = useMemo(() => toDateKey(new Date()), []);

  // Once a location is known, nearest-first is what people actually want.
  useEffect(() => {
    if (origin && filters.sort === "smart") {
      setFilters((f) => ({ ...f, sort: "distance" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin]);

  useEffect(() => setVisible(PAGE_SIZE), [query, area, origin, radiusKm, filters]);

  /** Availability for today, per court — recomputed when bookings change. */
  const todayAvailability = useMemo(() => {
    const map = new Map<string, { free: number | null; next: number | null }>();
    for (const court of COURTS) {
      const slots = buildSlots(
        court,
        todayKey,
        ready ? bookedCountsFor(state.bookings, court.id, todayKey) : {},
      );
      const open = slots.filter((s) => !s.past);
      if (open.length === 0) {
        map.set(court.id, { free: null, next: null });
        continue;
      }
      const free = open.filter((s) => s.free > 0);
      map.set(court.id, {
        free: free.length,
        next: free[0]?.hour ?? null,
      });
    }
    return map;
  }, [state.bookings, ready, todayKey]);

  const rows = useMemo<Row[]>(() => {
    const nowHour = new Date().getHours();

    const out: Row[] = [];
    for (const court of COURTS) {
      if (area && court.area !== area) continue;
      if (!matchesQuery(court, query)) continue;
      if (filters.setting === "indoor" && !court.indoor) continue;
      if (filters.setting === "outdoor" && court.indoor) continue;
      if (court.pricePerHour > filters.maxPrice) continue;
      if (court.rating < filters.minRating) continue;
      if (
        filters.openNow &&
        !(nowHour >= court.openHour && nowHour < court.closeHour)
      )
        continue;
      if (!filters.amenities.every((a) => court.amenities.includes(a))) continue;
      if (!filters.tags.every((t) => court.tags.includes(t))) continue;

      const distanceKm = origin ? haversineKm(origin.point, court) : null;
      if (distanceKm !== null && distanceKm > radiusKm) continue;

      const avail = todayAvailability.get(court.id);

      // "Best match" blends rating, availability and proximity.
      let score = court.rating * 2;
      if (avail?.free) score += Math.min(4, avail.free) * 0.6;
      if (distanceKm !== null) score += Math.max(0, 6 - distanceKm) * 0.5;

      out.push({
        court,
        distanceKm,
        freeToday: avail?.free ?? null,
        nextFreeHour: avail?.next ?? null,
        score,
      });
    }

    const cmp: Record<FilterState["sort"], (a: Row, b: Row) => number> = {
      smart: (a, b) => b.score - a.score,
      distance: (a, b) =>
        (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity) ||
        b.score - a.score,
      price: (a, b) => a.court.pricePerHour - b.court.pricePerHour,
      rating: (a, b) => b.court.rating - a.court.rating,
    };

    return out.sort(cmp[filters.sort]);
  }, [area, query, filters, origin, radiusKm, todayAvailability]);

  const inRadius = useMemo(() => {
    if (!origin) return COURTS.length;
    return COURTS.filter((c) => haversineKm(origin.point, c) <= radiusKm).length;
  }, [origin, radiusKm]);

  const shown = rows.slice(0, visible);

  return (
    <>
      <Header onOpenBookings={() => setBookingsOpen(true)} />

      <Hero
        query={query}
        setQuery={setQuery}
        onPickCourt={setSelected}
        onPickArea={setArea}
        venues={COURTS.length}
      />

      <main
        id="explore"
        className="mx-auto max-w-7xl scroll-mt-20 px-4 pb-24 sm:px-6"
      >
        <div className="space-y-4">
          <LocationBar
            origin={origin}
            onOrigin={setOrigin}
            radiusKm={radiusKm}
            onRadius={setRadiusKm}
            inRadius={inRadius}
          />
          <Filters
            filters={filters}
            onChange={setFilters}
            area={area}
            onArea={setArea}
            hasOrigin={!!origin}
            resultCount={rows.length}
          />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
          {/* results */}
          <section aria-label="Search results">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xl font-bold text-white">
                {origin ? (
                  <>
                    Courts within {radiusKm} km of{" "}
                    <span className="text-lime-glow">{origin.label}</span>
                  </>
                ) : query || area ? (
                  <>
                    {rows.length} result{rows.length === 1 ? "" : "s"}
                    {area && <> in {area}</>}
                  </>
                ) : (
                  "All courts in Bengaluru"
                )}
              </h2>
              <p className="text-xs text-ink-400">
                Prices shown are per court, per hour
              </p>
            </div>

            {rows.length === 0 ? (
              <EmptyState
                onReset={() => {
                  setQuery("");
                  setArea(null);
                  setFilters(DEFAULT_FILTERS);
                  setRadiusKm(30);
                }}
              />
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  {shown.map((r, i) => (
                    <div
                      key={r.court.id}
                      className="animate-in-up"
                      style={{ animationDelay: `${Math.min(i, 8) * 35}ms` }}
                    >
                      <CourtCard
                        court={r.court}
                        distanceKm={r.distanceKm}
                        freeToday={r.freeToday}
                        nextFreeHour={r.nextFreeHour}
                        onOpen={() => setSelected(r.court)}
                        onHover={setHoveredId}
                      />
                    </div>
                  ))}
                </div>

                {visible < rows.length && (
                  <div className="mt-6 text-center">
                    <button
                      type="button"
                      onClick={() => setVisible((v) => v + PAGE_SIZE)}
                      className="rounded-xl border border-white/12 px-5 py-3 text-sm font-semibold text-ink-200 transition hover:border-lime-glow/50 hover:text-white"
                    >
                      Show {Math.min(PAGE_SIZE, rows.length - visible)} more
                      <span className="ml-2 text-ink-400">
                        ({rows.length - visible} left)
                      </span>
                    </button>
                  </div>
                )}
              </>
            )}
          </section>

          {/* map rail */}
          <aside id="map" className="scroll-mt-24 lg:sticky lg:top-20 lg:self-start">
            <CourtMap
              courts={rows.map((r) => r.court)}
              allCourts={COURTS}
              origin={origin}
              radiusKm={origin ? radiusKm : 0}
              selectedId={hoveredId ?? selected?.id ?? null}
              onSelect={setSelected}
            />
            <div className="glass mt-4 rounded-3xl p-4">
              <h3 className="text-sm font-semibold text-white">
                How availability works
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-ink-400">
                Every venue&apos;s open hours are split into 1-hour slots. Peak
                blocks — 6–9 AM and 6–10 PM — run fuller and cost 25% more.
                Slots you book are held in this browser, so the grid updates
                instantly without a server.
              </p>
            </div>
          </aside>
        </div>

        <HowItWorks />
      </main>

      <Footer />

      <BookingFlow
        court={selected}
        origin={origin}
        onClose={() => setSelected(null)}
        onViewBookings={() => setBookingsOpen(true)}
      />
      <BookingsDrawer
        open={bookingsOpen}
        onClose={() => setBookingsOpen(false)}
      />
    </>
  );
}

/* ------------------------------- hero ------------------------------- */

function Hero({
  query,
  setQuery,
  onPickCourt,
  onPickArea,
  venues,
}: {
  query: string;
  setQuery: (q: string) => void;
  onPickCourt: (c: Court) => void;
  onPickArea: (a: string) => void;
  venues: number;
}) {
  const chips = ["Indiranagar", "Whitefield", "rooftop", "Floodlights", "budget"];

  return (
    <section id="top" className="relative overflow-hidden">
      <div className="bg-court-grid absolute inset-0 opacity-[0.35]" />
      <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-lime-glow/12 blur-[110px]" />
      <div className="absolute -top-24 right-1/5 h-80 w-80 rounded-full bg-teal-glow/12 blur-[110px]" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ink-950 to-transparent" />

      <div className="relative mx-auto max-w-4xl px-4 pt-16 pb-12 text-center sm:px-6 sm:pt-24 sm:pb-16">
        <span className="animate-in-fade inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3.5 py-1.5 text-[11px] font-semibold tracking-wider text-ink-300 uppercase">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lime-glow" />
          {venues} courts · 18 localities · instant booking
        </span>

        <h1 className="animate-in-up mt-6 text-balance text-4xl leading-[1.05] font-extrabold tracking-tight text-white sm:text-6xl">
          Find an open court.
          <br />
          <span className="bg-gradient-to-r from-lime-glow via-teal-glow to-lime-glow bg-clip-text text-transparent">
            Book the next hour.
          </span>
        </h1>

        <p className="animate-in-up mx-auto mt-4 max-w-xl text-balance text-[15px] leading-relaxed text-ink-300 sm:text-base">
          Search every pickleball court in Bengaluru by name, neighbourhood or
          amenity — or let your browser find the ones closest to you right now.
        </p>

        <div className="animate-in-up mx-auto mt-8 max-w-2xl">
          <SearchTypeahead
            value={query}
            onChange={setQuery}
            onPickCourt={onPickCourt}
            onPickArea={onPickArea}
          />
          <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
            <span className="text-xs text-ink-400">Popular:</span>
            {chips.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setQuery(c)}
                className="rounded-full border border-white/10 px-2.5 py-1 text-xs font-medium text-ink-300 transition hover:border-lime-glow/45 hover:text-white"
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------- empty state ---------------------------- */

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="rounded-3xl border border-dashed border-white/12 px-6 py-16 text-center">
      <SearchIcon className="mx-auto h-9 w-9 text-ink-600" />
      <h3 className="mt-4 text-lg font-semibold text-white">
        No courts match that
      </h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-ink-400">
        Try widening the radius, raising the price ceiling, or dropping a filter
        or two.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-5 rounded-xl bg-lime-glow px-5 py-2.5 text-sm font-bold text-ink-950 transition hover:bg-white"
      >
        Reset everything
      </button>
    </div>
  );
}

/* ---------------------------- how it works ---------------------------- */

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Search or share your location",
      body: "Type a venue, an area or an amenity and the typeahead narrows as you go. Or tap “Use my location” and set a radius — everything outside it drops off the list and the map.",
    },
    {
      n: "02",
      title: "Pick a free 1-hour slot",
      body: "Each venue shows a week of dates and an hour-by-hour grid with how many of its courts are still free, plus peak-hour pricing so there are no surprises at the desk.",
    },
    {
      n: "03",
      title: "Pay with the demo wallet",
      body: "Checkout runs entirely in your browser — PicklePay wallet, a dummy card or a dummy UPI ID. Nothing is charged, nothing is sent anywhere, and you can cancel for a full refund.",
    },
  ];

  return (
    <section id="how" className="mt-20 scroll-mt-20">
      <h2 className="text-balance text-center text-2xl font-bold text-white sm:text-3xl">
        Three taps from “where do we play?” to a booked court
      </h2>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {steps.map((s) => (
          <div
            key={s.n}
            className="glass rounded-3xl p-5 transition hover:border-white/20"
          >
            <span className="font-mono text-xs font-bold text-lime-glow">
              {s.n}
            </span>
            <h3 className="mt-2 text-base font-semibold text-white">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-400">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/6 bg-ink-900/50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-md">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-lime-glow text-ink-950">
                <PaddleIcon className="h-4 w-4" />
              </span>
              <span className="font-extrabold tracking-tight text-white">
                PicklePad
              </span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-ink-400">
              A demo product built as a static site — no database, no backend,
              no API keys, so it runs on a free hosting tier.
            </p>
          </div>

          <div className="max-w-sm rounded-2xl border border-white/8 bg-white/3 p-4">
            <p className="text-[11px] font-bold tracking-wider text-ink-300 uppercase">
              About this data
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-ink-400">
              Every venue name, phone number and street address here is
              invented for this demo. Map positions are approximate
              neighbourhood placements, not real addresses. No real business is
              represented, listed or bookable, and no payment is ever taken.
            </p>
          </div>
        </div>

        <p className="mt-8 border-t border-white/6 pt-5 text-[11px] text-ink-400">
          © {new Date().getFullYear()} PicklePad demo · Bengaluru, India
        </p>
      </div>
    </footer>
  );
}
