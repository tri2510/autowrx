import React, { useEffect, useMemo, useState } from 'react'
import {
  CatalogPluginDescriptor,
  InstalledPluginDescriptor,
  fetchCatalog,
  fetchInstalled,
  installFromCatalog,
  uninstall,
  uploadPlugin
} from '@/services/pluginMarketplace.service'
import { pluginManager } from '@/core/plugin-manager'

const ExtensionCenter: React.FC = () => {
  const [catalog, setCatalog] = useState<CatalogPluginDescriptor[]>([])
  const [installed, setInstalled] = useState<InstalledPluginDescriptor[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const installedIds = useMemo(() => new Set(installed.map((plugin) => plugin.id)), [installed])

  useEffect(() => {
    void bootstrap()
  }, [])

  const bootstrap = async () => {
    try {
      setLoading(true)
      await pluginManager.refreshInstalledPlugins()
      const [catalogData, installedData] = await Promise.all([fetchCatalog(), fetchInstalled()])
      setCatalog(catalogData)
      setInstalled(installedData)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to load extension data')
    } finally {
      setLoading(false)
    }
  }

  const handleInstall = async (pluginId: string) => {
    try {
      setLoading(true)
      setError(null)
      await installFromCatalog(pluginId)
      await pluginManager.refreshInstalledPlugins()
      const updatedInstalled = await fetchInstalled()
      setInstalled(updatedInstalled)
      setSuccessMessage('Plugin installed successfully')
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Installation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleUninstall = async (pluginId: string) => {
    try {
      setLoading(true)
      setError(null)
      await uninstall(pluginId)
      await pluginManager.refreshInstalledPlugins()
      const updatedInstalled = await fetchInstalled()
      setInstalled(updatedInstalled)
      setSuccessMessage('Plugin removed successfully')
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Uninstall failed')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    try {
      setLoading(true)
      setError(null)
      await uploadPlugin(file)
      await pluginManager.refreshInstalledPlugins()
      const updatedInstalled = await fetchInstalled()
      setInstalled(updatedInstalled)
      setSuccessMessage('Plugin uploaded and installed')
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setLoading(false)
      event.target.value = ''
    }
  }

  return (
    <div className='p-8 space-y-8'>
      <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
        <div>
          <h1 className='text-3xl font-semibold text-white flex items-center gap-3'>
            <span className='text-4xl'>🧩</span>
            Extension Center
          </h1>
          <p className='text-slate-300 max-w-3xl mt-2'>
            Discover, install, and manage AutoWRX extensions. Upload a plugin bundle to publish it locally or install curated entries from the shared catalog.
          </p>
        </div>
        <label className='cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-400 transition-colors'>
          <span>Upload Plugin Bundle</span>
          <input type='file' accept='.zip' className='hidden' onChange={handleFileChange} disabled={loading} />
        </label>
      </div>

      {error && (
        <div className='border border-red-500/40 bg-red-500/10 text-red-200 px-4 py-3 rounded-lg'>
          {error}
        </div>
      )}

      {successMessage && (
        <div className='border border-emerald-500/40 bg-emerald-500/10 text-emerald-200 px-4 py-3 rounded-lg'>
          {successMessage}
        </div>
      )}

      <section className='space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-2xl font-semibold text-white flex items-center gap-2'>
            <span>Installed Plugins</span>
            <span className='text-sm font-normal text-slate-400'>({installed.length})</span>
          </h2>
          {loading && <span className='text-xs uppercase tracking-wide text-slate-400 animate-pulse'>Syncing…</span>}
        </div>
        {installed.length === 0 ? (
          <div className='border border-slate-700 bg-slate-900/60 text-slate-300 rounded-lg p-6'>
            No plugins installed yet. Pick one from the catalog or upload a bundle to get started.
          </div>
        ) : (
          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
            {installed.map((plugin) => (
              <article key={plugin.id} className='border border-slate-700 bg-slate-900/80 rounded-lg p-5 space-y-4 shadow-sm'>
                <header className='space-y-1'>
                  <h3 className='text-xl text-white font-semibold'>{plugin.manifest.name}</h3>
                  <p className='text-xs uppercase tracking-wide text-slate-400'>v{plugin.manifest.version}</p>
                </header>
                <p className='text-sm text-slate-300 leading-relaxed'>{plugin.manifest.description}</p>
                <footer className='flex items-center justify-between'>
                  <div className='text-xs text-slate-400'>Installed {plugin.installedAt ? new Date(plugin.installedAt).toLocaleString() : 'just now'}</div>
                  <button
                    className='text-sm px-3 py-1 rounded-md border border-red-500/60 text-red-200 hover:bg-red-500/10 transition-colors'
                    onClick={() => handleUninstall(plugin.id)}
                    disabled={loading}
                  >
                    Remove
                  </button>
                </footer>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className='space-y-4'>
        <h2 className='text-2xl font-semibold text-white flex items-center gap-2'>
          Extension Catalog
          <span className='text-sm font-normal text-slate-400'>({catalog.length})</span>
        </h2>
        {catalog.length === 0 ? (
          <div className='border border-slate-700 bg-slate-900/60 text-slate-300 rounded-lg p-6'>
            Catalog is empty. Upload a plugin bundle to populate it or edit runtime/plugin-registry/catalog.json.
          </div>
        ) : (
          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
            {catalog.map((plugin) => {
              const alreadyInstalled = installedIds.has(plugin.id)
              return (
                <article key={plugin.id} className='border border-slate-700 bg-slate-900/60 rounded-lg p-5 space-y-4 hover:border-slate-500 transition-colors'>
                  <header className='space-y-1'>
                    <h3 className='text-xl text-white font-semibold'>{plugin.name}</h3>
                    <div className='flex items-center gap-2 text-xs text-slate-400 uppercase tracking-wide'>
                      <span>v{plugin.version}</span>
                      {plugin.status && <span className='px-2 py-0.5 rounded-full bg-slate-800 border border-slate-600 text-slate-200'>{plugin.status}</span>}
                    </div>
                  </header>
                  <p className='text-sm text-slate-300 leading-relaxed'>{plugin.summary || plugin.description}</p>
                  <div className='text-xs text-slate-400'>
                    By {plugin.author}
                  </div>
                  <div className='flex flex-wrap gap-2 text-xs text-slate-300'>
                    {(plugin.tags || []).map((tag) => (
                      <span key={tag} className='px-2 py-0.5 rounded-full border border-slate-600 bg-slate-800'>#{tag}</span>
                    ))}
                  </div>
                  <button
                    className='text-sm px-3 py-1 rounded-md border border-emerald-500/60 text-emerald-200 hover:bg-emerald-500/10 transition-colors disabled:opacity-60'
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
    </div>
  )
}

export default ExtensionCenter
