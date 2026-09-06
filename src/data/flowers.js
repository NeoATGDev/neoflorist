// ------------------------------------------------------------------
// NeoFlorist product catalogue — 100 items, 4 categories.
// Generated deterministically (seeded PRNG, no Date.now/Math.random)
// so server-prerendered HTML and client hydration always agree.
// Edit CATEGORIES / NAME PARTS below to reshape the catalogue; the
// generator keeps ids, slugs and art specs stable across edits as
// long as the category order doesn't change.
// ------------------------------------------------------------------

export const SITE_URL = 'https://neoflorist.vercel.app'

export const site = {
  name: 'NeoFlorist',
  tagline: 'Fresh flowers, delivered across India',
  phone: '+91 99862 62166',
  phoneRaw: '+919986262166',
  email: 'nitish211289@gmail.com',
  whatsapp: 'https://wa.me/919986262166',
  hours: 'Orders taken 7am – 10pm IST, every day',
  deliveryNote: 'Delivering across India · same-day in select metros',
}

// Simple, dependency-free seeded PRNG (mulberry32) — deterministic
// across server and client for a given numeric seed.
function mulberry32(seed) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashSeed(str) {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return (h ^ (h >>> 16)) >>> 0
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)]
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

const money = (n) => Math.round(n / 10) * 10 // clean price endings

// ---------------- categories ----------------
export const CATEGORIES = [
  {
    slug: 'roses-bouquets',
    name: 'Roses & Bouquets',
    short: 'Roses & Bouquets',
    blurb: 'Classic hand-tied roses and mixed bouquets, wrapped fresh to order.',
    art: 'rose',
    accent: '#C6415B',
  },
  {
    slug: 'occasions',
    name: 'Occasions',
    short: 'Occasions',
    blurb: 'Birthday, anniversary, get-well and sympathy arrangements for every moment.',
    art: 'mixed',
    accent: '#B8894F',
  },
  {
    slug: 'orchids-plants',
    name: 'Orchids & Plants',
    short: 'Orchids & Plants',
    blurb: 'Long-lasting orchids and potted greens for home or office.',
    art: 'plant',
    accent: '#4C7A5E',
  },
  {
    slug: 'gift-baskets',
    name: 'Gift Baskets',
    short: 'Gift Baskets',
    blurb: 'Flowers paired with chocolates, cakes and keepsakes in one basket.',
    art: 'basket',
    accent: '#8A5A9E',
  },
]

// ---------------- name components, per category ----------------
const ADJ = [
  'Radiant', 'Blissful', 'Golden Hour', 'Serene', 'Graceful', 'Vibrant', 'Gentle',
  'Elegant', 'Whispering', 'Charming', 'Blooming', 'Tranquil', 'Joyful', 'Dazzling',
  'Sweet', 'Regal', 'Delicate', 'Cheerful', 'Warm', 'Pure', 'Velvet', 'Sunlit',
  'Everyday', 'First Light', 'Quiet', 'Bright',
]

const ROSE_CORE = [
  'Red Rose', 'Pink Rose', 'White Rose', 'Peach Rose', 'Yellow Rose', 'Blush Rose',
  'Garden Rose', 'Rose & Lily', 'Rose & Eucalyptus', 'Two-Tone Rose', 'Rose Duet',
  'Crimson Rose', 'Ivory Rose', 'Coral Rose', 'Rose & Baby\'s Breath', 'Wine Rose',
  'Rose Trio', 'Antique Rose', 'Rose & Carnation', 'Long-Stem Rose', 'Rose Cascade',
  'Rose & Gerbera', 'Rose Posy', 'Champagne Rose', 'Rose & Freesia',
]
const ROSE_SUFFIX = ['Bouquet', 'Bunch', 'Arrangement', 'Vase', 'Bundle']

const OCC_CORE = [
  'Birthday Blooms', 'Anniversary Embrace', 'Sympathy White', 'Get Well Garden',
  'New Baby Pastels', 'Congratulations Bright', 'Thank You Meadow', 'Happy Diwali',
  'Wedding Wishes', 'Housewarming Greens', 'Just Because', 'Miss You Blooms',
  'Farewell Bouquet', 'Promotion Cheers', 'Retirement Garden', 'Friendship Mix',
  'Mother\'s Day Special', 'Rakhi Blooms', 'Graduation Bunch', 'Baby Shower Pastels',
  'Condolence White Lily', 'Welcome Home', 'Good Luck Sunflowers', 'Festive Marigold',
  'Monsoon Cheer',
]
const OCC_SUFFIX = ['Arrangement', 'Bouquet', 'Basket', 'Box', 'Bunch']

