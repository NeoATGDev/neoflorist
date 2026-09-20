import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import AccountLayout from '../components/AccountLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useSeo } from '../hooks/useSeo.js'
import { CATEGORIES } from '../data/flowers.js'
import {
  OCCASIONS,
  countdownLabel,
  daysUntil,
  fmtDate,
  nextOccurrence,
  notifyOn,
  sortByNext,
} from '../lib/reminders.js'
import { BellIcon, PencilIcon, PlusIcon, TrashIcon } from '../components/Icons.jsx'

const blank = {
  person: '',
  occasion: 'Birthday',
  date: '',
  leadDays: 3,
  channel: 'email',
  giftIdea: '',
  note: '',
}

export default function AccountReminders() {
  useSeo({
    title: 'Reminders — NeoFlorist',
    description: 'Set birthday and anniversary reminders so you never miss a date.',
  })
  const { reminders, saveReminder, removeReminder, user } = useAuth()

  const [draft, setDraft] = useState(null)
  const [errors, setErrors] = useState({})

  const sorted = [...reminders].sort(sortByNext)
  const set = (k) => (e) => setDraft((d) => ({ ...d, [k]: e.target.value }))

  function submit(e) {
    e.preventDefault()
    const errs = {}
    if (!draft.person.trim()) errs.person = 'Who is this for?'
    if (!draft.date) errs.date = 'Pick the date'
    setErrors(errs)
    if (Object.keys(errs).length) return
    saveReminder({ ...draft, person: draft.person.trim(), leadDays: Number(draft.leadDays) })
    setDraft(null)
  }

  return (
    <AccountLayout
      title="Reminders"
      lede="Tell us the dates that matter and we’ll nudge you in time to send flowers."
      actions={
        !draft && (
          <button className="btn btn--primary" onClick={() => { setDraft({ ...blank }); setErrors({}) }}>
            <PlusIcon style={{ width: 16, height: 16 }} /> Add reminder
          </button>
        )
      }
    >
      {draft ? (
        <form className="panel" onSubmit={submit} noValidate>
          <h3 className="panel-title">{draft.id ? 'Edit reminder' : 'New reminder'}</h3>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="rm-person">Who is it for?</label>
              <input id="rm-person" value={draft.person} onChange={set('person')} placeholder="Nitu’s birthday" />
              {errors.person && <p className="field-error">{errors.person}</p>}
            </div>

            <div className="field">
              <label htmlFor="rm-occasion">Occasion</label>
              <select id="rm-occasion" value={draft.occasion} onChange={set('occasion')}>
                {OCCASIONS.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>

            <div className="field">
              <label htmlFor="rm-date">Date</label>
              <input id="rm-date" type="date" value={draft.date} onChange={set('date')} />
              <p className="hint">Repeats every year on this day.</p>
              {errors.date && <p className="field-error">{errors.date}</p>}
            </div>

            <div className="field">
              <label htmlFor="rm-lead">Remind me</label>
              <select id="rm-lead" value={draft.leadDays} onChange={set('leadDays')}>
                <option value={0}>On the day</option>
                <option value={1}>1 day before</option>
                <option value={3}>3 days before</option>
                <option value={7}>1 week before</option>
                <option value={14}>2 weeks before</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="rm-channel">Notify by</label>
              <select id="rm-channel" value={draft.channel} onChange={set('channel')}>
                <option value="email">Email{user?.email ? ` (${user.email})` : ''}</option>
                <option value="sms">SMS</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="rm-gift">Usual gift <span className="opt">(optional)</span></label>
              <select id="rm-gift" value={draft.giftIdea} onChange={set('giftIdea')}>
                <option value="">No preference</option>
                {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </div>

            <div className="field field--full">
              <label htmlFor="rm-note">Note <span className="opt">(optional)</span></label>
              <textarea
                id="rm-note"
                rows={2}
                value={draft.note}
                onChange={set('note')}
                placeholder="Likes lilies, not roses. Deliver to the office before 11am."
              />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn--primary" type="submit">Save reminder</button>
            <button className="btn btn--ghost" type="button" onClick={() => setDraft(null)}>Cancel</button>
          </div>
        </form>
      ) : sorted.length === 0 ? (
        <div className="empty-panel">
          <BellIcon />
          <h3>No reminders yet</h3>
          <p>Add a birthday or anniversary and NeoFlorist will remind you before it comes round.</p>
          <button className="btn btn--primary" onClick={() => { setDraft({ ...blank }); setErrors({}) }}>
            Add your first reminder
          </button>
        </div>
      ) : (
        <div className="tile-list">
          {sorted.map((r) => {
            const days = daysUntil(r.date)
            const soon = days != null && days <= Number(r.leadDays || 0)
            return (
              <article className={`tile${soon ? ' tile--alert' : ''}`} key={r.id}>
                <div className="tile-head">
                  <span className="tile-tag"><BellIcon /> {r.occasion}</span>
                  <span className={`badge ${soon ? 'badge--rose' : 'badge--green'}`}>{countdownLabel(r.date)}</span>
                </div>
                <b>{r.person}</b>
                <p>{fmtDate(nextOccurrence(r.date))}</p>
                <p className="hint">
                  {Number(r.leadDays) === 0 ? 'On the day' : `${r.leadDays} day${Number(r.leadDays) === 1 ? '' : 's'} before`}
                  {' · '}by {r.channel}
                  {' · '}we’ll ping you on {fmtDate(notifyOn(r.date, r.leadDays))}
                </p>
                {r.note && <p className="tile-note">“{r.note}”</p>}
                <div className="tile-actions">
                  {r.giftIdea ? (
                    <Link to={`/category/${r.giftIdea}`}>Shop the usual</Link>
                  ) : (
                    <Link to="/">Browse gifts</Link>
                  )}
                  <button onClick={() => { setDraft({ ...r }); setErrors({}) }}><PencilIcon /> Edit</button>
                  <button className="danger" onClick={() => removeReminder(r.id)}><TrashIcon /> Remove</button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <p className="hint" style={{ marginTop: 22 }}>
        Demo build: reminders are stored in this browser and nothing is actually emailed. Phase 2 hands the
        schedule to the Spring Boot backend, which sends the reminder itself.
      </p>
    </AccountLayout>
  )
}
