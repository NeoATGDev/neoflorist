/* Date maths for the reminder list. All of this runs client-side only
   (reminders render after hydration), so using "today" here can't cause
   a server/client mismatch. */

export const OCCASIONS = ['Birthday', 'Anniversary', 'Wedding', 'Housewarming', 'Thank you', 'Other']

export const startOfToday = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

/* Reminders repeat every year, so "2025-03-14" means "every 14 March". */
export function nextOccurrence(isoDate) {
  const [, m, d] = String(isoDate).split('-').map(Number)
  if (!m || !d) return null
  const today = startOfToday()
  let next = new Date(today.getFullYear(), m - 1, d)
  if (next < today) next = new Date(today.getFullYear() + 1, m - 1, d)
  return next
}

export function daysUntil(isoDate) {
  const next = nextOccurrence(isoDate)
  if (!next) return null
  return Math.round((next - startOfToday()) / 86400000)
}

/* The date we'd nudge the customer, given their lead time. */
export function notifyOn(isoDate, leadDays) {
  const next = nextOccurrence(isoDate)
  if (!next) return null
  const n = new Date(next)
  n.setDate(n.getDate() - Number(leadDays || 0))
  return n
}

export const fmtDate = (d) =>
  d ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

export const fmtDay = (d) => (d ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '')

export function countdownLabel(isoDate) {
  const n = daysUntil(isoDate)
  if (n == null) return ''
  if (n === 0) return 'Today'
  if (n === 1) return 'Tomorrow'
  if (n <= 30) return `in ${n} days`
  return `in ${Math.round(n / 30)} months`
}

export const sortByNext = (a, b) => (daysUntil(a.date) ?? 9999) - (daysUntil(b.date) ?? 9999)
