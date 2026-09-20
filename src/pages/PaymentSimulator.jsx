import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useSeo } from '../hooks/useSeo.js'
import { KEYS, makeId, readJSON, removeKey } from '../lib/storage.js'
import { inr } from '../lib/pricing.js'
import {
  TEST_CARDS, cardBrand, cardSummary, cleanDigits, formatCardNumber, validateCard,
} from '../lib/payments.js'
import { CardIcon, CheckIcon, LockIcon } from '../components/Icons.jsx'

/* ------------------------------------------------------------------
   Simulated payment screen.

   This is a LOCAL MOCK of a redirect-style payment checkout, built for
   the NeoFlorist demo. It is deliberately NOT a copy of any payment
   provider's page: no provider logo, wordmark or branding is used, the
   word "simulated" is on screen throughout, and the Razorpay SDK is
   never loaded and their API is never called. Nothing typed here is
   transmitted anywhere, and the card number is discarded the moment the
   fake "authorisation" completes — only the brand and last four digits
   reach the order record.

   Phase 2 replaces this route with a real Razorpay Checkout handoff,
   with the order created and verified server-side by the Spring Boot
   backend.
   ------------------------------------------------------------------ */

const BANKS = ['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra Bank']
const STAGES = ['Validating payment details', 'Contacting issuing bank (simulated)', 'Authorising ₹ amount', 'Confirming with NeoFlorist']

