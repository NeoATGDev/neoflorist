import React, { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { searchProducts } from '../data/flowers.js'
import ProductCard from '../components/ProductCard.jsx'
import { SearchIcon } from '../components/Icons.jsx'
import { useSeo } from '../hooks/useSeo.js'

export default function Search() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') || ''
  const [draft, setDraft] = useState(q)

  const results = useMemo(() => searchProducts(q), [q])

  useSeo({
    title: q ? `Search: ${q} — NeoFlorist` : 'Search — NeoFlorist',
    description: 'Search NeoFlorist’s catalogue of roses, bouquets, orchids, plants and gift baskets, delivered across India.',
  })

  function submit(e) {
    e.preventDefault()
    setParams(draft.trim() ? { q: draft.trim() } : {})
  }

  return (
    <section className="band">
      <div className="wrap">
        <div className="sec-head">
          <div className="copy">
            <p className="eyebrow">Search</p>
            <h2 className="display">{q ? `Results for “${q}”` : 'Find your flowers'}</h2>
          </div>
        </div>

        <form onSubmit={submit} className="search-box" style={{ maxWidth: 420, marginBottom: 30 }}>
          <SearchIcon />
          <input
            type="search"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Try “rose”, “birthday”, “orchid”…"
            aria-label="Search products"
          />
        </form>

        {!q ? (
          <div className="empty-state">
            <h3>Search by flower, occasion or category</h3>
            <p>Try “rose”, “anniversary”, “orchid”, or “basket”.</p>
          </div>
        ) : results.length === 0 ? (
          <div className="empty-state">
            <h3>No matches for “{q}”</h3>
            <p>Check the spelling, or browse our four collections from the menu above.</p>
          </div>
        ) : (
          <>
            <p style={{ color: 'var(--ink-dim)', fontSize: 13.5, marginBottom: 18 }} className="num">
              {results.length} result{results.length === 1 ? '' : 's'}
            </p>
            <div className="product-grid">
              {results.map((p) => <ProductCard product={p} key={p.id} />)}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
