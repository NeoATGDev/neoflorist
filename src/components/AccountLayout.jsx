import React from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { BellIcon, BoxIcon, CardIcon, LogOutIcon, PinIcon, UserIcon } from './Icons.jsx'

const LINKS = [
  { to: '/account', label: 'Overview', Icon: UserIcon, end: true },
  { to: '/account/addresses', label: 'Saved addresses', Icon: PinIcon },
  { to: '/account/payments', label: 'Payment methods', Icon: CardIcon },
  { to: '/account/reminders', label: 'Reminders', Icon: BellIcon },
  { to: '/account/orders', label: 'Orders', Icon: BoxIcon },
]

/* Wraps every /account/* screen: sidebar, heading, and the two states
   that aren't the page itself — "still loading storage" and "not signed
   in". Keeping the gate here means each page can assume a user exists.

   The skeleton matters for more than looks: this route is prerendered
   at build time as a signed-out shell, so rendering the skeleton until
   `hydrated` flips keeps the server HTML and the first client render
   identical and avoids a hydration mismatch. */
export default function AccountLayout({ title, lede, actions, children }) {
  const { hydrated, isLoggedIn, user, logOut } = useAuth()
  const location = useLocation()

  if (!hydrated) {
    return (
      <section className="band">
        <div className="wrap">
          <div className="skeleton-page" aria-hidden="true">
            <div className="sk sk--title" />
            <div className="sk sk--line" />
            <div className="sk sk--block" />
          </div>
          <p className="sr-only">Loading your account…</p>
        </div>
      </section>
    )
  }

  if (!isLoggedIn) {
    return (
      <section className="band">
        <div className="wrap">
          <div className="gate">
            <h1 className="display" style={{ fontSize: 30 }}>Sign in to continue</h1>
            <p className="lede" style={{ marginTop: 10 }}>
              Your saved addresses, payment methods, reminders and orders live in your NeoFlorist account.
            </p>
            <Link
              className="btn btn--primary"
              style={{ marginTop: 20 }}
              to={`/login?next=${encodeURIComponent(location.pathname)}`}
            >
              Log in or create an account
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="band">
      <div className="wrap acct-grid">
        <aside className="acct-side">
          <div className="acct-who">
            <span className="avatar" aria-hidden="true">{(user.name || user.email)[0].toUpperCase()}</span>
            <div>
              <b>{user.name || 'NeoFlorist customer'}</b>
              <span>{user.email}</span>
            </div>
          </div>
          <nav className="acct-nav">
            {LINKS.map(({ to, label, Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'active' : '')}>
                <Icon /> {label}
              </NavLink>
            ))}
          </nav>
          <button className="acct-logout" onClick={logOut}>
            <LogOutIcon /> Log out
          </button>
        </aside>

        <div className="acct-main">
          <div className="page-head">
            <div>
              <h1 className="display" style={{ fontSize: 'clamp(26px, 3vw, 34px)' }}>{title}</h1>
              {lede && <p className="lede" style={{ marginTop: 8 }}>{lede}</p>}
            </div>
            {actions}
          </div>
          {children}
        </div>
      </div>
    </section>
  )
}
