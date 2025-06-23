import React, { useState, useEffect } from 'react'
import {
  TbArrowsMaximize,
  TbArrowsMinimize,
  TbLoader2,
  TbPlus,
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
import RequirementEvaluationDialog from '../molecules/prototype_requirements/RequirementEvaluationDialog'
import { Requirement } from '@/types/model.type'
import RequirementCreateDialog from '../molecules/prototype_requirements/RequirementCreateDialog'

const PrototypeTabRequirement = () => {
  const { data: model } = useCurrentModel()
  const [isAuthorized] = usePermissionHook([PERMISSIONS.READ_MODEL, model?.id])
  const { data: prototype } = useCurrentPrototype()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const {
    requirements,
    setRequirements,
    isScanning,
    toggleScanning,
    addRequirement,
    removeRequirement,
  } = useRequirementStore()
  const [showEvaluationDialog, setShowEvaluationDialog] = useState(false)
  const [showCreateRequirementDialog, setShowCreateRequirementDialog] =
    useState(false)

  // Use existing system UI state or create a new one for requirements
  const {
    showPrototypeRequirementFullScreen,
    setShowPrototypeRequirementFullScreen,
  } = useSystemUI() || {
    showPrototypeRequirementFullScreen: false,
    setShowPrototypeRequirementFullScreen: (val: boolean) => {},
  }

  useEffect(() => {
    if (prototype?.extend && Array.isArray(prototype.extend.requirements)) {
      setRequirements(prototype.extend.requirements as Requirement[])
    }
  }, [prototype, setRequirements])

  const handleCreateAndSave = async (newReq: Requirement) => {
    // 1) add locally
    addRequirement(newReq)

    // 2) persist immediately
    if (!prototype) return
    setIsSaving(true)
    try {
      // grab the updated array
      const allReqs = useRequirementStore.getState().requirements
      await updatePrototypeService(prototype.id, {
        extend: { requirements: allReqs },
      })
    } catch (error) {
      console.error('Failed to save after create:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    // 1) remove local copy
    removeRequirement(id)

    // 2) persist updated array
    if (!prototype) return
    setIsSaving(true)
    try {
      const allReqs = useRequirementStore.getState().requirements
      await updatePrototypeService(prototype.id, {
        extend: { requirements: allReqs },
      })
    } catch (err) {
      console.error('Failed to delete requirement', err)
    } finally {
      setIsSaving(false)
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
                size="sm"
                variant="editor"
                onClick={() => setShowCreateRequirementDialog(true)}
              >
                <TbPlus className="size-4 mr-1" /> New Requirement
              </DaButton>
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
              <DaRequirementTable onDelete={handleDelete} />
            </div>
          ) : (
            <ReactFlowProvider>
              <DaRequirementExplorer onDelete={handleDelete} />
            </ReactFlowProvider>
          )}
        </div>
      </div>
      <RequirementEvaluationDialog
        open={showEvaluationDialog}
        onOpenChange={setShowEvaluationDialog}
      />
      <RequirementCreateDialog
        open={showCreateRequirementDialog}
        onOpenChange={setShowCreateRequirementDialog}
        onCreate={handleCreateAndSave}
      />
    </div>
  )
}

export default PrototypeTabRequirement
