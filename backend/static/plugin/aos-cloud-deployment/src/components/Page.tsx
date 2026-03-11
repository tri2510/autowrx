// eslint-disable-next-line @typescript-eslint/no-explicit-any
const React: any = (globalThis as any).React

import { EditorState } from '@codemirror/state'
import { EditorView, basicSetup } from 'codemirror'
import { cpp } from '@codemirror/lang-cpp'
import { oneDark } from '@codemirror/theme-one-dark'
import { keymap } from '@codemirror/view'
import { defaultKeymap, indentWithTab } from '@codemirror/commands'
import { search, highlightSelectionMatches } from '@codemirror/search'
import { autocompletion } from '@codemirror/autocomplete'
import { linter } from '@codemirror/lint'
import { AosService } from '../services/aos.service'
import { PRESETS } from '../presets'
import type { PluginProps, AosApp } from '../types'

import './Page.css'

// YAML linter (basic)
const yamlLinter = linter((view) => {
  const diagnostics = []
  const text = view.state.doc.toString()

  // Basic YAML validation
  const lines = text.split('\n')
  lines.forEach((line, i) => {
    // Check for tabs (YAML should use spaces)
    if (line.match(/^\t/)) {
      diagnostics.push({
        from: view.state.doc.line(i + 1).from,
        to: view.state.doc.line(i + 1).to,
        severity: 'warning',
        message: 'Use spaces instead of tabs for YAML indentation'
      })
    }
    // Check for invalid key format
    if (line.match(/^\s*[a-z-]+:\s*$/) === null && line.trim() && !line.startsWith('#')) {
      // Skip if it has valid key:value format or is a parent key
    }
  })

  return diagnostics
})

// Custom YAML extension
const yamlExtension = [
  basicSetup,
  keymap.of([defaultKeymap, indentWithTab]),
  search(),
  highlightSelectionMatches(),
  autocompletion(),
  yamlLinter,
  oneDark,
  EditorView.theme({
    '&': { fontSize: '13px' },
    '.cm-scroller': { overflow: 'auto' },
    '.cm-content': { minHeight: '200px' }
  })
]

// C++ extension
const cppExtension = [
  basicSetup,
  keymap.of([defaultKeymap, indentWithTab]),
  search(),
  highlightSelectionMatches(),
  autocompletion(),
  cpp(),
  oneDark,
  EditorView.theme({
    '&': { fontSize: '13px' },
    '.cm-scroller': { overflow: 'auto' },
    '.cm-content': { minHeight: '300px' }
  })
]

