import React from 'react'
import FlowerArt from './FlowerArt.jsx'
import { DELIVERY_FEE, FREE_DELIVERY_ABOVE, inr } from '../lib/pricing.js'

/* The money panel, shared by checkout, the simulated gateway and the
   confirmation page so the three can never show different numbers. */
export default function OrderSummary({ items, totals, title = 'Order summary', compact = false }) {
  const toGo = FREE_DELIVERY_ABOVE - totals.subtotal

  return (
    <div className="summary">
      <h3 className="panel-title">{title}</h3>

      <ul className="summary-items">
        {items.map((it) => (
          <li key={it.sku}>
            {!compact && (
              <span className="thumb" aria-hidden="true">
                <FlowerArt art={it.art} label={it.name} />
              </span>
            )}
            <div>
              <b>{it.name}</b>
              <span>{it.sizeLabel || it.size} · qty {it.quantity}</span>
            </div>
            <span className="num">{inr(it.lineTotal)}</span>
          </li>
        ))}
      </ul>

      <div className="summary-rows">
        <div className="summary-row"><span>Subtotal</span><span className="num">{inr(totals.subtotal)}</span></div>
        <div className="summary-row">
          <span>Delivery</span>
          <span className="num">{totals.delivery === 0 ? 'Free' : inr(totals.delivery)}</span>
        </div>
        <div className="summary-row"><span>Taxes &amp; fees (5%)</span><span className="num">{inr(totals.tax)}</span></div>
        <div className="summary-row summary-total">
          <span>Total payable</span><span className="num">{inr(totals.grandTotal)}</span>
        </div>
      </div>

      {totals.delivery > 0 && toGo > 0 && (
        <p className="hint" style={{ marginTop: 12 }}>
          Add {inr(toGo)} more and delivery ({inr(DELIVERY_FEE)}) is on us.
        </p>
      )}
    </div>
  )
}
