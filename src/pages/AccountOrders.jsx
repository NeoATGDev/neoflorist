import React from 'react'
import { Link } from 'react-router-dom'
import AccountLayout from '../components/AccountLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useSeo } from '../hooks/useSeo.js'
import { inr } from '../lib/pricing.js'
import { paymentLabel } from '../lib/payments.js'
import { BoxIcon } from '../components/Icons.jsx'

export default function AccountOrders() {
  useSeo({ title: 'Your orders — NeoFlorist', description: 'Your NeoFlorist order history.' })
  const { myOrders } = useAuth()

  if (myOrders.length === 0) {
    return (
      <AccountLayout title="Orders" lede="Every order you place shows up here.">
        <div className="empty-panel">
          <BoxIcon />
          <h3>No orders yet</h3>
          <p>When you place an order it will appear here with its delivery and payment details.</p>
          <Link className="btn btn--primary" to="/">Browse the collections</Link>
        </div>
      </AccountLayout>
    )
  }

  return (
    <AccountLayout title="Orders" lede="Every order you place shows up here.">
      <div className="order-list">
        {myOrders.map((o) => (
          <article className="order-row" key={o.id}>
            <div className="order-row-main">
              <b className="num">{o.id}</b>
              <span className="hint">
                {new Date(o.placedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                {' · '}
                {o.items.length} {o.items.length === 1 ? 'item' : 'items'}
                {' · '}
                {paymentLabel(o.payment)}
              </span>
              <span className="hint">
                To {o.delivery.name}, {o.delivery.city} {o.delivery.pincode}
              </span>
            </div>
            <div className="order-row-side">
              <span className="badge badge--green">{o.status}</span>
              <b className="num">{inr(o.totals.grandTotal)}</b>
              <Link className="btn btn--ghost btn--sm" to={`/order/${o.id}`}>Details</Link>
            </div>
          </article>
        ))}
      </div>
    </AccountLayout>
  )
}
