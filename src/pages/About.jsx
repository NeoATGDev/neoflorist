import React from 'react'
import { site, faqs } from '../data/flowers.js'
import { TruckIcon, ShieldIcon, LeafIcon, ClockIcon } from '../components/Icons.jsx'
import { useSeo } from '../hooks/useSeo.js'

export default function About() {
  useSeo({
    title: 'About NeoFlorist — Delivery Info & Contact',
    description: 'NeoFlorist is a flower delivery proof-of-concept covering all of India. Contact details, delivery policy and frequently asked questions.',
  })

  return (
    <section className="band">
      <div className="wrap">
        <div className="sec-head">
          <div className="copy">
            <p className="eyebrow">About</p>
            <h2 className="display">A florist's storefront, built as a proof of concept.</h2>
            <p className="lede" style={{ marginTop: 12 }}>
              NeoFlorist is a demo/POC flower-delivery site covering pin codes across
              India. This build is the frontend: React on Vite, deployed free on
              Vercel. Phase 2 adds a Spring Boot backend, hosted on an Oracle Cloud
              VM, so Add to Cart and Checkout do something real — for now, adding an
              item logs the exact request payload to your browser console.
            </p>
          </div>
        </div>

        <div className="trust-strip">
          <div className="trust-item"><TruckIcon /><div><h5>India-wide delivery</h5><p>{site.deliveryNote}.</p></div></div>
          <div className="trust-item"><ShieldIcon /><div><h5>Freshness guarantee</h5><p>Arrangements are made to order, not held in a warehouse.</p></div></div>
          <div className="trust-item"><LeafIcon /><div><h5>Local florist partners</h5><p>Every order is hand-arranged close to the delivery address.</p></div></div>
          <div className="trust-item"><ClockIcon /><div><h5>Scheduled delivery</h5><p>Pick the exact date at checkout, including same-day where listed.</p></div></div>
        </div>

        <div className="band" style={{ paddingBlock: 40, borderTop: 'none' }}>
          <div className="sec-head">
            <div className="copy"><p className="eyebrow">Contact</p><h3 className="display">Talk to the team.</h3></div>
          </div>
          <dl className="pd-trust" style={{ borderTop: 'none', paddingTop: 0, fontSize: 15 }}>
            <div><strong style={{ minWidth: 70, display: 'inline-block' }}>Phone</strong> <a href={`tel:${site.phoneRaw}`}>{site.phone}</a></div>
            <div><strong style={{ minWidth: 70, display: 'inline-block' }}>Email</strong> <a href={`mailto:${site.email}`}>{site.email}</a></div>
            <div><strong style={{ minWidth: 70, display: 'inline-block' }}>Hours</strong> {site.hours}</div>
          </dl>
        </div>

        <div className="band band--tint" style={{ marginInline: 'calc(var(--pad) * -1)', paddingInline: 'var(--pad)' }}>
          <div className="sec-head">
            <div className="copy"><p className="eyebrow">FAQ</p><h3 className="display">Common questions.</h3></div>
          </div>
          <div className="faq-list">
            {faqs.map((f, i) => (
              <details className="faq" key={f.q} open={i === 0}>
                <summary><h4>{f.q}</h4><span className="faq-mark" aria-hidden="true" /></summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
