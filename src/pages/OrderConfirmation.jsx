import React from 'react'
import { Link, useParams } from 'react-router-dom'
import OrderSummary from '../components/OrderSummary.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useSeo } from '../hooks/useSeo.js'
import { formatAddress } from '../lib/india.js'
import { paymentLabel } from '../lib/payments.js'
import { BellIcon, CheckIcon, PinIcon, TruckIcon } from '../components/Icons.jsx'

const longDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

export default function OrderConfirmation() {
  const { orderId } = useParams()
  const { hydrated, getOrder, isLoggedIn } = useAuth()
  const order = hydrated ? getOrder(orderId) : null

  useSeo({
    title: order ? `Order ${order.id} confirmed — NeoFlorist` : 'Order — NeoFlorist',
    description: 'Your NeoFlorist order confirmation.',
  })

  if (!hydrated) {
    return (
      <section className="band">
        <div className="wrap">
          <div className="skeleton-page" aria-hidden="true">
            <div className="sk sk--title" /><div className="sk sk--line" /><div className="sk sk--block" />
          </div>
          <p className="sr-only">Loading your order…</p>
        </div>
      </section>
    )
  }

  if (!order) {
    return (
      <section className="band">
        <div className="wrap">
          <div className="empty-state">
            <h3>We couldn’t find that order</h3>
            <p>
              Order <b className="num">{orderId}</b> isn’t stored in this browser. Demo orders live in
              localStorage, so they won’t show up on another device or after clearing site data.
            </p>
            <Link className="btn btn--primary" to="/" style={{ marginTop: 18 }}>Back to the shop</Link>
          </div>
        </div>
      </section>
    )
  }

  const paid = order.payment?.type !== 'house-account'

  return (
    <section className="band">
      <div className="wrap">
        <div className="confirm-hero rise">
          <span className="tick tick--lg"><CheckIcon /></span>
          <p className="eyebrow">Order confirmed</p>
          <h1 className="display" style={{ fontSize: 'clamp(28px, 3.6vw, 42px)', marginTop: 6 }}>
            {(() => {
              const who = order.customer?.name || order.billing?.name
              return who ? `Thank you, ${who.split(' ')[0]} — your flowers are booked.` : 'Thank you — your flowers are booked.'
            })()}
          </h1>
          <p className="lede" style={{ marginTop: 10 }}>
            Order <b className="num">{order.id}</b> · placed {longDate(order.placedAt)}. A confirmation would be
            emailed to <b>{order.customer?.email || order.billing?.email}</b> in the live build.
          </p>
          <div className="confirm-actions">
            <Link className="btn btn--primary" to="/">Continue shopping</Link>
            <Link className="btn btn--ghost" to={isLoggedIn ? '/account/orders' : '/login'}>
              {isLoggedIn ? 'View all orders' : 'Create an account to track orders'}
            </Link>
          </div>
        </div>

        <div className="confirm-grid">
          <div className="panel-row panel-row--stack">
            <div className="panel">
              <h3 className="panel-title"><TruckIcon /> Delivery</h3>
              <b>{order.delivery.name}</b>
              <p>{formatAddress(order.delivery)}</p>
              {order.delivery.phone && <p className="hint num">+91 {order.delivery.phone}</p>}
              <div className="kv">
                <div><span>Date</span><b>{longDate(order.delivery.deliveryDate)}</b></div>
                <div><span>Slot</span><b>{order.delivery.slot}</b></div>
                <div><span>Status</span><b className="badge badge--green">{order.status}</b></div>
              </div>
              {order.delivery.giftMessage && (
                <p className="tile-note" style={{ marginTop: 14 }}>Card message: “{order.delivery.giftMessage}”</p>
              )}
            </div>

            <div className="panel">
              <h3 className="panel-title"><PinIcon /> Billing &amp; payment</h3>
              <b>{order.billing.name || order.delivery.name}</b>
              <p>
                {order.billing.sameAsDelivery
                  ? `${formatAddress(order.delivery)} (same as delivery)`
                  : formatAddress(order.billing)}
              </p>
              <p className="hint">{order.billing.email}</p>
              <div className="kv">
                <div><span>Method</span><b>{paymentLabel(order.payment)}</b></div>
                <div>
                  <span>Reference</span>
                  <b className="num">{order.payment?.reference || '—'}</b>
                </div>
                <div>
                  <span>Result</span>
                  <b className="badge badge--green">
                    {paid ? 'Paid (simulated)' : 'Charged to house account'}
                  </b>
                </div>
              </div>
              <p className="hint" style={{ marginTop: 12 }}>
                Demo build — no money moved and no payment provider was contacted.
              </p>
            </div>
          </div>

          <aside>
            <OrderSummary items={order.items} totals={order.totals} title="What you ordered" />
            <div className="side-recap" style={{ marginTop: 16 }}>
              <h4><BellIcon /> Don’t miss it next year</h4>
              <p className="hint">
                Save this date as a reminder and we’ll nudge you in time to send flowers again.
              </p>
              <Link className="btn btn--ghost btn--sm" to="/account/reminders" style={{ marginTop: 10 }}>
                Add a reminder
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
