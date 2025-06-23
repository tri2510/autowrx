import React from 'react'

type Props = {
  data: {
    size: number // radar radius in px
    spokes: number // number of radial lines
    rings?: number // how many concentric rings (default 5)
  }
}

const GRAY = '#f3f4f6' // tailwind “bg-zinc-200”
const WHITE = '#ffffff'

const RadarBackgroundNode: React.FC<Props> = ({ data }) => {
  const { size, spokes, rings = 5 } = data

  // helper to decide fill color for ring i (1 = innermost, rings = outermost)
  const fillColor = (i: number) => (i % 2 === 1 ? GRAY : WHITE)

  return (
    <svg width={size * 2} height={size * 2} style={{ pointerEvents: 'none' }}>
      {/* 1) draw filled bands from outermost (i=rings) → innermost (i=1) */}
      {Array.from({ length: rings }).map((_, idx) => {
        const ringIndex = rings - idx // rings, rings-1, …, 1
        const r = (ringIndex / rings) * size
        return (
          <circle
            key={`fill-${ringIndex}`}
            cx={size}
            cy={size}
            r={r}
            fill={fillColor(ringIndex)}
          />
        )
      })}

      {/* 2) draw all ring‐outlines on top */}
      {Array.from({ length: rings }).map((_, idx) => {
        const r = ((idx + 1) / rings) * size
        return (
          <circle
            key={`ring-${idx}`}
            cx={size}
            cy={size}
            r={r}
            fill="none"
            stroke="rgba(0,0,0,0.1)"
            strokeWidth={1.5}
          />
        )
      })}

      {/* 3) draw spokes */}
      {Array.from({ length: spokes }).map((_, i) => {
        const angle = (2 * Math.PI * i) / spokes - Math.PI / 2
        const x2 = size + Math.cos(angle) * size
        const y2 = size + Math.sin(angle) * size

        return (
          <line
            key={`spoke-${i}`}
            x1={size}
            y1={size}
            x2={x2}
            y2={y2}
            stroke="rgba(0,0,0,0.1)"
            strokeWidth={1.5}
          />
        )
      })}
    </svg>
  )
}

export default RadarBackgroundNode