const PLANT_CORE = [
  'Phalaenopsis Orchid', 'Purple Orchid', 'Peace Lily', 'Money Plant', 'Bonsai',
  'Succulent Trio', 'Anthurium', 'Areca Palm', 'Snake Plant', 'ZZ Plant',
  'Jade Plant', 'Lucky Bamboo', 'Dendrobium Orchid', 'Aloe Vera', 'Bird of Paradise',
  'Ficus Bonsai', 'Calathea', 'Orchid Duo', 'Fern Basket', 'Rubber Plant',
  'Croton', 'Spider Plant', 'White Orchid', 'Cactus Trio', 'Terrarium Garden',
]
// no bare "Plant" here — several PLANT_CORE names already end in "Plant"
// (Money Plant, Jade Plant, Snake Plant…) and doubling it reads as a bug
const PLANT_SUFFIX = ['in Ceramic Pot', 'Planter', 'Gift Set', 'for the Home']

const BASKET_CORE = [
  'Chocolate & Blooms', 'Fruit & Flower', 'Cake & Flower Combo', 'Spa & Roses',
  'Sweets & Blossoms', 'Plush Bear & Petals', 'Dry Fruits & Blooms', 'Cookie & Bouquet',
  'Tea & Flower', 'Candle & Rose', 'Chocolate Cake Duo', 'Nuts & Blooms',
  'Ferrero & Rose Box', 'Muffin & Petals', 'Gourmet Hamper', 'Pastry & Posy',
  'Berry & Bloom Basket', 'Wine-Free Celebration', 'Kids Balloon & Bloom',
  'Premium Fruit Basket', 'Choco Truffle Box', 'Bakery & Blossom', 'Snack & Flower',
  'Festive Hamper', 'Deluxe Celebration',
]
const BASKET_SUFFIX = ['Basket', 'Hamper', 'Gift Box', 'Combo', 'Set']

const CATEGORY_WORDS = {
  'roses-bouquets': { core: ROSE_CORE, suffix: ROSE_SUFFIX },
  occasions: { core: OCC_CORE, suffix: OCC_SUFFIX },
  'orchids-plants': { core: PLANT_CORE, suffix: PLANT_SUFFIX },
  'gift-baskets': { core: BASKET_CORE, suffix: BASKET_SUFFIX },
}

// palettes feed the SVG art generator (see components/FlowerArt.jsx)
const PALETTES = {
  rose: [
    ['#C6415B', '#E48098', '#7B9B6E'], ['#F3D3D9', '#E9A8B4', '#6E8F63'],
    ['#7B2D42', '#C6415B', '#5C7A52'], ['#F6C453', '#E8935B', '#6E8F63'],
    ['#FBEFE3', '#E9C7A1', '#8FA37A'],
  ],
  mixed: [
    ['#E8935B', '#F6C453', '#C6415B', '#8FA37A'], ['#B24C6B', '#F3D3D9', '#F6C453', '#6E8F63'],
    ['#7B9B6E', '#F6C453', '#E48098', '#F3D3D9'], ['#D97A3F', '#C6415B', '#FBEFE3', '#6E8F63'],
  ],
  plant: [
    ['#4C7A5E', '#7BA083', '#B9D4A8'], ['#5C6B47', '#8FA37A', '#D8E2C4'],
    ['#3E6B52', '#6E8F63', '#A8C79A'], ['#B48CC9', '#E9C9F0', '#6E8F63'],
  ],
  basket: [
    ['#8A5A9E', '#C6415B', '#F6C453', '#7B9B6E'], ['#B8894F', '#E8935B', '#C6415B', '#6E8F63'],
    ['#7B2D42', '#F3D3D9', '#F6C453', '#8FA37A'],
  ],
}

const OCCASION_TAGS = ['birthday', 'anniversary', 'sympathy', 'get-well', 'congratulations', 'new-baby', 'wedding', 'everyday']
const SIZES = [
  { key: 'standard', label: 'Standard', mult: 1 },
  { key: 'deluxe', label: 'Deluxe', mult: 1.35 },
  { key: 'premium', label: 'Premium', mult: 1.75 },
]

