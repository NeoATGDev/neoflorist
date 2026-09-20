import React, { useState } from 'react'
import AccountLayout from '../components/AccountLayout.jsx'
import AddressFields from '../components/AddressFields.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useSeo } from '../hooks/useSeo.js'
import { blankAddress, formatAddress, normalisePhone, validateAddress } from '../lib/india.js'
import { PencilIcon, PinIcon, PlusIcon, TrashIcon } from '../components/Icons.jsx'

export default function AccountAddresses() {
  useSeo({ title: 'Saved addresses — NeoFlorist', description: 'Manage your saved delivery addresses.' })
  const { addresses, saveAddress, removeAddress, setDefaultAddress } = useAuth()

  const [draft, setDraft] = useState(null) // null = list view
  const [errors, setErrors] = useState({})

  function startNew() {
    setDraft(blankAddress())
    setErrors({})
  }

  function startEdit(a) {
    setDraft({ ...a })
    setErrors({})
  }

  function submit(e) {
    e.preventDefault()
    const errs = validateAddress(draft)
    setErrors(errs)
    if (Object.keys(errs).length) return
    saveAddress({ ...draft, phone: normalisePhone(draft.phone) })
    setDraft(null)
  }

  return (
    <AccountLayout
      title="Saved addresses"
      lede="Addresses you save here show up as one-tap options at checkout."
      actions={
        !draft && (
          <button className="btn btn--primary" onClick={startNew}>
            <PlusIcon style={{ width: 16, height: 16 }} /> Add address
          </button>
        )
      }
    >
      {draft ? (
        <form className="panel" onSubmit={submit} noValidate>
          <h3 className="panel-title">{draft.id ? 'Edit address' : 'New address'}</h3>
          <AddressFields value={draft} errors={errors} onChange={setDraft} idPrefix="addr" />
          <div className="form-actions">
            <button className="btn btn--primary" type="submit">Save address</button>
            <button className="btn btn--ghost" type="button" onClick={() => setDraft(null)}>Cancel</button>
          </div>
        </form>
      ) : addresses.length === 0 ? (
        <div className="empty-panel">
          <PinIcon />
          <h3>No saved addresses yet</h3>
          <p>Add the addresses you send flowers to most — home, the office, your parents’ place.</p>
          <button className="btn btn--primary" onClick={startNew}>Add your first address</button>
        </div>
      ) : (
        <div className="tile-list">
          {addresses.map((a) => (
            <article className={`tile${a.isDefault ? ' tile--default' : ''}`} key={a.id}>
              <div className="tile-head">
                <span className="tile-tag">{a.label || 'Address'}</span>
                {a.isDefault && <span className="badge badge--green">Default</span>}
              </div>
              <b>{a.name}</b>
              <p>{formatAddress(a)}</p>
              {a.phone && <p className="hint num">+91 {a.phone}</p>}
              <div className="tile-actions">
                <button onClick={() => startEdit(a)}><PencilIcon /> Edit</button>
                {!a.isDefault && <button onClick={() => setDefaultAddress(a.id)}>Make default</button>}
                <button className="danger" onClick={() => removeAddress(a.id)}><TrashIcon /> Remove</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </AccountLayout>
  )
}
