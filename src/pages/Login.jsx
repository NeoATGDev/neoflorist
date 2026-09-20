import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useSeo } from '../hooks/useSeo.js'
import { EMAIL_RE } from '../lib/india.js'
import { LockIcon } from '../components/Icons.jsx'

export default function Login() {
  useSeo({
    title: 'Log in — NeoFlorist',
    description: 'Log in to your NeoFlorist account to use saved addresses, payment methods and reminders.',
  })

  const { hydrated, isLoggedIn, logIn, signUp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const next = new URLSearchParams(location.search).get('next') || '/account'

  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')

  // Already signed in? Don't sit on the login screen.
  useEffect(() => {
    if (hydrated && isLoggedIn) navigate(next, { replace: true })
  }, [hydrated, isLoggedIn, navigate, next])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  function submit(e) {
    e.preventDefault()
    const errs = {}
    if (mode === 'signup' && !form.name.trim()) errs.name = 'Enter your name'
    if (!EMAIL_RE.test(form.email.trim())) errs.email = 'Enter a valid email address'
    if (form.password.length < 6) errs.password = 'Use at least 6 characters'
    if (mode === 'signup' && form.password !== form.confirm) errs.confirm = 'Passwords do not match'
    setErrors(errs)
    setFormError('')
    if (Object.keys(errs).length) return

    const result =
      mode === 'signup'
        ? signUp({ name: form.name, email: form.email, password: form.password })
        : logIn({ email: form.email, password: form.password })

    if (!result.ok) {
      setFormError(result.error)
      return
    }
    navigate(next, { replace: true })
  }

  function switchMode(m) {
    setMode(m)
    setErrors({})
    setFormError('')
  }

  return (
    <section className="band">
      <div className="wrap auth-wrap">
        <div className="auth-card rise">
          <div className="auth-switch" role="tablist" aria-label="Log in or create an account">
            <button
              role="tab"
              aria-selected={mode === 'login'}
              className={mode === 'login' ? 'active' : ''}
              onClick={() => switchMode('login')}
            >
              Log in
            </button>
            <button
              role="tab"
              aria-selected={mode === 'signup'}
              className={mode === 'signup' ? 'active' : ''}
              onClick={() => switchMode('signup')}
            >
              Create account
            </button>
          </div>

          <h1 className="display" style={{ fontSize: 28, marginBottom: 6 }}>
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="hint" style={{ marginBottom: 20 }}>
            {mode === 'login'
              ? 'Your saved addresses, payment methods and reminders are waiting.'
              : 'Save addresses and payment methods, and set reminders so you never miss a date.'}
          </p>

          <form onSubmit={submit} noValidate>
            <div className="form-grid">
              {mode === 'signup' && (
                <div className="field field--full">
                  <label htmlFor="auth-name">Full name</label>
                  <input id="auth-name" value={form.name} onChange={set('name')} autoComplete="name" />
                  {errors.name && <p className="field-error">{errors.name}</p>}
                </div>
              )}

              <div className="field field--full">
                <label htmlFor="auth-email">Email</label>
                <input
                  id="auth-email"
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  autoComplete="email"
                  placeholder="you@example.com"
                />
                {errors.email && <p className="field-error">{errors.email}</p>}
              </div>

              <div className="field field--full">
                <label htmlFor="auth-password">Password</label>
                <input
                  id="auth-password"
                  type="password"
                  value={form.password}
                  onChange={set('password')}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                />
                {errors.password && <p className="field-error">{errors.password}</p>}
              </div>

              {mode === 'signup' && (
                <div className="field field--full">
                  <label htmlFor="auth-confirm">Confirm password</label>
                  <input
                    id="auth-confirm"
                    type="password"
                    value={form.confirm}
                    onChange={set('confirm')}
                    autoComplete="new-password"
                  />
                  {errors.confirm && <p className="field-error">{errors.confirm}</p>}
                </div>
              )}
            </div>

            {formError && <p className="alert alert--bad">{formError}</p>}

            <button className="btn btn--primary btn--block" type="submit" style={{ marginTop: 18 }}>
              {mode === 'login' ? 'Log in' : 'Create account'}
            </button>
          </form>

          <p className="auth-note">
            <LockIcon />
            <span>
              Demo build: accounts are stored in this browser only (localStorage) and never leave your device.
              Don’t reuse a real password. Phase 2 moves sign-in to the Spring Boot backend.
            </span>
          </p>
        </div>

        <aside className="auth-aside">
          <h2 className="display" style={{ fontSize: 24 }}>Why an account?</h2>
          <ul className="tick-list">
            <li>Check out in two taps with a saved address</li>
            <li>Keep a House Account or saved card on file</li>
            <li>Get birthday and anniversary reminders before the date</li>
            <li>Re-order past bouquets from your order history</li>
          </ul>
          <p className="hint" style={{ marginTop: 18 }}>
            Prefer not to sign up? You can still <Link to="/checkout">check out as a guest</Link>.
          </p>
        </aside>
      </div>
    </section>
  )
}
