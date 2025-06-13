import React, { useCallback, useEffect, useMemo } from 'react'
import {
  ReactFlow,
  Node,
  Edge,
  ConnectionLineType,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Position,
  Handle,
  NodeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Box, Typography } from '@mui/material'
import { Requirement, RequirementType } from '@/types/model.type'
import mockRequirements from './mockup_requirements'

// Custom node component for requirement bubbles
const RequirementNode: React.FC<NodeProps> = ({ data, isConnectable }) => {
  // Calculate node size based on rating average
  const ratingAvg = (data.ratingAvg as number) || 3
  const baseSize = 50 // Base size in pixels
  const size = baseSize + ratingAvg * 10

  // Style for requirement bubble
  const nodeStyle = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    backgroundColor: data.color || '#fff',
    color: '#fff',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '10px',
    textAlign: 'center' as const,
    fontSize: `12px`,
    fontWeight: 'bold' as const,
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    '&:hover': {
      transform: 'scale(1.05)',
      boxShadow: '0 6px 10px rgba(0, 0, 0, 0.15)',
    },
  }

  // Title truncation
  const titleStyle = {
    width: '200px',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    textAlign: 'center' as const,
    marginTop: '8px',
    fontSize: '12px',
    fontWeight: 'medium' as const,
  }

  return (
    <div>
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: '#555',
          visibility: data.showHandles ? 'visible' : 'hidden',
        }}
        isConnectable={isConnectable}
      />
      <Box sx={nodeStyle}>{data.label as React.ReactNode}</Box>
      <Typography sx={titleStyle} title={data.title as string}>
        {data.title as React.ReactNode}
      </Typography>
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: '#555',
          visibility: data.showHandles ? 'visible' : 'hidden',
        }}
        isConnectable={isConnectable}
      />
    </div>
  )
}

// Custom node for the central "Requirements" node
const CentralNode: React.FC<NodeProps> = ({ data, isConnectable }) => {
  return (
    <div>
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#555', visibility: 'hidden' }}
        isConnectable={isConnectable}
      />
      <Box
        sx={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          backgroundColor: '#2A2F45',
          color: '#fff',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: '16px',
          fontWeight: 'bold',
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
        }}
      >
        {data.label as React.ReactNode}
      </Box>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: '#555',
          visibility: data.showHandles ? 'visible' : 'hidden',
        }}
        isConnectable={isConnectable}
      />
    </div>
  )
}

// Custom node for requirement type nodes
const TypeNode: React.FC<NodeProps> = ({ data, isConnectable }) => {
  return (
    <div>
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: '#555',
          visibility: data.showHandles ? 'visible' : 'hidden',
        }}
        isConnectable={isConnectable}
      />
      <Box
        sx={{
          width: '180px',
          height: '60px',
          borderRadius: '30px',
          backgroundColor: data.color || '#666',
          color: '#fff',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '10px',
          textAlign: 'center',
          fontSize: '14px',
          fontWeight: 'bold',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
      >
        {data.label as React.ReactNode}
      </Box>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: '#555',
          visibility: data.showHandles ? 'visible' : 'hidden',
        }}
        isConnectable={isConnectable}
      />
    </div>
  )
}

// Define node types for ReactFlow
const nodeTypes = {
  requirementNode: RequirementNode,
  centralNode: CentralNode,
  typeNode: TypeNode,
}

