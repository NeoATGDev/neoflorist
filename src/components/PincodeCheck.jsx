import React, { useState } from 'react'
import { CheckIcon } from './Icons.jsx'

// India-only delivery: a valid Indian PIN code is 6 digits, first digit 1–9
// (0 is not issued). This is a format check for the demo — the live version
// will confirm against the real serviceable-pincode list from the backend.
const PIN_RE = /^[1-9][0-9]{5}$/

export default function PincodeCheck({ sameDay, onChange }) {
  const [pin, setPin] = useState('')
  const [status, setStatus] = useState(null) // null | 'ok' | 'bad'

  function check(value) {
    setPin(value)
    if (value.length < 6) { setStatus(null); onChange?.(null); return }
    const ok = PIN_RE.test(value)
    setStatus(ok ? 'ok' : 'bad')
    onChange?.(ok ? value : null)
  }

  return (
    <div className="pin-check">
      <label htmlFor="pincode">Check delivery at your pin code</label>
      <div className="pin-row">
        <input
          id="pincode"
          inputMode="numeric"
          maxLength={6}
          placeholder="e.g. 560001"
          value={pin}
          onChange={(e) => check(e.target.value.replace(/\D/g, ''))}
        />
      </div>
      {status === 'ok' && (
        <p className="pin-msg ok">
          <CheckIcon style={{ width: 14, height: 14, display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
          {sameDay ? 'Same-day delivery available at this pin code.' : 'Deliverable — next-day delivery at this pin code.'}
        </p>
      )}
      {status === 'bad' && <p className="pin-msg bad">Enter a valid 6-digit Indian pin code.</p>}
      <p className="pin-note">Delivering across India only. Metro same-day cutoff: 4pm local time.</p>
    </div>
  )
}
