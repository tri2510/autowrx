import React, { useState } from 'react'
import {
  TbArrowsMaximize,
  TbArrowsMinimize,
  TbEdit,
  TbLoader,
  TbTable,
  TbTextScan2,
} from 'react-icons/tb'
import useCurrentPrototype from '@/hooks/useCurrentPrototype'
import { updatePrototypeService } from '@/services/prototype.service'
import { DaButton } from '../atoms/DaButton'
import { cn } from '@/lib/utils'
import { useSystemUI } from '@/hooks/useSystemUI'
import DaText from '../atoms/DaText'
import { ReactFlowProvider } from '@xyflow/react'
import DaRequirementExplorer from '../molecules/prototype_requirements/DaRequirementExplorer'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/data/permission'
import useCurrentModel from '@/hooks/useCurrentModel'

const PrototypeTabRequirement = () => {
  const { data: model } = useCurrentModel()
  const [isAuthorized] = usePermissionHook([PERMISSIONS.READ_MODEL, model?.id])
  const { data: prototype } = useCurrentPrototype()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Use existing system UI state or create a new one for requirements
  const {
    showPrototypeRequirementFullScreen,
    setShowPrototypeRequirementFullScreen,
  } = useSystemUI() || {
    showPrototypeRequirementFullScreen: false,
    setShowPrototypeRequirementFullScreen: (val: boolean) => {},
  }

  const handleSave = async () => {
    if (!prototype) return
    try {
      setIsSaving(true)
      // Add your save logic here for requirements
      await updatePrototypeService(prototype.id, {
        // Update requirements data here
      })
    } catch (error) {
      console.error('Error saving requirement data:', error)
    } finally {
      setIsSaving(false)
      setIsEditing(false)
    }
  }

  if (!prototype) {
    return <div>No prototype available</div>
  }

  return (
    <div
      className={cn(
        'flex w-full h-full flex-col bg-white rounded-md py-4 px-10',
        showPrototypeRequirementFullScreen
          ? 'fixed inset-0 z-50 overflow-auto bg-white'
          : '',
      )}
    >
      <div className="flex flex-col w-full h-full">
        <div className="flex items-center border-b pb-2 mb-4">
          <DaText variant="title" className="text-da-primary-500">
            Requirements: {prototype?.name}
          </DaText>
          <div className="grow" />
          {isAuthorized && (
            <div className="flex items-center space-x-1">
              <DaButton
                onClick={() => setIsEditing(true)}
                className="!justify-start"
                variant="editor"
                size="sm"
              >
                <TbTextScan2 className="w-4 h-4 mr-1" /> Evaluate with AI
              </DaButton>
              <DaButton
                onClick={() => setIsEditing(true)}
                className="!justify-start"
                variant="editor"
                size="sm"
              >
                <TbTable className="w-4 h-4 mr-1" /> Table View
              </DaButton>
              {!isEditing ? (
                <DaButton
                  onClick={() => setIsEditing(true)}
                  className="!justify-start"
                  variant="editor"
                  size="sm"
                >
                  <TbEdit className="w-4 h-4 mr-1" /> Edit
                </DaButton>
              ) : isSaving ? (
                <div className="flex items-center text-da-primary-500">
                  <TbLoader className="w-4 h-4 mr-1 animate-spin" />
                  Saving
                </div>
              ) : (
                <div className="flex space-x-2 mr-2">
                  <DaButton
                    variant="outline-nocolor"
                    onClick={() => setIsEditing(false)}
                    className="w-16 text-da-white px-4 py-2 rounded"
                    size="sm"
                  >
                    Cancel
                  </DaButton>
                  <DaButton
                    onClick={handleSave}
                    className="w-16 text-white px-4 py-2 rounded"
                    size="sm"
                  >
                    Save
                  </DaButton>
                </div>
              )}
            </div>
          )}
          <DaButton
            onClick={() =>
              setShowPrototypeRequirementFullScreen(
                !showPrototypeRequirementFullScreen,
              )
            }
            size="sm"
            variant="editor"
          >
            {showPrototypeRequirementFullScreen ? (
              <TbArrowsMinimize className="size-4" />
            ) : (
              <TbArrowsMaximize className="size-4" />
            )}
          </DaButton>
        </div>

        <div className="flex w-full h-full">
          {isEditing ? (
            <div className="border p-4 rounded-md">
              {/* Add your requirements editing UI here */}
              <p>Requirements editor would go here</p>
            </div>
          ) : (
            <ReactFlowProvider>
              <DaRequirementExplorer />
            </ReactFlowProvider>
          )}
        </div>
      </div>
    </div>
  )
}

export default PrototypeTabRequirement
