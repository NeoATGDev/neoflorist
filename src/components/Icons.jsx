import React from 'react'

const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' }

export const SearchIcon = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
)
export const CartIcon = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}><path d="M3 4h2l2.4 12.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 8H6" /><circle cx="9.5" cy="21" r="1.4" fill="currentColor" stroke="none" /><circle cx="17.5" cy="21" r="1.4" fill="currentColor" stroke="none" /></svg>
)
export const StarIcon = (p) => (
  <svg viewBox="0 0 24 24" {...p}><path fill="currentColor" d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.4l-5.9 3.2 1.3-6.6-4.9-4.6 6.6-.8z" /></svg>
)
export const TruckIcon = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}><path d="M2 6h11v10H2z" /><path d="M13 10h4l4 3v3h-8z" /><circle cx="6" cy="19" r="1.6" /><circle cx="17.5" cy="19" r="1.6" /></svg>
)
export const ShieldIcon = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}><path d="M12 2.5l7.5 3.2v6c0 5-3.2 8.4-7.5 9.8-4.3-1.4-7.5-4.8-7.5-9.8v-6z" /><path d="M8.5 12l2.4 2.4 4.6-4.8" /></svg>
)
export const LeafIcon = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}><path d="M4 20c8-1 14-7 15-15-8 1-14 7-15 15z" /><path d="M4 20c4-4 8-8 12-12" /></svg>
)
export const ClockIcon = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></svg>
)
export const PinIcon = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}><path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z" /><circle cx="12" cy="9" r="2.4" /></svg>
)
export const XIcon = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}><path d="M5 5l14 14M19 5L5 19" /></svg>
)
export const CheckIcon = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}><path d="M4 12l5 5L20 6" /></svg>
)
export const MenuIcon = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}><path d="M3 6h18M3 12h18M3 18h18" /></svg>
)

export const UserIcon = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}><circle cx="12" cy="8" r="3.6" /><path d="M4.5 20c0-3.6 3.4-5.6 7.5-5.6s7.5 2 7.5 5.6" /></svg>
)
export const BellIcon = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}><path d="M6 9a6 6 0 1 1 12 0c0 4 1.4 5.6 2 6.4H4c.6-.8 2-2.4 2-6.4z" /><path d="M10 19a2 2 0 0 0 4 0" /></svg>
)
export const CardIcon = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}><rect x="2.5" y="5" width="19" height="14" rx="2.5" /><path d="M2.5 10h19" /><path d="M6 15h4" /></svg>
)
export const BankIcon = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}><path d="M3 9.5L12 4l9 5.5" /><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8" /><path d="M3 20.5h18" /></svg>
)
export const TrashIcon = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}><path d="M4 6.5h16" /><path d="M9 6.5V4.5h6v2" /><path d="M6 6.5l1 13.5h10l1-13.5" /></svg>
)
export const PlusIcon = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}><path d="M12 5v14M5 12h14" /></svg>
)
export const PencilIcon = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}><path d="M4 20l4.5-1 9-9-3.5-3.5-9 9z" /><path d="M14 6.5L17.5 10" /></svg>
)
export const LockIcon = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}><rect x="4.5" y="10" width="15" height="10" rx="2.4" /><path d="M8 10V7.5a4 4 0 0 1 8 0V10" /></svg>
)
export const BoxIcon = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}><path d="M3 7.5L12 3l9 4.5v9L12 21l-9-4.5z" /><path d="M3 7.5L12 12l9-4.5M12 12v9" /></svg>
)
export const ArrowLeftIcon = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
)
export const LogOutIcon = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}><path d="M14 4h4.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14" /><path d="M9 8l-4 4 4 4M5 12h10" /></svg>
)

export function Stars({ rating, size = 13 }) {
  return (
    <span className="p-rating" aria-label={`${rating} out of 5 stars`}>
      <StarIcon style={{ width: size, height: size }} />
      <span className="num">{rating.toFixed(1)}</span>
    </span>
  )
}
