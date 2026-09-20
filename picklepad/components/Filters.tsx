"use client";

import { AMENITIES, PRICE_RANGE, TAGS } from "@/data/courts";
import { rupees } from "@/lib/format";
import { CloseIcon, IndoorIcon, SlidersIcon, SunIcon } from "./Icons";

export type Setting = "any" | "indoor" | "outdoor";
export type SortKey = "smart" | "distance" | "price" | "rating";

export type FilterState = {
  setting: Setting;
  maxPrice: number;
  amenities: string[];
  tags: string[];
  openNow: boolean;
  minRating: number;
  sort: SortKey;
};

export const DEFAULT_FILTERS: FilterState = {
  setting: "any",
  maxPrice: PRICE_RANGE.max,
  amenities: [],
  tags: [],
  openNow: false,
  minRating: 0,
  sort: "smart",
};

export function countActive(f: FilterState, area: string | null): number {
  let n = 0;
  if (f.setting !== "any") n++;
  if (f.maxPrice < PRICE_RANGE.max) n++;
  if (f.openNow) n++;
  if (f.minRating > 0) n++;
  n += f.amenities.length + f.tags.length;
  if (area) n++;
  return n;
}

const POPULAR_TAGS = [
  "beginner-friendly",
  "tournament-grade",
  "rooftop",
  "late-night",
  "coaching",
  "premium",
  "budget",
  "open-play",
].filter((t) => TAGS.includes(t));

const POPULAR_AMENITIES = [
  "Floodlights",
  "Paddle rental",
  "Free parking",
  "Showers",
  "Cafe",
  "Air-conditioned",
  "Coaching available",
  "Changing rooms",
].filter((a) => AMENITIES.includes(a));

type Props = {
  filters: FilterState;
  onChange: (next: FilterState) => void;
  area: string | null;
  onArea: (a: string | null) => void;
  hasOrigin: boolean;
  resultCount: number;
};

export default function Filters({
  filters,
  onChange,
  area,
  onArea,
  hasOrigin,
  resultCount,
}: Props) {
  const active = countActive(filters, area);
  const set = (patch: Partial<FilterState>) => onChange({ ...filters, ...patch });

  const toggle = (key: "amenities" | "tags", value: string) =>
    set({
      [key]: filters[key].includes(value)
        ? filters[key].filter((v) => v !== value)
        : [...filters[key], value],
    } as Partial<FilterState>);

  return (
    <div className="glass rounded-3xl p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
          <SlidersIcon className="h-4 w-4 text-lime-glow" />
          Refine
          {active > 0 && (
            <span className="rounded-full bg-lime-glow px-2 py-0.5 text-[10px] font-bold text-ink-950">
              {active}
            </span>
          )}
        </h2>

        <div className="flex items-center gap-2">
          <label className="text-[11px] font-semibold tracking-wider text-ink-400 uppercase">
            Sort
          </label>
          <select
            value={filters.sort}
            onChange={(e) => set({ sort: e.target.value as SortKey })}
            className="rounded-xl border border-white/12 bg-ink-900 px-3 py-2 text-xs font-semibold text-ink-200 focus:border-lime-glow/60 focus:outline-none"
          >
            <option value="smart">Best match</option>
            <option value="distance" disabled={!hasOrigin}>
              Nearest first{hasOrigin ? "" : " (set a location)"}
            </option>
            <option value="price">Cheapest first</option>
            <option value="rating">Highest rated</option>
          </select>
          {active > 0 && (
            <button
              type="button"
              onClick={() => {
                onChange(DEFAULT_FILTERS);
                onArea(null);
              }}
              className="rounded-xl border border-white/12 px-3 py-2 text-xs font-semibold text-ink-400 transition hover:border-coral/40 hover:text-coral"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {area && (
        <div className="mt-3">
          <span className="inline-flex items-center gap-2 rounded-xl border border-teal-glow/30 bg-teal-glow/10 px-3 py-1.5 text-xs font-semibold text-teal-glow">
            Area: {area}
            <button
              type="button"
              onClick={() => onArea(null)}
              aria-label={`Remove ${area} filter`}
              className="rounded-full p-0.5 transition hover:bg-black/25"
            >
              <CloseIcon className="h-3 w-3" />
            </button>
          </span>
        </div>
      )}

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {/* setting */}
        <div>
          <p className="mb-2 text-[11px] font-semibold tracking-wider text-ink-400 uppercase">
            Indoor or outdoor
          </p>
          <div className="flex gap-1.5">
            {(
              [
                { id: "any", label: "Any", Icon: null },
                { id: "indoor", label: "Indoor", Icon: IndoorIcon },
                { id: "outdoor", label: "Outdoor", Icon: SunIcon },
              ] as const
            ).map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => set({ setting: o.id })}
                className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  filters.setting === o.id
                    ? "bg-white text-ink-950"
                    : "border border-white/10 text-ink-300 hover:border-white/25 hover:text-white"
                }`}
              >
                {o.Icon && <o.Icon className="h-3.5 w-3.5" />}
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* price */}
        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <p className="text-[11px] font-semibold tracking-wider text-ink-400 uppercase">
              Max per hour
            </p>
            <span className="font-mono text-xs text-white">
              {rupees(filters.maxPrice)}
            </span>
          </div>
          <input
            type="range"
            min={PRICE_RANGE.min}
            max={PRICE_RANGE.max}
            step={50}
            value={filters.maxPrice}
            onChange={(e) => set({ maxPrice: Number(e.target.value) })}
            aria-label="Maximum price per hour"
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full"
            style={{
              background: `linear-gradient(to right, var(--color-lime-glow) ${
                ((filters.maxPrice - PRICE_RANGE.min) /
                  (PRICE_RANGE.max - PRICE_RANGE.min)) *
                100
              }%, var(--color-ink-700) ${
                ((filters.maxPrice - PRICE_RANGE.min) /
                  (PRICE_RANGE.max - PRICE_RANGE.min)) *
                100
              }%)`,
            }}
          />
        </div>
      </div>

      {/* quick switches */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        <Toggle
          on={filters.openNow}
          onClick={() => set({ openNow: !filters.openNow })}
        >
          Open right now
        </Toggle>
        <Toggle
          on={filters.minRating >= 4.5}
          onClick={() => set({ minRating: filters.minRating >= 4.5 ? 0 : 4.5 })}
        >
          Rated 4.5+
        </Toggle>
        {POPULAR_TAGS.map((t) => (
          <Toggle
            key={t}
            on={filters.tags.includes(t)}
            onClick={() => toggle("tags", t)}
          >
            {t.replace(/-/g, " ")}
          </Toggle>
        ))}
      </div>

      <details className="group mt-4">
        <summary className="cursor-pointer list-none text-xs font-semibold text-ink-300 transition hover:text-white">
          <span className="group-open:hidden">+ Amenities</span>
          <span className="hidden group-open:inline">− Amenities</span>
        </summary>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {POPULAR_AMENITIES.map((a) => (
            <Toggle
              key={a}
              on={filters.amenities.includes(a)}
              onClick={() => toggle("amenities", a)}
            >
              {a}
            </Toggle>
          ))}
        </div>
      </details>

      <p className="mt-4 border-t border-white/6 pt-3 text-xs text-ink-400">
        <span className="font-semibold text-white">{resultCount}</span> venue
        {resultCount === 1 ? "" : "s"} match your filters.
      </p>
    </div>
  );
}

function Toggle({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${
        on
          ? "bg-lime-glow text-ink-950"
          : "border border-white/10 text-ink-300 hover:border-white/25 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
