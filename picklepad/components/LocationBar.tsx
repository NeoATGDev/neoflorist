"use client";

import { useEffect, useRef, useState } from "react";
import { LANDMARKS } from "@/data/courts";
import { CrosshairIcon, PinIcon, SpinnerIcon, CloseIcon } from "./Icons";
import type { LatLng } from "@/lib/geo";

export type Origin = {
  point: LatLng;
  label: string;
  source: "gps" | "manual";
  accuracyM?: number;
};

type Props = {
  origin: Origin | null;
  onOrigin: (o: Origin | null) => void;
  radiusKm: number;
  onRadius: (km: number) => void;
  /** How many venues currently fall inside the radius. */
  inRadius: number;
};

type GeoStatus = "idle" | "locating" | "ok" | "denied" | "unsupported" | "error";

const RADIUS_PRESETS = [2, 5, 10, 25];

/** Nearest known locality name, so "your location" reads like a place. */
function nearestLandmark(p: LatLng): string {
  let best = LANDMARKS[0]!;
  let bestD = Infinity;
  for (const l of LANDMARKS) {
    const d = (l.lat - p.lat) ** 2 + (l.lng - p.lng) ** 2;
    if (d < bestD) {
      bestD = d;
      best = l;
    }
  }
  return best.name;
}

export default function LocationBar({
  origin,
  onOrigin,
  radiusKm,
  onRadius,
  inRadius,
}: Props) {
  const [status, setStatus] = useState<GeoStatus>("idle");
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!pickerRef.current?.contains(e.target as Node)) setPickerOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function locate() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unsupported");
      setPickerOpen(true);
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const point = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setStatus("ok");
        onOrigin({
          point,
          label: `Near ${nearestLandmark(point)}`,
          source: "gps",
          accuracyM: Math.round(pos.coords.accuracy),
        });
      },
      (err) => {
        // 1 = PERMISSION_DENIED
        setStatus(err.code === 1 ? "denied" : "error");
        setPickerOpen(true);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  const statusLine: Record<GeoStatus, string> = {
    idle: "We never store your location — it stays in this browser tab.",
    locating: "Asking your browser for a fix…",
    ok: origin?.accuracyM
      ? `GPS fix accurate to about ${origin.accuracyM} m.`
      : "Located.",
    denied: "Location permission was denied. Pick a locality instead.",
    unsupported: "This browser has no location API. Pick a locality instead.",
    error: "Couldn't get a fix. Pick a locality instead.",
  };

  return (
    <div className="glass rounded-3xl p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* ---- origin ---- */}
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={locate}
            disabled={status === "locating"}
            className="group inline-flex items-center gap-2 rounded-xl bg-teal-glow/12 px-3.5 py-2.5 text-sm font-semibold text-teal-glow ring-1 ring-teal-glow/25 transition hover:bg-teal-glow/20 disabled:opacity-60"
          >
            {status === "locating" ? (
              <SpinnerIcon className="h-4 w-4" />
            ) : (
              <CrosshairIcon className="h-4 w-4 transition group-hover:rotate-90" />
            )}
            {status === "locating" ? "Locating…" : "Use my location"}
          </button>

          <div ref={pickerRef} className="relative">
            <button
              type="button"
              onClick={() => setPickerOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/4 px-3.5 py-2.5 text-sm font-medium text-ink-200 transition hover:border-white/25 hover:text-white"
            >
              <PinIcon className="h-4 w-4 text-ink-400" />
              Pick a locality
            </button>

            {pickerOpen && (
              <div className="glass-strong animate-pop absolute z-30 mt-2 w-64 rounded-2xl p-2 shadow-2xl shadow-black/60">
                <p className="px-2 py-1.5 text-[11px] font-semibold tracking-wider text-ink-400 uppercase">
                  Bengaluru localities
                </p>
                <ul className="max-h-64 overflow-y-auto">
                  {LANDMARKS.map((l) => (
                    <li key={l.name}>
                      <button
                        type="button"
                        onClick={() => {
                          onOrigin({
                            point: { lat: l.lat, lng: l.lng },
                            label: l.name,
                            source: "manual",
                          });
                          setStatus("ok");
                          setPickerOpen(false);
                        }}
                        className="w-full rounded-lg px-2.5 py-2 text-left text-sm text-ink-200 transition hover:bg-white/8 hover:text-white"
                      >
                        {l.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {origin && (
            <span className="animate-in-fade inline-flex items-center gap-2 rounded-xl border border-lime-glow/25 bg-lime-glow/10 px-3 py-2 text-sm font-semibold text-lime-glow">
              <PinIcon className="h-3.5 w-3.5" />
              {origin.label}
              <button
                type="button"
                onClick={() => {
                  onOrigin(null);
                  setStatus("idle");
                }}
                aria-label="Clear location"
                className="rounded-full p-0.5 transition hover:bg-black/25"
              >
                <CloseIcon className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>

        {/* ---- radius ---- */}
        <div
          className={`flex flex-col gap-2 transition-opacity lg:w-[22rem] ${
            origin ? "opacity-100" : "pointer-events-none opacity-40"
          }`}
        >
          <div className="flex items-baseline justify-between text-xs">
            <label htmlFor="radius" className="font-semibold text-ink-300">
              Search radius
            </label>
            <span className="font-mono text-sm text-white">
              {radiusKm} km
              <span className="ml-2 text-ink-400">
                · {inRadius} {inRadius === 1 ? "venue" : "venues"}
              </span>
            </span>
          </div>
          <input
            id="radius"
            type="range"
            min={1}
            max={30}
            step={1}
            value={radiusKm}
            disabled={!origin}
            onChange={(e) => onRadius(Number(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-ink-700 accent-lime-glow"
            style={{
              background: `linear-gradient(to right, var(--color-lime-glow) ${
                ((radiusKm - 1) / 29) * 100
              }%, var(--color-ink-700) ${((radiusKm - 1) / 29) * 100}%)`,
            }}
          />
          <div className="flex gap-1.5">
            {RADIUS_PRESETS.map((r) => (
              <button
                key={r}
                type="button"
                disabled={!origin}
                onClick={() => onRadius(r)}
                className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition ${
                  radiusKm === r
                    ? "bg-lime-glow text-ink-950"
                    : "border border-white/10 text-ink-300 hover:border-white/25 hover:text-white"
                }`}
              >
                {r} km
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-3 border-t border-white/6 pt-3 text-xs text-ink-400">
        {statusLine[status]}
      </p>
    </div>
  );
}
