import type { Court } from "@/data/courts";

export type Slot = {
  /** Hour of day the 1-hour slot starts, 0-23. */
  hour: number;
  label: string;
  /** How many of the venue's courts are free for this hour. */
  free: number;
  /** Price for this specific hour, after peak/off-peak adjustment. */
  price: number;
  peak: boolean;
  /** Already gone by the clock (only ever true for today). */
  past: boolean;
};

export const DATE_WINDOW_DAYS = 7;

/** ISO yyyy-mm-dd in the browser's local timezone, not UTC. */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function nextDates(days = DATE_WINDOW_DAYS): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d;
  });
}

export function formatHour(hour: number): string {
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const suffix = hour < 12 ? "AM" : "PM";
  return `${h12}:00 ${suffix}`;
}

export function slotRangeLabel(hour: number): string {
  return `${formatHour(hour)} – ${formatHour((hour + 1) % 24)}`;
}

/** Peak hours: early-morning and after-work rush, when every court fills up. */
export function isPeakHour(hour: number): boolean {
  return (hour >= 6 && hour < 9) || (hour >= 18 && hour < 22);
}

export function peakPrice(base: number, hour: number): number {
  return isPeakHour(hour) ? Math.round((base * 1.25) / 10) * 10 : base;
}

/**
 * Deterministic 32-bit hash. Baseline availability has to be stable across
 * reloads and identical on every device without a server, so it is derived from
 * the court id + date + hour rather than stored anywhere.
 */
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

function baselineOccupied(court: Court, dateKey: string, hour: number): number {
  const r = hash(`${court.id}|${dateKey}|${hour}`);
  const day = new Date(`${dateKey}T00:00:00`).getDay();
  const weekend = day === 0 || day === 6;

  // Peak and weekend hours run much fuller.
  let load = isPeakHour(hour) ? 0.78 : 0.32;
  if (weekend) load += 0.12;
  if (hour >= 12 && hour < 16) load -= 0.15; // nobody plays in the afternoon sun

  const occupied = Math.round(court.courts * Math.min(0.98, Math.max(0, load)) * (0.55 + r * 0.9));
  return Math.min(court.courts, Math.max(0, occupied));
}

/**
 * Builds the 1-hour slot grid for one court on one date.
 * `bookedCounts` maps `hour` -> number of courts this browser has already
 * booked, read from localStorage by the caller.
 */
export function buildSlots(
  court: Court,
  dateKey: string,
  bookedCounts: Record<number, number> = {},
): Slot[] {
  const now = new Date();
  const isToday = dateKey === toDateKey(now);
  const slots: Slot[] = [];

  for (let hour = court.openHour; hour < court.closeHour; hour++) {
    const occupied =
      baselineOccupied(court, dateKey, hour) + (bookedCounts[hour] ?? 0);
    slots.push({
      hour,
      label: slotRangeLabel(hour),
      free: Math.max(0, court.courts - occupied),
      price: peakPrice(court.pricePerHour, hour),
      peak: isPeakHour(hour),
      past: isToday && hour <= now.getHours(),
    });
  }

  return slots;
}

/** Cheapest bookable slot today or tomorrow — powers the "from ₹x" badge. */
export function lowestPrice(court: Court): number {
  let min = Infinity;
  for (let h = court.openHour; h < court.closeHour; h++) {
    min = Math.min(min, peakPrice(court.pricePerHour, h));
  }
  return min === Infinity ? court.pricePerHour : min;
}
