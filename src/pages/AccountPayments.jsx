import React, { useState } from 'react'
import AccountLayout from '../components/AccountLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useSeo } from '../hooks/useSeo.js'
import {
  HOUSE_ACCOUNT_NUMBER,
  cardSummary,
  cleanDigits,
  formatCardNumber,
  validateCard,
  validateHouseAccount,
} from '../lib/payments.js'
import { BankIcon, CardIcon, LockIcon, PlusIcon, TrashIcon } from '../components/Icons.jsx'

const blankCard = { number: '', expiry: '', cvv: '', name: '', nickname: '' }

export default function AccountPayments() {
  useSeo({ title: 'Payment methods — NeoFlorist', description: 'Manage your saved payment methods.' })
  const { payments, savePayment, removePayment, setDefaultPayment } = useAuth()

  const [adding, setAdding] = useState(null) // null | 'house-account' | 'card'
  const [house, setHouse] = useState({ accountNumber: '', nickname: '' })
  const [card, setCard] = useState(blankCard)
  const [errors, setErrors] = useState({})

  function reset() {
    setAdding(null)
    setHouse({ accountNumber: '', nickname: '' })
    setCard(blankCard)
    setErrors({})
  }

  function submitHouse(e) {
    e.preventDefault()
    const err = validateHouseAccount(house.accountNumber)
    setErrors(err ? { accountNumber: err } : {})
    if (err) return
    savePayment({
      type: 'house-account',
      accountNumber: cleanDigits(house.accountNumber),
      nickname: house.nickname.trim() || 'House Account',
    })
    reset()
  }

  function submitCard(e) {
    e.preventDefault()
    const errs = validateCard(card)
    setErrors(errs)
    if (Object.keys(errs).length) return
    savePayment({ ...cardSummary(card), nickname: card.nickname.trim() || '' })
    reset()
  }

  return (
    <AccountLayout
      title="Payment methods"
      lede="Saved methods appear as one-tap options on the payment step at checkout."
      actions={
        !adding && (
          <div className="head-actions">
            <button className="btn btn--ghost" onClick={() => { reset(); setAdding('house-account') }}>
              <BankIcon style={{ width: 16, height: 16 }} /> House account
            </button>
            <button className="btn btn--primary" onClick={() => { reset(); setAdding('card') }}>
              <PlusIcon style={{ width: 16, height: 16 }} /> Add card
            </button>
          </div>
        )
      }
    >
      {adding === 'house-account' && (
        <form className="panel" onSubmit={submitHouse} noValidate>
          <h3 className="panel-title">Link a house account</h3>
          <p className="hint" style={{ marginBottom: 16 }}>
            House accounts are invoiced monthly. Demo build: account <b className="num">{HOUSE_ACCOUNT_NUMBER}</b> is
            the only one provisioned.
          </p>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="ha-number">House account number</label>
              <input
                id="ha-number"
                inputMode="numeric"
                maxLength={10}
                placeholder="210188"
                value={house.accountNumber}
                onChange={(e) => setHouse((h) => ({ ...h, accountNumber: e.target.value.replace(/\D/g, '') }))}
              />
              {errors.accountNumber && <p className="field-error">{errors.accountNumber}</p>}
            </div>
            <div className="field">
              <label htmlFor="ha-nick">Nickname <span className="opt">(optional)</span></label>
              <input
                id="ha-nick"
                value={house.nickname}
                placeholder="Strattek corporate"
                onChange={(e) => setHouse((h) => ({ ...h, nickname: e.target.value }))}
              />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn--primary" type="submit">Link account</button>
            <button className="btn btn--ghost" type="button" onClick={reset}>Cancel</button>
          </div>
        </form>
      )}

      {adding === 'card' && (
        <form className="panel" onSubmit={submitCard} noValidate>
          <h3 className="panel-title">Add a card</h3>
          <p className="hint" style={{ marginBottom: 16 }}>
            Use a gateway test number — e.g. <b className="num">4111 1111 1111 1111</b>. Only the brand, last four
            digits and expiry are kept; the full number is never stored.
          </p>
          <div className="form-grid">
            <div className="field field--full">
              <label htmlFor="cd-number">Card number</label>
              <input
                id="cd-number"
                inputMode="numeric"
                value={card.number}
                placeholder="4111 1111 1111 1111"
                onChange={(e) => setCard((c) => ({ ...c, number: formatCardNumber(e.target.value) }))}
              />
              {errors.number && <p className="field-error">{errors.number}</p>}
            </div>
            <div className="field">
              <label htmlFor="cd-exp">Expiry</label>
              <input
                id="cd-exp"
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
              <label htmlFor="cd-cvv">CVV</label>
              <input
                id="cd-cvv"
                inputMode="numeric"
                maxLength={4}
                value={card.cvv}
                onChange={(e) => setCard((c) => ({ ...c, cvv: e.target.value.replace(/\D/g, '') }))}
              />
              {errors.cvv && <p className="field-error">{errors.cvv}</p>}
            </div>
            <div className="field field--full">
              <label htmlFor="cd-name">Name on card</label>
              <input id="cd-name" value={card.name} onChange={(e) => setCard((c) => ({ ...c, name: e.target.value }))} />
              {errors.name && <p className="field-error">{errors.name}</p>}
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn--primary" type="submit">Save card</button>
            <button className="btn btn--ghost" type="button" onClick={reset}>Cancel</button>
          </div>
        </form>
      )}

      {!adding && payments.length === 0 ? (
        <div className="empty-panel">
          <CardIcon />
          <h3>No payment methods saved</h3>
          <p>Link a house account or save a test card so checkout is a single tap.</p>
        </div>
      ) : (
        !adding && (
          <div className="tile-list">
            {payments.map((p) => (
              <article className={`tile${p.isDefault ? ' tile--default' : ''}`} key={p.id}>
                <div className="tile-head">
                  <span className="tile-tag">
                    {p.type === 'house-account' ? <BankIcon /> : <CardIcon />}
                    {p.type === 'house-account' ? 'House account' : p.brand}
                  </span>
                  {p.isDefault && <span className="badge badge--green">Default</span>}
                </div>
                {p.type === 'house-account' ? (
                  <>
                    <b className="num">····{String(p.accountNumber).slice(-4)}</b>
                    <p>{p.nickname}</p>
                    <p className="hint">Invoiced monthly · no card charged</p>
                  </>
                ) : (
                  <>
                    <b className="num">···· ···· ···· {p.last4}</b>
                    <p>{p.holder}</p>
                    <p className="hint num">Expires {p.expiry}</p>
                  </>
                )}
                <div className="tile-actions">
                  {!p.isDefault && <button onClick={() => setDefaultPayment(p.id)}>Make default</button>}
                  <button className="danger" onClick={() => removePayment(p.id)}><TrashIcon /> Remove</button>
                </div>
              </article>
            ))}
          </div>
        )
      )}

      <p className="auth-note" style={{ marginTop: 26 }}>
        <LockIcon />
        <span>
          Demo build — no payment is ever processed and no data leaves this browser. Card numbers are truncated
          to the last four digits before anything is saved.
        </span>
      </p>
    </AccountLayout>
  )
}
