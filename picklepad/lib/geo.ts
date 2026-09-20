export type LatLng = { lat: number; lng: number };

const EARTH_RADIUS_KM = 6371;

const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in kilometres between two coordinates. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

/**
 * Rough drive-time estimate for Bengaluru traffic — intentionally pessimistic,
 * because it always is. Used for the "~x min away" hint on cards.
 */
export function estimateDriveMinutes(km: number): number {
  const avgSpeedKmph = km < 3 ? 14 : km < 10 ? 18 : 24;
  return Math.max(4, Math.round((km / avgSpeedKmph) * 60));
}

/**
 * Equirectangular projection of a set of points into a 0..1 unit square, with
 * latitude compressed by cos(lat) so the aspect ratio stays believable. Used by
 * the built-in map, which needs no tile server and therefore no API key.
 */
export function projectToUnitSquare(
  points: LatLng[],
  padding = 0.08,
): { project: (p: LatLng) => { x: number; y: number }; kmPerUnitX: number } {
  if (points.length === 0) {
    return {
      project: () => ({ x: 0.5, y: 0.5 }),
      kmPerUnitX: 1,
    };
  }

  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const midLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const cos = Math.cos(toRad(midLat));

  // Work in "flat" units where x is longitude scaled by cos(lat).
  const xs = lngs.map((lng) => lng * cos);
  let minX = Math.min(...xs);
  let maxX = Math.max(...xs);
  let minY = Math.min(...lats);
  let maxY = Math.max(...lats);

  // Keep the box square so circles stay circular.
  const spanX = maxX - minX;
  const spanY = maxY - minY;
  const span = Math.max(spanX, spanY, 0.01);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  minX = cx - span / 2;
  maxX = cx + span / 2;
  minY = cy - span / 2;
  maxY = cy + span / 2;

  const inner = 1 - padding * 2;

  return {
    project: (p: LatLng) => ({
      x: padding + ((p.lng * cos - minX) / span) * inner,
      // SVG y grows downward, latitude grows upward.
      y: padding + ((maxY - p.lat) / span) * inner,
    }),
    kmPerUnitX: span * 111.32 * (1 / inner),
  };
}
