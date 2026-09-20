/* ------------------------------------------------------------------
   Browser-storage helpers.

   Everything the "account" side of this demo remembers — users, the
   signed-in session, saved addresses, saved payment methods, reminders,
   orders and the cart — lives in localStorage, so it survives a refresh
   and a browser restart and is only lost when the user clears site data.
   Phase 2 replaces these reads/writes with calls to the Spring Boot API;
   the shape of the objects below is deliberately the shape a REST
   response would have.

   Two rules every caller must respect:
   1. These functions are no-ops on the server. The site is prerendered
      at build time (see prerender.mjs), where `window` does not exist,
      so every read returns the fallback and every write is skipped.
   2. Because of (1), NEVER seed React state from storage directly —
      the server would render "logged out" and the client would render
      "logged in", and React would throw a hydration mismatch. Load in
      a useEffect after mount instead (see AuthContext / CartContext).
   ------------------------------------------------------------------ */

const PREFIX = 'nf.'

export function canStore() {
  try {
    return typeof window !== 'undefined' && !!window.localStorage
  } catch {
    // Private mode / blocked site data can make the accessor itself throw.
    return false
  }
}

export function readJSON(key, fallback) {
  if (!canStore()) return fallback
  try {
    const raw = window.localStorage.getItem(PREFIX + key)
    if (raw == null) return fallback
    const parsed = JSON.parse(raw)
    return parsed == null ? fallback : parsed
  } catch {
    return fallback
  }
}

export function writeJSON(key, value) {
  if (!canStore()) return false
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value))
    return true
  } catch {
    // Quota exceeded or storage blocked — the app keeps working in memory.
    return false
  }
}

export function removeKey(key) {
  if (!canStore()) return
  try {
    window.localStorage.removeItem(PREFIX + key)
  } catch {
    /* ignore */
  }
}

/* Storage keys, in one place so nothing drifts. */
export const KEYS = {
  users: 'users',
  session: 'session',
  orders: 'orders',
  cart: 'cart',
  pendingOrder: 'pendingOrder',
  data: (scopeId) => `data.${scopeId}`,
}

/* Short, sortable, readable demo id: NF-<base36 time>-<4 random>. */
export function makeId(prefix) {
  const t = Date.now().toString(36).toUpperCase()
  const r = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `${prefix}-${t}-${r}`
}

/* ------------------------------------------------------------------
   Password handling — demo only.

   There is no server here, so there is nothing that can hash a password
   properly. What follows is a salted FNV-1a digest: it keeps plaintext
   passwords out of localStorage (so a shared laptop doesn't leak them
   in devtools) but it is NOT secure and is NOT a substitute for real
   hashing. Phase 2 moves authentication to the Spring Boot backend and
   this function disappears entirely.
   ------------------------------------------------------------------ */
export function digest(password, salt) {
  const input = `${salt}::${password}`
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  // A second pass over the reversed string so single-character edits
  // scatter more; still a checksum, still not cryptography.
  let g = 0x811c9dc5
  for (let i = input.length - 1; i >= 0; i--) {
    g ^= input.charCodeAt(i)
    g = Math.imul(g, 0x01000193) >>> 0
  }
  return `${h.toString(16)}${g.toString(16)}`
}

export function makeSalt() {
  return Math.random().toString(36).slice(2, 10)
}