export default function Page({ data, config }: PluginProps) {
  const [cppCode, setCppCode] = React.useState(PRESETS.helloAos.cpp)
  const [yamlConfig, setYamlConfig] = React.useState(PRESETS.helloAos.yaml)
  const [appName, setAppName] = React.useState('hello-aos')
  const [isBuilding, setIsBuilding] = React.useState(false)
  const [buildStatus, setBuildStatus] = React.useState<string>('')
  const [buildLogs, setBuildLogs] = React.useState<string[]>([])
  const [deployedApps, setDeployedApps] = React.useState<AosApp[]>([])
  const [connectionStatus, setConnectionStatus] = React.useState<'disconnected' | 'connecting' | 'connected'>('disconnected')

  const cppEditorRef = React.useRef<EditorView | null>(null)
  const yamlEditorRef = React.useRef<EditorView | null>(null)
  const cppContainerRef = React.useRef<HTMLDivElement>(null)
  const yamlContainerRef = React.useRef<HTMLDivElement>(null)
  const aosServiceRef = React.useRef<AosService | null>(null)
  const buildLogsRef = React.useRef<HTMLDivElement>(null)

  // Initialize AOS service
  React.useEffect(() => {
    const serviceUrl = config?.aosServiceUrl || config?.runtimeUrl || 'ws://localhost:3002/runtime'
    const service = new AosService(serviceUrl, 'default-aos-target')
    aosServiceRef.current = service

    // Set up event handlers
    service.onBuildProgress((message: any) => {
      addLog(`[Build] ${message.message || JSON.stringify(message)}`)
      if (message.progress !== undefined) {
        setBuildStatus(`Building... ${message.progress}%`)
      }
    })

    service.onDeployStatus((message: any) => {
      addLog(`[Deploy] ${message.message || JSON.stringify(message)}`)
      if (message.status === 'success') {
        setBuildStatus('Deployment successful!')
        setIsBuilding(false)
        refreshApps()
      } else if (message.status === 'error') {
        setBuildStatus(`Deployment failed: ${message.error || 'Unknown error'}`)
        setIsBuilding(false)
      }
    })

    service.onConsoleOutput((message: any) => {
      addLog(`[${message.appId}] ${message.message}`)
    })

    // Connect to service
    setConnectionStatus('connecting')
    service.connect()
      .then(() => {
        setConnectionStatus('connected')
        refreshApps()
      })
      .catch((err) => {
        console.error('[AOS] Connection failed:', err)
        setConnectionStatus('disconnected')
        addLog(`[Error] Failed to connect: ${err.message}`)
      })

    return () => {
      service.disconnect()
    }
  }, [config?.aosServiceUrl, config?.runtimeUrl])

  // Auto-scroll build logs
  React.useEffect(() => {
    if (buildLogsRef.current) {
      buildLogsRef.current.scrollTop = buildLogsRef.current.scrollHeight
    }
  }, [buildLogs])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setBuildLogs(prev => [...prev, `[${timestamp}] ${message}`])
  }

  const refreshApps = async () => {
    if (!aosServiceRef.current) return

    try {
      const result = await aosServiceRef.current.getDeployedApps()
      setDeployedApps(result.applications)
    } catch (err) {
      console.error('[AOS] Failed to get apps:', err)
    }
  }

  // Initialize C++ editor
  React.useEffect(() => {
    if (!cppContainerRef.current || cppEditorRef.current) return

    const startState = EditorState.create({
      doc: cppCode,
      extensions: [
        ...cppExtension,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            setCppCode(update.state.doc.toString())
          }
        })
      ]
    })

    cppEditorRef.current = new EditorView({
      state: startState,
      parent: cppContainerRef.current
    })

    return () => {
      cppEditorRef.current?.destroy()
    }
  }, [])

  // Initialize YAML editor
  React.useEffect(() => {
    if (!yamlContainerRef.current || yamlEditorRef.current) return

    const startState = EditorState.create({
      doc: yamlConfig,
      extensions: [
        ...yamlExtension,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            setYamlConfig(update.state.doc.toString())
          }
        })
      ]
    })

    yamlEditorRef.current = new EditorView({
      state: startState,
      parent: yamlContainerRef.current
    })

    return () => {
      yamlEditorRef.current?.destroy()
    }
  }, [])

  // Handle build and deploy
  const handleBuildDeploy = async () => {
    if (!aosServiceRef.current || !aosServiceRef.current.isServiceConnected()) {
      addLog('[Error] Not connected to AOS service')
      return
    }

    setIsBuilding(true)
    setBuildStatus('Starting build...')
    setBuildLogs([])
    addLog('[Build] Starting AOS application build...')

    try {
      const response = await aosServiceRef.current.buildAndDeploy({
        name: appName,
        displayName: appName,
        cppCode,
        yamlConfig
      })

      addLog(`[Build] Build started: ${response.appId}`)
      setBuildStatus('Building...')
    } catch (err: any) {
      addLog(`[Error] Build failed: ${err.message}`)
      setBuildStatus(`Build failed: ${err.message}`)
      setIsBuilding(false)
    }
  }

  // Handle start app
  const handleStartApp = async (appId: string) => {
    if (!aosServiceRef.current) return

    addLog(`[Action] Starting app: ${appId}`)
    try {
      await aosServiceRef.current.startApp(appId)
      addLog(`[Action] App started: ${appId}`)
      refreshApps()
    } catch (err: any) {
      addLog(`[Error] Failed to start app: ${err.message}`)
    }
  }

  // Handle stop app
  const handleStopApp = async (appId: string) => {
    if (!aosServiceRef.current) return

    addLog(`[Action] Stopping app: ${appId}`)
    try {
      await aosServiceRef.current.stopApp(appId)
      addLog(`[Action] App stopped: ${appId}`)
      refreshApps()
    } catch (err: any) {
      addLog(`[Error] Failed to stop app: ${err.message}`)
    }
  }

  // Load preset
  const handleLoadPreset = (presetName: string) => {
    const preset = (PRESETS as any)[presetName]
    if (preset) {
      if (cppEditorRef.current) {
        cppEditorRef.current.dispatch({
          changes: {
            from: 0,
            to: cppEditorRef.current.state.doc.length,
            insert: preset.cpp
          }
        })
        setCppCode(preset.cpp)
      }
      if (yamlEditorRef.current) {
        yamlEditorRef.current.dispatch({
          changes: {
            from: 0,
            to: yamlEditorRef.current.state.doc.length,
            insert: preset.yaml
          }
        })
        setYamlConfig(preset.yaml)
      }
      setAppName(presetName)
      addLog(`[Preset] Loaded: ${presetName}`)
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'running': return 'status-badge status-running'
      case 'deployed': return 'status-badge status-deployed'
      case 'building': return 'status-badge status-building'
      case 'stopped': return 'status-badge status-stopped'
      case 'error': return 'status-badge status-error'
      default: return 'status-badge status-unknown'
    }
  }

  if (!data?.prototype?.name) {
    return (
      <div className="aos-page">
        <div className="aos-empty-state">
          <h2>No Prototype Selected</h2>
          <p>Please select a prototype to use the AOS Cloud Deployment plugin.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="aos-page">
      <div className="aos-container">
        {/* Left Panel - Editors */}
        <div className="aos-editor-panel">
          {/* Header */}
          <div className="aos-panel-header">
            <div className="aos-header-title">
              <h2>AOS Cloud Deployment</h2>
              <span className={`aos-connection-status aos-status-${connectionStatus}`}>
                {connectionStatus === 'connected' ? '● Connected' : connectionStatus === 'connecting' ? '● Connecting...' : '○ Disconnected'}
              </span>
            </div>
            <div className="aos-header-controls">
              <select
                value="custom"
                onChange={(e) => e.target.value !== 'custom' && handleLoadPreset(e.target.value)}
                className="aos-select"
              >
                <option value="custom">Custom</option>
                <option value="helloAos">Hello AOS Example</option>
              </select>
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="App Name"
                className="aos-input"
              />
            </div>
          </div>

          {/* C++ Editor */}
          <div className="aos-editor-section">
            <div className="aos-editor-header">
              <span className="aos-editor-title">main.cpp</span>
              <span className="aos-editor-lang">C++</span>
            </div>
            <div ref={cppContainerRef} className="aos-editor-cpp" />
          </div>

          {/* YAML Editor */}
          <div className="aos-editor-section">
            <div className="aos-editor-header">
              <span className="aos-editor-title">config.yaml</span>
              <span className="aos-editor-lang">YAML</span>
            </div>
            <div ref={yamlContainerRef} className="aos-editor-yaml" />
          </div>

          {/* Build Controls */}
          <div className="aos-build-controls">
            <button
              onClick={handleBuildDeploy}
              disabled={isBuilding || connectionStatus !== 'connected'}
              className="aos-button aos-button-primary"
            >
              {isBuilding ? (
                <>
                  <span className="aos-spinner"></span>
                  Building...
                </>
              ) : (
                <>
                  <span>⚡</span>
                  Build & Deploy
                </>
              )}
            </button>
            <button
              onClick={refreshApps}
              disabled={connectionStatus !== 'connected'}
              className="aos-button"
            >
              Refresh Apps
            </button>
          </div>
        </div>

        {/* Right Panel - Status & Logs */}
        <div className="aos-status-panel">
          {/* Build Status */}
          {buildStatus && (
            <div className="aos-status-card">
              <div className="aos-status-header">
                <h3>Build Status</h3>
              </div>
              <div className="aos-status-message">{buildStatus}</div>
            </div>
          )}

          {/* Deployed Apps */}
          <div className="aos-apps-card">
            <div className="aos-status-header">
              <h3>Deployed Applications</h3>
              <button onClick={refreshApps} className="aos-icon-button">↻</button>
            </div>
            <div className="aos-apps-list">
              {deployedApps.length === 0 ? (
                <div className="aos-empty">No applications deployed yet</div>
              ) : (
                deployedApps.map((app) => (
                  <div key={app.app_id} className="aos-app-item">
                    <div className="aos-app-info">
                      <span className="aos-app-name">{app.name}</span>
                      <span className={getStatusBadgeClass(app.status)}>
                        {app.status}
                      </span>
                    </div>
                    <div className="aos-app-actions">
                      {(app.status === 'stopped' || app.status === 'deployed') && (
                        <button
                          onClick={() => handleStartApp(app.app_id)}
                          className="aos-button-xs aos-button-start"
                          title="Start"
                        >
                          ▶
                        </button>
                      )}
                      {app.status === 'running' && (
                        <button
                          onClick={() => handleStopApp(app.app_id)}
                          className="aos-button-xs aos-button-stop"
                          title="Stop"
                        >
                          ■
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Build Logs */}
          <div className="aos-logs-card">
            <div className="aos-status-header">
              <h3>Build Logs</h3>
              <button
                onClick={() => setBuildLogs([])}
                className="aos-icon-button"
                title="Clear logs"
              >
                ✕
              </button>
            </div>
            <div ref={buildLogsRef} className="aos-logs">
              {buildLogs.length === 0 ? (
                <div className="aos-empty">No logs yet</div>
              ) : (
                buildLogs.map((log, i) => (
                  <div key={i} className="aos-log-line">{log}</div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
