import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { KEYS, readJSON, writeJSON } from '../lib/storage.js'
import { computeTotals } from '../lib/pricing.js'

const CartContext = createContext(null)

/* ------------------------------------------------------------------
   Phase 1 (this build): the cart lives in localStorage, and "adding to
   cart" logs the exact payload a real POST would send. Phase 2 swaps
   the body of addItem for a fetch() to the Spring Boot API on Oracle
   Cloud — nothing else in the app needs to change, since every screen
   only calls addItem() from this context.

   Hydration note: state starts empty so the prerendered HTML and the
   first client render agree; the saved cart is loaded in an effect
   immediately after mount (see AuthContext for the same pattern).
   ------------------------------------------------------------------ */
export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const [toast, setToast] = useState(null)
  const [hydrated, setHydrated] = useState(false)
  const toastTimer = useRef(null)

  useEffect(() => {
    const saved = readJSON(KEYS.cart, [])
    if (Array.isArray(saved) && saved.length) setItems(saved)
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) writeJSON(KEYS.cart, items)
  }, [hydrated, items])

  useEffect(() => () => window.clearTimeout(toastTimer.current), [])

  const flash = useCallback((message) => {
    setToast(message)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 3200)
  }, [])

  const addItem = useCallback(
    (product, size, qty, pincode) => {
      const unitPrice = Math.round(product.price * size.mult)
      const payload = {
        sku: `${product.slug}-${size.key}`,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        category: product.categorySlug,
        art: product.art,
        size: size.key,
        sizeLabel: size.label,
        unitPrice,
        quantity: qty,
        lineTotal: unitPrice * qty,
        deliveryPincode: pincode || null,
        currency: 'INR',
        requestedAt: new Date().toISOString(),
      }

      // --- Simulated backend call -------------------------------------
      // Phase 2 replaces this block with:
      //   await fetch('/api/v1/cart/items', {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify(payload),
      //   })
      // served by a Spring Boot backend deployed on an Oracle Cloud VM.
      console.groupCollapsed(
        '%c[NeoFlorist] POST /api/v1/cart/items  (simulated — no backend yet)',
        'color:#4C7A5E;font-weight:600'
      )
      console.log('Request payload:', payload)
      console.log('Expected response (Phase 2, Spring Boot on Oracle Cloud VM):', {
        status: 201,
        body: { cartItemId: `demo-${Date.now()}`, ...payload },
      })
      console.groupEnd()
      // ------------------------------------------------------------------

      setItems((prev) => {
        const idx = prev.findIndex((it) => it.sku === payload.sku)
        if (idx >= 0) {
          const next = [...prev]
          const quantity = next[idx].quantity + qty
          next[idx] = { ...next[idx], quantity, lineTotal: quantity * unitPrice }
          return next
        }
        return [...prev, payload]
      })

      flash(`Added “${product.name}” (${size.label}) to cart`)
    },
    [flash]
  )

  const removeItem = useCallback((sku) => {
    setItems((prev) => prev.filter((it) => it.sku !== sku))
  }, [])

  const setQuantity = useCallback((sku, quantity) => {
    setItems((prev) =>
      prev
        .map((it) =>
          it.sku === sku
            ? { ...it, quantity: Math.max(0, quantity), lineTotal: Math.max(0, quantity) * it.unitPrice }
            : it
        )
        .filter((it) => it.quantity > 0)
    )
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const count = items.reduce((n, it) => n + it.quantity, 0)
  const totals = computeTotals(items)

  const value = useMemo(
    () => ({
      items,
      hydrated,
      addItem,
      removeItem,
      setQuantity,
      clearCart,
      flash,
      count,
      total: totals.subtotal,
      totals,
      toast,
    }),
    [items, hydrated, addItem, removeItem, setQuantity, clearCart, flash, count, totals, toast]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
