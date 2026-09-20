# NeoFlorist — flower delivery demo / POC

React + Vite storefront: 100 products across 4 collections (Roses & Bouquets,
Occasions, Orchids & Plants, Gift Baskets), a home page, category pages, a
product page with size/quantity/pin-code and an Add to Cart flow, a basic
search, and an About/Contact page. No product photography — every flower,
plant and basket picture is an original SVG illustration generated from data
(see "About the pictures" below).

It also has the full customer side: accounts, checkout with a billing address,
two payment paths (a House Account and a **simulated** card/UPI gateway), an
order confirmation page, an address book, saved payment methods, reminders and
order history. See "The account & checkout flow" below.

This is **Phase 1**: the frontend only. Add to Cart logs the exact request a
real backend would receive, accounts and orders live in `localStorage`, and no
payment provider is ever contacted. Phase 2 (not in this repo) is a Spring Boot
API on an Oracle Cloud VM that Phase 1's contexts are already shaped to call.

```
src/
  data/flowers.js        ← the whole catalogue: 100 products, 4 categories,
                            site info, FAQs. Deterministic generator — edit
                            the word lists here, not individual products.
  lib/
    storage.js            ← SSR-safe localStorage helpers + demo password digest
    pricing.js            ← the single source of truth for order totals
    india.js              ← pin code / mobile validation, state list
    payments.js           ← house-account rule (210188), test cards, masking
    reminders.js          ← next-occurrence / countdown date maths
  components/
    FlowerArt.jsx         ← generates every product image from its art spec
    AddressFields.jsx  OrderSummary.jsx  AccountLayout.jsx
    Nav.jsx  Footer.jsx  ProductCard.jsx  PincodeCheck.jsx  CartDrawer.jsx  Toast.jsx
  context/
    CartContext.jsx       ← cart state (persisted) + the simulated backend call
    AuthContext.jsx       ← accounts, session, addresses, payments, reminders, orders
  pages/
    Home.jsx  Category.jsx  Product.jsx  Search.jsx  About.jsx  NotFound.jsx
    Login.jsx  Checkout.jsx  PaymentSimulator.jsx  OrderConfirmation.jsx
    Account.jsx  AccountAddresses.jsx  AccountPayments.jsx
    AccountReminders.jsx  AccountOrders.jsx
  entry-server.jsx        ← build-time only, feeds the prerender
  App.jsx  main.jsx        ← routes, hydration
  styles.css
prerender.mjs             ← renders all 117 routes to static HTML + JSON-LD
scripts/serve-dist.mjs    ← local server that mirrors vercel.json (dev only)
vercel.json
```

## Run it

```bash
npm install
npm run dev            # http://localhost:5173
npm run build           # client build → SSR build → prerender (→ dist/)
npm run preview         # serve dist/ locally (see note below on trailing slashes)

# closer to production — honours trailingSlash and the /order/:id rewrite:
npm run serve:dist      # http://localhost:4178
```

---

# The account & checkout flow

## Routes

| Route | What it is |
|---|---|
| `/login` | Log in / create account (tabbed on one page) |
| `/checkout` | Step 1 delivery + billing address, step 2 payment |
| `/checkout/payment` | Simulated payment screen (card / UPI / netbanking) |
| `/order/<id>` | Order confirmation |
| `/account` | Overview — counts, next reminder, latest order |
| `/account/addresses` | Address book: add, edit, remove, set default |
| `/account/payments` | House accounts and saved cards (last 4 only) |
| `/account/reminders` | Birthdays / anniversaries with a lead time |
| `/account/orders` | Order history |

Every one of these is prerendered as a **noindex** shell, because Vercel serves
files rather than routes — without them a direct hit on `/checkout`, or a
refresh mid-flow, would 404. `/order/<id>` has no file per order, so
`vercel.json` rewrites it to the `/order` shell and React Router reads the id
back off the live URL.

## Payment paths

**House Account** — the trade-account path. Exactly one account number is
provisioned in this build: **`210188`**. Anything else is refused with
"Account not found or not authorised for online ordering." The number lives in
`src/lib/payments.js` (`HOUSE_ACCOUNT_NUMBER`); Phase 2 checks it against the
accounts table instead. Placing the order skips the gateway entirely.

**Card / UPI / Netbanking** — `/checkout/payment` is a **local simulation** of a
redirect-style gateway. It is deliberately *not* a copy of any provider's page:
no provider logo or wordmark is used, the word "simulated" is on screen
throughout, the Razorpay SDK is never loaded and their API is never called.
Nothing typed there is transmitted anywhere, the staged "Contacting issuing
bank" delay is a `setTimeout`, and the card number is discarded the moment the
fake authorisation completes — only brand + last four digits reach the order
record. Test numbers (4111…, 5267…, 6521…) are offered as one-tap buttons; any
future expiry and any 3-digit CVV pass.

The order isn't created until the gateway screen reports success. Until then it
sits in `nf.pendingOrder`, which is how a real redirect gateway behaves — and
means cancelling leaves no phantom order.

## What's stored, and where

