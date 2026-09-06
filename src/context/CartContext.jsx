import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

const CartContext = createContext(null)

/* ------------------------------------------------------------------
   Phase 1 (this build): cart lives in memory only, and "adding to
   cart" logs the exact payload a real POST would send. Phase 2 swaps
   the body of addItem for a fetch() to the Spring Boot API on Oracle
   Cloud — nothing else in the app needs to change, since every screen
   only calls addItem() from this context.
   ------------------------------------------------------------------ */
export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const [toast, setToast] = useState(null)

  const addItem = useCallback((product, size, qty, pincode) => {
    const unitPrice = Math.round(product.price * size.mult)
    const payload = {
      sku: `${product.slug}-${size.key}`,
      productId: product.id,
      name: product.name,
      category: product.categorySlug,
      size: size.key,
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
        next[idx] = { ...next[idx], quantity: next[idx].quantity + qty, lineTotal: (next[idx].quantity + qty) * unitPrice }
        return next
      }
      return [...prev, payload]
    })

    setToast(`Added “${product.name}” (${size.label}) to cart`)
    window.clearTimeout(addItem._t)
    addItem._t = window.setTimeout(() => setToast(null), 3200)
  }, [])

  const removeItem = useCallback((sku) => {
    setItems((prev) => prev.filter((it) => it.sku !== sku))
  }, [])

  const count = items.reduce((n, it) => n + it.quantity, 0)
  const total = items.reduce((n, it) => n + it.lineTotal, 0)

  const value = useMemo(
    () => ({ items, addItem, removeItem, count, total, toast }),
    [items, addItem, removeItem, count, total, toast]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
