import React from 'react'
import { Link } from 'react-router-dom'
import AccountLayout from '../components/AccountLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useSeo } from '../hooks/useSeo.js'
import { inr } from '../lib/pricing.js'
import { countdownLabel, sortByNext } from '../lib/reminders.js'
import { BellIcon, BoxIcon, CardIcon, PinIcon } from '../components/Icons.jsx'

export default function Account() {
  useSeo({ title: 'Your account — NeoFlorist', description: 'Your NeoFlorist account.' })
  const { user, addresses, payments, reminders, myOrders } = useAuth()

  const upcoming = [...reminders].sort(sortByNext).slice(0, 3)
  const lastOrder = myOrders[0]

  return (
    <AccountLayout
      title={user ? `Hello, ${(user.name || '').split(' ')[0] || 'there'}` : 'Your account'}
      lede="Everything you've saved with NeoFlorist, in one place."
    >
      <div className="stat-row">
        <Link className="stat" to="/account/addresses">
          <PinIcon />
          <b className="num">{addresses.length}</b>
          <span>Saved {addresses.length === 1 ? 'address' : 'addresses'}</span>
        </Link>
        <Link className="stat" to="/account/payments">
          <CardIcon />
          <b className="num">{payments.length}</b>
          <span>Payment {payments.length === 1 ? 'method' : 'methods'}</span>
        </Link>
        <Link className="stat" to="/account/reminders">
          <BellIcon />
          <b className="num">{reminders.length}</b>
          <span>{reminders.length === 1 ? 'Reminder' : 'Reminders'}</span>
        </Link>
        <Link className="stat" to="/account/orders">
          <BoxIcon />
          <b className="num">{myOrders.length}</b>
          <span>{myOrders.length === 1 ? 'Order' : 'Orders'}</span>
        </Link>
      </div>

      <div className="panel-row">
        <div className="panel">
          <h3 className="panel-title">Coming up</h3>
          {upcoming.length === 0 ? (
            <p className="hint">
              No reminders yet. <Link to="/account/reminders">Add a birthday or anniversary</Link> and we’ll
              nudge you before the date.
            </p>
          ) : (
            <ul className="mini-list">
              {upcoming.map((r) => (
                <li key={r.id}>
                  <div>
                    <b>{r.person}</b>
                    <span>{r.occasion}</span>
                  </div>
                  <span className="badge badge--green">{countdownLabel(r.date)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel">
          <h3 className="panel-title">Latest order</h3>
          {!lastOrder ? (
            <p className="hint">
              Nothing ordered yet. <Link to="/">Browse the collections</Link> to get started.
            </p>
          ) : (
            <ul className="mini-list">
              <li>
                <div>
                  <b>{lastOrder.id}</b>
                  <span>
                    {lastOrder.items.length} {lastOrder.items.length === 1 ? 'item' : 'items'} ·{' '}
                    {inr(lastOrder.totals.grandTotal)}
                  </span>
                </div>
                <Link className="btn btn--ghost btn--sm" to={`/order/${lastOrder.id}`}>View</Link>
              </li>
            </ul>
          )}
        </div>
      </div>
    </AccountLayout>
  )
}
