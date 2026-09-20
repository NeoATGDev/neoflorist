import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AddressFields from '../components/AddressFields.jsx'
import OrderSummary from '../components/OrderSummary.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useSeo } from '../hooks/useSeo.js'
import { KEYS, makeId, writeJSON } from '../lib/storage.js'
import { EMAIL_RE, blankAddress, formatAddress, normalisePhone, validateAddress } from '../lib/india.js'
import { HOUSE_ACCOUNT_NUMBER, cleanDigits, paymentLabel, validateHouseAccount } from '../lib/payments.js'
import { inr } from '../lib/pricing.js'
import { BankIcon, CardIcon, CheckIcon, LockIcon, PinIcon, TruckIcon } from '../components/Icons.jsx'

const SLOTS = [
  { key: 'morning', label: 'Morning · 9am – 1pm' },
  { key: 'afternoon', label: 'Afternoon · 1pm – 5pm' },
  { key: 'evening', label: 'Evening · 5pm – 9pm' },
]

const todayISO = () => new Date().toISOString().slice(0, 10)

export default function Checkout() {
  useSeo({
    title: 'Checkout — NeoFlorist',
    description: 'Enter your delivery and billing details and choose how to pay.',
  })

  const navigate = useNavigate()
  const { items, totals, hydrated: cartReady, clearCart } = useCart()
  const {
    hydrated: authReady, isLoggedIn, user, addresses, payments, saveAddress, savePayment, saveOrder,
  } = useAuth()

  const [step, setStep] = useState(1)

  // --- step 1 state ----------------------------------------------------
  const [deliveryId, setDeliveryId] = useState('new') // saved address id | 'new'
  const [delivery, setDelivery] = useState(blankAddress)
  const [deliveryDate, setDeliveryDate] = useState('')
  const [slot, setSlot] = useState('afternoon')
  const [giftMessage, setGiftMessage] = useState('')
  const [email, setEmail] = useState('')
  const [billingSame, setBillingSame] = useState(true)
  const [billing, setBilling] = useState(blankAddress)
  const [saveToAccount, setSaveToAccount] = useState(true)
  const [errors, setErrors] = useState({})

  // --- step 2 state ----------------------------------------------------
  const [payChoice, setPayChoice] = useState('') // saved:<id> | 'house-account' | 'razorpay'
  const [houseNumber, setHouseNumber] = useState('')
  const [payError, setPayError] = useState('')
  const [saveHouse, setSaveHouse] = useState(false)

  // Prefill from the account once storage has loaded — once only, so the
  // customer's own edits are never snapped back by a later re-render.
  const prefilled = useRef(false)
  useEffect(() => {
    if (!authReady || prefilled.current) return
    prefilled.current = true
    const defAddr = addresses.find((a) => a.isDefault) || addresses[0]
    if (defAddr) setDeliveryId(defAddr.id)
    if (user?.email) setEmail(user.email)
    const defPay = payments.find((p) => p.isDefault) || payments[0]
    setPayChoice(defPay ? `saved:${defPay.id}` : 'house-account')
  }, [authReady, addresses, payments, user])

  const chosenSaved = deliveryId === 'new' ? null : addresses.find((a) => a.id === deliveryId) || null
  const deliveryAddress = chosenSaved || delivery
  const billingAddress = billingSame ? deliveryAddress : billing

  const savedPayment = payChoice.startsWith('saved:')
    ? payments.find((p) => p.id === payChoice.slice(6)) || null
    : null

  const minDate = useMemo(() => (cartReady ? todayISO() : ''), [cartReady])

  // ---------------------------------------------------------------------
  if (!cartReady || !authReady) {
    return (
      <section className="band">
        <div className="wrap">
          <div className="skeleton-page" aria-hidden="true">
            <div className="sk sk--title" /><div className="sk sk--line" /><div className="sk sk--block" />
          </div>
          <p className="sr-only">Loading your cart…</p>
        </div>
      </section>
    )
  }

  if (items.length === 0) {
    return (
      <section className="band">
        <div className="wrap">
          <div className="empty-state">
            <h3>Your cart is empty</h3>
            <p>Add a bouquet or two and checkout will be waiting.</p>
            <Link className="btn btn--primary" to="/" style={{ marginTop: 18 }}>Browse the collections</Link>
          </div>
        </div>
      </section>
    )
  }

  // ---------------------------------------------------------------------
  function submitDetails(e) {
    e.preventDefault()
    const errs = {}
    if (!EMAIL_RE.test(email.trim())) errs.email = 'We need an email to send the order confirmation to'
    if (!deliveryDate) errs.deliveryDate = 'Choose a delivery date'

    const deliveryErrs = chosenSaved ? {} : validateAddress(delivery)
    const billingErrs = billingSame ? {} : validateAddress(billing, { requirePhone: false })

    setErrors({ ...errs, delivery: deliveryErrs, billing: billingErrs })
    if (Object.keys(errs).length || Object.keys(deliveryErrs).length || Object.keys(billingErrs).length) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    if (isLoggedIn && !chosenSaved && saveToAccount) {
      saveAddress({ ...delivery, phone: normalisePhone(delivery.phone) })
    }
    setStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function buildDraft(payment) {
    return {
      id: makeId('NF'),
      placedAt: new Date().toISOString(),
      status: 'Confirmed',
      items,
      totals,
      delivery: {
        ...deliveryAddress,
        phone: normalisePhone(deliveryAddress.phone),
        deliveryDate,
        slot: SLOTS.find((s) => s.key === slot)?.label || slot,
        giftMessage: giftMessage.trim(),
      },
      billing: { ...billingAddress, email: email.trim(), sameAsDelivery: billingSame },
      // Who placed the order, as distinct from who receives it.
      customer: { name: user?.name || billingAddress.name || '', email: email.trim() },
      payment,
    }
  }

  function finish(order) {
    saveOrder(order)
    clearCart()
    navigate(`/order/${order.id}`, { replace: true })
  }

  function submitPayment(e) {
    e.preventDefault()
    setPayError('')

    // ---- saved method -------------------------------------------------
    if (savedPayment) {
      if (savedPayment.type === 'house-account') {
        finish(buildDraft({
          type: 'house-account',
          accountNumber: savedPayment.accountNumber,
          nickname: savedPayment.nickname,
          reference: makeId('HA'),
          capturedAt: new Date().toISOString(),
          simulated: true,
        }))
        return
      }
      // A saved card still goes through the simulated gateway screen.
      handoffToGateway({ type: 'card', brand: savedPayment.brand, last4: savedPayment.last4, savedId: savedPayment.id })
      return
    }

    // ---- new house account --------------------------------------------
    if (payChoice === 'house-account') {
      const err = validateHouseAccount(houseNumber)
      if (err) { setPayError(err); return }
      const accountNumber = cleanDigits(houseNumber)
      if (isLoggedIn && saveHouse && !payments.some((p) => p.accountNumber === accountNumber)) {
        savePayment({ type: 'house-account', accountNumber, nickname: 'House Account' })
      }
      finish(buildDraft({
        type: 'house-account',
        accountNumber,
        nickname: 'House Account',
        reference: makeId('HA'),
        capturedAt: new Date().toISOString(),
        simulated: true,
      }))
      return
    }

    // ---- razorpay (simulated) ------------------------------------------
    handoffToGateway({ type: 'card' })
  }

  /* Park the order on localStorage and hand over to the mock gateway
     screen. Nothing is created until that screen reports success, which
     mirrors how a real redirect-based gateway behaves. */
  function handoffToGateway(paymentHint) {
    const draft = buildDraft({ ...paymentHint, gateway: 'razorpay-simulated', simulated: true })
    writeJSON(KEYS.pendingOrder, draft)
    navigate('/checkout/payment')
  }

  return (
    <section className="band">
      <div className="wrap">
        <div className="page-head">
          <div>
            <p className="eyebrow">Checkout</p>
            <h1 className="display" style={{ fontSize: 'clamp(28px, 3.4vw, 40px)', marginTop: 8 }}>
              {step === 1 ? 'Where should it go?' : 'How would you like to pay?'}
            </h1>
          </div>
          {!isLoggedIn && (
            <Link className="btn btn--ghost btn--sm" to="/login?next=%2Fcheckout">
              Log in for saved details
            </Link>
          )}
        </div>

        <ol className="steps" aria-label="Checkout progress">
          <li className={step >= 1 ? 'done' : ''}><span>1</span> Delivery &amp; billing</li>
          <li className={step >= 2 ? 'done' : ''}><span>2</span> Payment</li>
          <li><span>3</span> Confirmation</li>
        </ol>

        <div className="checkout-grid">
          <div>
            {step === 1 ? (
              <form onSubmit={submitDetails} noValidate>
                <div className="panel">
                  <h3 className="panel-title"><TruckIcon /> Delivery details</h3>

                  {isLoggedIn && addresses.length > 0 && (
                    <div className="pick-row">
                      {addresses.map((a) => (
                        <button
                          type="button"
                          key={a.id}
                          className="pick"
                          aria-pressed={deliveryId === a.id}
                          onClick={() => setDeliveryId(a.id)}
                        >
                          <b>{a.label} · {a.name}</b>
                          <span>{formatAddress(a)}</span>
                        </button>
                      ))}
                      <button
                        type="button"
                        className="pick pick--new"
                        aria-pressed={deliveryId === 'new'}
                        onClick={() => setDeliveryId('new')}
                      >
                        <b>Use a new address</b>
                        <span>Deliver somewhere else this time</span>
                      </button>
                    </div>
                  )}

                  {!chosenSaved && (
                    <>
                      <AddressFields
                        value={delivery}
                        errors={errors.delivery || {}}
                        onChange={setDelivery}
                        idPrefix="del"
                        showLabel={isLoggedIn}
                      />
                      {isLoggedIn && (
                        <label className="check">
                          <input
                            type="checkbox"
                            checked={saveToAccount}
                            onChange={(e) => setSaveToAccount(e.target.checked)}
                          />
                          Save this address to my account
                        </label>
                      )}
                    </>
                  )}

                  <div className="form-grid" style={{ marginTop: chosenSaved ? 0 : 18 }}>
                    <div className="field">
                      <label htmlFor="co-date">Delivery date</label>
                      <input
                        id="co-date"
                        type="date"
                        min={minDate}
                        value={deliveryDate}
                        onChange={(e) => setDeliveryDate(e.target.value)}
                      />
                      {errors.deliveryDate && <p className="field-error">{errors.deliveryDate}</p>}
                    </div>
                    <div className="field">
                      <label htmlFor="co-slot">Time slot</label>
                      <select id="co-slot" value={slot} onChange={(e) => setSlot(e.target.value)}>
                        {SLOTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                      </select>
                    </div>
                    <div className="field field--full">
                      <label htmlFor="co-msg">Gift message <span className="opt">(optional)</span></label>
                      <textarea
                        id="co-msg"
                        rows={2}
                        maxLength={200}
                        value={giftMessage}
                        onChange={(e) => setGiftMessage(e.target.value)}
                        placeholder="Handwritten on a card and tucked into the bouquet."
                      />
                      <p className="hint">{200 - giftMessage.length} characters left</p>
                    </div>
                  </div>
                </div>

                <div className="panel">
                  <h3 className="panel-title"><PinIcon /> Billing address</h3>

                  <div className="field field--full" style={{ marginBottom: 14 }}>
                    <label htmlFor="co-email">Email for the invoice &amp; order updates</label>
                    <input
                      id="co-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                    {errors.email && <p className="field-error">{errors.email}</p>}
                  </div>

                  <label className="check">
                    <input
                      type="checkbox"
                      checked={billingSame}
                      onChange={(e) => setBillingSame(e.target.checked)}
                    />
                    Billing address is the same as the delivery address
                  </label>

                  {billingSame ? (
                    <div className="recap">
                      <b>{deliveryAddress.name || 'Your delivery address'}</b>
                      <p>{formatAddress(deliveryAddress) || 'Fill in the delivery address above.'}</p>
                    </div>
                  ) : (
                    <AddressFields
                      value={billing}
                      errors={errors.billing || {}}
                      onChange={setBilling}
                      idPrefix="bil"
                      showLabel={false}
                    />
                  )}
                </div>

                <div className="form-actions">
                  <button className="btn btn--primary" type="submit">Continue to payment</button>
                  <Link className="btn btn--ghost" to="/">Keep shopping</Link>
                </div>
              </form>
            ) : (
              <form onSubmit={submitPayment} noValidate>
                <div className="panel">
                  <h3 className="panel-title"><LockIcon /> Payment method</h3>

                  {payments.length > 0 && (
                    <div className="pay-opts">
                      {payments.map((p) => (
                        <label className="pay-opt" key={p.id} aria-checked={payChoice === `saved:${p.id}`}>
                          <input
                            type="radio"
                            name="pay"
                            checked={payChoice === `saved:${p.id}`}
                            onChange={() => setPayChoice(`saved:${p.id}`)}
                          />
                          <span className="pay-opt-body">
                            {p.type === 'house-account' ? <BankIcon /> : <CardIcon />}
                            <span>
                              <b>{paymentLabel(p)}</b>
                              <em>
                                {p.type === 'house-account'
                                  ? `${p.nickname} · invoiced monthly`
                                  : `Expires ${p.expiry} · pays via the simulated gateway`}
                              </em>
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  )}

                  <div className="pay-opts">
                    <label className="pay-opt" aria-checked={payChoice === 'house-account'}>
                      <input
                        type="radio"
                        name="pay"
                        checked={payChoice === 'house-account'}
                        onChange={() => setPayChoice('house-account')}
                      />
                      <span className="pay-opt-body">
                        <BankIcon />
                        <span>
                          <b>House Account</b>
                          <em>Charge this order to your NeoFlorist trade account and settle monthly.</em>
                        </span>
                      </span>
                    </label>

                    {payChoice === 'house-account' && (
                      <div className="pay-detail">
                        <div className="field">
                          <label htmlFor="co-house">House account number</label>
                          <input
                            id="co-house"
                            inputMode="numeric"
                            maxLength={10}
                            placeholder="210188"
                            value={houseNumber}
                            onChange={(e) => { setHouseNumber(e.target.value.replace(/\D/g, '')); setPayError('') }}
                          />
                          <p className="hint">
                            Demo build: <b className="num">{HOUSE_ACCOUNT_NUMBER}</b> is the only provisioned account.
                          </p>
                        </div>
                        {isLoggedIn && (
                          <label className="check">
                            <input type="checkbox" checked={saveHouse} onChange={(e) => setSaveHouse(e.target.checked)} />
                            Remember this account on my profile
                          </label>
                        )}
                      </div>
                    )}

                    <label className="pay-opt" aria-checked={payChoice === 'razorpay'}>
                      <input
                        type="radio"
                        name="pay"
                        checked={payChoice === 'razorpay'}
                        onChange={() => setPayChoice('razorpay')}
                      />
                      <span className="pay-opt-body">
                        <CardIcon />
                        <span>
                          <b>Card / UPI / Netbanking <span className="sim-tag">simulated</span></b>
                          <em>
                            Opens a mock Razorpay-style checkout built into this demo. No payment provider is
                            contacted and no money moves.
                          </em>
                        </span>
                      </span>
                    </label>
                  </div>

                  {payError && <p className="alert alert--bad">{payError}</p>}

                  <p className="auth-note">
                    <LockIcon />
                    <span>
                      This is a portfolio demo. Every payment path below is simulated locally — Razorpay is never
                      called, nothing is charged, and nothing is transmitted anywhere.
                    </span>
                  </p>
                </div>

                <div className="form-actions">
                  <button className="btn btn--primary" type="submit">
                    {payChoice === 'razorpay' || (savedPayment && savedPayment.type === 'card')
                      ? `Pay ${inr(totals.grandTotal)}`
                      : `Place order · ${inr(totals.grandTotal)}`}
                  </button>
                  <button className="btn btn--ghost" type="button" onClick={() => setStep(1)}>
                    Back to delivery details
                  </button>
                </div>
              </form>
            )}
          </div>

          <aside className="checkout-side">
            <OrderSummary items={items} totals={totals} />
            {step === 2 && (
              <div className="side-recap">
                <h4>Delivering to</h4>
                <b>{deliveryAddress.name}</b>
                <p>{formatAddress(deliveryAddress)}</p>
                <p className="hint">
                  {deliveryDate} · {SLOTS.find((s) => s.key === slot)?.label}
                </p>
                <button className="link-btn" type="button" onClick={() => setStep(1)}>Change</button>
                <h4 style={{ marginTop: 16 }}>Billing</h4>
                <p>{billingSame ? 'Same as delivery address' : formatAddress(billingAddress)}</p>
                <p className="hint">{email}</p>
              </div>
            )}
            <div className="assure">
              <div><CheckIcon /> Hand-arranged the morning of delivery</div>
              <div><CheckIcon /> Free replacement if it arrives wilted</div>
              <div><CheckIcon /> Delivering across India</div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
