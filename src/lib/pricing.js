/* ------------------------------------------------------------------
   One place that decides what an order costs, so the checkout summary,
   the payment screen and the confirmation page can never disagree.
   ------------------------------------------------------------------ */

export const DELIVERY_FEE = 99
export const FREE_DELIVERY_ABOVE = 1499
export const TAX_RATE = 0.05

export function computeTotals(items) {
  const subtotal = items.reduce((n, it) => n + it.lineTotal, 0)
  const delivery = subtotal === 0 || subtotal >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_FEE
  const tax = Math.round((subtotal + delivery) * TAX_RATE)
  return { subtotal, delivery, tax, grandTotal: subtotal + delivery + tax }
}

export const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`
