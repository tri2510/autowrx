import React from 'react'

type Props = {
  data: {
    size: number // radar radius in px
    spokes: number // number of radial lines
    rings?: number // how many concentric rings (including outer)
  }
}

// A “background” node with an SVG circle + spokes + rings
const RadarBackgroundNode: React.FC<Props> = ({ data }) => {
  const { size, spokes, rings = 5 } = data

  return (
    <svg width={size * 2} height={size * 2} style={{ pointerEvents: 'none' }}>
      {/* concentric rings */}
      {Array.from({ length: rings }).map((_, idx) => {
        const ratio = (idx + 1) / rings
        const r = ratio * size

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

      {/* spokes */}
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
