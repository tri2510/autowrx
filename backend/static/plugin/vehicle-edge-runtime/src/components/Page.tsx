// Deployment Hub Plugin - Vehicle Edge Runtime Deployment
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const React: any = (globalThis as any).React

import { useVehicleRuntimeState } from '../hooks/useVehicleRuntimeState'
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

// Status info helper for better UI
function getStatusInfo(status: string): { label: string; color: string; bgColor: string; borderColor: string; textColor: string; dotColor: string } {
  switch (status) {
    case 'running':
      return {
        label: 'Running',
        color: '#22c55e',
        bgColor: '#dcfce7',
        borderColor: '#86efac',
        textColor: '#15803d',
        dotColor: '#22c55e'
      }
    case 'stopped':
      return {
        label: 'Stopped',
        color: '#6b7280',
        bgColor: '#f3f4f6',
        borderColor: '#d1d5db',
        textColor: '#374151',
        dotColor: '#6b7280'
      }
    case 'error':
      return {
        label: 'Error',
        color: '#ef4444',
        bgColor: '#fee2e2',
        borderColor: '#fca5a5',
        textColor: '#b91c1c',
        dotColor: '#ef4444'
      }
    case 'starting':
      return {
        label: 'Starting',
        color: '#3b82f6',
        bgColor: '#dbeafe',
        borderColor: '#93c5fd',
        textColor: '#1d4ed8',
        dotColor: '#3b82f6'
      }
    case 'paused':
      return {
        label: 'Paused',
        color: '#f59e0b',
        bgColor: '#fef3c7',
        borderColor: '#fcd34d',
        textColor: '#b45309',
        dotColor: '#f59e0b'
      }
    default:
      return {
        label: status || 'Unknown',
        color: '#6b7280',
        bgColor: '#f3f4f6',
        borderColor: '#d1d5db',
        textColor: '#374151',
        dotColor: '#6b7280'
      }
  }
}

interface PageProps {
  data?: any
  config?: any
  api?: any
}

// Default service URLs
const DEFAULT_RUNTIME_URL = 'https://kit.digitalauto.tech'  // Kit Manager Socket.IO
const DEFAULT_KIT_MANAGER_URL = 'https://kit.digitalauto.tech'

// Example templates dropdown options
const TEMPLATE_OPTIONS = [
  { id: 'velocitas', label: 'Velocitas SDK: Set Lights', icon: '🚗', defaultId: 'velocitas-set-lights', defaultName: 'Velocitas Set Lights' },
  { id: 'velocitasReadSpeed', label: 'Velocitas SDK: Read Lights', icon: '📊', defaultId: 'velocitas-read-lights', defaultName: 'Velocitas Read Lights' },
  { id: 'kuksaSetValue', label: 'KUKSA Client: Set Speed', icon: '📡', defaultId: 'kuksa-set-speed', defaultName: 'KUKSA Set Speed' },
  { id: 'kuksaPoll', label: 'KUKSA Client: Read Speed', icon: '📖', defaultId: 'kuksa-read-speed', defaultName: 'KUKSA Read Speed' },
  { id: 'simple', label: 'Simple: Loop Example', icon: '🐍', defaultId: 'simple-loop-app', defaultName: 'Simple Loop App' }
]

// Function to get code from digital.auto API
async function getCodeFromApi(api: any, data: any, prototypeId: string): Promise<string | null> {
  try {
    console.log('[Deployment Hub] Trying to fetch code from API...')

    // First check if data prop has the content
    if (data) {
      console.log('[Deployment Hub] Data keys:', Object.keys(data))
      if (data.content) return data.content
      if (data.code) return data.code
      if (data.source) return data.source
      if (data.main_script) return data.main_script
      if (data.prototype) {
        if (data.prototype.content) return data.prototype.content
        if (data.prototype.code) return data.prototype.code
      }
    }

    // Try fetching via HTTP
    const url = `/api/prototypes/${prototypeId}`
    console.log('[Deployment Hub] Fetching from:', url)
    const response = await fetch(url)
    if (response.ok) {
      const responseData = await response.json()
      console.log('[Deployment Hub] API response:', responseData)
      if (responseData.content) return responseData.content
      if (responseData.code) return responseData.code
      if (responseData.source) return responseData.source
      if (responseData.main_script) return responseData.main_script
      if (responseData.prototype && responseData.prototype.content) return responseData.prototype.content
    }

    return null
  } catch (error) {
    console.warn('[Deployment Hub] Error fetching from API:', error)
    return null
  }
}

