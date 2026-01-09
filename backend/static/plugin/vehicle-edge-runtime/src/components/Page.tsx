// Vehicle Edge Runtime Plugin - Split Layout Component
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const React: any = (globalThis as any).React

import { useVehicleRuntimeState } from '../hooks/useVehicleRuntimeState'
import { useConsoleOutput } from '../hooks/useConsoleOutput'
import { getStatusColor, formatTimestamp } from '../utils/helpers'
import {
  detectPythonDependencies,
  getDefaultDependencies,
  EXAMPLE_TEMPLPS
} from '../utils/dependencyDetector'

// Icon components (using unicode)
const Icons = {
  Rocket: () => '🚀',
  Terminal: () => '💻',
  Play: () => '▶️',
  Stop: () => '⏹️',
  Pause: () => '⏸️',
  Refresh: () => '🔄',
  Trash: () => '🗑️',
  Settings: () => '⚙️',
  Alert: () => '⚠️',
  Check: () => '✅',
  Server: () => '🖥️',
  Package: () => '📦',
  Clock: () => '🕐',
  Wifi: () => '📶',
  WifiOff: () => '📵',
  Loading: () => '⏳',
  Cube: () => '📦',
  Code: () => '💻',
  Download: () => '⬇️',
  Edit: () => '✏️',
  Plus: () => '➕',
  X: () => '✖️',
  Search: () => '🔍',
  ChevronDown: () => '▼',
  ChevronRight: () => '▶',
  Sparkles: () => '✨',
  Brain: () => '🧠'
}

interface PageProps {
  data?: any
  config?: any
  api?: any
}

// Default service URLs
const DEFAULT_RUNTIME_URL = 'ws://localhost:3002/runtime'  // Vehicle Runtime is local to edge device
const DEFAULT_KIT_MANAGER_URL = 'https://kit.digitalauto.tech'

// Example templates dropdown options
const TEMPLATE_OPTIONS = [
  { id: 'velocitas', label: 'Velocitas SDK: Set Lights', icon: '🚗', defaultId: 'velocitas-set-lights', defaultName: 'Velocitas Set Lights' },
  { id: 'velocitasReadSpeed', label: 'Velocitas SDK: Read Lights', icon: '📊', defaultId: 'velocitas-read-lights', defaultName: 'Velocitas Read Lights' },
  { id: 'kuksaSetValue', label: 'KUKSA Client: Set Speed', icon: '📡', defaultId: 'kuksa-set-speed', defaultName: 'KUKSA Set Speed' },
  { id: 'kuksaPoll', label: 'KUKSA Client: Read Speed', icon: '📖', defaultId: 'kuksa-read-speed', defaultName: 'KUKSA Read Speed' },
  { id: 'simple', label: 'Simple: Loop Example', icon: '🐍', defaultId: 'simple-loop-app', defaultName: 'Simple Loop App' }
]