All under the `nf.` prefix in `localStorage`, so it survives a refresh and a
browser restart and is lost only when site data is cleared:

| Key | Contents |
|---|---|
| `nf.users` | `{ id, name, email, salt, digest }` — **never** a plaintext password |
| `nf.session` | the signed-in user id |
| `nf.data.<userId>` | that user's addresses, payment methods, reminders |
| `nf.data.guest` | the same, for anonymous checkout |
| `nf.orders` | all orders, each tagged with `userId` (or `null` for guests) |
| `nf.cart` | the cart |
| `nf.pendingOrder` | an order mid-payment |

Two things worth knowing before extending this:

1. **Passwords.** `digest()` in `src/lib/storage.js` is a salted FNV-1a
   checksum. It keeps plaintext out of devtools on a shared laptop; it is not
   secure and is not a substitute for real hashing. It exists only because
   there is no server yet, and it disappears in Phase 2.
2. **Hydration.** The site is prerendered at build time, where `window` doesn't
   exist. So no React state is ever seeded from `localStorage` directly —
   both contexts start empty and load in a `useEffect` after mount, flipping a
   `hydrated` flag. Screens render a skeleton until then. Seed state from
   storage directly and you'll get a hydration mismatch on every account page.

## Try it

1. `/login` → Create account.
2. Add a couple of bouquets, open the cart, Checkout.
3. Fill the delivery address; leave "Billing address is the same" ticked (or
   untick it for a separate billing address).
4. Payment → **House Account** → type `999999` (refused) then `210188` →
   Place order.
5. Order again, choose **Card / UPI / Netbanking**, tap a test card, Pay.
6. `/account/reminders` → add a birthday. `/account/orders` → both orders.
7. Hard-refresh anywhere: still signed in, cart and data intact.

---

# Deploying to Vercel (free tier)

## 1. Push to GitHub

```bash
cd neoflorist
git init && git add -A
git commit -m "NeoFlorist storefront"
git branch -M main
gh repo create neoflorist --public --source=. --push
```

(No `gh`? Create an empty repo at github.com/new, then
`git remote add origin https://github.com/<you>/neoflorist.git && git push -u origin main`.)

## 2. Import into Vercel

1. <https://vercel.com/signup> → sign in **with GitHub**. Hobby plan, free, no card.
2. <https://vercel.com/new> → select `neoflorist` → **Import**.
3. Vercel reads `vercel.json` and detects Vite. Leave the defaults (build
   command `npm run build`, output directory `dist`) → **Deploy**. ~45 seconds.

You'll land on `neoflorist-xyz123.vercel.app`.

## 3. Claim the clean name

Project → **Settings → Domains** → **Add** → `neoflorist.vercel.app` → **Add**.
Vercel subdomains are first-come-first-served account-wide; if it's taken,
`neoflorist-in.vercel.app` or `neoflorist-flowers.vercel.app` work just as well.

## 4. Point the code at the domain you actually got

This matters for SEO — canonical URLs, the sitemap, and the OG image all read
from one constant. Edit `SITE_URL` in `src/data/flowers.js`, plus the
canonical/OG/Twitter URLs in `index.html`, to match your real domain. Commit
and push; Vercel redeploys automatically.

## 5. Tell Google (and Bing) it exists

1. <https://search.google.com/search-console> → Add property → your domain →
   verify via the HTML meta tag (paste it into `index.html`'s `<head>`, push,
   then click Verify).
2. Search Console → **Sitemaps** → submit `sitemap.xml`.
3. **URL Inspection** → your homepage → **Request indexing**.
4. Repeat at <https://www.bing.com/webmasters> (it can import straight from
   Search Console).

New domains typically take days to a couple of weeks to be crawled — nothing
speeds that up except real links pointing at the site.

## 6. Sanity checks

- <https://search.google.com/test/rich-results> — paste a product URL, you
  should see **Product** and **BreadcrumbList** detected; the homepage should
  show **FAQPage** and **WebSite**.
- Share the homepage link on WhatsApp to yourself — the card should show the
  illustrated bouquet, not a bare link.
- <https://pagespeed.web.dev> — this build should score in the high 90s; it's
  one CSS file, one JS file, no photography, and the HTML is pre-rendered.

---

# What makes this SEO-friendly

**106 real static pages, not one SPA shell.** `npm run build` runs three
stages: a client build, an SSR build of the same app, then `prerender.mjs`
loops every route — home, 4 categories, all 100 products, About, plus a
`noindex`'d Search shell and a 404 — and writes each one a fully-formed
`dist/<route>/index.html` with route-specific title, description, canonical
URL and JSON-LD already in the source. Google's JS-rendering pass, and every
crawler that doesn't run JS at all (Bing, link-preview bots), see complete
content on the first request. The browser then hydrates that same markup, so
nothing about interactivity changes.

**Structured data per page type**, generated from `flowers.js` so it can't
drift from what's on screen:

- Home — `Organization`, `WebSite` (with a `SearchAction` pointed at `/search`),
  `FAQPage`
- Category — `CollectionPage`, `ItemList` of its 25 products, `BreadcrumbList`
- Product — `Product` with `Offer` (INR price, availability) and
  `AggregateRating`, `BreadcrumbList`

