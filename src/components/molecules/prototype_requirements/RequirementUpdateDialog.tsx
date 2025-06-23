// src/molecules/prototype_requirements/RequirementUpdateDialog.tsx
import React, { useState, useEffect } from 'react'
import CustomDialog from '../flow/CustomDialog'
import { DaButton } from '@/components/atoms/DaButton'
import { Requirement } from '@/types/model.type'
import useAuthStore from '@/stores/authStore'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  requirement: Requirement | null
  onUpdate: (req: Requirement) => void
}

const RequirementUpdateDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  requirement,
  onUpdate,
}) => {
  const user = useAuthStore((s) => s.user)

  // form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<Requirement['type']>(
    'Functional Requirement',
  )
  const [sourceType, setSourceType] =
    useState<Requirement['source']['type']>('external')
  const [sourceLink, setSourceLink] = useState('')
  const [priority, setPriority] = useState(1)
  const [relevance, setRelevance] = useState(1)
  const [impact, setImpact] = useState(1)

  // clamp helpers
  const clamp = (v: number) => Math.min(5, Math.max(1, v))

  // when dialog opens, seed the form from `requirement`
  useEffect(() => {
    if (open && requirement) {
      setTitle(requirement.title)
      setDescription(requirement.description || '')
      setType(requirement.type)
      setSourceType(requirement.source.type)
      setSourceLink(requirement.source.link || '')
      setPriority(clamp(requirement.rating.priority))
      setRelevance(clamp(requirement.rating.relevance))
      setImpact(clamp(requirement.rating.impact))
    }
  }, [open, requirement])

  const handleSave = () => {
    if (!requirement) return

    const updated: Requirement = {
      ...requirement,
      title,
      description,
      type,
      source: { type: sourceType, link: sourceLink },
      rating: {
        priority: clamp(priority),
        relevance: clamp(relevance),
        impact: clamp(impact),
      },
      // keep original creatorUserId
      creatorUserId: requirement.creatorUserId,
    }

    onUpdate(updated)
    onOpenChange(false)
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      dialogTitle="Update Requirement"
      className="h-fit w-[90vw] max-w-md"
      showCloseButton
    >
      <div className="flex flex-col h-full space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full border rounded p-2"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full border rounded p-2"
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as Requirement['type'])}
            className="mt-1 block w-full border rounded p-2"
          >
            <option>Functional Requirement</option>
            <option>System Integration Requirement</option>
            <option>Safety & Security Requirement</option>
            <option>User Experience Requirement</option>
            <option>Regulatory & Homologation Requirement</option>
            <option>Operational Requirement</option>
            <option>Deployment & Ecosystem Requirement</option>
          </select>
        </div>

        {/* Source */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Source Type</label>
            <select
              value={sourceType}
              onChange={(e) =>
                setSourceType(e.target.value as Requirement['source']['type'])
              }
              className="mt-1 block w-full border rounded p-2"
            >
              <option value="external">External</option>
              <option value="internal">Internal</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Source Link</label>
            <input
              type="text"
              value={sourceLink}
              onChange={(e) => setSourceLink(e.target.value)}
              className="mt-1 block w-full border rounded p-2"
            />
          </div>
        </div>

        {/* Ratings */}
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: 'Priority',
              val: priority,
              set: (v: number) => setPriority(clamp(v)),
            },
            {
              label: 'Relevance',
              val: relevance,
              set: (v: number) => setRelevance(clamp(v)),
            },
            {
              label: 'Impact',
              val: impact,
              set: (v: number) => setImpact(clamp(v)),
            },
          ].map(({ label, val, set }) => (
            <div key={label}>
              <label className="block text-sm font-medium">{label}</label>
              <input
                type="number"
                min={1}
                max={5}
                value={val}
                onChange={(e) => set(Number(e.target.value))}
                className="mt-1 block w-full border rounded p-2"
              />
              <span className="text-xs text-gray-500">Range: 1-5</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex h-full items-end justify-end space-x-2">
          <DaButton
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </DaButton>
          <DaButton variant="solid" size="sm" onClick={handleSave}>
            Save
          </DaButton>
        </div>
      </div>
    </CustomDialog>
  )
}

export default RequirementUpdateDialog