export default function Page({ data, config, api }: PageProps) {
  const runtimeUrl = config?.runtimeUrl || DEFAULT_RUNTIME_URL
  const kitManagerUrl = config?.kitManagerUrl || DEFAULT_KIT_MANAGER_URL

  const {
    isRuntimeConnected,
    isKitManagerConnected,
    isKitManagerLoading,
    kitManagerError,
    kits,
    selectedKit,
    vehicleApps,
    isRefreshingApps,
    isDeployingKuksa,
    isDeployingMock,
    connectionError,
    connectRuntime,
    connectKitManager,
    selectKit,
    refreshApps,
    startApp,
    stopApp,
    uninstallApp,
    deployApp,
    deployKuksa,
    deployMock
  } = useVehicleRuntimeState(runtimeUrl, kitManagerUrl)

  // Filter to only show Edge-Runtime devices
  const edgeRuntimeKits = React.useMemo(() => {
    return kits.filter(kit => kit.name.includes('Edge-Runtime'))
  }, [kits])

  // Deployment state
  const [appId, setAppId] = React.useState('my-vehicle-app')
  const [appName, setAppName] = React.useState('My Vehicle App')
  const [appCode, setAppCode] = React.useState(EXAMPLE_TEMPLPS.velocitas)
  const [dependencies, setDependencies] = React.useState<string[]>(getDefaultDependencies())
  const [autoDetectEnabled, setAutoDetectEnabled] = React.useState(true)
  const [detectedDependencies, setDetectedDependencies] = React.useState<string[]>([])
  const [isDeploying, setIsDeploying] = React.useState(false)
  const [showTemplates, setShowTemplates] = React.useState(false)
  const [manualDependency, setManualDependency] = React.useState('')

  // Resizable split state
  const splitContainerRef = React.useRef<HTMLDivElement>(null)
  const [leftPanelWidth, setLeftPanelWidth] = React.useState(66.67) // 2/3 default
  const [isResizing, setIsResizing] = React.useState(false)

  // Handle resize
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !splitContainerRef.current) return

      const containerRect = splitContainerRef.current.getBoundingClientRect()
      const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100

      // Constrain between 20% and 80%
      const constrainedWidth = Math.max(20, Math.min(80, newLeftWidth))
      setLeftPanelWidth(constrainedWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isResizing])

  // Console output
  const { entries: consoleEntries, addEntry, addSuccess, addError, clear: clearConsole } = useConsoleOutput()

  // Initialize connections on mount
  React.useEffect(() => {
    const initializeConnections = async () => {
      addEntry('Connecting to Kit Manager...', 'info')

      // Connect to Kit Manager (required for device discovery)
      await connectKitManager()

      // Connect to Vehicle Runtime (optional - only for deployment)
      // Don't block UI if Runtime is not available
      connectRuntime().catch(error => {
        console.warn('[Plugin] Vehicle Runtime not available:', error)
        addEntry('Vehicle Runtime not available - deployment disabled', 'info')
      })
    }
    initializeConnections()
  }, [connectKitManager, connectRuntime, addEntry])

  // Auto-detect dependencies when code changes
  React.useEffect(() => {
    if (autoDetectEnabled && appCode) {
      const timeoutId = setTimeout(() => {
        const detected = detectPythonDependencies(appCode)
        setDetectedDependencies(detected)
      }, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [appCode, autoDetectEnabled])

  // Combine all dependencies
  const allDependencies = React.useMemo(() => {
    const base = getDefaultDependencies()
    const detected = autoDetectEnabled ? detectedDependencies : []
    const manual = dependencies.filter(d =>
      !base.includes(d) && !detected.includes(d.toLowerCase())
    )
    return [...base, ...detected, ...manual]
  }, [dependencies, detectedDependencies, autoDetectEnabled])

  // Deploy application
  const handleDeploy = async () => {
    if (!selectedKit?.is_online) {
      addError('No online runtime selected')
      return
    }

    if (!appId.trim()) {
      addError('Please enter an application ID')
      return
    }

    if (!appCode.trim()) {
      addError('Please enter application code')
      return
    }

    setIsDeploying(true)
    addEntry(`Starting deployment of Python app to ${selectedKit.name}...`, 'info')

    try {
      const deployedAppId = await deployApp({
        name: appId,
        displayName: appName,
        code: appCode,
        dependencies: allDependencies
      })

      addSuccess(`Application "${appName}" deployed successfully! ID: ${deployedAppId}`)
    } catch (error) {
      addError(`Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsDeploying(false)
    }
  }

  // Load template
  const handleLoadTemplate = (templateId: string) => {
    const template = EXAMPLE_TEMPLPS[templateId as keyof typeof EXAMPLE_TEMPLPS]
    const templateConfig = TEMPLATE_OPTIONS.find(t => t.id === templateId)
    if (template) {
      setAppCode(template)
      // Auto-fill Application ID and Display Name from template config
      if (templateConfig) {
        setAppId(templateConfig.defaultId)
        setAppName(templateConfig.defaultName)
      }
      setShowTemplates(false)
      addEntry(`Loaded template: ${templateConfig?.label}`, 'info')
    }
  }

  // Add manual dependency
  const handleAddDependency = () => {
    if (manualDependency.trim() && !dependencies.includes(manualDependency.trim())) {
      setDependencies([...dependencies, manualDependency.trim()])
      setManualDependency('')
    }
  }

  // Remove dependency
  const handleRemoveDependency = (dep: string) => {
    setDependencies(dependencies.filter(d => d !== dep))
  }

  // Handle kit selection
  const handleKitChange = (kitId: string) => {
    const kit = kits.find(k => k.kit_id === kitId)
    if (kit) {
      selectKit(kit)
      addEntry(`Selected kit: ${kit.name}`, 'info')
      refreshApps()
    }
  }

  // Handle start/stop/uninstall apps
  const handleStartApp = async (appId: string) => {
    try {
      addEntry(`Starting application: ${appId}...`, 'info')
      await startApp(appId)
      addSuccess(`Application ${appId} started`)
    } catch (error) {
      addError(`Failed to start app: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleStopApp = async (appId: string) => {
    try {
      addEntry(`Stopping application: ${appId}...`, 'info')
      await stopApp(appId)
      addSuccess(`Application ${appId} stopped`)
    } catch (error) {
      addError(`Failed to stop app: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleUninstallApp = async (appId: string) => {
    if (!confirm(`Are you sure you want to uninstall "${appId}"?`)) {
      return
    }
    try {
      addEntry(`Uninstalling application: ${appId}...`, 'info')
      await uninstallApp(appId)
      addSuccess(`Application ${appId} uninstalled`)
    } catch (error) {
      addError(`Failed to uninstall app: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Handle deploy KUKSA server
  const handleDeployKuksa = async () => {
    if (!isRuntimeConnected) {
      addError('Runtime not connected')
      return
    }
    try {
      addEntry('Deploying KUKSA Databroker server...', 'info')
      const appId = await deployKuksa()
      addSuccess(`KUKSA Databroker deployed! App ID: ${appId}`)
    } catch (error) {
      addError(`Failed to deploy KUKSA: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Handle deploy Mock service
  const handleDeployMock = async () => {
    if (!isRuntimeConnected) {
      addError('Runtime not connected')
      return
    }
    try {
      addEntry('Deploying Mock service...', 'info')
      const appId = await deployMock('echo-all')
      addSuccess(`Mock service deployed! App ID: ${appId}`)
    } catch (error) {
      addError(`Failed to deploy Mock service: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Styles
  const styles = {
    container: {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh',
      color: '#333',
      display: 'flex',
      flexDirection: 'column' as const
    },
    header: {
      backgroundColor: 'white',
      borderBottom: '1px solid #e5e5e5',
      padding: '12px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    headerTitle: {
      fontSize: '18px',
      fontWeight: '600',
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    connectionStatus: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontSize: '12px'
    },
    statusItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    },
    splitContainer: {
      display: 'flex',
      flex: 1,
      overflow: 'hidden',
      position: 'relative' as const
    },
    leftPanel: (width: number) => ({
      width: `${width}%`,
      minWidth: '20%',
      maxWidth: '80%',
      borderRight: '1px solid #e5e5e5',
      overflowY: 'auto' as const,
      backgroundColor: '#fafafa'
    }),
    resizeHandle: {
      width: '6px',
      cursor: 'col-resize',
      backgroundColor: '#e5e5e5',
      position: 'absolute' as const,
      left: 0,
      top: 0,
      bottom: 0,
      transition: 'background-color 0.15s',
      zIndex: 10,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    resizeHandleHover: {
      backgroundColor: '#0066cc'
    },
    resizeHandleLine: {
      width: '2px',
      height: '40px',
      backgroundColor: '#999',
      borderRadius: '1px'
    },
    rightPanel: (leftWidth: number) => ({
      width: `${100 - leftWidth}%`,
      overflowY: 'auto' as const,
      backgroundColor: '#f5f5f5'
    }),
    panelContent: {
      padding: '16px'
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '8px',
      border: '1px solid #e5e5e5',
      marginBottom: '16px'
    },
    cardHeader: {
      padding: '12px 16px',
      borderBottom: '1px solid #e5e5e5',
      fontWeight: '600',
      fontSize: '14px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    cardBody: {
      padding: '16px'
    },
    label: {
      display: 'block',
      marginBottom: '6px',
      fontSize: '13px',
      fontWeight: '500'
    },
    input: {
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '13px',
      boxSizing: 'border-box' as const
    },
    textarea: {
      width: '100%',
      padding: '12px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '12px',
      fontFamily: 'monospace',
      minHeight: '250px',
      resize: 'vertical' as const,
      boxSizing: 'border-box' as const
    },
    button: {
      padding: '8px 16px',
      border: 'none',
      borderRadius: '4px',
      fontSize: '13px',
      fontWeight: '500',
      cursor: 'pointer',
      backgroundColor: '#0066cc',
      color: 'white'
    },
    buttonDisabled: {
      backgroundColor: '#ccc',
      cursor: 'not-allowed'
    },
    buttonSecondary: {
      backgroundColor: '#6c757d'
    },
    buttonDanger: {
      backgroundColor: '#dc3545'
    },
    buttonSmall: {
      padding: '4px 8px',
      fontSize: '11px'
    },
    badge: (color: string) => ({
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '11px',
      fontWeight: '500',
      backgroundColor: color
    }),
    dependencyItem: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '6px 8px',
      backgroundColor: '#f8f9fa',
      border: '1px solid #e5e5e5',
      borderRadius: '4px',
      marginBottom: '4px',
      fontSize: '12px'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '12px'
    },
    appCard: {
      border: '1px solid #e5e5e5',
      borderRadius: '6px',
      padding: '12px',
      backgroundColor: 'white'
    },
    consoleOutput: {
      backgroundColor: '#1e1e1e',
      color: '#d4d4d4',
      padding: '12px',
      borderRadius: '4px',
      fontFamily: 'monospace',
      fontSize: '11px',
      maxHeight: '300px',
      overflowY: 'auto' as const
    },
    consoleLine: (type: string) => ({
      marginBottom: '2px',
      color: type === 'error' ? '#f48771' : type === 'success' ? '#89d185' : '#d4d4d4'
    }),
    templateDropdown: {
      position: 'relative' as const
    },
    dropdownMenu: {
      position: 'absolute' as const,
      top: '100%',
      left: 0,
      right: 0,
      backgroundColor: 'white',
      border: '1px solid #e5e5e5',
      borderRadius: '4px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      zIndex: 1000,
      maxHeight: '300px',
      overflowY: 'auto' as const
    },
    dropdownItem: {
      padding: '10px 12px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '13px',
      borderBottom: '1px solid #f0f0f0'
    },
    dropdownItemHover: {
      backgroundColor: '#f5f5f5'
    }
  }

  // Render
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>{Icons.Rocket()} Vehicle Edge Runtime</h1>
        <div style={styles.connectionStatus}>
          {/* Kit Manager Status */}
          <div
            style={{
              ...styles.statusItem,
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              backgroundColor: isKitManagerLoading
                ? '#fff3cd'
                : isKitManagerConnected
                ? '#d4edda'
                : kitManagerError
                ? '#f8d7da'
                : '#e2e3e5'
            }}
          >
            {isKitManagerLoading ? (
              <>
                {Icons.Loading()}
                <span>Connecting...</span>
              </>
            ) : isKitManagerConnected ? (
              <>
                {Icons.Wifi()}
                <span>Kit Manager {Icons.Check()}</span>
              </>
            ) : (
              <>
                {Icons.WifiOff()}
                <span>Kit Manager {kitManagerError ? '❌' : '⏸'}</span>
              </>
            )}
            <button
              onClick={connectKitManager}
              style={{
                ...styles.button,
                ...styles.buttonSmall,
                marginLeft: '4px',
                padding: '2px 6px',
                minWidth: '20px'
              }}
              title="Refresh Kit Manager"
            >
              {Icons.Refresh()}
            </button>
          </div>

          {/* Runtime Status */}
          <div
            style={{
              ...styles.statusItem,
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              backgroundColor: isRuntimeConnected ? '#d4edda' : '#e2e3e5'
            }}
          >
            {isRuntimeConnected ? (
              <>
                {Icons.Wifi()}
                <span>Runtime {Icons.Check()}</span>
              </>
            ) : (
              <>
                {Icons.WifiOff()}
                <span>Runtime</span>
              </>
            )}
          </div>

          {/* Device Selector */}
          {isKitManagerConnected && (
            <select
              value={selectedKit?.kit_id || ''}
              onChange={(e) => handleKitChange(e.target.value)}
              style={{
                padding: '6px 10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            >
              {edgeRuntimeKits.length > 0 ? (
                <>
                  <option value="" disabled>Select Edge-Runtime device...</option>
                  {edgeRuntimeKits.map(kit => (
                    <option key={kit.kit_id} value={kit.kit_id}>
                      {kit.name} {kit.is_online ? '🟢' : '🔴'}
                    </option>
                  ))}
                </>
              ) : (
                <option value="" disabled>No edge runtime</option>
              )}
            </select>
          )}
        </div>
      </div>

      {/* Kit Manager Error Banner */}
      {kitManagerError && (
        <div style={{
          backgroundColor: '#f8d7da',
          borderBottom: '1px solid #f5c6cb',
          padding: '10px 20px',
          fontSize: '13px',
          color: '#721c24',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {Icons.Alert()} {kitManagerError}
          <button
            onClick={connectKitManager}
            style={{
              ...styles.button,
              ...styles.buttonSmall,
              marginLeft: 'auto',
              backgroundColor: '#721c24'
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Split Container */}
      <div ref={splitContainerRef} style={styles.splitContainer}>
        {/* Left Panel - Deployment */}
        <div style={styles.leftPanel(leftPanelWidth)}>
          <div style={styles.panelContent}>
            {/* App Details */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <span>{Icons.Cube()} Application Details</span>
              </div>
              <div style={styles.cardBody}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={styles.label}>Application ID *</label>
                  <input
                    type="text"
                    value={appId}
                    onChange={(e) => setAppId(e.target.value)}
                    placeholder="my-vehicle-app"
                    style={styles.input}
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={styles.label}>Display Name</label>
                  <input
                    type="text"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    placeholder="My Vehicle App"
                    style={styles.input}
                  />
                </div>
              </div>
            </div>

            {/* Code Editor */}
            <div style={styles.card}>
              <div style={{ ...styles.cardBody, padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={styles.label}>{Icons.Code()} Application Code (Python)</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <div style={styles.templateDropdown}>
                      <button
                        onClick={() => setShowTemplates(!showTemplates)}
                        style={{ ...styles.button, ...styles.buttonSmall, ...styles.buttonSecondary }}
                      >
                        {Icons.Download()} Templates {Icons.ChevronDown()}
                      </button>
                      {showTemplates && (
                        <div style={styles.dropdownMenu}>
                          {TEMPLATE_OPTIONS.map(t => (
                            <div
                              key={t.id}
                              onClick={() => handleLoadTemplate(t.id)}
                              style={styles.dropdownItem}
                            >
                              <span>{t.icon}</span>
                              <span>{t.label}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <textarea
                  value={appCode}
                  onChange={(e) => setAppCode(e.target.value)}
                  style={styles.textarea}
                />
              </div>
            </div>

            {/* Dependencies */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <span>{Icons.Package()} Dependencies ({allDependencies.length})</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 'normal' }}>
                  <input
                    type="checkbox"
                    checked={autoDetectEnabled}
                    onChange={(e) => setAutoDetectEnabled(e.target.checked)}
                  />
                  Auto-detect
                </label>
              </div>
              <div style={styles.cardBody}>
                {/* Default dependencies */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ ...styles.badge('#e3f2fd'), color: '#1565c0', marginBottom: '8px' }}>
                    {Icons.Check()} Required ({getDefaultDependencies().length})
                  </div>
                  {getDefaultDependencies().map(dep => (
                    <div key={dep} style={{ ...styles.dependencyItem, backgroundColor: '#f0f7ff' }}>
                      <span>{dep}</span>
                      <span style={{ fontSize: '10px', color: '#666' }}>fixed</span>
                    </div>
                  ))}
                </div>

                {/* Detected dependencies */}
                {autoDetectEnabled && detectedDependencies.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ ...styles.badge('#fff3e0'), color: '#e65100', marginBottom: '8px' }}>
                      {Icons.Sparkles()} Detected ({detectedDependencies.length})
                    </div>
                    {detectedDependencies.map(dep => (
                      <div key={dep} style={{ ...styles.dependencyItem, backgroundColor: '#fff8f0' }}>
                        <span>{dep}</span>
                        <span style={{ fontSize: '10px', color: '#666' }}>auto</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Manual dependencies */}
                {dependencies.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ ...styles.badge('#f3e5f5'), color: '#7b1fa2', marginBottom: '8px' }}>
                      {Icons.Edit()} Manual ({dependencies.length})
                    </div>
                    {dependencies.map(dep => (
                      <div key={dep} style={{ ...styles.dependencyItem, backgroundColor: '#faf5ff' }}>
                        <span>{dep}</span>
                        <button
                          onClick={() => handleRemoveDependency(dep)}
                          style={{ ...styles.button, ...styles.buttonSmall, ...styles.buttonDanger, padding: '2px 6px' }}
                        >
                          {Icons.X()}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add dependency */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={manualDependency}
                    onChange={(e) => setManualDependency(e.target.value)}
                    placeholder="Add dependency (e.g., numpy==1.24.0)"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddDependency()}
                    style={{ ...styles.input, flex: 1 }}
                  />
                  <button
                    onClick={handleAddDependency}
                    style={{ ...styles.button, ...styles.buttonSmall }}
                  >
                    {Icons.Plus()} Add
                  </button>
                </div>

                {/* Total summary */}
                <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#e8f5e9', borderRadius: '4px', fontSize: '12px' }}>
                  <strong>Total: {allDependencies.length} packages</strong> will be installed
                </div>
              </div>
            </div>

            {/* Deploy Button */}
            <button
              onClick={handleDeploy}
              disabled={isDeploying || !selectedKit?.is_online || !isRuntimeConnected}
              style={{
                ...styles.button,
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                ...(isDeploying || !selectedKit?.is_online || !isRuntimeConnected ? styles.buttonDisabled : {})
              }}
            >
              {isDeploying ? `${Icons.Loading()} Deploying...` : `${Icons.Rocket()} Deploy Application`}
            </button>

            {/* Console Output */}
            {consoleEntries.length > 0 && (
              <div style={styles.card}>
                <div style={{ ...styles.cardHeader, padding: '8px 12px' }}>
                  <span style={{ fontSize: '13px' }}>{Icons.Terminal()} Console Output</span>
                  <button
                    onClick={clearConsole}
                    style={{ ...styles.button, ...styles.buttonSmall, ...styles.buttonSecondary }}
                  >
                    Clear
                  </button>
                </div>
                <div style={styles.consoleOutput}>
                  {consoleEntries.map(entry => (
                    <div key={entry.id} style={styles.consoleLine(entry.type)}>
                      [{entry.timestamp.toLocaleTimeString()}] {entry.message}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Resize Handle */}
        <div
          onMouseDown={handleMouseDown}
          style={{
            ...styles.resizeHandle,
            left: `${leftPanelWidth}%`,
            ...(isResizing ? styles.resizeHandleHover : {})
          }}
        >
          <div style={styles.resizeHandleLine}></div>
        </div>

        {/* Right Panel - Applications */}
        <div style={styles.rightPanel(leftPanelWidth)}>
          <div style={styles.panelContent}>
            {/* Service Buttons */}
            <div style={{ ...styles.card, marginBottom: '16px' }}>
              <div style={styles.cardHeader}>
                <span>{Icons.Server()} Services</span>
              </div>
              <div style={{ ...styles.cardBody, padding: '12px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleDeployKuksa}
                    disabled={!isRuntimeConnected || isDeployingKuksa}
                    style={{
                      ...styles.button,
                      flex: 1,
                      padding: '8px 12px',
                      fontSize: '12px',
                      ...(isDeployingKuksa || !isRuntimeConnected ? styles.buttonDisabled : {})
                    }}
                  >
                    {isDeployingKuksa ? `${Icons.Loading()} KUKSA...` : `${Icons.Server()} KUKSA`}
                  </button>
                  <button
                    onClick={handleDeployMock}
                    disabled={!isRuntimeConnected || isDeployingMock}
                    style={{
                      ...styles.button,
                      flex: 1,
                      padding: '8px 12px',
                      fontSize: '12px',
                      ...(isDeployingMock || !isRuntimeConnected ? styles.buttonDisabled : {})
                    }}
                  >
                    {isDeployingMock ? `${Icons.Loading()} Mock...` : `${Icons.Brain()} Mock`}
                  </button>
                </div>
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <span>
                  {Icons.Package()} Deployed Applications ({vehicleApps.length})
                  {isRefreshingApps && ` (${Icons.Loading()})`}
                </span>
                <button
                  onClick={refreshApps}
                  style={{ ...styles.button, ...styles.buttonSmall }}
                >
                  {Icons.Refresh()} Refresh
                </button>
              </div>
              <div style={styles.cardBody}>
                {vehicleApps.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
                    {Icons.Package()}
                    <p style={{ marginTop: '12px', marginBottom: '16px' }}>No applications deployed yet.</p>
                    <p style={{ fontSize: '12px', color: '#999' }}>Use the form on the left to deploy your first application.</p>
                  </div>
                ) : (
                  <div style={styles.grid}>
                    {vehicleApps.map(app => (
                      <div key={app.app_id} style={styles.appCard}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', wordBreak: 'break-word' }}>
                              {app.name}
                            </h3>
                            <p style={{ margin: '0 0 2px 0', fontSize: '11px', color: '#666' }}>
                              {app.type}
                            </p>
                            <p style={{ margin: '0 0 4px 0', fontSize: '10px', color: '#999' }}>
                              ID: {app.app_id}
                            </p>
                            <p style={{ margin: 0, fontSize: '10px', color: '#999' }}>
                              {formatTimestamp(app.deploy_time)}
                            </p>
                          </div>
                          <span style={{
                            ...styles.badge(getStatusColor(app.status).split(' ')[1]),
                            color: getStatusColor(app.status).split(' ')[0],
                            flexShrink: 0
                          }}>
                            {app.status}
                          </span>
                        </div>

                        {app.resources && (
                          <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px', padding: '6px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                            <div>CPU: {app.resources.cpu_limit || 'N/A'}</div>
                            <div>Memory: {app.resources.memory_limit || 'N/A'}</div>
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '6px' }}>
                          {app.status === 'stopped' || app.status === 'error' ? (
                            <button
                              onClick={() => handleStartApp(app.app_id)}
                              style={{ ...styles.button, ...styles.buttonSmall, flex: 1 }}
                            >
                              {Icons.Play()} Start
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStopApp(app.app_id)}
                              style={{ ...styles.button, ...styles.buttonSmall, ...styles.buttonSecondary, flex: 1 }}
                            >
                              {Icons.Stop()} Stop
                            </button>
                          )}
                          <button
                            onClick={() => handleUninstallApp(app.app_id)}
                            style={{ ...styles.button, ...styles.buttonSmall, ...styles.buttonDanger }}
                          >
                            {Icons.Trash()}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Connection Error */}
      {connectionError && (
        <div style={{ ...styles.card, margin: '16px', backgroundColor: '#fee', borderColor: '#fcc' }}>
          <div style={{ ...styles.cardBody, color: '#c33', padding: '12px' }}>
            {Icons.Alert()} {connectionError}
          </div>
        </div>
      )}
    </div>
  )
}