**100 individually rankable product pages.** Someone searching "orchid
delivery Bangalore" or "anniversary flowers same day" lands on the one page
that answers that query, not a generic homepage.

**A note on `npm run preview` and trailing slashes**: every category/product
page is written to `dist/<route>/index.html`, so it's only served correctly
at the URL ending in `/`. `vercel.json` sets `"trailingSlash": true`, so real
Vercel hosting 308-redirects a no-slash request (`/category/roses-bouquets`)
to the slash version before serving anything — visitors always land on the
right page. Vite's own local `preview` server doesn't know about that Vercel
setting, though: hit a category/product URL there *without* the trailing
slash and it silently falls back to serving the home page's HTML under a
mismatched URL, which the browser then hydrates into the wrong page (visible
as a console hydration warning). That's a local-preview-only quirk — always
test with the trailing slash locally (`/category/roses-bouquets/`), or just
click through the site's own links rather than typing bare paths.

**The `/search` page is deliberately `noindex`**: its content is just whatever
the last query was, which is exactly the kind of thin/duplicate content Google
recommends keeping out of the index. `robots.txt` still allows crawling it
(so the `noindex` meta tag itself can be seen) — it's just excluded from
`sitemap.xml`.

**Fast by construction**: no product photography (SVG illustrations inline in
the HTML, no image requests at all), one font family pair, one CSS file, one
JS bundle.

## Still worth doing

- Get listed on local directories/aggregators with a link back — for a brand
  new domain, external links move rankings far more than on-page markup does.
- A Google Business Profile once there's a real fulfillment address — "flower
  delivery near me" is dominated by the local pack, not organic results.
- A blog or city-landing pages ("Same-Day Flower Delivery in Bengaluru") if
  you want to rank for anything beyond the brand name — the catalogue pages
  alone can only carry so much.
- Real product photography eventually. The illustrations are original and
  fine for a POC/demo, but a live commercial florist will want to show what
  actually arrives.

---

# Phase 2: wiring this to a real backend

Everything the frontend needs to talk to a backend already funnels through
one function: `addItem` in `src/context/CartContext.jsx`. Right now it does
this:

```js
console.groupCollapsed('[NeoFlorist] POST /api/v1/cart/items (simulated)', ...)
console.log('Request payload:', payload)
console.groupEnd()
```

`payload` is exactly the JSON body a real request would send — SKU, product
id, size, quantity, unit price, line total, delivery pin code, timestamp. Open
your browser console and click Add to Cart on any product to see it.

For Phase 2, replace that block with:

```js
const res = await fetch('/api/v1/cart/items', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
})
const { cartItemId } = await res.json()
```

pointed at your Spring Boot API on the Oracle Cloud VM (proxy it through
Vercel's `rewrites` in `vercel.json`, or call the VM's public URL directly
with CORS enabled — either works). Nothing else in the app needs to change:
every screen calls `addItem()` from the same context, never `fetch` directly.

The checkout button in the cart drawer (`CartDrawer.jsx`) currently just logs
and closes — that's the next thing to wire once the cart endpoint exists.

---

# About the pictures

Every product image is an SVG generated at render time from its `art` spec in
`flowers.js` (flower type, colour palette, stem count, seed) — see
`FlowerArt.jsx`. None are traced or adapted from a real photo: Teleflora's
product photography is copyrighted, and recolouring or restyling a real photo
doesn't change that, so the approach here was to draw original geometry
instead — a bloom is a ring of petal shapes around a centre disc, a basket is
a woven trough with handles, an orchid is blooms along an arching stem. It's
also why the catalogue can have 100 distinct-looking products without 100
photographs: change `stemCount`, `palette` or `seed` for any product and its
picture regenerates.

## Editing the catalogue

Everything is in `src/data/flowers.js`:

- **Categories** — the `CATEGORIES` array. Add a fifth and the generator will
  need a matching entry in `CATEGORY_WORDS` and `PALETTES`.
- **Names** — built from `ADJ` + a category's `*_CORE` list + `*_SUFFIX` list.
  The generator rejects any combination that repeats a word (caught two of
  these — "Cake & Flower Combo Combo" — during testing) and any exact
  duplicate name.
- **Prices, ratings, tags** — generated with a seeded random number generator
  (`mulberry32`), so the catalogue is identical on every build; change the
  seed (`buildProducts`'s call to `mulberry32(20260906)`) to reshuffle it.
- **Contact details / site copy** — the `site` export.
- **FAQs** — the `faqs` export; also emitted as `FAQPage` schema automatically.

## Before this becomes a real store

- [ ] Wire `CartContext.addItem` to the Phase 2 API (see above)
- [ ] Replace illustrations with real product photography once you have it
- [ ] Confirm the serviceable-pincode list with real logistics data — the pin
      code check here is a format check only (`[1-9][0-9]{5}`), not a real
      lookup
- [ ] Set `SITE_URL` and `index.html`'s URLs to the live domain
- [ ] Submit the sitemap in Search Console
- [ ] Add payment + order confirmation once Phase 2 exists
