import React from 'react'
import { useCart } from '../context/CartContext.jsx'
import { XIcon } from './Icons.jsx'

export default function CartDrawer({ open, onClose }) {
  const { items, removeItem, total } = useCart()
  if (!open) return null

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
                <div className="meta">
                  <b>{it.name}</b>
                  <span>{it.size} · qty {it.quantity}</span>
                </div>
                <div className="price num">₹{it.lineTotal.toLocaleString('en-IN')}</div>
                <button className="remove" onClick={() => removeItem(it.sku)}>Remove</button>
              </div>
            ))
          )}
        </div>
        {items.length > 0 && (
          <div className="drawer-foot">
            <div className="drawer-total">
              <span>Subtotal</span>
              <span className="num">₹{total.toLocaleString('en-IN')}</span>
            </div>
            <button className="btn btn--primary btn--block" onClick={() => {
              console.log('%c[NeoFlorist] Checkout is not wired yet — Phase 2 backend will handle this.', 'color:#C6415B;font-weight:600')
              onClose()
            }}>
              Checkout (demo)
            </button>
          </div>
        )}
      </aside>
    </>
  )
}
