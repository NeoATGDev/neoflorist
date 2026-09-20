/* ------------------------------------------------------------------
   Payment rules for the demo. Nothing here talks to a payment provider
   and nothing here leaves the browser.

   House Account — the corporate/florist-trade style account used by
   NeoFlorist's B2B customers. In this build exactly one account number
   is provisioned; Phase 2 checks the number against the accounts table
   in the Spring Boot backend instead.

   Cards — the "Razorpay" screen in this app is a local simulation. It
   accepts test card numbers, never contacts Razorpay (or anyone), and
   deliberately keeps nothing but the last four digits, because a demo
   has no business holding a full card number even in localStorage.
   ------------------------------------------------------------------ */

export const HOUSE_ACCOUNT_NUMBER = '210188'

export const cleanDigits = (v) => String(v || '').replace(/\D/g, '')

export function validateHouseAccount(value) {
  const n = cleanDigits(value)
  if (!n) return 'Enter your house account number.'
  if (n !== HOUSE_ACCOUNT_NUMBER) return 'Account not found or not authorised for online ordering.'
  return null
}

/* Well-known gateway *test* numbers, listed on the simulated payment
   screen so there's something obvious to type. */
export const TEST_CARDS = [
  { number: '4111 1111 1111 1111', brand: 'Visa' },
  { number: '5267 3181 8797 5449', brand: 'Mastercard' },
  { number: '6521 1111 1111 1117', brand: 'RuPay' },
]

export function cardBrand(number) {
  const n = cleanDigits(number)
  if (/^4/.test(n)) return 'Visa'
  if (/^(5[1-5]|2[2-7])/.test(n)) return 'Mastercard'
  if (/^3[47]/.test(n)) return 'Amex'
  if (/^6(5|0)/.test(n)) return 'RuPay'
  return 'Card'
}

export const formatCardNumber = (v) => cleanDigits(v).slice(0, 19).replace(/(.{4})/g, '$1 ').trim()

export function validateCard({ number, expiry, cvv, name }) {
  const e = {}
  const n = cleanDigits(number)
  // Any well-formed test number is accepted — this is a simulation, so
  // there is no issuer to ask and no real card to decline.
  if (n.length < 13 || n.length > 19) e.number = 'Enter a test card number (13–19 digits).'
  if (!/^\d{2}\s*\/\s*\d{2}$/.test(String(expiry || '').trim())) e.expiry = 'Use MM/YY.'
  else {
    const [mm] = String(expiry).split('/').map((s) => Number(s.trim()))
    if (mm < 1 || mm > 12) e.expiry = 'Month must be 01–12.'
  }
  if (!/^\d{3,4}$/.test(cleanDigits(cvv))) e.cvv = 'CVV is 3 digits (4 for Amex).'
  if (!String(name || '').trim()) e.name = 'Enter the name on the card.'
  return e
}

/* What we're willing to remember about a card. */
export function cardSummary({ number, expiry, name }) {
  const n = cleanDigits(number)
  return {
    type: 'card',
    brand: cardBrand(n),
    last4: n.slice(-4),
    expiry: String(expiry || '').replace(/\s/g, ''),
    holder: String(name || '').trim(),
  }
}

export function paymentLabel(pm) {
  if (!pm) return '—'
  if (pm.type === 'house-account') return `House Account ····${String(pm.accountNumber).slice(-4)}`
  return `${pm.brand} ····${pm.last4}`
}
