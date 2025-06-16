import React from 'react'
import { Node, NodeProps, Handle, Position } from '@xyflow/react'

// Define the shape of the data object
type RequirementNodeData = {
  label: string
  title: string
  ratingAvg: number
  color?: string
  showHandles?: boolean
  handlePositions?: string[]
}

// Define the custom node type
type RequirementNodeType = Node<RequirementNodeData>

// Define the component with correct props typing
function RequirementNode({
  data,
  isConnectable,
}: NodeProps<RequirementNodeType>) {
  const ratingAvg = data.ratingAvg || 3
  const baseSize = 2
  const size = baseSize + ratingAvg * 6

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full">
      <div
        className="rounded-full flex justify-center items-center p-[10px] text-center text-xs font-bold shadow-md transition-all duration-300 ease-in-out cursor-pointer hover:scale-105 hover:shadow-lg text-white"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: data.color || '#fff',
        }}
      />
      <p
        className="absolute w-[200px] whitespace-nowrap overflow-hidden text-ellipsis text-center mt-4 text-xs font-medium"
        style={{ top: `${size}px` }}
        title={data.title}
      >
        {data.title}
      </p>
    </div>
  )
}

export default RequirementNode
