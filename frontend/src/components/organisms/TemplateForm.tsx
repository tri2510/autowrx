import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createModelTemplate, getModelTemplateById, updateModelTemplate, type ModelTemplate } from '@/services/modelTemplate.service'
import { DaInput } from '@/components/atoms/DaInput'
import { DaTextarea } from '@/components/atoms/DaTextarea'
import { DaButton } from '@/components/atoms/DaButton'
import DaTabItem from '@/components/atoms/DaTabItem'
import { DaText } from '@/components/atoms/DaText'
import { DaImage } from '@/components/atoms/DaImage'
import DaImportFile from '@/components/atoms/DaImportFile'
// No direct JSON editor; we provide structured editors for config
import { uploadFileService } from '@/services/upload.service'
import { TbPhotoEdit } from 'react-icons/tb'
import { toast } from 'react-toastify'
import { listPlugins, type Plugin } from '@/services/plugin.service'

type Props = {
  templateId?: string
  onClose: () => void
  open?: boolean
}

export default function TemplateForm({ templateId, onClose, open }: Props) {
  const qc = useQueryClient()
  const isCreate = useMemo(() => !templateId, [templateId])
  const [activeTab, setActiveTab] = useState<'meta' | 'model' | 'prototype'>('meta')

  const { data: initial, isFetching } = useQuery({
    queryKey: ['model-template', templateId],
    queryFn: () => (templateId ? getModelTemplateById(templateId) : Promise.resolve(undefined)),
    enabled: !isCreate && !!templateId,
  })

  const [form, setForm] = useState<Partial<ModelTemplate>>({
    name: '',
    description: '',
    image: '',
    visibility: 'public',
    config: {},
  })
  const [modelTabs, setModelTabs] = useState<Array<{ label: string; plugin: string }>>([])
  const [prototypeTabs, setPrototypeTabs] = useState<Array<{ label: string; plugin: string }>>([])
  const { data: pluginData } = useQuery({
    queryKey: ['plugins-for-template'],
    queryFn: () => listPlugins({ limit: 1000, page: 1 }),
  })

  useEffect(() => {
    if (initial) {
      setForm(initial)
      const cfg: any = initial.config || {}
      setModelTabs(Array.isArray(cfg.model_tabs) ? cfg.model_tabs.map((x: any) => ({ label: x.label || '', plugin: x.plugin || '' })) : [])
      setPrototypeTabs(Array.isArray(cfg.prototype_tabs) ? cfg.prototype_tabs.map((x: any) => ({ label: x.label || '', plugin: x.plugin || '' })) : [])
    } else {
      setForm({ name: '', description: '', image: '', visibility: 'public', config: {} })
      setModelTabs([])
      setPrototypeTabs([])
    }
  }, [initial])

  // Reset when opening create mode
  useEffect(() => {
    if (open && isCreate) {
      setForm({ name: '', description: '', image: '', visibility: 'public', config: {} })
      setModelTabs([])
      setPrototypeTabs([])
      setActiveTab('meta')
    }
  }, [open, isCreate])

  const onChange = (k: keyof ModelTemplate, v: any) => setForm(s => ({ ...s, [k]: v }))

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        description: form.description,
        image: form.image,
        visibility: form.visibility || 'public',
        config: {
          ...(form.config || {}),
          model_tabs: [...modelTabs],
          prototype_tabs: [...prototypeTabs],
        },
      }
      if (isCreate) return createModelTemplate(payload)
      if (!templateId) throw new Error('Missing id')
      return updateModelTemplate(templateId, payload)
    },
    onSuccess: () => {
      toast.success('Template saved')
      qc.invalidateQueries({ queryKey: ['model-templates'] })
      onClose()
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || e.message || 'Save failed'),
  })

  return (
    <div className="flex flex-col w-full">
      <DaText variant="sub-title" className="text-da-gray-dark mb-4">
        {isCreate ? 'Create Template' : 'Edit Template'}
      </DaText>
      <div className="flex border-b border-da-gray-light">
        <DaTabItem small active={activeTab === 'meta'} onClick={() => setActiveTab('meta')}>Meta</DaTabItem>
        <DaTabItem small active={activeTab === 'model'} onClick={() => setActiveTab('model')}>Model Config</DaTabItem>
        <DaTabItem small active={activeTab === 'prototype'} onClick={() => setActiveTab('prototype')}>Prototype Config</DaTabItem>
      </div>

      <div className="p-6 overflow-y-auto">
        {isFetching && !isCreate ? (
          <DaText variant="small" className="text-da-gray-medium">Loading...</DaText>
        ) : (
          <>
            {activeTab === 'meta' && (
              <div className="flex gap-6">
                <div className="flex-1 space-y-3">
                  <DaInput label="Name *" required value={form.name || ''} onChange={e => onChange('name', e.target.value)} />
                  <DaTextarea label="Description" rows={3} value={form.description || ''} onChange={e => onChange('description', e.target.value)} />
                  <div>
                    <label className="da-label-small text-da-gray-dark">Visibility</label>
                    <select
                      className="da-input w-full"
                      value={form.visibility || 'public'}
                      onChange={e => onChange('visibility', e.target.value)}
                    >
                      <option value="public">public</option>
                      <option value="private">private</option>
                      <option value="default">default</option>
                    </select>
                  </div>
                </div>
                <div className="w-44 flex-shrink-0">
                  <div className="relative aspect-square w-full border border-da-gray-light rounded-md overflow-hidden bg-white">
                    <DaImage src={form.image || '/imgs/plugin.png'} alt="Template Image" className="absolute inset-0 w-full h-full object-contain" />
                    <DaImportFile
                      onFileChange={async (file) => {
                        try { const { url } = await uploadFileService(file); onChange('image', url); toast.success('Image uploaded') } catch { toast.error('Image upload failed') }
                      }}
                      accept="image/*"
                      className="absolute top-1 right-1"
                    >
                      <DaButton variant="plain" size="sm" className="!h-8 !w-8 !p-0 grid place-items-center rounded-full bg-white shadow-sm">
                        <TbPhotoEdit className="w-4 h-4" />
                      </DaButton>
                    </DaImportFile>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'model' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <DaText variant="small-bold" className="text-da-gray-dark">Model Tabs</DaText>
                  <DaButton size="sm" onClick={() => setModelTabs(t => [...t, { label: '', plugin: '' }])}>Add Item</DaButton>
                </div>
                {modelTabs.length === 0 && (
                  <DaText variant="small" className="text-da-gray-medium">No items. Click Add Item.</DaText>
                )}
                {modelTabs.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <DaInput placeholder="Label" value={it.label} onChange={e => {
                        const v = e.target.value; setModelTabs(arr => arr.map((x, i) => i === idx ? { ...x, label: v } : x))
                      }} />
                    </div>
                    <div className="col-span-6">
                      <select
                        className="da-input w-full"
                        value={it.plugin}
                        onChange={e => {
                          const v = e.target.value; setModelTabs(arr => arr.map((x, i) => i === idx ? { ...x, plugin: v } : x))
                        }}
                      >
                        <option value="">Select plugin</option>
                        {pluginData?.results?.map((p: Plugin) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <DaButton variant="destructive" size="sm" onClick={() => setModelTabs(arr => arr.filter((_, i) => i !== idx))}>Delete</DaButton>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'prototype' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <DaText variant="small-bold" className="text-da-gray-dark">Prototype Tabs</DaText>
                  <DaButton size="sm" onClick={() => setPrototypeTabs(t => [...t, { label: '', plugin: '' }])}>Add Item</DaButton>
                </div>
                {prototypeTabs.length === 0 && (
                  <DaText variant="small" className="text-da-gray-medium">No items. Click Add Item.</DaText>
                )}
                {prototypeTabs.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <DaInput placeholder="Label" value={it.label} onChange={e => {
                        const v = e.target.value; setPrototypeTabs(arr => arr.map((x, i) => i === idx ? { ...x, label: v } : x))
                      }} />
                    </div>
                    <div className="col-span-6">
                      <select
                        className="da-input w-full"
                        value={it.plugin}
                        onChange={e => {
                          const v = e.target.value; setPrototypeTabs(arr => arr.map((x, i) => i === idx ? { ...x, plugin: v } : x))
                        }}
                      >
                        <option value="">Select plugin</option>
                        {pluginData?.results?.map((p: Plugin) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <DaButton variant="destructive" size="sm" onClick={() => setPrototypeTabs(arr => arr.filter((_, i) => i !== idx))}>Delete</DaButton>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <DaButton variant="outline-nocolor" onClick={onClose}>Cancel</DaButton>
              <DaButton onClick={() => save.mutate()} disabled={!form.name || save.isPending}>{save.isPending ? 'Saving...' : 'Save'}</DaButton>
            </div>
          </>
        )}
      </div>
    </div>
  )
}


