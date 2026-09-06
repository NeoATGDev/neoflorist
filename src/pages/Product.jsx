import React, { useMemo, useState } from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import { bySlug, byCategory, categoryBySlug } from '../data/flowers.js'
import FlowerArt from '../components/FlowerArt.jsx'
import ProductCard from '../components/ProductCard.jsx'
import PincodeCheck from '../components/PincodeCheck.jsx'
import { Stars, TruckIcon, ShieldIcon, LeafIcon } from '../components/Icons.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useSeo } from '../hooks/useSeo.js'

export default function Product() {
  const { slug } = useParams()
  const product = bySlug(slug)
  const [sizeIdx, setSizeIdx] = useState(0)
  const [qty, setQty] = useState(1)
  const [pincode, setPincode] = useState(null)
  const [tab, setTab] = useState('description')
  const { addItem } = useCart()

  const cat = product ? categoryBySlug(product.categorySlug) : null
  const related = useMemo(() => {
    if (!product) return []
    return byCategory(product.categorySlug).filter((p) => p.id !== product.id).slice(0, 4)
  }, [product])

  useSeo(product ? {
    title: `${product.name} — ₹${product.price.toLocaleString('en-IN')} | NeoFlorist`,
    description: product.description,
  } : {})

  if (!product) return <Navigate to="/" replace />

  const size = product.sizes[sizeIdx]
  const price = Math.round(product.price * size.mult)
  const compareAt = product.compareAtPrice ? Math.round(product.compareAtPrice * size.mult) : null

  return (
    <section className="band">
      <div className="wrap">
        <p className="crumbs">
          <Link to="/">Home</Link><span>/</span>
          <Link to={`/category/${cat.slug}`}>{cat.name}</Link><span>/</span>
          <span>{product.name}</span>
        </p>

        <div className="pd-grid">
          <div className="pd-stage">
            <FlowerArt art={product.art} label={product.name} style={{ width: '100%' }} />
          </div>

          <div>
            <p className="pd-cat">{cat.name}</p>
            <h1 className="pd-title">{product.name}</h1>
            <div className="pd-rating">
              <Stars rating={product.rating} size={15} />
              <span className="num">{product.reviewCount} reviews</span>
              {product.sameDay && <span>· Same-day eligible</span>}
            </div>

            <div className="pd-price-row">
              <span className="pd-price num">₹{price.toLocaleString('en-IN')}</span>
              {compareAt && <span className="pd-compare num">₹{compareAt.toLocaleString('en-IN')}</span>}
              {compareAt && <span className="pd-save">Save {Math.round((1 - price / compareAt) * 100)}%</span>}
            </div>

            <p className="pd-desc">{product.description}</p>

            <div className="size-row" role="group" aria-label="Size">
              {product.sizes.map((s, i) => (
                <button key={s.key} className="size-opt" aria-pressed={i === sizeIdx} onClick={() => setSizeIdx(i)}>
                  <b>{s.label}</b>
                  <span>₹{Math.round(product.price * s.mult).toLocaleString('en-IN')}</span>
                </button>
              ))}
            </div>

            <div className="qty-row">
              <div className="qty-stepper">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">−</button>
                <output className="num">{qty}</output>
                <button onClick={() => setQty((q) => Math.min(10, q + 1))} aria-label="Increase quantity">+</button>
              </div>
              <span style={{ fontSize: 13, color: 'var(--ink-dim)' }}>Max 10 per order</span>
            </div>

            <PincodeCheck sameDay={product.sameDay} onChange={setPincode} />

            <div className="pd-cta-row">
              <button className="btn btn--primary btn--block" onClick={() => addItem(product, size, qty, pincode)}>
                Add to cart — ₹{(price * qty).toLocaleString('en-IN')}
              </button>
            </div>

            <div className="pd-trust">
              <div><TruckIcon /> {product.sameDay ? 'Same-day delivery available in select metros' : 'Next-day delivery across India'}</div>
              <div><ShieldIcon /> 100% freshness guarantee, or we re-deliver</div>
              <div><LeafIcon /> Hand-arranged fresh on the day of delivery</div>
            </div>

            <div className="tabs">
              <div className="tab-row" role="tablist">
                <button role="tab" aria-pressed={tab === 'description'} onClick={() => setTab('description')}>Description</button>
                <button role="tab" aria-pressed={tab === 'care'} onClick={() => setTab('care')}>Care instructions</button>
                <button role="tab" aria-pressed={tab === 'delivery'} onClick={() => setTab('delivery')}>Delivery</button>
              </div>
              <div className="tab-panel">
                {tab === 'description' && <p>{product.description}</p>}
                {tab === 'care' && <p>{product.care}</p>}
                {tab === 'delivery' && (
                  <p>
                    Delivered across India in protective, water-fed packaging. Same-day
                    delivery is available in select metro pin codes for orders placed
                    before 4pm local time; all other serviceable pin codes receive
                    next-day delivery. Choose your delivery date at checkout.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <div style={{ marginTop: 60 }}>
            <div className="sec-head">
              <div className="copy"><p className="eyebrow">You may also like</p><h3 className="display">More from {cat.name}</h3></div>
            </div>
            <div className="product-grid">
              {related.map((p) => <ProductCard product={p} key={p.id} />)}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
