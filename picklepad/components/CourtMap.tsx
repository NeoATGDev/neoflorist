"use client";

import { useMemo, useState } from "react";
import type { Court } from "@/data/courts";
import { formatDistance, haversineKm, projectToUnitSquare } from "@/lib/geo";
import type { Origin } from "./LocationBar";
import { rupees } from "@/lib/format";

type Props = {
  courts: Court[];
  /** All courts, used to keep the map framing stable while filters change. */
  allCourts: Court[];
  origin: Origin | null;
  radiusKm: number;
  selectedId: string | null;
  onSelect: (court: Court) => void;
};

/**
 * A dependency-free, key-free map.
 *
 * Rather than pull in a tile provider (which means an API key, a paid quota and
 * a server), this projects the coordinates into an SVG and draws them over an
 * abstract city grid. It is schematic, not cartographic — good enough to show
 * relative position and the radius ring, and it costs nothing to host.
 */
export default function CourtMap({
  courts,
  allCourts,
  origin,
  radiusKm,
  selectedId,
  onSelect,
}: Props) {
  const [hover, setHover] = useState<string | null>(null);

  const { project, radiusUnits } = useMemo(() => {
    const points = allCourts.map((c) => ({ lat: c.lat, lng: c.lng }));
    if (origin) points.push(origin.point);
    const { project, kmPerUnitX } = projectToUnitSquare(points, 0.1);
    return { project, radiusUnits: radiusKm / kmPerUnitX };
  }, [allCourts, origin, radiusKm]);

  const visible = useMemo(() => new Set(courts.map((c) => c.id)), [courts]);

  const markers = useMemo(
    () =>
      allCourts.map((c) => {
        const p = project({ lat: c.lat, lng: c.lng });
        return {
          court: c,
          x: p.x * 100,
          y: p.y * 100,
          dim: !visible.has(c.id),
          distanceKm: origin ? haversineKm(origin.point, c) : null,
        };
      }),
    [allCourts, project, visible, origin],
  );

  const originPt = origin ? project(origin.point) : null;
  const hovered = markers.find((m) => m.court.id === hover);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-ink-900">
      {/* abstract city backdrop */}
      <div className="bg-court-grid absolute inset-0 opacity-40" />
      <div className="absolute -top-24 -left-16 h-64 w-64 rounded-full bg-teal-glow/8 blur-3xl" />
      <div className="absolute -right-20 -bottom-24 h-72 w-72 rounded-full bg-lime-glow/8 blur-3xl" />

      <svg
        viewBox="0 0 100 100"
        className="relative block aspect-square w-full"
        role="img"
        aria-label={`Schematic map of ${courts.length} pickleball venues in Bengaluru`}
      >
        <defs>
          <radialGradient id="pp-radius" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--color-teal-glow)" stopOpacity="0.16" />
            <stop offset="75%" stopColor="var(--color-teal-glow)" stopOpacity="0.05" />
            <stop offset="100%" stopColor="var(--color-teal-glow)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* compass ticks */}
        {["N", "E", "S", "W"].map((d, i) => {
          const pos = [
            { x: 50, y: 5 },
            { x: 95, y: 51 },
            { x: 50, y: 97 },
            { x: 5, y: 51 },
          ][i]!;
          return (
            <text
              key={d}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              className="fill-white/20"
              style={{ fontSize: 3, fontWeight: 700, letterSpacing: 0.4 }}
            >
              {d}
            </text>
          );
        })}

        {/* radius ring */}
        {originPt && (
          <g>
            <circle
              cx={originPt.x * 100}
              cy={originPt.y * 100}
              r={radiusUnits * 100}
              fill="url(#pp-radius)"
              stroke="var(--color-teal-glow)"
              strokeOpacity="0.5"
              strokeWidth="0.35"
              strokeDasharray="1.6 1.2"
            />
            <text
              x={originPt.x * 100}
              y={originPt.y * 100 - radiusUnits * 100 - 1.4}
              textAnchor="middle"
              className="fill-teal-glow"
              style={{ fontSize: 3, fontWeight: 700 }}
            >
              {radiusKm} km
            </text>
          </g>
        )}

        {/* venue markers */}
        {markers.map((m) => {
          const selected = m.court.id === selectedId;
          const isHover = m.court.id === hover;
          const r = selected ? 2.4 : isHover ? 2.1 : 1.6;
          return (
            <g
              key={m.court.id}
              transform={`translate(${m.x} ${m.y})`}
              onMouseEnter={() => setHover(m.court.id)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onSelect(m.court)}
              style={{ cursor: "pointer" }}
            >
              {(selected || isHover) && (
                <circle r={r * 2.6} fill={`hsl(${m.court.hue} 85% 60% / 0.18)`} />
              )}
              <circle
                r={r}
                fill={
                  m.dim
                    ? "var(--color-ink-600)"
                    : `hsl(${m.court.hue} 85% ${selected ? 70 : 62}%)`
                }
                stroke={selected ? "white" : "rgba(0,0,0,0.5)"}
                strokeWidth={selected ? 0.55 : 0.35}
                opacity={m.dim ? 0.35 : 1}
              />
              {/* generous invisible hit area for touch */}
              <circle r={4.2} fill="transparent" />
            </g>
          );
        })}

        {/* origin marker on top */}
        {originPt && (
          <g transform={`translate(${originPt.x * 100} ${originPt.y * 100})`}>
            <circle r="4.4" fill="var(--color-teal-glow)" opacity="0.18" className="animate-ping-slow" />
            <circle r="2.1" fill="var(--color-teal-glow)" stroke="var(--color-ink-950)" strokeWidth="0.6" />
            <circle r="0.7" fill="var(--color-ink-950)" />
          </g>
        )}
      </svg>

      {/* hover tooltip */}
      {hovered && (
        <div
          className="glass-strong pointer-events-none absolute z-10 w-48 rounded-xl px-3 py-2 text-xs shadow-xl"
          style={{
            left: `clamp(0.5rem, ${hovered.x}% - 6rem, calc(100% - 12.5rem))`,
            top: `clamp(0.5rem, ${hovered.y}% + 1.5rem, calc(100% - 5rem))`,
          }}
        >
          <p className="truncate font-semibold text-white">{hovered.court.name}</p>
          <p className="truncate text-ink-400">
            {hovered.court.area} · {rupees(hovered.court.pricePerHour)}/hr
          </p>
          {hovered.distanceKm !== null && (
            <p className="mt-0.5 font-medium text-teal-glow">
              {formatDistance(hovered.distanceKm)} away
            </p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-white/8 px-4 py-2.5 text-[11px] text-ink-400">
        <span>
          <span className="text-lime-glow">●</span> {courts.length} matching ·{" "}
          <span className="text-ink-600">●</span> {allCourts.length - courts.length} filtered out
        </span>
        <span>Schematic view · positions are approximate</span>
      </div>
    </div>
  );
}
