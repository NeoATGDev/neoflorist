import React from 'react'
import { Link } from 'react-router-dom'
import { useSeo } from '../hooks/useSeo.js'

export default function NotFound() {
  useSeo({ title: 'Page not found — NeoFlorist', description: 'This page could not be found.' })
  return (
    <section className="band">
      <div className="wrap empty-state">
        <h3>This page wilted</h3>
        <p>We couldn't find what you're looking for.</p>
        <Link className="btn btn--primary" to="/" style={{ marginTop: 18 }}>Back to NeoFlorist</Link>
      </div>
    </section>
  )
}