export default function PaymentSimulator() {
  useSeo({
    title: 'Simulated payment — NeoFlorist demo',
    description: 'A local mock of a payment gateway. No payment provider is contacted and no money moves.',
  })

  const navigate = useNavigate()
  const { saveOrder } = useAuth()
  const { clearCart } = useCart()

  const [draft, setDraft] = useState(undefined) // undefined = loading, null = none
  const [tab, setTab] = useState('card')
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '', name: '' })
  const [vpa, setVpa] = useState('')
  const [bank, setBank] = useState(BANKS[0])
  const [errors, setErrors] = useState({})
  const [phase, setPhase] = useState('form') // 'form' | 'processing' | 'done'
  const [stage, setStage] = useState(0)
  const timers = useRef([])

  useEffect(() => {
    setDraft(readJSON(KEYS.pendingOrder, null))
  }, [])

  useEffect(() => () => timers.current.forEach(window.clearTimeout), [])

  const savedCard = draft?.payment?.last4 ? draft.payment : null

  function validate() {
    if (tab === 'card') {
      if (savedCard) return /^\d{3,4}$/.test(cleanDigits(card.cvv)) ? {} : { cvv: 'Enter the 3-digit CVV.' }
      return validateCard(card)
    }
    if (tab === 'upi') {
      return /^[\w.\-]{2,}@[a-z]{2,}$/i.test(vpa.trim()) ? {} : { vpa: 'Enter a UPI ID such as name@bank.' }
    }
    return {}
  }

  function pay(e) {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length) return

    setPhase('processing')
    setStage(0)
    // Staged, fake latency — nothing is happening on a network here.
    STAGES.forEach((_, i) => {
      if (i === 0) return
      timers.current.push(window.setTimeout(() => setStage(i), i * 520))
    })
    timers.current.push(window.setTimeout(complete, STAGES.length * 520 + 320))
  }

  function complete() {
    const method =
      tab === 'card'
        ? savedCard
          ? { type: 'card', brand: savedCard.brand, last4: savedCard.last4 }
          : { ...cardSummary(card) }
        : tab === 'upi'
          ? { type: 'upi', vpa: vpa.trim() }
          : { type: 'netbanking', bank }

    const order = {
      ...draft,
      status: 'Confirmed',
      placedAt: new Date().toISOString(),
      payment: {
        ...method,
        gateway: 'razorpay-simulated',
        simulated: true,
        // Shaped like a gateway reference so Phase 2 can drop in the real one.
        reference: makeId('PAY'),
        signature: `sim_${Math.random().toString(36).slice(2, 12)}`,
        capturedAt: new Date().toISOString(),
      },
    }

    console.groupCollapsed(
      '%c[NeoFlorist] Simulated payment captured — Razorpay was NOT called',
      'color:#4C7A5E;font-weight:600'
    )
    console.log('Order:', order)
    console.log('Phase 2: POST /api/v1/payments/verify to the Spring Boot backend, which verifies the real signature.')
    console.groupEnd()

    saveOrder(order)
    clearCart()
    removeKey(KEYS.pendingOrder)
    setPhase('done')
    timers.current.push(window.setTimeout(() => navigate(`/order/${order.id}`, { replace: true }), 700))
  }

  function cancel() {
    removeKey(KEYS.pendingOrder)
    navigate('/checkout')
  }

  // ---------------------------------------------------------------------
  if (draft === undefined) {
    return (
      <section className="band">
        <div className="wrap">
          <div className="skeleton-page" aria-hidden="true"><div className="sk sk--title" /><div className="sk sk--block" /></div>
        </div>
      </section>
    )
  }

  if (draft === null) {
    return (
      <section className="band">
        <div className="wrap">
          <div className="empty-state">
            <h3>Nothing to pay for</h3>
            <p>This simulated payment screen opens from checkout. Your cart may have been cleared already.</p>
            <Link className="btn btn--primary" to="/checkout" style={{ marginTop: 18 }}>Back to checkout</Link>
          </div>
        </div>
      </section>
    )
  }

  const amount = draft.totals.grandTotal

  return (
    <section className="band gw-band">
      <div className="gw-shell">
        <p className="gw-warn" role="note">
          <b>Simulation.</b> This screen is part of the NeoFlorist demo. It imitates the <i>flow</i> of a
          Razorpay-style checkout for a portfolio build — Razorpay is never contacted, no payment is processed,
          and nothing you type is sent anywhere. Use test card numbers only.
        </p>

        <div className="gw">
          <header className="gw-head">
            <div>
              <span className="gw-mark" aria-hidden="true"><LockIcon /></span>
              <div>
                <b>NeoFlorist</b>
                <span>Razorpay-style checkout <i className="sim-tag">simulated</i></span>
              </div>
            </div>
            <div className="gw-amt">
              <span>Amount</span>
              <b className="num">{inr(amount)}</b>
            </div>
          </header>

          {phase !== 'form' ? (
            <div className="gw-body gw-progress">
              {phase === 'done' ? (
                <>
                  <span className="tick"><CheckIcon /></span>
                  <h3>Payment successful (simulated)</h3>
                  <p className="hint">Taking you to your order confirmation…</p>
                </>
              ) : (
                <>
                  <span className="spinner" aria-hidden="true" />
                  <h3>Processing</h3>
                  <ul className="gw-stages">
                    {STAGES.map((s, i) => (
                      <li key={s} className={i < stage ? 'done' : i === stage ? 'now' : ''}>
                        {i < stage ? <CheckIcon /> : <span className="dot" />}
                        {s.replace('₹ amount', inr(amount))}
                      </li>
                    ))}
                  </ul>
                  <p className="hint">No network request is being made — this delay is staged.</p>
                </>
              )}
            </div>
          ) : (
            <form className="gw-body" onSubmit={pay} noValidate>
              <div className="gw-tabs" role="tablist">
                {[['card', 'Card'], ['upi', 'UPI'], ['netbanking', 'Netbanking']].map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    role="tab"
                    aria-selected={tab === k}
                    className={tab === k ? 'active' : ''}
                    onClick={() => { setTab(k); setErrors({}) }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {tab === 'card' && (savedCard ? (
                <div className="gw-saved">
                  <CardIcon />
                  <div>
                    <b>{savedCard.brand} ···· {savedCard.last4}</b>
                    <span>Saved on your NeoFlorist account</span>
                  </div>
                  <div className="field" style={{ maxWidth: 110 }}>
                    <label htmlFor="gw-cvv2">CVV</label>
                    <input
                      id="gw-cvv2"
                      inputMode="numeric"
                      maxLength={4}
                      value={card.cvv}
                      onChange={(e) => setCard((c) => ({ ...c, cvv: e.target.value.replace(/\D/g, '') }))}
                    />
                    {errors.cvv && <p className="field-error">{errors.cvv}</p>}
                  </div>
                </div>
              ) : (
                <>
                  <div className="form-grid">
                    <div className="field field--full">
                      <label htmlFor="gw-num">Card number</label>
                      <input
                        id="gw-num"
                        inputMode="numeric"
                        placeholder="4111 1111 1111 1111"
                        value={card.number}
                        onChange={(e) => setCard((c) => ({ ...c, number: formatCardNumber(e.target.value) }))}
                      />
                      {card.number && <span className="brand-chip">{cardBrand(card.number)}</span>}
                      {errors.number && <p className="field-error">{errors.number}</p>}
                    </div>
                    <div className="field">
                      <label htmlFor="gw-exp">Expiry (MM/YY)</label>
                      <input
                        id="gw-exp"
                        placeholder="12/28"
                        maxLength={5}
                        value={card.expiry}
                        onChange={(e) => {
                          const d = e.target.value.replace(/\D/g, '').slice(0, 4)
                          setCard((c) => ({ ...c, expiry: d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d }))
                        }}
                      />
                      {errors.expiry && <p className="field-error">{errors.expiry}</p>}
                    </div>
                    <div className="field">
                      <label htmlFor="gw-cvv">CVV</label>
                      <input
                        id="gw-cvv"
                        inputMode="numeric"
                        maxLength={4}
                        value={card.cvv}
                        onChange={(e) => setCard((c) => ({ ...c, cvv: e.target.value.replace(/\D/g, '') }))}
                      />
                      {errors.cvv && <p className="field-error">{errors.cvv}</p>}
                    </div>
                    <div className="field field--full">
                      <label htmlFor="gw-name">Name on card</label>
                      <input id="gw-name" value={card.name} onChange={(e) => setCard((c) => ({ ...c, name: e.target.value }))} />
                      {errors.name && <p className="field-error">{errors.name}</p>}
                    </div>
                  </div>

                  <div className="gw-testcards">
                    <b>Test numbers — any of these work</b>
                    <div>
                      {TEST_CARDS.map((t) => (
                        <button
                          type="button"
                          key={t.number}
                          onClick={() => setCard((c) => ({
                            ...c,
                            number: t.number,
                            expiry: c.expiry || '12/28',
                            cvv: c.cvv || '123',
                            name: c.name || 'Test Customer',
                          }))}
                        >
                          <span className="num">{t.number}</span> <em>{t.brand}</em>
                        </button>
                      ))}
                    </div>
                    <p className="hint">Any future expiry and any 3-digit CVV are accepted. Never enter a real card.</p>
                  </div>
                </>
              ))}

              {tab === 'upi' && (
                <div className="form-grid">
                  <div className="field field--full">
                    <label htmlFor="gw-vpa">UPI ID</label>
                    <input
                      id="gw-vpa"
                      placeholder="success@razorpay"
                      value={vpa}
                      onChange={(e) => setVpa(e.target.value)}
                    />
                    {errors.vpa && <p className="field-error">{errors.vpa}</p>}
                    <p className="hint">Any well-formed UPI ID is accepted — no collect request is actually sent.</p>
                  </div>
                </div>
              )}

              {tab === 'netbanking' && (
                <div className="form-grid">
                  <div className="field field--full">
                    <label htmlFor="gw-bank">Choose your bank</label>
                    <select id="gw-bank" value={bank} onChange={(e) => setBank(e.target.value)}>
                      {BANKS.map((b) => <option key={b}>{b}</option>)}
                    </select>
                    <p className="hint">You won’t be redirected anywhere — the success screen is simulated locally.</p>
                  </div>
                </div>
              )}

              <button className="btn btn--primary btn--block" type="submit" style={{ marginTop: 20 }}>
                Pay {inr(amount)} <span className="sim-tag">simulated</span>
              </button>
              <button className="link-btn gw-cancel" type="button" onClick={cancel}>
                Cancel and return to checkout
              </button>
            </form>
          )}

          <footer className="gw-foot">
            <LockIcon />
            <span>Mock screen · no provider contacted · no card data stored or transmitted</span>
          </footer>
        </div>
      </div>
    </section>
  )
}