function buildProducts() {
  const rng = mulberry32(20260906)
  const products = []
  const perCat = 25

  CATEGORIES.forEach((cat, ci) => {
    const words = CATEGORY_WORDS[cat.slug]
    const usedNames = new Set()

    for (let i = 0; i < perCat; i++) {
      let name
      let attempt = 0
      const hasRepeatWord = (s) => {
        const w = s.toLowerCase().split(/\s+/)
        return new Set(w).size !== w.length
      }
      do {
        const adj = pick(rng, ADJ)
        const core = words.core[(i + attempt) % words.core.length]
        const suffix = pick(rng, words.suffix)
        name = `${adj} ${core} ${suffix}`
        attempt++
      } while ((usedNames.has(name) || hasRepeatWord(name)) && attempt < 20)
      usedNames.add(name)

      const slug = slugify(name) + '-' + (ci * perCat + i + 1)
      const basePrice = money(499 + rng() * 3800)
      const rating = Math.round((4.1 + rng() * 0.8) * 10) / 10
      const reviewCount = Math.round(18 + rng() * 760)
      const bestSeller = rng() > 0.78
      const sameDay = rng() > 0.35
      const discount = rng() > 0.6 ? Math.round((10 + rng() * 20)) : 0
      const compareAt = discount ? money(basePrice / (1 - discount / 100)) : null

      const palette = pick(rng, PALETTES[cat.art])
      const stemCount = cat.art === 'plant' ? Math.round(1 + rng() * 2) : Math.round(3 + rng() * 6)
      const wrapPalette = ['#F6EEE0', '#EBD9C3', '#F3D3D9', '#E4E9DC', '#FFFFFF']
      const wrap = pick(rng, wrapPalette)
      const seedTag = hashSeed(slug)
      // which plant illustration to draw — decided from the actual name,
      // never inferred from palette colour (that was a real bug: green
      // orchid palettes were being drawn as leafy plants and vice versa).
      const sub = cat.art === 'plant' ? (/orchid/i.test(name) ? 'orchid' : 'leafy') : undefined

      const tags = []
      if (cat.slug === 'occasions') tags.push(pick(rng, OCCASION_TAGS))
      tags.push(cat.slug)
      if (bestSeller) tags.push('bestseller')
      if (sameDay) tags.push('same-day')

      products.push({
        id: ci * perCat + i + 1,
        slug,
        name,
        categorySlug: cat.slug,
        categoryName: cat.name,
        price: basePrice,
        compareAtPrice: compareAt,
        rating,
        reviewCount,
        bestSeller,
        sameDay,
        tags,
        sizes: SIZES,
        description: descriptionFor(cat.slug, name),
        care: careFor(cat.slug),
        art: { type: cat.art, palette, stemCount, wrap, seed: seedTag, sub },
      })
    }
  })

  return products
}

function descriptionFor(catSlug, name) {
  const bits = {
    'roses-bouquets': `${name} is hand-tied by our partner florists using farm-fresh stems, wrapped in kraft paper and finished with a satin ribbon. Delivered with a complimentary greeting card.`,
    occasions: `${name} is put together to mark the moment — a mixed arrangement of seasonal blooms chosen for the occasion, delivered in water-fed packaging to stay fresh on arrival.`,
    'orchids-plants': `${name} arrives potted and ready to display — low maintenance, long-lasting, and a lasting alternative to cut flowers for home or office.`,
    'gift-baskets': `${name} pairs fresh blooms with a curated add-on in one hamper, packed to travel well and arrive ready to gift.`,
  }
  return bits[catSlug]
}

function careFor(catSlug) {
  const bits = {
    'roses-bouquets': 'Trim stems at an angle, change water every 2 days, keep away from direct heat. Lasts 5–7 days.',
    occasions: 'Keep in a cool spot away from direct sun. Change water every 2 days for the freshest look.',
    'orchids-plants': 'Water once a week, bright indirect light, avoid direct sun. Repot after 12 months.',
    'gift-baskets': 'Refrigerate any perishable items on arrival. Treat the flower portion as a fresh bouquet.',
  }
  return bits[catSlug]
}

export const PRODUCTS = buildProducts()

export const bySlug = (slug) => PRODUCTS.find((p) => p.slug === slug)
export const byCategory = (catSlug) => PRODUCTS.filter((p) => p.categorySlug === catSlug)
export const categoryBySlug = (slug) => CATEGORIES.find((c) => c.slug === slug)

export const bestSellers = PRODUCTS.filter((p) => p.bestSeller).slice(0, 12)
export const sameDayPicks = PRODUCTS.filter((p) => p.sameDay).slice(0, 8)

export function searchProducts(query) {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.categoryName.toLowerCase().includes(q) ||
      p.tags.some((t) => t.includes(q))
  )
}

export const faqs = [
  {
    q: 'Which cities does NeoFlorist deliver to?',
    a: 'We deliver across India. Same-day delivery is available in select metros when the order is placed before 4pm local time; other pin codes are typically delivered next day.',
  },
  {
    q: 'How do I check if same-day delivery is available at my pin code?',
    a: 'Enter your 6-digit Indian pin code on any product page — it checks the format instantly. In this demo the check is simulated; the live version will confirm against our real serviceable-pincode list.',
  },
  {
    q: 'What happens when I click Add to Cart?',
    a: 'This is a proof-of-concept build. Add to Cart logs the full order payload to your browser console exactly as it will be sent to the Spring Boot backend in Phase 2 — no order is actually placed yet.',
  },
  {
    q: 'Do the flowers in the photos look exactly like what I receive?',
    a: 'Arrangements are hand-made by local florist partners, so stem count, colour and vase may vary slightly from the picture shown, especially for seasonal blooms.',
  },
  {
    q: 'Can I schedule a delivery for a specific date?',
    a: 'Yes — every product supports choosing a delivery date at checkout, including same-day where available.',
  },
]
