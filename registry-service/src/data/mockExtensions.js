import { nanoid } from 'nanoid'

const now = new Date().toISOString()

const extensions = [
  {
    id: 'weather-insights',
    providerId: 'autowrx-labs',
    name: 'Weather Insights',
    summary: 'Adds live weather widgets for vehicle journeys.',
    description: 'Visualize weather-aware driving recommendations inside AutoWRX.',
    repositoryUrl: 'https://github.com/autowrx/plugins/weather-insights',
    tags: ['ui', 'telemetry'],
    createdAt: now,
    updatedAt: now,
    latestVersion: '1.1.0',
    channel: 'stable',
    versions: [
      {
        version: '1.1.0',
        state: 'released',
        releasedAt: now,
        bundleUrl: 'http://localhost:3200/plugins-runtime/weather-insights/index.js',
        integrity: undefined,
        permissions: ['vehicle:read', 'dom:read'],
        channel: 'stable',
        changelog: 'Improved forecast accuracy and added precipitation alerts.',
        engine: { autowrx: '^2.0.0' },
        manifest: {
          id: 'weather-insights',
          name: 'Weather Insights',
          version: '1.1.0',
          description: 'Visualize weather-aware driving recommendations inside AutoWRX.',
          author: 'AutoWRX Labs',
          main: 'main.js',
          activationEvents: ['onStartup'],
          permissions: ['vehicle:read', 'dom:read'],
          tabs: [
            {
              id: 'weather-dashboard',
              label: 'Weather Insights',
              icon: '☀️',
              component: 'WeatherDashboard',
              path: '/plugin/weather-insights',
              position: 190
            }
          ]
        }
      },
      {
        version: '1.0.0',
        state: 'deprecated',
        releasedAt: now,
        bundleUrl: 'http://localhost:3200/plugins-runtime/weather-insights/index.js',
        integrity: undefined,
        permissions: ['vehicle:read'],
        channel: 'legacy',
        changelog: 'Initial release.',
        engine: { autowrx: '^1.9.0' }
      }
    ]
  }
]

export function listExtensions({ tag, name, provider }) {
  return extensions.filter((ext) => {
    if (tag && !ext.tags.includes(tag)) return false
    if (name && !ext.name.toLowerCase().includes(name.toLowerCase())) return false
    if (provider && ext.providerId !== provider) return false
    return true
  })
}

export function getExtension(extensionId) {
  return extensions.find((ext) => ext.id === extensionId)
}

export function getVersion(extensionId, version) {
  const ext = getExtension(extensionId)
  if (!ext) return null
  if (!version || version === 'latest') {
    return ext.versions.find((v) => v.state === 'released')
  }
  return ext.versions.find((v) => v.version === version)
}

export function addDraftVersion(extensionId, metadata) {
  const ext = getExtension(extensionId)
  if (!ext) {
    throw new Error('Extension not found')
  }
  const version = metadata.version || `0.0.0-${nanoid(6)}`
  const draft = {
    version,
    state: 'draft',
    createdAt: new Date().toISOString(),
    ...metadata
  }
  ext.versions.push(draft)
  ext.updatedAt = draft.createdAt
  return draft
}

export function createExtension(payload) {
  const exists = getExtension(payload.id)
  if (exists) {
    throw new Error('Extension already exists')
  }
  const now = new Date().toISOString()
  const entry = {
    id: payload.id,
    providerId: payload.providerId,
    name: payload.name,
    summary: payload.summary,
    description: payload.description,
    tags: payload.tags || [],
    repositoryUrl: payload.repositoryUrl || null,
    createdAt: now,
    updatedAt: now,
    latestVersion: null,
    versions: []
  }
  extensions.push(entry)
  return entry
}

export function releaseVersion(extensionId, version) {
  const ext = getExtension(extensionId)
  if (!ext) throw new Error('Extension not found')
  const entry = ext.versions.find((v) => v.version === version)
  if (!entry) throw new Error('Version not found')
  entry.state = 'released'
  entry.releasedAt = new Date().toISOString()
  ext.latestVersion = entry.version
  ext.updatedAt = entry.releasedAt
  return entry
}
