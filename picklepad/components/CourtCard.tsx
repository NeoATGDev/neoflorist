"use client";

import type { Court } from "@/data/courts";
import { rupees } from "@/lib/format";
import { estimateDriveMinutes, formatDistance } from "@/lib/geo";
import { formatHour, lowestPrice } from "@/lib/slots";
import {
  ClockIcon,
  IndoorIcon,
  PaddleIcon,
  PinIcon,
  StarIcon,
  SunIcon,
} from "./Icons";

type Props = {
  court: Court;
  distanceKm: number | null;
  /** Free slots left today, or null when the venue has already closed. */
  freeToday: number | null;
  nextFreeHour: number | null;
  onOpen: () => void;
  onHover?: (id: string | null) => void;
};

export default function CourtCard({
  court,
  distanceKm,
  freeToday,
  nextFreeHour,
  onOpen,
  onHover,
}: Props) {
  const from = lowestPrice(court);

  return (
    <article
      onMouseEnter={() => onHover?.(court.id)}
      onMouseLeave={() => onHover?.(null)}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/8 bg-ink-850/70 transition-all duration-300 hover:-translate-y-1 hover:border-white/18 hover:shadow-[0_24px_60px_-24px_rgba(0,0,0,0.9)]"
    >
      {/* Generated cover — no stock photography, so nothing to license. */}
      <div
        className="relative h-28 shrink-0 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, hsl(${court.hue} 70% 22%) 0%, hsl(${
            (court.hue + 45) % 360
          } 65% 12%) 100%)`,
        }}
      >
        <svg
          className="absolute inset-0 h-full w-full opacity-35"
          viewBox="0 0 200 80"
          preserveAspectRatio="none"
          aria-hidden
        >
          {/* stylised pickleball court lines */}
          <rect x="34" y="8" width="132" height="64" fill="none" stroke={`hsl(${court.hue} 90% 72%)`} strokeWidth="1.2" />
          <line x1="34" y1="40" x2="166" y2="40" stroke={`hsl(${court.hue} 90% 72%)`} strokeWidth="1.2" />
          <line x1="100" y1="8" x2="100" y2="72" stroke={`hsl(${court.hue} 90% 72%)`} strokeWidth="2.4" />
          <line x1="66" y1="8" x2="66" y2="72" stroke={`hsl(${court.hue} 90% 72%)`} strokeWidth="1.2" strokeDasharray="3 3" />
          <line x1="134" y1="8" x2="134" y2="72" stroke={`hsl(${court.hue} 90% 72%)`} strokeWidth="1.2" strokeDasharray="3 3" />
          <circle cx="152" cy="22" r="5" fill={`hsl(${court.hue} 95% 68%)`} opacity="0.7" />
        </svg>
        <div className="absolute inset-0 bg-gradient-to-t from-ink-850 via-ink-850/20 to-transparent" />

        <div className="absolute top-3 left-3 flex gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[10px] font-bold tracking-wide text-white uppercase backdrop-blur">
            {court.indoor ? (
              <IndoorIcon className="h-3 w-3" />
            ) : (
              <SunIcon className="h-3 w-3" />
            )}
            {court.indoor ? "Indoor" : "Outdoor"}
          </span>
          {distanceKm !== null && (
            <span className="rounded-full bg-teal-glow/90 px-2 py-1 text-[10px] font-bold tracking-wide text-ink-950 uppercase">
              {formatDistance(distanceKm)}
            </span>
          )}
        </div>

        <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[11px] font-bold text-white backdrop-blur">
          <StarIcon className="h-3 w-3 text-lime-glow" />
          {court.rating.toFixed(1)}
          <span className="font-normal text-ink-400">({court.reviews})</span>
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4 pt-3">
        <h3 className="text-balance text-[17px] leading-snug font-semibold text-white">
          {court.name}
        </h3>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-400">
          <PinIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {court.area}
            {distanceKm !== null && (
              <> · ~{estimateDriveMinutes(distanceKm)} min drive</>
            )}
          </span>
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <Chip>
            <PaddleIcon className="h-3 w-3" />
            {court.courts} courts
          </Chip>
          <Chip>{court.surface}</Chip>
          <Chip>
            <ClockIcon className="h-3 w-3" />
            {formatHour(court.openHour)}–{formatHour(court.closeHour)}
          </Chip>
        </div>

        <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-ink-300">
          {court.amenities.slice(0, 4).map((a) => (
            <li key={a} className="flex items-center gap-1">
              <span className="h-1 w-1 rounded-full bg-lime-glow/70" />
              {a}
            </li>
          ))}
          {court.amenities.length > 4 && (
            <li className="text-ink-400">+{court.amenities.length - 4} more</li>
          )}
        </ul>

        <div className="mt-4 flex items-end justify-between gap-3 border-t border-white/8 pt-3">
          <div>
            <p className="text-[11px] text-ink-400">1 hour from</p>
            <p className="text-lg leading-tight font-bold text-white">
              {rupees(from)}
              <span className="ml-1 text-xs font-normal text-ink-400">/hr</span>
            </p>
            <p className="mt-0.5 text-[11px]">
              {freeToday === null ? (
                <span className="text-ink-400">Closed for today</span>
              ) : freeToday === 0 ? (
                <span className="text-coral">Fully booked today</span>
              ) : (
                <span className="text-teal-glow">
                  {freeToday} slot{freeToday === 1 ? "" : "s"} free today
                  {nextFreeHour !== null && ` · next ${formatHour(nextFreeHour)}`}
                </span>
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={onOpen}
            className="shrink-0 rounded-xl bg-lime-glow px-4 py-2.5 text-sm font-bold text-ink-950 transition hover:bg-white active:scale-95"
          >
            Book a slot
          </button>
        </div>
      </div>
    </article>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/4 px-2 py-1 text-[11px] font-medium text-ink-300">
      {children}
    </span>
  );
}
