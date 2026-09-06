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

export function Stars({ rating, size = 13 }) {
  return (
    <span className="p-rating" aria-label={`${rating} out of 5 stars`}>
      <StarIcon style={{ width: size, height: size }} />
      <span className="num">{rating.toFixed(1)}</span>
    </span>
  )
}
