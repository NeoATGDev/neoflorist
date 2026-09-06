import React, { useId, useMemo } from 'react'

/* ------------------------------------------------------------------
   FlowerArt — every product image on this site is generated from its
   `art` spec (type, palette, stem count, wrap colour, seed), never a
   traced or photographed flower. Recolouring a real product photo
   would still be a derivative of a copyrighted image; this draws
   shaded, gradient-lit blooms from geometry instead, so every result
   here is original. Deterministic per seed, so the picture never
   changes between renders of the same product.

   Every gradient/filter id is prefixed with this instance's React
   useId() — a category page renders 25 of these side by side, so
   without a per-instance prefix every card's <defs> would collide
   under the same ids and silently borrow each other's gradients.
   useId() (not Math.random()) also keeps server-rendered and
   hydrated markup identical.
   ------------------------------------------------------------------ */

function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16)
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) =>
    Math.max(0, Math.min(255, Math.round(v * k)))
  )
  return `rgb(${c[0]},${c[1]},${c[2]})`
}

function mix(hex, otherHex, t) {
  const p = (h) => [(h >> 16) & 255, (h >> 8) & 255, h & 255]
  const a = p(parseInt(hex.slice(1), 16))
  const b = p(parseInt(otherHex.slice(1), 16))
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t))
  return `rgb(${c[0]},${c[1]},${c[2]})`
}

// One radial gradient per palette colour: a warm light tint at the base
// of the petal fanning out to the true colour at the tip, so petals read
// as lit from within rather than flat-filled shapes.
function petalGradientDefs(gid, palette) {
  return palette.slice(0, 4).map((c, i) => (
    <radialGradient key={`pg${i}`} id={`${gid}-p${i}`} cx="35%" cy="25%" r="80%">
      <stop offset="0%" stopColor={mix(c, '#FFFFFF', 0.55)} />
      <stop offset="55%" stopColor={c} />
      <stop offset="100%" stopColor={shade(c, 0.82)} />
    </radialGradient>
  ))
}

function vesselGradient(gid, id, hex, dir = 'v') {
  const x2 = dir === 'v' ? '0%' : '100%'
  const y2 = dir === 'v' ? '100%' : '0%'
  return (
    <linearGradient key={id} id={`${gid}-${id}`} x1="0%" y1="0%" x2={x2} y2={y2}>
      <stop offset="0%" stopColor={mix(hex, '#FFFFFF', 0.28)} />
      <stop offset="55%" stopColor={hex} />
      <stop offset="100%" stopColor={shade(hex, 0.72)} />
    </linearGradient>
  )
}

