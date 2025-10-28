import React, { useEffect, useMemo, useState } from 'react'
import {
  CatalogPluginDescriptor,
  InstalledPluginDescriptor,
  PluginTabUpdate,
  PluginUpdateRequest,
  fetchCatalog,
  fetchInstalled,
  installFromCatalog,
  uninstall,
  uploadPlugin,
  updatePlugin
} from '@/services/pluginMarketplace.service'
import { pluginManager } from '@/core/plugin-manager'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import useModelPluginStore from '@/stores/modelPluginStore'

interface PluginManagementPanelProps {
  open: boolean
  onClose: () => void
  modelName: string
  modelId: string
}

interface EditFormState {
  name: string
  description: string
  summary: string
  tabs: PluginTabUpdate[]
}

const initialEditState = (plugin: InstalledPluginDescriptor | null): EditFormState => {
  if (!plugin) {
    return {
      name: '',
      description: '',
      summary: '',
      tabs: []
    }
  }

  return {
    name: plugin.manifest.name || '',
    description: plugin.manifest.description || '',
    summary: plugin.manifest.summary || '',
    tabs: (plugin.manifest.tabs || []).map((tab) => ({
      id: tab.id,
      label: tab.label,
      icon: tab.icon,
      path: tab.path,
      component: tab.component,
      position: tab.position
    }))
  }
}

