import React from 'react'
import { Link } from 'react-router-dom'
import FlowerArt from './FlowerArt.jsx'
import { Stars } from './Icons.jsx'
import { useCart } from '../context/CartContext.jsx'

export default function ProductCard({ product }) {
  const { addItem } = useCart()
  const href = `/product/${product.slug}`

  function quickAdd(e) {
    e.preventDefault()
    addItem(product, product.sizes[0], 1, null)
  }

  return (
    <article className="p-card">
      <Link to={href} className="stage" aria-label={product.name}>
        {product.bestSeller && <span className="p-badge">Bestseller</span>}
        {!product.bestSeller && product.sameDay && <span className="p-badge gold">Same-day</span>}
        <FlowerArt art={product.art} label={product.name} />
      </Link>
      <div className="p-body">
        <span className="p-cat">{product.categoryName}</span>
        <Link to={href}><h3 className="p-name">{product.name}</h3></Link>
        <Stars rating={product.rating} />
        <div className="p-price-row">
          <span className="p-price num">₹{product.price.toLocaleString('en-IN')}</span>
          {product.compareAtPrice && (
            <span className="p-compare num">₹{product.compareAtPrice.toLocaleString('en-IN')}</span>
          )}
        </div>
        <button className="p-add" onClick={quickAdd}>Add to cart</button>
      </div>
    </article>
  )
}