function sharedDefs(gid, palette, vesselHex) {
  return (
    <defs>
      {petalGradientDefs(gid, palette)}
      <radialGradient id={`${gid}-centre`} cx="40%" cy="35%" r="70%">
        <stop offset="0%" stopColor={mix(palette[2] || shade(palette[0], 0.6), '#FFD9A0', 0.35)} />
        <stop offset="100%" stopColor={shade(palette[2] || palette[0], 0.5)} />
      </radialGradient>
      <linearGradient id={`${gid}-leaf`} x1="0%" y1="0%" x2="60%" y2="100%">
        <stop offset="0%" stopColor="#8FBF9A" />
        <stop offset="100%" stopColor="#3E6B52" />
      </linearGradient>
      <linearGradient id={`${gid}-leaf2`} x1="0%" y1="0%" x2="60%" y2="100%">
        <stop offset="0%" stopColor="#A9CDA0" />
        <stop offset="100%" stopColor="#4C7A5E" />
      </linearGradient>
      {vesselHex && vesselGradient(gid, 'vessel', vesselHex)}
      <radialGradient id={`${gid}-ground`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="rgba(30,22,14,0.30)" />
        <stop offset="100%" stopColor="rgba(30,22,14,0)" />
      </radialGradient>
    </defs>
  )
}

function groundShadow(cx, cy, rx, gid, key = 'ground') {
  return <ellipse key={key} cx={cx} cy={cy} rx={rx} ry={rx * 0.22} fill={`url(#${gid}-ground)`} />
}

// A single bloom: two staggered rings of gradient-lit petals around a
// textured centre, a soft highlight streak on the frontmost petals, and
// a scatter of stamen flecks — enough layering to read as dimensional
// at card size rather than a flat rosette icon.
function bloom(cx, cy, r, gid, palette, rng, key) {
  const petalCount = 6 + Math.floor(rng() * 3)
  const rot0 = rng() * 60
  const els = []

  const ring = (count, radiusMul, sizeMul, rot, colourOffset) => {
    for (let i = 0; i < count; i++) {
      const angle = rot + (360 / count) * i
      const rad = (angle * Math.PI) / 180
      const off = r * radiusMul
      const px = cx + Math.cos(rad) * off
      const py = cy + Math.sin(rad) * off
      const colourIdx = (i + colourOffset) % Math.max(1, Math.min(palette.length, 2))
      els.push(
        <ellipse
          key={`${key}-r${radiusMul}-${i}`}
          cx={px} cy={py}
          rx={r * 0.32 * sizeMul} ry={r * 0.58 * sizeMul}
          fill={`url(#${gid}-p${colourIdx})`}
          stroke={shade(palette[colourIdx] || palette[0], 0.75)}
          strokeWidth={r * 0.02}
          strokeOpacity="0.4"
          transform={`rotate(${angle + 90} ${px} ${py})`}
        />
      )
      // midrib texture line down the petal
      els.push(
        <line
          key={`${key}-vein${radiusMul}-${i}`}
          x1={px} y1={py - r * 0.5 * sizeMul} x2={px} y2={py + r * 0.42 * sizeMul}
          stroke={shade(palette[colourIdx] || palette[0], 0.7)}
          strokeWidth={r * 0.014} strokeOpacity="0.35"
          transform={`rotate(${angle + 90} ${px} ${py})`}
        />
      )
    }
  }

  // back ring (slightly smaller, offset rotation) then front ring on top
  ring(petalCount, 0.42, 0.86, rot0 + 180 / petalCount, 1)
  ring(petalCount, 0.5, 1, rot0, 0)

  // glossy highlight on the two most "frontmost" petals (pointing up-left,
  // toward the implied light source)
  ;[rot0 - 20, rot0 + 40].forEach((angle, i) => {
    const rad = (angle * Math.PI) / 180
    const off = r * 0.42
    const hx = cx + Math.cos(rad) * off
    const hy = cy + Math.sin(rad) * off
    els.push(
      <ellipse key={`${key}-hi${i}`} cx={hx} cy={hy - r * 0.12} rx={r * 0.1} ry={r * 0.22}
        fill="#FFFFFF" opacity="0.28" transform={`rotate(${angle + 90} ${hx} ${hy})`} />
    )
  })

  // textured centre + stamen flecks
  els.push(<circle key={`${key}-c`} cx={cx} cy={cy} r={r * 0.28} fill={`url(#${gid}-centre)`} />)
  const flecks = 5 + Math.floor(rng() * 3)
  for (let i = 0; i < flecks; i++) {
    const a = (360 / flecks) * i + rng() * 20
    const rad = (a * Math.PI) / 180
    const fr = r * (0.1 + rng() * 0.12)
    els.push(
      <circle key={`${key}-fleck${i}`} cx={cx + Math.cos(rad) * fr} cy={cy + Math.sin(rad) * fr}
        r={r * 0.028} fill="#FFD9A0" opacity="0.85" />
    )
  }

  return els
}

function leaf(x1, y1, x2, y2, width, gradId, key, veinColor = 'rgba(20,30,20,0.28)') {
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const dx = y2 - y1
  const dy = -(x2 - x1)
  const len = Math.hypot(dx, dy) || 1
  const nx = (dx / len) * width
  const ny = (dy / len) * width
  return (
    <g key={key}>
      <path
        d={`M ${x1} ${y1} Q ${mx + nx} ${my + ny} ${x2} ${y2} Q ${mx - nx} ${my - ny} ${x1} ${y1} Z`}
        fill={`url(#${gradId})`}
      />
      <path d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`} stroke={veinColor} strokeWidth={Math.max(0.6, width * 0.12)} fill="none" />
    </g>
  )
}

function fanLayout(n, spread = 130, radius = 62) {
  const pts = []
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i / (n - 1) - 0.5
    const angle = t * spread
    const rad = (angle * Math.PI) / 180
    pts.push({
      dx: Math.sin(rad) * radius,
      dy: -Math.cos(rad) * radius * 0.72,
      size: 1 - Math.abs(t) * 0.32,
    })
  }
  return pts
}

function buildBouquet(spec, rng, gid) {
  const { palette, stemCount, wrap } = spec
  const cx = 120
  const baseY = 168
  const els = [groundShadow(cx, 222, 58, gid)]

  els.push(
    <path key="wrap" d={`M ${cx - 46} ${baseY + 4} L ${cx} ${baseY - 30} L ${cx + 46} ${baseY + 4} L ${cx + 30} 220 L ${cx - 30} 220 Z`}
      fill={`url(#${gid}-vessel)`} stroke="rgba(43,38,32,0.16)" strokeWidth="1.2" />,
    <path key="wrap-fold" d={`M ${cx} ${baseY - 30} L ${cx - 8} 220 M ${cx} ${baseY - 30} L ${cx + 8} 220`}
      stroke="rgba(43,38,32,0.12)" strokeWidth="1" fill="none" />,
    <path key="wrap-shine" d={`M ${cx - 30} ${baseY + 2} L ${cx - 8} ${baseY - 24} L ${cx - 2} ${baseY - 24} L ${cx - 20} 214 Z`}
      fill="#FFFFFF" opacity="0.18" />
  )
  els.push(<rect key="ribbon" x={cx - 30} y={196} width={60} height={9} rx={2} fill={shade(palette[0], 0.85)} opacity="0.92" />)
  els.push(<rect key="ribbon-hi" x={cx - 30} y={196} width={60} height={3} rx={1.5} fill="#FFFFFF" opacity="0.25" />)

  const layout = fanLayout(stemCount)
  layout.forEach((p, i) => {
    els.push(
      <line key={`stem${i}`} x1={cx} y1={baseY - 20} x2={cx + p.dx * 0.4} y2={baseY - 30 + p.dy * 0.5}
        stroke="#4C7A5E" strokeWidth="2" opacity="0.6" />
    )
  })
  ;[-1, 1].forEach((side, i) => {
    els.push(leaf(cx, baseY - 24, cx + side * 58, baseY - 70, 9, `${gid}-leaf`, `gr${i}`))
  })

  const order = layout.map((p, i) => ({ ...p, i })).sort((a, b) => a.size - b.size)
  order.forEach(({ dx, dy, size, i }) => {
    const bx = cx + dx
    const by = baseY - 55 + dy
    els.push(...bloom(bx, by, 30 * size, gid, palette, rng, `bl${i}`))
  })

  return { els, vb: '0 0 240 240', vesselHex: wrap }
}

function buildPlant(spec, rng, gid) {
  const { palette, stemCount } = spec
  const cx = 120
  const rimY = 176
  const els = [groundShadow(cx, 228, 46, gid)]

  els.push(
    <path key="pot" d={`M 82 ${rimY} L 158 ${rimY} L 148 226 L 92 226 Z`} fill={`url(#${gid}-vessel)`} />,
    <path key="pot-shine" d={`M 92 226 L 100 ${rimY + 4} L 106 ${rimY + 4} L 99 226 Z`} fill="#FFFFFF" opacity="0.16" />,
    <ellipse key="rim" cx={cx} cy={rimY} rx={38} ry={8} fill={shade('#C79A5D', 1)} />,
    <ellipse key="rim-hi" cx={cx - 8} cy={rimY - 1.5} rx={14} ry={2.4} fill="#FFFFFF" opacity="0.3" />,
    <ellipse key="soil" cx={cx} cy={rimY} rx={30} ry={5} fill="#3E3226" />
  )

  const isOrchid = spec.sub === 'orchid'

  if (isOrchid) {
    const stems = Math.max(1, stemCount)
    for (let s = 0; s < stems; s++) {
      const dir = s % 2 === 0 ? 1 : -1
      const x0 = cx + dir * 6
      const cx1 = cx + dir * 40
      const cy1 = rimY - 70
      const x2 = cx + dir * 34 + (s > 1 ? dir * 14 : 0)
      const y2 = rimY - 118 - s * 6
      els.push(
        <path key={`stem${s}`} d={`M ${x0} ${rimY - 6} Q ${cx1} ${cy1} ${x2} ${y2}`}
          stroke="#3E6B52" strokeWidth="3" fill="none" />
      )
      const blooms = 2 + Math.floor(rng() * 2)
      for (let b = 0; b < blooms; b++) {
        const t = (b + 1) / (blooms + 1)
        const bx = x0 + (x2 - x0) * t + dir * 10
        const by = (rimY - 6) + (y2 - (rimY - 6)) * t - 6
        els.push(...bloom(bx, by, 16, gid, palette, rng, `orb${s}-${b}`))
      }
    }
    els.push(leaf(cx - 4, rimY - 4, cx - 26, rimY - 46, 7, `${gid}-leaf`, 'leafA'))
    els.push(leaf(cx + 4, rimY - 4, cx + 24, rimY - 44, 7, `${gid}-leaf`, 'leafB'))
  } else {
    const leaves = 5 + stemCount
    for (let i = 0; i < leaves; i++) {
      const t = leaves === 1 ? 0 : i / (leaves - 1) - 0.5
      const angle = t * 100
      const rad = (angle * Math.PI) / 180
      const len = 60 + rng() * 26
      const tipX = cx + Math.sin(rad) * len * 0.9
      const tipY = rimY - 10 - Math.cos(rad) * len
      const g = i % 2 === 0 ? `${gid}-leaf` : `${gid}-leaf2`
      els.push(leaf(cx, rimY - 6, tipX, tipY, 8 + rng() * 4, g, `leaf${i}`))
    }
  }

  return { els, vb: '0 0 240 240', vesselHex: '#B8894F' }
}

function buildBasket(spec, rng, gid) {
  const { palette, stemCount } = spec
  const cx = 112
  const rimY = 178
  const baseW = 70
  const els = [groundShadow(cx, 234, 62, gid)]

  els.push(
    <path key="basket-body"
      d={`M ${cx - baseW} ${rimY} Q ${cx - baseW - 6} ${rimY + 30} ${cx - baseW + 16} ${rimY + 46}
          L ${cx + baseW - 16} ${rimY + 46} Q ${cx + baseW + 6} ${rimY + 30} ${cx + baseW} ${rimY} Z`}
      fill={`url(#${gid}-vessel)`} stroke="rgba(43,38,32,0.18)" strokeWidth="1.2" />
  )
  for (let i = -3; i <= 3; i++) {
    const x = cx + i * (baseW / 3.6)
    els.push(
      <path key={`rib${i}`} d={`M ${x} ${rimY + 4} Q ${x + i * 1.5} ${rimY + 24} ${x + i * 3} ${rimY + 44}`}
        stroke="rgba(43,38,32,0.22)" strokeWidth="1.4" fill="none" />
    )
  }
  for (let row = 0; row < 3; row++) {
    const y = rimY + 12 + row * 12
    const inset = row * 5
    els.push(
      <path key={`band${row}`} d={`M ${cx - baseW + inset} ${y} Q ${cx} ${y + 6} ${cx + baseW - inset} ${y}`}
        stroke="rgba(255,255,255,0.22)" strokeWidth="1.6" fill="none" />,
      <path key={`bandsh${row}`} d={`M ${cx - baseW + inset} ${y + 2.4} Q ${cx} ${y + 8.4} ${cx + baseW - inset} ${y + 2.4}`}
        stroke="rgba(43,38,32,0.18)" strokeWidth="1.4" fill="none" />
    )
  }
  els.push(
    <ellipse key="rim" cx={cx} cy={rimY} rx={baseW + 4} ry={11} fill={shade('#C79A5D', 1)} stroke="rgba(43,38,32,0.16)" strokeWidth="1" />,
    <ellipse key="rim-hi" cx={cx - 20} cy={rimY - 2} rx={20} ry={3} fill="#FFFFFF" opacity="0.28" />,
    <path key="handleL" d={`M ${cx - baseW + 10} ${rimY - 2} Q ${cx - baseW - 16} ${rimY - 34} ${cx - baseW + 22} ${rimY - 40}`}
      stroke="#8A6033" strokeWidth="4.5" fill="none" strokeLinecap="round" />,
    <path key="handleL-hi" d={`M ${cx - baseW + 10} ${rimY - 3} Q ${cx - baseW - 15} ${rimY - 34} ${cx - baseW + 22} ${rimY - 41}`}
      stroke="#C79A5D" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.7" />,
    <path key="handleR" d={`M ${cx + baseW - 10} ${rimY - 2} Q ${cx + baseW + 16} ${rimY - 34} ${cx + baseW - 22} ${rimY - 40}`}
      stroke="#8A6033" strokeWidth="4.5" fill="none" strokeLinecap="round" />,
    <path key="handleR-hi" d={`M ${cx + baseW - 10} ${rimY - 3} Q ${cx + baseW + 15} ${rimY - 34} ${cx + baseW - 22} ${rimY - 41}`}
      stroke="#C79A5D" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.7" />
  )

  const boxHex = shade(palette[2] || palette[0], 1.05)
  els.push(
    <rect key="box" x={cx + baseW - 14} y={rimY - 2} width={28} height={24} rx={2} fill={boxHex} />,
    <rect key="box-shade" x={cx + baseW + 2} y={rimY - 2} width={12} height={24} rx={2} fill="rgba(0,0,0,0.14)" />,
    <rect key="box-lid" x={cx + baseW - 17} y={rimY - 9} width={34} height={9} rx={2} fill={palette[2] || palette[0]} />,
    <rect key="box-ribbon" x={cx + baseW - 3} y={rimY - 9} width={6} height={31} fill="#FBEFE3" opacity="0.9" />
  )

  const layout = fanLayout(Math.max(3, stemCount), 138, 46)
  const order = layout.map((p, i) => ({ ...p, i })).sort((a, b) => a.size - b.size)
  order.forEach(({ dx, dy, size, i }) => {
    const bx = cx - 8 + dx * 0.9
    const by = rimY - 30 + dy * 0.75
    els.push(...bloom(bx, by, 25 * size, gid, palette, rng, `bb${i}`))
  })
  els.push(leaf(cx - baseW + 18, rimY - 6, cx - baseW - 2, rimY - 34, 7, `${gid}-leaf`, 'bgr1'))
  els.push(leaf(cx + baseW - 30, rimY - 6, cx + baseW - 8, rimY - 30, 6, `${gid}-leaf2`, 'bgr2'))

  return { els, vb: '0 0 240 250', vesselHex: '#B8894F' }
}

const BUILDERS = { rose: buildBouquet, mixed: buildBouquet, plant: buildPlant, basket: buildBasket }

export default function FlowerArt({ art, className, label }) {
  const rawId = useId()
  const gid = `fa${rawId.replace(/[^a-zA-Z0-9]/g, '')}`

  const { els, vb, vesselHex } = useMemo(() => {
    const rng = mulberry32(art.seed)
    const build = BUILDERS[art.type] || buildBouquet
    return build(art, rng, gid)
  }, [art, gid])

  return (
    <svg
      className={className}
      viewBox={vb}
      role="img"
      aria-label={label || 'Illustration of the arrangement'}
    >
      {sharedDefs(gid, art.palette, vesselHex)}
      {els}
    </svg>
  )
}
