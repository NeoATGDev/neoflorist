import { AMENITIES, AREAS, COURTS, TAGS, type Court } from "@/data/courts";

export type Suggestion =
  | { kind: "court"; label: string; sub: string; court: Court; score: number }
  | { kind: "area"; label: string; sub: string; score: number }
  | { kind: "amenity"; label: string; sub: string; score: number }
  | { kind: "tag"; label: string; sub: string; score: number };

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").trim();

/**
 * Scores a candidate string against the query.
 *   3 = prefix of the whole string
 *   2 = prefix of any word
 *   1 = substring anywhere
 *   0 = subsequence only (typo/skip tolerance, e.g. "krmngl" -> "koramangala")
 *  -1 = no match
 */
export function scoreMatch(candidate: string, query: string): number {
  const c = norm(candidate);
  const q = norm(query);
  if (!q) return -1;
  if (c.startsWith(q)) return 3;
  if (c.split(" ").some((w) => w.startsWith(q))) return 2;
  if (c.includes(q)) return 1;

  let i = 0;
  for (const ch of c) {
    if (ch === q[i]) i++;
    if (i === q.length) return 0;
  }
  return -1;
}

/** Ranked, de-duplicated typeahead suggestions across the whole dataset. */
export function suggest(query: string, limit = 8): Suggestion[] {
  if (query.trim().length < 1) return [];
  const out: Suggestion[] = [];

  for (const court of COURTS) {
    const byName = scoreMatch(court.name, query);
    const byNameAndArea = scoreMatch(`${court.name} ${court.area}`, query);
    // Venue names win ties, but only when they actually matched.
    const s = Math.max(byName >= 0 ? byName + 1.5 : -1, byNameAndArea);
    if (s >= 0) {
      out.push({
        kind: "court",
        label: court.name,
        sub: `${court.area} · ${court.courts} courts`,
        court,
        score: s,
      });
    }
  }

  for (const area of AREAS) {
    const s = scoreMatch(area, query);
    if (s >= 0) {
      const n = COURTS.filter((c) => c.area === area).length;
      out.push({
        kind: "area",
        label: area,
        sub: `${n} ${n === 1 ? "venue" : "venues"} in this area`,
        score: s + 1,
      });
    }
  }

  for (const amenity of AMENITIES) {
    const s = scoreMatch(amenity, query);
    if (s >= 1) {
      const n = COURTS.filter((c) => c.amenities.includes(amenity)).length;
      out.push({
        kind: "amenity",
        label: amenity,
        sub: `${n} venues offer this`,
        score: s,
      });
    }
  }

  for (const tag of TAGS) {
    const s = scoreMatch(tag.replace(/-/g, " "), query);
    if (s >= 1) {
      const n = COURTS.filter((c) => c.tags.includes(tag)).length;
      out.push({
        kind: "tag",
        label: tag.replace(/-/g, " "),
        sub: `${n} venues tagged`,
        score: s,
      });
    }
  }

  return out
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label))
    .slice(0, limit);
}

/**
 * Live filter applied to the result list as the query changes.
 *
 * Deliberately stricter than `suggest`: subsequence matching is great for a
 * short suggestion list but matches almost every venue when run against a long
 * concatenated haystack, so here a field must contain the query as a substring
 * or start a word with it.
 */
export function matchesQuery(court: Court, query: string): boolean {
  const q = norm(query);
  if (!q) return true;

  const fields = [
    court.name,
    court.area,
    court.address,
    court.surface,
    ...court.amenities,
    ...court.tags.map((t) => t.replace(/-/g, " ")),
  ];

  return fields.some((f) => {
    const c = norm(f);
    return c.includes(q) || c.split(" ").some((w) => w.startsWith(q));
  });
}
