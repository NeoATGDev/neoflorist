import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { KEYS, digest, makeId, makeSalt, readJSON, removeKey, writeJSON } from '../lib/storage.js'

/* ------------------------------------------------------------------
   AuthContext — accounts, session, and everything that hangs off an
   account: saved addresses, saved payment methods, reminders, orders.

   Storage layout (all under the "nf." prefix in localStorage):
     nf.users          [{ id, name, email, salt, digest, createdAt }]
     nf.session        { userId, email, at } | null
     nf.data.<scope>   { addresses: [], payments: [], reminders: [] }
     nf.orders         [{ id, userId|null, ... }]   — global, so a guest
                       order stays reachable at /order/:id after refresh

   <scope> is the user id when signed in and the string "guest" when
   not, so an anonymous visitor still gets a working address book for
   the length of the demo without polluting anybody's account.

   Hydration: state starts empty on both server and client, then a
   single useEffect loads storage and flips `hydrated`. Screens render
   a skeleton while `hydrated` is false so the prerendered HTML and the
   first client render always agree.
   ------------------------------------------------------------------ */

const AuthContext = createContext(null)
const GUEST = 'guest'
const EMPTY_DATA = { addresses: [], payments: [], reminders: [] }

const normaliseEmail = (e) => String(e || '').trim().toLowerCase()

export function AuthProvider({ children }) {
  const [hydrated, setHydrated] = useState(false)
  const [users, setUsers] = useState([])
  const [session, setSession] = useState(null)
  const [data, setData] = useState(EMPTY_DATA)
  const [orders, setOrders] = useState([])

  const scopeId = session?.userId || GUEST

  // ---- load once, after mount ----------------------------------------
  useEffect(() => {
    const loadedUsers = readJSON(KEYS.users, [])
    const loadedSession = readJSON(KEYS.session, null)
    const valid =
      loadedSession && loadedUsers.some((u) => u.id === loadedSession.userId) ? loadedSession : null
    setUsers(loadedUsers)
    setSession(valid)
    setData({ ...EMPTY_DATA, ...readJSON(KEYS.data(valid?.userId || GUEST), EMPTY_DATA) })
    setOrders(readJSON(KEYS.orders, []))
    setHydrated(true)
  }, [])

  // ---- persist on change (never before the load above has run) --------
  useEffect(() => {
    if (hydrated) writeJSON(KEYS.users, users)
  }, [hydrated, users])

  useEffect(() => {
    if (!hydrated) return
    if (session) writeJSON(KEYS.session, session)
    else removeKey(KEYS.session)
  }, [hydrated, session])

  useEffect(() => {
    if (hydrated) writeJSON(KEYS.data(scopeId), data)
  }, [hydrated, scopeId, data])

  useEffect(() => {
    if (hydrated) writeJSON(KEYS.orders, orders)
  }, [hydrated, orders])

  // ---- account actions -------------------------------------------------
  const signUp = useCallback(
    ({ name, email, password }) => {
      const mail = normaliseEmail(email)
      if (users.some((u) => u.email === mail)) {
        return { ok: false, error: 'An account with this email already exists. Try logging in.' }
      }
      const salt = makeSalt()
      const user = {
        id: makeId('USR'),
        name: String(name).trim(),
        email: mail,
        salt,
        digest: digest(password, salt),
        createdAt: new Date().toISOString(),
      }
      setUsers((prev) => [...prev, user])
      setSession({ userId: user.id, email: user.email, at: new Date().toISOString() })
      // A brand-new account starts empty; anything the visitor saved as a
      // guest stays in the guest scope rather than silently migrating.
      setData(EMPTY_DATA)
      return { ok: true, user }
    },
    [users]
  )

  const logIn = useCallback(
    ({ email, password }) => {
      const mail = normaliseEmail(email)
      const user = users.find((u) => u.email === mail)
      if (!user) return { ok: false, error: 'No account found for that email.' }
      if (digest(password, user.salt) !== user.digest) {
        return { ok: false, error: 'That password does not match.' }
      }
      setSession({ userId: user.id, email: user.email, at: new Date().toISOString() })
      setData({ ...EMPTY_DATA, ...readJSON(KEYS.data(user.id), EMPTY_DATA) })
      return { ok: true, user }
    },
    [users]
  )

  const logOut = useCallback(() => {
    setSession(null)
    setData({ ...EMPTY_DATA, ...readJSON(KEYS.data(GUEST), EMPTY_DATA) })
  }, [])

  // ---- generic list helpers -------------------------------------------
  const upsert = useCallback((listKey, entry, idPrefix) => {
    let saved = entry
    setData((prev) => {
      const list = prev[listKey] || []
      if (entry.id && list.some((x) => x.id === entry.id)) {
        saved = { ...list.find((x) => x.id === entry.id), ...entry }
        return { ...prev, [listKey]: list.map((x) => (x.id === entry.id ? saved : x)) }
      }
      saved = { ...entry, id: entry.id || makeId(idPrefix), createdAt: new Date().toISOString() }
      // First item of its kind becomes the default automatically.
      if (list.length === 0) saved.isDefault = true
      return { ...prev, [listKey]: [...list, saved] }
    })
    return saved
  }, [])

  const removeFrom = useCallback((listKey, id) => {
    setData((prev) => {
      const list = (prev[listKey] || []).filter((x) => x.id !== id)
      // Never leave a list with no default.
      if (list.length && !list.some((x) => x.isDefault)) list[0] = { ...list[0], isDefault: true }
      return { ...prev, [listKey]: list }
    })
  }, [])

  const makeDefault = useCallback((listKey, id) => {
    setData((prev) => ({
      ...prev,
      [listKey]: (prev[listKey] || []).map((x) => ({ ...x, isDefault: x.id === id })),
    }))
  }, [])

  // ---- orders ----------------------------------------------------------
  const saveOrder = useCallback(
    (order) => {
      const full = { ...order, userId: session?.userId || null }
      setOrders((prev) => [full, ...prev.filter((o) => o.id !== full.id)])
      return full
    },
    [session]
  )

  const getOrder = useCallback((id) => orders.find((o) => o.id === id) || null, [orders])

  const user = useMemo(
    () => (session ? users.find((u) => u.id === session.userId) || null : null),
    [session, users]
  )

  const value = useMemo(
    () => ({
      hydrated,
      user,
      isLoggedIn: !!user,
      signUp,
      logIn,
      logOut,

      addresses: data.addresses || [],
      payments: data.payments || [],
      reminders: data.reminders || [],
      orders,
      myOrders: orders.filter((o) => (user ? o.userId === user.id : o.userId === null)),

      saveAddress: (a) => upsert('addresses', a, 'ADR'),
      removeAddress: (id) => removeFrom('addresses', id),
      setDefaultAddress: (id) => makeDefault('addresses', id),

      savePayment: (p) => upsert('payments', p, 'PAY'),
      removePayment: (id) => removeFrom('payments', id),
      setDefaultPayment: (id) => makeDefault('payments', id),

      saveReminder: (r) => upsert('reminders', r, 'REM'),
      removeReminder: (id) => removeFrom('reminders', id),

      saveOrder,
      getOrder,
    }),
    [hydrated, user, signUp, logIn, logOut, data, orders, upsert, removeFrom, makeDefault, saveOrder, getOrder]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
