// src/molecules/prototype_requirements/DaRequirementExplorer.tsx
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
import { useRequirementStore } from './hook/useRequirementStore'

const nodeTypes = {
  radarBackground: RadarBackgroundNode,
  requirementNode: RequirementNode,
}

const MAX_RADIUS = 600 // maximum radar radius
const MIN_RADIUS = 50 // never go inside this ring
const MAX_RATING = 5 // 1…5 scale
const NODE_SIZE = 60 // diameter in px
const DIST_COEFF = 1.5 // spread factor

interface Props {
  onDelete: (id: string) => void
}

const DaRequirementExplorer: React.FC<Props> = ({ onDelete }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const { requirements } = useRequirementStore()

  const initialNodes = useMemo(() => {
    const reqs = requirements
    const total = reqs.length
    const isSingle = total === 1

    // angle between spokes
    const angleStep = isSingle ? 0 : (2 * Math.PI) / total

    // ensure spokes never overlap
    const safeMinByAngle =
      total > 1 ? NODE_SIZE / (2 * Math.sin(angleStep / 2)) : 0
    const effectiveMinRadius = isSingle
      ? MIN_RADIUS
      : Math.max(MIN_RADIUS, safeMinByAngle)

    // 1) Background node
    const bgNode = {
      id: 'radar-bg',
      type: 'radarBackground',
      position: { x: -MAX_RADIUS, y: -MAX_RADIUS },
      data: { size: MAX_RADIUS, spokes: 8, rings: 5 },
      style: { pointerEvents: 'none' },
    }

    // 2) Map each requirement to a node
    const reqNodes = reqs.map((req, i) => {
      let x = 0
      let y = 0

      if (!isSingle) {
        // angle offset so first sits at “12 o’clock”
        const angle = i * angleStep - Math.PI / 2

        // compute normalized relevance score
        const avgScore =
          (req.rating.priority + req.rating.relevance + req.rating.impact) / 3
        const norm = avgScore / MAX_RATING // 0…1

        // convert to radius
        const baseR = (1 - norm) * MAX_RADIUS
        const scaledR = baseR * DIST_COEFF
        const radius = Math.max(
          effectiveMinRadius,
          Math.min(scaledR, MAX_RADIUS),
        )

        x = radius * Math.cos(angle)
        y = radius * Math.sin(angle)

        // final clamp so we never drift outside/inside
        const finalR = Math.hypot(x, y)
        if (finalR > MAX_RADIUS) {
          const f = MAX_RADIUS / finalR
          x *= f
          y *= f
        } else if (finalR < effectiveMinRadius) {
          const f = effectiveMinRadius / finalR
          x *= f
          y *= f
        }
      }

      const color = req.source.type === 'internal' ? '#005072' : '#aebd38'

      return {
        id: `req-${req.id}`,
        type: 'requirementNode',
        position: { x, y },
        data: {
          id: req.id,
          title: req.title,
          description: req.description,
          type: req.type,
          ratingAvg:
            (req.rating.priority + req.rating.relevance + req.rating.impact) /
            3,
          rating: req.rating,
          source: req.source,
          creatorUserId: req.creatorUserId,
          color,
          showHandles: false,
          requirement: req,
          onDelete,
        },
      }
    })

    return [bgNode, ...reqNodes]
  }, [requirements, onDelete])

  // push into ReactFlow
  useEffect(() => {
    setNodes(initialNodes as any)
  }, [initialNodes, setNodes])

  return (
    <div className="flex w-full h-full max-h-[calc(100%-10px)] rounded-xl overflow-hidden">
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
