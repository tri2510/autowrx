// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createPlugin, getPluginById, updatePlugin, uploadInternalZip, type Plugin } from '@/services/plugin.service'
import { useNavigate, useParams } from 'react-router-dom'
import { DaText } from '@/components/atoms/DaText'
import { DaInput } from '@/components/atoms/DaInput'
import { DaTextarea } from '@/components/atoms/DaTextarea'
import { DaButton } from '@/components/atoms/DaButton'
import DaCheckbox from '@/components/atoms/DaCheckbox'
import JsonEditor from '@/components/atoms/JsonEditor'
import { toast } from 'react-toastify'

const PluginEdit = ({ mode }: { mode: 'create' | 'edit' }) => {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: initial, isFetching } = useQuery({
    queryKey: ['plugin', id],
    queryFn: () => (id ? getPluginById(id) : Promise.resolve(undefined)),
    enabled: mode === 'edit' && !!id,
  })

  const [form, setForm] = useState<Partial<Plugin>>({
    name: '',
    slug: '',
    is_internal: false,
    image: '',
    description: '',
    url: '',
    config: {},
  })
  const [zip, setZip] = useState<File | null>(null)

  useEffect(() => {
    if (initial) setForm(initial)
  }, [initial])

  const onChange = (k: keyof Plugin, v: any) => setForm((s) => ({ ...s, [k]: v }))

  const save = useMutation({
    mutationFn: async () => {
      const payload: any = {
        name: form.name,
        slug: form.slug,
        image: form.image,
        description: form.description,
        is_internal: !!form.is_internal,
        url: form.is_internal ? undefined : form.url,
        config: form.config,
      }
      if (mode === 'create') return createPlugin(payload)
      if (!id) throw new Error('Missing id')
      return updatePlugin(id, payload)
    },
    onSuccess: (p: Plugin) => {
      toast.success('Saved')
      qc.invalidateQueries({ queryKey: ['plugins'] })
      if (mode === 'create') navigate(`/plugins/${p.id}`)
      else qc.invalidateQueries({ queryKey: ['plugin', id] })
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || e.message || 'Save failed'),
  })

  const doUpload = useMutation({
    mutationFn: async () => {
      if (!form.slug) throw new Error('Slug required for internal upload')
      if (!zip) throw new Error('Select a ZIP file')
      return uploadInternalZip(form.slug, zip)
    },
    onSuccess: ({ url }) => {
      onChange('url', url as any)
      toast.success('Uploaded and extracted')
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || e.message || 'Upload failed'),
  })

  const isCreate = useMemo(() => mode === 'create', [mode])

  return (
    <div className="p-6 !w-[800px] max-w-[calc(100vw-80px)]">
      <div className="mb-4">
        <DaText variant="sub-title" className="text-da-gray-dark">{isCreate ? 'Create Plugin' : 'Edit Plugin'}</DaText>
      </div>

      {isFetching && mode === 'edit' ? (
        <DaText variant="small" className="text-da-gray-medium">Loading...</DaText>
      ) : (
        <div className="space-y-4">
          <DaInput
            value={form.name || ''}
            onChange={(e) => onChange('name', (e.target as HTMLInputElement).value)}
            placeholder="Name"
          />
          <DaInput
            value={form.slug || ''}
            onChange={(e) => onChange('slug', (e.target as HTMLInputElement).value)}
            placeholder="Slug"
            className="disabled:opacity-60"
            disabled={!isCreate}
          />

          <DaCheckbox
            checked={!!form.is_internal}
            onChange={() => onChange('is_internal', !form.is_internal)}
            label="Internal plugin"
          />

          <DaInput
            value={form.image || ''}
            onChange={(e) => onChange('image', (e.target as HTMLInputElement).value)}
            placeholder="Image URL"
          />

          <DaTextarea
            value={form.description || ''}
            onChange={(e) => onChange('description', (e.target as HTMLTextAreaElement).value)}
            rows={3}
            label="Description"
          />

          {!form.is_internal && (
            <DaInput
              value={form.url || ''}
              onChange={(e) => onChange('url', (e.target as HTMLInputElement).value)}
              placeholder="External URL (https)"
            />
          )}

          {form.is_internal && (
            <div className="space-y-2">
              <DaInput
                type="file"
                onChange={(e) => setZip((e.target as HTMLInputElement).files?.[0] || null)}
                inputClassName="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border file:border-da-gray-light file:text-da-gray-medium file:bg-white"
              />
              <div className="flex gap-2 items-center">
                <DaButton onClick={() => doUpload.mutate()} disabled={!zip || !form.slug || doUpload.isLoading}>
                  {doUpload.isLoading ? 'Uploading...' : 'Upload ZIP'}
                </DaButton>
                {form.url && <DaText variant="small" className="text-da-gray-medium break-all">{form.url}</DaText>}
              </div>
            </div>
          )}

          <div>
            <DaText variant="small-bold" className="mb-1 text-da-gray-dark">Config (JSON)</DaText>
            <JsonEditor value={form.config || {}} onChange={(v) => onChange('config', v)} valueType="object" />
          </div>

          <div className="flex gap-2">
            <DaButton onClick={() => save.mutate()} disabled={save.isLoading}>{save.isLoading ? 'Saving...' : 'Save'}</DaButton>
            <DaButton variant="outline-nocolor" onClick={() => navigate('/plugins')}>Back</DaButton>
          </div>
        </div>
      )}
    </div>
  )
}

export default PluginEdit


