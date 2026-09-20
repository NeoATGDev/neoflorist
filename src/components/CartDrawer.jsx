import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import FlowerArt from './FlowerArt.jsx'
import { XIcon } from './Icons.jsx'
import { inr } from '../lib/pricing.js'

export default function CartDrawer({ open, onClose }) {
  const { items, removeItem, setQuantity, total } = useCart()
  const navigate = useNavigate()
  if (!open) return null

  function checkout() {
    onClose()
    navigate('/checkout')
  }

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-label="Shopping cart">
        <div className="drawer-head">
          <h3>Your cart</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close cart"><XIcon /></button>
        </div>
        <div className="drawer-body">
          {items.length === 0 ? (
            <div className="drawer-empty">
              <p>Your cart is empty. Fresh flowers are one click away.</p>
            </div>
          ) : (
            items.map((it) => (
              <div className="cart-row" key={it.sku}>
                <span className="stage" aria-hidden="true">
                  <FlowerArt art={it.art} label={it.name} />
                </span>
                <div className="meta">
                  <b>{it.name}</b>
                  <span>{it.sizeLabel || it.size}</span>
                  <div className="qty-mini">
                    <button onClick={() => setQuantity(it.sku, it.quantity - 1)} aria-label={`Fewer ${it.name}`}>−</button>
                    <output className="num">{it.quantity}</output>
                    <button onClick={() => setQuantity(it.sku, it.quantity + 1)} aria-label={`More ${it.name}`}>+</button>
                  </div>
                </div>
                <div className="cart-row-end">
                  <div className="price num">{inr(it.lineTotal)}</div>
                  <button className="remove" onClick={() => removeItem(it.sku)}>Remove</button>
                </div>
              </div>
            ))
          )}
        </div>
        {items.length > 0 && (
          <div className="drawer-foot">
            <div className="drawer-total">
              <span>Subtotal</span>
              <span className="num">{inr(total)}</span>
            </div>
            <p className="hint" style={{ marginBottom: 12 }}>Delivery and taxes are calculated at checkout.</p>
            <button className="btn btn--primary btn--block" onClick={checkout}>
              Checkout
            </button>
          </div>
        )}
      </aside>
    </>
  )
}
