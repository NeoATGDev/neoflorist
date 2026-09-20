/* India-specific form rules, shared by checkout and the address book. */

// A valid Indian PIN code is 6 digits and never starts with 0.
export const PIN_RE = /^[1-9][0-9]{5}$/
// Indian mobile numbers start 6–9 and are 10 digits; an optional +91 / 0 prefix is stripped first.
export const PHONE_RE = /^[6-9][0-9]{9}$/
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i

export const normalisePhone = (v) => String(v || '').replace(/\D/g, '').replace(/^(91|0)(?=\d{10}$)/, '')

export const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal',
  'Andaman & Nicobar Islands', 'Chandigarh', 'Dadra & Nagar Haveli and Daman & Diu', 'Delhi',
  'Jammu & Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
]

export const blankAddress = () => ({
  label: 'Home',
  name: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  pincode: '',
})

/* Returns { field: message } — empty object means valid. */
export function validateAddress(a, { requirePhone = true } = {}) {
  const e = {}
  if (!String(a.name || '').trim()) e.name = 'Enter a name'
  if (requirePhone && !PHONE_RE.test(normalisePhone(a.phone))) e.phone = 'Enter a 10-digit Indian mobile number'
  if (!String(a.line1 || '').trim()) e.line1 = 'Enter the flat / house and street'
  if (!String(a.city || '').trim()) e.city = 'Enter a city'
  if (!String(a.state || '').trim()) e.state = 'Choose a state'
  if (!PIN_RE.test(String(a.pincode || '').trim())) e.pincode = 'Enter a valid 6-digit pin code'
  return e
}

export function formatAddress(a) {
  return [a.line1, a.line2, a.city, a.state && `${a.state} ${a.pincode}`.trim()]
    .filter(Boolean)
    .join(', ')
}
