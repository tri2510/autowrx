import React, { useState } from 'react'
import {
  TbArrowsMaximize,
  TbArrowsMinimize,
  TbLoader2,
  TbTable,
  TbTarget,
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
import DaRequirementTable from '../molecules/prototype_requirements/DaRequirementTable'
import { useRequirementStore } from '../molecules/prototype_requirements/hook/useRequirementStore'
import CustomDialog from '../molecules/flow/CustomDialog'
import { markdownAIEvaluate } from '../molecules/prototype_requirements/mockup_requirements'
import AIEvaluationDialog from '../molecules/prototype_requirements/RequirementEvaluationDialog'

const PrototypeTabRequirement = () => {
  const { data: model } = useCurrentModel()
  const [isAuthorized] = usePermissionHook([PERMISSIONS.READ_MODEL, model?.id])
  const { data: prototype } = useCurrentPrototype()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { isScanning, toggleScanning } = useRequirementStore()
  const [showEvaluationDialog, setShowEvaluationDialog] = useState(false)

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

  const handleEvaluateWithAI = () => {
    // Don't restart scanning if already in progress
    if (isScanning) return

    // Start scanning animation
    toggleScanning()

    // After 5-6 seconds, show the evaluation dialog
    setTimeout(() => {
      setShowEvaluationDialog(true)
    }, 5500)
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
                onClick={handleEvaluateWithAI}
                className={cn(
                  '!justify-start',
                  isScanning && 'bg-da-primary-600',
                )}
                variant="editor"
                size="sm"
              >
                {isScanning ? (
                  <TbLoader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <TbTextScan2 className="w-4 h-4 mr-1" />
                )}
                {isScanning ? 'Evaluating...' : 'Evaluate with AI'}
              </DaButton>

              <DaButton
                onClick={() => setIsEditing(!isEditing)}
                className="!justify-start"
                variant="editor"
                size="sm"
              >
                {isEditing ? (
                  <TbTarget className="w-4 h-4 mr-1" />
                ) : (
                  <TbTable className="w-4 h-4 mr-1" />
                )}
                {isEditing ? 'Explorer View' : 'Table View'}
              </DaButton>
              {/* {!isEditing ? (
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
              )} */}
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
            <div className="flex w-full h-full">
              <DaRequirementTable />
            </div>
          ) : (
            <ReactFlowProvider>
              <DaRequirementExplorer />
            </ReactFlowProvider>
          )}
        </div>
      </div>
      <AIEvaluationDialog
        open={showEvaluationDialog}
        onOpenChange={setShowEvaluationDialog}
      />
    </div>
  )
}

export default PrototypeTabRequirement
