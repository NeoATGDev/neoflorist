# PicklePad — find & book pickleball courts in Bengaluru

A polished court-discovery and booking demo. 46 venues across 18 Bengaluru
localities, keyword typeahead search, "near me" search with an adjustable
radius, a schematic map, and a full 1-hour slot booking flow with a dummy
payment checkout.

**Built to run on a free Vercel plan.** There is no database, no backend
service, no API key and no paid add-on anywhere in the stack.

---

## ⚠️ About the data

**Every venue name, phone number, building name and street address in this app
is fictional.** They were invented for this demo. Map coordinates are offset
from any real location and are accurate only to the neighbourhood, so the map
looks geographically sensible for Bengaluru without representing or pointing at
any real business.

The locality names (Koramangala, Whitefield, JP Nagar…) are real places —
geography, not anyone's brand.

No payment is ever taken. The checkout validates card fields for **format
only**, and nothing ever leaves your browser.

---

## Running locally

```bash
npm install
npm run dev          # http://localhost:3000
```

```bash
npm run build && npm start   # production build
```

Requires Node 18.18+ (Node 20+ recommended).

## Deploying to Vercel (free tier)

1. Push this folder to a GitHub repo.
2. In Vercel: **Add New → Project → Import** that repo.
3. Accept every default — framework preset `Next.js`, build `next build`,
   no environment variables. Click **Deploy**.

That's it. The whole app prerenders to static HTML plus a JS bundle, so it sits
comfortably inside the free plan: no serverless function invocations, no KV, no
Postgres, no Blob storage, no external requests at runtime.

> `vercel --prod` from the Vercel CLI works identically if you'd rather not use
> GitHub.

---

## Where the "database" lives

`data/courts.ts` **is** the database — a typed array of 46 court records plus
the derived lookups (`AREAS`, `AMENITIES`, `TAGS`, `PRICE_RANGE`, `LANDMARKS`).
It is imported directly, so it is baked into the build and served as static
content.

To change the data, either edit that array by hand or edit and re-run the
generator:

```bash
python3 scripts/generate-courts.py
```

Everything else is derived at runtime:

| Concern | Where it comes from |
| --- | --- |
| Court list, prices, amenities, hours | `data/courts.ts` |
| Slot grid & baseline availability | `lib/slots.ts` — a deterministic hash of `courtId + date + hour`, so availability is stable across reloads without any server |
| Distance, radius filtering, map projection | `lib/geo.ts` — haversine + an equirectangular projection |
| Search ranking & typeahead | `lib/search.ts` |
| Your bookings, wallet, saved card | `localStorage`, via `lib/store.ts` + `components/StoreProvider.tsx` |

Because bookings are per-browser, clearing site data resets them. There is a
**Reset demo data** button in *My bookings* for the same purpose.

---

## What's in the build

### Search with keyword typeahead
`lib/search.ts` scores candidates on four tiers — whole-string prefix, word
prefix, substring, then subsequence for typo tolerance (so `kormangala` still
finds Koramangala). Suggestions are grouped into venues, areas, amenities and
tags; the list is keyboard-navigable (`↑` `↓` `↵` `esc`), press `/` anywhere to
focus the box, and the result list filters live as you type.

Picking a **venue** suggestion opens its booking sheet. Picking an **area**
applies it as a filter chip.

### Location + radius
"Use my location" calls the browser Geolocation API, labels the fix with the
nearest known locality, and filters everything — the list *and* the map — to
the radius you set (1–30 km, with 2/5/10/25 km presets). Sorting flips to
nearest-first automatically.

If permission is denied or unavailable, a locality picker covering 18 Bengaluru
areas does the same job. The coordinates are never persisted or transmitted.

### The map
`components/CourtMap.tsx` projects the coordinates into an SVG over an abstract
city grid, with a correctly scaled radius ring, hover tooltips, and dimmed
markers for venues filtered out. Deliberately **not** a tile map: a tile
provider would mean an API key, a quota and a bill. It's schematic, and labelled
as such.

### Booking & dummy payment
Each venue opens a sheet with a 7-day date strip and an hour-by-hour grid
showing how many of its courts are still free. Peak blocks (6–9 AM, 6–10 PM)
run fuller and cost 25% more. The sheet opens on the first date that actually
has availability.

Checkout offers three demo methods:

- **PicklePay wallet** — starts at ₹5,000 of play money, with top-ups and a
  running ledger
- **Card** — live-formatted number, brand detection, expiry and CVV validation
  (format only, no network)
- **UPI** — VPA format check

After a simulated ~1.5 s gateway round-trip you get a booking reference
(`PP-XXXXXXX`). Bookings show under *My bookings* with upcoming/history tabs,
and cancelling refunds the full amount to the wallet.

---

## Project layout

```
app/
  layout.tsx          root layout, fonts, metadata, StoreProvider
  page.tsx            renders <Explorer />
  globals.css         Tailwind v4 theme tokens, utilities, keyframes
components/
  Explorer.tsx        page orchestration: query, filters, origin, results
  SearchTypeahead.tsx debounced typeahead combobox
  LocationBar.tsx     geolocation, locality fallback, radius slider
  Filters.tsx         sort, indoor/outdoor, price, tags, amenities
  CourtMap.tsx        SVG map + radius ring
  CourtCard.tsx       result card
  BookingFlow.tsx     slots → checkout → processing → confirmation
  BookingsDrawer.tsx  bookings + wallet
  Sheet.tsx           accessible modal/drawer shell
  StoreProvider.tsx   localStorage-backed React context
  Icons.tsx           inline SVG icons (no icon dependency)
data/
  courts.ts           THE DATABASE
lib/
  geo.ts  search.ts  slots.ts  store.ts  format.ts
scripts/
  generate-courts.py  regenerates data/courts.ts
```

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4.
No other runtime dependencies — no map library, no icon pack, no state library,
no date library.

## Accessibility & polish notes

- The typeahead is a proper `combobox`/`listbox` with `aria-activedescendant`.
- Sheets trap `Escape`, lock body scroll and move focus on open.
- Every interactive control is reachable by keyboard.
- `prefers-reduced-motion` disables all animation.
- Laid out for phone width first; no horizontal scroll at 390 px.
