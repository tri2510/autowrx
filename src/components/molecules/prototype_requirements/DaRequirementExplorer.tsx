// DaRequirementExplorer.tsx
import React, { useEffect, useMemo } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  useNodesState,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import RequirementNode from './nodes/RequirementNode'
import RadarBackgroundNode from './nodes/RadarBackgroundNode'
import mockRequirements from './mockup_requirements'

const nodeTypes = {
  radarBackground: RadarBackgroundNode,
  requirementNode: RequirementNode,
}

const MAX_RADIUS = 600 // Maximum radius of the radar in px
const MIN_RADIUS = 50 // Minimum radius of the radar in px
const MAX_RATING = 5 // Maximum rating value (1-5 scale)
const NODE_SIZE = 60 // Prevent nodes being too close together
const DISTANCE_COEFFICIENT = 1.5 // Prevent nodes from overlapping

function getPriorityColor(p: number): string {
  if (p >= 4) return '#ef4444'
  if (p >= 3) return '#fca5a5'
  if (p >= 2) return '#93c5fd'
  if (p >= 1) return '#3b82f6'
  return '#3b82f6'
}

const DaRequirementExplorer: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([])

  const initialNodes = useMemo(() => {
    const reqs = mockRequirements
    const total = reqs.length
    const angleStep = (2 * Math.PI) / total

    // Compute a true min-radius so adjacent rays never collide
    const safeMinByAngle = NODE_SIZE / (2 * Math.sin(angleStep / 2))
    const effectiveMinRadius = Math.max(MIN_RADIUS, safeMinByAngle)

    // 1) Background radar
    const bgNode = {
      id: 'radar-bg',
      type: 'radarBackground',
      position: { x: -MAX_RADIUS, y: -MAX_RADIUS },
      data: {
        size: MAX_RADIUS,
        spokes: 8,
        rings: 5,
      },
      style: { pointerEvents: 'none' }, // Prevent interaction with background
    }

    // 2) Place each requirement on its own ray
    const reqNodes = reqs.map((req, i) => {
      const angle = i * angleStep - Math.PI / 2

      // composite score & normalize
      const avgScore =
        (req.rating.relevance + req.rating.impact + req.rating.priority) / 3
      const normScore = avgScore / MAX_RATING // 0…1

      // a) unscaled radius
      const baseRadius = (1 - normScore) * MAX_RADIUS
      // b) apply coefficient
      const scaledRadius = baseRadius * DISTANCE_COEFFICIENT
      // c) clamp into [min, max]
      const radius = Math.max(
        effectiveMinRadius,
        Math.min(scaledRadius, MAX_RADIUS),
      )

      // polar → Cartesian
      let x = radius * Math.cos(angle)
      let y = radius * Math.sin(angle)

      // --- NEW: clamp *after* shift so we never exceed outer circle ---
      const finalR = Math.hypot(x, y)
      if (finalR > MAX_RADIUS) {
        const factor = MAX_RADIUS / finalR
        x *= factor
        y *= factor
      } else if (finalR < effectiveMinRadius) {
        const factor = effectiveMinRadius / finalR
        x *= factor
        y *= factor
      }
      // ------------------------------------------------------------------

      return {
        id: `req-${req.id}`,
        type: 'requirementNode',
        position: { x, y },
        data: {
          id: req.id,
          label: req.id,
          title: req.title,
          description: req.description,
          type: req.type,
          ratingAvg: avgScore,
          rating: req.rating,
          source: req.source,
          creatorUserId: req.creatorUserId,
          childRequirements: req.childRequirements,
          color: getPriorityColor(req.rating.priority),
          showHandles: false,
          requirement: req,
        },
      }
    })

    return [bgNode, ...reqNodes]
  }, [])

  useEffect(() => {
    setNodes(initialNodes as any)
  }, [initialNodes, setNodes])

  return (
    <div className="w-full h-[600px] rounded-xl overflow-hidden border">
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          onNodesChange={onNodesChange}
          nodeTypes={nodeTypes}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
        >
          <Background gap={16} color="#f8f8f8" />
          <Controls />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  )
}

export default DaRequirementExplorer
