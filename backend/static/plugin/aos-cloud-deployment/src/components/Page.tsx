// eslint-disable-next-line @typescript-eslint/no-explicit-any
const React: any = (globalThis as any).React

import { AosService } from '../services/aos.service'
import { PRESETS } from '../presets'
import type { PluginProps, AosApp } from '../types'

// Docker instance type
interface DockerInstance {
  instance_id: string
  name: string
  online: boolean
  last_seen?: string
  type?: string
  suffix?: string
}

export default function Page({ data, config }: PluginProps) {

  const [cppCode, setCppCode] = React.useState(PRESETS.helloAos.cpp)
  const [yamlConfig, setYamlConfig] = React.useState(PRESETS.helloAos.yaml)
  const [appName, setAppName] = React.useState('hello-aos')
  const [isBuilding, setIsBuilding] = React.useState(false)
  const [buildStatus, setBuildStatus] = React.useState<string>('')
  const [buildLogs, setBuildLogs] = React.useState<string[]>([])
  const [deployedApps, setDeployedApps] = React.useState<AosApp[]>([])
  const [connectionStatus, setConnectionStatus] = React.useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
  const [selectedPreset, setSelectedPreset] = React.useState('custom')

  // Docker instances state
  const [dockerInstances, setDockerInstances] = React.useState<DockerInstance[]>([])
  const [filterOnline, setFilterOnline] = React.useState<boolean>(false)
  const [selectedInstance, setSelectedInstance] = React.useState<string>('')
  const [showDockerPanel, setShowDockerPanel] = React.useState<boolean>(true)

  const aosServiceRef = React.useRef<AosService | null>(null)
  const buildLogsRef = React.useRef<HTMLDivElement>(null)
  const pollingIntervalRef = React.useRef<any>(null)

  // Styles
  const styles = {
    page: {
      width: '100%',
      height: '100%',
      backgroundColor: '#f5f5f5',
      display: 'flex',
      flexDirection: 'column' as const,
      overflow: 'hidden' as const,
      fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 20px',
      backgroundColor: 'white',
      borderBottom: '1px solid #e5e7eb'
    },
    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    },
    title: {
      margin: 0,
      fontSize: '18px',
      fontWeight: 600,
      color: '#1f2937'
    },
    statusIndicator: {
      fontSize: '12px',
      padding: '4px 12px',
      borderRadius: '20px',
      fontWeight: 500
    },
    statusConnected: {
      backgroundColor: '#dcfce7',
      color: '#16a34a'
    },
    statusConnecting: {
      backgroundColor: '#fef3c7',
      color: '#b45309'
    },
    statusDisconnected: {
      backgroundColor: '#fee2e2',
      color: '#dc2626'
    },
    headerRight: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    input: {
      padding: '8px 12px',
      border: '1px solid #e5e7eb',
      borderRadius: '6px',
      fontSize: '14px',
      outline: 'none'
    },
    inputSm: {
      padding: '6px 10px',
      fontSize: '13px'
    },
    select: {
      padding: '8px 12px',
      border: '1px solid #e5e7eb',
      borderRadius: '6px',
      fontSize: '14px',
      backgroundColor: 'white',
      cursor: 'pointer'
    },
    content: {
      display: 'flex',
      gap: '16px',
      padding: '16px',
      flex: 1,
      overflow: 'hidden' as const
    },
    editorsColumn: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '16px',
      minWidth: 0,
      overflowY: 'auto' as const
    },
    dockerColumn: {
      width: '280px',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '16px',
      flexShrink: 0
    },
    statusColumn: {
      width: '320px',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '16px',
      flexShrink: 0
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      overflow: 'hidden' as const
    },
    cardHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 16px',
      borderBottom: '1px solid #e5e7eb'
    },
    cardTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      fontWeight: 600,
      color: '#1f2937'
    },
    cardIcon: {
      fontSize: '16px'
    },
    cardBadge: {
      fontSize: '10px',
      padding: '2px 8px',
      background: '#3b82f6',
      color: 'white',
      borderRadius: '10px',
      textTransform: 'uppercase',
      fontWeight: 500
    },
    editorCard: {
      flex: 1,
      minHeight: '280px',
      display: 'flex',
      flexDirection: 'column' as const
    },
    textarea: {
      flex: 1,
      width: '100%',
      padding: '16px',
      fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace",
      fontSize: '13px',
      lineHeight: 1.6,
      border: 'none',
      resize: 'none' as const,
      backgroundColor: '#1e293b',
      color: '#e2e8f0',
      outline: 'none',
      minHeight: '220px'
    },
    actions: {
      display: 'flex',
      gap: '12px'
    },
    button: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      padding: '10px 20px',
      border: '1px solid #e5e7eb',
      borderRadius: '6px',
      backgroundColor: 'white',
      color: '#475569',
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.15s ease'
    },
    buttonPrimary: {
      backgroundColor: '#3b82f6',
      color: 'white',
      border: 'none' as const
    },
    buttonDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed'
    },
    buttonSm: {
      padding: '6px 12px',
      fontSize: '12px'
    },
    spinner: {
      width: '14px',
      height: '14px',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      borderTopColor: 'white',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    },
    statusContent: {
      padding: '12px 16px',
      fontSize: '14px',
      color: '#1f2937'
    },
    appsList: {
      maxHeight: '200px',
      overflowY: 'auto' as const
    },
    appItem: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 16px',
      borderBottom: '1px solid #f3f4f6'
    },
    appInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    appName: {
      fontSize: '14px',
      fontWeight: 500,
      color: '#1f2937'
    },
    statusBadge: {
      fontSize: '10px',
      padding: '2px 8px',
      borderRadius: '10px',
      fontWeight: 500,
      textTransform: 'uppercase'
    },
    statusRunning: {
      backgroundColor: '#dcfce7',
      color: '#16a34a'
    },
    statusDeployed: {
      backgroundColor: '#dbeafe',
      color: '#2563eb'
    },
    statusBuilding: {
      backgroundColor: '#fef3c7',
      color: '#d97706'
    },
    statusStopped: {
      backgroundColor: '#f3f4f6',
      color: '#6b7280'
    },
    statusError: {
      backgroundColor: '#fee2e2',
      color: '#dc2626'
    },
    appActions: {
      display: 'flex',
      gap: '4px'
    },
    actionBtn: {
      width: '28px',
      height: '28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '12px',
      transition: 'all 0.15s ease'
    },
    actionStart: {
      backgroundColor: '#dcfce7',
      color: '#16a34a'
    },
    actionStop: {
      backgroundColor: '#fee2e2',
      color: '#dc2626'
    },
    logsCard: {
      flex: 1,
      minHeight: '180px',
      display: 'flex',
      flexDirection: 'column' as const
    },
    logs: {
      flex: 1,
      padding: '12px 16px',
      backgroundColor: '#1e293b',
      fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
      fontSize: '12px',
      lineHeight: 1.5,
      overflowY: 'auto' as const,
      maxHeight: '180px'
    },
    logEntry: {
      color: '#e2e8f0',
      marginBottom: '2px',
      whiteSpace: 'pre-wrap' as const,
      wordBreak: 'break-all'
    },
    emptyState: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      backgroundColor: 'white',
      margin: '20px',
      borderRadius: '8px'
    },
    emptyIcon: {
      fontSize: '48px',
      marginBottom: '16px'
    },
    emptyText: {
      color: '#6b7280',
      fontSize: '14px'
    },
    empty: {
      color: '#9ca3af',
      textAlign: 'center',
      padding: '20px',
      fontSize: '13px'
    },
    iconButton: {
      width: '28px',
      height: '28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: 'none',
      backgroundColor: 'transparent',
      color: '#9ca3af',
      cursor: 'pointer',
      borderRadius: '4px',
      transition: 'all 0.15s ease'
    },
    // Docker instance styles
    dockerTabs: {
      display: 'flex',
      gap: '4px',
      padding: '8px 16px',
      borderBottom: '1px solid #e5e7eb'
    },
    tab: {
      padding: '6px 12px',
      fontSize: '12px',
      fontWeight: 500,
      border: 'none',
      borderRadius: '6px',
      backgroundColor: 'transparent',
      color: '#6b7280',
      cursor: 'pointer',
      transition: 'all 0.15s ease'
    },
    tabActive: {
      backgroundColor: '#3b82f6',
      color: 'white'
    },
    dockerList: {
      maxHeight: '250px',
      overflowY: 'auto' as const,
      padding: '8px'
    },
    dockerItem: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 12px',
      marginBottom: '4px',
      borderRadius: '6px',
      backgroundColor: '#f9fafb',
      border: '1px solid #e5e7eb',
      cursor: 'pointer',
      transition: 'all 0.15s ease'
    },
    dockerItemSelected: {
      backgroundColor: '#dbeafe',
      borderColor: '#3b82f6'
    },
    dockerItemOnline: {
      borderLeft: '3px solid #16a34a'
    },
    dockerItemOffline: {
      borderLeft: '3px solid #dc2626'
    },
    dockerItemInfo: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '2px'
    },
    dockerItemName: {
      fontSize: '13px',
      fontWeight: 500,
      color: '#1f2937'
    },
    dockerItemId: {
      fontSize: '11px',
      color: '#6b7280',
      fontFamily: 'monospace'
    },
    onlineIndicator: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '11px',
      fontWeight: 500
    },
    onlineDot: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: '#16a34a'
    },
    offlineDot: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: '#dc2626'
    },
    onlineText: {
      color: '#16a34a'
    },
    offlineText: {
      color: '#dc2626'
    },
    summaryCard: {
      padding: '12px 16px',
      backgroundColor: '#f9fafb',
      borderBottom: '1px solid #e5e7eb'
    },
    summaryText: {
      fontSize: '12px',
      color: '#6b7280'
    },
    summaryNumber: {
      fontSize: '18px',
      fontWeight: 600,
      color: '#1f2937'
    }
  }

  // Initialize AOS service
  React.useEffect(() => {
    const serviceUrl = config?.aosServiceUrl || config?.runtimeUrl || 'https://kit.digitalauto.tech'
    const service = new AosService(serviceUrl, selectedInstance || 'default-aos-target')
    aosServiceRef.current = service

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

    // Listen for Docker status updates
    service.onAppStatus((message: any) => {
      handleDockerStatusUpdate(message)
    })

    setConnectionStatus('connecting')
    service.connect()
      .then(() => {
        setConnectionStatus('connected')
        refreshApps()
        // Start polling for Docker instances
        startDockerPolling()
      })
      .catch((err) => {
        console.error('[AOS] Connection failed:', err)
        setConnectionStatus('disconnected')
        addLog(`[Error] Failed to connect: ${err.message}`)
      })

    return () => {
      stopDockerPolling()
      service.disconnect()
    }
  }, [config?.aosServiceUrl, config?.runtimeUrl, selectedInstance])

  React.useEffect(() => {
    if (buildLogsRef.current) {
      buildLogsRef.current.scrollTop = buildLogsRef.current.scrollHeight
    }
  }, [buildLogs])

  // Poll for Docker instances
  const startDockerPolling = () => {
    // Initial fetch
    fetchDockerInstances()

    // Poll every 10 seconds
    pollingIntervalRef.current = setInterval(() => {
      fetchDockerInstances()
    }, 10000)
  }

  const stopDockerPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }

  const fetchDockerInstances = async () => {
    try {
      // Try to fetch from Kit Manager API
      const response = await fetch('http://localhost:3090/listAllKits')
      if (response.ok) {
        const data = await response.json()
        if (data.kits && Array.isArray(data.kits)) {
          const instances: DockerInstance[] = data.kits
            .filter((kit: any) => {
              // Filter for AOS Edge Toolchain instances (AET- prefix) or all instances
              const instanceId = kit.kit_id || kit.instance_id || ''
              return instanceId.startsWith('AET-') || instanceId.startsWith('VEA-') || kit.name?.includes('AOS')
            })
            .map((kit: any) => ({
              instance_id: kit.kit_id || kit.instance_id,
              name: kit.name || 'Unknown',
              online: kit.online !== false, // Assume online unless explicitly false
              last_seen: kit.last_seen,
              type: kit.type,
              suffix: kit.suffix || (kit.kit_id || kit.instance_id || '').split('-')[0]
            }))

          setDockerInstances(instances)
        }
      }
    } catch (err) {
      // If Kit Manager API is not available, use mock data for development
      console.log('[AOS] Kit Manager API not available, using mock data')
      const mockInstances: DockerInstance[] = [
        {
          instance_id: 'AET-' + Math.random().toString(36).substr(2, 8),
          name: 'AOS Edge Toolchain',
          online: true,
          last_seen: new Date().toISOString(),
          suffix: 'AET'
        }
      ]
      setDockerInstances(mockInstances)
    }
  }

  const handleDockerStatusUpdate = (message: any) => {
    if (message.type === 'docker_status' || message.instance_id) {
      setDockerInstances(prev => {
        const updated = [...prev]
        const index = updated.findIndex(d => d.instance_id === message.instance_id)
        if (index >= 0) {
          updated[index] = {
            ...updated[index],
            online: message.online !== undefined ? message.online : updated[index].online,
            last_seen: message.last_seen || new Date().toISOString()
          }
        } else {
          updated.push({
            instance_id: message.instance_id,
            name: message.name || 'AOS Toolchain',
            online: message.online !== false,
            suffix: message.suffix || 'AET'
          })
        }
        return updated
      })
    }
  }

  const handleSelectDocker = (instance: DockerInstance) => {
    setSelectedInstance(instance.instance_id)
    addLog(`[Docker] Selected instance: ${instance.name} (${instance.instance_id})`)

    // Update AOS service target
    if (aosServiceRef.current) {
      aosServiceRef.current.setTargetId(instance.instance_id)
    }
  }

  const getFilteredInstances = () => {
    if (filterOnline) {
      return dockerInstances.filter(d => d.online)
    }
    return dockerInstances
  }

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

  const handlePresetChange = (presetName: string) => {
    setSelectedPreset(presetName)
    const preset = (PRESETS as any)[presetName]
    if (preset) {
      setCppCode(preset.cpp)
      setYamlConfig(preset.yaml)
      setAppName(presetName)
      addLog(`[Preset] Loaded: ${presetName}`)
    }
  }

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'running': return styles.statusRunning
      case 'deployed': return styles.statusDeployed
      case 'building': return styles.statusBuilding
      case 'stopped': return styles.statusStopped
      case 'error': return styles.statusError
      default: return styles.statusStopped
    }
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'running': return 'status-running'
      case 'deployed': return 'status-deployed'
      case 'building': return 'status-building'
      case 'stopped': return 'status-stopped'
      case 'error': return 'status-error'
      default: return 'status-stopped'
    }
  }

  const filteredInstances = getFilteredInstances()
  const onlineCount = dockerInstances.filter(d => d.online).length

  if (!data?.prototype?.name) {
    return React.createElement('div', { style: styles.page },
      React.createElement('div', { style: styles.emptyState },
        React.createElement('div', { style: styles.emptyIcon }, '📦'),
        React.createElement('h2', { style: { margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600, color: '#1f2937' } }, 'No Prototype Selected'),
        React.createElement('p', { style: styles.emptyText }, 'Please select a prototype to use the AOS Cloud Deployment plugin.')
      )
    )
  }

  return React.createElement('div', { style: styles.page },

    // Header
    React.createElement('header', { style: styles.header },
      React.createElement('div', { style: styles.headerLeft },
        React.createElement('h1', { style: styles.title }, 'AOS Cloud Deployment'),
        React.createElement('span', { style: { ...styles.statusIndicator, ...styles[`status${connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}`] } },
          connectionStatus === 'connected' ? '● Connected' : connectionStatus === 'connecting' ? '● Connecting...' : '○ Disconnected'
        ),
        selectedInstance && React.createElement('span', {
          style: {
            fontSize: '12px',
            padding: '4px 10px',
            borderRadius: '4px',
            backgroundColor: '#f3f4f6',
            color: '#6b7280'
          }
        }, `Target: ${selectedInstance.substring(0, 12)}...`)
      ),
      React.createElement('div', { style: styles.headerRight },
        React.createElement('select', {
          value: selectedPreset,
          onChange: (e: any) => handlePresetChange(e.target.value),
          style: styles.select
        },
          React.createElement('option', { value: 'custom' }, 'Custom'),
          React.createElement('option', { value: 'helloAos' }, 'Hello AOS Example')
        ),
        React.createElement('input', {
          type: 'text',
          value: appName,
          onChange: (e: any) => setAppName(e.target.value),
          placeholder: 'App name',
          style: { ...styles.input, ...styles.inputSm }
        })
      )
    ),

    // Main Content
    React.createElement('div', { style: styles.content },

      // Left Column - Docker Instances
      showDockerPanel && React.createElement('div', { style: styles.dockerColumn },
        React.createElement('div', { style: styles.card },
          React.createElement('div', { style: styles.cardHeader },
            React.createElement('div', { style: styles.cardTitle },
              React.createElement('span', { style: styles.cardIcon }, '🐳'),
              'Docker Instances'
            ),
            React.createElement('button', {
              onClick: () => fetchDockerInstances(),
              style: styles.iconButton,
              title: 'Refresh'
            }, '↻')
          ),
          // Summary
          React.createElement('div', { style: styles.summaryCard },
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '16px' } },
              React.createElement('div', null,
                React.createElement('div', { style: styles.summaryText }, 'Online'),
                React.createElement('div', { style: styles.summaryNumber }, onlineCount)
              ),
              React.createElement('div', null,
                React.createElement('div', { style: styles.summaryText }, 'Total'),
                React.createElement('div', { style: styles.summaryNumber }, dockerInstances.length)
              )
            )
          ),
          // Filter Tabs
          React.createElement('div', { style: styles.dockerTabs },
            React.createElement('button', {
              onClick: () => setFilterOnline(false),
              style: { ...styles.tab, ...(!filterOnline ? styles.tabActive : {}) }
            }, 'All Devices'),
            React.createElement('button', {
              onClick: () => setFilterOnline(true),
              style: { ...styles.tab, ...(filterOnline ? styles.tabActive : {}) }
            }, 'Online Only')
          ),
          // Instance List
          React.createElement('div', { style: styles.dockerList },
            filteredInstances.length === 0
              ? React.createElement('div', { style: styles.empty },
                  filterOnline ? 'No online devices' : 'No Docker instances found'
                )
              : filteredInstances.map((instance) =>
                  React.createElement('div', {
                    key: instance.instance_id,
                    onClick: () => handleSelectDocker(instance),
                    style: {
                      ...styles.dockerItem,
                      ...(selectedInstance === instance.instance_id ? styles.dockerItemSelected : {}),
                      ...(instance.online ? styles.dockerItemOnline : styles.dockerItemOffline)
                    }
                  },
                    React.createElement('div', { style: styles.dockerItemInfo },
                      React.createElement('div', { style: styles.dockerItemName }, instance.name),
                      React.createElement('div', { style: styles.dockerItemId }, instance.instance_id)
                    ),
                    React.createElement('div', { style: styles.onlineIndicator },
                      React.createElement('span', {
                        style: instance.online ? styles.onlineDot : styles.offlineDot
                      }),
                      React.createElement('span', {
                        style: instance.online ? styles.onlineText : styles.offlineText
                      }, instance.online ? 'Online' : 'Offline')
                    )
                  )
                )
          )
        )
      ),

      // Middle Column - Code Editors
      React.createElement('div', { style: styles.editorsColumn },

        // C++ Editor Card
        React.createElement('div', { style: { ...styles.card, ...styles.editorCard } },
          React.createElement('div', { style: styles.cardHeader },
            React.createElement('div', { style: styles.cardTitle },
              React.createElement('span', { style: styles.cardIcon }, '📄'),
              React.createElement('span', null, 'main.cpp'),
              React.createElement('span', { style: styles.cardBadge }, 'C++')
            )
          ),
          React.createElement('textarea', {
            style: styles.textarea,
            value: cppCode,
            onChange: (e: any) => setCppCode(e.target.value),
            placeholder: '// Enter your C++ code here...',
            spellCheck: false
          })
        ),

        // YAML Config Card
        React.createElement('div', { style: { ...styles.card, ...styles.editorCard } },
          React.createElement('div', { style: styles.cardHeader },
            React.createElement('div', { style: styles.cardTitle },
              React.createElement('span', { style: styles.cardIcon }, '⚙️'),
              React.createElement('span', null, 'config.yaml'),
              React.createElement('span', { style: styles.cardBadge }, 'YAML')
            )
          ),
          React.createElement('textarea', {
            style: styles.textarea,
            value: yamlConfig,
            onChange: (e: any) => setYamlConfig(e.target.value),
            placeholder: '# Enter your YAML configuration here...',
            spellCheck: false
          })
        ),

        // Action Buttons
        React.createElement('div', { style: styles.actions },
          React.createElement('button', {
            onClick: handleBuildDeploy,
            disabled: isBuilding || connectionStatus !== 'connected',
            style: { ...styles.button, ...styles.buttonPrimary, ...(isBuilding || connectionStatus !== 'connected' ? styles.buttonDisabled : {}) }
          },
            isBuilding
              ? React.createElement(React.Fragment, null,
                  React.createElement('span', { style: styles.spinner }),
                  ' Building...'
                )
              : React.createElement(React.Fragment, null,
                  React.createElement('span', null, '⚡'),
                  ' Build & Deploy'
                )
          ),
          React.createElement('button', {
            onClick: refreshApps,
            disabled: connectionStatus !== 'connected',
            style: { ...styles.button, ...(connectionStatus !== 'connected' ? styles.buttonDisabled : {}) }
          }, 'Refresh Apps')
        )
      ),

      // Right Column - Status & Logs
      React.createElement('div', { style: styles.statusColumn },

        // Status Card
        buildStatus && React.createElement('div', { style: styles.card },
          React.createElement('div', { style: styles.cardHeader },
            React.createElement('div', { style: styles.cardTitle },
              React.createElement('span', { style: styles.cardIcon }, '📊'),
              'Build Status'
            )
          ),
          React.createElement('div', { style: styles.statusContent }, buildStatus)
        ),

        // Deployed Apps Card
        React.createElement('div', { style: styles.card },
          React.createElement('div', { style: styles.cardHeader },
            React.createElement('div', { style: styles.cardTitle },
              React.createElement('span', { style: styles.cardIcon }, '🚀'),
              'Deployed Apps'
            ),
            React.createElement('button', {
              onClick: refreshApps,
              style: styles.iconButton,
              title: 'Refresh'
            }, '↻')
          ),
          React.createElement('div', { style: styles.appsList },
            deployedApps.length === 0
              ? React.createElement('div', { style: styles.empty }, 'No applications deployed')
              : deployedApps.map((app) =>
                  React.createElement('div', {
                    key: app.app_id,
                    style: styles.appItem
                  },
                    React.createElement('div', { style: styles.appInfo },
                      React.createElement('span', { style: styles.appName }, app.name),
                      React.createElement('span', { style: { ...styles.statusBadge, ...getStatusBadgeStyle(app.status) } }, getStatusClass(app.status))
                    ),
                    React.createElement('div', { style: styles.appActions },
                      (app.status === 'stopped' || app.status === 'deployed') &&
                        React.createElement('button', {
                          onClick: () => handleStartApp(app.app_id),
                          style: { ...styles.actionBtn, ...styles.actionStart },
                          title: 'Start'
                        }, '▶'),
                      app.status === 'running' &&
                        React.createElement('button', {
                          onClick: () => handleStopApp(app.app_id),
                          style: { ...styles.actionBtn, ...styles.actionStop },
                          title: 'Stop'
                        }, '■')
                    )
                  )
                )
          )
        ),

        // Build Logs Card
        React.createElement('div', { style: { ...styles.card, ...styles.logsCard } },
          React.createElement('div', { style: styles.cardHeader },
            React.createElement('div', { style: styles.cardTitle },
              React.createElement('span', { style: styles.cardIcon }, '📋'),
              'Build Logs'
            ),
            React.createElement('button', {
              onClick: () => setBuildLogs([]),
              style: styles.iconButton,
              title: 'Clear logs'
            }, '✕')
          ),
          React.createElement('div', { ref: buildLogsRef, style: styles.logs },
            buildLogs.length === 0
              ? React.createElement('div', { style: styles.empty }, 'No logs yet')
              : buildLogs.map((log, i) =>
                  React.createElement('div', {
                    key: i,
                    style: styles.logEntry
                  }, log)
                )
          )
        )
      )
    )
  )
}
