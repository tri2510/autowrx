import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { pluginManager, InstalledPluginRecord } from '@/core/plugin-manager'
import { LoadedPlugin } from '@/types/plugin.types'
import { toast } from 'react-toastify'

const PluginWorkbench: React.FC = () => {
  const { pluginId } = useParams<{ pluginId: string }>()
  const navigate = useNavigate()

  const [installedDescriptor, setInstalledDescriptor] = useState<InstalledPluginRecord | null>(null)
  const [loadedPlugin, setLoadedPlugin] = useState<LoadedPlugin | null>(null)
  const [selectedTabId, setSelectedTabId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const bootstrap = async () => {
      if (!pluginId) {
        setError('Plugin ID is missing')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        await pluginManager.initialize()
        await pluginManager.refreshInstalledPlugins()

        const installed = pluginManager.getInstalledPlugins()
        const descriptor = installed.find((plugin) => plugin.id === pluginId) || null
        setInstalledDescriptor(descriptor)

        if (!descriptor) {
          setError('Plugin is not installed. Install it from the Extension Center.')
          setLoading(false)
          return
        }

        const loaded = pluginManager.getLoadedPlugins().find((plugin) => plugin.manifest.id === pluginId) || null
        setLoadedPlugin(loaded || null)

        if (descriptor.manifest.tabs?.length && !selectedTabId) {
          setSelectedTabId(descriptor.manifest.tabs[0].id)
        }

        setError(null)
      } catch (err) {
        console.error(err)
        setError(err instanceof Error ? err.message : 'Failed to load plugin')
      } finally {
        setLoading(false)
      }
    }

    void bootstrap()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pluginId])

  useEffect(() => {
    if (!installedDescriptor) {
      return
    }

    if (!installedDescriptor.manifest.tabs?.length) {
      setSelectedTabId('')
      return
    }

    if (!selectedTabId || !installedDescriptor.manifest.tabs.find((tab) => tab.id === selectedTabId)) {
      setSelectedTabId(installedDescriptor.manifest.tabs[0].id)
    }
  }, [installedDescriptor, selectedTabId])

  const selectedTab = useMemo(() => {
    if (!installedDescriptor || !selectedTabId) {
      return null
    }
    return installedDescriptor.manifest.tabs?.find((tab) => tab.id === selectedTabId) || null
  }, [installedDescriptor, selectedTabId])

  const previewComponent = useMemo(() => {
    if (!loadedPlugin || !selectedTab) {
      return null
    }
    return loadedPlugin.instance.getComponent(selectedTab.component)
  }, [loadedPlugin, selectedTab])

  const handleReload = async () => {
    if (!pluginId) {
      return
    }
    try {
      await pluginManager.reloadPlugin(pluginId)
      const refreshed = pluginManager.getLoadedPlugins().find((plugin) => plugin.manifest.id === pluginId) || null
      setLoadedPlugin(refreshed)
      toast.success('Plugin reloaded')
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : 'Failed to reload plugin')
    }
  }

  const openManifest = () => {
    if (installedDescriptor) {
      window.open(`${installedDescriptor.baseUrl}/manifest.json`, '_blank', 'noopener,noreferrer')
    }
  }

  const handleBack = () => {
    navigate(-1)
  }

  if (loading) {
    return (
      <div className='flex h-full items-center justify-center bg-slate-950 text-slate-200'>
        <div className='space-y-2 text-center'>
          <div className='text-lg font-semibold'>Loading plugin workbench…</div>
          <div className='text-sm text-slate-400'>Preparing runtime context</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='flex h-full items-center justify-center bg-slate-950 text-slate-200 px-6'>
        <div className='max-w-lg space-y-4 text-center'>
          <div className='text-xl font-semibold text-red-200'>Oops! {error}</div>
          <p className='text-sm text-slate-400'>Use the Extension Center to install or configure the plugin, then return to the workbench.</p>
          <div className='flex justify-center gap-3'>
            <button
              className='rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800'
              onClick={() => navigate('/extensions')}
            >
              Open Extension Center
            </button>
            <button
              className='rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800'
              onClick={handleBack}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!installedDescriptor) {
    return null
  }

  return (
    <div className='min-h-screen bg-slate-950 text-slate-200'>
      <header className='border-b border-slate-800 bg-slate-900/70 px-8 py-6'>
        <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
          <div className='space-y-2'>
            <div className='text-xs uppercase tracking-wide text-slate-400'>Plugin Workbench</div>
            <h1 className='text-3xl font-semibold text-white flex items-center gap-3'>
              <span className='text-4xl'>🧪</span>
              {installedDescriptor.manifest.name}
            </h1>
            <div className='text-sm text-slate-400'>v{installedDescriptor.manifest.version} · {installedDescriptor.manifest.author || 'Unknown author'}</div>
          </div>
          <div className='flex flex-wrap gap-3'>
            <button
              className='rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800'
              onClick={handleBack}
            >
              Back
            </button>
            <button
              className='rounded-lg border border-blue-500/60 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-200 hover:bg-blue-500/20'
              onClick={handleReload}
            >
              Reload Plugin
            </button>
            <button
              className='rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800'
              onClick={openManifest}
            >
              View Manifest
            </button>
            <button
              className='rounded-lg border border-emerald-500/60 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-200 hover:bg-emerald-500/20'
              onClick={() => navigate('/extensions')}
            >
              Manage Plugins
            </button>
          </div>
        </div>
      </header>

      <main className='mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[2fr,1fr]'>
        <section className='space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6'>
          <div className='flex items-center justify-between'>
            <h2 className='text-xl font-semibold text-white'>Live Preview</h2>
            <div className='flex items-center gap-2 text-sm text-slate-400'>
              <span>Tab</span>
              <select
                className='rounded-md border border-slate-700 bg-slate-950 px-3 py-1 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500'
                value={selectedTabId}
                onChange={(event) => setSelectedTabId(event.target.value)}
              >
                {(installedDescriptor.manifest.tabs || []).map((tab) => (
                  <option key={tab.id} value={tab.id}>
                    {tab.label || tab.id}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!selectedTab && (
            <div className='rounded-lg border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-300'>This plugin does not define any tabs. Update the manifest to declare at least one tab to preview UI components.</div>
          )}

          {selectedTab && previewComponent ? (
            <div className='rounded-xl border border-slate-800 bg-slate-950/80 p-5'>
              <React.Suspense fallback={<div className='p-4 text-sm text-slate-300'>Loading plugin component…</div>}>
                {React.createElement(previewComponent)}
              </React.Suspense>
            </div>
          ) : selectedTab ? (
            <div className='rounded-lg border border-amber-500/50 bg-amber-500/10 p-5 text-sm text-amber-100'>
              Component <code className='bg-slate-900/80 px-1 py-0.5 rounded'>{selectedTab.component}</code> is not exported by the plugin. Update the plugin class to return it from <code>getComponent()</code>.
            </div>
          ) : null}
        </section>

        <aside className='space-y-4'>
          <section className='rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3'>
            <h2 className='text-lg font-semibold text-white'>Developer Notes</h2>
            <p className='text-sm text-slate-300 leading-relaxed'>Modify plugin code in <code className='rounded bg-slate-800 px-2 py-1'>plugins/{installedDescriptor.id}/</code>. Update the manifest or component files and click “Reload Plugin” to see changes instantly.</p>
            <ul className='space-y-2 text-sm text-slate-300'>
              <li>• Runtime bundle URL: <code className='rounded bg-slate-800 px-2 py-1'>{installedDescriptor.baseUrl}</code></li>
              <li>• Entry file: <code className='rounded bg-slate-800 px-2 py-1'>{installedDescriptor.manifest.main}</code></li>
              <li>• Activation: {installedDescriptor.manifest.activationEvents?.join(', ') || 'on demand'}</li>
            </ul>
          </section>

          <section className='rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3'>
            <h2 className='text-lg font-semibold text-white'>Tab Details</h2>
            <div className='space-y-3'>
              {(installedDescriptor.manifest.tabs || []).map((tab) => (
                <div key={tab.id} className='rounded-lg border border-slate-800 bg-slate-950/70 p-4 space-y-1'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium text-slate-200'>{tab.label || tab.id}</span>
                    <span className='text-xs uppercase tracking-wide text-slate-500'>#{tab.id}</span>
                  </div>
                  <div className='text-xs text-slate-400'>Component: {tab.component}</div>
                  <div className='text-xs text-slate-400'>Path: {tab.path}</div>
                  {typeof tab.position !== 'undefined' && (
                    <div className='text-xs text-slate-400'>Position: {tab.position}</div>
                  )}
                </div>
              ))}
              {(installedDescriptor.manifest.tabs || []).length === 0 && (
                <div className='rounded-lg border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300'>No tabs configured.</div>
              )}
            </div>
          </section>
        </aside>
      </main>
    </div>
  )
}

export default PluginWorkbench
