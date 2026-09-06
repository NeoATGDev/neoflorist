import React, { useMemo, useState } from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import { categoryBySlug, byCategory, CATEGORIES } from '../data/flowers.js'
import ProductCard from '../components/ProductCard.jsx'
import { useSeo } from '../hooks/useSeo.js'

const SORTS = {
  featured: (a, b) => Number(b.bestSeller) - Number(a.bestSeller) || b.rating - a.rating,
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  rating: (a, b) => b.rating - a.rating,
}

export default function Category() {
  const { slug } = useParams()
  const cat = categoryBySlug(slug)
  const [sort, setSort] = useState('featured')
  const [onlySameDay, setOnlySameDay] = useState(false)

  const products = useMemo(() => {
    if (!cat) return []
    let list = byCategory(slug)
    if (onlySameDay) list = list.filter((p) => p.sameDay)
    return [...list].sort(SORTS[sort])
  }, [slug, sort, onlySameDay, cat])

  useSeo(cat ? {
    title: `${cat.name} — Order Online | NeoFlorist`,
    description: `${cat.blurb} ${products.length} designs, delivered across India.`,
  } : {})

  if (!cat) return <Navigate to="/" replace />

  return (
    <section className="band">
      <div className="wrap">
        <p className="crumbs">
          <Link to="/">Home</Link><span>/</span>
          <span>{cat.name}</span>
        </p>
        <div className="sec-head">
          <div className="copy">
            <p className="eyebrow">Collection</p>
            <h2 className="display">{cat.name}</h2>
            <p className="lede" style={{ marginTop: 10 }}>{cat.blurb}</p>
          </div>
        </div>

        <div className="grid-toolbar">
          <div className="chip-row">
            <button className="chip" aria-pressed={onlySameDay} onClick={() => setOnlySameDay((v) => !v)}>
              Same-day only
            </button>
            {CATEGORIES.filter((c) => c.slug !== slug).map((c) => (
              <Link key={c.slug} to={`/category/${c.slug}`} className="chip" style={{ textDecoration: 'none' }}>{c.short}</Link>
            ))}
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort products">
            <option value="featured">Featured</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="rating">Highest rated</option>
          </select>
        </div>

        {products.length === 0 ? (
          <div className="empty-state">
            <h3>No same-day options right now</h3>
            <p>Try turning off the same-day filter to see the full collection.</p>
          </div>
        ) : (
          <div className="product-grid">
            {products.map((p) => <ProductCard product={p} key={p.id} />)}
          </div>
        )}
      </div>
    </section>
  )
}
