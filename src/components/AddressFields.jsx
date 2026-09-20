import React from 'react'
import { STATES } from '../lib/india.js'

/* A reusable block of address inputs. The parent owns the value and the
   error map, so the same fields serve checkout and the account address
   book without either one knowing about the other. */
export default function AddressFields({ value, errors = {}, onChange, idPrefix, showLabel = true }) {
  const set = (k) => (e) => onChange({ ...value, [k]: e.target.value })
  const id = (k) => `${idPrefix}-${k}`

  return (
    <div className="form-grid">
      {showLabel && (
        <div className="field">
          <label htmlFor={id('label')}>Address nickname</label>
          <select id={id('label')} value={value.label || 'Home'} onChange={set('label')}>
            <option>Home</option>
            <option>Office</option>
            <option>Family</option>
            <option>Other</option>
          </select>
        </div>
      )}

      <div className="field">
        <label htmlFor={id('name')}>Full name</label>
        <input id={id('name')} value={value.name || ''} onChange={set('name')} autoComplete="name" />
        {errors.name && <p className="field-error">{errors.name}</p>}
      </div>

      <div className="field">
        <label htmlFor={id('phone')}>Mobile number</label>
        <input
          id={id('phone')}
          value={value.phone || ''}
          onChange={set('phone')}
          inputMode="tel"
          placeholder="9876543210"
          autoComplete="tel"
        />
        {errors.phone && <p className="field-error">{errors.phone}</p>}
      </div>

      <div className="field field--full">
        <label htmlFor={id('line1')}>Flat / house no., building, street</label>
        <input id={id('line1')} value={value.line1 || ''} onChange={set('line1')} autoComplete="address-line1" />
        {errors.line1 && <p className="field-error">{errors.line1}</p>}
      </div>

      <div className="field field--full">
        <label htmlFor={id('line2')}>Area, landmark <span className="opt">(optional)</span></label>
        <input id={id('line2')} value={value.line2 || ''} onChange={set('line2')} autoComplete="address-line2" />
      </div>

      <div className="field">
        <label htmlFor={id('city')}>City</label>
        <input id={id('city')} value={value.city || ''} onChange={set('city')} autoComplete="address-level2" />
        {errors.city && <p className="field-error">{errors.city}</p>}
      </div>

      <div className="field">
        <label htmlFor={id('state')}>State</label>
        <select id={id('state')} value={value.state || ''} onChange={set('state')}>
          <option value="">Choose a state</option>
          {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {errors.state && <p className="field-error">{errors.state}</p>}
      </div>

      <div className="field">
        <label htmlFor={id('pincode')}>Pin code</label>
        <input
          id={id('pincode')}
          value={value.pincode || ''}
          onChange={(e) => onChange({ ...value, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
          inputMode="numeric"
          maxLength={6}
          placeholder="560001"
          autoComplete="postal-code"
        />
        {errors.pincode && <p className="field-error">{errors.pincode}</p>}
      </div>

      <div className="field">
        <label>Country</label>
        <input value="India" readOnly disabled />
        <p className="hint">NeoFlorist delivers within India only.</p>
      </div>
    </div>
  )
}
