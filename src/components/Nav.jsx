import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CATEGORIES, site } from '../data/flowers.js'
import { SearchIcon, CartIcon, UserIcon } from './Icons.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import CartDrawer from './CartDrawer.jsx'

export default function Nav() {
  const [q, setQ] = useState('')
  const [cartOpen, setCartOpen] = useState(false)
  const { count } = useCart()
  const { hydrated, isLoggedIn, user } = useAuth()
  const navigate = useNavigate()

  // Until storage has loaded, both server and client render the signed-out
  // label — swapping it in afterwards keeps hydration clean.
  const accountLabel = hydrated && isLoggedIn ? (user.name || 'Account').split(' ')[0] : 'Log in'

  function submitSearch(e) {
    e.preventDefault()
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`)
  }

  return (
    <>
      <div className="banner">
        <b>Same-day delivery</b> in select metros · Delivering across India · Order by 4pm local time
      </div>
      <nav className="nav">
        <div className="nav-in">
          <Link to="/" className="brand">
            <span className="brand-mark">Neo<em>Florist</em></span>
          </Link>
          <div className="nav-links">
            {CATEGORIES.map((c) => (
              <Link key={c.slug} to={`/category/${c.slug}`}>{c.short}</Link>
            ))}
            <Link to="/about">About</Link>
          </div>
          <form className="nav-search search-box" onSubmit={submitSearch} role="search">
            <SearchIcon />
            <input
              type="search"
              placeholder="Search flowers, plants, occasions…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search products"
            />
          </form>
          <div className="nav-icons">
            <Link
              className="acct-link"
              to={hydrated && isLoggedIn ? '/account' : '/login'}
              aria-label={hydrated && isLoggedIn ? 'Your account' : 'Log in'}
            >
              <UserIcon />
              <span>{accountLabel}</span>
            </Link>
            <button className="icon-btn" onClick={() => setCartOpen(true)} aria-label="Open cart">
              <CartIcon />
              {count > 0 && <span className="cart-badge num">{count}</span>}
            </button>
          </div>
        </div>
      </nav>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}
