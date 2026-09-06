import React from 'react'
import { CheckIcon } from './Icons.jsx'
import { useCart } from '../context/CartContext.jsx'

export default function Toast() {
  const { toast } = useCart()
  if (!toast) return null
  return (
    <div className="toast" role="status">
      <CheckIcon />
      {toast}
    </div>
  )
}
