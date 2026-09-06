import React from 'react'
import { Link } from 'react-router-dom'
import { CATEGORIES, site } from '../data/flowers.js'

export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="foot-grid">
          <div className="foot-col">
            <span className="brand-mark" style={{ fontSize: 26 }}>Neo<em style={{ color: 'var(--rose)', fontStyle: 'normal' }}>Florist</em></span>
            <p style={{ marginTop: 10, maxWidth: '34ch' }}>{site.tagline}. A demo storefront — Phase 2 wires this to a Spring Boot backend on Oracle Cloud.</p>
          </div>
          <div className="foot-col">
            <h5>Shop</h5>
            {CATEGORIES.map((c) => <Link key={c.slug} to={`/category/${c.slug}`}>{c.name}</Link>)}
          </div>
          <div className="foot-col">
            <h5>Company</h5>
            <Link to="/about">About &amp; delivery info</Link>
            <Link to="/search">Search</Link>
          </div>
          <div className="foot-col">
            <h5>Talk to us</h5>
            <a href={`tel:${site.phoneRaw}`}>{site.phone}</a>
            <a href={`mailto:${site.email}`}>{site.email}</a>
            <a href={site.whatsapp} target="_blank" rel="noreferrer">WhatsApp us</a>
          </div>
        </div>
        <div className="foot-bottom">
          <p style={{ margin: 0 }}>© {new Date().getFullYear()} NeoFlorist. {site.deliveryNote}.</p>
          <p style={{ margin: 0 }}>Demo/POC build — no real orders are placed.</p>
        </div>
      </div>
    </footer>
  )
}