const DaRequirementExplorer: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  // Color map for requirement types
  const typeColorMap: Record<RequirementType, string> = {
    'Functional Requirement': '#4caf50',
    'System Integration Requirement': '#2196f3',
    'Safety & Security Requirement': '#f44336',
    'User Experience Requirement': '#9c27b0',
    'Regulatory & Homologation Requirement': '#ff9800',
    'Operational Requirement': '#795548',
    'Deployment & Ecosystem Requirement': '#607d8b',
  }

  // Transform requirements data into nodes and edges
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = []
    const edges: Edge[] = []

    // Create a set of all child requirement IDs
    const childRequirementIds = new Set<string>()
    mockRequirements.forEach((req) => {
      if (req.childRequirements && req.childRequirements.length > 0) {
        req.childRequirements.forEach((childId) => {
          childRequirementIds.add(childId)
        })
      }
    })

    // Add central "Requirements" node
    nodes.push({
      id: 'central',
      type: 'centralNode',
      data: { label: 'Requirements', showHandles: true },
      position: { x: 0, y: 0 },
    })

    // Extract unique requirement types
    const requirementTypes = Array.from(
      new Set(mockRequirements.map((req) => req.type)),
    )

    // Calculate positions for type nodes in a circle around the central node
    const radius = 300
    const typeCount = requirementTypes.length

    requirementTypes.forEach((type, index) => {
      // Calculate position in a circle
      const angle = (index * 2 * Math.PI) / typeCount
      const x = radius * Math.cos(angle)
      const y = radius * Math.sin(angle)

      // Add type node
      const typeId = `type-${type.replace(/\s+/g, '-').toLowerCase()}`
      nodes.push({
        id: typeId,
        type: 'typeNode',
        data: {
          label: type,
          color: typeColorMap[type as RequirementType],
          showHandles: true,
        },
        position: { x, y },
      })

      // Connect central node to type node
      edges.push({
        id: `edge-central-to-${typeId}`,
        source: 'central',
        target: typeId,
        type: 'smoothstep',
        animated: false,
        style: {
          stroke: typeColorMap[type as RequirementType],
          strokeWidth: 2,
        },
      })
    })

    // Add requirement nodes and connect them to their type nodes
    mockRequirements.forEach((req, index) => {
      // Calculate average rating
      const ratingAvg =
        (req.rating.priority + req.rating.relevance + req.rating.impact) / 3

      // Get the type node ID
      const typeId = `type-${req.type.replace(/\s+/g, '-').toLowerCase()}`

      // Get the type node to determine position offset
      const typeNode = nodes.find((node) => node.id === typeId)
      if (!typeNode) return

      // Calculate position around the type node
      // We'll position requirements in a semi-circle below their type
      const reqCount = mockRequirements.filter(
        (r) => r.type === req.type,
      ).length
      const reqIndex = mockRequirements
        .filter((r) => r.type === req.type)
        .indexOf(req)
      const reqRadius = 200 + ratingAvg * 15 // Larger radius for higher-rated requirements
      const reqAngle =
        Math.PI / 2 + ((reqIndex - reqCount / 2) / reqCount) * Math.PI

      const reqX = typeNode.position.x + reqRadius * Math.cos(reqAngle)
      const reqY = typeNode.position.y + 150 + reqRadius * Math.sin(reqAngle)

      // Add requirement node
      nodes.push({
        id: `req-${req.id}`,
        type: 'requirementNode',
        data: {
          label: req.id,
          title: req.title,
          ratingAvg,
          color: typeColorMap[req.type as RequirementType],
          showHandles: !!req.childRequirements?.length,
        },
        position: { x: reqX, y: reqY },
      })

      // Connect type node to requirement node ONLY if it's not a child requirement
      if (!childRequirementIds.has(req.id)) {
        edges.push({
          id: `edge-${typeId}-to-req-${req.id}`,
          source: typeId,
          target: `req-${req.id}`,
          type: 'smoothstep',
          animated: false,
          style: {
            stroke: typeColorMap[req.type as RequirementType],
            strokeWidth: 1,
          },
        })
      }

      // Add child requirements if any
      if (req.childRequirements && req.childRequirements.length > 0) {
        const childCount = req.childRequirements.length
        const childRadius = 150

        req.childRequirements.forEach((childId, childIndex) => {
          const childReq = mockRequirements.find((r) => r.id === childId)
          if (!childReq) return

          // Calculate child rating average
          const childRatingAvg =
            (childReq.rating.priority +
              childReq.rating.relevance +
              childReq.rating.impact) /
            3

          // Calculate position in a semi-circle below the parent
          const childAngle =
            Math.PI / 2 + ((childIndex - childCount / 2) / childCount) * Math.PI
          const childX = reqX + childRadius * Math.cos(childAngle)
          const childY = reqY + 120 + childRadius * Math.sin(childAngle)

          // Add child requirement node
          nodes.push({
            id: `req-${childReq.id}`,
            type: 'requirementNode',
            data: {
              label: childReq.id,
              title: childReq.title,
              ratingAvg: childRatingAvg,
              color: typeColorMap[childReq.type as RequirementType],
              showHandles: false,
            },
            position: { x: childX, y: childY },
          })

          // Connect parent to child
          edges.push({
            id: `edge-req-${req.id}-to-req-${childReq.id}`,
            source: `req-${req.id}`,
            target: `req-${childReq.id}`,
            type: 'smoothstep',
            animated: false,
            style: {
              stroke: typeColorMap[childReq.type as RequirementType],
              strokeWidth: 1,
            },
          })
        })
      }
    })

    return { initialNodes: nodes, initialEdges: edges }
  }, [])

  // Set initial nodes and edges
  useEffect(() => {
    setNodes(initialNodes as any)
    setEdges(initialEdges as any)
  }, [initialNodes, initialEdges])
  return (
    <Box sx={{ width: '100%', height: '800px', border: '1px solid #eee' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        defaultViewport={{ x: 400, y: 200, zoom: 0.6 }}
        minZoom={0.2}
        maxZoom={1.5}
        fitView
      >
        <Controls />
        <Background color="#f8f8f8" gap={16} />
      </ReactFlow>
    </Box>
  )
}

export default DaRequirementExplorer
