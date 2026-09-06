import React from 'react'
import { Link } from 'react-router-dom'
import { CATEGORIES, PRODUCTS, bestSellers, sameDayPicks, faqs, site } from '../data/flowers.js'
import FlowerArt from '../components/FlowerArt.jsx'
import ProductCard from '../components/ProductCard.jsx'
import { TruckIcon, ShieldIcon, LeafIcon, ClockIcon } from '../components/Icons.jsx'
import { useSeo } from '../hooks/useSeo.js'

const heroArt = { type: 'rose', palette: ['#C6415B', '#E48098', '#7B2D42'], stemCount: 7, wrap: '#F6EEE0', seed: 42 }

export default function Home() {
  useSeo({
    title: 'NeoFlorist — Fresh Flower Delivery Across India',
    description: 'Hand-arranged roses, bouquets, orchids, plants and gift baskets, delivered across India with same-day options in select metros.',
  })

  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <p className="eyebrow rise">100% Freshness Guarantee · India-wide</p>
            <h1 className="rise d1">
              Flowers that say it <em>before you do.</em>
            </h1>
            <p className="hero-sub rise d2">
              {PRODUCTS.length} hand-arranged bouquets, plants and gift baskets across
              {' '}{CATEGORIES.length} collections — picked fresh, wrapped with care, and on
              the doorstep the same day in select Indian cities.
            </p>
            <div className="hero-cta rise d3">
              <Link className="btn btn--primary" to="/category/roses-bouquets">Shop bestsellers</Link>
              <Link className="btn btn--ghost" to="/category/occasions">Shop by occasion</Link>
            </div>
            <div className="hero-trust rise d3">
              <div><TruckIcon /> Same-day in select metros</div>
              <div><ShieldIcon /> Freshness guaranteed</div>
              <div><LeafIcon /> Hand-arranged by local florists</div>
            </div>
          </div>
          <div className="hero-art rise d2">
            <FlowerArt art={heroArt} label="A radiant hand-tied rose bouquet" style={{ width: '78%' }} />
          </div>
        </div>
      </section>

      <div className="wrap">
        <div className="trust-strip">
          <div className="trust-item"><TruckIcon /><div><h5>Same-day delivery</h5><p>In select metro pin codes when ordered before 4pm.</p></div></div>
          <div className="trust-item"><ShieldIcon /><div><h5>Freshness guarantee</h5><p>Not happy on arrival? We'll make it right.</p></div></div>
          <div className="trust-item"><LeafIcon /><div><h5>Hand-arranged</h5><p>Made to order by local florist partners, not a warehouse.</p></div></div>
          <div className="trust-item"><ClockIcon /><div><h5>Scheduled delivery</h5><p>Pick the exact date — birthdays wait for no one.</p></div></div>
        </div>
      </div>

      <section className="band" id="categories">
        <div className="wrap">
          <div className="sec-head">
            <div className="copy">
              <p className="eyebrow">Collections</p>
              <h2 className="display">Shop by what the moment calls for.</h2>
            </div>
          </div>
          <div className="cat-grid">
            {CATEGORIES.map((c) => {
              const sample = PRODUCTS.find((p) => p.categorySlug === c.slug)
              return (
                <Link className="cat-tile" to={`/category/${c.slug}`} key={c.slug}>
                  <div className="stage"><FlowerArt art={sample.art} label={c.name} /></div>
                  <h4>{c.name}</h4>
                  <p>{c.blurb}</p>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section className="band band--tint">
        <div className="wrap">
          <div className="sec-head">
            <div className="copy">
              <p className="eyebrow">Loved most</p>
              <h2 className="display">This week's bestsellers.</h2>
            </div>
            <Link className="btn btn--ghost btn--sm" to="/category/roses-bouquets">View all roses &amp; bouquets</Link>
          </div>
          <div className="product-grid">
            {bestSellers.map((p) => <ProductCard product={p} key={p.id} />)}
          </div>
        </div>
      </section>

      <section className="band">
        <div className="wrap">
          <div className="sec-head">
            <div className="copy">
              <p className="eyebrow">Running out of time?</p>
              <h2 className="display">Same-day picks, ready to send today.</h2>
            </div>
          </div>
          <div className="product-grid">
            {sameDayPicks.map((p) => <ProductCard product={p} key={p.id} />)}
          </div>
        </div>
      </section>

      <section className="band band--tint" id="faq">
        <div className="wrap">
          <div className="sec-head">
            <div className="copy">
              <p className="eyebrow">Questions</p>
              <h2 className="display">Before you order.</h2>
            </div>
          </div>
          <div className="faq-list">
            {faqs.map((f, i) => (
              <details className="faq" key={f.q} open={i === 0}>
                <summary><h4>{f.q}</h4><span className="faq-mark" aria-hidden="true" /></summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