const PluginManagementPanel: React.FC<PluginManagementPanelProps> = ({ open, onClose, modelName, modelId }) => {
  const [installed, setInstalled] = useState<InstalledPluginDescriptor[]>([])
  const [catalog, setCatalog] = useState<CatalogPluginDescriptor[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCatalog, setShowCatalog] = useState(false)
  const [editingPlugin, setEditingPlugin] = useState<InstalledPluginDescriptor | null>(null)
  const [editForm, setEditForm] = useState<EditFormState>(initialEditState(null))
  const [savingEdit, setSavingEdit] = useState(false)
  const [uploading, setUploading] = useState(false)

  const navigate = useNavigate()
  const modelScope = modelId || 'global'
  const isPluginEnabled = useModelPluginStore((state) => state.isEnabled)
  const setPluginEnabled = useModelPluginStore((state) => state.setEnabled)
  const resetForModel = useModelPluginStore((state) => state.resetForModel)
  const disabledCount = useModelPluginStore((state) => state.disabledPlugins[modelScope]?.length ?? 0)

  useEffect(() => {
    if (open) {
      void loadData()
    }
  }, [open])

  const installedIds = useMemo(() => new Set(installed.map((plugin) => plugin.id)), [installed])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      await pluginManager.refreshInstalledPlugins()
      const [installedData, catalogData] = await Promise.all([fetchInstalled(), fetchCatalog()])
      setInstalled(installedData)
      setCatalog(catalogData)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to load plugin data')
    } finally {
      setLoading(false)
    }
  }

  const handleInstall = async (pluginId: string) => {
    try {
      setLoading(true)
      await installFromCatalog(pluginId)
      await pluginManager.refreshInstalledPlugins()
      toast.success('Plugin installed')
      await loadData()
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : 'Failed to install plugin')
    }
  }

  const handleRemove = async (pluginId: string) => {
    try {
      setLoading(true)
      await uninstall(pluginId)
      await pluginManager.refreshInstalledPlugins()
      toast.success('Plugin removed')
      await loadData()
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : 'Failed to remove plugin')
    }
  }

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    try {
      setUploading(true)
      await uploadPlugin(file)
      await pluginManager.refreshInstalledPlugins()
      toast.success('Plugin uploaded and registered')
      await loadData()
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const handleOpenEdit = (plugin: InstalledPluginDescriptor) => {
    setEditingPlugin(plugin)
    setEditForm(initialEditState(plugin))
  }

  const handleEditFieldChange = (field: keyof EditFormState, value: string) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleTabFieldChange = (tabId: string, field: keyof PluginTabUpdate, value: string | number) => {
    const nextValue = field === 'position'
      ? typeof value === 'number' && !Number.isNaN(value)
        ? value
        : undefined
      : value

    setEditForm((prev) => ({
      ...prev,
      tabs: prev.tabs.map((tab) =>
        tab.id === tabId
          ? {
              ...tab,
              [field]: nextValue
            }
          : tab
      )
    }))
  }

  const handleSaveEdit = async () => {
    if (!editingPlugin) {
      return
    }

    const payload: PluginUpdateRequest = {
      name: editForm.name,
      description: editForm.description,
      summary: editForm.summary,
      tabs: editForm.tabs.map((tab) => ({
        id: tab.id,
        label: tab.label,
        icon: tab.icon,
        path: tab.path,
        component: tab.component,
        position: typeof tab.position === 'number' ? tab.position : undefined
      }))
    }

    try {
      setSavingEdit(true)
      await updatePlugin(editingPlugin.id, payload)
      await pluginManager.reloadPlugin(editingPlugin.id)
      toast.success('Plugin updated')
      setEditingPlugin(null)
      await loadData()
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : 'Failed to update plugin')
    } finally {
      setSavingEdit(false)
    }
  }

  const handlePreview = (pluginId: string) => {
    navigate(`/plugin-workbench/${pluginId}`)
    onClose()
  }

  const setModelPluginEnabled = (pluginId: string, enabled: boolean, label?: string) => {
    setPluginEnabled(modelScope, pluginId, enabled)
    toast.success(`${enabled ? 'Enabled' : 'Disabled'} ${label || pluginId} for ${modelName}`)
  }

  const handleResetPreferences = () => {
    resetForModel(modelScope)
    toast.info(`Reset plugin preferences for ${modelName}`)
  }

  if (!open) {
    return null
  }

  return (
    <div className='fixed inset-0 z-50 flex'>
      <div className='absolute inset-0 bg-slate-900/60 backdrop-blur-sm' onClick={onClose} />
      <aside className='relative z-10 ml-auto flex h-full w-full max-w-5xl flex-col border-l border-slate-700 bg-slate-950 shadow-2xl'>
        <div className='flex items-center justify-between border-b border-slate-800 px-6 py-4'>
          <div>
            <h2 className='text-xl font-semibold text-white flex items-center gap-3'>
              <span className='text-2xl'>🧩</span>
              Plugin Workspace
            </h2>
            <p className='text-sm text-slate-300 mt-1'>Manage extensions for <strong>{modelName}</strong>. Install packages, edit manifests, and control availability per model.</p>
          </div>
          <div className='flex items-center gap-2'>
            <button
              className='rounded-md border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-60'
              onClick={handleResetPreferences}
              disabled={disabledCount === 0}
            >
              Reset Preferences
            </button>
            <button
              className='rounded-lg border border-slate-600 px-3 py-1 text-sm text-slate-200 hover:bg-slate-800'
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>

        <div className='flex-1 overflow-y-auto px-6 py-5 space-y-6'>
          <div className='flex flex-wrap items-center gap-3'>
            <button
              className='flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-400 disabled:opacity-60'
              onClick={() => setShowCatalog((prev) => !prev)}
              disabled={loading}
            >
              {showCatalog ? 'Hide Catalog' : 'Install from Catalog'}
            </button>
            <label className='flex items-center gap-2 rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 cursor-pointer disabled:opacity-60'>
              Upload Bundle
              <input type='file' accept='.zip' className='hidden' onChange={handleUpload} disabled={uploading} />
            </label>
            <span className='text-xs text-slate-400'>Need a custom UI? Choose a plugin then "Develop GUI" to open the workbench.</span>
          </div>

          {error && (
            <div className='rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-100'>
              {error}
            </div>
          )}

          {showCatalog && (
            <section className='rounded-xl border border-slate-700 bg-slate-900/70 p-5 space-y-4'>
              <div className='flex items-center justify-between'>
                <h3 className='text-lg font-semibold text-white'>Catalog</h3>
                <span className='text-xs uppercase tracking-wide text-slate-400'>{catalog.length} available</span>
              </div>
              {catalog.length === 0 ? (
                <div className='rounded-lg border border-slate-700 bg-slate-900/80 p-4 text-sm text-slate-300'>Catalog is empty. Upload a plugin bundle to add new entries.</div>
              ) : (
                <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
                  {catalog.map((plugin) => {
                    const alreadyInstalled = installedIds.has(plugin.id)
                    return (
                      <article key={plugin.id} className='rounded-lg border border-slate-700 bg-slate-900/80 p-4 space-y-3'>
                        <header className='space-y-1'>
                          <h4 className='text-lg font-semibold text-white'>{plugin.name}</h4>
                          <div className='text-xs uppercase tracking-wide text-slate-400 flex items-center gap-2'>
                            <span>v{plugin.version}</span>
                            {plugin.status && <span className='rounded-full border border-slate-600 bg-slate-800 px-2 py-0.5 text-slate-200'>{plugin.status}</span>}
                          </div>
                        </header>
                        <p className='text-sm text-slate-300 leading-relaxed min-h-[60px]'>{plugin.summary || plugin.description}</p>
                        <button
                          className='rounded-md border border-emerald-500/60 px-3 py-1 text-sm text-emerald-200 hover:bg-emerald-500/10 disabled:opacity-60'
                          onClick={() => handleInstall(plugin.id)}
                          disabled={alreadyInstalled || loading}
                        >
                          {alreadyInstalled ? 'Installed' : 'Install'}
                        </button>
                      </article>
                    )
                  })}
                </div>
              )}
            </section>
          )}

          <section className='space-y-4'>
            <div className='flex items-center justify-between'>
              <h3 className='text-lg font-semibold text-white'>Installed Plugins</h3>
              {loading && <span className='text-xs uppercase tracking-wide text-slate-400 animate-pulse'>Syncing…</span>}
            </div>
            {installed.length === 0 ? (
              <div className='rounded-xl border border-slate-700 bg-slate-900/80 p-6 text-slate-300'>No plugins are active. Install from the catalog or upload a bundle to get started.</div>
            ) : (
              <div className='grid gap-4 md:grid-cols-2'>
                {installed.map((plugin) => {
                  const pluginEnabled = isPluginEnabled(modelScope, plugin.id)
                  return (
                    <article key={plugin.id} className='rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 shadow-sm'>
                    <header className='space-y-1'>
                      <h4 className='text-xl font-semibold text-white'>{plugin.manifest.name}</h4>
                      <div className='text-xs text-slate-400 uppercase tracking-wide flex items-center gap-3'>
                        <span>v{plugin.manifest.version}</span>
                        {plugin.installedAt && <span>Installed {new Date(plugin.installedAt).toLocaleString()}</span>}
                      </div>
                      <button
                        className={`mt-2 inline-flex items-center gap-2 rounded-md border px-3 py-1 text-xs font-medium transition-colors ${
                          pluginEnabled
                            ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20'
                            : 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'
                        }`}
                        onClick={() => setModelPluginEnabled(plugin.id, !pluginEnabled, plugin.manifest.name)}
                      >
                        <span className='text-base'>{pluginEnabled ? '🟢' : '⚪'}</span>
                        {pluginEnabled ? 'Enabled for this model' : 'Disabled for this model'}
                      </button>
                    </header>
                    <p className='text-sm leading-relaxed text-slate-300 min-h-[60px]'>{plugin.manifest.description || 'No description provided.'}</p>
                    <div className='space-y-2'>
                      <div className='text-xs uppercase tracking-wide text-slate-400'>Tabs</div>
                      <ul className='space-y-1 text-sm text-slate-200'>
                        {(plugin.manifest.tabs || []).map((tab) => (
                          <li key={tab.id} className='flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2'>
                            <span className='flex items-center gap-2'>
                              {tab.icon && <span>{tab.icon}</span>}
                              <span>{tab.label}</span>
                            </span>
                            <span className='text-xs text-slate-500'>#{tab.id}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <footer className='flex flex-wrap gap-2'>
                      <button
                        className='rounded-md border border-blue-500/60 px-3 py-1 text-sm text-blue-200 hover:bg-blue-500/10'
                        onClick={() => handlePreview(plugin.id)}
                      >
                        Develop GUI
                      </button>
                      <button
                        className='rounded-md border border-slate-600 px-3 py-1 text-sm text-slate-200 hover:bg-slate-800'
                        onClick={() => handleOpenEdit(plugin)}
                      >
                        Edit Metadata
                      </button>
                      <button
                        className='rounded-md border border-red-500/60 px-3 py-1 text-sm text-red-200 hover:bg-red-500/10'
                        onClick={() => handleRemove(plugin.id)}
                      >
                        Remove
                      </button>
                    </footer>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </aside>

      {editingPlugin && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4'>
          <div className='w-full max-w-3xl rounded-2xl border border-slate-700 bg-slate-950/95 shadow-xl'>
            <div className='flex items-center justify-between border-b border-slate-800 px-5 py-3'>
              <div>
                <h3 className='text-lg font-semibold text-white'>Edit {editingPlugin.manifest.name}</h3>
                <p className='text-xs text-slate-400 mt-1'>Update how this plugin appears inside the AutoWRX interface.</p>
              </div>
              <button
                className='rounded-lg border border-slate-600 px-3 py-1 text-sm text-slate-200 hover:bg-slate-800'
                onClick={() => setEditingPlugin(null)}
              >
                Cancel
              </button>
            </div>
            <div className='px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto'>
              <div className='grid gap-4 md:grid-cols-2'>
                <label className='text-sm text-slate-200 space-y-1'>
                  <span className='block text-xs uppercase tracking-wide text-slate-400'>Name</span>
                  <input
                    type='text'
                    className='w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                    value={editForm.name}
                    onChange={(event) => handleEditFieldChange('name', event.target.value)}
                  />
                </label>
                <label className='text-sm text-slate-200 space-y-1'>
                  <span className='block text-xs uppercase tracking-wide text-slate-400'>Summary</span>
                  <input
                    type='text'
                    className='w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                    value={editForm.summary}
                    onChange={(event) => handleEditFieldChange('summary', event.target.value)}
                  />
                </label>
              </div>
              <label className='text-sm text-slate-200 space-y-1'>
                <span className='block text-xs uppercase tracking-wide text-slate-400'>Description</span>
                <textarea
                  className='w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                  rows={4}
                  value={editForm.description}
                  onChange={(event) => handleEditFieldChange('description', event.target.value)}
                />
              </label>

              <section className='space-y-3'>
                <div className='text-sm font-semibold text-white'>Tabs</div>
                <div className='space-y-3'>
                  {editForm.tabs.map((tab) => (
                    <div key={tab.id} className='rounded-lg border border-slate-800 bg-slate-900/70 p-4 space-y-3'>
                      <div className='flex items-center justify-between'>
                        <div className='text-xs uppercase tracking-wide text-slate-400'>#{tab.id}</div>
                        <div className='flex gap-2 text-xs text-slate-400'>
                          <label className='flex items-center gap-1'>
                            <span>Position</span>
                            <input
                              type='number'
                              className='w-20 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500'
                              value={tab.position ?? ''}
                              onChange={(event) => handleTabFieldChange(tab.id, 'position', event.target.value === '' ? NaN : Number(event.target.value))}
                            />
                          </label>
                        </div>
                      </div>
                      <div className='grid gap-3 md:grid-cols-2'>
                        <label className='text-xs text-slate-300 space-y-1'>
                          <span>Label</span>
                          <input
                            type='text'
                            className='w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500'
                            value={tab.label || ''}
                            onChange={(event) => handleTabFieldChange(tab.id, 'label', event.target.value)}
                          />
                        </label>
                        <label className='text-xs text-slate-300 space-y-1'>
                          <span>Icon</span>
                          <input
                            type='text'
                            className='w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500'
                            value={tab.icon || ''}
                            onChange={(event) => handleTabFieldChange(tab.id, 'icon', event.target.value)}
                          />
                        </label>
                        <label className='text-xs text-slate-300 space-y-1'>
                          <span>Route Path</span>
                          <input
                            type='text'
                            className='w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500'
                            value={tab.path || ''}
                            onChange={(event) => handleTabFieldChange(tab.id, 'path', event.target.value)}
                          />
                        </label>
                        <label className='text-xs text-slate-300 space-y-1'>
                          <span>Component</span>
                          <input
                            type='text'
                            className='w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500'
                            value={tab.component || ''}
                            onChange={(event) => handleTabFieldChange(tab.id, 'component', event.target.value)}
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                  {editForm.tabs.length === 0 && (
                    <div className='rounded border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300'>This plugin does not declare any tabs.</div>
                  )}
                </div>
              </section>
            </div>
            <div className='flex items-center justify-between border-t border-slate-800 px-5 py-3'>
              <span className='text-xs text-slate-500'>Changes are saved to the plugin manifest on disk.</span>
              <div className='flex gap-2'>
                <button
                  className='rounded-md border border-slate-600 px-3 py-1 text-sm text-slate-200 hover:bg-slate-800'
                  onClick={() => setEditingPlugin(null)}
                  disabled={savingEdit}
                >
                  Cancel
                </button>
                <button
                  className='rounded-md border border-emerald-500/60 bg-emerald-500/10 px-4 py-1 text-sm font-medium text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-60'
                  onClick={handleSaveEdit}
                  disabled={savingEdit}
                >
                  {savingEdit ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PluginManagementPanel