// Function to get code from parent Monaco editor
function getCodeFromParentEditor(pluginTextarea: HTMLTextAreaElement | null): string | null {
  try {
    // Method 1: Try Monaco's global API
    if ((window as any).monaco && (window as any).monaco.editor) {
      const editors = (window as any).monaco.editor.getEditors()
      for (const editor of editors) {
        const code = editor.getValue()
        if (code && code.length > 100) {
          console.log('[Deployment Hub] Loaded code from Monaco editor')
          return code
        }
      }
    }

    // Method 2: Search for .monaco-editor elements and extract from view-lines
    const allMonacoEditors = document.querySelectorAll('.monaco-editor')
    for (const editor of Array.from(allMonacoEditors)) {
      const viewLines = editor.querySelectorAll('.view-line')
      if (viewLines && viewLines.length > 0) {
        const lines: string[] = []
        for (const line of Array.from(viewLines)) {
          const text = line.textContent?.trim() || ''
          if (text) lines.push(text)
        }
        const code = lines.join('\n')
        if (code.length > 100 && (code.includes('import ') || code.includes('def ') || code.includes('class '))) {
          console.log('[Deployment Hub] Loaded code from view-lines')
          return code
        }
      }
    }

    // Method 3: Find all textareas with Python code (excluding plugin's own)
    const allTextareas = document.querySelectorAll('textarea')
    let bestCode: string | null = null
    let bestLength = 0

    for (const textarea of Array.from(allTextareas)) {
      if (textarea === pluginTextarea) continue

      const val = textarea.value
      if (val && val.length > 100) {
        const hasPython = val.includes('import ') || val.includes('def ') || val.includes('class ')
        if (hasPython && val.length > bestLength) {
          bestCode = val
          bestLength = val.length
        }
      }
    }

    if (bestCode) {
      console.log('[Deployment Hub] Loaded code from textarea')
      return bestCode
    }

    return null
  } catch (error) {
    console.warn('[Deployment Hub] Error getting code from parent editor:', error)
    return null
  }
}

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
    appConsoleOutputs,
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
    deployMock,
    subscribeAppConsole,
    unsubscribeAppConsole,
    clearAppConsole
  } = useVehicleRuntimeState(runtimeUrl, kitManagerUrl)

  // Filter to only show Edge-Runtime devices
  const edgeRuntimeKits = React.useMemo(() => {
    return kits.filter(kit => kit.name.includes('Edge-Runtime'))
  }, [kits])

  // Unified console state
  const [selectedConsoleApp, setSelectedConsoleApp] = React.useState<string | null>(null)

  // Ref to track plugin's own textarea so we can exclude it when searching for parent editor
  const pluginTextareaRef = React.useRef<HTMLTextAreaElement>(null)

  // Deployment state
  const [appId, setAppId] = React.useState('my-vehicle-app')
  const [appName, setAppName] = React.useState('My Vehicle App')

  // Try to restore saved code from sessionStorage, or use default template
  const getInitialCode = () => {
    const urlMatch = window.location.href.match(/prototype\/([a-f0-9]+)/)
    const prototypeId = urlMatch ? urlMatch[1] : null
    if (prototypeId) {
      const savedCode = sessionStorage.getItem(`deployment-hub-code-${prototypeId}`)
      if (savedCode) {
        console.log('[Deployment Hub] Restored saved code from sessionStorage')
        return savedCode
      }
    }
    return EXAMPLE_TEMPLPS.velocitas
  }

  const [appCode, setAppCode] = React.useState(getInitialCode)
  const [dependencies, setDependencies] = React.useState<string[]>(getDefaultDependencies())
  const [autoDetectEnabled, setAutoDetectEnabled] = React.useState(true)
  const [detectedDependencies, setDetectedDependencies] = React.useState<string[]>([])
  const [isDeploying, setIsDeploying] = React.useState(false)
  const [showTemplates, setShowTemplates] = React.useState(false)
  const [dropdownPosition, setDropdownPosition] = React.useState<{ top: number; left: number } | null>(null)
  const [manualDependency, setManualDependency] = React.useState('')

  // Ref for templates button to calculate dropdown position
  const templatesButtonRef = React.useRef<HTMLButtonElement>(null)

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

  // Simple logging functions (old console UI removed)
  const logInfo = (msg: string) => console.log('[Plugin]', msg)
  const logSuccess = (msg: string) => console.log('[Plugin] ✅', msg)
  const logError = (msg: string) => console.error('[Plugin] ❌', msg)

  // Initialize connections on mount
  React.useEffect(() => {
    const initializeConnections = async () => {
      logInfo('Connecting to Kit Manager...', 'info')

      // Connect to Kit Manager (required for device discovery)
      await connectKitManager()

      // Connect to Vehicle Runtime (optional - only for deployment)
      // Don't block UI if Runtime is not available
      connectRuntime().catch(error => {
        console.warn('[Plugin] Vehicle Runtime not available:', error)
        logInfo('Vehicle Runtime not available - deployment disabled', 'info')
      })
    }
    initializeConnections()
  }, [connectKitManager, connectRuntime])

  // Load code from API/DOM after mount (only once per browser session)
  React.useEffect(() => {
    const loadCode = async () => {
      // Extract prototype ID from URL
      const urlMatch = window.location.href.match(/prototype\/([a-f0-9]+)/)
      const prototypeId = urlMatch ? urlMatch[1] : null

      console.log('[Deployment Hub] Component mounted, prototypeId:', prototypeId)

      // Check sessionStorage (persists across tab switches, clears on browser close/refresh)
      const sessionKey = `deployment-hub-loaded-${prototypeId}`
      const alreadyLoaded = prototypeId ? sessionStorage.getItem(sessionKey) : null
      console.log('[Deployment Hub] sessionStorage key:', sessionKey, 'alreadyLoaded:', alreadyLoaded)

      if (alreadyLoaded) {
        console.log('[Deployment Hub] Code already loaded this browser session, skipping auto-load')
        return
      }

      console.log('[Deployment Hub] Loading code from API/DOM...')
      if (prototypeId && (api || data)) {
        const code = await getCodeFromApi(api, data, prototypeId)
        if (code && code.length > 100) {
          setAppCode(code)
          sessionStorage.setItem(sessionKey, 'true')
          sessionStorage.setItem(`deployment-hub-code-${prototypeId}`, code) // Save code to restore later
          console.log('[Deployment Hub] Auto-loaded code from API (once per browser session)')
        }
      } else {
        // Fallback to DOM search after delay
        setTimeout(() => {
          const parentCode = getCodeFromParentEditor(pluginTextareaRef.current)
          if (parentCode && parentCode.length > 100) {
            setAppCode(parentCode)
            if (prototypeId) {
              sessionStorage.setItem(sessionKey, 'true')
              sessionStorage.setItem(`deployment-hub-code-${prototypeId}`, parentCode) // Save code to restore later
            }
            console.log('[Deployment Hub] Auto-loaded code from DOM (once per browser session)')
          }
        }, 500)
      }
    }
    loadCode()
  }, [])

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

  // Save code to sessionStorage whenever it changes (to persist across tab switches)
  React.useEffect(() => {
    const urlMatch = window.location.href.match(/prototype\/([a-f0-9]+)/)
    const prototypeId = urlMatch ? urlMatch[1] : null
    if (prototypeId && appCode && appCode !== EXAMPLE_TEMPLPS.velocitas) {
      sessionStorage.setItem(`deployment-hub-code-${prototypeId}`, appCode)
    }
  }, [appCode])

  // Close dropdown when clicking outside
  React.useEffect(() => {
    if (!showTemplates) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      // Check if click is outside both button and dropdown
      if (
        templatesButtonRef.current &&
        !templatesButtonRef.current.contains(target) &&
        !(target as HTMLElement).closest?.('[data-dropdown-menu]')
      ) {
        setShowTemplates(false)
        setDropdownPosition(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showTemplates])

  // Calculate dropdown position when opening
  const handleToggleTemplates = () => {
    if (!showTemplates && templatesButtonRef.current) {
      const rect = templatesButtonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left
      })
    } else {
      setDropdownPosition(null)
    }
    setShowTemplates(!showTemplates)
  }

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
      logError('No online runtime selected')
      return
    }

    if (!appId.trim()) {
      logError('Please enter an application ID')
      return
    }

    if (!appCode.trim()) {
      logError('Please enter application code')
      return
    }

    setIsDeploying(true)
    logInfo(`Starting deployment of Python app to ${selectedKit.name}...`, 'info')

    try {
      const deployedAppId = await deployApp({
        name: appId,
        displayName: appName,
        code: appCode,
        dependencies: allDependencies
      })

      logSuccess(`Application "${appName}" deployed successfully! ID: ${deployedAppId}`)
    } catch (error) {
      logError(`Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
      logInfo(`Loaded template: ${templateConfig?.label}`, 'info')
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
      logInfo(`Selected kit: ${kit.name}`, 'info')
      refreshApps()
    }
  }

  // Handle start/stop/uninstall apps
  const handleStartApp = async (appId: string) => {
    try {
      logInfo(`Starting application: ${appId}...`, 'info')
      await startApp(appId)
      logSuccess(`Application ${appId} started`)
    } catch (error) {
      logError(`Failed to start app: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleStopApp = async (appId: string) => {
    try {
      logInfo(`Stopping application: ${appId}...`, 'info')
      await stopApp(appId)
      logSuccess(`Application ${appId} stopped`)
    } catch (error) {
      logError(`Failed to stop app: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleUninstallApp = async (appId: string) => {
    if (!confirm(`Are you sure you want to uninstall "${appId}"?`)) {
      return
    }
    try {
      logInfo(`Uninstalling application: ${appId}...`, 'info')
      await uninstallApp(appId)
      logSuccess(`Application ${appId} uninstalled`)
    } catch (error) {
      logError(`Failed to uninstall app: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Handle deploy KUKSA server
  const handleDeployKuksa = async () => {
    if (!isRuntimeConnected) {
      logError('Runtime not connected')
      return
    }
    try {
      logInfo('Deploying KUKSA Databroker server...', 'info')
      const appId = await deployKuksa()
      logSuccess(`KUKSA Databroker deployed! App ID: ${appId}`)
    } catch (error) {
      logError(`Failed to deploy KUKSA: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Handle deploy Mock service
  const handleDeployMock = async () => {
    if (!isRuntimeConnected) {
      logError('Runtime not connected')
      return
    }
    try {
      logInfo('Deploying Mock service...', 'info')
      const appId = await deployMock('echo-all')
      logSuccess(`Mock service deployed! App ID: ${appId}`)
    } catch (error) {
      logError(`Failed to deploy Mock service: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
    templateDropdown: {
      position: 'relative' as const
    },
    dropdownMenu: {
      position: 'fixed' as const,
      minWidth: '280px',
      backgroundColor: 'white',
      border: '1px solid #e5e5e5',
      borderRadius: '4px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      zIndex: 99999,
      maxHeight: '300px',
      overflowY: 'auto' as const
    },
    dropdownItem: {
      padding: '10px 12px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10px',
      fontSize: '13px',
      borderBottom: '1px solid #f0f0f0',
      lineHeight: '1.4'
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
        <h1 style={styles.headerTitle}>{Icons.Rocket()} Deployment Hub</h1>
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
                    <button
                      onClick={async () => {
                        // Try API first
                        const urlMatch = window.location.href.match(/prototype\/([a-f0-9]+)/)
                        const prototypeId = urlMatch ? urlMatch[1] : null

                        if (prototypeId && (api || data)) {
                          const code = await getCodeFromApi(api, data, prototypeId)
                          if (code && code !== appCode) {
                            setAppCode(code)
                            console.log('[Deployment Hub] Code updated from API')
                            return
                          }
                        }

                        // Fallback to DOM search
                        const parentCode = getCodeFromParentEditor(pluginTextareaRef.current)
                        if (parentCode && parentCode !== appCode) {
                          setAppCode(parentCode)
                          console.log('[Deployment Hub] Code updated from DOM')
                        } else {
                          console.warn('[Deployment Hub] No code found')
                        }
                      }}
                      style={{ ...styles.button, ...styles.buttonSmall, ...styles.buttonSecondary }}
                      title="Load code from SDV Code editor"
                    >
                      {Icons.Refresh()} From Editor
                    </button>
                    <div style={styles.templateDropdown}>
                      <button
                        ref={templatesButtonRef}
                        onClick={handleToggleTemplates}
                        style={{ ...styles.button, ...styles.buttonSmall, ...styles.buttonSecondary }}
                      >
                        {Icons.Download()} Templates {Icons.ChevronDown()}
                      </button>
                      {showTemplates && dropdownPosition && (
                        <div
                          data-dropdown-menu
                          style={{
                            ...styles.dropdownMenu,
                            top: `${dropdownPosition.top}px`,
                            left: `${dropdownPosition.left}px`
                          }}
                        >
                          {TEMPLATE_OPTIONS.map(t => (
                            <div
                              key={t.id}
                              onClick={() => handleLoadTemplate(t.id)}
                              style={styles.dropdownItem}
                            >
                              <span style={{ fontSize: '18px', minWidth: '24px', textAlign: 'center' }}>{t.icon}</span>
                              <span style={{ flex: 1 }}>{t.label}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <textarea
                  ref={pluginTextareaRef}
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

            {/* Unified Console Panel */}
            <div style={{ ...styles.card, marginBottom: '16px', overflow: 'hidden' }}>
              <div style={styles.cardHeader}>
                <span>
                  {Icons.Terminal()} Console Output
                  {selectedConsoleApp && (
                    <span style={{ marginLeft: '8px', fontSize: '12px', fontWeight: 'normal', color: '#666' }}>
                      → {vehicleApps.find(a => a.app_id === selectedConsoleApp)?.name || selectedConsoleApp}
                    </span>
                  )}
                </span>
                {selectedConsoleApp && (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => clearAppConsole(selectedConsoleApp)}
                      style={{ ...styles.button, ...styles.buttonSmall, padding: '4px 8px', fontSize: '11px' }}
                      title="Clear console output"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => {
                        if (selectedConsoleApp) {
                          unsubscribeAppConsole(selectedConsoleApp)
                        }
                        setSelectedConsoleApp(null)
                      }}
                      style={{ ...styles.button, ...styles.buttonSmall, padding: '4px 8px', fontSize: '11px' }}
                    >
                      {Icons.X()} Close
                    </button>
                  </div>
                )}
              </div>
              <div style={{ ...styles.cardBody, padding: '0', overflow: 'hidden' }}>
                <div style={{ height: '300px', display: 'flex', flexDirection: 'column' }}>
                  {!selectedConsoleApp ? (
                    <div style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#999',
                      textAlign: 'center'
                    }}>
                      {Icons.Terminal()}
                      <p style={{ marginTop: '12px', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                        Click on an application to view its console
                      </p>
                      <p style={{ fontSize: '12px', color: '#aaa' }}>
                        Console output will appear here
                      </p>
                    </div>
                  ) : (
                    <div style={{
                      flex: 1,
                      backgroundColor: '#1e1e1e',
                      overflowY: 'auto',
                      overflowX: 'hidden',
                      padding: '12px',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      lineHeight: '1.4'
                    }}>
                      {(appConsoleOutputs[selectedConsoleApp] || []).length === 0 ? (
                        <div style={{ color: '#666', fontStyle: 'italic', textAlign: 'center', padding: '40px 0' }}>
                          Waiting for console output...
                        </div>
                      ) : (
                        (appConsoleOutputs[selectedConsoleApp] || []).map((line, idx) => (
                          <div
                            key={idx}
                            style={{
                              color: line.stream === 'stderr' ? '#f48771' : '#d4d4d4',
                              marginBottom: '2px',
                              wordBreak: 'break-word',
                              whiteSpace: 'pre-wrap',
                              overflowWrap: 'break-word'
                            }}
                          >
                            <span style={{ color: '#6a9955', fontSize: '10px', flexShrink: 0 }}>
                              [{new Date(line.timestamp).toLocaleTimeString()} {line.stream}]
                            </span>{' '}
                            {line.content}
                          </div>
                        ))
                      )}
                    </div>
                  )}
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
                    {vehicleApps.map(app => {
                      const isRunning = app.status === 'running'
                      const isStopped = app.status === 'stopped' || app.status === 'error'
                      const isStarting = app.status === 'starting'
                      const statusInfo = getStatusInfo(app.status)
                      const isSelected = selectedConsoleApp === app.app_id

                      return (
                        <div
                          key={app.app_id}
                          onClick={() => {
                            if (selectedConsoleApp !== app.app_id) {
                              setSelectedConsoleApp(app.app_id)
                              subscribeAppConsole(app.app_id)
                            }
                          }}
                          style={{
                            ...styles.appCard,
                            borderLeft: `4px solid ${statusInfo.color}`,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            ...(isSelected ? {
                              boxShadow: '0 0 0 2px #3b82f6, 0 4px 12px rgba(59, 130, 246, 0.2)',
                              transform: 'scale(1.01)'
                            } : {}),
                            ':hover': {
                              transform: 'scale(1.01)',
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                            }
                          }}
                          title="Click to view console output"
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '600', wordBreak: 'break-word' }}>
                                {app.name}
                              </h3>
                              <p style={{ margin: '0 0 2px 0', fontSize: '11px', color: '#888' }}>
                                {app.type}
                              </p>
                              <p style={{ margin: '0 0 4px 0', fontSize: '10px', color: '#999' }}>
                                ID: {app.app_id}
                              </p>
                              <p style={{ margin: 0, fontSize: '10px', color: '#999' }}>
                                {formatTimestamp(app.deploy_time)}
                              </p>
                            </div>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 10px',
                              borderRadius: '20px',
                              backgroundColor: statusInfo.bgColor,
                              border: `1px solid ${statusInfo.borderColor}`
                            }}>
                              <span style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: statusInfo.dotColor,
                                animation: isStarting ? 'pulse 1.5s infinite' : 'none'
                              }}></span>
                              <span style={{
                                fontSize: '12px',
                                fontWeight: '600',
                                color: statusInfo.textColor,
                                textTransform: 'capitalize'
                              }}>
                                {statusInfo.label}
                              </span>
                            </div>
                          </div>

                          {app.resources && (
                            <div style={{ fontSize: '11px', color: '#666', marginBottom: '12px', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>CPU: {app.resources.cpu_limit || 'N/A'}</span>
                                <span>Memory: {app.resources.memory_limit || 'N/A'}</span>
                              </div>
                            </div>
                          )}

                          <div style={{ display: 'flex', gap: '8px' }}>
                            {isStopped ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleStartApp(app.app_id)
                                }}
                                style={{
                                  ...styles.button,
                                  flex: 1,
                                  padding: '8px 12px',
                                  backgroundColor: '#22c55e',
                                  fontSize: '13px',
                                  fontWeight: '600'
                                }}
                                title="Start this application"
                              >
                                {Icons.Play()} Start
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleStopApp(app.app_id)
                                }}
                                style={{
                                  ...styles.button,
                                  flex: 1,
                                  padding: '8px 12px',
                                  backgroundColor: isRunning ? '#ef4444' : '#f97316',
                                  fontSize: '13px',
                                  fontWeight: '600'
                                }}
                                title={isRunning ? "Stop this application" : "Stop this application"}
                              >
                                {Icons.Stop()} {isRunning ? 'Stop' : 'Kill'}
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleUninstallApp(app.app_id)
                              }}
                              style={{
                                ...styles.button,
                                ...styles.buttonSmall,
                                padding: '8px 12px',
                                backgroundColor: '#dc2626',
                                fontSize: '13px',
                                fontWeight: '600'
                              }}
                              title="Uninstall this application"
                            >
                              {Icons.Trash()}
                            </button>
                          </div>
                        </div>
                      )
                    })}
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
