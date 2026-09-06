/* ------------------------------------------------------------------
   Multi-route static prerender.

   A stock Vite React build ships one HTML file with an empty #root —
   fine for a SPA, useless for SEO on a catalogue site where the whole
   point is 100 individually rankable product pages. This script loops
   every real route (home, 4 categories, 100 products, about), renders
   each with react-router's StaticRouter + renderToString, and writes
   a fully-formed dist/<route>/index.html with route-specific title,
   description, canonical URL and JSON-LD — so Google, Bing and any
   link-preview fetcher see real content on first request, no JS run
   required. The browser then hydrates that same markup.
   ------------------------------------------------------------------ */
import fs from 'node:fs'
import path from 'node:path'
import { render } from './dist-ssr/entry-server.js'
import { PRODUCTS, CATEGORIES, SITE_URL, site, faqs, categoryBySlug, byCategory } from './src/data/flowers.js'

const dist = path.resolve('dist')
const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function pageShell({ urlPath, title, description, robots, ld, html }) {
  const canonical = `${SITE_URL}${urlPath}`
  let out = template

  out = out.replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(title)}</title>`)
  out = out.replace(/<meta name="description"[^>]*>/i, `<meta name="description" content="${esc(description)}" />`)
  out = out.replace(/<link rel="canonical"[^>]*>/i, `<link rel="canonical" href="${canonical}" />`)
  out = out.replace(/<meta name="robots"[^>]*>/i, `<meta name="robots" content="${robots || 'index, follow, max-image-preview:large, max-snippet:-1'}" />`)
  out = out.replace(/<meta property="og:url"[^>]*>/i, `<meta property="og:url" content="${canonical}" />`)
  out = out.replace(/<meta property="og:title"[^>]*>/i, `<meta property="og:title" content="${esc(title)}" />`)
  out = out.replace(/<meta property="og:description"[^>]*>/i, `<meta property="og:description" content="${esc(description)}" />`)
  out = out.replace(/<meta name="twitter:title"[^>]*>/i, `<meta name="twitter:title" content="${esc(title)}" />`)
  out = out.replace(/<meta name="twitter:description"[^>]*>/i, `<meta name="twitter:description" content="${esc(description)}" />`)

  const ldTags = (ld || []).map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n    ')
  out = out.replace('</head>', `  ${ldTags}\n  </head>`)

  if (!out.includes('<div id="root"></div>')) throw new Error(`prerender: no empty #root found for ${urlPath}`)
  out = out.replace('<div id="root"></div>', `<div id="root">${html}</div>`)

  return out
}

function write(urlPath, contents) {
  const dir = urlPath === '/' ? dist : path.join(dist, urlPath.replace(/^\/|\/$/g, ''))
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'index.html'), contents)
}

const breadcrumb = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({
    '@type': 'ListItem', position: i + 1, name: it.name, item: it.url,
  })),
})

const sitemapUrls = []

// ---------------- home ----------------
{
  const urlPath = '/'
  const html = render(urlPath)
  const ld = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: site.name,
      url: SITE_URL,
      logo: `${SITE_URL}/favicon.svg`,
      telephone: site.phoneRaw,
      email: site.email,
      areaServed: 'IN',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: site.name,
      url: SITE_URL,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ]
  write(urlPath, pageShell({
    urlPath, html, ld,
    title: 'NeoFlorist — Fresh Flower Delivery Across India',
    description: `Hand-arranged roses, bouquets, orchids, plants and gift baskets across ${CATEGORIES.length} collections. ${site.deliveryNote}.`,
  }))
  sitemapUrls.push({ loc: `${SITE_URL}/`, priority: '1.0', changefreq: 'daily' })
}

// ---------------- about ----------------
{
  const urlPath = '/about'
  const html = render(urlPath)
  write(urlPath, pageShell({
    urlPath, html,
    title: 'About NeoFlorist — Delivery Info & Contact',
    description: 'NeoFlorist delivery policy, contact details and frequently asked questions.',
    ld: [{
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    }],
  }))
  sitemapUrls.push({ loc: `${SITE_URL}/about/`, priority: '0.5', changefreq: 'monthly' })
}

// ---------------- search shell (noindex — query-dependent content) ----------------
{
  const urlPath = '/search'
  const html = render(urlPath)
  write(urlPath, pageShell({
    urlPath, html,
    title: 'Search — NeoFlorist',
    description: 'Search NeoFlorist’s catalogue of roses, bouquets, orchids, plants and gift baskets.',
    robots: 'noindex, follow',
  }))
}

// ---------------- categories ----------------
for (const cat of CATEGORIES) {
  const urlPath = `/category/${cat.slug}`
  const html = render(urlPath)
  const products = byCategory(cat.slug)
  const ld = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: cat.name,
      url: `${SITE_URL}${urlPath}/`,
      description: cat.blurb,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: products.map((p, i) => ({
        '@type': 'ListItem', position: i + 1,
        url: `${SITE_URL}/product/${p.slug}/`, name: p.name,
      })),
    },
    breadcrumb([
      { name: 'Home', url: `${SITE_URL}/` },
      { name: cat.name, url: `${SITE_URL}${urlPath}/` },
    ]),
  ]
  write(urlPath, pageShell({
    urlPath, html, ld,
    title: `${cat.name} — Order Online | NeoFlorist`,
    description: `${cat.blurb} ${products.length} designs, delivered across India.`,
  }))
  sitemapUrls.push({ loc: `${SITE_URL}${urlPath}/`, priority: '0.8', changefreq: 'weekly' })
}

// ---------------- products ----------------
for (const p of PRODUCTS) {
  const urlPath = `/product/${p.slug}`
  const html = render(urlPath)
  const cat = categoryBySlug(p.categorySlug)
  const ld = [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: p.name,
      description: p.description,
      category: cat.name,
      url: `${SITE_URL}${urlPath}/`,
      sku: `${p.slug}-standard`,
      offers: {
        '@type': 'Offer',
        price: p.price,
        priceCurrency: 'INR',
        availability: 'https://schema.org/InStock',
        url: `${SITE_URL}${urlPath}/`,
        areaServed: 'IN',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: p.rating,
        reviewCount: p.reviewCount,
      },
    },
    breadcrumb([
      { name: 'Home', url: `${SITE_URL}/` },
      { name: cat.name, url: `${SITE_URL}/category/${cat.slug}/` },
      { name: p.name, url: `${SITE_URL}${urlPath}/` },
    ]),
  ]
  write(urlPath, pageShell({
    urlPath, html, ld,
    title: `${p.name} — ₹${p.price.toLocaleString('en-IN')} | NeoFlorist`,
    description: p.description,
  }))
  sitemapUrls.push({ loc: `${SITE_URL}${urlPath}/`, priority: '0.7', changefreq: 'weekly' })
}

// ---------------- 404 ----------------
{
  const html = render('/this-page-does-not-exist')
  fs.writeFileSync(path.join(dist, '404.html'), pageShell({
    urlPath: '/404', html,
    title: 'Page not found — NeoFlorist',
    description: 'This page could not be found.',
    robots: 'noindex, nofollow',
  }))
}

// ---------------- sitemap + robots ----------------
const today = new Date().toISOString().slice(0, 10)
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map((u) => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`).join('\n')}
</urlset>
`
fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap)
fs.writeFileSync(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`)

console.log(`prerender: wrote ${sitemapUrls.length + 2} pages (home, about, ${CATEGORIES.length} categories, ${PRODUCTS.length} products, search, 404) + sitemap + robots`)
